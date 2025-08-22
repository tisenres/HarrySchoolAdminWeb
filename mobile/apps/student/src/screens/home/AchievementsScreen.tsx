import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Achievement, AchievementRarity } from '../../types';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/design';

const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'First Steps',
    description: 'Complete your first lesson',
    icon: 'footsteps',
    rarity: 'common',
    points: 50,
    coins: 10,
    condition: { type: 'lessons_completed', target: 1, current: 1 },
    isUnlocked: true,
    unlockedAt: '2024-01-15T10:00:00Z',
    progress: 100,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Streak Master',
    description: 'Maintain a 7-day learning streak',
    icon: 'flame',
    rarity: 'rare',
    points: 200,
    coins: 50,
    condition: { type: 'streak_days', target: 7, current: 7 },
    isUnlocked: true,
    unlockedAt: '2024-01-20T15:30:00Z',
    progress: 100,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    title: 'Quiz Champion',
    description: 'Score 100% on 5 quizzes in a row',
    icon: 'trophy',
    rarity: 'epic',
    points: 500,
    coins: 100,
    condition: { type: 'quiz_perfect', target: 5, current: 3 },
    isUnlocked: false,
    progress: 60,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    title: 'Legend',
    description: 'Reach the top 10 in global rankings',
    icon: 'crown',
    rarity: 'legendary',
    points: 1000,
    coins: 250,
    condition: { type: 'points_earned', target: 10000, current: 2847 },
    isUnlocked: false,
    progress: 28,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const getRarityColor = (rarity: AchievementRarity) => {
  switch (rarity) {
    case 'common': return [COLORS.gray400, COLORS.gray500];
    case 'rare': return [COLORS.info, COLORS.secondary];
    case 'epic': return [COLORS.purple, COLORS.purpleLight];
    case 'legendary': return [COLORS.gold, COLORS.goldLight];
  }
};

const getRarityGlow = (rarity: AchievementRarity) => {
  switch (rarity) {
    case 'common': return COLORS.gray200;
    case 'rare': return `${COLORS.info}30`;
    case 'epic': return `${COLORS.purple}30`;
    case 'legendary': return `${COLORS.gold}30`;
  }
};

interface AchievementCardProps {
  achievement: Achievement;
  onPress: () => void;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, onPress }) => {
  const rarityColors = getRarityColor(achievement.rarity);
  const glowColor = getRarityGlow(achievement.rarity);
  
  return (
    <TouchableOpacity 
      style={[
        styles.achievementCard,
        achievement.isUnlocked && { shadowColor: glowColor, elevation: 8 }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={achievement.isUnlocked ? rarityColors : [COLORS.gray200, COLORS.gray300]}
        style={styles.achievementIcon}
      >
        <Ionicons 
          name={achievement.icon as any} 
          size={32} 
          color={achievement.isUnlocked ? COLORS.white : COLORS.gray400} 
        />
      </LinearGradient>
      
      <View style={styles.achievementContent}>
        <View style={styles.achievementHeader}>
          <Text style={[
            styles.achievementTitle,
            !achievement.isUnlocked && styles.lockedTitle
          ]}>
            {achievement.title}
          </Text>
          <Text style={[styles.rarityBadge, { color: rarityColors[0] }]}>
            {achievement.rarity.toUpperCase()}
          </Text>
        </View>
        
        <Text style={[
          styles.achievementDescription,
          !achievement.isUnlocked && styles.lockedDescription
        ]}>
          {achievement.description}
        </Text>
        
        <View style={styles.rewardContainer}>
          <View style={styles.reward}>
            <Ionicons name="star" size={14} color={COLORS.gold} />
            <Text style={styles.rewardText}>{achievement.points} pts</Text>
          </View>
          <View style={styles.reward}>
            <Ionicons name="diamond" size={14} color={COLORS.gold} />
            <Text style={styles.rewardText}>{achievement.coins}</Text>
          </View>
        </View>
        
        {!achievement.isUnlocked && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${achievement.progress}%`, backgroundColor: rarityColors[0] }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {achievement.condition.current} / {achievement.condition.target}
            </Text>
          </View>
        )}
        
        {achievement.isUnlocked && achievement.unlockedAt && (
          <View style={styles.unlockedContainer}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.unlockedText}>
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
      
      {achievement.isUnlocked && (
        <View style={[styles.unlockedBadge, { backgroundColor: rarityColors[0] }]}>
          <Ionicons name="checkmark" size={16} color={COLORS.white} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function AchievementsScreen() {
  const unlockedCount = mockAchievements.filter(a => a.isUnlocked).length;
  const totalPoints = mockAchievements
    .filter(a => a.isUnlocked)
    .reduce((sum, a) => sum + a.points, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Header */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            style={styles.statsCard}
          >
            <Text style={styles.statsTitle}>Achievement Progress</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{unlockedCount}</Text>
                <Text style={styles.statLabel}>Unlocked</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{mockAchievements.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{totalPoints}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
            </View>
            
            <View style={styles.overallProgress}>
              <Text style={styles.progressLabel}>Overall Progress</Text>
              <View style={styles.overallProgressBar}>
                <View 
                  style={[
                    styles.overallProgressFill,
                    { width: `${(unlockedCount / mockAchievements.length) * 100}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressPercentage}>
                {Math.round((unlockedCount / mockAchievements.length) * 100)}%
              </Text>
            </View>
          </LinearGradient>
        </View>
        
        {/* Achievements Grid */}
        <View style={styles.achievementsContainer}>
          <Text style={styles.sectionTitle}>All Achievements</Text>
          {mockAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              onPress={() => {}}
            />
          ))}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING['4xl'],
  },
  
  // Stats
  statsContainer: {
    padding: SPACING.base,
  },
  statsCard: {
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },
  statsTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: SPACING.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  overallProgress: {
    marginTop: SPACING.base,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.white,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.full,
  },
  progressPercentage: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  
  // Achievements
  achievementsContainer: {
    padding: SPACING.base,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING.base,
    paddingHorizontal: SPACING.sm,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.base,
    position: 'relative',
    ...SHADOWS.sm,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.base,
  },
  achievementContent: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  achievementTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.text,
    flex: 1,
  },
  lockedTitle: {
    color: COLORS.gray500,
  },
  rarityBadge: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    marginLeft: SPACING.sm,
  },
  achievementDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  lockedDescription: {
    color: COLORS.gray400,
  },
  rewardContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.base,
  },
  rewardText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    fontWeight: TYPOGRAPHY.medium,
  },
  progressContainer: {
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  progressText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textTertiary,
  },
  unlockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unlockedText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.success,
    marginLeft: SPACING.xs,
    fontWeight: TYPOGRAPHY.medium,
  },
  unlockedBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});