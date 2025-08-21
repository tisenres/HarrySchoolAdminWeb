/**
 * EmptyState Component Type Definitions
 * Harry School Mobile Design System
 * 
 * Comprehensive TypeScript definitions for EmptyState variants and educational context
 */

import { ReactNode } from 'react';
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

export type EmptyStateVariant = 
  | 'no-data' 
  | 'error' 
  | 'offline' 
  | 'first-time' 
  | 'achievement' 
  | 'search' 
  | 'maintenance' 
  | 'permission';

export type EmptyStateSize = 
  | 'compact'     // In-card, small spaces
  | 'standard'    // Default size
  | 'full-screen' // Full screen coverage
  | 'modal';      // Modal content

export type ActionButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'outline' 
  | 'ghost' 
  | 'link';

export type IllustrationVariant = 
  | 'icon' 
  | 'image' 
  | 'lottie' 
  | 'custom' 
  | 'none';

export interface EmptyStateAction {
  /** Action button text */
  text: string;
  /** Action callback */
  onPress: () => void;
  /** Button variant */
  variant?: ActionButtonVariant;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Icon for button */
  icon?: ReactNode | string;
  /** Icon position */
  iconPosition?: 'leading' | 'trailing';
  /** Test ID for testing */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export interface IllustrationConfig {
  /** Illustration type */
  type: IllustrationVariant;
  /** Icon name or component for icon type */
  icon?: ReactNode | string;
  /** Icon size for icon type */
  iconSize?: number;
  /** Icon color */
  iconColor?: string;
  /** Image source for image type */
  imageSource?: any;
  /** Lottie animation source */
  lottieSource?: any;
  /** Custom illustration component */
  customComponent?: ReactNode;
  /** Illustration style overrides */
  style?: ViewStyle | ImageStyle;
  /** Animation configuration */
  animation?: {
    enabled: boolean;
    duration?: number;
    loop?: boolean;
    autoPlay?: boolean;
  };
}

export interface EducationalContext {
  /** User type for contextual messaging */
  userType: 'teacher' | 'student';
  /** Subject context for relevant suggestions */
  subject?: 'english' | 'math' | 'science' | 'general';
  /** Current lesson or module context */
  context?: string;
  /** Student level for age-appropriate messaging */
  level?: 'beginner' | 'intermediate' | 'advanced';
  /** Show motivational elements */
  showMotivation?: boolean;
  /** Custom motivational message */
  motivationalMessage?: string;
}

export interface RefreshConfig {
  /** Enable pull-to-refresh */
  enabled: boolean;
  /** Refresh callback */
  onRefresh: () => Promise<void>;
  /** Loading state */
  refreshing: boolean;
  /** Custom refresh colors */
  colors?: string[];
  /** Refresh progress bar color */
  progressBackgroundColor?: string;
  /** Pull distance required to trigger refresh */
  progressViewOffset?: number;
}

export interface RetryConfig {
  /** Enable retry functionality */
  enabled: boolean;
  /** Retry callback */
  onRetry: () => void;
  /** Number of retry attempts made */
  attemptCount?: number;
  /** Maximum retry attempts */
  maxAttempts?: number;
  /** Show retry count */
  showAttemptCount?: boolean;
  /** Auto-retry configuration */
  autoRetry?: {
    enabled: boolean;
    delay: number; // milliseconds
    backoffMultiplier?: number;
  };
}

export interface EmptyStateAnimation {
  /** Entrance animation */
  entrance?: {
    type: 'fade' | 'slide' | 'scale' | 'bounce';
    duration?: number;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
  };
  /** Illustration animation */
  illustration?: {
    enabled: boolean;
    type: 'bounce' | 'float' | 'rotate' | 'pulse' | 'custom';
    duration?: number;
    loop?: boolean;
  };
  /** Button hover animations */
  buttonHover?: {
    enabled: boolean;
    scale?: number;
    duration?: number;
  };
}

export interface EmptyStateAccessibility {
  /** Main heading role */
  headingRole?: 'header' | 'heading';
  /** Heading level for screen readers */
  headingLevel?: number;
  /** Custom accessibility label */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
  /** Focus management */
  autoFocus?: boolean;
  /** Screen reader announcements */
  announcements?: {
    onShow?: string;
    onError?: string;
    onRetry?: string;
  };
}

export interface EmptyStateContent {
  /** Primary title text */
  title: string;
  /** Secondary description text */
  description?: string;
  /** Additional details or help text */
  details?: string;
  /** Custom title component */
  customTitle?: ReactNode;
  /** Custom description component */
  customDescription?: ReactNode;
  /** Show branded content */
  showBranding?: boolean;
  /** Branded message */
  brandMessage?: string;
}

export interface EmptyStateStyleProps {
  /** Container style overrides */
  style?: ViewStyle;
  /** Content container style */
  contentStyle?: ViewStyle;
  /** Illustration container style */
  illustrationStyle?: ViewStyle;
  /** Title text style */
  titleStyle?: TextStyle;
  /** Description text style */
  descriptionStyle?: TextStyle;
  /** Details text style */
  detailsStyle?: TextStyle;
  /** Actions container style */
  actionsStyle?: ViewStyle;
  /** Action button style */
  actionButtonStyle?: ViewStyle;
}

export interface EmptyStateProps extends EmptyStateStyleProps {
  /** Empty state variant */
  variant: EmptyStateVariant;
  
