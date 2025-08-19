/**
 * Animation Examples - Harry School Design System
 * 
 * Comprehensive examples demonstrating the animation system usage
 * This file serves as both documentation and testing for animations
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  AnimatedButton,
  VocabularyCard,
  ProgressBar,
  RankingBadge,
  AnimatedTabBar,
  Text,
} from '../components';
import { animations, colors } from '../theme';

export const AnimationExamples: React.FC = () => {
  const [progress, setProgress] = useState(65);
  const [activeTab, setActiveTab] = useState('home');
  const [celebrateRank, setCelebrateRank] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [buttonSuccess, setButtonSuccess] = useState(false);

  // Sample vocabulary data
  const vocabularyWords = [
    {
      word: 'Adventure',
      translation: 'Sarguzasht',
      pronunciation: 'əd-ˈven-chər',
      definition: 'An exciting or unusual experience',
      example: 'We went on an adventure in the mountains.',
      exampleTranslation: 'Biz tog\'larda sarguzashtga chiqdik.',
    },
    {
      word: 'Brilliant',
      translation: 'Ajoyib',
      pronunciation: 'ˈbril-yənt',
      definition: 'Exceptionally clever or talented',
      example: 'She has a brilliant mind.',
      exampleTranslation: 'Uning aql-idroki ajoyib.',
    },
  ];

  // Sample tab data
  const tabData = [
    {
      id: 'home',
      label: 'Home',
      icon: <Text>🏠</Text>,
      activeIcon: <Text>🏠</Text>,
    },
    {
      id: 'vocabulary',
      label: 'Vocabulary',
      icon: <Text>📚</Text>,
      activeIcon: <Text>📚</Text>,
      badge: 3,
    },
    {
      id: 'ranking',
      label: 'Ranking',
      icon: <Text>🏆</Text>,
      activeIcon: <Text>🏆</Text>,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <Text>👤</Text>,
      activeIcon: <Text>👤</Text>,
    },
  ];

  const handleButtonPress = () => {
    setButtonLoading(true);
    
    setTimeout(() => {
      setButtonLoading(false);
      setButtonSuccess(true);
      
      setTimeout(() => {
        setButtonSuccess(false);
      }, 2000);
    }, 2000);
  };

  const handleProgressUpdate = () => {
    const newProgress = Math.min(100, progress + 15);
    setProgress(newProgress);
  };

  const handleRankingCelebration = () => {
    setCelebrateRank(true);
    setTimeout(() => setCelebrateRank(false), 1000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Harry School Animation Examples</Text>
      
      {/* Button Animations Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Button Interactions</Text>
        <Text style={styles.description}>
          Buttons with press animations, loading states, and haptic feedback
        </Text>
        
        <View style={styles.buttonRow}>
          <AnimatedButton
            title="Primary"
            variant="primary"
            hapticType="light"
            style={styles.button}
          />
          <AnimatedButton
            title="Success"
            variant="success"
            hapticType="medium"
            style={styles.button}
          />
        </View>
        
        <View style={styles.buttonRow}>
          <AnimatedButton
            title={buttonLoading ? "Processing..." : "Test Loading"}
            variant="primary"
            loading={buttonLoading}
            onPress={handleButtonPress}
            style={styles.button}
          />
          <AnimatedButton
            title="Success!"
            variant="success"
            success={buttonSuccess}
            style={styles.button}
          />
        </View>
      </View>

      {/* Educational Components Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Educational Components</Text>
        <Text style={styles.description}>
          Vocabulary cards with flip animations and progress tracking
        </Text>
        
        <View style={styles.cardRow}>
          {vocabularyWords.map((word, index) => (
            <VocabularyCard
              key={index}
              word={word.word}
              translation={word.translation}
              pronunciation={word.pronunciation}
              definition={word.definition}
              example={word.example}
              exampleTranslation={word.exampleTranslation}
              size="medium"
              difficulty={index === 0 ? 'easy' : 'medium'}
              hasAudio={true}
              onPlayAudio={() => console.log(`Playing audio for: ${word.word}`)}
              style={styles.vocabularyCard}
            />
          ))}
        </View>
        
        <View style={styles.progressSection}>
          <ProgressBar
            progress={progress}
            variant="primary"
            size="medium"
            showLabel={true}
            label="Learning Progress"
            showPercentage={true}
            style={styles.progressBar}
          />
          <AnimatedButton
            title="Add Progress"
            variant="secondary"
            size="small"
            onPress={handleProgressUpdate}
            style={styles.progressButton}
          />
        </View>
      </View>

      {/* Ranking System Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Ranking & Achievements</Text>
        <Text style={styles.description}>
          Ranking badges with celebration animations and point tracking
        </Text>
        
        <View style={styles.rankingRow}>
          <RankingBadge
            position={1}
            points={1250}
            studentName="Alice"
            size="large"
            triggerCelebration={celebrateRank}
            style={styles.rankingBadge}
          />
          <RankingBadge
            position={2}
            points={1100}
            studentName="Bob"
            size="medium"
            previousPosition={3}
            style={styles.rankingBadge}
          />
          <RankingBadge
            position={3}
            points={950}
            studentName="Carol"
            size="medium"
            style={styles.rankingBadge}
          />
        </View>
        
        <AnimatedButton
          title="Celebrate Ranking!"
          variant="primary"
          onPress={handleRankingCelebration}
          style={styles.celebrateButton}
        />
      </View>

      {/* Navigation Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Navigation Animations</Text>
        <Text style={styles.description}>
          Tab bar with bounce animations and smooth indicator transitions
        </Text>
        
        <AnimatedTabBar
          tabs={tabData}
          activeTabId={activeTab}
          onTabPress={setActiveTab}
          variant="primary"
          showLabels={true}
          indicatorType="line"
          style={styles.tabBar}
        />
      </View>

      {/* Animation Utilities Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Animation Utilities</Text>
        <Text style={styles.description}>
          Common animation patterns: fade, scale, slide transitions
        </Text>
        
        <View style={styles.utilityGrid}>
          <View style={styles.utilityDemo}>
            <Text style={styles.utilityLabel}>Fade Animation</Text>
            <View style={[styles.animationBox, { backgroundColor: colors.semantic.primary.light }]} />
          </View>
          
          <View style={styles.utilityDemo}>
            <Text style={styles.utilityLabel}>Scale Animation</Text>
            <View style={[styles.animationBox, { backgroundColor: colors.semantic.success.light }]} />
          </View>
          
          <View style={styles.utilityDemo}>
            <Text style={styles.utilityLabel}>Slide Animation</Text>
            <View style={[styles.animationBox, { backgroundColor: colors.semantic.warning.light }]} />
          </View>
        </View>
      </View>

      {/* Performance Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance & Accessibility</Text>
        <Text style={styles.description}>
          • All animations respect reduced motion preferences{'\n'}
          • GPU-accelerated transforms for smooth performance{'\n'}
          • Haptic feedback for enhanced user experience{'\n'}
          • Battery-efficient spring physics{'\n'}
          • Screen reader compatible with progress announcements
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  button: {
    flex: 0.45,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  vocabularyCard: {
    marginHorizontal: 8,
  },
  progressSection: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    marginBottom: 16,
  },
  progressButton: {
    paddingHorizontal: 20,
  },
  rankingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  rankingBadge: {
    marginHorizontal: 8,
  },
  celebrateButton: {
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  tabBar: {
    borderRadius: 12,
    marginHorizontal: -20,
  },
  utilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  utilityDemo: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  utilityLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  animationBox: {
    width: 60,
    height: 40,
    borderRadius: 8,
  },
});

export default AnimationExamples;