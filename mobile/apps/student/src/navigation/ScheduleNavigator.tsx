import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { ScheduleStackParamList } from '../types';
import CalendarScreen from '../screens/schedule/CalendarScreen';
import ClassDetailScreen from '../screens/schedule/ClassDetailScreen';
import AttendanceHistoryScreen from '../screens/schedule/AttendanceHistoryScreen';

const Stack = createStackNavigator<ScheduleStackParamList>();

export default function ScheduleNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="Calendar" 
        component={CalendarScreen} 
      />
      <Stack.Screen 
        name="ClassDetail" 
        component={ClassDetailScreen}
        options={{
          headerShown: true,
          title: 'Class Details',
        }}
      />
      <Stack.Screen 
        name="AttendanceHistory" 
        component={AttendanceHistoryScreen}
        options={{
          headerShown: true,
          title: 'Attendance History',
        }}
      />
    </Stack.Navigator>
  );
}