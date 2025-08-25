/**
 * EventCard Component
 * Harry School Mobile Design System
 * 
 * Individual event/subject cards with golden borders for dark theme
 * Optimized for educational content display and interactions
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  Platform,
  HapticFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import { EventCardProps, EventStatus, EventType } from './EventCard.types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const EventCard: React.FC<EventCardProps> = ({
  title,
  subtitle,
  time,
  duration,
  status = 'upcoming',
  type = 'lesson',
  color,
  image,
  icon,
  progress,
  attendees,
  location,
  description,
  priority = 'normal',
  isLive = false,
  hasNotification = false,
  onPress,
  onLongPress,
  enableHaptics = true,
  showGoldenBorder = false,
  theme: cardTheme = 'dark',
  size = 'default',
  interactive = true,
  style,
  testID = 'event-card',
}) => {
  const { theme } = useTheme();
  const tokens = theme.tokens;
  
  // Animation values
  const scale = useSharedValue(1);
  const borderGlow = useSharedValue(0);
  const liveIndicator = useSharedValue(0);
  
  // Theme colors for dark mode
  const themeColors = useMemo(() => ({
    background: cardTheme === 'dark' ? '#2d2d2d' : tokens.colors.background.primary,
    backgroundSecondary: cardTheme === 'dark' ? '#3a3a3a' : tokens.colors.background.secondary,
    text: cardTheme === 'dark' ? '#ffffff' : tokens.colors.text.primary,
    textSecondary: cardTheme === 'dark' ? '#a0a0a0' : tokens.colors.text.secondary,
    border: cardTheme === 'dark' ? '#4a4a4a' : tokens.colors.border.light,
    accent: '#1d7452', // Harry School green
    gold: '#fbbf24', // Golden accents
    borderGold: showGoldenBorder ? '#fbbf24' : (cardTheme === 'dark' ? '#4a4a4a' : tokens.colors.border.light),
  }), [cardTheme, tokens, showGoldenBorder]);
  
  // Status-specific colors
  const statusColors = useMemo(() => ({
    upcoming: { bg: '#3b82f6', text: '#ffffff' },
    active: { bg: '#10b981', text: '#ffffff' },
    completed: { bg: '#6b7280', text: '#ffffff' },
    cancelled: { bg: '#ef4444', text: '#ffffff' },
    live: { bg: '#ef4444', text: '#ffffff' },
  }), []);
  
  // Type-specific icons and colors
  const typeConfig = useMemo(() => ({
    lesson: { emoji: '📚', color: '#3b82f6' },
    homework: { emoji: '✏️', color: '#f59e0b' },
    test: { emoji: '📝', color: '#ef4444' },
    project: { emoji: '🎯', color: '#8b5cf6' },
    meeting: { emoji: '👥', color: '#10b981' },
    event: { emoji: '🎉', color: '#ec4899' },
    break: { emoji: '☕', color: '#6b7280' },
  }), []);
  
  // Haptic feedback handler
  const triggerHaptic = useCallback(() => {
    if (enableHaptics && Platform.OS === 'ios') {
      HapticFeedback.trigger('light');
    }
  }, [enableHaptics]);
  
  // Press handlers with animations
  const handlePressIn = useCallback(() => {
    if (interactive) {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
      if (showGoldenBorder) {
        borderGlow.value = withTiming(1, { duration: 200 });
      }
    }
    triggerHaptic();
  }, [interactive, showGoldenBorder, scale, borderGlow, triggerHaptic]);
  
  const handlePressOut = useCallback(() => {
    if (interactive) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      if (showGoldenBorder) {
        borderGlow.value = withTiming(0, { duration: 300 });
      }
    }
  }, [interactive, showGoldenBorder, scale, borderGlow]);
  
  const handlePress = useCallback(() => {
    if (!interactive) return;
    onPress?.();
  }, [interactive, onPress]);
  
  // Live indicator animation
  React.useEffect(() => {
    if (isLive) {
      liveIndicator.value = withTiming(1, { duration: 500 }, () => {
        liveIndicator.value = withTiming(0, { duration: 500 });
      });
      
      const interval = setInterval(() => {
        liveIndicator.value = withTiming(1, { duration: 500 }, () => {
          liveIndicator.value = withTiming(0, { duration: 500 });
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isLive, liveIndicator]);
  
  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const borderAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: showGoldenBorder ? interpolate(
      borderGlow.value,
      [0, 1],
      [0, 0.3],
      Extrapolate.CLAMP
    ) : 0,
    shadowRadius: showGoldenBorder ? interpolate(
      borderGlow.value,
      [0, 1],
      [0, 8],
      Extrapolate.CLAMP
    ) : 0,
  }));
  
  const liveIndicatorStyle = useAnimatedStyle(() => ({
    opacity: liveIndicator.value,
  }));
  
  // Size configuration
  const sizeConfig = useMemo(() => ({
    compact: { width: 160, height: 120, padding: 12 },
    default: { width: 200, height: 140, padding: 16 },
    large: { width: 240, height: 160, padding: 20 },
  }), []);
  
  const config = sizeConfig[size];
  
  // Render status badge
  const renderStatusBadge = () => {
    if (status === 'upcoming' || !status) return null;
    
    const statusColor = statusColors[status];
    
    return (
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: statusColor.bg,
          },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            { color: statusColor.text },
          ]}
        >
          {status.toUpperCase()}
        </Text>
      </View>
    );
  };
  
  // Render live indicator
  const renderLiveIndicator = () => {
    if (!isLive) return null;
    
    return (
      <Animated.View style={[styles.liveIndicator, liveIndicatorStyle]}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </Animated.View>
    );
  };
  
  // Render priority indicator
  const renderPriorityIndicator = () => {
    if (priority === 'normal') return null;
    
    const priorityColors = {
      low: '#6b7280',
      high: '#f59e0b',
      urgent: '#ef4444',
    };
    
    return (
      <View
        style={[
          styles.priorityIndicator,
          { backgroundColor: priorityColors[priority] },
        ]}
      />
    );
  };
  
  // Render progress bar
  const renderProgress = () => {
    if (!progress) return null;
    
    const percentage = Math.min((progress.current / progress.total) * 100, 100);
    
    return (
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBackground,
            { backgroundColor: themeColors.border },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
                backgroundColor: color || themeColors.accent,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: themeColors.textSecondary }]}>
          {progress.current}/{progress.total}
        </Text>
      </View>
    );
  };
  
  // Render notification indicator
  const renderNotificationIndicator = () => {
    if (!hasNotification) return null;
    
    return (
      <View style={styles.notificationIndicator}>
        <Text style={styles.notificationIcon}>🔔</Text>
      </View>
    );
  };
  
  const currentTypeConfig = typeConfig[type];
  const displayIcon = icon || currentTypeConfig.emoji;
  const displayColor = color || currentTypeConfig.color;
  
  return (
    <AnimatedPressable
      style={[
        cardAnimatedStyle,
        borderAnimatedStyle,
        {
          width: config.width,
          height: config.height,
        },
        style,
      ]}
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!interactive}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${time}${subtitle ? `, ${subtitle}` : ''}`}
      accessibilityHint="Double tap to view details"
      testID={testID}
    >
      <LinearGradient
        colors={[themeColors.background, themeColors.backgroundSecondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.container,
          {
            padding: config.padding,
            borderColor: themeColors.borderGold,
            borderWidth: showGoldenBorder ? 2 : 1,
            shadowColor: showGoldenBorder ? themeColors.gold : '#000000',
          },
        ]}
      >
        {/* Header row */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Type icon */}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${displayColor}20` },
              ]}
            >
              <Text style={styles.iconText}>{displayIcon}</Text>
            </View>
            
            {/* Priority indicator */}
            {renderPriorityIndicator()}
          </View>
          
          <View style={styles.headerRight}>
            {renderNotificationIndicator()}
            {renderLiveIndicator()}
            {renderStatusBadge()}
          </View>
        </View>
        
        {/* Content */}
        <View style={styles.content}>
          <Text
            style={[styles.title, { color: themeColors.text }]}
            numberOfLines={2}
          >
            {title}
          </Text>
          
          {subtitle && (
            <Text
              style={[styles.subtitle, { color: themeColors.textSecondary }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
          
          <View style={styles.timeRow}>
            <Text style={[styles.time, { color: themeColors.text }]}>
              {time}
            </Text>
            {duration && (
              <Text style={[styles.duration, { color: themeColors.textSecondary }]}>
                {duration}
              </Text>
            )}
          </View>
          
          {location && (
            <Text
              style={[styles.location, { color: themeColors.textSecondary }]}
              numberOfLines={1}
            >
              📍 {location}
            </Text>
          )}
          
          {attendees && attendees > 0 && (
            <Text
              style={[styles.attendees, { color: themeColors.textSecondary }]}
            >
              👥 {attendees} attendees
            </Text>
          )}
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          {renderProgress()}
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
};

const styles = {
  container: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  iconText: {
    fontSize: 16,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '700',
  },
  liveIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  liveText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ffffff',
  },
  notificationIndicator: {
    width: 16,
    height: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  notificationIcon: {
    fontSize: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between' as const,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
  },
  duration: {
    fontSize: 12,
    fontWeight: '500',
  },
  location: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  attendees: {
    fontSize: 11,
    fontWeight: '500',
  },
  footer: {
    marginTop: 8,
  },
  progressContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  progressBackground: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    minWidth: 32,
  },
};

EventCard.displayName = 'EventCard';

export default EventCard;