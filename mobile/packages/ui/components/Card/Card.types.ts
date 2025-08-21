/**
 * Card Component Type Definitions
 * Harry School Mobile Design System
 * 
 * Comprehensive TypeScript definitions for Card variants, states, and interactions
 */

import { ReactNode } from 'react';
import { ViewProps, ViewStyle, PanGestureHandlerGestureEvent } from 'react-native';
import { SharedValue } from 'react-native-reanimated';

export type CardVariant = 
  | 'elevated' 
  | 'outlined' 
  | 'filled' 
  | 'interactive' 
  | 'data' 
  | 'visual';

export type CardSize = 'compact' | 'default' | 'expanded';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface CardSyncProps {
  /** Current sync status */
  syncStatus?: SyncStatus;
  /** Show sync status indicator */
  showSyncIndicator?: boolean;
  /** Sync status change handler */
  onSyncStatusChange?: (status: SyncStatus) => void;
  /** Manual sync trigger */
  onManualSync?: () => void;
}

export interface CardSwipeAction {
  /** Action identifier */
  id: string;
  /** Action label for accessibility */
  label: string;
  /** Action icon */
  icon?: ReactNode | string;
  /** Action background color */
  backgroundColor: string;
  /** Action text color */
  textColor?: string;
  /** Action handler */
  onAction: () => void;
  /** Action width */
  width?: number;
}

export interface CardSwipeProps {
  /** Left swipe actions */
  leftActions?: CardSwipeAction[];
  /** Right swipe actions */
  rightActions?: CardSwipeAction[];
  /** Enable swipe gestures */
  enableSwipe?: boolean;
  /** Swipe threshold for action trigger */
  swipeThreshold?: number;
  /** Swipe resistance factor */
  swipeResistance?: number;
  /** Auto-close after action */
  autoClose?: boolean;
}

export interface CardAnimationProps {
  /** Enable press animation */
  enablePressAnimation?: boolean;
  /** Press scale factor */
  pressScale?: number;
  /** Animation duration override */
  animationDuration?: number;
  /** Disable all animations */
  disableAnimations?: boolean;
  /** Spring animation configuration */
  springConfig?: {
    damping: number;
    stiffness: number;
    mass: number;
  };
}

export interface CardElevationProps {
  /** Card elevation level */
  elevation?: number;
  /** Custom shadow configuration */
  shadow?: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  /** Enable elevation animation on press */
  animateElevation?: boolean;
}

export interface CardContentProps {
  /** Card header content */
  header?: ReactNode;
  /** Card body content */
  children?: ReactNode;
  /** Card footer content */
  footer?: ReactNode;
  /** Header style overrides */
  headerStyle?: ViewStyle;
  /** Content style overrides */
  contentStyle?: ViewStyle;
  /** Footer style overrides */
  footerStyle?: ViewStyle;
}

export interface CardInteractionProps {
  /** Card press handler */
  onPress?: () => void;
  /** Long press handler */
  onLongPress?: () => void;
  /** Press in handler */
  onPressIn?: () => void;
  /** Press out handler */
  onPressOut?: () => void;
  /** Make card interactive (pressable) */
  interactive?: boolean;
  /** Enable haptic feedback */
  enableHaptics?: boolean;
  /** Haptic feedback type */
  hapticType?: 'light' | 'medium' | 'heavy';
}

export interface CardAccessibilityProps {
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
  /** Accessibility role */
  accessibilityRole?: 'button' | 'none' | 'text' | 'image';
  /** Accessibility actions for swipe gestures */
  accessibilityActions?: Array<{
    name: string;
    label: string;
  }>;
  /** Accessibility action handler */
  onAccessibilityAction?: (event: { nativeEvent: { actionName: string } }) => void;
}

