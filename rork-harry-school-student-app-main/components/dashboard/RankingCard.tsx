import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Star, Coins } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { useStudent } from '@/providers/StudentProvider';

export default function RankingCard() {
  const { stats, isLoading, error } = useStudent();

  // Mock data fallback when Supabase fails
  const mockStats = {
    totalPoints: 1250,
    availableCoins: 125,
    currentLevel: 12,
    currentRank: 1,
    streakDays: 7,
    completedTasks: 15,
    pendingTasks: 3,
    totalTasks: 18,
  };

  const displayStats = error ? mockStats : stats;

  if (isLoading) {
    return (
      <Card style={styles.container} testID="ranking-card">
        <LinearGradient
          colors={Colors.gradient.primary}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.loadingText}>Loading...</Text>
        </LinearGradient>
      </Card>
    );
  }

  const levelProgress = (displayStats.totalPoints % 1000) / 1000; // Assuming 1000 points per level
  const nextLevelPoints = 1000 - (displayStats.totalPoints % 1000);

  return (
    <Card style={styles.container} testID="ranking-card">
      <LinearGradient
        colors={Colors.gradient.primary}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.rankSection}>
            <Trophy color="#ffffff" size={24} />
            <Text style={styles.rankText}>#{displayStats.currentRank}</Text>
          </View>
          <View style={styles.coinsSection}>
            <Coins color="#ffffff" size={20} />
            <Text style={styles.coinsText}>{displayStats.availableCoins}</Text>
          </View>
        </View>

        <View style={styles.pointsSection}>
          <Text style={styles.pointsLabel}>Total Points</Text>
          <Text style={styles.pointsValue}>{displayStats.totalPoints.toLocaleString()}</Text>
        </View>

        <View style={styles.levelSection}>
          <View style={styles.levelHeader}>
            <View style={styles.levelInfo}>
              <Star color="#ffffff" size={16} />
              <Text style={styles.levelText}>Level {displayStats.currentLevel}</Text>
            </View>
            <Text style={styles.nextLevelText}>{nextLevelPoints} to next level</Text>
          </View>
          <ProgressBar
            progress={levelProgress}
            height={6}
            backgroundColor="rgba(255, 255, 255, 0.3)"
            progressColor="#ffffff"
            testID="level-progress"
          />
        </View>
      </LinearGradient>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    overflow: 'hidden',
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankText: {
    color: '#ffffff',
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  coinsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinsText: {
    color: '#ffffff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  pointsSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pointsLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  pointsValue: {
    color: '#ffffff',
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.bold,
    marginTop: 4,
  },
  levelSection: {
    gap: 8,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelText: {
    color: '#ffffff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  nextLevelText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    textAlign: 'center',
  },
});