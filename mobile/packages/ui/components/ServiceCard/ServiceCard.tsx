/**
 * ServiceCard Component
 * Harry School Mobile Design System
 * 
 * Service option cards with icons and descriptions
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Platform,
  HapticFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import { ServiceCardProps } from './ServiceCard.types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  icon,
  badge,
  isAvailable = true,
  isPopular = false,
  onPress,
  enableHaptics = true,
  theme = 'dark',
  variant = 'default',
  style,
  testID = 'service-card',
}) => {
  const { theme: designTheme } = useTheme();
  const tokens = designTheme.tokens;
  
  const scale = useSharedValue(1);
  
  const themeColors = useMemo(() => ({
    background: theme === 'dark' ? '#2d2d2d' : tokens.colors.background.primary,
    backgroundSecondary: theme === 'dark' ? '#3a3a3a' : tokens.colors.background.secondary,
    text: theme === 'dark' ? '#ffffff' : tokens.colors.text.primary,
    textSecondary: theme === 'dark' ? '#a0a0a0' : tokens.colors.text.secondary,
    border: theme === 'dark' ? '#4a4a4a' : tokens.colors.border.light,
    accent: '#1d7452',
    gold: '#fbbf24',
  }), [theme, tokens]);
  
  const triggerHaptic = useCallback(() => {
    if (enableHaptics && Platform.OS === 'ios') {
      HapticFeedback.trigger('light');
    }
  }, [enableHaptics]);
  
  const handlePress = useCallback(() => {
    if (!isAvailable) return;
    
    triggerHaptic();
    scale.value = withSpring(0.96, { damping: 15, stiffness: 200 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    });
    onPress?.();
  }, [isAvailable, triggerHaptic, scale, onPress]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: isAvailable ? 1 : 0.6,
  }));
  
  const renderBadge = () => {
    if (!badge && !isPopular) return null;
    
    const badgeText = badge || (isPopular ? 'Popular' : '');
    const badgeColor = isPopular ? themeColors.gold : themeColors.accent;
    
    return (
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text style={styles.badgeText}>{badgeText}</Text>
      </View>
    );
  };
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: themeColors.border,
        };
      case 'gradient':
        return {}; // Handled by LinearGradient
      case 'default':
      default:
        return {
          backgroundColor: themeColors.background,
        };
    }
  };
  
  const content = (
    <>
      {renderBadge()}
      
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Text style={[styles.icon, { color: themeColors.accent }]}>
          {icon}
        </Text>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: themeColors.text }]}>
          {title}
        </Text>
        {description && (
          <Text style={[styles.description, { color: themeColors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      
      {/* Availability indicator */}
      {!isAvailable && (
        <View style={styles.unavailableOverlay}>
          <Text style={styles.unavailableText}>Coming Soon</Text>
        </View>
      )}
    </>
  );
  
  const containerStyle = [
    styles.container,
    getVariantStyles(),
    animatedStyle,
    style,
  ];
  
  if (variant === 'gradient') {
    return (
      <AnimatedPressable
        style={animatedStyle}
        onPress={handlePress}
        disabled={!isAvailable}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={description}
        accessibilityState={{ disabled: !isAvailable }}
        testID={testID}
      >
        <LinearGradient
          colors={[themeColors.background, themeColors.backgroundSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.container, style]}
        >
          {content}
        </LinearGradient>
      </AnimatedPressable>
    );
  }
  
  return (
    <AnimatedPressable
      style={containerStyle}
      onPress={handlePress}
      disabled={!isAvailable}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={{ disabled: !isAvailable }}
      testID={testID}
    >
      {content}
    </AnimatedPressable>
  );
};

const styles = {
  container: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 120,
    margin: 8,
    position: 'relative' as const,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badge: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  iconContainer: {
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
    textAlign: 'center' as const,
  },
  content: {
    alignItems: 'center' as const,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center' as const,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center' as const,
    lineHeight: 16,
  },
  unavailableOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  unavailableText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
};

ServiceCard.displayName = 'ServiceCard';

export default ServiceCard;