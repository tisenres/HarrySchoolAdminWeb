/**
 * LessonsStack Navigator for Harry School Student App
 * 
 * Lessons section with courses, interactive activities, and learning content
 * Optimized for educational flow and engagement
 */

import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { LessonsStackParamList } from '../types';

// Placeholder screens - these will be implemented later
import { PlaceholderScreen } from '../../components/PlaceholderScreen';

const Stack = createStackNavigator<LessonsStackParamList>();

export const LessonsStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="CourseList"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen 
        name="CourseList" 
        options={{
          title: 'Courses',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="My Courses"
            description="Explore your enrolled courses and continue your learning journey."
            features={[
              'Active courses',
              'Course progress tracking',
              'Recently accessed lessons',
              'Recommended courses',
              'Difficulty levels',
              'Offline downloads'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="CourseDetail"
        options={{
          title: 'Course Details',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Course Overview"
            description="Detailed view of course content, lessons, and your progress."
            features={[
              'Course syllabus',
              'Lesson progression',
              'Learning objectives',
              'Prerequisites',
              'Estimated completion time',
              'Certificate requirements'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="LessonDetail"
        options={{
          title: 'Lesson',
          gestureEnabled: false, // Prevent accidental swipe during learning
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Interactive Lesson"
            description="Engaging lesson content with multimedia and interactive elements."
            features={[
              'Video lessons',
              'Interactive exercises',
              'Reading materials',
              'Audio narration',
              'Progress tracking',
              'Note-taking tools'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="InteractiveActivity"
        options={{
          title: 'Activity',
          presentation: 'fullScreenModal',
          gestureEnabled: false,
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Interactive Activity"
            description="Hands-on learning activities and exercises."
            features={[
              'Drag & drop exercises',
              'Multiple choice quizzes',
              'Fill-in-the-blank',
              'Matching games',
              'Drawing activities',
              'Voice recognition'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="QuizResults"
        options={{
          title: 'Quiz Results',
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Quiz Results"
            description="Review your quiz performance and learn from mistakes."
            features={[
              'Score breakdown',
              'Correct/incorrect answers',
              'Detailed explanations',
              'Performance analytics',
              'Retry options',
              'Progress impact'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="LessonProgress"
        options={{
          title: 'Lesson Progress',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Learning Progress"
            description="Track your progress through lessons and courses."
            features={[
              'Completion percentage',
              'Time spent learning',
              'Skill mastery levels',
              'Learning path visualization',
              'Next recommended lessons',
              'Achievement milestones'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="DownloadedContent"
        options={{
          title: 'Downloaded Lessons',
          presentation: 'modal',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Offline Content"
            description="Access your downloaded lessons for offline learning."
            features={[
              'Downloaded courses',
              'Storage management',
              'Sync status',
              'Download queue',
              'Auto-download settings',
              'Storage optimization'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="StudyPlanner"
        options={{
          title: 'Study Planner',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Smart Study Planner"
            description="AI-powered study planning based on your learning patterns."
            features={[
              'Personalized study schedule',
              'Learning time optimization',
              'Deadline management',
              'Progress predictions',
              'Study reminders',
              'Adaptive planning'
            ]}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};