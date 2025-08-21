import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import icons (we'll use simple Text for now, can be replaced with proper icons)
import { HomeIcon, GroupIcon, ScheduleIcon, FeedbackIcon, ProfileIcon } from '../components/icons';

// Import screens
import { DashboardScreen } from '../screens/DashboardScreen';
import { GroupsScreen } from '../screens/GroupsScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// Import hooks for badge counts
import { useBadgeCounts } from '../hooks/useBadgeCounts';

const Tab = createBottomTabNavigator();

export function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const badgeCounts = useBadgeCounts();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconProps = { focused, color, size };
          
          switch (route.name) {
            case 'Home':
              return <HomeIcon {...iconProps} />;
            case 'Groups':
              return <GroupIcon {...iconProps} />;
            case 'Schedule':
              return <ScheduleIcon {...iconProps} />;
            case 'Feedback':
              return <FeedbackIcon {...iconProps} />;
            case 'Profile':
              return <ProfileIcon {...iconProps} />;
            default:
              return <View />;
          }
        },
        tabBarActiveTintColor: '#1d7452', // Harry School primary color
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarBadge: badgeCounts.home > 0 ? badgeCounts.home : undefined,
        }}
      />
      <Tab.Screen 
        name="Groups" 
        component={GroupsScreen}
        options={{
          tabBarLabel: 'Groups',
          tabBarBadge: badgeCounts.groups > 0 ? badgeCounts.groups : undefined,
        }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen}
        options={{
          tabBarLabel: 'Schedule',
          tabBarBadge: badgeCounts.schedule > 0 ? badgeCounts.schedule : undefined,
        }}
      />
      <Tab.Screen 
        name="Feedback" 
        component={FeedbackScreen}
        options={{
          tabBarLabel: 'Feedback',
          tabBarBadge: badgeCounts.feedback > 0 ? badgeCounts.feedback : undefined,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}