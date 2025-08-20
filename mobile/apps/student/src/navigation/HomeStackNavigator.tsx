/**
 * Home Stack Navigator for Harry School Student App
 * 
 * Handles the Home tab navigation (40% usage priority).
 * Focuses on daily overview, quick actions, and student engagement.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

// Shared components and theme
import { theme } from '@harry-school/ui';
import { useAuth } from '@harry-school/shared';

// Screen components (will be implemented in separate files)
import { HomeDashboardScreen } from '../screens/home/HomeDashboardScreen';
import { RankingLeaderboardScreen } from '../screens/home/RankingLeaderboardScreen';
import { AchievementDetailsScreen } from '../screens/home/AchievementDetailsScreen';
import { DailyGoalsScreen } from '../screens/home/DailyGoalsScreen';
import { QuickActionsScreen } from '../screens/home/QuickActionsScreen';
import { AnnouncementDetailsScreen } from '../screens/home/AnnouncementDetailsScreen';
import { UpcomingClassesScreen } from '../screens/home/UpcomingClassesScreen';
import { RecentActivityScreen } from '../screens/home/RecentActivityScreen';
import { StudyStreakScreen } from '../screens/home/StudyStreakScreen';
import { FriendActivityScreen } from '../screens/home/FriendActivityScreen';

// Types
import type { HomeStackParamList, HomeStackScreenProps } from './types';

// Analytics and services
import { homeAnalytics } from '../services/home-analytics';
import { notificationService } from '../services/notification-service';

// Icons
import Icon from 'react-native-vector-icons/Ionicons';

const Stack = createNativeStackNavigator<HomeStackParamList>();

// =====================================================
// HEADER CONFIGURATION
// =====================================================

const getHeaderOptions = (title: string, showBackButton: boolean = true) => ({
  title,
  headerShown: true,
  headerStyle: {
    backgroundColor: theme.colors.white,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitleStyle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: theme.colors.neutral[900],
  },
  headerBackTitle: 'Back',
  headerBackTitleVisible: false,
  headerTintColor: theme.colors.primary[600],
  headerLeft: showBackButton ? undefined : () => null,
});

// =====================================================
// CUSTOM HEADER COMPONENTS
// =====================================================

interface DashboardHeaderProps {
  navigation: any;
  studentName?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  navigation, 
  studentName 
}) => {
  const handleNotificationsPress = useCallback(() => {
    navigation.navigate('Notifications');
  }, [navigation]);

  const handleSettingsPress = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  return (
    <View style={styles.dashboardHeader}>
      <View style={styles.dashboardHeaderLeft}>
        <Text style={styles.greetingText}>
          Good {getTimeOfDayGreeting()},
        </Text>
        <Text style={styles.studentNameText}>
          {studentName || 'Student'}!
        </Text>
      </View>
      <View style={styles.dashboardHeaderRight}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleNotificationsPress}
          accessibilityLabel="View notifications"
          accessibilityRole="button"
        >
          <Icon name="notifications-outline" size={24} color={theme.colors.neutral[700]} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSettingsPress}
          accessibilityLabel="Open settings"
          accessibilityRole="button"
        >
          <Icon name="settings-outline" size={24} color={theme.colors.neutral[700]} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// =====================================================
// HEADER RIGHT ACTIONS
// =====================================================

interface HeaderRightProps {
  navigation: any;
  route: any;
}

const getHeaderRight = (screenName: string) => ({ navigation, route }: HeaderRightProps) => {
  switch (screenName) {
    case 'RankingLeaderboard':
      return (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('DailyGoals')}
          accessibilityLabel="View daily goals"
        >
          <Icon name="trophy-outline" size={24} color={theme.colors.primary[600]} />
        </TouchableOpacity>
      );
    
    case 'AchievementDetails':
      return (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {/* Share achievement */}}
          accessibilityLabel="Share achievement"
        >
          <Icon name="share-outline" size={24} color={theme.colors.primary[600]} />
        </TouchableOpacity>
      );
    
    default:
      return null;
  }
};

// =====================================================
// MAIN HOME STACK NAVIGATOR
// =====================================================

interface HomeStackNavigatorProps {}

