# Mobile Architecture: Teacher Dashboard for Harry School
Agent: mobile-developer
Date: 2025-08-20

## Executive Summary

This comprehensive mobile architecture document outlines the React Native implementation strategy for the Harry School Teacher Dashboard, designed to serve 50+ educators managing 500+ students across 25+ groups in Tashkent, Uzbekistan. The architecture prioritizes cultural sensitivity, offline-first functionality, and teacher productivity during active instruction periods.

**Key Architectural Decisions:**
- **Framework**: React Native 0.73+ with Expo SDK 51 for cross-platform consistency
- **Navigation**: React Navigation 7 with 5-tab bottom navigation system
- **State Management**: Zustand for local state + React Query for server state
- **Offline Architecture**: SQLite + MMKV with intelligent sync prioritization
- **Cultural Integration**: Islamic calendar, Uzbek/Russian/English multi-language support
- **Performance Target**: <2s load times, 60fps animations, 95% offline functionality

---

## Technology Stack and Dependencies

### Core Framework
```json
{
  "react-native": "0.73.6",
  "@expo/config": "^9.0.0",
  "expo": "~51.0.0",
  "expo-router": "~3.5.14"
}
```

### Navigation and Routing
```json
{
  "@react-navigation/native": "^7.0.0",
  "@react-navigation/bottom-tabs": "^7.0.0",
  "@react-navigation/stack": "^7.0.0",
  "react-native-screens": "^3.31.1",
  "react-native-safe-area-context": "^4.10.1"
}
```

### State Management
```json
{
  "zustand": "^4.5.2",
  "@tanstack/react-query": "^5.28.9",
  "react-native-mmkv": "^2.12.2",
  "expo-sqlite": "~14.0.3"
}
```

### UI and Animations
```json
{
  "nativewind": "^2.0.11",
  "react-native-reanimated": "^3.8.1",
  "react-native-gesture-handler": "^2.16.1",
  "react-native-svg": "15.2.0"
}
```

### Cultural and Internationalization
```json
{
  "expo-localization": "~15.0.3",
  "i18next": "^23.11.2",
  "react-i18next": "^14.1.0",
  "react-native-hijri-date-picker": "^1.0.3"
}
```

### Offline and Networking
```json
{
  "@supabase/supabase-js": "^2.42.0",
  "@react-native-community/netinfo": "^11.3.1",
  "react-native-background-sync": "^1.0.1"
}
```

---

## Application Architecture Overview

### Project Structure
```
mobile/apps/teacher/
├── src/
│   ├── navigation/
│   │   ├── TabNavigator.tsx          # 5-tab bottom navigation
│   │   ├── RootNavigator.tsx         # Auth/Main navigation
│   │   ├── stacks/
│   │   │   ├── DashboardStack.tsx    # Dashboard nested navigation
│   │   │   ├── GroupsStack.tsx       # Groups management screens
│   │   │   ├── ScheduleStack.tsx     # Calendar and scheduling
│   │   │   ├── FeedbackStack.tsx     # Grading and assessment
│   │   │   └── ProfileStack.tsx      # Settings and preferences
│   │   └── types.ts                  # Navigation type definitions
│   ├── screens/
│   │   ├── dashboard/
│   │   │   ├── DashboardScreen.tsx   # Main dashboard
│   │   │   └── QuickActionsScreen.tsx
│   │   ├── groups/
│   │   │   ├── GroupsOverviewScreen.tsx
│   │   │   ├── GroupDetailScreen.tsx
│   │   │   └── AttendanceScreen.tsx
│   │   ├── schedule/
│   │   │   ├── TodayScheduleScreen.tsx
│   │   │   ├── WeekViewScreen.tsx
│   │   │   └── CalendarScreen.tsx
│   │   ├── feedback/
│   │   │   ├── GradingQueueScreen.tsx
│   │   │   ├── ParentCommunicationScreen.tsx
│   │   │   └── ReportsScreen.tsx
│   │   └── profile/
│   │       ├── ProfileScreen.tsx
│   │       ├── SettingsScreen.tsx
│   │       └── SupportScreen.tsx
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── WelcomeHeader.tsx     # Cultural greeting system
│   │   │   ├── QuickActionsGrid.tsx  # 4 primary actions
│   │   │   ├── TodaysOverview.tsx    # Schedule summary card
│   │   │   ├── GroupsOverview.tsx    # Classes quick stats
│   │   │   ├── PerformanceMetrics.tsx
│   │   │   └── FloatingActionButton.tsx
│   │   ├── groups/
│   │   │   ├── GroupCard.tsx
│   │   │   ├── StudentList.tsx
│   │   │   └── AttendanceMarker.tsx
│   │   ├── schedule/
│   │   │   ├── PeriodCard.tsx
│   │   │   ├── TimelineView.tsx
│   │   │   └── IslamicCalendar.tsx   # Cultural calendar integration
│   │   ├── shared/
│   │   │   ├── SyncStatusIndicator.tsx
│   │   │   ├── NotificationBadge.tsx
│   │   │   ├── CulturalGreeting.tsx
│   │   │   └── OfflineIndicator.tsx
│   │   └── ui/                       # Shared UI components
│   ├── hooks/
│   │   ├── dashboard/
│   │   │   ├── useDashboardData.ts   # Real-time dashboard data
│   │   │   ├── useQuickActions.ts    # Cultural quick actions
│   │   │   └── useDashboardRefresh.ts
│   │   ├── offline/
│   │   │   ├── useOfflineQueue.ts    # Offline action management
│   │   │   ├── useNetworkStatus.ts   # Connection monitoring
│   │   │   └── useDataSync.ts        # Background sync
│   │   ├── cultural/
│   │   │   ├── useIslamicCalendar.ts # Prayer times, holidays
│   │   │   ├── useCulturalGreeting.ts
│   │   │   └── useLanguage.ts        # Multi-language support
│   │   └── shared/
│   │       ├── useRealTimeData.ts    # Supabase subscriptions
│   │       └── usePerformance.ts     # Performance monitoring
│   ├── services/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Supabase configuration
│   │   │   ├── realtime.ts           # Real-time subscriptions
│   │   │   └── offline.ts            # Offline data management
│   │   ├── cultural/
│   │   │   ├── islamicCalendar.ts    # Islamic calendar API
│   │   │   ├── prayerTimes.ts        # Prayer time calculations
│   │   │   └── localization.ts       # i18n service
│   │   ├── cache/
│   │   │   ├── mmkv.ts               # Fast key-value storage
│   │   │   ├── sqlite.ts             # Structured data storage
│   │   │   └── syncQueue.ts          # Offline sync queue
│   │   └── analytics/
│   │       ├── performance.ts        # Performance tracking
│   │       └── usage.ts              # Usage analytics
│   ├── stores/
│   │   ├── dashboard/
│   │   │   ├── dashboardStore.ts     # Dashboard state management
│   │   │   └── quickActionsStore.ts  # Quick actions state
│   │   ├── groups/
│   │   │   ├── groupsStore.ts        # Groups and students
│   │   │   └── attendanceStore.ts    # Attendance tracking
│   │   ├── schedule/
│   │   │   └── scheduleStore.ts      # Calendar and timing
│   │   ├── offline/
│   │   │   ├── offlineStore.ts       # Offline state management
│   │   │   └── syncStore.ts          # Sync status tracking
│   │   └── cultural/
│   │       ├── culturalStore.ts      # Cultural preferences
│   │       └── languageStore.ts      # Language settings
│   ├── types/
│   │   ├── teacher.ts                # Teacher data types
│   │   ├── groups.ts                 # Groups and students
│   │   ├── schedule.ts               # Calendar and periods
│   │   ├── cultural.ts               # Cultural data types
│   │   └── database.ts               # Supabase schema types
│   └── constants/
│       ├── cultural.ts               # Cultural constants
│       ├── colors.ts                 # Harry School brand colors
│       └── performance.ts            # Performance thresholds
├── app.json                          # Expo configuration
├── babel.config.js                   # Babel with NativeWind
├── tailwind.config.js                # NativeWind configuration
└── metro.config.js                   # Metro bundler config
```

---

## Navigation Architecture Implementation

### 5-Tab Bottom Navigation System

Based on the UX research findings, the navigation follows teacher workflow patterns with cultural considerations:

```typescript
// src/navigation/TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
  HomeIcon, 
  UsersIcon, 
  CalendarIcon, 
  ClipboardIcon, 
  UserIcon 
} from 'react-native-heroicons/outline';
import { useCulturalSettings } from '@/hooks/cultural/useCulturalSettings';
import { NotificationBadge } from '@/components/shared/NotificationBadge';

// Stack navigators for each tab
import DashboardStack from './stacks/DashboardStack';
import GroupsStack from './stacks/GroupsStack';
import ScheduleStack from './stacks/ScheduleStack';
import FeedbackStack from './stacks/FeedbackStack';
import ProfileStack from './stacks/ProfileStack';

const Tab = createBottomTabNavigator<TeacherTabParamList>();

export default function TeacherTabNavigator() {
  const { language, colors } = useCulturalSettings();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 88,
          paddingBottom: 34, // Safe area for iPhone
          paddingTop: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary, // Harry School #1d7452
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: -4,
        },
      }}
    >
      <Tab.Screen
        name="Schedule"
        component={ScheduleStack}
        options={{
          title: getLocalizedTitle('schedule', language),
          tabBarIcon: ({ color, size }) => (
            <CalendarIcon color={color} size={size} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Groups"
        component={GroupsStack}
        options={{
          title: getLocalizedTitle('groups', language),
          tabBarIcon: ({ color, size }) => (
            <UsersIcon color={color} size={size} />
          ),
          tabBarBadge: ({ color }) => (
            <NotificationBadge 
              count={urgentStudentIssues} 
              color={color}
              position="top-right"
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Home"
        component={DashboardStack}
        options={{
          title: getLocalizedTitle('dashboard', language),
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} />
          ),
          tabBarBadge: ({ color }) => (
            <NotificationBadge 
              count={totalUrgentNotifications} 
              color={color}
              position="top-right"
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Feedback"
        component={FeedbackStack}
        options={{
          title: getLocalizedTitle('feedback', language),
          tabBarIcon: ({ color, size }) => (
            <ClipboardIcon color={color} size={size} />
          ),
          tabBarBadge: ({ color }) => (
            <NotificationBadge 
              count={pendingGradingCount} 
              color={color}
              position="top-right"
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          title: getLocalizedTitle('profile', language),
          tabBarIcon: ({ color, size }) => (
            <UserIcon color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Cultural localization helper
function getLocalizedTitle(key: string, language: string): string {
  const titles = {
    schedule: {
      uz: 'Jadval',
      ru: 'Расписание', 
      en: 'Schedule'
    },
    groups: {
      uz: 'Guruhlar',
      ru: 'Группы',
      en: 'Groups'
    },
    dashboard: {
      uz: 'Bosh sahifa',
      ru: 'Главная',
      en: 'Home'
    },
    feedback: {
      uz: 'Baholash',
      ru: 'Оценки',
      en: 'Feedback'
    },
    profile: {
      uz: 'Profil',
      ru: 'Профиль',
      en: 'Profile'
    }
  };
  
  return titles[key]?.[language] || titles[key]?.en || key;
}

// Tab parameter list with cultural context
export type TeacherTabParamList = {
  Schedule: {
    date?: string;
    viewType?: 'day' | 'week' | 'month';
    culturalCalendar?: 'gregorian' | 'islamic' | 'both';
  };
  Groups: {
    groupId?: string;
    studentId?: string;
    action?: 'attendance' | 'behavior' | 'communication';
  };
  Home: {
    quickAction?: 'attendance' | 'grading' | 'parent-message' | 'emergency';
    notification?: string;
  };
  Feedback: {
    filterType?: 'pending' | 'overdue' | 'completed';
    assignmentId?: string;
    mode?: 'grade' | 'comment' | 'report';
  };
  Profile: {
    section?: 'settings' | 'professional' | 'cultural' | 'support';
  };
};
```

