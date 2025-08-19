/**
 * Harry School Mobile Design System - Spacing System
 * 
 * Comprehensive spacing system optimized for mobile touch interfaces
 */

import { spacing as spacingTokens, touchTargets } from './tokens';

// Component-specific spacing configurations
export const componentSpacing = {
  // Button spacing
  button: {
    paddingHorizontal: {
      small: spacingTokens.sm,
      medium: spacingTokens.md,
      large: spacingTokens.lg,
    },
    paddingVertical: {
      small: spacingTokens.xs,
      medium: spacingTokens.sm,
      large: spacingTokens.md,
    },
    marginBetween: spacingTokens.sm,
  },
  
  // Card spacing
  card: {
    padding: spacingTokens.md,
    paddingLarge: spacingTokens.lg,
    margin: spacingTokens.sm,
    marginLarge: spacingTokens.md,
    borderRadius: spacingTokens.sm,
  },
  
  // Form elements spacing
  form: {
    fieldSpacing: spacingTokens.md,
    labelMargin: spacingTokens.xs,
    inputPadding: spacingTokens.sm,
    sectionSpacing: spacingTokens.xl,
  },
  
  // List and grid spacing
  list: {
    itemSpacing: spacingTokens.sm,
    itemPadding: spacingTokens.md,
    sectionHeaderSpacing: spacingTokens.lg,
  },
  
  // Modal and overlay spacing
  modal: {
    padding: spacingTokens.lg,
    margin: spacingTokens.md,
    headerSpacing: spacingTokens.xl,
  },
};

// Educational content spacing
export const educationalSpacing = {
  // Lesson content
  lesson: {
    titleMargin: spacingTokens.lg,
    contentPadding: spacingTokens.md,
    sectionSpacing: spacingTokens.xl,
    paragraphSpacing: spacingTokens.md,
  },
  
  // Vocabulary cards
  vocabulary: {
    cardPadding: spacingTokens.lg,
    wordSpacing: spacingTokens.sm,
    definitionSpacing: spacingTokens.md,
    exampleSpacing: spacingTokens.sm,
  },
  
  // Rankings and leaderboards
  ranking: {
    itemSpacing: spacingTokens.md,
    positionPadding: spacingTokens.sm,
    badgeMargin: spacingTokens.xs,
  },
  
  // Task and assignment layouts
  task: {
    headerSpacing: spacingTokens.lg,
    contentPadding: spacingTokens.md,
    actionSpacing: spacingTokens.xl,
    optionSpacing: spacingTokens.sm,
  },
  
  // Dashboard widgets
  dashboard: {
    widgetPadding: spacingTokens.md,
    widgetMargin: spacingTokens.sm,
    sectionSpacing: spacingTokens.lg,
  },
};

// Touch target spacing (accessibility-focused)
export const touchTargetSpacing = {
  // Minimum touch target sizes
  minimum: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    margin: spacingTokens.xs, // 4px minimum between targets
  },
  
  // Recommended touch target sizes
  recommended: {
    width: touchTargets.recommended,
    height: touchTargets.recommended,
    margin: spacingTokens.sm, // 8px for better separation
  },
  
  // Large touch targets for primary actions
  large: {
    width: touchTargets.large,
    height: touchTargets.large,
    margin: spacingTokens.md, // 16px for generous spacing
  },
  
  // Extra large for critical actions
  extraLarge: {
    width: touchTargets.extraLarge,
    height: touchTargets.extraLarge,
    margin: spacingTokens.lg, // 24px for maximum separation
  },
};

// Responsive spacing for different screen sizes
export const responsiveSpacing = {
  // Small screens (phones in portrait)
  small: {
    containerPadding: spacingTokens.md,
    sectionSpacing: spacingTokens.lg,
    contentMargin: spacingTokens.sm,
  },
  
  // Medium screens (phones in landscape, small tablets)
  medium: {
    containerPadding: spacingTokens.lg,
    sectionSpacing: spacingTokens.xl,
    contentMargin: spacingTokens.md,
  },
  
  // Large screens (tablets)
  large: {
    containerPadding: spacingTokens.xl,
    sectionSpacing: spacingTokens['2xl'],
    contentMargin: spacingTokens.lg,
  },
};