export interface CardStyleProps extends Omit<ViewProps, 'style'> {
  /** Card variant determining appearance */
  variant?: CardVariant;
  /** Card size affecting dimensions */
  size?: CardSize;
  /** Full width card */
  fullWidth?: boolean;
  /** Custom container style */
  style?: ViewStyle;
  /** Custom border radius */
  borderRadius?: number;
  /** Custom background color */
  backgroundColor?: string;
  /** Custom border color */
  borderColor?: string;
  /** Custom border width */
  borderWidth?: number;
}

export interface CardDataProps {
  /** Data grid layout for teacher cards */
  dataGrid?: boolean;
  /** Quick actions menu items */
  quickActions?: Array<{
    id: string;
    label: string;
    icon?: ReactNode;
    onPress: () => void;
  }>;
  /** Show quick actions menu */
  showQuickActions?: boolean;
}

export interface CardVisualProps {
  /** Large imagery for student cards */
  image?: {
    source: any;
    alt?: string;
    aspectRatio?: number;
  };
  /** Progress indicators */
  progress?: {
    current: number;
    total: number;
    showPercentage?: boolean;
    color?: string;
  };
  /** Achievement badges */
  achievements?: Array<{
    id: string;
    icon: ReactNode;
    label: string;
    color: string;
  }>;
  /** Gradient background */
  gradientBackground?: {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
  };
}

export interface CardProps 
  extends CardStyleProps,
          CardContentProps,
          CardInteractionProps,
          CardAnimationProps,
          CardElevationProps,
          CardSwipeProps,
          CardSyncProps,
          CardAccessibilityProps,
          CardDataProps,
          CardVisualProps {
  /** Test ID for testing */
  testID?: string;
}

// Component configuration interfaces
export interface CardDimensions {
  minHeight: number;
  padding: number;
  borderRadius: number;
  marginVertical?: number;
}

export interface CardColors {
  background: string;
  backgroundPressed?: string;
  border?: string;
  borderPressed?: string;
  text: string;
  textSecondary: string;
}

export interface CardShadowConfig {
  default: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  pressed?: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

// Swipe gesture event types
export interface CardSwipeGestureEvent extends PanGestureHandlerGestureEvent {
  translationX: SharedValue<number>;
  velocityX: SharedValue<number>;
}

// Theme-specific configurations
export interface CardThemeConfig {
  teacher: {
    animations: 'minimal' | 'standard';
    shadows: 'subtle' | 'standard';
    haptics: boolean;
    swipeEnabled: boolean;
  };
  student: {
    animations: 'standard' | 'enhanced';
    shadows: 'standard' | 'enhanced';
    haptics: boolean;
    swipeEnabled: boolean;
    celebrations: boolean;
  };
}

// Sync indicator configuration
export interface SyncIndicatorConfig {
  size: number;
  colors: {
    synced: string;
    syncing: string;
    offline: string;
    error: string;
  };
  animations: {
    syncing: {
      duration: number;
      easing: string;
    };
  };
}

// Quick actions menu configuration
export interface QuickActionsConfig {
  maxVisible: number;
  iconSize: number;
  spacing: number;
  backgroundColor: string;
  borderRadius: number;
  shadow: CardShadowConfig['default'];
}

// Export utility types
export type CardVariantConfig = {
  [K in CardVariant]: {
    colors: CardColors;
    shadow: CardShadowConfig;
    border?: boolean;
    hapticType?: 'light' | 'medium' | 'heavy';
  };
};

export type CardSizeConfig = {
  [K in CardSize]: CardDimensions;
};

// Animation configuration types
export interface CardAnimationConfig {
  pressScale: number;
  elevationScale: number;
  swipeThreshold: number;
  snapBackThreshold: number;
  springConfig: {
    damping: number;
    stiffness: number;
    mass: number;
  };
  durations: {
    press: number;
    swipe: number;
    elevation: number;
  };
}

// Educational-specific card types
export interface EducationalCardData {
  subject?: string;
  level?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  completionStatus?: 'not_started' | 'in_progress' | 'completed' | 'mastered';
  lastAccessed?: Date;
  timeSpent?: number;
  score?: number;
}