/**
 * VocabularyScreen.tsx
 * Main vocabulary screen with unit-based organization and age-adaptive interface
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Feather, MaterialCommunityIcons, AntDesign, Ionicons } from '@expo/vector-icons';
import { useVocabularyData } from '../../hooks/useVocabularyData';
import { useAgeAdaptiveLayout } from '../../hooks/useAgeAdaptiveLayout';
import { useVocabularyProgress } from '../../hooks/useVocabularyProgress';

interface VocabularyUnit {
  id: string;
  title: string;
  description: string;
  category: 'daily_life' | 'academic' | 'cultural' | 'professional';
  level: 'beginner' | 'intermediate' | 'advanced';
  totalWords: number;
  learnedWords: number;
  masteredWords: number;
  newWords: number;
  dueForReview: number;
  estimatedTime: number; // minutes
  culturalContext: {
    region: string;
    theme: string;
    imagery: string[];
  };
  ageRecommendation: '10-12' | '13-15' | '16-18' | 'all';
  achievements: {
    id: string;
    title: string;
    description: string;
    unlocked: boolean;
    progress: number;
  }[];
}

interface VocabularyScreenProps {
  studentId: string;
  ageGroup: '10-12' | '13-15' | '16-18';
  nativeLanguage: 'uz' | 'ru';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const VocabularyScreen: React.FC<VocabularyScreenProps> = ({
  studentId = 'mock-student-123',
  ageGroup = '13-15',
  nativeLanguage = 'uz',
}) => {
  const navigation = useNavigation();
  const { isElementary, isSecondary, getAdaptiveSpacing } = useAgeAdaptiveLayout(ageGroup);
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [showAchievements, setShowAchievements] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Hooks
  const { 
    vocabularyUnits, 
    isLoading, 
    error, 
    refreshUnits, 
    getUnitsByCategory,
    searchUnits 
  } = useVocabularyData(studentId);
  
  const {
    overallProgress,
    weeklyGoal,
    streakCount,
    totalLearned,
    updateProgress,
  } = useVocabularyProgress(studentId);

  // Animations
  const searchAnimation = useSharedValue(0);
  const achievementAnimation = useSharedValue(0);
  const unitAnimation = useSharedValue(0);
  const celebrationAnimation = useSharedValue(0);

  // Filtered and sorted units
  const filteredUnits = useMemo(() => {
    let filtered = vocabularyUnits;

    // Search filter
    if (searchQuery.trim()) {
      filtered = searchUnits(searchQuery);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(unit => unit.category === selectedCategory);
    }

    // Level filter
    if (filterLevel !== 'all') {
      filtered = filtered.filter(unit => unit.level === filterLevel);
    }

    // Age-appropriate filter
    filtered = filtered.filter(unit => 
      unit.ageRecommendation === 'all' || unit.ageRecommendation === ageGroup
    );

    // Sort by priority: units with due reviews first, then by progress
    return filtered.sort((a, b) => {
      if (a.dueForReview > 0 && b.dueForReview === 0) return -1;
      if (a.dueForReview === 0 && b.dueForReview > 0) return 1;
      if (a.dueForReview !== b.dueForReview) return b.dueForReview - a.dueForReview;
      
      const aProgress = (a.learnedWords + a.masteredWords) / a.totalWords;
      const bProgress = (b.learnedWords + b.masteredWords) / b.totalWords;
      return bProgress - aProgress; // Higher progress first
    });
  }, [vocabularyUnits, searchQuery, selectedCategory, filterLevel, ageGroup, searchUnits]);

  // Categories with cultural context
  const categories = useMemo(() => [
    {
      id: 'all',
      title: isElementary ? '🌟 All Words' : 'All Categories',
      icon: 'apps' as const,
      color: '#1d7452',
    },
    {
      id: 'daily_life',
      title: isElementary ? '🏠 Daily Life' : 'Daily Life',
      icon: 'home' as const,
      color: '#3b82f6',
    },
    {
      id: 'academic',
      title: isElementary ? '📚 School' : 'Academic',
      icon: 'school' as const,
      color: '#8b5cf6',
    },
    {
      id: 'cultural',
      title: isElementary ? '🎭 Culture' : 'Cultural',
      icon: 'flag' as const,
      color: '#f59e0b',
    },
    {
      id: 'professional',
      title: isElementary ? '💼 Work' : 'Professional',
      icon: 'briefcase' as const,
      color: '#ef4444',
    },
  ], [isElementary]);

  // Animated styles
  const searchStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: searchAnimation.value }],
    opacity: interpolate(searchAnimation.value, [-20, 0], [0, 1]),
  }));

  const achievementStyle = useAnimatedStyle(() => ({
    transform: [{ scale: achievementAnimation.value }],
    opacity: achievementAnimation.value,
  }));

  const celebrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationAnimation.value }],
    opacity: celebrationAnimation.value,
  }));

  // Effects
  useEffect(() => {
    searchAnimation.value = withSpring(0, { damping: 15 });
    unitAnimation.value = withTiming(1, { duration: 600 });
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshUnits();
    }, [refreshUnits])
  );

  // Handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUnits();
      celebrationAnimation.value = withSequence(
        withSpring(1.2, { damping: 15 }),
        withTiming(0, { duration: 800 })
      );
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshUnits]);

  const handleUnitPress = useCallback((unit: VocabularyUnit) => {
    navigation.navigate('FlashcardsScreen', {
      unitId: unit.id,
      unitTitle: unit.title,
      studyMode: unit.dueForReview > 0 ? 'review' : 'learn',
    });
  }, [navigation]);

  const handlePracticePress = useCallback((unit: VocabularyUnit) => {
    navigation.navigate('PracticeScreen', {
      unitId: unit.id,
      unitTitle: unit.title,
      practiceType: 'mixed',
    });
  }, [navigation]);

  const handleTranslatorPress = useCallback(() => {
    navigation.navigate('TranslatorScreen', {
      sourceLanguage: 'en',
      targetLanguage: nativeLanguage,
    });
  }, [navigation, nativeLanguage]);

  const handleAchievementsToggle = useCallback(() => {
    setShowAchievements(!showAchievements);
    achievementAnimation.value = withSpring(showAchievements ? 0 : 1, { damping: 15 });
  }, [showAchievements]);

  const triggerCelebration = useCallback(() => {
    celebrationAnimation.value = withSequence(
      withSpring(1, { damping: 10 }),
      withTiming(0, { duration: 1500 })
    );
  }, []);

  // Unit progress calculation
  const getUnitProgress = useCallback((unit: VocabularyUnit) => {
    const totalProgress = (unit.learnedWords + unit.masteredWords) / unit.totalWords;
    const masteryLevel = unit.masteredWords / unit.totalWords;
    return { totalProgress, masteryLevel };
  }, []);

  // Unit card component
  const renderVocabularyUnit = useCallback(({ item: unit, index }: { item: VocabularyUnit; index: number }) => {
    const { totalProgress, masteryLevel } = getUnitProgress(unit);
    const hasNewWords = unit.newWords > 0;
    const hasDueReviews = unit.dueForReview > 0;

    return (
      <Animated.View
        style={[
          styles.unitCard,
          isElementary && styles.elementaryUnitCard,
          {
            transform: [
              {
                translateY: unitAnimation.value
                  ? withTiming(0, { duration: 300 + index * 50 })
                  : 20,
              },
            ],
          },
        ]}
      >
        {/* Unit Header */}
        <View style={styles.unitHeader}>
          <View style={styles.unitTitleSection}>
            <Text style={[styles.unitTitle, isElementary && styles.elementaryText]}>
              {unit.title}
            </Text>
            <Text style={[styles.unitDescription, isElementary && styles.elementaryText]}>
              {unit.description}
            </Text>
          </View>
          
          {/* Cultural imagery */}
          <View style={styles.culturalImagery}>
            <Text style={styles.culturalEmoji}>
              {unit.culturalContext.imagery[0] || '📚'}
            </Text>
          </View>
        </View>

        {/* Progress visualization */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${totalProgress * 100}%`,
                    backgroundColor: totalProgress >= 0.8 ? '#10b981' : totalProgress >= 0.5 ? '#f59e0b' : '#6b7280',
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.masteryBarFill,
                  {
                    width: `${masteryLevel * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, isElementary && styles.elementaryText]}>
              {Math.round(totalProgress * 100)}% {isElementary ? 'learned!' : 'complete'}
            </Text>
          </View>

          {/* Statistics */}
          <View style={styles.statisticsRow}>
            <View style={styles.statisticItem}>
              <Text style={[styles.statisticNumber, isElementary && styles.elementaryText]}>
                {unit.totalWords}
              </Text>
              <Text style={[styles.statisticLabel, isElementary && styles.elementaryText]}>
                {isElementary ? 'Words' : 'Total'}
              </Text>
            </View>
            
            <View style={styles.statisticItem}>
              <Text style={[styles.statisticNumber, isElementary && styles.elementaryText, { color: '#10b981' }]}>
                {unit.masteredWords}
              </Text>
              <Text style={[styles.statisticLabel, isElementary && styles.elementaryText]}>
                {isElementary ? 'Mastered' : 'Known'}
              </Text>
            </View>

            {hasDueReviews && (
              <View style={styles.statisticItem}>
                <Text style={[styles.statisticNumber, isElementary && styles.elementaryText, { color: '#f59e0b' }]}>
                  {unit.dueForReview}
                </Text>
                <Text style={[styles.statisticLabel, isElementary && styles.elementaryText]}>
                  {isElementary ? 'Review' : 'Due'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              isElementary && styles.elementaryButton,
              hasDueReviews && styles.reviewButton,
            ]}
            onPress={() => handleUnitPress(unit)}
          >
            <Text style={[styles.primaryButtonText, isElementary && styles.elementaryText]}>
              {hasDueReviews
                ? isElementary ? '🔄 Review Time!' : 'Review Now'
                : hasNewWords
                ? isElementary ? '🆕 Learn New!' : 'Learn New'
                : isElementary ? '📚 Study' : 'Continue'}
            </Text>
            <Feather 
              name={hasDueReviews ? 'refresh-cw' : hasNewWords ? 'plus-circle' : 'arrow-right'} 
              size={isElementary ? 20 : 16} 
              color="#ffffff" 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, isElementary && styles.elementaryButton]}
            onPress={() => handlePracticePress(unit)}
          >
            <MaterialCommunityIcons 
              name="target" 
              size={isElementary ? 20 : 16} 
              color="#1d7452" 
            />
            <Text style={[styles.secondaryButtonText, isElementary && styles.elementaryText]}>
              {isElementary ? 'Practice' : 'Practice'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Achievements indicator */}
        {unit.achievements.some(a => a.unlocked) && (
          <View style={styles.achievementIndicator}>
            <AntDesign name="star" size={16} color="#f59e0b" />
            <Text style={styles.achievementText}>
              {unit.achievements.filter(a => a.unlocked).length} 
              {isElementary ? ' stars!' : ' achievements'}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  }, [
    isElementary,
    unitAnimation.value,
    getUnitProgress,
    handleUnitPress,
    handlePracticePress,
  ]);

  // Header component
  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Welcome section */}
      <View style={styles.welcomeSection}>
        <Text style={[styles.welcomeText, isElementary && styles.elementaryText]}>
          {isElementary ? '🌟 Learn New Words!' : 'Vocabulary Learning'}
        </Text>
        <Text style={[styles.subtitleText, isElementary && styles.elementaryText]}>
          {isElementary 
            ? `${totalLearned} words learned! Keep going!`
            : `${totalLearned} words mastered • ${streakCount} day streak`
          }
        </Text>
      </View>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickActionButton, isElementary && styles.elementaryButton]}
          onPress={handleTranslatorPress}
        >
          <Ionicons name="language" size={isElementary ? 24 : 20} color="#1d7452" />
          <Text style={[styles.quickActionText, isElementary && styles.elementaryText]}>
            {isElementary ? 'Translator' : 'Translate'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionButton, isElementary && styles.elementaryButton]}
          onPress={handleAchievementsToggle}
        >
          <MaterialCommunityIcons name="trophy" size={isElementary ? 24 : 20} color="#f59e0b" />
          <Text style={[styles.quickActionText, isElementary && styles.elementaryText]}>
            {isElementary ? 'Achievements' : 'Progress'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Search and filters
  const renderSearchAndFilters = () => (
    <Animated.View style={[styles.searchSection, searchStyle]}>
      {/* Search input */}
      <View style={[styles.searchContainer, isElementary && styles.elementarySearchContainer]}>
        <Feather name="search" size={20} color="#6b7280" />
        <TextInput
          style={[styles.searchInput, isElementary && styles.elementaryText]}
          placeholder={isElementary ? "Search for words..." : "Search vocabulary units..."}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilters}
        contentContainerStyle={styles.categoryFiltersContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryFilter,
              isElementary && styles.elementaryFilter,
              selectedCategory === category.id && styles.selectedCategoryFilter,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text
              style={[
                styles.categoryFilterText,
                isElementary && styles.elementaryText,
                selectedCategory === category.id && styles.selectedCategoryFilterText,
                { color: selectedCategory === category.id ? '#ffffff' : category.color },
              ]}
            >
              {category.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="book-open-variant" size={48} color="#1d7452" />
          <Text style={[styles.loadingText, isElementary && styles.elementaryText]}>
            {isElementary ? 'Loading your words...' : 'Loading vocabulary...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
          <Text style={[styles.errorText, isElementary && styles.elementaryText]}>
            {isElementary ? 'Oops! Something went wrong.' : 'Unable to load vocabulary'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Celebration overlay */}
      <Animated.View style={[styles.celebrationOverlay, celebrationStyle]} pointerEvents="none">
        <Text style={styles.celebrationText}>🎉</Text>
      </Animated.View>

      <FlatList
        data={filteredUnits}
        renderItem={renderVocabularyUnit}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            {renderHeader()}
            {renderSearchAndFilters()}
          </View>
        }
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: getAdaptiveSpacing('large') },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1d7452']}
            tintColor="#1d7452"
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="book-search" size={64} color="#9ca3af" />
            <Text style={[styles.emptyText, isElementary && styles.elementaryText]}>
              {searchQuery
                ? isElementary
                  ? 'No words found. Try a different search!'
                  : 'No vocabulary units match your search'
                : isElementary
                ? 'No vocabulary units available yet'
                : 'No vocabulary units available'
              }
            </Text>
          </View>
        }
      />

      {/* Achievements modal placeholder */}
      {showAchievements && (
        <Animated.View style={[styles.achievementModal, achievementStyle]}>
          <View style={styles.achievementContent}>
            <Text style={[styles.achievementTitle, isElementary && styles.elementaryText]}>
              {isElementary ? '🏆 Your Achievements!' : 'Progress & Achievements'}
            </Text>
            {/* Achievement content would go here */}
            <TouchableOpacity
              style={styles.closeAchievements}
              onPress={handleAchievementsToggle}
            >
              <AntDesign name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  headerSection: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 8,
  },
  welcomeSection: {
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: '#6b7280',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    flex: 1,
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1d7452',
    marginLeft: 8,
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
    color: '#1f2937',
  },
  categoryFilters: {
    marginTop: 8,
  },
  categoryFiltersContent: {
    paddingHorizontal: 4,
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedCategoryFilter: {
    backgroundColor: '#1d7452',
    borderColor: '#1d7452',
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  selectedCategoryFilterText: {
    color: '#ffffff',
  },
  scrollContent: {
    paddingTop: 8,
  },
  unitCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  unitTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  unitTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1f2937',
    marginBottom: 4,
  },
  unitDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  culturalImagery: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  culturalEmoji: {
    fontSize: 24,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 4,
    position: 'relative',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  masteryBarFill: {
    height: 6,
    backgroundColor: '#10b981',
    borderRadius: 3,
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.7,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6b7280',
    textAlign: 'right',
  },
  statisticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statisticItem: {
    alignItems: 'center',
  },
  statisticNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  statisticLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d7452',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  reviewButton: {
    backgroundColor: '#f59e0b',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 8,
    minWidth: 90,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1d7452',
  },
  achievementIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    padding: 4,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
  },
  achievementText: {
    fontSize: 12,
    color: '#d97706',
    marginLeft: 4,
    fontWeight: '500' as const,
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#1d7452',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 1000,
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  celebrationText: {
    fontSize: 50,
    textAlign: 'center',
  },
  achievementModal: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  achievementContent: {
    position: 'relative',
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1f2937',
    textAlign: 'center',
  },
  closeAchievements: {
    position: 'absolute',
    top: -10,
    right: -10,
    padding: 10,
  },

  // Elementary (10-12) age adaptations
  elementaryUnitCard: {
    borderRadius: 16,
    padding: 20,
  },
  elementaryText: {
    fontSize: 18,
    lineHeight: 26,
  },
  elementaryButton: {
    borderRadius: 12,
    padding: 16,
    minHeight: 52,
  },
  elementarySearchContainer: {
    padding: 12,
    borderRadius: 12,
  },
  elementaryFilter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
};