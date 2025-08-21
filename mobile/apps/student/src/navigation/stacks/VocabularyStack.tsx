/**
 * VocabularyStack Navigator for Harry School Student App
 * 
 * Vocabulary section with flashcards, games, and language learning tools
 * Optimized for language acquisition and retention
 */

import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { VocabularyStackParamList } from '../types';

// Placeholder screens - these will be implemented later
import { PlaceholderScreen } from '../../components/PlaceholderScreen';

const Stack = createStackNavigator<VocabularyStackParamList>();

export const VocabularyStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="WordLists"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen 
        name="WordLists" 
        options={{
          title: 'Vocabulary',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Vocabulary Lists"
            description="Explore your vocabulary collections and start learning new words."
            features={[
              'Curated word lists',
              'Personal collections',
              'Difficulty levels',
              'Subject categories',
              'Learning progress',
              'Spaced repetition'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="Flashcards"
        options={{
          title: 'Flashcards',
          gestureEnabled: false, // Prevent interference with card swipes
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Interactive Flashcards"
            description="Learn vocabulary with engaging, swipeable flashcards."
            features={[
              'Swipe-based learning',
              'Audio pronunciations',
              'Visual associations',
              'Progress tracking',
              'Difficulty adjustment',
              'Review scheduling'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="Translator"
        options={{
          title: 'Smart Translator',
          presentation: 'modal',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Multi-Language Translator"
            description="Translate between English, Russian, and Uzbek with context."
            features={[
              'Real-time translation',
              'Voice input/output',
              'Context suggestions',
              'Save to vocabulary',
              'Offline support',
              'Grammar insights'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="VocabularyGames"
        options={{
          title: 'Word Games',
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Vocabulary Games"
            description="Fun and engaging games to reinforce your vocabulary learning."
            features={[
              'Word matching games',
              'Spelling challenges',
              'Pronunciation practice',
              'Context puzzles',
              'Multiplayer options',
              'Achievement rewards'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="WordDetail"
        options={{
          title: 'Word Details',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Word Explorer"
            description="Deep dive into word meanings, usage, and context."
            features={[
              'Detailed definitions',
              'Usage examples',
              'Pronunciation guide',
              'Etymology information',
              'Related words',
              'Practice sentences'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="PracticeSession"
        options={{
          title: 'Practice Session',
          gestureEnabled: false,
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Focused Practice"
            description="Intensive vocabulary practice sessions with adaptive learning."
            features={[
              'Timed practice modes',
              'Adaptive difficulty',
              'Mistake tracking',
              'Performance analytics',
              'Session summaries',
              'Streak counters'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="VocabularyProgress"
        options={{
          title: 'Learning Progress',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Vocabulary Progress"
            description="Track your vocabulary learning journey and improvements."
            features={[
              'Mastery statistics',
              'Learning curves',
              'Retention rates',
              'Weekly/monthly trends',
              'Goal tracking',
              'Comparative analysis'
            ]}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="PronunciationPractice"
        options={{
          title: 'Pronunciation',
          presentation: 'fullScreenModal',
        }}
      >
        {(props) => (
          <PlaceholderScreen
            {...props}
            title="Pronunciation Trainer"
            description="Perfect your pronunciation with AI-powered feedback."
            features={[
              'Speech recognition',
              'Pronunciation scoring',
              'Visual feedback',
              'Native speaker examples',
              'Phonetic guides',
              'Progress tracking'
            ]}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};