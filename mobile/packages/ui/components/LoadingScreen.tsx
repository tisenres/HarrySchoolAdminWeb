/**
 * LoadingScreen Component
 * Harry School Mobile Design System
 * 
 * Comprehensive loading screen with educational content, progress tracking, and accessibility
 * Optimized for Teacher (efficiency) and Student (engagement) themes
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ActivityIndicator,
  Pressable,
  ScrollView,
  AccessibilityInfo,
  Dimensions,
  Platform,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  runOnJS,
  useDerivedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeProvider';
import { animations } from '../theme/animations';
import type {
  LoadingScreenProps,
  LoadingType,
  VocabularyItem,
  LearningTip,
  ProgressConfig,
  SkeletonConfig,
  EducationalContent,
} from './LoadingScreen.types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  type,
  visible,
  title,
  description,
  progressConfig,
  skeletonConfig,
  educationalContent,
  cancellation,
  backdrop = { enabled: true, opacity: 0.7, dismissible: false },
  accessibility,
  variant,
  spinnerSize = 'large',
  spinnerColor,
  animation,
  style,
  contentStyle,
  titleStyle,
  descriptionStyle,
  educationalStyle,
  progressStyle,
  cancelButtonStyle,
  testID,
}) => {
  const { theme, variant: themeVariant } = useTheme();
  const effectiveVariant = variant || themeVariant;
  const isReducedMotion = animations.useReducedMotion();
  
  // Animation values
  const backdropOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.95);
  const spinnerRotation = useSharedValue(0);
  const progressValue = useSharedValue(progressConfig?.progress || 0);
  
  // State management
  const [currentEducationalIndex, setCurrentEducationalIndex] = useState(0);
  const [showCancelButton, setShowCancelButton] = useState(false);
  const [lastAnnouncedProgress, setLastAnnouncedProgress] = useState(0);
  
  // Refs
  const educationalTimer = useRef<NodeJS.Timeout>();
  const cancelTimer = useRef<NodeJS.Timeout>();
  const progressAnnounceTimer = useRef<NodeJS.Timeout>();

  // Theme configuration
  const themeConfig = useMemo(() => ({
    colors: {
      backdrop: backdrop.color || theme.colors.background.overlay,
      container: theme.colors.background.primary,
      text: {
        primary: theme.colors.text.primary,
        secondary: theme.colors.text.secondary,
      },
      spinner: spinnerColor || theme.colors.primary[500],
      progress: {
        fill: theme.colors.primary[500],
        track: theme.colors.neutral[200],
      },
      skeleton: {
        base: theme.colors.neutral[200],
        highlight: theme.colors.neutral[100],
      },
    },
    spacing: {
      container: effectiveVariant === 'teacher' ? 16 : 24,
      content: effectiveVariant === 'teacher' ? 12 : 16,
      educational: 20,
    },
    animations: {
      duration: isReducedMotion ? 0 : (animation?.duration || 300),
      springConfig: animations.springConfigs.gentle,
    },
  }), [theme, effectiveVariant, backdrop.color, spinnerColor, animation, isReducedMotion]);

  // Educational content rotation
  useEffect(() => {
    if (visible && educationalContent && type === 'educational') {
      const interval = educationalContent.rotationInterval || 4000;
      educationalTimer.current = setInterval(() => {
        setCurrentEducationalIndex(prev => {
          const totalItems = getEducationalItemsCount(educationalContent);
          return (prev + 1) % totalItems;
        });
      }, interval);

      return () => {
        if (educationalTimer.current) {
          clearInterval(educationalTimer.current);
        }
      };
    }
  }, [visible, educationalContent, type]);

  // Cancel button visibility
  useEffect(() => {
    if (visible && cancellation?.enabled && cancellation.showAfterDelay) {
      cancelTimer.current = setTimeout(() => {
        setShowCancelButton(true);
      }, cancellation.showAfterDelay);

      return () => {
        if (cancelTimer.current) {
          clearTimeout(cancelTimer.current);
        }
      };
    } else if (visible && cancellation?.enabled) {
      setShowCancelButton(true);
    }
  }, [visible, cancellation]);

  // Progress announcements for accessibility
  useEffect(() => {
    if (
      progressConfig && 
      accessibility?.announceProgressEvery && 
      progressConfig.progress !== undefined
    ) {
      const progress = Math.floor(progressConfig.progress);
      const announceInterval = accessibility.announceProgressEvery;
      
      if (progress % announceInterval === 0 && progress !== lastAnnouncedProgress) {
        setLastAnnouncedProgress(progress);
        
        progressAnnounceTimer.current = setTimeout(() => {
          AccessibilityInfo.announceForAccessibility(
            `Loading progress: ${progress} percent complete`
          );
        }, 100);
      }
    }

    return () => {
      if (progressAnnounceTimer.current) {
        clearTimeout(progressAnnounceTimer.current);
      }
    };
  }, [progressConfig?.progress, accessibility?.announceProgressEvery, lastAnnouncedProgress]);

  // Animations
  useEffect(() => {
    if (visible) {
      // Entrance animations
      if (!isReducedMotion) {
        backdropOpacity.value = withTiming(backdrop.opacity || 0.7, {
          duration: themeConfig.animations.duration,
        });
        
        contentOpacity.value = withTiming(1, {
          duration: themeConfig.animations.duration,
        });
        
        contentScale.value = withSpring(1, themeConfig.animations.springConfig);
        
        // Spinner animation
        if (type === 'spinner' || type === 'educational') {
          spinnerRotation.value = withRepeat(
            withTiming(360, { duration: 1000 }),
            -1,
            false
          );
        }
      } else {
        backdropOpacity.value = backdrop.opacity || 0.7;
        contentOpacity.value = 1;
        contentScale.value = 1;
      }
    } else {
      // Exit animations
      if (!isReducedMotion) {
        backdropOpacity.value = withTiming(0, {
          duration: themeConfig.animations.duration / 2,
        });
        
        contentOpacity.value = withTiming(0, {
          duration: themeConfig.animations.duration / 2,
        });
        
        contentScale.value = withTiming(0.95, {
          duration: themeConfig.animations.duration / 2,
        });
      } else {
        backdropOpacity.value = 0;
        contentOpacity.value = 0;
        contentScale.value = 0.95;
      }
    }
  }, [visible, type, isReducedMotion, backdrop.opacity, themeConfig]);

  // Progress animation
  useEffect(() => {
    if (progressConfig?.progress !== undefined) {
      if (!isReducedMotion) {
        progressValue.value = withTiming(progressConfig.progress, {
          duration: 500,
        });
      } else {
        progressValue.value = progressConfig.progress;
      }
    }
  }, [progressConfig?.progress, isReducedMotion]);

  // Animated styles
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  const spinnerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`,
  }));

  // Utility functions
  const getEducationalItemsCount = useCallback((content: EducationalContent): number => {
    switch (content.type) {
      case 'vocabulary':
        return content.vocabulary?.length || 0;
      case 'tips':
        return content.tips?.length || 0;
      case 'motivation':
        return content.motivationalMessages?.length || 0;
      case 'lesson-preview':
        return content.lessonPreviews?.length || 0;
      default:
        return 0;
    }
  }, []);

  const getCurrentEducationalItem = useCallback(() => {
    if (!educationalContent) return null;

    switch (educationalContent.type) {
      case 'vocabulary':
        return educationalContent.vocabulary?.[currentEducationalIndex];
      case 'tips':
        return educationalContent.tips?.[currentEducationalIndex];
      case 'motivation':
        return educationalContent.motivationalMessages?.[currentEducationalIndex];
      case 'lesson-preview':
        return educationalContent.lessonPreviews?.[currentEducationalIndex];
      default:
        return null;
    }
  }, [educationalContent, currentEducationalIndex]);

  const handleBackdropPress = useCallback(() => {
    if (backdrop.dismissible && backdrop.onBackdropPress) {
      backdrop.onBackdropPress();
    }
  }, [backdrop]);

  const handleCancelPress = useCallback(() => {
    if (cancellation?.onCancel) {
      cancellation.onCancel();
    }
  }, [cancellation]);

  // Render functions
  const renderSpinner = () => (
    <Animated.View style={[styles.spinnerContainer, spinnerAnimatedStyle]}>
      <ActivityIndicator
        size={spinnerSize}
        color={themeConfig.colors.spinner}
        style={styles.spinner}
      />
    </Animated.View>
  );

  const renderProgressBar = () => {
    if (!progressConfig) return null;

    return (
      <View style={[styles.progressContainer, progressStyle]}>
        <View style={[
          styles.progressTrack,
          { backgroundColor: themeConfig.colors.progress.track }
        ]}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: themeConfig.colors.progress.fill },
              progressAnimatedStyle,
            ]}
          />
        </View>
        
        {progressConfig.showPercentage && (
          <Text style={[
            styles.progressText,
            { color: themeConfig.colors.text.secondary }
          ]}>
            {Math.round(progressConfig.progress)}%
          </Text>
        )}
        
        {progressConfig.showTimeRemaining && progressConfig.estimatedTime && (
          <Text style={[
            styles.timeText,
            { color: themeConfig.colors.text.secondary }
          ]}>
            {progressConfig.estimatedTime}min remaining
          </Text>
        )}
      </View>
    );
  };

  const renderSkeleton = () => {
    if (!skeletonConfig) return null;

    const skeletonItems = Array.from({ length: skeletonConfig.count || 3 }, (_, index) => (
      <SkeletonItem
        key={index}
        variant={skeletonConfig.variant}
        customShapes={skeletonConfig.customShapes}
        animationDuration={skeletonConfig.animationDuration}
        opacityRange={skeletonConfig.opacityRange}
        colors={themeConfig.colors.skeleton}
      />
    ));

    return (
      <View style={styles.skeletonContainer}>
        {skeletonItems}
      </View>
    );
  };

  const renderEducationalContent = () => {
    if (!educationalContent || type !== 'educational') return null;

    const currentItem = getCurrentEducationalItem();
    if (!currentItem) return null;

    return (
      <View style={[styles.educationalContainer, educationalStyle]}>
        <EducationalContentItem
          item={currentItem}
          type={educationalContent.type}
          variant={effectiveVariant}
          colors={themeConfig.colors.text}
        />
      </View>
    );
  };

  const renderCancelButton = () => {
    if (!cancellation?.enabled || !showCancelButton) return null;

    return (
      <Pressable
        style={[styles.cancelButton, cancelButtonStyle]}
        onPress={handleCancelPress}
        accessibilityRole="button"
        accessibilityLabel={accessibility?.labels?.cancel || 'Cancel loading'}
      >
        <Text style={[
          styles.cancelButtonText,
          { color: themeConfig.colors.text.secondary }
        ]}>
          {cancellation.text || 'Cancel'}
        </Text>
      </Pressable>
    );
  };

  const renderMainContent = () => (
    <View style={[styles.mainContent, contentStyle]}>
      {/* Loading indicator based on type */}
      {(type === 'spinner' || type === 'educational') && renderSpinner()}
      {type === 'progress' && renderProgressBar()}
      {type === 'skeleton' && renderSkeleton()}

      {/* Text content */}
      {title && (
        <Text
          style={[styles.title, { color: themeConfig.colors.text.primary }, titleStyle]}
          accessibilityRole="header"
        >
          {title}
        </Text>
      )}

      {description && (
        <Text style={[
          styles.description,
          { color: themeConfig.colors.text.secondary },
          descriptionStyle
        ]}>
          {description}
        </Text>
      )}

      {/* Educational content */}
      {renderEducationalContent()}

      {/* Progress bar for educational type */}
      {type === 'educational' && progressConfig && renderProgressBar()}

      {/* Cancel button */}
      {renderCancelButton()}
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      testID={testID}
      accessibleViewIsModal
      accessibilityViewIsModal
    >
      {/* Backdrop */}
      {backdrop.enabled && (
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={handleBackdropPress}
          disabled={!backdrop.dismissible}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: themeConfig.colors.backdrop },
              backdropAnimatedStyle,
            ]}
          />
        </Pressable>
      )}

      {/* Content */}
      <View style={[styles.container, style]} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.contentContainer,
            { backgroundColor: themeConfig.colors.container },
            contentAnimatedStyle,
          ]}
          accessibilityLabel={
            accessibility?.accessibilityLabel || 
            accessibility?.loadingDescription || 
            'Loading screen'
          }
          accessibilityLiveRegion="polite"
        >
          {renderMainContent()}
        </Animated.View>
      </View>
    </Modal>
  );
};

