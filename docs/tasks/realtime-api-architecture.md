# Real-time API Architecture: Harry School CRM Mobile Applications
Agent: backend-architect
Date: 2025-08-21

## Executive Summary

This document defines a comprehensive real-time API architecture for Harry School CRM mobile applications (Teacher App and Student App), designed for educational contexts with multi-tenant isolation, offline-first patterns, and cultural sensitivity for the Uzbekistan educational environment. The architecture leverages Supabase Realtime WebSockets for live data synchronization while maintaining robust offline capabilities.

**Key Architectural Decisions:**
- **Offline-First Architecture**: 95% functionality without connectivity using intelligent sync queues
- **Real-time Subscriptions**: Multi-layered WebSocket patterns with automatic reconnection
- **Cultural Integration**: Islamic calendar awareness, prayer time synchronization, multilingual support
- **Performance Optimization**: <200ms update latency, 60%+ bandwidth reduction through intelligent batching
- **Security Framework**: Complete RLS isolation with encrypted WebSocket authentication

---

## Database Schema for Real-time Features

### 1. Real-time Event Management Tables

#### Real-time Events Core Table
```sql
-- Core real-time events with comprehensive metadata
CREATE TABLE realtime_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    
    -- Event identification
    event_type text NOT NULL CHECK (event_type IN ('student_ranking_update', 'attendance_sync', 'task_assignment', 'achievement_earned', 'notification_broadcast', 'teacher_communication', 'lesson_progress', 'system_announcement')),
    event_category text NOT NULL CHECK (event_category IN ('educational', 'administrative', 'communication', 'gamification', 'system')),
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Event payload and metadata
    event_payload jsonb NOT NULL,
    event_metadata jsonb DEFAULT '{}',
    source_table text,
    source_record_id uuid,
    
    -- Target information
    target_user_id uuid REFERENCES auth.users(id),
    target_user_type text CHECK (target_user_type IN ('student', 'teacher', 'admin')),
    target_group_id uuid REFERENCES groups(id),
    broadcast_scope text DEFAULT 'individual' CHECK (broadcast_scope IN ('individual', 'group', 'organization', 'system')),
    
    -- Delivery tracking
    delivery_status text DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'expired')),
    delivery_attempts integer DEFAULT 0,
    delivery_method text[] DEFAULT '{"websocket"}' CHECK (delivery_method <@ '{"websocket", "push_notification", "email", "sms"}'),
    
    -- Cultural context
    cultural_context jsonb DEFAULT '{}',
    islamic_calendar_context jsonb DEFAULT '{}',
    language_preference text DEFAULT 'en' CHECK (language_preference IN ('en', 'uz', 'ru', 'ar')),
    
    -- Scheduling and expiration
    scheduled_for timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    processed_at timestamp with time zone,
    
    -- Audit fields
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    deleted_at timestamp with time zone,
    deleted_by uuid REFERENCES auth.users(id)
);

-- Indexes for performance optimization
CREATE INDEX idx_realtime_events_org_type ON realtime_events(organization_id, event_type);
CREATE INDEX idx_realtime_events_target_user ON realtime_events(target_user_id, delivery_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_realtime_events_scheduled ON realtime_events(scheduled_for) WHERE delivery_status = 'pending' AND deleted_at IS NULL;
CREATE INDEX idx_realtime_events_priority_delivery ON realtime_events(priority DESC, delivery_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_realtime_events_payload_gin ON realtime_events USING GIN (event_payload);
```

#### Real-time Subscriptions Management
```sql
-- WebSocket subscription management for mobile clients
CREATE TABLE realtime_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    
    -- Client identification
    user_id uuid NOT NULL REFERENCES auth.users(id),
    user_type text NOT NULL CHECK (user_type IN ('student', 'teacher', 'admin')),
    device_id text NOT NULL,
    session_id text NOT NULL,
    
    -- Subscription configuration
    subscription_type text NOT NULL CHECK (subscription_type IN ('dashboard', 'attendance', 'tasks', 'notifications', 'rankings', 'feedback', 'presence')),
    subscription_filters jsonb DEFAULT '{}',
    target_entities text[] DEFAULT '{}', -- group_ids, student_ids, etc.
    
    -- Connection management
    channel_name text NOT NULL,
    websocket_id text,
    connection_status text DEFAULT 'connected' CHECK (connection_status IN ('connected', 'disconnected', 'reconnecting', 'failed')),
    last_ping timestamp with time zone DEFAULT now(),
    last_event_received timestamp with time zone,
    
    -- Mobile context
    app_version text,
    platform text CHECK (platform IN ('ios', 'android')),
    network_type text CHECK (network_type IN ('wifi', 'cellular', 'offline')),
    battery_level integer CHECK (battery_level >= 0 AND battery_level <= 100),
    
    -- Cultural and performance settings
    cultural_preferences jsonb DEFAULT '{}',
    performance_mode text DEFAULT 'standard' CHECK (performance_mode IN ('battery_saver', 'standard', 'high_performance')),
    offline_sync_enabled boolean DEFAULT true,
    
    -- Lifecycle management
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + interval '24 hours'),
    last_heartbeat timestamp with time zone DEFAULT now()
);

-- Indexes for subscription management
CREATE INDEX idx_realtime_subs_user_active ON realtime_subscriptions(user_id, connection_status) WHERE expires_at > now();
CREATE INDEX idx_realtime_subs_org_type ON realtime_subscriptions(organization_id, subscription_type);
CREATE INDEX idx_realtime_subs_channel ON realtime_subscriptions(channel_name) WHERE connection_status = 'connected';
CREATE INDEX idx_realtime_subs_heartbeat ON realtime_subscriptions(last_heartbeat) WHERE connection_status = 'connected';
```

#### Offline Sync Queue
```sql
-- Offline event queue with intelligent prioritization
CREATE TABLE offline_sync_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    
    -- Client identification
    user_id uuid NOT NULL REFERENCES auth.users(id),
    device_id text NOT NULL,
    
    -- Event data
    operation_type text NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE', 'BATCH')),
    table_name text NOT NULL,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    
    -- Sync management
    priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10), -- 10 = highest priority
    sync_status text DEFAULT 'pending' CHECK (sync_status IN ('pending', 'processing', 'completed', 'failed', 'conflict')),
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    last_retry_at timestamp with time zone,
    next_retry_at timestamp with time zone,
    
    -- Conflict resolution
    conflict_resolution_strategy text DEFAULT 'teacher_authority' CHECK (conflict_resolution_strategy IN ('client_wins', 'server_wins', 'teacher_authority', 'admin_override', 'merge_fields', 'prompt_user')),
    conflict_detected boolean DEFAULT false,
    conflict_metadata jsonb DEFAULT '{}',
    
    -- Cultural and timing context
    cultural_context jsonb DEFAULT '{}',
    islamic_calendar_date text,
    prayer_time_context text,
    local_timestamp timestamp with time zone NOT NULL,
    timezone text DEFAULT 'Asia/Tashkent',
    
    -- Performance tracking
    operation_duration_ms integer,
    bandwidth_used_bytes integer,
    
    -- Audit fields
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    failed_at timestamp with time zone,
    error_message text
);

-- Indexes for sync queue optimization
CREATE INDEX idx_offline_sync_priority ON offline_sync_queue(priority DESC, next_retry_at) WHERE sync_status = 'pending';
CREATE INDEX idx_offline_sync_user_device ON offline_sync_queue(user_id, device_id, sync_status);
CREATE INDEX idx_offline_sync_conflicts ON offline_sync_queue(conflict_detected, conflict_resolution_strategy) WHERE conflict_detected = true;
CREATE INDEX idx_offline_sync_cultural ON offline_sync_queue(islamic_calendar_date, prayer_time_context) WHERE cultural_context IS NOT NULL;
```

#### Real-time Presence Management
```sql
-- User presence and activity tracking
CREATE TABLE realtime_presence (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    
    -- User identification
    user_id uuid NOT NULL REFERENCES auth.users(id),
    user_type text NOT NULL CHECK (user_type IN ('student', 'teacher', 'admin')),
    user_name text NOT NULL,
    
    -- Presence status
    status text NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy', 'in_class', 'break', 'prayer', 'offline')),
    activity text,
    custom_status text,
    
    -- Location context
    current_screen text,
    current_group_id uuid REFERENCES groups(id),
    current_lesson_id uuid,
    
    -- Device and connection info
    device_id text NOT NULL,
    platform text CHECK (platform IN ('ios', 'android', 'web')),
    app_version text,
    connection_quality text CHECK (connection_quality IN ('excellent', 'good', 'poor', 'offline')),
    
    -- Islamic calendar context
    prayer_time_status text CHECK (prayer_time_status IN ('normal', 'approaching_prayer', 'in_prayer', 'post_prayer')),
    current_prayer text CHECK (current_prayer IN ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha')),
    
    -- Timestamps
    last_seen timestamp with time zone DEFAULT now(),
    session_start timestamp with time zone DEFAULT now(),
    status_changed_at timestamp with time zone DEFAULT now(),
    
    -- Auto-cleanup
    expires_at timestamp with time zone DEFAULT (now() + interval '1 hour'),
    
    UNIQUE(user_id, device_id)
);

-- Indexes for presence queries
CREATE INDEX idx_presence_org_status ON realtime_presence(organization_id, status) WHERE expires_at > now();
CREATE INDEX idx_presence_group_activity ON realtime_presence(current_group_id, activity) WHERE status != 'offline';
CREATE INDEX idx_presence_prayer_context ON realtime_presence(prayer_time_status, current_prayer);
CREATE INDEX idx_presence_cleanup ON realtime_presence(expires_at) WHERE expires_at <= now();
```

