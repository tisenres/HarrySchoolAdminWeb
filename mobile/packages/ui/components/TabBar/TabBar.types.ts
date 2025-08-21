/**
 * TabBar Component Type Definitions
 * Harry School Mobile Design System
 * 
 * Comprehensive TypeScript definitions for TabBar variants and states
 */

import { ReactNode } from 'react';
import { ViewStyle, AccessibilityProps } from 'react-native';

export type TabBarVariant = 'teacher' | 'student';

export type TabItem = {
  /** Unique identifier for the tab */
  id: string;
  /** Tab label text */
  label: string;
  /** Icon component or name */
  icon: ReactNode | string;
  /** Badge count for notifications */
  badgeCount?: number;
  /** Whether tab is disabled */
  disabled?: boolean;
  /** Whether tab requires internet connection */
  requiresConnection?: boolean;
  /** Test ID for the tab */
  testID?: string;
  /** Accessibility label override */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
};

export interface TabBarAnimationProps {
  /** Duration for tab switch animation */
  animationDuration?: number;
  /** Disable animations */
  disableAnimations?: boolean;
  /** Enable haptic feedback */
  enableHaptics?: boolean;
}

export interface TabBarStyleProps {
  /** TabBar variant */
  variant?: TabBarVariant;
  /** Custom container style */
  style?: ViewStyle;
  /** Height override */
  height?: number;
  /** Background color override */
  backgroundColor?: string;
}

export interface TabBarStateProps {
  /** Currently active tab ID */
  activeTabId: string;
  /** Whether device is offline */
  isOffline?: boolean;
  /** Whether TabBar is disabled */
  disabled?: boolean;
  /** Loading state for specific tabs */
  loadingTabs?: string[];
}

export interface TabBarInteractionProps {
  /** Tab press handler */
  onTabPress: (tabId: string) => void;
  /** Long press handler for tab */
  onTabLongPress?: (tabId: string) => void;
  /** Tab press in handler (for custom feedback) */
  onTabPressIn?: (tabId: string) => void;
  /** Tab press out handler */
  onTabPressOut?: (tabId: string) => void;
}

export interface TabBarProps 
  extends TabBarStyleProps,
          TabBarStateProps,
          TabBarInteractionProps,
          TabBarAnimationProps,
          AccessibilityProps {
  /** Array of tab items */
  tabs: TabItem[];
  /** Test ID for the component */
  testID?: string;
}

// Individual Tab Props
export interface TabProps {
  /** Tab item configuration */
  item: TabItem;
  /** Whether tab is active */
  isActive: boolean;
  /** Whether tab is disabled */
  disabled?: boolean;
  /** Whether device is offline */
  isOffline?: boolean;
  /** Whether tab is loading */
  isLoading?: boolean;
  /** Tab variant */
  variant: TabBarVariant;
  /** Animation configuration */
  animationConfig?: TabBarAnimationProps;
  /** Press handlers */
  onPress: (tabId: string) => void;
  onLongPress?: (tabId: string) => void;
  onPressIn?: (tabId: string) => void;
  onPressOut?: (tabId: string) => void;
}

// Badge Props for Tab
export interface TabBadgeProps {
  /** Badge count */
  count: number;
  /** Maximum count to display */
  maxCount?: number;
  /** Badge color override */
  color?: string;
  /** Badge background color override */
  backgroundColor?: string;
  /** Badge size */
  size?: 'small' | 'medium';
}

// Indicator Props
export interface TabIndicatorProps {
  /** Active tab index */
  activeIndex: number;
  /** Tab widths for positioning */
  tabWidths: number[];
  /** Animation duration */
  animationDuration: number;
  /** Variant for styling */
  variant: TabBarVariant;
  /** Disable animations */
  disableAnimations?: boolean;
}

// Theme configuration for tabs
export interface TabBarThemeConfig {
  container: {
    height: number;
    backgroundColor: string;
    borderTopWidth: number;
    borderTopColor: string;
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  tab: {
    default: ViewStyle;
    active: ViewStyle;
    disabled: ViewStyle;
    offline: ViewStyle;
  };
  icon: {
    default: {
      size: number;
      color: string;
    };
    active: {
      color: string;
    };
    disabled: {
      color: string;
    };
    offline: {
      color: string;
    };
  };
  label: {
    default: {
      fontSize: number;
      fontWeight: string;
      color: string;
    };
    active: {
      color: string;
      fontWeight: string;
    };
    disabled: {
      color: string;
    };
    offline: {
      color: string;
    };
  };
  indicator: {
    height: number;
    backgroundColor: string;
    borderRadius: number;
  };
  badge: {
    backgroundColor: string;
    color: string;
    fontSize: number;
    minWidth: number;
    height: number;
    borderRadius: number;
  };
}

// Animation state interfaces
export interface TabAnimationState {
  scale: number;
  opacity: number;
  translateY: number;
}

export interface TabIndicatorAnimationState {
  translateX: number;
  width: number;
}

// Export default tab configurations
export const TEACHER_TABS: TabItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'home',
    accessibilityHint: 'Navigate to dashboard overview',
  },
  {
    id: 'students',
    label: 'Students',
    icon: 'users',
    accessibilityHint: 'View and manage students',
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: 'check-square',
    requiresConnection: true,
    accessibilityHint: 'Mark student attendance',
  },
  {
    id: 'ai-tools',
    label: 'AI Tools',
    icon: 'zap',
    requiresConnection: true,
    accessibilityHint: 'Access AI-powered teaching tools',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: 'user',
    accessibilityHint: 'View and edit profile settings',
  },
];

export const STUDENT_TABS: TabItem[] = [
  {
    id: 'learn',
    label: 'Learn',
    icon: 'book-open',
    accessibilityHint: 'Access lessons and learning materials',
  },
  {
    id: 'vocabulary',
    label: 'Vocabulary',
    icon: 'bookmark',
    accessibilityHint: 'Practice vocabulary with flashcards',
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: 'trending-up',
    requiresConnection: true,
    accessibilityHint: 'View learning progress and statistics',
  },
  {
    id: 'rewards',
    label: 'Rewards',
    icon: 'award',
    requiresConnection: true,
    accessibilityHint: 'View achievements and claim rewards',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: 'user',
    accessibilityHint: 'View profile and settings',
  },
];