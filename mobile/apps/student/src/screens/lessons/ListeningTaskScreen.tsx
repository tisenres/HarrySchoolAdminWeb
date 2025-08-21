/**
 * ListeningTaskScreen.tsx
 * Harry School Student App - Home Tasks Module
 * 
 * Interactive listening comprehension with audio playback and transcript integration
 */

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
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
  IconButton,
  TextInput,
  Divider,
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
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';

import { LessonsStackParamList } from '../../navigation/stacks/LessonsStack';
import { useStudentProfile } from '../../hooks/useStudentProfile';
import { useTaskTimer } from '../../hooks/useTaskTimer';
import { TaskHeader } from '../../components/tasks/TaskHeader';
import { Colors, Spacing, Typography } from '@harry-school/ui';
import { aiEvaluationService } from '../../services/ai/aiEvaluation.service';
import { performanceMonitor } from '../../services/performance/performanceMonitor';
import type { ListeningTask, StudentAgeGroup } from '../../types/tasks';

type ListeningTaskScreenRouteProp = RouteProp<LessonsStackParamList, 'ListeningTask'>;
type ListeningTaskScreenNavigationProp = NativeStackNavigationProp<LessonsStackParamList, 'ListeningTask'>;

const { width: screenWidth } = Dimensions.get('window');

interface AudioState {
  sound: Audio.Sound | null;
  status: 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';
  position: number;
  duration: number;
  playbackRate: number;
}

interface ListeningState {
  currentSection: number;
  answers: Record<string, string>;
  showTranscript: boolean;
  noteTaking: string;
  isCompleted: boolean;
  feedback: string;
}

const SAMPLE_LISTENING_TASK: ListeningTask = {
  id: 'listening_001',
  type: 'listening',
  title: 'Uzbekistan Culture and Traditions',
  description: 'Listen to a conversation about Uzbek customs and answer the comprehension questions.',
  audioUrl: 'https://sample-audio-url.mp3', // Mock URL
  transcript: `
Host: Welcome to our cultural program. Today we're talking about Uzbekistan's rich traditions. Can you tell us about Navruz?

Guest: Navruz is our most important celebration. It marks the spring equinox and the beginning of a new year. Families gather to prepare traditional dishes like sumalak and plov. Children often receive gifts and money.

Host: That sounds wonderful. What about hospitality traditions?

Guest: Uzbek hospitality is legendary. When guests visit, we always offer tea and sweets. The eldest person usually serves the tea, and it's considered rude to refuse. We have a saying: "Guest is a gift from God."

Host: How important is family in Uzbek culture?

Guest: Family is everything. Extended families often live together or nearby. Respect for elders is paramount. Young people seek advice from grandparents and parents for important decisions.
  `,
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice',
      question: 'What is Navruz?',
      options: [
        'A summer festival',
        'A spring celebration marking the new year',
        'A harvest celebration',
        'A religious holiday'
      ],
      correctAnswer: '1'
    },
    {
      id: 'q2',
      type: 'fill-in-blank',
      question: 'Traditional dishes prepared for Navruz include _____ and plov.',
      correctAnswer: 'sumalak'
    },
    {
      id: 'q3',
      type: 'short-answer',
      question: 'According to the speaker, why is it important to respect elders in Uzbek culture?',
      correctAnswer: 'Because respect for elders is paramount and young people seek advice from grandparents and parents for important decisions.'
    }
  ],
  difficulty: 'intermediate',
  estimatedDuration: 15,
  pointsReward: 25,
  allowMultipleListens: true,
  showTranscriptAfter: 1, // Show transcript after 1 listen
  culturalContext: 'uzbekistan',
};

