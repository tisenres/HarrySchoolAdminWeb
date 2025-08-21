/**
 * Modal Component
 * Harry School Mobile Design System
 * 
 * Comprehensive modal with celebrations, gestures, focus management, and accessibility
 * Optimized for educational context with achievement celebrations and bottom sheets
 */

import React, { useEffect, useRef, useState, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  Modal as RNModal,
  Pressable,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  AccessibilityInfo,
  StyleSheet,
} from 'react-native';
import { PanGestureHandler, State as GestureState } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeProvider';
import { animations } from '../theme/animations';
import Button from './Button/Button';
import type {
  ModalProps,
  ModalSize,
  ModalType,
  ModalPosition,
  ModalAction,
  CelebrationConfig,
  BackdropConfig,
  GestureConfig,
  ModalState,
} from './Modal.types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const Modal = forwardRef<any, ModalProps>(({
  visible,
  type = 'alert',
  size = 'medium',
  position = 'center',
  header,
  children,
  primaryAction,
  secondaryAction,
  additionalActions,
  backdrop = { enabled: true, opacity: 0.5, dismissible: true },
  animation = { enter: { type: 'slide-up', duration: 300 } },
  keyboard,
  gestures,
  celebration,
  accessibility,
  variant = 'system',
  onClose,
  onDismiss,
  onShow,
  onHide,
  preventClose = false,
  closeConfirmation,
  zIndex = 1000,
  style,
  contentStyle,
  headerStyle,
  bodyStyle,
  footerStyle,
  backdropStyle,
  titleStyle,
  subtitleStyle,
  testID,
}, ref) => {
  const { theme, variant: themeVariant } = useTheme();
  const insets = useSafeAreaInsets();
  const isReducedMotion = animations.useReducedMotion();
  
  // Animation values
  const backdropOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(getInitialTransform(position, animation.enter?.type).y);
  const modalTranslateX = useSharedValue(getInitialTransform(position, animation.enter?.type).x);
  const modalScale = useSharedValue(0.95);
  const modalOpacity = useSharedValue(0);
  const gestureTranslateY = useSharedValue(0);
  
  // State management
  const [modalState, setModalState] = useState<ModalState>('hidden');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  
  // Refs
  const backHandlerRef = useRef<any>();
  const focusRef = useRef<View>(null);
  const previousFocusRef = useRef<any>();
  
  // Theme configuration
  const themeConfig = useMemo(() => ({
    colors: {
      backdrop: backdrop.color || theme.colors.background.overlay,
      container: getModalBackgroundColor(type, theme, variant),
      header: theme.colors.background.primary,
      content: 'transparent',
      border: theme.colors.border.light,
      shadow: theme.colors.neutral[900],
      text: {
        title: theme.colors.text.primary,
        subtitle: theme.colors.text.secondary,
        body: theme.colors.text.primary,
      },
      celebration: {
        background: theme.colors.gamification.achievement + '10',
        accent: theme.colors.gamification.achievement,
        confetti: [
          theme.colors.gamification.points,
          theme.colors.gamification.streak,
          theme.colors.gamification.social,
          theme.colors.semantic.success.main,
          theme.colors.primary[500],
        ],
      },
    },
    spacing: getModalSpacing(size),
    typography: getModalTypography(size),
    borderRadius: getModalBorderRadius(size),
    shadows: getModalShadow(size, theme),
    zIndex: {
      backdrop: zIndex,
      modal: zIndex + 1,
      celebration: zIndex + 2,
    },
  }), [theme, type, variant, size, backdrop.color, zIndex]);

  // Gesture handler
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startY = gestureTranslateY.value;
    },
    onActive: (event, context) => {
      if (gestures?.swipeToDismiss && canSwipeToDismiss(gestures.swipeDirection, event)) {
        gestureTranslateY.value = Math.max(0, event.translationY);
      }
    },
    onEnd: (event) => {
      const shouldDismiss = 
        gestures?.swipeToDismiss &&
        event.translationY > (gestures.swipeThreshold || 0.3) * screenHeight;
        
      if (shouldDismiss) {
        runOnJS(handleDismiss)();
      } else {
        gestureTranslateY.value = withSpring(0);
      }
    },
  });

  // Back handler for Android
  useEffect(() => {
    if (visible && Platform.OS === 'android') {
      backHandlerRef.current = BackHandler.addEventListener('hardwareBackPress', () => {
        if (backdrop.dismissible && !preventClose) {
          handleDismiss();
          return true;
        }
        return true; // Prevent default behavior
      });
    }

    return () => {
      if (backHandlerRef.current) {
        backHandlerRef.current.remove();
      }
    };
  }, [visible, backdrop.dismissible, preventClose]);

  // Focus management
  useEffect(() => {
    if (visible) {
      // Store previous focus
      AccessibilityInfo.getCurrentlyFocusedElement().then((element) => {
        previousFocusRef.current = element;
      });

      // Set initial focus
      if (accessibility?.focus?.trapFocus) {
        setTimeout(() => {
          focusRef.current?.focus();
        }, 300); // After animation completes
      }
    } else {
      // Restore previous focus
      if (accessibility?.focus?.returnFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [visible, accessibility?.focus]);

  // Animation effects
  useEffect(() => {
    if (visible) {
      setModalState('entering');
      onShow?.();

      if (!isReducedMotion) {
        // Backdrop animation
        backdropOpacity.value = withTiming(backdrop.opacity || 0.5, {
          duration: animation.enter?.duration || 300,
        });

        // Modal entrance animation
        switch (animation.enter?.type) {
          case 'slide-up':
            modalTranslateY.value = withSpring(0, animations.springConfigs.smooth);
            break;
          case 'slide-down':
            modalTranslateY.value = withSpring(0, animations.springConfigs.smooth);
            break;
          case 'slide-left':
          case 'slide-right':
            modalTranslateX.value = withSpring(0, animations.springConfigs.smooth);
            break;
          case 'scale':
            modalScale.value = withSpring(1, animations.springConfigs.gentle);
            break;
          case 'fade-in':
            modalOpacity.value = withTiming(1, { duration: 300 });
            break;
          case 'bounce':
            modalScale.value = withSequence(
              withSpring(1.1, animations.springConfigs.bouncy),
              withSpring(1, animations.springConfigs.gentle)
            );
            break;
        }

        modalOpacity.value = withTiming(1, { duration: 200 });
      } else {
        // No animation - set final values
        backdropOpacity.value = backdrop.opacity || 0.5;
        modalTranslateY.value = 0;
        modalTranslateX.value = 0;
        modalScale.value = 1;
        modalOpacity.value = 1;
      }

      setTimeout(() => {
        setModalState('visible');
      }, animation.enter?.duration || 300);
    } else {
      setModalState('exiting');

      if (!isReducedMotion) {
        // Exit animations
        backdropOpacity.value = withTiming(0, { duration: 200 });
        modalOpacity.value = withTiming(0, { duration: 200 });
        
        // Reset transforms
        modalTranslateY.value = withTiming(
          getInitialTransform(position, animation.exit?.type || animation.enter?.type).y,
          { duration: 200 }
        );
        modalTranslateX.value = withTiming(
          getInitialTransform(position, animation.exit?.type || animation.enter?.type).x,
          { duration: 200 }
        );
        modalScale.value = withTiming(0.95, { duration: 200 });
      } else {
        backdropOpacity.value = 0;
        modalOpacity.value = 0;
      }

      setTimeout(() => {
        setModalState('hidden');
        onHide?.();
      }, 200);
    }
  }, [visible, isReducedMotion]);

  // Celebration effects
  useEffect(() => {
    if (visible && type === 'celebration' && celebration) {
      triggerCelebration(celebration);
    }
  }, [visible, type, celebration]);

  // Event handlers
  const handleClose = useCallback(() => {
    if (preventClose && closeConfirmation) {
      setConfirmationVisible(true);
      return;
    }
    onClose?.();
  }, [preventClose, closeConfirmation, onClose]);

  const handleDismiss = useCallback(() => {
    if (backdrop.dismissible) {
      onDismiss?.();
      onClose?.();
    }
  }, [backdrop.dismissible, onDismiss, onClose]);

  const handleBackdropPress = useCallback(() => {
    if (backdrop.dismissible && backdrop.onBackdropPress) {
      backdrop.onBackdropPress();
    } else {
      handleDismiss();
    }
  }, [backdrop, handleDismiss]);

  const handleActionPress = useCallback((action: ModalAction) => {
    action.onPress();
    if (action.autoClose) {
      handleClose();
    }
  }, [handleClose]);

  const triggerCelebration = useCallback((config: CelebrationConfig) => {
    // Implementation would depend on celebration library
    // This is a placeholder for the actual celebration effects
    console.log('Triggering celebration:', config.variant);
    
    if (config.autoCloseDelay) {
      setTimeout(() => {
        handleClose();
      }, config.autoCloseDelay);
    }
  }, [handleClose]);

  // Animated styles
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [
      { translateX: modalTranslateX.value },
      { translateY: modalTranslateY.value + gestureTranslateY.value },
      { scale: modalScale.value },
    ],
  }));

  // Render functions
  const renderBackdrop = () => (
    <Pressable
      style={StyleSheet.absoluteFillObject}
      onPress={handleBackdropPress}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: themeConfig.colors.backdrop },
          backdropAnimatedStyle,
          backdropStyle,
        ]}
      />
    </Pressable>
  );

  const renderHeader = () => {
    if (!header || (!header.title && !header.customHeader && !header.showCloseButton)) {
      return null;
    }

    return (
      <View style={[styles.header, { backgroundColor: themeConfig.colors.header }, headerStyle]}>
        {header.customHeader ? (
          header.customHeader
        ) : (
          <>
            <View style={styles.headerContent}>
              {header.icon && (
                <View style={styles.headerIcon}>
                  {header.icon}
                </View>
              )}
              <View style={styles.headerText}>
                {header.title && (
                  <Text
                    style={[
                      themeConfig.typography.title,
                      { color: themeConfig.colors.text.title },
                      titleStyle,
                    ]}
                  >
                    {header.title}
                  </Text>
                )}
                {header.subtitle && (
                  <Text
                    style={[
                      themeConfig.typography.subtitle,
                      { 
                        color: themeConfig.colors.text.subtitle,
                        marginTop: 2,
                      },
                      subtitleStyle,
                    ]}
                  >
                    {header.subtitle}
                  </Text>
                )}
              </View>
            </View>
            {header.showCloseButton && (
              <Pressable
                style={styles.closeButton}
                onPress={header.onClose || handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    );
  };

  const renderBody = () => (
    <View style={[styles.body, bodyStyle]}>
      {children}
    </View>
  );

  const renderFooter = () => {
    const allActions = [primaryAction, secondaryAction, ...(additionalActions || [])].filter(Boolean) as ModalAction[];
    
    if (allActions.length === 0) return null;

    return (
      <View style={[styles.footer, footerStyle]}>
        {allActions.map((action, index) => (
          <Button
            key={`action-${index}`}
            variant={action.variant || (index === 0 ? 'primary' : 'outline')}
            size={getActionButtonSize(size)}
            onPress={() => handleActionPress(action)}
            loading={action.loading}
            disabled={action.disabled}
            style={[
              styles.actionButton,
              index > 0 && { marginLeft: 12 },
            ]}
            accessibilityLabel={action.accessibilityLabel}
            testID={action.testID}
            fullWidth={allActions.length === 1}
          >
            {action.text}
          </Button>
        ))}
      </View>
    );
  };

  const renderDragIndicator = () => {
    if (!gestures?.showDragIndicator || position !== 'bottom') return null;

    return (
      <View style={styles.dragIndicatorContainer}>
        <View style={[styles.dragIndicator, { backgroundColor: themeConfig.colors.border }]} />
      </View>
    );
  };

  const renderModalContent = () => {
    const modalContainerStyle = [
      styles.modalContainer,
      getModalSizeStyle(size),
      getModalPositionStyle(position, insets),
      {
        backgroundColor: themeConfig.colors.container,
        borderRadius: themeConfig.borderRadius,
        ...themeConfig.shadows,
      },
      contentStyle,
    ];

    const content = (
      <Animated.View style={[modalContainerStyle, modalAnimatedStyle]} ref={focusRef}>
        {renderDragIndicator()}
        {renderHeader()}
        {renderBody()}
        {renderFooter()}
      </Animated.View>
    );

    // Wrap with gesture handler if swipe to dismiss is enabled
    if (gestures?.swipeToDismiss) {
      return (
        <PanGestureHandler onGestureEvent={gestureHandler}>
          {content}
        </PanGestureHandler>
      );
    }

    return content;
  };

  const renderKeyboardAvoiding = (children: React.ReactNode) => {
    if (!keyboard?.avoid) return children;

    return (
      <KeyboardAvoidingView
        behavior={keyboard.behavior || (Platform.OS === 'ios' ? 'padding' : 'height')}
        keyboardVerticalOffset={keyboard.keyboardOffset || 0}
        style={styles.keyboardAvoid}
      >
        {children}
      </KeyboardAvoidingView>
    );
  };

  // Imperative API
  useImperativeHandle(ref, () => ({
    show: () => onShow?.(),
    hide: () => onClose?.(),
    focus: () => focusRef.current?.focus(),
  }));

  if (!visible && modalState === 'hidden') {
    return null;
  }

  return (
    <RNModal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      hardwareAccelerated
      testID={testID}
      accessibilityViewIsModal
      onRequestClose={handleClose}
    >
      {renderKeyboardAvoiding(
        <View style={[styles.overlay, { zIndex: themeConfig.zIndex.modal }]}>
          {backdrop.enabled && renderBackdrop()}
          <View style={styles.content} pointerEvents="box-none">
            {renderModalContent()}
          </View>
        </View>
      )}
    </RNModal>
  );
});

Modal.displayName = 'Modal';

// Utility functions
const getInitialTransform = (position: ModalPosition, animationType?: string) => {
  const transform = { x: 0, y: 0 };
  
  if (animationType === 'slide-up' || position === 'bottom') {
    transform.y = screenHeight;
  } else if (animationType === 'slide-down') {
    transform.y = -screenHeight;
  } else if (animationType === 'slide-left') {
    transform.x = screenWidth;
  } else if (animationType === 'slide-right') {
    transform.x = -screenWidth;
  }
  
  return transform;
};

const getModalBackgroundColor = (type: ModalType, theme: any, variant: string): string => {
  if (type === 'celebration') {
    return theme.colors.background.accent;
  }
  return theme.colors.background.primary;
};

const getModalSpacing = (size: ModalSize) => {
  const spacingMap = {
    small: { container: 16, header: 16, content: 16, actions: 16 },
    medium: { container: 20, header: 20, content: 20, actions: 20 },
    large: { container: 24, header: 24, content: 24, actions: 24 },
    fullscreen: { container: 24, header: 24, content: 24, actions: 24 },
    auto: { container: 20, header: 20, content: 20, actions: 20 },
  };
  
  return spacingMap[size];
};

const getModalTypography = (size: ModalSize) => ({
  title: {
    fontSize: size === 'small' ? 16 : size === 'large' || size === 'fullscreen' ? 20 : 18,
    fontWeight: '600' as const,
    lineHeight: size === 'small' ? 20 : size === 'large' || size === 'fullscreen' ? 28 : 24,
  },
  subtitle: {
    fontSize: size === 'small' ? 14 : 14,
    fontWeight: '400' as const,
    lineHeight: size === 'small' ? 18 : 20,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
});

const getModalBorderRadius = (size: ModalSize): number => {
  const radiusMap = { small: 12, medium: 16, large: 16, fullscreen: 0, auto: 16 };
  return radiusMap[size];
};

const getModalShadow = (size: ModalSize, theme: any) => {
  const shadowMap = {
    small: theme.shadows.md,
    medium: theme.shadows.lg,
    large: theme.shadows.xl,
    fullscreen: {},
    auto: theme.shadows.lg,
  };
  
  return shadowMap[size];
};

const getModalSizeStyle = (size: ModalSize) => {
  switch (size) {
    case 'small':
      return { width: 280, maxHeight: screenHeight * 0.7 };
    case 'medium':
      return { width: 320, maxHeight: screenHeight * 0.8 };
    case 'large':
      return { 
        width: screenWidth - 80, 
        maxWidth: 480,
        maxHeight: screenHeight - 80 
      };
    case 'fullscreen':
      return { 
        width: screenWidth, 
        height: screenHeight,
        maxHeight: screenHeight,
      };
    case 'auto':
    default:
      return { 
        maxWidth: screenWidth - 40,
        maxHeight: screenHeight * 0.9,
      };
  }
};

const getModalPositionStyle = (position: ModalPosition, insets: any) => {
  const baseStyle: any = {};
  
  switch (position) {
    case 'top':
      baseStyle.marginTop = insets.top + 20;
      break;
    case 'bottom':
      baseStyle.marginBottom = insets.bottom;
      break;
    case 'center':
    default:
      // Center positioning handled by container
      break;
  }
  
  return baseStyle;
};

const getActionButtonSize = (size: ModalSize): 'small' | 'medium' | 'large' => {
  const sizeMap = { 
    small: 'small' as const, 
    medium: 'medium' as const, 
    large: 'medium' as const, 
    fullscreen: 'large' as const, 
    auto: 'medium' as const 
  };
  return sizeMap[size];
};

const canSwipeToDismiss = (direction: GestureConfig['swipeDirection'], event: any): boolean => {
  if (!direction || direction === 'any') return true;
  
  const { translationX, translationY } = event;
  const threshold = 50;
  
  switch (direction) {
    case 'down':
      return translationY > threshold && Math.abs(translationX) < threshold;
    case 'up':
      return translationY < -threshold && Math.abs(translationX) < threshold;
    case 'left':
      return translationX < -threshold && Math.abs(translationY) < threshold;
    case 'right':
      return translationX > threshold && Math.abs(translationY) < threshold;
    default:
      return false;
  }
};

// Styles
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    maxWidth: '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5e5',
  },
  actionButton: {
    minWidth: 80,
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  keyboardAvoid: {
    flex: 1,
  },
});

export default Modal;