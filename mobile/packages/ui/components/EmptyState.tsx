/**
 * EmptyState Component
 * Harry School Mobile Design System
 * 
 * Comprehensive empty state with contextual messaging, illustrations, and recovery actions
 * Optimized for educational context with Teacher and Student variants
 */

import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  RefreshControl,
  ScrollView,
  AccessibilityInfo,
  Dimensions,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { animations } from '../theme/animations';
import Button from './Button/Button';
import type {
  EmptyStateProps,
  EmptyStateVariant,
  EmptyStateSize,
  IllustrationConfig,
  EducationalContext,
  EmptyStateAction,
} from './EmptyState.types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant,
  size = 'standard',
  content,
  illustration,
  primaryAction,
  secondaryAction,
  additionalActions,
  educationalContext,
  refresh,
  retry,
  animation,
  accessibility,
  themeVariant,
  showCard = false,
  cardElevation = 'medium',
  style,
  contentStyle,
  illustrationStyle,
  titleStyle,
  descriptionStyle,
  detailsStyle,
  actionsStyle,
  actionButtonStyle,
  testID,
}) => {
  const { theme, variant: currentThemeVariant } = useTheme();
  const effectiveThemeVariant = themeVariant || currentThemeVariant;
  const isReducedMotion = animations.useReducedMotion();
  
  // Animation values
  const containerOpacity = useSharedValue(0);
  const containerTranslateY = useSharedValue(20);
  const illustrationScale = useSharedValue(0.8);
  const contentOpacity = useSharedValue(0);
  const actionsOpacity = useSharedValue(0);
  
  // State management
  const mountTimeRef = useRef<number>(Date.now());
  
  // Theme configuration
  const themeConfig = useMemo(() => ({
    colors: {
      background: showCard ? theme.colors.background.secondary : 'transparent',
      card: theme.colors.background.primary,
      text: {
        primary: theme.colors.text.primary,
        secondary: theme.colors.text.secondary,
        tertiary: theme.colors.text.tertiary,
      },
      icon: {
        primary: getIconColor(variant, theme),
        secondary: theme.colors.text.tertiary,
      },
      accent: theme.colors.primary[500],
      border: theme.colors.border.light,
    },
    spacing: getSizeSpacing(size),
    typography: {
      title: {
        fontSize: getTitleSize(size),
        fontWeight: '600' as const,
        lineHeight: getTitleSize(size) * 1.2,
        textAlign: 'center' as const,
      },
      description: {
        fontSize: getDescriptionSize(size),
        fontWeight: '400' as const,
        lineHeight: getDescriptionSize(size) * 1.4,
        textAlign: 'center' as const,
      },
      details: {
        fontSize: getDetailsSize(size),
        fontWeight: '400' as const,
        lineHeight: getDetailsSize(size) * 1.3,
        textAlign: 'center' as const,
      },
    },
    shadows: getCardShadow(cardElevation, theme),
    animations: {
      duration: isReducedMotion ? 0 : 400,
      stagger: isReducedMotion ? 0 : 100,
      springConfig: animations.springConfigs.gentle,
    },
  }), [theme, variant, size, showCard, cardElevation, effectiveThemeVariant, isReducedMotion]);

  // Entrance animations
  useEffect(() => {
    const startAnimations = () => {
      if (!isReducedMotion) {
        // Staggered entrance animation
        containerOpacity.value = withTiming(1, { duration: themeConfig.animations.duration });
        
        containerTranslateY.value = withSpring(0, themeConfig.animations.springConfig);
        
        illustrationScale.value = withDelay(
          themeConfig.animations.stagger,
          withSpring(1, themeConfig.animations.springConfig)
        );
        
        contentOpacity.value = withDelay(
          themeConfig.animations.stagger * 2,
          withTiming(1, { duration: themeConfig.animations.duration })
        );
        
        actionsOpacity.value = withDelay(
          themeConfig.animations.stagger * 3,
          withTiming(1, { duration: themeConfig.animations.duration })
        );
      } else {
        containerOpacity.value = 1;
        containerTranslateY.value = 0;
        illustrationScale.value = 1;
        contentOpacity.value = 1;
        actionsOpacity.value = 1;
      }
    };

    startAnimations();
  }, [variant, isReducedMotion, themeConfig]);

  // Illustration floating animation
  useEffect(() => {
    if (animation?.illustration?.enabled && !isReducedMotion) {
      const animationType = animation.illustration.type;
      const duration = animation.illustration.duration || 3000;
      
      if (animationType === 'float') {
        illustrationScale.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: duration / 2 }),
            withTiming(0.95, { duration: duration / 2 })
          ),
          -1,
          true
        );
      } else if (animationType === 'pulse') {
        illustrationScale.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: duration / 4 }),
            withTiming(1, { duration: (duration * 3) / 4 })
          ),
          -1,
          false
        );
      }
    }
  }, [animation, isReducedMotion]);

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ translateY: containerTranslateY.value }],
  }));

  const illustrationAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: illustrationScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const actionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: actionsOpacity.value,
  }));

  // Event handlers
  const handleRetry = useCallback(() => {
    if (retry?.onRetry) {
      retry.onRetry();
    }
  }, [retry]);

  const handleActionPress = useCallback((action: EmptyStateAction) => {
    action.onPress();
    
    // Auto-announce action for accessibility
    if (accessibility?.announcements?.onRetry && action.text.toLowerCase().includes('retry')) {
      AccessibilityInfo.announceForAccessibility(accessibility.announcements.onRetry);
    }
  }, [accessibility]);

  // Content preparation
  const preparedContent = useMemo(() => {
    const baseContent = { ...content };
    
    // Apply educational context modifications
    if (educationalContext) {
      baseContent.title = getContextualTitle(baseContent.title, educationalContext, variant);
      baseContent.description = getContextualDescription(baseContent.description, educationalContext, variant);
    }
    
    return baseContent;
  }, [content, educationalContext, variant]);

  // Render functions
  const renderIllustration = () => {
    if (!illustration || illustration.type === 'none') return null;

    const illustrationSize = getIllustrationSize(size);
    const iconColor = themeConfig.colors.icon.primary;

    return (
      <Animated.View
        style={[
          styles.illustrationContainer,
          { marginBottom: themeConfig.spacing.illustration },
          illustrationStyle,
          illustrationAnimatedStyle,
        ]}
      >
        <EmptyStateIllustration
          config={illustration}
          size={illustrationSize}
          color={iconColor}
          variant={variant}
        />
      </Animated.View>
    );
  };

  const renderContent = () => (
    <Animated.View style={[styles.contentContainer, contentStyle, contentAnimatedStyle]}>
      {/* Custom title or default title */}
      {preparedContent.customTitle ? (
        preparedContent.customTitle
      ) : preparedContent.title ? (
        <Text
          style={[
            themeConfig.typography.title,
            { color: themeConfig.colors.text.primary },
            titleStyle,
          ]}
          accessibilityRole={accessibility?.headingRole || 'header'}
          accessibilityLevel={accessibility?.headingLevel}
        >
          {preparedContent.title}
        </Text>
      ) : null}

      {/* Custom description or default description */}
      {preparedContent.customDescription ? (
        preparedContent.customDescription
      ) : preparedContent.description ? (
        <Text
          style={[
            themeConfig.typography.description,
            { 
              color: themeConfig.colors.text.secondary,
              marginTop: preparedContent.title ? 8 : 0,
            },
            descriptionStyle,
          ]}
        >
          {preparedContent.description}
        </Text>
      ) : null}

      {/* Details text */}
      {preparedContent.details && (
        <Text
          style={[
            themeConfig.typography.details,
            {
              color: themeConfig.colors.text.tertiary,
              marginTop: 12,
            },
            detailsStyle,
          ]}
        >
          {preparedContent.details}
        </Text>
      )}

      {/* Branded message */}
      {preparedContent.showBranding && preparedContent.brandMessage && (
        <Text
          style={[
            styles.brandMessage,
            { color: themeConfig.colors.accent },
          ]}
        >
          {preparedContent.brandMessage}
        </Text>
      )}
    </Animated.View>
  );

  const renderActions = () => {
    const allActions = [primaryAction, secondaryAction, ...(additionalActions || [])].filter(Boolean) as EmptyStateAction[];
    
    if (allActions.length === 0) return null;

    return (
      <Animated.View
        style={[
          styles.actionsContainer,
          { marginTop: themeConfig.spacing.actions },
          actionsStyle,
          actionsAnimatedStyle,
        ]}
      >
        {allActions.map((action, index) => (
          <Button
            key={`action-${index}`}
            variant={action.variant || (index === 0 ? 'primary' : 'outline')}
            size={getActionButtonSize(size)}
            onPress={() => handleActionPress(action)}
            loading={action.loading}
            disabled={action.disabled}
            icon={action.icon}
            iconPosition={action.iconPosition}
            style={[
              index > 0 && styles.actionSpacing,
              actionButtonStyle,
            ]}
            accessibilityLabel={action.accessibilityLabel}
            testID={action.testID}
            fullWidth={size === 'full-screen'}
          >
            {action.text}
          </Button>
        ))}
      </Animated.View>
    );
  };

  const renderRetryInfo = () => {
    if (!retry?.enabled || !retry.showAttemptCount) return null;

    const attemptText = retry.maxAttempts 
      ? `Attempt ${retry.attemptCount || 0} of ${retry.maxAttempts}`
      : `Attempts: ${retry.attemptCount || 0}`;

    return (
      <Text style={[styles.retryInfo, { color: themeConfig.colors.text.tertiary }]}>
        {attemptText}
      </Text>
    );
  };

  // Main render
  const containerStyle = [
    styles.container,
    {
      backgroundColor: themeConfig.colors.background,
      paddingHorizontal: themeConfig.spacing.container,
      paddingVertical: themeConfig.spacing.content,
    },
    showCard && {
      backgroundColor: themeConfig.colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: themeConfig.colors.border,
      ...themeConfig.shadows,
    },
    getSizeContainerStyle(size),
    style,
  ];

  const content_jsx = (
    <Animated.View
      style={[containerStyle, containerAnimatedStyle]}
      accessibilityLabel={accessibility?.accessibilityLabel}
      accessibilityHint={accessibility?.accessibilityHint}
      testID={testID}
    >
      {renderIllustration()}
      {renderContent()}
      {renderRetryInfo()}
      {renderActions()}
    </Animated.View>
  );

  // Wrap with refresh control if enabled
  if (refresh?.enabled) {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refresh.refreshing}
            onRefresh={refresh.onRefresh}
            colors={refresh.colors}
            progressBackgroundColor={refresh.progressBackgroundColor}
            progressViewOffset={refresh.progressViewOffset}
          />
        }
      >
        {content_jsx}
      </ScrollView>
    );
  }

  return content_jsx;
};

