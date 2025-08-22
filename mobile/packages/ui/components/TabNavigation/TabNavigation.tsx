/**
 * TabNavigation Component
 * Harry School Mobile Design System
 * 
 * Bottom navigation bar optimized for Student App with badges and animations
 * Dark theme with thumb-friendly interactions
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
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { TabNavigationProps, TabItem, TabBadge } from './TabNavigation.types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Individual tab component
const Tab: React.FC<{
  item: TabItem;
  index: number;
  isActive: boolean;
  onPress: (index: number) => void;
  enableHaptics: boolean;
  theme: 'light' | 'dark';
  tabWidth: number;
}> = ({ item, index, isActive, onPress, enableHaptics, theme, tabWidth }) => {
  const { theme: designTheme } = useTheme();
  const tokens = designTheme.tokens;
  
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);
  const badgeBounce = useSharedValue(0);
  
  const themeColors = useMemo(() => ({
    background: theme === 'dark' ? '#1a1a1a' : tokens.colors.background.primary,
    text: theme === 'dark' ? '#ffffff' : tokens.colors.text.primary,
    textSecondary: theme === 'dark' ? '#6b7280' : tokens.colors.text.secondary,
    active: '#1d7452', // Harry School green
    inactive: theme === 'dark' ? '#6b7280' : tokens.colors.text.tertiary,
  }), [theme, tokens]);
  
  const triggerHaptic = useCallback(() => {
    if (enableHaptics && Platform.OS === 'ios') {
      HapticFeedback.trigger('light');
    }
  }, [enableHaptics]);
  
  const handlePress = useCallback(() => {
    triggerHaptic();
    onPress(index);
  }, [triggerHaptic, onPress, index]);
  
  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
    iconScale.value = withSpring(1.1, { damping: 15, stiffness: 200 });
  }, [scale, iconScale]);
  
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    iconScale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [scale, iconScale]);
  
  // Badge bounce animation
  useEffect(() => {
    if (item.badge && item.badge.count > 0) {
      badgeBounce.value = withSpring(1, { damping: 12, stiffness: 200 }, () => {
        badgeBounce.value = withSpring(0, { damping: 15, stiffness: 200 });
      });
    }
  }, [item.badge?.count, badgeBounce]);
  
  // Animated styles
  const tabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));
  
  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          badgeBounce.value,
          [0, 1],
          [1, 1.2],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));
  
  const renderBadge = () => {
    if (!item.badge || item.badge.count === 0) return null;
    
    const displayCount = item.badge.count > 99 ? '99+' : item.badge.count.toString();
    
    return (
      <Animated.View
        style={[
          styles.badge,
          {
            backgroundColor: item.badge.color || '#ef4444',
          },
          badgeAnimatedStyle,
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            { color: item.badge.textColor || '#ffffff' },
          ]}
        >
          {displayCount}
        </Text>
      </Animated.View>
    );
  };
  
  return (
    <AnimatedPressable
      style={[
        styles.tab,
        {
          width: tabWidth,
        },
        tabAnimatedStyle,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityHint={`Tab ${index + 1} of ${item.label}`}
      accessibilityState={{ selected: isActive }}
      testID={`tab-${item.id || index}`}
    >
      {/* Icon container with badge */}
      <View style={styles.iconContainer}>
        <Animated.View style={iconAnimatedStyle}>
          <Text
            style={[
              styles.tabIcon,
              {
                color: isActive ? themeColors.active : themeColors.inactive,
                fontSize: 24,
              },
            ]}
          >
            {isActive ? item.activeIcon || item.icon : item.icon}
          </Text>
        </Animated.View>
        {renderBadge()}
      </View>
      
      {/* Label */}
      <Text
        style={[
          styles.tabLabel,
          {
            color: isActive ? themeColors.active : themeColors.inactive,
            fontWeight: isActive ? '600' : '500',
          },
        ]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
      
      {/* Active indicator */}
      {isActive && (
        <View
          style={[
            styles.activeIndicator,
            { backgroundColor: themeColors.active },
          ]}
        />
      )}
    </AnimatedPressable>
  );
};

