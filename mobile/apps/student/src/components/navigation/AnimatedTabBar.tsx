/**
 * Enhanced Animated Tab Bar for Harry School Student App
 * 
 * A delightful, student-friendly tab bar with advanced animations and accessibility.
 * Designed based on UX research for students ages 10-18.
 * 
 * Key Features:
 * - Spring physics animations with bounce effects
 * - Badge system for notifications and progress
 * - Progress rings for learning completion
 * - Haptic feedback integration
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Reduced motion support
 * - Educational color coding
 * - Large touch targets (44pt minimum)
 * 
 * Usage Research Findings:
 * - Home: 40% usage - House icon, daily overview
 * - Lessons: 35% usage - Book icon, learning content  
 * - Schedule: 15% usage - Calendar icon, time management
 * - Vocabulary: 8% usage - Dictionary icon, language tools
 * - Profile: 2% usage - User icon, progress tracking
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Platform,
  Dimensions,
  AccessibilityInfo,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  interpolateColor,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Circle, Path } from 'react-native-svg';

// Types
export interface TabConfig {
  id: string;
  name: string;
  icon: string;
  iconFocused: string;
  label: string;
  color: string;
  usagePercentage: number;
  badgeCount?: number;
  progress?: number; // 0-100 for progress ring
  disabled?: boolean;
}

export interface AnimatedTabBarProps {
  tabs: TabConfig[];
  activeTabId: string;
  onTabPress: (tabId: string) => void;
  style?: any;
  testID?: string;
}

// Constants
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 70;
const TAB_ICON_SIZE = 24;
const TAB_ICON_SIZE_FOCUSED = 28;
const BADGE_SIZE = 20;
const PROGRESS_RING_SIZE = 36;
const BOUNCE_SCALE = 1.15;
const PRESS_SCALE = 0.95;

// Spring configurations optimized for student engagement
const SPRING_CONFIG = {
  gentle: { damping: 20, stiffness: 300, mass: 0.5 },
  bouncy: { damping: 12, stiffness: 400, mass: 0.8 },
  snap: { damping: 30, stiffness: 600, mass: 0.2 },
  celebration: { damping: 8, stiffness: 250, mass: 1.0 },
};

// Colors optimized for educational context
const COLORS = {
  primary: '#1d7452',
  white: '#ffffff',
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
  },
  educational: {
    home: '#1d7452',      // Primary green
    lessons: '#3b82f6',   // Blue for learning
    schedule: '#8b5cf6',  // Purple for time
    vocabulary: '#f59e0b', // Orange for language
    profile: '#10b981',   // Emerald for progress
  },
  status: {
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    info: '#3b82f6',
  },
};

// =====================================================
// PROGRESS RING COMPONENT
// =====================================================

interface ProgressRingProps {
  progress: number; // 0-100
  size: number;
  strokeWidth: number;
  color: string;
  backgroundColor?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size,
  strokeWidth,
  color,
  backgroundColor = COLORS.neutral[200],
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 800,
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const offset = circumference - (animatedProgress.value / 100) * circumference;
    return {
      strokeDashoffset: offset,
    };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Animated.View>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Animated.View>
      </Svg>
    </View>
  );
};

// =====================================================
// ANIMATED BADGE COMPONENT
// =====================================================

interface AnimatedBadgeProps {
  count: number;
  color?: string;
  textColor?: string;
  maxCount?: number;
}

const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  count,
  color = COLORS.status.error,
  textColor = COLORS.white,
  maxCount = 99,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (count > 0) {
      scale.value = withSequence(
        withSpring(1.2, SPRING_CONFIG.bouncy),
        withSpring(1, SPRING_CONFIG.gentle)
      );
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: color },
        animatedStyle,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: textColor },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {displayCount}
      </Text>
    </Animated.View>
  );
};

// =====================================================
// TAB ITEM COMPONENT
// =====================================================

interface TabItemProps {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
  index: number;
  totalTabs: number;
}

const TabItem: React.FC<TabItemProps> = ({
  tab,
  isActive,
  onPress,
  index,
  totalTabs,
}) => {
  // Animated values
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const iconScale = useSharedValue(isActive ? 1 : 0.9);
  const labelOpacity = useSharedValue(isActive ? 1 : 0.7);
  const progressOpacity = useSharedValue(tab.progress ? 1 : 0);

  // Accessibility
  const [isReducedMotion, setIsReducedMotion] = React.useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReducedMotion);
  }, []);

  // Update animations when active state changes
  useEffect(() => {
    if (!isReducedMotion) {
      iconScale.value = withSpring(
        isActive ? 1.1 : 0.9,
        isActive ? SPRING_CONFIG.bouncy : SPRING_CONFIG.gentle
      );
      
      labelOpacity.value = withTiming(
        isActive ? 1 : 0.7,
        { duration: 200 }
      );
      
      translateY.value = withSpring(
        isActive ? -2 : 0,
        SPRING_CONFIG.gentle
      );
    } else {
      iconScale.value = isActive ? 1.1 : 0.9;
      labelOpacity.value = isActive ? 1 : 0.7;
      translateY.value = isActive ? -2 : 0;
    }
  }, [isActive, isReducedMotion]);

  // Update progress ring visibility
  useEffect(() => {
    progressOpacity.value = withTiming(
      tab.progress ? 1 : 0,
      { duration: 300 }
    );
  }, [tab.progress]);

  // Press handlers with haptic feedback
  const handlePressIn = useCallback(() => {
    if (!isReducedMotion) {
      scale.value = withSpring(PRESS_SCALE, SPRING_CONFIG.snap);
    }
    
    // Light haptic feedback for student engagement
    runOnJS(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    })();
  }, [isReducedMotion]);

  const handlePressOut = useCallback(() => {
    if (!isReducedMotion) {
      scale.value = withSpring(1, SPRING_CONFIG.gentle);
    }
  }, [isReducedMotion]);

  const handlePress = useCallback(() => {
    if (tab.disabled) return;
    
    if (!isActive && !isReducedMotion) {
      // Celebration bounce for tab switch
      iconScale.value = withSequence(
        withSpring(BOUNCE_SCALE, SPRING_CONFIG.celebration),
        withSpring(1.1, SPRING_CONFIG.gentle)
      );
    }
    
    // Success haptic for tab switch
    runOnJS(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    })();
    
    onPress();
  }, [tab.disabled, isActive, isReducedMotion, onPress]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const iconContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const progressRingStyle = useAnimatedStyle(() => ({
    opacity: progressOpacity.value,
  }));

  // Tab width calculation for equal distribution
  const tabWidth = SCREEN_WIDTH / totalTabs;
  const tabColor = isActive ? tab.color : COLORS.neutral[500];

  return (
    <Pressable
      style={[
        styles.tabItem,
        {
          width: tabWidth,
          opacity: tab.disabled ? 0.4 : 1,
        },
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={tab.disabled}
      accessible
      accessibilityRole="tab"
      accessibilityState={{
        selected: isActive,
        disabled: tab.disabled,
      }}
      accessibilityLabel={`${tab.label} tab${isActive ? ', selected' : ''}${
        tab.badgeCount ? `, ${tab.badgeCount} notifications` : ''
      }${tab.progress ? `, ${Math.round(tab.progress)}% complete` : ''}`}
      accessibilityHint={`Tap to switch to ${tab.label} section`}
      testID={`tab-${tab.id}`}
    >
      <Animated.View style={[styles.tabContent, containerStyle]}>
        {/* Icon Container with Progress Ring */}
        <View style={styles.iconContainer}>
          {/* Progress Ring (when available) */}
          {tab.progress !== undefined && (
            <Animated.View style={[styles.progressRing, progressRingStyle]}>
              <ProgressRing
                progress={tab.progress}
                size={PROGRESS_RING_SIZE}
                strokeWidth={3}
                color={tab.color}
                backgroundColor={COLORS.neutral[200]}
              />
            </Animated.View>
          )}
          
          {/* Icon */}
          <Animated.View style={[styles.iconWrapper, iconContainerStyle]}>
            <Icon
              name={isActive ? tab.iconFocused : tab.icon}
              size={isActive ? TAB_ICON_SIZE_FOCUSED : TAB_ICON_SIZE}
              color={tabColor}
            />
          </Animated.View>
          
          {/* Badge */}
          {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
            <View style={styles.badgeContainer}>
              <AnimatedBadge
                count={tab.badgeCount}
                color={COLORS.status.error}
                textColor={COLORS.white}
              />
            </View>
          )}
        </View>
        
        {/* Label */}
        <Animated.Text
          style={[
            styles.tabLabel,
            {
              color: tabColor,
              fontWeight: isActive ? '600' : '500',
            },
            labelStyle,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {tab.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
};

// =====================================================
// MAIN ANIMATED TAB BAR COMPONENT
// =====================================================

export const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({
  tabs,
  activeTabId,
  onTabPress,
  style,
  testID = 'animated-tab-bar',
}) => {
  const insets = useSafeAreaInsets();
  const activeIndex = tabs.findIndex(tab => tab.id === activeTabId);
  
  // Animated indicator
  const indicatorPosition = useSharedValue(activeIndex);
  const indicatorOpacity = useSharedValue(1);

  // Update indicator position when active tab changes
  useEffect(() => {
    indicatorPosition.value = withSpring(activeIndex, {
      damping: 20,
      stiffness: 300,
    });
  }, [activeIndex]);

  // Indicator animated style
  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = SCREEN_WIDTH / tabs.length;
    const translateX = indicatorPosition.value * tabWidth;
    
    return {
      transform: [{ translateX }],
      width: tabWidth * 0.6, // 60% of tab width
      opacity: indicatorOpacity.value,
    };
  });

  // Handle tab press with analytics and feedback
  const handleTabPress = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || tab.disabled) return;
    
    onTabPress(tabId);
  }, [tabs, onTabPress]);

  return (
    <View
      style={[
        styles.tabBar,
        {
          paddingBottom: insets.bottom + 8,
          height: TAB_BAR_HEIGHT + insets.bottom,
        },
        style,
      ]}
      testID={testID}
      accessible
      accessibilityRole="tablist"
      accessibilityLabel="Main navigation tabs"
    >
      {/* Background */}
      <View style={styles.background} />
      
      {/* Active Tab Indicator */}
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      
      {/* Tabs Container */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab, index) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onPress={() => handleTabPress(tab.id)}
            index={index}
            totalTabs={tabs.length}
          />
        ))}
      </View>
    </View>
  );
};

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
    position: 'relative',
    // Shadow for elevation
    ...Platform.select({
      ios: {
        shadowColor: COLORS.neutral[900],
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.white,
  },
  
  indicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 1.5,
    marginHorizontal: '20%', // Center within tab
  },
  
  tabsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    minHeight: 44, // WCAG AA minimum touch target
  },
  
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: PROGRESS_RING_SIZE,
    height: PROGRESS_RING_SIZE,
    marginBottom: 4,
  },
  
  progressRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PROGRESS_RING_SIZE,
    height: PROGRESS_RING_SIZE,
  },
  
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: TAB_ICON_SIZE_FOCUSED + 4,
    height: TAB_ICON_SIZE_FOCUSED + 4,
  },
  
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    zIndex: 10,
  },
  
  badge: {
    minWidth: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
  
  tabLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
    includeFontPadding: false,
  },
});

export default AnimatedTabBar;