/**
 * LessonDetailScreen.tsx
 * Harry School Student App - Home Tasks Module
 * 
 * Dynamic lesson detail screen with age-adaptive content rendering and AI integration
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
  BackHandler,
} from 'react-native';
import { RouteProp, useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Button, Chip, ProgressBar, Avatar, Surface, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming,
  interpolate
} from 'react-native-reanimated';

import { LessonsStackParamList } from '../../navigation/stacks/LessonsStack';
import { useStudentProfile } from '../../hooks/useStudentProfile';
import { useTasksData } from '../../hooks/useTasksData';
import { TaskHeader } from '../../components/tasks/TaskHeader';
import { TaskProgress } from '../../components/tasks/TaskProgress';
import { Colors, Spacing, Typography } from '@harry-school/ui';
import { performanceMonitor } from '../../services/performance/performanceMonitor';
import type { Task, TaskType, StudentAgeGroup } from '../../types/tasks';

type LessonDetailScreenRouteProp = RouteProp<LessonsStackParamList, 'LessonDetail'>;
type LessonDetailScreenNavigationProp = NativeStackNavigationProp<LessonsStackParamList, 'LessonDetail'>;

const { width: screenWidth } = Dimensions.get('window');

export const LessonDetailScreen: React.FC = () => {
  const route = useRoute<LessonDetailScreenRouteProp>();
  const navigation = useNavigation<LessonDetailScreenNavigationProp>();
  const { lessonId } = route.params;

  const { student } = useStudentProfile();
  const { 
    lessonTasks, 
    lessonProgress, 
    isLoading,
    error,
    startTask,
    resumeTask,
    markTaskComplete 
  } = useTasksData(lessonId);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [lessonStarted, setLessonStarted] = useState(false);

  // Animation values
  const fadeInOpacity = useSharedValue(0);
  const slideInY = useSharedValue(50);
  const taskCardsScale = useSharedValue(0.95);

  const ageGroup = student?.ageGroup || '13-15';
  const isElementary = ageGroup === '10-12';
  const isSecondary = ageGroup === '16-18';

  // Performance monitoring
  useEffect(() => {
    const startTime = Date.now();
    performanceMonitor.markStart('lesson-detail-load');
    
    return () => {
      const loadTime = Date.now() - startTime;
      performanceMonitor.markEnd('lesson-detail-load', { 
        lessonId, 
        taskCount: lessonTasks?.length || 0,
        loadTime 
      });
    };
  }, []);

  // Screen focus effects
  useFocusEffect(
    useCallback(() => {
      // Entrance animations
      fadeInOpacity.value = withTiming(1, { duration: 300 });
      slideInY.value = withTiming(0, { duration: 400 });
      taskCardsScale.value = withSequence(
        withTiming(1, { duration: 300 }),
        withSpring(1, { damping: 15, stiffness: 150 })
      );

      // Android back button handling
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBackPress();
        return true;
      });

      return () => {
        backHandler.remove();
      };
    }, [])
  );

  const handleBackPress = useCallback(() => {
    if (lessonStarted && lessonProgress && lessonProgress.completedTasks < lessonTasks?.length) {
      Alert.alert(
        isElementary ? 'Leave lesson?' : 'Exit lesson?',
        isElementary 
          ? 'Your progress will be saved and you can come back anytime!' 
          : 'Your current progress will be saved. Continue later?',
        [
          {
            text: isElementary ? 'Stay here' : 'Cancel',
            style: 'cancel'
          },
          {
            text: isElementary ? 'Save & Leave' : 'Exit',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [lessonStarted, lessonProgress, lessonTasks, navigation, isElementary]);

  const startLesson = useCallback(async () => {
    if (!lessonTasks || lessonTasks.length === 0) return;
    
    try {
      setLessonStarted(true);
      const firstIncompleteTask = lessonTasks.find(task => !task.isCompleted);
      
      if (firstIncompleteTask) {
        await startTask(firstIncompleteTask.id);
        navigateToTaskScreen(firstIncompleteTask);
      }
    } catch (error) {
      console.error('Failed to start lesson:', error);
      Alert.alert(
        'Error',
        isElementary ? 'Oops! Something went wrong. Try again?' : 'Unable to start lesson. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [lessonTasks, startTask, isElementary]);

  const navigateToTaskScreen = useCallback((task: Task) => {
    const screenName = getTaskScreenName(task.type);
    navigation.navigate(screenName as any, { 
      taskId: task.id,
      lessonId,
      taskIndex: lessonTasks?.findIndex(t => t.id === task.id) || 0
    });
  }, [navigation, lessonId, lessonTasks]);

  const getTaskScreenName = (taskType: TaskType): keyof LessonsStackParamList => {
    switch (taskType) {
      case 'text': return 'TextTask';
      case 'quiz': return 'QuizTask';
      case 'speaking': return 'SpeakingTask';
      case 'listening': return 'ListeningTask';
      case 'writing': return 'WritingTask';
      default: return 'TextTask';
    }
  };

  const getTaskTypeIcon = (taskType: TaskType): string => {
    switch (taskType) {
      case 'text': return 'book-open-page-variant';
      case 'quiz': return 'help-circle';
      case 'speaking': return 'microphone';
      case 'listening': return 'headphones';
      case 'writing': return 'pencil';
      default: return 'file-document';
    }
  };

  const getTaskTypeName = (taskType: TaskType): string => {
    switch (taskType) {
      case 'text': return isElementary ? 'Reading Adventure' : 'Text Analysis';
      case 'quiz': return isElementary ? 'Quiz Challenge' : 'Assessment';
      case 'speaking': return isElementary ? 'Speaking Practice' : 'Oral Exercise';
      case 'listening': return isElementary ? 'Listening Game' : 'Audio Comprehension';
      case 'writing': return isElementary ? 'Writing Quest' : 'Writing Assignment';
      default: return 'Task';
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return Colors.green500;
      case 'intermediate': return Colors.orange500;
      case 'advanced': return Colors.red500;
      default: return Colors.blue500;
    }
  };

  const getDifficultyLabel = (difficulty: string): string => {
    if (isElementary) {
      switch (difficulty) {
        case 'beginner': return '⭐ Easy';
        case 'intermediate': return '⭐⭐ Medium';
        case 'advanced': return '⭐⭐⭐ Hard';
        default: return '⭐ Normal';
      }
    }
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeInOpacity.value,
    transform: [{ translateY: slideInY.value }]
  }));

  const taskCardsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: taskCardsScale.value }]
  }));

  const lesson = lessonTasks?.[0]?.lesson;
  const progressPercentage = lessonProgress ? 
    Math.round((lessonProgress.completedTasks / (lessonTasks?.length || 1)) * 100) : 0;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <TaskHeader 
          title="Loading..."
          onBack={() => navigation.goBack()}
          ageGroup={ageGroup}
        />
        <View style={styles.loadingContainer}>
          <ProgressBar indeterminate color={Colors.primary} />
          <Text style={[styles.loadingText, isElementary && styles.elementaryText]}>
            {isElementary ? 'Getting your lesson ready...' : 'Loading lesson content...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !lesson || !lessonTasks) {
    return (
      <SafeAreaView style={styles.container}>
        <TaskHeader 
          title="Error"
          onBack={() => navigation.goBack()}
          ageGroup={ageGroup}
        />
        <View style={styles.errorContainer}>
          <Avatar.Icon 
            icon="alert-circle" 
            size={isElementary ? 80 : 64}
            style={{ backgroundColor: Colors.red500 }}
          />
          <Text style={[styles.errorTitle, isElementary && styles.elementaryErrorTitle]}>
            {isElementary ? 'Oops! Something went wrong' : 'Unable to load lesson'}
          </Text>
          <Text style={styles.errorMessage}>
            {error?.message || 'Please check your connection and try again.'}
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          >
            {isElementary ? 'Go Back' : 'Return'}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TaskHeader 
        title={lesson.title}
        subtitle={lesson.subject}
        onBack={handleBackPress}
        ageGroup={ageGroup}
      />
      
      <Animated.View style={[styles.content, containerStyle]}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Lesson Overview */}
          <Card style={[styles.overviewCard, isElementary && styles.elementaryCard]}>
            <Card.Content>
              <View style={styles.lessonHeader}>
                <Avatar.Icon
                  icon="book-open"
                  size={isElementary ? 56 : 48}
                  style={{ 
                    backgroundColor: Colors.primary,
                    marginRight: Spacing.md 
                  }}
                />
                <View style={styles.lessonInfo}>
                  <Text style={[styles.lessonTitle, isElementary && styles.elementaryTitle]}>
                    {lesson.title}
                  </Text>
                  <Text style={styles.lessonSubject}>
                    {lesson.subject} • {lesson.level}
                  </Text>
                  {lesson.description && (
                    <Text style={styles.lessonDescription}>
                      {lesson.description}
                    </Text>
                  )}
                </View>
              </View>
              
              {/* Progress Section */}
              {lessonProgress && (
                <View style={styles.progressSection}>
                  <TaskProgress
                    progress={progressPercentage}
                    total={lessonTasks.length}
                    completed={lessonProgress.completedTasks}
                    ageGroup={ageGroup}
                    showDetails={!isElementary}
                  />
                </View>
              )}
              
              {/* Lesson Stats */}
              <View style={styles.statsRow}>
                <Chip
                  icon="clock"
                  style={styles.statChip}
                  textStyle={styles.statChipText}
                >
                  {lesson.estimatedDuration} min
                </Chip>
                <Chip
                  icon="star"
                  style={styles.statChip}
                  textStyle={styles.statChipText}
                >
                  {lesson.pointsReward} pts
                </Chip>
                <Chip
                  icon="account-group"
                  style={[styles.statChip, { backgroundColor: getDifficultyColor(lesson.difficulty) }]}
                  textStyle={[styles.statChipText, { color: 'white' }]}
                >
                  {getDifficultyLabel(lesson.difficulty)}
                </Chip>
              </View>
            </Card.Content>
          </Card>

          {/* Tasks List */}
          <View style={styles.tasksSection}>
            <Text style={[styles.sectionTitle, isElementary && styles.elementarySectionTitle]}>
              {isElementary ? '🎯 Your Tasks' : 'Lesson Tasks'}
            </Text>
            
            <Animated.View style={taskCardsStyle}>
              {lessonTasks.map((task, index) => (
                <Surface
                  key={task.id}
                  style={[
                    styles.taskCard,
                    task.isCompleted && styles.completedTaskCard,
                    isElementary && styles.elementaryTaskCard
                  ]}
                  elevation={task.isCompleted ? 1 : 3}
                >
                  <View style={styles.taskCardContent}>
                    <View style={styles.taskCardHeader}>
                      <Avatar.Icon
                        icon={getTaskTypeIcon(task.type)}
                        size={isElementary ? 40 : 36}
                        style={[
                          styles.taskTypeIcon,
                          task.isCompleted && styles.completedTaskIcon,
                          { backgroundColor: task.isCompleted ? Colors.green500 : Colors.blue500 }
                        ]}
                      />
                      
                      <View style={styles.taskCardInfo}>
                        <Text style={[
                          styles.taskCardTitle,
                          task.isCompleted && styles.completedTaskTitle,
                          isElementary && styles.elementaryTaskTitle
                        ]}>
                          {getTaskTypeName(task.type)}
                        </Text>
                        
                        <Text style={styles.taskCardSubtitle}>
                          Task {index + 1} of {lessonTasks.length}
                        </Text>
                      </View>
                      
                      {task.isCompleted && (
                        <Avatar.Icon
                          icon="check-circle"
                          size={24}
                          style={styles.completedIcon}
                        />
                      )}
                    </View>
                    
                    {task.description && (
                      <Text style={styles.taskDescription} numberOfLines={2}>
                        {task.description}
                      </Text>
                    )}
                    
                    <View style={styles.taskMeta}>
                      <Text style={styles.taskDuration}>
                        ⏱️ {task.estimatedDuration} min
                      </Text>
                      <Text style={styles.taskPoints}>
                        🏆 {task.pointsReward} pts
                      </Text>
                    </View>
                  </View>
                  
                  <Button
                    mode={task.isCompleted ? "outlined" : "contained"}
                    onPress={() => {
                      if (task.isCompleted) {
                        navigateToTaskScreen(task);
                      } else {
                        resumeTask(task.id);
                        navigateToTaskScreen(task);
                      }
                    }}
                    style={styles.taskButton}
                    labelStyle={isElementary ? styles.elementaryButtonLabel : undefined}
                  >
                    {task.isCompleted 
                      ? (isElementary ? 'Review' : 'Review Task')
                      : task.progress && task.progress > 0
                        ? (isElementary ? 'Continue' : 'Continue Task')
                        : (isElementary ? 'Start' : 'Begin Task')
                    }
                  </Button>
                </Surface>
              ))}
            </Animated.View>
          </View>

          {/* Start/Resume Lesson Button */}
          <View style={styles.actionSection}>
            {!lessonStarted || (lessonProgress && lessonProgress.completedTasks === 0) ? (
              <Button
                mode="contained"
                onPress={startLesson}
                style={[styles.primaryButton, isElementary && styles.elementaryPrimaryButton]}
                labelStyle={[styles.primaryButtonLabel, isElementary && styles.elementaryPrimaryButtonLabel]}
                contentStyle={styles.primaryButtonContent}
                icon={isElementary ? "rocket-launch" : "play"}
              >
                {isElementary ? '🚀 Start Adventure!' : 'Begin Lesson'}
              </Button>
            ) : lessonProgress && lessonProgress.completedTasks < lessonTasks.length ? (
              <Button
                mode="contained"
                onPress={() => {
                  const nextTask = lessonTasks.find(task => !task.isCompleted);
                  if (nextTask) {
                    navigateToTaskScreen(nextTask);
                  }
                }}
                style={[styles.primaryButton, isElementary && styles.elementaryPrimaryButton]}
                labelStyle={[styles.primaryButtonLabel, isElementary && styles.elementaryPrimaryButtonLabel]}
                contentStyle={styles.primaryButtonContent}
                icon="arrow-right"
              >
                {isElementary ? '⚡ Continue Quest!' : 'Continue Lesson'}
              </Button>
            ) : (
              <View style={styles.completedSection}>
                <Avatar.Icon
                  icon="trophy"
                  size={isElementary ? 64 : 56}
                  style={styles.trophyIcon}
                />
                <Text style={[styles.completedTitle, isElementary && styles.elementaryCompletedTitle]}>
                  {isElementary ? '🎉 Adventure Complete!' : 'Lesson Completed!'}
                </Text>
                <Text style={styles.completedMessage}>
                  {isElementary 
                    ? 'Amazing work! You earned all the points!'
                    : `Well done! You've earned ${lesson.pointsReward} points.`
                  }
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  elementaryText: {
    ...Typography.bodyLarge,
    color: Colors.primary,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    ...Typography.headlineSmall,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    color: Colors.error,
  },
  elementaryErrorTitle: {
    ...Typography.headlineMedium,
    color: Colors.red500,
  },
  errorMessage: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    color: Colors.textSecondary,
  },
  errorButton: {
    marginTop: Spacing.md,
  },
  overviewCard: {
    marginBottom: Spacing.lg,
    borderRadius: 12,
  },
  elementaryCard: {
    elevation: 4,
    borderRadius: 16,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    ...Typography.headlineSmall,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  elementaryTitle: {
    ...Typography.headlineMedium,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  lessonSubject: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  lessonDescription: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  progressSection: {
    marginVertical: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outline,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  statChip: {
    backgroundColor: Colors.surfaceVariant,
  },
  statChipText: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  tasksSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.titleLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  elementarySectionTitle: {
    ...Typography.titleLarge,
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 22,
  },
  taskCard: {
    marginBottom: Spacing.md,
    borderRadius: 12,
    padding: Spacing.md,
  },
  elementaryTaskCard: {
    borderRadius: 16,
    elevation: 3,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  completedTaskCard: {
    backgroundColor: Colors.surfaceVariant,
    opacity: 0.8,
  },
  taskCardContent: {
    marginBottom: Spacing.sm,
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  taskTypeIcon: {
    marginRight: Spacing.sm,
  },
  completedTaskIcon: {
    backgroundColor: Colors.green500,
  },
  taskCardInfo: {
    flex: 1,
  },
  taskCardTitle: {
    ...Typography.titleMedium,
    color: Colors.textPrimary,
  },
  elementaryTaskTitle: {
    ...Typography.titleLarge,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  completedTaskTitle: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  taskCardSubtitle: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  taskDescription: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  taskDuration: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
  },
  taskPoints: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  taskButton: {
    alignSelf: 'flex-start',
  },
  completedIcon: {
    backgroundColor: Colors.green500,
  },
  actionSection: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  primaryButton: {
    minWidth: screenWidth * 0.7,
  },
  elementaryPrimaryButton: {
    elevation: 4,
    borderRadius: 25,
  },
  primaryButtonContent: {
    paddingVertical: Spacing.sm,
  },
  primaryButtonLabel: {
    ...Typography.labelLarge,
  },
  elementaryPrimaryButtonLabel: {
    ...Typography.titleMedium,
    fontWeight: 'bold',
  },
  elementaryButtonLabel: {
    ...Typography.labelLarge,
    fontWeight: '600',
  },
  completedSection: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  trophyIcon: {
    backgroundColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  completedTitle: {
    ...Typography.headlineSmall,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  elementaryCompletedTitle: {
    ...Typography.headlineMedium,
    fontWeight: 'bold',
  },
  completedMessage: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default LessonDetailScreen;