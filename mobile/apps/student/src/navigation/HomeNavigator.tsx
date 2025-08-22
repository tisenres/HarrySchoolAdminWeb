import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { HomeStackParamList } from '../types';
import DashboardScreen from '../screens/home/DashboardScreen';
import NotificationsScreen from '../screens/home/NotificationsScreen';
import AchievementsScreen from '../screens/home/AchievementsScreen';

const Stack = createStackNavigator<HomeStackParamList>();

export default function HomeNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          headerShown: true,
          title: 'Notifications',
        }}
      />
      <Stack.Screen 
        name="Achievements" 
        component={AchievementsScreen}
        options={{
          headerShown: true,
          title: 'Achievements',
        }}
      />
    </Stack.Navigator>
  );
}