#### Push Notification Management
```sql
-- Push notification integration with real-time events
CREATE TABLE push_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    
    -- Notification identification
    realtime_event_id uuid REFERENCES realtime_events(id),
    notification_type text NOT NULL CHECK (notification_type IN ('ranking_update', 'task_assigned', 'achievement_earned', 'attendance_reminder', 'teacher_message', 'system_alert', 'prayer_time')),
    
    -- Target information
    target_user_id uuid NOT NULL REFERENCES auth.users(id),
    target_device_tokens text[] DEFAULT '{}',
    
    -- Notification content
    title_en text NOT NULL,
    title_uz text,
    title_ru text,
    title_ar text,
    body_en text NOT NULL,
    body_uz text,
    body_ru text,
    body_ar text,
    
    -- Cultural adaptation
    cultural_context jsonb DEFAULT '{}',
    islamic_greeting boolean DEFAULT false,
    prayer_time_aware boolean DEFAULT true,
    
    -- Delivery configuration
    priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    delivery_method text[] DEFAULT '{"push"}' CHECK (delivery_method <@ '{"push", "in_app", "email"}'),
    scheduled_for timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + interval '24 hours'),
    
    -- Platform specific
    ios_configuration jsonb DEFAULT '{}',
    android_configuration jsonb DEFAULT '{}',
    
    -- Delivery tracking
    delivery_status text DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'expired')),
    delivery_attempts integer DEFAULT 0,
    max_delivery_attempts integer DEFAULT 3,
    
    -- Engagement tracking
    opened_at timestamp with time zone,
    action_taken text,
    action_taken_at timestamp with time zone,
    
    -- Audit fields
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    sent_at timestamp with time zone,
    failed_at timestamp with time zone,
    error_message text
);

-- Indexes for notification delivery
CREATE INDEX idx_push_notifications_delivery ON push_notifications(delivery_status, scheduled_for) WHERE expires_at > now();
CREATE INDEX idx_push_notifications_target ON push_notifications(target_user_id, notification_type, delivery_status);
CREATE INDEX idx_push_notifications_realtime ON push_notifications(realtime_event_id) WHERE realtime_event_id IS NOT NULL;
CREATE INDEX idx_push_notifications_cultural ON push_notifications(islamic_greeting, prayer_time_aware);
```

### 2. Enhanced Core Tables for Real-time Support

#### Students Table Enhancements
```sql
-- Add real-time specific columns to existing students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_realtime_sync timestamp with time zone DEFAULT now();
ALTER TABLE students ADD COLUMN IF NOT EXISTS realtime_preferences jsonb DEFAULT '{"ranking_updates": true, "task_notifications": true, "achievement_alerts": true}';
ALTER TABLE students ADD COLUMN IF NOT EXISTS offline_data_hash text; -- For conflict detection
ALTER TABLE students ADD COLUMN IF NOT EXISTS sync_version bigint DEFAULT 1; -- For optimistic locking
```

#### Student Rankings Table Enhancements
```sql
-- Add real-time triggers for ranking updates
ALTER TABLE student_rankings ADD COLUMN IF NOT EXISTS last_position_change timestamp with time zone;
ALTER TABLE student_rankings ADD COLUMN IF NOT EXISTS position_change_delta integer DEFAULT 0;
ALTER TABLE student_rankings ADD COLUMN IF NOT EXISTS celebration_triggered boolean DEFAULT false;
ALTER TABLE student_rankings ADD COLUMN IF NOT EXISTS ranking_metadata jsonb DEFAULT '{}';
```

#### Attendance Real-time Extensions
```sql
-- Create comprehensive attendance tracking with real-time support
CREATE TABLE IF NOT EXISTS attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    
    -- Attendance details
    student_id uuid NOT NULL REFERENCES students(id),
    group_id uuid NOT NULL REFERENCES groups(id),
    teacher_id uuid NOT NULL REFERENCES teachers(id),
    
    -- Attendance data
    attendance_date date NOT NULL DEFAULT CURRENT_DATE,
    status text NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused', 'sick', 'emergency', 'early_dismissal', 'partial')),
    check_in_time timestamp with time zone,
    check_out_time timestamp with time zone,
    
    -- Context and notes
    notes text,
    marked_by uuid NOT NULL REFERENCES auth.users(id),
    marking_method text DEFAULT 'manual' CHECK (marking_method IN ('manual', 'qr_code', 'nfc', 'biometric', 'auto')),
    
    -- Real-time sync metadata
    marked_offline boolean DEFAULT false,
    sync_status text DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'conflict', 'failed')),
    offline_timestamp timestamp with time zone,
    sync_priority integer DEFAULT 5,
    
    -- Cultural context
    prayer_time_context text,
    ramadan_consideration boolean DEFAULT false,
    cultural_notes text,
    
    -- Audit fields
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    deleted_at timestamp with time zone,
    deleted_by uuid REFERENCES auth.users(id),
    
    UNIQUE(student_id, group_id, attendance_date)
);

-- Indexes for attendance real-time operations
CREATE INDEX idx_attendance_realtime_sync ON attendance(sync_status, sync_priority DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_attendance_group_date ON attendance(group_id, attendance_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_attendance_offline_pending ON attendance(marked_offline, offline_timestamp) WHERE sync_status = 'pending';
```

---

## Real-time Subscription Patterns

### 1. Student Dashboard Real-time Subscriptions

#### Ranking Updates Subscription
```typescript
interface RankingSubscriptionOptions {
  organizationId: string;
  studentId: string;
  includeClassRanking: boolean;
  includeCelebrations: boolean;
  ageGroup: '10-12' | '13-15' | '16-18';
}

// Channel pattern: "rankings:org_{org_id}:student_{student_id}"
const rankingSubscription = {
  channel: `rankings:org_${organizationId}:student_${studentId}`,
  events: [
    'postgres_changes:student_rankings:UPDATE',
    'postgres_changes:student_achievements:INSERT',
    'broadcast:ranking_celebration',
    'broadcast:level_up_achievement'
  ],
  filters: {
    organizationId: 'eq.{organizationId}',
    studentId: 'eq.{studentId}'
  },
  priority: 'high',
  culturalContext: {
    islamicCalendarAware: true,
    celebrationStyle: 'age_appropriate',
    multilingualSupport: ['en', 'uz', 'ru']
  }
};
```

#### Task Assignment Real-time Pattern
```typescript
interface TaskSubscriptionOptions {
  organizationId: string;
  studentId: string;
  groupIds: string[];
  taskTypes: string[];
  aiGenerated: boolean;
}

// Channel pattern: "tasks:org_{org_id}:student_{student_id}"
const taskSubscription = {
  channel: `tasks:org_${organizationId}:student_${studentId}`,
  events: [
    'postgres_changes:home_tasks:INSERT',
    'postgres_changes:home_tasks:UPDATE',
    'broadcast:ai_task_ready',
    'broadcast:deadline_reminder'
  ],
  filters: {
    organizationId: 'eq.{organizationId}',
    targetStudentId: 'eq.{studentId}'
  },
  offlineBuffer: true,
  syncPriority: 7,
  culturalValidation: {
    islamicValuesCheck: true,
    culturalAppropriatenessLevel: 'high'
  }
};
```

### 2. Teacher App Real-time Subscriptions

#### Attendance Collaboration Pattern
```typescript
interface AttendanceCollaborationOptions {
  organizationId: string;
  teacherId: string;
  groupId: string;
  allowConcurrentMarking: boolean;
  conflictResolution: 'teacher_authority' | 'admin_override';
}

// Channel pattern: "attendance:org_{org_id}:group_{group_id}"
const attendanceCollaboration = {
  channel: `attendance:org_${organizationId}:group_${groupId}`,
  events: [
    'postgres_changes:attendance:INSERT',
    'postgres_changes:attendance:UPDATE',
    'broadcast:marking_in_progress',
    'broadcast:marking_completed',
    'presence:teacher_active'
  ],
  presenceTracking: {
    enabled: true,
    trackActivity: true,
    showOnlineTeachers: true
  },
  conflictResolution: {
    strategy: 'teacher_authority',
    adminOverride: true,
    auditAll: true
  },
  offlineCapability: {
    maxOfflineOperations: 500,
    priorityBoost: 3 // Boost priority when syncing attendance
  }
};
```

#### Group Management Real-time Pattern
```typescript
interface GroupManagementSubscriptionOptions {
  organizationId: string;
  teacherId: string;
  groupIds: string[];
  includeStudentUpdates: boolean;
  includeEnrollmentChanges: boolean;
}

// Channel pattern: "groups:org_{org_id}:teacher_{teacher_id}"
const groupManagementSubscription = {
  channel: `groups:org_${organizationId}:teacher_${teacherId}`,
  events: [
    'postgres_changes:student_group_enrollments:*',
    'postgres_changes:students:UPDATE',
    'postgres_changes:groups:UPDATE',
    'broadcast:enrollment_change',
    'broadcast:student_status_change'
  ],
  filters: {
    organizationId: 'eq.{organizationId}',
    teacherGroupIds: 'in.({groupIds.join(",")})'
  },
  performance: {
    batchUpdates: true,
    debounceMs: 500,
    maxBatchSize: 50
  }
};
```

### 3. System-wide Notification Patterns

#### Broadcast Notification System
```typescript
interface NotificationBroadcastOptions {
  organizationId: string;
  targetRole?: 'student' | 'teacher' | 'admin';
  targetGroups?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  islamicCalendarAware: boolean;
}

// Channel pattern: "notifications:org_{org_id}:role_{role}"
const notificationBroadcast = {
  channel: `notifications:org_${organizationId}:role_${targetRole || 'all'}`,
  events: [
    'postgres_changes:notifications:INSERT',
    'broadcast:system_announcement',
    'broadcast:prayer_time_reminder',
    'broadcast:emergency_alert'
  ],
  deliveryRules: {
    respectPrayerTimes: true,
    queueDuringRamadan: true,
    multilingualDelivery: true,
    parentalNotification: true // For students under 16
  }
};
```

---

## WebSocket Connection Management

### 1. Connection Architecture

