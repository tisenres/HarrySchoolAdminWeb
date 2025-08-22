import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  Text,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withRepeat,
  runOnJS,
  interpolate,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import { Canvas, Group, Circle, Path, RadialGradient, vec, Text as SkiaText, useFont } from '@shopify/react-native-skia';
import { Haptics } from 'expo-haptics';
import LottieView from 'lottie-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface LevelUpCelebrationProps {
  visible: boolean;
  currentLevel: number;
  newLevel: number;
  achievementTitle: string;
  culturalTheme: 'islamic_calligraphy' | 'geometric_mandala' | 'star_burst' | 'traditional_pattern';
  celebrationIntensity: 'subtle' | 'moderate' | 'grand';
  onAnimationComplete?: () => void;
  respectPrayerTime?: boolean;
  age: 'elementary' | 'middle' | 'high';
  language: 'en' | 'uz' | 'ru' | 'ar';
}

interface LevelUpElements {
  background: {
    scale: Animated.SharedValue<number>;
    opacity: Animated.SharedValue<number>;
    rotation: Animated.SharedValue<number>;
  };
  badge: {
    scale: Animated.SharedValue<number>;
    position: Animated.SharedValue<number>;
    glow: Animated.SharedValue<number>;
  };
  particles: {
    progress: Animated.SharedValue<number>;
    count: number;
  };
  text: {
    scale: Animated.SharedValue<number>;
    opacity: Animated.SharedValue<number>;
    slide: Animated.SharedValue<number>;
  };
}

