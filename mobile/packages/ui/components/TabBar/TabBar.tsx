/**
 * TabBar Component
 * Harry School Mobile Design System
 * 
 * Premium bottom navigation with 5 tabs, smooth animations, offline indicators,
 * and accessibility optimized for Teacher and Student mobile applications
 */

import React, { forwardRef, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  AccessibilityInfo,
  Platform,
  HapticFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import type { TabBarProps, TabProps, TabBadgeProps, TabIndicatorProps, TabBarThemeConfig } from './TabBar.types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Individual Tab Component
const Tab = React.memo<TabProps>(({
  item,
  isActive,
  disabled,
  isOffline,
  isLoading,
  variant,
  animationConfig = {},
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
}) => {
  const { theme } = useTheme();
  const themeConfig = getTabBarThemeConfig(variant, theme);
  
  // Animation values
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);
  const labelOpacity = useSharedValue(isActive ? 1 : 0.7);
  
  // Update animations when active state changes
  useEffect(() => {
    if (animationConfig.disableAnimations) return;
    
    const duration = animationConfig.animationDuration || (variant === 'teacher' ? 150 : 200);
    
    iconScale.value = withSpring(isActive ? 1.1 : 1, {
      damping: 15,
      stiffness: 200,
    });
    
    labelOpacity.value = withTiming(isActive ? 1 : 0.7, { duration });
  }, [isActive, variant, animationConfig]);
  
  // Haptic feedback
  const triggerHaptic = useCallback(() => {
    if (!animationConfig.enableHaptics || disabled || isLoading) return;
    
    if (Platform.OS === 'ios') {
      HapticFeedback.trigger('light');
    }
  }, [animationConfig.enableHaptics, disabled, isLoading]);
  
  // Press handlers
  const handlePressIn = useCallback(() => {
    if (!animationConfig.disableAnimations && !disabled && !isLoading) {
      scale.value = withTiming(0.95, { duration: 100 });
    }
    onPressIn?.(item.id);
  }, [item.id, disabled, isLoading, animationConfig.disableAnimations, onPressIn]);
  
  const handlePressOut = useCallback(() => {
    if (!animationConfig.disableAnimations && !disabled && !isLoading) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    }
    onPressOut?.(item.id);
  }, [item.id, disabled, isLoading, animationConfig.disableAnimations, onPressOut]);
  
  const handlePress = useCallback(() => {
    if (disabled || isLoading) return;
    
    runOnJS(triggerHaptic)();
    onPress(item.id);
  }, [item.id, disabled, isLoading, triggerHaptic, onPress]);
  
  const handleLongPress = useCallback(() => {
    if (disabled || isLoading) return;
    
    if (Platform.OS === 'ios') {
      HapticFeedback.trigger('medium');
    }
    onLongPress?.(item.id);
  }, [item.id, disabled, isLoading, onLongPress]);
  
  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));
  
  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));
  
  // Get current state styles
  const getTabStyles = () => {
    if (disabled) return themeConfig.tab.disabled;
    if (isOffline && item.requiresConnection) return themeConfig.tab.offline;
    if (isActive) return themeConfig.tab.active;
    return themeConfig.tab.default;
  };
  
  const getIconColor = () => {
    if (disabled) return themeConfig.icon.disabled.color;
    if (isOffline && item.requiresConnection) return themeConfig.icon.offline.color;
    if (isActive) return themeConfig.icon.active.color;
    return themeConfig.icon.default.color;
  };
  
  const getLabelColor = () => {
    if (disabled) return themeConfig.label.disabled.color;
    if (isOffline && item.requiresConnection) return themeConfig.label.offline.color;
    if (isActive) return themeConfig.label.active.color;
    return themeConfig.label.default.color;
  };
  
  const isTabDisabled = disabled || (isOffline && item.requiresConnection);
  
  return (
    <AnimatedPressable
      style={[
        styles.tab,
        getTabStyles(),
        animatedContainerStyle,
      ]}
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isTabDisabled}
      accessible={true}
      accessibilityRole="tab"
      accessibilityState={{
        selected: isActive,
        disabled: isTabDisabled,
      }}
      accessibilityLabel={item.accessibilityLabel || item.label}
      accessibilityHint={item.accessibilityHint}
      testID={item.testID}
    >
      {/* Icon */}
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        {renderIcon(item.icon, themeConfig.icon.default.size, getIconColor())}
        
        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <View style={[styles.loadingIndicator, { borderTopColor: getIconColor() }]} />
          </View>
        )}
      </Animated.View>
      
      {/* Label */}
      <Animated.Text
        style={[
          styles.label,
          {
            fontSize: themeConfig.label.default.fontSize,
            fontWeight: isActive ? themeConfig.label.active.fontWeight : themeConfig.label.default.fontWeight,
            color: getLabelColor(),
          },
          animatedLabelStyle,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {item.label}
      </Animated.Text>
      
      {/* Badge */}
      {item.badgeCount !== undefined && item.badgeCount > 0 && (
        <TabBadge
          count={item.badgeCount}
          maxCount={99}
          backgroundColor={themeConfig.badge.backgroundColor}
          color={themeConfig.badge.color}
          size="small"
        />
      )}
      
      {/* Offline indicator */}
      {isOffline && item.requiresConnection && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>⚡</Text>
        </View>
      )}
    </AnimatedPressable>
  );
});

