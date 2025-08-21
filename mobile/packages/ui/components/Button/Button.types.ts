/**
 * Button Component Type Definitions
 * Harry School Mobile Design System
 * 
 * Comprehensive TypeScript definitions for Button variants, sizes, and states
 */

import { ReactNode } from 'react';
import { PressableProps, ViewStyle, TextStyle } from 'react-native';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'outline' 
  | 'ghost' 
  | 'destructive' 
  | 'bulk';

export type ButtonSize = 'small' | 'medium' | 'large' | 'xlarge';

export type ButtonState = 'default' | 'pressed' | 'disabled' | 'loading';

export interface ButtonIconProps {
  /** Icon component or name */
  icon?: ReactNode | string;
  /** Icon position relative to text */
  iconPosition?: 'leading' | 'trailing' | 'only';
  /** Icon size override (defaults to size-appropriate value) */
  iconSize?: number;
}

export interface ButtonAnimationProps {
  /** Enable celebration animation for achievements */
  enableCelebration?: boolean;
  /** Custom animation duration override */
  animationDuration?: number;
  /** Disable press animations */
  disableAnimations?: boolean;
}

export interface ButtonAccessibilityProps {
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Accessibility hint for additional context */
  accessibilityHint?: string;
  /** Accessibility role override */
  accessibilityRole?: 'button' | 'link' | 'menuitem';
  /** Whether button is in loading state for screen readers */
  accessibilityBusy?: boolean;
}

export interface ButtonStyleProps {
  /** Button variant determining appearance */
  variant?: ButtonVariant;
  /** Button size affecting dimensions and typography */
  size?: ButtonSize;
  /** Full width button */
  fullWidth?: boolean;
  /** Custom style overrides for container */
  style?: ViewStyle;
  /** Custom style overrides for text */
  textStyle?: TextStyle;
  /** Custom test ID for testing */
  testID?: string;
}

export interface ButtonStateProps {
  /** Whether button is disabled */
  disabled?: boolean;
  /** Whether button is in loading state */
  loading?: boolean;
  /** Loading text to show instead of children */
  loadingText?: string;
  /** Loading indicator color override */
  loadingColor?: string;
}

export interface ButtonInteractionProps extends Omit<PressableProps, 'style'> {
  /** Button press handler */
  onPress?: () => void;
  /** Long press handler */
  onLongPress?: () => void;
  /** Press in handler for custom feedback */
  onPressIn?: () => void;
  /** Press out handler for custom feedback */
  onPressOut?: () => void;
  /** Enable haptic feedback on press */
  enableHaptics?: boolean;
}

export interface ButtonProps 
  extends ButtonStyleProps,
          ButtonStateProps,
          ButtonInteractionProps,
          ButtonIconProps,
          ButtonAnimationProps,
          ButtonAccessibilityProps {
  /** Button text content */
  children?: ReactNode;
  /** Selection count for bulk action variant */
  selectionCount?: number;
}

// Component style interfaces for internal use
export interface ButtonDimensions {
  height: number;
  paddingHorizontal: number;
  paddingVertical: number;
  borderRadius: number;
  fontSize: number;
  iconSize: number;
  minWidth?: number;
}

export interface ButtonColors {
  background: string;
  backgroundPressed: string;
  backgroundDisabled: string;
  text: string;
  textPressed: string;
  textDisabled: string;
  border?: string;
  borderPressed?: string;
  borderDisabled?: string;
  loading?: string;
}

export interface ButtonShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

// Animation configuration interface
export interface ButtonAnimationConfig {
  pressScale: number;
  pressDuration: number;
  celebrationScale: number[];
  celebrationDuration: number;
  celebrationRotation?: number[];
  springConfig: {
    damping: number;
    stiffness: number;
    mass: number;
  };
}

// Theme variant configuration
export interface ButtonThemeConfig {
  animations: 'minimal' | 'standard' | 'enhanced';
  shadows: 'none' | 'subtle' | 'enhanced';
  haptics: boolean;
  celebrations: boolean;
}

// Bulk action specific props
export interface BulkActionConfig {
  showCount: boolean;
  maxDisplayCount: number;
  countPosition: 'badge' | 'inline';
  countColor?: string;
  countBackgroundColor?: string;
}

// Export utility types
export type ButtonVariantConfig = {
  [K in ButtonVariant]: {
    colors: ButtonColors;
    shadow?: ButtonShadow;
    border?: boolean;
    hapticType?: 'light' | 'medium' | 'heavy';
  };
};

export type ButtonSizeConfig = {
  [K in ButtonSize]: ButtonDimensions;
};