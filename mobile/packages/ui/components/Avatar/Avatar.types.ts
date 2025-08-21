/**
 * Avatar Component Type Definitions
 * Harry School Mobile Design System
 * 
 * Comprehensive TypeScript definitions for Avatar sizes, statuses, and roles
 */

import { ReactNode } from 'react';
import { ViewProps, ImageProps, ViewStyle, TextStyle } from 'react-native';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export type UserStatus = 'online' | 'away' | 'busy' | 'offline';

export type UserRole = 'teacher' | 'student' | 'admin' | 'parent' | 'staff';

export interface AvatarImageProps {
  /** Image source (URI or local) */
  source?: ImageProps['source'];
  /** Alternative text for accessibility */
  alt?: string;
  /** Image load error handler */
  onError?: () => void;
  /** Image load success handler */
  onLoad?: () => void;
  /** Custom image style */
  imageStyle?: ViewStyle;
}

export interface AvatarFallbackProps {
  /** User's name for initials generation */
  name?: string;
  /** Custom initials override */
  initials?: string;
  /** Maximum characters for initials */
  maxInitials?: number;
  /** Fallback background color */
  fallbackBackgroundColor?: string;
  /** Fallback text color */
  fallbackTextColor?: string;
  /** Show placeholder icon when no name/initials */
  showPlaceholderIcon?: boolean;
}

export interface AvatarStatusProps {
  /** User's online status */
  status?: UserStatus;
  /** Show status indicator */
  showStatus?: boolean;
  /** Custom status colors */
  statusColors?: Partial<Record<UserStatus, string>>;
  /** Status indicator position */
  statusPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Custom status indicator size */
  statusSize?: number;
  /** Status indicator with border */
  statusBorder?: boolean;
  /** Animated status indicator */
  animatedStatus?: boolean;
}

export interface AvatarRoleProps {
  /** User's role for badge display */
  role?: UserRole;
  /** Show role badge */
  showRole?: boolean;
  /** Custom role colors */
  roleColors?: Partial<Record<UserRole, string>>;
  /** Custom role icons */
  roleIcons?: Partial<Record<UserRole, ReactNode | string>>;
  /** Role badge position */
  rolePosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Custom role badge size */
  roleSize?: number;
  /** Role badge background color */
  roleBadgeColor?: string;
}

