import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { RealtimeSubscriptionsService } from '../api/realtime/subscriptions';
import { PushNotificationsService } from '../api/realtime/push-notifications';
import { IslamicValuesFramework } from '../shared/islamic/values-framework';

export interface NotificationCenterState {
  notifications: any[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  lastUpdate: Date | null;
}

export interface NotificationCenterConfig {
  userId: string;
  organizationId: string;
  userRole: 'student' | 'teacher';
  culturalSettings: {
    respectPrayerTimes: boolean;
    showIslamicGreetings: boolean;
    preferredLanguage: 'en' | 'uz' | 'ru' | 'ar';
    celebration_animations: boolean;
  };
  autoConnect?: boolean;
  enablePushNotifications?: boolean;
}

export const useNotificationCenter = (config: NotificationCenterConfig) => {
  const [state, setState] = useState<NotificationCenterState>({
    notifications: [],
    unreadCount: 0,
    isLoading: true,
    isConnected: false,
    lastUpdate: null,
  });

  const realtimeService = useRef<RealtimeSubscriptionsService | null>(null);
  const pushService = useRef<PushNotificationsService | null>(null);
  const islamicFramework = useRef<IslamicValuesFramework | null>(null);
  const appState = useRef(AppState.currentState);

  // Initialize services
  useEffect(() => {
    realtimeService.current = new RealtimeSubscriptionsService();
    pushService.current = new PushNotificationsService();
    islamicFramework.current = new IslamicValuesFramework();

    if (config.autoConnect !== false) {
      initializeConnection();
    }

    return () => {
      cleanup();
    };
  }, []);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App has come to the foreground, refresh notifications
      refreshNotifications();
    }
    appState.current = nextAppState;
  };

  const initializeConnection = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      if (!realtimeService.current || !pushService.current) {
        throw new Error('Services not initialized');
      }

      // Initialize realtime service
      await realtimeService.current.initialize({
        userId: config.userId,
        organizationId: config.organizationId,
        cultural_settings: config.culturalSettings,
      });

      // Initialize push notifications if enabled
      if (config.enablePushNotifications !== false) {
        await pushService.current.initialize({
          user_id: config.userId,
          organization_id: config.organizationId,
          cultural_settings: config.culturalSettings,
        });
      }

      // Set up event listeners
      setupEventListeners();

      // Load initial notifications
      await loadNotifications();

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isConnected: true,
        lastUpdate: new Date(),
      }));

    } catch (error) {
      console.error('Failed to initialize notification center:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isConnected: false 
      }));
    }
  };

  const setupEventListeners = () => {
    if (!realtimeService.current) return;

    realtimeService.current.on('notification_received', handleNewNotification);
    realtimeService.current.on('notification_updated', handleNotificationUpdate);
    realtimeService.current.on('celebration_triggered', handleCelebrationNotification);
    realtimeService.current.on('connection_status', handleConnectionStatus);

    // Listen for foreground notification taps
    const notificationListener = Notifications.addNotificationReceivedListener(
      handleForegroundNotification
    );

    // Listen for notification responses (when user taps notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  };

  const handleNewNotification = (notification: any) => {
    setState(prev => ({
      ...prev,
      notifications: [notification, ...prev.notifications],
      unreadCount: prev.unreadCount + (notification.isRead ? 0 : 1),
      lastUpdate: new Date(),
    }));
  };

  const handleNotificationUpdate = (update: any) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => 
        n.id === update.id ? { ...n, ...update } : n
      ),
      unreadCount: update.isRead ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount,
      lastUpdate: new Date(),
    }));
  };

  const handleCelebrationNotification = async (data: any) => {
    if (!islamicFramework.current) return;

    const celebrationMessage = await islamicFramework.current.generateCelebrationMessage({
      achievement_type: data.achievement_type || 'academic',
      user_language: config.culturalSettings.preferredLanguage,
      specific_value: data.islamic_value,
      context: data.context,
    });

    const notification = {
      id: `celebration_${Date.now()}`,
      type: 'celebration',
      title: data.achievement_type === 'islamic_values' ? '🌟 Islamic Values Achievement!' : '🏆 New Achievement!',
      message: celebrationMessage,
      timestamp: new Date(),
      isRead: false,
      priority: 'high',
      culturalContext: {
        islamic_content: true,
        greeting_type: 'masha_allah',
        arabic_text: 'ما شاء الله',
      },
      language: config.culturalSettings.preferredLanguage,
    };

    handleNewNotification(notification);
  };

  const handleConnectionStatus = (status: { connected: boolean }) => {
    setState(prev => ({
      ...prev,
      isConnected: status.connected,
    }));
  };

  const handleForegroundNotification = async (notification: Notifications.Notification) => {
    // Handle notifications received while app is in foreground
    const notificationData = notification.request.content.data;
    
    if (notificationData && config.culturalSettings.respectPrayerTimes) {
      const isPrayerTime = await islamicFramework.current?.isPrayerTimeSensitive();
      if (isPrayerTime && notificationData.cultural_context?.prayer_time_sensitive) {
        // Delay notification display during prayer times
        return;
      }
    }
  };

  const handleNotificationResponse = async (response: Notifications.NotificationResponse) => {
    const notificationData = response.notification.request.content.data;
    
    if (notificationData?.action_data) {
      // Handle notification actions
      switch (notificationData.action_data.type) {
        case 'navigate':
          // Navigate to specific screen
          break;
        case 'celebrate':
          // Trigger celebration animation
          break;
        case 'pray':
          // Open prayer time reminder
          break;
      }
    }

    // Mark as read
    if (notificationData?.id) {
      await markAsRead(notificationData.id);
    }
  };

  const loadNotifications = async () => {
    try {
      if (!realtimeService.current) return;

      const notifications = await realtimeService.current.getNotifications({
        userId: config.userId,
        organizationId: config.organizationId,
        limit: 50,
        includeRead: true,
      });

      const unreadCount = notifications.filter(n => !n.is_read).length;

      setState(prev => ({
        ...prev,
        notifications,
        unreadCount,
        lastUpdate: new Date(),
      }));

    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const refreshNotifications = useCallback(async () => {
    if (!state.isConnected) {
      await initializeConnection();
    } else {
      await loadNotifications();
    }
  }, [state.isConnected]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      if (!realtimeService.current) return;

      await realtimeService.current.markNotificationAsRead(notificationId);
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
        lastUpdate: new Date(),
      }));

    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      if (!realtimeService.current) return;

      await realtimeService.current.markAllNotificationsAsRead(config.userId);
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
        lastUpdate: new Date(),
      }));

    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [config.userId]);

  const clearAll = useCallback(async () => {
    try {
      if (!realtimeService.current) return;

      await realtimeService.current.clearAllNotifications(config.userId);
      
      setState(prev => ({
        ...prev,
        notifications: [],
        unreadCount: 0,
        lastUpdate: new Date(),
      }));

    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }, [config.userId]);

  const sendTestNotification = useCallback(async (type: 'celebration' | 'reminder' | 'task') => {
    try {
      if (!realtimeService.current) return;

      let testNotification;
      
      switch (type) {
        case 'celebration':
          testNotification = {
            type: 'celebration',
            title: 'Test Celebration! 🎉',
            message: 'Masha Allah, you triggered a test celebration!',
            cultural_context: {
              islamic_content: true,
              greeting_type: 'masha_allah',
              arabic_text: 'ما شاء الله',
            },
          };
          break;
        case 'reminder':
          testNotification = {
            type: 'reminder',
            title: 'Test Reminder 📝',
            message: 'This is a test reminder notification',
          };
          break;
        case 'task':
          testNotification = {
            type: 'task',
            title: 'New Task Assigned 📋',
            message: 'You have a new test task to complete',
          };
          break;
      }

      await realtimeService.current.sendNotification({
        ...testNotification,
        user_id: config.userId,
        organization_id: config.organizationId,
        priority: 'medium',
      });

    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }, [config.userId, config.organizationId]);

  const cleanup = () => {
    realtimeService.current?.cleanup();
    pushService.current?.cleanup();
  };

  const reconnect = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    cleanup();
    await initializeConnection();
  }, []);

  // Public API
  return {
    // State
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isLoading: state.isLoading,
    isConnected: state.isConnected,
    lastUpdate: state.lastUpdate,

    // Actions
    refresh: refreshNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    reconnect,
    sendTestNotification,

    // Services (for advanced usage)
    realtimeService: realtimeService.current,
    pushService: pushService.current,
    islamicFramework: islamicFramework.current,
  };
};