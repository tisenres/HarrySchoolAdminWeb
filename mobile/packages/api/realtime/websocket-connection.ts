/**
 * Harry School CRM - WebSocket Connection Service with Supabase
 * Handles real-time database connections, subscriptions, and offline management
 * 
 * Features enterprise-grade connection management and Islamic cultural integration
 */

import { createClient, SupabaseClient, RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { EventEmitter } from 'events';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types and Interfaces
export interface WebSocketConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  organizationId: string;
  userId: string;
  userRole: 'student' | 'teacher' | 'admin';
  enableHeartbeat: boolean;
  heartbeatInterval: number;
  reconnectAttempts: number;
  reconnectDelay: number;
  culturalSettings: {
    respectPrayerTimes: boolean;
    enableIslamicNotifications: boolean;
    familyTimeRespect: boolean;
  };
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  lastConnected: Date | null;
  reconnectAttempts: number;
  subscriptions: Map<string, RealtimeChannel>;
  queuedEvents: QueuedEvent[];
  networkQuality: 'excellent' | 'good' | 'poor' | 'offline';
  culturalMode: boolean;
}

export interface QueuedEvent {
  id: string;
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: string;
  retries: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface SubscriptionConfig {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  schema?: string;
  callback: (payload: RealtimePostgresChangesPayload<any>) => void;
  errorCallback?: (error: Error) => void;
  culturalFiltering?: boolean;
}

export interface RealtimeEventData {
  id: string;
  organization_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  payload: any;
  user_id?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  cultural_context?: any;
  created_at: string;
  expires_at?: string;
}

export interface ConnectionMetrics {
  totalConnections: number;
  averageLatency: number;
  messagesReceived: number;
  messagesSent: number;
  reconnections: number;
  culturalDelays: number;
  lastHeartbeat: Date | null;
}

// WebSocket Connection Service with Supabase
export class WebSocketConnectionService extends EventEmitter {
  private config: WebSocketConfig;
  private supabase: SupabaseClient;
  private state: ConnectionState;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private metrics: ConnectionMetrics;
  private isDestroyed = false;

  constructor(config: WebSocketConfig) {
    super();
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    
    this.state = {
      status: 'disconnected',
      lastConnected: null,
      reconnectAttempts: 0,
      subscriptions: new Map(),
      queuedEvents: [],
      networkQuality: 'offline',
      culturalMode: config.culturalSettings.respectPrayerTimes,
    };

    this.metrics = {
      totalConnections: 0,
      averageLatency: 0,
      messagesReceived: 0,
      messagesSent: 0,
      reconnections: 0,
      culturalDelays: 0,
      lastHeartbeat: null,
    };

    this.initializeConnection();
  }

  // Connection Management
  private async initializeConnection(): Promise<void> {
    try {
      await this.loadQueuedEvents();
      await this.connect();
    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
      this.emit('connection_error', error);
    }
  }

  public async connect(): Promise<void> {
    if (this.isDestroyed || this.state.status === 'connected' || this.state.status === 'connecting') {
      return;
    }

    this.state.status = 'connecting';
    this.emit('connection_state_changed', 'connecting');

    try {
      // Test basic connectivity
      const connectivityTest = await this.testConnectivity();
      if (!connectivityTest.success) {
        throw new Error('Connectivity test failed: ' + connectivityTest.error);
      }

      // Authenticate with Supabase
      const authResult = await this.authenticateConnection();
      if (!authResult.success) {
        throw new Error('Authentication failed: ' + authResult.error);
      }

      // Set up realtime subscription for events
      await this.setupRealtimeSubscriptions();

      // Start heartbeat
      if (this.config.enableHeartbeat) {
        this.startHeartbeat();
      }

      // Update state
      this.state.status = 'connected';
      this.state.lastConnected = new Date();
      this.state.reconnectAttempts = 0;
      this.state.networkQuality = 'excellent';
      this.metrics.totalConnections++;

      this.emit('connected');
      this.emit('connection_state_changed', 'connected');

      // Process queued events
      await this.processQueuedEvents();

      console.log('WebSocket connection established successfully');
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.state.status = 'error';
      this.emit('connection_error', error);
      this.emit('connection_state_changed', 'error');
      
      this.scheduleReconnect();
    }
  }

  public async disconnect(): Promise<void> {
    try {
      this.state.status = 'disconnected';
      
      // Stop heartbeat
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }

      // Stop reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      // Close all subscriptions
      for (const [key, channel] of this.state.subscriptions) {
        await this.supabase.removeChannel(channel);
      }
      this.state.subscriptions.clear();

      // Save queued events
      await this.saveQueuedEvents();

      this.emit('disconnected');
      this.emit('connection_state_changed', 'disconnected');
      
      console.log('WebSocket connection closed');
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  }

