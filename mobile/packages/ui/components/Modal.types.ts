/**
 * Modal Component Type Definitions
 * Harry School Mobile Design System
 * 
 * Comprehensive TypeScript definitions for Modal variants and educational celebrations
 */

import { ReactNode } from 'react';
import { ViewStyle, TextStyle } from 'react-native';

export type ModalSize = 
  | 'small'      // 280pt width
  | 'medium'     // 320pt width  
  | 'large'      // Fullscreen - 40pt margin
  | 'fullscreen' // Complete fullscreen
  | 'auto';      // Content-based sizing

export type ModalType = 
  | 'alert'        // Simple alert dialog
  | 'confirmation' // Confirmation dialog
  | 'form'         // Form modal
  | 'celebration'  // Achievement/success celebration
  | 'bottom-sheet' // Bottom sheet modal
  | 'info'         // Information display
  | 'selection'    // Selection/picker modal
  | 'custom';      // Custom content

export type ModalPosition = 
  | 'center'    // Center of screen
  | 'top'       // Top of screen
  | 'bottom'    // Bottom of screen (bottom sheet)
  | 'left'      // Left side (tablet)
  | 'right';    // Right side (tablet)

export type ModalAnimation = 
  | 'slide-up'   // Slide from bottom
  | 'slide-down' // Slide from top
  | 'slide-left' // Slide from right
  | 'slide-right'// Slide from left
  | 'fade-in'    // Fade in
  | 'scale'      // Scale animation
  | 'bounce'     // Bounce animation (celebrations)
  | 'none';      // No animation

export type CelebrationVariant = 
  | 'achievement' // Achievement unlock
  | 'level-up'    // Level progression
  | 'perfect'     // Perfect score
  | 'streak'      // Streak milestone
  | 'completion'  // Course/lesson completion
  | 'reward';     // Reward earned

