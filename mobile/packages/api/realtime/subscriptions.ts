/**
 * Harry School CRM - Real-time Subscriptions Service
 * Comprehensive real-time features for Student and Teacher mobile apps
 * 
 * Based on enterprise-grade patterns with Islamic values integration
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventEmitter } from 'events';

// Types and Interfaces
export interface RealtimeSubscriptionConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  organizationId: string;
  userId: string;
  userRole: 'student' | 'teacher' | 'admin';
  culturalContext: 'islamic' | 'uzbekistan' | 'multilingual';
  prayerTimeSettings?: PrayerTimeSettings;
}

export interface PrayerTimeSettings {
  enabled: boolean;
  quietHours: { start: string; end: string }[];
  ramadanMode: boolean;
  culturalPriority: 'high' | 'medium' | 'low';
}

export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  payload: any;
  timestamp: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  culturalContext?: string;
  expiresAt?: string;
  sourceUserId?: string;
  organizationId: string;
}

export type RealtimeEventType = 
  // Student-specific events
  | 'ranking_updated' | 'new_task_assigned' | 'achievement_earned' 
  | 'lesson_started' | 'feedback_received' | 'reward_available'
  // Teacher-specific events  
  | 'attendance_marked' | 'student_progress' | 'parent_message'
  | 'lesson_completed' | 'assignment_submitted' | 'urgent_notification'
  // System events
  | 'system_announcement' | 'schedule_changed' | 'cultural_reminder'
  | 'prayer_time_notification' | 'islamic_event' | 'maintenance_alert';

export interface SubscriptionState {
  connected: boolean;
  subscriptions: Map<string, RealtimeChannel>;
  eventQueue: RealtimeEvent[];
  lastHeartbeat: Date;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  offlineMode: boolean;
  culturalContextActive: boolean;
}

export interface NotificationSubscription {
  id: string;
  eventTypes: RealtimeEventType[];
  filters: Record<string, any>;
  isActive: boolean;
  priority: number;
  culturalSettings: {
    respectPrayerTimes: boolean;
    islamicValuesFilter: boolean;
    familyTimeRespect: boolean;
  };
}

// Main Real-time Subscriptions Service
export class RealtimeSubscriptionsService extends EventEmitter {
  private supabase: SupabaseClient;
  private config: RealtimeSubscriptionConfig;
  private state: SubscriptionState;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private offlineQueue: RealtimeEvent[] = [];

  constructor(config: RealtimeSubscriptionConfig) {
    super();
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
    
    this.state = {
      connected: false,
      subscriptions: new Map(),
      eventQueue: [],
      lastHeartbeat: new Date(),
      connectionQuality: 'offline',
      offlineMode: false,
      culturalContextActive: config.culturalContext === 'islamic',
    };

    this.initializeService();
  }

  // Service Initialization
  private async initializeService(): Promise<void> {
    try {
      // Load offline queue from storage
      await this.loadOfflineQueue();
      
      // Set up cultural context
      await this.initializeCulturalContext();
      
      // Start connection
      await this.connect();
      
      // Start heartbeat monitoring
      this.startHeartbeat();
      
      console.log('RealTime Subscriptions Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RealTime Subscriptions Service:', error);
      this.emit('initialization_error', error);
    }
  }

  // Connection Management
  public async connect(): Promise<void> {
    try {
      if (this.state.connected) {
        return;
      }

      // Check network connectivity
      const isOnline = await this.checkConnectivity();
      if (!isOnline) {
        this.enableOfflineMode();
        return;
      }

      // Authenticate with Supabase
      const authResult = await this.authenticateUser();
      if (!authResult.success) {
        throw new Error('Authentication failed');
      }

      // Set up real-time subscriptions based on user role
      await this.setupSubscriptions();
      
      this.state.connected = true;
      this.state.offlineMode = false;
      this.state.connectionQuality = 'excellent';
      this.reconnectAttempts = 0;

      // Process offline queue
      await this.processOfflineQueue();

      this.emit('connected');
      console.log('Real-time connection established');
    } catch (error) {
      console.error('Connection failed:', error);
      this.handleConnectionError(error);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      // Save offline queue
      await this.saveOfflineQueue();
      
      // Close all subscriptions
      for (const [key, channel] of this.state.subscriptions) {
        await this.supabase.removeChannel(channel);
      }
      
      this.state.subscriptions.clear();
      this.state.connected = false;
      
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      this.emit('disconnected');
      console.log('Real-time connection closed');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  // Subscription Management
  private async setupSubscriptions(): Promise<void> {
    const userRole = this.config.userRole;
    const organizationId = this.config.organizationId;
    const userId = this.config.userId;

    try {
      // Universal subscriptions (all roles)
      await this.subscribeToSystemAnnouncements();
      await this.subscribeToCulturalEvents();
      
      // Role-specific subscriptions
      if (userRole === 'student') {
        await this.setupStudentSubscriptions(userId, organizationId);
      } else if (userRole === 'teacher') {
        await this.setupTeacherSubscriptions(userId, organizationId);
      }

      // User-specific notifications
      await this.subscribeToUserNotifications(userId);
      
    } catch (error) {
      console.error('Failed to setup subscriptions:', error);
      throw error;
    }
  }

  // Student Subscriptions
  private async setupStudentSubscriptions(userId: string, organizationId: string): Promise<void> {
    // Student ranking updates
    const rankingChannel = this.supabase
      .channel(`student_rankings_${organizationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'student_rankings',
        filter: `organization_id=eq.${organizationId}`,
      }, (payload) => {
        this.handleRankingUpdate(payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'student_points',
        filter: `student_id=eq.${userId}`,
      }, (payload) => {
        this.handlePointsUpdate(payload);
      })
      .subscribe();

    this.state.subscriptions.set('student_rankings', rankingChannel);

    // New task assignments
    const tasksChannel = this.supabase
      .channel(`student_tasks_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'student_tasks',
        filter: `student_id=eq.${userId}`,
      }, (payload) => {
        this.handleNewTaskAssigned(payload);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'student_tasks',
        filter: `student_id=eq.${userId}`,
      }, (payload) => {
        this.handleTaskUpdated(payload);
      })
      .subscribe();

    this.state.subscriptions.set('student_tasks', tasksChannel);

    // Achievement notifications
    const achievementsChannel = this.supabase
      .channel(`student_achievements_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'student_achievements',
        filter: `student_id=eq.${userId}`,
      }, (payload) => {
        this.handleAchievementEarned(payload);
      })
      .subscribe();

    this.state.subscriptions.set('student_achievements', achievementsChannel);

    // Lesson updates
    const lessonsChannel = this.supabase
      .channel(`student_lessons_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'lesson_sessions',
        filter: `organization_id=eq.${organizationId}`,
      }, (payload) => {
        this.handleLessonUpdate(payload);
      })
      .subscribe();

    this.state.subscriptions.set('student_lessons', lessonsChannel);
  }

  // Teacher Subscriptions
  private async setupTeacherSubscriptions(userId: string, organizationId: string): Promise<void> {
    // Attendance updates
    const attendanceChannel = this.supabase
      .channel(`teacher_attendance_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'attendance_records',
        filter: `organization_id=eq.${organizationId}`,
      }, (payload) => {
        this.handleAttendanceUpdate(payload);
      })
      .subscribe();

    this.state.subscriptions.set('teacher_attendance', attendanceChannel);

    // Student progress updates
    const progressChannel = this.supabase
      .channel(`teacher_progress_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'student_progress',
        filter: `organization_id=eq.${organizationId}`,
      }, (payload) => {
        this.handleStudentProgressUpdate(payload);
      })
      .subscribe();

    this.state.subscriptions.set('teacher_progress', progressChannel);

    // Assignment submissions
    const submissionsChannel = this.supabase
      .channel(`teacher_submissions_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'assignment_submissions',
        filter: `organization_id=eq.${organizationId}`,
      }, (payload) => {
        this.handleAssignmentSubmission(payload);
      })
      .subscribe();

    this.state.subscriptions.set('teacher_submissions', submissionsChannel);

    // Parent communications
    const communicationsChannel = this.supabase
      .channel(`teacher_communications_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'parent_communications',
        filter: `teacher_id=eq.${userId}`,
      }, (payload) => {
        this.handleParentMessage(payload);
      })
      .subscribe();

    this.state.subscriptions.set('teacher_communications', communicationsChannel);
  }

  // Universal Subscriptions
  private async subscribeToSystemAnnouncements(): Promise<void> {
    const announcementsChannel = this.supabase
      .channel(`system_announcements_${this.config.organizationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'system_announcements',
        filter: `organization_id=eq.${this.config.organizationId}`,
      }, (payload) => {
        this.handleSystemAnnouncement(payload);
      })
      .subscribe();

    this.state.subscriptions.set('system_announcements', announcementsChannel);
  }

  private async subscribeToCulturalEvents(): Promise<void> {
    if (!this.state.culturalContextActive) {
      return;
    }

    const culturalChannel = this.supabase
      .channel(`cultural_events_${this.config.organizationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'cultural_events',
        filter: `organization_id=eq.${this.config.organizationId}`,
      }, (payload) => {
        this.handleCulturalEvent(payload);
      })
      .subscribe();

    this.state.subscriptions.set('cultural_events', culturalChannel);
  }

  private async subscribeToUserNotifications(userId: string): Promise<void> {
    const notificationsChannel = this.supabase
      .channel(`user_notifications_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'push_notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        this.handleUserNotification(payload);
      })
      .subscribe();

    this.state.subscriptions.set('user_notifications', notificationsChannel);
  }

  // Event Handlers
  private handleRankingUpdate(payload: any): void {
    const event: RealtimeEvent = {
      id: `ranking_${Date.now()}`,
      type: 'ranking_updated',
      payload: payload.new,
      timestamp: new Date().toISOString(),
      priority: 'high',
      organizationId: this.config.organizationId,
    };

    this.processEvent(event);
  }

  private handlePointsUpdate(payload: any): void {
    const event: RealtimeEvent = {
      id: `points_${Date.now()}`,
      type: 'ranking_updated',
      payload: {
        type: 'points_update',
        data: payload.new,
        previous: payload.old,
      },
      timestamp: new Date().toISOString(),
      priority: 'normal',
      organizationId: this.config.organizationId,
    };

    this.processEvent(event);
  }

  private handleNewTaskAssigned(payload: any): void {
    const event: RealtimeEvent = {
      id: `task_${payload.new.id}`,
      type: 'new_task_assigned',
      payload: payload.new,
      timestamp: new Date().toISOString(),
      priority: 'high',
      organizationId: this.config.organizationId,
    };

    this.processEvent(event);
  }

  private handleTaskUpdated(payload: any): void {
    const event: RealtimeEvent = {
      id: `task_update_${payload.new.id}`,
      type: 'new_task_assigned',
      payload: {
        type: 'task_update',
        data: payload.new,
        previous: payload.old,
      },
      timestamp: new Date().toISOString(),
      priority: 'normal',
      organizationId: this.config.organizationId,
    };

    this.processEvent(event);
  }

  private handleAchievementEarned(payload: any): void {
    const event: RealtimeEvent = {
      id: `achievement_${payload.new.id}`,
      type: 'achievement_earned',
      payload: payload.new,
      timestamp: new Date().toISOString(),
      priority: 'high',
      culturalContext: 'celebration',
      organizationId: this.config.organizationId,
    };

    this.processEvent(event);
  }

  private handleLessonUpdate(payload: any): void {
    const event: RealtimeEvent = {
      id: `lesson_${payload.new.id}`,
      type: 'lesson_started',
      payload: payload.new,
      timestamp: new Date().toISOString(),
      priority: 'normal',
      organizationId: this.config.organizationId,
    };

    this.processEvent(event);
  }

  private handleAttendanceUpdate(payload: any): void {
    const event: RealtimeEvent = {
      id: `attendance_${payload.new.id}`,
      type: 'attendance_marked',
      payload: payload.new,
      timestamp: new Date().toISOString(),
      priority: 'normal',
      organizationId: this.config.organizationId,
    };

    this.processEvent(event);
  }

  private handleStudentProgressUpdate(payload: any): void {
    const event: RealtimeEvent = {
      id: `progress_${payload.new.id}`,
      type: 'student_progress',
      payload: payload.new,
      timestamp: new Date().toISOString(),
      priority: 'normal',
      organizationId: this.config.organizationId,
    };

    this.processEvent(event);
  }

  private handleAssignmentSubmission(payload: any): void {
    const event: RealtimeEvent = {
      id: `submission_${payload.new.id}`,
      type: 'assignment_submitted',
      payload: payload.new,
      timestamp: new Date().toISOString(),
      priority: 'high',
      organizationId: this.config.organizationId,
    };

    this.processEvent(event);
  }

  private handleParentMessage(payload: any): void {
    const event: RealtimeEvent = {
      id: `parent_msg_${payload.new.id}`,
      type: 'parent_message',
      payload: payload.new,
      timestamp: new Date().toISOString(),
      priority: 'urgent',
      organizationId: this.config.organizationId,
    };

    this.processEvent(event);
  }

  private handleSystemAnnouncement(payload: any): void {
    const event: RealtimeEvent = {
      id: `announcement_${payload.new.id}`,
      type: 'system_announcement',
      payload: payload.new,
      timestamp: new Date().toISOString(),
      priority: payload.new.priority || 'normal',
      organizationId: this.config.organizationId,
    };

    this.processEvent(event);
  }

  private handleCulturalEvent(payload: any): void {
    const event: RealtimeEvent = {
      id: `cultural_${payload.new.id}`,
      type: payload.new.event_type || 'cultural_reminder',
      payload: payload.new,
      timestamp: new Date().toISOString(),
      priority: 'normal',
      culturalContext: 'islamic',
      organizationId: this.config.organizationId,
    };

    this.processEvent(event);
  }

  private handleUserNotification(payload: any): void {
    const event: RealtimeEvent = {
      id: `notification_${payload.new.id}`,
      type: payload.new.notification_type,
      payload: payload.new,
      timestamp: new Date().toISOString(),
      priority: payload.new.priority || 'normal',
      organizationId: this.config.organizationId,
    };

    this.processEvent(event);
  }

  // Event Processing
  private async processEvent(event: RealtimeEvent): Promise<void> {
    try {
      // Check cultural context and prayer times
      if (await this.shouldRespectCulturalContext(event)) {
        await this.queueEventForLater(event);
        return;
      }

      // Add to event queue
      this.state.eventQueue.push(event);

      // Emit event for listeners
      this.emit('realtime_event', event);
      this.emit(event.type, event);

      // Process offline queue if we just came online
      if (!this.state.offlineMode && this.offlineQueue.length > 0) {
        await this.processOfflineQueue();
      }

    } catch (error) {
      console.error('Error processing event:', error);
      
      // Add to offline queue if processing fails
      this.offlineQueue.push(event);
      await this.saveOfflineQueue();
    }
  }

  // Cultural Context Management
  private async initializeCulturalContext(): Promise<void> {
    if (this.config.culturalContext === 'islamic') {
      // Initialize prayer time calculations
      // This would integrate with a prayer time calculation library
      console.log('Islamic cultural context initialized');
    }
  }

  private async shouldRespectCulturalContext(event: RealtimeEvent): Promise<boolean> {
    if (!this.config.prayerTimeSettings?.enabled) {
      return false;
    }

    // Check if current time is during prayer or quiet hours
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    for (const quietHour of this.config.prayerTimeSettings.quietHours) {
      if (currentTime >= quietHour.start && currentTime <= quietHour.end) {
        // Respect prayer times for non-urgent events
        return event.priority !== 'urgent';
      }
    }

    return false;
  }

  private async queueEventForLater(event: RealtimeEvent): Promise<void> {
    // Calculate when to deliver the event (after prayer time)
    const deliveryTime = this.calculateNextDeliveryTime();
    event.expiresAt = deliveryTime.toISOString();
    
    this.offlineQueue.push(event);
    await this.saveOfflineQueue();
  }

  private calculateNextDeliveryTime(): Date {
    // This would calculate the next appropriate delivery time
    // based on prayer schedules and cultural settings
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Simple 30-minute delay
    return now;
  }

  // Offline Management
  private async enableOfflineMode(): Promise<void> {
    this.state.offlineMode = true;
    this.state.connectionQuality = 'offline';
    this.emit('offline_mode_enabled');
    console.log('Offline mode enabled');
  }

  private async loadOfflineQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('realtime_offline_queue');
      if (queueData) {
        this.offlineQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  private async saveOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'realtime_offline_queue',
        JSON.stringify(this.offlineQueue)
      );
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) {
      return;
    }

    const validEvents = this.offlineQueue.filter(event => {
      // Remove expired events
      if (event.expiresAt && new Date(event.expiresAt) < new Date()) {
        return false;
      }
      return true;
    });

    // Process valid events
    for (const event of validEvents) {
      await this.processEvent(event);
    }

    // Clear processed events
    this.offlineQueue = [];
    await this.saveOfflineQueue();
  }

  // Connection Quality Management
  private async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch(this.config.supabaseUrl + '/rest/v1/', {
        method: 'HEAD',
        timeout: 5000,
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      if (this.state.connected) {
        const isOnline = await this.checkConnectivity();
        
        if (!isOnline) {
          this.state.connectionQuality = 'poor';
          this.emit('connection_quality_changed', 'poor');
        } else {
          this.state.connectionQuality = 'excellent';
          this.state.lastHeartbeat = new Date();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private async authenticateUser(): Promise<{ success: boolean; error?: string }> {
    try {
      // This would use the existing auth token from the app
      // For now, we'll assume authentication is handled elsewhere
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  private handleConnectionError(error: any): void {
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      setTimeout(() => {
        console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect();
      }, delay);
    } else {
      console.log('Max reconnect attempts reached, enabling offline mode');
      this.enableOfflineMode();
    }

    this.emit('connection_error', { error, attempt: this.reconnectAttempts });
  }

  // Public API Methods
  public async subscribeToEvents(
    eventTypes: RealtimeEventType[],
    callback: (event: RealtimeEvent) => void,
    filters?: Record<string, any>
  ): Promise<string> {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: NotificationSubscription = {
      id: subscriptionId,
      eventTypes,
      filters: filters || {},
      isActive: true,
      priority: 1,
      culturalSettings: {
        respectPrayerTimes: this.config.culturalContext === 'islamic',
        islamicValuesFilter: this.config.culturalContext === 'islamic',
        familyTimeRespect: true,
      },
    };

    // Set up event listener
    eventTypes.forEach(eventType => {
      this.on(eventType, (event: RealtimeEvent) => {
        if (subscription.isActive && this.matchesFilters(event, subscription.filters)) {
          callback(event);
        }
      });
    });

    return subscriptionId;
  }

  public async unsubscribeFromEvents(subscriptionId: string): Promise<void> {
    // Remove listeners for this subscription
    this.removeAllListeners(subscriptionId);
  }

  public getConnectionState(): SubscriptionState {
    return { ...this.state };
  }

  public async clearEventQueue(): Promise<void> {
    this.state.eventQueue = [];
  }

  public async getEventHistory(limit: number = 50): Promise<RealtimeEvent[]> {
    return this.state.eventQueue.slice(-limit);
  }

  // Utility Methods
  private matchesFilters(event: RealtimeEvent, filters: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      if (event.payload[key] !== value) {
        return false;
      }
    }
    return true;
  }

  // Cleanup
  public async destroy(): Promise<void> {
    await this.disconnect();
    this.removeAllListeners();
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}

// Factory function for creating service instance
export function createRealtimeSubscriptionsService(
  config: RealtimeSubscriptionConfig
): RealtimeSubscriptionsService {
  return new RealtimeSubscriptionsService(config);
}

// Export default instance creator
export default createRealtimeSubscriptionsService;