// Skeleton Item Component
interface SkeletonItemProps {
  variant: SkeletonConfig['variant'];
  customShapes?: SkeletonConfig['customShapes'];
  animationDuration?: number;
  opacityRange?: [number, number];
  colors: { base: string; highlight: string };
}

const SkeletonItem: React.FC<SkeletonItemProps> = ({
  variant,
  customShapes,
  animationDuration = 1200,
  opacityRange = [0.3, 0.8],
  colors,
}) => {
  const opacity = useSharedValue(opacityRange[0]);
  const isReducedMotion = animations.useReducedMotion();

  useEffect(() => {
    if (!isReducedMotion) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(opacityRange[1], { duration: animationDuration / 2 }),
          withTiming(opacityRange[0], { duration: animationDuration / 2 })
        ),
        -1,
        true
      );
    }
  }, [isReducedMotion, animationDuration, opacityRange]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const getSkeletonShapes = () => {
    if (customShapes) {
      return customShapes.map((shape, index) => (
        <Animated.View
          key={index}
          style={[
            {
              width: shape.width,
              height: shape.height,
              borderRadius: shape.borderRadius || 4,
              backgroundColor: colors.base,
              marginBottom: shape.marginBottom || 8,
            },
            animatedStyle,
          ]}
        />
      ));
    }

    switch (variant) {
      case 'text':
        return (
          <>
            <Animated.View style={[styles.skeletonLine, { backgroundColor: colors.base }, animatedStyle]} />
            <Animated.View style={[styles.skeletonLine, { backgroundColor: colors.base, width: '80%' }, animatedStyle]} />
            <Animated.View style={[styles.skeletonLine, { backgroundColor: colors.base, width: '60%' }, animatedStyle]} />
          </>
        );
      case 'card':
        return (
          <>
            <Animated.View style={[styles.skeletonAvatar, { backgroundColor: colors.base }, animatedStyle]} />
            <View style={styles.skeletonCardContent}>
              <Animated.View style={[styles.skeletonLine, { backgroundColor: colors.base }, animatedStyle]} />
              <Animated.View style={[styles.skeletonLine, { backgroundColor: colors.base, width: '70%' }, animatedStyle]} />
            </View>
          </>
        );
      case 'list':
        return (
          <>
            <Animated.View style={[styles.skeletonListItem, { backgroundColor: colors.base }, animatedStyle]} />
            <Animated.View style={[styles.skeletonListItem, { backgroundColor: colors.base }, animatedStyle]} />
            <Animated.View style={[styles.skeletonListItem, { backgroundColor: colors.base }, animatedStyle]} />
          </>
        );
      case 'avatar':
        return <Animated.View style={[styles.skeletonAvatar, { backgroundColor: colors.base }, animatedStyle]} />;
      default:
        return <Animated.View style={[styles.skeletonLine, { backgroundColor: colors.base }, animatedStyle]} />;
    }
  };

  return <View style={styles.skeletonItem}>{getSkeletonShapes()}</View>;
};

