import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  runOnJS,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Canvas, Group, Circle, Path, Skia, useFont } from '@shopify/react-native-skia';
import { Haptics } from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface AchievementConfettiProps {
  visible: boolean;
  achievementType: 'lesson_complete' | 'quiz_perfect' | 'streak_milestone' | 'level_up';
  culturalTheme: 'islamic_star' | 'geometric_pattern' | 'calligraphy' | 'traditional';
  intensity: 'gentle' | 'moderate' | 'celebration';
  onAnimationComplete?: () => void;
  respectPrayerTime?: boolean;
  age: 'elementary' | 'middle' | 'high';
}

interface ConfettiParticle {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  shape: 'star' | 'circle' | 'geometric' | 'arabic';
  rotation: number;
  velocity: { x: number; y: number };
  gravity: number;
  culturalPattern?: string;
}

export const AchievementConfetti: React.FC<AchievementConfettiProps> = ({
  visible,
  achievementType,
  culturalTheme,
  intensity,
  onAnimationComplete,
  respectPrayerTime = true,
  age,
}) => {
  const animationProgress = useSharedValue(0);
  const particles = useRef<ConfettiParticle[]>([]);
  const animationRef = useRef<NodeJS.Timeout>();

  // Islamic cultural colors (respecting visual guidelines)
  const culturalColors = {
    islamic_star: ['#1D7452', '#2ECC71', '#F1C40F', '#E8F5E8'], // Green-based palette
    geometric_pattern: ['#3498DB', '#9B59B6', '#E67E22', '#ECF0F1'], // Blue-purple palette
    calligraphy: ['#2C3E50', '#34495E', '#BDC3C7', '#ECF0F1'], // Classic calligraphy colors
    traditional: ['#D35400', '#E67E22', '#F39C12', '#FEF9E7'], // Traditional Islamic colors
  };

  // Age-appropriate particle counts and sizes
  const ageConfigurations = {
    elementary: {
      particleCount: intensity === 'gentle' ? 15 : intensity === 'moderate' ? 25 : 40,
      particleSize: { min: 8, max: 16 },
      animationDuration: 2500,
    },
    middle: {
      particleCount: intensity === 'gentle' ? 12 : intensity === 'moderate' ? 20 : 30,
      particleSize: { min: 6, max: 12 },
      animationDuration: 2000,
    },
    high: {
      particleCount: intensity === 'gentle' ? 10 : intensity === 'moderate' ? 15 : 20,
      particleSize: { min: 4, max: 8 },
      animationDuration: 1500,
    },
  };

  const createIslamicStarPath = (size: number): string => {
    const points = 8; // Traditional Islamic 8-pointed star
    const outerRadius = size;
    const innerRadius = size * 0.4;
    let path = '';
    
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    }
    path += ' Z';
    return path;
  };

  const createGeometricPattern = (size: number): string => {
    // Simple geometric hexagon pattern
    const points = 6;
    const radius = size;
    let path = '';
    
    for (let i = 0; i <= points; i++) {
      const angle = (i * 2 * Math.PI) / points;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    }
    return path;
  };

  const generateParticles = (): ConfettiParticle[] => {
    const config = ageConfigurations[age];
    const colors = culturalColors[culturalTheme];
    const newParticles: ConfettiParticle[] = [];
    
    for (let i = 0; i < config.particleCount; i++) {
      const particle: ConfettiParticle = {
        id: `particle-${i}`,
        x: screenWidth * 0.5 + (Math.random() - 0.5) * 100, // Center spread
        y: screenHeight * 0.3 + (Math.random() - 0.5) * 50,
        size: Math.random() * (config.particleSize.max - config.particleSize.min) + config.particleSize.min,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: ['star', 'geometric', 'circle'][Math.floor(Math.random() * 3)] as 'star' | 'circle' | 'geometric',
        rotation: Math.random() * 360,
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: Math.random() * -3 - 2, // Upward initial velocity
        },
        gravity: 0.15,
      };
      
      newParticles.push(particle);
    }
    
    return newParticles;
  };

  const triggerHapticFeedback = () => {
    if (Platform.OS === 'ios') {
      switch (intensity) {
        case 'gentle':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'moderate':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'celebration':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }, 100);
          break;
      }
    }
  };

  const checkPrayerTimeRestriction = (): boolean => {
    if (!respectPrayerTime) return false;
    
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Approximate prayer times for Tashkent (simplified)
    const prayerTimes = [
      { start: 5, end: 6 }, // Fajr
      { start: 12, end: 13 }, // Dhuhr
      { start: 15, end: 16 }, // Asr
      { start: 18, end: 19 }, // Maghrib
      { start: 20, end: 21 }, // Isha
    ];
    
    return prayerTimes.some(prayer => 
      hour >= prayer.start && hour < prayer.end
    );
  };

  const startAnimation = () => {
    if (checkPrayerTimeRestriction()) {
      // Gentle animation during prayer times
      animationProgress.value = withTiming(1, {
        duration: 1000,
        easing: Easing.out(Easing.ease),
      }, (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)?.();
        }
      });
      return;
    }

    particles.current = generateParticles();
    triggerHapticFeedback();
    
    const config = ageConfigurations[age];
    
    animationProgress.value = withSequence(
      withTiming(1, {
        duration: config.animationDuration,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(0, {
        duration: 500,
        easing: Easing.in(Easing.cubic),
      }),
    );

    // Animation completion callback
    setTimeout(() => {
      onAnimationComplete?.();
    }, config.animationDuration + 500);
  };

  useEffect(() => {
    if (visible) {
      startAnimation();
    } else {
      animationProgress.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(animationProgress.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
      transform: [
        {
          scale: interpolate(animationProgress.value, [0, 0.1, 1], [0.5, 1.2, 1]),
        },
      ],
    };
  });

  const renderParticle = (particle: ConfettiParticle, progress: number) => {
    const animatedY = particle.y + particle.velocity.y * progress * 100 + 
                     0.5 * particle.gravity * Math.pow(progress * 100, 2);
    const animatedX = particle.x + particle.velocity.x * progress * 100;
    const animatedRotation = particle.rotation + progress * 720; // 2 full rotations
    const opacity = interpolate(progress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    switch (particle.shape) {
      case 'star':
        const starPath = createIslamicStarPath(particle.size);
        return (
          <Group
            key={particle.id}
            transform={[
              { translateX: animatedX },
              { translateY: animatedY },
              { rotate: (animatedRotation * Math.PI) / 180 },
            ]}
            opacity={opacity}
          >
            <Path
              path={starPath}
              color={particle.color}
              style="fill"
            />
          </Group>
        );

      case 'geometric':
        const hexPath = createGeometricPattern(particle.size);
        return (
          <Group
            key={particle.id}
            transform={[
              { translateX: animatedX },
              { translateY: animatedY },
              { rotate: (animatedRotation * Math.PI) / 180 },
            ]}
            opacity={opacity}
          >
            <Path
              path={hexPath}
              color={particle.color}
              style="fill"
            />
          </Group>
        );

      case 'circle':
      default:
        return (
          <Group
            key={particle.id}
            transform={[
              { translateX: animatedX },
              { translateY: animatedY },
            ]}
            opacity={opacity}
          >
            <Circle
              cx={0}
              cy={0}
              r={particle.size}
              color={particle.color}
            />
          </Group>
        );
    }
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      <Canvas style={styles.canvas}>
        <Group>
          {particles.current.map((particle) => 
            renderParticle(particle, animationProgress.value)
          )}
        </Group>
      </Canvas>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  canvas: {
    flex: 1,
  },
});

// Achievement-specific wrapper components
export const LessonCompleteConfetti: React.FC<{
  visible: boolean;
  onComplete?: () => void;
  age: 'elementary' | 'middle' | 'high';
}> = ({ visible, onComplete, age }) => (
  <AchievementConfetti
    visible={visible}
    achievementType="lesson_complete"
    culturalTheme="islamic_star"
    intensity="moderate"
    age={age}
    onAnimationComplete={onComplete}
  />
);

export const QuizPerfectConfetti: React.FC<{
  visible: boolean;
  onComplete?: () => void;
  age: 'elementary' | 'middle' | 'high';
}> = ({ visible, onComplete, age }) => (
  <AchievementConfetti
    visible={visible}
    achievementType="quiz_perfect"
    culturalTheme="geometric_pattern"
    intensity="celebration"
    age={age}
    onAnimationComplete={onComplete}
  />
);

export const StreakMilestoneConfetti: React.FC<{
  visible: boolean;
  onComplete?: () => void;
  age: 'elementary' | 'middle' | 'high';
}> = ({ visible, onComplete, age }) => (
  <AchievementConfetti
    visible={visible}
    achievementType="streak_milestone"
    culturalTheme="traditional"
    intensity="moderate"
    age={age}
    onAnimationComplete={onComplete}
  />
);

export const LevelUpConfetti: React.FC<{
  visible: boolean;
  onComplete?: () => void;
  age: 'elementary' | 'middle' | 'high';
}> = ({ visible, onComplete, age }) => (
  <AchievementConfetti
    visible={visible}
    achievementType="level_up"
    culturalTheme="calligraphy"
    intensity="celebration"
    age={age}
    onAnimationComplete={onComplete}
  />
);

export default AchievementConfetti;