// Badge Component
const TabBadge: React.FC<TabBadgeProps> = ({
  count,
  maxCount = 99,
  color,
  backgroundColor,
  size = 'small',
}) => {
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  const isDot = count > 0 && size === 'small' && count <= 1;
  
  if (isDot) {
    return (
      <View
        style={[
          styles.badgeDot,
          { backgroundColor },
        ]}
        accessible={true}
        accessibilityLabel={`${count} notification${count !== 1 ? 's' : ''}`}
      />
    );
  }
  
  return (
    <View
      style={[
        styles.badgeContainer,
        { backgroundColor },
        size === 'medium' && styles.badgeMedium,
      ]}
      accessible={true}
      accessibilityLabel={`${count} notification${count !== 1 ? 's' : ''}`}
    >
      <Text
        style={[
          styles.badgeText,
          { color },
          size === 'medium' && styles.badgeTextMedium,
        ]}
        numberOfLines={1}
      >
        {displayCount}
      </Text>
    </View>
  );
};

// Active Tab Indicator
const TabIndicator: React.FC<TabIndicatorProps> = ({
  activeIndex,
  tabWidths,
  animationDuration,
  variant,
  disableAnimations = false,
}) => {
  const { theme } = useTheme();
  const themeConfig = getTabBarThemeConfig(variant, theme);
  
  const translateX = useSharedValue(0);
  const width = useSharedValue(0);
  
  useEffect(() => {
    if (tabWidths.length === 0) return;
    
    // Calculate position and width for active tab
    let newX = 0;
    for (let i = 0; i < activeIndex; i++) {
      newX += tabWidths[i];
    }
    
    const activeTabWidth = tabWidths[activeIndex] || 0;
    const indicatorWidth = Math.min(activeTabWidth * 0.6, 40); // Max 40pt wide
    const indicatorX = newX + (activeTabWidth - indicatorWidth) / 2;
    
    if (disableAnimations) {
      translateX.value = indicatorX;
      width.value = indicatorWidth;
    } else {
      translateX.value = withSpring(indicatorX, {
        damping: 20,
        stiffness: 150,
      });
      width.value = withTiming(indicatorWidth, { duration: animationDuration });
    }
  }, [activeIndex, tabWidths, animationDuration, disableAnimations]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: width.value,
  }));
  
  return (
    <Animated.View
      style={[
        styles.indicator,
        {
          height: themeConfig.indicator.height,
          backgroundColor: themeConfig.indicator.backgroundColor,
          borderRadius: themeConfig.indicator.borderRadius,
        },
        animatedStyle,
      ]}
    />
  );
};

