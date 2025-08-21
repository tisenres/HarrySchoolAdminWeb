/**
 * Header Component
 * Harry School Mobile Design System
 * 
 * Versatile header component with 4 variants, search functionality, sync status,
 * offline indicators, and accessibility optimized for mobile applications
 */

import React, { forwardRef, useMemo, useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  HapticFeedback,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import type { 
  HeaderProps, 
  HeaderAction, 
  HeaderThemeConfig, 
  SyncStatus,
  HeaderLayoutMeasurement 
} from './Header.types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// Back Button Component
const BackButton: React.FC<{
  show?: boolean;
  icon?: any;
  onPress?: () => void;
  disabled?: boolean;
  themeConfig: HeaderThemeConfig;
  enableHaptics?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}> = ({ 
  show = true, 
  icon, 
  onPress, 
  disabled = false, 
  themeConfig,
  enableHaptics = true,
  testID,
  accessibilityLabel = 'Go back',
}) => {
  const scale = useSharedValue(1);
  
  const handlePressIn = useCallback(() => {
    if (!disabled) {
      scale.value = withTiming(0.9, { duration: 100 });
    }
  }, [disabled]);
  
  const handlePressOut = useCallback(() => {
    if (!disabled) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    }
  }, [disabled]);
  
  const handlePress = useCallback(() => {
    if (disabled) return;
    
    if (enableHaptics && Platform.OS === 'ios') {
      HapticFeedback.trigger('light');
    }
    
    onPress?.();
  }, [disabled, enableHaptics, onPress]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  if (!show) return null;
  
  return (
    <AnimatedPressable
      style={[
        themeConfig.backButton.container,
        animatedStyle,
        disabled && { opacity: 0.5 },
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {renderIcon(
        icon || 'arrow-left', 
        themeConfig.backButton.icon.size, 
        themeConfig.backButton.icon.color
      )}
    </AnimatedPressable>
  );
};

// Action Button Component
const ActionButton: React.FC<{
  action: HeaderAction;
  themeConfig: HeaderThemeConfig;
  enableHaptics?: boolean;
}> = ({ action, themeConfig, enableHaptics = true }) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  
  // Loading animation
  useEffect(() => {
    if (action.loading) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 200 });
    }
  }, [action.loading]);
  
  const handlePressIn = useCallback(() => {
    if (!action.disabled && !action.loading) {
      scale.value = withTiming(0.9, { duration: 100 });
    }
  }, [action.disabled, action.loading]);
  
  const handlePressOut = useCallback(() => {
    if (!action.disabled && !action.loading) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    }
  }, [action.disabled, action.loading]);
  
  const handlePress = useCallback(() => {
    if (action.disabled || action.loading) return;
    
    if (enableHaptics && Platform.OS === 'ios') {
      HapticFeedback.trigger('light');
    }
    
    action.onPress();
  }, [action, enableHaptics]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));
  
  const isDisabled = action.disabled || action.loading;
  
  return (
    <AnimatedPressable
      style={[
        themeConfig.action.container,
        animatedStyle,
        isDisabled && themeConfig.action.disabled,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={action.accessibilityLabel || action.label}
      accessibilityHint={action.accessibilityHint}
      accessibilityState={{
        disabled: isDisabled,
        busy: action.loading,
      }}
      testID={action.testID}
    >
      {renderIcon(
        action.icon, 
        themeConfig.action.icon.size, 
        themeConfig.action.icon.color
      )}
      
      {/* Badge */}
      {action.badgeCount !== undefined && action.badgeCount > 0 && (
        <View style={styles.actionBadge}>
          <Text style={styles.actionBadgeText}>
            {action.badgeCount > 99 ? '99+' : action.badgeCount.toString()}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
};

// Search Bar Component
const SearchBar: React.FC<{
  isActive: boolean;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClear?: () => void;
  autoFocus?: boolean;
  maxLength?: number;
  themeConfig: HeaderThemeConfig;
  layoutMeasurement: HeaderLayoutMeasurement;
  animationDuration: number;
  disableAnimations?: boolean;
}> = ({
  isActive,
  placeholder = 'Search...',
  value = '',
  onChangeText,
  onSubmitEditing,
  onFocus,
  onBlur,
  onClear,
  autoFocus = false,
  maxLength = 100,
  themeConfig,
  layoutMeasurement,
  animationDuration,
  disableAnimations = false,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  // Animation values
  const width = useSharedValue(isActive ? layoutMeasurement.availableSearchWidth : 0);
  const opacity = useSharedValue(isActive ? 1 : 0);
  const translateX = useSharedValue(isActive ? 0 : 50);
  
  // Update animations when active state changes
  useEffect(() => {
    if (disableAnimations) {
      width.value = isActive ? layoutMeasurement.availableSearchWidth : 0;
      opacity.value = isActive ? 1 : 0;
      translateX.value = isActive ? 0 : 50;
      return;
    }
    
    if (isActive) {
      width.value = withTiming(layoutMeasurement.availableSearchWidth, { duration: animationDuration });
      opacity.value = withTiming(1, { duration: animationDuration });
      translateX.value = withSpring(0, { damping: 20, stiffness: 150 });
      
      // Auto focus after animation
      setTimeout(() => {
        if (autoFocus) {
          inputRef.current?.focus();
        }
      }, animationDuration);
    } else {
      width.value = withTiming(0, { duration: animationDuration });
      opacity.value = withTiming(0, { duration: animationDuration / 2 });
      translateX.value = withTiming(50, { duration: animationDuration });
      
      // Dismiss keyboard
      inputRef.current?.blur();
    }
  }, [isActive, layoutMeasurement.availableSearchWidth, animationDuration, autoFocus, disableAnimations]);
  
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);
  
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);
  
  const handleClear = useCallback(() => {
    onClear?.();
    inputRef.current?.focus();
  }, [onClear]);
  
  const animatedContainerStyle = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));
  
  if (!isActive && opacity.value === 0) return null;
  
  return (
    <Animated.View style={[themeConfig.searchBar.container, animatedContainerStyle]}>
      {/* Search Icon */}
      <View style={styles.searchIcon}>
        {renderIcon('search', themeConfig.searchBar.icon.size, themeConfig.searchBar.icon.color)}
      </View>
      
      {/* Search Input */}
      <AnimatedTextInput
        ref={inputRef}
        style={[
          themeConfig.searchBar.input,
          { flex: 1 },
        ]}
        placeholder={placeholder}
        placeholderTextColor={themeConfig.searchBar.placeholder.color}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        onFocus={handleFocus}
        onBlur={handleBlur}
        maxLength={maxLength}
        returnKeyType="search"
        accessible={true}
        accessibilityRole="searchbox"
        accessibilityLabel={`Search ${placeholder.toLowerCase()}`}
        accessibilityState={{ expanded: isActive }}
      />
      
      {/* Clear Button */}
      {value.length > 0 && (
        <Pressable
          style={styles.clearButton}
          onPress={handleClear}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          {renderIcon('x', 16, themeConfig.searchBar.icon.color)}
        </Pressable>
      )}
    </Animated.View>
  );
};

// Sync Status Indicator
const SyncIndicator: React.FC<{
  status: SyncStatus;
  themeConfig: HeaderThemeConfig;
}> = ({ status, themeConfig }) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  
  // Animation for syncing state
  useEffect(() => {
    if (status === 'syncing') {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 200 });
    }
    
    // Success animation
    if (status === 'success') {
      scale.value = withSequence(
        withSpring(1.2, { damping: 15, stiffness: 200 }),
        withSpring(1, { damping: 20, stiffness: 150 })
      );
    }
  }, [status]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));
  
  const getIconAndColor = () => {
    switch (status) {
      case 'syncing':
        return { icon: 'refresh-cw', color: themeConfig.syncIndicator.colors.syncing };
      case 'success':
        return { icon: 'check', color: themeConfig.syncIndicator.colors.success };
      case 'error':
        return { icon: 'alert-triangle', color: themeConfig.syncIndicator.colors.error };
      default:
        return { icon: 'wifi', color: themeConfig.syncIndicator.colors.idle };
    }
  };
  
  const { icon, color } = getIconAndColor();
  
  if (status === 'idle') return null;
  
  return (
    <View style={themeConfig.syncIndicator.container}>
      <Animated.View style={animatedStyle}>
        {renderIcon(icon, themeConfig.syncIndicator.icon.size, color)}
      </Animated.View>
    </View>
  );
};