export const HomeStackNavigator: React.FC<HomeStackNavigatorProps> = () => {
  const { getStudentProfile, updateActivity } = useAuth();
  const studentProfile = getStudentProfile();

  // Track home section usage
  useFocusEffect(
    useCallback(() => {
      homeAnalytics.trackHomeSectionEnter();
      updateActivity();
      
      return () => {
        homeAnalytics.trackHomeSectionExit();
      };
    }, [updateActivity])
  );

  return (
    <Stack.Navigator
      initialRouteName="HomeDashboard"
      screenOptions={{
        gestureEnabled: true,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: theme.colors.neutral[50],
        },
      }}
    >
      {/* =====================================================
          MAIN DASHBOARD SCREEN (Entry Point)
          ===================================================== */}
      <Stack.Screen
        name="HomeDashboard"
        component={HomeDashboardScreen}
        options={({ navigation }) => ({
          headerShown: true,
          header: () => (
            <DashboardHeader
              navigation={navigation}
              studentName={studentProfile?.firstName}
            />
          ),
        })}
      />

      {/* =====================================================
          RANKING AND ACHIEVEMENTS
          ===================================================== */}
      <Stack.Screen
        name="RankingLeaderboard"
        component={RankingLeaderboardScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Leaderboard'),
          headerRight: getHeaderRight('RankingLeaderboard')({ navigation, route }),
        })}
      />

      <Stack.Screen
        name="AchievementDetails"
        component={AchievementDetailsScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Achievement'),
          headerRight: getHeaderRight('AchievementDetails')({ navigation, route }),
        })}
      />

      {/* =====================================================
          GOALS AND PLANNING
          ===================================================== */}
      <Stack.Screen
        name="DailyGoals"
        component={DailyGoalsScreen}
        options={getHeaderOptions('Daily Goals')}
      />

      <Stack.Screen
        name="QuickActions"
        component={QuickActionsScreen}
        options={getHeaderOptions('Quick Actions')}
      />

      {/* =====================================================
          CONTENT AND COMMUNICATION
          ===================================================== */}
      <Stack.Screen
        name="AnnouncementDetails"
        component={AnnouncementDetailsScreen}
        options={getHeaderOptions('Announcement')}
      />

      <Stack.Screen
        name="UpcomingClasses"
        component={UpcomingClassesScreen}
        options={getHeaderOptions('Upcoming Classes')}
      />

      {/* =====================================================
          ACTIVITY AND SOCIAL
          ===================================================== */}
      <Stack.Screen
        name="RecentActivity"
        component={RecentActivityScreen}
        options={getHeaderOptions('Recent Activity')}
      />

      <Stack.Screen
        name="StudyStreak"
        component={StudyStreakScreen}
        options={getHeaderOptions('Study Streak')}
      />

      <Stack.Screen
        name="FriendActivity"
        component={FriendActivityScreen}
        options={getHeaderOptions('Friend Activity')}
      />
    </Stack.Navigator>
  );
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const getTimeOfDayGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'morning';
  } else if (hour < 17) {
    return 'afternoon';
  } else {
    return 'evening';
  }
};

// =====================================================
// PLACEHOLDER SCREEN COMPONENTS
// =====================================================
// These will be moved to separate files in the screens/home directory

const PlaceholderScreen: React.FC<{ title: string; description?: string }> = ({ 
  title, 
  description 
}) => (
  <View style={styles.placeholderContainer}>
    <Icon 
      name="construct-outline" 
      size={64} 
      color={theme.colors.neutral[400]} 
      style={styles.placeholderIcon}
    />
    <Text style={styles.placeholderTitle}>{title}</Text>
    {description && (
      <Text style={styles.placeholderDescription}>{description}</Text>
    )}
    <Text style={styles.placeholderSubtitle}>Screen implementation coming soon</Text>
  </View>
);

// Temporary placeholder implementations
export const HomeDashboardScreen = () => (
  <PlaceholderScreen 
    title="Home Dashboard" 
    description="Daily overview, quick actions, and student progress"
  />
);

export const RankingLeaderboardScreen = () => (
  <PlaceholderScreen 
    title="Ranking Leaderboard" 
    description="Student rankings and competitive elements"
  />
);

export const AchievementDetailsScreen = () => (
  <PlaceholderScreen 
    title="Achievement Details" 
    description="Detailed view of student achievements and badges"
  />
);

export const DailyGoalsScreen = () => (
  <PlaceholderScreen 
    title="Daily Goals" 
    description="Personal learning goals and progress tracking"
  />
);

export const QuickActionsScreen = () => (
  <PlaceholderScreen 
    title="Quick Actions" 
    description="Shortcuts to common student tasks"
  />
);

export const AnnouncementDetailsScreen = () => (
  <PlaceholderScreen 
    title="Announcement Details" 
    description="School announcements and important notices"
  />
);

export const UpcomingClassesScreen = () => (
  <PlaceholderScreen 
    title="Upcoming Classes" 
    description="Next scheduled classes and preparation"
  />
);

export const RecentActivityScreen = () => (
  <PlaceholderScreen 
    title="Recent Activity" 
    description="Timeline of recent learning activities"
  />
);

export const StudyStreakScreen = () => (
  <PlaceholderScreen 
    title="Study Streak" 
    description="Daily learning streaks and motivation"
  />
);

export const FriendActivityScreen = () => (
  <PlaceholderScreen 
    title="Friend Activity" 
    description="Social learning and peer interaction"
  />
);

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  dashboardHeaderLeft: {
    flex: 1,
  },
  dashboardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greetingText: {
    fontSize: 14,
    color: theme.colors.neutral[600],
    fontWeight: '500',
  },
  studentNameText: {
    fontSize: 18,
    color: theme.colors.neutral[900],
    fontWeight: '700',
    marginTop: 2,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: 24,
  },
  placeholderIcon: {
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary[600],
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderDescription: {
    fontSize: 16,
    color: theme.colors.neutral[600],
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: theme.colors.neutral[500],
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default HomeStackNavigator;