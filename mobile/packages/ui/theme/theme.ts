/**
 * Harry School Mobile Design System - Main Theme
 * 
 * Complete theme configuration combining all design tokens and utilities
 */

import tokens from './tokens';
import colors from './colors';
import typography from './typography';
import spacing from './spacing';

// Main theme object
export const harrySchoolTheme = {
  // Core design tokens
  tokens,
  
  // Color system
  colors,
  
  // Typography system
  typography,
  
  // Spacing system
  spacing,
  
  // Component specifications
  components: {
    Button: {
      variants: {
        primary: {
          backgroundColor: colors.semantic.primary.main,
          color: colors.semantic.primary.contrast,
          borderRadius: tokens.borderRadius.md,
          ...spacing.utils.padding.horizontal('md'),
          ...spacing.utils.padding.vertical('sm'),
          minHeight: tokens.touchTargets.recommended,
          ...tokens.shadows.sm,
        },
        secondary: {
          backgroundColor: colors.semantic.secondary.main,
          color: colors.semantic.secondary.contrast,
          borderRadius: tokens.borderRadius.md,
          ...spacing.utils.padding.horizontal('md'),
          ...spacing.utils.padding.vertical('sm'),
          minHeight: tokens.touchTargets.recommended,
          ...tokens.shadows.sm,
        },
        outline: {
          backgroundColor: 'transparent',
          color: colors.semantic.primary.main,
          borderWidth: 1,
          borderColor: colors.semantic.primary.main,
          borderRadius: tokens.borderRadius.md,
          ...spacing.utils.padding.horizontal('md'),
          ...spacing.utils.padding.vertical('sm'),
          minHeight: tokens.touchTargets.recommended,
        },
        ghost: {
          backgroundColor: 'transparent',
          color: colors.semantic.primary.main,
          borderRadius: tokens.borderRadius.md,
          ...spacing.utils.padding.horizontal('md'),
          ...spacing.utils.padding.vertical('sm'),
          minHeight: tokens.touchTargets.recommended,
        },
        destructive: {
          backgroundColor: colors.semantic.error.main,
          color: colors.semantic.error.contrast,
          borderRadius: tokens.borderRadius.md,
          ...spacing.utils.padding.horizontal('md'),
          ...spacing.utils.padding.vertical('sm'),
          minHeight: tokens.touchTargets.recommended,
          ...tokens.shadows.sm,
        },
      },
      sizes: {
        small: {
          ...typography.textStyles.buttonSmall,
          minHeight: tokens.touchTargets.minimum,
          ...spacing.utils.padding.horizontal('sm'),
          ...spacing.utils.padding.vertical('xs'),
        },
        medium: {
          ...typography.textStyles.button,
          minHeight: tokens.touchTargets.recommended,
          ...spacing.utils.padding.horizontal('md'),
          ...spacing.utils.padding.vertical('sm'),
        },
        large: {
          ...typography.textStyles.buttonLarge,
          minHeight: tokens.touchTargets.large,
          ...spacing.utils.padding.horizontal('lg'),
          ...spacing.utils.padding.vertical('md'),
        },
      },
    },
    
    Card: {
      variants: {
        elevated: {
          backgroundColor: colors.background.primary,
          borderRadius: tokens.borderRadius.lg,
          padding: spacing.component.card.padding,
          ...tokens.shadows.md,
        },
        outlined: {
          backgroundColor: colors.background.primary,
          borderRadius: tokens.borderRadius.lg,
          padding: spacing.component.card.padding,
          borderWidth: 1,
          borderColor: colors.neutral[200],
        },
        filled: {
          backgroundColor: colors.background.secondary,
          borderRadius: tokens.borderRadius.lg,
          padding: spacing.component.card.padding,
        },
        interactive: {
          backgroundColor: colors.background.primary,
          borderRadius: tokens.borderRadius.lg,
          padding: spacing.component.card.padding,
          ...tokens.shadows.sm,
        },
      },
    },
    
    Input: {
      variants: {
        default: {
          backgroundColor: colors.background.primary,
          borderWidth: 1,
          borderColor: colors.neutral[300],
          borderRadius: tokens.borderRadius.md,
          padding: spacing.component.form.inputPadding,
          ...typography.form.input,
          minHeight: tokens.touchTargets.recommended,
        },
        filled: {
          backgroundColor: colors.background.secondary,
          borderWidth: 0,
          borderRadius: tokens.borderRadius.md,
          padding: spacing.component.form.inputPadding,
          ...typography.form.input,
          minHeight: tokens.touchTargets.recommended,
        },
        underlined: {
          backgroundColor: 'transparent',
          borderWidth: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.neutral[300],
          borderRadius: 0,
          paddingHorizontal: 0,
          paddingVertical: spacing.component.form.inputPadding,
          ...typography.form.input,
          minHeight: tokens.touchTargets.recommended,
        },
      },
      states: {
        focused: {
          borderColor: colors.semantic.primary.main,
          ...tokens.shadows.sm,
        },
        error: {
          borderColor: colors.semantic.error.main,
        },
        disabled: {
          backgroundColor: colors.neutral[100],
          opacity: tokens.opacity.disabled,
        },
      },
    },
    
    Modal: {
      backdrop: {
        backgroundColor: colors.withOpacity(colors.neutral[900], tokens.opacity.overlay),
      },
      container: {
        backgroundColor: colors.background.primary,
        borderRadius: tokens.borderRadius.xl,
        padding: spacing.component.modal.padding,
        margin: spacing.component.modal.margin,
        ...tokens.shadows.xl,
      },
    },
    
    // Educational specific components
    RankingBadge: {
      variants: {
        gold: {
          backgroundColor: colors.ranking.gold,
          color: colors.text.primary,
          borderRadius: tokens.borderRadius.full,
          ...spacing.utils.padding.all('sm'),
          ...tokens.shadows.md,
        },
        silver: {
          backgroundColor: colors.ranking.silver,
          color: colors.text.primary,
          borderRadius: tokens.borderRadius.full,
          ...spacing.utils.padding.all('sm'),
          ...tokens.shadows.md,
        },
        bronze: {
          backgroundColor: colors.ranking.bronze,
          color: colors.text.inverse,
          borderRadius: tokens.borderRadius.full,
          ...spacing.utils.padding.all('sm'),
          ...tokens.shadows.md,
        },
        default: {
          backgroundColor: colors.neutral[600],
          color: colors.text.inverse,
          borderRadius: tokens.borderRadius.full,
          ...spacing.utils.padding.all('sm'),
          ...tokens.shadows.sm,
        },
      },
    },
    
    VocabularyCard: {
      default: {
        backgroundColor: colors.background.primary,
        borderRadius: tokens.borderRadius.lg,
        padding: spacing.educational.vocabulary.cardPadding,
        ...tokens.shadows.md,
        minHeight: 200,
      },
      flipped: {
        backgroundColor: colors.background.secondary,
        borderRadius: tokens.borderRadius.lg,
        padding: spacing.educational.vocabulary.cardPadding,
        ...tokens.shadows.lg,
        minHeight: 200,
      },
    },
    
    TaskCard: {
      variants: {
        notStarted: {
          backgroundColor: colors.background.primary,
          borderLeftWidth: 4,
          borderLeftColor: colors.educational.taskStatus.notStarted,
          borderRadius: tokens.borderRadius.md,
          padding: spacing.educational.task.contentPadding,
          ...tokens.shadows.sm,
        },
        inProgress: {
          backgroundColor: colors.background.primary,
          borderLeftWidth: 4,
          borderLeftColor: colors.educational.taskStatus.inProgress,
          borderRadius: tokens.borderRadius.md,
          padding: spacing.educational.task.contentPadding,
          ...tokens.shadows.md,
        },
        completed: {
          backgroundColor: colors.background.primary,
          borderLeftWidth: 4,
          borderLeftColor: colors.educational.taskStatus.completed,
          borderRadius: tokens.borderRadius.md,
          padding: spacing.educational.task.contentPadding,
          ...tokens.shadows.sm,
        },
        overdue: {
          backgroundColor: colors.withOpacity(colors.semantic.error.light, 0.1),
          borderLeftWidth: 4,
          borderLeftColor: colors.educational.taskStatus.overdue,
          borderRadius: tokens.borderRadius.md,
          padding: spacing.educational.task.contentPadding,
          ...tokens.shadows.md,
        },
      },
    },
  },
  
  // Animation presets
  animations: {
    spring: {
      type: 'spring',
      damping: 15,
      stiffness: 150,
      mass: 1,
    },
    timing: {
      duration: tokens.animation.duration.normal,
      easing: tokens.animation.easing.easeOut,
    },
    fade: {
      duration: tokens.animation.duration.fast,
      easing: tokens.animation.easing.easeInOut,
    },
  },
  
  // Breakpoints for responsive design
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
  },
  
  // Accessibility helpers
  accessibility: {
    minimumTouchTarget: tokens.touchTargets.minimum,
    recommendedTouchTarget: tokens.touchTargets.recommended,
    highContrastColors: colors.accessibility,
    focusIndicator: {
      borderWidth: 2,
      borderColor: colors.semantic.primary.main,
      borderRadius: tokens.borderRadius.sm,
    },
  },
};

