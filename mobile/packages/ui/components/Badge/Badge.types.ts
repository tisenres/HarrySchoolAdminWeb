/**
 * Badge Component Type Definitions
 * Harry School Mobile Design System
 * 
 * Comprehensive TypeScript definitions for Badge types, positions, and animations
 */

import { ReactNode } from 'react';
import { ViewProps, TextStyle, ViewStyle } from 'react-native';

export type BadgeType = 'notification' | 'achievement' | 'status';

export type BadgeVariant = 
  | 'dot' 
  | 'count' 
  | 'icon' 
  | 'text' 
  | 'achievement'
  | 'status';

export type BadgePosition = 
  | 'top-right' 
  | 'top-left' 
  | 'bottom-right' 
  | 'bottom-left' 
  | 'top-center' 
  | 'bottom-center';

export type BadgeSize = 'sm' | 'md' | 'lg';

export type BadgeColor = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info'
  | 'neutral';

export type AchievementType = 'gold' | 'silver' | 'bronze' | 'platinum';

export type StatusType = 
  | 'active' 
  | 'pending' 
  | 'inactive' 
  | 'completed' 
  | 'error' 
  | 'new';

export interface BadgeContentProps {
  /** Badge content (text, number, or custom element) */
  content?: ReactNode | string | number;
  /** Icon to display in badge */
  icon?: ReactNode | string;
  /** Maximum count to display (shows "max+" when exceeded) */
  maxCount?: number;
  /** Show zero values */
  showZero?: boolean;
  /** Custom formatter for numbers */
  formatter?: (value: number) => string;
}

export interface BadgeStyleProps {
  /** Badge type determining behavior and styling */
  type?: BadgeType;
  /** Badge variant determining appearance */
  variant?: BadgeVariant;
  /** Badge size */
  size?: BadgeSize;
  /** Badge color theme */
  color?: BadgeColor;
  /** Custom background color */
  backgroundColor?: string;
  /** Custom text color */
  textColor?: string;
  /** Custom border color */
  borderColor?: string;
  /** Border width */
  borderWidth?: number;
  /** Custom border radius */
  borderRadius?: number;
  /** Badge container style */
  style?: ViewStyle;
  /** Badge text style */
  textStyle?: TextStyle;
}

export interface BadgePositionProps {
  /** Badge position relative to parent */
  position?: BadgePosition;
  /** Horizontal offset from position */
  offsetX?: number;
  /** Vertical offset from position */
  offsetY?: number;
  /** Whether badge is positioned absolutely */
  absolute?: boolean;
  /** Custom position style */
  positionStyle?: ViewStyle;
}

export interface BadgeAnimationProps {
  /** Enable all animations */
  enableAnimations?: boolean;
  /** Pulse animation for notifications */
  pulse?: boolean;
  /** Pulse animation duration */
  pulseDuration?: number;
  /** Pulse scale factor */
  pulseScale?: number;
  /** Bounce animation for achievements */
  bounce?: boolean;
  /** Bounce animation duration */
  bounceDuration?: number;
  /** Celebration animation (confetti, etc.) */
  celebration?: boolean;
  /** Fade in animation on appear */
  fadeIn?: boolean;
  /** Fade in duration */
  fadeInDuration?: number;
  /** Entrance animation delay */
  animationDelay?: number;
  /** Disable all animations (accessibility) */
  disableAnimations?: boolean;
}

export interface BadgeInteractionProps {
  /** Badge press handler */
  onPress?: () => void;
  /** Long press handler */
  onLongPress?: () => void;
  /** Make badge interactive */
  interactive?: boolean;
  /** Enable haptic feedback */
  enableHaptics?: boolean;
  /** Haptic feedback type */
  hapticType?: 'light' | 'medium' | 'heavy';
  /** Enable press animation */
  enablePressAnimation?: boolean;
  /** Press scale factor */
  pressScale?: number;
}

export interface BadgeAccessibilityProps {
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
  /** Accessibility role */
  accessibilityRole?: 'button' | 'text' | 'image';
  /** Live region for dynamic content */
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
  /** Whether badge content is important for screen readers */
  accessibilityIgnoresInvertColors?: boolean;
}

