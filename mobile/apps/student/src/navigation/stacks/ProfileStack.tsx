/**
 * ProfileStack Navigator for Harry School Student App
 * 
 * Profile section with settings, achievements, and personal data management
 * Optimized for student engagement and privacy controls
 */

import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { ProfileStackParamList } from '../types';

// Placeholder screens - these will be implemented later
import { PlaceholderScreen } from '../../components/PlaceholderScreen';

const Stack = createStackNavigator<ProfileStackParamList>();

export const ProfileStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="ProfileOverview"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen 
        name="ProfileOverview" 
        options={{
          title: 'Profile',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="My Profile"
            description="View and manage your learning profile, achievements, and settings."
            features={[
              'Personal information',
              'Learning statistics',
              'Recent achievements',
              'Account settings',
              'Progress summaries',
              'Customization options'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="EditProfile"
        options={{
          title: 'Edit Profile',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Edit Profile"
            description="Update your personal information and preferences."
            features={[
              'Profile picture upload',
              'Personal details',
              'Learning preferences',
              'Notification settings',
              'Language selection',
              'Accessibility options'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="AchievementDetail"
        options={{
          title: 'Achievement',
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Achievement Details"
            description="Celebrate your learning milestone with detailed achievement information."
            features={[
              'Achievement description',
              'Completion date',
              'Required criteria',
              'Progress tracking',
              'Sharing options',
              'Related badges'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="ProgressReports"
        options={{
          title: 'Progress Reports',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Learning Reports"
            description="Comprehensive reports of your academic progress and performance."
            features={[
              'Academic performance',
              'Subject-wise analysis',
              'Time-based trends',
              'Goal achievement',
              'Teacher feedback',
              'Parent sharing'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="Settings"
        options={{
          title: 'Settings',
          presentation: 'modal',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="App Settings"
            description="Customize your app experience and manage preferences."
            features={[
              'App preferences',
              'Privacy controls',
              'Notification settings',
              'Parental controls',
              'Data management',
              'Security options'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="ParentalControls"
        options={{
          title: 'Parental Controls',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Parental Controls"
            description="Manage parental oversight and safety features."
            features={[
              'Screen time limits',
              'Content filtering',
              'Social features control',
              'Privacy settings',
              'Communication controls',
              'Activity monitoring'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="DataExport"
        options={{
          title: 'Data Export',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Export Your Data"
            description="Download your learning data and progress records."
            features={[
              'Progress data export',
              'Achievement records',
              'Learning analytics',
              'File format options',
              'Secure download',
              'Privacy compliance'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="Support"
        options={{
          title: 'Help & Support',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Help Center"
            description="Get help and support for your learning journey."
            features={[
              'FAQ section',
              'Technical support',
              'Learning guidance',
              'Contact teachers',
              'Feedback submission',
              'Tutorial videos'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="About"
        options={{
          title: 'About',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="About Harry School"
            description="Learn more about the app and our educational mission."
            features={[
              'App information',
              'Version details',
              'Educational philosophy',
              'Development team',
              'Acknowledgments',
              'Open source licenses'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="PrivacyPolicy"
        options={{
          title: 'Privacy Policy',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Privacy Policy"
            description="Understand how we protect and use your personal information."
            features={[
              'Data collection practices',
              'Information usage',
              'Privacy rights',
              'COPPA compliance',
              'GDPR compliance',
              'Contact information'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="TermsOfService"
        options={{
          title: 'Terms of Service',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Terms of Service"
            description="Review the terms and conditions for using Harry School."
            features={[
              'Usage agreement',
              'Service limitations',
              'User responsibilities',
              'Academic integrity',
              'Content guidelines',
              'Dispute resolution'
            ]}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};