export const ListeningTaskScreen: React.FC = () => {
  const route = useRoute<ListeningTaskScreenRouteProp>();
  const navigation = useNavigation<ListeningTaskScreenNavigationProp>();
  const { taskId, lessonId } = route.params;

  const { student } = useStudentProfile();
  const { timeElapsed, isRunning, startTimer, pauseTimer } = useTaskTimer(taskId);

  const [audioState, setAudioState] = useState<AudioState>({
    sound: null,
    status: 'loading',
    position: 0,
    duration: 0,
    playbackRate: 1.0,
  });

  const [listeningState, setListeningState] = useState<ListeningState>({
    currentSection: 0,
    answers: {},
    showTranscript: false,
    noteTaking: '',
    isCompleted: false,
    feedback: '',
  });

  const [listenCount, setListenCount] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation values
  const waveformAnimation = useSharedValue(1);
  const transcriptSlide = useSharedValue(0);
  const playButtonScale = useSharedValue(1);

  const ageGroup = student?.ageGroup || '13-15';
  const isElementary = ageGroup === '10-12';
  const isSecondary = ageGroup === '16-18';

  const task = SAMPLE_LISTENING_TASK;
  const currentQuestion = task.questions[currentQuestionIndex];
  const canShowTranscript = listenCount >= (task.showTranscriptAfter || 1);

  // Initialize audio
  useEffect(() => {
    initializeAudio();
    startTimer();
    performanceMonitor.markStart('listening-task-session');

    return () => {
      cleanup();
      pauseTimer();
      performanceMonitor.markEnd('listening-task-session', {
        taskId,
        listenCount,
        questionsAnswered: Object.keys(listeningState.answers).length,
        timeElapsed,
      });
    };
  }, []);

  const initializeAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
      });

      // Mock audio initialization - in real app, load from task.audioUrl
      setAudioState(prev => ({
        ...prev,
        status: 'ready',
        duration: 180, // 3 minutes mock duration
      }));

    } catch (error) {
      console.error('Failed to initialize audio:', error);
      setAudioState(prev => ({ ...prev, status: 'error' }));
    }
  };

  const cleanup = async () => {
    if (audioState.sound) {
      await audioState.sound.unloadAsync();
    }
  };

  // Audio controls
  const togglePlayback = useCallback(async () => {
    if (audioState.status === 'ready' || audioState.status === 'paused') {
      // Mock play functionality
      setAudioState(prev => ({ ...prev, status: 'playing' }));
      
      // Animate play button
      playButtonScale.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withSpring(1, { damping: 15 })
      );

      // Start waveform animation
      waveformAnimation.value = withTiming(1.5, { duration: 1000 });

      if (listenCount === 0) {
        setListenCount(1);
      }

    } else if (audioState.status === 'playing') {
      // Mock pause functionality
      setAudioState(prev => ({ ...prev, status: 'paused' }));
      waveformAnimation.value = withTiming(1, { duration: 300 });
    }
  }, [audioState.status, listenCount]);

  const seekToPosition = useCallback((position: number) => {
    setAudioState(prev => ({ ...prev, position }));
    // Mock seek functionality
  }, []);

  const changePlaybackRate = useCallback((rate: number) => {
    setAudioState(prev => ({ ...prev, playbackRate: rate }));
    // Mock playback rate change
  }, []);

  const showTranscript = useCallback(() => {
    if (!canShowTranscript) return;

    setListeningState(prev => ({ ...prev, showTranscript: !prev.showTranscript }));
    
    transcriptSlide.value = withSpring(
      listeningState.showTranscript ? 0 : 1,
      { damping: 15, stiffness: 150 }
    );
  }, [canShowTranscript, listeningState.showTranscript]);

  const submitAnswer = useCallback(async (answer: string) => {
    if (!answer.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const evaluation = await aiEvaluationService.evaluateListeningAnswer({
        question: currentQuestion,
        studentAnswer: answer,
        audioTranscript: task.transcript,
        studentAge: student?.age || 14,
        culturalContext: task.culturalContext,
      });

      setListeningState(prev => ({
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestion.id]: answer,
        },
        feedback: evaluation.feedback,
      }));

      // Move to next question or complete
      if (currentQuestionIndex + 1 < task.questions.length) {
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1);
          setListeningState(prev => ({ ...prev, feedback: '' }));
        }, 2000);
      } else {
        setListeningState(prev => ({ ...prev, isCompleted: true }));
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
  }, [currentQuestion, currentQuestionIndex, task, student, isSubmitting, isElementary]);

  // Animation styles
  const waveformStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: waveformAnimation.value }],
  }));

  const transcriptStyle = useAnimatedStyle(() => ({
    opacity: transcriptSlide.value,
    transform: [{ translateY: (1 - transcriptSlide.value) * 20 }],
  }));

  const playButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playButtonScale.value }],
  }));

  const renderQuestionInput = () => {
    const [currentAnswer, setCurrentAnswer] = useState(listeningState.answers[currentQuestion.id] || '');

    switch (currentQuestion.type) {
      case 'multiple-choice':
        return (
          <View style={styles.optionsContainer}>
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
                <Button
                  mode={currentAnswer === index.toString() ? 'contained' : 'outlined'}
                  onPress={() => {
                    setCurrentAnswer(index.toString());
                    submitAnswer(index.toString());
                  }}
                  style={styles.optionButton}
                  labelStyle={[styles.optionLabel, isElementary && styles.elementaryOptionLabel]}
                >
                  {option}
                </Button>
              </Surface>
            ))}
          </View>
        );

      case 'fill-in-blank':
      case 'short-answer':
        return (
          <View style={styles.textInputContainer}>
            <TextInput
              value={currentAnswer}
              onChangeText={setCurrentAnswer}
              placeholder={
                isElementary
                  ? 'Type your answer here...'
                  : currentQuestion.type === 'fill-in-blank'
                    ? 'Fill in the blank'
                    : 'Enter your answer'
              }
              mode="outlined"
              style={[styles.textInput, isElementary && styles.elementaryTextInput]}
              contentStyle={[styles.textInputContent, isElementary && styles.elementaryTextInputContent]}
              multiline={currentQuestion.type === 'short-answer'}
              numberOfLines={currentQuestion.type === 'short-answer' ? 3 : 1}
              autoCapitalize="sentences"
            />
            
            <Button
              mode="contained"
              onPress={() => submitAnswer(currentAnswer)}
              disabled={!currentAnswer.trim() || isSubmitting}
              loading={isSubmitting}
              style={[styles.submitAnswerButton, isElementary && styles.elementarySubmitAnswerButton]}
              labelStyle={isElementary ? styles.elementaryButtonLabel : undefined}
            >
              {isElementary ? '📝 Submit' : 'Submit Answer'}
            </Button>
          </View>
        );

      default:
        return null;
    }
  };

  if (listeningState.isCompleted) {
    const answeredQuestions = Object.keys(listeningState.answers).length;
    
    return (
      <SafeAreaView style={styles.container}>
        <TaskHeader
          title={isElementary ? 'Great Job!' : 'Task Complete'}
          onBack={() => navigation.goBack()}
          ageGroup={ageGroup}
        />

        <View style={styles.completionContainer}>
          <Avatar.Icon
            icon="headphones"
            size={isElementary ? 100 : 80}
            style={[styles.completionIcon, { backgroundColor: Colors.primary }]}
          />
          
          <Text style={[styles.completionTitle, isElementary && styles.elementaryCompletionTitle]}>
            {isElementary ? '🎧 Listening Complete!' : 'Listening Task Complete'}
          </Text>

          <Text style={[styles.completionSubtitle, isElementary && styles.elementaryCompletionSubtitle]}>
            {isElementary
              ? `You answered ${answeredQuestions} questions!`
              : `${answeredQuestions} of ${task.questions.length} questions answered`
            }
          </Text>

          <Card style={[styles.summaryCard, isElementary && styles.elementarySummaryCard]}>
            <Card.Content>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Listen Count:</Text>
                <Text style={styles.summaryValue}>{listenCount} times</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time Taken:</Text>
                <Text style={styles.summaryValue}>
                  {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Points Earned:</Text>
                <Text style={[styles.summaryValue, { color: Colors.primary }]}>
                  {task.pointsReward}
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={[styles.finishButton, isElementary && styles.elementaryFinishButton]}
            labelStyle={isElementary ? styles.elementaryButtonLabel : undefined}
          >
            {isElementary ? '✅ Finished!' : 'Complete Task'}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TaskHeader
        title={task.title}
        subtitle={isElementary ? 'Listening Adventure' : 'Listening Comprehension'}
        onBack={() => navigation.goBack()}
        timer={timeElapsed}
        ageGroup={ageGroup}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Audio Player */}
        <Card style={[styles.playerCard, isElementary && styles.elementaryPlayerCard]}>
          <Card.Content>
            <View style={styles.playerHeader}>
              <Avatar.Icon
                icon="headphones"
                size={isElementary ? 48 : 40}
                style={[styles.audioIcon, { backgroundColor: Colors.primary }]}
              />
              <View style={styles.playerInfo}>
                <Text style={[styles.audioTitle, isElementary && styles.elementaryAudioTitle]}>
                  {task.title}
                </Text>
                <Text style={styles.audioSubtitle}>
                  {isElementary ? `🎧 ${Math.floor(audioState.duration / 60)} minutes` : `Duration: ${Math.floor(audioState.duration / 60)}:${(audioState.duration % 60).toString().padStart(2, '0')}`}
                </Text>
              </View>
            </View>

            {/* Waveform Visualization (Mock) */}
            <View style={styles.waveformContainer}>
              <Animated.View style={[styles.waveform, waveformStyle]}>
                {Array.from({ length: 20 }, (_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.waveformBar,
                      {
                        height: Math.random() * 30 + 10,
                        backgroundColor: audioState.status === 'playing' ? Colors.primary : Colors.outline,
                      },
                    ]}
                  />
                ))}
              </Animated.View>
            </View>

            {/* Audio Controls */}
            <View style={styles.controlsContainer}>
              <View style={styles.progressContainer}>
                <Text style={styles.timeLabel}>
                  {Math.floor(audioState.position / 60)}:{(audioState.position % 60).toString().padStart(2, '0')}
                </Text>
                
                <Slider
                  style={styles.progressSlider}
                  minimumValue={0}
                  maximumValue={audioState.duration}
                  value={audioState.position}
                  onValueChange={seekToPosition}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.outline}
                  thumbStyle={{ backgroundColor: Colors.primary }}
                />
                
                <Text style={styles.timeLabel}>
                  {Math.floor(audioState.duration / 60)}:{(audioState.duration % 60).toString().padStart(2, '0')}
                </Text>
              </View>

              <View style={styles.playbackControls}>
                <IconButton
                  icon="rewind-10"
                  size={isElementary ? 28 : 24}
                  onPress={() => seekToPosition(Math.max(0, audioState.position - 10))}
                  iconColor={Colors.primary}
                />

                <Animated.View style={playButtonStyle}>
                  <IconButton
                    icon={audioState.status === 'playing' ? 'pause-circle' : 'play-circle'}
                    size={isElementary ? 64 : 56}
                    onPress={togglePlayback}
                    iconColor={Colors.primary}
                    style={[styles.playButton, isElementary && styles.elementaryPlayButton]}
                  />
                </Animated.View>

                <IconButton
                  icon="fast-forward-10"
                  size={isElementary ? 28 : 24}
                  onPress={() => seekToPosition(Math.min(audioState.duration, audioState.position + 10))}
                  iconColor={Colors.primary}
                />
              </View>

              {/* Playback Rate Control */}
              <View style={styles.playbackRateContainer}>
                <Text style={styles.playbackRateLabel}>Speed:</Text>
                {[0.75, 1.0, 1.25, 1.5].map(rate => (
                  <Chip
                    key={rate}
                    selected={audioState.playbackRate === rate}
                    onPress={() => changePlaybackRate(rate)}
                    style={[styles.rateChip, audioState.playbackRate === rate && styles.selectedRateChip]}
                    textStyle={[styles.rateChipText, audioState.playbackRate === rate && styles.selectedRateChipText]}
                  >
                    {rate}x
                  </Chip>
                ))}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Listen Count & Transcript Toggle */}
        <View style={styles.utilityRow}>
          <Chip
            icon="ear-hearing"
            style={[styles.listenCountChip, { backgroundColor: Colors.surfaceVariant }]}
            textStyle={styles.listenCountText}
          >
            {isElementary ? `🎧 Listened ${listenCount} times` : `${listenCount} listens`}
          </Chip>

          <Button
            mode={canShowTranscript ? 'contained' : 'outlined'}
            onPress={showTranscript}
            disabled={!canShowTranscript}
            style={[styles.transcriptButton, !canShowTranscript && styles.disabledTranscriptButton]}
            labelStyle={isElementary ? styles.elementaryButtonLabel : undefined}
            icon="text"
          >
            {isElementary ? '📄 Script' : 'Transcript'}
          </Button>
        </View>

        {/* Transcript */}
        {listeningState.showTranscript && (
          <Animated.View style={transcriptStyle}>
            <Card style={[styles.transcriptCard, isElementary && styles.elementaryTranscriptCard]}>
              <Card.Content>
                <Text style={[styles.transcriptTitle, isElementary && styles.elementaryTranscriptTitle]}>
                  {isElementary ? '📜 Audio Script' : 'Audio Transcript'}
                </Text>
                <ScrollView style={styles.transcriptScroll} nestedScrollEnabled>
                  <Text style={[styles.transcriptText, isElementary && styles.elementaryTranscriptText]}>
                    {task.transcript}
                  </Text>
                </ScrollView>
              </Card.Content>
            </Card>
          </Animated.View>
        )}

        {/* Note Taking */}
        <Card style={[styles.notesCard, isElementary && styles.elementaryNotesCard]}>
          <Card.Content>
            <Text style={[styles.notesTitle, isElementary && styles.elementaryNotesTitle]}>
              {isElementary ? '📝 Your Notes' : 'Notes'}
            </Text>
            <TextInput
              value={listeningState.noteTaking}
              onChangeText={(text) => setListeningState(prev => ({ ...prev, noteTaking: text }))}
              placeholder={
                isElementary
                  ? 'Write notes while you listen...'
                  : 'Take notes while listening...'
              }
              mode="outlined"
              multiline
              numberOfLines={4}
              style={[styles.notesInput, isElementary && styles.elementaryNotesInput]}
              contentStyle={[styles.notesInputContent, isElementary && styles.elementaryNotesInputContent]}
            />
          </Card.Content>
        </Card>

        {/* Questions */}
        <Card style={[styles.questionCard, isElementary && styles.elementaryQuestionCard]}>
          <Card.Content>
            <View style={styles.questionHeader}>
              <Text style={[styles.questionTitle, isElementary && styles.elementaryQuestionTitle]}>
                {isElementary ? `🤔 Question ${currentQuestionIndex + 1}` : `Question ${currentQuestionIndex + 1} of ${task.questions.length}`}
              </Text>
              
              <Chip
                icon="star"
                style={[styles.pointsChip, { backgroundColor: Colors.primary }]}
                textStyle={styles.pointsChipText}
              >
                {task.pointsReward / task.questions.length} pts
              </Chip>
            </View>

            <Text style={[styles.questionText, isElementary && styles.elementaryQuestionText]}>
              {currentQuestion.question}
            </Text>

            {renderQuestionInput()}

            {listeningState.feedback && (
              <View style={[styles.feedbackContainer, isElementary && styles.elementaryFeedbackContainer]}>
                <Text style={[styles.feedbackText, isElementary && styles.elementaryFeedbackText]}>
                  {isElementary ? '💭 ' : ''}{listeningState.feedback}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  playerCard: {
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  elementaryPlayerCard: {
    borderRadius: 16,
    elevation: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  audioIcon: {
    marginRight: Spacing.md,
  },
  playerInfo: {
    flex: 1,
  },
  audioTitle: {
    ...Typography.titleMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  elementaryAudioTitle: {
    ...Typography.titleLarge,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  audioSubtitle: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  waveformContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'end',
    gap: 2,
    height: 60,
  },
  waveformBar: {
    width: 3,
    backgroundColor: Colors.outline,
    borderRadius: 2,
  },
  controlsContainer: {
    gap: Spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeLabel: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
    minWidth: 35,
  },
  progressSlider: {
    flex: 1,
    height: 40,
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  playButton: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: 32,
  },
  elementaryPlayButton: {
    backgroundColor: Colors.primary,
    elevation: 4,
  },
  playbackRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  playbackRateLabel: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  rateChip: {
    backgroundColor: Colors.surfaceVariant,
  },
  selectedRateChip: {
    backgroundColor: Colors.primary,
  },
  rateChipText: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  selectedRateChipText: {
    color: 'white',
  },
  utilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  listenCountChip: {
    backgroundColor: Colors.surfaceVariant,
  },
  listenCountText: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
  },
  transcriptButton: {
    minWidth: 100,
  },
  disabledTranscriptButton: {
    opacity: 0.5,
  },
  transcriptCard: {
    borderRadius: 12,
    marginBottom: Spacing.md,
    maxHeight: 200,
  },
  elementaryTranscriptCard: {
    borderRadius: 16,
    elevation: 3,
  },
  transcriptTitle: {
    ...Typography.titleMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  elementaryTranscriptTitle: {
    ...Typography.titleLarge,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  transcriptScroll: {
    maxHeight: 120,
  },
  transcriptText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  elementaryTranscriptText: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  notesCard: {
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  elementaryNotesCard: {
    borderRadius: 16,
    elevation: 2,
  },
  notesTitle: {
    ...Typography.titleMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  elementaryNotesTitle: {
    ...Typography.titleLarge,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  notesInput: {
    backgroundColor: Colors.surface,
  },
  elementaryNotesInput: {
    borderRadius: 12,
  },
  notesInputContent: {
    ...Typography.bodyMedium,
  },
  elementaryNotesInputContent: {
    ...Typography.bodyLarge,
    fontSize: 16,
  },
  questionCard: {
    borderRadius: 12,
  },
  elementaryQuestionCard: {
    borderRadius: 16,
    elevation: 3,
    borderWidth: 2,
    borderColor: Colors.orange500,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  questionTitle: {
    ...Typography.titleMedium,
    color: Colors.textPrimary,
  },
  elementaryQuestionTitle: {
    ...Typography.titleLarge,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  pointsChip: {
    backgroundColor: Colors.primary,
  },
  pointsChipText: {
    color: 'white',
    fontWeight: '600',
  },
  questionText: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  elementaryQuestionText: {
    ...Typography.titleMedium,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionCard: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  elementaryOption: {
    borderRadius: 12,
    elevation: 2,
  },
  selectedOption: {
    elevation: 4,
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  optionButton: {
    borderRadius: 0,
    margin: 0,
  },
  optionLabel: {
    ...Typography.bodyMedium,
    textAlign: 'left',
  },
  elementaryOptionLabel: {
    ...Typography.titleSmall,
    fontWeight: '500',
  },
  textInputContainer: {
    gap: Spacing.md,
  },
  textInput: {
    backgroundColor: Colors.surface,
  },
  elementaryTextInput: {
    borderRadius: 12,
  },
  textInputContent: {
    ...Typography.bodyMedium,
  },
  elementaryTextInputContent: {
    ...Typography.bodyLarge,
    fontSize: 16,
  },
  submitAnswerButton: {
    alignSelf: 'flex-start',
  },
  elementarySubmitAnswerButton: {
    borderRadius: 20,
    elevation: 2,
  },
  feedbackContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 8,
  },
  elementaryFeedbackContainer: {
    borderRadius: 12,
    elevation: 1,
  },
  feedbackText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  elementaryFeedbackText: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  completionIcon: {
    marginBottom: Spacing.lg,
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
    fontSize: 28,
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
  finishButton: {
    minHeight: 48,
    paddingHorizontal: Spacing.xl,
  },
  elementaryFinishButton: {
    minHeight: 56,
    borderRadius: 28,
    elevation: 4,
  },
  elementaryButtonLabel: {
    ...Typography.titleMedium,
    fontWeight: '600',
  },
});

export default ListeningTaskScreen;