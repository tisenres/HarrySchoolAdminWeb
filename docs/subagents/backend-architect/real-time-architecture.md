# Real-time Architecture - Harry School CRM

## Real-time System Overview

The Harry School CRM implements a comprehensive real-time architecture using Supabase Realtime to provide instant updates for critical educational workflows. The system ensures that all users see the most current data and receive immediate notifications for important events.

## Architecture Components

### 1. Supabase Realtime Infrastructure

```typescript
// Core realtime configuration
const realtimeConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limiting
      log_level: 'info'
    }
  }
}

// Database-level realtime settings
-- Enable realtime for core tables
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE teachers;
ALTER PUBLICATION supabase_realtime ADD TABLE groups;
ALTER PUBLICATION supabase_realtime ADD TABLE student_group_enrollments;
ALTER PUBLICATION supabase_realtime ADD TABLE teacher_group_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### 2. Event-Driven Architecture

The system uses database triggers and Supabase Edge Functions to create a reliable event-driven architecture:

```sql
-- Event trigger function for real-time notifications
CREATE OR REPLACE FUNCTION notify_realtime_event()
RETURNS TRIGGER AS $$
DECLARE
    event_type TEXT;
    payload JSONB;
BEGIN
    -- Determine event type
    event_type := CASE
        WHEN TG_OP = 'INSERT' THEN 'created'
        WHEN TG_OP = 'UPDATE' THEN 'updated'
        WHEN TG_OP = 'DELETE' THEN 'deleted'
    END;
    
    -- Build payload
    payload := jsonb_build_object(
        'table', TG_TABLE_NAME,
        'event_type', event_type,
        'organization_id', COALESCE(NEW.organization_id, OLD.organization_id),
        'record_id', COALESCE(NEW.id, OLD.id),
        'timestamp', NOW(),
        'data', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END
    );
    
    -- Notify realtime channel
    PERFORM pg_notify('realtime_events', payload::text);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to core tables
CREATE TRIGGER trigger_students_realtime 
    AFTER INSERT OR UPDATE OR DELETE ON students
    FOR EACH ROW EXECUTE FUNCTION notify_realtime_event();

CREATE TRIGGER trigger_groups_realtime 
    AFTER INSERT OR UPDATE OR DELETE ON groups
    FOR EACH ROW EXECUTE FUNCTION notify_realtime_event();

CREATE TRIGGER trigger_enrollments_realtime 
    AFTER INSERT OR UPDATE OR DELETE ON student_group_enrollments
    FOR EACH ROW EXECUTE FUNCTION notify_realtime_event();
```

## Real-time Channels

### 1. Organization Channel

Global channel for organization-wide updates.

```typescript
// Client-side subscription
const organizationChannel = supabase
  .channel(`organization:${organizationId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'students',
    filter: `organization_id=eq.${organizationId}`
  }, handleStudentChange)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'teachers',
    filter: `organization_id=eq.${organizationId}`
  }, handleTeacherChange)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'groups',
    filter: `organization_id=eq.${organizationId}`
  }, handleGroupChange)
  .subscribe((status) => {
    console.log('Organization channel status:', status)
  })

// Event handlers
const handleStudentChange = (payload: RealtimePostgresChangesPayload) => {
  const { eventType, new: newRecord, old: oldRecord } = payload
  
  switch (eventType) {
    case 'INSERT':
      // Add new student to UI
      addStudentToList(newRecord)
      showNotification('New student enrolled', 'success')
      break
    case 'UPDATE':
      // Update existing student in UI
      updateStudentInList(newRecord)
      if (newRecord.enrollment_status !== oldRecord.enrollment_status) {
        showNotification(`Student status changed to ${newRecord.enrollment_status}`, 'info')
      }
      break
    case 'DELETE':
      // Remove student from UI
      removeStudentFromList(oldRecord.id)
      showNotification('Student removed', 'warning')
      break
  }
}
```

### 2. User-Specific Channels

Personal notification channels for individual users.

```typescript
// User notification channel
const userChannel = supabase
  .channel(`user:${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, handleNewNotification)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'notifications', 
    filter: `user_id=eq.${userId}`
  }, handleNotificationUpdate)
  .subscribe()

