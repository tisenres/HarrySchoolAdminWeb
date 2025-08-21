/**
 * ScheduleStack Navigator for Harry School Student App
 * 
 * Schedule section with calendar, assignments, and class management
 * Optimized for academic planning and time management
 */

import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { ScheduleStackParamList } from '../types';

// Placeholder screens - these will be implemented later
import { PlaceholderScreen } from '../../components/PlaceholderScreen';

const Stack = createStackNavigator<ScheduleStackParamList>();

export const ScheduleStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Calendar"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen 
        name="Calendar" 
        options={{
          title: 'Schedule',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="My Schedule"
            description="View your daily, weekly, and monthly class schedule with assignments."
            features={[
              'Interactive calendar',
              'Daily class schedule',
              'Assignment due dates',
              'Exam schedules',
              'Teacher availability',
              'Time zone support'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="ClassDetail"
        options={{
          title: 'Class Details',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Class Information"
            description="Detailed information about your class session."
            features={[
              'Class topic and objectives',
              'Required materials',
              'Teacher information',
              'Virtual classroom link',
              'Class recordings',
              'Participation tracking'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="Assignment"
        options={{
          title: 'Assignment',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Assignment Details"
            description="Complete and submit your assignments with ease."
            features={[
              'Assignment instructions',
              'Submission portal',
              'File attachments',
              'Due date countdown',
              'Draft auto-save',
              'Teacher feedback'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="Homework"
        options={{
          title: 'Homework',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Homework Hub"
            description="Manage and complete your homework assignments efficiently."
            features={[
              'Homework checklist',
              'Priority sorting',
              'Time tracking',
              'Progress indicators',
              'Help resources',
              'Parent notifications'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="ExamPrep"
        options={{
          title: 'Exam Preparation',
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Exam Preparation"
            description="Comprehensive exam preparation tools and resources."
            features={[
              'Study guides',
              'Practice tests',
              'Review materials',
              'Study schedule',
              'Performance analytics',
              'Stress management tips'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="AttendanceHistory"
        options={{
          title: 'Attendance',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Attendance Record"
            description="Track your class attendance and participation history."
            features={[
              'Attendance statistics',
              'Monthly summaries',
              'Absence reasons',
              'Make-up classes',
              'Participation scores',
              'Parent reports'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="Timetable"
        options={{
          title: 'Weekly Timetable',
          presentation: 'modal',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Class Timetable"
            description="Your complete weekly class schedule at a glance."
            features={[
              'Weekly grid view',
              'Subject color coding',
              'Room assignments',
              'Teacher schedules',
              'Break times',
              'Export options'
            ]}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};