#### Multi-layer Connection Strategy
```typescript
interface ConnectionManager {
  // Primary WebSocket connection
  primaryConnection: {
    endpoint: 'wss://{project}.supabase.co/realtime/v1/websocket';
    authentication: 'JWT with refresh';
    heartbeatInterval: 30000; // 30 seconds
    reconnectStrategy: 'exponential_backoff';
    maxReconnectAttempts: 10;
  };
  
  // Fallback REST polling
  fallbackPolling: {
    endpoint: '/api/realtime/poll';
    interval: 60000; // 1 minute when WebSocket fails
    enabled: true;
    priority: 'critical_events_only';
  };
  
  // Offline queue processing
  offlineQueue: {
    storage: 'OP-SQLite';
    maxSize: 1000;
    compressionEnabled: true;
    encryptionEnabled: true;
  };
}
```

#### Connection State Management
```typescript
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed',
  PRAYER_TIME_PAUSE = 'prayer_time_pause'
}

export interface ConnectionStatus {
  state: ConnectionState;
  lastConnected: Date;
  reconnectAttempts: number;
  latency: number;
  bandwidth: {
    upstreamKbps: number;
    downstreamKbps: number;
  };
  culturalContext: {
    currentPrayerTime?: string;
    prayerTimeRemaining?: number;
    ramadanMode: boolean;
  };
}
```

### 2. Authentication for Real-time Connections

#### JWT Token Management
```typescript
interface RealtimeAuthenticationFlow {
  // Initial authentication
  initialAuth: {
    method: 'JWT';
    tokenSource: 'supabase_auth';
    refreshThreshold: 300; // 5 minutes before expiry
    encryptionLevel: 'AES-256';
  };
  
  // Token refresh strategy
  tokenRefresh: {
    automatic: true;
    bufferSeconds: 300;
    failureRetries: 3;
    offlineTokenCaching: true;
  };
  
  // Cultural context injection
  culturalClaims: {
    islamicCalendarDate: string;
    prayerTimeZone: 'Asia/Tashkent';
    culturalPreferences: object;
    familyEngagementLevel: 'high' | 'medium' | 'low';
  };
}
```

#### RLS Policies for Real-time Access
```sql
-- RLS policy for real-time events access
CREATE POLICY "Users can access their organization's real-time events"
    ON realtime_events FOR SELECT
    USING (
        organization_id = auth.jwt() ->> 'organization_id'::text AND
        (
            target_user_id = auth.uid() OR
            target_user_id IS NULL OR
            broadcast_scope IN ('organization', 'system')
        )
    );

-- RLS policy for real-time subscriptions
CREATE POLICY "Users can manage their own subscriptions"
    ON realtime_subscriptions FOR ALL
    USING (
        organization_id = auth.jwt() ->> 'organization_id'::text AND
        user_id = auth.uid()
    );

-- RLS policy for presence data
CREATE POLICY "Users can see presence in their organization"
    ON realtime_presence FOR SELECT
    USING (
        organization_id = auth.jwt() ->> 'organization_id'::text
    );

-- RLS policy for offline sync queue
CREATE POLICY "Users can access their own sync queue"
    ON offline_sync_queue FOR ALL
    USING (
        organization_id = auth.jwt() ->> 'organization_id'::text AND
        user_id = auth.uid()
    );
```

---

## API Endpoints for Real-time Features

### 1. WebSocket Management Endpoints

#### Connection Management
```typescript
// POST /api/realtime/connect
interface ConnectRequest {
  deviceId: string;
  platform: 'ios' | 'android';
  appVersion: string;
  subscriptionTypes: string[];
  culturalPreferences: {
    language: 'en' | 'uz' | 'ru' | 'ar';
    islamicCalendarEnabled: boolean;
    prayerTimeNotifications: boolean;
    familyEngagement: boolean;
  };
  performanceMode: 'battery_saver' | 'standard' | 'high_performance';
}

interface ConnectResponse {
  success: boolean;
  connectionId: string;
  websocketUrl: string;
  subscriptionChannels: string[];
  heartbeatInterval: number;
  culturalContext: {
    currentPrayerTime?: string;
    nextPrayerTime: string;
    ramadanMode: boolean;
    islamicDate: string;
  };
  offlineCapabilities: {
    maxQueueSize: number;
    encryptionEnabled: boolean;
    compressionEnabled: boolean;
  };
}

// POST /api/realtime/disconnect
interface DisconnectRequest {
  connectionId: string;
  reason: 'user_logout' | 'app_background' | 'prayer_time' | 'system_shutdown';
  syncPendingData: boolean;
}
```

#### Subscription Management
```typescript
// POST /api/realtime/subscribe
interface SubscriptionRequest {
  connectionId: string;
  subscriptionType: 'dashboard' | 'attendance' | 'tasks' | 'notifications' | 'rankings' | 'feedback';
  targetEntities: {
    studentIds?: string[];
    groupIds?: string[];
    teacherIds?: string[];
  };
  filters: {
    eventTypes?: string[];
    priority?: string[];
    cultural?: object;
  };
  offlineSettings: {
    bufferEvents: boolean;
    maxBufferSize: number;
    priorityThreshold: number;
  };
}

// DELETE /api/realtime/subscribe/{subscriptionId}
interface UnsubscribeRequest {
  connectionId: string;
  flushBuffer: boolean;
}
```

### 2. Event Broadcasting Endpoints

#### Educational Event Broadcasting
```typescript
// POST /api/realtime/broadcast
interface BroadcastEventRequest {
  eventType: 'ranking_update' | 'task_assignment' | 'achievement_earned' | 'attendance_sync' | 'teacher_message';
  targetScope: 'individual' | 'group' | 'organization';
  targetIds: string[];
  
  payload: {
    title: MultilingualText;
    content: MultilingualText;
    actionData?: object;
    culturalContext?: object;
  };
  
  delivery: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    scheduledFor?: Date;
    expiresAt?: Date;
    methods: ('websocket' | 'push_notification' | 'in_app')[];
  };
  
  cultural: {
    islamicValuesCompliant: boolean;
    prayerTimeAware: boolean;
    multilingualContent: boolean;
    familyNotificationRequired: boolean;
  };
}

interface MultilingualText {
  en: string;
  uz?: string;
  ru?: string;
  ar?: string;
}
```

### 3. Offline Synchronization Endpoints

#### Sync Queue Management
```typescript
// POST /api/realtime/sync/queue
interface QueueSyncRequest {
  deviceId: string;
  operations: OfflineOperation[];
  culturalContext: {
    islamicDate: string;
    prayerTimeContext?: string;
    offlineStartTime: Date;
    offlineEndTime: Date;
  };
  performanceMetrics: {
    operationCount: number;
    totalDataSize: number;
    averageOperationTime: number;
  };
}

interface OfflineOperation {
  id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  tableName: string;
  recordId?: string;
  data: object;
  timestamp: Date;
  priority: number;
  culturalContext?: object;
  conflictResolutionStrategy: string;
}

// GET /api/realtime/sync/status/{deviceId}
interface SyncStatusResponse {
  pendingOperations: number;
  conflictsDetected: number;
  lastSuccessfulSync: Date;
  estimatedSyncTime: number;
  culturalBlockers: {
    prayerTimeConflict: boolean;
    ramadanScheduleAdjustment: boolean;
  };
  networkOptimization: {
    batchingEnabled: boolean;
    compressionRatio: number;
    estimatedBandwidth: number;
  };
}
```

#### Conflict Resolution Endpoints
```typescript
// POST /api/realtime/conflicts/resolve
interface ConflictResolutionRequest {
  conflictId: string;
  resolution: 'client_wins' | 'server_wins' | 'teacher_authority' | 'merge_fields';
  teacherOverride?: boolean;
  adminApproval?: boolean;
  culturalConsiderations: {
    respectsIslamicValues: boolean;
    maintainsTeacherAuthority: boolean;
    preservesFamilyHierarchy: boolean;
  };
}

// GET /api/realtime/conflicts/pending/{userId}
interface PendingConflictsResponse {
  conflicts: ConflictItem[];
  totalCount: number;
  culturalGuidance: {
    islamicValuesSuggestion: string;
    teacherAuthorityRespect: boolean;
    familyEngagementRequired: boolean;
  };
}

interface ConflictItem {
  id: string;
  tableName: string;
  recordId: string;
  conflictType: 'concurrent_update' | 'offline_vs_online' | 'permission_change';
  clientData: object;
  serverData: object;
  conflictFields: string[];
  suggestedResolution: string;
  culturalContext: object;
  teacherInvolved: boolean;
  priority: number;
}
```

---

## Database Triggers and Real-time Policies

### 1. Real-time Event Triggers