export interface AvatarStyleProps extends Omit<ViewProps, 'style'> {
  /** Avatar size determining dimensions */
  size?: AvatarSize;
  /** Custom avatar style */
  style?: ViewStyle;
  /** Custom border radius (overrides size default) */
  borderRadius?: number;
  /** Border width */
  borderWidth?: number;
  /** Border color */
  borderColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Enable shadow/elevation */
  showShadow?: boolean;
  /** Custom shadow configuration */
  shadow?: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

export interface AvatarInteractionProps {
  /** Avatar press handler */
  onPress?: () => void;
  /** Long press handler */
  onLongPress?: () => void;
  /** Make avatar interactive */
  interactive?: boolean;
  /** Enable haptic feedback */
  enableHaptics?: boolean;
  /** Haptic feedback type */
  hapticType?: 'light' | 'medium' | 'heavy';
  /** Enable press animation */
  enablePressAnimation?: boolean;
  /** Press scale factor */
  pressScale?: number;
}

export interface AvatarAccessibilityProps {
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
  /** Accessibility role */
  accessibilityRole?: 'button' | 'image' | 'none';
  /** Include status in accessibility label */
  includeStatusInLabel?: boolean;
  /** Include role in accessibility label */
  includeRoleInLabel?: boolean;
}

export interface AvatarAnimationProps {
  /** Enable all animations */
  enableAnimations?: boolean;
  /** Animation duration override */
  animationDuration?: number;
  /** Disable animations (accessibility) */
  disableAnimations?: boolean;
  /** Entrance animation type */
  entranceAnimation?: 'fade' | 'scale' | 'none';
  /** Status change animation */
  statusChangeAnimation?: boolean;
}

export interface AvatarBadgeProps {
  /** Notification badge */
  badge?: {
    count?: number;
    showZero?: boolean;
    maxCount?: number;
    color?: string;
    textColor?: string;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  };
  /** Custom badge content */
  customBadge?: ReactNode;
  /** Achievement badge */
  achievementBadge?: {
    type: 'gold' | 'silver' | 'bronze';
    icon?: ReactNode;
    animated?: boolean;
  };
}

export interface AvatarProps
  extends AvatarStyleProps,
          AvatarImageProps,
          AvatarFallbackProps,
          AvatarStatusProps,
          AvatarRoleProps,
          AvatarInteractionProps,
          AvatarAccessibilityProps,
          AvatarAnimationProps,
          AvatarBadgeProps {
  /** Test ID for testing */
  testID?: string;
  /** Avatar group context */
  isInGroup?: boolean;
  /** Group overlap offset */
  groupOffset?: number;
}

// Component configuration interfaces
export interface AvatarDimensions {
  size: number;
  fontSize: number;
  borderRadius: number;
  borderWidth: number;
  statusSize: number;
  roleSize: number;
  badgeSize: number;
}

export interface AvatarColors {
  background: string;
  border: string;
  text: string;
  placeholder: string;
  status: Record<UserStatus, string>;
  role: Record<UserRole, string>;
}

export interface AvatarShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

// Status indicator configuration
export interface StatusIndicatorConfig {
  size: number;
  borderWidth: number;
  borderColor: string;
  colors: Record<UserStatus, string>;
  animations: {
    online: {
      type: 'none' | 'pulse';
      duration?: number;
    };
    away: {
      type: 'none' | 'fade';
      duration?: number;
    };
    busy: {
      type: 'none' | 'pulse';
      duration?: number;
    };
    offline: {
      type: 'none';
    };
  };
}

// Role badge configuration
export interface RoleBadgeConfig {
  size: number;
  backgroundColor: string;
  borderWidth: number;
  borderColor: string;
  colors: Record<UserRole, string>;
  icons: Record<UserRole, string>;
}

// Theme-specific configurations
export interface AvatarThemeConfig {
  teacher: {
    defaultSize: AvatarSize;
    showShadow: boolean;
    animationsEnabled: boolean;
    defaultRole: UserRole;
  };
  student: {
    defaultSize: AvatarSize;
    showShadow: boolean;
    animationsEnabled: boolean;
    defaultRole: UserRole;
    achievementBadgesEnabled: boolean;
  };
}

// Avatar group configuration
export interface AvatarGroupConfig {
  maxVisible: number;
  overlapOffset: number;
  showMoreIndicator: boolean;
  moreIndicatorStyle: ViewStyle;
  spacing: number;
}

// Animation configuration
export interface AvatarAnimationConfig {
  entrance: {
    fade: { duration: number; delay?: number };
    scale: { duration: number; delay?: number; initialScale: number };
  };
  press: {
    scale: number;
    duration: number;
  };
  status: {
    changeDuration: number;
    pulseScale: number;
    pulseDuration: number;
  };
}

// Export utility types
export type AvatarSizeConfig = {
  [K in AvatarSize]: AvatarDimensions;
};

export type AvatarVariantConfig = {
  default: {
    colors: AvatarColors;
    shadow: AvatarShadow;
  };
};

// Fallback generation utility types
export interface FallbackGenerationConfig {
  backgroundColors: string[];
  hashFunction: (input: string) => number;
  initialsExtraction: {
    maxLength: number;
    separator: string;
    capitalize: boolean;
  };
}

// Educational context types
export interface EducationalAvatarData {
  studentId?: string;
  teacherId?: string;
  grade?: string;
  subject?: string;
  achievementLevel?: number;
  attendanceRate?: number;
  lastSeen?: Date;
}

// Avatar group component types
export interface AvatarGroupProps {
  /** Array of avatar data */
  avatars: (Omit<AvatarProps, 'size' | 'isInGroup'> & { id: string })[];
  /** Size for all avatars in group */
  size?: AvatarSize;
  /** Maximum number of avatars to show */
  maxVisible?: number;
  /** Overlap offset between avatars */
  overlapOffset?: number;
  /** Show count of additional avatars */
  showMoreCount?: boolean;
  /** More count style */
  moreCountStyle?: ViewStyle;
  /** Container style */
  containerStyle?: ViewStyle;
  /** On more avatars press */
  onMorePress?: (hiddenCount: number) => void;
  /** Test ID */
  testID?: string;
}