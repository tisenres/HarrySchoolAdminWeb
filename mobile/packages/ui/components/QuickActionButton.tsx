/**
 * Quick Action Button Component - Harry School Design System
 * 
 * Optimized button for teacher efficiency with instant feedback
 * Features:
 * - Ultra-fast animations (100-150ms) for teacher workflows
 * - Contextual icons and colors
 * - Batch action support
 * - Success/error state management
 */

import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from './Text';
import { animations } from '../theme/animations';
import { colors } from '../theme/colors';

type ActionType = 'approve' | 'reject' | 'edit' | 'delete' | 'save' | 'send' | 'call' | 'message';

interface QuickActionButtonProps {
  // Action configuration
  action: ActionType;
  label?: string;
  
  // State management
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  disabled?: boolean;
  
  // Visual customization
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium';
  showLabel?: boolean;
  customIcon?: string;
  
  // Interaction
  onPress: () => void;
  onLongPress?: () => void;
  
  // Batch mode
  batchMode?: boolean;
  batchCount?: number;
  
  // Style props
  style?: ViewStyle;
  
  // Accessibility
  accessibilityLabel?: string;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  action,
  label,
  loading = false,
  success = false,
  error = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  showLabel = true,
  customIcon,
  onPress,
  onLongPress,
  batchMode = false,
  batchCount = 0,
  style,
  accessibilityLabel,
  testID,
}) => {
  // Teacher-optimized animations (faster, less distracting)
  const { animatedStyle, onPressIn, onPressOut } = animations.button.usePress('medium');
  const { animatedStyle: submitStyle, submitSuccess } = animations.teacher.useQuickSubmit();
  const { animatedStyle: shakeStyle, shake } = animations.feedback.useValidationShake();
  const loadingStyle = animations.button.useLoading();
  
  // Trigger animations based on state changes
  React.useEffect(() => {
    if (success) {
      submitSuccess();
    }
  }, [success]);
  
  React.useEffect(() => {
    if (error) {
      shake();
    }
  }, [error]);
  
  // Action configuration
  const getActionConfig = (actionType: ActionType) => {
    switch (actionType) {
      case 'approve':
        return {
          icon: '✓',
          color: colors.semantic.success.main,
          bgColor: colors.semantic.success.light,
          label: 'Approve',
        };
      case 'reject':
        return {
          icon: '✗',
          color: colors.semantic.error.main,
          bgColor: colors.semantic.error.light,
          label: 'Reject',
        };
      case 'edit':
        return {
          icon: '✏️',
          color: colors.semantic.primary.main,
          bgColor: colors.semantic.primary.light,
          label: 'Edit',
        };
      case 'delete':
        return {
          icon: '🗑️',
          color: colors.semantic.error.main,
          bgColor: colors.semantic.error.light,
          label: 'Delete',
        };
      case 'save':
        return {
          icon: '💾',
          color: colors.semantic.success.main,
          bgColor: colors.semantic.success.light,
          label: 'Save',
        };
      case 'send':
        return {
          icon: '📤',
          color: colors.semantic.primary.main,
          bgColor: colors.semantic.primary.light,
          label: 'Send',
        };
      case 'call':
        return {
          icon: '📞',
          color: colors.semantic.info.main,
          bgColor: colors.semantic.info.light,
          label: 'Call',
        };
      case 'message':
        return {
          icon: '💬',
          color: colors.semantic.info.main,
          bgColor: colors.semantic.info.light,
          label: 'Message',
        };
      default:
        return {
          icon: '⚡',
          color: colors.semantic.primary.main,
          bgColor: colors.semantic.primary.light,
          label: 'Action',
        };
    }
  };
  
  // Size configuration
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: showLabel ? 'auto' : 32,
          height: 32,
          paddingHorizontal: showLabel ? 12 : 0,
          borderRadius: 6,
          iconSize: 14,
          fontSize: 12,
          minWidth: showLabel ? 60 : 32,
        };
      case 'medium':
        return {
          width: showLabel ? 'auto' : 44,
          height: 44,
          paddingHorizontal: showLabel ? 16 : 0,
          borderRadius: 8,
          iconSize: 18,
          fontSize: 14,
          minWidth: showLabel ? 80 : 44,
        };
      default:
        return {
          width: showLabel ? 'auto' : 44,
          height: 44,
          paddingHorizontal: showLabel ? 16 : 0,
          borderRadius: 8,
          iconSize: 18,
          fontSize: 14,
          minWidth: showLabel ? 80 : 44,
        };
    }
  };
  
  // Variant styling
  const getVariantStyles = (actionConfig: any) => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? colors.neutral[200] : actionConfig.bgColor,
          borderColor: disabled ? colors.neutral[300] : actionConfig.color,
          borderWidth: 1,
          textColor: disabled ? colors.neutral[500] : actionConfig.color,
        };
      case 'secondary':
        return {
          backgroundColor: colors.background.primary,
          borderColor: disabled ? colors.neutral[300] : actionConfig.color,
          borderWidth: 1,
          textColor: disabled ? colors.neutral[500] : actionConfig.color,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
          textColor: disabled ? colors.neutral[500] : actionConfig.color,
        };
      default:
        return {
          backgroundColor: disabled ? colors.neutral[200] : actionConfig.bgColor,
          borderColor: disabled ? colors.neutral[300] : actionConfig.color,
          borderWidth: 1,
          textColor: disabled ? colors.neutral[500] : actionConfig.color,
        };
    }
  };
  
  const actionConfig = getActionConfig(action);
  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles(actionConfig);
  
  const isDisabled = disabled || loading;
  const displayLabel = label || actionConfig.label;
  const displayIcon = customIcon || actionConfig.icon;
  
  // Combine animation styles
  const combinedAnimatedStyle = [
    animatedStyle,
    submitStyle,
    error ? shakeStyle : null,
  ];
  
  const handlePress = () => {
    if (!isDisabled) {
      onPress();
    }
  };
  
  const handleLongPress = () => {
    if (!isDisabled && onLongPress) {
      onLongPress();
    }
  };
  
  return (
    <AnimatedPressable
      style={[
        {
          width: sizeStyles.width,
          height: sizeStyles.height,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          borderRadius: sizeStyles.borderRadius,
          minWidth: sizeStyles.minWidth,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.neutral[900],
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: variant !== 'ghost' ? 0.1 : 0,
          shadowRadius: 2,
          elevation: variant !== 'ghost' ? 1 : 0,
          ...variantStyles,
        },
        combinedAnimatedStyle,
        style,
      ]}
      onPress={handlePress}
      onPressIn={isDisabled ? undefined : onPressIn}
      onPressOut={isDisabled ? undefined : onPressOut}
      onLongPress={handleLongPress}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel || `${displayLabel} button`}
      testID={testID}
    >
      {/* Loading Spinner */}
      {loading && (
        <Animated.View
          style={[
            loadingStyle,
            {
              width: sizeStyles.iconSize,
              height: sizeStyles.iconSize,
              borderRadius: sizeStyles.iconSize / 2,
              borderWidth: 2,
              borderColor: colors.withOpacity(variantStyles.textColor, 0.3),
              borderTopColor: variantStyles.textColor,
              marginRight: showLabel ? 6 : 0,
            },
          ]}
        />
      )}
      
      {/* Action Icon */}
      {!loading && (
        <Text
          style={{
            fontSize: sizeStyles.iconSize,
            marginRight: showLabel ? 6 : 0,
          }}
        >
          {displayIcon}
        </Text>
      )}
      
      {/* Action Label */}
      {showLabel && (
        <Text
          style={{
            fontSize: sizeStyles.fontSize,
            fontWeight: '600',
            color: variantStyles.textColor,
          }}
        >
          {displayLabel}
        </Text>
      )}
      
      {/* Batch Count Badge */}
      {batchMode && batchCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: colors.semantic.error.main,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 4,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: colors.semantic.error.contrast,
            }}
          >
            {batchCount > 99 ? '99+' : batchCount}
          </Text>
        </View>
      )}
      
      {/* Success Indicator */}
      {success && !loading && (
        <View
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: colors.semantic.success.main,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 8,
              color: colors.semantic.success.contrast,
            }}
          >
            ✓
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
};

export default QuickActionButton;