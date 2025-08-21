/**
 * Real-time Service for Harry School Mobile Apps
 * 
 * Provides comprehensive real-time functionality with educational context,
 * offline synchronization, and conflict resolution.
 * 
 * Features:
 * - Live attendance marking collaboration
 * - Real-time task updates and notifications
 * - Group activity feeds
 * - Presence indicators for teachers and students
 * - Offline event buffering
 * - Conflict resolution strategies
 * - Performance optimized subscriptions
 */

import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type { 
  RealtimeSubscriptionOptions, 
  RealtimeEvent, 
  SupabaseResponse 
} from '../types/supabase';
import { MobileSupabaseClient } from '../client';
import { ErrorHandler } from '../error-handler';
import { CacheManager } from '../cache';

/**
 * Real-time event types specific to educational context
 */
export interface EducationalRealtimeEvent<T = any> extends RealtimeEvent<T> {
  organizationId?: string;
  groupId?: string;
  studentId?: string;
  teacherId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'attendance' | 'task' | 'feedback' | 'ranking' | 'notification' | 'general';
}

/**
 * Subscription configuration for educational contexts
 */
export interface EducationalSubscriptionOptions extends RealtimeSubscriptionOptions {
  organizationId?: string;
  groupIds?: string[];
  studentId?: string;
  teacherId?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  bufferOfflineEvents?: boolean;
  conflictResolutionStrategy?: 'client_wins' | 'server_wins' | 'merge' | 'prompt_user';
}

/**
 * Presence data for users
 */
export interface UserPresence {
  userId: string;
  userType: 'student' | 'teacher' | 'admin';
  userName: string;
  organizationId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
  currentActivity?: string;
  location?: {
    screenName: string;
    groupId?: string;
  };
}

/**
 * Real-time collaboration data
 */
export interface CollaborationEvent {
  type: 'attendance_marking' | 'task_grading' | 'feedback_writing' | 'student_interaction';
  userId: string;
  userName: string;
  targetId: string; // ID of the entity being modified
  targetType: 'student' | 'group' | 'task' | 'attendance';
  action: 'start' | 'update' | 'complete' | 'cancel';
  timestamp: string;
  data?: any;
}

/**
 * Offline event buffer entry
 */
interface OfflineEventBuffer {
  id: string;
  event: EducationalRealtimeEvent;
  timestamp: number;
  retryCount: number;
  conflictResolved: boolean;
}

/**
 * Main Real-time Service Class
 */
export class RealtimeService {
  private client: MobileSupabaseClient;
  private errorHandler: ErrorHandler;
  private cacheManager: CacheManager;
  private subscriptions: Map<string, RealtimeChannel> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();
  private presenceChannel: RealtimeChannel | null = null;
  private currentPresence: UserPresence | null = null;
  private offlineBuffer: OfflineEventBuffer[] = [];
  private isOnline: boolean = true;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  
  constructor(client: MobileSupabaseClient) {
    this.client = client;
    this.errorHandler = new ErrorHandler();
    this.cacheManager = new CacheManager();
    
    // Monitor connection status
    this.client.onConnectionStatusChange((status) => {
      this.handleConnectionStatusChange(status);
    });
  }

  /**
   * Subscribe to real-time events with educational context
   */
  async subscribe<T>(
    options: EducationalSubscriptionOptions,
    callback: (event: EducationalRealtimeEvent<T>) => void
  ): Promise<SupabaseResponse<string>> {
    try {
      const supabaseClient = this.client.getClient();
      if (!supabaseClient) {
        return { 
          data: null, 
          error: { message: 'Supabase client not available' } 
        };
      }

      const subscriptionId = this.generateSubscriptionId(options);
      const channelName = this.buildChannelName(options);

      // Create channel
      const channel = supabaseClient.channel(channelName, {
        config: {
          presence: {
            key: options.studentId || options.teacherId || 'anonymous'
          }
        }
      });

      // Setup table change subscriptions
      if (options.table) {
        let changeConfig: any = {
          event: options.event || '*',
          table: options.table
        };

        // Add organization filter for multi-tenancy
        if (options.organizationId) {
          changeConfig.filter = `organization_id=eq.${options.organizationId}`;
        }

        // Add additional filters
        if (options.filter) {
          changeConfig.filter = changeConfig.filter 
            ? `${changeConfig.filter}&${options.filter}`
            : options.filter;
        }

        channel.on(
          'postgres_changes' as any,
          changeConfig,
          (payload: RealtimePostgresChangesPayload<T>) => {
            this.handleDatabaseChange(payload, options, callback);
          }
        );
      }

      // Setup presence tracking if enabled
      if (options.enablePresence !== false) {
        this.setupPresenceTracking(channel);
      }

      // Setup custom broadcast events
      channel.on('broadcast', { event: 'educational_event' }, (payload) => {
        this.handleBroadcastEvent(payload, callback);
      });

      // Subscribe to the channel
      const subscribeResult = await new Promise<{ error: any }>((resolve) => {
        channel.subscribe((status, err) => {
          resolve({ error: err });
        });
      });

      if (subscribeResult.error) {
        throw subscribeResult.error;
      }

      // Store subscription
      this.subscriptions.set(subscriptionId, channel);
      
      // Store event listener for potential offline buffering
      if (!this.eventListeners.has(subscriptionId)) {
        this.eventListeners.set(subscriptionId, []);
      }
      this.eventListeners.get(subscriptionId)!.push(callback);

      return { 
        data: subscriptionId, 
        error: null 
      };

    } catch (error) {
      this.errorHandler.logError('REALTIME_SUBSCRIBE_ERROR', error);
      return { 
        data: null, 
        error: { message: 'Failed to create real-time subscription' } 
      };
    }
  }

