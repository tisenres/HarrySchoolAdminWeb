/**
 * Vocabulary Stack Navigator for Harry School Student App
 * 
 * Handles the Vocabulary tab navigation (8% usage priority).
 * Focuses on language learning tools, flashcards, and vocabulary building.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

// Shared components and theme
import { theme } from '@harry-school/ui';
import { useAuth } from '@harry-school/shared';

// Screen components (will be implemented in separate files)
import { VocabularyDashboardScreen } from '../screens/vocabulary/VocabularyDashboardScreen';
import { FlashcardSessionScreen } from '../screens/vocabulary/FlashcardSessionScreen';
import { VocabularyTranslatorScreen } from '../screens/vocabulary/VocabularyTranslatorScreen';
import { PersonalDictionaryScreen } from '../screens/vocabulary/PersonalDictionaryScreen';
import { WordDetailsScreen } from '../screens/vocabulary/WordDetailsScreen';
import { VocabularyStatsScreen } from '../screens/vocabulary/VocabularyStatsScreen';
import { LearningCategoriesScreen } from '../screens/vocabulary/LearningCategoriesScreen';
import { CategoryWordsScreen } from '../screens/vocabulary/CategoryWordsScreen';
import { VocabularyGamesScreen } from '../screens/vocabulary/VocabularyGamesScreen';
import { WordOfTheDayScreen } from '../screens/vocabulary/WordOfTheDayScreen';
import { SpellingPracticeScreen } from '../screens/vocabulary/SpellingPracticeScreen';
import { PronunciationPracticeScreen } from '../screens/vocabulary/PronunciationPracticeScreen';
import { VocabularyQuizScreen } from '../screens/vocabulary/VocabularyQuizScreen';

// Types
import type { VocabularyStackParamList, VocabularyStackScreenProps } from './types';

// Analytics and services
import { vocabularyAnalytics } from '../services/vocabulary-analytics';
import { flashcardService } from '../services/flashcard-service';
import { translationService } from '../services/translation-service';

// Icons
import Icon from 'react-native-vector-icons/Ionicons';

const Stack = createNativeStackNavigator<VocabularyStackParamList>();

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
  headerTintColor: theme.colors.orange[600],
  headerLeft: showBackButton ? undefined : () => null,
});

// =====================================================
// CUSTOM HEADER COMPONENTS
// =====================================================

interface VocabularyDashboardHeaderProps {
  navigation: any;
  totalWords?: number;
  streak?: number;
}

const VocabularyDashboardHeader: React.FC<VocabularyDashboardHeaderProps> = ({ 
  navigation, 
  totalWords = 0,
  streak = 0
}) => {
  const handleSearchPress = useCallback(() => {
    // Implement vocabulary search
  }, []);

  const handleTranslatorPress = useCallback(() => {
    navigation.navigate('VocabularyTranslator');
  }, [navigation]);

  const handleStatsPress = useCallback(() => {
    navigation.navigate('VocabularyStats');
  }, [navigation]);

  return (
    <View style={styles.dashboardHeader}>
      <View style={styles.dashboardHeaderTop}>
        <View style={styles.dashboardHeaderLeft}>
          <Text style={styles.dashboardTitle}>Vocabulary</Text>
          <Text style={styles.dashboardSubtitle}>
            {totalWords} words • {streak} day streak
          </Text>
        </View>
        <View style={styles.dashboardHeaderRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSearchPress}
            accessibilityLabel="Search vocabulary"
            accessibilityRole="button"
          >
            <Icon name="search-outline" size={24} color={theme.colors.orange[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleTranslatorPress}
            accessibilityLabel="Open translator"
            accessibilityRole="button"
          >
            <Icon name="language-outline" size={24} color={theme.colors.orange[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleStatsPress}
            accessibilityLabel="View statistics"
            accessibilityRole="button"
          >
            <Icon name="stats-chart-outline" size={24} color={theme.colors.orange[600]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// =====================================================
// FLASHCARD SESSION HEADER
// =====================================================

interface FlashcardHeaderProps {
  navigation: any;
  currentCard: number;
  totalCards: number;
  sessionType: 'review' | 'learn' | 'test';
}

const FlashcardHeader: React.FC<FlashcardHeaderProps> = ({
  navigation,
  currentCard,
  totalCards,
  sessionType
}) => {
  const handleExitSession = useCallback(() => {
    Alert.alert(
      'Exit Session?',
      'Your progress will be saved automatically.',
      [
        { text: 'Continue', style: 'cancel' },
        { 
          text: 'Exit', 
          style: 'destructive',
          onPress: () => {
            flashcardService.saveSessionProgress();
            navigation.goBack();
          }
        },
      ]
    );
  }, [navigation]);

  const getSessionTypeColor = () => {
    switch (sessionType) {
      case 'learn': return theme.colors.blue[600];
      case 'review': return theme.colors.green[600];
      case 'test': return theme.colors.red[600];
      default: return theme.colors.orange[600];
    }
  };

  return (
    <View style={styles.flashcardHeader}>
      <View style={styles.flashcardHeaderLeft}>
        <Text style={[styles.sessionType, { color: getSessionTypeColor() }]}>
          {sessionType.toUpperCase()}
        </Text>
        <Text style={styles.progressText}>
          {currentCard} of {totalCards}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.exitButton}
        onPress={handleExitSession}
        accessibilityLabel="Exit session"
      >
        <Icon name="close-outline" size={24} color={theme.colors.neutral[600]} />
      </TouchableOpacity>
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
    case 'PersonalDictionary':
      return (
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              // Export dictionary
            }}
            accessibilityLabel="Export dictionary"
          >
            <Icon name="download-outline" size={24} color={theme.colors.orange[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              // Import words
            }}
            accessibilityLabel="Import words"
          >
            <Icon name="cloud-upload-outline" size={24} color={theme.colors.orange[600]} />
          </TouchableOpacity>
        </View>
      );
    
    case 'WordDetails':
      return (
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              // Add to favorites
            }}
            accessibilityLabel="Add to favorites"
          >
            <Icon name="heart-outline" size={24} color={theme.colors.orange[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              // Share word
            }}
            accessibilityLabel="Share word"
          >
            <Icon name="share-outline" size={24} color={theme.colors.orange[600]} />
          </TouchableOpacity>
        </View>
      );
    
    case 'VocabularyTranslator':
      return (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            // Clear translation history
            translationService.clearHistory();
          }}
          accessibilityLabel="Clear history"
        >
          <Icon name="trash-outline" size={24} color={theme.colors.orange[600]} />
        </TouchableOpacity>
      );
    
    case 'VocabularyQuiz':
      return (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            Alert.alert(
              'Exit Quiz?',
              'Your progress will be lost.',
              [
                { text: 'Continue', style: 'cancel' },
                { text: 'Exit', onPress: () => navigation.goBack() },
              ]
            );
          }}
          accessibilityLabel="Exit quiz"
        >
          <Icon name="close-outline" size={24} color={theme.colors.red[600]} />
        </TouchableOpacity>
      );
    
    default:
      return null;
  }
};

// =====================================================
// MAIN VOCABULARY STACK NAVIGATOR
// =====================================================

interface VocabularyStackNavigatorProps {}

export const VocabularyStackNavigator: React.FC<VocabularyStackNavigatorProps> = () => {
  const { getStudentProfile, updateActivity } = useAuth();
  const studentProfile = getStudentProfile();

  // Track vocabulary section usage
  useFocusEffect(
    useCallback(() => {
      vocabularyAnalytics.trackVocabularySectionEnter();
      updateActivity();
      
      return () => {
        vocabularyAnalytics.trackVocabularySectionExit();
      };
    }, [updateActivity])
  );

  return (
    <Stack.Navigator
      initialRouteName="VocabularyDashboard"
      screenOptions={{
        gestureEnabled: true,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: theme.colors.neutral[50],
        },
      }}
    >
      {/* =====================================================
          MAIN VOCABULARY DASHBOARD (Entry Point)
          ===================================================== */}
      <Stack.Screen
        name="VocabularyDashboard"
        component={VocabularyDashboardScreen}
        options={({ navigation }) => ({
          headerShown: true,
          header: () => (
            <VocabularyDashboardHeader
              navigation={navigation}
              totalWords={247} // This will come from API
              streak={12} // This will come from API
            />
          ),
        })}
      />

      {/* =====================================================
          FLASHCARD LEARNING SYSTEM
          ===================================================== */}
      <Stack.Screen
        name="FlashcardSession"
        component={FlashcardSessionScreen}
        options={({ navigation, route }) => ({
          headerShown: true,
          gestureEnabled: false, // Prevent accidental exit during learning
          header: () => (
            <FlashcardHeader
              navigation={navigation}
              currentCard={1} // This will come from session state
              totalCards={20} // This will come from session state
              sessionType={route.params?.sessionType || 'review'}
            />
          ),
        })}
      />

      {/* =====================================================
          TRANSLATION AND DISCOVERY
          ===================================================== */}
      <Stack.Screen
        name="VocabularyTranslator"
        component={VocabularyTranslatorScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Translator'),
          headerRight: getHeaderRight('VocabularyTranslator')({ navigation, route }),
        })}
      />

      <Stack.Screen
        name="PersonalDictionary"
        component={PersonalDictionaryScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('My Dictionary'),
          headerRight: getHeaderRight('PersonalDictionary')({ navigation, route }),
        })}
      />

      <Stack.Screen
        name="WordDetails"
        component={WordDetailsScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Word Details'),
          headerRight: getHeaderRight('WordDetails')({ navigation, route }),
        })}
      />

      {/* =====================================================
          PROGRESS AND STATISTICS
          ===================================================== */}
      <Stack.Screen
        name="VocabularyStats"
        component={VocabularyStatsScreen}
        options={getHeaderOptions('Statistics')}
      />

      {/* =====================================================
          LEARNING ORGANIZATION
          ===================================================== */}
      <Stack.Screen
        name="LearningCategories"
        component={LearningCategoriesScreen}
        options={getHeaderOptions('Categories')}
      />

      <Stack.Screen
        name="CategoryWords"
        component={CategoryWordsScreen}
        options={getHeaderOptions('Category Words')}
      />

      {/* =====================================================
          INTERACTIVE FEATURES
          ===================================================== */}
      <Stack.Screen
        name="VocabularyGames"
        component={VocabularyGamesScreen}
        options={getHeaderOptions('Vocabulary Games')}
      />

      <Stack.Screen
        name="WordOfTheDay"
        component={WordOfTheDayScreen}
        options={getHeaderOptions('Word of the Day')}
      />

      {/* =====================================================
          PRACTICE ACTIVITIES
          ===================================================== */}
      <Stack.Screen
        name="SpellingPractice"
        component={SpellingPracticeScreen}
        options={{
          ...getHeaderOptions('Spelling Practice'),
          gestureEnabled: false, // Prevent exit during practice
        }}
      />

      <Stack.Screen
        name="PronunciationPractice"
        component={PronunciationPracticeScreen}
        options={{
          ...getHeaderOptions('Pronunciation Practice'),
          gestureEnabled: false, // Prevent exit during practice
        }}
      />

      <Stack.Screen
        name="VocabularyQuiz"
        component={VocabularyQuizScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Vocabulary Quiz'),
          headerRight: getHeaderRight('VocabularyQuiz')({ navigation, route }),
          gestureEnabled: false, // Prevent exit during quiz
        })}
      />
    </Stack.Navigator>
  );
};

