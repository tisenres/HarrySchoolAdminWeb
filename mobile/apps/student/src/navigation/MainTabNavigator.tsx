/**
 * Enhanced Main Tab Navigator for Harry School Student App
 * 
 * Implements custom AnimatedTabBar with 5-tab bottom navigation optimized for ages 10-18:
 * - Home (40% usage) - Daily overview and quick actions
 * - Lessons (35% usage) - Core learning content  
 * - Schedule (15% usage) - Time management and assignments
 * - Vocabulary (8% usage) - Language learning tools
 * - Profile (2% usage) - Progress tracking and rewards
 * 
 * Features:
 * - Custom animated tab bar with spring physics
 * - Real-time badge updates and progress tracking
 * - Accessibility support (WCAG 2.1 AA)
 * - Analytics tracking for educational insights
 * - Reduced motion support
 * - Student engagement optimizations
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Custom animated tab bar components
import { 
  AnimatedTabBar,
  useTabState,
  useTabAnalytics,
  useTabAccessibility,
  studentTabConfig,
  tabConfigUtils,
} from '../components/navigation';

// Navigation stack components
import { HomeStackNavigator } from './HomeStackNavigator';
import { LessonsStackNavigator } from './LessonsStackNavigator';
import { ScheduleStackNavigator } from './ScheduleStackNavigator';
import { VocabularyStackNavigator } from './VocabularyStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';

// Types
import type { MainTabParamList } from './types';

// Shared hooks and services
import { useAuth } from '@harry-school/shared';
import { useNotificationBadges } from '../hooks/useNotificationBadges';
import { useLearningProgress } from '../hooks/useLearningProgress';
import { useStudentPreferences } from '../hooks/useStudentPreferences';

const Tab = createBottomTabNavigator<MainTabParamList>();

// =====================================================
// MAIN TAB NAVIGATOR COMPONENT
// =====================================================

interface MainTabNavigatorProps {}

export const MainTabNavigator: React.FC<MainTabNavigatorProps> = () => {
  const insets = useSafeAreaInsets();
  const { getStudentProfile, updateActivity } = useAuth();
  const studentProfile = getStudentProfile();
  
  // Tab management hooks
  const {
    activeTabId,
    switchToTab,
    updateTabMetrics,
    getTabMetrics,
    getTabUsageStats,
  } = useTabState('HomeTab', studentTabConfig);
  
  // Analytics tracking
  const {
    startSession,
    endSession,
    trackTabSwitch,
    trackTaskCompletion,
    trackLearningProgress,
    isTrackingSession,
  } = useTabAnalytics();
  
  // Accessibility support
  const {
    accessibilityState,
    announceTabChange,
    getTabAccessibilityLabel,
    getTabAccessibilityHint,
    shouldReduceMotion,
    shouldUseHighContrast,
  } = useTabAccessibility();
  
  // Student-specific data hooks
  const { 
    badges,
    refreshBadges,
  } = useNotificationBadges();
  
  const {
    progress,
    refreshProgress,
  } = useLearningProgress();
  
  const {
    preferences,
    updatePreferences,
  } = useStudentPreferences();
  
  // Refs for navigation management
  const previousTabRef = useRef<string>('HomeTab');
  const sessionRef = useRef<string | null>(null);
  
  // =====================================================
  // SESSION MANAGEMENT
  // =====================================================
  
  useEffect(() => {
    // Start analytics session when component mounts
    if (!isTrackingSession) {
      sessionRef.current = startSession();
    }
    
    return () => {
      // End session when component unmounts
      if (isTrackingSession) {
        endSession();
      }
    };
  }, []);
  
  // =====================================================
  // TAB DATA PREPARATION
  // =====================================================
  
  // Get dynamic tab configuration with real-time data
  const getTabsWithLiveData = useCallback(() => {
    const badgeCounts = {
      HomeTab: badges.home || 0,
      LessonsTab: badges.lessons || 0,
      ScheduleTab: badges.schedule || 0,
      VocabularyTab: badges.vocabulary || 0,
      ProfileTab: badges.profile || 0,
    };
    
    const progressData = {
      HomeTab: progress.overall,
      LessonsTab: progress.lessons,
      ScheduleTab: progress.schedule,
      VocabularyTab: progress.vocabulary,
      ProfileTab: progress.profile,
    };
    
    // Apply accessibility optimizations if needed
    let tabConfig = studentTabConfig;
    if (shouldUseHighContrast() || shouldReduceMotion()) {
      tabConfig = tabConfigUtils.getAccessibilityOptimizedTabs(
        shouldUseHighContrast(),
        preferences?.largeText || false
      );
    }
    
    return tabConfigUtils.getTabsWithDynamicData(
      badgeCounts,
      progressData
    );
  }, [badges, progress, shouldUseHighContrast, shouldReduceMotion, preferences]);
  
  // =====================================================
  // TAB INTERACTION HANDLERS
  // =====================================================
  
  const handleTabPress = useCallback((tabId: string) => {
    const previousTab = previousTabRef.current;
    const tab = studentTabConfig.find(t => t.id === tabId);
    
    if (!tab || tab.disabled || tabId === activeTabId) {
      return;
    }
    
    // Update previous tab reference
    previousTabRef.current = activeTabId;
    
    // Switch to new tab
    switchToTab(tabId);
    
    // Track analytics
    trackTabSwitch(previousTab, tabId, tab.label);
    
    // Update activity timestamp
    updateActivity();
    
    // Announce tab change for accessibility
    announceTabChange(tabId, tab.label);
    
    // Refresh data for newly active tab
    refreshTabData(tabId);
  }, [activeTabId, switchToTab, trackTabSwitch, updateActivity, announceTabChange]);
  
  // =====================================================
  // DATA REFRESH MANAGEMENT
  // =====================================================
  
  const refreshTabData = useCallback(async (tabId: string) => {
    try {
      // Refresh badges and progress for the active tab
      await Promise.all([
        refreshBadges(),
        refreshProgress(),
      ]);
      
      // Update tab metrics
      const metrics = getTabMetrics(tabId);
      updateTabMetrics(tabId, {
        ...metrics,
        hasNewContent: false, // Mark as viewed
      });
    } catch (error) {
      console.error(`Failed to refresh data for tab ${tabId}:`, error);
    }
  }, [refreshBadges, refreshProgress, getTabMetrics, updateTabMetrics]);
  
  // Refresh data periodically
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      refreshTabData(activeTabId);
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [activeTabId, refreshTabData]);
  
  // =====================================================
  // RENDER TAB NAVIGATOR
  // =====================================================
  
  const tabsWithLiveData = getTabsWithLiveData();
  
  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName="HomeTab"
        screenOptions={{
          headerShown: false,
          // Disable default tab bar to use custom AnimatedTabBar
          tabBarStyle: { display: 'none' },
        }}
        screenListeners={{
          // Track navigation state changes
          state: (e) => {
            const state = e.data?.state;
            if (state) {
              // Additional state tracking can go here
            }
          },
        }}
      >
        {/* =====================================================
            HOME TAB (40% usage priority)
            ===================================================== */}
        <Tab.Screen
          name="HomeTab"
          component={HomeStackNavigator}
          options={{
            tabBarTestID: 'tab-home',
          }}
        />

        {/* =====================================================
            LESSONS TAB (35% usage priority)
            ===================================================== */}
        <Tab.Screen
          name="LessonsTab"
          component={LessonsStackNavigator}
          options={{
            tabBarTestID: 'tab-lessons',
          }}
        />

        {/* =====================================================
            SCHEDULE TAB (15% usage priority)
            ===================================================== */}
        <Tab.Screen
          name="ScheduleTab"
          component={ScheduleStackNavigator}
          options={{
            tabBarTestID: 'tab-schedule',
          }}
        />

        {/* =====================================================
            VOCABULARY TAB (8% usage priority)
            ===================================================== */}
        <Tab.Screen
          name="VocabularyTab"
          component={VocabularyStackNavigator}
          options={{
            tabBarTestID: 'tab-vocabulary',
          }}
        />

        {/* =====================================================
            PROFILE TAB (2% usage priority)
            ===================================================== */}
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStackNavigator}
          options={{
            tabBarTestID: 'tab-profile',
          }}
        />
      </Tab.Navigator>
      
      {/* =====================================================
          CUSTOM ANIMATED TAB BAR
          ===================================================== */}
      <AnimatedTabBar
        tabs={tabsWithLiveData}
        activeTabId={activeTabId}
        onTabPress={handleTabPress}
        style={{
          paddingBottom: insets.bottom,
        }}
        testID="main-animated-tab-bar"
      />
    </View>
  );
};