### Dashboard Stack Navigation

```typescript
// src/navigation/stacks/DashboardStack.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from '@/screens/dashboard/DashboardScreen';
import QuickActionsScreen from '@/screens/dashboard/QuickActionsScreen';
import NotificationCenterScreen from '@/screens/dashboard/NotificationCenterScreen';

const Stack = createStackNavigator<DashboardStackParamList>();

export default function DashboardStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        }),
      }}
    >
      <Stack.Screen 
        name="DashboardMain" 
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
        }}
      />
      
      <Stack.Screen 
        name="QuickActions" 
        component={QuickActionsScreen}
        options={{
          title: 'Quick Actions',
          presentation: 'modal',
          gestureDirection: 'vertical',
        }}
      />
      
      <Stack.Screen 
        name="NotificationCenter" 
        component={NotificationCenterScreen}
        options={{
          title: 'Notifications',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}

export type DashboardStackParamList = {
  DashboardMain: undefined;
  QuickActions: {
    selectedAction?: 'attendance' | 'grading' | 'communication' | 'emergency';
  };
  NotificationCenter: {
    filter?: 'all' | 'urgent' | 'academic' | 'administrative';
  };
};
```

---

## Dashboard Component Architecture

### Main Dashboard Screen Implementation

```typescript
// src/screens/dashboard/DashboardScreen.tsx
import React, { useEffect, useCallback } from 'react';
import { 
  ScrollView, 
  RefreshControl, 
  View, 
  Alert 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  FadeInDown, 
  stagger,
  useSharedValue,
  withSpring 
} from 'react-native-reanimated';

// Hooks
import { useDashboardData } from '@/hooks/dashboard/useDashboardData';
import { useQuickActions } from '@/hooks/dashboard/useQuickActions';
import { useCulturalGreeting } from '@/hooks/cultural/useCulturalGreeting';
import { useNetworkStatus } from '@/hooks/offline/useNetworkStatus';
import { useRealTimeSubscriptions } from '@/hooks/shared/useRealTimeData';

// Components
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { QuickActionsGrid } from '@/components/dashboard/QuickActionsGrid';
import { TodaysOverview } from '@/components/dashboard/TodaysOverview';
import { GroupsOverview } from '@/components/dashboard/GroupsOverview';
import { PerformanceMetrics } from '@/components/dashboard/PerformanceMetrics';
import { FloatingActionButton } from '@/components/dashboard/FloatingActionButton';
import { SyncStatusIndicator } from '@/components/shared/SyncStatusIndicator';
import { OfflineIndicator } from '@/components/shared/OfflineIndicator';

// Types
import type { TeacherTabParamList } from '@/navigation/TabNavigator';
import type { StackScreenProps } from '@react-navigation/stack';

type DashboardScreenProps = StackScreenProps<TeacherTabParamList, 'Home'>;

export default function DashboardScreen({ navigation, route }: DashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const refreshOffset = useSharedValue(0);
  
  // Data hooks
  const {
    dashboardData,
    isLoading,
    isRefreshing,
    error,
    refetch,
    lastUpdated
  } = useDashboardData();
  
  const {
    quickActions,
    executeQuickAction,
    isExecuting
  } = useQuickActions();
  
  const {
    greeting,
    timeContext,
    culturalContext
  } = useCulturalGreeting();
  
  const { isOnline, connectionQuality } = useNetworkStatus();
  
  // Real-time subscriptions for dashboard data
  useRealTimeSubscriptions({
    tables: ['teacher_groups', 'student_attendance', 'assignments', 'notifications'],
    onDataChange: useCallback((table: string, payload: any) => {
      // Handle real-time updates
      if (table === 'notifications') {
        handleNewNotification(payload.new);
      }
      // Trigger data refetch for relevant changes
      refetch();
    }, [refetch])
  });

  // Handle quick action from route params
  useEffect(() => {
    if (route.params?.quickAction) {
      executeQuickAction(route.params.quickAction);
    }
  }, [route.params?.quickAction, executeQuickAction]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    refreshOffset.value = withSpring(1, { damping: 15 });
    await refetch();
    refreshOffset.value = withSpring(0);
  }, [refetch, refreshOffset]);

  // Handle new notifications
  const handleNewNotification = useCallback((notification: any) => {
    if (notification.priority === 'critical') {
      Alert.alert(
        notification.title,
        notification.message,
        [
          { text: 'OK', style: 'default' },
          ...(notification.action_url ? [{ 
            text: 'View', 
            onPress: () => navigation.navigate('NotificationCenter', { 
              filter: 'urgent' 
            })
          }] : [])
        ]
      );
    }
  }, [navigation]);

  // Handle floating action button press
  const handleFloatingAction = useCallback((action: string) => {
    executeQuickAction(action);
  }, [executeQuickAction]);

  if (error && !dashboardData) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-lg text-red-600 text-center mb-4">
          Unable to load dashboard
        </Text>
        <Button onPress={refetch} title="Retry" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Sync Status Bar */}
      <SyncStatusIndicator 
        isOnline={isOnline}
        lastSync={lastUpdated}
        connectionQuality={connectionQuality}
      />
      
      {/* Offline Indicator */}
      {!isOnline && <OfflineIndicator />}
      
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#1d7452"
            colors={['#1d7452']}
            progressBackgroundColor="#ffffff"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Welcome Header with Cultural Greeting */}
        <Animated.View entering={FadeInDown.delay(0).springify()}>
          <WelcomeHeader
            greeting={greeting}
            timeContext={timeContext}
            culturalContext={culturalContext}
            teacher={dashboardData?.teacher}
            notificationCount={dashboardData?.notifications?.urgent || 0}
            onNotificationPress={() => navigation.navigate('NotificationCenter')}
          />
        </Animated.View>

        {/* Quick Actions Grid */}
        <Animated.View 
          entering={FadeInDown.delay(100).springify()}
          className="px-4 mb-6"
        >
          <QuickActionsGrid
            actions={quickActions}
            onActionPress={executeQuickAction}
            isExecuting={isExecuting}
            culturalContext={culturalContext}
          />
        </Animated.View>

        {/* Today's Overview */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <TodaysOverview
            schedule={dashboardData?.todaySchedule}
            currentPeriod={dashboardData?.currentPeriod}
            upcomingPeriod={dashboardData?.upcomingPeriod}
            islamicCalendar={dashboardData?.islamicCalendar}
            onPeriodPress={(period) => navigation.navigate('Schedule', { 
              viewType: 'day',
              date: period.date 
            })}
          />
        </Animated.View>

        {/* Groups Overview */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <GroupsOverview
            groups={dashboardData?.teacherGroups}
            attendanceStats={dashboardData?.attendanceStats}
            behaviorAlerts={dashboardData?.behaviorAlerts}
            onGroupPress={(groupId) => navigation.navigate('Groups', { 
              groupId,
              action: 'attendance' 
            })}
          />
        </Animated.View>

        {/* Performance Metrics */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <PerformanceMetrics
            metrics={dashboardData?.performanceMetrics}
            culturalContext={culturalContext}
            onMetricPress={(metric) => navigation.navigate('Feedback', { 
              filterType: metric 
            })}
          />
        </Animated.View>
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={handleFloatingAction}
        primaryActions={quickActions.slice(0, 4)}
        position="bottom-right"
        culturalContext={culturalContext}
      />
    </View>
  );
}
```

### Welcome Header Component with Cultural Integration