// Main TabBar Component
export const TabBar = forwardRef<View, TabBarProps>(({
  tabs,
  activeTabId,
  variant = 'student',
  isOffline = false,
  disabled = false,
  loadingTabs = [],
  onTabPress,
  onTabLongPress,
  onTabPressIn,
  onTabPressOut,
  animationDuration = 200,
  disableAnimations = false,
  enableHaptics = true,
  style,
  height,
  backgroundColor,
  testID,
  accessible = true,
  accessibilityRole = 'tablist',
  accessibilityLabel = 'Navigation tabs',
  ...accessibilityProps
}, ref) => {
  const { theme } = useTheme();
  const themeConfig = getTabBarThemeConfig(variant, theme);
  const tabWidths = useRef<number[]>([]);
  
  // Get active tab index
  const activeTabIndex = useMemo(() => {
    return tabs.findIndex(tab => tab.id === activeTabId);
  }, [tabs, activeTabId]);
  
  // Validate tabs length
  useEffect(() => {
    if (tabs.length !== 5) {
      console.warn('TabBar: Expected exactly 5 tabs, got', tabs.length);
    }
  }, [tabs.length]);
  
  // Handle tab layout measurement
  const handleTabLayout = useCallback((index: number, width: number) => {
    tabWidths.current[index] = width;
  }, []);
  
  // Animation configuration
  const animationConfig = useMemo(() => ({
    animationDuration: variant === 'teacher' ? 150 : animationDuration,
    disableAnimations,
    enableHaptics,
  }), [variant, animationDuration, disableAnimations, enableHaptics]);
  
  // Container styles
  const containerStyle = [
    styles.container,
    themeConfig.container,
    {
      height: height || themeConfig.container.height,
      backgroundColor: backgroundColor || themeConfig.container.backgroundColor,
    },
    disabled && styles.disabled,
    style,
  ];
  
  return (
    <View
      ref={ref}
      style={containerStyle}
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      {...accessibilityProps}
    >
      {/* Tab Indicator */}
      <TabIndicator
        activeIndex={activeTabIndex}
        tabWidths={tabWidths.current}
        animationDuration={animationConfig.animationDuration}
        variant={variant}
        disableAnimations={disableAnimations}
      />
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab, index) => (
          <View
            key={tab.id}
            style={styles.tabWrapper}
            onLayout={(event) => {
              const { width } = event.nativeEvent.layout;
              handleTabLayout(index, width);
            }}
          >
            <Tab
              item={tab}
              isActive={tab.id === activeTabId}
              disabled={disabled || tab.disabled}
              isOffline={isOffline}
              isLoading={loadingTabs.includes(tab.id)}
              variant={variant}
              animationConfig={animationConfig}
              onPress={onTabPress}
              onLongPress={onTabLongPress}
              onPressIn={onTabPressIn}
              onPressOut={onTabPressOut}
            />
          </View>
        ))}
      </View>
      
      {/* Offline status bar */}
      {isOffline && (
        <View style={styles.offlineBar}>
          <Text style={styles.offlineBarText}>
            Offline Mode - Some features may be limited
          </Text>
        </View>
      )}
    </View>
  );
});

TabBar.displayName = 'TabBar';

// Utility function to render icon
const renderIcon = (icon: any, size: number, color: string) => {
  if (typeof icon === 'string') {
    // Handle icon names - integrate with your icon library
    return (
      <Text style={{ fontSize: size, color }}>
        {getIconUnicode(icon)}
      </Text>
    );
  }
  
  // Return the icon component directly
  return icon;
};

// Simple icon mapping (replace with your icon library)
const getIconUnicode = (iconName: string): string => {
  const iconMap: Record<string, string> = {
    home: '🏠',
    users: '👥',
    'check-square': '☑️',
    zap: '⚡',
    user: '👤',
    'book-open': '📖',
    bookmark: '🔖',
    'trending-up': '📈',
    award: '🏆',
  };
  
  return iconMap[iconName] || '●';
};