// Offline Indicator
const OfflineIndicator: React.FC<{
  isOffline: boolean;
  themeConfig: HeaderThemeConfig;
}> = ({ isOffline, themeConfig }) => {
  const opacity = useSharedValue(isOffline ? 1 : 0);
  const translateY = useSharedValue(isOffline ? 0 : -24);
  
  useEffect(() => {
    opacity.value = withTiming(isOffline ? 1 : 0, { duration: 300 });
    translateY.value = withSpring(isOffline ? 0 : -24, { damping: 20, stiffness: 150 });
  }, [isOffline]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  
  return (
    <Animated.View style={[themeConfig.offlineIndicator.container, animatedStyle]}>
      <Text style={themeConfig.offlineIndicator.text}>
        No internet connection
      </Text>
    </Animated.View>
  );
};

// Main Header Component
export const Header = forwardRef<View, HeaderProps>(({
  variant = 'default',
  title,
  subtitle,
  titleComponent,
  titleAlign = 'center',
  titleNumberOfLines = 1,
  subtitleNumberOfLines = 1,
  backButton,
  actions = [],
  search,
  isOffline = false,
  syncStatus = 'idle',
  disabled = false,
  loading = false,
  enableHaptics = true,
  animationDuration = 300,
  searchAnimationDuration = 250,
  disableAnimations = false,
  style,
  titleStyle,
  subtitleStyle,
  height,
  backgroundColor,
  borderColor,
  hideBorder = false,
  testID,
  accessible = true,
  accessibilityRole = 'banner',
  accessibilityLabel = 'Header',
  ...accessibilityProps
}, ref) => {
  const { theme, variant: themeVariant } = useTheme();
  const [layoutMeasurement, setLayoutMeasurement] = useState<HeaderLayoutMeasurement>({
    containerWidth: 0,
    titleWidth: 0,
    backButtonWidth: backButton?.show ? 44 : 0,
    actionsWidth: actions.length * 44,
    availableSearchWidth: 0,
  });
  
  const themeConfig = getHeaderThemeConfig(variant, theme, themeVariant);
  
  // Animation values
  const headerOpacity = useSharedValue(1);
  const titleOpacity = useSharedValue(search?.isActive ? 0 : 1);
  
  // Update title opacity based on search state
  useEffect(() => {
    if (disableAnimations) {
      titleOpacity.value = search?.isActive ? 0 : 1;
      return;
    }
    
    titleOpacity.value = withTiming(
      search?.isActive ? 0 : 1, 
      { duration: searchAnimationDuration }
    );
  }, [search?.isActive, searchAnimationDuration, disableAnimations]);
  
  // Handle container layout
  const handleContainerLayout = useCallback((event: any) => {
    const { width } = event.nativeEvent.layout;
    const backButtonWidth = backButton?.show ? 44 : 0;
    const actionsWidth = actions.length * 44;
    const availableSearchWidth = width - backButtonWidth - actionsWidth - 32; // 16px padding each side
    
    setLayoutMeasurement({
      containerWidth: width,
      titleWidth: width - backButtonWidth - actionsWidth - 32,
      backButtonWidth,
      actionsWidth,
      availableSearchWidth: Math.max(availableSearchWidth, 200), // Minimum 200px
    });
  }, [backButton?.show, actions.length]);
  
  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));
  
  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));
  
  // Get container height
  const containerHeight = useMemo(() => {
    if (height) return height;
    if (variant === 'minimal') return 44;
    if (subtitle) return 72;
    return 56;
  }, [variant, height, subtitle]);
  
  // Container styles
  const containerStyle = [
    styles.container,
    themeConfig.container[variant],
    {
      height: containerHeight,
      backgroundColor: backgroundColor || themeConfig.container[variant].backgroundColor,
    },
    !hideBorder && {
      borderBottomColor: borderColor || themeConfig.container[variant].borderBottomColor,
    },
    hideBorder && { borderBottomWidth: 0 },
    disabled && styles.disabled,
    style,
  ];
  
  // Title content styles
  const titleContentStyle = [
    styles.titleContent,
    titleAlign === 'left' && styles.titleContentLeft,
  ];
  
  return (
    <View style={{ position: 'relative' }}>
      {/* Offline Indicator */}
      <OfflineIndicator isOffline={isOffline} themeConfig={themeConfig} />
      
      <Animated.View
        ref={ref}
        style={[containerStyle, animatedHeaderStyle]}
        onLayout={handleContainerLayout}
        accessible={accessible}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        {...accessibilityProps}
      >
        {/* Back Button */}
        {backButton?.show && (
          <BackButton
            {...backButton}
            themeConfig={themeConfig}
            enableHaptics={enableHaptics}
            disabled={disabled || backButton.disabled}
          />
        )}
        
        {/* Title Content */}
        <Animated.View style={[titleContentStyle, animatedTitleStyle]}>
          {titleComponent || (
            <>
              {title && (
                <Text
                  style={[
                    themeConfig.title[variant],
                    titleStyle,
                  ]}
                  numberOfLines={titleNumberOfLines}
                  adjustsFontSizeToFit={titleNumberOfLines === 1}
                  minimumFontScale={0.8}
                  accessible={true}
                  accessibilityRole="heading"
                  accessibilityLabel={title}
                >
                  {title}
                </Text>
              )}
              
              {subtitle && (
                <Text
                  style={[
                    themeConfig.subtitle.default,
                    subtitleStyle,
                  ]}
                  numberOfLines={subtitleNumberOfLines}
                  accessible={true}
                  accessibilityLabel={subtitle}
                >
                  {subtitle}
                </Text>
              )}
            </>
          )}
        </Animated.View>
        
        {/* Search Bar */}
        {search && (
          <SearchBar
            {...search}
            themeConfig={themeConfig}
            layoutMeasurement={layoutMeasurement}
            animationDuration={searchAnimationDuration}
            disableAnimations={disableAnimations}
          />
        )}
        
        {/* Actions */}
        <View style={styles.actionsContainer}>
          {/* Sync Indicator */}
          <SyncIndicator status={syncStatus} themeConfig={themeConfig} />
          
          {/* Action Buttons */}
          {actions.slice(0, 3).map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              themeConfig={themeConfig}
              enableHaptics={enableHaptics}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
});