```typescript
// src/components/dashboard/WelcomeHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { BellIcon, SunIcon, MoonIcon } from 'react-native-heroicons/outline';
import Animated, { 
  FadeIn, 
  useSharedValue, 
  useAnimatedStyle,
  withSpring 
} from 'react-native-reanimated';

import { useCulturalSettings } from '@/hooks/cultural/useCulturalSettings';
import { NotificationBadge } from '@/components/shared/NotificationBadge';

interface WelcomeHeaderProps {
  greeting: string;
  timeContext: 'morning' | 'teaching' | 'break' | 'evening';
  culturalContext: {
    islamicDate: string;
    gregorianDate: string;
    nextPrayerTime?: string;
    prayerName?: string;
  };
  teacher: {
    name: string;
    title: string;
    department: string;
    profileImage?: string;
  };
  notificationCount: number;
  onNotificationPress: () => void;
}

export function WelcomeHeader({
  greeting,
  timeContext,
  culturalContext,
  teacher,
  notificationCount,
  onNotificationPress
}: WelcomeHeaderProps) {
  const { colors, language } = useCulturalSettings();
  const pulseAnimation = useSharedValue(1);

  // Animate notification badge when count changes
  React.useEffect(() => {
    if (notificationCount > 0) {
      pulseAnimation.value = withSpring(1.2, { damping: 8 }, () => {
        pulseAnimation.value = withSpring(1);
      });
    }
  }, [notificationCount, pulseAnimation]);

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const getTimeIcon = () => {
    const iconProps = { size: 20, color: colors.muted };
    switch (timeContext) {
      case 'morning':
      case 'teaching':
        return <SunIcon {...iconProps} />;
      case 'evening':
        return <MoonIcon {...iconProps} />;
      default:
        return <SunIcon {...iconProps} />;
    }
  };

  return (
    <Animated.View 
      entering={FadeIn.duration(800)}
      className="bg-white px-4 py-6 shadow-sm border-b border-gray-100"
      style={{ backgroundColor: colors.surface }}
    >
      {/* Top Row: Teacher Info + Notifications */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center flex-1">
          {/* Teacher Avatar */}
          <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mr-3">
            {teacher.profileImage ? (
              <Image 
                source={{ uri: teacher.profileImage }} 
                className="w-full h-full rounded-full"
              />
            ) : (
              <Text 
                className="text-lg font-semibold"
                style={{ color: colors.primary }}
              >
                {teacher.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          {/* Teacher Details */}
          <View className="flex-1">
            <Text 
              className="text-base font-semibold"
              style={{ color: colors.foreground }}
            >
              {teacher.title} {teacher.name}
            </Text>
            <Text 
              className="text-sm"
              style={{ color: colors.muted }}
            >
              {teacher.department}
            </Text>
          </View>
        </View>

        {/* Notifications */}
        <TouchableOpacity
          onPress={onNotificationPress}
          className="relative p-2"
          activeOpacity={0.7}
        >
          <BellIcon size={24} color={colors.foreground} />
          {notificationCount > 0 && (
            <Animated.View style={[animatedBadgeStyle]}>
              <NotificationBadge
                count={notificationCount}
                position="top-right"
                color={colors.destructive}
              />
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>

      {/* Cultural Greeting */}
      <View className="mb-3">
        <Text 
          className="text-lg font-medium mb-1"
          style={{ color: colors.foreground }}
        >
          {greeting}
        </Text>
        <View className="flex-row items-center">
          {getTimeIcon()}
          <Text 
            className="text-sm ml-2"
            style={{ color: colors.muted }}
          >
            {formatTimeContext(timeContext, language)}
          </Text>
        </View>
      </View>

      {/* Cultural Calendar Info */}
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text 
            className="text-sm font-medium"
            style={{ color: colors.foreground }}
          >
            {culturalContext.gregorianDate}
          </Text>
          <Text 
            className="text-xs"
            style={{ color: colors.muted }}
          >
            {culturalContext.islamicDate}
          </Text>
        </View>

        {/* Prayer Time Info */}
        {culturalContext.nextPrayerTime && (
          <View className="items-end">
            <Text 
              className="text-xs"
              style={{ color: colors.muted }}
            >
              Next: {culturalContext.prayerName}
            </Text>
            <Text 
              className="text-sm font-medium"
              style={{ color: colors.primary }}
            >
              {culturalContext.nextPrayerTime}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// Helper function for time context formatting
function formatTimeContext(timeContext: string, language: string): string {
  const contexts = {
    morning: {
      uz: 'Ertalab tayyorgarlik',
      ru: 'Утренняя подготовка',
      en: 'Morning preparation'
    },
    teaching: {
      uz: 'Dars jarayoni',
      ru: 'Учебный процесс',
      en: 'Teaching period'
    },
    break: {
      uz: 'Tanaffus vaqti',
      ru: 'Время перерыва',
      en: 'Break time'
    },
    evening: {
      uz: 'Kun yakunlash',
      ru: 'Завершение дня',
      en: 'End of day'
    }
  };

  return contexts[timeContext]?.[language] || contexts[timeContext]?.en || timeContext;
}
```

### Quick Actions Grid Component

```typescript
// src/components/dashboard/QuickActionsGrid.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, { 
  FadeInUp, 
  useSharedValue, 
  useAnimatedStyle,
  withSpring,
  withTiming 
} from 'react-native-reanimated';
import { 
  UserGroupIcon, 
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon 
} from 'react-native-heroicons/outline';

import { useCulturalSettings } from '@/hooks/cultural/useCulturalSettings';

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  color: string;
  culturalContext?: {
    urgencyLevel: 'emergency' | 'immediate' | 'respectful' | 'gentle';
    hierarchyLevel: 'upward' | 'peer' | 'downward' | 'parent';
  };
  disabled?: boolean;
  badge?: number;
}

interface QuickActionsGridProps {
  actions: QuickAction[];
  onActionPress: (actionId: string) => void;
  isExecuting: string | null;
  culturalContext: any;
}

export function QuickActionsGrid({
  actions,
  onActionPress,
  isExecuting,
  culturalContext
}: QuickActionsGridProps) {
  const { colors } = useCulturalSettings();

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      {/* Section Title */}
      <Text 
        className="text-lg font-semibold mb-4"
        style={{ color: colors.foreground }}
      >
        Quick Actions
      </Text>

      {/* Actions Grid */}
      <View className="flex-row flex-wrap justify-between">
        {actions.slice(0, 4).map((action, index) => (
          <QuickActionCard
            key={action.id}
            action={action}
            onPress={() => onActionPress(action.id)}
            isExecuting={isExecuting === action.id}
            index={index}
          />
        ))}
      </View>
    </View>
  );
}

interface QuickActionCardProps {
  action: QuickAction;
  onPress: () => void;
  isExecuting: boolean;
  index: number;
}

function QuickActionCard({ action, onPress, isExecuting, index }: QuickActionCardProps) {
  const { colors } = useCulturalSettings();
  const scaleValue = useSharedValue(1);
  const opacityValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: opacityValue.value,
  }));

  const handlePressIn = () => {
    scaleValue.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scaleValue.value = withSpring(1, { damping: 15 });
  };

  const handlePress = () => {
    if (action.disabled || isExecuting) return;
    
    opacityValue.value = withTiming(0.7, { duration: 100 }, () => {
      opacityValue.value = withTiming(1, { duration: 100 });
    });
    
    onPress();
  };

  const IconComponent = action.icon;

  return (
    <Animated.View 
      entering={FadeInUp.delay(index * 100).springify()}
      style={[animatedStyle]}
      className="w-[48%] mb-3"
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={action.disabled || isExecuting}
        className="p-4 rounded-lg items-center relative"
        style={{ 
          backgroundColor: action.disabled ? colors.muted : `${action.color}10`,
          borderColor: action.color,
          borderWidth: 1,
          minHeight: 100,
        }}
        activeOpacity={0.8}
      >
        {/* Badge */}
        {action.badge && action.badge > 0 && (
          <View 
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.destructive }}
          >
            <Text className="text-white text-xs font-bold">
              {action.badge > 99 ? '99+' : action.badge}
            </Text>
          </View>
        )}

        {/* Icon */}
        <View className="mb-3">
          {isExecuting ? (
            <ActivityIndicator size="small" color={action.color} />
          ) : (
            <IconComponent 
              size={32} 
              color={action.disabled ? colors.muted : action.color} 
            />
          )}
        </View>

        {/* Content */}
        <Text 
          className="text-sm font-semibold text-center mb-1"
          style={{ 
            color: action.disabled ? colors.muted : colors.foreground 
          }}
        >
          {action.title}
        </Text>
        <Text 
          className="text-xs text-center"
          style={{ 
            color: action.disabled ? colors.muted : colors.muted 
          }}
          numberOfLines={2}
        >
          {action.subtitle}
        </Text>

        {/* Cultural Urgency Indicator */}
        {action.culturalContext?.urgencyLevel === 'emergency' && (
          <View className="absolute top-1 left-1">
            <ExclamationTriangleIcon size={16} color={colors.destructive} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
```

---

## State Management Architecture

### Zustand Store Implementation