  // Subscription Management
  public async subscribe(config: SubscriptionConfig): Promise<string> {
    const subscriptionId = `${config.table}_${config.event}_${Date.now()}`;
    
    try {
      const channel = this.supabase
        .channel(`subscription_${subscriptionId}`)
        .on('postgres_changes', {
          event: config.event,
          schema: config.schema || 'public',
          table: config.table,
          filter: config.filter,
        }, async (payload) => {
          try {
            // Apply cultural filtering if enabled
            if (config.culturalFiltering && await this.shouldFilterCulturally(payload)) {
              return;
            }

            this.metrics.messagesReceived++;
            config.callback(payload);
          } catch (error) {
            console.error('Error in subscription callback:', error);
            if (config.errorCallback) {
              config.errorCallback(error as Error);
            }
          }
        })
        .subscribe((status) => {
          console.log(`Subscription ${subscriptionId} status:`, status);
          
          if (status === 'SUBSCRIBED') {
            this.emit('subscription_active', subscriptionId);
          } else if (status === 'CHANNEL_ERROR') {
            this.emit('subscription_error', subscriptionId);
            if (config.errorCallback) {
              config.errorCallback(new Error('Channel error'));
            }
          }
        });

      this.state.subscriptions.set(subscriptionId, channel);
      this.emit('subscription_created', subscriptionId);
      
      return subscriptionId;
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  public async unsubscribe(subscriptionId: string): Promise<void> {
    const channel = this.state.subscriptions.get(subscriptionId);
    
    if (channel) {
      try {
        await this.supabase.removeChannel(channel);
        this.state.subscriptions.delete(subscriptionId);
        this.emit('subscription_removed', subscriptionId);
      } catch (error) {
        console.error('Failed to unsubscribe:', subscriptionId, error);
      }
    }
  }

  // Real-time Event Publishing
  public async publishEvent(eventData: Omit<RealtimeEventData, 'id' | 'created_at'>): Promise<void> {
    try {
      // Check cultural considerations before publishing
      if (await this.shouldDelayCulturally(eventData)) {
        await this.queueEventForLater(eventData);
        return;
      }

      const fullEventData: RealtimeEventData = {
        ...eventData,
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
      };

      if (this.state.status === 'connected') {
        // Insert into realtime_events table to trigger real-time notifications
        const { error } = await this.supabase
          .from('realtime_events')
          .insert(fullEventData);

        if (error) {
          throw error;
        }

        this.metrics.messagesSent++;
        this.emit('event_published', fullEventData);
      } else {
        // Queue for later delivery
        await this.queueEventForLater(eventData);
      }
    } catch (error) {
      console.error('Failed to publish event:', error);
      await this.queueEventForLater(eventData);
    }
  }

  // Cultural Filtering and Delays
  private async shouldFilterCulturally(payload: any): Promise<boolean> {
    if (!this.state.culturalMode) {
      return false;
    }

    // Check if event should be filtered based on cultural context
    const culturalContext = payload.new?.cultural_context || payload.old?.cultural_context;
    
    if (culturalContext) {
      // Filter inappropriate content during prayer times
      if (this.config.culturalSettings.respectPrayerTimes && await this.isDuringPrayerTime()) {
        if (culturalContext.prayer_time_sensitive) {
          this.metrics.culturalDelays++;
          return true;
        }
      }

      // Filter family-inappropriate content during family time
      if (this.config.culturalSettings.familyTimeRespect && await this.isFamilyTime()) {
        if (culturalContext.family_time_sensitive) {
          return true;
        }
      }
    }

    return false;
  }

  private async shouldDelayCulturally(eventData: any): Promise<boolean> {
    if (!this.state.culturalMode) {
      return false;
    }

    // Check for Islamic content during inappropriate times
    if (eventData.cultural_context?.islamic_content) {
      if (await this.isDuringPrayerTime()) {
        return true;
      }
    }

    // Check for family notifications during quiet hours
    if (eventData.priority !== 'urgent' && await this.isQuietTime()) {
      return true;
    }

    return false;
  }

  // Queue Management
  private async queueEventForLater(eventData: any): Promise<void> {
    const queuedEvent: QueuedEvent = {
      id: `queued_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      table: 'realtime_events',
      event: 'INSERT',
      payload: eventData,
      timestamp: new Date().toISOString(),
      retries: 0,
      priority: eventData.priority || 'normal',
    };

    this.state.queuedEvents.push(queuedEvent);
    await this.saveQueuedEvents();
    
    this.emit('event_queued', queuedEvent);
  }

  private async processQueuedEvents(): Promise<void> {
    if (this.state.queuedEvents.length === 0) {
      return;
    }

    // Sort by priority and timestamp
    this.state.queuedEvents.sort((a, b) => {
      const priorityOrder = { 'urgent': 4, 'high': 3, 'normal': 2, 'low': 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    const processedEvents: string[] = [];

    for (const event of this.state.queuedEvents) {
      try {
        // Check if event is still valid (not expired)
        if (await this.isEventExpired(event)) {
          processedEvents.push(event.id);
          continue;
        }

        // Check cultural considerations
        if (await this.shouldDelayCulturally(event.payload)) {
          continue; // Skip for now, will be processed later
        }

        // Process the event
        await this.publishEvent(event.payload);
        processedEvents.push(event.id);
        
        this.emit('queued_event_processed', event);
      } catch (error) {
        console.error('Failed to process queued event:', event.id, error);
        
        event.retries++;
        if (event.retries >= 3) {
          processedEvents.push(event.id); // Remove after 3 failed attempts
          this.emit('queued_event_failed', event);
        }
      }
    }

    // Remove processed events
    this.state.queuedEvents = this.state.queuedEvents.filter(
      event => !processedEvents.includes(event.id)
    );

    await this.saveQueuedEvents();
  }

  private async isEventExpired(event: QueuedEvent): Promise<boolean> {
    const eventAge = Date.now() - new Date(event.timestamp).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    return eventAge > maxAge;
  }

  // Real-time Subscriptions Setup
  private async setupRealtimeSubscriptions(): Promise<void> {
    try {
      // Subscribe to realtime_events for this organization
      await this.subscribe({
        table: 'realtime_events',
        event: 'INSERT',
        filter: `organization_id=eq.${this.config.organizationId}`,
        callback: (payload) => this.handleRealtimeEvent(payload),
        culturalFiltering: true,
      });

      // Subscribe to user-specific notifications
      await this.subscribe({
        table: 'push_notifications',
        event: 'INSERT',
        filter: `user_id=eq.${this.config.userId}`,
        callback: (payload) => this.handleUserNotification(payload),
        culturalFiltering: true,
      });

      // Role-specific subscriptions
      if (this.config.userRole === 'student') {
        await this.setupStudentSubscriptions();
      } else if (this.config.userRole === 'teacher') {
        await this.setupTeacherSubscriptions();
      }

    } catch (error) {
      console.error('Failed to setup realtime subscriptions:', error);
      throw error;
    }
  }

  private async setupStudentSubscriptions(): Promise<void> {
    // Student rankings updates
    await this.subscribe({
      table: 'student_rankings',
      event: '*',
      filter: `organization_id=eq.${this.config.organizationId}`,
      callback: (payload) => this.emit('student_ranking_updated', payload),
    });

    // Task assignments
    await this.subscribe({
      table: 'student_tasks',
      event: '*',
      filter: `student_id=eq.${this.config.userId}`,
      callback: (payload) => this.emit('student_task_updated', payload),
    });

    // Achievements
    await this.subscribe({
      table: 'student_achievements',
      event: 'INSERT',
      filter: `student_id=eq.${this.config.userId}`,
      callback: (payload) => this.emit('achievement_earned', payload),
    });
  }

  private async setupTeacherSubscriptions(): Promise<void> {
    // Attendance updates
    await this.subscribe({
      table: 'attendance_records',
      event: '*',
      filter: `organization_id=eq.${this.config.organizationId}`,
      callback: (payload) => this.emit('attendance_updated', payload),
    });

    // Assignment submissions
    await this.subscribe({
      table: 'assignment_submissions',
      event: 'INSERT',
      filter: `organization_id=eq.${this.config.organizationId}`,
      callback: (payload) => this.emit('assignment_submitted', payload),
    });

    // Parent communications
    await this.subscribe({
      table: 'parent_communications',
      event: 'INSERT',
      filter: `teacher_id=eq.${this.config.userId}`,
      callback: (payload) => this.emit('parent_message_received', payload),
    });
  }

  // Event Handlers
  private async handleRealtimeEvent(payload: RealtimePostgresChangesPayload<RealtimeEventData>): Promise<void> {
    const eventData = payload.new as RealtimeEventData;
    
    this.emit('realtime_event', {
      type: eventData.event_type,
      data: eventData,
      payload: payload,
    });

    // Emit specific event types
    this.emit(eventData.event_type, eventData);
  }

  private async handleUserNotification(payload: RealtimePostgresChangesPayload<any>): Promise<void> {
    const notification = payload.new;
    
    this.emit('user_notification', {
      type: 'notification',
      data: notification,
      payload: payload,
    });
  }

  // Connection Health and Monitoring
  private async testConnectivity(): Promise<{ success: boolean; error?: string; latency?: number }> {
    try {
      const startTime = Date.now();
      
      // Test basic Supabase connection
      const { data, error } = await this.supabase
        .from('organizations')
        .select('id')
        .eq('id', this.config.organizationId)
        .limit(1);

      const latency = Date.now() - startTime;

      if (error) {
        return { success: false, error: error.message };
      }

      this.updateNetworkQuality(latency);
      
      return { success: true, latency };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private updateNetworkQuality(latency: number): void {
    if (latency < 100) {
      this.state.networkQuality = 'excellent';
    } else if (latency < 300) {
      this.state.networkQuality = 'good';
    } else if (latency < 1000) {
      this.state.networkQuality = 'poor';
    } else {
      this.state.networkQuality = 'offline';
    }

    this.emit('network_quality_changed', this.state.networkQuality);
  }

  private async authenticateConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user is authenticated
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Verify user has access to organization
      const { data: userOrg, error: orgError } = await this.supabase
        .from('user_organizations')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', this.config.organizationId)
        .single();

      if (orgError || !userOrg) {
        return { success: false, error: 'User not authorized for organization' };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      try {
        const connectivityTest = await this.testConnectivity();
        
        if (connectivityTest.success) {
          this.metrics.lastHeartbeat = new Date();
          this.emit('heartbeat', {
            timestamp: this.metrics.lastHeartbeat,
            latency: connectivityTest.latency,
            quality: this.state.networkQuality,
          });
        } else {
          console.warn('Heartbeat failed:', connectivityTest.error);
          this.state.networkQuality = 'poor';
          this.emit('network_quality_changed', 'poor');
        }
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    }, this.config.heartbeatInterval);
  }

  private scheduleReconnect(): void {
    if (this.isDestroyed || this.state.reconnectAttempts >= this.config.reconnectAttempts) {
      console.log('Max reconnect attempts reached or service destroyed');
      return;
    }

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.state.reconnectAttempts),
      30000 // Max 30 seconds
    );

    this.state.reconnectAttempts++;
    this.state.status = 'reconnecting';
    this.emit('connection_state_changed', 'reconnecting');

    this.reconnectTimer = setTimeout(() => {
      console.log(`Reconnect attempt ${this.state.reconnectAttempts}/${this.config.reconnectAttempts}`);
      this.metrics.reconnections++;
      this.connect();
    }, delay);
  }

  // Cultural Time Checks
  private async isDuringPrayerTime(): Promise<boolean> {
    // This would integrate with prayer time calculations
    // For now, return a simple check
    const hour = new Date().getHours();
    const prayerHours = [5, 13, 16, 19, 20]; // Approximate prayer times
    
    return prayerHours.includes(hour);
  }

  private async isFamilyTime(): Promise<boolean> {
    const hour = new Date().getHours();
    return hour >= 19 && hour <= 21; // 7-9 PM family time
  }

  private async isQuietTime(): Promise<boolean> {
    const hour = new Date().getHours();
    return hour >= 22 || hour <= 6; // 10 PM - 6 AM quiet hours
  }

  // Storage Management
  private async loadQueuedEvents(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('websocket_queued_events');
      if (stored) {
        this.state.queuedEvents = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load queued events:', error);
      this.state.queuedEvents = [];
    }
  }

  private async saveQueuedEvents(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'websocket_queued_events',
        JSON.stringify(this.state.queuedEvents)
      );
    } catch (error) {
      console.error('Failed to save queued events:', error);
    }
  }

  // Public API Methods
  public getConnectionState(): ConnectionState {
    return { ...this.state };
  }

  public getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  public async updateCulturalSettings(settings: Partial<WebSocketConfig['culturalSettings']>): Promise<void> {
    this.config.culturalSettings = { ...this.config.culturalSettings, ...settings };
    this.state.culturalMode = this.config.culturalSettings.respectPrayerTimes;
    
    this.emit('cultural_settings_updated', this.config.culturalSettings);
  }

  public isConnected(): boolean {
    return this.state.status === 'connected';
  }

  public getSubscriptionCount(): number {
    return this.state.subscriptions.size;
  }

  public getQueuedEventCount(): number {
    return this.state.queuedEvents.length;
  }

  // Cleanup
  public async destroy(): Promise<void> {
    this.isDestroyed = true;
    await this.disconnect();
    this.removeAllListeners();
  }
}

// Factory function
export function createWebSocketConnectionService(config: WebSocketConfig): WebSocketConnectionService {
  return new WebSocketConnectionService(config);
}

// Export default
export default WebSocketConnectionService;