#### Student Ranking Update Trigger
```sql
-- Trigger function for student ranking real-time updates
CREATE OR REPLACE FUNCTION trigger_student_ranking_realtime()
RETURNS TRIGGER AS $$
DECLARE
    ranking_change_data jsonb;
    celebration_triggered boolean := false;
    age_group text;
    cultural_context jsonb;
BEGIN
    -- Determine if this is a position change worthy of celebration
    IF TG_OP = 'UPDATE' AND (OLD.current_rank IS DISTINCT FROM NEW.current_rank OR OLD.current_level IS DISTINCT FROM NEW.current_level) THEN
        -- Calculate age group for appropriate celebration
        SELECT CASE 
            WHEN EXTRACT(year FROM age(date_of_birth)) BETWEEN 10 AND 12 THEN '10-12'
            WHEN EXTRACT(year FROM age(date_of_birth)) BETWEEN 13 AND 15 THEN '13-15'
            WHEN EXTRACT(year FROM age(date_of_birth)) BETWEEN 16 AND 18 THEN '16-18'
            ELSE '13-15'
        END INTO age_group
        FROM students 
        WHERE id = NEW.student_id;
        
        -- Determine celebration trigger conditions
        celebration_triggered := (
            NEW.current_rank < OLD.current_rank OR -- Rank improved
            NEW.current_level > OLD.current_level OR -- Level up
            (NEW.total_points - OLD.total_points) >= 100 -- Significant point gain
        );
        
        -- Build cultural context
        cultural_context := jsonb_build_object(
            'islamic_calendar_date', to_char(now() AT TIME ZONE 'Asia/Tashkent', 'YYYY-MM-DD'),
            'prayer_time_context', (
                SELECT prayer_time_status 
                FROM realtime_presence 
                WHERE user_id = NEW.student_id 
                ORDER BY last_seen DESC 
                LIMIT 1
            ),
            'age_appropriate_celebration', age_group,
            'family_notification_required', (age_group = '10-12')
        );
        
        -- Prepare ranking change data
        ranking_change_data := jsonb_build_object(
            'student_id', NEW.student_id,
            'old_rank', OLD.current_rank,
            'new_rank', NEW.current_rank,
            'old_level', OLD.current_level,
            'new_level', NEW.current_level,
            'points_change', NEW.total_points - OLD.total_points,
            'celebration_triggered', celebration_triggered,
            'age_group', age_group,
            'timestamp', extract(epoch from now()) * 1000
        );
        
        -- Insert real-time event for ranking update
        INSERT INTO realtime_events (
            organization_id,
            event_type,
            event_category,
            priority,
            event_payload,
            target_user_id,
            target_user_type,
            cultural_context,
            islamic_calendar_context
        ) VALUES (
            NEW.organization_id,
            'student_ranking_update',
            'gamification',
            CASE WHEN celebration_triggered THEN 'high' ELSE 'medium' END,
            ranking_change_data,
            NEW.student_id,
            'student',
            cultural_context,
            jsonb_build_object(
                'date', to_char(now() AT TIME ZONE 'Asia/Tashkent', 'YYYY-MM-DD'),
                'celebration_appropriate', celebration_triggered
            )
        );
        
        -- Broadcast to real-time channel
        PERFORM pg_notify(
            'realtime:rankings:org_' || NEW.organization_id::text,
            ranking_change_data::text
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on student_rankings table
CREATE TRIGGER student_ranking_realtime_trigger
    AFTER UPDATE ON student_rankings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_student_ranking_realtime();
```

#### Attendance Synchronization Trigger
```sql
-- Trigger function for attendance real-time synchronization
CREATE OR REPLACE FUNCTION trigger_attendance_realtime()
RETURNS TRIGGER AS $$
DECLARE
    attendance_data jsonb;
    group_teachers uuid[];
    cultural_context jsonb;
    prayer_context text;
BEGIN
    -- Get current prayer time context
    SELECT CASE 
        WHEN EXTRACT(hour FROM (now() AT TIME ZONE 'Asia/Tashkent')) BETWEEN 5 AND 6 THEN 'fajr'
        WHEN EXTRACT(hour FROM (now() AT TIME ZONE 'Asia/Tashkent')) BETWEEN 12 AND 13 THEN 'dhuhr'
        WHEN EXTRACT(hour FROM (now() AT TIME ZONE 'Asia/Tashkent')) BETWEEN 15 AND 16 THEN 'asr'
        WHEN EXTRACT(hour FROM (now() AT TIME ZONE 'Asia/Tashkent')) BETWEEN 18 AND 19 THEN 'maghrib'
        WHEN EXTRACT(hour FROM (now() AT TIME ZONE 'Asia/Tashkent')) BETWEEN 20 AND 21 THEN 'isha'
        ELSE 'normal'
    END INTO prayer_context;
    
    -- Build cultural context
    cultural_context := jsonb_build_object(
        'prayer_time_context', prayer_context,
        'ramadan_mode', (EXTRACT(month FROM now()) = 4), -- Approximate Ramadan month
        'islamic_date', to_char(now() AT TIME ZONE 'Asia/Tashkent', 'YYYY-MM-DD'),
        'marking_method', COALESCE(NEW.marking_method, 'manual'),
        'teacher_authority_level', 'high'
    );
    
    -- Get all teachers assigned to this group for broadcast
    SELECT ARRAY_AGG(tga.teacher_id)
    INTO group_teachers
    FROM teacher_group_assignments tga
    WHERE tga.group_id = NEW.group_id 
      AND tga.deleted_at IS NULL
      AND tga.is_active = true;
    
    -- Prepare attendance event data
    attendance_data := jsonb_build_object(
        'attendance_id', NEW.id,
        'student_id', NEW.student_id,
        'group_id', NEW.group_id,
        'teacher_id', NEW.teacher_id,
        'status', NEW.status,
        'attendance_date', NEW.attendance_date,
        'marked_offline', NEW.marked_offline,
        'sync_status', NEW.sync_status,
        'operation', TG_OP,
        'timestamp', extract(epoch from now()) * 1000,
        'cultural_context', cultural_context
    );
    
    -- Insert real-time event for attendance sync
    INSERT INTO realtime_events (
        organization_id,
        event_type,
        event_category,
        priority,
        event_payload,
        target_user_id,
        target_group_id,
        broadcast_scope,
        cultural_context,
        islamic_calendar_context
    ) VALUES (
        NEW.organization_id,
        'attendance_sync',
        'educational',
        CASE WHEN NEW.marked_offline THEN 'high' ELSE 'medium' END,
        attendance_data,
        NEW.student_id,
        NEW.group_id,
        'group',
        cultural_context,
        jsonb_build_object('prayer_aware', prayer_context != 'normal')
    );
    
    -- Broadcast to group attendance channel
    PERFORM pg_notify(
        'realtime:attendance:org_' || NEW.organization_id::text || ':group_' || NEW.group_id::text,
        attendance_data::text
    );
    
    -- Notify all teachers in the group
    FOR i IN 1..array_length(group_teachers, 1) LOOP
        PERFORM pg_notify(
            'realtime:teacher_notifications:' || group_teachers[i]::text,
            jsonb_build_object(
                'type', 'attendance_update',
                'group_id', NEW.group_id,
                'student_id', NEW.student_id,
                'status', NEW.status,
                'cultural_context', cultural_context
            )::text
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on attendance table
CREATE TRIGGER attendance_realtime_trigger
    AFTER INSERT OR UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION trigger_attendance_realtime();
```

#### Achievement and Notification Triggers
```sql
-- Trigger function for achievement real-time notifications
CREATE OR REPLACE FUNCTION trigger_achievement_realtime()
RETURNS TRIGGER AS $$
DECLARE
    achievement_data jsonb;
    student_age integer;
    celebration_style text;
    family_notification boolean := false;
BEGIN
    -- Get student age for age-appropriate celebrations
    SELECT EXTRACT(year FROM age(date_of_birth))
    INTO student_age
    FROM students 
    WHERE id = NEW.student_id;
    
    -- Determine celebration style based on age
    celebration_style := CASE 
        WHEN student_age BETWEEN 10 AND 12 THEN 'animated_celebration'
        WHEN student_age BETWEEN 13 AND 15 THEN 'achievement_badge'
        WHEN student_age BETWEEN 16 AND 18 THEN 'professional_recognition'
        ELSE 'standard_notification'
    END;
    
    -- Family notification required for younger students
    family_notification := (student_age < 16);
    
    -- Prepare achievement data
    achievement_data := jsonb_build_object(
        'achievement_id', NEW.achievement_id,
        'student_id', NEW.student_id,
        'coins_awarded', NEW.coins_awarded,
        'bonus_points', NEW.bonus_points_awarded,
        'celebration_style', celebration_style,
        'family_notification', family_notification,
        'timestamp', extract(epoch from now()) * 1000
    );
    
    -- Insert real-time event
    INSERT INTO realtime_events (
        organization_id,
        event_type,
        event_category,
        priority,
        event_payload,
        target_user_id,
        target_user_type,
        cultural_context
    ) VALUES (
        NEW.organization_id,
        'achievement_earned',
        'gamification',
        'high',
        achievement_data,
        NEW.student_id,
        'student',
        jsonb_build_object(
            'celebration_style', celebration_style,
            'family_notification', family_notification,
            'islamic_values_aligned', true
        )
    );
    
    -- Broadcast achievement event
    PERFORM pg_notify(
        'realtime:achievements:org_' || NEW.organization_id::text || ':student_' || NEW.student_id::text,
        achievement_data::text
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on student_achievements table
CREATE TRIGGER achievement_realtime_trigger
    AFTER INSERT ON student_achievements
    FOR EACH ROW
    EXECUTE FUNCTION trigger_achievement_realtime();
```

### 2. System Notification Triggers

#### Prayer Time Awareness Trigger
```sql
-- Function to handle prayer time notifications
CREATE OR REPLACE FUNCTION schedule_prayer_time_notifications()
RETURNS void AS $$
DECLARE
    current_time timestamp with time zone := now() AT TIME ZONE 'Asia/Tashkent';
    prayer_times jsonb;
    notification_data jsonb;
    active_users record;
BEGIN
    -- Calculate prayer times for today (simplified example)
    prayer_times := jsonb_build_object(
        'fajr', '05:30',
        'dhuhr', '12:30',
        'asr', '15:45',
        'maghrib', '18:15',
        'isha', '20:00'
    );
    
    -- Create notifications for users 10 minutes before each prayer
    FOR active_users IN 
        SELECT DISTINCT user_id, organization_id 
        FROM realtime_presence 
        WHERE status != 'offline' 
          AND prayer_time_status IS NULL 
          AND expires_at > now()
    LOOP
        notification_data := jsonb_build_object(
            'type', 'prayer_time_reminder',
            'prayer_times', prayer_times,
            'cultural_greeting', 'As-salaam alaikum',
            'respect_level', 'high'
        );
        
        INSERT INTO realtime_events (
            organization_id,
            event_type,
            event_category,
            priority,
            event_payload,
            target_user_id,
            broadcast_scope,
            cultural_context,
            scheduled_for
        ) VALUES (
            active_users.organization_id,
            'system_announcement',
            'system',
            'medium',
            notification_data,
            active_users.user_id,
            'individual',
            jsonb_build_object('islamic_calendar_aware', true),
            current_time + interval '10 minutes'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule prayer time notifications (called by pg_cron)
SELECT cron.schedule('prayer-time-notifications', '*/10 * * * *', 'SELECT schedule_prayer_time_notifications();');
```

