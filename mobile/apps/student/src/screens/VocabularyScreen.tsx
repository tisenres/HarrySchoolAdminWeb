import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const COLORS = {
  primary: '#1d7452',
  secondary: '#2d9e6a',
  gold: '#f7c52d',
  background: '#f8fafc',
  white: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  lightBlue: '#dbeafe',
  lightGreen: '#dcfce7',
  lightPurple: '#f3e8ff',
  lightOrange: '#fed7aa',
};

export default function VocabularyScreen() {
  const vocabularyStats = {
    totalWords: 345,
    masteredWords: 289,
    weeklyGoal: 50,
    weeklyProgress: 32,
  };

  const practiceOptions = [
    {
      id: 1,
      title: 'Flashcards',
      description: 'Review words with spaced repetition',
      icon: 'flip-to-front',
      color: COLORS.primary,
      bgColor: COLORS.lightBlue,
      count: '23 new words',
    },
    {
      id: 2,
      title: 'Spelling Test',
      description: 'Practice spelling difficult words',
      icon: 'spellcheck',
      color: COLORS.warning,
      bgColor: COLORS.lightOrange,
      count: '15 words',
    },
    {
      id: 3,
      title: 'Pronunciation',
      description: 'Practice speaking with AI feedback',
      icon: 'record-voice-over',
      color: COLORS.success,
      bgColor: COLORS.lightGreen,
      count: '12 words',
    },
    {
      id: 4,
      title: 'Translator',
      description: 'Translate between EN/RU/UZ/AR',
      icon: 'translate',
      color: '#9333ea',
      bgColor: COLORS.lightPurple,
      count: 'Available',
    },
  ];

  const recentWords = [
    { id: 1, word: 'Baraka', translation: 'Blessing', language: 'AR', mastery: 85 },
    { id: 2, word: 'Knowledge', translation: 'Знание', language: 'RU', mastery: 92 },
    { id: 3, word: 'Taqwa', translation: 'God-consciousness', language: 'AR', mastery: 78 },
    { id: 4, word: 'Wisdom', translation: 'Donolik', language: 'UZ', mastery: 95 },
  ];

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 90) return COLORS.success;
    if (mastery >= 70) return COLORS.warning;
    return COLORS.error;
  };

  const getLanguageFlag = (language: string) => {
    switch (language) {
      case 'AR': return '🇸🇦';
      case 'RU': return '🇷🇺';
      case 'UZ': return '🇺🇿';
      case 'EN': return '🇺🇸';
      default: return '🌍';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📖 Vocabulary</Text>
          <Text style={styles.subtitle}>Expand your knowledge</Text>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>Your Progress</Text>
            <TouchableOpacity>
              <Icon name="insights" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{vocabularyStats.totalWords}</Text>
              <Text style={styles.statLabel}>Total Words</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>
                {vocabularyStats.masteredWords}
              </Text>
              <Text style={styles.statLabel}>Mastered</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.warning }]}>
                {vocabularyStats.weeklyProgress}/{vocabularyStats.weeklyGoal}
              </Text>
              <Text style={styles.statLabel}>Weekly Goal</Text>
            </View>
          </View>

          {/* Weekly Progress Bar */}
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>This Week's Progress</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(vocabularyStats.weeklyProgress / vocabularyStats.weeklyGoal) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((vocabularyStats.weeklyProgress / vocabularyStats.weeklyGoal) * 100)}% complete
            </Text>
          </View>
        </View>

        {/* Practice Options */}
        <Text style={styles.sectionTitle}>Practice Modes</Text>
        <View style={styles.practiceGrid}>
          {practiceOptions.map((option) => (
            <TouchableOpacity 
              key={option.id} 
              style={[styles.practiceCard, { backgroundColor: option.bgColor }]}
              activeOpacity={0.7}
            >
              <View style={[styles.practiceIcon, { backgroundColor: `${option.color}20` }]}>
                <Icon name={option.icon} size={24} color={option.color} />
              </View>
              <Text style={styles.practiceTitle}>{option.title}</Text>
              <Text style={styles.practiceDescription}>{option.description}</Text>
              <Text style={[styles.practiceCount, { color: option.color }]}>
                {option.count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Words */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Words</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentWords.map((word) => (
            <TouchableOpacity key={word.id} style={styles.wordCard}>
              <View style={styles.wordHeader}>
                <View style={styles.wordInfo}>
                  <Text style={styles.wordText}>{word.word}</Text>
                  <Text style={styles.wordFlag}>{getLanguageFlag(word.language)}</Text>
                </View>
                <View style={styles.masteryBadge}>
                  <Text style={[
                    styles.masteryText,
                    { color: getMasteryColor(word.mastery) }
                  ]}>
                    {word.mastery}%
                  </Text>
                </View>
              </View>
              
              <Text style={styles.translationText}>{word.translation}</Text>
              
              <View style={styles.masteryBar}>
                <View 
                  style={[
                    styles.masteryFill,
                    { 
                      width: `${word.mastery}%`,
                      backgroundColor: getMasteryColor(word.mastery)
                    }
                  ]} 
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Islamic Inspiration */}
        <View style={styles.inspirationCard}>
          <Icon name="auto-awesome" size={20} color={COLORS.gold} />
          <View style={styles.inspirationContent}>
            <Text style={styles.inspirationText}>
              "And We made from them leaders guiding by Our command when they were patient and were certain of Our signs."
            </Text>
            <Text style={styles.inspirationSource}>- Quran 32:24</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressSection: {
    borderTopWidth: 1,
    borderTopColor: `${COLORS.textSecondary}20`,
    paddingTop: 16,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: `${COLORS.primary}20`,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  practiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  practiceCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  practiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  practiceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  practiceDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  practiceCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  recentSection: {
    marginBottom: 24,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  wordCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 8,
  },
  wordFlag: {
    fontSize: 14,
  },
  masteryBadge: {
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  masteryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  translationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  masteryBar: {
    height: 4,
    backgroundColor: `${COLORS.textSecondary}30`,
    borderRadius: 2,
    overflow: 'hidden',
  },
  masteryFill: {
    height: '100%',
    borderRadius: 2,
  },
  inspirationCard: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.gold}15`,
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  inspirationContent: {
    flex: 1,
    marginLeft: 12,
  },
  inspirationText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: COLORS.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  inspirationSource: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});