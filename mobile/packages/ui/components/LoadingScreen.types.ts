/**
 * LoadingScreen Component Type Definitions
 * Harry School Mobile Design System
 * 
 * Comprehensive TypeScript definitions for LoadingScreen variants and educational content
 */

import { ReactNode } from 'react';
import { ViewStyle, TextStyle } from 'react-native';

export type LoadingType = 
  | 'spinner' 
  | 'progress' 
  | 'skeleton' 
  | 'educational';

export type SkeletonVariant = 
  | 'text' 
  | 'card' 
  | 'list' 
  | 'avatar' 
  | 'custom';

export type EducationalContentType = 
  | 'vocabulary' 
  | 'tips' 
  | 'motivation' 
  | 'lesson-preview';

export interface VocabularyItem {
  word: string;
  translation: string;
  pronunciation?: string;
  example?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface LearningTip {
  title: string;
  content: string;
  icon?: string;
  category?: 'grammar' | 'vocabulary' | 'speaking' | 'listening' | 'writing';
}

export interface MotivationalMessage {
  message: string;
  author?: string;
  category?: 'persistence' | 'growth' | 'achievement' | 'learning';
}

export interface LessonPreview {
  title: string;
  description: string;
  estimatedTime: number; // minutes
  skills: string[];
}

export interface EducationalContent {
  type: EducationalContentType;
  vocabulary?: VocabularyItem[];
  tips?: LearningTip[];
  motivationalMessages?: MotivationalMessage[];
  lessonPreviews?: LessonPreview[];
  rotationInterval?: number; // milliseconds
}

export interface ProgressConfig {
  /** Current progress percentage (0-100) */
  progress: number;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Show estimated time remaining */
  showTimeRemaining?: boolean;
  /** Estimated time in minutes */
  estimatedTime?: number;
  /** Custom progress color */
  progressColor?: string;
  /** Track color for progress bar */
  trackColor?: string;
  /** Progress bar thickness */
  thickness?: number;
  /** Indeterminate progress (animated) */
  indeterminate?: boolean;
}

export interface SkeletonConfig {
  /** Skeleton variant */
  variant: SkeletonVariant;
  /** Number of skeleton items */
  count?: number;
  /** Custom skeleton shapes */
  customShapes?: Array<{
    width: number | string;
    height: number;
    borderRadius?: number;
    marginBottom?: number;
  }>;
  /** Animation duration */
  animationDuration?: number;
  /** Skeleton opacity range */
  opacityRange?: [number, number];
}

export interface CancellationConfig {
  /** Enable cancel button */
  enabled: boolean;
  /** Cancel button text */
  text?: string;
  /** Cancel button callback */
  onCancel: () => void;
  /** Show cancel after delay (ms) */
  showAfterDelay?: number;
  /** Cancel button style variant */
  variant?: 'text' | 'outline' | 'ghost';
}

export interface BackdropConfig {
  /** Show backdrop overlay */
  enabled?: boolean;
  /** Backdrop opacity */
  opacity?: number;
  /** Backdrop color */
  color?: string;
  /** Allow tap to dismiss */
  dismissible?: boolean;
  /** Callback when backdrop is tapped */
  onBackdropPress?: () => void;
  /** Blur effect intensity */
  blurIntensity?: number;
}

export interface AccessibilityConfig {
  /** Loading description for screen readers */
  loadingDescription?: string;
  /** Progress announcements frequency */
  announceProgressEvery?: number; // percentage points
  /** Custom accessibility labels */
  labels?: {
    progress?: string;
    cancel?: string;
    educational?: string;
  };
  /** Reduce motion preference */
  respectReducedMotion?: boolean;
}

export interface LoadingScreenStyleProps {
  /** Container style overrides */
  style?: ViewStyle;
  /** Content container style */
  contentStyle?: ViewStyle;
  /** Title text style */
  titleStyle?: TextStyle;
  /** Description text style */
  descriptionStyle?: TextStyle;
  /** Educational content container style */
  educationalStyle?: ViewStyle;
  /** Progress indicator style */
  progressStyle?: ViewStyle;
  /** Cancel button style */
  cancelButtonStyle?: ViewStyle;
}

export interface LoadingScreenProps extends LoadingScreenStyleProps {
  /** Loading type */
  type: LoadingType;
  
  /** Visibility control */
  visible: boolean;
  
  /** Loading title */
  title?: string;
  
  /** Loading description */
  description?: string;
  
  /** Progress configuration (for progress type) */
  progressConfig?: ProgressConfig;
  
  /** Skeleton configuration (for skeleton type) */
  skeletonConfig?: SkeletonConfig;
  
  /** Educational content (for educational type) */
  educationalContent?: EducationalContent;
  
  /** Cancellation configuration */
  cancellation?: CancellationConfig;
  
  /** Backdrop configuration */
  backdrop?: BackdropConfig;
  
  /** Accessibility configuration */
  accessibility?: AccessibilityConfig;
  
  /** Theme variant override */
  variant?: 'teacher' | 'student';
  
  /** Custom spinner size */
  spinnerSize?: 'small' | 'medium' | 'large';
  
  /** Custom spinner color */
  spinnerColor?: string;
  
  /** Animation configuration */
  animation?: {
    duration?: number;
    easing?: string;
    delay?: number;
  };
  
  /** Test ID for testing */
  testID?: string;
}

// Internal component interfaces
export interface SpinnerProps {
  size: 'small' | 'medium' | 'large';
  color?: string;
  style?: ViewStyle;
}

export interface ProgressIndicatorProps {
  config: ProgressConfig;
  style?: ViewStyle;
}

export interface SkeletonLoaderProps {
  config: SkeletonConfig;
  style?: ViewStyle;
}

export interface EducationalContentProps {
  content: EducationalContent;
  variant: 'teacher' | 'student';
  style?: ViewStyle;
}

export interface CancelButtonProps {
  config: CancellationConfig;
  visible: boolean;
  style?: ViewStyle;
}

// Animation configuration types
export interface LoadingAnimationConfig {
  fadeIn: {
    duration: number;
    delay: number;
  };
  spinner: {
    duration: number;
    iterations: number;
  };
  progress: {
    duration: number;
    easing: string;
  };
  skeleton: {
    duration: number;
    opacityRange: [number, number];
  };
  educational: {
    rotationDuration: number;
    transitionDuration: number;
  };
}

// Theme-specific configurations
export interface LoadingScreenThemeConfig {
  colors: {
    backdrop: string;
    text: {
      primary: string;
      secondary: string;
    };
    spinner: string;
    progress: {
      fill: string;
      track: string;
    };
    skeleton: {
      base: string;
      highlight: string;
    };
  };
  spacing: {
    container: number;
    content: number;
    educational: number;
  };
  typography: {
    title: TextStyle;
    description: TextStyle;
    educational: TextStyle;
  };
  animations: LoadingAnimationConfig;
}

// Utility types
export type LoadingScreenVariant = 'teacher' | 'student' | 'minimal';
export type LoadingScreenSize = 'compact' | 'standard' | 'full';
export type LoadingScreenPosition = 'center' | 'top' | 'bottom';