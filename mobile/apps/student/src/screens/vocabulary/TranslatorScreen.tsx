/**
 * TranslatorScreen.tsx
 * Multi-language translator with English-Uzbek-Russian support and cultural context
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Feather, MaterialCommunityIcons, Ionicons, AntDesign } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { useTranslationData } from '../../hooks/useTranslationData';
import { useAgeAdaptiveLayout } from '../../hooks/useAgeAdaptiveLayout';
import { useRecentTranslations } from '../../hooks/useRecentTranslations';

interface Language {
  code: 'en' | 'uz' | 'ru';
  name: string;
  flag: string;
  nativeName: string;
}

interface Translation {
  id: string;
  source: string;
  target: string;
  sourceLanguage: string;
  targetLanguage: string;
  culturalContext?: string;
  usage?: string;
  examples?: string[];
  timestamp: Date;
  isFavorite: boolean;
}

interface TranslatorScreenRouteParams {
  sourceLanguage?: 'en' | 'uz' | 'ru';
  targetLanguage?: 'en' | 'uz' | 'ru';
  initialText?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'uz', name: 'Uzbek', flag: '🇺🇿', nativeName: 'O\'zbekcha' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
];

export const TranslatorScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { sourceLanguage = 'en', targetLanguage = 'uz', initialText = '' } = 
    route.params as TranslatorScreenRouteParams;

  // Student context (would come from props/context in real app)
  const studentContext = {
    ageGroup: '13-15' as const,
    nativeLanguage: 'uz' as const,
    preferredSecondLanguage: 'ru' as const,
  };

  const { isElementary, isSecondary, getAdaptiveSpacing } = useAgeAdaptiveLayout(studentContext.ageGroup);

  // State management
  const [sourceText, setSourceText] = useState(initialText);
  const [sourceLang, setSourceLang] = useState<'en' | 'uz' | 'ru'>(sourceLanguage);
  const [targetLang, setTargetLang] = useState<'en' | 'uz' | 'ru'>(targetLanguage);
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState<'source' | 'target' | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Hooks
  const { 
    translateText, 
    getCulturalContext, 
    getUsageExamples,
    isLoading: translationLoading 
  } = useTranslationData();
  
  const {
    recentTranslations,
    addTranslation,
    toggleFavorite,
    clearHistory,
  } = useRecentTranslations();

  // Refs
  const translationTimeout = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Animations
  const translateAnimation = useSharedValue(0);
  const swapAnimation = useSharedValue(0);
  const historyAnimation = useSharedValue(0);
  const languageSelectorAnimation = useSharedValue(0);
  const micAnimation = useSharedValue(1);

  // Animated styles
  const translateStyle = useAnimatedStyle(() => ({
    opacity: translateAnimation.value,
    transform: [
      { translateY: interpolate(translateAnimation.value, [0, 1], [20, 0]) },
      { scale: translateAnimation.value },
    ],
  }));

  const swapStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${swapAnimation.value * 180}deg` }],
  }));

  const historyStyle = useAnimatedStyle(() => ({
    opacity: historyAnimation.value,
    transform: [
      { translateX: interpolate(historyAnimation.value, [0, 1], [SCREEN_WIDTH, 0]) },
    ],
  }));

  const languageSelectorStyle = useAnimatedStyle(() => ({
    opacity: languageSelectorAnimation.value,
    transform: [
      { scale: languageSelectorAnimation.value },
      { translateY: interpolate(languageSelectorAnimation.value, [0, 1], [50, 0]) },
    ],
  }));

  const micStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micAnimation.value }],
  }));

  // Translation handler with debounce
  const handleTranslation = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 2) {
      setTranslation(null);
      return;
    }

    // Clear existing timeout
    if (translationTimeout.current) {
      clearTimeout(translationTimeout.current);
    }

    // Debounce translation requests
    translationTimeout.current = setTimeout(async () => {
      setIsTranslating(true);
      translateAnimation.value = withTiming(0, { duration: 200 });

      try {
        // Get basic translation
        const translatedText = await translateText(text, sourceLang, targetLang);
        
        // Get cultural context and usage examples
        const culturalContext = await getCulturalContext(text, sourceLang, targetLang);
        const examples = await getUsageExamples(text, sourceLang);

        const newTranslation: Translation = {
          id: Date.now().toString(),
          source: text,
          target: translatedText,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          culturalContext: culturalContext?.context,
          usage: culturalContext?.usage,
          examples,
          timestamp: new Date(),
          isFavorite: false,
        };

        setTranslation(newTranslation);
        translateAnimation.value = withSpring(1, { damping: 15 });

        // Add to recent translations
        await addTranslation(newTranslation);

      } catch (error) {
        console.error('Translation error:', error);
        Alert.alert(
          isElementary ? 'Oops!' : 'Translation Error',
          isElementary 
            ? 'Something went wrong. Try again!'
            : 'Unable to translate text. Please try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsTranslating(false);
      }
    }, 500);
  }, [sourceLang, targetLang, translateText, getCulturalContext, getUsageExamples, isElementary, addTranslation]);

  // Language swap handler
  const handleLanguageSwap = useCallback(() => {
    swapAnimation.value = withTiming(1, { duration: 300 }, () => {
      runOnJS(() => {
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        
        if (translation) {
          setSourceText(translation.target);
          setTranslation(null);
        }
      })();
      swapAnimation.value = withTiming(0, { duration: 300 });
    });
  }, [sourceLang, targetLang, translation, swapAnimation]);

  // Voice input handler
  const handleVoiceInput = useCallback(async () => {
    try {
      if (isListening) {
        // Stop recording
        if (recordingRef.current) {
          await recordingRef.current.stopAndUnloadAsync();
          const uri = recordingRef.current.getURI();
          recordingRef.current = null;
          
          // Process audio (mock implementation)
          // In real app, would use speech-to-text service
          const recognizedText = await mockSpeechRecognition(uri, sourceLang);
          setSourceText(recognizedText);
          handleTranslation(recognizedText);
        }
        
        setIsListening(false);
        micAnimation.value = withSpring(1, { damping: 15 });
      } else {
        // Start recording
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please allow microphone access to use voice input.',
            [{ text: 'OK' }]
          );
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
        await recording.startAsync();
        
        recordingRef.current = recording;
        setIsListening(true);
        micAnimation.value = withSequence(
          withSpring(1.2, { damping: 10 }),
          withTiming(0.8, { duration: 500 }),
          withTiming(1.2, { duration: 500 }),
        );
      }
    } catch (error) {
      console.error('Voice input error:', error);
      Alert.alert(
        isElementary ? 'Oops!' : 'Voice Input Error',
        isElementary 
          ? 'Voice input not working. Try typing instead!'
          : 'Unable to use voice input. Please try typing instead.',
        [{ text: 'OK' }]
      );
    }
  }, [isListening, sourceLang, handleTranslation, isElementary]);

  // Text-to-speech handler
  const handleTextToSpeech = useCallback(async (text: string, language: string) => {
    try {
      const languageCode = language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US';
      
      await Speech.speak(text, {
        language: languageCode,
        rate: isElementary ? 0.8 : 1.0, // Slower for elementary students
        pitch: 1.0,
      });
    } catch (error) {
      console.error('Text-to-speech error:', error);
    }
  }, [isElementary]);

  // Camera text recognition (mock implementation)
  const handleCameraTranslation = useCallback(async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow camera access to scan text.',
          [{ text: 'OK' }]
        );
        return;
      }

      setShowCamera(true);
      // In real implementation, would integrate with text recognition service
    } catch (error) {
      console.error('Camera error:', error);
    }
  }, []);

  // Language selector
  const handleLanguageSelect = useCallback((type: 'source' | 'target', language: 'en' | 'uz' | 'ru') => {
    if (type === 'source') {
      setSourceLang(language);
    } else {
      setTargetLang(language);
    }
    
    setShowLanguageSelector(null);
    languageSelectorAnimation.value = withTiming(0, { duration: 200 });

    // Re-translate if there's existing text
    if (sourceText.trim()) {
      handleTranslation(sourceText);
    }
  }, [sourceText, handleTranslation]);

  // History management
  const handleShowHistory = useCallback(() => {
    setShowHistory(true);
    historyAnimation.value = withSpring(1, { damping: 15 });
  }, []);

  const handleHideHistory = useCallback(() => {
    historyAnimation.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setShowHistory)(false);
    });
  }, []);

  // Mock functions (would be replaced with real implementations)
  const mockSpeechRecognition = async (uri: string | null, language: string): Promise<string> => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockResults = {
      en: "Hello, how are you today?",
      uz: "Salom, bugun qandaysiz?",
      ru: "Привет, как дела сегодня?",
    };
    
    return mockResults[language as keyof typeof mockResults] || "Sample text";
  };

  // Effects
  useEffect(() => {
    if (sourceText.trim()) {
      handleTranslation(sourceText);
    }
  }, [sourceText, sourceLang, targetLang, handleTranslation]);

  // Language selector modal
  const renderLanguageSelector = () => {
    if (!showLanguageSelector) return null;

    return (
      <Animated.View style={[styles.languageSelectorOverlay, languageSelectorStyle]}>
        <View style={styles.languageSelectorContent}>
          <Text style={[styles.languageSelectorTitle, isElementary && styles.elementaryText]}>
            {isElementary ? 'Choose Language' : 'Select Language'}
          </Text>
          
          {LANGUAGES.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={styles.languageOption}
              onPress={() => handleLanguageSelect(showLanguageSelector!, language.code)}
            >
              <Text style={styles.languageFlag}>{language.flag}</Text>
              <View style={styles.languageInfo}>
                <Text style={[styles.languageName, isElementary && styles.elementaryText]}>
                  {language.name}
                </Text>
                <Text style={styles.languageNative}>{language.nativeName}</Text>
              </View>
              {((showLanguageSelector === 'source' && sourceLang === language.code) ||
                (showLanguageSelector === 'target' && targetLang === language.code)) && (
                <AntDesign name="check" size={20} color="#1d7452" />
              )}
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.closeSelectorButton}
            onPress={() => {
              setShowLanguageSelector(null);
              languageSelectorAnimation.value = withTiming(0, { duration: 200 });
            }}
          >
            <Text style={styles.closeSelectorText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // History panel
  const renderHistoryPanel = () => {
    if (!showHistory) return null;

    return (
      <Animated.View style={[styles.historyOverlay, historyStyle]}>
        <View style={styles.historyContent}>
          <View style={styles.historyHeader}>
            <Text style={[styles.historyTitle, isElementary && styles.elementaryText]}>
              {isElementary ? '📚 Your Translations' : 'Translation History'}
            </Text>
            <TouchableOpacity onPress={handleHideHistory}>
              <AntDesign name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.historyList}>
            {recentTranslations.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyItem}
                onPress={() => {
                  setSourceText(item.source);
                  setSourceLang(item.sourceLanguage as 'en' | 'uz' | 'ru');
                  setTargetLang(item.targetLanguage as 'en' | 'uz' | 'ru');
                  setTranslation(item);
                  handleHideHistory();
                }}
              >
                <View style={styles.historyItemContent}>
                  <View style={styles.historyLanguages}>
                    <Text style={styles.historyLanguage}>
                      {LANGUAGES.find(l => l.code === item.sourceLanguage)?.flag} →{' '}
                      {LANGUAGES.find(l => l.code === item.targetLanguage)?.flag}
                    </Text>
                    <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                      <AntDesign 
                        name={item.isFavorite ? "star" : "staro"} 
                        size={16} 
                        color={item.isFavorite ? "#f59e0b" : "#9ca3af"} 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={[styles.historySource, isElementary && styles.elementaryText]}>
                    {item.source}
                  </Text>
                  <Text style={[styles.historyTarget, isElementary && styles.elementaryText]}>
                    {item.target}
                  </Text>
                  
                  <Text style={styles.historyTime}>
                    {item.timestamp.toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {recentTranslations.length > 0 && (
            <TouchableOpacity
              style={styles.clearHistoryButton}
              onPress={() => {
                Alert.alert(
                  isElementary ? 'Clear All?' : 'Clear History',
                  isElementary 
                    ? 'Delete all your translations?'
                    : 'Are you sure you want to clear all translation history?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: isElementary ? 'Delete All' : 'Clear All', 
                      style: 'destructive',
                      onPress: clearHistory,
                    },
                  ]
                );
              }}
            >
              <Text style={styles.clearHistoryText}>
                {isElementary ? 'Delete All' : 'Clear History'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, isElementary && styles.elementaryText]}>
            {isElementary ? '🌍 Translator' : 'Translator'}
          </Text>

          <TouchableOpacity onPress={handleShowHistory}>
            <MaterialCommunityIcons name="history" size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>

        {/* Language selector */}
        <View style={styles.languageSelector}>
          <TouchableOpacity
            style={[styles.languageButton, isElementary && styles.elementaryButton]}
            onPress={() => {
              setShowLanguageSelector('source');
              languageSelectorAnimation.value = withSpring(1, { damping: 15 });
            }}
          >
            <Text style={styles.languageFlag}>
              {LANGUAGES.find(l => l.code === sourceLang)?.flag}
            </Text>
            <Text style={[styles.languageButtonText, isElementary && styles.elementaryText]}>
              {LANGUAGES.find(l => l.code === sourceLang)?.name}
            </Text>
            <AntDesign name="down" size={16} color="#6b7280" />
          </TouchableOpacity>

          <Animated.View style={[styles.swapButton, swapStyle]}>
            <TouchableOpacity onPress={handleLanguageSwap}>
              <MaterialCommunityIcons name="swap-horizontal" size={24} color="#1d7452" />
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={[styles.languageButton, isElementary && styles.elementaryButton]}
            onPress={() => {
              setShowLanguageSelector('target');
              languageSelectorAnimation.value = withSpring(1, { damping: 15 });
            }}
          >
            <Text style={styles.languageFlag}>
              {LANGUAGES.find(l => l.code === targetLang)?.flag}
            </Text>
            <Text style={[styles.languageButtonText, isElementary && styles.elementaryText]}>
              {LANGUAGES.find(l => l.code === targetLang)?.name}
            </Text>
            <AntDesign name="down" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Input section */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, isElementary && styles.elementaryTextInput]}
              placeholder={isElementary 
                ? `Type in ${LANGUAGES.find(l => l.code === sourceLang)?.name}...`
                : `Enter text to translate...`
              }
              value={sourceText}
              onChangeText={setSourceText}
              multiline
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
              maxLength={500}
            />

            <View style={styles.inputActions}>
              <TouchableOpacity
                style={[styles.actionButton, isListening && styles.activeActionButton]}
                onPress={handleVoiceInput}
              >
                <Animated.View style={micStyle}>
                  <Ionicons 
                    name={isListening ? "stop" : "mic"} 
                    size={isElementary ? 24 : 20} 
                    color={isListening ? "#ef4444" : "#1d7452"} 
                  />
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCameraTranslation}
              >
                <MaterialCommunityIcons 
                  name="camera" 
                  size={isElementary ? 24 : 20} 
                  color="#1d7452" 
                />
              </TouchableOpacity>

              {sourceText.trim() ? (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleTextToSpeech(sourceText, sourceLang)}
                >
                  <Ionicons 
                    name="volume-high" 
                    size={isElementary ? 24 : 20} 
                    color="#1d7452" 
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setSourceText('')}
                >
                  <MaterialCommunityIcons 
                    name="close" 
                    size={isElementary ? 24 : 20} 
                    color="#6b7280" 
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.characterCount}>
            {sourceText.length}/500
          </Text>
        </View>

        {/* Translation result */}
        <ScrollView style={styles.resultSection} showsVerticalScrollIndicator={false}>
          {isTranslating ? (
            <View style={styles.loadingContainer}>
              <MaterialCommunityIcons name="translate" size={32} color="#1d7452" />
              <Text style={[styles.loadingText, isElementary && styles.elementaryText]}>
                {isElementary ? 'Translating...' : 'Translating...'}
              </Text>
            </View>
          ) : translation ? (
            <Animated.View style={[styles.translationContainer, translateStyle]}>
              {/* Main translation */}
              <View style={styles.translationResult}>
                <Text style={[styles.translationText, isElementary && styles.elementaryText]}>
                  {translation.target}
                </Text>
                
                <TouchableOpacity
                  style={styles.speakButton}
                  onPress={() => handleTextToSpeech(translation.target, targetLang)}
                >
                  <Ionicons name="volume-high" size={20} color="#1d7452" />
                </TouchableOpacity>
              </View>

              {/* Cultural context */}
              {translation.culturalContext && (
                <View style={styles.culturalContextContainer}>
                  <Text style={styles.culturalContextLabel}>
                    {isElementary ? '🌟 Did you know?' : 'Cultural Context:'}
                  </Text>
                  <Text style={[styles.culturalContextText, isElementary && styles.elementaryText]}>
                    {translation.culturalContext}
                  </Text>
                </View>
              )}

              {/* Usage examples */}
              {translation.examples && translation.examples.length > 0 && (
                <View style={styles.examplesContainer}>
                  <Text style={styles.examplesLabel}>
                    {isElementary ? '📝 Examples:' : 'Usage Examples:'}
                  </Text>
                  {translation.examples.slice(0, 2).map((example, index) => (
                    <Text key={index} style={[styles.exampleText, isElementary && styles.elementaryText]}>
                      • {example}
                    </Text>
                  ))}
                </View>
              )}

              {/* Action buttons */}
              <View style={styles.translationActions}>
                <TouchableOpacity
                  style={[styles.translationActionButton, styles.copyButton]}
                  onPress={() => {
                    // Copy to clipboard functionality
                    Alert.alert(
                      isElementary ? 'Copied!' : 'Copied to clipboard',
                      isElementary ? 'Translation copied!' : 'Translation has been copied to clipboard',
                      [{ text: 'OK' }]
                    );
                  }}
                >
                  <MaterialCommunityIcons name="content-copy" size={16} color="#3b82f6" />
                  <Text style={[styles.actionButtonText, { color: '#3b82f6' }]}>
                    {isElementary ? 'Copy' : 'Copy'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.translationActionButton, styles.favoriteButton]}
                  onPress={() => toggleFavorite(translation.id)}
                >
                  <AntDesign 
                    name={translation.isFavorite ? "star" : "staro"} 
                    size={16} 
                    color="#f59e0b" 
                  />
                  <Text style={[styles.actionButtonText, { color: '#f59e0b' }]}>
                    {isElementary ? 'Save' : 'Favorite'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.translationActionButton, styles.shareButton]}
                  onPress={() => {
                    // Share functionality
                    Alert.alert(
                      isElementary ? 'Share' : 'Share Translation',
                      isElementary ? 'Share with friends?' : 'How would you like to share this translation?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: isElementary ? 'Share!' : 'Share' },
                      ]
                    );
                  }}
                >
                  <Feather name="share" size={16} color="#10b981" />
                  <Text style={[styles.actionButtonText, { color: '#10b981' }]}>
                    {isElementary ? 'Share' : 'Share'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : sourceText.trim() && !isTranslating ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="translate-off" size={48} color="#9ca3af" />
              <Text style={[styles.emptyText, isElementary && styles.elementaryText]}>
                {isElementary ? 'Translation not available' : 'Unable to translate'}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Modals */}
        {renderLanguageSelector()}
        {renderHistoryPanel()}
      </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  languageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  languageFlag: {
    fontSize: 20,
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  swapButton: {
    marginHorizontal: 16,
    padding: 8,
  },
  inputSection: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    minHeight: 120,
    position: 'relative',
  },
  textInput: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
    minHeight: 100,
    textAlignVertical: 'top',
    paddingRight: 60,
  },
  inputActions: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  activeActionButton: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  characterCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 8,
  },
  resultSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  translationContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  translationResult: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  translationText: {
    fontSize: 18,
    color: '#1f2937',
    lineHeight: 26,
    flex: 1,
    fontWeight: '500' as const,
  },
  speakButton: {
    marginLeft: 12,
    padding: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  culturalContextContainer: {
    backgroundColor: '#fefce8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  culturalContextLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#f59e0b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  culturalContextText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  examplesContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  examplesLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#3b82f6',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  exampleText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    marginBottom: 4,
  },
  translationActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  translationActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  copyButton: {
    backgroundColor: '#eff6ff',
  },
  favoriteButton: {
    backgroundColor: '#fefce8',
  },
  shareButton: {
    backgroundColor: '#ecfdf5',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 12,
  },

  // Language selector modal
  languageSelectorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  languageSelectorContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 20,
    padding: 20,
    width: SCREEN_WIDTH * 0.85,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  languageSelectorTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  languageInfo: {
    flex: 1,
    marginLeft: 12,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1f2937',
  },
  languageNative: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  closeSelectorButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeSelectorText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500' as const,
  },

  // History panel
  historyOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: '#ffffff',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  historyContent: {
    flex: 1,
    paddingTop: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  historyList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  historyItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  historyItemContent: {
    gap: 8,
  },
  historyLanguages: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLanguage: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  historySource: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500' as const,
  },
  historyTarget: {
    fontSize: 14,
    color: '#6b7280',
  },
  historyTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  clearHistoryButton: {
    margin: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearHistoryText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600' as const,
  },

  // Elementary (10-12) age adaptations
  elementaryText: {
    fontSize: 18,
    lineHeight: 26,
  },
  elementaryTextInput: {
    fontSize: 18,
    lineHeight: 26,
  },
  elementaryButton: {
    paddingVertical: 14,
    borderRadius: 10,
  },
};