// =====================================================
// PLACEHOLDER SCREEN COMPONENTS
// =====================================================
// These will be moved to separate files in the screens/vocabulary directory

const PlaceholderScreen: React.FC<{ 
  title: string; 
  description?: string;
  iconName?: string;
}> = ({ title, description, iconName = 'library-outline' }) => (
  <View style={styles.placeholderContainer}>
    <Icon 
      name={iconName} 
      size={64} 
      color={theme.colors.orange[400]} 
      style={styles.placeholderIcon}
    />
    <Text style={styles.placeholderTitle}>{title}</Text>
    {description && (
      <Text style={styles.placeholderDescription}>{description}</Text>
    )}
    <Text style={styles.placeholderSubtitle}>Screen implementation coming soon</Text>
  </View>
);

// Temporary placeholder implementations
export const VocabularyDashboardScreen = () => (
  <PlaceholderScreen 
    title="Vocabulary Dashboard" 
    description="Central hub for vocabulary learning and progress"
    iconName="library"
  />
);

export const FlashcardSessionScreen = () => (
  <PlaceholderScreen 
    title="Flashcard Session" 
    description="Interactive flashcard learning with spaced repetition"
    iconName="layers-outline"
  />
);

export const VocabularyTranslatorScreen = () => (
  <PlaceholderScreen 
    title="Vocabulary Translator" 
    description="Translate words and add them to your dictionary"
    iconName="language-outline"
  />
);