// Educational Content Item Component
interface EducationalContentItemProps {
  item: any;
  type: EducationalContent['type'];
  variant: 'teacher' | 'student';
  colors: { primary: string; secondary: string };
}

const EducationalContentItem: React.FC<EducationalContentItemProps> = ({
  item,
  type,
  variant,
  colors,
}) => {
  const fadeIn = useSharedValue(0);
  const isReducedMotion = animations.useReducedMotion();

  useEffect(() => {
    if (!isReducedMotion) {
      fadeIn.value = withTiming(1, { duration: 300 });
    } else {
      fadeIn.value = 1;
    }

    return () => {
      fadeIn.value = 0;
    };
  }, [item, isReducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: interpolate(fadeIn.value, [0, 1], [10, 0]) }],
  }));

  if (!item) return null;

  const renderContent = () => {
    switch (type) {
      case 'vocabulary':
        const vocabItem = item as VocabularyItem;
        return (
          <>
            <Text style={[styles.educationalTitle, { color: colors.primary }]}>
              {vocabItem.word}
            </Text>
            <Text style={[styles.educationalSubtitle, { color: colors.secondary }]}>
              {vocabItem.translation}
            </Text>
            {vocabItem.example && (
              <Text style={[styles.educationalExample, { color: colors.secondary }]}>
                "{vocabItem.example}"
              </Text>
            )}
          </>
        );

      case 'tips':
        const tip = item as LearningTip;
        return (
          <>
            <Text style={[styles.educationalTitle, { color: colors.primary }]}>
              💡 {tip.title}
            </Text>
            <Text style={[styles.educationalContent, { color: colors.secondary }]}>
              {tip.content}
            </Text>
          </>
        );

      case 'motivation':
        const message = item as MotivationalMessage;
        return (
          <>
            <Text style={[styles.educationalTitle, { color: colors.primary }]}>
              ✨ Keep Learning!
            </Text>
            <Text style={[styles.educationalContent, { color: colors.secondary }]}>
              "{message.message}"
            </Text>
            {message.author && (
              <Text style={[styles.educationalAuthor, { color: colors.secondary }]}>
                — {message.author}
              </Text>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Animated.View style={[styles.educationalItem, animatedStyle]}>
      {renderContent()}
    </Animated.View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
  },
  contentContainer: {
    borderRadius: 16,
    padding: 24,
    maxWidth: screenWidth * 0.85,
    minWidth: 280,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  mainContent: {
    alignItems: 'center' as const,
    width: '100%',
  },
  spinnerContainer: {
    marginBottom: 24,
  },
  spinner: {
    // Additional spinner styles
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden' as const,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center' as const,
    marginBottom: 20,
    lineHeight: 20,
  },
  educationalContainer: {
    width: '100%',
    marginBottom: 20,
  },
  educationalItem: {
    alignItems: 'center' as const,
    paddingVertical: 16,
  },
  educationalTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  educationalSubtitle: {
    fontSize: 14,
    textAlign: 'center' as const,
    marginBottom: 4,
  },
  educationalContent: {
    fontSize: 14,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  educationalExample: {
    fontSize: 12,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
    marginTop: 8,
  },
  educationalAuthor: {
    fontSize: 12,
    textAlign: 'center' as const,
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  skeletonContainer: {
    width: '100%',
  },
  skeletonItem: {
    marginBottom: 16,
  },
  skeletonLine: {
    height: 16,
    width: '100%',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 12,
  },
  skeletonCardContent: {
    width: '100%',
  },
  skeletonListItem: {
    height: 20,
    width: '100%',
    borderRadius: 4,
    marginBottom: 12,
  },
});

export default LoadingScreen;