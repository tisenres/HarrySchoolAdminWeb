/**
 * TextTaskScreen.tsx
 * Advanced reading comprehension with age-adaptive interface and AI feedback
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Component imports
import { Header, Button, Card, LoadingSpinner } from '@harry-school/ui';
import { TaskHeader } from '../../../components/tasks/common/TaskHeader';
import { ReadingPassage } from '../../../components/tasks/text/ReadingPassage';
import { AnnotationTools } from '../../../components/tasks/text/AnnotationTools';
import { ComprehensionQuestions } from '../../../components/tasks/text/ComprehensionQuestions';
import { TaskFeedback } from '../../../components/tasks/common/TaskFeedback';
import { ErrorScreen } from '../../../components/common/ErrorScreen';

// Hook imports
import { useTextTaskData } from '../../../hooks/tasks/useTextTaskData';
import { useAIFeedback } from '../../../hooks/tasks/useAIFeedback';
import { useTaskProgress } from '../../../hooks/tasks/useTaskProgress';
import { useTaskTimer } from '../../../hooks/tasks/useTaskTimer';
import { useAuth } from '@harry-school/shared/hooks';

// Service imports
import { textEvaluationService } from '../../../services/ai/feedback/textEvaluation.service';

// Type imports
import type { LessonsNavigationProp, LessonsRouteProps, StudentAgeGroup } from '../../../navigation/types';

interface TextTaskScreenProps {
  navigation: LessonsNavigationProp;
  route: LessonsRouteProps<'TextTask'>;
}

interface ReadingPassageData {
  id: string;
  title: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  wordCount: number;
  estimatedReadingTime: number;
  culturalContext?: string;
  vocabulary: {
    word: string;
    definition: string;
    uzbekTranslation?: string;
    russianTranslation?: string;
  }[];
}

interface ComprehensionQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'inference';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  skills: string[];
}

interface Annotation {
  id: string;
  start: number;
  end: number;
  text: string;
  note?: string;
  type: 'highlight' | 'question' | 'vocabulary' | 'important';
}

// Age-specific reading configurations from UX research
const READING_CONFIGS = {
  '10-12': {
    fontSize: 18,
    lineHeight: 28,
    maxPassageLength: 150,
    showVocabularyHelp: true,
    allowAnnotations: true,
    questionFormat: 'visual_emphasis',
    feedbackStyle: 'encouraging_detailed',
    readingSpeed: 100, // words per minute
  },
  '13-15': {
    fontSize: 16,
    lineHeight: 24,
    maxPassageLength: 300,
    showVocabularyHelp: true,
    allowAnnotations: true,
    questionFormat: 'balanced',
    feedbackStyle: 'growth_focused',
    readingSpeed: 150,
  },
  '16-18': {
    fontSize: 14,
    lineHeight: 22,
    maxPassageLength: 600,
    showVocabularyHelp: false,
    allowAnnotations: true,
    questionFormat: 'analytical',
    feedbackStyle: 'detailed_analytical',
    readingSpeed: 200,
  },
} as const;

export const TextTaskScreen: React.FC<TextTaskScreenProps> = ({
  navigation,
  route,
}) => {
  // Hooks
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const ageGroup = user?.profile?.ageGroup || '13-15';
  
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  
  // State
  const [currentStep, setCurrentStep] = useState<'reading' | 'questions' | 'feedback'>('reading');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showFeedback, setShowFeedback] = useState(false);

  // Custom hooks
  const {
    passage,
    questions,
    loading,
    error,
  } = useTextTaskData(route.params.taskId);

  const {
    startTimer,
    pauseTimer,
    getElapsedTime,
    resetTimer,
  } = useTaskTimer();

  const {
    progress,
    updateProgress,
    completeTask,
  } = useTaskProgress(route.params.taskId);

  const {
    generateFeedback,
    feedback,
    feedbackLoading,
  } = useAIFeedback();

  // Configuration
  const config = READING_CONFIGS[ageGroup];

  // Start timer when component mounts
  useEffect(() => {
    startTimer();
    return () => pauseTimer();
  }, [startTimer, pauseTimer]);

  // Handle reading completion
  const handleReadingComplete = useCallback(() => {
    pauseTimer();
    setCurrentStep('questions');
    updateProgress(40); // Reading phase is 40% of task
  }, [pauseTimer, updateProgress]);

  // Handle answer submission
  const handleAnswerChange = useCallback((questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, []);

  // Handle questions completion
  const handleQuestionsComplete = useCallback(async () => {
    pauseTimer();
    const elapsedTime = getElapsedTime();
    
    // Generate AI feedback
    const feedbackData = await generateFeedback({
      taskType: 'text_comprehension',
      passage: passage?.content || '',
      questions,
      answers,
      annotations,
      readingTime: elapsedTime,
      ageGroup,
    });

    setCurrentStep('feedback');
    setShowFeedback(true);
    updateProgress(100);
  }, [
    pauseTimer,
    getElapsedTime,
    generateFeedback,
    passage,
    questions,
    answers,
    annotations,
    ageGroup,
    updateProgress,
  ]);

  // Handle task completion
  const handleTaskComplete = useCallback(async () => {
    await completeTask({
      answers,
      annotations,
      readingTime: getElapsedTime(),
      feedback,
    });
    
    navigation.navigate('TaskResults', {
      taskId: route.params.taskId,
      score: feedback?.overallScore,
      aiAnalysis: feedback?.detailedFeedback,
    });
  }, [completeTask, answers, annotations, getElapsedTime, feedback, navigation, route.params.taskId]);

  // Add annotation
  const handleAddAnnotation = useCallback((annotation: Omit<Annotation, 'id'>) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: Date.now().toString(),
    };
    setAnnotations(prev => [...prev, newAnnotation]);
  }, []);

  // Remove annotation
  const handleRemoveAnnotation = useCallback((annotationId: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== annotationId));
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !passage) {
    return <ErrorScreen error={error} onRetry={() => navigation.goBack()} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TaskHeader
        title={passage.title}
        progress={progress}
        timeElapsed={getElapsedTime()}
        onBack={() => navigation.goBack()}
        ageGroup={ageGroup}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 'reading' && (
          <View style={styles.readingSection}>
            <ReadingPassage
              passage={passage}
              annotations={annotations}
              onAddAnnotation={handleAddAnnotation}
              onRemoveAnnotation={handleRemoveAnnotation}
              config={config}
              ageGroup={ageGroup}
            />
            
            {config.allowAnnotations && (
              <AnnotationTools
                onAnnotationTypeSelect={(type) => {
                  // Handle annotation tool selection
                }}
                ageGroup={ageGroup}
              />
            )}

            <View style={styles.readingActions}>
              <Button
                title={ageGroup === '10-12' ? "I'm done reading! 📚" : "Continue to Questions"}
                onPress={handleReadingComplete}
                variant="primary"
                size={ageGroup === '10-12' ? 'large' : 'medium'}
                accessible={true}
                accessibilityHint="Proceed to comprehension questions"
              />
            </View>
          </View>
        )}

        {currentStep === 'questions' && (
          <ComprehensionQuestions
            questions={questions}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            onComplete={handleQuestionsComplete}
            ageGroup={ageGroup}
            config={config}
          />
        )}

        {currentStep === 'feedback' && showFeedback && (
          <TaskFeedback
            feedback={feedback}
            loading={feedbackLoading}
            onComplete={handleTaskComplete}
            ageGroup={ageGroup}
            taskType="text"
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  readingSection: {
    padding: 16,
  },
  readingActions: {
    marginTop: 24,
    paddingVertical: 16,
  },
});