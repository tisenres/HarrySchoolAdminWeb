import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RealtimeSubscriptionsService } from '../../packages/api/realtime/subscriptions';
import { PushNotificationsService } from '../../packages/api/realtime/push-notifications';
import { IslamicValuesFramework } from '../../packages/shared/islamic/values-framework';

const { width, height } = Dimensions.get('window');

export interface NotificationItem {
  id: string;
  type: 'task' | 'ranking' | 'attendance' | 'system' | 'celebration' | 'reminder' | 'prayer' | 'cultural';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  culturalContext?: {
    islamic_content?: boolean;
    prayer_time_sensitive?: boolean;
    arabic_text?: string;
    greeting_type?: 'salam' | 'barakallah' | 'masha_allah' | 'insha_allah';
  };
  actionData?: {
    type: 'navigate' | 'celebrate' | 'pray' | 'reminder';
    target?: string;
    params?: any;
  };
  expires?: Date;
  language: 'en' | 'uz' | 'ru' | 'ar';
}

interface NotificationCenterProps {
  userId: string;
  userRole: 'student' | 'teacher';
  organizationId: string;
  onNotificationPress?: (notification: NotificationItem) => void;
  onClose?: () => void;
  culturalSettings?: {
    respectPrayerTimes: boolean;
    showIslamicGreetings: boolean;
    preferredLanguage: 'en' | 'uz' | 'ru' | 'ar';
    celebration_animations: boolean;
  };
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  userRole,
  organizationId,
  onNotificationPress,
  onClose,
  culturalSettings = {
    respectPrayerTimes: true,
    showIslamicGreetings: true,
    preferredLanguage: 'en',
    celebration_animations: true,
  },
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [slideAnimation] = useState(new Animated.Value(height));
  const [fadeAnimation] = useState(new Animated.Value(0));
  const [celebrationAnimation] = useState(new Animated.Value(0));
  
  const insets = useSafeAreaInsets();
  const realtimeService = new RealtimeSubscriptionsService();
  const pushService = new PushNotificationsService();
  const islamicFramework = new IslamicValuesFramework();

  // Cultural greetings based on user's preferred language
  const greetings = useMemo(() => ({
    en: {
      title: 'Notifications',
      subtitle: 'Peace be upon you',
      empty: 'No notifications at this time',
      clear_all: 'Clear All',
      mark_read: 'Mark as Read',
    },
    uz: {
      title: 'Bildirishnomalar',
      subtitle: 'Assalomu alaykum',
      empty: 'Hozircha bildirishnomalar yo\'q',
      clear_all: 'Barchasini Tozalash',
      mark_read: 'O\'qilgan deb belgilash',
    },
    ru: {
      title: 'Уведомления',
      subtitle: 'Ас-саляму алейкум',
      empty: 'Пока нет уведомлений',
      clear_all: 'Очистить все',
      mark_read: 'Отметить как прочитанное',
    },
    ar: {
      title: 'الإشعارات',
      subtitle: 'السلام عليكم',
      empty: 'لا توجد إشعارات في الوقت الحالي',
      clear_all: 'مسح الكل',
      mark_read: 'وضع علامة كمقروء',
    },
  }), []);

  const currentGreeting = greetings[culturalSettings.preferredLanguage];

  // Filter options based on user role
  const filterOptions = useMemo(() => {
    const base = [
      { key: 'all', label: 'All', icon: 'notifications-outline' },
      { key: 'unread', label: 'Unread', icon: 'mail-unread-outline' },
      { key: 'celebration', label: 'Achievements', icon: 'trophy-outline' },
      { key: 'prayer', label: 'Prayer', icon: 'moon-outline' },
    ];

    if (userRole === 'teacher') {
      base.push(
        { key: 'attendance', label: 'Attendance', icon: 'checkmark-circle-outline' },
        { key: 'task', label: 'Tasks', icon: 'list-outline' },
      );
    } else {
      base.push(
        { key: 'ranking', label: 'Rankings', icon: 'podium-outline' },
        { key: 'reminder', label: 'Reminders', icon: 'alarm-outline' },
      );
    }

    return base;
  }, [userRole]);

  useEffect(() => {
    loadNotifications();
    setupRealtimeListeners();
    animateEntry();
    
    return () => {
      realtimeService.cleanup();
    };
  }, []);