Header.displayName = 'Header';

// Utility function to render icon
const renderIcon = (icon: any, size: number, color: string) => {
  if (typeof icon === 'string') {
    return (
      <Text style={{ fontSize: size, color }}>
        {getIconUnicode(icon)}
      </Text>
    );
  }
  
  return icon;
};

// Simple icon mapping (replace with your icon library)
const getIconUnicode = (iconName: string): string => {
  const iconMap: Record<string, string> = {
    'arrow-left': '←',
    search: '🔍',
    x: '✕',
    'refresh-cw': '↻',
    check: '✓',
    'alert-triangle': '⚠️',
    wifi: '📶',
    menu: '☰',
    'more-vertical': '⋮',
    bell: '🔔',
    settings: '⚙️',
    user: '👤',
  };
  
  return iconMap[iconName] || '●';
};

// Theme configuration utility
const getHeaderThemeConfig = (variant: HeaderProps['variant'], theme: any, themeVariant: string): HeaderThemeConfig => {
  const { tokens } = theme;
  
  const baseConfig: HeaderThemeConfig = {
    container: {
      default: {
        backgroundColor: tokens.colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: tokens.colors.border.light,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      search: {
        backgroundColor: tokens.colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: tokens.colors.border.light,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      },
      minimal: {
        backgroundColor: 'transparent',
        borderBottomWidth: 0,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      contextual: {
        backgroundColor: tokens.colors.primary[500],
        borderBottomWidth: 0,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
    },
    title: {
      default: {
        fontSize: tokens.typography.fontSize.lg,
        fontWeight: tokens.typography.fontWeight.semibold,
        color: tokens.colors.text.primary,
        textAlign: 'center',
      },
      search: {
        fontSize: tokens.typography.fontSize.lg,
        fontWeight: tokens.typography.fontWeight.semibold,
        color: tokens.colors.text.primary,
        textAlign: 'center',
      },
      minimal: {
        fontSize: tokens.typography.fontSize.lg,
        fontWeight: tokens.typography.fontWeight.semibold,
        color: tokens.colors.text.primary,
        textAlign: 'center',
      },
      contextual: {
        fontSize: tokens.typography.fontSize.lg,
        fontWeight: tokens.typography.fontWeight.semibold,
        color: tokens.colors.text.inverse,
        textAlign: 'center',
      },
    },
    subtitle: {
      default: {
        fontSize: tokens.typography.fontSize.sm,
        fontWeight: tokens.typography.fontWeight.regular,
        color: tokens.colors.text.secondary,
        textAlign: 'center',
        marginTop: 2,
      },
    },
    backButton: {
      container: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
      },
      icon: {
        size: 24,
        color: variant === 'contextual' ? tokens.colors.text.inverse : tokens.colors.text.primary,
      },
    },
    action: {
      container: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
        position: 'relative',
      },
      icon: {
        size: 24,
        color: variant === 'contextual' ? tokens.colors.text.inverse : tokens.colors.text.primary,
      },
      disabled: {
        opacity: tokens.opacity.disabled,
      },
    },
    searchBar: {
      container: {
        height: 40,
        backgroundColor: tokens.colors.background.secondary,
        borderRadius: tokens.borderRadius.full,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginHorizontal: 8,
      },
      input: {
        fontSize: tokens.typography.fontSize.base,
        fontWeight: tokens.typography.fontWeight.regular,
        color: tokens.colors.text.primary,
        marginLeft: 8,
      },
      placeholder: {
        color: tokens.colors.text.placeholder,
      },
      icon: {
        size: 20,
        color: tokens.colors.text.tertiary,
      },
    },
    syncIndicator: {
      container: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
      },
      icon: {
        size: 16,
      },
      colors: {
        idle: tokens.colors.text.tertiary,
        syncing: tokens.colors.semantic.warning.main,
        success: tokens.colors.semantic.success.main,
        error: tokens.colors.semantic.error.main,
      },
    },
    offlineIndicator: {
      container: {
        height: 24,
        backgroundColor: tokens.colors.semantic.warning.light,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
      },
      text: {
        fontSize: tokens.typography.fontSize.xs,
        fontWeight: tokens.typography.fontWeight.medium,
        color: tokens.colors.semantic.warning.dark,
      },
    },
  };
  
  // Teacher variant modifications (more subtle)
  if (themeVariant === 'teacher') {
    return {
      ...baseConfig,
      container: {
        ...baseConfig.container,
        default: {
          ...baseConfig.container.default,
          backgroundColor: tokens.colors.background.primary,
          borderBottomColor: tokens.colors.border.light,
        },
      },
    };
  }
  
  return baseConfig;
};

// Styles
const styles = {
  container: {
    position: 'relative' as const,
  },
  titleContent: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 16,
  },
  titleContentLeft: {
    alignItems: 'flex-start' as const,
  },
  actionsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  searchIcon: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  clearButton: {
    width: 24,
    height: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 8,
  },
  actionBadge: {
    position: 'absolute' as const,
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 4,
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  disabled: {
    opacity: 0.6,
  },
};

export default Header;