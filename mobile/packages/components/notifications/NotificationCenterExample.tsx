/**
 * Example implementation of the Notification Center
 * This demonstrates how to integrate the notification system into your app
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { NotificationCenter, NotificationItem } from './NotificationCenter';
import { 
  NotificationIconBadge, 
  IslamicNotificationBadge,
  FABNotificationBadge 
} from './NotificationBadge';
import { useNotificationCenter } from '../hooks/useNotificationCenter';

interface NotificationCenterExampleProps {
  userId: string;
  organizationId: string;
  userRole: 'student' | 'teacher';
  userName: string;
}

export const NotificationCenterExample: React.FC<NotificationCenterExampleProps> = ({
  userId,
  organizationId,
  userRole,
  userName,
}) => {
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  
  // Initialize the notification center hook
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    lastUpdate,
    refresh,
    markAsRead,
    markAllAsRead,
    clearAll,
    sendTestNotification,
  } = useNotificationCenter({
    userId,
    organizationId,
    userRole,
    culturalSettings: {
      respectPrayerTimes: true,
      showIslamicGreetings: true,
      preferredLanguage: 'en', // This would come from user preferences
      celebration_animations: true,
    },
    autoConnect: true,
    enablePushNotifications: true,
  });

  const handleNotificationPress = async (notification: NotificationItem) => {
    // Handle notification press - navigate to relevant screen
    console.log('Notification pressed:', notification);
    
    // Mark as read if not already
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Handle different notification types
    switch (notification.type) {
      case 'task':
        // Navigate to tasks screen
        Alert.alert('Task Notification', 'Navigate to tasks screen');
        break;
      case 'ranking':
        // Navigate to rankings screen
        Alert.alert('Ranking Update', 'Navigate to rankings screen');
        break;
      case 'attendance':
        // Navigate to attendance screen
        Alert.alert('Attendance Alert', 'Navigate to attendance screen');
        break;
      case 'celebration':
        // Show celebration modal or navigate to achievements
        Alert.alert('🎉 Celebration!', notification.message);
        break;
      case 'prayer':
        // Show prayer time reminder
        Alert.alert('🌙 Prayer Time', notification.message);
        break;
      default:
        // Generic handling
        Alert.alert(notification.title, notification.message);
    }

    // Close notification center
    setShowNotificationCenter(false);
  };

  const openNotificationCenter = () => {
    setShowNotificationCenter(true);
  };

  const closeNotificationCenter = () => {
    setShowNotificationCenter(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = '';
    
    if (hour < 12) timeGreeting = 'Good Morning';
    else if (hour < 18) timeGreeting = 'Good Afternoon';
    else timeGreeting = 'Good Evening';

    return `${timeGreeting}, ${userName}`;
  };

  const renderConnectionStatus = () => {
    if (isLoading) {
      return (
        <View style={styles.statusBadge}>
          <Ionicons name="refresh" size={16} color="#F59E0B" />
          <Text style={[styles.statusText, { color: '#F59E0B' }]}>Connecting...</Text>
        </View>
      );
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]}>
        <Ionicons 
          name={isConnected ? "checkmark-circle" : "close-circle"} 
          size={16} 
          color="white" 
        />
        <Text style={styles.statusText}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1d7452" />
        
        {/* Header */}
        <LinearGradient
          colors={['#1d7452', '#16a085']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.subGreeting}>As-salamu alaikum wa rahmatullah</Text>
            </View>
            
            <View style={styles.headerActions}>
              {renderConnectionStatus()}
              
              {/* Main notification icon with badge */}
              <NotificationIconBadge
                count={unreadCount}
                onPress={openNotificationCenter}
                size="medium"
              />
            </View>
          </View>
        </LinearGradient>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Dashboard</Text>
          
          {/* Notification Types Examples */}
          <View style={styles.notificationTypes}>
            <Text style={styles.sectionTitle}>Notification Types</Text>
            
            <View style={styles.badgeRow}>
              <IslamicNotificationBadge
                count={2}
                type="prayer"
                onPress={() => Alert.alert('Prayer notifications')}
                size="medium"
              />
              <Text style={styles.badgeLabel}>Prayer Times</Text>
            </View>

            <View style={styles.badgeRow}>
              <IslamicNotificationBadge
                count={5}
                type="celebration"
                onPress={() => Alert.alert('Achievement notifications')}
                size="medium"
              />
              <Text style={styles.badgeLabel}>Achievements</Text>
            </View>

            <View style={styles.badgeRow}>
              <IslamicNotificationBadge
                count={1}
                type="reminder"
                onPress={() => Alert.alert('Task reminders')}
                size="medium"
              />
              <Text style={styles.badgeLabel}>Reminders</Text>
            </View>
          </View>

          {/* Debug Actions */}
          <View style={styles.debugSection}>
            <Text style={styles.sectionTitle}>Test Actions</Text>
            
            <TouchableOpacity
              style={styles.debugButton}
              onPress={() => sendTestNotification('celebration')}
            >
              <Text style={styles.debugButtonText}>Send Test Celebration</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.debugButton}
              onPress={() => sendTestNotification('reminder')}
            >
              <Text style={styles.debugButtonText}>Send Test Reminder</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.debugButton}
              onPress={() => sendTestNotification('task')}
            >
              <Text style={styles.debugButtonText}>Send Test Task</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <Text style={styles.sectionTitle}>Notification Stats</Text>
            <Text style={styles.statText}>Total: {notifications.length}</Text>
            <Text style={styles.statText}>Unread: {unreadCount}</Text>
            <Text style={styles.statText}>
              Last Update: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
            </Text>
          </View>
        </View>

        {/* Floating Action Button for Quick Access */}
        <FABNotificationBadge
          count={unreadCount}
          onPress={openNotificationCenter}
          icon="notifications"
          backgroundColor="#EF4444"
          fabColor="#1d7452"
        />

        {/* Notification Center Modal */}
        <Modal
          visible={showNotificationCenter}
          animationType="none"
          transparent={true}
          statusBarTranslucent={true}
        >
          <NotificationCenter
            userId={userId}
            userRole={userRole}
            organizationId={organizationId}
            onNotificationPress={handleNotificationPress}
            onClose={closeNotificationCenter}
            culturalSettings={{
              respectPrayerTimes: true,
              showIslamicGreetings: true,
              preferredLanguage: 'en',
              celebration_animations: true,
            }}
          />
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  subGreeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  notificationTypes: {
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 12,
  },
  debugSection: {
    marginBottom: 24,
  },
  debugButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  stats: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
});

export default NotificationCenterExample;