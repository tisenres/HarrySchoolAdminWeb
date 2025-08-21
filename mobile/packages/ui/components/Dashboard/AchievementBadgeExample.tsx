import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AchievementBadgeProps {
  achievement: {
    id: string;
    title: string;
    emoji: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    unlockedAt: Date;
    isNew?: boolean;
  };
  size?: 'small' | 'medium' | 'large';
  showGlow?: boolean;
  onPress?: () => void;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = 'medium',
  showGlow = false,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (achievement.isNew) {
      // New achievement unlock animation
      const unlockSequence = Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 300,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]);

      const rotateSequence = Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: -180,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]);

      Animated.parallel([unlockSequence, rotateSequence]).start();
    } else {
      scaleAnim.setValue(1);
    }

    if (showGlow) {
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      glowLoop.start();
    }

    // Continuous sparkle animation for rare achievements
    if (achievement.rarity === 'epic' || achievement.rarity === 'legendary') {
      const sparkleLoop = Animated.loop(
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      sparkleLoop.start();
    }
  }, [achievement.isNew, showGlow, achievement.rarity]);

  const getSizeStyles = () => {
    const sizes = {
      small: { width: 48, height: 48, fontSize: 20 },
      medium: { width: 64, height: 64, fontSize: 24 },
      large: { width: 80, height: 80, fontSize: 32 },
    };
    return sizes[size];
  };

  const getRarityColors = () => {
    const rarityColors = {
      common: ['#94a3b8', '#64748b'],
      rare: ['#3b82f6', '#1d4ed8'],
      epic: ['#8b5cf6', '#5b21b6'],
      legendary: ['#f59e0b', '#d97706'],
    };
    return rarityColors[achievement.rarity];
  };

  const getRarityGlowColor = () => {
    const glowColors = {
      common: 'rgba(148, 163, 184, 0.4)',
      rare: 'rgba(59, 130, 246, 0.4)',
      epic: 'rgba(139, 92, 246, 0.4)',
      legendary: 'rgba(245, 158, 11, 0.4)',
    };
    return glowColors[achievement.rarity];
  };

  const sizeStyles = getSizeStyles();
  const gradientColors = getRarityColors();
  const glowColor = getRarityGlowColor();

  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const sparkleRotate = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      {/* Glow Effect */}
      {showGlow && (
        <Animated.View
          style={[
            styles.glowEffect,
            {
              width: sizeStyles.width + 16,
              height: sizeStyles.height + 16,
              borderRadius: (sizeStyles.width + 16) / 2,
              backgroundColor: glowColor,
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
              transform: [
                {
                  scale: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1],
                  }),
                },
              ],
            },
          ]}
        />
      )}

      {/* Sparkle Ring for Epic/Legendary */}
      {(achievement.rarity === 'epic' || achievement.rarity === 'legendary') && (
        <Animated.View
          style={[
            styles.sparkleRing,
            {
              width: sizeStyles.width + 20,
              height: sizeStyles.height + 20,
              borderRadius: (sizeStyles.width + 20) / 2,
              transform: [{ rotate: sparkleRotate }],
            },
          ]}
        >
          <Text style={styles.sparkle}>✨</Text>
          <Text style={[styles.sparkle, { transform: [{ rotate: '120deg' }] }]}>✨</Text>
          <Text style={[styles.sparkle, { transform: [{ rotate: '240deg' }] }]}>✨</Text>
        </Animated.View>
      )}

      {/* Main Badge */}
      <Animated.View
        style={[
          styles.badge,
          {
            width: sizeStyles.width,
            height: sizeStyles.height,
            borderRadius: sizeStyles.width / 2,
            transform: [
              { scale: scaleAnim },
              { rotate: rotateInterpolation },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          style={[
            styles.gradientBadge,
            {
              width: sizeStyles.width,
              height: sizeStyles.height,
              borderRadius: sizeStyles.width / 2,
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[styles.emoji, { fontSize: sizeStyles.fontSize }]}>
            {achievement.emoji}
          </Text>
        </LinearGradient>

        {/* Rarity Border */}
        <View
          style={[
            styles.rarityBorder,
            {
              width: sizeStyles.width + 4,
              height: sizeStyles.height + 4,
              borderRadius: (sizeStyles.width + 4) / 2,
              borderColor: gradientColors[1],
              borderWidth: achievement.rarity === 'legendary' ? 3 : 2,
            },
          ]}
        />

        {/* New Badge Indicator */}
        {achievement.isNew && (
          <View style={styles.newIndicator}>
            <Text style={styles.newText}>NEW!</Text>
          </View>
        )}
      </Animated.View>

      {/* Achievement Title */}
      {size === 'large' && (
        <Text style={styles.achievementTitle} numberOfLines={2}>
          {achievement.title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  glowEffect: {
    position: 'absolute',
    top: -8,
    left: -8,
  },

  sparkleRing: {
    position: 'absolute',
    top: -10,
    left: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sparkle: {
    position: 'absolute',
    fontSize: 12,
    top: 0,
  },

  badge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  gradientBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  emoji: {
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  rarityBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
  },

  newIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
  },

  newText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  achievementTitle: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    maxWidth: 80,
  },
});