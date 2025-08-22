/**
 * DashboardHeader Component
 * Harry School Mobile Design System
 * 
 * Profile avatar, name, level, notifications for dark theme Student App
 * Optimized for gamification and engagement
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
import { DashboardHeaderProps, NotificationBadgeProps } from './DashboardHeader.types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Notification Badge Component
const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  color = '#ef4444',
  textColor = '#ffffff',
  showZero = false,
}) => {
  const { theme } = useTheme();
  
  if (!showZero && count === 0) return null;
  
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  const isLargeCount = count > 9;
  
  return (
    <View
      style={[
        styles.notificationBadge,
        {
          backgroundColor: color,
          minWidth: isLargeCount ? 24 : 20,
          height: 20,
          borderRadius: 10,
          paddingHorizontal: isLargeCount ? 6 : 0,
        },
      ]}
    >
      <Text
        style={[
          styles.notificationText,
          {
            color: textColor,
            fontSize: isLargeCount ? 11 : 12,
            fontWeight: '600',
          },
        ]}
      >
        {displayCount}
      </Text>
    </View>
  );
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  notifications = 0,
  onProfilePress,
  onNotificationsPress,
  showLevel = true,
  showCoins = true,
  showStreak = true,
  levelProgress,
  isOnline = true,
  greeting,
  customActions = [],
  enableHaptics = true,
  theme: headerTheme = 'dark',
  style,
  testID = 'dashboard-header',
}) => {
  const { theme } = useTheme();
  const tokens = theme.tokens;
  
  // Animation values
  const avatarScale = useSharedValue(1);
  const notificationScale = useSharedValue(1);
  const levelBounce = useSharedValue(0);
  
  // Theme colors for dark mode
  const themeColors = useMemo(() => ({
    background: headerTheme === 'dark' ? '#1a1a1a' : tokens.colors.background.primary,
    text: headerTheme === 'dark' ? '#ffffff' : tokens.colors.text.primary,
    textSecondary: headerTheme === 'dark' ? '#a0a0a0' : tokens.colors.text.secondary,
    border: headerTheme === 'dark' ? '#2d2d2d' : tokens.colors.border.light,
    accent: '#1d7452', // Harry School green
    gold: '#fbbf24', // Golden accents
  }), [headerTheme, tokens]);
  
  // Haptic feedback handler
  const triggerHaptic = useCallback(() => {
    if (enableHaptics && Platform.OS === 'ios') {
      HapticFeedback.trigger('light');
    }
  }, [enableHaptics]);
  
  // Profile press handler with animation
  const handleProfilePress = useCallback(() => {
    triggerHaptic();
    avatarScale.value = withSpring(0.95, { damping: 15, stiffness: 200 }, () => {
      avatarScale.value = withSpring(1, { damping: 15, stiffness: 200 });
    });
    onProfilePress?.();
  }, [triggerHaptic, onProfilePress, avatarScale]);
  
  // Notifications press handler with animation
  const handleNotificationsPress = useCallback(() => {
    triggerHaptic();
    notificationScale.value = withSpring(0.9, { damping: 15, stiffness: 200 }, () => {
      notificationScale.value = withSpring(1, { damping: 15, stiffness: 200 });
    });
    onNotificationsPress?.();
  }, [triggerHaptic, onNotificationsPress, notificationScale]);
  
  // Level up animation effect
  React.useEffect(() => {
    if (levelProgress && levelProgress >= 1) {
      levelBounce.value = withSpring(1, { damping: 12, stiffness: 150 }, () => {
        levelBounce.value = withSpring(0, { damping: 15, stiffness: 200 });
      });
    }
  }, [levelProgress, levelBounce]);
  
  // Animated styles
  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));
  
  const notificationAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: notificationScale.value }],
  }));
  
  const levelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          levelBounce.value,
          [0, 1],
          [1, 1.1],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));
  
  // Generate greeting text
  const greetingText = useMemo(() => {
    if (greeting) return greeting;
    
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${timeGreeting}, ${user.name}!`;
  }, [greeting, user.name]);
  
  // Render level progress bar
  const renderLevelProgress = () => {
    if (!showLevel || !levelProgress) return null;
    
    const percentage = Math.min((levelProgress % 1) * 100, 100);
    
    return (
      <View style={styles.levelContainer}>
        <Text style={[styles.levelText, { color: themeColors.textSecondary }]}>
          Level {Math.floor(levelProgress)}
        </Text>
        <View style={[styles.progressBackground, { backgroundColor: themeColors.border }]}>
          <LinearGradient
            colors={[themeColors.accent, themeColors.gold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressFill,
              { width: `${percentage}%` },
            ]}
          />
        </View>
      </View>
    );
  };
  
  // Render stats row (coins, streak)
  const renderStats = () => {
    const stats = [];
    
    if (showCoins && user.coins !== undefined) {
      stats.push(
        <View key="coins" style={styles.statItem}>
          <Text style={styles.statEmoji}>🪙</Text>
          <Text style={[styles.statValue, { color: themeColors.gold }]}>
            {user.coins.toLocaleString()}
          </Text>
        </View>
      );
    }
    
    if (showStreak && user.streak !== undefined) {
      stats.push(
        <View key="streak" style={styles.statItem}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>
            {user.streak}
          </Text>
        </View>
      );
    }
    
    return stats.length > 0 ? (
      <View style={styles.statsRow}>
        {stats}
      </View>
    ) : null;
  };
  
  // Render custom actions
  const renderCustomActions = () => {
    if (customActions.length === 0) return null;
    
    return (
      <View style={styles.customActionsContainer}>
        {customActions.slice(0, 2).map((action, index) => (
          <Pressable
            key={index}
            style={[
              styles.customActionButton,
              { backgroundColor: themeColors.border },
            ]}
            onPress={() => {
              triggerHaptic();
              action.onPress();
            }}
            accessibilityLabel={action.label}
            accessibilityRole="button"
          >
            {action.icon}
          </Pressable>
        ))}
      </View>
    );
  };
  
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.background,
          borderBottomColor: themeColors.border,
        },
        style,
      ]}
      testID={testID}
    >
      {/* Main header row */}
      <View style={styles.headerRow}>
        {/* Profile section */}
        <AnimatedPressable
          style={[styles.profileSection, avatarAnimatedStyle]}
          onPress={handleProfilePress}
          accessibilityRole="button"
          accessibilityLabel={`Profile: ${user.name}`}
          accessibilityHint="Double tap to view profile"
        >
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: user.avatar }}
              style={styles.avatar}
              defaultSource={require('./default-avatar.png')}
            />
            {/* Online status indicator */}
            <View
              style={[
                styles.onlineIndicator,
                {
                  backgroundColor: isOnline ? '#10b981' : '#6b7280',
                  borderColor: themeColors.background,
                },
              ]}
            />
          </View>
          
          <View style={styles.userInfo}>
            <Text
              style={[styles.greetingText, { color: themeColors.textSecondary }]}
              numberOfLines={1}
            >
              {greetingText}
            </Text>
            <Animated.View style={levelAnimatedStyle}>
              {renderLevelProgress()}
            </Animated.View>
          </View>
        </AnimatedPressable>
        
        {/* Actions section */}
        <View style={styles.actionsSection}>
          {renderStats()}
          {renderCustomActions()}
          
          {/* Notifications button */}
          <AnimatedPressable
            style={[styles.notificationButton, notificationAnimatedStyle]}
            onPress={handleNotificationsPress}
            accessibilityRole="button"
            accessibilityLabel={`Notifications: ${notifications} unread`}
            accessibilityHint="Double tap to view notifications"
          >
            <Text style={styles.notificationIcon}>🔔</Text>
            {notifications > 0 && (
              <NotificationBadge
                count={notifications}
                color="#ef4444"
                textColor="#ffffff"
              />
            )}
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
};

const styles = {
  container: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  profileSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative' as const,
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
  },
  onlineIndicator: {
    position: 'absolute' as const,
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  userInfo: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  levelContainer: {
    marginTop: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressBackground: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  actionsSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  statItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  statEmoji: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  customActionsContainer: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  customActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  notificationButton: {
    position: 'relative' as const,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationBadge: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  notificationText: {
    textAlign: 'center' as const,
    includeFontPadding: false,
  },
};

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;