  /**
   * Unsubscribe from real-time events
   */
  async unsubscribe(subscriptionId: string): Promise<SupabaseResponse<boolean>> {
    try {
      const channel = this.subscriptions.get(subscriptionId);
      if (channel) {
        await channel.unsubscribe();
        this.subscriptions.delete(subscriptionId);
        this.eventListeners.delete(subscriptionId);
      }

      return { data: true, error: null };
    } catch (error) {
      this.errorHandler.logError('REALTIME_UNSUBSCRIBE_ERROR', error);
      return { 
        data: false, 
        error: { message: 'Failed to unsubscribe from real-time events' } 
      };
    }
  }

  /**
   * Broadcast educational event to specific channels
   */
  async broadcastEvent(
    channelName: string,
    event: Omit<EducationalRealtimeEvent, 'timestamp'>,
    targetUsers?: string[]
  ): Promise<SupabaseResponse<boolean>> {
    try {
      const supabaseClient = this.client.getClient();
      if (!supabaseClient) {
        return { 
          data: false, 
          error: { message: 'Supabase client not available' } 
        };
      }

      const fullEvent: EducationalRealtimeEvent = {
        ...event,
        timestamp: Date.now()
      };

      // If offline, buffer the event
      if (!this.isOnline) {
        this.bufferOfflineEvent(fullEvent);
        return { 
          data: true, 
          error: null,
          meta: { queueId: 'buffered' }
        };
      }

      const channel = supabaseClient.channel(channelName);
      
      await channel.send({
        type: 'broadcast',
        event: 'educational_event',
        payload: {
          ...fullEvent,
          targetUsers
        }
      });

      return { data: true, error: null };

    } catch (error) {
      this.errorHandler.logError('REALTIME_BROADCAST_ERROR', error);
      return { 
        data: false, 
        error: { message: 'Failed to broadcast event' } 
      };
    }
  }

  /**
   * Update user presence
   */
  async updatePresence(presence: Partial<UserPresence>): Promise<SupabaseResponse<boolean>> {
    try {
      if (!this.presenceChannel) {
        await this.initializePresence();
      }

      this.currentPresence = {
        ...this.currentPresence,
        ...presence,
        lastSeen: new Date().toISOString()
      } as UserPresence;

      if (this.presenceChannel && this.isOnline) {
        await this.presenceChannel.track(this.currentPresence);
      }

      return { data: true, error: null };

    } catch (error) {
      this.errorHandler.logError('PRESENCE_UPDATE_ERROR', error);
      return { 
        data: false, 
        error: { message: 'Failed to update presence' } 
      };
    }
  }

  /**
   * Get current presence data for users
   */
  async getPresence(channelName?: string): Promise<SupabaseResponse<UserPresence[]>> {
    try {
      const channel = channelName 
        ? this.subscriptions.get(channelName) 
        : this.presenceChannel;

      if (!channel) {
        return { 
          data: [], 
          error: { message: 'No presence channel available' } 
        };
      }

      const presenceState = channel.presenceState();
      const users: UserPresence[] = [];

      Object.values(presenceState).forEach((presences: any) => {
        presences.forEach((presence: any) => {
          users.push(presence as UserPresence);
        });
      });

      return { data: users, error: null };

    } catch (error) {
      this.errorHandler.logError('PRESENCE_GET_ERROR', error);
      return { 
        data: [], 
        error: { message: 'Failed to get presence data' } 
      };
    }
  }