// Grid system spacing
export const gridSpacing = {
  // Column gutters
  gutters: {
    small: spacingTokens.sm,
    medium: spacingTokens.md,
    large: spacingTokens.lg,
  },
  
  // Container margins
  containers: {
    mobile: spacingTokens.md,
    tablet: spacingTokens.lg,
    desktop: spacingTokens.xl,
  },
  
  // Grid item spacing
  items: {
    tight: spacingTokens.xs,
    normal: spacingTokens.sm,
    loose: spacingTokens.md,
    extraLoose: spacingTokens.lg,
  },
};

// Safe area spacing for mobile devices
export const safeAreaSpacing = {
  // iOS safe areas
  ios: {
    top: 44, // Status bar + navigation
    bottom: 34, // Home indicator
    sides: 0,
  },
  
  // Android safe areas
  android: {
    top: 24, // Status bar
    bottom: 0,
    sides: 0,
  },
  
  // Generic safe area fallbacks
  fallback: {
    top: spacingTokens.lg,
    bottom: spacingTokens.md,
    sides: spacingTokens.md,
  },
};

// Utility functions for spacing
export const getSpacing = (size: keyof typeof spacingTokens | number): number => {
  if (typeof size === 'number') return size;
  return spacingTokens[size] || 0;
};

export const getResponsiveSpacing = (
  screenWidth: number,
  spacingType: keyof typeof responsiveSpacing.small
): number => {
  if (screenWidth < 480) {
    return responsiveSpacing.small[spacingType];
  } else if (screenWidth < 768) {
    return responsiveSpacing.medium[spacingType];
  } else {
    return responsiveSpacing.large[spacingType];
  }
};

export const getTouchTargetSpacing = (
  variant: 'minimum' | 'recommended' | 'large' | 'extraLarge' = 'recommended'
) => {
  return touchTargetSpacing[variant];
};

// Spacing utilities for common patterns
export const spacingUtils = {
  // Stack spacing (vertical layout)
  stack: (gap: keyof typeof spacingTokens = 'md') => ({
    gap: spacingTokens[gap],
  }),
  
  // Inline spacing (horizontal layout)
  inline: (gap: keyof typeof spacingTokens = 'sm') => ({
    gap: spacingTokens[gap],
  }),
  
  // Padding shortcuts
  padding: {
    all: (size: keyof typeof spacingTokens) => ({
      padding: spacingTokens[size],
    }),
    horizontal: (size: keyof typeof spacingTokens) => ({
      paddingHorizontal: spacingTokens[size],
    }),
    vertical: (size: keyof typeof spacingTokens) => ({
      paddingVertical: spacingTokens[size],
    }),
    top: (size: keyof typeof spacingTokens) => ({
      paddingTop: spacingTokens[size],
    }),
    bottom: (size: keyof typeof spacingTokens) => ({
      paddingBottom: spacingTokens[size],
    }),
    left: (size: keyof typeof spacingTokens) => ({
      paddingLeft: spacingTokens[size],
    }),
    right: (size: keyof typeof spacingTokens) => ({
      paddingRight: spacingTokens[size],
    }),
  },
  
  // Margin shortcuts
  margin: {
    all: (size: keyof typeof spacingTokens) => ({
      margin: spacingTokens[size],
    }),
    horizontal: (size: keyof typeof spacingTokens) => ({
      marginHorizontal: spacingTokens[size],
    }),
    vertical: (size: keyof typeof spacingTokens) => ({
      marginVertical: spacingTokens[size],
    }),
    top: (size: keyof typeof spacingTokens) => ({
      marginTop: spacingTokens[size],
    }),
    bottom: (size: keyof typeof spacingTokens) => ({
      marginBottom: spacingTokens[size],
    }),
    left: (size: keyof typeof spacingTokens) => ({
      marginLeft: spacingTokens[size],
    }),
    right: (size: keyof typeof spacingTokens) => ({
      marginRight: spacingTokens[size],
    }),
  },
};

export const spacing = {
  tokens: spacingTokens,
  component: componentSpacing,
  educational: educationalSpacing,
  touchTarget: touchTargetSpacing,
  responsive: responsiveSpacing,
  grid: gridSpacing,
  safeArea: safeAreaSpacing,
  utils: {
    getSpacing,
    getResponsiveSpacing,
    getTouchTargetSpacing,
    ...spacingUtils,
  },
};

export default spacing;