export const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeIndex = 0,
  onTabChange,
  showLabels = true,
  enableHaptics = true,
  variant = 'default',
  theme = 'dark',
  style,
  testID = 'tab-navigation',
}) => {
  const { theme: designTheme } = useTheme();
  const tokens = designTheme.tokens;
  const insets = useSafeAreaInsets();
  
  const backgroundOpacity = useSharedValue(1);
  const activeIndicatorPosition = useSharedValue(0);
  
  // Theme colors for dark mode
  const themeColors = useMemo(() => ({
    background: theme === 'dark' ? '#1a1a1a' : tokens.colors.background.primary,
    backgroundSecondary: theme === 'dark' ? '#2d2d2d' : tokens.colors.background.secondary,
    border: theme === 'dark' ? '#2d2d2d' : tokens.colors.border.light,
    text: theme === 'dark' ? '#ffffff' : tokens.colors.text.primary,
    textSecondary: theme === 'dark' ? '#6b7280' : tokens.colors.text.secondary,
    active: '#1d7452', // Harry School green
  }), [theme, tokens]);
  
  // Calculate tab width
  const tabWidth = SCREEN_WIDTH / tabs.length;
  
  // Handle tab change with animation
  const handleTabChange = useCallback((index: number) => {
    if (index === activeIndex) return;
    
    // Animate active indicator
    activeIndicatorPosition.value = withSpring(
      index * tabWidth,
      { damping: 20, stiffness: 200 }
    );
    
    // Trigger change callback
    onTabChange(index);
  }, [activeIndex, onTabChange, activeIndicatorPosition, tabWidth]);
  
  // Update active indicator position when activeIndex changes
  useEffect(() => {
    activeIndicatorPosition.value = withSpring(
      activeIndex * tabWidth,
      { damping: 20, stiffness: 200 }
    );
  }, [activeIndex, tabWidth, activeIndicatorPosition]);
  
  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'floating':
        return {
          marginHorizontal: 20,
          marginBottom: insets.bottom + 20,
          borderRadius: 24,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 8,
        };
      case 'minimal':
        return {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
        };
      case 'default':
      default:
        return {
          borderTopWidth: 1,
          borderTopColor: themeColors.border,
        };
    }
  };
  
  // Active indicator animated style
  const activeIndicatorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: activeIndicatorPosition.value }],
  }));
  
  const containerHeight = variant === 'floating' ? 80 : 60 + insets.bottom;
  
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.background,
          height: containerHeight,
          paddingBottom: variant === 'floating' ? 0 : insets.bottom,
        },
        getVariantStyles(),
        style,
      ]}
      testID={testID}
    >
      {/* Background for floating variant */}
      {variant === 'floating' && (
        <View
          style={[
            styles.floatingBackground,
            { backgroundColor: themeColors.backgroundSecondary },
          ]}
        />
      )}
      
      {/* Active indicator background */}
      {variant !== 'minimal' && (
        <Animated.View
          style={[
            styles.activeIndicatorBackground,
            {
              width: tabWidth,
              backgroundColor: `${themeColors.active}15`,
            },
            activeIndicatorAnimatedStyle,
          ]}
        />
      )}
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab, index) => (
          <Tab
            key={tab.id || index}
            item={tab}
            index={index}
            isActive={index === activeIndex}
            onPress={handleTabChange}
            enableHaptics={enableHaptics}
            theme={theme}
            tabWidth={tabWidth}
          />
        ))}
      </View>
    </View>
  );
};

const styles = {
  container: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end' as const,
  },
  floatingBackground: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  tabsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    height: 60,
  },
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 8,
    position: 'relative' as const,
  },
  iconContainer: {
    position: 'relative' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 2,
  },
  tabIcon: {
    textAlign: 'center' as const,
  },
  tabLabel: {
    fontSize: 10,
    textAlign: 'center' as const,
    marginTop: 2,
  },
  badge: {
    position: 'absolute' as const,
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center' as const,
    includeFontPadding: false,
  },
  activeIndicator: {
    position: 'absolute' as const,
    bottom: 0,
    width: 32,
    height: 3,
    borderRadius: 1.5,
  },
  activeIndicatorBackground: {
    position: 'absolute' as const,
    top: 0,
    height: 60,
    borderRadius: 16,
    opacity: 0.1,
  },
};

TabNavigation.displayName = 'TabNavigation';

export default TabNavigation;