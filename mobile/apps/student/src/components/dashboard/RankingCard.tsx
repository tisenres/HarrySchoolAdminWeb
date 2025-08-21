/**
 * Ranking Card Component
 * Harry School Student Mobile App
 * 
 * Displays student ranking, points, and streak information
 * Age-adaptive design with celebration animations
 */

import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
} from 'react-native';
import { Card, Badge, ProgressBar, PointsCounter } from '@harry-school/ui';
import type { StudentAgeGroup } from '../../navigation/types';
import type { RankingData } from '../../hooks/useDashboardData';
import { theme } from '@harry-school/ui/theme';

interface RankingCardProps {
  ageGroup: StudentAgeGroup;
  data?: RankingData;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const RankingCard: React.FC<RankingCardProps> = ({
  ageGroup,
  data,
  onPress,
  style,
  testID,
}) => {
  // Animation values
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const pointsCounterRef = useRef(null);

  // Age-specific configuration
  const config = useMemo(() => {
    const isElementary = ageGroup === '10-12';
    
    return {
      showAnimatedCounters: isElementary,
      emphasizePoints: isElementary,
      showMascot: isElementary,
      celebrationLevel: isElementary ? 'high' : 'moderate',
      visualComplexity: isElementary ? 'simple' : 'detailed',
      colorSaturation: isElementary ? 'high' : 'standard',
      textScale: isElementary ? 1.1 : 1.0,
      showPrivacyMode: !isElementary,
      showAnalytics: !isElementary,
    };
  }, [ageGroup]);

  // Mock data for development
  const rankingData: RankingData = data || {
    position: 12,
    points: 2847,
    streak: 7,
    pointsToNext: 153,
    totalStudents: 156,
    percentile: 85,
    recentChange: 'up',
    changeAmount: 3,
  };

  // Position display with ordinal suffix
  const positionDisplay = useMemo(() => {
    const position = rankingData.position;
    let suffix = 'th';
    
    if (position % 10 === 1 && position % 100 !== 11) suffix = 'st';
    else if (position % 10 === 2 && position % 100 !== 12) suffix = 'nd';
    else if (position % 10 === 3 && position % 100 !== 13) suffix = 'rd';
    
    return `${position}${suffix}`;
  }, [rankingData.position]);

  // Position emoji and color based on ranking
  const positionStyle = useMemo(() => {
    const position = rankingData.position;
    
    if (position === 1) {
      return { emoji: '🥇', color: theme.colors.ranking.gold, text: 'Amazing!' };
    } else if (position === 2) {
      return { emoji: '🥈', color: theme.colors.ranking.silver, text: 'Excellent!' };
    } else if (position === 3) {
      return { emoji: '🥉', color: theme.colors.ranking.bronze, text: 'Great job!' };
    } else if (position <= 10) {
      return { emoji: '⭐', color: theme.colors.educational.performance.excellent, text: 'Top 10!' };
    } else if (rankingData.percentile >= 75) {
      return { emoji: '🌟', color: theme.colors.educational.performance.good, text: 'Keep it up!' };
    } else {
      return { emoji: '💪', color: theme.colors.educational.performance.average, text: 'You can do it!' };
    }
  }, [rankingData.position, rankingData.percentile]);

  // Streak display
  const streakDisplay = useMemo(() => {
    const streak = rankingData.streak;
    let emoji = '🔥';
    let text = 'day streak!';
    
    if (streak >= 30) {
      emoji = '🔥🔥🔥';
      text = 'days on fire!';
    } else if (streak >= 14) {
      emoji = '🔥🔥';
      text = 'days strong!';
    } else if (streak >= 7) {
      emoji = '🔥';
      text = 'days in a row!';
    } else if (streak >= 3) {
      emoji = '✨';
      text = 'days building!';
    }
    
    return { emoji, text: `${streak} ${text}` };
  }, [rankingData.streak]);

  // Progress to next milestone
  const progressToNext = useMemo(() => {
    if (!rankingData.pointsToNext) return null;
    
    const total = 1000; // Assume 1000 points between levels
    const current = total - rankingData.pointsToNext;
    const percentage = (current / total) * 100;
    
    return {
      current,
      total,
      percentage,
      remaining: rankingData.pointsToNext,
    };
  }, [rankingData.pointsToNext]);

  // Handle press animation
  const handlePressIn = () => {
    Animated.spring(scaleAnimation, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  // Celebration animation for position changes
  useEffect(() => {
    if (rankingData.recentChange === 'up' && config.celebrationLevel === 'high') {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [rankingData.recentChange, config.celebrationLevel]);

  return (
    <Animated.View 
      style={[
        { transform: [{ scale: scaleAnimation }] },
        style
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`Your ranking: ${positionDisplay} place with ${rankingData.points} points`}
        accessibilityHint="Tap to view detailed ranking information"
        testID={testID}
      >
        <Card
          variant="visual"
          size="expanded"
          gradientBackground={config.colorSaturation === 'high' ? {
            colors: [positionStyle.color, theme.colors.background.primary],
            start: { x: 0, y: 0 },
            end: { x: 1, y: 1 },
          } : undefined}
          style={styles.card}
        >
          {/* Header with Position and Change Indicator */}
          <View style={styles.header}>
            <View style={styles.positionContainer}>
              <Animated.View style={[
                styles.positionBadge,
                { backgroundColor: positionStyle.color },
                { transform: [{ scale: pulseAnimation }] }
              ]}>
                <Text style={styles.positionEmoji}>{positionStyle.emoji}</Text>
                <Text style={[
                  styles.positionText,
                  { fontSize: config.textScale * 24 }
                ]}>
                  {positionDisplay}
                </Text>
              </Animated.View>
              
              {/* Position Change Indicator */}
              {rankingData.recentChange !== 'same' && rankingData.changeAmount && (
                <View style={[
                  styles.changeIndicator,
                  { backgroundColor: rankingData.recentChange === 'up' 
                    ? theme.colors.semantic.success.light 
                    : theme.colors.semantic.error.light 
                  }
                ]}>
                  <Text style={styles.changeText}>
                    {rankingData.recentChange === 'up' ? '↗️' : '↘️'} {rankingData.changeAmount}
                  </Text>
                </View>
              )}
            </View>

            <Text style={[
              styles.encouragement,
              { fontSize: config.textScale * 16 }
            ]}>
              {positionStyle.text}
            </Text>
          </View>

          {/* Points Counter */}
          <View style={styles.pointsSection}>
            <View style={styles.pointsContainer}>
              <PointsCounter
                ref={pointsCounterRef}
                points={rankingData.points}
                animated={config.showAnimatedCounters}
                size={config.emphasizePoints ? 'large' : 'medium'}
                style={styles.pointsCounter}
              />
              <Text style={styles.pointsLabel}>Total Points</Text>
            </View>

            {/* Streak Display */}
            <View style={styles.streakContainer}>
              <Text style={[
                styles.streakEmoji,
                { fontSize: config.textScale * 24 }
              ]}>
                {streakDisplay.emoji}
              </Text>
              <Text style={[
                styles.streakText,
                { fontSize: config.textScale * 14 }
              ]}>
                {streakDisplay.text}
              </Text>
            </View>
          </View>

          {/* Progress to Next Level */}
          {progressToNext && config.visualComplexity === 'detailed' && (
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>
                {progressToNext.remaining} points to next rank
              </Text>
              <ProgressBar
                progress={progressToNext.percentage}
                color={positionStyle.color}
                showPercentage={false}
                height={8}
                style={styles.progressBar}
              />
            </View>
          )}

          {/* Elementary Mascot (if enabled) */}
          {config.showMascot && (
            <View style={styles.mascotContainer}>
              <Text style={styles.mascot}>🦉</Text>
              <Text style={styles.mascotMessage}>
                {rankingData.percentile >= 90 ? "You're a star student!" :
                 rankingData.percentile >= 75 ? "Great progress!" :
                 "Keep learning!"}
              </Text>
            </View>
          )}

          {/* Secondary Stats (for older students) */}
          {config.showAnalytics && (
            <View style={styles.analyticsSection}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{rankingData.percentile}%</Text>
                <Text style={styles.statLabel}>Percentile</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{rankingData.totalStudents}</Text>
                <Text style={styles.statLabel}>Total Students</Text>
              </View>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.lg,
    minHeight: 160,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  
  positionContainer: {
    alignItems: 'flex-start',
  },
  
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    marginBottom: theme.spacing.xs,
  },
  
  positionEmoji: {
    fontSize: 20,
    marginRight: theme.spacing.xs,
  },
  
  positionText: {
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
  },
  
  changeIndicator: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  
  encouragement: {
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'right',
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  
  pointsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  
  pointsContainer: {
    alignItems: 'flex-start',
  },
  
  pointsCounter: {
    marginBottom: theme.spacing.xs,
  },
  
  pointsLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  
  streakContainer: {
    alignItems: 'center',
  },
  
  streakEmoji: {
    marginBottom: 2,
  },
  
  streakText: {
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  
  progressSection: {
    marginBottom: theme.spacing.md,
  },
  
  progressLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  
  progressBar: {
    marginHorizontal: theme.spacing.sm,
  },
  
  mascotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.secondary,
  },
  
  mascot: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  
  mascotMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  
  analyticsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.secondary,
  },
  
  statItem: {
    alignItems: 'center',
  },
  
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  
  statLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
});

export default RankingCard;