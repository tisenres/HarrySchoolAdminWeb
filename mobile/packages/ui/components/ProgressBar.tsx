/**
 * Progress Bar Component - Harry School Design System
 * 
 * Animated progress bar with satisfying easing and educational theming
 * Features:
 * - Smooth progress animation with educational easing
 * - Multiple visual variants (default, success, warning, error)
 * - Configurable size and styling
 * - Accessibility support with progress announcements
 * - Optional label and percentage display
 */

import React from 'react';
import { View, ViewStyle, AccessibilityInfo } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from './Text';
import { animations } from '../theme/animations';
import { colors } from '../theme/colors';

interface ProgressBarProps {
  // Progress value (0-100)
  progress: number;
  
  // Visual variants
  variant?: 'default' | 'success' | 'warning' | 'error' | 'primary';
  size?: 'small' | 'medium' | 'large';
  
  // Display options
  showLabel?: boolean;
  label?: string;
  showPercentage?: boolean;
  
  // Style props
  style?: ViewStyle;
  trackColor?: string;
  fillColor?: string;
  
  // Accessibility
  accessibilityLabel?: string;
  
  // Animation props
  animationDuration?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  variant = 'default',
  size = 'medium',
  showLabel = false,
  label,
  showPercentage = false,
  style,
  trackColor,
  fillColor,
  accessibilityLabel,
  animationDuration,
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  // Animation hook
  const progressStyle = animations.educational.useProgressBar(clampedProgress);
  
  // Get variant colors
  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return {
          fill: colors.semantic.success.main,
          track: colors.withOpacity(colors.semantic.success.main, 0.2),
        };
      case 'warning':
        return {
          fill: colors.semantic.warning.main,
          track: colors.withOpacity(colors.semantic.warning.main, 0.2),
        };
      case 'error':
        return {
          fill: colors.semantic.error.main,
          track: colors.withOpacity(colors.semantic.error.main, 0.2),
        };
      case 'primary':
        return {
          fill: colors.semantic.primary.main,
          track: colors.withOpacity(colors.semantic.primary.main, 0.2),
        };
      default:
        return {
          fill: colors.educational.performance.good,
          track: colors.withOpacity(colors.educational.performance.good, 0.2),
        };
    }
  };
  
  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 4,
          borderRadius: 2,
        };
      case 'medium':
        return {
          height: 8,
          borderRadius: 4,
        };
      case 'large':
        return {
          height: 12,
          borderRadius: 6,
        };
      default:
        return {
          height: 8,
          borderRadius: 4,
        };
    }
  };
  
  const variantColors = getVariantColors();
  const sizeStyles = getSizeStyles();
  
  const finalTrackColor = trackColor || variantColors.track;
  const finalFillColor = fillColor || variantColors.fill;
  
  // Announce progress changes for accessibility
  React.useEffect(() => {
    if (accessibilityLabel) {
      AccessibilityInfo.announceForAccessibility(
        `${accessibilityLabel}: ${Math.round(clampedProgress)}% complete`
      );
    }
  }, [clampedProgress, accessibilityLabel]);
  
  return (
    <View style={[{ width: '100%' }, style]}>
      {/* Label */}
      {showLabel && label && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: colors.text.secondary,
            }}
          >
            {label}
          </Text>
          {showPercentage && (
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.text.primary,
              }}
            >
              {Math.round(clampedProgress)}%
            </Text>
          )}
        </View>
      )}
      
      {/* Progress Bar Track */}
      <View
        style={[
          {
            backgroundColor: finalTrackColor,
            overflow: 'hidden',
            ...sizeStyles,
          },
        ]}
        accessible={true}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: clampedProgress,
        }}
        accessibilityLabel={accessibilityLabel}
      >
        {/* Progress Bar Fill */}
        <Animated.View
          style={[
            progressStyle,
            {
              height: '100%',
              backgroundColor: finalFillColor,
              borderRadius: sizeStyles.borderRadius,
            },
          ]}
        />
      </View>
      
      {/* Percentage (if not shown in label) */}
      {showPercentage && !showLabel && (
        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: colors.text.secondary,
            }}
          >
            {Math.round(clampedProgress)}%
          </Text>
        </View>
      )}
    </View>
  );
};

export default ProgressBar;