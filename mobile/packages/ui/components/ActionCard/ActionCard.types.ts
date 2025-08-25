/**
 * ActionCard Component Types
 * Harry School Mobile Design System
 */

import { ViewStyle } from 'react-native';

export type ActionSize = 'small' | 'default' | 'large';

export type ActionVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info' 
  | 'gold' 
  | 'outline';

export interface ActionBadge {
  text: string;
  color?: string;
  textColor?: string;
}

export interface ActionCardProps {
  /** Primary title text */
  title: string;
  
  /** Secondary subtitle text */
  subtitle?: string;
  
  /** Detailed description text */
  description?: string;
  
  /** Icon (emoji or icon component) */
  icon?: string;
  
  /** Badge overlay */
  badge?: ActionBadge;
  
  /** Card size */
  size?: ActionSize;
  
  /** Visual variant */
  variant?: ActionVariant;
  
  /** Take full width of container */
  fullWidth?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Loading state */
  loading?: boolean;
  
  /** Progress value (0-1) */
  progress?: number;
  
  /** Press handler */
  onPress?: () => void;
  
  /** Long press handler */
  onLongPress?: () => void;
  
  /** Enable haptic feedback */
  enableHaptics?: boolean;
  
  /** Enable pulse animation */
  enablePulse?: boolean;
  
  /** Enable glow effect on press */
  glowEffect?: boolean;
  
  /** Theme variant */
  theme?: 'light' | 'dark';
  
  /** Custom gradient colors */
  customGradient?: string[];
  
  /** Custom container styles */
  style?: ViewStyle;
  
  /** Test ID for automation */
  testID?: string;
}

export interface ActionCardStyles {
  container: ViewStyle;
  content: ViewStyle;
  iconContainer: ViewStyle;
  icon: ViewStyle;
  textContainer: ViewStyle;
  title: ViewStyle;
  subtitle: ViewStyle;
  description: ViewStyle;
  badge: ViewStyle;
  badgeText: ViewStyle;
  progressContainer: ViewStyle;
  progressBackground: ViewStyle;
  progressFill: ViewStyle;
  loadingContainer: ViewStyle;
  loadingSpinner: ViewStyle;
}