---

## Data Synchronization Strategies

### 1. Offline-First Sync Patterns

#### Intelligent Sync Prioritization
```typescript
interface SyncPriorityMatrix {
  // Priority levels (1-10, 10 being highest)
  priorities: {
    attendance_marking: 10; // Critical for teacher workflows
    student_safety_alerts: 10; // Emergency notifications
    achievement_celebrations: 8; // High engagement value
    task_submissions: 7; // Educational progress
    ranking_updates: 6; // Motivational updates
    feedback_entries: 5; // Teacher-student communication
    general_notifications: 3; // System messages
    profile_updates: 2; // Non-critical data
  };
  
  // Cultural priority adjustments
  culturalBoosts: {
    prayer_time_events: +3; // Boost Islamic calendar events
    ramadan_schedule: +2; // Special consideration during Ramadan
    family_communication: +2; // Respect for family hierarchy
    teacher_authority: +3; // Respect for educational authority
  };
  
  // Performance mode adjustments
  batteryOptimization: {
    battery_saver: -1; // Reduce all priorities by 1
    standard: 0; // No adjustment
    high_performance: +1; // Increase all priorities by 1
  };
}
```

#### Delta Sync Strategy
```typescript
interface DeltaSyncConfiguration {
  // Tables with delta sync support
  deltaTables: {
    students: {
      timestampColumn: 'updated_at';
      hashColumn: 'offline_data_hash';
      versionColumn: 'sync_version';
      conflictResolution: 'teacher_authority';
    };
    attendance: {
      timestampColumn: 'updated_at';
      hashColumn: null; // Real-time only
      priorityBoost: 3;
      offlineTimeout: 86400; // 24 hours max offline
    };
    student_rankings: {
      timestampColumn: 'updated_at';
      realTimeOnly: true; // Never allow offline modification
      celebrationTrigger: true;
    };
  };
  
  // Sync batch configuration
  batchConfiguration: {
    maxBatchSize: 50;
    maxBatchTime: 30000; // 30 seconds
    culturalPauseDuring: ['prayer_times'];
    compressionThreshold: 1024; // Compress batches > 1KB
  };
}
```

### 2. Conflict Resolution Strategies

#### Educational Context Conflict Resolution
```sql
-- Function for intelligent conflict resolution in educational context
CREATE OR REPLACE FUNCTION resolve_educational_conflict(
    p_conflict_id uuid,
    p_table_name text,
    p_client_data jsonb,
    p_server_data jsonb,
    p_user_id uuid,
    p_cultural_context jsonb DEFAULT '{}'
)
RETURNS jsonb AS $$
DECLARE
    resolution_result jsonb;
    user_role text;
    is_teacher boolean := false;
    is_admin boolean := false;
    final_data jsonb;
BEGIN
    -- Get user role for authority-based resolution
    SELECT role INTO user_role
    FROM auth.users
    WHERE id = p_user_id;
    
    is_teacher := (user_role = 'teacher');
    is_admin := (user_role = 'admin');
    
    -- Apply educational authority hierarchy
    CASE p_table_name
        WHEN 'attendance' THEN
            -- Teachers have authority over attendance marking
            IF is_teacher OR is_admin THEN
                final_data := p_client_data;
            ELSE
                final_data := p_server_data;
            END IF;
            
        WHEN 'feedback_entries' THEN
            -- Teacher feedback cannot be overridden by students
            IF is_teacher OR is_admin THEN
                final_data := p_client_data;
            ELSE
                final_data := p_server_data;
            END IF;
            
        WHEN 'student_rankings' THEN
            -- Only system can modify rankings
            final_data := p_server_data;
            
        WHEN 'home_tasks' THEN
            -- Merge strategy for task submissions
            final_data := jsonb_build_object(
                'student_response', p_client_data->'student_response',
                'submission_timestamp', p_client_data->'submission_timestamp',
                'teacher_feedback', p_server_data->'teacher_feedback',
                'grading_status', p_server_data->'grading_status'
            );
            
        ELSE
            -- Default: respect Islamic values and teacher authority
            IF (p_cultural_context->>'respects_islamic_values')::boolean = true AND (is_teacher OR is_admin) THEN
                final_data := p_client_data;
            ELSE
                final_data := p_server_data;
            END IF;
    END CASE;
    
    -- Build resolution result
    resolution_result := jsonb_build_object(
        'conflict_id', p_conflict_id,
        'resolution_strategy', 'educational_authority',
        'resolved_data', final_data,
        'authority_based', true,
        'cultural_compliant', true,
        'teacher_override_applied', is_teacher,
        'admin_override_applied', is_admin,
        'timestamp', extract(epoch from now()) * 1000
    );
    
    -- Update conflict status
    UPDATE offline_sync_queue 
    SET 
        sync_status = 'completed',
        new_data = final_data,
        completed_at = now(),
        conflict_metadata = resolution_result
    WHERE id = p_conflict_id;
    
    RETURN resolution_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Error Handling and Reconnection Logic

### 1. Progressive Reconnection Strategy

#### Exponential Backoff with Cultural Awareness
```typescript
interface ReconnectionStrategy {
  baseDelayMs: 1000;
  maxDelayMs: 30000;
  maxAttempts: 10;
  backoffMultiplier: 1.5;
  
  // Cultural considerations
  culturalPauses: {
    prayerTimeRespect: {
      pauseDuringPrayer: true;
      resumeAfterMinutes: 15;
      respectfulDelay: 2000; // Extra 2s delay after prayer
    };
    
    ramadanConsiderations: {
      fasterReconnectDuringFasting: true;
      respectBreakingFast: true;
      iftar_pause_minutes: 30;
    };
  };
  
  // Performance based adjustments
  performanceAdaptation: {
    poor_connection: {
      increaseDelay: 2.0;
      reducePollFrequency: true;
      enableCompression: true;
    };
    
    battery_low: {
      increaseDelay: 1.5;
      disableNonCritical: true;
      reduceBroadcasts: true;
    };
  };
}
```

#### Error Recovery Patterns
```typescript
export class RealtimeErrorHandler {
  private retryStrategies = {
    // Connection errors
    'connection_failed': {
      action: 'exponential_backoff',
      maxRetries: 10,
      culturalPause: 'prayer_time_aware'
    },
    
    // Authentication errors
    'auth_expired': {
      action: 'refresh_token',
      maxRetries: 3,
      fallback: 'force_reauth'
    },
    
    // Rate limiting
    'rate_limit_exceeded': {
      action: 'intelligent_throttling',
      backoffMultiplier: 2.0,
      culturalConsideration: 'respect_prayer_times'
    },
    
    // Database errors
    'database_unavailable': {
      action: 'offline_mode',
      queueOperations: true,
      maxOfflineTime: 86400000 // 24 hours
    },
    
    // Cultural conflicts
    'islamic_values_violation': {
      action: 'cultural_validation',
      requireHumanReview: true,
      adminNotification: true
    }
  };
  
  async handleError(error: RealtimeError): Promise<ErrorRecoveryPlan> {
    const strategy = this.retryStrategies[error.code];
    
    // Check cultural context
    if (await this.isPrayerTime()) {
      return {
        action: 'pause_until_prayer_complete',
        estimatedDelay: this.calculatePrayerTimeRemaining(),
        respectfulApproach: true
      };
    }
    
    // Apply strategy
    return this.executeRecoveryStrategy(strategy, error);
  }
}
```

### 2. Data Integrity Protection

#### Offline Data Validation
```sql
-- Function to validate offline data integrity
CREATE OR REPLACE FUNCTION validate_offline_data_integrity(
    p_user_id uuid,
    p_device_id text,
    p_operations jsonb
)
RETURNS jsonb AS $$
DECLARE
    validation_result jsonb;
    operation_item jsonb;
    integrity_issues text[] := '{}';
    cultural_violations text[] := '{}';
    permission_errors text[] := '{}';
BEGIN
    -- Validate each operation in the batch
    FOR operation_item IN SELECT jsonb_array_elements(p_operations)
    LOOP
        -- Check data integrity
        IF NOT (operation_item ? 'table_name' AND operation_item ? 'operation' AND operation_item ? 'data') THEN
            integrity_issues := array_append(integrity_issues, 'Missing required operation fields');
        END IF;
        
        -- Check cultural compliance for educational content
        IF operation_item->>'table_name' IN ('feedback_entries', 'home_tasks') THEN
            IF NOT (operation_item->'cultural_context'->>'islamic_values_compliant')::boolean THEN
                cultural_violations := array_append(cultural_violations, 'Islamic values compliance required');
            END IF;
        END IF;
        
        -- Check permissions based on user role and table
        IF operation_item->>'table_name' = 'student_rankings' THEN
            permission_errors := array_append(permission_errors, 'Students cannot modify rankings');
        END IF;
        
        -- Check attendance marking authority
        IF operation_item->>'table_name' = 'attendance' THEN
            DECLARE
                user_role text;
            BEGIN
                SELECT role INTO user_role FROM auth.users WHERE id = p_user_id;
                IF user_role NOT IN ('teacher', 'admin') THEN
                    permission_errors := array_append(permission_errors, 'Only teachers can mark attendance');
                END IF;
            END;
        END IF;
    END LOOP;
    
    -- Build validation result
    validation_result := jsonb_build_object(
        'valid', (array_length(integrity_issues, 1) IS NULL AND 
                 array_length(cultural_violations, 1) IS NULL AND 
                 array_length(permission_errors, 1) IS NULL),
        'integrity_issues', integrity_issues,
        'cultural_violations', cultural_violations,
        'permission_errors', permission_errors,
        'validated_at', extract(epoch from now()) * 1000
    );
    
    RETURN validation_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Connection Pooling and Scaling Considerations

