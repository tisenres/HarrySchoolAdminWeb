/**
 * Lessons Stack Navigator for Harry School Student App
 * 
 * Handles the Lessons tab navigation with comprehensive Home Tasks module
 * Implements AI-powered task generation with OpenAI integration
 * Based on UX research findings for ages 10-18
 */

import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

// Shared components and theme
import { theme } from '@harry-school/ui';
import { useAuth } from '@harry-school/shared';

// Screen components
import { LessonsListScreen } from '../screens/lessons/LessonsListScreen';
import { LessonDetailScreen } from '../screens/lessons/LessonDetailScreen';

// Task screen components - implementing the 5 task types based on UX research
import { TextTaskScreen } from '../screens/lessons/tasks/TextTaskScreen';
import { QuizTaskScreen } from '../screens/lessons/tasks/QuizTaskScreen';
import { SpeakingTaskScreen } from '../screens/lessons/tasks/SpeakingTaskScreen';
import { ListeningTaskScreen } from '../screens/lessons/tasks/ListeningTaskScreen';
import { WritingTaskScreen } from '../screens/lessons/tasks/WritingTaskScreen';

// Types
import type { LessonsStackParamList, LessonsStackScreenProps } from './types';

// Analytics and services
import { lessonsAnalytics } from '../services/lessons-analytics';
import { progressService } from '../services/progress-service';
import { aiTaskService } from '../services/ai-task-service';

// Icons
import Icon from 'react-native-vector-icons/Ionicons';

const Stack = createNativeStackNavigator<LessonsStackParamList>();

// =====================================================
// HEADER CONFIGURATION
// =====================================================

const getHeaderOptions = (title: string, showBackButton: boolean = true) => ({
  title,
  headerShown: true,
  headerStyle: {
    backgroundColor: theme.colors.white,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitleStyle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: theme.colors.neutral[900],
  },
  headerBackTitle: 'Back',
  headerBackTitleVisible: false,
  headerTintColor: theme.colors.primary,
  headerLeft: showBackButton ? undefined : () => null,
});

// =====================================================
// CUSTOM HEADER COMPONENTS
// =====================================================

interface LessonsListHeaderProps {
  navigation: any;
  activeCount?: number;
  completedCount?: number;
}

const LessonsListHeader: React.FC<LessonsListHeaderProps> = ({ 
  navigation, 
  activeCount = 0,
  completedCount = 0 
}) => {
  const handleSearchPress = useCallback(() => {
    // TODO: Implement lesson search functionality
    console.log('Search lessons');
  }, []);

  const handleFilterPress = useCallback(() => {
    // TODO: Implement lesson filters
    console.log('Filter lessons');
  }, []);

  return (
    <View style={styles.listHeader}>
      <View style={styles.listHeaderLeft}>
        <Text style={styles.listTitle}>Home Tasks</Text>
        <Text style={styles.listSubtitle}>
          {activeCount} active • {completedCount} completed
        </Text>
      </View>
      <View style={styles.listHeaderRight}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSearchPress}
          accessibilityLabel="Search lessons"
          accessibilityRole="button"
        >
          <Icon name="search-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleFilterPress}
          accessibilityLabel="Filter lessons"
          accessibilityRole="button"
        >
          <Icon name="filter-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// =====================================================
// HEADER RIGHT ACTIONS
// =====================================================

interface HeaderRightProps {
  navigation: any;
  route: any;
}

const getHeaderRight = (screenName: string) => ({ navigation, route }: HeaderRightProps) => {
  switch (screenName) {
    case 'LessonDetail':
      return (
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              // TODO: Toggle lesson bookmarks
              console.log('Bookmark lesson');
            }}
            accessibilityLabel="Bookmark lesson"
          >
            <Icon name="bookmark-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              // TODO: Share lesson progress
              console.log('Share progress');
            }}
            accessibilityLabel="Share progress"
          >
            <Icon name="share-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      );
    
    case 'SpeakingTask':
      return (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            Alert.alert(
              'Exit Task?',
              'Your progress will be saved automatically.',
              [
                { text: 'Continue', style: 'cancel' },
                { text: 'Exit', onPress: () => navigation.goBack() },
              ]
            );
          }}
          accessibilityLabel="Exit task"
        >
          <Icon name="close-outline" size={24} color={theme.colors.error} />
        </TouchableOpacity>
      );
    
    case 'WritingTask':
      return (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            // TODO: Save draft
            console.log('Save draft');
          }}
          accessibilityLabel="Save draft"
        >
          <Icon name="save-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      );
    
    default:
      return null;
  }
};

