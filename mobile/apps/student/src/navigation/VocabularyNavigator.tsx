import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { VocabularyStackParamList } from '../types';
import VocabularyHomeScreen from '../screens/vocabulary/VocabularyHomeScreen';
import FlashcardsScreen from '../screens/vocabulary/FlashcardsScreen';
import TranslatorScreen from '../screens/vocabulary/TranslatorScreen';
import WordDetailScreen from '../screens/vocabulary/WordDetailScreen';

const Stack = createStackNavigator<VocabularyStackParamList>();

export default function VocabularyNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="VocabularyHome" 
        component={VocabularyHomeScreen} 
      />
      <Stack.Screen 
        name="Flashcards" 
        component={FlashcardsScreen}
        options={{
          headerShown: true,
          title: 'Flashcards',
        }}
      />
      <Stack.Screen 
        name="Translator" 
        component={TranslatorScreen}
        options={{
          headerShown: true,
          title: 'Translator',
        }}
      />
      <Stack.Screen 
        name="WordDetail" 
        component={WordDetailScreen}
        options={{
          headerShown: true,
          title: 'Word Details',
        }}
      />
    </Stack.Navigator>
  );
}