export interface ModalAction {
  /** Action button text */
  text: string;
  /** Action callback */
  onPress: () => void;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Auto-close modal after action */
  autoClose?: boolean;
  /** Test ID for testing */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export interface ModalHeader {
  /** Header title */
  title?: string;
  /** Header subtitle */
  subtitle?: string;
  /** Show close button (X) */
  showCloseButton?: boolean;
  /** Custom close button */
  customCloseButton?: ReactNode;
  /** Close button callback */
  onClose?: () => void;
  /** Header icon */
  icon?: ReactNode | string;
  /** Custom header component */
  customHeader?: ReactNode;
  /** Header background color */
  backgroundColor?: string;
}

export interface BackdropConfig {
  /** Show backdrop */
  enabled?: boolean;
  /** Backdrop opacity */
  opacity?: number;
  /** Backdrop color */
  color?: string;
  /** Tap to dismiss */
  dismissible?: boolean;
  /** Backdrop press callback */
  onBackdropPress?: () => void;
  /** Blur effect */
  blur?: {
    enabled: boolean;
    intensity: number;
  };
}

export interface KeyboardConfig {
  /** Enable keyboard avoidance */
  avoid?: boolean;
  /** Keyboard avoid behavior */
  behavior?: 'height' | 'position' | 'padding';
  /** Additional keyboard offset */
  keyboardOffset?: number;
  /** Dismiss keyboard on backdrop tap */
  dismissOnBackdrop?: boolean;
}

export interface GestureConfig {
  /** Enable swipe to dismiss */
  swipeToDismiss?: boolean;
  /** Swipe direction for dismiss */
  swipeDirection?: 'down' | 'up' | 'left' | 'right' | 'any';
  /** Swipe threshold (0-1) */
  swipeThreshold?: number;
  /** Swipe velocity threshold */
  swipeVelocityThreshold?: number;
  /** Enable drag indicator for bottom sheets */
  showDragIndicator?: boolean;
  /** Custom drag indicator */
  customDragIndicator?: ReactNode;
}

export interface CelebrationConfig {
  /** Celebration variant */
  variant: CelebrationVariant;
  /** Show confetti animation */
  showConfetti?: boolean;
  /** Confetti configuration */
  confetti?: {
    colors: string[];
    count: number;
    duration: number;
    spread: number;
  };
  /** Achievement data */
  achievement?: {
    title: string;
    description: string;
    icon: ReactNode | string;
    points?: number;
    badge?: {
      name: string;
      image: any;
    };
  };
  /** Level up data */
  levelUp?: {
    newLevel: number;
    previousLevel: number;
    title: string;
    rewards?: string[];
  };
  /** Perfect score data */
  perfectScore?: {
    score: number;
    subject: string;
    encouragement: string;
  };
  /** Auto-close delay for celebrations */
  autoCloseDelay?: number;
  /** Play sound effect */
  playSoundEffect?: boolean;
  /** Custom celebration animation */
  customAnimation?: ReactNode;
}

export interface FocusConfig {
  /** Enable focus trap */
  trapFocus?: boolean;
  /** Initial focus element */
  initialFocus?: 'first' | 'last' | 'none';
  /** Return focus on close */
  returnFocus?: boolean;
  /** Custom focus order */
  focusOrder?: string[];
}

export interface AccessibilityConfig {
  /** Modal role */
  role?: 'dialog' | 'alertdialog' | 'presentation';
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility description */
  accessibilityDescription?: string;
  /** Modal importance */
  importance?: 'default' | 'high';
  /** Live region for dynamic content */
  liveRegion?: 'none' | 'polite' | 'assertive';
  /** Focus management */
  focus?: FocusConfig;
}

export interface ModalAnimation {
  /** Enter animation */
  enter?: {
    type: ModalAnimation;
    duration?: number;
    delay?: number;
    easing?: string;
  };
  /** Exit animation */
  exit?: {
    type: ModalAnimation;
    duration?: number;
    delay?: number;
    easing?: string;
  };
  /** Spring configuration */
  spring?: {
    damping: number;
    stiffness: number;
    mass: number;
  };
  /** Respect reduced motion */
  respectReducedMotion?: boolean;
}

export interface ModalStyleProps {
  /** Container style overrides */
  style?: ViewStyle;
  /** Content container style */
  contentStyle?: ViewStyle;
  /** Header style */
  headerStyle?: ViewStyle;
  /** Body style */
  bodyStyle?: ViewStyle;
  /** Footer style */
  footerStyle?: ViewStyle;
  /** Backdrop style */
  backdropStyle?: ViewStyle;
  /** Title text style */
  titleStyle?: TextStyle;
  /** Subtitle text style */
  subtitleStyle?: TextStyle;
}

export interface ModalProps extends ModalStyleProps {
  /** Modal visibility */
  visible: boolean;
  
  /** Modal type */
  type?: ModalType;
  
  /** Modal size */
  size?: ModalSize;
  
  /** Modal position */
  position?: ModalPosition;
  
  /** Modal header configuration */
  header?: ModalHeader;
  
  /** Modal content */
  children: ReactNode;
  
  /** Primary action button */
  primaryAction?: ModalAction;
  
  /** Secondary action button */
  secondaryAction?: ModalAction;
  
  /** Additional action buttons */
  additionalActions?: ModalAction[];
  
  /** Backdrop configuration */
  backdrop?: BackdropConfig;
  
  /** Animation configuration */
  animation?: ModalAnimation;
  
  /** Keyboard handling */
  keyboard?: KeyboardConfig;
  
  /** Gesture handling */
  gestures?: GestureConfig;
  
  /** Celebration configuration (for celebration type) */
  celebration?: CelebrationConfig;
  
  /** Accessibility configuration */
  accessibility?: AccessibilityConfig;
  
  /** Theme variant */
  variant?: 'teacher' | 'student' | 'system';
  
  /** Modal close callback */
  onClose?: () => void;
  
