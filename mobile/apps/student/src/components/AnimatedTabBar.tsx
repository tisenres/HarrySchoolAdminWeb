/**
 * Enhanced Animated Tab Bar - Harry School Student App
 * 
 * Age-appropriate navigation component optimized for educational context with:
 * - Age-specific adaptations (10-12 vs 13-18 years)
 * - Educational micro-animations and celebrations
 * - Gamification integration (streaks, achievements, progress)
 * - Cultural sensitivity (RTL support, multilingual)
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Offline capability indicators
 * - Performance optimization for 60fps animations
 * 
 * Based on UX research findings from /docs/tasks/student-navigation-ux.md
 * 
 * @author ui-designer
 * @version 2.0.0
 * @since 2025-08-20
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Pressable,
  ViewStyle,
  Dimensions,
  I18nManager,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  interpolateColor,
  runOnJS,
  useDerivedValue,
  Easing,
  Extrapolate,
} from 'react-native-reanimated';
import { Haptics } from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Circle, Path } from 'react-native-svg';

// Design system imports
import { colors, spacing, typography, touchTargets, shadows, animation } from '../../../packages/ui/theme';
import { Text } from '../../../packages/ui/components';

/**
 * Age-specific configuration for tab bar adaptation
 */
interface AgeConfig {
  iconSize: number;
  touchTargetSize: number;
  fontSize: number;
  labelVisibility: 'always' | 'active' | 'never';
  animationIntensity: 'enhanced' | 'standard' | 'minimal';
  colorSaturation: 'high' | 'medium' | 'low';
  celebrationEnabled: boolean;
  progressRingEnabled: boolean;
}

/**
 * Tab item with educational gamification features
 */
interface StudentTabItem {
  id: string;
  label: string;
  labelRu?: string;  // Russian translation
  labelUz?: string;  // Uzbek translation
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  
  // Gamification features
  badge?: number;
  streakCount?: number;
  progressPercent?: number; // 0-100 for progress ring
  achievementUnlocked?: boolean;
  isOfflineCapable?: boolean;
  
  // Interaction states
  disabled?: boolean;
  locked?: boolean; // Requires unlock through progression
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * Progress ring component for showing completion status
 */
interface ProgressRingProps {
  progress: number; // 0-100
  size: number;
  strokeWidth: number;
  color: string;
  backgroundColor?: string;
  animated?: boolean;
}

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size,
  strokeWidth,
  color,
  backgroundColor = colors.neutral[200],
  animated = true,
}) => {
  const animatedProgress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  useEffect(() => {
    if (animated) {
      animatedProgress.value = withTiming(progress, {
        duration: animation.duration.slow,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      animatedProgress.value = progress;
    }
  }, [progress, animated]);
  
  const animatedProps = useAnimatedStyle(() => {
    const strokeDashoffset = circumference - (animatedProgress.value / 100) * circumference;
    return {
      strokeDashoffset,
    };
  });
  
  return (
    <AnimatedSvg width={size} height={size} style={{ position: 'absolute' }}>
      {/* Background circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={backgroundColor}
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      {/* Progress circle */}
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={animatedProps.strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </AnimatedSvg>
  );
};

/**
 * Celebration particles effect for achievements
 */
interface CelebrationParticlesProps {
  visible: boolean;
  color: string;
}

const CelebrationParticles: React.FC<CelebrationParticlesProps> = ({ visible, color }) => {
  const particles = Array.from({ length: 8 }, (_, i) => useSharedValue(0));
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(800, withTiming(0, { duration: 300 }))
      );
      
      particles.forEach((particle, index) => {
        particle.value = withSequence(
          withDelay(index * 50, withSpring(1, {
            damping: 8,
            stiffness: 100,
            mass: 1,
          })),
          withDelay(600, withTiming(0, { duration: 400 }))
        );
      });
    }
  }, [visible]);
  
  const particleStyles = particles.map((particle, index) => {
    const angle = (index * 45) * (Math.PI / 180);
    const distance = 20;
    
    return useAnimatedStyle(() => {
      const translateX = Math.cos(angle) * distance * particle.value;
      const translateY = Math.sin(angle) * distance * particle.value;
      const scale = interpolate(particle.value, [0, 1], [0, 1], Extrapolate.CLAMP);
      
      return {
        position: 'absolute',
        width: 4,
        height: 4,
        backgroundColor: color,
        borderRadius: 2,
        transform: [
          { translateX },
          { translateY },
          { scale },
        ],
        opacity: opacity.value,
      };
    });
  });
  
  return (
    <View style={{ position: 'absolute', top: '50%', left: '50%' }}>
      {particleStyles.map((style, index) => (
        <Animated.View key={index} style={style} />
      ))}
    </View>
  );
};

