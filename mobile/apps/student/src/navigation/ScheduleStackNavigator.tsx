/**
 * Schedule Stack Navigator for Harry School Student App
 * 
 * Handles the Schedule tab navigation (15% usage priority).
 * Focuses on time management, assignments, and class scheduling.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

// Shared components and theme
import { theme } from '@harry-school/ui';
import { useAuth } from '@harry-school/shared';

// Screen components (will be implemented in separate files)
import { ScheduleOverviewScreen } from '../screens/schedule/ScheduleOverviewScreen';
import { DailyScheduleScreen } from '../screens/schedule/DailyScheduleScreen';
import { WeeklyScheduleScreen } from '../screens/schedule/WeeklyScheduleScreen';
import { MonthlyScheduleScreen } from '../screens/schedule/MonthlyScheduleScreen';
import { ClassDetailsScreen } from '../screens/schedule/ClassDetailsScreen';
import { AttendanceHistoryScreen } from '../screens/schedule/AttendanceHistoryScreen';
import { UpcomingAssignmentsScreen } from '../screens/schedule/UpcomingAssignmentsScreen';
import { AssignmentCalendarScreen } from '../screens/schedule/AssignmentCalendarScreen';
import { ExamScheduleScreen } from '../screens/schedule/ExamScheduleScreen';
import { StudyPlannerScreen } from '../screens/schedule/StudyPlannerScreen';
import { TimeBlockerScreen } from '../screens/schedule/TimeBlockerScreen';
import { ScheduleSettingsScreen } from '../screens/schedule/ScheduleSettingsScreen';

// Types
import type { ScheduleStackParamList, ScheduleStackScreenProps } from './types';

// Analytics and services
import { scheduleAnalytics } from '../services/schedule-analytics';
import { calendarService } from '../services/calendar-service';

// Icons
import Icon from 'react-native-vector-icons/Ionicons';

const Stack = createNativeStackNavigator<ScheduleStackParamList>();

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
  headerTintColor: theme.colors.purple[600],
  headerLeft: showBackButton ? undefined : () => null,
});

// =====================================================
// CUSTOM HEADER COMPONENTS
// =====================================================

interface ScheduleOverviewHeaderProps {
  navigation: any;
  currentDate?: Date;
  viewMode?: 'day' | 'week' | 'month';
  onViewModeChange?: (mode: 'day' | 'week' | 'month') => void;
}

const ScheduleOverviewHeader: React.FC<ScheduleOverviewHeaderProps> = ({ 
  navigation, 
  currentDate = new Date(),
  viewMode = 'week',
  onViewModeChange
}) => {
  const [selectedView, setSelectedView] = useState(viewMode);

  const handleCalendarPress = useCallback(() => {
    navigation.navigate('AssignmentCalendar');
  }, [navigation]);

  const handlePlannerPress = useCallback(() => {
    navigation.navigate('StudyPlanner');
  }, [navigation]);

  const handleSettingsPress = useCallback(() => {
    navigation.navigate('ScheduleSettings');
  }, [navigation]);

  const handleViewChange = useCallback((mode: 'day' | 'week' | 'month') => {
    setSelectedView(mode);
    onViewModeChange?.(mode);
    
    // Navigate to appropriate screen
    switch (mode) {
      case 'day':
        navigation.navigate('DailySchedule');
        break;
      case 'week':
        navigation.navigate('WeeklySchedule');
        break;
      case 'month':
        navigation.navigate('MonthlySchedule');
        break;
    }
  }, [navigation, onViewModeChange]);

  const formatCurrentDate = () => {
    const today = new Date();
    const isToday = currentDate.toDateString() === today.toDateString();
    
    if (isToday) {
      return 'Today';
    }
    
    return currentDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: currentDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <View style={styles.overviewHeader}>
      <View style={styles.overviewHeaderTop}>
        <View style={styles.overviewHeaderLeft}>
          <Text style={styles.overviewTitle}>Schedule</Text>
          <Text style={styles.overviewSubtitle}>
            {formatCurrentDate()}
          </Text>
        </View>
        <View style={styles.overviewHeaderRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCalendarPress}
            accessibilityLabel="View calendar"
            accessibilityRole="button"
          >
            <Icon name="calendar-outline" size={24} color={theme.colors.purple[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handlePlannerPress}
            accessibilityLabel="Study planner"
            accessibilityRole="button"
          >
            <Icon name="clipboard-outline" size={24} color={theme.colors.purple[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSettingsPress}
            accessibilityLabel="Schedule settings"
            accessibilityRole="button"
          >
            <Icon name="settings-outline" size={24} color={theme.colors.purple[600]} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.viewToggle}>
        {(['day', 'week', 'month'] as const).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.viewToggleButton,
              selectedView === mode && styles.viewToggleButtonActive,
            ]}
            onPress={() => handleViewChange(mode)}
            accessibilityLabel={`Switch to ${mode} view`}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.viewToggleText,
                selectedView === mode && styles.viewToggleTextActive,
              ]}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
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
    case 'DailySchedule':
    case 'WeeklySchedule':
    case 'MonthlySchedule':
      return (
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('TimeBlocker', { 
              date: route.params?.date || new Date().toISOString()
            })}
            accessibilityLabel="Add time block"
          >
            <Icon name="add-outline" size={24} color={theme.colors.purple[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              // Sync with external calendar
              calendarService.syncExternalCalendar();
            }}
            accessibilityLabel="Sync calendar"
          >
            <Icon name="sync-outline" size={24} color={theme.colors.purple[600]} />
          </TouchableOpacity>
        </View>
      );
    
    case 'ClassDetails':
      return (
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              // Add to personal calendar
            }}
            accessibilityLabel="Add to calendar"
          >
            <Icon name="calendar-outline" size={24} color={theme.colors.purple[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              // Share class details
            }}
            accessibilityLabel="Share class"
          >
            <Icon name="share-outline" size={24} color={theme.colors.purple[600]} />
          </TouchableOpacity>
        </View>
      );
    
    case 'UpcomingAssignments':
      return (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('AssignmentCalendar')}
          accessibilityLabel="Calendar view"
        >
          <Icon name="calendar-outline" size={24} color={theme.colors.purple[600]} />
        </TouchableOpacity>
      );
    
    case 'StudyPlanner':
      return (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            // Export study plan
          }}
          accessibilityLabel="Export study plan"
        >
          <Icon name="download-outline" size={24} color={theme.colors.purple[600]} />
        </TouchableOpacity>
      );
    
    default:
      return null;
  }
};

// =====================================================
// MAIN SCHEDULE STACK NAVIGATOR
// =====================================================

interface ScheduleStackNavigatorProps {}

export const ScheduleStackNavigator: React.FC<ScheduleStackNavigatorProps> = () => {
  const { getStudentProfile, updateActivity } = useAuth();
  const studentProfile = getStudentProfile();

  // Track schedule section usage
  useFocusEffect(
    useCallback(() => {
      scheduleAnalytics.trackScheduleSectionEnter();
      updateActivity();
      
      return () => {
        scheduleAnalytics.trackScheduleSectionExit();
      };
    }, [updateActivity])
  );

  return (
    <Stack.Navigator
      initialRouteName="ScheduleOverview"
      screenOptions={{
        gestureEnabled: true,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: theme.colors.neutral[50],
        },
      }}
    >
      {/* =====================================================
          MAIN SCHEDULE OVERVIEW (Entry Point)
          ===================================================== */}
      <Stack.Screen
        name="ScheduleOverview"
        component={ScheduleOverviewScreen}
        options={({ navigation }) => ({
          headerShown: true,
          header: () => (
            <ScheduleOverviewHeader
              navigation={navigation}
              onViewModeChange={(mode) => {
                scheduleAnalytics.trackViewModeChange(mode);
              }}
            />
          ),
        })}
      />

      {/* =====================================================
          SCHEDULE VIEWS
          ===================================================== */}
      <Stack.Screen
        name="DailySchedule"
        component={DailyScheduleScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Daily Schedule'),
          headerRight: getHeaderRight('DailySchedule')({ navigation, route }),
        })}
      />

      <Stack.Screen
        name="WeeklySchedule"
        component={WeeklyScheduleScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Weekly Schedule'),
          headerRight: getHeaderRight('WeeklySchedule')({ navigation, route }),
        })}
      />

      <Stack.Screen
        name="MonthlySchedule"
        component={MonthlyScheduleScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Monthly Schedule'),
          headerRight: getHeaderRight('MonthlySchedule')({ navigation, route }),
        })}
      />

      {/* =====================================================
          CLASS AND EVENT DETAILS
          ===================================================== */}
      <Stack.Screen
        name="ClassDetails"
        component={ClassDetailsScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Class Details'),
          headerRight: getHeaderRight('ClassDetails')({ navigation, route }),
        })}
      />

      <Stack.Screen
        name="AttendanceHistory"
        component={AttendanceHistoryScreen}
        options={getHeaderOptions('Attendance History')}
      />

      {/* =====================================================
          ASSIGNMENTS AND EXAMS
          ===================================================== */}
      <Stack.Screen
        name="UpcomingAssignments"
        component={UpcomingAssignmentsScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Upcoming Assignments'),
          headerRight: getHeaderRight('UpcomingAssignments')({ navigation, route }),
        })}
      />

      <Stack.Screen
        name="AssignmentCalendar"
        component={AssignmentCalendarScreen}
        options={getHeaderOptions('Assignment Calendar')}
      />

      <Stack.Screen
        name="ExamSchedule"
        component={ExamScheduleScreen}
        options={getHeaderOptions('Exam Schedule')}
      />

      {/* =====================================================
          PLANNING AND ORGANIZATION
          ===================================================== */}
      <Stack.Screen
        name="StudyPlanner"
        component={StudyPlannerScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Study Planner'),
          headerRight: getHeaderRight('StudyPlanner')({ navigation, route }),
        })}
      />

      <Stack.Screen
        name="TimeBlocker"
        component={TimeBlockerScreen}
        options={getHeaderOptions('Time Blocker')}
      />

      <Stack.Screen
        name="ScheduleSettings"
        component={ScheduleSettingsScreen}
        options={getHeaderOptions('Schedule Settings')}
      />
    </Stack.Navigator>
  );
};