// =====================================================
// PROGRESS PRESERVATION FOR LESSONS
// =====================================================

const useProgressPreservation = (screenName: string, params?: any) => {
  const progressRef = useRef<any>(null);

  useFocusEffect(
    useCallback(() => {
      // Restore progress when entering screen
      const savedProgress = progressService.getProgress(screenName, params);
      if (savedProgress) {
        progressRef.current = savedProgress;
      }

      return () => {
        // Save progress when leaving screen
        if (progressRef.current) {
          progressService.saveProgress(screenName, progressRef.current, params);
        }
      };
    }, [screenName, params])
  );

  return progressRef;
};

// =====================================================
// MAIN LESSONS STACK NAVIGATOR
// =====================================================

interface LessonsStackNavigatorProps {}

export const LessonsStackNavigator: React.FC<LessonsStackNavigatorProps> = () => {
  const { getStudentProfile, updateActivity } = useAuth();
  const studentProfile = getStudentProfile();

  // Track lessons section usage
  useFocusEffect(
    useCallback(() => {
      lessonsAnalytics.trackLessonsSectionEnter();
      updateActivity();
      
      return () => {
        lessonsAnalytics.trackLessonsSectionExit();
      };
    }, [updateActivity])
  );

  return (
    <Stack.Navigator
      initialRouteName="LessonsList"
      screenOptions={{
        gestureEnabled: true,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: theme.colors.neutral[50],
        },
      }}
    >
      {/* =====================================================
          MAIN LESSONS LIST (Entry Point)
          ===================================================== */}
      <Stack.Screen
        name="LessonsList"
        component={LessonsListScreen}
        options={({ navigation }) => ({
          headerShown: true,
          header: () => (
            <LessonsListHeader
              navigation={navigation}
              activeCount={5} // This will come from API
              completedCount={23} // This will come from API
            />
          ),
        })}
      />

      {/* =====================================================
          LESSON DETAIL VIEW
          ===================================================== */}
      <Stack.Screen
        name="LessonDetail"
        component={LessonDetailScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Lesson Details'),
          headerRight: getHeaderRight('LessonDetail')({ navigation, route }),
        })}
      />

      {/* =====================================================
          TASK SCREENS - Based on UX Research Preferences
          Text (20%), Quiz (35%), Speaking (25%), Listening (15%), Writing (5%)
          ===================================================== */}
      
      {/* Text-based learning tasks - 20% preference */}
      <Stack.Screen
        name="TextTask"
        component={TextTaskScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Reading Task'),
          gestureEnabled: false, // Prevent accidental exit during task
        })}
      />

      {/* Interactive quiz tasks - 35% preference (highest) */}
      <Stack.Screen
        name="QuizTask"
        component={QuizTaskScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Quiz Task'),
          gestureEnabled: false, // Prevent accidental exit during quiz
        })}
      />

      {/* Speaking practice with Whisper API - 25% preference */}
      <Stack.Screen
        name="SpeakingTask"
        component={SpeakingTaskScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Speaking Task'),
          headerRight: getHeaderRight('SpeakingTask')({ navigation, route }),
          gestureEnabled: false, // Prevent accidental exit during recording
        })}
      />

      {/* Audio comprehension tasks - 15% preference */}
      <Stack.Screen
        name="ListeningTask"
        component={ListeningTaskScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Listening Task'),
          gestureEnabled: false, // Prevent accidental exit during audio
        })}
      />

      {/* Writing practice tasks - 5% preference (lowest) */}
      <Stack.Screen
        name="WritingTask"
        component={WritingTaskScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Writing Task'),
          headerRight: getHeaderRight('WritingTask')({ navigation, route }),
          gestureEnabled: false, // Prevent accidental exit during writing
        })}
      />
    </Stack.Navigator>
  );
};

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  listHeaderLeft: {
    flex: 1,
  },
  listHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listTitle: {
    fontSize: 24,
    color: theme.colors.neutral[900],
    fontWeight: '700',
  },
  listSubtitle: {
    fontSize: 14,
    color: theme.colors.neutral[600],
    fontWeight: '500',
    marginTop: 2,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default LessonsStackNavigator;