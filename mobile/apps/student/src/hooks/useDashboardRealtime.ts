/**
 * Dashboard Real-time Hook
 * Harry School Student Mobile App
 * 
 * Manages real-time subscriptions for dashboard data updates
 * Handles connection state and automatic reconnection
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { RealtimeChannel, REALTIME_LISTEN_TYPES } from '@supabase/supabase-js';
import { supabase } from '@harry-school/shared/services';

// Connection state types
export type ConnectionState = 'online' | 'offline' | 'connecting' | 'reconnecting';

// Subscription configuration
interface SubscriptionConfig {
  channel: string;
  table: string;
  filter?: string;
  events?: REALTIME_LISTEN_TYPES[];
}

// Real-time data update interface
interface RealtimeUpdate {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  old?: any;
  new?: any;
  timestamp: number;
}

// Subscription management interface
interface SubscriptionManager {
  subscriptions: Map<string, RealtimeChannel>;
  connectionState: ConnectionState;
  reconnectAttempts: number;
  lastConnectionTime: Date | null;
}

/**
 * Custom hook for managing dashboard real-time subscriptions
 * 
 * @param studentId - Student's unique identifier
 * @returns Connection state and subscription management functions
 */
export const useDashboardRealtime = (studentId: string) => {
  // State
  const [connectionState, setConnectionState] = useState<ConnectionState>('offline');
  const [subscriptions] = useState<Map<string, RealtimeChannel>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateQueue, setUpdateQueue] = useState<RealtimeUpdate[]>([]);

  // Refs for managing connection lifecycle
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>('active');
  const subscriptionCallbacks = useRef<Map<string, (update: RealtimeUpdate) => void>>(new Map());

  // Constants
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY_BASE = 1000; // 1 second base delay
  const HEARTBEAT_INTERVAL = 30000; // 30 seconds
  const UPDATE_BATCH_SIZE = 10;

  // Connection management
  const handleConnectionStateChange = useCallback((state: ConnectionState) => {
    console.log(`Dashboard realtime connection state changed: ${state}`);
    setConnectionState(state);
    
    if (state === 'online') {
      reconnectAttempts.current = 0;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    }
  }, []);

  // Process update queue in batches
  const processUpdateQueue = useCallback(() => {
    if (updateQueue.length === 0) return;
    
    const batch = updateQueue.slice(0, UPDATE_BATCH_SIZE);
    setUpdateQueue(prev => prev.slice(UPDATE_BATCH_SIZE));
    
    batch.forEach(update => {
      const callback = subscriptionCallbacks.current.get(update.table);
      if (callback) {
        callback(update);
      }
    });
  }, [updateQueue]);

  // Process updates periodically
  useEffect(() => {
    const interval = setInterval(processUpdateQueue, 100);
    return () => clearInterval(interval);
  }, [processUpdateQueue]);

  // Generic subscription creation function
  const createSubscription = useCallback((
    config: SubscriptionConfig,
    onUpdate: (update: RealtimeUpdate) => void
  ): RealtimeChannel => {
    const { channel, table, filter, events = ['*'] } = config;
    
    console.log(`Creating subscription for ${channel}: ${table}`);
    
    // Store callback for update processing
    subscriptionCallbacks.current.set(table, onUpdate);
    
    const subscription = supabase
      .channel(channel)
      .on(
        'postgres_changes',
        {
          event: events[0], // For now, listen to all events
          schema: 'public',
          table: table,
          filter: filter,
        },
        (payload) => {
          const update: RealtimeUpdate = {
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            table: table,
            old: payload.old,
            new: payload.new,
            timestamp: Date.now(),
          };
          
          // Add to update queue for batch processing
          setUpdateQueue(prev => [...prev, update]);
          setLastUpdate(new Date());
        }
      )
      .subscribe((status) => {
        console.log(`Subscription ${channel} status:`, status);
        
        switch (status) {
          case 'SUBSCRIBED':
            handleConnectionStateChange('online');
            break;
          case 'CHANNEL_ERROR':
            handleConnectionStateChange('offline');
            attemptReconnection();
            break;
          case 'TIMED_OUT':
            handleConnectionStateChange('reconnecting');
            attemptReconnection();
            break;
          case 'CLOSED':
            handleConnectionStateChange('offline');
            break;
        }
      });
    
    subscriptions.set(channel, subscription);
    return subscription;
  }, [subscriptions, handleConnectionStateChange]);

  // Reconnection logic with exponential backoff
  const attemptReconnection = useCallback(() => {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.warn('Max reconnection attempts reached');
      handleConnectionStateChange('offline');
      return;
    }
    
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }
    
    const delay = RECONNECT_DELAY_BASE * Math.pow(2, reconnectAttempts.current);
    reconnectAttempts.current++;
    
    console.log(`Attempting reconnection ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
    
    reconnectTimer.current = setTimeout(() => {
      handleConnectionStateChange('connecting');
      subscribeToAll();
    }, delay);
  }, [handleConnectionStateChange]);

  // Subscribe to ranking updates
  const subscribeToRanking = useCallback((
    onUpdate: (update: RealtimeUpdate) => void
  ) => {
    return createSubscription(
      {
        channel: `ranking:${studentId}`,
        table: 'student_rankings',
        filter: `student_id=eq.${studentId}`,
      },
      onUpdate
    );
  }, [studentId, createSubscription]);

  // Subscribe to schedule updates
  const subscribeToSchedule = useCallback((
    onUpdate: (update: RealtimeUpdate) => void
  ) => {
    return createSubscription(
      {
        channel: `schedule:${studentId}`,
        table: 'student_schedules',
        filter: `student_id=eq.${studentId}`,
      },
      onUpdate
    );
  }, [studentId, createSubscription]);

  // Subscribe to task updates
  const subscribeToTasks = useCallback((
    onUpdate: (update: RealtimeUpdate) => void
  ) => {
    return createSubscription(
      {
        channel: `tasks:${studentId}`,
        table: 'student_tasks',
        filter: `student_id=eq.${studentId}`,
      },
      onUpdate
    );
  }, [studentId, createSubscription]);

  // Subscribe to achievement updates
  const subscribeToAchievements = useCallback((
    onUpdate: (update: RealtimeUpdate) => void
  ) => {
    return createSubscription(
      {
        channel: `achievements:${studentId}`,
        table: 'student_achievements',
        filter: `student_id=eq.${studentId}`,
      },
      onUpdate
    );
  }, [studentId, createSubscription]);

  // Subscribe to stats updates
  const subscribeToStats = useCallback((
    onUpdate: (update: RealtimeUpdate) => void
  ) => {
    return createSubscription(
      {
        channel: `stats:${studentId}`,
        table: 'student_stats',
        filter: `student_id=eq.${studentId}`,
      },
      onUpdate
    );
  }, [studentId, createSubscription]);

  // Subscribe to all dashboard data sources
  const subscribeToAll = useCallback(() => {
    console.log('Setting up all dashboard subscriptions');
    
    // Ranking subscription
    subscribeToRanking((update) => {
      console.log('Ranking update received:', update);
    });
    
    // Schedule subscription
    subscribeToSchedule((update) => {
      console.log('Schedule update received:', update);
    });
    
    // Tasks subscription
    subscribeToTasks((update) => {
      console.log('Tasks update received:', update);
    });
    
    // Achievements subscription
    subscribeToAchievements((update) => {
      console.log('Achievements update received:', update);
    });
    
    // Stats subscription
    subscribeToStats((update) => {
      console.log('Stats update received:', update);
    });
  }, [
    subscribeToRanking,
    subscribeToSchedule,
    subscribeToTasks,
    subscribeToAchievements,
    subscribeToStats,
  ]);

  // Unsubscribe from all channels
  const unsubscribeAll = useCallback(() => {
    console.log('Unsubscribing from all dashboard channels');
    
    subscriptions.forEach((subscription, channel) => {
      subscription.unsubscribe();
      console.log(`Unsubscribed from ${channel}`);
    });
    
    subscriptions.clear();
    subscriptionCallbacks.current.clear();
    
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  }, [subscriptions]);

  // Handle app state changes
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    console.log('App state changed:', appStateRef.current, '->', nextAppState);
    
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      // App became active - reconnect subscriptions
      console.log('App became active - reconnecting subscriptions');
      subscribeToAll();
    } else if (nextAppState.match(/inactive|background/)) {
      // App went to background - close connections to save battery
      console.log('App went to background - closing connections');
      unsubscribeAll();
      handleConnectionStateChange('offline');
    }
    
    appStateRef.current = nextAppState;
  }, [subscribeToAll, unsubscribeAll, handleConnectionStateChange]);

  // Connection health check
  const performHealthCheck = useCallback(() => {
    if (connectionState === 'online' && subscriptions.size === 0) {
      console.log('Health check failed - no active subscriptions');
      handleConnectionStateChange('offline');
      subscribeToAll();
    }
  }, [connectionState, subscriptions.size, handleConnectionStateChange, subscribeToAll]);

  // Initialize subscriptions on mount
  useEffect(() => {
    if (studentId) {
      console.log('Initializing dashboard real-time subscriptions');
      handleConnectionStateChange('connecting');
      subscribeToAll();
    }
    
    return () => {
      unsubscribeAll();
    };
  }, [studentId, subscribeToAll, unsubscribeAll, handleConnectionStateChange]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [handleAppStateChange]);

  // Periodic health check
  useEffect(() => {
    const interval = setInterval(performHealthCheck, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [performHealthCheck]);

  // Get connection diagnostics
  const getConnectionDiagnostics = useCallback(() => {
    return {
      connectionState,
      activeSubscriptions: subscriptions.size,
      reconnectAttempts: reconnectAttempts.current,
      lastUpdate,
      queuedUpdates: updateQueue.length,
      subscriptionChannels: Array.from(subscriptions.keys()),
    };
  }, [connectionState, subscriptions.size, lastUpdate, updateQueue.length]);

  // Force reconnection
  const forceReconnection = useCallback(() => {
    console.log('Forcing reconnection');
    unsubscribeAll();
    reconnectAttempts.current = 0;
    handleConnectionStateChange('connecting');
    subscribeToAll();
  }, [unsubscribeAll, handleConnectionStateChange, subscribeToAll]);

  return {
    // Connection state
    connectionState,
    lastUpdate,
    
    // Subscription management
    subscriptions: Array.from(subscriptions.keys()),
    subscriptionCount: subscriptions.size,
    
    // Update queue info
    queuedUpdates: updateQueue.length,
    
    // Management functions
    subscribeToRanking,
    subscribeToSchedule,
    subscribeToTasks,
    subscribeToAchievements,
    subscribeToStats,
    unsubscribeAll,
    forceReconnection,
    
    // Diagnostics
    getConnectionDiagnostics,
    reconnectAttempts: reconnectAttempts.current,
  };
};

export default useDashboardRealtime;