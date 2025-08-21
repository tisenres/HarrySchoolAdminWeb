/**
 * QuizTaskScreen.tsx
 * Harry School Student App - Home Tasks Module
 * 
 * Interactive quiz screen with immediate AI feedback and age-adaptive design
 */

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Animated as RNAnimated,
  Dimensions,
  Vibration,
  Platform,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Card,
  Button,
  Chip,
  ProgressBar,
  Avatar,
  Surface,
  RadioButton,
  Checkbox,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { LessonsStackParamList } from '../../navigation/stacks/LessonsStack';
import { useStudentProfile } from '../../hooks/useStudentProfile';
import { useTaskTimer } from '../../hooks/useTaskTimer';
import { TaskHeader } from '../../components/tasks/TaskHeader';
import { TaskProgress } from '../../components/tasks/TaskProgress';
import { Colors, Spacing, Typography } from '@harry-school/ui';
import { aiEvaluationService } from '../../services/ai/aiEvaluation.service';
import { performanceMonitor } from '../../services/performance/performanceMonitor';
import type { QuizQuestion, QuizAnswer, StudentAgeGroup } from '../../types/tasks';

type QuizTaskScreenRouteProp = RouteProp<LessonsStackParamList, 'QuizTask'>;
type QuizTaskScreenNavigationProp = NativeStackNavigationProp<LessonsStackParamList, 'QuizTask'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface QuizState {
  currentQuestionIndex: number;
  answers: Record<string, QuizAnswer>;
  showFeedback: boolean;
  feedbackMessage: string;
  isCorrect: boolean | null;
  score: number;
  isCompleted: boolean;
}

const SAMPLE_QUIZ: QuizQuestion[] = [
  {
    id: '1',
    type: 'multiple-choice',
    question: 'What is the capital of Uzbekistan?',
    options: ['Samarkand', 'Tashkent', 'Bukhara', 'Khiva'],
    correctAnswer: '1', // Tashkent
    explanation: 'Tashkent is the capital and largest city of Uzbekistan.',
    difficulty: 'beginner',
    points: 10,
  },
  {
    id: '2',
    type: 'true-false',
    question: 'The Silk Road passed through Uzbekistan.',
    correctAnswer: 'true',
    explanation: 'Uzbekistan was an important part of the ancient Silk Road trade route.',
    difficulty: 'beginner',
    points: 10,
  },
  {
    id: '3',
    type: 'fill-in-blank',
    question: 'Uzbekistan gained independence in ____.',
    correctAnswer: '1991',
    explanation: 'Uzbekistan declared independence from the Soviet Union on August 31, 1991.',
    difficulty: 'intermediate',
    points: 15,
  },
];

