/**
 * SpeakingTaskScreen.tsx
 * Voice recording and pronunciation analysis with cultural sensitivity
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  PermissionsAndroid,
  AppState,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Component imports
import { Header, Button, Card, LoadingSpinner } from '@harry-school/ui';
import { TaskHeader } from '../../../components/tasks/common/TaskHeader';
import { VoiceRecorder } from '../../../components/tasks/speaking/VoiceRecorder';
import { WaveformVisualizer } from '../../../components/tasks/speaking/WaveformVisualizer';
import { PronunciationFeedback } from '../../../components/tasks/speaking/PronunciationFeedback';
import { ErrorScreen } from '../../../components/common/ErrorScreen';

// Hook imports
import { useSpeakingTaskData } from '../../../hooks/tasks/useSpeakingTaskData';
import { useVoiceRecording } from '../../../hooks/audio/useVoiceRecording';
import { useSpeechAnalysis } from '../../../hooks/audio/useSpeechAnalysis';
import { useTaskProgress } from '../../../hooks/tasks/useTaskProgress';
import { useAuth } from '@harry-school/shared/hooks';

// Type imports
import type { LessonsNavigationProp, LessonsRouteProps, StudentAgeGroup } from '../../../navigation/types';

interface SpeakingTaskScreenProps {
  navigation: LessonsNavigationProp;
  route: LessonsRouteProps<'SpeakingTask'>;
}

interface SpeakingExercise {
  id: string;
  type: 'pronunciation' | 'conversation' | 'presentation';
  title: string;
  instructions: string;
  targetPhrase?: string;
  conversationPrompts?: string[];
  presentationTopic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  maxDuration: number; // seconds
  culturalNotes?: string;
}

interface RecordingData {
  uri: string;
  duration: number;
  size: number;
  quality: 'low' | 'medium' | 'high';
}

interface SpeechAnalysis {
  transcription: string;
  confidence: number;
  pronunciationScore: number;
  fluencyScore: number;
  mistakes: {
    word: string;
    expected: string;
    actual: string;
    suggestion: string;
  }[];
  strengths: string[];
  improvements: string[];
  culturalNotes?: string;
}

// Age-specific speaking configurations
const SPEAKING_CONFIGS = {
  '10-12': {
    maxRecordingDuration: 30, // seconds
    encourageMultipleAttempts: true,
    showWaveform: true,
    feedbackStyle: 'playful_encouraging',
    allowSelfReview: true,
    culturalSupport: 'high',
  },
  '13-15': {
    maxRecordingDuration: 60,
    encourageMultipleAttempts: true,
    showWaveform: true,
    feedbackStyle: 'balanced_constructive',
    allowSelfReview: true,
    culturalSupport: 'medium',
  },
  '16-18': {
    maxRecordingDuration: 120,
    encourageMultipleAttempts: false,
    showWaveform: true,
    feedbackStyle: 'detailed_analytical',
    allowSelfReview: true,
    culturalSupport: 'low',
  },
} as const;

export const SpeakingTaskScreen: React.FC<SpeakingTaskScreenProps> = ({
  navigation,
  route,
}) => {
  // Hooks
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const ageGroup = user?.profile?.ageGroup || '13-15';
  
  // State
  const [currentStep, setCurrentStep] = useState<'preparation' | 'recording' | 'analysis' | 'feedback'>('preparation');
  const [recordings, setRecordings] = useState<RecordingData[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<RecordingData | null>(null);
  const [analysis, setAnalysis] = useState<SpeechAnalysis | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Custom hooks
  const {
    exercise,
    loading: exerciseLoading,
    error: exerciseError,
  } = useSpeakingTaskData(route.params.taskId);

  const {
    startRecording,
    stopRecording,
    playRecording,
    isRecording,
    isPlaying,
    recordingDuration,
    audioLevels,
    error: recordingError,
  } = useVoiceRecording({
    maxDuration: route.params.maxDuration || SPEAKING_CONFIGS[ageGroup].maxRecordingDuration,
    quality: 'medium',
  });

  const {
    analyzeRecording,
    analysisLoading,
    analysisError,
  } = useSpeechAnalysis();

  const {
    progress,
    updateProgress,
    completeTask,
  } = useTaskProgress(route.params.taskId);

  // Configuration
  const config = SPEAKING_CONFIGS[ageGroup];

  // Request microphone permission
  const requestMicrophonePermission = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Harry School Microphone Permission',
            message: 'We need access to your microphone to record your speech practice.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        setPermissionGranted(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        // iOS permission handled by react-native-voice
        setPermissionGranted(true);
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setPermissionGranted(false);
    }
  }, []);

  // Initialize permission on mount
  useEffect(() => {
    requestMicrophonePermission();
  }, [requestMicrophonePermission]);

  // Handle app state changes (pause recording if app goes to background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' && isRecording) {
        stopRecording();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isRecording, stopRecording]);

  // Start recording
  const handleStartRecording = useCallback(async () => {
    if (!permissionGranted) {
      Alert.alert(
        'Microphone Permission Required',
        'Please grant microphone permission to record your voice.',
        [{ text: 'OK', onPress: requestMicrophonePermission }]
      );
      return;
    }

    try {
      await startRecording();
      setCurrentStep('recording');
      updateProgress(25);
    } catch (error) {
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  }, [permissionGranted, startRecording, updateProgress, requestMicrophonePermission]);

  // Stop recording
  const handleStopRecording = useCallback(async () => {
    try {
      const recordingData = await stopRecording();
      if (recordingData) {
        setRecordings(prev => [...prev, recordingData]);
        setSelectedRecording(recordingData);
        setCurrentStep('analysis');
        updateProgress(50);
        
        // Start speech analysis
        analyzeRecording(recordingData, {
          targetPhrase: exercise?.targetPhrase,
          exerciseType: exercise?.type,
          ageGroup,
        });
      }
    } catch (error) {
      Alert.alert('Recording Error', 'Failed to save recording. Please try again.');
    }
  }, [stopRecording, updateProgress, analyzeRecording, exercise, ageGroup]);

  // Handle analysis completion
  const handleAnalysisComplete = useCallback((speechAnalysis: SpeechAnalysis) => {
    setAnalysis(speechAnalysis);
    setCurrentStep('feedback');
    updateProgress(100);
  }, [updateProgress]);

  // Handle task completion
  const handleTaskComplete = useCallback(async () => {
    await completeTask({
      recordings,
      selectedRecording,
      analysis,
    });
    
    navigation.navigate('TaskResults', {
      taskId: route.params.taskId,
      score: analysis?.pronunciationScore,
      aiAnalysis: analysis?.improvements.join(', '),
    });
  }, [completeTask, recordings, selectedRecording, analysis, navigation, route.params.taskId]);

  // Handle retry recording
  const handleRetryRecording = useCallback(() => {
    setCurrentStep('preparation');
    updateProgress(0);
  }, [updateProgress]);

  if (exerciseLoading) {
    return <LoadingSpinner />;
  }

  if (exerciseError || !exercise) {
    return <ErrorScreen error={exerciseError} onRetry={() => navigation.goBack()} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TaskHeader
        title={exercise.title}
        progress={progress}
        onBack={() => navigation.goBack()}
        ageGroup={ageGroup}
      />

      <View style={styles.content}>
        {currentStep === 'preparation' && (
          <PreparationStep
            exercise={exercise}
            onStartRecording={handleStartRecording}
            ageGroup={ageGroup}
            config={config}
          />
        )}

        {currentStep === 'recording' && (
          <RecordingStep
            exercise={exercise}
            isRecording={isRecording}
            recordingDuration={recordingDuration}
            audioLevels={audioLevels}
            onStopRecording={handleStopRecording}
            ageGroup={ageGroup}
            config={config}
          />
        )}

        {currentStep === 'analysis' && (
          <AnalysisStep
            selectedRecording={selectedRecording}
            analysisLoading={analysisLoading}
            onAnalysisComplete={handleAnalysisComplete}
            ageGroup={ageGroup}
          />
        )}

        {currentStep === 'feedback' && analysis && (
          <FeedbackStep
            analysis={analysis}
            onComplete={handleTaskComplete}
            onRetry={config.encourageMultipleAttempts ? handleRetryRecording : undefined}
            ageGroup={ageGroup}
            config={config}
          />
        )}
      </View>
    </View>
  );
};

// Sub-components for each step
const PreparationStep: React.FC<{
  exercise: SpeakingExercise;
  onStartRecording: () => void;
  ageGroup: StudentAgeGroup;
  config: typeof SPEAKING_CONFIGS[keyof typeof SPEAKING_CONFIGS];
}> = ({ exercise, onStartRecording, ageGroup, config }) => (
  <Card style={styles.stepCard}>
    <Text style={[styles.instructions, ageGroup === '10-12' && styles.largerText]}>
      {exercise.instructions}
    </Text>
    
    {exercise.targetPhrase && (
      <View style={styles.targetPhraseContainer}>
        <Text style={styles.targetPhraseLabel}>
          {ageGroup === '10-12' ? 'Say this:' : 'Target phrase:'}
        </Text>
        <Text style={[styles.targetPhrase, ageGroup === '10-12' && styles.largerText]}>
          "{exercise.targetPhrase}"
        </Text>
      </View>
    )}

    {exercise.culturalNotes && config.culturalSupport !== 'low' && (
      <View style={styles.culturalNotesContainer}>
        <Text style={styles.culturalNotesLabel}>
          {ageGroup === '10-12' ? 'Helpful tip:' : 'Cultural context:'}
        </Text>
        <Text style={styles.culturalNotes}>{exercise.culturalNotes}</Text>
      </View>
    )}

    <Button
      title={ageGroup === '10-12' ? "Start Recording! 🎙️" : "Begin Recording"}
      onPress={onStartRecording}
      variant="primary"
      size={ageGroup === '10-12' ? 'large' : 'medium'}
      style={styles.startButton}
    />
  </Card>
);

const RecordingStep: React.FC<{
  exercise: SpeakingExercise;
  isRecording: boolean;
  recordingDuration: number;
  audioLevels: number[];
  onStopRecording: () => void;
  ageGroup: StudentAgeGroup;
  config: typeof SPEAKING_CONFIGS[keyof typeof SPEAKING_CONFIGS];
}> = ({ exercise, isRecording, recordingDuration, audioLevels, onStopRecording, ageGroup, config }) => (
  <View style={styles.recordingContainer}>
    <VoiceRecorder
      isRecording={isRecording}
      duration={recordingDuration}
      maxDuration={config.maxRecordingDuration}
      onStop={onStopRecording}
      ageGroup={ageGroup}
    />

    {config.showWaveform && (
      <WaveformVisualizer
        audioLevels={audioLevels}
        isRecording={isRecording}
        ageGroup={ageGroup}
      />
    )}

    {exercise.targetPhrase && (
      <Text style={[styles.recordingPrompt, ageGroup === '10-12' && styles.largerText]}>
        Say: "{exercise.targetPhrase}"
      </Text>
    )}
  </View>
);

const AnalysisStep: React.FC<{
  selectedRecording: RecordingData | null;
  analysisLoading: boolean;
  onAnalysisComplete: (analysis: SpeechAnalysis) => void;
  ageGroup: StudentAgeGroup;
}> = ({ selectedRecording, analysisLoading, onAnalysisComplete, ageGroup }) => (
  <View style={styles.analysisContainer}>
    <Text style={[styles.analysisTitle, ageGroup === '10-12' && styles.largerText]}>
      {ageGroup === '10-12' ? 'Checking your recording... 🤖' : 'Analyzing your speech...'}
    </Text>
    
    <LoadingSpinner />
    
    <Text style={styles.analysisSubtitle}>
      {ageGroup === '10-12' 
        ? "This will just take a moment!" 
        : "AI is evaluating your pronunciation and fluency"
      }
    </Text>
  </View>
);

const FeedbackStep: React.FC<{
  analysis: SpeechAnalysis;
  onComplete: () => void;
  onRetry?: () => void;
  ageGroup: StudentAgeGroup;
  config: typeof SPEAKING_CONFIGS[keyof typeof SPEAKING_CONFIGS];
}> = ({ analysis, onComplete, onRetry, ageGroup, config }) => (
  <PronunciationFeedback
    analysis={analysis}
    onComplete={onComplete}
    onRetry={onRetry}
    ageGroup={ageGroup}
    feedbackStyle={config.feedbackStyle}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepCard: {
    padding: 20,
    marginBottom: 16,
  },
  instructions: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 16,
  },
  largerText: {
    fontSize: 18,
    lineHeight: 28,
  },
  targetPhraseContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  targetPhraseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  targetPhrase: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontStyle: 'italic',
  },
  culturalNotesContainer: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  culturalNotesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4338CA',
    marginBottom: 8,
  },
  culturalNotes: {
    fontSize: 14,
    color: '#4338CA',
    lineHeight: 20,
  },
  startButton: {
    marginTop: 8,
  },
  recordingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingPrompt: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
  },
  analysisContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 32,
  },
  analysisSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
});