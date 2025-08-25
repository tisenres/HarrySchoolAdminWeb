/**
 * TabNavigation Component Types
 * Harry School Mobile Design System
 */

import { ViewStyle } from 'react-native';

export type TabVariant = 'default' | 'floating' | 'minimal';

export interface TabBadge {
  count: number;
  color?: string;
  textColor?: string;
  maxCount?: number;
}

export interface TabItem {
  id?: string;
  label: string;
  icon: string; // Emoji or icon
  activeIcon?: string; // Different icon when active
  badge?: TabBadge;
  disabled?: boolean;
}

export interface TabNavigationProps {
  /** Array of tab items */
  tabs: TabItem[];
  
  /** Currently active tab index */
  activeIndex?: number;
  
  /** Tab change handler */
  onTabChange: (index: number) => void;
  
  /** Show tab labels */
  showLabels?: boolean;
  
  /** Enable haptic feedback */
  enableHaptics?: boolean;
  
  /** Visual variant */
  variant?: TabVariant;
  
  /** Theme variant */
  theme?: 'light' | 'dark';
  
  /** Custom container styles */
  style?: ViewStyle;
  
  /** Test ID for automation */
  testID?: string;
}

export interface TabNavigationStyles {
  container: ViewStyle;
  floatingBackground: ViewStyle;
  tabsContainer: ViewStyle;
  tab: ViewStyle;
  iconContainer: ViewStyle;
  tabIcon: ViewStyle;
  tabLabel: ViewStyle;
  badge: ViewStyle;
  badgeText: ViewStyle;
  activeIndicator: ViewStyle;
  activeIndicatorBackground: ViewStyle;
}