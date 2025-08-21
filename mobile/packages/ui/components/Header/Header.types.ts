/**
 * Header Component Type Definitions
 * Harry School Mobile Design System
 * 
 * Comprehensive TypeScript definitions for Header variants and configurations
 */

import { ReactNode } from 'react';
import { ViewStyle, TextStyle, AccessibilityProps } from 'react-native';

export type HeaderVariant = 'default' | 'search' | 'minimal' | 'contextual';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface HeaderAction {
  /** Unique identifier */
  id: string;
  /** Icon component or name */
  icon: ReactNode | string;
  /** Action label for accessibility */
  label: string;
  /** Press handler */
  onPress: () => void;
  /** Whether action is disabled */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Badge count */
  badgeCount?: number;
  /** Test ID */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
}

export interface HeaderBackButton {
  /** Whether to show back button */
  show?: boolean;
  /** Custom back icon */
  icon?: ReactNode | string;
  /** Back button press handler */
  onPress?: () => void;
  /** Back button label for accessibility */
  accessibilityLabel?: string;
  /** Test ID */
  testID?: string;
}

export interface HeaderSearchProps {
  /** Whether search is active/expanded */
  isActive: boolean;
  /** Search input placeholder */
  placeholder?: string;
  /** Search input value */
  value?: string;
  /** Search input change handler */
  onChangeText?: (text: string) => void;
  /** Search submit handler */
  onSubmitEditing?: () => void;
  /** Search focus handler */
  onFocus?: () => void;
  /** Search blur handler */
  onBlur?: () => void;
  /** Search clear handler */
  onClear?: () => void;
  /** Auto focus search input */
  autoFocus?: boolean;
  /** Max length for search input */
  maxLength?: number;
}

export interface HeaderStyleProps {
  /** Header variant */
  variant?: HeaderVariant;
  /** Custom container style */
  style?: ViewStyle;
  /** Custom title style */
  titleStyle?: TextStyle;
  /** Custom subtitle style */
  subtitleStyle?: TextStyle;
  /** Height override */
  height?: number;
  /** Background color override */
  backgroundColor?: string;
  /** Border color override */
  borderColor?: string;
  /** Hide border */
  hideBorder?: boolean;
}

export interface HeaderContentProps {
  /** Header title */
  title?: string;
  /** Header subtitle */
  subtitle?: string;
  /** Custom title component */
  titleComponent?: ReactNode;
  /** Title alignment */
  titleAlign?: 'left' | 'center';
  /** Maximum lines for title */
  titleNumberOfLines?: number;
  /** Maximum lines for subtitle */
  subtitleNumberOfLines?: number;
}

export interface HeaderStateProps {
  /** Whether device is offline */
  isOffline?: boolean;
  /** Sync status */
  syncStatus?: SyncStatus;
  /** Whether header is disabled */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
}

export interface HeaderInteractionProps {
  /** Back button configuration */
  backButton?: HeaderBackButton;
  /** Right side actions (max 3) */
  actions?: HeaderAction[];
  /** Search configuration */
  search?: HeaderSearchProps;
  /** Enable haptic feedback */
  enableHaptics?: boolean;
}

export interface HeaderAnimationProps {
  /** Animation duration */
  animationDuration?: number;
  /** Disable animations */
  disableAnimations?: boolean;
  /** Search expand animation duration */
  searchAnimationDuration?: number;
}

export interface HeaderProps 
  extends HeaderStyleProps,
          HeaderContentProps,
          HeaderStateProps,
          HeaderInteractionProps,
          HeaderAnimationProps,
          AccessibilityProps {
  /** Test ID for the component */
  testID?: string;
}

// Theme configuration for header
export interface HeaderThemeConfig {
  container: {
    default: ViewStyle;
    search: ViewStyle;
    minimal: ViewStyle;
    contextual: ViewStyle;
  };
  title: {
    default: TextStyle;
    search: TextStyle;
    minimal: TextStyle;
    contextual: TextStyle;
  };
  subtitle: {
    default: TextStyle;
  };
  backButton: {
    container: ViewStyle;
    icon: {
      size: number;
      color: string;
    };
  };
  action: {
    container: ViewStyle;
    icon: {
      size: number;
      color: string;
    };
    disabled: {
      opacity: number;
    };
  };
  searchBar: {
    container: ViewStyle;
    input: TextStyle;
    placeholder: {
      color: string;
    };
    icon: {
      size: number;
      color: string;
    };
  };
  syncIndicator: {
    container: ViewStyle;
    icon: {
      size: number;
    };
    colors: {
      idle: string;
      syncing: string;
      success: string;
      error: string;
    };
  };
  offlineIndicator: {
    container: ViewStyle;
    text: TextStyle;
  };
}

// Animation state interfaces
export interface HeaderAnimationState {
  opacity: number;
  translateY: number;
  scale: number;
}

export interface SearchAnimationState {
  width: number;
  opacity: number;
  translateX: number;
}

// Header layout measurement
export interface HeaderLayoutMeasurement {
  containerWidth: number;
  titleWidth: number;
  backButtonWidth: number;
  actionsWidth: number;
  availableSearchWidth: number;
}

// Preset configurations
export const HEADER_HEIGHTS = {
  minimal: 44,
  default: 56,
  withSubtitle: 72,
  search: 56,
  contextual: 56,
} as const;

export const MAX_ACTIONS = 3;
export const BACK_BUTTON_WIDTH = 44;
export const ACTION_BUTTON_WIDTH = 44;

// Accessibility configuration
export interface HeaderAccessibilityConfig {
  containerRole: string;
  titleRole: string;
  backButtonRole: string;
  actionRole: string;
  searchRole: string;
  syncIndicatorRole: string;
}

export const ACCESSIBILITY_CONFIG: HeaderAccessibilityConfig = {
  containerRole: 'banner',
  titleRole: 'heading',
  backButtonRole: 'button',
  actionRole: 'button',
  searchRole: 'searchbox',
  syncIndicatorRole: 'status',
};