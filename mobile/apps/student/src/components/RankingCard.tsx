import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#1d7452',
  secondary: '#2d9e6a',
  gold: '#f7c52d',
  white: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#64748b',
  success: '#10b981',
  lightGreen: '#dcfce7',
};

interface RankingCardProps {
  points: number;
  coins: number;
  rank: number;
  totalStudents: number;
  level: number;
}

export default function RankingCard({ 
  points, 
  coins, 
  rank, 
  totalStudents, 
  level 
}: RankingCardProps) {
  const nextLevelPoints = level * 1000;
  const currentLevelPoints = (level - 1) * 1000;
  const progressToNext = ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank <= 3) return '🏆';
    if (rank <= 10) return '🌟';
    return '📈';
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return COLORS.gold;
    if (rank <= 3) return '#ff6b35';
    if (rank <= 10) return COLORS.primary;
    return COLORS.textSecondary;
  };

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.9}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Your Ranking</Text>
          <Text style={styles.subtitle}>Keep climbing! 🚀</Text>
        </View>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View Leaderboard</Text>
          <Icon name="arrow-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Rank Display */}
        <View style={styles.rankSection}>
          <View style={[styles.rankBadge, { backgroundColor: `${getRankColor(rank)}15` }]}>
            <Text style={styles.rankEmoji}>{getRankEmoji(rank)}</Text>
            <View style={styles.rankInfo}>
              <Text style={[styles.rankNumber, { color: getRankColor(rank) }]}>
                #{rank}
              </Text>
              <Text style={styles.rankTotal}>of {totalStudents}</Text>
            </View>
          </View>

          {/* Level Progress */}
          <View style={styles.levelSection}>
            <View style={styles.levelHeader}>
              <Text style={styles.levelLabel}>Level {level}</Text>
              <Text style={styles.levelProgress}>{Math.round(progressToNext)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(progressToNext, 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.nextLevelText}>
              {nextLevelPoints - points} points to Level {level + 1}
            </Text>
          </View>
        </View>

        {/* Points & Coins */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.primary}15` }]}>
              <Icon name="star" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{points.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.gold}15` }]}>
              <Icon name="monetization-on" size={20} color={COLORS.gold} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{coins}</Text>
              <Text style={styles.statLabel}>Coins</Text>
            </View>
          </View>
        </View>

        {/* Weekly Challenge */}
        <View style={styles.challengeSection}>
          <Text style={styles.challengeTitle}>🎯 Weekly Challenge</Text>
          <Text style={styles.challengeDescription}>
            Complete 15 lessons this week to earn 500 bonus points!
          </Text>
          <View style={styles.challengeProgress}>
            <View style={styles.challengeProgressBar}>
              <View style={[styles.challengeProgressFill, { width: '60%' }]} />
            </View>
            <Text style={styles.challengeProgressText}>9/15 lessons</Text>
          </View>
        </View>
      </View>

      {/* Islamic Motivation */}
      <View style={styles.motivationSection}>
        <Icon name="format-quote" size={16} color={COLORS.gold} />
        <Text style={styles.motivationText}>
          "And Allah will raise those who believe among you and those who were given knowledge, by degrees."
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  content: {
    paddingHorizontal: 20,
  },
  rankSection: {
    marginBottom: 20,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  rankEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  rankInfo: {
    flex: 1,
  },
  rankNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  rankTotal: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  levelSection: {
    flex: 1,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  levelProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: `${COLORS.primary}20`,
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  nextLevelText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: `${COLORS.primary}05`,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: `${COLORS.textSecondary}20`,
    marginHorizontal: 16,
  },
  challengeSection: {
    backgroundColor: `${COLORS.success}10`,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  challengeDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  challengeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: `${COLORS.success}30`,
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 3,
  },
  challengeProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  motivationSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 0,
  },
  motivationText: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    marginLeft: 8,
    lineHeight: 18,
  },
});