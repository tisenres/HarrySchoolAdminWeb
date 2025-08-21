/**
 * Button Component
 * Harry School Mobile Design System
 * 
 * Premium button component with 6 variants, 4 sizes, animations, and accessibility
 * Optimized for Teacher (efficiency) and Student (engagement) themes
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  HapticFeedback,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import type { ButtonProps, ButtonColors, ButtonDimensions } from './Button.types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button = forwardRef<View, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  loadingText,
  loadingColor,
  fullWidth = false,
  icon,
  iconPosition = 'leading',
  iconSize,
  enableCelebration = false,
  enableHaptics = true,
  selectionCount,
  style,
  textStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  disableAnimations = false,
  animationDuration,
  ...pressableProps
}, ref) => {
  const { theme, variant: themeVariant } = useTheme();
  
  // Animation values
  const scale = useSharedValue(1);
  const celebrationScale = useSharedValue(1);
  const celebrationRotation = useSharedValue(0);
  
  // Get button configuration based on variant and size
  const buttonConfig = useMemo(() => {
    return getButtonConfig(variant, size, theme, themeVariant);
  }, [variant, size, theme, themeVariant]);

  // Handle haptic feedback
  const triggerHaptic = useCallback(() => {
    if (!enableHaptics || disabled || loading) return;
    
    if (Platform.OS === 'ios') {
      const hapticType = buttonConfig.colors.hapticType || 'light';
      HapticFeedback.trigger(hapticType);
    }
  }, [enableHaptics, disabled, loading, buttonConfig.colors.hapticType]);

  // Celebration animation
  const triggerCelebration = useCallback(() => {
    if (!enableCelebration || disableAnimations) return;
    
    celebrationScale.value = withSequence(
      withSpring(1.2, { damping: 15, stiffness: 200 }),
      withSpring(0.9, { damping: 15, stiffness: 200 }),
      withSpring(1.05, { damping: 20, stiffness: 180 }),
      withSpring(1, { damping: 25, stiffness: 150 })
    );
    
    celebrationRotation.value = withSequence(
      withTiming(-10, { duration: 125 }),
      withTiming(10, { duration: 125 }),
      withTiming(-5, { duration: 125 }),
      withTiming(0, { duration: 125 })
    );
  }, [enableCelebration, disableAnimations, celebrationScale, celebrationRotation]);

  // Press handlers
  const handlePressIn = useCallback(() => {
    if (!disableAnimations && !disabled && !loading) {
      const duration = animationDuration || (themeVariant === 'teacher' ? 100 : 150);
      scale.value = withTiming(0.98, { duration });
    }
    onPressIn?.();
  }, [disableAnimations, disabled, loading, scale, animationDuration, themeVariant, onPressIn]);

  const handlePressOut = useCallback(() => {
    if (!disableAnimations && !disabled && !loading) {
      const springConfig = { damping: 20, stiffness: 150 };
      scale.value = withSpring(1, springConfig);
    }
    onPressOut?.();
  }, [disableAnimations, disabled, loading, scale, onPressOut]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    
    triggerHaptic();
    
    if (enableCelebration) {
      runOnJS(triggerCelebration)();
    }
    
    onPress?.();
  }, [disabled, loading, triggerHaptic, enableCelebration, triggerCelebration, onPress]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    let transform = [{ scale: scale.value }];
    
    if (enableCelebration) {
      transform = [
        { scale: scale.value * celebrationScale.value },
        { rotate: `${celebrationRotation.value}deg` },
      ];
    }
    
    return { transform };
  });

  // Get current state colors
  const currentColors = useMemo(() => {
    if (disabled) {
      return {
        background: buttonConfig.colors.backgroundDisabled,
        text: buttonConfig.colors.textDisabled,
        border: buttonConfig.colors.borderDisabled,
      };
    }
    return {
      background: buttonConfig.colors.background,
      text: buttonConfig.colors.text,
      border: buttonConfig.colors.border,
    };
  }, [disabled, buttonConfig.colors]);

  // Button content
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={loadingColor || currentColors.text}
            style={styles.loadingIndicator}
          />
          {loadingText && (
            <Text style={[styles.text, { color: currentColors.text }, textStyle]}>
              {loadingText}
            </Text>
          )}
        </View>
      );
    }

    const content = [];

    // Leading icon
    if (icon && iconPosition === 'leading') {
      content.push(renderIcon('leading'));
    }

    // Text content
    if (children && iconPosition !== 'only') {
      content.push(
        <Text key="text" style={[styles.text, { color: currentColors.text }, textStyle]}>
          {children}
        </Text>
      );
    }

    // Trailing icon
    if (icon && iconPosition === 'trailing') {
      content.push(renderIcon('trailing'));
    }

    // Selection count for bulk variant
    if (variant === 'bulk' && selectionCount !== undefined) {
      content.push(renderSelectionCount());
    }

    return content;
  };

  const renderIcon = (position: 'leading' | 'trailing') => {
    const iconMargin = position === 'leading' ? { marginRight: 8 } : { marginLeft: 8 };
    const finalIconSize = iconSize || buttonConfig.dimensions.iconSize;
    
    return (
      <View key={`icon-${position}`} style={iconMargin}>
        {typeof icon === 'string' ? (
          // Handle icon names (would integrate with your icon library)
          <Text style={{ fontSize: finalIconSize, color: currentColors.text }}>
            {icon}
          </Text>
        ) : (
          icon
        )}
      </View>
    );
  };

  const renderSelectionCount = () => {
    if (!selectionCount || selectionCount === 0) return null;
    
    const displayCount = selectionCount > 99 ? '99+' : selectionCount.toString();
    
    return (
      <View key="selection-count" style={styles.selectionBadge}>
        <Text style={styles.selectionBadgeText}>
          {displayCount}
        </Text>
      </View>
    );
  };

  // Container styles
  const containerStyle = [
    styles.container,
    {
      height: buttonConfig.dimensions.height,
      paddingHorizontal: buttonConfig.dimensions.paddingHorizontal,
      backgroundColor: currentColors.background,
      borderRadius: buttonConfig.dimensions.borderRadius,
      minWidth: fullWidth ? undefined : buttonConfig.dimensions.minWidth,
      width: fullWidth ? '100%' : undefined,
    },
    buttonConfig.colors.border && {
      borderWidth: variant === 'secondary' ? 2 : 1,
      borderColor: currentColors.border,
    },
    buttonConfig.shadow,
    disabled && styles.disabled,
    style,
  ];

  return (
    <AnimatedPressable
      ref={ref}
      style={[containerStyle, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={onLongPress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      testID={testID}
      {...pressableProps}
    >
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </AnimatedPressable>
  );
});

Button.displayName = 'Button';

// Utility function to get button configuration
const getButtonConfig = (
  variant: ButtonProps['variant'],
  size: ButtonProps['size'],
  theme: any,
  themeVariant: string
) => {
  const { tokens } = theme;
  
  // Size configurations
  const sizeConfig: Record<string, ButtonDimensions> = {
    small: {
      height: 36,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: tokens.borderRadius.md,
      fontSize: 12,
      iconSize: 16,
      minWidth: 64,
    },
    medium: {
      height: 44,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: tokens.borderRadius.md,
      fontSize: 14,
      iconSize: 20,
      minWidth: 88,
    },
    large: {
      height: 52,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: tokens.borderRadius.md,
      fontSize: 16,
      iconSize: 24,
      minWidth: 104,
    },
    xlarge: {
      height: 60,
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: tokens.borderRadius.lg,
      fontSize: 18,
      iconSize: 28,
      minWidth: 120,
    },
  };

  // Variant color configurations
  const variantConfig: Record<string, any> = {
    primary: {
      background: tokens.colors.primary[500],
      backgroundPressed: tokens.colors.primary[600],
      backgroundDisabled: tokens.colors.neutral[200],
      text: tokens.colors.text.inverse,
      textPressed: tokens.colors.text.inverse,
      textDisabled: tokens.colors.text.disabled,
      hapticType: 'medium',
    },
    secondary: {
      background: 'transparent',
      backgroundPressed: tokens.colors.primary[50],
      backgroundDisabled: 'transparent',
      text: tokens.colors.primary[500],
      textPressed: tokens.colors.primary[600],
      textDisabled: tokens.colors.text.disabled,
      border: tokens.colors.primary[500],
      borderPressed: tokens.colors.primary[600],
      borderDisabled: tokens.colors.neutral[200],
      hapticType: 'light',
    },
    outline: {
      background: tokens.colors.background.primary,
      backgroundPressed: tokens.colors.neutral[50],
      backgroundDisabled: tokens.colors.neutral[50],
      text: tokens.colors.text.secondary,
      textPressed: tokens.colors.text.primary,
      textDisabled: tokens.colors.text.disabled,
      border: tokens.colors.border.medium,
      borderPressed: tokens.colors.border.strong,
      borderDisabled: tokens.colors.border.light,
      hapticType: 'light',
    },
    ghost: {
      background: 'transparent',
      backgroundPressed: tokens.colors.primary[50],
      backgroundDisabled: 'transparent',
      text: tokens.colors.primary[500],
      textPressed: tokens.colors.primary[600],
      textDisabled: tokens.colors.text.disabled,
      hapticType: 'light',
    },
    destructive: {
      background: tokens.colors.semantic.error.main,
      backgroundPressed: tokens.colors.semantic.error.dark,
      backgroundDisabled: tokens.colors.semantic.error.light,
      text: tokens.colors.text.inverse,
      textPressed: tokens.colors.text.inverse,
      textDisabled: tokens.colors.neutral[400],
      hapticType: 'heavy',
    },
    bulk: {
      background: tokens.colors.semantic.info.main,
      backgroundPressed: tokens.colors.semantic.info.dark,
      backgroundDisabled: tokens.colors.semantic.info.light,
      text: tokens.colors.text.inverse,
      textPressed: tokens.colors.text.inverse,
      textDisabled: tokens.colors.neutral[400],
      hapticType: 'medium',
    },
  };

  const dimensions = sizeConfig[size || 'medium'];
  const colors = variantConfig[variant || 'primary'];

  // Shadow configuration based on theme variant
  const getShadow = () => {
    if (themeVariant === 'teacher') {
      return variant === 'primary' ? tokens.shadows.xs : tokens.shadows.none;
    }
    
    const shadowMap: Record<string, any> = {
      primary: tokens.shadows.sm,
      destructive: tokens.shadows.sm,
      bulk: tokens.shadows.sm,
      outline: tokens.shadows.xs,
      secondary: tokens.shadows.none,
      ghost: tokens.shadows.none,
    };
    
    return shadowMap[variant || 'primary'] || tokens.shadows.none;
  };

  return {
    dimensions,
    colors,
    shadow: getShadow(),
  };
};

// Styles
const styles = {
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    position: 'relative' as const,
  },
  contentContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flex: 1,
  },
  text: {
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center' as const,
    includeFontPadding: false,
  },
  disabled: {
    opacity: 0.38,
  },
  loadingContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  loadingIndicator: {
    marginRight: 8,
  },
  selectionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  selectionBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
};

export default Button;