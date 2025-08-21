/**
 * Avatar Component
 * Harry School Mobile Design System
 * 
 * Premium avatar component with 6 sizes, status indicators, role badges, and fallback handling
 * Optimized for educational contexts with teacher/student roles
 */

import React, { forwardRef, useMemo, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  HapticFeedback,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import type { 
  AvatarProps, 
  AvatarDimensions, 
  AvatarColors,
  UserStatus,
  UserRole,
} from './Avatar.types';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Avatar = forwardRef<View, AvatarProps>(({
  size = 'md',
  source,
  alt,
  name,
  initials,
  maxInitials = 2,
  status,
  showStatus = false,
  statusPosition = 'bottom-right',
  role,
  showRole = false,
  rolePosition = 'top-right',
  interactive = false,
  badge,
  customBadge,
  achievementBadge,
  onPress,
  onLongPress,
  enableHaptics = true,
  hapticType = 'light',
  enablePressAnimation = true,
  pressScale = 0.95,
  showShadow = false,
  enableAnimations = true,
  entranceAnimation = 'fade',
  statusChangeAnimation = true,
  disableAnimations = false,
  borderWidth,
  borderColor,
  backgroundColor,
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'image',
  includeStatusInLabel = true,
  includeRoleInLabel = true,
  onError,
  onLoad,
  isInGroup = false,
  fallbackBackgroundColor,
  fallbackTextColor,
  showPlaceholderIcon = true,
  ...viewProps
}, ref) => {
  const { theme, variant: themeVariant } = useTheme();
  
  // Internal state
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<UserStatus | undefined>(status);
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(entranceAnimation === 'fade' ? 0 : 1);
  const statusScale = useSharedValue(1);
  const statusOpacity = useSharedValue(1);
  
  // Get avatar configuration
  const avatarConfig = useMemo(() => {
    return getAvatarConfig(size, theme, themeVariant);
  }, [size, theme, themeVariant]);

  // Generate initials from name
  const generatedInitials = useMemo(() => {
    if (initials) return initials.slice(0, maxInitials).toUpperCase();
    if (!name) return '';
    
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].slice(0, maxInitials).toUpperCase();
    }
    
    return words
      .slice(0, maxInitials)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  }, [name, initials, maxInitials]);

  // Generate background color from name
  const generatedBackgroundColor = useMemo(() => {
    if (fallbackBackgroundColor) return fallbackBackgroundColor;
    if (!name && !initials) return avatarConfig.colors.placeholder;
    
    // Simple hash function to generate consistent colors
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    const nameForHash = name || initials || '';
    let hash = 0;
    for (let i = 0; i < nameForHash.length; i++) {
      hash = nameForHash.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }, [name, initials, fallbackBackgroundColor, avatarConfig.colors.placeholder]);

  // Handle haptic feedback
  const triggerHaptic = useCallback(() => {
    if (!enableHaptics || Platform.OS !== 'ios') return;
    HapticFeedback.trigger(hapticType);
  }, [enableHaptics, hapticType]);

  // Status change effect
  useEffect(() => {
    if (!statusChangeAnimation || disableAnimations || currentStatus === status) {
      setCurrentStatus(status);
      return;
    }

    if (showStatus && status !== currentStatus) {
      // Animate status change
      statusOpacity.value = withSequence(
        withTiming(0, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
      
      // Update status after fade out
      setTimeout(() => {
        setCurrentStatus(status);
      }, 150);
    } else {
      setCurrentStatus(status);
    }
  }, [status, currentStatus, statusChangeAnimation, disableAnimations, showStatus, statusOpacity]);

  // Entrance animation
  useEffect(() => {
    if (disableAnimations || !enableAnimations) return;
    
    if (entranceAnimation === 'fade') {
      opacity.value = withDelay(50, withTiming(1, { duration: 300 }));
    } else if (entranceAnimation === 'scale') {
      scale.value = 0.8;
      scale.value = withDelay(50, withSpring(1, { damping: 20, stiffness: 200 }));
    }
  }, [disableAnimations, enableAnimations, entranceAnimation, opacity, scale]);

  // Press handlers
  const handlePressIn = useCallback(() => {
    if (!interactive || !enablePressAnimation || disableAnimations) return;
    
    scale.value = withTiming(pressScale, { duration: 150 });
    triggerHaptic();
  }, [interactive, enablePressAnimation, disableAnimations, pressScale, scale, triggerHaptic]);

  const handlePressOut = useCallback(() => {
    if (!interactive || !enablePressAnimation || disableAnimations) return;
    
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
  }, [interactive, enablePressAnimation, disableAnimations, scale]);

  const handlePress = useCallback(() => {
    if (!interactive) return;
    onPress?.();
  }, [interactive, onPress]);

  const handleLongPress = useCallback(() => {
    if (!interactive) return;
    onLongPress?.();
  }, [interactive, onLongPress]);

  // Image handlers
  const handleImageError = useCallback(() => {
    setImageError(true);
    onError?.();
  }, [onError]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const statusAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: statusScale.value }],
    opacity: statusOpacity.value,
  }));

  // Render status indicator
  const renderStatusIndicator = () => {
    if (!showStatus || !currentStatus) return null;

    const statusConfig = {
      online: { color: avatarConfig.colors.status.online, icon: '' },
      away: { color: avatarConfig.colors.status.away, icon: '' },
      busy: { color: avatarConfig.colors.status.busy, icon: '' },
      offline: { color: avatarConfig.colors.status.offline, icon: '' },
    };

    const config = statusConfig[currentStatus];
    const statusSize = avatarConfig.dimensions.statusSize;

    const positionStyle = getPositionStyle(statusPosition, statusSize, avatarConfig.dimensions.size);

    return (
      <AnimatedView
        style={[
          styles.statusIndicator,
          {
            width: statusSize,
            height: statusSize,
            borderRadius: statusSize / 2,
            backgroundColor: config.color,
            borderWidth: 2,
            borderColor: theme.tokens.colors.background.primary,
          },
          positionStyle,
          statusAnimatedStyle,
        ]}
        accessibilityLabel={`Status: ${currentStatus}`}
      />
    );
  };

  // Render role badge
  const renderRoleBadge = () => {
    if (!showRole || !role) return null;

    const roleConfig = {
      teacher: { color: avatarConfig.colors.role.teacher, icon: '👨‍🏫' },
      student: { color: avatarConfig.colors.role.student, icon: '🎓' },
      admin: { color: avatarConfig.colors.role.admin, icon: '👑' },
      parent: { color: avatarConfig.colors.role.parent, icon: '👨‍👩‍👧' },
      staff: { color: avatarConfig.colors.role.staff, icon: '👷' },
    };

    const config = roleConfig[role];
    const roleSize = avatarConfig.dimensions.roleSize;

    const positionStyle = getPositionStyle(rolePosition, roleSize, avatarConfig.dimensions.size);

    return (
      <View
        style={[
          styles.roleBadge,
          {
            width: roleSize,
            height: roleSize,
            borderRadius: roleSize / 2,
            backgroundColor: config.color,
            borderWidth: 2,
            borderColor: theme.tokens.colors.background.primary,
          },
          positionStyle,
        ]}
        accessibilityLabel={`Role: ${role}`}
      >
        <Text style={[styles.roleIcon, { fontSize: roleSize * 0.6 }]}>
          {config.icon}
        </Text>
      </View>
    );
  };

  // Render notification badge
  const renderBadge = () => {
    if (!badge || (!badge.count && !badge.showZero && badge.count !== 0)) return null;

    const badgeSize = avatarConfig.dimensions.badgeSize;
    const displayCount = badge.count && badge.count > (badge.maxCount || 99) 
      ? `${badge.maxCount || 99}+` 
      : badge.count?.toString() || '';

    const positionStyle = getPositionStyle(badge.position || 'top-right', badgeSize, avatarConfig.dimensions.size);

    return (
      <View
        style={[
          styles.badge,
          {
            minWidth: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            backgroundColor: badge.color || theme.tokens.colors.semantic.error.main,
            paddingHorizontal: 4,
          },
          positionStyle,
        ]}
        accessibilityLabel={`${displayCount} notifications`}
      >
        <Text
          style={[
            styles.badgeText,
            {
              color: badge.textColor || theme.tokens.colors.text.inverse,
              fontSize: Math.min(10, badgeSize * 0.7),
            },
          ]}
        >
          {displayCount}
        </Text>
      </View>
    );
  };

  // Render achievement badge
  const renderAchievementBadge = () => {
    if (!achievementBadge) return null;

    const achievementColors = {
      gold: theme.tokens.colors.ranking.gold.main,
      silver: theme.tokens.colors.ranking.silver.main,
      bronze: theme.tokens.colors.ranking.bronze.main,
    };

    const badgeSize = avatarConfig.dimensions.badgeSize;
    const positionStyle = getPositionStyle('bottom-left', badgeSize, avatarConfig.dimensions.size);

    return (
      <View
        style={[
          styles.achievementBadge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            backgroundColor: achievementColors[achievementBadge.type],
            borderWidth: 2,
            borderColor: theme.tokens.colors.background.primary,
          },
          positionStyle,
        ]}
        accessibilityLabel={`${achievementBadge.type} achievement`}
      >
        {achievementBadge.icon || (
          <Text style={[styles.achievementIcon, { fontSize: badgeSize * 0.6 }]}>
            ⭐
          </Text>
        )}
      </View>
    );
  };

  // Render custom badge
  const renderCustomBadge = () => {
    if (!customBadge) return null;
    
    return (
      <View style={styles.customBadge}>
        {customBadge}
      </View>
    );
  };

  // Render avatar content
  const renderAvatarContent = () => {
    // Show image if available and no error
    if (source && !imageError) {
      return (
        <Image
          source={source}
          style={[styles.image, { width: '100%', height: '100%' }]}
          onError={handleImageError}
          onLoad={handleImageLoad}
          accessibilityLabel={alt || `Avatar for ${name || 'user'}`}
          resizeMode="cover"
        />
      );
    }

    // Show initials if available
    if (generatedInitials) {
      return (
        <Text
          style={[
            styles.initials,
            {
              fontSize: avatarConfig.dimensions.fontSize,
              color: fallbackTextColor || avatarConfig.colors.text,
            },
          ]}
        >
          {generatedInitials}
        </Text>
      );
    }

    // Show placeholder icon
    if (showPlaceholderIcon) {
      return (
        <Text
          style={[
            styles.placeholderIcon,
            {
              fontSize: avatarConfig.dimensions.fontSize,
              color: avatarConfig.colors.placeholder,
            },
          ]}
        >
          👤
        </Text>
      );
    }

    return null;
  };

  // Build accessibility label
  const buildAccessibilityLabel = () => {
    let label = accessibilityLabel || alt || `Avatar for ${name || 'user'}`;
    
    if (includeRoleInLabel && role) {
      label += `, ${role}`;
    }
    
    if (includeStatusInLabel && currentStatus) {
      label += `, ${currentStatus}`;
    }
    
    if (badge && badge.count) {
      label += `, ${badge.count} notifications`;
    }
    
    return label;
  };

  // Container styles
  const containerStyle = [
    styles.container,
    {
      width: avatarConfig.dimensions.size,
      height: avatarConfig.dimensions.size,
      borderRadius: avatarConfig.dimensions.borderRadius,
      borderWidth: borderWidth || avatarConfig.dimensions.borderWidth,
      borderColor: borderColor || avatarConfig.colors.border,
      backgroundColor: backgroundColor || generatedBackgroundColor,
    },
    showShadow && avatarConfig.shadow,
    isInGroup && styles.groupAvatar,
    style,
  ];

  const AvatarContainer = interactive ? AnimatedPressable : AnimatedView;

  return (
    <AvatarContainer
      ref={ref}
      style={[containerStyle, containerAnimatedStyle]}
      onPress={interactive ? handlePress : undefined}
      onLongPress={interactive ? handleLongPress : undefined}
      onPressIn={interactive ? handlePressIn : undefined}
      onPressOut={interactive ? handlePressOut : undefined}
      accessible={true}
      accessibilityRole={interactive ? 'button' : accessibilityRole}
      accessibilityLabel={buildAccessibilityLabel()}
      accessibilityHint={accessibilityHint}
      testID={testID}
      {...viewProps}
    >
      {renderAvatarContent()}
      {renderStatusIndicator()}
      {renderRoleBadge()}
      {renderBadge()}
      {renderAchievementBadge()}
      {renderCustomBadge()}
    </AvatarContainer>
  );
});

