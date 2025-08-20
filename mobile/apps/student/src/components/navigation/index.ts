/**
 * Navigation Components Export
 * 
 * Centralized exports for all navigation-related components
 * used in the Harry School Student App.
 */

export { AnimatedTabBar } from './AnimatedTabBar';
export type { TabConfig, AnimatedTabBarProps } from './AnimatedTabBar';

// Navigation hooks
export { useTabState } from './useTabState';
export { useTabAnalytics } from './useTabAnalytics';
export { useTabAccessibility } from './useTabAccessibility';

// Tab configuration
export { studentTabConfig } from './tabConfig';