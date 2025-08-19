/**
 * Animated Button Component - Harry School Design System
 * 
 * Enhanced button with delightful micro-interactions including:
 * - Press animations with haptic feedback
 * - Loading states with spinners
 * - Success/error state transitions
 * - Accessibility support with reduced motion
 */

import React from 'react';
import { Pressable, PressableProps, ViewStyle, TextStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from './Text';
import { animations } from '../theme/animations';
import { colors } from '../theme/colors';

interface AnimatedButtonProps extends Omit<PressableProps, 'style'> {
  // Button content
  title: string;
  
  // Visual variants
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  
  // State props
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  
  // Animation props
  hapticType?: 'light' | 'medium' | 'heavy';
  
  // Style props
  style?: ViewStyle;
  textStyle?: TextStyle;
  
  // Icon props (for future enhancement)
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  success = false,
  error = false,
  hapticType = 'light',
  style,
  textStyle,
  leftIcon,
  rightIcon,
  disabled,
  onPress,
  ...pressableProps
}) => {
  // Animation hooks
  const { animatedStyle, onPressIn, onPressOut } = animations.button.usePress(hapticType);
  const loadingStyle = animations.button.useLoading();
  const { animatedStyle: successStyle, triggerSuccess } = animations.button.useSuccess();
  const { animatedStyle: shakeStyle, shake } = animations.feedback.useValidationShake();
  
  // Trigger success animation when success prop changes
  React.useEffect(() => {
    if (success) {
      triggerSuccess();
    }
  }, [success, triggerSuccess]);
  
  // Trigger error animation when error prop changes
  React.useEffect(() => {
    if (error) {
      shake();
    }
  }, [error, shake]);
  
  // Get button colors based on variant
  const getButtonColors = () => {
    switch (variant) {
      case 'primary':
        return {
          background: colors.semantic.primary.main,
          text: colors.semantic.primary.contrast,
          pressedBackground: colors.semantic.primary.dark,
        };
      case 'secondary':
        return {
          background: colors.semantic.secondary.main,
          text: colors.semantic.secondary.contrast,
          pressedBackground: colors.semantic.secondary.dark,
        };
      case 'success':
        return {
          background: colors.semantic.success.main,
          text: colors.semantic.success.contrast,
          pressedBackground: colors.semantic.success.dark,
        };
      case 'warning':
        return {
          background: colors.semantic.warning.main,
          text: colors.semantic.warning.contrast,
          pressedBackground: colors.semantic.warning.dark,
        };
      case 'error':
        return {
          background: colors.semantic.error.main,
          text: colors.semantic.error.contrast,
          pressedBackground: colors.semantic.error.dark,
        };
      default:
        return {
          background: colors.semantic.primary.main,
          text: colors.semantic.primary.contrast,
          pressedBackground: colors.semantic.primary.dark,
        };
    }
  };
  
  // Get button size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 6,
          fontSize: 14,
          minHeight: 32,
        };
      case 'medium':
        return {
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 8,
          fontSize: 16,
          minHeight: 44,
        };
      case 'large':
        return {
          paddingHorizontal: 24,
          paddingVertical: 16,
          borderRadius: 12,
          fontSize: 18,
          minHeight: 56,
        };
      default:
        return {
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 8,
          fontSize: 16,
          minHeight: 44,
        };
    }
  };
  
  const buttonColors = getButtonColors();
  const sizeStyles = getSizeStyles();
  const isDisabled = disabled || loading;
  
  // Combine all animation styles
  const combinedAnimatedStyle = [
    animatedStyle,
    loading ? loadingStyle : null,
    success ? successStyle : null,
    error ? shakeStyle : null,
  ];
  
  const handlePress = (event: any) => {
    if (!isDisabled && onPress) {
      onPress(event);
    }
  };
  
  return (
    <AnimatedPressable
      style={[
        {
          backgroundColor: isDisabled 
            ? colors.withOpacity(buttonColors.background, 0.5)
            : buttonColors.background,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          ...sizeStyles,
        },
        combinedAnimatedStyle,
        style,
      ]}
      onPress={handlePress}
      onPressIn={isDisabled ? undefined : onPressIn}
      onPressOut={isDisabled ? undefined : onPressOut}
      disabled={isDisabled}
      {...pressableProps}
    >
      {/* Left Icon */}
      {leftIcon && !loading && (
        <Animated.View style={{ marginRight: 8 }}>
          {leftIcon}
        </Animated.View>
      )}
      
      {/* Loading Spinner */}
      {loading && (
        <Animated.View 
          style={[
            loadingStyle,
            { 
              width: 20, 
              height: 20, 
              borderRadius: 10,
              borderWidth: 2,
              borderColor: colors.withOpacity(buttonColors.text, 0.3),
              borderTopColor: buttonColors.text,
              marginRight: title ? 8 : 0,
            }
          ]} 
        />
      )}
      
      {/* Button Text */}
      {title && (
        <Text
          style={[
            {
              color: isDisabled 
                ? colors.withOpacity(buttonColors.text, 0.5)
                : buttonColors.text,
              fontSize: sizeStyles.fontSize,
              fontWeight: '600',
              textAlign: 'center',
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
      
      {/* Right Icon */}
      {rightIcon && !loading && (
        <Animated.View style={{ marginLeft: 8 }}>
          {rightIcon}
        </Animated.View>
      )}
    </AnimatedPressable>
  );
};

export default AnimatedButton;