Avatar.displayName = 'Avatar';

// Utility function to get position styles for indicators
const getPositionStyle = (
  position: string,
  indicatorSize: number,
  avatarSize: number
) => {
  const offset = indicatorSize / 2;
  
  const positions = {
    'top-right': {
      position: 'absolute' as const,
      top: -offset,
      right: -offset,
    },
    'top-left': {
      position: 'absolute' as const,
      top: -offset,
      left: -offset,
    },
    'bottom-right': {
      position: 'absolute' as const,
      bottom: -offset,
      right: -offset,
    },
    'bottom-left': {
      position: 'absolute' as const,
      bottom: -offset,
      left: -offset,
    },
  };
  
  return positions[position as keyof typeof positions] || positions['bottom-right'];
};

// Utility function to get avatar configuration
const getAvatarConfig = (size: AvatarProps['size'], theme: any, themeVariant: string) => {
  const { tokens } = theme;
  
  // Size configurations
  const sizeConfig: Record<string, AvatarDimensions> = {
    xs: {
      size: 24,
      fontSize: 10,
      borderRadius: 12,
      borderWidth: 1,
      statusSize: 6,
      roleSize: 12,
      badgeSize: 16,
    },
    sm: {
      size: 32,
      fontSize: 12,
      borderRadius: 16,
      borderWidth: 1.5,
      statusSize: 8,
      roleSize: 16,
      badgeSize: 20,
    },
    md: {
      size: 40,
      fontSize: 14,
      borderRadius: 20,
      borderWidth: 2,
      statusSize: 10,
      roleSize: 20,
      badgeSize: 24,
    },
    lg: {
      size: 56,
      fontSize: 18,
      borderRadius: 28,
      borderWidth: 2,
      statusSize: 12,
      roleSize: 24,
      badgeSize: 28,
    },
    xl: {
      size: 80,
      fontSize: 24,
      borderRadius: 40,
      borderWidth: 3,
      statusSize: 14,
      roleSize: 32,
      badgeSize: 32,
    },
    xxl: {
      size: 120,
      fontSize: 36,
      borderRadius: 60,
      borderWidth: 4,
      statusSize: 16,
      roleSize: 40,
      badgeSize: 36,
    },
  };

  // Color configuration
  const colors: AvatarColors = {
    background: tokens.colors.background.primary,
    border: tokens.colors.border.light,
    text: tokens.colors.text.inverse,
    placeholder: tokens.colors.text.tertiary,
    status: {
      online: tokens.colors.semantic.success.main,
      away: tokens.colors.semantic.warning.main,
      busy: tokens.colors.semantic.error.main,
      offline: tokens.colors.neutral[400],
    },
    role: {
      teacher: tokens.colors.primary[600],
      student: tokens.colors.semantic.info.main,
      admin: tokens.colors.ranking.gold.main,
      parent: tokens.colors.semantic.success.main,
      staff: tokens.colors.neutral[600],
    },
  };

  // Shadow configuration
  const shadow = themeVariant === 'student' ? tokens.shadows.md : tokens.shadows.sm;

  return {
    dimensions: sizeConfig[size || 'md'],
    colors,
    shadow,
  };
};

// Styles
const styles = {
  container: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  groupAvatar: {
    marginLeft: -8,
  },
  image: {
    borderRadius: 'inherit' as any,
  },
  initials: {
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center' as const,
    includeFontPadding: false,
  },
  placeholderIcon: {
    textAlign: 'center' as const,
  },
  statusIndicator: {
    position: 'absolute' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  roleBadge: {
    position: 'absolute' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  roleIcon: {
    textAlign: 'center' as const,
  },
  badge: {
    position: 'absolute' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  badgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    textAlign: 'center' as const,
    includeFontPadding: false,
  },
  achievementBadge: {
    position: 'absolute' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  achievementIcon: {
    textAlign: 'center' as const,
  },
  customBadge: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
  },
};

export default Avatar;