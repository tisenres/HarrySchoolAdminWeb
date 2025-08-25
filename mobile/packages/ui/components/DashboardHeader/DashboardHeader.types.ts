/**
 * DashboardHeader Component Types
 * Harry School Mobile Design System
 */

import { ReactNode } from 'react';
import { ViewStyle } from 'react-native';

export interface User {
  id: string;
  name: string;
  avatar: string;
  level?: number;
  coins?: number;
  streak?: number;
  email?: string;
  role?: 'student' | 'teacher' | 'admin';
}

export interface CustomAction {
  id: string;
  icon: ReactNode;
  label: string;
  onPress: () => void;
}

export interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  color?: string;
  textColor?: string;
  showZero?: boolean;
}

export interface DashboardHeaderProps {
  /** User information to display */
  user: User;
  
  /** Number of unread notifications */
  notifications?: number;
  
  /** Callback when profile is pressed */
  onProfilePress?: () => void;
  
  /** Callback when notifications are pressed */
  onNotificationsPress?: () => void;
  
  /** Whether to show level information */
  showLevel?: boolean;
  
  /** Whether to show coins count */
  showCoins?: boolean;
  
  /** Whether to show streak count */
  showStreak?: boolean;
  
  /** Level progress (0-1 for current level, >1 for level + progress) */
  levelProgress?: number;
  
  /** Online status indicator */
  isOnline?: boolean;
  
  /** Custom greeting text (overrides auto-generated greeting) */
  greeting?: string;
  
  /** Custom action buttons (max 2) */
  customActions?: CustomAction[];
  
  /** Enable haptic feedback */
  enableHaptics?: boolean;
  
  /** Theme variant */
  theme?: 'light' | 'dark';
  
  /** Custom container styles */
  style?: ViewStyle;
  
  /** Test ID for automation */
  testID?: string;
}

export interface DashboardHeaderStyles {
  container: ViewStyle;
  headerRow: ViewStyle;
  profileSection: ViewStyle;
  avatarContainer: ViewStyle;
  avatar: ViewStyle;
  onlineIndicator: ViewStyle;
  userInfo: ViewStyle;
  greetingText: ViewStyle;
  levelContainer: ViewStyle;
  levelText: ViewStyle;
  progressBackground: ViewStyle;
  progressFill: ViewStyle;
  actionsSection: ViewStyle;
  statsRow: ViewStyle;
  statItem: ViewStyle;
  statEmoji: ViewStyle;
  statValue: ViewStyle;
  customActionsContainer: ViewStyle;
  customActionButton: ViewStyle;
  notificationButton: ViewStyle;
  notificationIcon: ViewStyle;
  notificationBadge: ViewStyle;
  notificationText: ViewStyle;
}