// Illustration Component
interface EmptyStateIllustrationProps {
  config: IllustrationConfig;
  size: number;
  color: string;
  variant: EmptyStateVariant;
}

const EmptyStateIllustration: React.FC<EmptyStateIllustrationProps> = ({
  config,
  size,
  color,
  variant,
}) => {
  switch (config.type) {
    case 'icon':
      return (
        <View
          style={[
            styles.iconContainer,
            {
              width: size,
              height: size,
              backgroundColor: color + '20',
              borderRadius: size / 2,
            },
          ]}
        >
          <Text
            style={[
              styles.iconText,
              {
                fontSize: size * 0.5,
                color: color,
              },
            ]}
          >
            {getDefaultIcon(variant)}
          </Text>
        </View>
      );
    case 'custom':
      return config.customComponent || null;
    case 'none':
    default:
      return null;
  }
};

// Utility functions
const getIconColor = (variant: EmptyStateVariant, theme: any): string => {
  const colorMap: Record<EmptyStateVariant, string> = {
    'no-data': theme.colors.neutral[400],
    'error': theme.colors.semantic.error.main,
    'offline': theme.colors.semantic.warning.main,
    'first-time': theme.colors.primary[500],
    'achievement': theme.colors.gamification.achievement,
    'search': theme.colors.neutral[400],
    'maintenance': theme.colors.semantic.warning.main,
    'permission': theme.colors.semantic.error.main,
  };
  
  return colorMap[variant] || theme.colors.neutral[400];
};