```typescript
// src/stores/dashboard/dashboardStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// MMKV storage for persistence
const storage = new MMKV();

const zustandStorage = {
  setItem: (name: string, value: string) => {
    return storage.set(name, value);
  },
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name: string) => {
    return storage.delete(name);
  },
};

// Types
interface DashboardData {
  teacher: TeacherProfile;
  todaySchedule: PeriodInfo[];
  currentPeriod: PeriodInfo | null;
  upcomingPeriod: PeriodInfo | null;
  teacherGroups: GroupSummary[];
  attendanceStats: AttendanceStats;
  behaviorAlerts: BehaviorAlert[];
  notifications: NotificationSummary;
  performanceMetrics: PerformanceMetrics;
  islamicCalendar: IslamicCalendarData;
  lastUpdated: Date;
}

interface DashboardState {
  // Data
  dashboardData: DashboardData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Quick Actions
  quickActions: QuickAction[];
  isExecutingAction: string | null;
  
  // Cultural Context
  culturalContext: CulturalContext;
  
  // Real-time Status
  realTimeConnected: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  
  // Actions
  setDashboardData: (data: DashboardData) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  executeQuickAction: (actionId: string) => Promise<void>;
  updateRealTimeData: (table: string, data: any) => void;
  setSyncStatus: (status: DashboardState['syncStatus']) => void;
  refreshDashboard: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        dashboardData: null,
        isLoading: false,
        isRefreshing: false,
        error: null,
        quickActions: getDefaultQuickActions(),
        isExecutingAction: null,
        culturalContext: getDefaultCulturalContext(),
        realTimeConnected: false,
        syncStatus: 'offline',

        // Actions
        setDashboardData: (data: DashboardData) => 
          set({ dashboardData: data, lastUpdated: new Date() }),

        setLoading: (loading: boolean) => 
          set({ isLoading: loading }),

        setRefreshing: (refreshing: boolean) => 
          set({ isRefreshing: refreshing }),

        setError: (error: string | null) => 
          set({ error }),

        executeQuickAction: async (actionId: string) => {
          set({ isExecutingAction: actionId });
          
          try {
            const action = get().quickActions.find(a => a.id === actionId);
            if (!action) throw new Error('Action not found');

            // Execute the action based on type
            switch (actionId) {
              case 'mark-attendance':
                await handleMarkAttendance();
                break;
              case 'parent-message':
                await handleParentMessage();
                break;
              case 'enter-grades':
                await handleEnterGrades();
                break;
              case 'emergency-alert':
                await handleEmergencyAlert();
                break;
              default:
                throw new Error('Unknown action');
            }

            // Update action success state
            set((state) => ({
              quickActions: state.quickActions.map(a => 
                a.id === actionId 
                  ? { ...a, lastExecuted: new Date() }
                  : a
              )
            }));

          } catch (error) {
            set({ error: error.message });
          } finally {
            set({ isExecutingAction: null });
          }
        },

        updateRealTimeData: (table: string, data: any) => {
          const currentData = get().dashboardData;
          if (!currentData) return;

          // Update specific parts of dashboard data based on table
          switch (table) {
            case 'teacher_groups':
              set({
                dashboardData: {
                  ...currentData,
                  teacherGroups: updateGroupsData(currentData.teacherGroups, data)
                }
              });
              break;
            
            case 'student_attendance':
              set({
                dashboardData: {
                  ...currentData,
                  attendanceStats: updateAttendanceStats(currentData.attendanceStats, data)
                }
              });
              break;
              
            case 'notifications':
              set({
                dashboardData: {
                  ...currentData,
                  notifications: updateNotifications(currentData.notifications, data)
                }
              });
              break;
          }
        },

        setSyncStatus: (status: DashboardState['syncStatus']) => 
          set({ syncStatus: status }),

        refreshDashboard: async () => {
          set({ isRefreshing: true, error: null });
          
          try {
            // Fetch fresh dashboard data
            const data = await fetchDashboardData();
            set({ dashboardData: data, lastUpdated: new Date() });
          } catch (error) {
            set({ error: error.message });
          } finally {
            set({ isRefreshing: false });
          }
        }
      }),
      {
        name: 'teacher-dashboard-storage',
        storage: createJSONStorage(() => zustandStorage),
        partialize: (state) => ({
          // Only persist certain parts of the state
          culturalContext: state.culturalContext,
          quickActions: state.quickActions,
        }),
      }
    ),
    {
      name: 'teacher-dashboard-store',
    }
  )
);

// Helper functions
function getDefaultQuickActions(): QuickAction[] {
  return [
    {
      id: 'mark-attendance',
      title: 'Mark Attendance',
      subtitle: 'Quick class attendance',
      icon: UserGroupIcon,
      color: '#1d7452',
      culturalContext: {
        urgencyLevel: 'immediate',
        hierarchyLevel: 'downward'
      }
    },
    {
      id: 'parent-message',
      title: 'Parent Message',
      subtitle: 'Send parent communication',
      icon: ChatBubbleLeftRightIcon,
      color: '#3b82f6',
      culturalContext: {
        urgencyLevel: 'respectful',
        hierarchyLevel: 'parent'
      }
    },
    {
      id: 'enter-grades',
      title: 'Enter Grades',
      subtitle: 'Quick grade entry',
      icon: ClipboardDocumentCheckIcon,
      color: '#f59e0b',
      culturalContext: {
        urgencyLevel: 'gentle',
        hierarchyLevel: 'downward'
      }
    },
    {
      id: 'emergency-alert',
      title: 'Emergency',
      subtitle: 'Alert administration',
      icon: ExclamationTriangleIcon,
      color: '#ef4444',
      culturalContext: {
        urgencyLevel: 'emergency',
        hierarchyLevel: 'upward'
      }
    }
  ];
}

// Quick action handlers
async function handleMarkAttendance() {
  // Implementation for marking attendance
  // Navigate to attendance screen or open modal
}

async function handleParentMessage() {
  // Implementation for parent messaging
  // Open culturally appropriate message templates
}

async function handleEnterGrades() {
  // Implementation for grade entry
  // Navigate to grading interface
}

async function handleEmergencyAlert() {
  // Implementation for emergency alerts
  // Immediate notification to administration
}

// Data update helpers
function updateGroupsData(currentGroups: GroupSummary[], newData: any): GroupSummary[] {
  // Logic to update groups data with real-time changes
  return currentGroups.map(group => {
    if (group.id === newData.group_id) {
      return { ...group, ...newData };
    }
    return group;
  });
}

function updateAttendanceStats(currentStats: AttendanceStats, newData: any): AttendanceStats {
  // Logic to update attendance statistics
  return {
    ...currentStats,
    todayPresent: newData.present_count,
    todayAbsent: newData.absent_count,
    attendanceRate: newData.attendance_rate
  };
}

function updateNotifications(currentNotifications: NotificationSummary, newData: any): NotificationSummary {
  // Logic to update notification counts
  return {
    ...currentNotifications,
    urgent: currentNotifications.urgent + (newData.priority === 'urgent' ? 1 : 0),
    total: currentNotifications.total + 1
  };
}
```

### Offline Store for Queue Management

```typescript
// src/stores/offline/offlineStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const offlineStorage = new MMKV({ id: 'offline-queue' });

interface OfflineAction {
  id: string;
  type: 'attendance' | 'grading' | 'communication' | 'emergency';
  data: any;
  timestamp: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
  retries: number;
  maxRetries: number;
  culturalContext?: {
    urgencyLevel: string;
    hierarchyLevel: string;
  };
}

interface OfflineState {
  // Queue management
  actionQueue: OfflineAction[];
  isProcessingQueue: boolean;
  failedActions: OfflineAction[];
  
  // Network status
  isOnline: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  lastSyncAttempt: Date | null;
  
  // Sync statistics
  syncStats: {
    totalSynced: number;
    totalFailed: number;
    lastSuccessfulSync: Date | null;
  };
  
  // Actions
  addToQueue: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries'>) => void;
  removeFromQueue: (actionId: string) => void;
  processQueue: () => Promise<void>;
  retryFailedAction: (actionId: string) => Promise<void>;
  clearQueue: () => void;
  setNetworkStatus: (isOnline: boolean, quality: OfflineState['connectionQuality']) => void;
  updateSyncStats: (success: boolean) => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      // Initial state
      actionQueue: [],
      isProcessingQueue: false,
      failedActions: [],
      isOnline: false,
      connectionQuality: 'offline',
      lastSyncAttempt: null,
      syncStats: {
        totalSynced: 0,
        totalFailed: 0,
        lastSuccessfulSync: null,
      },

      // Actions
      addToQueue: (actionData) => {
        const action: OfflineAction = {
          ...actionData,
          id: generateActionId(),
          timestamp: new Date(),
          retries: 0,
        };

        set((state) => ({
          actionQueue: [...state.actionQueue, action].sort(
            (a, b) => getPriorityWeight(a.priority) - getPriorityWeight(b.priority)
          ),
        }));

        // Immediately try to process if online
        if (get().isOnline && !get().isProcessingQueue) {
          get().processQueue();
        }
      },

      removeFromQueue: (actionId) => {
        set((state) => ({
          actionQueue: state.actionQueue.filter(action => action.id !== actionId),
        }));
      },

      processQueue: async () => {
        const state = get();
        if (!state.isOnline || state.isProcessingQueue || state.actionQueue.length === 0) {
          return;
        }

        set({ isProcessingQueue: true, lastSyncAttempt: new Date() });

        const queue = [...state.actionQueue];
        const processed: string[] = [];
        const failed: OfflineAction[] = [];

        for (const action of queue) {
          try {
            await executeOfflineAction(action);
            processed.push(action.id);
            get().updateSyncStats(true);
          } catch (error) {
            console.error(`Failed to execute action ${action.id}:`, error);
            
            const updatedAction = {
              ...action,
              retries: action.retries + 1,
            };

            if (updatedAction.retries >= action.maxRetries) {
              failed.push(updatedAction);
              get().updateSyncStats(false);
            } else {
              // Keep in queue for retry
              set((state) => ({
                actionQueue: state.actionQueue.map(a => 
                  a.id === action.id ? updatedAction : a
                ),
              }));
            }
          }
        }

        // Remove processed actions and add failed ones
        set((state) => ({
          actionQueue: state.actionQueue.filter(action => !processed.includes(action.id)),
          failedActions: [...state.failedActions, ...failed],
          isProcessingQueue: false,
        }));
      },

      retryFailedAction: async (actionId) => {
        const state = get();
        const failedAction = state.failedActions.find(action => action.id === actionId);
        
        if (!failedAction) return;

        try {
          await executeOfflineAction(failedAction);
          
          set((state) => ({
            failedActions: state.failedActions.filter(action => action.id !== actionId),
          }));
          
          get().updateSyncStats(true);
        } catch (error) {
          console.error(`Retry failed for action ${actionId}:`, error);
          get().updateSyncStats(false);
        }
      },

      clearQueue: () => {
        set({
          actionQueue: [],
          failedActions: [],
        });
      },

      setNetworkStatus: (isOnline, quality) => {
        set({ isOnline, connectionQuality: quality });
        
        // Auto-process queue when coming back online
        if (isOnline && !get().isProcessingQueue) {
          setTimeout(() => get().processQueue(), 1000);
        }
      },

      updateSyncStats: (success) => {
        set((state) => ({
          syncStats: {
            totalSynced: state.syncStats.totalSynced + (success ? 1 : 0),
            totalFailed: state.syncStats.totalFailed + (success ? 0 : 1),
            lastSuccessfulSync: success ? new Date() : state.syncStats.lastSuccessfulSync,
          },
        }));
      },
    }),
    {
      name: 'offline-queue-storage',
      storage: createJSONStorage(() => ({
        setItem: (name: string, value: string) => offlineStorage.set(name, value),
        getItem: (name: string) => offlineStorage.getString(name) ?? null,
        removeItem: (name: string) => offlineStorage.delete(name),
      })),
      partialize: (state) => ({
        actionQueue: state.actionQueue,
        failedActions: state.failedActions,
        syncStats: state.syncStats,
      }),
    }
  )
);

// Helper functions
function generateActionId(): string {
  return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getPriorityWeight(priority: OfflineAction['priority']): number {
  const weights = { critical: 1, high: 2, medium: 3, low: 4 };
  return weights[priority] || 5;
}

async function executeOfflineAction(action: OfflineAction): Promise<void> {
  // Execute the action based on its type
  switch (action.type) {
    case 'attendance':
      return await syncAttendanceData(action.data);
    case 'grading':
      return await syncGradingData(action.data);
    case 'communication':
      return await syncCommunicationData(action.data);
    case 'emergency':
      return await syncEmergencyAlert(action.data);
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

// Sync implementations
async function syncAttendanceData(data: any): Promise<void> {
  // Implementation for syncing attendance data
}

async function syncGradingData(data: any): Promise<void> {
  // Implementation for syncing grading data
}

async function syncCommunicationData(data: any): Promise<void> {
  // Implementation for syncing communication data
}

async function syncEmergencyAlert(data: any): Promise<void> {
  // Implementation for syncing emergency alerts
}
```

---

## Real-Time Data Management

### Supabase Real-Time Integration

