/**
 * WritingTaskScreen.tsx
 * Writing task interface with AI assistance and cultural sensitivity
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
  interpolateColor,
} from 'react-native-reanimated';
import { Feather, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { TaskHeader } from '../../components/tasks/TaskHeader';
import { TaskProgress } from '../../components/tasks/TaskProgress';
import { useTaskTimer } from '../../hooks/useTaskTimer';
import { useTasksData } from '../../hooks/useTasksData';
import { culturalAdaptationService } from '../../services/ai/feedback/culturalAdaptation.service';

interface WritingTaskScreenRouteParams {
  taskId: string;
  lessonId: string;
  taskData: {
    id: string;
    type: 'writing';
    title: string;
    description: string;
    prompt: string;
    promptType: 'creative' | 'analytical' | 'descriptive';
    minWordCount: number;
    maxWordCount: number;
    rubric: WritingRubric;
    culturalContext?: {
      nativeLanguage: 'uz' | 'ru';
      ageGroup: '10-12' | '13-15' | '16-18';
    };
    hints?: string[];
    examples?: WritingExample[];
  };
}

interface WritingRubric {
  grammar: { weight: number; description: string };
  vocabulary: { weight: number; description: string };
  organization: { weight: number; description: string };
  content: { weight: number; description: string };
  culturalSensitivity: { weight: number; description: string };
}

interface WritingExample {
  title: string;
  excerpt: string;
  level: 'basic' | 'intermediate' | 'advanced';
}

interface WritingFeedback {
  overallScore: number;
  rubricScores: {
    grammar: number;
    vocabulary: number;
    organization: number;
    content: number;
    culturalSensitivity: number;
  };
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  culturalNotes?: string;
  teacherReviewRequired: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const WritingTaskScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { taskId, lessonId, taskData } = route.params as WritingTaskScreenRouteParams;
  
  // Age group detection
  const ageGroup = taskData.culturalContext?.ageGroup || '13-15';
  const isElementary = ageGroup === '10-12';
  const isSecondary = ageGroup === '16-18';
  const nativeLanguage = taskData.culturalContext?.nativeLanguage || 'uz';

  // State management
  const [writingText, setWritingText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const [isEditing, setIsEditing] = useState(true);

  // Hooks
  const { timeSpent, isActive, startTimer, pauseTimer, resetTimer } = useTaskTimer();
  const { markTaskComplete, isLoading } = useTasksData();

  // Refs
  const textInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animations
  const progressAnimation = useSharedValue(0);
  const feedbackAnimation = useSharedValue(0);
  const helpAnimation = useSharedValue(0);
  const celebrationScale = useSharedValue(1);
  const submitButtonScale = useSharedValue(1);

  // Word count tracking
  useEffect(() => {
    const words = writingText.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    
    // Update progress animation
    const progress = Math.min(words.length / taskData.minWordCount, 1);
    progressAnimation.value = withTiming(progress, { duration: 300 });
  }, [writingText, taskData.minWordCount]);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (writingText.length > 10) {
        // Auto-save writing progress locally
        // This would integrate with offline storage
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [writingText]);

  const progressStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progressAnimation.value,
      [0, 0.5, 1],
      ['#f3f4f6', '#fbbf24', '#10b981']
    );

    return {
      backgroundColor,
      width: `${progressAnimation.value * 100}%`,
    };
  });

  const feedbackStyle = useAnimatedStyle(() => ({
    opacity: feedbackAnimation.value,
    transform: [
      { translateY: (1 - feedbackAnimation.value) * 20 },
      { scale: feedbackAnimation.value },
    ],
  }));

  const helpStyle = useAnimatedStyle(() => ({
    opacity: helpAnimation.value,
    transform: [{ scale: helpAnimation.value }],
  }));

  const celebrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  const submitButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitButtonScale.value }],
  }));

  const canSubmit = useMemo(() => {
    return wordCount >= taskData.minWordCount && 
           wordCount <= taskData.maxWordCount && 
           writingText.trim().length > 0;
  }, [wordCount, writingText, taskData.minWordCount, taskData.maxWordCount]);

  const getProgressColor = useCallback(() => {
    if (wordCount >= taskData.minWordCount) return '#10b981'; // Green
    if (wordCount >= taskData.minWordCount * 0.5) return '#fbbf24'; // Yellow
    return '#f3f4f6'; // Gray
  }, [wordCount, taskData.minWordCount]);

  const getProgressMessage = useCallback(() => {
    if (wordCount === 0) {
      return isElementary 
        ? 'Start writing your amazing story!' 
        : 'Begin your composition';
    }
    
    if (wordCount < taskData.minWordCount * 0.25) {
      return isElementary 
        ? 'Great start! Keep going!' 
        : 'Good beginning, continue developing your ideas';
    }
    
    if (wordCount < taskData.minWordCount * 0.5) {
      return isElementary 
        ? 'You\'re doing awesome! More words to go!' 
        : 'Solid progress, expand on your thoughts';
    }
    
    if (wordCount < taskData.minWordCount) {
      const remaining = taskData.minWordCount - wordCount;
      return isElementary 
        ? `Almost there! Just ${remaining} more words!` 
        : `${remaining} words remaining to meet requirement`;
    }
    
    if (wordCount <= taskData.maxWordCount) {
      return isElementary 
        ? 'Perfect length! You can submit now!' 
        : 'Excellent length, ready for submission';
    }
    
    const excess = wordCount - taskData.maxWordCount;
    return isElementary 
      ? `Too many words! Please remove ${excess} words.` 
      : `Exceeds limit by ${excess} words, please trim`;
  }, [wordCount, taskData.minWordCount, taskData.maxWordCount, isElementary]);

  const toggleHelp = useCallback(() => {
    setShowHelp(!showHelp);
    helpAnimation.value = withSpring(showHelp ? 0 : 1, { damping: 15 });
  }, [showHelp]);

  const nextHint = useCallback(() => {
    if (taskData.hints && currentHint < taskData.hints.length - 1) {
      setCurrentHint(prev => prev + 1);
    } else {
      setCurrentHint(0);
    }
  }, [currentHint, taskData.hints]);

  const generatePrompt = useCallback(async () => {
    try {
      const culturalPrompt = await culturalAdaptationService.generateWritingPrompt(
        ageGroup,
        taskData.promptType,
        nativeLanguage
      );
      
      Alert.alert(
        isElementary ? 'New Writing Idea!' : 'Alternative Prompt',
        culturalPrompt,
        [{ text: 'Got it!', style: 'default' }]
      );
    } catch (error) {
      console.log('Error generating prompt:', error);
    }
  }, [ageGroup, taskData.promptType, nativeLanguage, isElementary]);

  const simulateAIFeedback = useCallback(async (text: string): Promise<WritingFeedback> => {
    // Mock AI evaluation - would integrate with OpenAI GPT-4
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockFeedback: WritingFeedback = {
      overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
      rubricScores: {
        grammar: Math.floor(Math.random() * 20) + 80,
        vocabulary: Math.floor(Math.random() * 25) + 75,
        organization: Math.floor(Math.random() * 30) + 70,
        content: Math.floor(Math.random() * 25) + 75,
        culturalSensitivity: Math.floor(Math.random() * 10) + 90,
      },
      strengths: [
        isElementary ? 'Great imagination!' : 'Strong creative voice',
        isElementary ? 'Good word choices!' : 'Effective vocabulary usage',
        'Clear expression of ideas',
      ],
      improvements: [
        isElementary ? 'Check your sentences' : 'Review sentence structure',
        isElementary ? 'Add more details' : 'Expand supporting details',
      ],
      suggestions: [
        isElementary ? 'Read your story out loud' : 'Read aloud for flow',
        isElementary ? 'Ask family what they think' : 'Seek peer feedback',
      ],
      teacherReviewRequired: false,
    };

    // Apply cultural adaptation
    if (mockFeedback.culturalNotes) {
      const adaptedNotes = await culturalAdaptationService.adaptTextFeedback(
        mockFeedback.culturalNotes,
        ageGroup,
        nativeLanguage,
        mockFeedback.overallScore
      );
      mockFeedback.culturalNotes = adaptedNotes;
    }

    return mockFeedback;
  }, [ageGroup, nativeLanguage, isElementary]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    submitButtonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15 })
    );

    try {
      pauseTimer();
      
      // Get AI feedback
      const aiFeedback = await simulateAIFeedback(writingText);
      setFeedback(aiFeedback);
      setIsEditing(false);
      
      // Show feedback with animation
      feedbackAnimation.value = withSpring(1, { damping: 15 });
      
      // Trigger celebration for good scores
      if (aiFeedback.overallScore >= 80) {
        celebrationScale.value = withSequence(
          withSpring(1.2, { damping: 15 }),
          withTiming(1, { duration: 1000 })
        );
      }
      
      // Mark task as complete
      await markTaskComplete(taskId, {
        writingText,
        wordCount,
        timeSpent,
        feedback: aiFeedback,
        submittedAt: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Error submitting writing:', error);
      Alert.alert(
        isElementary ? 'Oops!' : 'Submission Error',
        isElementary 
          ? 'Something went wrong. Try again!' 
          : 'Unable to submit. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, isSubmitting, writingText, timeSpent, taskId, isElementary, pauseTimer, markTaskComplete]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setFeedback(null);
    feedbackAnimation.value = withTiming(0, { duration: 200 });
    startTimer();
    textInputRef.current?.focus();
  }, [startTimer]);

  const handleRetry = useCallback(() => {
    Alert.alert(
      isElementary ? 'Start Over?' : 'Reset Writing',
      isElementary 
        ? 'Do you want to start your story again?' 
        : 'This will clear your current writing. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: isElementary ? 'Start Over' : 'Reset', 
          style: 'destructive',
          onPress: () => {
            setWritingText('');
            setWordCount(0);
            setFeedback(null);
            setIsEditing(true);
            feedbackAnimation.value = withTiming(0);
            progressAnimation.value = withTiming(0);
            resetTimer();
            textInputRef.current?.focus();
          }
        },
      ]
    );
  }, [isElementary, resetTimer]);

  // Auto-start timer when component mounts
  useEffect(() => {
    startTimer();
    return () => pauseTimer();
  }, []);

  const renderWordCountIndicator = () => (
    <View style={styles.wordCountContainer}>
      <View style={styles.progressBarBackground}>
        <Animated.View style={[styles.progressBar, progressStyle]} />
      </View>
      <Text style={[
        styles.wordCountText,
        { color: getProgressColor() },
        isElementary && styles.elementaryText
      ]}>
        {wordCount} / {taskData.minWordCount}
        {taskData.maxWordCount && ` (max: ${taskData.maxWordCount})`}
      </Text>
      <Text style={[
        styles.progressMessage,
        isElementary && styles.elementaryText
      ]}>
        {getProgressMessage()}
      </Text>
    </View>
  );

  const renderHelpPanel = () => (
    <Animated.View style={[styles.helpPanel, helpStyle]}>
      <View style={styles.helpHeader}>
        <Text style={[styles.helpTitle, isElementary && styles.elementaryText]}>
          {isElementary ? '✨ Writing Helper' : 'Writing Assistance'}
        </Text>
        <TouchableOpacity onPress={toggleHelp} style={styles.helpClose}>
          <AntDesign name="close" size={isElementary ? 20 : 18} color="#6b7280" />
        </TouchableOpacity>
      </View>
      
      {taskData.hints && (
        <View style={styles.hintSection}>
          <Text style={[styles.hintLabel, isElementary && styles.elementaryText]}>
            {isElementary ? '💡 Tip:' : 'Hint:'}
          </Text>
          <Text style={[styles.hintText, isElementary && styles.elementaryText]}>
            {taskData.hints[currentHint]}
          </Text>
          {taskData.hints.length > 1 && (
            <TouchableOpacity onPress={nextHint} style={styles.nextHintButton}>
              <Text style={styles.nextHintText}>
                {isElementary ? 'Next tip!' : 'Next hint'}
              </Text>
              <AntDesign name="arrowright" size={16} color="#1d7452" />
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <TouchableOpacity onPress={generatePrompt} style={styles.promptButton}>
        <MaterialCommunityIcons 
          name="lightbulb-outline" 
          size={isElementary ? 20 : 18} 
          color="#1d7452" 
        />
        <Text style={[styles.promptButtonText, isElementary && styles.elementaryText]}>
          {isElementary ? 'Give me ideas!' : 'Generate new prompt'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderFeedback = () => {
    if (!feedback) return null;

    return (
      <Animated.View style={[styles.feedbackContainer, feedbackStyle]}>
        <Animated.View style={[styles.celebrationContainer, celebrationStyle]}>
          <Text style={[styles.feedbackTitle, isElementary && styles.elementaryText]}>
            {isElementary ? '🎉 Your Writing Results!' : 'Writing Evaluation'}
          </Text>
          
          <View style={styles.scoreContainer}>
            <Text style={[styles.overallScore, isElementary && styles.elementaryText]}>
              {feedback.overallScore}%
            </Text>
            <Text style={[styles.scoreLabel, isElementary && styles.elementaryText]}>
              {feedback.overallScore >= 90 ? (isElementary ? 'Amazing!' : 'Excellent') :
               feedback.overallScore >= 80 ? (isElementary ? 'Great job!' : 'Well done') :
               feedback.overallScore >= 70 ? (isElementary ? 'Good work!' : 'Good effort') :
               isElementary ? 'Keep trying!' : 'Needs improvement'}
            </Text>
          </View>

          <View style={styles.rubricScores}>
            {Object.entries(feedback.rubricScores).map(([category, score]) => (
              <View key={category} style={styles.rubricItem}>
                <Text style={[styles.rubricCategory, isElementary && styles.elementaryText]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                <Text style={[styles.rubricScore, isElementary && styles.elementaryText]}>
                  {score}%
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.feedbackSection}>
            <Text style={[styles.feedbackSectionTitle, isElementary && styles.elementaryText]}>
              {isElementary ? '⭐ What you did great:' : '✓ Strengths:'}
            </Text>
            {feedback.strengths.map((strength, index) => (
              <Text key={index} style={[styles.feedbackItem, styles.strengthItem, isElementary && styles.elementaryText]}>
                • {strength}
              </Text>
            ))}
          </View>

          <View style={styles.feedbackSection}>
            <Text style={[styles.feedbackSectionTitle, isElementary && styles.elementaryText]}>
              {isElementary ? '📚 Ways to get even better:' : '↗ Areas for improvement:'}
            </Text>
            {feedback.improvements.map((improvement, index) => (
              <Text key={index} style={[styles.feedbackItem, styles.improvementItem, isElementary && styles.elementaryText]}>
                • {improvement}
              </Text>
            ))}
          </View>

          {feedback.culturalNotes && (
            <View style={styles.culturalNotesSection}>
              <Text style={[styles.culturalNotesTitle, isElementary && styles.elementaryText]}>
                {isElementary ? '🌟 Special note:' : 'Cultural context:'}
              </Text>
              <Text style={[styles.culturalNotesText, isElementary && styles.elementaryText]}>
                {feedback.culturalNotes}
              </Text>
            </View>
          )}

          <View style={styles.feedbackActions}>
            <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
              <Feather name="edit-3" size={16} color="#1d7452" />
              <Text style={[styles.editButtonText, isElementary && styles.elementaryText]}>
                {isElementary ? 'Edit my story' : 'Edit writing'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
              <MaterialCommunityIcons name="restart" size={16} color="#dc2626" />
              <Text style={[styles.retryButtonText, isElementary && styles.elementaryText]}>
                {isElementary ? 'Start over' : 'Start new'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TaskHeader
        title={taskData.title}
        onBack={() => navigation.goBack()}
        rightContent={
          <TouchableOpacity onPress={toggleHelp} style={styles.helpButton}>
            <Feather name="help-circle" size={24} color="#1d7452" />
          </TouchableOpacity>
        }
      />

      <TaskProgress 
        progress={(wordCount / taskData.minWordCount) * 100}
        timeSpent={timeSpent}
        isActive={isActive}
      />

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.promptSection}>
            <Text style={[styles.promptLabel, isElementary && styles.elementaryText]}>
              {isElementary ? '📝 Your writing prompt:' : 'Writing prompt:'}
            </Text>
            <Text style={[styles.promptText, isElementary && styles.elementaryText]}>
              {taskData.prompt}
            </Text>
          </View>

          {renderWordCountIndicator()}

          <View style={styles.writingSection}>
            <TextInput
              ref={textInputRef}
              style={[
                styles.textInput,
                isElementary && styles.elementaryTextInput,
                !isEditing && styles.disabledInput
              ]}
              value={writingText}
              onChangeText={setWritingText}
              placeholder={isElementary 
                ? "Start writing your amazing story here..."
                : "Begin your composition here..."
              }
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              editable={isEditing}
              scrollEnabled={false}
              onFocus={() => {
                if (!isActive) startTimer();
              }}
            />
          </View>

          {renderFeedback()}
        </ScrollView>

        {showHelp && renderHelpPanel()}

        {isEditing && (
          <View style={styles.bottomActions}>
            <Animated.View style={submitButtonStyle}>
              <TouchableOpacity
                onPress={handleSubmit}
                style={[
                  styles.submitButton,
                  canSubmit && styles.submitButtonEnabled,
                  isElementary && styles.elementarySubmitButton
                ]}
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? (
                  <Text style={[styles.submitButtonText, isElementary && styles.elementaryText]}>
                    {isElementary ? '✨ Checking...' : 'Submitting...'}
                  </Text>
                ) : (
                  <Text style={[styles.submitButtonText, isElementary && styles.elementaryText]}>
                    {isElementary ? '🚀 Submit my story!' : 'Submit for evaluation'}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  helpButton: {
    padding: 8,
  },
  promptSection: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  promptLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  promptText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  wordCountContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  wordCountText: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  progressMessage: {
    fontSize: 12,
    color: '#6b7280',
  },
  writingSection: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
    minHeight: 300,
  },
  textInput: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
    minHeight: 250,
    textAlignVertical: 'top',
  },
  disabledInput: {
    color: '#6b7280',
    backgroundColor: '#f9fafb',
  },
  helpPanel: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  helpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1f2937',
  },
  helpClose: {
    padding: 4,
  },
  hintSection: {
    marginBottom: 16,
  },
  hintLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1d7452',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  nextHintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  nextHintText: {
    fontSize: 12,
    color: '#1d7452',
    marginRight: 4,
  },
  promptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  promptButtonText: {
    fontSize: 14,
    color: '#1d7452',
    fontWeight: '500' as const,
    marginLeft: 8,
  },
  feedbackContainer: {
    padding: 16,
  },
  celebrationContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  overallScore: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#1d7452',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  rubricScores: {
    marginBottom: 16,
  },
  rubricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rubricCategory: {
    fontSize: 14,
    color: '#374151',
    textTransform: 'capitalize',
  },
  rubricScore: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1d7452',
  },
  feedbackSection: {
    marginBottom: 16,
  },
  feedbackSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1f2937',
    marginBottom: 8,
  },
  feedbackItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  strengthItem: {
    color: '#059669',
  },
  improvementItem: {
    color: '#d97706',
  },
  culturalNotesSection: {
    backgroundColor: '#fefce8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  culturalNotesTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#a16207',
    marginBottom: 4,
  },
  culturalNotesText: {
    fontSize: 13,
    color: '#a16207',
    lineHeight: 18,
  },
  feedbackActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    flex: 0.45,
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 14,
    color: '#1d7452',
    fontWeight: '500' as const,
    marginLeft: 4,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    flex: 0.45,
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500' as const,
    marginLeft: 4,
  },
  bottomActions: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#9ca3af',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonEnabled: {
    backgroundColor: '#1d7452',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  
  // Elementary (10-12) age adaptations
  elementaryText: {
    fontSize: 16,
  },
  elementaryTextInput: {
    fontSize: 18,
    lineHeight: 26,
  },
  elementarySubmitButton: {
    borderRadius: 12,
    padding: 18,
  },
};