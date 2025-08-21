/**
 * Card Component
 * Harry School Mobile Design System
 * 
 * Premium card component with 6 variants, swipe actions, sync indicators, and animations
 * Optimized for Teacher (data-focused) and Student (visual-focused) themes
 */

import React, { forwardRef, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  HapticFeedback,
  Platform,
  Image,
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import type { 
  CardProps, 
  CardColors, 
  CardDimensions, 
  SyncStatus,
  CardSwipeAction 
} from './Card.types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Card = forwardRef<View, CardProps>(({
  children,
  header,
  footer,
  variant = 'elevated',
  size = 'default',
  fullWidth = false,
  interactive = false,
  syncStatus,
  showSyncIndicator = false,
  leftActions = [],
  rightActions = [],
  enableSwipe = false,
  swipeThreshold = 80,
  autoClose = true,
  enablePressAnimation = true,
  pressScale = 0.98,
  animateElevation = false,
  dataGrid = false,
  quickActions = [],
  showQuickActions = false,
  image,
  progress,
  achievements = [],
  gradientBackground,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  onManualSync,
  enableHaptics = true,
  hapticType = 'light',
  style,
  headerStyle,
  contentStyle,
  footerStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'none',
  disableAnimations = false,
  ...viewProps
}, ref) => {
  const { theme, variant: themeVariant } = useTheme();
  const panRef = useRef<PanGestureHandler>(null);
  
  // Animation values
  const scale = useSharedValue(1);
  const elevation = useSharedValue(0);
  const translateX = useSharedValue(0);
  const actionOpacity = useSharedValue(0);
  
  // Get card configuration
  const cardConfig = useMemo(() => {
    return getCardConfig(variant, size, theme, themeVariant);
  }, [variant, size, theme, themeVariant]);

  // Handle haptic feedback
  const triggerHaptic = useCallback(() => {
    if (!enableHaptics || Platform.OS !== 'ios') return;
    HapticFeedback.trigger(hapticType);
  }, [enableHaptics, hapticType]);

  // Swipe action handlers
  const executeAction = useCallback((action: CardSwipeAction) => {
    triggerHaptic();
    action.onAction();
    
    if (autoClose) {
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      actionOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [triggerHaptic, autoClose, translateX, actionOpacity]);

  // Pan gesture handler
  const panHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      if (!enableSwipe) return;
      actionOpacity.value = withTiming(1, { duration: 200 });
    },
    onActive: (event) => {
      if (!enableSwipe) return;
      
      const { translationX: tx } = event;
      const maxTranslation = 120;
      
      // Apply resistance
      if (Math.abs(tx) > maxTranslation) {
        const resistance = 0.7;
        const over = Math.abs(tx) - maxTranslation;
        const sign = tx > 0 ? 1 : -1;
        translateX.value = sign * (maxTranslation + over * resistance);
      } else {
        translateX.value = tx;
      }
    },
    onEnd: (event) => {
      if (!enableSwipe) return;
      
      const { velocityX, translationX: tx } = event;
      const shouldTriggerAction = Math.abs(tx) > swipeThreshold;
      
      if (shouldTriggerAction) {
        // Determine which action to trigger
        const actions = tx > 0 ? rightActions : leftActions;
        if (actions.length > 0) {
          runOnJS(executeAction)(actions[0]);
        }
      } else {
        // Snap back to center
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        actionOpacity.value = withTiming(0, { duration: 200 });
      }
    },
  });

  // Press handlers
  const handlePressIn = useCallback(() => {
    if (!disableAnimations && enablePressAnimation && interactive) {
      scale.value = withTiming(pressScale, { duration: 150 });
      
      if (animateElevation) {
        elevation.value = withTiming(8, { duration: 150 });
      }
    }
    
    triggerHaptic();
    onPressIn?.();
  }, [
    disableAnimations, 
    enablePressAnimation, 
    interactive, 
    pressScale, 
    animateElevation,
    triggerHaptic,
    onPressIn,
    scale,
    elevation
  ]);

  const handlePressOut = useCallback(() => {
    if (!disableAnimations && enablePressAnimation && interactive) {
      scale.value = withSpring(1, { damping: 20, stiffness: 200 });
      
      if (animateElevation) {
        elevation.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    }
    
    onPressOut?.();
  }, [
    disableAnimations,
    enablePressAnimation,
    interactive,
    animateElevation,
    onPressOut,
    scale,
    elevation
  ]);

  const handlePress = useCallback(() => {
    if (!interactive) return;
    onPress?.();
  }, [interactive, onPress]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    const currentElevation = elevation.value;
    
    return {
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
      ],
      shadowOpacity: interpolate(
        currentElevation,
        [0, 8],
        [cardConfig.shadow.default.shadowOpacity, 0.15],
        Extrapolate.CLAMP
      ),
      shadowRadius: interpolate(
        currentElevation,
        [0, 8],
        [cardConfig.shadow.default.shadowRadius, 12],
        Extrapolate.CLAMP
      ),
      elevation: currentElevation,
    };
  });

  // Swipe actions animated style
  const leftActionStyle = useAnimatedStyle(() => ({
    opacity: actionOpacity.value,
    transform: [
      {
        translateX: interpolate(
          translateX.value,
          [0, 100],
          [-100, 0],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const rightActionStyle = useAnimatedStyle(() => ({
    opacity: actionOpacity.value,
    transform: [
      {
        translateX: interpolate(
          translateX.value,
          [-100, 0],
          [0, 100],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  // Render sync indicator
  const renderSyncIndicator = () => {
    if (!showSyncIndicator || !syncStatus) return null;

    const syncConfig = {
      synced: { color: theme.tokens.colors.semantic.success.main, icon: '✓' },
      syncing: { color: theme.tokens.colors.semantic.warning.main, icon: null },
      offline: { color: theme.tokens.colors.neutral[400], icon: '○' },
      error: { color: theme.tokens.colors.semantic.error.main, icon: '!' },
    };

    const config = syncConfig[syncStatus];

    return (
      <View style={styles.syncIndicator}>
        {syncStatus === 'syncing' ? (
          <ActivityIndicator size="small" color={config.color} />
        ) : (
          <Text style={[styles.syncIcon, { color: config.color }]}>
            {config.icon}
          </Text>
        )}
      </View>
    );
  };

  // Render quick actions
  const renderQuickActions = () => {
    if (!showQuickActions || quickActions.length === 0) return null;

    return (
      <View style={styles.quickActionsContainer}>
        {quickActions.slice(0, 3).map((action) => (
          <Pressable
            key={action.id}
            style={styles.quickActionButton}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            {action.icon}
          </Pressable>
        ))}
      </View>
    );
  };

  // Render progress indicator
  const renderProgress = () => {
    if (!progress) return null;

    const percentage = (progress.current / progress.total) * 100;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
                backgroundColor: progress.color || theme.tokens.colors.primary[500],
              },
            ]}
          />
        </View>
        {progress.showPercentage && (
          <Text style={styles.progressText}>
            {Math.round(percentage)}%
          </Text>
        )}
      </View>
    );
  };

  // Render achievements
  const renderAchievements = () => {
    if (achievements.length === 0) return null;

    return (
      <View style={styles.achievementsContainer}>
        {achievements.slice(0, 3).map((achievement) => (
          <View
            key={achievement.id}
            style={[
              styles.achievementBadge,
              { backgroundColor: achievement.color },
            ]}
            accessibilityLabel={achievement.label}
          >
            {achievement.icon}
          </View>
        ))}
      </View>
    );
  };

  // Render swipe actions
  const renderSwipeActions = (actions: CardSwipeAction[], position: 'left' | 'right') => {
    if (!enableSwipe || actions.length === 0) return null;

    const actionStyle = position === 'left' ? leftActionStyle : rightActionStyle;

    return (
      <Animated.View
        style={[
          styles.swipeActionsContainer,
          actionStyle,
          { [position]: 0 },
        ]}
      >
        {actions.map((action) => (
          <Pressable
            key={action.id}
            style={[
              styles.swipeAction,
              { backgroundColor: action.backgroundColor },
            ]}
            onPress={() => executeAction(action)}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            {action.icon && (
              <View style={styles.swipeActionIcon}>
                {typeof action.icon === 'string' ? (
                  <Text style={[styles.swipeActionIconText, { color: action.textColor }]}>
                    {action.icon}
                  </Text>
                ) : (
                  action.icon
                )}
              </View>
            )}
            <Text style={[styles.swipeActionText, { color: action.textColor }]}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </Animated.View>
    );
  };

  // Main card content
  const cardContent = (
    <View style={styles.cardContent}>
      {/* Header */}
      {header && (
        <View style={[styles.header, headerStyle]}>
          {header}
          {renderSyncIndicator()}
          {renderQuickActions()}
        </View>
      )}

      {/* Image for visual cards */}
      {image && (
        <View style={styles.imageContainer}>
          <Image
            source={image.source}
            style={[
              styles.cardImage,
              image.aspectRatio && { aspectRatio: image.aspectRatio },
            ]}
            accessibilityLabel={image.alt}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Main content */}
      <View style={[styles.content, contentStyle, dataGrid && styles.dataGrid]}>
        {children}
        {renderProgress()}
        {renderAchievements()}
      </View>

      {/* Footer */}
      {footer && (
        <View style={[styles.footer, footerStyle]}>
          {footer}
        </View>
      )}
    </View>
  );

  // Container styles
  const containerStyle = [
    styles.container,
    {
      minHeight: cardConfig.dimensions.minHeight,
      padding: cardConfig.dimensions.padding,
      backgroundColor: cardConfig.colors.background,
      borderRadius: cardConfig.dimensions.borderRadius,
      width: fullWidth ? '100%' : undefined,
    },
    cardConfig.colors.border && {
      borderWidth: 1,
      borderColor: cardConfig.colors.border,
    },
    cardConfig.shadow.default,
    style,
  ];

  // Wrap with gradient if specified
  const wrappedContent = gradientBackground ? (
    <LinearGradient
      colors={gradientBackground.colors}
      start={gradientBackground.start}
      end={gradientBackground.end}
      style={[containerStyle, { padding: 0 }]}
    >
      <View style={{ padding: cardConfig.dimensions.padding }}>
        {cardContent}
      </View>
    </LinearGradient>
  ) : (
    cardContent
  );

  const CardContainer = interactive ? AnimatedPressable : Animated.View;

  return (
    <View style={styles.wrapper}>
      {/* Left swipe actions */}
      {renderSwipeActions(leftActions, 'left')}
      
      {/* Right swipe actions */}
      {renderSwipeActions(rightActions, 'right')}

      {/* Main card */}
      <PanGestureHandler
        ref={panRef}
        onGestureEvent={panHandler}
        enabled={enableSwipe}
      >
        <CardContainer
          ref={ref}
          style={[containerStyle, animatedStyle]}
          onPress={interactive ? handlePress : undefined}
          onLongPress={interactive ? onLongPress : undefined}
          onPressIn={interactive ? handlePressIn : undefined}
          onPressOut={interactive ? handlePressOut : undefined}
          accessible={true}
          accessibilityRole={interactive ? 'button' : accessibilityRole}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          testID={testID}
          {...viewProps}
        >
          {wrappedContent}
        </CardContainer>
      </PanGestureHandler>
    </View>
  );
});

Card.displayName = 'Card';

// Utility function to get card configuration
const getCardConfig = (
  variant: CardProps['variant'],
  size: CardProps['size'],
  theme: any,
  themeVariant: string
) => {
  const { tokens } = theme;
  
  // Size configurations
  const sizeConfig: Record<string, CardDimensions> = {
    compact: {
      minHeight: 80,
      padding: 12,
      borderRadius: tokens.borderRadius.md,
    },
    default: {
      minHeight: 120,
      padding: 16,
      borderRadius: tokens.borderRadius.md,
    },
    expanded: {
      minHeight: 160,
      padding: 20,
      borderRadius: tokens.borderRadius.lg,
    },
  };

  // Variant configurations
  const variantConfig: Record<string, any> = {
    elevated: {
      colors: {
        background: tokens.colors.background.primary,
        text: tokens.colors.text.primary,
        textSecondary: tokens.colors.text.secondary,
      },
      shadow: {
        default: tokens.shadows.md,
      },
      border: false,
    },
    outlined: {
      colors: {
        background: tokens.colors.background.primary,
        border: tokens.colors.border.light,
        text: tokens.colors.text.primary,
        textSecondary: tokens.colors.text.secondary,
      },
      shadow: {
        default: tokens.shadows.none,
      },
      border: true,
    },
    filled: {
      colors: {
        background: tokens.colors.background.secondary,
        text: tokens.colors.text.primary,
        textSecondary: tokens.colors.text.secondary,
      },
      shadow: {
        default: tokens.shadows.none,
      },
      border: false,
    },
    interactive: {
      colors: {
        background: tokens.colors.background.primary,
        border: tokens.colors.border.light,
        text: tokens.colors.text.primary,
        textSecondary: tokens.colors.text.secondary,
      },
      shadow: {
        default: tokens.shadows.sm,
        pressed: tokens.shadows.md,
      },
      border: true,
    },
    data: {
      colors: {
        background: tokens.colors.background.primary,
        border: tokens.colors.border.medium,
        text: tokens.colors.text.primary,
        textSecondary: tokens.colors.text.secondary,
      },
      shadow: {
        default: themeVariant === 'teacher' ? tokens.shadows.xs : tokens.shadows.sm,
      },
      border: true,
    },
    visual: {
      colors: {
        background: `linear-gradient(135deg, ${tokens.colors.primary[50]}, ${tokens.colors.background.primary})`,
        border: tokens.colors.primary[500],
        text: tokens.colors.text.primary,
        textSecondary: tokens.colors.text.secondary,
      },
      shadow: {
        default: themeVariant === 'student' ? tokens.shadows.lg : tokens.shadows.md,
      },
      border: true,
    },
  };

  const dimensions = sizeConfig[size || 'default'];
  const config = variantConfig[variant || 'elevated'];

  return {
    dimensions,
    colors: config.colors,
    shadow: config.shadow,
    border: config.border,
  };
};

// Styles
const styles = {
  wrapper: {
    position: 'relative' as const,
  },
  container: {
    flexDirection: 'column' as const,
    overflow: 'hidden' as const,
  },
  cardContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  footer: {
    marginTop: 8,
  },
  dataGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    alignItems: 'center' as const,
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden' as const,
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  syncIndicator: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  syncIcon: {
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  quickActionsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  quickActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  progressContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 8,
    gap: 8,
  },
  progressBackground: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600' as const,
    minWidth: 32,
  },
  achievementsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 8,
    gap: 4,
  },
  achievementBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  swipeActionsContainer: {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    zIndex: 1,
  },
  swipeAction: {
    height: '100%',
    width: 80,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 8,
  },
  swipeActionIcon: {
    marginBottom: 4,
  },
  swipeActionIconText: {
    fontSize: 18,
  },
  swipeActionText: {
    fontSize: 10,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
};

export default Card;