/**
 * Enhanced tab component with educational features
 */
interface AnimatedTabProps {
  tab: StudentTabItem;
  index: number;
  isActive: boolean;
  ageConfig: AgeConfig;
  language: 'en' | 'ru' | 'uz';
  onPress: (tabId: string) => void;
  onLongPress?: (tabId: string) => void;
  isOnline: boolean;
  theme: 'light' | 'dark';
}

const AnimatedTab: React.FC<AnimatedTabProps> = ({
  tab,
  index,
  isActive,
  ageConfig,
  language,
  onPress,
  onLongPress,
  isOnline,
  theme,
}) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  
  // Animation values
  const scale = useSharedValue(1);
  const bounceScale = useSharedValue(1);
  const progressGlow = useSharedValue(0);
  const streakPulse = useSharedValue(1);
  const badgeScale = useSharedValue(1);
  const achievementGlow = useSharedValue(0);
  
  // Check for reduced motion preference
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReducedMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setIsReducedMotion);
    return () => subscription?.remove();
  }, []);
  
  // Handle achievement celebration
  useEffect(() => {
    if (tab.achievementUnlocked && ageConfig.celebrationEnabled && !isReducedMotion) {
      setShowCelebration(true);
      achievementGlow.value = withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(1000, withTiming(0, { duration: 500 }))
      );
      
      // Hide celebration after animation
      setTimeout(() => setShowCelebration(false), 1500);
    }
  }, [tab.achievementUnlocked, ageConfig.celebrationEnabled, isReducedMotion]);
  
  // Streak pulse animation
  useEffect(() => {
    if (tab.streakCount && tab.streakCount > 0 && !isReducedMotion) {
      streakPulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [tab.streakCount, isReducedMotion]);
  
  // Badge animation
  useEffect(() => {
    if (tab.badge && tab.badge > 0 && !isReducedMotion) {
      badgeScale.value = withSequence(
        withSpring(1.3, { damping: 10, stiffness: 100 }),
        withSpring(1, { damping: 15, stiffness: 150 })
      );
    }
  }, [tab.badge, isReducedMotion]);
  
  // Progress glow effect
  useEffect(() => {
    if (tab.progressPercent && tab.progressPercent >= 100 && !isReducedMotion) {
      progressGlow.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [tab.progressPercent, isReducedMotion]);
  
  // Get localized label
  const getLabel = useCallback(() => {
    switch (language) {
      case 'ru': return tab.labelRu || tab.label;
      case 'uz': return tab.labelUz || tab.label;
      default: return tab.label;
    }
  }, [tab, language]);
  
  // Handle press with haptic feedback and animation
  const handlePress = useCallback(() => {
    if (tab.disabled || tab.locked) return;
    
    if (!isReducedMotion) {
      // Primary bounce animation
      bounceScale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 15, stiffness: 150 })
      );
      
      // Secondary scale animation
      scale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1, { damping: 12, stiffness: 150 })
      );
    }
    
    // Haptic feedback based on age group
    if (Platform.OS === 'ios') {
      if (ageConfig.animationIntensity === 'enhanced') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    
    onPress(tab.id);
  }, [tab, ageConfig, isReducedMotion, onPress, bounceScale, scale]);
  
  // Handle long press for contextual actions
  const handleLongPress = useCallback(() => {
    if (tab.disabled || tab.locked || !onLongPress) return;
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    onLongPress(tab.id);
  }, [tab, onLongPress]);
  
  // Animation styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * bounceScale.value },
    ],
  }));
  
  const progressGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: progressGlow.value * 0.6,
    shadowRadius: interpolate(progressGlow.value, [0, 1], [0, 8]),
    shadowColor: colors.primary[500],
  }));
  
  const streakStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakPulse.value }],
  }));
  
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));
  
  const achievementStyle = useAnimatedStyle(() => ({
    shadowOpacity: achievementGlow.value * 0.8,
    shadowRadius: interpolate(achievementGlow.value, [0, 1], [0, 12]),
    shadowColor: colors.gamification.achievement,
  }));
  
  // Get theme-aware colors
  const getColors = useMemo(() => {
    const baseColors = theme === 'dark' ? colors.dark : colors;
    const saturation = ageConfig.colorSaturation;
    
    return {
      active: saturation === 'high' ? colors.primary[500] : colors.primary[600],
      inactive: baseColors.text.tertiary,
      background: baseColors.background.primary,
      border: baseColors.border.light,
    };
  }, [theme, ageConfig.colorSaturation]);
  
  // Accessibility setup
  const accessibilityState = useMemo(() => ({
    selected: isActive,
    disabled: tab.disabled || tab.locked,
  }), [isActive, tab.disabled, tab.locked]);
  
  const accessibilityLabel = useMemo(() => {
    let label = tab.accessibilityLabel || getLabel();
    
    if (tab.badge && tab.badge > 0) {
      label += `, ${tab.badge} notifications`;
    }
    
    if (tab.streakCount && tab.streakCount > 0) {
      label += `, ${tab.streakCount} day streak`;
    }
    
    if (tab.progressPercent) {
      label += `, ${tab.progressPercent}% complete`;
    }
    
    if (!isOnline && !tab.isOfflineCapable) {
      label += ', requires internet connection';
    }
    
    if (tab.locked) {
      label += ', locked';
    }
    
    return label;
  }, [tab, getLabel, isOnline]);
  
  return (
    <Pressable
      style={[
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.md,
          minHeight: touchTargets.educational.navigation,
          opacity: tab.disabled ? 0.5 : tab.locked ? 0.7 : 1,
        },
      ]}
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      disabled={tab.disabled}
      accessible={true}
      accessibilityRole="tab"
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={tab.accessibilityHint}
    >
      <Animated.View style={[containerStyle, progressGlowStyle, achievementStyle]}>
        {/* Progress Ring (if enabled and has progress) */}
        {ageConfig.progressRingEnabled && tab.progressPercent !== undefined && (
          <ProgressRing
            progress={tab.progressPercent}
            size={ageConfig.iconSize + 16}
            strokeWidth={3}
            color={isActive ? getColors.active : colors.neutral[400]}
            backgroundColor={colors.neutral[200]}
            animated={!isReducedMotion}
          />
        )}
        
        {/* Main Icon Container */}
        <View style={{ 
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Icon */}
          <View
            style={{
              width: ageConfig.iconSize,
              height: ageConfig.iconSize,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {React.cloneElement(
              (isActive && tab.activeIcon ? tab.activeIcon : tab.icon) as React.ReactElement,
              {
                size: ageConfig.iconSize,
                color: isActive ? getColors.active : getColors.inactive,
              }
            )}
          </View>
          
          {/* Offline Indicator */}
          {!isOnline && !tab.isOfflineCapable && (
            <View
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.semantic.warning.main,
                borderWidth: 1,
                borderColor: getColors.background,
              }}
            />
          )}
          
          {/* Lock Icon */}
          {tab.locked && (
            <View
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.neutral[600],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 8, color: colors.text.inverse }}>🔒</Text>
            </View>
          )}
          
          {/* Streak Fire Indicator */}
          {tab.streakCount && tab.streakCount > 0 && (
            <Animated.View
              style={[
                streakStyle,
                {
                  position: 'absolute',
                  top: -6,
                  left: -6,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: colors.gamification.streak,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...shadows.xs,
                },
              ]}
            >
              <Text style={{ fontSize: 8, color: colors.text.inverse }}>🔥</Text>
            </Animated.View>
          )}
          
          {/* Badge */}
          {tab.badge && tab.badge > 0 && (
            <Animated.View
              style={[
                badgeStyle,
                {
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: colors.semantic.error.main,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                  ...shadows.sm,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: ageConfig.fontSize - 4,
                  fontWeight: '600',
                  color: colors.text.inverse,
                  textAlign: 'center',
                }}
              >
                {tab.badge > 99 ? '99+' : tab.badge.toString()}
              </Text>
            </Animated.View>
          )}
          
          {/* Achievement Notification */}
          {tab.achievementUnlocked && (
            <Animated.View
              style={[
                achievementStyle,
                {
                  position: 'absolute',
                  top: -10,
                  left: -10,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: colors.gamification.achievement,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...shadows.md,
                },
              ]}
            >
              <Text style={{ fontSize: 10, color: colors.text.inverse }}>⭐</Text>
            </Animated.View>
          )}
          
          {/* Celebration Particles */}
          <CelebrationParticles
            visible={showCelebration}
            color={colors.gamification.achievement}
          />
        </View>
        
        {/* Label */}
        {(ageConfig.labelVisibility === 'always' || 
          (ageConfig.labelVisibility === 'active' && isActive)) && (
          <Text
            style={{
              marginTop: spacing.xs,
              fontSize: ageConfig.fontSize,
              fontWeight: isActive ? '600' : '500',
              color: isActive ? getColors.active : getColors.inactive,
              textAlign: 'center',
              opacity: tab.locked ? 0.7 : 1,
            }}
            numberOfLines={1}
          >
            {getLabel()}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
};

/**
 * Main AnimatedTabBar component props
 */
export interface AnimatedTabBarProps {
  // Tab configuration
  tabs: StudentTabItem[];
  activeTabId: string;
  onTabPress: (tabId: string) => void;
  onTabLongPress?: (tabId: string) => void;
  
  // Age-specific adaptation
  userAge?: number; // Student age for UI adaptation
  
  // Localization
  language?: 'en' | 'ru' | 'uz';
  
  // Theme and appearance
  theme?: 'light' | 'dark';
  variant?: 'standard' | 'minimal' | 'enhanced';
  
  // Features
  enableGamification?: boolean;
  enableProgressRings?: boolean;
  enableCelebrations?: boolean;
  
  // Connectivity
  isOnline?: boolean;
  
  // Style customization
  style?: ViewStyle;
  backgroundColor?: string;
  
  // Accessibility
  reducedMotion?: boolean;
}

/**
 * Enhanced AnimatedTabBar for Harry School Student App
 * 
 * Features age-appropriate adaptations, gamification elements,
 * educational micro-animations, and comprehensive accessibility support.
 */
export const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({
  tabs,
  activeTabId,
  onTabPress,
  onTabLongPress,
  userAge = 14, // Default to middle age group
  language = 'en',
  theme = 'light',
  variant = 'standard',
  enableGamification = true,
  enableProgressRings = true,
  enableCelebrations = true,
  isOnline = true,
  style,
  backgroundColor,
  reducedMotion,
}) => {
  const { width: screenWidth } = Dimensions.get('window');
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);
  const [deviceReducedMotion, setDeviceReducedMotion] = useState(false);
  
  // Check RTL layout changes
  useEffect(() => {
    const subscription = I18nManager.addEventListener('localeChanged', () => {
      setIsRTL(I18nManager.isRTL);
    });
    return () => subscription?.remove();
  }, []);
  
  // Check device motion preferences
  useEffect(() => {
    if (!reducedMotion) {
      AccessibilityInfo.isReduceMotionEnabled().then(setDeviceReducedMotion);
      const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setDeviceReducedMotion);
      return () => subscription?.remove();
    }
  }, [reducedMotion]);
  
  // Age-specific configuration
  const ageConfig = useMemo((): AgeConfig => {
    if (userAge <= 12) {
      // Elementary learners (10-12 years)
      return {
        iconSize: 28,
        touchTargetSize: touchTargets.educational.student.navigation,
        fontSize: 12,
        labelVisibility: 'always',
        animationIntensity: 'enhanced',
        colorSaturation: 'high',
        celebrationEnabled: enableCelebrations,
        progressRingEnabled: enableProgressRings,
      };
    } else {
      // Secondary students (13-18 years)
      return {
        iconSize: 24,
        touchTargetSize: touchTargets.educational.navigation,
        fontSize: 10,
        labelVisibility: variant === 'minimal' ? 'active' : 'always',
        animationIntensity: variant === 'enhanced' ? 'enhanced' : 'standard',
        colorSaturation: 'medium',
        celebrationEnabled: enableCelebrations,
        progressRingEnabled: enableProgressRings,
      };
    }
  }, [userAge, variant, enableCelebrations, enableProgressRings]);
  
  // Active tab indicator animation
  const activeIndex = useMemo(() => 
    tabs.findIndex(tab => tab.id === activeTabId), 
    [tabs, activeTabId]
  );
  
  const indicatorPosition = useSharedValue(activeIndex);
  const indicatorWidth = screenWidth / tabs.length;
  
  useEffect(() => {
    if (!reducedMotion && !deviceReducedMotion) {
      indicatorPosition.value = withSpring(activeIndex, {
        damping: 15,
        stiffness: 150,
        mass: 1,
      });
    } else {
      indicatorPosition.value = activeIndex;
    }
  }, [activeIndex, reducedMotion, deviceReducedMotion]);
  
  const indicatorStyle = useAnimatedStyle(() => {
    const translateX = isRTL 
      ? (tabs.length - 1 - indicatorPosition.value) * indicatorWidth
      : indicatorPosition.value * indicatorWidth;
    
    return {
      transform: [{ translateX }],
    };
  });
  
  // Get theme colors
  const tabBarColors = useMemo(() => {
    const base = theme === 'dark' ? colors.dark : colors;
    return {
      background: backgroundColor || base.background.primary,
      border: base.border.light,
      indicator: colors.primary[500],
      shadow: theme === 'dark' ? colors.neutral[800] : colors.neutral[200],
    };
  }, [theme, backgroundColor]);
  
  return (
    <View
      style={[
        {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          backgroundColor: tabBarColors.background,
          borderTopWidth: 1,
          borderTopColor: tabBarColors.border,
          paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
          paddingTop: spacing.sm,
          position: 'relative',
          ...shadows.sm,
        },
        style,
      ]}
      accessible={true}
      accessibilityRole="tablist"
      accessibilityLabel="Main navigation"
    >
      {/* Active Tab Indicator */}
      <Animated.View
        style={[
          indicatorStyle,
          {
            position: 'absolute',
            top: 0,
            width: indicatorWidth * 0.6,
            height: 3,
            backgroundColor: tabBarColors.indicator,
            borderRadius: 2,
            left: indicatorWidth * 0.2, // Center the indicator
          },
        ]}
      />
      
      {/* Background Gradient (for enhanced variant) */}
      {variant === 'enhanced' && (
        <LinearGradient
          colors={[
            tabBarColors.background,
            theme === 'dark' 
              ? colors.dark.background.secondary 
              : colors.background.accent,
          ]}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.3,
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      )}
      
      {/* Tabs */}
      {tabs.map((tab, index) => (
        <AnimatedTab
          key={tab.id}
          tab={tab}
          index={index}
          isActive={tab.id === activeTabId}
          ageConfig={ageConfig}
          language={language}
          onPress={onTabPress}
          onLongPress={onTabLongPress}
          isOnline={isOnline}
          theme={theme}
        />
      ))}
      
      {/* Offline Status Indicator */}
      {!isOnline && (
        <View
          style={{
            position: 'absolute',
            top: -10,
            right: spacing.md,
            backgroundColor: colors.semantic.warning.main,
            borderRadius: 12,
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
            ...shadows.sm,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '600',
              color: colors.text.inverse,
            }}
          >
            Offline
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * Default tab configuration for Harry School Student App
 * Based on UX research findings for 5-tab structure
 */
export const defaultStudentTabs: StudentTabItem[] = [
  {
    id: 'home',
    label: 'Home',
    labelRu: 'Главная',
    labelUz: 'Bosh sahifa',
    icon: '🏠',
    activeIcon: '🏡',
    isOfflineCapable: true,
    accessibilityLabel: 'Home dashboard',
    accessibilityHint: 'View daily learning streak and continue learning',
  },
  {
    id: 'lessons',
    label: 'Lessons',
    labelRu: 'Уроки',
    labelUz: 'Darslar',
    icon: '📚',
    activeIcon: '📖',
    isOfflineCapable: true,
    accessibilityLabel: 'Lessons',
    accessibilityHint: 'Browse and start learning lessons',
  },
  {
    id: 'schedule',
    label: 'Schedule',
    labelRu: 'Расписание',
    labelUz: 'Jadval',
    icon: '📅',
    activeIcon: '🗓️',
    isOfflineCapable: false,
    accessibilityLabel: 'Schedule',
    accessibilityHint: 'View class schedule and assignments',
  },
  {
    id: 'vocabulary',
    label: 'Vocabulary',
    labelRu: 'Словарь',
    labelUz: 'Lugʻat',
    icon: '🔤',
    activeIcon: '📝',
    isOfflineCapable: true,
    accessibilityLabel: 'Vocabulary',
    accessibilityHint: 'Practice vocabulary with flashcards',
  },
  {
    id: 'profile',
    label: 'Profile',
    labelRu: 'Профиль',
    labelUz: 'Profil',
    icon: '👤',
    activeIcon: '👨‍🎓',
    isOfflineCapable: true,
    accessibilityLabel: 'Profile',
    accessibilityHint: 'View rankings, achievements and rewards',
  },
];

export default AnimatedTabBar;