  /** Empty state size */
  size?: EmptyStateSize;
  
  /** Content configuration */
  content: EmptyStateContent;
  
  /** Illustration configuration */
  illustration?: IllustrationConfig;
  
  /** Primary action button */
  primaryAction?: EmptyStateAction;
  
  /** Secondary action button */
  secondaryAction?: EmptyStateAction;
  
  /** Additional actions (max 2 recommended) */
  additionalActions?: EmptyStateAction[];
  
  /** Educational context for appropriate messaging */
  educationalContext?: EducationalContext;
  
  /** Refresh functionality configuration */
  refresh?: RefreshConfig;
  
  /** Retry functionality configuration */
  retry?: RetryConfig;
  
  /** Animation configuration */
  animation?: EmptyStateAnimation;
  
  /** Accessibility configuration */
  accessibility?: EmptyStateAccessibility;
  
  /** Theme variant override */
  themeVariant?: 'teacher' | 'student' | 'minimal';
  
  /** Show as card with background */
  showCard?: boolean;
  
  /** Card elevation for shadow */
  cardElevation?: 'none' | 'low' | 'medium' | 'high';
  
  /** Test ID for testing */
  testID?: string;
}

// Predefined content configurations
export interface EmptyStatePresets {
  noData: {
    general: EmptyStateContent;
    students: EmptyStateContent;
    teachers: EmptyStateContent;
    lessons: EmptyStateContent;
    assignments: EmptyStateContent;
    vocabulary: EmptyStateContent;
  };
  error: {
    network: EmptyStateContent;
    server: EmptyStateContent;
    auth: EmptyStateContent;
    permission: EmptyStateContent;
    validation: EmptyStateContent;
  };
  offline: {
    general: EmptyStateContent;
    sync: EmptyStateContent;
    download: EmptyStateContent;
  };
  firstTime: {
    teacher: EmptyStateContent;
    student: EmptyStateContent;
    lesson: EmptyStateContent;
    vocabulary: EmptyStateContent;
  };
  achievement: {
    levelUp: EmptyStateContent;
    streak: EmptyStateContent;
    completion: EmptyStateContent;
    perfect: EmptyStateContent;
  };
  search: {
    noResults: EmptyStateContent;
    emptyQuery: EmptyStateContent;
    filtered: EmptyStateContent;
  };
}

// Theme-specific configurations
export interface EmptyStateThemeConfig {
  colors: {
    background: string;
    card: string;
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    icon: {
      primary: string;
      secondary: string;
    };
    accent: string;
    border: string;
  };
  spacing: {
    container: number;
    content: number;
    illustration: number;
    actions: number;
  };
  typography: {
    title: TextStyle;
    description: TextStyle;
    details: TextStyle;
  };
  sizes: {
    compact: {
      illustration: number;
      spacing: number;
    };
    standard: {
      illustration: number;
      spacing: number;
    };
    fullScreen: {
      illustration: number;
      spacing: number;
    };
  };
}

// Internal component interfaces
export interface EmptyStateIllustrationProps {
  config: IllustrationConfig;
  size: EmptyStateSize;
  variant: EmptyStateVariant;
  style?: ViewStyle;
}

export interface EmptyStateContentProps {
  content: EmptyStateContent;
  size: EmptyStateSize;
  educationalContext?: EducationalContext;
  style?: {
    title?: TextStyle;
    description?: TextStyle;
    details?: TextStyle;
  };
}

export interface EmptyStateActionsProps {
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  additionalActions?: EmptyStateAction[];
  size: EmptyStateSize;
  style?: ViewStyle;
  buttonStyle?: ViewStyle;
}

// Utility types
export type EmptyStateContext = 'list' | 'grid' | 'search' | 'filter' | 'page' | 'modal';
export type EmptyStateIntent = 'informational' | 'actionable' | 'encouraging' | 'error';
export type EmptyStateTone = 'professional' | 'friendly' | 'encouraging' | 'apologetic';