/**
 * ServiceCard Component Types
 * Harry School Mobile Design System
 */

import { ViewStyle } from 'react-native';

export type ServiceVariant = 'default' | 'outlined' | 'gradient';

export interface ServiceCardProps {
  /** Service title */
  title: string;
  
  /** Service description */
  description?: string;
  
  /** Service icon (emoji or icon) */
  icon: string;
  
  /** Badge text */
  badge?: string;
  
  /** Whether service is available */
  isAvailable?: boolean;
  
  /** Whether service is popular */
  isPopular?: boolean;
  
  /** Press handler */
  onPress?: () => void;
  
  /** Enable haptic feedback */
  enableHaptics?: boolean;
  
  /** Theme variant */
  theme?: 'light' | 'dark';
  
  /** Card variant */
  variant?: ServiceVariant;
  
  /** Custom container styles */
  style?: ViewStyle;
  
  /** Test ID for automation */
  testID?: string;
}

export interface ServiceCardStyles {
  container: ViewStyle;
  badge: ViewStyle;
  badgeText: ViewStyle;
  iconContainer: ViewStyle;
  icon: ViewStyle;
  content: ViewStyle;
  title: ViewStyle;
  description: ViewStyle;
  unavailableOverlay: ViewStyle;
  unavailableText: ViewStyle;
}