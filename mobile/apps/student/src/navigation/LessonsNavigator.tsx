import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { LessonsStackParamList } from '../types';
import LessonsListScreen from '../screens/lessons/LessonsListScreen';
import LessonDetailScreen from '../screens/lessons/LessonDetailScreen';
import LessonPlayerScreen from '../screens/lessons/LessonPlayerScreen';

const Stack = createStackNavigator<LessonsStackParamList>();

export default function LessonsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="LessonsList" 
        component={LessonsListScreen} 
      />
      <Stack.Screen 
        name="LessonDetail" 
        component={LessonDetailScreen}
        options={{
          headerShown: true,
          title: 'Lesson Details',
        }}
      />
      <Stack.Screen 
        name="LessonPlayer" 
        component={LessonPlayerScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}