// Theme configuration utility
const getTabBarThemeConfig = (variant: TabBarProps['variant'], theme: any): TabBarThemeConfig => {
  const { tokens } = theme;
  
  const baseConfig: TabBarThemeConfig = {
    container: {
      height: tokens.spacing.navigation.tabBarHeight,
      backgroundColor: tokens.colors.background.primary,
      borderTopWidth: 1,
      borderTopColor: tokens.colors.border.light,
      shadowColor: tokens.shadows.sm.shadowColor,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: tokens.shadows.sm.shadowOpacity,
      shadowRadius: tokens.shadows.sm.shadowRadius,
      elevation: tokens.shadows.sm.elevation,
    },
    tab: {
      default: {
        backgroundColor: 'transparent',
      },
      active: {
        backgroundColor: tokens.colors.primary[50],
      },
      disabled: {
        backgroundColor: 'transparent',
        opacity: tokens.opacity.disabled,
      },
      offline: {
        backgroundColor: 'transparent',
        opacity: tokens.opacity.medium,
      },
    },
    icon: {
      default: {
        size: 24,
        color: tokens.colors.text.tertiary,
      },
      active: {
        color: tokens.colors.primary[500],
      },
      disabled: {
        color: tokens.colors.text.disabled,
      },
      offline: {
        color: tokens.colors.text.disabled,
      },
    },
    label: {
      default: {
        fontSize: tokens.typography.fontSize.xs,
        fontWeight: tokens.typography.fontWeight.medium,
        color: tokens.colors.text.tertiary,
      },
      active: {
        color: tokens.colors.primary[500],
        fontWeight: tokens.typography.fontWeight.semibold,
      },
      disabled: {
        color: tokens.colors.text.disabled,
      },
      offline: {
        color: tokens.colors.text.disabled,
      },
    },
    indicator: {
      height: 2,
      backgroundColor: tokens.colors.primary[500],
      borderRadius: 1,
    },
    badge: {
      backgroundColor: tokens.colors.semantic.error.main,
      color: tokens.colors.text.inverse,
      fontSize: tokens.typography.fontSize['2xs'],
      minWidth: 16,
      height: 16,
      borderRadius: 8,
    },
  };
  
  // Teacher variant modifications
  if (variant === 'teacher') {
    return {
      ...baseConfig,
      container: {
        ...baseConfig.container,
        shadowOpacity: tokens.shadows.xs.shadowOpacity,
        elevation: tokens.shadows.xs.elevation,
      },
      tab: {
        ...baseConfig.tab,
        active: {
          backgroundColor: tokens.colors.primary[25],
        },
      },
    };
  }
  
  // Student variant (enhanced)
  return {
    ...baseConfig,
    container: {
      ...baseConfig.container,
      shadowOpacity: tokens.shadows.md.shadowOpacity,
      elevation: tokens.shadows.md.elevation,
    },
    tab: {
      ...baseConfig.tab,
      active: {
        backgroundColor: tokens.colors.primary[50],
      },
    },
  };
};

// Styles
const styles = {
  container: {
    position: 'relative' as const,
  },
  tabsContainer: {
    flexDirection: 'row' as const,
    height: '100%',
  },
  tabWrapper: {
    flex: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 48,
  },
  iconContainer: {
    position: 'relative' as const,
    marginBottom: 4,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  label: {
    textAlign: 'center' as const,
    includeFontPadding: false,
  },
  indicator: {
    position: 'absolute' as const,
    top: 0,
  },
  badgeContainer: {
    position: 'absolute' as const,
    top: -2,
    right: '25%',
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  badgeDot: {
    position: 'absolute' as const,
    top: 0,
    right: '30%',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeMedium: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontWeight: '700',
    textAlign: 'center' as const,
  },
  badgeTextMedium: {
    fontSize: 11,
  },
  loadingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
  },
  loadingIndicator: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
  },
  offlineIndicator: {
    position: 'absolute' as const,
    top: 4,
    left: '10%',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f59e0b',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  offlineText: {
    fontSize: 8,
    color: '#ffffff',
  },
  offlineBar: {
    position: 'absolute' as const,
    top: -24,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: '#fef3c7',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  offlineBarText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.6,
  },
};

export default TabBar;