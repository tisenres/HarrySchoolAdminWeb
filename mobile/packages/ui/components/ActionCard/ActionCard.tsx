/**
 * ActionCard Component
 * Harry School Mobile Design System
 * 
 * Large prominent action cards with gradients and animations
 * Optimized for primary actions and call-to-action buttons
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Platform,
  HapticFeedback,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import { ActionCardProps, ActionSize, ActionVariant } from './ActionCard.types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  subtitle,
  description,
  icon,
  badge,
  size = 'default',
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  loading = false,
  progress,
  onPress,
  onLongPress,
  enableHaptics = true,
  enablePulse = false,
  glowEffect = false,
  theme = 'dark',
  customGradient,
  style,
  testID = 'action-card',
}) => {
  const { theme: designTheme } = useTheme();
  const tokens = designTheme.tokens;
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const progressValue = useSharedValue(progress || 0);
  
  // Theme colors for dark mode
  const themeColors = useMemo(() => ({
    background: theme === 'dark' ? '#2d2d2d' : tokens.colors.background.primary,
    backgroundSecondary: theme === 'dark' ? '#3a3a3a' : tokens.colors.background.secondary,
    text: theme === 'dark' ? '#ffffff' : tokens.colors.text.primary,
    textSecondary: theme === 'dark' ? '#a0a0a0' : tokens.colors.text.secondary,
    border: theme === 'dark' ? '#4a4a4a' : tokens.colors.border.light,
    accent: '#1d7452', // Harry School green
    gold: '#fbbf24', // Golden accents
    primary: '#1d7452',
    secondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  }), [theme, tokens]);
  
  // Size configuration
  const sizeConfig = useMemo(() => ({
    small: {
      height: 80,
      padding: 16,
      iconSize: 24,
      titleSize: 16,
      subtitleSize: 12,
    },
    default: {
      height: 120,
      padding: 20,
      iconSize: 32,
      titleSize: 18,
      subtitleSize: 14,
    },
    large: {
      height: 160,
      padding: 24,
      iconSize: 40,
      titleSize: 20,
      subtitleSize: 16,
    },
  }), []);
  
  const config = sizeConfig[size];
  
  // Variant configuration
  const variantConfig = useMemo(() => ({
    primary: {
      gradient: customGradient || [themeColors.accent, '#0f9b66'],
      textColor: '#ffffff',
      shadowColor: themeColors.accent,
    },
    secondary: {
      gradient: customGradient || [themeColors.secondary, '#4b5563'],
      textColor: '#ffffff',
      shadowColor: themeColors.secondary,
    },
    success: {
      gradient: customGradient || [themeColors.success, '#059669'],
      textColor: '#ffffff',
      shadowColor: themeColors.success,
    },
    warning: {
      gradient: customGradient || [themeColors.warning, '#d97706'],
      textColor: '#ffffff',
      shadowColor: themeColors.warning,
    },
    error: {
      gradient: customGradient || [themeColors.error, '#dc2626'],
      textColor: '#ffffff',
      shadowColor: themeColors.error,
    },
    info: {
      gradient: customGradient || [themeColors.info, '#1d4ed8'],
      textColor: '#ffffff',
      shadowColor: themeColors.info,
    },
    gold: {
      gradient: customGradient || [themeColors.gold, '#f59e0b'],
      textColor: '#000000',
      shadowColor: themeColors.gold,
    },
    outline: {
      gradient: ['transparent', 'transparent'],
      textColor: themeColors.text,
      shadowColor: 'transparent',
      borderColor: themeColors.border,
    },
  }), [themeColors, customGradient]);
  
  const currentVariant = variantConfig[variant];
  
  // Haptic feedback handler
  const triggerHaptic = useCallback(() => {
    if (enableHaptics && Platform.OS === 'ios') {
      HapticFeedback.trigger(loading ? 'medium' : 'light');
    }
  }, [enableHaptics, loading]);
  
  // Press handlers
  const handlePressIn = useCallback(() => {
    if (disabled || loading) return;
    
    triggerHaptic();
    scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
    
    if (glowEffect) {
      glowOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [disabled, loading, triggerHaptic, scale, glowEffect, glowOpacity]);
  
  const handlePressOut = useCallback(() => {
    if (disabled || loading) return;
    
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    
    if (glowEffect) {
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [disabled, loading, scale, glowEffect, glowOpacity]);
  
  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    onPress?.();
  }, [disabled, loading, onPress]);
  
  const handleLongPress = useCallback(() => {
    if (disabled || loading) return;
    if (Platform.OS === 'ios' && enableHaptics) {
      HapticFeedback.trigger('heavy');
    }
    onLongPress?.();
  }, [disabled, loading, enableHaptics, onLongPress]);
  
  // Pulse animation effect
  useEffect(() => {
    if (enablePulse && !disabled && !loading) {
      const interval = setInterval(() => {
        pulseScale.value = withSequence(
          withSpring(1.02, { damping: 15, stiffness: 200 }),
          withSpring(1, { damping: 15, stiffness: 200 })
        );
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [enablePulse, disabled, loading, pulseScale]);
  
  // Progress animation
  useEffect(() => {
    if (progress !== undefined) {
      progressValue.value = withTiming(progress, { duration: 500 });
    }
  }, [progress, progressValue]);
  
  // Disabled state animation
  useEffect(() => {
    opacity.value = withTiming(disabled ? 0.5 : 1, { duration: 200 });
  }, [disabled, opacity]);
  
  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { scale: pulseScale.value },
    ],
    opacity: opacity.value,
  }));
  
  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    shadowOpacity: interpolate(
      glowOpacity.value,
      [0, 1],
      [0, 0.4],
      Extrapolate.CLAMP
    ),
    shadowRadius: interpolate(
      glowOpacity.value,
      [0, 1],
      [0, 16],
      Extrapolate.CLAMP
    ),
  }));
  
  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));
  
  // Render badge
  const renderBadge = () => {
    if (!badge) return null;
    
    return (
      <View
        style={[
          styles.badge,
          {
            backgroundColor: badge.color || '#ef4444',
          },
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            { color: badge.textColor || '#ffffff' },
          ]}
        >
          {badge.text}
        </Text>
      </View>
    );
  };
  
  // Render progress bar
  const renderProgress = () => {
    if (progress === undefined) return null;
    
    return (
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBackground,
            { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
          ]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: 'rgba(255, 255, 255, 0.8)' },
              progressAnimatedStyle,
            ]}
          />
        </View>
      </View>
    );
  };
  
  // Render loading indicator
  const renderLoadingIndicator = () => {
    if (!loading) return null;
    
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingSpinner} />
      </View>
    );
  };
  
  const cardWidth = fullWidth ? SCREEN_WIDTH - 40 : undefined;
  
  return (
    <AnimatedPressable
      style={[
        cardAnimatedStyle,
        glowAnimatedStyle,
        {
          width: cardWidth,
          height: config.height,
          shadowColor: currentVariant.shadowColor,
        },
        style,
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ''}${description ? `, ${description}` : ''}`}
      accessibilityHint="Double tap to activate"
      accessibilityState={{ disabled: disabled || loading }}
      testID={testID}
    >
      <LinearGradient
        colors={currentVariant.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.container,
          {
            padding: config.padding,
            borderWidth: variant === 'outline' ? 1 : 0,
            borderColor: currentVariant.borderColor,
          },
        ]}
      >
        {/* Badge */}
        {renderBadge()}
        
        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          {icon && (
            <View style={styles.iconContainer}>
              <Text style={[styles.icon, { fontSize: config.iconSize }]}>
                {icon}
              </Text>
            </View>
          )}
          
          {/* Text content */}
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                {
                  color: currentVariant.textColor,
                  fontSize: config.titleSize,
                },
              ]}
              numberOfLines={2}
            >
              {title}
            </Text>
            
            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: currentVariant.textColor,
                    fontSize: config.subtitleSize,
                    opacity: 0.8,
                  },
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
            
            {description && (
              <Text
                style={[
                  styles.description,
                  {
                    color: currentVariant.textColor,
                    opacity: 0.7,
                  },
                ]}
                numberOfLines={size === 'small' ? 1 : 2}
              >
                {description}
              </Text>
            )}
          </View>
        </View>
        
        {/* Progress bar */}
        {renderProgress()}
        
        {/* Loading indicator */}
        {renderLoadingIndicator()}
      </LinearGradient>
    </AnimatedPressable>
  );
};

const styles = {
  container: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative' as const,
  },
  content: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  iconContainer: {
    marginRight: 16,
  },
  icon: {
    textAlign: 'center' as const,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 2,
  },
  subtitle: {
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  badge: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center' as const,
  },
  progressContainer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  progressBackground: {
    height: '100%',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  loadingContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingSpinner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
  },
};

ActionCard.displayName = 'ActionCard';

export default ActionCard;