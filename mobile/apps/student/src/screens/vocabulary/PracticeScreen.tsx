/**
 * PracticeScreen.tsx
 * Adaptive difficulty practice screen with multiple vocabulary practice modes
 * Implements FSRS algorithm for optimal learning progression
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Alert,
  Vibration,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { Feather, MaterialCommunityIcons, AntDesign, Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { usePracticeData } from '../../hooks/usePracticeData';
import { useAgeAdaptiveLayout } from '../../hooks/useAgeAdaptiveLayout';
import { useFSRSAlgorithm } from '../../hooks/useFSRSAlgorithm';
import { useAdaptiveDifficulty } from '../../hooks/useAdaptiveDifficulty';

interface PracticeItem {
  id: string;
  word: string;
  definition: string;
  translation: {
    uz: string;
    ru: string;
  };
  pronunciation: string;
  audio?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  memoryStrength: number;
  lastPracticed: Date | null;
  practiceCount: number;
  successRate: number;
  category: string;
  examples: string[];
  distractors?: string[]; // For multiple choice
}

interface PracticeQuestion {
  id: string;
  type: 'multiple_choice' | 'fill_blank' | 'match' | 'typing' | 'audio_recognition';
  item: PracticeItem;
  question: string;
  options?: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
  timeSpent: number;
  hints?: string[];
}

interface PracticeSession {
  totalQuestions: number;
  currentQuestion: number;
  correctAnswers: number;
  incorrectAnswers: number;
  hintsUsed: number;
  totalTime: number;
  adaptiveDifficulty: number; // 0-1 scale
}

interface PracticeScreenRouteParams {
  unitId: string;
  unitTitle: string;
  practiceType: 'mixed' | 'multiple_choice' | 'typing' | 'audio' | 'adaptive';
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const PracticeScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { unitId, unitTitle, practiceType } = route.params as PracticeScreenRouteParams;

  // Student context
  const studentContext = {
    ageGroup: '13-15' as const,
    nativeLanguage: 'uz' as const,
    learningStyle: 'visual' as const,
  };

  const { isElementary, isSecondary, getAdaptiveSpacing } = useAgeAdaptiveLayout(studentContext.ageGroup);

  // State management
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [session, setSession] = useState<PracticeSession>({
    totalQuestions: 0,
    currentQuestion: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    hintsUsed: 0,
    totalTime: 0,
    adaptiveDifficulty: 0.5,
  });
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  // Hooks
  const { 
    practiceItems, 
    generateQuestions, 
    updatePracticeProgress,
    getAdaptiveRecommendations,
    isLoading 
  } = usePracticeData(unitId);

  const { calculateNextReview } = useFSRSAlgorithm();
  
  const { 
    adjustDifficulty, 
    getCurrentDifficulty,
    getOptimalQuestionType,
    shouldShowHint 
  } = useAdaptiveDifficulty();

  // Refs
  const sessionStartTime = useRef<Date>(new Date());
  const audioRef = useRef<Audio.Sound | null>(null);

  // Animations
  const questionAnimation = useSharedValue(1);
  const feedbackAnimation = useSharedValue(0);
  const progressAnimation = useSharedValue(0);
  const celebrationAnimation = useSharedValue(0);
  const hintAnimation = useSharedValue(0);
  const streakAnimation = useSharedValue(0);

  // Current question data
  const currentQuestionData = useMemo(() => {
    return questions[currentQuestion] || null;
  }, [questions, currentQuestion]);

  // Progress calculation
  const progress = useMemo(() => {
    if (questions.length === 0) return 0;
    return (currentQuestion / questions.length) * 100;
  }, [currentQuestion, questions.length]);

  // Animated styles
  const questionStyle = useAnimatedStyle(() => ({
    opacity: questionAnimation.value,
    transform: [
      { translateY: interpolate(questionAnimation.value, [0, 1], [50, 0]) },
      { scale: questionAnimation.value },
    ],
  }));

  const feedbackStyle = useAnimatedStyle(() => ({
    opacity: feedbackAnimation.value,
    transform: [
      { scale: feedbackAnimation.value },
      { translateY: interpolate(feedbackAnimation.value, [0, 1], [20, 0]) },
    ],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnimation.value}%`,
    backgroundColor: interpolateColor(
      progressAnimation.value / 100,
      [0, 0.5, 1],
      ['#ef4444', '#f59e0b', '#10b981']
    ),
  }));

  const celebrationStyle = useAnimatedStyle(() => ({
    opacity: celebrationAnimation.value,
    transform: [{ scale: celebrationAnimation.value }],
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: hintAnimation.value,
    transform: [
      { scale: hintAnimation.value },
      { translateY: interpolate(hintAnimation.value, [0, 1], [-10, 0]) },
    ],
  }));

  const streakStyle = useAnimatedStyle(() => ({
    opacity: streakAnimation.value,
    transform: [{ scale: streakAnimation.value }],
  }));

  // Initialize practice session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const generatedQuestions = await generateQuestions(practiceType, 10);
        setQuestions(generatedQuestions);
        setSession(prev => ({
          ...prev,
          totalQuestions: generatedQuestions.length,
        }));
        
        progressAnimation.value = withTiming(progress, { duration: 300 });
      } catch (error) {
        console.error('Failed to initialize practice session:', error);
        Alert.alert(
          isElementary ? 'Oops!' : 'Error',
          isElementary 
            ? 'Could not start practice. Try again!'
            : 'Failed to load practice questions. Please try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    };

    initializeSession();
  }, [practiceType, generateQuestions, isElementary, navigation]);

  // Update progress animation
  useEffect(() => {
    progressAnimation.value = withTiming(progress, { duration: 300 });
  }, [progress]);

  // Answer validation
  const validateAnswer = useCallback((question: PracticeQuestion, userAnswer: string): boolean => {
    switch (question.type) {
      case 'multiple_choice':
        const selectedOptionText = question.options?.[selectedOption!] || '';
        return selectedOptionText.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
      
      case 'typing':
      case 'fill_blank':
        const normalizedUserAnswer = userAnswer.toLowerCase().trim();
        const normalizedCorrectAnswer = question.correctAnswer.toLowerCase().trim();
        
        // Allow for minor typos in elementary mode
        if (isElementary && normalizedUserAnswer.length > 3) {
          const distance = levenshteinDistance(normalizedUserAnswer, normalizedCorrectAnswer);
          return distance <= Math.floor(normalizedCorrectAnswer.length * 0.2);
        }
        
        return normalizedUserAnswer === normalizedCorrectAnswer;
      
      case 'audio_recognition':
        // More lenient matching for audio recognition
        const audioAnswer = userAnswer.toLowerCase().trim();
        const correctAudioAnswer = question.correctAnswer.toLowerCase().trim();
        return audioAnswer.includes(correctAudioAnswer) || correctAudioAnswer.includes(audioAnswer);
      
      default:
        return false;
    }
  }, [selectedOption, isElementary]);

  // Levenshtein distance for typo tolerance
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  // Submit answer handler
  const handleSubmitAnswer = useCallback(async () => {
    if (!currentQuestionData) return;

    const now = new Date();
    const timeSpent = Math.floor((now.getTime() - questionStartTime.getTime()) / 1000);
    
    let userAnswer = '';
    if (currentQuestionData.type === 'multiple_choice') {
      userAnswer = currentQuestionData.options?.[selectedOption!] || '';
    } else {
      userAnswer = currentAnswer;
    }

    const isCorrect = validateAnswer(currentQuestionData, userAnswer);

    // Update question data
    const updatedQuestion: PracticeQuestion = {
      ...currentQuestionData,
      userAnswer,
      isCorrect,
      timeSpent,
    };

    // Update questions array
    setQuestions(prev => {
      const updated = [...prev];
      updated[currentQuestion] = updatedQuestion;
      return updated;
    });

    // Update session stats
    setSession(prev => ({
      ...prev,
      currentQuestion: currentQuestion + 1,
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      incorrectAnswers: isCorrect ? prev.incorrectAnswers : prev.incorrectAnswers + 1,
      totalTime: prev.totalTime + timeSpent,
    }));

    // Update streak
    if (isCorrect) {
      setStreakCount(prev => prev + 1);
      streakAnimation.value = withSequence(
        withSpring(1.3, { damping: 10 }),
        withTiming(1, { duration: 500 })
      );
    } else {
      setStreakCount(0);
    }

    // Show feedback
    setShowFeedback(true);
    feedbackAnimation.value = withSpring(1, { damping: 15 });

    // Celebration for correct answers
    if (isCorrect) {
      celebrationAnimation.value = withSequence(
        withSpring(1.5, { damping: 10 }),
        withTiming(0, { duration: 1500 })
      );
      
      if (isElementary && Platform.OS === 'android') {
        Vibration.vibrate(100);
      }
    }

    // Update FSRS and adaptive difficulty
    const quality = isCorrect ? (timeSpent < 5 ? 5 : 4) : (showHint ? 2 : 1);
    const fsrsResult = calculateNextReview(currentQuestionData.item, quality);
    
    await updatePracticeProgress(currentQuestionData.item.id, {
      isCorrect,
      timeSpent,
      hintsUsed: showHint ? 1 : 0,
      memoryStrength: fsrsResult.memoryStrength,
      nextReview: fsrsResult.nextReview,
    });

    // Adjust adaptive difficulty
    const newDifficulty = adjustDifficulty(isCorrect, timeSpent, showHint);
    setSession(prev => ({ ...prev, adaptiveDifficulty: newDifficulty }));

    // Auto-proceed after feedback
    setTimeout(() => {
      if (currentQuestion + 1 >= questions.length) {
        setIsSessionComplete(true);
      } else {
        handleNextQuestion();
      }
    }, isElementary ? 2000 : 1500);

  }, [
    currentQuestionData,
    currentQuestion,
    questionStartTime,
    selectedOption,
    currentAnswer,
    showHint,
    validateAnswer,
    calculateNextReview,
    updatePracticeProgress,
    adjustDifficulty,
    isElementary,
    questions.length,
  ]);

  // Next question handler
  const handleNextQuestion = useCallback(() => {
    if (currentQuestion + 1 >= questions.length) {
      setIsSessionComplete(true);
      return;
    }

    // Reset state for next question
    setCurrentAnswer('');
    setSelectedOption(null);
    setShowHint(false);
    setShowFeedback(false);
    setQuestionStartTime(new Date());
    
    // Animate to next question
    questionAnimation.value = withSequence(
      withTiming(0, { duration: 200 }),
      withTiming(1, { duration: 300 })
    );
    
    feedbackAnimation.value = withTiming(0, { duration: 200 });
    hintAnimation.value = withTiming(0, { duration: 200 });
    
    setCurrentQuestion(prev => prev + 1);
  }, [currentQuestion, questions.length]);

  // Hint handler
  const handleShowHint = useCallback(() => {
    if (!currentQuestionData?.hints || showHint) return;
    
    setShowHint(true);
    setSession(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
    
    hintAnimation.value = withSpring(1, { damping: 15 });
  }, [currentQuestionData?.hints, showHint]);

  // Audio playback
  const playAudio = useCallback(async (audioUri?: string) => {
    if (!audioUri) return;

    try {
      if (audioRef.current) {
        await audioRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      audioRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  }, []);

  // Session completion
  const handleSessionComplete = useCallback(() => {
    const totalTime = Math.floor((new Date().getTime() - sessionStartTime.current.getTime()) / 1000);
    const accuracy = (session.correctAnswers / questions.length) * 100;
    
    Alert.alert(
      isElementary ? '🎉 Practice Complete!' : 'Practice Session Complete',
      isElementary 
        ? `Great job! You got ${session.correctAnswers} out of ${questions.length} correct!\n\nAccuracy: ${Math.round(accuracy)}%\nTime: ${Math.floor(totalTime / 60)} minutes`
        : `Session Summary:\n\nCorrect: ${session.correctAnswers}/${questions.length}\nAccuracy: ${Math.round(accuracy)}%\nTime: ${Math.floor(totalTime / 60)}:${String(totalTime % 60).padStart(2, '0')}\nHints used: ${session.hintsUsed}`,
      [
        {
          text: isElementary ? 'Practice More!' : 'Practice Again',
          onPress: () => {
            // Reset and restart
            setCurrentQuestion(0);
            setSession({
              totalQuestions: questions.length,
              currentQuestion: 0,
              correctAnswers: 0,
              incorrectAnswers: 0,
              hintsUsed: 0,
              totalTime: 0,
              adaptiveDifficulty: getCurrentDifficulty(),
            });
            setIsSessionComplete(false);
            sessionStartTime.current = new Date();
            setQuestionStartTime(new Date());
          },
        },
        {
          text: isElementary ? 'All Done!' : 'Finish',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  }, [session, questions.length, isElementary, navigation, getCurrentDifficulty]);

  // Effect for session completion
  useEffect(() => {
    if (isSessionComplete) {
      handleSessionComplete();
    }
  }, [isSessionComplete, handleSessionComplete]);

  // Cleanup audio
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.unloadAsync();
      }
    };
  }, []);

  // Render question content based on type
  const renderQuestionContent = () => {
    if (!currentQuestionData) return null;

    switch (currentQuestionData.type) {
      case 'multiple_choice':
        return (
          <View style={styles.multipleChoiceContainer}>
            <Text style={[styles.question, isElementary && styles.elementaryText]}>
              {currentQuestionData.question}
            </Text>
            
            <View style={styles.optionsContainer}>
              {currentQuestionData.options?.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedOption === index && styles.selectedOption,
                    isElementary && styles.elementaryOption,
                  ]}
                  onPress={() => setSelectedOption(index)}
                >
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionLetter,
                      selectedOption === index && styles.selectedOptionText,
                      isElementary && styles.elementaryText,
                    ]}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                    <Text style={[
                      styles.optionText,
                      selectedOption === index && styles.selectedOptionText,
                      isElementary && styles.elementaryText,
                    ]}>
                      {option}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'typing':
      case 'fill_blank':
        return (
          <View style={styles.typingContainer}>
            <Text style={[styles.question, isElementary && styles.elementaryText]}>
              {currentQuestionData.question}
            </Text>
            
            <TextInput
              style={[styles.typingInput, isElementary && styles.elementaryInput]}
              value={currentAnswer}
              onChangeText={setCurrentAnswer}
              placeholder={isElementary ? "Type your answer..." : "Enter your answer"}
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <Text style={styles.typingHint}>
              {isElementary 
                ? `Answer in ${studentContext.nativeLanguage === 'uz' ? 'Uzbek or English' : 'Russian or English'}`
                : `You can answer in ${studentContext.nativeLanguage === 'uz' ? 'Uzbek or English' : 'Russian or English'}`
              }
            </Text>
          </View>
        );

      case 'audio_recognition':
        return (
          <View style={styles.audioContainer}>
            <Text style={[styles.question, isElementary && styles.elementaryText]}>
              {isElementary ? '🎧 Listen and type what you hear:' : 'Listen to the audio and type what you hear:'}
            </Text>
            
            <TouchableOpacity
              style={[styles.audioButton, isElementary && styles.elementaryAudioButton]}
              onPress={() => playAudio(currentQuestionData.item.audio)}
            >
              <Ionicons name="volume-high" size={isElementary ? 48 : 32} color="#1d7452" />
              <Text style={[styles.audioButtonText, isElementary && styles.elementaryText]}>
                {isElementary ? 'Play Sound' : 'Play Audio'}
              </Text>
            </TouchableOpacity>
            
            <TextInput
              style={[styles.typingInput, isElementary && styles.elementaryInput]}
              value={currentAnswer}
              onChangeText={setCurrentAnswer}
              placeholder={isElementary ? "Type what you heard..." : "Type what you heard"}
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        );

      default:
        return null;
    }
  };

  if (isLoading || questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="brain" size={48} color="#1d7452" />
          <Text style={[styles.loadingText, isElementary && styles.elementaryText]}>
            {isElementary ? 'Preparing your practice...' : 'Generating practice questions...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, isElementary && styles.elementaryText]}>
            {isElementary ? '🧠 Practice' : 'Practice Mode'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {currentQuestion + 1} of {questions.length}
          </Text>
        </View>

        {/* Streak counter */}
        {streakCount > 0 && (
          <Animated.View style={[styles.streakContainer, streakStyle]}>
            <AntDesign name="fire" size={20} color="#f59e0b" />
            <Text style={styles.streakText}>{streakCount}</Text>
          </Animated.View>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View style={[styles.progressBar, progressStyle]} />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progress)}% {isElementary ? 'done!' : 'complete'}
        </Text>
      </View>

      {/* Question content */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.questionContainer, questionStyle]}>
          {renderQuestionContent()}
          
          {/* Hint section */}
          {currentQuestionData?.hints && (
            <View style={styles.hintSection}>
              {!showHint ? (
                <TouchableOpacity
                  style={[styles.hintButton, isElementary && styles.elementaryButton]}
                  onPress={handleShowHint}
                  disabled={showFeedback}
                >
                  <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#f59e0b" />
                  <Text style={[styles.hintButtonText, isElementary && styles.elementaryText]}>
                    {isElementary ? 'Need a hint?' : 'Show Hint'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Animated.View style={[styles.hintContainer, hintStyle]}>
                  <MaterialCommunityIcons name="lightbulb" size={20} color="#f59e0b" />
                  <Text style={[styles.hintText, isElementary && styles.elementaryText]}>
                    {currentQuestionData.hints[0]}
                  </Text>
                </Animated.View>
              )}
            </View>
          )}
        </Animated.View>

        {/* Feedback section */}
        {showFeedback && (
          <Animated.View style={[styles.feedbackContainer, feedbackStyle]}>
            <View style={[
              styles.feedbackContent,
              currentQuestionData?.isCorrect ? styles.correctFeedback : styles.incorrectFeedback,
            ]}>
              <View style={styles.feedbackHeader}>
                <AntDesign 
                  name={currentQuestionData?.isCorrect ? "checkcircle" : "closecircle"} 
                  size={isElementary ? 32 : 24} 
                  color={currentQuestionData?.isCorrect ? "#10b981" : "#ef4444"} 
                />
                <Text style={[
                  styles.feedbackTitle,
                  isElementary && styles.elementaryText,
                  { color: currentQuestionData?.isCorrect ? "#10b981" : "#ef4444" },
                ]}>
                  {currentQuestionData?.isCorrect 
                    ? (isElementary ? 'Awesome!' : 'Correct!') 
                    : (isElementary ? 'Not quite!' : 'Incorrect')
                  }
                </Text>
              </View>
              
              {!currentQuestionData?.isCorrect && (
                <View style={styles.correctAnswerSection}>
                  <Text style={[styles.correctAnswerLabel, isElementary && styles.elementaryText]}>
                    {isElementary ? 'The right answer is:' : 'Correct answer:'}
                  </Text>
                  <Text style={[styles.correctAnswerText, isElementary && styles.elementaryText]}>
                    {currentQuestionData?.correctAnswer}
                  </Text>
                </View>
              )}
              
              {currentQuestionData?.item.definition && (
                <View style={styles.definitionSection}>
                  <Text style={[styles.definitionText, isElementary && styles.elementaryText]}>
                    {currentQuestionData.item.definition}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Action buttons */}
      {!showFeedback && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              ((currentQuestionData?.type === 'multiple_choice' && selectedOption !== null) ||
               (currentQuestionData?.type !== 'multiple_choice' && currentAnswer.trim().length > 0)) &&
               styles.submitButtonEnabled,
              isElementary && styles.elementaryButton,
            ]}
            onPress={handleSubmitAnswer}
            disabled={
              (currentQuestionData?.type === 'multiple_choice' && selectedOption === null) ||
              (currentQuestionData?.type !== 'multiple_choice' && currentAnswer.trim().length === 0)
            }
          >
            <Text style={[styles.submitButtonText, isElementary && styles.elementaryText]}>
              {isElementary ? '✓ Check Answer' : 'Submit Answer'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Session stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>
            {session.correctAnswers}
          </Text>
          <Text style={styles.statLabel}>
            {isElementary ? 'Right' : 'Correct'}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#ef4444' }]}>
            {session.incorrectAnswers}
          </Text>
          <Text style={styles.statLabel}>
            {isElementary ? 'Wrong' : 'Incorrect'}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
            {session.hintsUsed}
          </Text>
          <Text style={styles.statLabel}>Hints</Text>
        </View>
      </View>

      {/* Celebration overlay */}
      <Animated.View style={[styles.celebrationOverlay, celebrationStyle]} pointerEvents="none">
        <Text style={styles.celebrationEmoji}>
          {isElementary ? '🌟✨🎉' : '🎉'}
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#d97706',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  question: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#1f2937',
    lineHeight: 28,
    marginBottom: 24,
    textAlign: 'center',
  },

  // Multiple choice styles
  multipleChoiceContainer: {
    gap: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  selectedOption: {
    borderColor: '#1d7452',
    backgroundColor: '#f0fdf4',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#6b7280',
    width: 24,
    textAlign: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  selectedOptionText: {
    color: '#1d7452',
  },

  // Typing styles
  typingContainer: {
    gap: 16,
  },
  typingInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    minHeight: 56,
  },
  typingHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Audio styles
  audioContainer: {
    gap: 24,
    alignItems: 'center',
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#bbf7d0',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  audioButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1d7452',
  },

  // Hint styles
  hintSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  hintButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#d97706',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#92400e',
    flex: 1,
    lineHeight: 20,
  },

  // Feedback styles
  feedbackContainer: {
    marginBottom: 20,
  },
  feedbackContent: {
    borderRadius: 12,
    padding: 20,
  },
  correctFeedback: {
    backgroundColor: '#ecfdf5',
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  incorrectFeedback: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  correctAnswerSection: {
    marginBottom: 16,
  },
  correctAnswerLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  correctAnswerText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1f2937',
  },
  definitionSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    padding: 12,
  },
  definitionText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    textAlign: 'center',
  },

  // Action styles
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  submitButton: {
    backgroundColor: '#9ca3af',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonEnabled: {
    backgroundColor: '#1d7452',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ffffff',
  },

  // Stats styles
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800' as const,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    fontWeight: '500' as const,
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },

  // Celebration overlay
  celebrationOverlay: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
    zIndex: 1000,
  },
  celebrationEmoji: {
    fontSize: 60,
    textAlign: 'center',
  },

  // Elementary adaptations
  elementaryText: {
    fontSize: 20,
    lineHeight: 28,
  },
  elementaryInput: {
    fontSize: 18,
    padding: 20,
    minHeight: 64,
  },
  elementaryButton: {
    padding: 20,
    borderRadius: 16,
    minHeight: 64,
  },
  elementaryOption: {
    padding: 20,
    borderRadius: 16,
  },
  elementaryAudioButton: {
    padding: 24,
    borderRadius: 20,
  },
};