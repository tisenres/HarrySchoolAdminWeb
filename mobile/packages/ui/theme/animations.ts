/**
 * Harry School Mobile Design System - Animation System
 * 
 * Comprehensive animation configurations using React Native Reanimated v3
 * Designed for educational context with delightful, professional micro-interactions
 */

import React from 'react';
import { 
  Easing,
  interpolate,
  interpolateColor,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  runOnJS,
  Extrapolate,
} from 'react-native-reanimated';
import { Haptics } from 'expo-haptics';
import { AccessibilityInfo } from 'react-native';

// Animation timing constants
export const animationTimings = {
  // Micro-interactions (instant feedback)
  micro: 150,
  // Quick transitions (button presses, hover states)
  quick: 250,
  // Standard animations (modals, navigation)
  standard: 300,
  // Slower animations (complex transitions)
  slow: 500,
  // Educational moments (celebrations, achievements)
  celebration: 800,
  // Loading states
  loading: 1200,
} as const;

// Spring physics configurations for different interaction types
export const springConfigs = {
  // Gentle spring for UI elements
  gentle: {
    damping: 20,
    stiffness: 300,
    mass: 0.5,
  },
  // Bouncy spring for playful interactions
  bouncy: {
    damping: 10,
    stiffness: 300,
    mass: 0.8,
  },
  // Smooth spring for professional interactions
  smooth: {
    damping: 25,
    stiffness: 400,
    mass: 0.3,
  },
  // Quick snap for instant feedback
  snap: {
    damping: 30,
    stiffness: 600,
    mass: 0.2,
  },
  // Celebration spring for achievements
  celebration: {
    damping: 8,
    stiffness: 200,
    mass: 1.2,
  },
} as const;

// Easing curves for different animation types
export const easingCurves = {
  // Standard easing for most animations
  easeOut: Easing.out(Easing.cubic),
  easeIn: Easing.in(Easing.cubic),
  easeInOut: Easing.inOut(Easing.cubic),
  
  // Educational-specific easing
  educational: Easing.bezier(0.4, 0.0, 0.2, 1), // Material Design
  playful: Easing.bezier(0.68, -0.55, 0.265, 1.55), // Back ease out
  gentle: Easing.bezier(0.25, 0.1, 0.25, 1), // Gentle ease
  
  // Performance curves
  linear: Easing.linear,
  elastic: Easing.elastic(1.5),
} as const;

// Accessibility helper to check if animations should be reduced
export const useReducedMotion = () => {
  const [isReducedMotion, setIsReducedMotion] = React.useState(false);
  
  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReducedMotion);
    
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReducedMotion
    );
    
    return () => subscription?.remove();
  }, []);
  
  return isReducedMotion;
};