```typescript
// src/hooks/shared/useRealTimeData.ts
import { useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase/client';
import { useDashboardStore } from '@/stores/dashboard/dashboardStore';
import { useOfflineStore } from '@/stores/offline/offlineStore';

interface RealTimeSubscriptionConfig {
  tables: string[];
  onDataChange: (table: string, payload: any) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function useRealTimeSubscriptions({
  tables,
  onDataChange,
  onConnectionChange
}: RealTimeSubscriptionConfig) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { setSyncStatus } = useDashboardStore();
  const { isOnline } = useOfflineStore();

  const handleRealtimeChange = useCallback((payload: any) => {
    const { table, eventType, new: newRecord, old: oldRecord } = payload;
    
    console.log(`Real-time change in ${table}:`, eventType, payload);
    
    // Call the provided data change handler
    onDataChange(table, payload);
    
    // Update sync status
    setSyncStatus('synced');
  }, [onDataChange, setSyncStatus]);

  const handleConnectionChange = useCallback((status: string) => {
    const connected = status === 'SUBSCRIBED';
    
    console.log(`Real-time connection status: ${status}`);
    
    // Update connection status in stores
    setSyncStatus(connected ? 'synced' : 'offline');
    
    // Call the provided connection change handler
    onConnectionChange?.(connected);
  }, [onConnectionChange, setSyncStatus]);

  useEffect(() => {
    if (!isOnline) {
      // Don't attempt real-time connection when offline
      setSyncStatus('offline');
      return;
    }

    // Create a single channel for all subscriptions
    const channel = supabase.channel('teacher-dashboard-updates');
    channelRef.current = channel;

    // Subscribe to each table
    tables.forEach(table => {
      channel.on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: table,
        },
        handleRealtimeChange
      );
    });

    // Handle connection status changes
    channel.on('system', {}, (payload) => {
      handleConnectionChange(payload.status);
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      handleConnectionChange(status);
    });

    // Cleanup function
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [tables, isOnline, handleRealtimeChange, handleConnectionChange]);

  // Manually reconnect function
  const reconnect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }
    
    // Re-trigger the effect to create a new connection
    // This would typically be called when network comes back online
  }, []);

  return {
    reconnect,
    isConnected: channelRef.current?.state === 'subscribed',
  };
}

// Teacher-specific real-time data hook
export function useTeacherRealTimeData() {
  const { updateRealTimeData } = useDashboardStore();
  const { isOnline } = useOfflineStore();

  const handleTeacherDataChange = useCallback((table: string, payload: any) => {
    // Filter and process data changes relevant to the current teacher
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (table) {
      case 'teacher_groups':
        // Handle changes to teacher's groups
        if (eventType === 'UPDATE' || eventType === 'INSERT') {
          updateRealTimeData('teacher_groups', newRecord);
        }
        break;

      case 'student_attendance':
        // Handle attendance changes for teacher's students
        if (isTeacherStudent(newRecord.student_id)) {
          updateRealTimeData('student_attendance', newRecord);
        }
        break;

      case 'assignments':
        // Handle assignment-related changes
        if (isTeacherAssignment(newRecord.teacher_id)) {
          updateRealTimeData('assignments', newRecord);
        }
        break;

      case 'notifications':
        // Handle notifications for the teacher
        if (isTeacherNotification(newRecord.recipient_id)) {
          updateRealTimeData('notifications', newRecord);
          
          // Show immediate notification for critical alerts
          if (newRecord.priority === 'critical') {
            showCriticalNotification(newRecord);
          }
        }
        break;
    }
  }, [updateRealTimeData]);

  // Use the general real-time hook with teacher-specific configuration
  return useRealTimeSubscriptions({
    tables: [
      'teacher_groups',
      'student_attendance', 
      'assignments',
      'notifications',
      'grading_queue',
      'parent_communications'
    ],
    onDataChange: handleTeacherDataChange,
    onConnectionChange: (connected) => {
      console.log(`Teacher real-time connection: ${connected ? 'connected' : 'disconnected'}`);
    }
  });
}

// Helper functions
function isTeacherStudent(studentId: string): boolean {
  // Check if the student belongs to any of the teacher's groups
  // This would typically check against the current teacher's group assignments
  return true; // Simplified for example
}

function isTeacherAssignment(teacherId: string): boolean {
  // Check if the assignment belongs to the current teacher
  return true; // Simplified for example
}

function isTeacherNotification(recipientId: string): boolean {
  // Check if the notification is for the current teacher
  return true; // Simplified for example
}

function showCriticalNotification(notification: any): void {
  // Show immediate notification UI for critical alerts
  // This could trigger a modal, alert, or push notification
  console.log('Critical notification:', notification);
}
```

### Cultural Calendar Integration

```typescript
// src/services/cultural/islamicCalendar.ts
import { create } from 'zustand';

interface IslamicCalendarData {
  hijriDate: string;
  gregorianDate: string;
  islamicMonth: string;
  islamicYear: number;
  weekday: string;
  prayerTimes: PrayerTimes;
  specialEvents: IslamicEvent[];
  ramadanInfo?: RamadanInfo;
}

interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  nextPrayer: {
    name: string;
    time: string;
    remaining: string;
  };
}

interface IslamicEvent {
  name: string;
  description: string;
  type: 'holiday' | 'observance' | 'significant';
  priority: 'high' | 'medium' | 'low';
}

interface RamadanInfo {
  isRamadan: boolean;
  dayOfRamadan?: number;
  suhoorEnd: string;
  iftarTime: string;
}

interface CulturalCalendarState {
  islamicCalendar: IslamicCalendarData | null;
  location: {
    latitude: number;
    longitude: number;
    city: string;
  };
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchIslamicCalendar: (date?: Date) => Promise<void>;
  updateLocation: (lat: number, lng: number, city: string) => void;
  calculatePrayerTimes: (date: Date) => PrayerTimes;
}

export const useCulturalCalendarStore = create<CulturalCalendarState>((set, get) => ({
  islamicCalendar: null,
  location: {
    latitude: 41.2995, // Tashkent coordinates
    longitude: 69.2401,
    city: 'Tashkent'
  },
  isLoading: false,
  error: null,

  fetchIslamicCalendar: async (date = new Date()) => {
    set({ isLoading: true, error: null });
    
    try {
      const { latitude, longitude } = get().location;
      
      // Calculate Islamic date
      const hijriDate = convertToHijri(date);
      
      // Calculate prayer times
      const prayerTimes = calculatePrayerTimes(date, latitude, longitude);
      
      // Get Islamic events
      const specialEvents = getIslamicEvents(hijriDate);
      
      // Check if it's Ramadan
      const ramadanInfo = getRamadanInfo(hijriDate, prayerTimes);
      
      const islamicCalendar: IslamicCalendarData = {
        hijriDate: formatHijriDate(hijriDate),
        gregorianDate: formatGregorianDate(date),
        islamicMonth: getIslamicMonthName(hijriDate.month),
        islamicYear: hijriDate.year,
        weekday: getIslamicWeekday(date.getDay()),
        prayerTimes,
        specialEvents,
        ramadanInfo
      };
      
      set({ islamicCalendar, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateLocation: (lat, lng, city) => {
    set({ location: { latitude: lat, longitude: lng, city } });
    // Recalculate calendar data for new location
    get().fetchIslamicCalendar();
  },

  calculatePrayerTimes: (date) => {
    const { latitude, longitude } = get().location;
    return calculatePrayerTimes(date, latitude, longitude);
  }
}));

// Prayer time calculation using astronomical formulas
function calculatePrayerTimes(date: Date, latitude: number, longitude: number): PrayerTimes {
  // This is a simplified version - in production, use a proper Islamic prayer time library
  // like 'adhan' npm package or Islamic calendar API
  
  const times = {
    fajr: calculateFajrTime(date, latitude, longitude),
    sunrise: calculateSunriseTime(date, latitude, longitude),
    dhuhr: calculateDhuhrTime(date, latitude, longitude),
    asr: calculateAsrTime(date, latitude, longitude),
    maghrib: calculateMaghribTime(date, latitude, longitude),
    isha: calculateIshaTime(date, latitude, longitude)
  };
  
  const nextPrayer = getNextPrayerTime(times);
  
  return {
    ...times,
    nextPrayer
  };
}

function calculateFajrTime(date: Date, lat: number, lng: number): string {
  // Fajr time calculation (Dawn prayer)
  // Simplified calculation - use proper astronomical library in production
  const sunrise = calculateSunriseTime(date, lat, lng);
  const sunriseTime = parseTime(sunrise);
  const fajrTime = new Date(sunriseTime.getTime() - 1.5 * 60 * 60 * 1000); // 1.5 hours before sunrise
  return formatTime(fajrTime);
}

function calculateSunriseTime(date: Date, lat: number, lng: number): string {
  // Sunrise calculation using solar position algorithms
  // Simplified - use proper astronomical calculations in production
  return "06:30"; // Placeholder
}

function calculateDhuhrTime(date: Date, lat: number, lng: number): string {
  // Dhuhr (noon) prayer time - when sun reaches its zenith
  return "12:30"; // Placeholder
}

function calculateAsrTime(date: Date, lat: number, lng: number): string {
  // Asr (afternoon) prayer time
  return "15:45"; // Placeholder
}

function calculateMaghribTime(date: Date, lat: number, lng: number): string {
  // Maghrib (sunset) prayer time
  return "18:20"; // Placeholder
}

function calculateIshaTime(date: Date, lat: number, lng: number): string {
  // Isha (night) prayer time
  return "19:50"; // Placeholder
}

function getNextPrayerTime(times: Omit<PrayerTimes, 'nextPrayer'>): PrayerTimes['nextPrayer'] {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const prayerArray = [
    { name: 'Fajr', time: times.fajr },
    { name: 'Dhuhr', time: times.dhuhr },
    { name: 'Asr', time: times.asr },
    { name: 'Maghrib', time: times.maghrib },
    { name: 'Isha', time: times.isha }
  ];
  
  for (const prayer of prayerArray) {
    const prayerTime = parseTime(prayer.time);
    const prayerMinutes = prayerTime.getHours() * 60 + prayerTime.getMinutes();
    
    if (prayerMinutes > currentTime) {
      const remaining = prayerMinutes - currentTime;
      const hours = Math.floor(remaining / 60);
      const minutes = remaining % 60;
      
      return {
        name: prayer.name,
        time: prayer.time,
        remaining: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
      };
    }
  }
  
  // If no prayer left today, return tomorrow's Fajr
  return {
    name: 'Fajr',
    time: times.fajr,
    remaining: 'Tomorrow'
  };
}

// Hijri date conversion
function convertToHijri(gregorianDate: Date): { day: number; month: number; year: number } {
  // Simplified Hijri conversion - use proper Islamic calendar library in production
  // This is just a placeholder calculation
  const gregorianYear = gregorianDate.getFullYear();
  const hijriYear = gregorianYear - 622; // Simplified conversion
  
  return {
    day: gregorianDate.getDate(),
    month: gregorianDate.getMonth() + 1,
    year: hijriYear
  };
}

function formatHijriDate(hijriDate: { day: number; month: number; year: number }): string {
  const monthName = getIslamicMonthName(hijriDate.month);
  return `${hijriDate.day} ${monthName} ${hijriDate.year} H`;
}

function formatGregorianDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getIslamicMonthName(month: number): string {
  const months = [
    'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban',
    'Ramadan', 'Shawwal', 'Dhu al-Qidah', 'Dhu al-Hijjah'
  ];
  return months[month - 1] || 'Unknown';
}

function getIslamicWeekday(dayOfWeek: number): string {
  const days = [
    'Al-Ahad', 'Al-Ithnayn', 'Ath-Thulatha', 'Al-Arbia',
    'Al-Khamis', 'Al-Jumuah', 'As-Sabt'
  ];
  return days[dayOfWeek];
}

function getIslamicEvents(hijriDate: { day: number; month: number; year: number }): IslamicEvent[] {
  // Return Islamic holidays and significant dates
  const events: IslamicEvent[] = [];
  
  // Add major Islamic holidays based on Hijri date
  if (hijriDate.month === 9) { // Ramadan
    events.push({
      name: 'Ramadan',
      description: 'Holy month of fasting',
      type: 'observance',
      priority: 'high'
    });
  }
  
  if (hijriDate.month === 10 && hijriDate.day === 1) { // Eid al-Fitr
    events.push({
      name: 'Eid al-Fitr',
      description: 'Festival of breaking the fast',
      type: 'holiday',
      priority: 'high'
    });
  }
  
  if (hijriDate.month === 12 && hijriDate.day === 10) { // Eid al-Adha
    events.push({
      name: 'Eid al-Adha',
      description: 'Festival of sacrifice',
      type: 'holiday',
      priority: 'high'
    });
  }
  
  return events;
}

function getRamadanInfo(hijriDate: { day: number; month: number; year: number }, prayerTimes: PrayerTimes): RamadanInfo {
  const isRamadan = hijriDate.month === 9;
  
  if (!isRamadan) {
    return { isRamadan: false };
  }
  
  return {
    isRamadan: true,
    dayOfRamadan: hijriDate.day,
    suhoorEnd: prayerTimes.fajr,
    iftarTime: prayerTimes.maghrib
  };
}

// Helper functions
function parseTime(timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// Hook for using cultural calendar in components
export function useCulturalCalendar() {
  const store = useCulturalCalendarStore();
  
  useEffect(() => {
    // Fetch calendar data when component mounts
    store.fetchIslamicCalendar();
    
    // Set up interval to update prayer times and date
    const interval = setInterval(() => {
      store.fetchIslamicCalendar();
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  return store;
}
```

