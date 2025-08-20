/**
 * Points Counter Component - Harry School Design System
 * 
 * Animated points counter with celebration effects for student engagement
 * Features:
 * - Smooth count-up animations
 * - Point earning celebrations with particles
 * - Streak multiplier effects
 * - Performance-optimized number interpolation
 */

import React, { useEffect, useRef } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Text } from './Text';
import { animations } from '../theme/animations';
import { colors } from '../theme/colors';

interface PointsCounterProps {
  // Points data
  currentPoints: number;
  previousPoints?: number;
  maxPoints?: number;
  
  // Visual customization
  size?: 'small' | 'medium' | 'large';
  variant?: 'standard' | 'celebration' | 'minimal';
  showIcon?: boolean;
  customIcon?: string;
  
  // Animation configuration
  animationDuration?: number;
  celebrateOnIncrease?: boolean;
  showStreakMultiplier?: boolean;
  streakMultiplier?: number;
  
  // Style props
  style?: ViewStyle;
  textColor?: string;
  backgroundColor?: string;
  
  // Callbacks
  onPointsAnimationComplete?: () => void;
  onCelebrationComplete?: () => void;
}

export const PointsCounter: React.FC<PointsCounterProps> = ({
  currentPoints,
  previousPoints = 0,
  maxPoints,
  size = 'medium',
  variant = 'standard',
  showIcon = true,
  customIcon = '⭐',
  animationDuration,
  celebrateOnIncrease = true,
  showStreakMultiplier = false,
  streakMultiplier = 1,
  style,
  textColor,
  backgroundColor,
  onPointsAnimationComplete,
  onCelebrationComplete,
}) => {
  const previousPointsRef = useRef(previousPoints);
  
  // Animation hooks
  const { animatedStyle: earnStyle, pointCount, earnPoints } = animations.engagement.usePointEarning(currentPoints);
  const { animatedStyle: celebrationStyle, celebrate } = animations.educational.useRankingCelebration();
  const progressStyle = maxPoints ? animations.educational.useProgressBar((currentPoints / maxPoints) * 100) : null;
  
  // Size configuration
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          containerHeight: 32,
          fontSize: 14,
          iconSize: 16,
          padding: 8,
          borderRadius: 16,
        };
      case 'medium':
        return {
          containerHeight: 40,
          fontSize: 18,
          iconSize: 20,
          padding: 12,
          borderRadius: 20,
        };
      case 'large':
        return {
          containerHeight: 56,
          fontSize: 24,
          iconSize: 28,
          padding: 16,
          borderRadius: 28,
        };
      default:
        return {
          containerHeight: 40,
          fontSize: 18,
          iconSize: 20,
          padding: 12,
          borderRadius: 20,
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  
  // Animated point value for smooth counting
  const animatedPoints = useDerivedValue(() => {
    return Math.floor(pointCount.value);
  });
  
  // Get variant styling
  const getVariantStyles = () => {
    const baseColor = textColor || colors.text.primary;
    const baseBg = backgroundColor || colors.background.secondary;
    
    switch (variant) {
      case 'celebration':
        return {
          backgroundColor: colors.semantic.success.light,
          borderColor: colors.semantic.success.main,
          borderWidth: 2,
          textColor: colors.semantic.success.dark,
          shadowColor: colors.semantic.success.main,
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        };
      case 'minimal':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
          textColor: baseColor,
          shadowOpacity: 0,
        };
      default:
        return {
          backgroundColor: baseBg,
          borderColor: colors.neutral[200],
          borderWidth: 1,
          textColor: baseColor,
          shadowColor: colors.neutral[300],
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 2,
        };
    }
  };
  
  const variantStyles = getVariantStyles();
  
  // Trigger animations when points change
  useEffect(() => {
    const pointDifference = currentPoints - previousPointsRef.current;
    
    if (pointDifference > 0 && celebrateOnIncrease) {
      // Trigger point earning animation
      earnPoints();
      
      // Add celebration if significant point gain
      if (pointDifference >= 50 || streakMultiplier > 1) {
        setTimeout(() => {
          celebrate();
          onCelebrationComplete?.();
        }, 200);
      }
      
      // Animation completion callback
      const timer = setTimeout(() => {
        onPointsAnimationComplete?.();
      }, animationDuration || animations.timings.celebration);
      
      return () => clearTimeout(timer);
    }
    
    previousPointsRef.current = currentPoints;
  }, [currentPoints, celebrateOnIncrease, streakMultiplier]);
  
  // Format points with commas for large numbers
  const formatPoints = (points: number): string => {
    return points.toLocaleString();
  };
  
  return (
    <View style={style}>
      <Animated.View
        style={[
          {
            height: sizeStyles.containerHeight,
            paddingHorizontal: sizeStyles.padding,
            borderRadius: sizeStyles.borderRadius,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            ...variantStyles,
          },
          earnStyle,
          celebrationStyle,
        ]}
      >
        {/* Points Icon */}
        {showIcon && (
          <Text
            style={{
              fontSize: sizeStyles.iconSize,
              marginRight: 6,
            }}
          >
            {customIcon}
          </Text>
        )}
        
        {/* Animated Points Count */}
        <Animated.Text
          style={{
            fontSize: sizeStyles.fontSize,
            fontWeight: '700',
            color: variantStyles.textColor,
          }}
        >
          {formatPoints(currentPoints)}
        </Animated.Text>
        
        {/* Streak Multiplier */}
        {showStreakMultiplier && streakMultiplier > 1 && (
          <View
            style={{
              marginLeft: 8,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 8,
              backgroundColor: colors.semantic.warning.main,
            }}
          >
            <Text
              style={{
                fontSize: sizeStyles.fontSize - 4,
                fontWeight: '600',
                color: colors.semantic.warning.contrast,
              }}
            >
              ×{streakMultiplier}
            </Text>
          </View>
        )}
        
        {/* Progress Bar (if maxPoints provided) */}
        {maxPoints && variant !== 'minimal' && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              backgroundColor: colors.neutral[200],
              borderRadius: 1,
            }}
          >
            <Animated.View
              style={[
                {
                  height: 2,
                  backgroundColor: colors.semantic.success.main,
                  borderRadius: 1,
                },
                progressStyle,
              ]}
            />
          </View>
        )}
        
        {/* Point Increase Indicator */}
        {currentPoints > previousPointsRef.current && variant === 'celebration' && (
          <Animated.View
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              paddingHorizontal: 4,
              paddingVertical: 2,
              borderRadius: 6,
              backgroundColor: colors.semantic.success.main,
              opacity: 0.9,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: '600',
                color: colors.semantic.success.contrast,
              }}
            >
              +{currentPoints - previousPointsRef.current}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
      
      {/* Maximum Points Label */}
      {maxPoints && size !== 'small' && (
        <Text
          style={{
            fontSize: 10,
            color: colors.text.tertiary,
            textAlign: 'center',
            marginTop: 4,
          }}
        >
          / {formatPoints(maxPoints)} pts
        </Text>
      )}
    </View>
  );
};

export default PointsCounter;