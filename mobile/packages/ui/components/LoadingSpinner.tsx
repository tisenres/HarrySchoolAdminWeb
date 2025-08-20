/**
 * Loading Spinner Component - Harry School Design System
 * 
 * Educational-themed loading spinners with contextual messaging
 * Features:
 * - Multiple educational spinner variants
 * - Context-aware loading messages
 * - Performance-optimized animations
 * - Teacher vs student optimized timing
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  useSharedValue,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Text } from './Text';
import { animations } from '../theme/animations';
import { colors } from '../theme/colors';

type LoadingContext = 'teacher' | 'student' | 'general';
type SpinnerVariant = 'dots' | 'books' | 'pencil' | 'brain' | 'star' | 'minimal';

interface LoadingSpinnerProps {
  // Context and behavior
  context?: LoadingContext;
  variant?: SpinnerVariant;
  message?: string;
  
  // Visual customization
  size?: 'small' | 'medium' | 'large';
  color?: string;
  
  // Performance options
  reducedMotion?: boolean;
  
  // Style props
  style?: ViewStyle;
  
  // Accessibility
  accessibilityLabel?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  context = 'general',
  variant = 'dots',
  message,
  size = 'medium',
  color,
  reducedMotion = false,
  style,
  accessibilityLabel,
}) => {
  const isReducedMotion = reducedMotion || animations.useReducedMotion();
  
  // Animation values
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  // Size configuration
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          containerSize: 32,
          spinnerSize: 24,
          fontSize: 12,
          iconSize: 16,
        };
      case 'medium':
        return {
          containerSize: 48,
          spinnerSize: 36,
          fontSize: 14,
          iconSize: 24,
        };
      case 'large':
        return {
          containerSize: 64,
          spinnerSize: 48,
          fontSize: 16,
          iconSize: 32,
        };
      default:
        return {
          containerSize: 48,
          spinnerSize: 36,
          fontSize: 14,
          iconSize: 24,
        };
    }
  };
  
  const sizeConfig = getSizeConfig();
  const spinnerColor = color || colors.semantic.primary.main;
  
  // Context-specific timing (faster for teachers, more engaging for students)
  const getTimingConfig = () => {
    switch (context) {
      case 'teacher':
        return {
          duration: 800, // Faster for efficiency
          pulseIntensity: 0.1, // Minimal distraction
        };
      case 'student':
        return {
          duration: 1200, // More engaging
          pulseIntensity: 0.3, // More noticeable
        };
      default:
        return {
          duration: 1000,
          pulseIntensity: 0.2,
        };
    }
  };
  
  const timingConfig = getTimingConfig();
  
  // Start animations
  React.useEffect(() => {
    if (!isReducedMotion) {
      rotation.value = withRepeat(
        withTiming(360, { duration: timingConfig.duration }),
        -1,
        false
      );
      
      scale.value = withRepeat(
        withSequence(
          withTiming(1 + timingConfig.pulseIntensity, { duration: timingConfig.duration / 2 }),
          withTiming(1, { duration: timingConfig.duration / 2 })
        ),
        -1,
        true
      );
      
      if (variant === 'brain') {
        opacity.value = withRepeat(
          withSequence(
            withTiming(0.6, { duration: timingConfig.duration / 2 }),
            withTiming(1, { duration: timingConfig.duration / 2 })
          ),
          -1,
          true
        );
      }
    }
  }, [isReducedMotion, timingConfig, variant]);
  
  // Spinner variants
  const renderSpinner = () => {
    const baseStyle = {
      width: sizeConfig.spinnerSize,
      height: sizeConfig.spinnerSize,
      justifyContent: 'center',
      alignItems: 'center',
    } as ViewStyle;
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value }
      ],
      opacity: opacity.value,
    }));
    
    switch (variant) {
      case 'dots':
        return (
          <Animated.View style={[baseStyle, animatedStyle]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {[0, 1, 2].map((index) => (
                <DotSpinner
                  key={index}
                  delay={index * 200}
                  color={spinnerColor}
                  size={sizeConfig.iconSize / 3}
                  isReducedMotion={isReducedMotion}
                />
              ))}
            </View>
          </Animated.View>
        );
        
      case 'books':
        return (
          <Animated.View style={[baseStyle, animatedStyle]}>
            <Text style={{ fontSize: sizeConfig.iconSize, color: spinnerColor }}>
              📚
            </Text>
          </Animated.View>
        );
        
      case 'pencil':
        return (
          <Animated.View style={[baseStyle, animatedStyle]}>
            <Text style={{ fontSize: sizeConfig.iconSize, color: spinnerColor }}>
              ✏️
            </Text>
          </Animated.View>
        );
        
      case 'brain':
        return (
          <Animated.View style={[baseStyle, animatedStyle]}>
            <Text style={{ fontSize: sizeConfig.iconSize }}>
              🧠
            </Text>
          </Animated.View>
        );
        
      case 'star':
        return (
          <Animated.View style={[baseStyle, animatedStyle]}>
            <Text style={{ fontSize: sizeConfig.iconSize, color: spinnerColor }}>
              ⭐
            </Text>
          </Animated.View>
        );
        
      case 'minimal':
      default:
        return (
          <Animated.View
            style={[
              baseStyle,
              animatedStyle,
              {
                borderWidth: 3,
                borderColor: colors.withOpacity(spinnerColor, 0.3),
                borderTopColor: spinnerColor,
                borderRadius: sizeConfig.spinnerSize / 2,
              },
            ]}
          />
        );
    }
  };
  
  // Context-specific default messages
  const getDefaultMessage = () => {
    switch (context) {
      case 'teacher':
        return 'Loading...';
      case 'student':
        return 'Getting ready...';
      default:
        return 'Loading...';
    }
  };
  
  const displayMessage = message || getDefaultMessage();
  
  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: sizeConfig.containerSize + (displayMessage ? 30 : 0),
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel || `Loading: ${displayMessage}`}
    >
      {renderSpinner()}
      
      {displayMessage && (
        <Text
          style={{
            marginTop: 12,
            fontSize: sizeConfig.fontSize,
            color: colors.text.secondary,
            textAlign: 'center',
            fontWeight: '500',
          }}
        >
          {displayMessage}
        </Text>
      )}
    </View>
  );
};

// Individual dot spinner component for the dots variant
interface DotSpinnerProps {
  delay: number;
  color: string;
  size: number;
  isReducedMotion: boolean;
}

const DotSpinner: React.FC<DotSpinnerProps> = ({ 
  delay, 
  color, 
  size, 
  isReducedMotion 
}) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.4);
  
  React.useEffect(() => {
    if (!isReducedMotion) {
      const animationWithDelay = () => {
        scale.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: 400 }),
            withTiming(0.8, { duration: 400 })
          ),
          -1,
          true
        );
        
        opacity.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0.4, { duration: 400 })
          ),
          -1,
          true
        );
      };
      
      const timer = setTimeout(animationWithDelay, delay);
      return () => clearTimeout(timer);
    }
  }, [delay, isReducedMotion]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          marginHorizontal: 2,
        },
        animatedStyle,
      ]}
    />
  );
};

export default LoadingSpinner;