const getDefaultIcon = (variant: EmptyStateVariant): string => {
  const iconMap: Record<EmptyStateVariant, string> = {
    'no-data': '📝',
    'error': '⚠️',
    'offline': '📱',
    'first-time': '👋',
    'achievement': '🏆',
    'search': '🔍',
    'maintenance': '🔧',
    'permission': '🔒',
  };
  
  return iconMap[variant] || '📝';
};

const getSizeSpacing = (size: EmptyStateSize) => {
  const spacingMap = {
    compact: { container: 16, content: 12, illustration: 16, actions: 16 },
    standard: { container: 24, content: 16, illustration: 24, actions: 24 },
    'full-screen': { container: 32, content: 24, illustration: 32, actions: 32 },
    modal: { container: 20, content: 16, illustration: 20, actions: 20 },
  };
  
  return spacingMap[size];
};

const getTitleSize = (size: EmptyStateSize): number => {
  const sizeMap = { compact: 16, standard: 18, 'full-screen': 24, modal: 18 };
  return sizeMap[size];
};

const getDescriptionSize = (size: EmptyStateSize): number => {
  const sizeMap = { compact: 14, standard: 14, 'full-screen': 16, modal: 14 };
  return sizeMap[size];
};

const getDetailsSize = (size: EmptyStateSize): number => {
  const sizeMap = { compact: 12, standard: 12, 'full-screen': 14, modal: 12 };
  return sizeMap[size];
};

