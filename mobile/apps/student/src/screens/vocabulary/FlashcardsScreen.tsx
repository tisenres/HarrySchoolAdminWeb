/**
 * FlashcardsScreen.tsx
 * Interactive flashcard screen with React Native Reanimated swipe animations
 * Based on UX research findings for optimal vocabulary learning
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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
  useAnimatedGestureHandler,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
  interpolate,
  interpolateColor,
  useDerivedValue,
} from 'react-native-reanimated';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Feather, MaterialCommunityIcons, AntDesign, Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useFlashcardsData } from '../../hooks/useFlashcardsData';
import { useAgeAdaptiveLayout } from '../../hooks/useAgeAdaptiveLayout';
import { useFSRSAlgorithm } from '../../hooks/useFSRSAlgorithm';

interface FlashcardItem {
  id: string;
  word: string;
  pronunciation: string;
  definition: string;
  translation: {
    uz: string;
    ru: string;
  };
  example: {
    en: string;
    uz: string;
    ru: string;
  };
  image?: string;
  audio?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  memoryStrength: number; // FSRS memory strength
  lastReviewed: Date | null;
  nextReview: Date;
  category: string;
  culturalContext?: {
    usage: string;
    importance: 'low' | 'medium' | 'high';
    localExample?: string;
  };
}

interface FlashcardsScreenRouteParams {
  unitId: string;
  unitTitle: string;
  studyMode: 'learn' | 'review' | 'test';
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export const FlashcardsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { unitId, unitTitle, studyMode } = route.params as FlashcardsScreenRouteParams;
  
  // Student context (would come from props/context in real app)
  const studentContext = {
    ageGroup: '13-15' as const,
    nativeLanguage: 'uz' as const,
    difficultyPreference: 'adaptive' as const,
  };
  
  const { isElementary, isSecondary, getAdaptiveSpacing } = useAgeAdaptiveLayout(studentContext.ageGroup);
  
  // State management
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    skipped: 0,
    totalTime: 0,
  });
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Hooks
  const { 
    flashcards, 
    isLoading, 
    updateCardProgress, 
    getNextCard,
    getSessionSummary,
  } = useFlashcardsData(unitId, studyMode);
  
  const { calculateNextReview, updateMemoryStrength } = useFSRSAlgorithm();

  // Refs
  const audioRef = useRef<Audio.Sound | null>(null);
  const sessionStartTime = useRef<Date>(new Date());

  // Animations
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const cardFlip = useSharedValue(0);
  const celebrationAnimation = useSharedValue(0);
  const progressAnimation = useSharedValue(0);

  // Current card
  const currentCard = useMemo(() => {
    return flashcards[currentIndex] || null;
  }, [flashcards, currentIndex]);

  // Progress calculation
  const progress = useMemo(() => {
    if (flashcards.length === 0) return 0;
    return ((currentIndex + 1) / flashcards.length) * 100;
  }, [currentIndex, flashcards.length]);

  // Gesture handler
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
      
      // Calculate rotation based on horizontal movement
      rotation.value = interpolate(
        translateX.value,
        [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        [-15, 0, 15]
      );
      
      // Scale down slightly during drag
      scale.value = interpolate(
        Math.abs(translateX.value),
        [0, SWIPE_THRESHOLD],
        [1, 0.95]
      );
    },
    onEnd: (event) => {
      const { translationX, translationY, velocityX, velocityY } = event;
      
      // Determine swipe direction and action
      if (Math.abs(translationX) > SWIPE_THRESHOLD || Math.abs(velocityX) > 500) {
        // Horizontal swipe
        if (translationX > 0) {
          // Right swipe - Known/Easy
          runOnJS(handleCardSwipe)('known');
          translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 });
          rotation.value = withTiming(30, { duration: 300 });
        } else {
          // Left swipe - Learning/Hard
          runOnJS(handleCardSwipe)('learning');
          translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 });
          rotation.value = withTiming(-30, { duration: 300 });
        }
      } else if (Math.abs(translationY) > SWIPE_THRESHOLD || Math.abs(velocityY) > 500) {
        // Vertical swipe
        if (translationY < 0) {
          // Up swipe - Difficult/Need more practice
          runOnJS(handleCardSwipe)('difficult');
          translateY.value = withTiming(-SCREEN_HEIGHT, { duration: 300 });
        } else {
          // Down swipe - Skip
          runOnJS(handleCardSwipe)('skip');
          translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
        }
      } else {
        // Return to center
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        rotation.value = withSpring(0, { damping: 15 });
        scale.value = withSpring(1, { damping: 15 });
      }
    },
  });

  // Card animation styles
  const cardAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      translateX.value,
      [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
      ['#fee2e2', '#ffffff', '#dcfce7'] // Red tint for left, white for center, green tint for right
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
        { rotateY: `${cardFlip.value * 180}deg` },
      ],
      backgroundColor,
    };
  });

  // Action indicator styles
  const rightIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1]),
    transform: [
      { 
        scale: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0.5, 1.2]) 
      },
    ],
  }));

  const leftIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0]),
    transform: [
      { 
        scale: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1.2, 0.5]) 
      },
    ],
  }));

  const upIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [-SWIPE_THRESHOLD, 0], [1, 0]),
    transform: [
      { 
        scale: interpolate(translateY.value, [-SWIPE_THRESHOLD, 0], [1.2, 0.5]) 
      },
    ],
  }));

  const downIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, SWIPE_THRESHOLD], [0, 1]),
    transform: [
      { 
        scale: interpolate(translateY.value, [0, SWIPE_THRESHOLD], [0.5, 1.2]) 
      },
    ],
  }));

  // Celebration animation style
  const celebrationStyle = useAnimatedStyle(() => ({
    opacity: celebrationAnimation.value,
    transform: [{ scale: celebrationAnimation.value }],
  }));

  // Progress bar style
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnimation.value}%`,
  }));

  // Card flip handler
  const handleCardFlip = useCallback(() => {
    setShowDefinition(!showDefinition);
    cardFlip.value = withSpring(showDefinition ? 0 : 1, { damping: 15 });
  }, [showDefinition, cardFlip]);

  // Audio playback
  const playAudio = useCallback(async (audioUri?: string) => {
    if (!soundEnabled || !audioUri) return;

    try {
      // Unload previous sound
      if (audioRef.current) {
        await audioRef.current.unloadAsync();
      }

      // Load and play new sound
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      audioRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  }, [soundEnabled]);

  // Card swipe handler with FSRS algorithm integration
  const handleCardSwipe = useCallback(async (action: 'known' | 'learning' | 'difficult' | 'skip') => {
    if (!currentCard) return;

    const now = new Date();
    let quality: number;
    let newMemoryStrength: number;
    let nextReviewDate: Date;

    // Convert action to FSRS quality rating (0-5 scale)
    switch (action) {
      case 'skip':
        quality = 0;
        break;
      case 'difficult':
        quality = 1;
        break;
      case 'learning':
        quality = 2;
        break;
      case 'known':
        quality = 4;
        break;
      default:
        quality = 2;
    }

    // Calculate FSRS parameters
    const fsrsResult = calculateNextReview(currentCard, quality);
    newMemoryStrength = fsrsResult.memoryStrength;
    nextReviewDate = fsrsResult.nextReview;

    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      correct: action === 'known' ? prev.correct + 1 : prev.correct,
      incorrect: action === 'difficult' ? prev.incorrect + 1 : prev.incorrect,
      skipped: action === 'skip' ? prev.skipped + 1 : prev.skipped,
      totalTime: Math.floor((now.getTime() - sessionStartTime.current.getTime()) / 1000),
    }));

    // Update card progress
    await updateCardProgress(currentCard.id, {
      quality,
      memoryStrength: newMemoryStrength,
      lastReviewed: now,
      nextReview: nextReviewDate,
    });

    // Trigger celebration for correct answers
    if (action === 'known') {
      celebrationAnimation.value = withSequence(
        withSpring(1.5, { damping: 10 }),
        withTiming(0, { duration: 1000 })
      );
      
      if (isElementary && Platform.OS === 'android') {
        Vibration.vibrate(100);
      }
    }

    // Move to next card or complete session
    setTimeout(() => {
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowDefinition(false);
        resetCardPosition();
        
        // Update progress animation
        const newProgress = ((currentIndex + 2) / flashcards.length) * 100;
        progressAnimation.value = withTiming(newProgress, { duration: 300 });
      } else {
        setIsSessionComplete(true);
      }
    }, 300);
  }, [currentCard, currentIndex, flashcards.length, calculateNextReview, updateCardProgress, isElementary]);

  // Reset card position
  const resetCardPosition = useCallback(() => {
    translateX.value = withTiming(0, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300 });
    rotation.value = withTiming(0, { duration: 300 });
    scale.value = withTiming(1, { duration: 300 });
    cardFlip.value = withTiming(0, { duration: 200 });
  }, [translateX, translateY, rotation, scale, cardFlip]);

  // Session completion
  const handleSessionComplete = useCallback(async () => {
    const summary = await getSessionSummary();
    
    Alert.alert(
      isElementary ? '🎉 Great job!' : 'Session Complete!',
      isElementary 
        ? `You learned ${sessionStats.correct} words!\nYou're doing amazing!`
        : `Words learned: ${sessionStats.correct}\nWords to review: ${sessionStats.incorrect}\nTime spent: ${Math.floor(sessionStats.totalTime / 60)} minutes`,
      [
        {
          text: isElementary ? 'More words!' : 'Continue Learning',
          onPress: () => navigation.goBack(),
        },
        {
          text: isElementary ? 'All done!' : 'View Progress',
          onPress: () => {
            navigation.navigate('VocabularyProgress', { 
              unitId, 
              sessionSummary: summary,
            });
          },
        },
      ]
    );
  }, [sessionStats, getSessionSummary, isElementary, navigation, unitId]);

  // Effects
  useEffect(() => {
    progressAnimation.value = withTiming(progress, { duration: 300 });
  }, [progress, progressAnimation]);

  useEffect(() => {
    if (isSessionComplete) {
      handleSessionComplete();
    }
  }, [isSessionComplete, handleSessionComplete]);

  // Auto-play audio when card changes
  useEffect(() => {
    if (currentCard?.audio) {
      const timer = setTimeout(() => {
        playAudio(currentCard.audio);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentCard?.audio, playAudio]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.unloadAsync();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="cards" size={48} color="#1d7452" />
          <Text style={[styles.loadingText, isElementary && styles.elementaryText]}>
            {isElementary ? 'Getting your flashcards ready...' : 'Loading flashcards...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentCard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="card-search" size={64} color="#9ca3af" />
          <Text style={[styles.emptyText, isElementary && styles.elementaryText]}>
            {isElementary ? 'No words to practice right now!' : 'No flashcards available'}
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
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
            {unitTitle}
          </Text>
          <Text style={styles.headerSubtitle}>
            {currentIndex + 1} of {flashcards.length}
          </Text>
        </View>

        <TouchableOpacity onPress={() => setSoundEnabled(!soundEnabled)}>
          <Ionicons 
            name={soundEnabled ? 'volume-high' : 'volume-mute'} 
            size={24} 
            color="#1f2937" 
          />
        </TouchableOpacity>
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

      {/* Swipe instructions */}
      <View style={styles.instructionsContainer}>
        <View style={styles.instructionItem}>
          <AntDesign name="arrowright" size={16} color="#10b981" />
          <Text style={styles.instructionText}>
            {isElementary ? 'Know it' : 'Known'}
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <AntDesign name="arrowleft" size={16} color="#ef4444" />
          <Text style={styles.instructionText}>
            {isElementary ? 'Learning' : 'Still learning'}
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <AntDesign name="arrowup" size={16} color="#f59e0b" />
          <Text style={styles.instructionText}>
            {isElementary ? 'Hard' : 'Difficult'}
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <AntDesign name="arrowdown" size={16} color="#6b7280" />
          <Text style={styles.instructionText}>
            {isElementary ? 'Skip' : 'Skip'}
          </Text>
        </View>
      </View>

      {/* Flashcard area */}
      <View style={styles.cardContainer}>
        {/* Swipe indicators */}
        <Animated.View style={[styles.swipeIndicator, styles.rightIndicator, rightIndicatorStyle]}>
          <AntDesign name="check" size={48} color="#10b981" />
          <Text style={[styles.indicatorText, styles.knownText]}>
            {isElementary ? 'I know this!' : 'Known'}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.swipeIndicator, styles.leftIndicator, leftIndicatorStyle]}>
          <AntDesign name="book" size={48} color="#ef4444" />
          <Text style={[styles.indicatorText, styles.learningText]}>
            {isElementary ? 'Still learning!' : 'Learning'}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.swipeIndicator, styles.upIndicator, upIndicatorStyle]}>
          <AntDesign name="exclamation" size={48} color="#f59e0b" />
          <Text style={[styles.indicatorText, styles.difficultText]}>
            {isElementary ? 'This is hard!' : 'Difficult'}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.swipeIndicator, styles.downIndicator, downIndicatorStyle]}>
          <AntDesign name="forward" size={48} color="#6b7280" />
          <Text style={[styles.indicatorText, styles.skipText]}>
            {isElementary ? 'Skip for now' : 'Skip'}
          </Text>
        </Animated.View>

        {/* Flashcard */}
        <PanGestureHandler onGestureEvent={panGestureHandler}>
          <Animated.View style={[styles.flashcard, cardAnimatedStyle]}>
            <TouchableOpacity 
              style={styles.cardTouchable}
              onPress={handleCardFlip}
              activeOpacity={0.9}
            >
              {/* Front side - Word */}
              {!showDefinition ? (
                <View style={styles.cardFront}>
                  <View style={styles.wordSection}>
                    <Text style={[styles.word, isElementary && styles.elementaryWord]}>
                      {currentCard.word}
                    </Text>
                    
                    <Text style={[styles.pronunciation, isElementary && styles.elementaryText]}>
                      /{currentCard.pronunciation}/
                    </Text>

                    <TouchableOpacity
                      style={styles.audioButton}
                      onPress={() => playAudio(currentCard.audio)}
                    >
                      <Ionicons name="volume-high" size={24} color="#1d7452" />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.tapHint, isElementary && styles.elementaryText]}>
                    {isElementary ? 'Tap to see meaning!' : 'Tap to flip'}
                  </Text>
                </View>
              ) : (
                /* Back side - Definition */
                <View style={styles.cardBack}>
                  <Text style={[styles.definition, isElementary && styles.elementaryText]}>
                    {currentCard.definition}
                  </Text>

                  <View style={styles.translationsSection}>
                    <View style={styles.translationItem}>
                      <Text style={styles.translationLabel}>Uzbek:</Text>
                      <Text style={[styles.translationText, isElementary && styles.elementaryText]}>
                        {currentCard.translation.uz}
                      </Text>
                    </View>
                    
                    <View style={styles.translationItem}>
                      <Text style={styles.translationLabel}>Русский:</Text>
                      <Text style={[styles.translationText, isElementary && styles.elementaryText]}>
                        {currentCard.translation.ru}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.exampleSection}>
                    <Text style={styles.exampleLabel}>Example:</Text>
                    <Text style={[styles.exampleText, isElementary && styles.elementaryText]}>
                      {currentCard.example.en}
                    </Text>
                    <Text style={[styles.exampleTranslation, isElementary && styles.elementaryText]}>
                      {studentContext.nativeLanguage === 'uz' 
                        ? currentCard.example.uz 
                        : currentCard.example.ru}
                    </Text>
                  </View>

                  {currentCard.culturalContext && (
                    <View style={styles.culturalSection}>
                      <Text style={styles.culturalLabel}>
                        {isElementary ? '🌟 Did you know?' : 'Cultural Note:'}
                      </Text>
                      <Text style={[styles.culturalText, isElementary && styles.elementaryText]}>
                        {currentCard.culturalContext.usage}
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.tapHint, isElementary && styles.elementaryText]}>
                    {isElementary ? 'Swipe when ready!' : 'Swipe to rate your knowledge'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.difficultButton]}
          onPress={() => handleCardSwipe('difficult')}
        >
          <AntDesign name="frown" size={isElementary ? 24 : 20} color="#f59e0b" />
          <Text style={[styles.actionButtonText, isElementary && styles.elementaryText]}>
            {isElementary ? 'Hard' : 'Difficult'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.learningButton]}
          onPress={() => handleCardSwipe('learning')}
        >
          <MaterialCommunityIcons name="book-open" size={isElementary ? 24 : 20} color="#ef4444" />
          <Text style={[styles.actionButtonText, isElementary && styles.elementaryText]}>
            {isElementary ? 'Learning' : 'Still Learning'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.knownButton]}
          onPress={() => handleCardSwipe('known')}
        >
          <AntDesign name="check" size={isElementary ? 24 : 20} color="#10b981" />
          <Text style={[styles.actionButtonText, isElementary && styles.elementaryText]}>
            {isElementary ? 'Know It!' : 'Known'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Session stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>
            {sessionStats.correct}
          </Text>
          <Text style={styles.statLabel}>
            {isElementary ? 'Known' : 'Correct'}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#ef4444' }]}>
            {sessionStats.incorrect}
          </Text>
          <Text style={styles.statLabel}>
            {isElementary ? 'Learning' : 'Review'}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#6b7280' }]}>
            {Math.floor(sessionStats.totalTime / 60)}m
          </Text>
          <Text style={styles.statLabel}>Time</Text>
        </View>
      </View>

      {/* Celebration overlay */}
      <Animated.View style={[styles.celebrationOverlay, celebrationStyle]} pointerEvents="none">
        <Text style={styles.celebrationEmoji}>
          {isElementary ? '🌟✨🎉' : '🎉'}
        </Text>
        <Text style={[styles.celebrationText, isElementary && styles.elementaryText]}>
          {isElementary ? 'Amazing!' : 'Great!'}
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
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1f2937',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#1d7452',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  instructionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  instructionText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
  },
  flashcard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  cardTouchable: {
    flex: 1,
    borderRadius: 20,
  },
  cardFront: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  cardBack: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  wordSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  word: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  pronunciation: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  audioButton: {
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  definition: {
    fontSize: 20,
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 20,
    fontWeight: '600' as const,
  },
  translationsSection: {
    marginBottom: 20,
  },
  translationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  translationLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b7280',
    minWidth: 60,
  },
  translationText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  exampleSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#3b82f6',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  exampleText: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  exampleTranslation: {
    fontSize: 14,
    color: '#6b7280',
  },
  culturalSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fefce8',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    marginBottom: 16,
  },
  culturalLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#f59e0b',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  culturalText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  tapHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  swipeIndicator: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 20,
  },
  rightIndicator: {
    right: 40,
    backgroundColor: '#dcfce7',
    borderWidth: 3,
    borderColor: '#10b981',
  },
  leftIndicator: {
    left: 40,
    backgroundColor: '#fee2e2',
    borderWidth: 3,
    borderColor: '#ef4444',
  },
  upIndicator: {
    top: 60,
    backgroundColor: '#fef3c7',
    borderWidth: 3,
    borderColor: '#f59e0b',
  },
  downIndicator: {
    bottom: 60,
    backgroundColor: '#f3f4f6',
    borderWidth: 3,
    borderColor: '#6b7280',
  },
  indicatorText: {
    fontSize: 14,
    fontWeight: '700' as const,
    marginTop: 8,
    textAlign: 'center',
  },
  knownText: {
    color: '#10b981',
  },
  learningText: {
    color: '#ef4444',
  },
  difficultText: {
    color: '#f59e0b',
  },
  skipText: {
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    borderWidth: 2,
  },
  difficultButton: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  learningButton: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  knownButton: {
    backgroundColor: '#dcfce7',
    borderColor: '#10b981',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  celebrationText: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#1d7452',
    marginTop: 8,
  },
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#1d7452',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },

  // Elementary (10-12) age adaptations
  elementaryText: {
    fontSize: 18,
    lineHeight: 26,
  },
  elementaryWord: {
    fontSize: 42,
  },
};