### 1. Connection Pool Architecture

#### Supabase Realtime Connection Optimization
```typescript
interface ConnectionPoolConfiguration {
  // Connection limits per tenant
  maxConnectionsPerOrganization: 200;
  maxConnectionsPerUser: 5; // Multiple devices per user
  maxChannelsPerConnection: 10;
  
  // Performance thresholds
  connectionTimeout: 30000; // 30 seconds
  heartbeatInterval: 25000; // 25 seconds (before 30s timeout)
  maxMessageSize: 65536; // 64KB per message
  maxEventsPerSecond: 100;
  
  // Educational context optimizations
  classroomMode: {
    maxConcurrentAttendanceMarking: 3; // Multiple teachers per class
    attendanceMarkingTimeout: 300000; // 5 minutes
    bulkOperationBatchSize: 50;
    prioritizeAttendanceSync: true;
  };
  
  // Cultural considerations
  culturalOptimizations: {
    prayerTimePauseEnabled: true;
    ramadanModeAdjustments: true;
    respectfulReconnectionDelay: 2000;
    multilingualErrorMessages: true;
  };
}
```

#### Geographic Distribution Strategy
```typescript
interface GeographicDistribution {
  // Primary region for Uzbekistan
  primaryRegion: 'asia-southeast-1'; // Singapore (closest to Tashkent)
  fallbackRegions: ['eu-west-1', 'us-east-1'];
  
  // Latency optimization
  latencyTargets: {
    uzbekistan: '<150ms';
    central_asia: '<200ms';
    global: '<300ms';
  };
  
  // Cultural time zone support
  timeZoneSupport: {
    primary: 'Asia/Tashkent';
    islamic_calendar: 'hijri';
    prayer_time_calculation: 'local';
  };
}
```

### 2. Scaling Architecture

#### Auto-scaling Rules for Educational Workloads
```typescript
interface EducationalScalingRules {
  // Time-based scaling for school hours
  scheduleBasedScaling: {
    schoolHours: {
      timeRange: '08:00-17:00 Asia/Tashkent';
      scalingFactor: 2.0;
      priorityTypes: ['attendance', 'tasks', 'feedback'];
    };
    
    afterSchoolHours: {
      timeRange: '17:00-22:00 Asia/Tashkent';
      scalingFactor: 1.5;
      priorityTypes: ['homework', 'parent_communication'];
    };
    
    prayerTimes: {
      pauseScaling: true;
      queueOperations: true;
      resumeGracefully: true;
    };
  };
  
  // Load-based scaling
  loadBasedScaling: {
    concurrentUsers: {
      threshold_1: { users: 50, instances: 2 };
      threshold_2: { users: 150, instances: 4 };
      threshold_3: { users: 300, instances: 6 };
    };
    
    eventsPerSecond: {
      threshold_1: { eps: 500, instances: 2 };
      threshold_2: { eps: 1500, instances: 4 };
      threshold_3: { eps: 3000, instances: 6 };
    };
  };
  
  // Cultural event scaling
  culturalEventScaling: {
    ramadan: {
      expectedIncrease: 1.4;
      preAllocateResources: true;
      scheduleOptimization: true;
    };
    
    exam_periods: {
      expectedIncrease: 2.0;
      focusOnTaskSubmissions: true;
      increaseRetentionTime: true;
    };
  };
}
```

---

## Real-time Event Types and Payloads

### 1. Educational Event Specifications

#### Student Ranking Update Event
```typescript
interface StudentRankingUpdateEvent {
  eventType: 'student_ranking_update';
  timestamp: number;
  
  payload: {
    studentId: string;
    organizationId: string;
    
    // Ranking changes
    oldRank: number;
    newRank: number;
    rankChange: number; // Positive = improvement
    
    // Level and points
    oldLevel: number;
    newLevel: number;
    pointsGained: number;
    totalPoints: number;
    
    // Celebration data
    celebrationTriggered: boolean;
    celebrationType: 'rank_improvement' | 'level_up' | 'milestone' | 'streak';
    ageGroup: '10-12' | '13-15' | '16-18';
    
    // Cultural context
    culturalCelebration: {
      islamicValuesRespected: boolean;
      appropriateForAge: boolean;
      familyNotificationRequired: boolean;
      culturalMessage: {
        en: string;
        uz?: string;
        ru?: string;
        ar?: string;
      };
    };
  };
  
  metadata: {
    triggeredBy: 'task_completion' | 'attendance' | 'feedback' | 'achievement';
    confidenceLevel: number; // For AI-generated changes
    requiresHumanValidation: boolean;
  };
}
```

#### Attendance Synchronization Event
```typescript
interface AttendanceSyncEvent {
  eventType: 'attendance_sync';
  timestamp: number;
  
  payload: {
    attendanceId: string;
    studentId: string;
    groupId: string;
    teacherId: string;
    organizationId: string;
    
    // Attendance details
    status: 'present' | 'absent' | 'late' | 'excused' | 'sick' | 'emergency';
    attendanceDate: string;
    markedAt: number;
    
    // Sync context
    wasOffline: boolean;
    syncPriority: number;
    conflictResolved: boolean;
    
    // Teacher context
    teacherContext: {
      markingMethod: 'manual' | 'gesture' | 'bulk' | 'qr_code';
      classroomContext: string;
      concurrentMarking: boolean;
    };
    
    // Cultural context
    culturalContext: {
      prayerTimeConsidered: boolean;
      islamicDateRecorded: string;
      respectfulCommunication: boolean;
      familyNotificationScheduled: boolean;
    };
  };
  
  metadata: {
    syncVersion: number;
    originalTimestamp: number;
    deviceId: string;
    networkQuality: 'excellent' | 'good' | 'poor';
  };
}
```

#### Task Assignment Event
```typescript
interface TaskAssignmentEvent {
  eventType: 'task_assignment';
  timestamp: number;
  
  payload: {
    taskId: string;
    studentId: string;
    teacherId: string;
    groupId: string;
    organizationId: string;
    
    // Task details
    taskType: 'text' | 'quiz' | 'speaking' | 'listening' | 'writing';
    title: {
      en: string;
      uz?: string;
      ru?: string;
    };
    difficulty: 1 | 2 | 3 | 4 | 5;
    estimatedDuration: number; // minutes
    
    // AI generation context
    aiGenerated: boolean;
    culturallyValidated: boolean;
    islamicValuesScore: number;
    
    // Assignment context
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
    parentNotificationRequired: boolean;
    
    // Cultural adaptation
    culturalAdaptation: {
      localizedContent: boolean;
      islamicValuesIntegrated: boolean;
      ageAppropriate: boolean;
      familyEngagementLevel: 'low' | 'medium' | 'high';
    };
  };
  
  metadata: {
    assignmentSource: 'teacher_manual' | 'ai_generated' | 'curriculum_automatic';
    qualityScore: number;
    culturalValidationPassed: boolean;
  };
}
```

#### Achievement Earned Event
```typescript
interface AchievementEarnedEvent {
  eventType: 'achievement_earned';
  timestamp: number;
  
  payload: {
    achievementId: string;
    studentId: string;
    organizationId: string;
    
    // Achievement details
    achievementName: {
      en: string;
      uz?: string;
      ru?: string;
      ar?: string;
    };
    description: {
      en: string;
      uz?: string;
      ru?: string;
      ar?: string;
    };
    category: 'academic' | 'behavioral' | 'attendance' | 'collaboration' | 'cultural';
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    
    // Rewards
    pointsAwarded: number;
    coinsAwarded: number;
    bonusPoints: number;
    
    // Celebration configuration
    celebration: {
      style: 'animated' | 'badge' | 'professional' | 'cultural';
      ageAppropriate: boolean;
      duration: number; // milliseconds
      sound: boolean;
      haptic: boolean;
      
      // Cultural celebration elements
      islamicCelebration: {
        enabled: boolean;
        greeting: string;
        culturalElements: string[];
      };
    };
    
    // Sharing and recognition
    sharing: {
      familyNotification: boolean;
      classroomRecognition: boolean;
      publicCelebration: boolean;
      socialMediaEligible: boolean;
    };
  };
  
  metadata: {
    earnedThrough: 'task_completion' | 'streak_maintenance' | 'ranking_improvement' | 'teacher_recognition';
    difficultyLevel: number;
    culturalSignificance: 'low' | 'medium' | 'high';
  };
}
```

### 2. System Notification Events

#### Prayer Time Notification Event
```typescript
interface PrayerTimeNotificationEvent {
  eventType: 'system_announcement';
  timestamp: number;
  
  payload: {
    organizationId: string;
    
    // Prayer time details
    prayerName: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
    prayerTime: string; // HH:MM format
    timeUntilPrayer: number; // minutes
    
    // Notification content
    message: {
      en: string;
      uz: string;
      ru: string;
      ar: string;
    };
    greeting: {
      formal: string; // As-salaam alaikum
      casual: string; // Salom
    };
    
    // Cultural guidance
    islamicGuidance: {
      preparationSuggestions: string[];
      respectfulBehavior: string[];
      postPrayerActions: string[];
    };
    
    // App behavior recommendations
    appBehavior: {
      pauseNotifications: boolean;
      enableQuietMode: boolean;
      showPrayerTimeIndicator: boolean;
      adjustUIForPrayer: boolean;
    };
  };
  
  metadata: {
    calculatedForTimezone: 'Asia/Tashkent';
    islamicCalendarDate: string;
    ramadanContext: boolean;
  };
}
```

---

## Performance Optimization Specifications

### 1. Real-time Data Throttling

