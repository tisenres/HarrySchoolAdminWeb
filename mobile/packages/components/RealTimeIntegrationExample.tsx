/**
 * Complete Real-time Integration Example
 * 
 * This example demonstrates how to integrate:
 * - Notification Center
 * - Real-time Animations
 * - Islamic Values Framework
 * - Supabase real-time subscriptions
 * - Push notifications
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { NotificationCenter, NotificationItem } from './notifications/NotificationCenter';
import { NotificationIconBadge } from './notifications/NotificationBadge';
import { RealtimeAnimations } from './animations/RealtimeAnimations';
import { useNotificationCenter } from '../hooks/useNotificationCenter';
import { useRealtimeAnimations } from '../hooks/useRealtimeAnimations';

interface RealTimeIntegrationExampleProps {
  userId: string;
  organizationId: string;
  userRole: 'student' | 'teacher';
  userName: string;
}

export const RealTimeIntegrationExample: React.FC<RealTimeIntegrationExampleProps> = ({
  userId,
  organizationId,
  userRole,
  userName,
}) => {
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'uz' | 'ru' | 'ar'>('en');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  // Cultural settings that would come from user preferences
  const culturalSettings = {
    respectPrayerTimes: true,
    showIslamicGreetings: true,
    preferredLanguage: selectedLanguage,
    celebration_animations: animationsEnabled,
    reduced_motion: false,
  };

  // Initialize notification center
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    refresh,
    markAsRead,
    sendTestNotification,
  } = useNotificationCenter({
    userId,
    organizationId,
    userRole,
    culturalSettings,
    autoConnect: true,
    enablePushNotifications: true,
  });

  // Initialize animations
  const {
    animationsRef,
    celebrateAchievement,
    notifyRankingUpdate,
    showPrayerReminder,
    showNotification,
    markAttendance,
    completeTask,
    celebrateIslamicValue,
    showRamadanGreeting,
    showEidGreeting,
  } = useRealtimeAnimations({
    animationSettings: {
      enabled: animationsEnabled,
      ...culturalSettings,
    },
    onAnimationStart: (event) => {
      console.log('Animation started:', event.type);
    },
    onAnimationComplete: (event) => {
      console.log('Animation completed:', event.type);
    },
  });

  const handleNotificationPress = async (notification: NotificationItem) => {
    console.log('Notification pressed:', notification);

    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Trigger appropriate animation based on notification type
    switch (notification.type) {
      case 'celebration':
        celebrateAchievement({
          type: 'academic',
          level: 'gold',
          title: notification.title,
          message: notification.message,
          arabic_text: notification.culturalContext?.arabic_text,
        });
        break;
      
      case 'ranking':
        notifyRankingUpdate({
          oldRank: 5,
          newRank: 3,
          improvement: true,
          studentName: userName,
        });
        break;
        
      case 'task':
        completeTask({
          title: notification.title,
          message: notification.message,
          type: 'homework',
        });
        break;
        
      case 'prayer':
        showPrayerReminder({
          name: 'Dhuhr',
          time: '12:30 PM',
          arabic_name: 'الظهر',
        });
        break;
    }

    setShowNotificationCenter(false);
  };

  // Demo functions for testing
  const demoFunctions = [
    {
      title: 'Test Islamic Achievement',
      icon: 'star',
      color: '#7C3AED',
      action: () => {
        celebrateIslamicValue({
          name: 'Akhlaq (Good Character)',
          arabic: 'الأخلاق',
          message: 'Your beautiful character reflects Islamic values!',
          context: 'behavior',
        });
      },
    },
    {
      title: 'Test Ranking Update',
      icon: 'trending-up',
      color: '#10B981',
      action: () => {
        notifyRankingUpdate({
          oldRank: 8,
          newRank: 5,
          improvement: true,
          studentName: userName,
        });
      },
    },
    {
      title: 'Test Prayer Reminder',
      icon: 'moon',
      color: '#6366F1',
      action: () => {
        showPrayerReminder({
          name: 'Maghrib',
          time: '6:45 PM',
          arabic_name: 'المغرب',
        });
      },
    },
    {
      title: 'Test Task Completion',
      icon: 'checkmark-done',
      color: '#059669',
      action: () => {
        completeTask({
          title: 'Arabic Grammar Exercise',
          message: 'Excellent work on your Arabic studies!',
          type: 'homework',
          islamicValue: 'seeking_knowledge',
        });
      },
    },
    {
      title: 'Test Attendance',
      icon: 'checkmark-circle',
      color: '#0891B2',
      action: () => {
        markAttendance({
          studentName: userName,
          status: 'present',
          message: 'Present for morning Islamic Studies class',
        });
      },
    },
    {
      title: 'Test Ramadan Greeting',
      icon: 'moon-outline',
      color: '#7C2D12',
      action: () => {
        showRamadanGreeting();
      },
    },
    {
      title: 'Test Eid Greeting',
      icon: 'star-half',
      color: '#BE185D',
      action: () => {
        showEidGreeting('fitr');
      },
    },
    {
      title: 'Test Notification',
      icon: 'notifications',
      color: '#DC2626',
      action: () => {
        showNotification({
          title: 'New Message',
          message: 'Assalamu alaikum! You have a new message from your teacher.',
          type: 'info',
          culturalContext: {
            islamic_content: true,
            greeting_type: 'salam',
          },
        });
      },
    },
  ];

  const languages = [
    { code: 'en' as const, name: 'English', native: 'English' },
    { code: 'uz' as const, name: 'Uzbek', native: 'O\'zbek' },
    { code: 'ru' as const, name: 'Russian', native: 'Русский' },
    { code: 'ar' as const, name: 'Arabic', native: 'العربية' },
  ];

  const getGreeting = () => {
    const greetings = {
      en: 'Peace be upon you',
      uz: 'Assalomu alaykum',
      ru: 'Ас-саляму алейкум',
      ar: 'السلام عليكم',
    };
    return greetings[selectedLanguage];
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#1d7452', '#16a085']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Real-time Demo</Text>
              <Text style={styles.headerSubtitle}>{getGreeting()}</Text>
            </View>
            
            <View style={styles.headerActions}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: isConnected ? '#10B981' : '#EF4444' }
              ]}>
                <Ionicons 
                  name={isConnected ? "checkmark-circle" : "close-circle"} 
                  size={16} 
                  color="white" 
                />
                <Text style={styles.statusText}>
                  {isConnected ? 'Live' : 'Offline'}
                </Text>
              </View>
              
              <NotificationIconBadge
                count={unreadCount}
                onPress={() => setShowNotificationCenter(true)}
              />
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Language</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.languageButtons}>
                  {languages.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.languageButton,
                        selectedLanguage === lang.code && styles.selectedLanguage,
                      ]}
                      onPress={() => setSelectedLanguage(lang.code)}
                    >
                      <Text
                        style={[
                          styles.languageText,
                          selectedLanguage === lang.code && styles.selectedLanguageText,
                        ]}
                      >
                        {lang.native}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Animations</Text>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  animationsEnabled && styles.toggleButtonActive,
                ]}
                onPress={() => setAnimationsEnabled(!animationsEnabled)}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    animationsEnabled && styles.toggleButtonTextActive,
                  ]}
                >
                  {animationsEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Demo Functions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Animation Demos</Text>
            
            <View style={styles.demoGrid}>
              {demoFunctions.map((demo, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.demoButton, { borderColor: demo.color }]}
                  onPress={demo.action}
                  activeOpacity={0.7}
                >
                  <Ionicons name={demo.icon as any} size={24} color={demo.color} />
                  <Text style={[styles.demoButtonText, { color: demo.color }]}>
                    {demo.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Real-time Test Functions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Real-time Tests</Text>
            
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => sendTestNotification('celebration')}
            >
              <Text style={styles.testButtonText}>Send Test Celebration</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => sendTestNotification('reminder')}
            >
              <Text style={styles.testButtonText}>Send Test Reminder</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => sendTestNotification('task')}
            >
              <Text style={styles.testButtonText}>Send Test Task</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{notifications.length}</Text>
                <Text style={styles.statLabel}>Total Notifications</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{unreadCount}</Text>
                <Text style={styles.statLabel}>Unread</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: isConnected ? '#10B981' : '#EF4444' }]}>
                  {isConnected ? '●' : '○'}
                </Text>
                <Text style={styles.statLabel}>Connection</Text>
              </View>
            </View>
          </View>
        </ScrollView>

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
            onClose={() => setShowNotificationCenter(false)}
            culturalSettings={culturalSettings}
          />
        </Modal>

        {/* Real-time Animations */}
        <RealtimeAnimations
          ref={animationsRef}
          isEnabled={animationsEnabled}
          culturalSettings={culturalSettings}
          onAnimationStart={(event) => {
            console.log('Animation started:', event);
          }}
          onAnimationComplete={(event) => {
            console.log('Animation completed:', event);
          }}
        />
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
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  selectedLanguage: {
    borderColor: '#1d7452',
    backgroundColor: '#1d7452',
  },
  languageText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedLanguageText: {
    color: 'white',
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  toggleButtonActive: {
    borderColor: '#1d7452',
    backgroundColor: '#1d7452',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  toggleButtonTextActive: {
    color: 'white',
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  demoButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  demoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  testButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1d7452',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});

export default RealTimeIntegrationExample;