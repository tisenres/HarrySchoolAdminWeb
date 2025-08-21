import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useAgeGroup } from '../../hooks/useAgeGroup';
import { theme } from '../../theme';

interface RankingCardProps {
  position: number;
  points: number;
  streak: number;
  totalStudents: number;
  onPress?: () => void;
}

export const RankingCard: React.FC<RankingCardProps> = ({
  position,
  points,
  streak,
  totalStudents,
  onPress,
}) => {
  const ageGroup = useAgeGroup();
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const pointsAnim = useRef(new Animated.Value(0)).current;
  const fireAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start celebration animations for elementary students
    if (ageGroup === '10-12') {
      const celebrationSequence = Animated.sequence([
        Animated.timing(celebrationAnim, {
          toValue: 1.2,
          duration: 300,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(celebrationAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]);

      const pointsIncrement = Animated.timing(pointsAnim, {
        toValue: points,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      });

      const fireFlicker = Animated.loop(
        Animated.sequence([
          Animated.timing(fireAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(fireAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      const sparkleLoop = Animated.loop(
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      Animated.parallel([
        celebrationSequence,
        pointsIncrement,
        fireFlicker,
        sparkleLoop,
      ]).start();
    }
  }, [ageGroup, points, celebrationAnim, pointsAnim, fireAnim, sparkleAnim]);

  const getCardStyle = () => {
    if (ageGroup === '10-12') {
      return [
        styles.cardElementary,
        {
          transform: [{ scale: celebrationAnim }],
        },
      ];
    }
    return styles.cardSecondary;
  };

  const getPositionStyle = () => {
    if (ageGroup === '10-12') {
      return styles.positionElementary;
    }
    return styles.positionSecondary;
  };

  const renderElementaryVersion = () => (
    <Animated.View style={getCardStyle()}>
      {/* Sparkle Background */}
      <Animated.View 
        style={[
          styles.sparkleBackground,
          {
            opacity: sparkleAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.2, 0.4, 0.2],
            }),
          },
        ]}
      />

      {/* Position Display */}
      <Text style={getPositionStyle()}>{position}</Text>
      
      {/* Points Counter */}
      <View style={styles.pointsCounterElementary}>
        <Animated.Text 
          style={[
            styles.pointsNumber,
            {
              transform: [{ scale: celebrationAnim }],
            },
          ]}
        >
          {Math.round(pointsAnim._value)}
        </Animated.Text>
        <View style={styles.coinIcon}>
          <Text style={styles.coinEmoji}>🪙</Text>
        </View>
      </View>

      {/* Streak Indicator */}
      <View style={styles.streakIndicatorElementary}>
        <Animated.Text 
          style={[
            styles.fireIcon,
            {
              transform: [
                {
                  scale: fireAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                },
                {
                  rotate: fireAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: ['-2deg', '2deg', '-1deg'],
                  }),
                },
              ],
            },
          ]}
        >
          🔥
        </Animated.Text>
        <Text style={styles.streakText}>{streak} days streak!</Text>
      </View>

      {/* Mascot Character */}
      <View style={styles.mascotContainer}>
        <Animated.Text 
          style={[
            styles.mascotCharacter,
            {
              transform: [
                {
                  translateY: sparkleAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, -4, 0],
                  }),
                },
                {
                  rotate: sparkleAnim.interpolate({
                    inputRange: [0, 0.25, 0.75, 1],
                    outputRange: ['0deg', '-5deg', '5deg', '0deg'],
                  }),
                },
              ],
            },
          ]}
        >
          🎉
        </Animated.Text>
      </View>

      {/* Encouragement Message */}
      <Text style={styles.encouragementText}>You're doing amazing!</Text>
    </Animated.View>
  );

  const renderSecondaryVersion = () => (
    <View style={styles.cardSecondary}>
      {/* Header */}
      <View style={styles.rankingHeaderSecondary}>
        <Text style={styles.positionSecondary}>#{position}</Text>
        <Text style={styles.privacyToggle}>Private</Text>
      </View>

      {/* Analytics Grid */}
      <View style={styles.analyticsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{points}</Text>
          <Text style={styles.metricLabel}>POINTS</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{streak}</Text>
          <Text style={styles.metricLabel}>STREAK</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{Math.round((position / totalStudents) * 100)}%</Text>
          <Text style={styles.metricLabel}>PERCENTILE</Text>
        </View>
      </View>

      {/* Improvement Indicator */}
      <View style={styles.improvementIndicator}>
        <Text style={styles.improvementIcon}>↗️</Text>
        <Text style={styles.improvementText}>+5% this week</Text>
      </View>
    </View>
  );

  return ageGroup === '10-12' ? renderElementaryVersion() : renderSecondaryVersion();
};

const styles = StyleSheet.create({
  // Elementary Styles
  cardElementary: {
    backgroundColor: theme.colors.elementaryCardBg,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: theme.colors.elementaryCelebration,
    minHeight: 180,
    position: 'relative',
    overflow: 'hidden',
  },

  sparkleBackground: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 20,
  },

  positionElementary: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.colors.elementaryPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },

  pointsCounterElementary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },

  pointsNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.elementarySuccess,
  },

  coinIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.elementaryCelebration,
    alignItems: 'center',
    justifyContent: 'center',
  },

  coinEmoji: {
    fontSize: 16,
  },

  streakIndicatorElementary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primarySubtle,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
  },

  fireIcon: {
    fontSize: 20,
  },

  streakText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.elementaryPrimary,
  },

  mascotContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },

  mascotCharacter: {
    fontSize: 32,
  },

  encouragementText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.elementarySuccess,
    textAlign: 'center',
  },

  // Secondary Styles
  cardSecondary: {
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 140,
  },

  rankingHeaderSecondary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  positionSecondary: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.secondaryPrimary,
  },

  privacyToggle: {
    backgroundColor: theme.colors.muted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    color: theme.colors.mutedForeground,
  },

  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  metricItem: {
    alignItems: 'center',
  },

  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: 4,
  },

  metricLabel: {
    fontSize: 10,
    color: theme.colors.mutedForeground,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  improvementIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'center',
  },

  improvementIcon: {
    fontSize: 12,
  },

  improvementText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '500',
  },
});