// =====================================================
// PLACEHOLDER STACK NAVIGATORS
// =====================================================
// These are temporary placeholders until full implementation

const PlaceholderScreen: React.FC<{ title: string; color: string }> = ({ title, color }) => (
  <View style={[styles.placeholderContainer, { backgroundColor: color + '10' }]}>
    <View style={[styles.placeholderContent, { borderColor: color }]}>
      <Text style={[styles.placeholderTitle, { color }]}>{title}</Text>
      <Text style={styles.placeholderSubtitle}>
        Stack navigator implementation coming soon
      </Text>
      <Text style={styles.placeholderDescription}>
        This will contain the full {title.toLowerCase()} feature set including:
      </Text>
      {getPlaceholderFeatures(title).map((feature, index) => (
        <Text key={index} style={styles.placeholderFeature}>
          • {feature}
        </Text>
      ))}
    </View>
  </View>
);

const getPlaceholderFeatures = (title: string): string[] => {
  switch (title) {
    case 'Home Stack':
      return [
        'Dashboard with daily overview',
        'Quick action shortcuts',
        'Recent activity feed',
        'Achievement notifications',
        'Progress summary',
      ];
    case 'Lessons Stack':
      return [
        'Interactive lesson content',
        'Progress tracking',
        'Assignment management',
        'Bookmarks and notes',
        'Performance analytics',
      ];
    case 'Schedule Stack':
      return [
        'Calendar view',
        'Class schedules',
        'Assignment deadlines',
        'Attendance tracking',
        'Reminder notifications',
      ];
    case 'Vocabulary Stack':
      return [
        'Flashcard system',
        'Spaced repetition',
        'Translation tools',
        'Progress tracking',
        'Streak maintenance',
      ];
    case 'Profile Stack':
      return [
        'Achievement gallery',
        'Learning statistics',
        'Goal setting',
        'Ranking system',
        'Account settings',
      ];
    default:
      return ['Feature list coming soon'];
  }
};

// Temporary placeholder implementations with educational colors
export const HomeStackNavigator = () => (
  <PlaceholderScreen title="Home Stack" color="#1d7452" />
);

export const LessonsStackNavigator = () => (
  <PlaceholderScreen title="Lessons Stack" color="#3b82f6" />
);

export const ScheduleStackNavigator = () => (
  <PlaceholderScreen title="Schedule Stack" color="#8b5cf6" />
);

export const VocabularyStackNavigator = () => (
  <PlaceholderScreen title="Vocabulary Stack" color="#f59e0b" />
);

export const ProfileStackNavigator = () => (
  <PlaceholderScreen title="Profile Stack" color="#10b981" />
);

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  
  placeholderContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  placeholderSubtitle: {
    fontSize: 16,
    color: '#71717a',
    textAlign: 'center',
    marginBottom: 16,
  },
  
  placeholderDescription: {
    fontSize: 14,
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 12,
  },
  
  placeholderFeature: {
    fontSize: 12,
    color: '#52525b',
    textAlign: 'left',
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
});

export default MainTabNavigator;