export const QuizTaskScreen: React.FC = () => {
  const route = useRoute<QuizTaskScreenRouteProp>();
  const navigation = useNavigation<QuizTaskScreenNavigationProp>();
  const { taskId, lessonId } = route.params;

  const { student } = useStudentProfile();
  const { timeElapsed, isRunning, startTimer, pauseTimer, resetTimer } = useTaskTimer(taskId);

  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: {},
    showFeedback: false,
    feedbackMessage: '',
    isCorrect: null,
    score: 0,
    isCompleted: false,
  });

  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation references
  const questionFadeAnim = useRef(new RNAnimated.Value(1)).current;
  const feedbackSlideAnim = useRef(new RNAnimated.Value(-50)).current;
  const celebrationScale = useSharedValue(0);
  const progressPulse = useSharedValue(1);

  const ageGroup = student?.ageGroup || '13-15';
  const isElementary = ageGroup === '10-12';
  const isSecondary = ageGroup === '16-18';

  const currentQuestion = SAMPLE_QUIZ[quizState.currentQuestionIndex];
  const totalQuestions = SAMPLE_QUIZ.length;
  const progressPercentage = ((quizState.currentQuestionIndex + 1) / totalQuestions) * 100;

  // Start timer on mount
  useEffect(() => {
    startTimer();
    performanceMonitor.markStart('quiz-task-session');

    return () => {
      pauseTimer();
      performanceMonitor.markEnd('quiz-task-session', {
        taskId,
        questionsCompleted: quizState.currentQuestionIndex,
        score: quizState.score,
        timeElapsed,
      });
    };
  }, []);

  // Celebration animation
  const celebrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
    opacity: celebrationScale.value,
  }));

  const progressPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: progressPulse.value }],
  }));

  const triggerCelebration = useCallback(() => {
    celebrationScale.value = withSequence(
      withSpring(1.2, { damping: 15 }),
      withTiming(0, { duration: 1000 })
    );

    progressPulse.value = withSequence(
      withSpring(1.1, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );

    if (isElementary && Platform.OS === 'android') {
      runOnJS(Vibration.vibrate)(100);
    }
  }, [isElementary]);

  const submitAnswer = useCallback(async () => {
    if (!currentAnswer.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Animate question fade out
      RNAnimated.timing(questionFadeAnim, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Evaluate answer using AI
      const evaluation = await aiEvaluationService.evaluateQuizAnswer({
        question: currentQuestion,
        studentAnswer: currentAnswer,
        studentAge: student?.age || 14,
        culturalContext: 'uzbekistan',
      });

      const isCorrect = evaluation.isCorrect;
      const points = isCorrect ? currentQuestion.points : 0;

      // Update quiz state
      setQuizState(prev => ({
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestion.id]: {
            answer: currentAnswer,
            isCorrect,
            points,
            feedback: evaluation.feedback,
          },
        },
        showFeedback: true,
        feedbackMessage: evaluation.feedback,
        isCorrect,
        score: prev.score + points,
      }));

      // Show feedback animation
      RNAnimated.parallel([
        RNAnimated.timing(feedbackSlideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        RNAnimated.timing(questionFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      if (isCorrect) {
        triggerCelebration();
      }

    } catch (error) {
      console.error('Failed to evaluate answer:', error);
      Alert.alert(
        'Error',
        isElementary ? 'Oops! Try again?' : 'Unable to check your answer. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [currentAnswer, currentQuestion, isSubmitting, student, isElementary, triggerCelebration]);

  const nextQuestion = useCallback(() => {
    const nextIndex = quizState.currentQuestionIndex + 1;

    if (nextIndex >= totalQuestions) {
      // Quiz completed
      setQuizState(prev => ({ ...prev, isCompleted: true }));
      pauseTimer();
      
      // Show completion celebration
      if (isElementary) {
        triggerCelebration();
      }
    } else {
      // Move to next question
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        showFeedback: false,
        feedbackMessage: '',
        isCorrect: null,
      }));
      
      setCurrentAnswer('');
      
      // Reset animations
      feedbackSlideAnim.setValue(-50);
      
      // Fade in new question
      RNAnimated.timing(questionFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [quizState.currentQuestionIndex, totalQuestions, pauseTimer, isElementary, triggerCelebration]);

  const restartQuiz = useCallback(() => {
    setQuizState({
      currentQuestionIndex: 0,
      answers: {},
      showFeedback: false,
      feedbackMessage: '',
      isCorrect: null,
      score: 0,
      isCompleted: false,
    });
    setCurrentAnswer('');
    resetTimer();
    startTimer();
  }, [resetTimer, startTimer]);

  const finishQuiz = useCallback(() => {
    Alert.alert(
      isElementary ? 'Great job!' : 'Quiz Complete',
      isElementary 
        ? `You scored ${quizState.score} points! 🎉`
        : `You scored ${quizState.score} out of ${SAMPLE_QUIZ.reduce((sum, q) => sum + q.points, 0)} points.`,
      [
        {
          text: isElementary ? 'Try Again' : 'Retry Quiz',
          onPress: restartQuiz,
        },
        {
          text: isElementary ? 'Finished!' : 'Complete',
          onPress: () => navigation.goBack(),
          style: 'default',
        },
      ]
    );
  }, [quizState.score, isElementary, restartQuiz, navigation]);

  const renderQuestionContent = () => {
    switch (currentQuestion.type) {
      case 'multiple-choice':
        return (
          <View style={styles.optionsContainer}>
            <RadioButton.Group
              onValueChange={setCurrentAnswer}
              value={currentAnswer}
            >
              {currentQuestion.options?.map((option, index) => (
                <Surface
                  key={index}
                  style={[
                    styles.optionCard,
                    currentAnswer === index.toString() && styles.selectedOption,
                    isElementary && styles.elementaryOption,
                  ]}
                  elevation={currentAnswer === index.toString() ? 3 : 1}
                >
                  <View style={styles.optionContent}>
                    <RadioButton
                      value={index.toString()}
                      color={Colors.primary}
                    />
                    <Text style={[
                      styles.optionText,
                      isElementary && styles.elementaryOptionText,
                    ]}>
                      {option}
                    </Text>
                  </View>
                </Surface>
              ))}
            </RadioButton.Group>
          </View>
        );

      case 'true-false':
        return (
          <View style={styles.trueFalseContainer}>
            <Surface
              style={[
                styles.trueFalseOption,
                currentAnswer === 'true' && styles.selectedTrueFalse,
                isElementary && styles.elementaryTrueFalse,
              ]}
              elevation={currentAnswer === 'true' ? 3 : 1}
            >
              <Button
                mode={currentAnswer === 'true' ? 'contained' : 'outlined'}
                onPress={() => setCurrentAnswer('true')}
                style={styles.trueFalseButton}
                labelStyle={[styles.trueFalseLabel, isElementary && styles.elementaryTrueFalseLabel]}
                icon={isElementary ? 'check-circle' : undefined}
              >
                {isElementary ? '✓ True' : 'True'}
              </Button>
            </Surface>

            <Surface
              style={[
                styles.trueFalseOption,
                currentAnswer === 'false' && styles.selectedTrueFalse,
                isElementary && styles.elementaryTrueFalse,
              ]}
              elevation={currentAnswer === 'false' ? 3 : 1}
            >
              <Button
                mode={currentAnswer === 'false' ? 'contained' : 'outlined'}
                onPress={() => setCurrentAnswer('false')}
                style={styles.trueFalseButton}
                labelStyle={[styles.trueFalseLabel, isElementary && styles.elementaryTrueFalseLabel]}
                icon={isElementary ? 'close-circle' : undefined}
              >
                {isElementary ? '✗ False' : 'False'}
              </Button>
            </Surface>
          </View>
        );

      case 'fill-in-blank':
        return (
          <View style={styles.fillInContainer}>
            <TextInput
              value={currentAnswer}
              onChangeText={setCurrentAnswer}
              placeholder={isElementary ? 'Type your answer here...' : 'Enter your answer'}
              mode="outlined"
              style={[styles.fillInInput, isElementary && styles.elementaryInput]}
              contentStyle={[styles.inputContent, isElementary && styles.elementaryInputContent]}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        );

      default:
        return null;
    }
  };

  if (quizState.isCompleted) {
    const maxScore = SAMPLE_QUIZ.reduce((sum, q) => sum + q.points, 0);
    const percentage = Math.round((quizState.score / maxScore) * 100);

    return (
      <SafeAreaView style={styles.container}>
        <TaskHeader
          title={isElementary ? 'Quiz Complete!' : 'Quiz Results'}
          onBack={() => navigation.goBack()}
          ageGroup={ageGroup}
        />

        <View style={styles.completionContainer}>
          <Animated.View style={[styles.celebrationContainer, celebrationStyle]}>
            <Avatar.Icon
              icon="trophy"
              size={isElementary ? 120 : 100}
              style={[styles.trophyIcon, { backgroundColor: percentage >= 70 ? Colors.primary : Colors.orange500 }]}
            />
            <Text style={isElementary ? '🎉' : ''} />
          </Animated.View>

          <Text style={[styles.completionTitle, isElementary && styles.elementaryCompletionTitle]}>
            {isElementary ? `Amazing! ${percentage}%` : `Final Score: ${percentage}%`}
          </Text>

          <Text style={[styles.completionSubtitle, isElementary && styles.elementaryCompletionSubtitle]}>
            {isElementary 
              ? `You earned ${quizState.score} points!`
              : `${quizState.score} out of ${maxScore} points`
            }
          </Text>

          <Card style={[styles.summaryCard, isElementary && styles.elementarySummaryCard]}>
            <Card.Content>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Questions Answered:</Text>
                <Text style={styles.summaryValue}>{totalQuestions}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time Taken:</Text>
                <Text style={styles.summaryValue}>
                  {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Accuracy:</Text>
                <Text style={[styles.summaryValue, { color: percentage >= 70 ? Colors.green500 : Colors.orange500 }]}>
                  {percentage}%
                </Text>
              </View>
            </Card.Content>
          </Card>

          <View style={styles.completionActions}>
            <Button
              mode="outlined"
              onPress={restartQuiz}
              style={[styles.actionButton, isElementary && styles.elementaryActionButton]}
              labelStyle={isElementary ? styles.elementaryButtonLabel : undefined}
            >
              {isElementary ? '🔄 Try Again' : 'Retry Quiz'}
            </Button>

            <Button
              mode="contained"
              onPress={() => navigation.goBack()}
              style={[styles.actionButton, isElementary && styles.elementaryActionButton]}
              labelStyle={isElementary ? styles.elementaryButtonLabel : undefined}
            >
              {isElementary ? '✅ Finished!' : 'Complete'}
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TaskHeader
        title={`${isElementary ? 'Quiz Challenge' : 'Quiz'}`}
        subtitle={`Question ${quizState.currentQuestionIndex + 1} of ${totalQuestions}`}
        onBack={() => navigation.goBack()}
        timer={timeElapsed}
        ageGroup={ageGroup}
      />

      <Animated.View style={[styles.progressContainer, progressPulseStyle]}>
        <TaskProgress
          progress={progressPercentage}
          total={totalQuestions}
          completed={quizState.currentQuestionIndex}
          ageGroup={ageGroup}
          showDetails={!isElementary}
        />
      </Animated.View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <RNAnimated.View style={[styles.questionContainer, { opacity: questionFadeAnim }]}>
          <Card style={[styles.questionCard, isElementary && styles.elementaryQuestionCard]}>
            <Card.Content>
              <View style={styles.questionHeader}>
                <Chip
                  icon="star"
                  style={[styles.pointsChip, { backgroundColor: getDifficultyColor(currentQuestion.difficulty) }]}
                  textStyle={styles.pointsChipText}
                >
                  {currentQuestion.points} pts
                </Chip>
                
                {isElementary && (
                  <Chip
                    style={styles.difficultyChip}
                    textStyle={styles.difficultyChipText}
                  >
                    {getDifficultyStars(currentQuestion.difficulty)}
                  </Chip>
                )}
              </View>

              <Text style={[styles.questionText, isElementary && styles.elementaryQuestionText]}>
                {currentQuestion.question}
              </Text>

              {renderQuestionContent()}
            </Card.Content>
          </Card>

          {/* Feedback Section */}
          {quizState.showFeedback && (
            <RNAnimated.View
              style={[
                styles.feedbackContainer,
                {
                  transform: [{ translateY: feedbackSlideAnim }],
                  opacity: feedbackSlideAnim.interpolate({
                    inputRange: [-50, 0],
                    outputRange: [0, 1],
                  }),
                },
              ]}
            >
              <Card style={[
                styles.feedbackCard,
                quizState.isCorrect ? styles.correctFeedback : styles.incorrectFeedback,
                isElementary && styles.elementaryFeedbackCard,
              ]}>
                <Card.Content>
                  <View style={styles.feedbackHeader}>
                    <Avatar.Icon
                      icon={quizState.isCorrect ? 'check-circle' : 'close-circle'}
                      size={isElementary ? 40 : 32}
                      style={{
                        backgroundColor: quizState.isCorrect ? Colors.green500 : Colors.red500,
                      }}
                    />
                    <Text style={[
                      styles.feedbackTitle,
                      isElementary && styles.elementaryFeedbackTitle,
                      { color: quizState.isCorrect ? Colors.green700 : Colors.red700 },
                    ]}>
                      {quizState.isCorrect 
                        ? (isElementary ? '🎉 Correct!' : 'Correct!')
                        : (isElementary ? '💭 Not quite' : 'Incorrect')
                      }
                    </Text>
                  </View>

                  <Text style={[styles.feedbackText, isElementary && styles.elementaryFeedbackText]}>
                    {quizState.feedbackMessage}
                  </Text>

                  {currentQuestion.explanation && (
                    <Text style={[styles.explanationText, isElementary && styles.elementaryExplanationText]}>
                      {isElementary ? '💡 ' : ''}{currentQuestion.explanation}
                    </Text>
                  )}
                </Card.Content>
              </Card>
            </RNAnimated.View>
          )}

          {/* Celebration Animation */}
          <Animated.View style={[styles.celebrationOverlay, celebrationStyle]}>
            <Text style={styles.celebrationText}>
              {isElementary ? '🎉✨🎉' : '🎉'}
            </Text>
          </Animated.View>
        </RNAnimated.View>
      </ScrollView>

      <View style={styles.bottomActions}>
        {!quizState.showFeedback ? (
          <Button
            mode="contained"
            onPress={submitAnswer}
            disabled={!currentAnswer.trim() || isSubmitting}
            loading={isSubmitting}
            style={[styles.submitButton, isElementary && styles.elementarySubmitButton]}
            labelStyle={[styles.submitButtonLabel, isElementary && styles.elementarySubmitButtonLabel]}
            contentStyle={styles.submitButtonContent}
          >
            {isElementary ? '🚀 Submit Answer!' : 'Submit Answer'}
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={nextQuestion}
            style={[styles.nextButton, isElementary && styles.elementaryNextButton]}
            labelStyle={[styles.nextButtonLabel, isElementary && styles.elementaryNextButtonLabel]}
            contentStyle={styles.nextButtonContent}
            icon={quizState.currentQuestionIndex + 1 >= totalQuestions ? 'check' : 'arrow-right'}
          >
            {quizState.currentQuestionIndex + 1 >= totalQuestions
              ? (isElementary ? '🏆 Finish Quiz!' : 'Finish Quiz')
              : (isElementary ? '➡️ Next Question' : 'Next Question')
            }
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
};

// Helper functions
const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'beginner': return Colors.green500;
    case 'intermediate': return Colors.orange500;
    case 'advanced': return Colors.red500;
    default: return Colors.blue500;
  }
};

const getDifficultyStars = (difficulty: string): string => {
  switch (difficulty) {
    case 'beginner': return '⭐';
    case 'intermediate': return '⭐⭐';
    case 'advanced': return '⭐⭐⭐';
    default: return '⭐';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  progressContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    elevation: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 100, // Space for bottom actions
  },
  questionContainer: {
    marginBottom: Spacing.lg,
  },
  questionCard: {
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  elementaryQuestionCard: {
    borderRadius: 16,
    elevation: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  pointsChip: {
    backgroundColor: Colors.primary,
  },
  pointsChipText: {
    color: 'white',
    fontWeight: '600',
  },
  difficultyChip: {
    backgroundColor: Colors.surfaceVariant,
  },
  difficultyChipText: {
    fontSize: 16,
  },
  questionText: {
    ...Typography.titleMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  elementaryQuestionText: {
    ...Typography.titleLarge,
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 20,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionCard: {
    borderRadius: 12,
    padding: Spacing.sm,
  },
  elementaryOption: {
    borderRadius: 16,
    padding: Spacing.md,
    elevation: 2,
  },
  selectedOption: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    ...Typography.bodyLarge,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  elementaryOptionText: {
    ...Typography.titleMedium,
    fontWeight: '500',
  },
  trueFalseContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  trueFalseOption: {
    flex: 1,
    borderRadius: 12,
  },
  elementaryTrueFalse: {
    borderRadius: 16,
    elevation: 2,
  },
  selectedTrueFalse: {
    elevation: 4,
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  trueFalseButton: {
    margin: 0,
  },
  trueFalseLabel: {
    ...Typography.labelLarge,
  },
  elementaryTrueFalseLabel: {
    ...Typography.titleMedium,
    fontWeight: '600',
  },
  fillInContainer: {
    marginTop: Spacing.sm,
  },
  fillInInput: {
    backgroundColor: Colors.surface,
  },
  elementaryInput: {
    borderRadius: 16,
  },
  inputContent: {
    ...Typography.bodyLarge,
  },
  elementaryInputContent: {
    ...Typography.titleMedium,
    fontSize: 18,
  },
  feedbackContainer: {
    marginTop: Spacing.md,
  },
  feedbackCard: {
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  elementaryFeedbackCard: {
    borderRadius: 16,
    elevation: 3,
  },
  correctFeedback: {
    borderLeftColor: Colors.green500,
    backgroundColor: Colors.green50,
  },
  incorrectFeedback: {
    borderLeftColor: Colors.red500,
    backgroundColor: Colors.red50,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  feedbackTitle: {
    ...Typography.titleMedium,
    marginLeft: Spacing.sm,
    fontWeight: '600',
  },
  elementaryFeedbackTitle: {
    ...Typography.titleLarge,
    fontWeight: 'bold',
  },
  feedbackText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  elementaryFeedbackText: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  explanationText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.outline,
  },
  elementaryExplanationText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '400',
  },
  celebrationOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    zIndex: 1000,
  },
  celebrationText: {
    fontSize: 48,
    textAlign: 'center',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    elevation: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.outline,
  },
  submitButton: {
    minHeight: 48,
  },
  elementarySubmitButton: {
    minHeight: 56,
    borderRadius: 28,
    elevation: 4,
  },
  submitButtonContent: {
    paddingVertical: Spacing.sm,
  },
  submitButtonLabel: {
    ...Typography.labelLarge,
  },
  elementarySubmitButtonLabel: {
    ...Typography.titleMedium,
    fontWeight: 'bold',
  },
  nextButton: {
    minHeight: 48,
  },
  elementaryNextButton: {
    minHeight: 56,
    borderRadius: 28,
    elevation: 4,
  },
  nextButtonContent: {
    paddingVertical: Spacing.sm,
  },
  nextButtonLabel: {
    ...Typography.labelLarge,
  },
  elementaryNextButtonLabel: {
    ...Typography.titleMedium,
    fontWeight: 'bold',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  trophyIcon: {
    marginBottom: Spacing.sm,
  },
  completionTitle: {
    ...Typography.headlineMedium,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  elementaryCompletionTitle: {
    ...Typography.headlineLarge,
    fontWeight: 'bold',
    fontSize: 32,
  },
  completionSubtitle: {
    ...Typography.titleMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  elementaryCompletionSubtitle: {
    ...Typography.titleLarge,
    color: Colors.primary,
    fontWeight: '600',
  },
  summaryCard: {
    width: '100%',
    marginBottom: Spacing.xl,
    borderRadius: 12,
  },
  elementarySummaryCard: {
    borderRadius: 16,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  summaryValue: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  completionActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
  },
  elementaryActionButton: {
    minHeight: 56,
    borderRadius: 28,
  },
  elementaryButtonLabel: {
    ...Typography.titleMedium,
    fontWeight: '600',
  },
});

export default QuizTaskScreen;