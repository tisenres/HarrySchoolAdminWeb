/**
 * RootNavigator for Harry School Student App
 * 
 * Enhanced with deep linking support and age-appropriate security
 */

import React, { useRef, useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Linking } from 'react-native';

// Navigation
import { MainTabNavigator } from './MainTabNavigator';
// import { DeepLinkTesterScreen } from '../screens/DeepLinkTesterScreen';
// import { useDeepLinking } from '../hooks/useDeepLinking';

type RootStackParamList = {
  MainTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  onReady?: () => void;
}

// Deep linking configuration
const linking = {
  prefixes: [
    'harryschool://',
    'https://student.harryschool.app',
    'https://app.harryschool.uz'
  ],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Lessons: 'lessons',
          Schedule: {
            screens: {
              Calendar: 'schedule/:view?/:date?',
              ClassDetail: 'class/:classId/:action?',
              Attendance: 'attendance/:groupId'
            }
          },
          Vocabulary: 'vocabulary',
          Profile: {
            screens: {
              ProfileMain: 'profile/:section?',
              Settings: 'settings/:category?',
              Feedback: 'feedback',
              Referral: 'referral'
            }
          }
        }
      }
    }
  },
  // Filter URLs for security
  filter: (url: string) => {
    // Basic URL validation for security
    try {
      const urlObj = new URL(url);
      const allowedHosts = ['student.harryschool.app', 'app.harryschool.uz'];
      
      if (urlObj.protocol === 'harryschool:') {
        return true;
      }
      
      if (urlObj.protocol === 'https:' && allowedHosts.includes(urlObj.hostname)) {
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }
};

export const RootNavigator: React.FC<RootNavigatorProps> = ({ onReady }) => {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  
  // Mock student data - in real app, this would come from authentication context
  const [studentData] = useState({
    age: 14, // Mock age for testing
    isAuthenticated: true, // Mock authentication status
    parentalSettings: {
      oversightRequired: false,
      familyNotifications: true,
      restrictedFeatures: [],
      approvedTeachers: []
    }
  });

  // Deep linking hook - temporarily disabled
  // const { handleDeepLink, isProcessing, lastError, clearError } = useDeepLinking({
  //   studentAge: studentData.age,
  //   isAuthenticated: studentData.isAuthenticated,
  //   parentalSettings: studentData.parentalSettings
  // });

  // Handle navigation ready
  const handleNavigationReady = () => {
    // Performance monitoring
    if (__DEV__) {
      console.log('📱 Navigation ready for deep linking');
    }
    
    onReady?.();
  };

  // Custom theme with Harry School branding
  const customTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#1d7452',
      background: '#f8fafc',
      card: '#ffffff',
      text: '#1e293b',
      border: '#e2e8f0',
      notification: '#ef4444',
    },
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={customTheme}
      linking={linking}
      onReady={handleNavigationReady}
      onStateChange={(state) => {
        if (__DEV__) {
          console.log('📍 Navigation state changed:', state);
        }
      }}
    >
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator}
          options={{
            title: 'Harry School Student',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};