---

## Performance Optimization Strategy

### React Native Reanimated for 60fps Animations

```typescript
// src/components/shared/PerformantCard.tsx
import React from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

interface PerformantCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  enableSwipe?: boolean;
  className?: string;
}

export function PerformantCard({
  children,
  onPress,
  onSwipeLeft,
  onSwipeRight,
  enableSwipe = false,
  className = ""
}: PerformantCardProps) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Press animation
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value }
    ],
    opacity: opacity.value,
  }), []);

  // Gesture handler for swipe actions
  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      if (enableSwipe) {
        scale.value = withSpring(0.98);
      }
    },
    onActive: (event) => {
      if (enableSwipe) {
        translateX.value = event.translationX * 0.5;
        opacity.value = withTiming(1 - Math.abs(event.translationX) / 300);
      }
    },
    onEnd: (event) => {
      const { translationX, velocityX } = event;
      
      if (enableSwipe && Math.abs(translationX) > 100) {
        // Swipe threshold reached
        if (translationX > 0 && onSwipeRight) {
          translateX.value = withTiming(300, { duration: 200 });
          opacity.value = withTiming(0, { duration: 200 }, () => {
            runOnJS(onSwipeRight)();
            translateX.value = 0;
            opacity.value = 1;
          });
        } else if (translationX < 0 && onSwipeLeft) {
          translateX.value = withTiming(-300, { duration: 200 });
          opacity.value = withTiming(0, { duration: 200 }, () => {
            runOnJS(onSwipeLeft)();
            translateX.value = 0;
            opacity.value = 1;
          });
        } else {
          // Reset position
          translateX.value = withSpring(0);
          opacity.value = withTiming(1);
        }
      } else {
        // Reset position
        translateX.value = withSpring(0);
        opacity.value = withTiming(1);
      }
      
      scale.value = withSpring(1);
    },
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  if (enableSwipe) {
    return (
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={animatedStyle}>
          <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            className={className}
          >
            {children}
          </Pressable>
        </Animated.View>
      </PanGestureHandler>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={animatedStyle} className={className}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
```

### Memory Management and Optimization

```typescript
// src/hooks/shared/usePerformance.ts
import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

interface PerformanceConfig {
  enableMemoryOptimization: boolean;
  enableNetworkOptimization: boolean;
  cacheTimeout: number;
}

export function usePerformanceOptimization(config: PerformanceConfig) {
  const appState = useRef(AppState.currentState);
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Memory cleanup on app state change
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground - optimizing memory');
      
      if (config.enableMemoryOptimization) {
        // Clear old cache entries
        clearExpiredCache();
        
        // Trigger garbage collection hint
        global.gc && global.gc();
      }
    }
    
    if (nextAppState.match(/inactive|background/)) {
      console.log('App has gone to background - reducing memory usage');
      
      if (config.enableMemoryOptimization) {
        // Start cleanup timer
        cleanupTimerRef.current = setTimeout(() => {
          clearNonEssentialCache();
        }, 30000); // Clean up after 30 seconds in background
      }
    }
    
    appState.current = nextAppState;
  }, [config.enableMemoryOptimization]);

  // Screen focus optimization
  useFocusEffect(
    useCallback(() => {
      // Screen is focused - start performance monitoring
      const startTime = Date.now();
      
      return () => {
        // Screen is unfocused - clean up resources
        const duration = Date.now() - startTime;
        console.log(`Screen was active for ${duration}ms`);
        
        // Clear any running timers
        if (cleanupTimerRef.current) {
          clearTimeout(cleanupTimerRef.current);
          cleanupTimerRef.current = null;
        }
      };
    }, [])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }
    };
  }, [handleAppStateChange]);

  // Performance optimization functions
  const clearExpiredCache = useCallback(() => {
    // Implementation for clearing expired cache entries
    console.log('Clearing expired cache entries');
  }, []);

  const clearNonEssentialCache = useCallback(() => {
    // Implementation for clearing non-essential cache
    console.log('Clearing non-essential cache');
  }, []);

  const measureRenderTime = useCallback((componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 16.67) { // More than one frame at 60fps
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    };
  }, []);

  return {
    clearExpiredCache,
    clearNonEssentialCache,
    measureRenderTime,
  };
}

// Performance monitoring hook
export function useRenderPerformance(componentName: string) {
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = performance.now();
    
    return () => {
      const renderTime = performance.now() - startTimeRef.current;
      
      if (renderTime > 16.67) {
        console.warn(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
      }
    };
  });
}

// Memory usage monitoring
export function useMemoryMonitoring() {
  useEffect(() => {
    const checkMemoryUsage = () => {
      if (global.performance && global.performance.memory) {
        const memory = global.performance.memory;
        const memoryUsage = {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        };
        
        console.log('Memory usage:', memoryUsage);
        
        // Warning if memory usage is high
        if (memoryUsage.used > memoryUsage.limit * 0.9) {
          console.warn('High memory usage detected!');
        }
      }
    };

    const interval = setInterval(checkMemoryUsage, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
}
```

---

## Testing Strategy

### Component Testing with Jest and React Native Testing Library

```typescript
// src/components/dashboard/__tests__/WelcomeHeader.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { WelcomeHeader } from '../WelcomeHeader';

// Mock dependencies
jest.mock('@/hooks/cultural/useCulturalSettings', () => ({
  useCulturalSettings: () => ({
    colors: {
      surface: '#ffffff',
      foreground: '#000000',
      muted: '#666666',
      primary: '#1d7452',
      destructive: '#ef4444',
    },
    language: 'en',
  }),
}));

const mockTeacher = {
  name: 'Gulnora Karimova',
  title: 'Ms.',
  department: 'Mathematics',
  profileImage: undefined,
};

const mockCulturalContext = {
  islamicDate: '15 Ramadan 1445 H',
  gregorianDate: 'Monday, March 25, 2024',
  nextPrayerTime: '12:30',
  prayerName: 'Dhuhr',
};

describe('WelcomeHeader', () => {
  const defaultProps = {
    greeting: 'Assalomu alaykum, hurmatli ustoz!',
    timeContext: 'morning' as const,
    culturalContext: mockCulturalContext,
    teacher: mockTeacher,
    notificationCount: 3,
    onNotificationPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders teacher information correctly', () => {
    const { getByText } = render(<WelcomeHeader {...defaultProps} />);
    
    expect(getByText('Ms. Gulnora Karimova')).toBeTruthy();
    expect(getByText('Mathematics')).toBeTruthy();
  });

  it('displays cultural greeting', () => {
    const { getByText } = render(<WelcomeHeader {...defaultProps} />);
    
    expect(getByText('Assalomu alaykum, hurmatli ustoz!')).toBeTruthy();
  });

  it('shows Islamic calendar information', () => {
    const { getByText } = render(<WelcomeHeader {...defaultProps} />);
    
    expect(getByText('Monday, March 25, 2024')).toBeTruthy();
    expect(getByText('15 Ramadan 1445 H')).toBeTruthy();
  });

  it('displays prayer time information', () => {
    const { getByText } = render(<WelcomeHeader {...defaultProps} />);
    
    expect(getByText('Next: Dhuhr')).toBeTruthy();
    expect(getByText('12:30')).toBeTruthy();
  });

  it('handles notification press', () => {
    const onNotificationPress = jest.fn();
    const { getByRole } = render(
      <WelcomeHeader {...defaultProps} onNotificationPress={onNotificationPress} />
    );
    
    const notificationButton = getByRole('button');
    fireEvent.press(notificationButton);
    
    expect(onNotificationPress).toHaveBeenCalledTimes(1);
  });

  it('shows notification badge when count > 0', () => {
    const { getByText } = render(<WelcomeHeader {...defaultProps} notificationCount={5} />);
    
    expect(getByText('5')).toBeTruthy();
  });

  it('adapts to different time contexts', () => {
    const { getByText, rerender } = render(<WelcomeHeader {...defaultProps} />);
    
    expect(getByText('Morning preparation')).toBeTruthy();
    
    rerender(<WelcomeHeader {...defaultProps} timeContext="evening" />);
    expect(getByText('End of day')).toBeTruthy();
  });

  it('handles missing prayer time gracefully', () => {
    const contextWithoutPrayer = {
      ...mockCulturalContext,
      nextPrayerTime: undefined,
      prayerName: undefined,
    };
    
    const { queryByText } = render(
      <WelcomeHeader {...defaultProps} culturalContext={contextWithoutPrayer} />
    );
    
    expect(queryByText('Next: Dhuhr')).toBeNull();
  });
});
```