const getIllustrationSize = (size: EmptyStateSize): number => {
  const sizeMap = { compact: 48, standard: 64, 'full-screen': 80, modal: 56 };
  return sizeMap[size];
};

const getActionButtonSize = (size: EmptyStateSize): 'small' | 'medium' | 'large' => {
  const sizeMap = { compact: 'small' as const, standard: 'medium' as const, 'full-screen': 'large' as const, modal: 'medium' as const };
  return sizeMap[size];
};

const getSizeContainerStyle = (size: EmptyStateSize) => {
  switch (size) {
    case 'full-screen':
      return {
        minHeight: screenHeight * 0.6,
        justifyContent: 'center' as const,
      };
    case 'compact':
      return {
        paddingVertical: 20,
      };
    default:
      return {};
  }
};

const getCardShadow = (elevation: string, theme: any) => {
  const shadowMap = {
    none: {},
    low: theme.shadows.xs,
    medium: theme.shadows.sm,
    high: theme.shadows.md,
  };
  
  return shadowMap[elevation as keyof typeof shadowMap] || {};
};

const getContextualTitle = (title: string, context: EducationalContext, variant: EmptyStateVariant): string => {
  // Apply educational context to make titles more relevant
  if (context.userType === 'student') {
    if (variant === 'no-data' && context.subject) {
      return `No ${context.subject} lessons yet`;
    }
    if (variant === 'first-time') {
      return 'Welcome to your learning journey! 🎓';
    }
  } else if (context.userType === 'teacher') {
    if (variant === 'no-data') {
      return 'No data available';
    }
    if (variant === 'first-time') {
      return 'Get started with your class management';
    }
  }
  
  return title;
};

const getContextualDescription = (description: string | undefined, context: EducationalContext, variant: EmptyStateVariant): string | undefined => {
  if (!description) return description;
  
  // Apply motivational context for students
  if (context.userType === 'student' && context.showMotivation) {
    return description + (context.motivationalMessage ? `\n\n${context.motivationalMessage}` : '');
  }
  
  return description;
};

// Styles
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    textAlign: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    maxWidth: 280,
  },
  actionsContainer: {
    alignItems: 'center',
    width: '100%',
  },
  actionSpacing: {
    marginTop: 12,
  },
  brandMessage: {
    marginTop: 16,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryInfo: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default EmptyState;