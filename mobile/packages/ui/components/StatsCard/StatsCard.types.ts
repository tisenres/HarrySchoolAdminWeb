/**
 * StatsCard Component Types
 * Harry School Mobile Design System
 */

import { ViewStyle } from 'react-native';

export type TrendDirection = 'up' | 'down' | 'neutral';

export type StatsLayout = 'grid' | 'list';

export type StatsVariant = 'elevated' | 'outlined' | 'filled' | 'gradient';

export interface StatTrend {
  direction: TrendDirection;
  percentage: number;
  period?: string; // e.g., "vs last week"
}

export interface StatItem {
  id?: string;
  label: string;
  value: string | number;
  icon: string; // Emoji or icon
  color?: string;
  subtitle?: string;
  trend?: StatTrend;
  unit?: string; // e.g., "points", "coins"
}

export interface StatsCardProps {
  /** Array of statistics to display */
  stats: StatItem[];
  
  /** Card title */
  title?: string;
  
  /** Card subtitle */
  subtitle?: string;
  
  /** Layout style for stats */
  layout?: StatsLayout;
  
  /** Number of columns for grid layout */
  columns?: number;
  
  /** Show trend indicators */
  showTrends?: boolean;
  
  /** Animate value changes */
  animateValues?: boolean;
  
  /** Enable haptic feedback */
  enableHaptics?: boolean;
  
  /** Stat item press handler */
  onStatPress?: (stat: StatItem, index: number) => void;
  
  /** Theme variant */
  theme?: 'light' | 'dark';
  
  /** Card variant */
  variant?: StatsVariant;
  
  /** Custom container styles */
  style?: ViewStyle;
  
  /** Test ID for automation */
  testID?: string;
}

export interface StatsCardStyles {
  container: ViewStyle;
  header: ViewStyle;
  title: ViewStyle;
  subtitle: ViewStyle;
  gridContainer: ViewStyle;
  gridItem: ViewStyle;
  listContainer: ViewStyle;
}

export interface StatItemStyles {
  container: ViewStyle;
  iconContainer: ViewStyle;
  icon: ViewStyle;
  content: ViewStyle;
  label: ViewStyle;
  valueRow: ViewStyle;
  value: ViewStyle;
  trendContainer: ViewStyle;
  trendIcon: ViewStyle;
  trendText: ViewStyle;
  subtitle: ViewStyle;
}