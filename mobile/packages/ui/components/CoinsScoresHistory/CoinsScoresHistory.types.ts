/**
 * CoinsScoresHistory Component Types
 * Harry School Mobile Design System
 */

import { ViewStyle } from 'react-native';

export type HistoryType = 
  | 'coins_earned' 
  | 'coins_spent' 
  | 'points_earned' 
  | 'level_up' 
  | 'achievement' 
  | 'streak'
  | 'other';

export interface HistoryItem {
  id?: string;
  title: string;
  description?: string;
  type: HistoryType;
  value?: number;
  unit?: string;
  date: Date;
  metadata?: Record<string, any>;
}

export interface CoinsScoresHistoryProps {
  /** Array of history items */
  items: HistoryItem[];
  
  /** List title */
  title?: string;
  
  /** List subtitle */
  subtitle?: string;
  
  /** Filter by specific type */
  filterType?: HistoryType;
  
  /** Show empty state */
  showEmpty?: boolean;
  
  /** Enable haptic feedback */
  enableHaptics?: boolean;
  
  /** Theme variant */
  theme?: 'light' | 'dark';
  
  /** Custom container styles */
  style?: ViewStyle;
  
  /** Test ID for automation */
  testID?: string;
}

export interface CoinsScoresHistoryStyles {
  container: ViewStyle;
  listContent: ViewStyle;
  header: ViewStyle;
  headerTitle: ViewStyle;
  headerSubtitle: ViewStyle;
  itemContainer: ViewStyle;
  iconContainer: ViewStyle;
  icon: ViewStyle;
  content: ViewStyle;
  title: ViewStyle;
  description: ViewStyle;
  date: ViewStyle;
  valueContainer: ViewStyle;
  value: ViewStyle;
  unit: ViewStyle;
  emptyContainer: ViewStyle;
  emptyIcon: ViewStyle;
  emptyTitle: ViewStyle;
  emptySubtitle: ViewStyle;
}