  const animateEntry = () => {
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateExit = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback?.();
    });
  };

  const setupRealtimeListeners = async () => {
    try {
      await realtimeService.initialize({
        userId,
        organizationId,
        cultural_settings: culturalSettings,
      });

      realtimeService.on('notification_received', handleRealtimeNotification);
      realtimeService.on('notification_updated', handleNotificationUpdate);
      realtimeService.on('celebration_triggered', handleCelebrationNotification);
    } catch (error) {
      console.error('Failed to setup realtime listeners:', error);
    }
  };

  const handleRealtimeNotification = (notification: any) => {
    const formattedNotification: NotificationItem = {
      id: notification.id,
      type: notification.event_type,
      title: notification.title,
      message: notification.message,
      timestamp: new Date(notification.created_at),
      isRead: false,
      priority: notification.priority || 'medium',
      culturalContext: notification.cultural_context,
      actionData: notification.action_data,
      expires: notification.expires_at ? new Date(notification.expires_at) : undefined,
      language: culturalSettings.preferredLanguage,
    };

    setNotifications(prev => [formattedNotification, ...prev]);

    // Trigger celebration animation for achievements
    if (notification.event_type === 'celebration' && culturalSettings.celebration_animations) {
      triggerCelebrationAnimation();
    }
  };

  const handleNotificationUpdate = (update: any) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === update.id 
          ? { ...notification, isRead: update.is_read }
          : notification
      )
    );
  };

  const handleCelebrationNotification = async (data: any) => {
    const celebrationMessage = await islamicFramework.generateCelebrationMessage(data);
    
    const notification: NotificationItem = {
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
      language: culturalSettings.preferredLanguage,
    };

    setNotifications(prev => [notification, ...prev]);
    
    if (culturalSettings.celebration_animations) {
      triggerCelebrationAnimation();
    }
  };

  const triggerCelebrationAnimation = () => {
    Animated.sequence([
      Animated.timing(celebrationAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await realtimeService.getNotifications({
        userId,
        organizationId,
        limit: 50,
        includeRead: true,
      });

      const formattedNotifications: NotificationItem[] = response.map(notification => ({
        id: notification.id,
        type: notification.event_type,
        title: notification.title,
        message: notification.message,
        timestamp: new Date(notification.created_at),
        isRead: notification.is_read || false,
        priority: notification.priority || 'medium',
        culturalContext: notification.cultural_context,
        actionData: notification.action_data,
        expires: notification.expires_at ? new Date(notification.expires_at) : undefined,
        language: culturalSettings.preferredLanguage,
      }));

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      Alert.alert('Error', 'Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    switch (selectedFilter) {
      case 'unread':
        filtered = notifications.filter(n => !n.isRead);
        break;
      case 'celebration':
        filtered = notifications.filter(n => n.type === 'celebration');
        break;
      case 'prayer':
        filtered = notifications.filter(n => n.type === 'prayer' || n.culturalContext?.prayer_time_sensitive);
        break;
      case 'attendance':
        filtered = notifications.filter(n => n.type === 'attendance');
        break;
      case 'task':
        filtered = notifications.filter(n => n.type === 'task');
        break;
      case 'ranking':
        filtered = notifications.filter(n => n.type === 'ranking');
        break;
      case 'reminder':
        filtered = notifications.filter(n => n.type === 'reminder');
        break;
      default:
        break;
    }

    return filtered.filter(n => !n.expires || n.expires > new Date());
  }, [notifications, selectedFilter]);

  const markAsRead = async (notificationId: string) => {
    try {
      await realtimeService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await realtimeService.clearAllNotifications(userId);
              setNotifications([]);
            } catch (error) {
              console.error('Failed to clear notifications:', error);
            }
          },
        },
      ]
    );
  };

  const handleNotificationPress = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    if (onNotificationPress) {
      onNotificationPress(notification);
    } else if (notification.actionData) {
      // Handle default actions
      switch (notification.actionData.type) {
        case 'celebrate':
          triggerCelebrationAnimation();
          break;
        case 'pray':
          // Could integrate with prayer time reminders
          break;
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap = {
      task: 'list-outline',
      ranking: 'podium-outline',
      attendance: 'checkmark-circle-outline',
      system: 'settings-outline',
      celebration: 'trophy-outline',
      reminder: 'alarm-outline',
      prayer: 'moon-outline',
      cultural: 'star-outline',
    };
    return iconMap[type] || 'notifications-outline';
  };

  const getPriorityColor = (priority: string) => {
    const colorMap = {
      low: '#10B981',
      medium: '#3B82F6',
      high: '#F59E0B',
      urgent: '#EF4444',
    };
    return colorMap[priority] || '#6B7280';
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => {
    const priorityColor = getPriorityColor(item.priority);
    const icon = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.isRead && styles.unreadNotification,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={[styles.iconContainer, { backgroundColor: priorityColor + '20' }]}>
            <Ionicons name={icon} size={24} color={priorityColor} />
          </View>
          
          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>
                {item.title}
              </Text>
              <Text style={styles.timestamp}>
                {formatTimestamp(item.timestamp)}
              </Text>
            </View>
            
            <Text style={styles.message} numberOfLines={2}>
              {item.message}
            </Text>
            
            {item.culturalContext?.arabic_text && culturalSettings.showIslamicGreetings && (
              <Text style={styles.arabicText}>
                {item.culturalContext.arabic_text}
              </Text>
            )}
            
            {item.type === 'celebration' && (
              <View style={styles.celebrationBadge}>
                <MaterialCommunityIcons name="star-four-points" size={16} color="#FFD700" />
                <Text style={styles.celebrationText}>Achievement Unlocked!</Text>
              </View>
            )}
          </View>
          
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const renderFilterButton = (filter: any) => {
    const isSelected = selectedFilter === filter.key;
    
    return (
      <TouchableOpacity
        key={filter.key}
        style={[
          styles.filterButton,
          isSelected && styles.selectedFilter,
        ]}
        onPress={() => setSelectedFilter(filter.key)}
      >
        <Ionicons
          name={filter.icon}
          size={18}
          color={isSelected ? '#1d7452' : '#6B7280'}
        />
        <Text style={[
          styles.filterText,
          isSelected && styles.selectedFilterText,
        ]}>
          {filter.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateText}>{currentGreeting.empty}</Text>
      <Text style={styles.emptyStateSubtext}>
        {culturalSettings.showIslamicGreetings && currentGreeting.subtitle}
      </Text>
    </View>
  );

  const renderCelebrationOverlay = () => {
    if (!culturalSettings.celebration_animations) return null;

    return (
      <Animated.View
        style={[
          styles.celebrationOverlay,
          {
            opacity: celebrationAnimation,
            transform: [{
              scale: celebrationAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.2],
              }),
            }],
          },
        ]}
        pointerEvents="none"
      >
        <MaterialCommunityIcons name="star-four-points" size={100} color="#FFD700" />
        <Text style={styles.celebrationOverlayText}>ما شاء الله</Text>
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnimation }],
          opacity: fadeAnimation,
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" />
      
      <BlurView intensity={20} style={styles.backdrop}>
        <TouchableOpacity 
          style={styles.backdrop}
          onPress={() => animateExit(onClose)}
          activeOpacity={1}
        />
      </BlurView>

      <View style={[styles.content, { marginTop: insets.top + 20 }]}>
        <LinearGradient
          colors={['#1d7452', '#16a085']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>{currentGreeting.title}</Text>
              {culturalSettings.showIslamicGreetings && (
                <Text style={styles.headerSubtitle}>{currentGreeting.subtitle}</Text>
              )}
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={clearAllNotifications}
              >
                <Ionicons name="trash-outline" size={20} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => animateExit(onClose)}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.filtersContainer}>
          <FlatList
            data={filterOptions}
            renderItem={({ item }) => renderFilterButton(item)}
            keyExtractor={(item) => item.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          />
        </View>

        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          style={styles.notificationsList}
          contentContainerStyle={styles.notificationsContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#1d7452']}
              tintColor="#1d7452"
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {renderCelebrationOverlay()}
    </Animated.View>
  );
};

const formatTimestamp = (timestamp: Date) => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return timestamp.toLocaleDateString();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filtersContainer: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
  },
  filtersContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedFilter: {
    backgroundColor: '#1d7452',
    borderColor: '#1d7452',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  selectedFilterText: {
    color: 'white',
  },
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    padding: 16,
  },
  notificationItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#1d7452',
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    color: '#1d7452',
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  arabicText: {
    fontSize: 16,
    color: '#1d7452',
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 8,
    fontFamily: 'System', // Could be replaced with Arabic font
  },
  celebrationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  celebrationText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1d7452',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  celebrationOverlayText: {
    fontSize: 24,
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 16,
  },
});