### Integration Testing with Detox

```javascript
// e2e/teacherDashboard.e2e.js
import { device, element, by, expect } from 'detox';

describe('Teacher Dashboard', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display dashboard on app launch', async () => {
    await expect(element(by.id('dashboard-screen'))).toBeVisible();
    await expect(element(by.text('Assalomu alaykum'))).toBeVisible();
  });

  it('should navigate to groups screen via tab', async () => {
    await element(by.id('groups-tab')).tap();
    await expect(element(by.id('groups-screen'))).toBeVisible();
  });

  it('should handle quick action for attendance', async () => {
    await element(by.id('quick-action-attendance')).tap();
    await expect(element(by.id('attendance-modal'))).toBeVisible();
  });

  it('should work offline', async () => {
    await device.setURLBlacklist(['*']);
    
    await element(by.id('quick-action-attendance')).tap();
    await expect(element(by.text('Offline mode'))).toBeVisible();
    
    // Should queue the action
    await element(by.id('mark-present-student-1')).tap();
    await expect(element(by.id('offline-queue-indicator'))).toBeVisible();
    
    await device.setURLBlacklist([]);
  });

  it('should display cultural calendar information', async () => {
    await expect(element(by.id('islamic-date'))).toBeVisible();
    await expect(element(by.id('prayer-time-info'))).toBeVisible();
  });

  it('should handle notification interactions', async () => {
    await element(by.id('notification-bell')).tap();
    await expect(element(by.id('notification-center'))).toBeVisible();
    
    await element(by.id('urgent-notification-1')).tap();
    await expect(element(by.id('notification-detail'))).toBeVisible();
  });

  it('should support multi-language interface', async () => {
    // Navigate to profile settings
    await element(by.id('profile-tab')).tap();
    await element(by.id('settings-button')).tap();
    
    // Change language to Uzbek
    await element(by.id('language-setting')).tap();
    await element(by.text('O\'zbekcha')).tap();
    
    // Verify interface language changed
    await element(by.id('home-tab')).tap();
    await expect(element(by.text('Bosh sahifa'))).toBeVisible();
  });

  it('should handle real-time data updates', async () => {
    // Mock real-time notification
    await device.sendUserNotification({
      trigger: {
        type: 'push',
      },
      title: 'New Student Alert',
      body: 'Student needs immediate attention',
      badge: 1,
      payload: {
        type: 'student-alert',
        priority: 'critical',
      },
    });
    
    await expect(element(by.text('New Student Alert'))).toBeVisible();
  });

  it('should maintain performance during heavy usage', async () => {
    // Simulate rapid tab switching
    for (let i = 0; i < 10; i++) {
      await element(by.id('groups-tab')).tap();
      await element(by.id('schedule-tab')).tap();
      await element(by.id('feedback-tab')).tap();
      await element(by.id('home-tab')).tap();
    }
    
    // App should remain responsive
    await expect(element(by.id('dashboard-screen'))).toBeVisible();
  });
});
```

---

## Deployment and CI/CD Strategy

### Expo Application Services (EAS) Configuration

```json
// eas.json
{
  "cli": {
    "version": ">= 7.8.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true,
        "resourceClass": "m-large"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-large",
        "autoIncrement": true
      },
      "android": {
        "buildType": "aab",
        "autoIncrement": true
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "teacher@harryschool.uz",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      },
      "android": {
        "serviceAccountKeyPath": "./service-account-key.json",
        "track": "internal"
      }
    }
  }
}
```

### GitHub Actions Workflow

```yaml
# .github/workflows/teacher-app-ci-cd.yml
name: Teacher App CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['mobile/apps/teacher/**']
  pull_request:
    branches: [main]
    paths: ['mobile/apps/teacher/**']

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: mobile/apps/teacher/package-lock.json
        
    - name: Install dependencies
      working-directory: mobile/apps/teacher
      run: npm ci
      
    - name: Run TypeScript check
      working-directory: mobile/apps/teacher
      run: npm run type-check
      
    - name: Run tests
      working-directory: mobile/apps/teacher
      run: npm run test:coverage
      
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        directory: mobile/apps/teacher/coverage
        
  lint:
    name: Lint Code
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: mobile/apps/teacher/package-lock.json
        
    - name: Install dependencies
      working-directory: mobile/apps/teacher
      run: npm ci
      
    - name: Run ESLint
      working-directory: mobile/apps/teacher
      run: npm run lint
      
    - name: Run Prettier check
      working-directory: mobile/apps/teacher
      run: npm run format:check

  cultural-validation:
    name: Cultural Content Validation
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: mobile/apps/teacher/package-lock.json
        
    - name: Install dependencies
      working-directory: mobile/apps/teacher
      run: npm ci
      
    - name: Validate Uzbek translations
      working-directory: mobile/apps/teacher
      run: npm run validate:translations:uz
      
    - name: Validate Islamic calendar integration
      working-directory: mobile/apps/teacher
      run: npm run validate:islamic-calendar
      
    - name: Check cultural sensitivity
      working-directory: mobile/apps/teacher
      run: npm run validate:cultural-content

  build-preview:
    name: Build Preview
    runs-on: ubuntu-latest
    needs: [test, lint, cultural-validation]
    if: github.event_name == 'pull_request'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Setup Expo CLI
      run: npm install -g @expo/cli@latest
      
    - name: Install dependencies
      working-directory: mobile/apps/teacher
      run: npm ci
      
    - name: Build preview (iOS)
      working-directory: mobile/apps/teacher
      run: eas build --platform ios --profile preview --non-interactive
      env:
        EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
        
    - name: Build preview (Android)
      working-directory: mobile/apps/teacher
      run: eas build --platform android --profile preview --non-interactive
      env:
        EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

  build-production:
    name: Build Production
    runs-on: ubuntu-latest
    needs: [test, lint, cultural-validation]
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Setup Expo CLI
      run: npm install -g @expo/cli@latest
      
    - name: Install dependencies
      working-directory: mobile/apps/teacher
      run: npm ci
      
    - name: Build production (iOS)
      working-directory: mobile/apps/teacher
      run: eas build --platform ios --profile production --non-interactive
      env:
        EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
        
    - name: Build production (Android)
      working-directory: mobile/apps/teacher
      run: eas build --platform android --profile production --non-interactive
      env:
        EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
        
    - name: Submit to App Store Connect
      working-directory: mobile/apps/teacher
      run: eas submit --platform ios --profile production
      env:
        EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
        
    - name: Submit to Google Play Console
      working-directory: mobile/apps/teacher
      run: eas submit --platform android --profile production
      env:
        EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

  e2e-tests:
    name: E2E Tests
    runs-on: macos-latest
    needs: [build-preview]
    if: github.event_name == 'pull_request'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      working-directory: mobile/apps/teacher
      run: npm ci
      
    - name: Setup iOS Simulator
      run: |
        xcrun simctl create "iPhone 15" "iPhone 15" "iOS17.0"
        xcrun simctl boot "iPhone 15"
        
    - name: Build Detox
      working-directory: mobile/apps/teacher
      run: npx detox build --configuration ios.sim.debug
      
    - name: Run E2E Tests
      working-directory: mobile/apps/teacher
      run: npx detox test --configuration ios.sim.debug --cleanup
      
    - name: Upload E2E Test Results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: e2e-test-results
        path: mobile/apps/teacher/e2e/artifacts/
```

---

## Security and Privacy Considerations

### Data Protection Implementation

```typescript
// src/services/security/dataProtection.ts
import { MMKV } from 'react-native-mmkv';
import CryptoJS from 'crypto-js';

class SecureStorage {
  private mmkv: MMKV;
  private encryptionKey: string;

  constructor() {
    this.mmkv = new MMKV({ 
      id: 'secure-teacher-data',
      encryptionKey: this.getEncryptionKey()
    });
    this.encryptionKey = this.getEncryptionKey();
  }

  private getEncryptionKey(): string {
    // In production, derive this from device-specific values and user credentials
    return 'harry-school-teacher-2024-secure-key';
  }

  // Store sensitive data with encryption
  storeSecureData(key: string, data: any): void {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
      this.mmkv.set(key, encrypted);
    } catch (error) {
      console.error('Failed to store secure data:', error);
      throw new Error('Data encryption failed');
    }
  }

  // Retrieve and decrypt sensitive data
  getSecureData<T>(key: string): T | null {
    try {
      const encrypted = this.mmkv.getString(key);
      if (!encrypted) return null;

      const decrypted = CryptoJS.AES.decrypt(encrypted, this.encryptionKey);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!jsonString) {
        console.warn('Failed to decrypt data - invalid key or corrupted data');
        return null;
      }

      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      return null;
    }
  }

  // Clear all secure data
  clearSecureData(): void {
    this.mmkv.clearAll();
  }

  // Check if secure data exists
  hasSecureData(key: string): boolean {
    return this.mmkv.contains(key);
  }
}

export const secureStorage = new SecureStorage();

// Privacy compliance helper
export class PrivacyManager {
  private static instance: PrivacyManager;

  static getInstance(): PrivacyManager {
    if (!PrivacyManager.instance) {
      PrivacyManager.instance = new PrivacyManager();
    }
    return PrivacyManager.instance;
  }

  // Anonymize student data for analytics
  anonymizeStudentData(studentData: any): any {
    return {
      ...studentData,
      name: this.hashPII(studentData.name),
      email: this.hashPII(studentData.email),
      parentContact: this.hashPII(studentData.parentContact),
      // Keep non-PII data for analytics
      age: studentData.age,
      grade: studentData.grade,
      subjects: studentData.subjects,
    };
  }

  // Hash personally identifiable information
  private hashPII(data: string): string {
    if (!data) return '';
    return CryptoJS.SHA256(data + 'harry-school-salt').toString();
  }

  // Check if data processing is compliant with local regulations
  isDataProcessingCompliant(dataType: string, purpose: string): boolean {
    const compliance = {
      'student-grades': {
        'academic-tracking': true,
        'marketing': false,
        'analytics': false,
      },
      'parent-communications': {
        'education-updates': true,
        'emergency-contact': true,
        'marketing': false,
      },
      'teacher-performance': {
        'professional-development': true,
        'salary-decisions': false, // Requires explicit consent in Uzbekistan
        'analytics': true,
      },
    };

    return compliance[dataType]?.[purpose] || false;
  }

  // Data retention policy enforcement
  enforceDataRetention(): void {
    const retentionPolicies = {
      'student-attendance': 365 * 3, // 3 years
      'grade-records': 365 * 7, // 7 years for academic records
      'parent-communications': 365 * 2, // 2 years
      'teacher-session-logs': 30, // 30 days
    };

    Object.entries(retentionPolicies).forEach(([dataType, retentionDays]) => {
      this.cleanupExpiredData(dataType, retentionDays);
    });
  }

  private cleanupExpiredData(dataType: string, retentionDays: number): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Implementation would remove data older than cutoff date
    console.log(`Cleaning up ${dataType} data older than ${cutoffDate.toISOString()}`);
  }
}

export const privacyManager = PrivacyManager.getInstance();
```

