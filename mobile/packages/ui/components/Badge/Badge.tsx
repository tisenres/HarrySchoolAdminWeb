/**
 * Badge Component
 * Harry School Mobile Design System
 * 
 * Premium badge component with 3 types, position variants, and celebration animations
 * Optimized for notifications, achievements, and status indicators
 */

import React, { forwardRef, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  HapticFeedback,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import type { 
  BadgeProps, 
  BadgeDimensions, 
  BadgeColors,
  BadgePosition,
} from './Badge.types';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Badge = forwardRef<View, BadgeProps>(({
  type = 'notification',
  variant = 'count',
  size = 'md',
  color = 'primary',
  content,
  icon,
  count,
  maxCount = 99,
  maxDisplayCount = 99,
  showZero = false,
  position = 'top-right',
  offsetX = 0,
  offsetY = 0,
  absolute = true,
  achievementType = 'gold',
  level,
  showLevel = false,
  statusType = 'active',
  statusMessage,
  backgroundColor,
  textColor,
  borderColor,
  borderWidth,
  borderRadius,
  visible = true,
  interactive = false,
  enableAnimations = true,
  pulse = false,
  pulseDuration = 2000,
  pulseScale = 1.2,
  bounce = false,
  bounceDuration = 600,
  celebration = false,
  fadeIn = true,
  fadeInDuration = 300,
  animationDelay = 0,
  blink = false,
  blinkDuration = 1000,
  gradient = false,
  gradientColors,
  priority = 'medium',
  autoHide,
  onPress,
  onLongPress,
  enableHaptics = true,
  hapticType = 'light',
  enablePressAnimation = true,
  pressScale = 0.95,
  disableAnimations = false,
  style,
  textStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'text',
  themeVariant,
  ...viewProps
}, ref) => {
  const { theme, variant: contextThemeVariant } = useTheme();
  const currentThemeVariant = themeVariant || contextThemeVariant;
  const autoHideTimer = useRef<NodeJS.Timeout>();
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(fadeIn && !disableAnimations ? 0 : 1);
  const pulseAnimation = useSharedValue(1);
  const bounceAnimation = useSharedValue(0);
  const blinkOpacity = useSharedValue(1);
  const celebrationScale = useSharedValue(1);
  const celebrationRotation = useSharedValue(0);
  
  // Get badge configuration
  const badgeConfig = useMemo(() => {
    return getBadgeConfig(type, variant, size, color, theme, currentThemeVariant);
  }, [type, variant, size, color, theme, currentThemeVariant]);

  // Handle haptic feedback
  const triggerHaptic = useCallback(() => {
    if (!enableHaptics || Platform.OS !== 'ios') return;
    HapticFeedback.trigger(hapticType);
  }, [enableHaptics, hapticType]);

  // Celebration animation
  const triggerCelebration = useCallback(() => {
    if (!celebration || disableAnimations) return;
    
    celebrationScale.value = withSequence(
      withSpring(1.3, { damping: 15, stiffness: 200 }),
      withSpring(0.8, { damping: 15, stiffness: 200 }),
      withSpring(1.1, { damping: 20, stiffness: 180 }),
      withSpring(1, { damping: 25, stiffness: 150 })
    );
    
    celebrationRotation.value = withSequence(
      withTiming(-15, { duration: 150 }),
      withTiming(15, { duration: 150 }),
      withTiming(-10, { duration: 150 }),
      withTiming(10, { duration: 150 }),
      withTiming(0, { duration: 150 })
    );
  }, [celebration, disableAnimations, celebrationScale, celebrationRotation]);

  // Auto-hide effect
  useEffect(() => {
    if (!autoHide || !visible) return;
    
    autoHideTimer.current = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 });
    }, autoHide);
    
    return () => {
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
      }
    };
  }, [autoHide, visible, opacity]);

  // Animation effects
  useEffect(() => {
    if (disableAnimations || !enableAnimations || !visible) return;
    
    // Entrance animation
    if (fadeIn) {
      opacity.value = withDelay(
        animationDelay,
        withTiming(1, { duration: fadeInDuration })
      );
    }
    
    // Pulse animation
    if (pulse && type === 'notification') {
      pulseAnimation.value = withDelay(
        animationDelay,
        withRepeat(
          withSequence(
            withTiming(pulseScale, { duration: pulseDuration / 2 }),
            withTiming(1, { duration: pulseDuration / 2 })
          ),
          -1,
          false
        )
      );
    }
    
    // Bounce animation
    if (bounce && type === 'achievement') {
      bounceAnimation.value = withDelay(
        animationDelay,
        withRepeat(
          withSequence(
            withSpring(-8, { damping: 5, stiffness: 100 }),
            withSpring(0, { damping: 8, stiffness: 200 })
          ),
          3,
          false
        )
      );
    }
    
    // Blink animation
    if (blink && (priority === 'high' || priority === 'urgent')) {
      blinkOpacity.value = withDelay(
        animationDelay,
        withRepeat(
          withSequence(
            withTiming(0.3, { duration: blinkDuration / 2 }),
            withTiming(1, { duration: blinkDuration / 2 })
          ),
          -1,
          false
        )
      );
    }
    
    // Celebration trigger
    if (celebration && type === 'achievement') {
      const timer = setTimeout(() => {
        runOnJS(triggerCelebration)();
      }, animationDelay + 100);
      
      return () => clearTimeout(timer);
    }
  }, [
    disableAnimations,
    enableAnimations,
    visible,
    fadeIn,
    animationDelay,
    fadeInDuration,
    pulse,
    type,
    pulseDuration,
    pulseScale,
    bounce,
    bounceDuration,
    blink,
    priority,
    blinkDuration,
    celebration,
    triggerCelebration,
    opacity,
    pulseAnimation,
    bounceAnimation,
    blinkOpacity,
  ]);

  // Press handlers
  const handlePressIn = useCallback(() => {
    if (!interactive || !enablePressAnimation || disableAnimations) return;
    
    scale.value = withTiming(pressScale, { duration: 150 });
    triggerHaptic();
  }, [interactive, enablePressAnimation, disableAnimations, pressScale, scale, triggerHaptic]);

  const handlePressOut = useCallback(() => {
    if (!interactive || !enablePressAnimation || disableAnimations) return;
    
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
  }, [interactive, enablePressAnimation, disableAnimations, scale]);

  const handlePress = useCallback(() => {
    if (!interactive) return;
    onPress?.();
  }, [interactive, onPress]);

  const handleLongPress = useCallback(() => {
    if (!interactive) return;
    onLongPress?.();
  }, [interactive, onLongPress]);

  // Get display content
  const getDisplayContent = useMemo(() => {
    if (variant === 'dot') return null;
    
    if (content !== undefined) {
      return typeof content === 'number' ? formatNumber(content, maxDisplayCount) : content;
    }
    
    if (count !== undefined) {
      if (count === 0 && !showZero) return null;
      return formatNumber(count, maxDisplayCount);
    }
    
    if (variant === 'icon' && icon) return null; // Icon will be rendered separately
    
    if (type === 'achievement' && achievementType) {
      return getAchievementSymbol(achievementType);
    }
    
    if (type === 'status' && statusType) {
      return statusMessage || getStatusLabel(statusType);
    }
    
    return null;
  }, [
    variant,
    content,
    count,
    maxDisplayCount,
    showZero,
    icon,
    type,
    achievementType,
    statusType,
    statusMessage,
  ]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    let transform = [
      { scale: scale.value * pulseAnimation.value },
      { translateY: bounceAnimation.value },
    ];
    
    if (celebration) {
      transform = [
        { scale: scale.value * celebrationScale.value },
        { rotate: `${celebrationRotation.value}deg` },
        { translateY: bounceAnimation.value },
      ];
    }
    
    return {
      opacity: opacity.value * blinkOpacity.value,
      transform,
    };
  });

  // Position styles
  const positionStyle = useMemo(() => {
    if (!absolute) return {};
    
    const positions: Record<BadgePosition, any> = {
      'top-right': {
        position: 'absolute',
        top: offsetY,
        right: offsetX,
      },
      'top-left': {
        position: 'absolute',
        top: offsetY,
        left: offsetX,
      },
      'bottom-right': {
        position: 'absolute',
        bottom: offsetY,
        right: offsetX,
      },
      'bottom-left': {
        position: 'absolute',
        bottom: offsetY,
        left: offsetX,
      },
      'top-center': {
        position: 'absolute',
        top: offsetY,
        left: '50%',
        transform: [{ translateX: -50 }],
      },
      'bottom-center': {
        position: 'absolute',
        bottom: offsetY,
        left: '50%',
        transform: [{ translateX: -50 }],
      },
    };
    
    return positions[position];
  }, [absolute, position, offsetX, offsetY]);

  // Container styles
  const containerStyle = [
    styles.container,
    {
      minWidth: badgeConfig.dimensions.minWidth,
      minHeight: badgeConfig.dimensions.minHeight,
      paddingHorizontal: badgeConfig.dimensions.paddingHorizontal,
      paddingVertical: badgeConfig.dimensions.paddingVertical,
      borderRadius: borderRadius ?? badgeConfig.dimensions.borderRadius,
      backgroundColor: backgroundColor || badgeConfig.colors.background,
      borderWidth: borderWidth || (borderColor ? 1 : 0),
      borderColor: borderColor,
    },
    variant === 'dot' && styles.dot,
    positionStyle,
    badgeConfig.shadow,
    style,
  ];

  // Text styles
  const textStyles = [
    styles.text,
    {
      fontSize: badgeConfig.dimensions.fontSize,
      color: textColor || badgeConfig.colors.text,
    },
    textStyle,
  ];

  // Build accessibility label
  const buildAccessibilityLabel = () => {
    if (accessibilityLabel) return accessibilityLabel;
    
    if (type === 'notification' && count !== undefined) {
      if (count === 0) return 'No notifications';
      if (count === 1) return '1 notification';
      return `${count} notifications`;
    }
    
    if (type === 'achievement') {
      return `${achievementType} achievement${showLevel && level ? `, level ${level}` : ''}`;
    }
    
    if (type === 'status') {
      return `Status: ${statusMessage || statusType}`;
    }
    
    return 'Badge';
  };

  // Don't render if not visible or no content to show
  if (!visible || (variant !== 'dot' && !getDisplayContent && !icon)) {
    return null;
  }

  const BadgeContainer = interactive ? AnimatedPressable : AnimatedView;

  // Render with gradient if specified
  const renderBadge = () => {
    const badgeContent = (
      <>
        {icon && (
          <View style={styles.iconContainer}>
            {typeof icon === 'string' ? (
              <Text style={[styles.iconText, { fontSize: badgeConfig.dimensions.iconSize }]}>
                {icon}
              </Text>
            ) : (
              icon
            )}
          </View>
        )}
        
        {getDisplayContent && variant !== 'icon' && (
          <Text style={textStyles}>
            {getDisplayContent}
          </Text>
        )}
        
        {showLevel && level && (
          <View style={styles.levelIndicator}>
            {Array.from({ length: Math.min(level, 5) }, (_, i) => (
              <Text key={i} style={styles.levelStar}>
                ⭐
              </Text>
            ))}
          </View>
        )}
      </>
    );

    if (gradient && gradientColors && gradientColors.length > 1) {
      return (
        <LinearGradient
          colors={gradientColors}
          style={[containerStyle, { backgroundColor: 'transparent' }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {badgeContent}
        </LinearGradient>
      );
    }

    return (
      <View style={containerStyle}>
        {badgeContent}
      </View>
    );
  };

  return (
    <BadgeContainer
      ref={ref}
      style={animatedStyle}
      onPress={interactive ? handlePress : undefined}
      onLongPress={interactive ? handleLongPress : undefined}
      onPressIn={interactive ? handlePressIn : undefined}
      onPressOut={interactive ? handlePressOut : undefined}
      accessible={true}
      accessibilityRole={interactive ? 'button' : accessibilityRole}
      accessibilityLabel={buildAccessibilityLabel()}
      accessibilityHint={accessibilityHint}
      testID={testID}
      {...viewProps}
    >
      {renderBadge()}
    </BadgeContainer>
  );
});

