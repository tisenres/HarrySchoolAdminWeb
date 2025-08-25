/**
 * RankingList Component Types
 * Harry School Mobile Design System
 */

import { ViewStyle } from 'react-native';
import { RankingUser } from '../RankingListItem/RankingListItem.types';

export type RankingFilter = 'all' | 'friends' | 'class';

export type RankingPeriod = 'week' | 'month' | 'all';

export interface RankingData {
  user: RankingUser & {
    isFriend?: boolean;
    classId?: string;
  };
  score: number;
  change?: number;
  position?: number;
  period?: RankingPeriod;
}

export interface RankingListProps {
  /** Array of ranking data */
  rankings: RankingData[];
  
  /** Current user ID for highlighting */
  currentUserId?: string;
  
  /** List title */
  title?: string;
  
  /** List subtitle */
  subtitle?: string;
  
  /** Show filter buttons */
  showFilters?: boolean;
  
  /** Show period filter */
  showPeriodFilter?: boolean;
  
  /** Enable search functionality */
  enableSearch?: boolean;
  
  /** Enable haptic feedback */
  enableHaptics?: boolean;
  
  /** Animation delay between items (ms) */
  itemAnimationDelay?: number;
  
  /** User press handler */
  onUserPress?: (item: RankingData, index: number) => void;
  
  /** Theme variant */
  theme?: 'light' | 'dark';
  
  /** Custom container styles */
  style?: ViewStyle;
  
  /** Test ID for automation */
  testID?: string;
}

export interface RankingListStyles {
  container: ViewStyle;
  listContent: ViewStyle;
  header: ViewStyle;
  titleSection: ViewStyle;
  title: ViewStyle;
  subtitle: ViewStyle;
  filtersSection: ViewStyle;
  filterRow: ViewStyle;
  emptyContainer: ViewStyle;
  emptyIcon: ViewStyle;
  emptyTitle: ViewStyle;
  emptySubtitle: ViewStyle;
}