export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({
  visible,
  currentLevel,
  newLevel,
  achievementTitle,
  culturalTheme,
  celebrationIntensity,
  onAnimationComplete,
  respectPrayerTime = true,
  age,
  language,
}) => {
  // Animation values
  const backgroundScale = useSharedValue(0);
  const backgroundOpacity = useSharedValue(0);
  const backgroundRotation = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const badgePosition = useSharedValue(-200);
  const badgeGlow = useSharedValue(0);
  const particlesProgress = useSharedValue(0);
  const textScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textSlide = useSharedValue(50);
  const lottieRef = useRef<LottieView>(null);

  // Cultural color schemes
  const culturalColors = {
    islamic_calligraphy: {
      primary: '#1D7452',
      secondary: '#2ECC71',
      accent: '#F1C40F',
      background: '#E8F5E8',
      text: '#2C3E50',
    },
    geometric_mandala: {
      primary: '#3498DB',
      secondary: '#5DADE2',
      accent: '#9B59B6',
      background: '#EBF5FB',
      text: '#2C3E50',
    },
    star_burst: {
      primary: '#E67E22',
      secondary: '#F39C12',
      accent: '#F1C40F',
      background: '#FEF9E7',
      text: '#D35400',
    },
    traditional_pattern: {
      primary: '#8E44AD',
      secondary: '#A569BD',
      accent: '#E8DAEF',
      background: '#F4ECF7',
      text: '#6C3483',
    },
  };

  // Localized text content
  const localizedText = {
    levelUp: {
      en: 'Level Up!',
      uz: 'Daraja Oshdi!',
      ru: 'Новый Уровень!',
      ar: '!مستوى جديد',
    },
    level: {
      en: 'Level',
      uz: 'Daraja',
      ru: 'Уровень',
      ar: 'مستوى',
    },
    congratulations: {
      en: 'Congratulations!',
      uz: 'Tabriklaymiz!',
      ru: 'Поздравляем!',
      ar: '!مبروك',
    },
  };

  // Age-specific configurations
  const ageConfigurations = {
    elementary: {
      animationDuration: 3000,
      badgeSize: 120,
      textSize: 28,
      particleCount: 30,
      bounceHeight: 60,
    },
    middle: {
      animationDuration: 2500,
      badgeSize: 100,
      textSize: 24,
      particleCount: 25,
      bounceHeight: 50,
    },
    high: {
      animationDuration: 2000,
      badgeSize: 80,
      textSize: 20,
      particleCount: 20,
      bounceHeight: 40,
    },
  };

  const colors = culturalColors[culturalTheme];
  const config = ageConfigurations[age];
  const texts = localizedText;

  const createIslamicStarBadge = (size: number): string => {
    const points = 8;
    const outerRadius = size * 0.4;
    const innerRadius = size * 0.25;
    let path = '';
    
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2; // Start from top
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

  const createGeometricMandala = (size: number): string => {
    const layers = 3;
    let path = '';
    
    for (let layer = 0; layer < layers; layer++) {
      const radius = (size * 0.15) + (layer * size * 0.08);
      const points = 6 + (layer * 2);
      
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
      path += ' Z ';
    }
    
    return path;
  };

  const triggerHapticSequence = () => {
    if (Platform.OS === 'ios') {
      // Success notification
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Follow-up impact for celebration
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 200);
      
      if (celebrationIntensity === 'grand') {
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 400);
      }
    }
  };

  const checkPrayerTimeRestriction = (): boolean => {
    if (!respectPrayerTime) return false;
    
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Tashkent prayer times (simplified)
    const prayerTimes = [
      { start: { h: 5, m: 0 }, end: { h: 6, m: 0 } },
      { start: { h: 12, m: 0 }, end: { h: 13, m: 0 } },
      { start: { h: 15, m: 0 }, end: { h: 16, m: 0 } },
      { start: { h: 18, m: 0 }, end: { h: 19, m: 0 } },
      { start: { h: 20, m: 0 }, end: { h: 21, m: 0 } },
    ];
    
    return prayerTimes.some(prayer => 
      (hour > prayer.start.h || (hour === prayer.start.h && minute >= prayer.start.m)) &&
      (hour < prayer.end.h || (hour === prayer.end.h && minute < prayer.end.m))
    );
  };

  const startCelebrationAnimation = () => {
    const isPrayerTime = checkPrayerTimeRestriction();
    const durationMultiplier = isPrayerTime ? 1.5 : 1;
    const intensityMultiplier = isPrayerTime ? 0.7 : 1;
    
    // Trigger haptics
    triggerHapticFeedback();
    
    // Start Lottie animation if available
    lottieRef.current?.play();

    // Sequence 1: Background emergence (0-800ms)
    backgroundScale.value = withSpring(1.2 * intensityMultiplier, {
      damping: 15,
      stiffness: 200,
    });
    
    backgroundOpacity.value = withTiming(0.9, {
      duration: 600 * durationMultiplier,
      easing: Easing.out(Easing.cubic),
    });

    backgroundRotation.value = withRepeat(
      withTiming(360, {
        duration: 8000 * durationMultiplier,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Sequence 2: Badge entrance (200-1200ms)
    setTimeout(() => {
      badgePosition.value = withSpring(0, {
        damping: 12,
        stiffness: 180,
      });
      
      badgeScale.value = withSequence(
        withSpring(1.3 * intensityMultiplier, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
      
      badgeGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        true
      );
    }, 200 * durationMultiplier);

    // Sequence 3: Particle explosion (400-2000ms)
    setTimeout(() => {
      particlesProgress.value = withTiming(1, {
        duration: 1600 * durationMultiplier,
        easing: Easing.out(Easing.cubic),
      });
    }, 400 * durationMultiplier);

    // Sequence 4: Text animations (600-1800ms)
    setTimeout(() => {
      textSlide.value = withSpring(0, {
        damping: 15,
        stiffness: 200,
      });
      
      textScale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
      
      textOpacity.value = withTiming(1, {
        duration: 600 * durationMultiplier,
        easing: Easing.out(Easing.cubic),
      });
    }, 600 * durationMultiplier);

    // Sequence 5: Exit animation (2500-3000ms)
    setTimeout(() => {
      backgroundOpacity.value = withTiming(0, {
        duration: 500 * durationMultiplier,
        easing: Easing.in(Easing.cubic),
      });
      
      badgeScale.value = withTiming(0, {
        duration: 400 * durationMultiplier,
      });
      
      textOpacity.value = withTiming(0, {
        duration: 400 * durationMultiplier,
      });
    }, (config.animationDuration - 500) * durationMultiplier);

    // Animation completion
    setTimeout(() => {
      onAnimationComplete?.();
    }, config.animationDuration * durationMultiplier);
  };

  const triggerHapticFeedback = () => {
    triggerHapticSequence();
  };

  useEffect(() => {
    if (visible) {
      startCelebrationAnimation();
    } else {
      // Reset all values
      backgroundScale.value = 0;
      backgroundOpacity.value = 0;
      backgroundRotation.value = 0;
      badgeScale.value = 0;
      badgePosition.value = -200;
      badgeGlow.value = 0;
      particlesProgress.value = 0;
      textScale.value = 0;
      textOpacity.value = 0;
      textSlide.value = 50;
    }
  }, [visible]);

  // Animated styles
  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: backgroundScale.value },
        { rotate: `${backgroundRotation.value}deg` },
      ],
      opacity: backgroundOpacity.value,
    };
  });

  const badgeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: badgePosition.value },
        { scale: badgeScale.value },
      ],
    };
  });

  const glowAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: badgeGlow.value * 0.8,
      transform: [
        { scale: 1 + badgeGlow.value * 0.3 },
      ],
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: textSlide.value },
        { scale: textScale.value },
      ],
      opacity: textOpacity.value,
    };
  });

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Background pattern */}
      <Animated.View style={[styles.background, backgroundAnimatedStyle]}>
        <Canvas style={styles.backgroundCanvas}>
          <Circle
            cx={screenWidth / 2}
            cy={screenHeight / 2}
            r={Math.max(screenWidth, screenHeight) * 0.6}
          >
            <RadialGradient
              c={vec(screenWidth / 2, screenHeight / 2)}
              r={Math.max(screenWidth, screenHeight) * 0.6}
              colors={[colors.background, 'transparent']}
            />
          </Circle>

          {/* Cultural pattern overlay */}
          <Group
            transform={[
              { translateX: screenWidth / 2 },
              { translateY: screenHeight / 2 },
            ]}
          >
            {culturalTheme === 'islamic_calligraphy' && (
              <Path
                path={createIslamicStarBadge(200)}
                color={colors.accent}
                style="fill"
                opacity={0.3}
              />
            )}
            {culturalTheme === 'geometric_mandala' && (
              <Path
                path={createGeometricMandala(200)}
                color={colors.accent}
                style="fill"
                opacity={0.3}
              />
            )}
          </Group>
        </Canvas>
      </Animated.View>

      {/* Lottie animation overlay */}
      <LottieView
        ref={lottieRef}
        source={require('../assets/lottie/level-up-celebration.json')}
        style={styles.lottie}
        autoPlay={false}
        loop={false}
        colorFilters={[
          {
            keypath: "star",
            color: colors.primary,
          },
          {
            keypath: "particles",
            color: colors.secondary,
          },
        ]}
      />

      {/* Level badge */}
      <Animated.View style={[styles.badgeContainer, badgeAnimatedStyle]}>
        {/* Badge glow */}
        <Animated.View style={[styles.badgeGlow, glowAnimatedStyle]}>
          <Canvas style={styles.badgeCanvas}>
            <Circle
              cx={config.badgeSize / 2}
              cy={config.badgeSize / 2}
              r={config.badgeSize / 2 + 10}
              color={colors.secondary}
              opacity={0.6}
            />
          </Canvas>
        </Animated.View>

        {/* Main badge */}
        <Canvas style={styles.badgeCanvas}>
          {/* Badge background */}
          <Circle
            cx={config.badgeSize / 2}
            cy={config.badgeSize / 2}
            r={config.badgeSize / 2}
          >
            <RadialGradient
              c={vec(config.badgeSize / 2, config.badgeSize / 2)}
              r={config.badgeSize / 2}
              colors={[colors.secondary, colors.primary]}
            />
          </Circle>

          {/* Cultural badge pattern */}
          <Group
            transform={[
              { translateX: config.badgeSize / 2 },
              { translateY: config.badgeSize / 2 },
            ]}
          >
            <Path
              path={createIslamicStarBadge(config.badgeSize)}
              color={colors.accent}
              style="fill"
              opacity={0.9}
            />
          </Group>

          {/* Badge border */}
          <Circle
            cx={config.badgeSize / 2}
            cy={config.badgeSize / 2}
            r={config.badgeSize / 2 - 3}
            color={colors.accent}
            style="stroke"
            strokeWidth={3}
          />
        </Canvas>

        {/* Level number overlay */}
        <View style={styles.levelNumberContainer}>
          <Text style={[styles.levelNumber, { color: colors.text, fontSize: config.textSize }]}>
            {newLevel}
          </Text>
        </View>
      </Animated.View>

      {/* Celebration text */}
      <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
        <Text style={[styles.mainText, { color: colors.primary, fontSize: config.textSize }]}>
          {texts.levelUp[language]}
        </Text>
        <Text style={[styles.subText, { color: colors.text, fontSize: config.textSize * 0.6 }]}>
          {texts.level[language]} {newLevel}
        </Text>
        {achievementTitle && (
          <Text style={[styles.achievementText, { color: colors.secondary, fontSize: config.textSize * 0.5 }]}>
            {achievementTitle}
          </Text>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    bottom: -100,
  },
  backgroundCanvas: {
    flex: 1,
  },
  lottie: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
  },
  badgeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  badgeGlow: {
    position: 'absolute',
  },
  badgeCanvas: {
    width: 140,
    height: 140,
  },
  levelNumberContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  levelNumber: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  mainText: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementText: {
    fontWeight: '500',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default LevelUpCelebration;