const handleNewNotification = (payload: RealtimePostgresChangesPayload) => {
  const notification = payload.new
  
  // Add to notification list
  addNotificationToList(notification)
  
  // Show toast notification
  showToastNotification({
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    actionUrl: notification.action_url
  })
  
  // Update unread count
  incrementUnreadCount()
  
  // Play sound for high priority notifications
  if (notification.priority === 'high' || notification.priority === 'urgent') {
    playNotificationSound()
  }
}
```

### 3. Group Activity Channels

Real-time updates for specific groups and their activities.

```typescript
// Group-specific channel for detailed tracking
const groupChannel = supabase
  .channel(`group:${groupId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'student_group_enrollments',
    filter: `group_id=eq.${groupId}`
  }, handleEnrollmentChange)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'teacher_group_assignments',
    filter: `group_id=eq.${groupId}`
  }, handleTeacherAssignmentChange)
  .subscribe()

const handleEnrollmentChange = (payload: RealtimePostgresChangesPayload) => {
  const { eventType, new: enrollment, old: oldEnrollment } = payload
  
  switch (eventType) {
    case 'INSERT':
      // Student enrolled in group
      updateGroupEnrollmentCount(groupId, '+1')
      showNotification(`${enrollment.student.full_name} enrolled in group`, 'success')
      break
    case 'UPDATE':
      if (enrollment.status !== oldEnrollment.status) {
        // Status changed
        showNotification(
          `${enrollment.student.full_name} status: ${enrollment.status}`, 
          'info'
        )
      }
      break
    case 'DELETE':
      // Student dropped from group
      updateGroupEnrollmentCount(groupId, '-1')
      showNotification(`Student dropped from group`, 'warning')
      break
  }
}
```

## Notification System

### 1. Notification Types & Priority

```typescript
// Notification type definitions
export enum NotificationType {
  SYSTEM = 'system',
  ENROLLMENT = 'enrollment', 
  PAYMENT = 'payment',
  SCHEDULE = 'schedule',
  ACHIEVEMENT = 'achievement',
  REMINDER = 'reminder',
  ALERT = 'alert'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Notification routing rules
const notificationRouting = {
  [NotificationType.ENROLLMENT]: {
    targets: ['admin', 'superadmin'],
    priority: NotificationPriority.NORMAL,
    channels: ['in_app', 'email']
  },
  [NotificationType.PAYMENT]: {
    targets: ['admin', 'superadmin'],
    priority: NotificationPriority.HIGH,
    channels: ['in_app', 'email', 'sms']
  },
  [NotificationType.ALERT]: {
    targets: ['admin', 'superadmin'],
    priority: NotificationPriority.URGENT,
    channels: ['in_app', 'email', 'sms']
  }
}
```

### 2. Automated Notification Triggers

```sql
-- Function to create notifications based on business rules
CREATE OR REPLACE FUNCTION create_automated_notification()
RETURNS TRIGGER AS $$
DECLARE
    notification_title TEXT;
    notification_message TEXT;
    notification_type TEXT;
    notification_priority TEXT;
    target_roles TEXT[];
BEGIN
    -- Student enrollment notifications
    IF TG_TABLE_NAME = 'student_group_enrollments' AND TG_OP = 'INSERT' THEN
        SELECT full_name INTO notification_message FROM students WHERE id = NEW.student_id;
        SELECT name INTO notification_title FROM groups WHERE id = NEW.group_id;
        
        INSERT INTO notifications (
            organization_id,
            type,
            title,
            message,
            priority,
            role_target,
            related_student_id,
            related_group_id,
            delivery_method
        ) VALUES (
            NEW.organization_id,
            'enrollment',
            'New Student Enrollment',
            notification_message || ' has enrolled in ' || notification_title,
            'normal',
            ARRAY['admin', 'superadmin'],
            NEW.student_id,
            NEW.group_id,
            ARRAY['in_app', 'email']
        );
    END IF;
    
    -- Payment status notifications
    IF TG_TABLE_NAME = 'students' AND TG_OP = 'UPDATE' AND 
       OLD.payment_status != NEW.payment_status AND NEW.payment_status = 'overdue' THEN
        
        INSERT INTO notifications (
            organization_id,
            type,
            title,
            message,
            priority,
            role_target,
            related_student_id,
            delivery_method
        ) VALUES (
            NEW.organization_id,
            'payment',
            'Payment Overdue',
            NEW.full_name || ' has an overdue payment',
            'high',
            ARRAY['admin', 'superadmin'],
            NEW.id,
            ARRAY['in_app', 'email']
        );
    END IF;
    
    -- Group capacity notifications
    IF TG_TABLE_NAME = 'groups' AND TG_OP = 'UPDATE' AND 
       NEW.current_enrollment >= NEW.max_students AND OLD.current_enrollment < OLD.max_students THEN
        
        INSERT INTO notifications (
            organization_id,
            type,
            title,
            message,
            priority,
            role_target,
            related_group_id,
            delivery_method
        ) VALUES (
            NEW.organization_id,
            'alert',
            'Group Full',
            NEW.name || ' has reached maximum capacity',
            'normal',
            ARRAY['admin', 'superadmin'],
            NEW.id,
            ARRAY['in_app']
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply notification triggers
CREATE TRIGGER trigger_enrollment_notifications 
    AFTER INSERT ON student_group_enrollments
    FOR EACH ROW EXECUTE FUNCTION create_automated_notification();

CREATE TRIGGER trigger_payment_notifications 
    AFTER UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION create_automated_notification();

CREATE TRIGGER trigger_group_capacity_notifications 
    AFTER UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION create_automated_notification();
```

### 3. Notification Delivery System

```typescript
// Edge Function for notification delivery
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface NotificationPayload {
  id: string
  organization_id: string
  user_id?: string
  role_target?: string[]
  type: string
  title: string
  message: string
  priority: string
  delivery_method: string[]
  related_student_id?: string
  related_teacher_id?: string
  related_group_id?: string
}

serve(async (req) => {
  const payload: NotificationPayload = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  // Determine notification recipients
  let recipients: any[] = []
  
  if (payload.user_id) {
    // Direct user notification
    const { data: user } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', payload.user_id)
      .single()
    
    if (user) recipients = [user]
  } else if (payload.role_target) {
    // Role-based notification
    const { data: users } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', payload.organization_id)
      .in('role', payload.role_target)
      .is('deleted_at', null)
    
    recipients = users || []
  }
  
  // Send notifications through various channels
  for (const recipient of recipients) {
    for (const method of payload.delivery_method) {
      switch (method) {
        case 'in_app':
          // In-app notification (already created in database)
          break
          
        case 'email':
          await sendEmailNotification(recipient, payload)
          break
          
        case 'sms':
          if (payload.priority === 'high' || payload.priority === 'urgent') {
            await sendSMSNotification(recipient, payload)
          }
          break
      }
    }
  }
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

async function sendEmailNotification(recipient: any, payload: NotificationPayload) {
  // Email template based on notification type
  const template = getEmailTemplate(payload.type)
  
  const emailContent = {
    to: recipient.email,
    subject: `[Harry School CRM] ${payload.title}`,
    html: template.render({
      recipient_name: recipient.full_name,
      title: payload.title,
      message: payload.message,
      action_url: payload.action_url ? 
        `${Deno.env.get('APP_URL')}${payload.action_url}` : 
        Deno.env.get('APP_URL'),
      organization_name: 'Harry School'
    })
  }
  
  // Send via email service (SendGrid, AWS SES, etc.)
  await sendEmail(emailContent)
}

async function sendSMSNotification(recipient: any, payload: NotificationPayload) {
  if (!recipient.phone) return
  
  const smsContent = {
    to: recipient.phone,
    body: `[Harry School] ${payload.title}: ${payload.message}`
  }
  
  // Send via SMS service (Twilio, AWS SNS, etc.)
  await sendSMS(smsContent)
}
```

## Live Data Synchronization

### 1. Optimistic Updates

```typescript
// Optimistic update pattern for better UX
class OptimisticUpdateManager {
  private pendingUpdates = new Map<string, any>()
  
  async updateStudent(studentId: string, updates: Partial<Student>) {
    // Apply optimistic update to UI immediately
    const optimisticId = `student_${studentId}_${Date.now()}`
    this.pendingUpdates.set(optimisticId, { type: 'student', id: studentId, updates })
    
    // Update UI state optimistically
    updateStudentInUI(studentId, updates)
    
    try {
      // Send actual update to server
      const result = await supabase
        .from('students')
        .update(updates)
        .eq('id', studentId)
        .select()
        .single()
      
      // Remove optimistic update and apply server result
      this.pendingUpdates.delete(optimisticId)
      updateStudentInUI(studentId, result.data)
      
    } catch (error) {
      // Revert optimistic update on error
      this.pendingUpdates.delete(optimisticId)
      revertStudentInUI(studentId, updates)
      showErrorNotification('Failed to update student')
    }
  }
  
  // Handle realtime updates
  handleRealtimeUpdate(payload: RealtimePostgresChangesPayload) {
    const recordId = payload.new?.id || payload.old?.id
    
    // Check if we have a pending optimistic update
    const pendingKey = Array.from(this.pendingUpdates.keys())
      .find(key => this.pendingUpdates.get(key)?.id === recordId)
    
    if (pendingKey) {
      // Skip this update as we have an optimistic update in progress
      return
    }
    
    // Apply realtime update normally
    this.applyRealtimeUpdate(payload)
  }
}
```

### 2. Conflict Resolution

```typescript
// Handle conflicts between optimistic updates and realtime changes
class ConflictResolver {
  resolveConflict(
    optimisticUpdate: any,
    realtimeUpdate: any,
    lastKnownState: any
  ) {
    const resolution = {
      winner: null as 'optimistic' | 'realtime' | 'merge',
      mergedData: null as any,
      conflicts: [] as string[]
    }
    
    // Check timestamp-based resolution
    if (optimisticUpdate.timestamp > realtimeUpdate.updated_at) {
      resolution.winner = 'optimistic'
      resolution.mergedData = optimisticUpdate.data
    } else {
      resolution.winner = 'realtime'
      resolution.mergedData = realtimeUpdate
    }
    
    // Detect field-level conflicts
    const conflicts = this.detectFieldConflicts(
      optimisticUpdate.data,
      realtimeUpdate,
      lastKnownState
    )
    
    if (conflicts.length > 0) {
      resolution.conflicts = conflicts
      resolution.winner = 'merge'
      resolution.mergedData = this.mergeConflictingFields(
        optimisticUpdate.data,
        realtimeUpdate,
        conflicts
      )
    }
    
    return resolution
  }
  
  private detectFieldConflicts(optimistic: any, realtime: any, lastKnown: any) {
    const conflicts: string[] = []
    
    for (const field in optimistic) {
      if (
        optimistic[field] !== realtime[field] &&
        optimistic[field] !== lastKnown[field] &&
        realtime[field] !== lastKnown[field]
      ) {
        conflicts.push(field)
      }
    }
    
    return conflicts
  }
}
```

## Performance Optimization

### 1. Connection Management

```typescript
// Connection pool management for realtime
class RealtimeConnectionManager {
  private connections = new Map<string, RealtimeChannel>()
  private connectionLimit = 10
  
  getOrCreateChannel(channelName: string, config: any): RealtimeChannel {
    if (this.connections.has(channelName)) {
      return this.connections.get(channelName)!
    }
    
    if (this.connections.size >= this.connectionLimit) {
      // Remove least recently used connection
      const oldestChannel = this.findOldestChannel()
      this.closeChannel(oldestChannel)
    }
    
    const channel = supabase.channel(channelName, config)
    this.connections.set(channelName, channel)
    
    return channel
  }
  
  private findOldestChannel(): string {
    let oldestTime = Date.now()
    let oldestChannel = ''
    
    for (const [name, channel] of this.connections) {
      const lastActivity = (channel as any).lastActivity || 0
      if (lastActivity < oldestTime) {
        oldestTime = lastActivity
        oldestChannel = name
      }
    }
    
    return oldestChannel
  }
  
  closeChannel(channelName: string) {
    const channel = this.connections.get(channelName)
    if (channel) {
      channel.unsubscribe()
      this.connections.delete(channelName)
    }
  }
}
```

### 2. Event Batching

```typescript
// Batch multiple events to reduce UI thrashing
class EventBatcher {
  private batches = new Map<string, any[]>()
  private batchTimeout = 100 // ms
  
  addEvent(category: string, event: any) {
    if (!this.batches.has(category)) {
      this.batches.set(category, [])
      
      // Schedule batch processing
      setTimeout(() => {
        this.processBatch(category)
      }, this.batchTimeout)
    }
    
    this.batches.get(category)!.push(event)
  }
  
  private processBatch(category: string) {
    const events = this.batches.get(category) || []
    this.batches.delete(category)
    
    if (events.length === 0) return
    
    // Process events in batch
    switch (category) {
      case 'student_updates':
        this.processStudentUpdateBatch(events)
        break
      case 'enrollment_changes':
        this.processEnrollmentBatch(events)
        break
      case 'notifications':
        this.processNotificationBatch(events)
        break
    }
  }
  
  private processStudentUpdateBatch(events: any[]) {
    // Group events by student ID to avoid duplicate updates
    const studentUpdates = new Map<string, any>()
    
    for (const event of events) {
      const studentId = event.new?.id || event.old?.id
      if (studentId) {
        studentUpdates.set(studentId, event)
      }
    }
    
    // Apply final state for each student
    for (const [studentId, finalEvent] of studentUpdates) {
      this.applyStudentUpdate(finalEvent)
    }
  }
}
```

## Error Handling & Resilience

### 1. Connection Recovery

```typescript
// Automatic reconnection for realtime channels
class RealtimeConnectionRecovery {
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // ms
  
  setupConnectionRecovery(channel: RealtimeChannel) {
    channel.on('system', { event: 'error' }, (error) => {
      console.error('Realtime error:', error)
      this.handleConnectionError()
    })
    
    channel.on('system', { event: 'disconnect' }, () => {
      console.warn('Realtime disconnected')
      this.attemptReconnection()
    })
  }
  
  private async attemptReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      showErrorNotification('Real-time connection lost. Please refresh the page.')
      return
    }
    
    this.reconnectAttempts++
    
    await new Promise(resolve => 
      setTimeout(resolve, this.reconnectDelay * this.reconnectAttempts)
    )
    
    try {
      // Attempt to resubscribe
      await this.resubscribeChannels()
      this.reconnectAttempts = 0
      showSuccessNotification('Real-time connection restored')
    } catch (error) {
      console.error('Reconnection failed:', error)
      this.attemptReconnection()
    }
  }
}
```

### 2. Fallback Mechanisms

```typescript
// Polling fallback when realtime is unavailable
class RealtimeFallback {
  private pollingIntervals = new Map<string, NodeJS.Timeout>()
  private isRealtimeActive = true
  
  enablePollingFallback(entityType: string, pollInterval = 30000) {
    if (this.isRealtimeActive) return
    
    const intervalId = setInterval(async () => {
      try {
        await this.pollForUpdates(entityType)
      } catch (error) {
        console.error(`Polling failed for ${entityType}:`, error)
      }
    }, pollInterval)
    
    this.pollingIntervals.set(entityType, intervalId)
  }
  
  private async pollForUpdates(entityType: string) {
    const lastUpdate = localStorage.getItem(`last_${entityType}_update`)
    const timestamp = lastUpdate || new Date(Date.now() - 60000).toISOString()
    
    const { data } = await supabase
      .from(entityType)
      .select('*')
      .gte('updated_at', timestamp)
      .order('updated_at', { ascending: false })
    
    if (data && data.length > 0) {
      // Process updates
      for (const record of data) {
        this.simulateRealtimeUpdate(entityType, 'UPDATE', record)
      }
      
      // Update last poll timestamp
      localStorage.setItem(
        `last_${entityType}_update`, 
        new Date().toISOString()
      )
    }
  }
  
  disablePollingFallback() {
    for (const [entityType, intervalId] of this.pollingIntervals) {
      clearInterval(intervalId)
    }
    this.pollingIntervals.clear()
  }
}
```

This comprehensive real-time architecture provides:

1. **Multi-channel real-time updates** for organization, user, and entity-specific events
2. **Automated notification system** with intelligent routing and delivery
3. **Optimistic updates** with conflict resolution for better user experience
4. **Performance optimization** through connection management and event batching
5. **Resilience features** including automatic reconnection and polling fallbacks
6. **Type-safe implementations** with full TypeScript integration

The system ensures that all users receive immediate updates for critical educational workflows while maintaining performance and reliability at scale.