#### Intelligent Event Batching
```typescript
interface EventBatchingStrategy {
  // Batching rules by event type
  batchingRules: {
    ranking_updates: {
      maxBatchSize: 10;
      maxWaitTime: 2000; // 2 seconds
      priorityThreshold: 'medium';
    };
    
    attendance_sync: {
      maxBatchSize: 50; // Bulk attendance marking
      maxWaitTime: 1000; // 1 second for real-time feel
      priorityThreshold: 'high';
    };
    
    task_notifications: {
      maxBatchSize: 20;
      maxWaitTime: 5000; // 5 seconds
      priorityThreshold: 'low';
    };
  };
  
  // Cultural batching considerations
  culturalBatching: {
    respectPrayerTimes: true;
    pauseBatchingDuringPrayer: true;
    resumeAfterPrayerGracePeriod: 60000; // 1 minute
    ramadanBatchingOptimization: true;
  };
  
  // Performance optimization
  compressionConfig: {
    enableForBatchesOver: 1024; // 1KB
    compressionAlgorithm: 'gzip';
    compressionLevel: 6;
  };
}
```

#### Bandwidth Conservation
```typescript
interface BandwidthOptimization {
  // Data compression strategies
  compression: {
    payloadCompression: true;
    imageOptimization: true;
    textMinification: true;
    redundancyElimination: true;
  };
  
  // Intelligent filtering
  dataFiltering: {
    // Only send changes relevant to current screen
    contextAwareFiltering: true;
    
    // Priority-based filtering during poor connection
    priorityFiltering: {
      excellent_connection: 'send_all';
      good_connection: 'medium_priority_and_above';
      poor_connection: 'high_priority_only';
      offline: 'critical_only_to_queue';
    };
  };
  
  // Cultural bandwidth optimization
  culturalOptimization: {
    // Cache Islamic calendar data locally
    islamicCalendarCaching: true;
    
    // Optimize multilingual content delivery
    languageSpecificContent: true;
    
    // Prayer time efficient updates
    prayerTimeMinimalUpdates: true;
  };
}
```

### 2. Mobile Performance Optimization

#### Battery and Resource Management
```typescript
interface MobilePerformanceConfig {
  // Battery optimization
  batteryOptimization: {
    backgroundSyncLimiting: true;
    adaptiveHeartbeat: {
      foreground: 25000; // 25 seconds
      background: 120000; // 2 minutes
      low_battery: 300000; // 5 minutes when battery < 20%
    };
    
    // Reduce operations during prayer times
    prayerTimeConservation: {
      pauseNonCriticalSync: true;
      deferUpdatesUntilAfterPrayer: true;
      enableBatteryRespectMode: true;
    };
  };
  
  // Memory optimization
  memoryManagement: {
    maxCachedEvents: 100;
    eventExpirationMs: 300000; // 5 minutes
    garbageCollectionFrequency: 60000; // 1 minute
    
    // Cultural context caching
    culturalDataCaching: {
      islamicCalendarCache: 'persistent';
      prayerTimeCache: 'daily_refresh';
      culturalTemplatesCache: 'weekly_refresh';
    };
  };
  
  // Network efficiency
  networkOptimization: {
    intelligentRetry: true;
    adaptiveBatching: true;
    compressionEnabled: true;
    
    // Uzbekistan network considerations
    networkConditions: {
      assumePoorConnectivity: true;
      optimizeForCellular: true;
      respectDataLimits: true;
    };
  };
}
```

---

## Real-time Event Implementation Examples

### 1. Student Ranking Real-time Flow

```typescript
// Complete implementation example for student ranking updates
export class StudentRankingRealtimeService {
  private supabase: SupabaseClient;
  private currentSubscriptions: Map<string, RealtimeChannel> = new Map();
  
  async subscribeToRankingUpdates(
    studentId: string,
    organizationId: string,
    options: {
      ageGroup: '10-12' | '13-15' | '16-18';
      celebrationEnabled: boolean;
      familyNotificationEnabled: boolean;
    }
  ): Promise<string> {
    const channelName = `rankings:org_${organizationId}:student_${studentId}`;
    
    const channel = this.supabase
      .channel(channelName, {
        config: {
          presence: { key: studentId },
          private: false // Organization-level data
        }
      })
      // Listen to ranking table changes
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'student_rankings',
          filter: `student_id=eq.${studentId}`
        },
        (payload) => this.handleRankingUpdate(payload, options)
      )
      // Listen to achievement notifications
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'student_achievements',
          filter: `student_id=eq.${studentId}`
        },
        (payload) => this.handleAchievementEarned(payload, options)
      )
      // Listen to broadcast celebrations
      .on(
        'broadcast',
        { event: 'ranking_celebration' },
        (payload) => this.handleCelebrationBroadcast(payload, options)
      )
      .subscribe();
    
    this.currentSubscriptions.set(channelName, channel);
    return channelName;
  }
  
  private async handleRankingUpdate(
    payload: any,
    options: { ageGroup: string; celebrationEnabled: boolean }
  ): Promise<void> {
    const { new: newRanking, old: oldRanking } = payload;
    
    // Calculate ranking change significance
    const rankImprovement = oldRanking.current_rank - newRanking.current_rank;
    const levelUp = newRanking.current_level > oldRanking.current_level;
    
    // Trigger age-appropriate celebration
    if (options.celebrationEnabled && (rankImprovement > 0 || levelUp)) {
      await this.triggerCelebration({
        type: levelUp ? 'level_up' : 'rank_improvement',
        ageGroup: options.ageGroup,
        rankingData: newRanking,
        improvement: rankImprovement
      });
    }
    
    // Update local cache
    await this.updateLocalRankingCache(newRanking);
    
    // Trigger UI updates
    this.notifyUIComponents('ranking_updated', {
      oldRanking,
      newRanking,
      celebrationTriggered: options.celebrationEnabled
    });
  }
  
  private async triggerCelebration(celebrationData: any): Promise<void> {
    // Age-appropriate celebration logic
    const celebrationConfig = this.getCelebrationConfig(celebrationData.ageGroup);
    
    // Cultural adaptation
    const culturalGreeting = this.getCulturalGreeting(celebrationData.type);
    
    // Trigger celebration animation
    await this.animationService.triggerCelebration({
      ...celebrationConfig,
      greeting: culturalGreeting,
      islamicValuesRespected: true
    });
  }
}
```

### 2. Teacher Attendance Real-time Collaboration

```typescript
// Teacher attendance collaboration service
export class AttendanceCollaborationService {
  private supabase: SupabaseClient;
  private presenceChannel: RealtimeChannel | null = null;
  
  async initializeAttendanceCollaboration(
    groupId: string,
    teacherId: string,
    organizationId: string
  ): Promise<void> {
    const channelName = `attendance:org_${organizationId}:group_${groupId}`;
    
    this.presenceChannel = this.supabase
      .channel(channelName, {
        config: {
          presence: { key: teacherId },
          private: false
        }
      })
      // Track teacher presence during attendance marking
      .on('presence', { event: 'sync' }, () => {
        this.updateTeacherPresenceUI();
      })
      // Listen to attendance changes from other teachers
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => this.handleAttendanceCollaboration(payload)
      )
      // Listen to real-time marking indicators
      .on(
        'broadcast',
        { event: 'marking_in_progress' },
        (payload) => this.showMarkingIndicator(payload)
      )
      .subscribe();
    
    // Update presence to show current activity
    await this.presenceChannel.track({
      teacherId,
      activity: 'marking_attendance',
      groupId,
      timestamp: Date.now(),
      culturalGreeting: 'As-salaam alaikum'
    });
  }
  
  async markAttendanceWithCollaboration(
    studentId: string,
    status: string,
    options: {
      notifyOtherTeachers: boolean;
      respectConcurrentMarking: boolean;
      culturalContext: object;
    }
  ): Promise<void> {
    // Check for concurrent marking by other teachers
    if (options.respectConcurrentMarking) {
      const otherTeachersMarking = await this.checkConcurrentMarking(studentId);
      if (otherTeachersMarking.length > 0) {
        await this.handleConcurrentMarkingConflict(otherTeachersMarking);
        return;
      }
    }
    
    // Broadcast marking intention
    await this.presenceChannel?.send({
      type: 'broadcast',
      event: 'marking_in_progress',
      payload: {
        studentId,
        teacherId: this.currentTeacherId,
        status,
        timestamp: Date.now(),
        culturalContext: options.culturalContext
      }
    });
    
    // Perform attendance marking with real-time sync
    const result = await this.markAttendanceWithSync(studentId, status, options);
    
    // Broadcast completion
    await this.presenceChannel?.send({
      type: 'broadcast',
      event: 'marking_completed',
      payload: {
        studentId,
        status,
        result,
        timestamp: Date.now()
      }
    });
  }
}
```

---

## Migration Strategy

### Phase 1: Core Real-time Infrastructure (Week 1-2)
```sql
-- Migration 001: Create core real-time tables
-- Create realtime_events table with indexes
-- Create realtime_subscriptions table with indexes
-- Create offline_sync_queue table with indexes
-- Create realtime_presence table with indexes
-- Create push_notifications table with indexes

-- Enable RLS on all new tables
ALTER TABLE realtime_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
```

### Phase 2: Real-time Triggers and Functions (Week 2-3)
```sql
-- Migration 002: Create trigger functions
-- Install student ranking trigger
-- Install attendance sync trigger  
-- Install achievement notification trigger
-- Install prayer time scheduling
-- Install conflict resolution functions
```

### Phase 3: Enhanced Core Tables (Week 3-4)
```sql
-- Migration 003: Enhance existing tables for real-time
-- Add real-time columns to students table
-- Add real-time columns to student_rankings table
-- Create or enhance attendance table
-- Add cultural context columns where needed
```

### Phase 4: Performance Optimization (Week 4-5)
```sql
-- Migration 004: Performance optimization
-- Create materialized views for common real-time queries
-- Add additional indexes for performance
-- Configure automatic vacuum and analyze
-- Set up pg_cron for maintenance tasks
```