Badge.displayName = 'Badge';

// Utility functions
const formatNumber = (num: number, max: number): string => {
  if (num <= max) return num.toString();
  return `${max}+`;
};

const getAchievementSymbol = (type: string): string => {
  const symbols = {
    gold: '🥇',
    silver: '🥈',
    bronze: '🥉',
    platinum: '🏆',
  };
  return symbols[type as keyof typeof symbols] || '🏅';
};

const getStatusLabel = (type: string): string => {
  const labels = {
    active: 'Active',
    pending: 'Pending',
    inactive: 'Inactive',
    completed: 'Completed',
    error: 'Error',
    new: 'New',
  };
  return labels[type as keyof typeof labels] || 'Unknown';
};

// Configuration function
const getBadgeConfig = (
  type: BadgeProps['type'],
  variant: BadgeProps['variant'],
  size: BadgeProps['size'],
  color: BadgeProps['color'],
  theme: any,
  themeVariant: string
) => {
  const { tokens } = theme;
  
  // Size configurations
  const sizeConfig: Record<string, BadgeDimensions> = {
    sm: {
      minWidth: variant === 'dot' ? 8 : 16,
      minHeight: variant === 'dot' ? 8 : 16,
      paddingHorizontal: variant === 'dot' ? 0 : 4,
      paddingVertical: variant === 'dot' ? 0 : 2,
      borderRadius: variant === 'dot' ? 4 : 8,
      fontSize: 10,
      iconSize: 12,
    },
    md: {
      minWidth: variant === 'dot' ? 12 : 20,
      minHeight: variant === 'dot' ? 12 : 20,
      paddingHorizontal: variant === 'dot' ? 0 : 6,
      paddingVertical: variant === 'dot' ? 0 : 2,
      borderRadius: variant === 'dot' ? 6 : 10,
      fontSize: 12,
      iconSize: 16,
    },
    lg: {
      minWidth: variant === 'dot' ? 16 : 24,
      minHeight: variant === 'dot' ? 16 : 24,
      paddingHorizontal: variant === 'dot' ? 0 : 8,
      paddingVertical: variant === 'dot' ? 0 : 4,
      borderRadius: variant === 'dot' ? 8 : 12,
      fontSize: 14,
      iconSize: 20,
    },
  };

  // Color configurations
  const colorConfig: Record<string, BadgeColors> = {
    primary: {
      background: tokens.colors.primary[500],
      text: tokens.colors.text.inverse,
    },
    secondary: {
      background: tokens.colors.neutral[600],
      text: tokens.colors.text.inverse,
    },
    success: {
      background: tokens.colors.semantic.success.main,
      text: tokens.colors.text.inverse,
    },
    warning: {
      background: tokens.colors.semantic.warning.main,
      text: tokens.colors.text.primary,
    },
    error: {
      background: tokens.colors.semantic.error.main,
      text: tokens.colors.text.inverse,
    },
    info: {
      background: tokens.colors.semantic.info.main,
      text: tokens.colors.text.inverse,
    },
    neutral: {
      background: tokens.colors.neutral[400],
      text: tokens.colors.text.inverse,
    },
  };

  // Achievement-specific colors
  if (type === 'achievement') {
    const achievementColors = {
      primary: {
        background: tokens.colors.ranking.gold.main,
        text: tokens.colors.text.primary,
      },
    };
    colorConfig.primary = achievementColors.primary;
  }

  const dimensions = sizeConfig[size || 'md'];
  const colors = colorConfig[color || 'primary'];

  // Shadow configuration
  const shadow = themeVariant === 'student' && type === 'achievement' 
    ? tokens.shadows.md 
    : tokens.shadows.sm;

  return {
    dimensions,
    colors,
    shadow,
  };
};

// Styles
const styles = {
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
  },
  dot: {
    borderRadius: 50,
  },
  text: {
    fontFamily: 'Inter-Bold',
    textAlign: 'center' as const,
    includeFontPadding: false,
  },
  iconContainer: {
    marginRight: 4,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  iconText: {
    textAlign: 'center' as const,
  },
  levelIndicator: {
    flexDirection: 'row' as const,
    marginLeft: 4,
  },
  levelStar: {
    fontSize: 8,
  },
};

export default Badge;