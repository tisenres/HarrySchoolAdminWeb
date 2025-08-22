import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../types';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen 
            name="Auth" 
            component={AuthNavigator} 
          />
          <Stack.Screen 
            name="Onboarding" 
            component={OnboardingScreen}
            options={{
              gestureEnabled: true,
              gestureDirection: 'horizontal',
            }}
          />
        </>
      ) : (
        <Stack.Screen 
          name="Main" 
          component={MainNavigator} 
        />
      )}
    </Stack.Navigator>
  );
}