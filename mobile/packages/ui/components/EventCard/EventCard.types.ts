/**
 * EventCard Component Types
 * Harry School Mobile Design System
 */

import { ReactNode } from 'react';
import { ViewStyle, ImageSourcePropType } from 'react-native';

export type EventStatus = 'upcoming' | 'active' | 'completed' | 'cancelled' | 'live';

export type EventType = 'lesson' | 'homework' | 'test' | 'project' | 'meeting' | 'event' | 'break';

export type EventPriority = 'low' | 'normal' | 'high' | 'urgent';

export type EventSize = 'compact' | 'default' | 'large';

export interface EventProgress {
  current: number;
  total: number;
  color?: string;
}

export interface EventImage {
  source: ImageSourcePropType;
  alt: string;
  aspectRatio?: number;
}

export interface EventCardProps {
  /** Event title */
  title: string;
  
  /** Event subtitle or description */
  subtitle?: string;
  
  /** Event time (e.g., "10:00 AM") */
  time: string;
  
  /** Event duration (e.g., "45 min") */
  duration?: string;
  
  /** Event status */
  status?: EventStatus;
  
  /** Event type for icon and color */
  type?: EventType;
  
  /** Custom color override */
  color?: string;
  
  /** Event image */
  image?: EventImage;
  
  /** Custom icon override */
  icon?: ReactNode | string;
  
  /** Progress information */
  progress?: EventProgress;
  
  /** Number of attendees */
  attendees?: number;
  
  /** Event location */
  location?: string;
  
  /** Event description */
  description?: string;
  
  /** Event priority level */
  priority?: EventPriority;
  
  /** Whether event is currently live */
  isLive?: boolean;
  
  /** Whether event has notifications */
  hasNotification?: boolean;
  
  /** Press handler */
  onPress?: () => void;
  
  /** Long press handler */
  onLongPress?: () => void;
  
  /** Enable haptic feedback */
  enableHaptics?: boolean;
  
  /** Show golden border effect */
  showGoldenBorder?: boolean;
  
  /** Theme variant */
  theme?: 'light' | 'dark';
  
  /** Card size */
  size?: EventSize;
  
  /** Whether card is interactive */
  interactive?: boolean;
  
  /** Custom container styles */
  style?: ViewStyle;
  
  /** Test ID for automation */
  testID?: string;
}

export interface EventCardStyles {
  container: ViewStyle;
  header: ViewStyle;
  headerLeft: ViewStyle;
  headerRight: ViewStyle;
  iconContainer: ViewStyle;
  iconText: ViewStyle;
  priorityIndicator: ViewStyle;
  statusBadge: ViewStyle;
  statusText: ViewStyle;
  liveIndicator: ViewStyle;
  liveDot: ViewStyle;
  liveText: ViewStyle;
  notificationIndicator: ViewStyle;
  notificationIcon: ViewStyle;
  content: ViewStyle;
  title: ViewStyle;
  subtitle: ViewStyle;
  timeRow: ViewStyle;
  time: ViewStyle;
  duration: ViewStyle;
  location: ViewStyle;
  attendees: ViewStyle;
  footer: ViewStyle;
  progressContainer: ViewStyle;
  progressBackground: ViewStyle;
  progressFill: ViewStyle;
  progressText: ViewStyle;
}