// Student-specific theme overrides
export const studentTheme = {
  ...harrySchoolTheme,
  colors: {
    ...harrySchoolTheme.colors,
    // More vibrant colors for student engagement
    primary: {
      ...harrySchoolTheme.colors.primary,
      main: colors.primary[500],
      light: colors.primary[300],
    },
  },
  // Student-specific component overrides
  components: {
    ...harrySchoolTheme.components,
    Button: {
      ...harrySchoolTheme.components.Button,
      variants: {
        ...harrySchoolTheme.components.Button.variants,
        primary: {
          ...harrySchoolTheme.components.Button.variants.primary,
          ...tokens.shadows.md, // More prominent shadows for students
        },
      },
    },
  },
};

// Teacher-specific theme overrides
export const teacherTheme = {
  ...harrySchoolTheme,
  colors: {
    ...harrySchoolTheme.colors,
    // More professional, muted colors
    primary: {
      ...harrySchoolTheme.colors.primary,
      main: colors.primary[600], // Slightly darker for professional feel
    },
  },
  // Teacher-specific component overrides
  components: {
    ...harrySchoolTheme.components,
    Button: {
      ...harrySchoolTheme.components.Button,
      variants: {
        ...harrySchoolTheme.components.Button.variants,
        primary: {
          ...harrySchoolTheme.components.Button.variants.primary,
          ...tokens.shadows.sm, // Subtle shadows for professional appearance
        },
      },
    },
  },
};

