/**
 * StatsCard Component
 * Harry School Mobile Design System
 * 
 * Stats display with coins, scores, ranking for dark theme Student App
 * Includes animations and gamification elements
 */

import React, { useCallback, useMemo, useEffect } from 'react';
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
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import { StatsCardProps, StatItem, TrendDirection } from './StatsCard.types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Individual stat item component
const StatItemComponent: React.FC<{
  stat: StatItem;
  theme: 'light' | 'dark';
  onPress?: () => void;
  enableHaptics: boolean;
  showTrend: boolean;
  animateValue: boolean;
}> = ({ stat, theme, onPress, enableHaptics, showTrend, animateValue }) => {
  const { theme: designTheme } = useTheme();
  const tokens = designTheme.tokens;
  
  const scale = useSharedValue(1);
  const valueProgress = useSharedValue(0);
  const trendScale = useSharedValue(0);
  
  const themeColors = useMemo(() => ({
    text: theme === 'dark' ? '#ffffff' : tokens.colors.text.primary,
    textSecondary: theme === 'dark' ? '#a0a0a0' : tokens.colors.text.secondary,
    background: theme === 'dark' ? '#2d2d2d' : tokens.colors.background.primary,
    border: theme === 'dark' ? '#4a4a4a' : tokens.colors.border.light,
  }), [theme, tokens]);
  
  // Animate value on mount or change
  useEffect(() => {
    if (animateValue) {
      valueProgress.value = withTiming(1, { duration: 1000 });
    } else {
      valueProgress.value = 1;
    }
  }, [stat.value, animateValue, valueProgress]);
  
  // Animate trend indicator
  useEffect(() => {
    if (showTrend && stat.trend) {
      trendScale.value = withSequence(
        withSpring(1.2, { damping: 15, stiffness: 200 }),
        withSpring(1, { damping: 15, stiffness: 200 })
      );
    }
  }, [stat.trend, showTrend, trendScale]);
  
  const triggerHaptic = useCallback(() => {
    if (enableHaptics && Platform.OS === 'ios') {
      HapticFeedback.trigger('light');
    }
  }, [enableHaptics]);
  
  const handlePress = useCallback(() => {
    triggerHaptic();
    scale.value = withSequence(
      withSpring(0.95, { damping: 15, stiffness: 200 }),
      withSpring(1, { damping: 15, stiffness: 200 })
    );
    onPress?.();
  }, [triggerHaptic, scale, onPress]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const valueAnimatedStyle = useAnimatedStyle(() => {
    const animatedValue = interpolate(
      valueProgress.value,
      [0, 1],
      [0, typeof stat.value === 'number' ? stat.value : 0],
      Extrapolate.CLAMP
    );
    
    return {
      opacity: valueProgress.value,
    };
  });
  
  const trendAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trendScale.value }],
  }));
  
  const formatValue = (value: string | number) => {
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toLocaleString();
    }
    return value;
  };
  
  const getTrendColor = (direction: TrendDirection) => {
    switch (direction) {
      case 'up':
        return '#10b981';
      case 'down':
        return '#ef4444';
      case 'neutral':
      default:
        return themeColors.textSecondary;
    }
  };
  
  const getTrendIcon = (direction: TrendDirection) => {
    switch (direction) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      case 'neutral':
      default:
        return '→';
    }
  };
  
  const Container = onPress ? AnimatedPressable : Animated.View;
  
  return (
    <Container
      style={[statItemStyles.container, animatedStyle]}
      onPress={onPress ? handlePress : undefined}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${stat.label}: ${stat.value}${stat.trend ? `, trending ${stat.trend.direction}` : ''}`}
    >
      {/* Icon */}
      <View style={[statItemStyles.iconContainer, { backgroundColor: `${stat.color}20` }]}>
        <Text style={[statItemStyles.icon, { color: stat.color }]}>
          {stat.icon}
        </Text>
      </View>
      
      {/* Content */}
      <View style={statItemStyles.content}>
        <Text style={[statItemStyles.label, { color: themeColors.textSecondary }]}>
          {stat.label}
        </Text>
        
        <View style={statItemStyles.valueRow}>
          <Animated.Text 
            style={[
              statItemStyles.value, 
              { color: stat.color || themeColors.text },
              valueAnimatedStyle,
            ]}
          >
            {formatValue(stat.value)}
          </Animated.Text>
          
          {showTrend && stat.trend && (
            <Animated.View style={[statItemStyles.trendContainer, trendAnimatedStyle]}>
              <Text style={[statItemStyles.trendIcon, { color: getTrendColor(stat.trend.direction) }]}>
                {getTrendIcon(stat.trend.direction)}
              </Text>
              <Text style={[statItemStyles.trendText, { color: getTrendColor(stat.trend.direction) }]}>
                {stat.trend.percentage}%
              </Text>
            </Animated.View>
          )}
        </View>
        
        {stat.subtitle && (
          <Text style={[statItemStyles.subtitle, { color: themeColors.textSecondary }]}>
            {stat.subtitle}
          </Text>
        )}
      </View>
    </Container>
  );
};

export const StatsCard: React.FC<StatsCardProps> = ({
  stats,
  title,
  subtitle,
  layout = 'grid',
  columns = 2,
  showTrends = true,
  animateValues = true,
  enableHaptics = true,
  onStatPress,
  theme = 'dark',
  variant = 'elevated',
  style,
  testID = 'stats-card',
}) => {
  const { theme: designTheme } = useTheme();
  const tokens = designTheme.tokens;
  
  const cardScale = useSharedValue(1);
  
  // Theme colors for dark mode
  const themeColors = useMemo(() => ({
    background: theme === 'dark' ? '#2d2d2d' : tokens.colors.background.primary,
    backgroundSecondary: theme === 'dark' ? '#3a3a3a' : tokens.colors.background.secondary,
    text: theme === 'dark' ? '#ffffff' : tokens.colors.text.primary,
    textSecondary: theme === 'dark' ? '#a0a0a0' : tokens.colors.text.secondary,
    border: theme === 'dark' ? '#4a4a4a' : tokens.colors.border.light,
    accent: '#1d7452', // Harry School green
    gold: '#fbbf24', // Golden accents
  }), [theme, tokens]);
  
  // Card entrance animation
  useEffect(() => {
    cardScale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [cardScale]);
  
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));
  
  // Render header
  const renderHeader = () => {
    if (!title && !subtitle) return null;
    
    return (
      <View style={styles.header}>
        {title && (
          <Text style={[styles.title, { color: themeColors.text }]}>
            {title}
          </Text>
        )}
        {subtitle && (
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
    );
  };
  
  // Render stats based on layout
  const renderStats = () => {
    if (layout === 'list') {
      return (
        <View style={styles.listContainer}>
          {stats.map((stat, index) => (
            <StatItemComponent
              key={stat.id || index}
              stat={stat}
              theme={theme}
              onPress={onStatPress ? () => onStatPress(stat, index) : undefined}
              enableHaptics={enableHaptics}
              showTrend={showTrends}
              animateValue={animateValues}
            />
          ))}
        </View>
      );
    }
    
    // Grid layout
    return (
      <View style={[styles.gridContainer, { gap: 16 }]}>
        {stats.map((stat, index) => (
          <View
            key={stat.id || index}
            style={[
              styles.gridItem,
              {
                width: `${(100 - (columns - 1) * 4) / columns}%`,
              },
            ]}
          >
            <StatItemComponent
              stat={stat}
              theme={theme}
              onPress={onStatPress ? () => onStatPress(stat, index) : undefined}
              enableHaptics={enableHaptics}
              showTrend={showTrends}
              animateValue={animateValues}
            />
          </View>
        ))}
      </View>
    );
  };
  
  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: themeColors.border,
        };
      case 'filled':
        return {
          backgroundColor: themeColors.backgroundSecondary,
        };
      case 'gradient':
        return {}; // Handled by LinearGradient
      case 'elevated':
      default:
        return {
          backgroundColor: themeColors.background,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
          shadowRadius: 8,
          elevation: 4,
        };
    }
  };
  
  const containerStyle = [
    styles.container,
    getVariantStyles(),
    style,
  ];
  
  const content = (
    <>
      {renderHeader()}
      {renderStats()}
    </>
  );
  
  if (variant === 'gradient') {
    return (
      <Animated.View style={[cardAnimatedStyle]} testID={testID}>
        <LinearGradient
          colors={[themeColors.background, themeColors.backgroundSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={containerStyle}
        >
          {content}
        </LinearGradient>
      </Animated.View>
    );
  }
  
  return (
    <Animated.View
      style={[containerStyle, cardAnimatedStyle]}
      testID={testID}
    >
      {content}
    </Animated.View>
  );
};

const styles = {
  container: {
    borderRadius: 16,
    padding: 20,
    margin: 8,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  gridContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
  gridItem: {
    marginBottom: 16,
  },
  listContainer: {
    gap: 16,
  },
};

const statItemStyles = {
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  trendContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 2,
  },
  trendIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
};

StatsCard.displayName = 'StatsCard';

export default StatsCard;