/**
 * RankingListItem Component Types
 * Harry School Mobile Design System
 */

import { ViewStyle } from 'react-native';

export interface RankingUser {
  id: string;
  name: string;
  avatar: string;
  level?: number;
  isOnline?: boolean;
}

export interface RankingPosition {
  color: string;
  icon: string;
  gradient: string[];
  textColor: string;
}

export interface RankingListItemProps {
  /** User's position in ranking */
  position: number;
  
  /** User information */
  user: RankingUser;
  
  /** User's score */
  score: number;
  
  /** Position change (+/- number) */
  change?: number;
  
  /** Whether this is the current user */
  isCurrentUser?: boolean;
  
  /** Show user avatar */
  showAvatar?: boolean;
  
  /** Show position change indicator */
  showChange?: boolean;
  
  /** Show score */
  showScore?: boolean;
  
  /** Animation delay in milliseconds */
  animationDelay?: number;
  
  /** Enable haptic feedback */
  enableHaptics?: boolean;
  
  /** Theme variant */
  theme?: 'light' | 'dark';
  
  /** Test ID for automation */
  testID?: string;
}

export interface RankingListItemStyles {
  container: ViewStyle;
  topPositionBadge: ViewStyle;
  topPositionIcon: ViewStyle;
  topPositionText: ViewStyle;
  positionBadge: ViewStyle;
  positionText: ViewStyle;
  avatarContainer: ViewStyle;
  avatar: ViewStyle;
  onlineIndicator: ViewStyle;
  userInfo: ViewStyle;
  userName: ViewStyle;
  userLevel: ViewStyle;
  scoreContainer: ViewStyle;
  score: ViewStyle;
  scoreLabel: ViewStyle;
  changeContainer: ViewStyle;
  changeIcon: ViewStyle;
  changeText: ViewStyle;
  currentUserIndicator: ViewStyle;
  currentUserText: ViewStyle;
}