---

## Security and Privacy Framework

### 1. Data Protection for Real-time Events

#### Encryption Strategy
```typescript
interface RealtimeSecurityConfig {
  // Transport encryption
  transportSecurity: {
    protocol: 'WSS'; // WebSocket Secure
    tlsVersion: '1.3';
    certificateValidation: 'strict';
  };
  
  // Payload encryption for sensitive data
  payloadEncryption: {
    enabled: true;
    algorithm: 'AES-256-GCM';
    keyRotation: 'daily';
    
    // Educational data classification
    sensitiveFields: [
      'student_personal_info',
      'family_contact_details',
      'medical_information',
      'academic_records'
    ];
  };
  
  // Cultural privacy considerations
  culturalPrivacy: {
    islamicPrivacyRespected: true;
    familyConsentRequired: true;
    parentalOversightEnabled: true; // For students under 16
    culturalSensitivityFiltering: true;
  };
}
```

#### FERPA Compliance for Real-time Data
```sql
-- Function to ensure FERPA compliance in real-time events
CREATE OR REPLACE FUNCTION ensure_ferpa_compliance_realtime(
    p_event_payload jsonb,
    p_target_user_id uuid,
    p_requesting_user_id uuid
)
RETURNS jsonb AS $$
DECLARE
    filtered_payload jsonb;
    user_relationship text;
    is_family_member boolean := false;
    is_authorized_educator boolean := false;
BEGIN
    -- Check relationship between users
    SELECT relationship_type INTO user_relationship
    FROM user_relationships
    WHERE (user_a_id = p_requesting_user_id AND user_b_id = p_target_user_id)
       OR (user_a_id = p_target_user_id AND user_b_id = p_requesting_user_id);
    
    -- Check if requesting user is family member
    is_family_member := (user_relationship IN ('parent', 'guardian', 'family'));
    
    -- Check if requesting user is authorized educator
    is_authorized_educator := EXISTS (
        SELECT 1 FROM teachers 
        WHERE id = p_requesting_user_id 
          AND is_active = true 
          AND deleted_at IS NULL
    );
    
    -- Filter payload based on authorization
    IF is_family_member OR is_authorized_educator OR p_requesting_user_id = p_target_user_id THEN
        -- Full access to educational data
        filtered_payload := p_event_payload;
    ELSE
        -- Remove sensitive information
        filtered_payload := p_event_payload - 'personal_info' - 'family_details' - 'medical_notes';
    END IF;
    
    -- Add compliance metadata
    filtered_payload := filtered_payload || jsonb_build_object(
        'ferpa_compliant', true,
        'access_level', CASE 
            WHEN is_family_member THEN 'family'
            WHEN is_authorized_educator THEN 'educator'
            WHEN p_requesting_user_id = p_target_user_id THEN 'self'
            ELSE 'public'
        END,
        'filtered_at', extract(epoch from now()) * 1000
    );
    
    RETURN filtered_payload;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Cost Analysis and Resource Planning

### 1. Real-time Infrastructure Costs

#### Supabase Realtime Pricing Optimization
```typescript
interface RealtimeCostOptimization {
  // Connection cost management
  connectionOptimization: {
    // Estimated costs for Harry School (500 students, 50 teachers)
    estimatedConcurrentConnections: 150; // 30% concurrent usage
    supabaseRealtimeCostPerConnection: 0.01; // $0.01 per connection per day
    estimatedMonthlyCost: 45; // $45/month for connections
    
    // Optimization strategies
    strategies: {
      intelligentDisconnection: '15% cost reduction';
      batchedOperations: '25% bandwidth reduction';
      culturalPauseOptimization: '10% cost reduction';
      offlineFirstApproach: '40% reduction in real-time dependency';
    };
  };
  
  // Data transfer optimization
  dataTransferOptimization: {
    estimatedMonthlyTransfer: '2.5GB'; // For 500 students
    compressionSavings: '60%'; // Effective compression ratio
    optimizedPayloadSize: '40%'; // Smaller payloads
    culturalContextCaching: '20%'; // Cache Islamic calendar data
  };
  
  // Total cost projection
  costProjection: {
    monthlyRealtimeCost: 45;
    dataTransferCost: 5;
    totalMonthlyEstimate: 50;
    costPerStudent: 0.10; // $0.10 per student per month
    costPerTeacher: 1.00; // $1.00 per teacher per month
    roi: {
      teacherEfficiencyGain: '40%';
      studentEngagementIncrease: '25%';
      administrativeTimeSavings: '60%';
    };
  };
}
```

### 2. Performance Targets and SLAs

#### Real-time Performance Specifications
```typescript
interface RealtimePerformanceSLAs {
  // Latency targets
  latencyTargets: {
    critical_events: '<100ms'; // Safety alerts, emergencies
    high_priority: '<200ms'; // Attendance, achievements
    medium_priority: '<500ms'; // Task assignments, feedback
    low_priority: '<2000ms'; // General notifications
  };
  
  // Availability targets
  availabilityTargets: {
    realtime_service: '99.5%'; // 3.6 hours downtime per month
    websocket_connectivity: '99.0%'; // Some mobile disconnections expected
    offline_functionality: '95%'; // Critical for Uzbekistan infrastructure
  };
  
  // Cultural performance considerations
  culturalPerformance: {
    prayer_time_pause_compliance: '100%'; // Must respect prayer times
    multilingual_response_time: '<300ms'; // Language switching
    islamic_calendar_accuracy: '100%'; // Cultural calendar integration
    family_notification_delivery: '98%'; // Critical for family engagement
  };
  
  // Mobile-specific targets
  mobilePerformance: {
    app_launch_to_realtime_connection: '<3s';
    background_to_foreground_reconnection: '<1s';
    offline_to_online_sync_completion: '<30s';
    battery_impact_per_hour: '<3%';
    memory_usage_limit: '50MB';
    network_usage_per_day: '<10MB';
  };
}
```

---

## Implementation Roadmap

### Week 1-2: Foundation
- [ ] Implement core real-time tables and indexes
- [ ] Create basic RLS policies for multi-tenant isolation
- [ ] Set up WebSocket connection management
- [ ] Implement authentication flow for real-time connections

### Week 3-4: Core Events
- [ ] Implement student ranking real-time updates
- [ ] Create attendance synchronization system
- [ ] Build achievement notification system
- [ ] Add task assignment real-time flow

### Week 5-6: Advanced Features
- [ ] Implement presence tracking system
- [ ] Add conflict resolution mechanisms
- [ ] Create offline sync queue processing
- [ ] Build prayer time awareness system

### Week 7-8: Cultural Integration
- [ ] Add Islamic calendar integration
- [ ] Implement multilingual real-time messages
- [ ] Create family notification system
- [ ] Add cultural celebration triggers

### Week 9-10: Performance Optimization
- [ ] Implement intelligent batching
- [ ] Add bandwidth conservation measures
- [ ] Create battery optimization features
- [ ] Set up monitoring and analytics

### Week 11-12: Testing and Deployment
- [ ] Comprehensive real-time testing
- [ ] Load testing with cultural scenarios
- [ ] Security penetration testing
- [ ] Production deployment and monitoring

---

## Monitoring and Analytics

### 1. Real-time Performance Monitoring

#### Key Performance Indicators
```typescript
interface RealtimeKPIs {
  // Connection health
  connectionHealth: {
    averageLatency: number; // Target: <200ms
    connectionStability: number; // Target: >95%
    reconnectionRate: number; // Target: <5%
    heartbeatSuccess: number; // Target: >99%
  };
  
  // Event delivery
  eventDelivery: {
    deliverySuccess: number; // Target: >98%
    averageDeliveryTime: number; // Target: <500ms
    eventProcessingRate: number; // Events per second
    backlogSize: number; // Target: <100 events
  };
  
  // Cultural compliance
  culturalCompliance: {
    prayerTimeRespectRate: number; // Target: 100%
    islamicValuesCompliance: number; // Target: >95%
    multilingualDeliverySuccess: number; // Target: >98%
    familyNotificationRate: number; // Target: >95%
  };
  
  // Mobile performance
  mobilePerformance: {
    batteryImpactPerHour: number; // Target: <3%
    memoryUsage: number; // Target: <50MB
    offlineSyncSuccess: number; // Target: >90%
    networkEfficiency: number; // Target: >80%
  };
}
```

#### Alerting and Escalation
```typescript
interface RealtimeAlerting {
  // Critical alerts
  criticalAlerts: {
    websocketServiceDown: {
      threshold: 'service_unavailable';
      escalation: 'immediate';
      culturalConsideration: 'respect_prayer_times';
    };
    
    massiveConnectionFailure: {
      threshold: '>20% connection drops in 5 minutes';
      escalation: 'immediate';
      studentSafetyImpact: 'high';
    };
    
    islamicValuesViolation: {
      threshold: 'cultural_appropriateness < 95%';
      escalation: 'cultural_review_team';
      familyNotificationRequired: true;
    };
  };
  
  // Performance alerts
  performanceAlerts: {
    latencyDegradation: {
      threshold: '>500ms average latency';
      escalation: 'performance_team';
      timeToResolve: '15 minutes';
    };
    
    offlineSyncBacklog: {
      threshold: '>1000 pending operations';
      escalation: 'technical_team';
      studentImpact: 'medium';
    };
  };
}
```

This comprehensive real-time API architecture provides a robust foundation for the Harry School CRM mobile applications, ensuring seamless real-time functionality while respecting cultural values, maintaining educational authority structures, and providing excellent mobile performance even in challenging network conditions typical of Uzbekistan's educational infrastructure.

The architecture emphasizes offline-first design patterns, intelligent conflict resolution, and cultural sensitivity throughout all real-time interactions, making it perfectly suited for the educational context of Harry School while maintaining scalability for future growth.