  /** Modal dismiss callback (backdrop/swipe) */
  onDismiss?: () => void;
  
  /** Modal show callback */
  onShow?: () => void;
  
  /** Modal hide callback */
  onHide?: () => void;
  
  /** Prevent close (show confirmation) */
  preventClose?: boolean;
  
  /** Close confirmation message */
  closeConfirmation?: {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
  };
  
  /** Custom z-index */
  zIndex?: number;
  
  /** Test ID for testing */
  testID?: string;
}

// Preset configurations
export interface ModalPresets {
  alert: {
    success: Partial<ModalProps>;
    error: Partial<ModalProps>;
    warning: Partial<ModalProps>;
    info: Partial<ModalProps>;
  };
  confirmation: {
    delete: Partial<ModalProps>;
    save: Partial<ModalProps>;
    discard: Partial<ModalProps>;
    logout: Partial<ModalProps>;
  };
  educational: {
    achievement: Partial<ModalProps>;
    levelUp: Partial<ModalProps>;
    perfectScore: Partial<ModalProps>;
    streakMilestone: Partial<ModalProps>;
    courseCompletion: Partial<ModalProps>;
  };
}

// Theme-specific configurations
export interface ModalThemeConfig {
  colors: {
    backdrop: string;
    container: string;
    header: string;
    content: string;
    border: string;
    shadow: string;
    text: {
      title: string;
      subtitle: string;
      body: string;
    };
    celebration: {
      background: string;
      accent: string;
      confetti: string[];
    };
  };
  spacing: {
    container: number;
    header: number;
    content: number;
    actions: number;
    margins: {
      small: number;
      medium: number;
      large: number;
    };
  };
  typography: {
    title: TextStyle;
    subtitle: TextStyle;
    body: TextStyle;
  };
  shadows: {
    small: ViewStyle;
    medium: ViewStyle;
    large: ViewStyle;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
  zIndex: {
    backdrop: number;
    modal: number;
    celebration: number;
  };
}

// Internal component interfaces
export interface ModalBackdropProps {
  visible: boolean;
  config: BackdropConfig;
  onPress?: () => void;
  style?: ViewStyle;
  children: ReactNode;
}

export interface ModalContainerProps {
  type: ModalType;
  size: ModalSize;
  position: ModalPosition;
  style?: ViewStyle;
  children: ReactNode;
}

export interface ModalHeaderProps {
  config: ModalHeader;
  size: ModalSize;
  onClose?: () => void;
  style?: ViewStyle;
}

export interface ModalFooterProps {
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  additionalActions?: ModalAction[];
  size: ModalSize;
  style?: ViewStyle;
}

export interface CelebrationModalProps {
  config: CelebrationConfig;
  visible: boolean;
  onClose?: () => void;
  style?: ViewStyle;
}

// Utility types
export type ModalState = 'hidden' | 'entering' | 'visible' | 'exiting';
export type ModalContext = 'page' | 'form' | 'confirmation' | 'celebration' | 'system';
export type ModalPriority = 'low' | 'medium' | 'high' | 'critical';
export type ModalLayer = 'base' | 'overlay' | 'top' | 'system';

// Hook interfaces
export interface UseModalProps {
  visible: boolean;
  onClose?: () => void;
  type?: ModalType;
  preventClose?: boolean;
  closeConfirmation?: ModalProps['closeConfirmation'];
}

export interface UseModalReturn {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
  toggle: () => void;
  canClose: boolean;
  confirmClose: () => void;
}

// Animation state interfaces
export interface ModalAnimationState {
  isAnimating: boolean;
  animationType: 'enter' | 'exit' | 'none';
  progress: number;
}

// Gesture state interfaces
export interface ModalGestureState {
  isDragging: boolean;
  dragProgress: number;
  dragDirection: 'up' | 'down' | 'left' | 'right' | null;
  canDismiss: boolean;
}