// =====================================================
// PLACEHOLDER SCREEN COMPONENTS
// =====================================================
// These will be moved to separate files in the screens/schedule directory

const PlaceholderScreen: React.FC<{ 
  title: string; 
  description?: string;
  iconName?: string;
}> = ({ title, description, iconName = 'calendar-outline' }) => (
  <View style={styles.placeholderContainer}>
    <Icon 
      name={iconName} 
      size={64} 
      color={theme.colors.purple[400]} 
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
export const ScheduleOverviewScreen = () => (
  <PlaceholderScreen 
    title="Schedule Overview" 
    description="Central hub for all scheduling and time management"
    iconName="calendar"
  />
);

export const DailyScheduleScreen = () => (
  <PlaceholderScreen 
    title="Daily Schedule" 
    description="Detailed view of today's classes and activities"
    iconName="today-outline"
  />
);

export const WeeklyScheduleScreen = () => (
  <PlaceholderScreen 
    title="Weekly Schedule" 
    description="Week view of classes, assignments, and events"
    iconName="calendar-outline"
  />
);

export const MonthlyScheduleScreen = () => (
  <PlaceholderScreen 
    title="Monthly Schedule" 
    description="Month overview with important dates and deadlines"
    iconName="calendar-clear-outline"
  />
);

export const ClassDetailsScreen = () => (
  <PlaceholderScreen 
    title="Class Details" 
    description="Detailed information about specific classes"
    iconName="school-outline"
  />
);

export const AttendanceHistoryScreen = () => (
  <PlaceholderScreen 
    title="Attendance History" 
    description="Track attendance records and patterns"
    iconName="checkmark-done-outline"
  />
);

export const UpcomingAssignmentsScreen = () => (
  <PlaceholderScreen 
    title="Upcoming Assignments" 
    description="List of due assignments and deadlines"
    iconName="clipboard-outline"
  />
);

export const AssignmentCalendarScreen = () => (
  <PlaceholderScreen 
    title="Assignment Calendar" 
    description="Calendar view of assignments and due dates"
    iconName="calendar-number-outline"
  />
);

export const ExamScheduleScreen = () => (
  <PlaceholderScreen 
    title="Exam Schedule" 
    description="Upcoming exams and test schedules"
    iconName="document-text-outline"
  />
);

export const StudyPlannerScreen = () => (
  <PlaceholderScreen 
    title="Study Planner" 
    description="Personal study planning and time management"
    iconName="create-outline"
  />
);

export const TimeBlockerScreen = () => (
  <PlaceholderScreen 
    title="Time Blocker" 
    description="Block time for focused study sessions"
    iconName="time-outline"
  />
);

export const ScheduleSettingsScreen = () => (
  <PlaceholderScreen 
    title="Schedule Settings" 
    description="Customize schedule preferences and notifications"
    iconName="settings-outline"
  />
);

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  overviewHeader: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  overviewHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  overviewHeaderLeft: {
    flex: 1,
  },
  overviewHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  overviewTitle: {
    fontSize: 24,
    color: theme.colors.neutral[900],
    fontWeight: '700',
  },
  overviewSubtitle: {
    fontSize: 14,
    color: theme.colors.neutral[600],
    fontWeight: '500',
    marginTop: 2,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.purple[50],
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.neutral[100],
    borderRadius: 8,
    padding: 2,
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleButtonActive: {
    backgroundColor: theme.colors.white,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.neutral[600],
  },
  viewToggleTextActive: {
    color: theme.colors.purple[600],
    fontWeight: '600',
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
    color: theme.colors.purple[600],
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

export default ScheduleStackNavigator;