  /**
   * Send collaboration event (for real-time editing indicators)
   */
  async sendCollaborationEvent(event: CollaborationEvent): Promise<SupabaseResponse<boolean>> {
    const channelName = `collaboration:${event.targetType}:${event.targetId}`;
    
    return this.broadcastEvent(channelName, {
      eventType: 'UPDATE',
      new: event,
      old: null,
      table: 'collaboration_events',
      category: 'general',
      priority: 'medium'
    });
  }

  /**
   * Subscribe to attendance marking collaboration
   */
  async subscribeToAttendanceCollaboration(
    groupId: string,
    callback: (event: CollaborationEvent) => void
  ): Promise<SupabaseResponse<string>> {
    return this.subscribe({
      table: 'attendance',
      filter: `group_id=eq.${groupId}`,
      enablePresence: true,
      bufferOfflineEvents: true,
      priority: 'high',
      groupIds: [groupId]
    }, (event) => {
      // Convert real-time event to collaboration event
      if (event.category === 'attendance') {
        const collaborationEvent: CollaborationEvent = {
          type: 'attendance_marking',
          userId: event.new?.created_by || 'unknown',
          userName: 'Teacher', // Would get from user data
          targetId: groupId,
          targetType: 'group',
          action: event.eventType === 'INSERT' ? 'complete' : 'update',
          timestamp: new Date().toISOString(),
          data: event.new
        };
        callback(collaborationEvent);
      }
    });
  }

  /**
   * Process offline event buffer when connection is restored
   */
  private async processOfflineBuffer(): Promise<void> {
    if (this.offlineBuffer.length === 0) return;

    const events = [...this.offlineBuffer];
    this.offlineBuffer = [];

    for (const bufferedEvent of events) {
      try {
        // Try to replay the event
        const listeners = this.eventListeners.get(bufferedEvent.id) || [];
        listeners.forEach(callback => {
          callback(bufferedEvent.event);
        });

        // Remove from buffer
        this.offlineBuffer = this.offlineBuffer.filter(e => e.id !== bufferedEvent.id);

      } catch (error) {
        this.errorHandler.logError('OFFLINE_BUFFER_PROCESS_ERROR', error);
        
        // Increment retry count
        bufferedEvent.retryCount++;
        
        // If max retries reached, remove from buffer
        if (bufferedEvent.retryCount >= 3) {
          this.offlineBuffer = this.offlineBuffer.filter(e => e.id !== bufferedEvent.id);
        }
      }
    }
  }

  /**
   * Handle connection status changes
   */
  private async handleConnectionStatusChange(status: string): Promise<void> {
    const wasOnline = this.isOnline;
    this.isOnline = status === 'connected';

    if (!wasOnline && this.isOnline) {
      // Connection restored
      this.reconnectAttempts = 0;
      await this.processOfflineBuffer();
      
      // Re-establish presence
      if (this.currentPresence) {
        await this.updatePresence({});
      }

    } else if (wasOnline && !this.isOnline) {
      // Connection lost
      this.handleConnectionLoss();
    }
  }

  /**
   * Handle connection loss
   */
  private handleConnectionLoss(): void {
    // Update presence to offline
    if (this.currentPresence) {
      this.currentPresence.status = 'offline';
      this.currentPresence.lastSeen = new Date().toISOString();
    }
  }

  /**
   * Handle database change events
   */
  private handleDatabaseChange<T>(
    payload: RealtimePostgresChangesPayload<T>,
    options: EducationalSubscriptionOptions,
    callback: (event: EducationalRealtimeEvent<T>) => void
  ): void {
    const event: EducationalRealtimeEvent<T> = {
      eventType: payload.eventType as any,
      new: payload.new,
      old: payload.old,
      timestamp: Date.now(),
      table: payload.table,
      organizationId: options.organizationId,
      groupId: options.groupIds?.[0],
      priority: options.priority || 'medium',
      category: this.categorizeEvent(payload.table, payload.eventType)
    };

    // Add educational context
    this.enrichEducationalContext(event, payload);

    // Cache recent events for offline sync
    this.cacheRecentEvent(event);

    // Execute callback
    callback(event);
  }

  /**
   * Handle broadcast events
   */
  private handleBroadcastEvent<T>(
    payload: any,
    callback: (event: EducationalRealtimeEvent<T>) => void
  ): void {
    if (payload.payload && payload.payload.targetUsers) {
      // Check if this user is a target
      const currentUserId = this.currentPresence?.userId;
      if (currentUserId && !payload.payload.targetUsers.includes(currentUserId)) {
        return; // Event not for this user
      }
    }

    callback(payload.payload);
  }