export const PersonalDictionaryScreen = () => (
  <PlaceholderScreen 
    title="Personal Dictionary" 
    description="Your collection of learned vocabulary words"
    iconName="book-outline"
  />
);

export const WordDetailsScreen = () => (
  <PlaceholderScreen 
    title="Word Details" 
    description="Detailed word information, usage, and examples"
    iconName="information-circle-outline"
  />
);

export const VocabularyStatsScreen = () => (
  <PlaceholderScreen 
    title="Vocabulary Statistics" 
    description="Track your vocabulary learning progress and insights"
    iconName="stats-chart-outline"
  />
);

export const LearningCategoriesScreen = () => (
  <PlaceholderScreen 
    title="Learning Categories" 
    description="Organize vocabulary by topics and themes"
    iconName="folder-outline"
  />
);

export const CategoryWordsScreen = () => (
  <PlaceholderScreen 
    title="Category Words" 
    description="Words within a specific learning category"
    iconName="list-outline"
  />
);

export const VocabularyGamesScreen = () => (
  <PlaceholderScreen 
    title="Vocabulary Games" 
    description="Fun and engaging vocabulary learning games"
    iconName="game-controller-outline"
  />
);

export const WordOfTheDayScreen = () => (
  <PlaceholderScreen 
    title="Word of the Day" 
    description="Daily featured word with detailed explanations"
    iconName="star-outline"
  />
);