// 1. BUTTON INTERACTIONS
export const buttonAnimations = {
  // Press animation with haptic feedback
  usePress: (hapticType: 'light' | 'medium' | 'heavy' = 'light') => {
    const scale = useSharedValue(1);
    const isReducedMotion = useReducedMotion();
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));
    
    const onPressIn = () => {
      if (!isReducedMotion) {
        scale.value = withSpring(0.95, springConfigs.snap);
      }
      runOnJS(Haptics.impactAsync)(
        hapticType === 'light' ? Haptics.ImpactFeedbackStyle.Light :
        hapticType === 'medium' ? Haptics.ImpactFeedbackStyle.Medium :
        Haptics.ImpactFeedbackStyle.Heavy
      );
    };
    
    const onPressOut = () => {
      if (!isReducedMotion) {
        scale.value = withSpring(1, springConfigs.gentle);
      }
    };
    
    return { animatedStyle, onPressIn, onPressOut };
  },
  
  // Loading state animation
  useLoading: () => {
    const rotation = useSharedValue(0);
    const opacity = useSharedValue(0.6);
    const isReducedMotion = useReducedMotion();
    
    React.useEffect(() => {
      if (!isReducedMotion) {
        rotation.value = withRepeat(
          withTiming(360, { duration: animationTimings.loading, easing: easingCurves.linear }),
          -1
        );
        opacity.value = withRepeat(
          withSequence(
            withTiming(1, { duration: animationTimings.quick }),
            withTiming(0.6, { duration: animationTimings.quick })
          ),
          -1,
          true
        );
      }
    }, [isReducedMotion]);
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotation.value}deg` }],
      opacity: opacity.value,
    }));
    
    return animatedStyle;
  },
  
  // Success state animation
  useSuccess: () => {
    const scale = useSharedValue(1);
    const isReducedMotion = useReducedMotion();
    
    const triggerSuccess = () => {
      if (!isReducedMotion) {
        scale.value = withSequence(
          withSpring(1.1, springConfigs.bouncy),
          withSpring(1, springConfigs.gentle)
        );
      }
      runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));
    
    return { animatedStyle, triggerSuccess };
  },
};

// 2. EDUCATIONAL COMPONENT ANIMATIONS
export const educationalAnimations = {
  // Vocabulary card flip animation
  useCardFlip: () => {
    const rotateY = useSharedValue(0);
    const isReducedMotion = useReducedMotion();
    
    const frontAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ rotateY: `${rotateY.value}deg` }],
      backfaceVisibility: 'hidden',
    }));
    
    const backAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ rotateY: `${rotateY.value + 180}deg` }],
      backfaceVisibility: 'hidden',
    }));
    
    const flip = () => {
      if (!isReducedMotion) {
        rotateY.value = withTiming(
          rotateY.value === 0 ? 180 : 0,
          { duration: animationTimings.standard, easing: easingCurves.educational }
        );
      }
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    };
    
    return { frontAnimatedStyle, backAnimatedStyle, flip };
  },
  
  // Progress bar animation with satisfying easing
  useProgressBar: (progress: number) => {
    const width = useSharedValue(0);
    const isReducedMotion = useReducedMotion();
    
    React.useEffect(() => {
      if (!isReducedMotion) {
        width.value = withTiming(progress, {
          duration: animationTimings.slow,
          easing: easingCurves.educational,
        });
      } else {
        width.value = progress;
      }
    }, [progress, isReducedMotion]);
    
    const animatedStyle = useAnimatedStyle(() => ({
      width: `${width.value}%`,
    }));
    
    return animatedStyle;
  },
  
  // Ranking badge celebration
  useRankingCelebration: () => {
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);
    const opacity = useSharedValue(1);
    const isReducedMotion = useReducedMotion();
    
    const celebrate = () => {
      if (!isReducedMotion) {
        scale.value = withSequence(
          withSpring(0.8, springConfigs.snap),
          withSpring(1.2, springConfigs.celebration),
          withSpring(1, springConfigs.gentle)
        );
        
        rotation.value = withSequence(
          withTiming(-10, { duration: animationTimings.micro }),
          withTiming(10, { duration: animationTimings.micro }),
          withTiming(0, { duration: animationTimings.micro })
        );
      }
      
      runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ],
      opacity: opacity.value,
    }));
    
    return { animatedStyle, celebrate };
  },
  
  // Achievement unlock animation
  useAchievementUnlock: () => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(50);
    const isReducedMotion = useReducedMotion();
    
    const unlock = () => {
      if (!isReducedMotion) {
        scale.value = withSpring(1, springConfigs.celebration);
        opacity.value = withTiming(1, { duration: animationTimings.standard });
        translateY.value = withSpring(0, springConfigs.bouncy);
      } else {
        scale.value = 1;
        opacity.value = 1;
        translateY.value = 0;
      }
      
      runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scale.value },
        { translateY: translateY.value }
      ],
      opacity: opacity.value,
    }));
    
    return { animatedStyle, unlock };
  },
};

// 3. NAVIGATION ANIMATIONS
export const navigationAnimations = {
  // Tab bar icon bounce
  useTabBounce: () => {
    const scale = useSharedValue(1);
    const isReducedMotion = useReducedMotion();
    
    const bounce = () => {
      if (!isReducedMotion) {
        scale.value = withSequence(
          withSpring(1.2, springConfigs.bouncy),
          withSpring(1, springConfigs.gentle)
        );
      }
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));
    
    return { animatedStyle, bounce };
  },
  
  // Modal slide animation
  useModalSlide: (visible: boolean) => {
    const translateY = useSharedValue(300);
    const opacity = useSharedValue(0);
    const isReducedMotion = useReducedMotion();
    
    React.useEffect(() => {
      if (visible) {
        if (!isReducedMotion) {
          translateY.value = withSpring(0, springConfigs.smooth);
          opacity.value = withTiming(1, { duration: animationTimings.standard });
        } else {
          translateY.value = 0;
          opacity.value = 1;
        }
      } else {
        if (!isReducedMotion) {
          translateY.value = withTiming(300, { duration: animationTimings.quick });
          opacity.value = withTiming(0, { duration: animationTimings.quick });
        } else {
          translateY.value = 300;
          opacity.value = 0;
        }
      }
    }, [visible, isReducedMotion]);
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    }));
    
    return animatedStyle;
  },
  
  // Screen transition fade
  useScreenFade: (isActive: boolean) => {
    const opacity = useSharedValue(isActive ? 1 : 0);
    const isReducedMotion = useReducedMotion();
    
    React.useEffect(() => {
      if (!isReducedMotion) {
        opacity.value = withTiming(
          isActive ? 1 : 0,
          { duration: animationTimings.standard, easing: easingCurves.easeInOut }
        );
      } else {
        opacity.value = isActive ? 1 : 0;
      }
    }, [isActive, isReducedMotion]);
    
    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));
    
    return animatedStyle;
  },
};

// 4. FEEDBACK ANIMATIONS
export const feedbackAnimations = {
  // Form validation shake
  useValidationShake: () => {
    const translateX = useSharedValue(0);
    const isReducedMotion = useReducedMotion();
    
    const shake = () => {
      if (!isReducedMotion) {
        translateX.value = withSequence(
          withTiming(-10, { duration: animationTimings.micro }),
          withTiming(10, { duration: animationTimings.micro }),
          withTiming(-10, { duration: animationTimings.micro }),
          withTiming(0, { duration: animationTimings.micro })
        );
      }
      runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Error);
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
    }));
    
    return { animatedStyle, shake };
  },
  
  // Success checkmark animation
  useCheckmark: () => {
    const scale = useSharedValue(0);
    const rotation = useSharedValue(-45);
    const isReducedMotion = useReducedMotion();
    
    const show = () => {
      if (!isReducedMotion) {
        scale.value = withSpring(1, springConfigs.bouncy);
        rotation.value = withTiming(0, { duration: animationTimings.standard });
      } else {
        scale.value = 1;
        rotation.value = 0;
      }
      runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ],
    }));
    
    return { animatedStyle, show };
  },
  
  // Connection status pulse
  useConnectionPulse: (isConnected: boolean) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    const isReducedMotion = useReducedMotion();
    
    React.useEffect(() => {
      if (!isConnected && !isReducedMotion) {
        scale.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: animationTimings.quick }),
            withTiming(1, { duration: animationTimings.quick })
          ),
          -1,
          true
        );
        opacity.value = withRepeat(
          withSequence(
            withTiming(0.7, { duration: animationTimings.quick }),
            withTiming(1, { duration: animationTimings.quick })
          ),
          -1,
          true
        );
      } else {
        scale.value = withTiming(1, { duration: animationTimings.quick });
        opacity.value = withTiming(1, { duration: animationTimings.quick });
      }
    }, [isConnected, isReducedMotion]);
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));
    
    return animatedStyle;
  },
};

// 5. TEACHER EFFICIENCY ANIMATIONS
export const teacherAnimations = {
  // Quick attendance marking animation (100-150ms)
  useAttendanceCheck: () => {
    const scale = useSharedValue(1);
    const checkOpacity = useSharedValue(0);
    const isReducedMotion = useReducedMotion();
    
    const markAttendance = (isPresent: boolean) => {
      if (!isReducedMotion) {
        scale.value = withSequence(
          withTiming(0.9, { duration: animationTimings.micro }),
          withTiming(1.1, { duration: animationTimings.micro }),
          withTiming(1, { duration: animationTimings.micro })
        );
        
        checkOpacity.value = withTiming(
          isPresent ? 1 : 0, 
          { duration: animationTimings.quick }
        );
      } else {
        checkOpacity.value = isPresent ? 1 : 0;
      }
      
      runOnJS(Haptics.impactAsync)(
        isPresent ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
      );
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));
    
    const checkStyle = useAnimatedStyle(() => ({
      opacity: checkOpacity.value,
    }));
    
    return { animatedStyle, checkStyle, markAttendance };
  },
  
  // Quick form submission feedback (150ms)
  useQuickSubmit: () => {
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const isReducedMotion = useReducedMotion();
    
    const submitSuccess = () => {
      if (!isReducedMotion) {
        scale.value = withSequence(
          withTiming(0.95, { duration: 75 }),
          withTiming(1.05, { duration: 75 }),
          withTiming(1, { duration: 75 })
        );
        
        translateY.value = withSequence(
          withTiming(-2, { duration: 75 }),
          withTiming(0, { duration: 150 })
        );
      }
      
      runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scale.value },
        { translateY: translateY.value }
      ],
    }));
    
    return { animatedStyle, submitSuccess };
  },
  
  // Efficient skeleton loading for teacher lists
  useSkeletonLoader: () => {
    const opacity = useSharedValue(0.3);
    const isReducedMotion = useReducedMotion();
    
    React.useEffect(() => {
      if (!isReducedMotion) {
        opacity.value = withRepeat(
          withSequence(
            withTiming(0.8, { duration: animationTimings.slow }),
            withTiming(0.3, { duration: animationTimings.slow })
          ),
          -1,
          true
        );
      }
    }, [isReducedMotion]);
    
    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));
    
    return animatedStyle;
  },
  
  // Quick tab switching for efficient navigation
  useQuickTabSwitch: () => {
    const translateX = useSharedValue(0);
    const opacity = useSharedValue(1);
    const isReducedMotion = useReducedMotion();
    
    const switchTab = (direction: 'left' | 'right') => {
      if (!isReducedMotion) {
        const moveDistance = direction === 'left' ? -5 : 5;
        translateX.value = withSequence(
          withTiming(moveDistance, { duration: animationTimings.micro }),
          withTiming(0, { duration: animationTimings.micro })
        );
        
        opacity.value = withSequence(
          withTiming(0.7, { duration: animationTimings.micro }),
          withTiming(1, { duration: animationTimings.micro })
        );
      }
      
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    }));
    
    return { animatedStyle, switchTab };
  },
};

// 6. STUDENT ENGAGEMENT ANIMATIONS
export const engagementAnimations = {
  // Point earning celebration with count-up
  usePointEarning: (points: number) => {
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);
    const pointCount = useSharedValue(0);
    const isReducedMotion = useReducedMotion();
    
    const earnPoints = () => {
      if (!isReducedMotion) {
        scale.value = withSequence(
          withSpring(1.3, springConfigs.bouncy),
          withSpring(1, springConfigs.gentle)
        );
        
        translateY.value = withSequence(
          withTiming(-20, { duration: animationTimings.standard }),
          withTiming(0, { duration: animationTimings.standard })
        );
        
        pointCount.value = withTiming(points, {
          duration: animationTimings.celebration,
          easing: easingCurves.easeOut,
        });
      } else {
        pointCount.value = points;
      }
      
      runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scale.value },
        { translateY: translateY.value }
      ],
      opacity: opacity.value,
    }));
    
    const pointStyle = useAnimatedStyle(() => ({
      // Can be used to animate the point counter
    }));
    
    return { animatedStyle, pointStyle, earnPoints, pointCount };
  },
  
  // Level up celebration
  useLevelUp: () => {
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);
    const particles = useSharedValue(0);
    const isReducedMotion = useReducedMotion();
    
    const levelUp = () => {
      if (!isReducedMotion) {
        scale.value = withSequence(
          withSpring(0.8, springConfigs.snap),
          withSpring(1.4, springConfigs.celebration),
          withSpring(1, springConfigs.gentle)
        );
        
        rotation.value = withTiming(360, {
          duration: animationTimings.celebration,
          easing: easingCurves.easeOut,
        });
        
        particles.value = withTiming(1, {
          duration: animationTimings.celebration,
        });
      }
      
      runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ],
    }));
    
    return { animatedStyle, levelUp };
  },
  
  // Streak maintenance animation
  useStreakMaintenance: (streakCount: number) => {
    const scale = useSharedValue(1);
    const glow = useSharedValue(0);
    const isReducedMotion = useReducedMotion();
    
    React.useEffect(() => {
      if (streakCount > 0 && !isReducedMotion) {
        glow.value = withRepeat(
          withSequence(
            withTiming(0.3, { duration: animationTimings.slow }),
            withTiming(0, { duration: animationTimings.slow })
          ),
          -1,
          true
        );
      }
    }, [streakCount, isReducedMotion]);
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      shadowOpacity: glow.value,
      shadowRadius: interpolate(glow.value, [0, 0.3], [0, 10]),
    }));
    
    return animatedStyle;
  },
  
  // Reward claim animation
  useRewardClaim: () => {
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);
    const isReducedMotion = useReducedMotion();
    
    const claimReward = () => {
      if (!isReducedMotion) {
        scale.value = withSequence(
          withSpring(1.1, springConfigs.bouncy),
          withSpring(0.9, springConfigs.gentle),
          withSpring(1, springConfigs.smooth)
        );
        
        translateY.value = withSequence(
          withTiming(-30, { duration: animationTimings.standard }),
          withDelay(animationTimings.micro, withTiming(0, { duration: animationTimings.standard }))
        );
        
        opacity.value = withSequence(
          withTiming(0.8, { duration: animationTimings.micro }),
          withTiming(1, { duration: animationTimings.standard })
        );
      }
      
      runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scale.value },
        { translateY: translateY.value }
      ],
      opacity: opacity.value,
    }));
    
    return { animatedStyle, claimReward };
  },
};

// 7. EDUCATIONAL MILESTONE ANIMATIONS
export const milestoneAnimations = {
  // Lesson completion celebration
  useLessonCompletion: () => {
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);
    const particles = useSharedValue(0);
    const glow = useSharedValue(0);
    const isReducedMotion = useReducedMotion();
    
    const completLesson = () => {
      if (!isReducedMotion) {
        scale.value = withSequence(
          withSpring(0.8, springConfigs.snap),
          withSpring(1.3, springConfigs.celebration),
          withSpring(1, springConfigs.gentle)
        );
        
        rotation.value = withTiming(180, {
          duration: animationTimings.celebration,
          easing: easingCurves.playful,
        });
        
        glow.value = withSequence(
          withTiming(1, { duration: animationTimings.standard }),
          withDelay(animationTimings.celebration, withTiming(0, { duration: animationTimings.slow }))
        );
        
        particles.value = withTiming(1, { duration: animationTimings.celebration });
      }
      
      runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ],
      shadowOpacity: glow.value * 0.3,
      shadowRadius: interpolate(glow.value, [0, 1], [0, 20]),
      shadowColor: '#4CAF50',
    }));
    
    return { animatedStyle, completLesson, particles };
  },
  
  // Weekly goal achievement
  useWeeklyGoal: (progress: number) => {
    const fillWidth = useSharedValue(0);
    const sparkle = useSharedValue(0);
    const isReducedMotion = useReducedMotion();
    
    React.useEffect(() => {
      if (!isReducedMotion) {
        fillWidth.value = withTiming(progress, {
          duration: animationTimings.celebration,
          easing: easingCurves.educational,
        });
        
        if (progress >= 100) {
          sparkle.value = withRepeat(
            withSequence(
              withTiming(1, { duration: animationTimings.quick }),
              withTiming(0, { duration: animationTimings.quick })
            ),
            3,
            true
          );
        }
      } else {
        fillWidth.value = progress;
      }
    }, [progress, isReducedMotion]);
    
    const fillStyle = useAnimatedStyle(() => ({
      width: `${fillWidth.value}%`,
    }));
    
    const sparkleStyle = useAnimatedStyle(() => ({
      opacity: sparkle.value,
      transform: [{ scale: interpolate(sparkle.value, [0, 1], [0.8, 1.2]) }],
    }));
    
    return { fillStyle, sparkleStyle };
  },
  
  // Perfect score celebration
  usePerfectScore: () => {
    const scale = useSharedValue(1);
    const confetti = useSharedValue(0);
    const rainbow = useSharedValue(0);
    const isReducedMotion = useReducedMotion();
    
    const celebratePerfectScore = () => {
      if (!isReducedMotion) {
        scale.value = withSequence(
          withSpring(1.5, springConfigs.celebration),
          withSpring(1, springConfigs.gentle)
        );
        
        confetti.value = withTiming(1, { duration: animationTimings.celebration });
        
        rainbow.value = withSequence(
          withTiming(1, { duration: animationTimings.standard }),
          withDelay(animationTimings.celebration, withTiming(0, { duration: animationTimings.slow }))
        );
      }
      
      runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));
    
    const confettiStyle = useAnimatedStyle(() => ({
      opacity: confetti.value,
    }));
    
    return { animatedStyle, confettiStyle, celebratePerfectScore, rainbow };
  },
  
  // First-time achievement unlock
  useFirstTimeAchievement: () => {
    const scale = useSharedValue(0);
    const rotation = useSharedValue(-180);
    const glow = useSharedValue(0);
    const bounce = useSharedValue(0);
    const isReducedMotion = useReducedMotion();
    
    const unlockFirstTime = () => {
      if (!isReducedMotion) {
        scale.value = withSpring(1, springConfigs.celebration);
        
        rotation.value = withTiming(0, {
          duration: animationTimings.celebration,
          easing: easingCurves.playful,
        });
        
        glow.value = withSequence(
          withTiming(1, { duration: animationTimings.standard }),
          withDelay(500, withTiming(0, { duration: animationTimings.slow }))
        );
        
        // Multiple bounces for extra celebration
        bounce.value = withSequence(
          withDelay(200, withSpring(1.2, springConfigs.bouncy)),
          withSpring(1, springConfigs.gentle),
          withDelay(100, withSpring(1.1, springConfigs.bouncy)),
          withSpring(1, springConfigs.gentle)
        );
      } else {
        scale.value = 1;
        rotation.value = 0;
      }
      
      runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scale.value * bounce.value },
        { rotate: `${rotation.value}deg` }
      ],
      shadowOpacity: glow.value * 0.5,
      shadowRadius: interpolate(glow.value, [0, 1], [0, 30]),
      shadowColor: '#FFD700',
    }));
    
    return { animatedStyle, unlockFirstTime };
  },
};

// 8. VOCABULARY LEARNING SPECIFIC ANIMATIONS
export const vocabularyAnimations = {
  // Word mastery progress
  useWordMastery: (masteryLevel: number) => {
    const progress = useSharedValue(0);
    const glow = useSharedValue(0);
    const isReducedMotion = useReducedMotion();
    
    React.useEffect(() => {
      if (!isReducedMotion) {
        progress.value = withTiming(masteryLevel, {
          duration: animationTimings.slow,
          easing: easingCurves.educational,
        });
        
        if (masteryLevel >= 80) {
          glow.value = withRepeat(
            withSequence(
              withTiming(0.8, { duration: animationTimings.slow }),
              withTiming(0.3, { duration: animationTimings.slow })
            ),
            -1,
            true
          );
        }
      } else {
        progress.value = masteryLevel;
      }
    }, [masteryLevel, isReducedMotion]);
    
    const progressStyle = useAnimatedStyle(() => ({
      width: `${progress.value}%`,
    }));
    
    const glowStyle = useAnimatedStyle(() => ({
      opacity: glow.value,
    }));
    
    return { progressStyle, glowStyle };
  },
  
  // Pronunciation attempt feedback
  usePronunciationFeedback: () => {
    const scale = useSharedValue(1);
    const color = useSharedValue(0);
    const isReducedMotion = useReducedMotion();
    
    const giveFeedback = (isCorrect: boolean) => {
      if (!isReducedMotion) {
        scale.value = withSequence(
          withSpring(isCorrect ? 1.15 : 0.95, springConfigs.bouncy),
          withSpring(1, springConfigs.gentle)
        );
        
        color.value = withSequence(
          withTiming(isCorrect ? 1 : -1, { duration: animationTimings.quick }),
          withDelay(animationTimings.standard, withTiming(0, { duration: animationTimings.quick }))
        );
      }
      
      runOnJS(Haptics.notificationAsync)(
        isCorrect 
          ? Haptics.NotificationFeedbackType.Success 
          : Haptics.NotificationFeedbackType.Error
      );
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      backgroundColor: interpolateColor(
        color.value,
        [-1, 0, 1],
        ['#ffebee', 'transparent', '#e8f5e8']
      ),
    }));
    
    return { animatedStyle, giveFeedback };
  },
  
  // Translation reveal animation
  useTranslationReveal: () => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);
    const isReducedMotion = useReducedMotion();
    
    const revealTranslation = () => {
      if (!isReducedMotion) {
        opacity.value = withTiming(1, {
          duration: animationTimings.standard,
          easing: easingCurves.gentle,
        });
        
        translateY.value = withSpring(0, springConfigs.smooth);
      } else {
        opacity.value = 1;
        translateY.value = 0;
      }
    };
    
    const hideTranslation = () => {
      if (!isReducedMotion) {
        opacity.value = withTiming(0, { duration: animationTimings.quick });
        translateY.value = withTiming(20, { duration: animationTimings.quick });
      } else {
        opacity.value = 0;
        translateY.value = 20;
      }
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    }));
    
    return { animatedStyle, revealTranslation, hideTranslation };
  },
};

// Utility animations for common patterns
export const utilityAnimations = {
  // Fade in/out
  useFade: (visible: boolean) => {
    const opacity = useSharedValue(visible ? 1 : 0);
    const isReducedMotion = useReducedMotion();
    
    React.useEffect(() => {
      if (!isReducedMotion) {
        opacity.value = withTiming(
          visible ? 1 : 0,
          { duration: animationTimings.standard, easing: easingCurves.easeInOut }
        );
      } else {
        opacity.value = visible ? 1 : 0;
      }
    }, [visible, isReducedMotion]);
    
    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));
    
    return animatedStyle;
  },
  
  // Scale in/out
  useScale: (visible: boolean) => {
    const scale = useSharedValue(visible ? 1 : 0);
    const isReducedMotion = useReducedMotion();
    
    React.useEffect(() => {
      if (!isReducedMotion) {
        scale.value = withSpring(visible ? 1 : 0, springConfigs.gentle);
      } else {
        scale.value = visible ? 1 : 0;
      }
    }, [visible, isReducedMotion]);
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));
    
    return animatedStyle;
  },
  
  // Slide in/out
  useSlide: (visible: boolean, direction: 'up' | 'down' | 'left' | 'right' = 'up') => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const isReducedMotion = useReducedMotion();
    
    const getInitialValue = () => {
      switch (direction) {
        case 'up': return { x: 0, y: 50 };
        case 'down': return { x: 0, y: -50 };
        case 'left': return { x: 50, y: 0 };
        case 'right': return { x: -50, y: 0 };
      }
    };
    
    React.useEffect(() => {
      const initial = getInitialValue();
      
      if (!isReducedMotion) {
        translateX.value = withSpring(visible ? 0 : initial.x, springConfigs.smooth);
        translateY.value = withSpring(visible ? 0 : initial.y, springConfigs.smooth);
      } else {
        translateX.value = visible ? 0 : initial.x;
        translateY.value = visible ? 0 : initial.y;
      }
    }, [visible, direction, isReducedMotion]);
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value }
      ],
    }));
    
    return animatedStyle;
  },
};

// Export all animation modules
export const animations = {
  timings: animationTimings,
  springs: springConfigs,
  easings: easingCurves,
  button: buttonAnimations,
  educational: educationalAnimations,
  navigation: navigationAnimations,
  feedback: feedbackAnimations,
  teacher: teacherAnimations,
  engagement: engagementAnimations,
  milestone: milestoneAnimations,
  vocabulary: vocabularyAnimations,
  utility: utilityAnimations,
  useReducedMotion,
};

export default animations;