  /**
   * Setup presence tracking
   */
  private setupPresenceTracking(channel: RealtimeChannel): void {
    if (this.currentPresence) {
      channel.track(this.currentPresence);
    }

    // Listen for presence changes
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      // Handle presence updates
    });

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      // Handle user join
    });

    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      // Handle user leave  
    });
  }

  /**
   * Initialize presence channel
   */
  private async initializePresence(): Promise<void> {
    const supabaseClient = this.client.getClient();
    if (!supabaseClient || !this.currentPresence) return;

    this.presenceChannel = supabaseClient.channel('presence', {
      config: {
        presence: {
          key: this.currentPresence.userId
        }
      }
    });

    await new Promise<void>((resolve, reject) => {
      this.presenceChannel!.subscribe((status, err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Buffer offline event
   */
  private bufferOfflineEvent(event: EducationalRealtimeEvent): void {
    const bufferedEvent: OfflineEventBuffer = {
      id: this.generateEventId(),
      event,
      timestamp: Date.now(),
      retryCount: 0,
      conflictResolved: false
    };

    this.offlineBuffer.push(bufferedEvent);

    // Limit buffer size
    if (this.offlineBuffer.length > 100) {
      this.offlineBuffer = this.offlineBuffer.slice(-100);
    }
  }

  /**
   * Categorize event based on table and type
   */
  private categorizeEvent(table: string, eventType: string): EducationalRealtimeEvent['category'] {
    if (table === 'attendance') return 'attendance';
    if (table === 'home_tasks') return 'task';
    if (table === 'feedback') return 'feedback';
    if (table === 'student_ranking' || table === 'teacher_ranking') return 'ranking';
    if (table === 'notifications') return 'notification';
    return 'general';
  }

  /**
   * Enrich event with educational context
   */
  private enrichEducationalContext<T>(
    event: EducationalRealtimeEvent<T>,
    payload: RealtimePostgresChangesPayload<T>
  ): void {
    // Add student/teacher/group IDs based on table structure
    const record = payload.new || payload.old;
    if (record && typeof record === 'object') {
      if ('student_id' in record) {
        event.studentId = (record as any).student_id;
      }
      if ('teacher_id' in record) {
        event.teacherId = (record as any).teacher_id;
      }
      if ('group_id' in record) {
        event.groupId = (record as any).group_id;
      }
      if ('organization_id' in record) {
        event.organizationId = (record as any).organization_id;
      }
    }
  }

  /**
   * Cache recent event for offline sync
   */
  private cacheRecentEvent(event: EducationalRealtimeEvent): void {
    const cacheKey = `realtime:recent:${event.table}`;
    const cached = this.cacheManager.get<EducationalRealtimeEvent[]>(cacheKey) || [];
    
    cached.push(event);
    
    // Keep only last 50 events per table
    const recent = cached.slice(-50);
    this.cacheManager.set(cacheKey, recent, 300000); // 5 minutes
  }

  /**
   * Generate subscription ID
   */
  private generateSubscriptionId(options: EducationalSubscriptionOptions): string {
    const parts = [
      options.table,
      options.organizationId,
      options.groupIds?.join(','),
      options.studentId,
      options.teacherId,
      options.event
    ].filter(Boolean);
    
    return `sub_${parts.join('_')}_${Date.now()}`;
  }

  /**
   * Build channel name from options
   */
  private buildChannelName(options: EducationalSubscriptionOptions): string {
    const parts = ['harry_school'];
    
    if (options.organizationId) {
      parts.push(`org_${options.organizationId}`);
    }
    
    if (options.table) {
      parts.push(options.table);
    }
    
    if (options.groupIds?.length) {
      parts.push(`groups_${options.groupIds.join('_')}`);
    }
    
    return parts.join(':');
  }

  /**
   * Generate event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get real-time statistics
   */
  getRealtimeStats(): {
    activeSubscriptions: number;
    bufferedEvents: number;
    isOnline: boolean;
    reconnectAttempts: number;
    presenceUsers: number;
  } {
    return {
      activeSubscriptions: this.subscriptions.size,
      bufferedEvents: this.offlineBuffer.length,
      isOnline: this.isOnline,
      reconnectAttempts: this.reconnectAttempts,
      presenceUsers: 0 // Would need to calculate from presence data
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Unsubscribe from all channels
    for (const [id, channel] of this.subscriptions.entries()) {
      try {
        await channel.unsubscribe();
      } catch (error) {
        this.errorHandler.logError('CLEANUP_UNSUBSCRIBE_ERROR', error);
      }
    }

    // Clear presence
    if (this.presenceChannel) {
      try {
        await this.presenceChannel.unsubscribe();
      } catch (error) {
        this.errorHandler.logError('CLEANUP_PRESENCE_ERROR', error);
      }
    }

    // Clear data
    this.subscriptions.clear();
    this.eventListeners.clear();
    this.offlineBuffer = [];
    this.currentPresence = null;
    this.presenceChannel = null;
  }
}

export default RealtimeService;