export interface BadgeNotificationProps {
  /** Notification count */
  count?: number;
  /** Show badge even when count is 0 */
  showZero?: boolean;
  /** Maximum count before showing "99+" format */
  maxDisplayCount?: number;
  /** Auto-hide after specified milliseconds */
  autoHide?: number;
  /** Badge priority (affects styling intensity) */
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface BadgeAchievementProps {
  /** Achievement type/tier */
  achievementType?: AchievementType;
  /** Achievement level (1-5 stars, etc.) */
  level?: number;
  /** Show level indicator */
  showLevel?: boolean;
  /** Achievement icon */
  achievementIcon?: ReactNode | string;
  /** Enable special achievement animations */
  specialAnimation?: boolean;
  /** Achievement unlock timestamp */
  unlockedAt?: Date;
}

export interface BadgeStatusProps {
  /** Status type */
  statusType?: StatusType;
  /** Status message */
  statusMessage?: string;
  /** Blinking animation for urgent statuses */
  blink?: boolean;
  /** Blink duration */
  blinkDuration?: number;
  /** Gradient background for status badges */
  gradient?: boolean;
  /** Gradient colors */
  gradientColors?: string[];
}

export interface BadgeProps
  extends Omit<ViewProps, 'style'>,
          BadgeContentProps,
          BadgeStyleProps,
          BadgePositionProps,
          BadgeAnimationProps,
          BadgeInteractionProps,
          BadgeAccessibilityProps,
          BadgeNotificationProps,
          BadgeAchievementProps,
          BadgeStatusProps {
  /** Show badge */
  visible?: boolean;
  /** Test ID for testing */
  testID?: string;
  /** Theme variant override */
  themeVariant?: 'teacher' | 'student';
}

// Component configuration interfaces
export interface BadgeDimensions {
  minWidth: number;
  minHeight: number;
  paddingHorizontal: number;
  paddingVertical: number;
  borderRadius: number;
  fontSize: number;
  iconSize: number;
}

export interface BadgeColors {
  background: string;
  text: string;
  border?: string;
  shadow?: string;
}

export interface BadgeShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

// Theme-specific configurations
export interface BadgeThemeConfig {
  teacher: {
    animationsEnabled: boolean;
    defaultColor: BadgeColor;
    defaultSize: BadgeSize;
    prioritizeFunction: boolean;
  };
  student: {
    animationsEnabled: boolean;
    defaultColor: BadgeColor;
    defaultSize: BadgeSize;
    celebrationsEnabled: boolean;
    achievementAnimations: boolean;
  };
}

// Position calculation interface
export interface BadgePositionCalculation {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  transform?: Array<{ [key: string]: number }>;
}

// Animation configuration
export interface BadgeAnimationConfig {
  pulse: {
    scale: [number, number, number];
    duration: number;
    iteration: number | 'infinite';
  };
  bounce: {
    translateY: number[];
    duration: number;
    damping: number;
    stiffness: number;
  };
  celebration: {
    scale: number[];
    rotation: number[];
    duration: number;
    particles?: {
      count: number;
      colors: string[];
      size: number;
    };
  };
  fadeIn: {
    opacity: [number, number];
    scale: [number, number];
    duration: number;
  };
  press: {
    scale: number;
    duration: number;
  };
}

// Utility types
export type BadgeTypeConfig = {
  [K in BadgeType]: {
    defaultVariant: BadgeVariant;
    colors: Record<BadgeColor, BadgeColors>;
    animations: string[];
    sizes: Record<BadgeSize, BadgeDimensions>;
  };
};

export type BadgeVariantConfig = {
  [K in BadgeVariant]: {
    showContent: boolean;
    showIcon: boolean;
    showBorder: boolean;
    minWidth: number | 'auto';
    aspectRatio?: number;
  };
};

export type BadgeColorConfig = {
  [K in BadgeColor]: BadgeColors;
};

export type BadgeSizeConfig = {
  [K in BadgeSize]: BadgeDimensions;
};

// Achievement and ranking specific types
export interface AchievementBadgeData {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  icon: ReactNode | string;
  requirements: string[];
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  category: string;
}

export interface StatusBadgeData {
  id: string;
  type: StatusType;
  label: string;
  description?: string;
  icon?: ReactNode | string;
  priority: number;
  autoExpire?: number; // milliseconds
}

// Educational context specific types
export interface EducationalBadgeProps {
  /** Subject or category */
  subject?: string;
  /** Grade level */
  gradeLevel?: string;
  /** Skill level indicator */
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  /** Progress percentage (0-100) */
  progress?: number;
  /** Show progress indicator */
  showProgress?: boolean;
  /** Mastery indicator */
  mastered?: boolean;
}

// Grouping and collection types
export interface BadgeGroupProps {
  /** Array of badge configurations */
  badges: (BadgeProps & { id: string })[];
  /** Maximum badges to show */
  maxVisible?: number;
  /** Layout direction */
  direction?: 'row' | 'column';
  /** Spacing between badges */
  spacing?: number;
  /** Show overflow indicator */
  showOverflow?: boolean;
  /** Overflow indicator style */
  overflowStyle?: ViewStyle;
  /** Container style */
  containerStyle?: ViewStyle;
}

// Export main component interface with all combinations
export interface FullBadgeProps extends BadgeProps {
  /** Educational context data */
  educational?: EducationalBadgeProps;
  /** Achievement data for complex achievement badges */
  achievementData?: AchievementBadgeData;
  /** Status data for complex status badges */
  statusData?: StatusBadgeData;
}