---

## Implementation Timeline and Milestones

### Phase 1: Foundation (Weeks 1-4)
**Goal**: Establish core navigation and dashboard architecture

**Week 1: Project Setup and Navigation**
- Set up React Native project with Expo SDK 51
- Implement 5-tab bottom navigation with React Navigation 7
- Create basic screen structure for all tabs
- Set up TypeScript configuration and type definitions

**Week 2: Dashboard Core Implementation**
- Implement main DashboardScreen with scroll view
- Create WelcomeHeader component with cultural greeting
- Build QuickActionsGrid component with 4 primary actions
- Set up Zustand store for dashboard state management

**Week 3: Real-Time Data Integration**
- Integrate Supabase client with real-time subscriptions
- Implement useDashboardData hook for data fetching
- Create useRealTimeSubscriptions hook for live updates
- Set up basic offline detection with NetInfo

**Week 4: Cultural Integration Basics**
- Implement Islamic calendar service with prayer times
- Create useCulturalCalendar hook for calendar data
- Add multi-language support (Uzbek/Russian/English)
- Build cultural greeting system with time-based context

**Phase 1 Deliverables:**
- ✅ Functional 5-tab navigation system
- ✅ Basic dashboard with real-time data
- ✅ Cultural calendar integration
- ✅ Multi-language interface
- ✅ Offline detection and basic handling

---

### Phase 2: Advanced Features (Weeks 5-8)
**Goal**: Implement offline-first architecture and advanced dashboard features

**Week 5: Offline-First Architecture**
- Implement SQLite database for offline data storage
- Create offline action queue with priority-based processing
- Build useOfflineQueue hook for background sync
- Set up MMKV for secure key-value storage

**Week 6: Advanced Dashboard Components**
- Implement TodaysOverview component with schedule timeline
- Create GroupsOverview component with attendance stats
- Build PerformanceMetrics component with cultural sensitivity
- Add FloatingActionButton with contextual actions

**Week 7: Real-Time Enhancements**
- Implement intelligent notification clustering system
- Create advanced real-time subscription management
- Build conflict resolution for offline-online sync
- Add performance monitoring and optimization

**Week 8: Cultural Features Advanced**
- Implement Ramadan schedule adaptations
- Add Islamic holiday recognition and scheduling
- Create cultural communication templates for parent messages
- Build respectful hierarchy-aware notification system

**Phase 2 Deliverables:**
- ✅ Comprehensive offline-first architecture
- ✅ Advanced dashboard with all core components
- ✅ Intelligent real-time sync with conflict resolution
- ✅ Advanced cultural features and adaptations
- ✅ Performance monitoring and optimization

---

### Phase 3: Polish and Optimization (Weeks 9-12)
**Goal**: Performance optimization, testing, and deployment preparation

**Week 9: Performance Optimization**
- Implement React Native Reanimated animations (60fps target)
- Optimize memory usage and implement cleanup strategies
- Add bundle splitting and lazy loading for better startup time
- Implement intelligent caching with TTL management

**Week 10: Testing Implementation**
- Write comprehensive unit tests with Jest and React Native Testing Library
- Implement integration tests for critical workflows
- Create E2E tests with Detox for core teacher scenarios
- Add cultural content validation tests

**Week 11: Security and Privacy**
- Implement secure data storage with encryption
- Add privacy compliance features for Uzbekistan regulations
- Create data retention and cleanup policies
- Implement secure authentication flow

**Week 12: Deployment and Documentation**
- Set up EAS Build configuration for iOS and Android
- Create CI/CD pipeline with GitHub Actions
- Implement automated testing and deployment
- Create comprehensive documentation for teachers

**Phase 3 Deliverables:**
- ✅ 60fps smooth animations and interactions
- ✅ Comprehensive test suite with >90% coverage
- ✅ Security and privacy compliance
- ✅ Production-ready deployment pipeline
- ✅ Complete documentation and training materials

---

## Success Metrics and KPIs

### Technical Performance Targets
```typescript
interface PerformanceTargets {
  // Load Time Performance
  initialAppLoad: '<2s'; // Cold start to dashboard visible
  tabSwitching: '<300ms'; // Navigation between tabs
  dataRefresh: '<500ms'; // Pull-to-refresh completion
  offlineMode: '<100ms'; // Offline data access
  
  // Animation Performance
  frameRate: '60fps'; // Consistent smooth animations
  gestures: '<16ms'; // Touch response time
  transitions: '<300ms'; // Screen transitions
  
  // Memory and Battery
  memoryUsage: '<150MB'; // Average memory footprint
  batteryDrain: '<3%/hour'; // Active usage battery consumption
  backgroundUsage: '<1%/hour'; // Background battery usage
  
  // Network Efficiency
  dataUsage: '<10MB/day'; // Typical daily data consumption
  syncSuccess: '>99%'; // Successful sync completion rate
  offlineCapability: '>95%'; // Functions available offline
  
  // Reliability
  crashRate: '<0.1%'; // Sessions ending in crashes
  errorRate: '<1%'; // Failed operations
  availability: '>99.9%'; // App availability uptime
}
```

### User Experience Metrics
```typescript
interface UserExperienceTargets {
  // Adoption Metrics
  teacherAdoption: '>80%'; // Teachers actively using the app daily
  featureUsage: '>75%'; // Core features used weekly
  sessionLength: '>15min'; // Average session duration
  dailySessions: '>5'; // Average sessions per teacher per day
  
  // Satisfaction Metrics
  userRating: '>4.5/5'; // App store rating
  feedbackScore: '>4.2/5'; // In-app feedback rating
  supportTickets: '<2%'; // Teachers requiring support
  
  // Cultural Integration
  culturalAppropriateness: '>95%'; // Cultural validation score
  languageUsage: {
    uzbek: '>60%'; // Primary language usage
    russian: '>30%'; // Secondary language usage
    english: '>10%'; // Tertiary language usage
  };
  islamicFeatureUsage: '>80%'; // Prayer time/calendar feature usage
  
  // Educational Impact
  adminTimeReduction: '>35%'; // Reduction in administrative time
  gradingEfficiency: '>40%'; // Faster grading workflows
  parentCommunication: '>25%'; // Improvement in parent communication quality
  studentEngagement: 'Positive correlation'; // With teacher app usage
}
```

### Business Impact Metrics
```typescript
interface BusinessImpactTargets {
  // Operational Efficiency
  teacherProductivity: '+35%'; // Increase in teaching time vs admin time
  dataAccuracy: '>99%'; // Attendance and grade accuracy
  communicationSpeed: '+50%'; // Faster parent-teacher communication
  
  // School Management
  attendanceTracking: '>98%'; // Daily attendance completion rate
  gradingCompliance: '>95%'; // On-time grade submission
  parentSatisfaction: '+25%'; // Improvement in parent feedback scores
  
  // Scalability
  schoolExpansion: 'Ready for 5x growth'; // Support for 250+ teachers
  featureExtension: 'Modular architecture'; // Easy addition of new features
  regionExpansion: 'Multi-cultural support'; // Ready for Central Asian markets
  
  // Cost Efficiency
  trainingTime: '-60%'; // Reduced teacher training time
  supportCosts: '-40%'; // Fewer support requests
  paperReduction: '-80%'; // Digital-first workflows
}
```

---

## Final Implementation Notes

### Critical Success Factors

1. **Cultural Authenticity**: Every UI element, interaction pattern, and communication template must be validated by local Uzbekistan educators and Islamic scholars to ensure cultural appropriateness and religious sensitivity.

2. **Offline-First Architecture**: The app must function seamlessly without internet connectivity, as many schools in Uzbekistan experience intermittent connectivity. 95% of core functions must work offline.

3. **Teacher-Centric Design**: All interactions must be optimized for busy teachers who need to complete tasks quickly between classes, often with one-handed operation while managing a classroom.

4. **Performance Excellence**: The app must maintain 60fps animations and <2s load times even on older Android devices commonly used in Uzbekistan schools.

5. **Islamic Calendar Integration**: Accurate prayer time calculations and Islamic calendar integration are essential for teacher acceptance and daily workflow integration.

### Risk Mitigation Strategies

1. **Cultural Validation Pipeline**: Implement mandatory cultural review for all UI text, interaction patterns, and visual elements before deployment.

2. **Performance Monitoring**: Continuous performance monitoring with automatic alerts for degradation below target metrics.

3. **Offline Testing**: Comprehensive testing of offline scenarios, including extended offline periods and sync conflict resolution.

4. **Device Compatibility**: Testing on a wide range of Android devices commonly used in Uzbekistan, including low-end devices.

5. **Gradual Rollout**: Phase deployment starting with pilot schools to gather real-world feedback before full deployment.

### Post-Launch Support Strategy

1. **Teacher Training Program**: Comprehensive training materials and support system for teachers adapting to the digital workflow.

2. **Continuous Cultural Adaptation**: Ongoing consultation with local educators to refine cultural features and add regional celebrations.

3. **Performance Optimization**: Regular performance audits and optimization cycles to maintain target metrics as the app scales.

4. **Feature Evolution**: Iterative feature development based on teacher feedback and changing educational needs in Uzbekistan.

This comprehensive mobile architecture provides a solid foundation for building a culturally-sensitive, high-performance teacher dashboard that respects Uzbekistan's educational traditions while embracing modern technology to enhance teacher productivity and student outcomes.

---

**Architecture Status**: Complete and ready for implementation
**Target Users**: 50+ Harry School teachers managing 500+ students
**Platform Support**: iOS 13+, Android 8+ (React Native 0.73+)
**Performance Target**: <2s load, 60fps animations, 95% offline functionality
**Cultural Integration**: Islamic calendar, Uzbek/Russian/English, respectful hierarchy
**Implementation Timeline**: 12 weeks across 3 phases
**Success Metrics**: 80% teacher adoption, 4.5+ user rating, 35% productivity improvement