export const SpellingPracticeScreen = () => (
  <PlaceholderScreen 
    title="Spelling Practice" 
    description="Practice spelling with interactive exercises"
    iconName="create-outline"
  />
);

export const PronunciationPracticeScreen = () => (
  <PlaceholderScreen 
    title="Pronunciation Practice" 
    description="Improve pronunciation with audio feedback"
    iconName="mic-outline"
  />
);

export const VocabularyQuizScreen = () => (
  <PlaceholderScreen 
    title="Vocabulary Quiz" 
    description="Test your vocabulary knowledge with quizzes"
    iconName="help-circle-outline"
  />
);

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  dashboardHeader: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dashboardHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dashboardHeaderLeft: {
    flex: 1,
  },
  dashboardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dashboardTitle: {
    fontSize: 24,
    color: theme.colors.neutral[900],
    fontWeight: '700',
  },
  dashboardSubtitle: {
    fontSize: 14,
    color: theme.colors.neutral[600],
    fontWeight: '500',
    marginTop: 2,
  },
  flashcardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  flashcardHeaderLeft: {
    flex: 1,
  },
  sessionType: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  progressText: {
    fontSize: 16,
    color: theme.colors.neutral[900],
    fontWeight: '600',
    marginTop: 2,
  },
  exitButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.orange[50],
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
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: 24,
  },
  placeholderIcon: {
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.orange[600],
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderDescription: {
    fontSize: 16,
    color: theme.colors.neutral[600],
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: theme.colors.neutral[500],
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default VocabularyStackNavigator;