/**
 * EventCardsSlider Component Types
 * Harry School Mobile Design System
 */

import { ReactNode } from 'react';
import { ViewStyle } from 'react-native';
import { EventCardProps, EventSize } from '../EventCard/EventCard.types';

export interface EventData extends Omit<EventCardProps, 'onPress' | 'onLongPress' | 'size' | 'theme' | 'style' | 'testID'> {
  id: string;
}

export interface ScrollIndicatorProps {
  totalItems: number;
  currentIndex: number;
  indicatorColor?: string;
  inactiveColor?: string;
  theme?: 'light' | 'dark';
}

export interface EventCardsSliderProps {
  /** Array of events to display */
  events: EventData[];
  
  /** Section title */
  title?: string;
  
  /** Section subtitle */
  subtitle?: string;
  
  /** Size of individual cards */
  cardSize?: EventSize;
  
  /** Theme for individual cards */
  cardTheme?: 'light' | 'dark';
  
  /** Show scroll position indicator */
  showScrollIndicator?: boolean;
  
  /** Show golden borders on special cards */
  showGoldenBorders?: boolean;
  
  /** Enable snap to interval scrolling */
  snapToInterval?: boolean;
  
  /** Enable haptic feedback */
  enableHaptics?: boolean;
  
  /** Horizontal padding for content */
  contentPadding?: number;
  
  /** Spacing between cards */
  cardSpacing?: number;
  
  /** Event press handler */
  onEventPress?: (event: EventData, index: number) => void;
  
  /** Event long press handler */
  onEventLongPress?: (event: EventData, index: number) => void;
  
  /** Scroll end handler */
  onScrollEnd?: (index: number) => void;
  
  /** Custom empty state component */
  emptyState?: ReactNode;
  
  /** Theme variant */
  theme?: 'light' | 'dark';
  
  /** Custom container styles */
  style?: ViewStyle;
  
  /** Test ID for automation */
  testID?: string;
}

export interface EventCardsSliderStyles {
  container: ViewStyle;
  header: ViewStyle;
  title: ViewStyle;
  subtitle: ViewStyle;
  scrollView: ViewStyle;
  indicatorContainer: ViewStyle;
  indicator: ViewStyle;
  emptyContainer: ViewStyle;
  emptyIcon: ViewStyle;
  emptyTitle: ViewStyle;
  emptySubtitle: ViewStyle;
}