// Dark mode theme
export const darkTheme = {
  ...harrySchoolTheme,
  colors: {
    ...harrySchoolTheme.colors,
    background: colors.darkMode.background,
    text: colors.darkMode.text,
    neutral: {
      ...colors.neutral,
      // Invert neutral colors for dark mode
      50: colors.neutral[900],
      100: colors.neutral[800],
      200: colors.neutral[700],
      300: colors.neutral[600],
      400: colors.neutral[500],
      500: colors.neutral[400],
      600: colors.neutral[300],
      700: colors.neutral[200],
      800: colors.neutral[100],
      900: colors.neutral[50],
    },
  },
};

// Utility functions
export const getTheme = (variant: 'default' | 'student' | 'teacher' | 'dark' = 'default') => {
  switch (variant) {
    case 'student':
      return studentTheme;
    case 'teacher':
      return teacherTheme;
    case 'dark':
      return darkTheme;
    default:
      return harrySchoolTheme;
  }
};

export const getComponent = (componentName: keyof typeof harrySchoolTheme.components) => {
  return harrySchoolTheme.components[componentName];
};

export const getComponentVariant = (
  componentName: keyof typeof harrySchoolTheme.components,
  variant: string
) => {
  const component = harrySchoolTheme.components[componentName] as any;
  return component?.variants?.[variant] || component?.default;
};

// Main exports
export default harrySchoolTheme;

export {
  tokens,
  colors,
  typography,
  spacing,
  studentTheme,
  teacherTheme,
  darkTheme,
};