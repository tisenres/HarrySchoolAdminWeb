/**
 * HomeStack Navigator for Harry School Student App
 * 
 * Home section with dashboard, progress, and quick actions
 * Optimized for student learning flows and age-appropriate navigation
 */

import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { HomeStackParamList } from '../types';

// Placeholder screens - these will be implemented later
import { PlaceholderScreen } from '../../components/PlaceholderScreen';

const Stack = createStackNavigator<HomeStackParamList>();

export const HomeStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        options={{
          title: 'Home',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Student Dashboard"
            description="Welcome to your learning dashboard! Here you'll see your progress, upcoming lessons, and quick actions."
            features={[
              'Daily progress overview',
              'Recent achievements',
              'Quick access to homework',
              'Upcoming classes',
              'Learning streaks',
              'Motivational messages'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="QuickActions"
        options={{
          title: 'Quick Actions',
          presentation: 'modal',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Quick Actions"
            description="Fast access to your most-used features and shortcuts."
            features={[
              'Start homework session',
              'Practice vocabulary',
              'Take a quiz',
              'View today\'s schedule',
              'Check progress',
              'Play learning games'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="ProgressOverview"
        options={{
          title: 'Progress Overview',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Progress Overview"
            description="Detailed view of your learning progress across all subjects."
            features={[
              'Subject-wise progress',
              'Weekly/monthly trends',
              'Completion rates',
              'Time spent learning',
              'Skill improvements',
              'Areas for focus'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="Achievements"
        options={{
          title: 'Achievements',
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Achievements"
            description="Celebrate your learning milestones and unlock new badges!"
            features={[
              'Academic achievements',
              'Engagement badges',
              'Learning streaks',
              'Social recognition',
              'Progress certificates',
              'Special rewards'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="Notifications"
        options={{
          title: 'Notifications',
          presentation: 'modal',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Notifications"
            description="Stay updated with important messages and reminders."
            features={[
              'Assignment reminders',
              'Class updates',
              'Achievement notifications',
              'System messages',
              'Teacher feedback',
              'Parent communications'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="News"
        options={{
          title: 'School News',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="School News"
            description="Latest updates from your school and teachers."
            features={[
              'School announcements',
              'Class updates',
              'Event notifications',
              'Academic calendar',
              'Important notices',
              'Community news'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="WeeklyReport"
        options={{
          title: 'Weekly Report',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Weekly Report"
            description="Comprehensive summary of your weekly learning activities."
            features={[
              'Learning time summary',
              'Completed activities',
              'Progress highlights',
              'Areas of improvement',
              'Next week\'s goals',
              'Parent sharing options'
            ]}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};