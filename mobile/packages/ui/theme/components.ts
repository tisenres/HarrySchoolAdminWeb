/**
 * Harry School Mobile Design System - Component Specifications
 * 
 * Detailed specifications for mobile UI components
 * Optimized for educational apps and mobile touch interfaces
 */

import { designTokens } from './tokens';
import { semanticColors } from './colors';
import { textStyles } from './typography';
import { componentSpacing } from './spacing';

// ==================== BUTTON SPECIFICATIONS ====================

export const buttonSpecs = {
  // Primary Button
  primary: {
    default: {
      backgroundColor: semanticColors.primary.main,
      borderColor: semanticColors.primary.main,
      borderWidth: 2,
      borderRadius: designTokens.borderRadius.sm,
      paddingHorizontal: componentSpacing.button.paddingHorizontal.medium,
      paddingVertical: componentSpacing.button.paddingVertical.medium,
      minHeight: designTokens.touchTargets.comfortable,
      shadowColor: designTokens.shadows.sm.shadowColor,
      shadowOffset: designTokens.shadows.sm.shadowOffset,
      shadowOpacity: designTokens.shadows.sm.shadowOpacity,
      shadowRadius: designTokens.shadows.sm.shadowRadius,
      elevation: designTokens.shadows.sm.elevation,
    },
    pressed: {
      backgroundColor: semanticColors.primary.dark,
      borderColor: semanticColors.primary.dark,
      transform: [{ scale: 0.98 }],
    },
    disabled: {
      backgroundColor: semanticColors.interactive.disabled.background,
      borderColor: semanticColors.interactive.disabled.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    text: {
      default: {
        color: semanticColors.text.onPrimary,
        ...textStyles.button,
      },
      disabled: {
        color: semanticColors.text.disabled,
        ...textStyles.button,
      },
    },
  },

  // Secondary Button
  secondary: {
    default: {
      backgroundColor: 'transparent',
      borderColor: semanticColors.primary.main,
      borderWidth: 2,
      borderRadius: designTokens.borderRadius.sm,
      paddingHorizontal: componentSpacing.button.paddingHorizontal.medium,
      paddingVertical: componentSpacing.button.paddingVertical.medium,
      minHeight: designTokens.touchTargets.comfortable,
    },
    pressed: {
      backgroundColor: semanticColors.primary.surface,
      borderColor: semanticColors.primary.dark,
    },
    disabled: {
      borderColor: semanticColors.interactive.disabled.border,
    },
    text: {
      default: {
        color: semanticColors.primary.main,
        ...textStyles.button,
      },
      disabled: {
        color: semanticColors.text.disabled,
        ...textStyles.button,
      },
    },
  },

  // Ghost Button
  ghost: {
    default: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderRadius: designTokens.borderRadius.sm,
      paddingHorizontal: componentSpacing.button.paddingHorizontal.medium,
      paddingVertical: componentSpacing.button.paddingVertical.medium,
      minHeight: designTokens.touchTargets.comfortable,
    },
    pressed: {
      backgroundColor: semanticColors.primary.surface,
    },
    disabled: {
      backgroundColor: 'transparent',
    },
    text: {
      default: {
        color: semanticColors.primary.main,
        ...textStyles.button,
      },
      disabled: {
        color: semanticColors.text.disabled,
        ...textStyles.button,
      },
    },
  },

  // Size Variations
  sizes: {
    small: {
      paddingHorizontal: componentSpacing.button.paddingHorizontal.small,
      paddingVertical: componentSpacing.button.paddingVertical.small,
      minHeight: designTokens.touchTargets.minimum,
      text: textStyles.buttonSmall,
    },
    medium: {
      paddingHorizontal: componentSpacing.button.paddingHorizontal.medium,
      paddingVertical: componentSpacing.button.paddingVertical.medium,
      minHeight: designTokens.touchTargets.comfortable,
      text: textStyles.button,
    },
    large: {
      paddingHorizontal: componentSpacing.button.paddingHorizontal.large,
      paddingVertical: componentSpacing.button.paddingVertical.large,
      minHeight: designTokens.touchTargets.large,
      text: textStyles.buttonLarge,
    },
  },
} as const;

// ==================== CARD SPECIFICATIONS ====================

export const cardSpecs = {
  // Default Card
  default: {
    backgroundColor: semanticColors.background.elevated,
    borderRadius: designTokens.borderRadius.base,
    padding: componentSpacing.card.padding,
    marginHorizontal: componentSpacing.card.marginHorizontal,
    marginVertical: componentSpacing.card.marginVertical,
    shadowColor: designTokens.shadows.base.shadowColor,
    shadowOffset: designTokens.shadows.base.shadowOffset,
    shadowOpacity: designTokens.shadows.base.shadowOpacity,
    shadowRadius: designTokens.shadows.base.shadowRadius,
    elevation: designTokens.shadows.base.elevation,
    borderWidth: 1,
    borderColor: semanticColors.border.primary,
  },

  // Elevated Card (more prominent)
  elevated: {
    backgroundColor: semanticColors.background.elevated,
    borderRadius: designTokens.borderRadius.lg,
    padding: componentSpacing.card.padding,
    marginHorizontal: componentSpacing.card.marginHorizontal,
    marginVertical: componentSpacing.card.marginVertical,
    shadowColor: designTokens.shadows.md.shadowColor,
    shadowOffset: designTokens.shadows.md.shadowOffset,
    shadowOpacity: designTokens.shadows.md.shadowOpacity,
    shadowRadius: designTokens.shadows.md.shadowRadius,
    elevation: designTokens.shadows.md.elevation,
    borderWidth: 0,
  },

  // Outlined Card
  outlined: {
    backgroundColor: semanticColors.background.primary,
    borderRadius: designTokens.borderRadius.base,
    padding: componentSpacing.card.padding,
    marginHorizontal: componentSpacing.card.marginHorizontal,
    marginVertical: componentSpacing.card.marginVertical,
    borderWidth: 2,
    borderColor: semanticColors.border.primary,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Interactive Card (pressable)
  interactive: {
    default: {
      backgroundColor: semanticColors.background.elevated,
      borderRadius: designTokens.borderRadius.base,
      padding: componentSpacing.card.padding,
      shadowColor: designTokens.shadows.base.shadowColor,
      shadowOffset: designTokens.shadows.base.shadowOffset,
      shadowOpacity: designTokens.shadows.base.shadowOpacity,
      shadowRadius: designTokens.shadows.base.shadowRadius,
      elevation: designTokens.shadows.base.elevation,
      borderWidth: 1,
      borderColor: semanticColors.border.primary,
    },
    pressed: {
      backgroundColor: semanticColors.background.secondary,
      transform: [{ scale: 0.98 }],
      shadowOpacity: designTokens.shadows.sm.shadowOpacity,
      elevation: designTokens.shadows.sm.elevation,
    },
  },
} as const;

// ==================== INPUT SPECIFICATIONS ====================

export const inputSpecs = {
  // Text Input
  textInput: {
    default: {
      backgroundColor: semanticColors.background.primary,
      borderColor: semanticColors.border.primary,
      borderWidth: 1,
      borderRadius: designTokens.borderRadius.sm,
      paddingHorizontal: componentSpacing.form.inputPadding,
      paddingVertical: componentSpacing.form.inputPadding,
      minHeight: designTokens.touchTargets.comfortable,
      fontSize: textStyles.input.fontSize,
      fontFamily: textStyles.input.fontFamily,
      color: semanticColors.text.primary,
    },
    focused: {
      borderColor: semanticColors.border.focus,
      borderWidth: 2,
      shadowColor: semanticColors.primary.main,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    error: {
      borderColor: semanticColors.border.error,
      borderWidth: 2,
    },
    disabled: {
      backgroundColor: semanticColors.background.secondary,
      borderColor: semanticColors.interactive.disabled.border,
      color: semanticColors.text.disabled,
    },
    placeholder: {
      color: semanticColors.text.placeholder,
    },
  },

  // Search Input
  searchInput: {
    default: {
      backgroundColor: semanticColors.background.secondary,
      borderColor: 'transparent',
      borderWidth: 1,
      borderRadius: designTokens.borderRadius.full,
      paddingHorizontal: designTokens.spacing[4],
      paddingVertical: componentSpacing.form.inputPadding,
      minHeight: designTokens.touchTargets.comfortable,
      fontSize: textStyles.input.fontSize,
      fontFamily: textStyles.input.fontFamily,
      color: semanticColors.text.primary,
    },
    focused: {
      backgroundColor: semanticColors.background.primary,
      borderColor: semanticColors.border.focus,
      borderWidth: 2,
    },
  },
} as const;

// ==================== MODAL SPECIFICATIONS ====================

export const modalSpecs = {
  // Standard Modal
  standard: {
    overlay: {
      backgroundColor: semanticColors.background.overlay,
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: componentSpacing.modal.marginHorizontal,
    },
    container: {
      backgroundColor: semanticColors.background.modal,
      borderRadius: designTokens.borderRadius.xl,
      padding: componentSpacing.modal.padding,
      maxHeight: '90%',
      width: '100%',
      maxWidth: 400,
      shadowColor: designTokens.shadows.xl.shadowColor,
      shadowOffset: designTokens.shadows.xl.shadowOffset,
      shadowOpacity: designTokens.shadows.xl.shadowOpacity,
      shadowRadius: designTokens.shadows.xl.shadowRadius,
      elevation: designTokens.shadows.xl.elevation,
    },
    header: {
      marginBottom: componentSpacing.modal.contentGap,
    },
    footer: {
      marginTop: componentSpacing.modal.contentGap,
      flexDirection: 'row' as const,
      justifyContent: 'flex-end' as const,
      gap: componentSpacing.button.marginBetween,
    },
  },

  // Bottom Sheet Modal
  bottomSheet: {
    overlay: {
      backgroundColor: semanticColors.background.overlay,
      flex: 1,
      justifyContent: 'flex-end' as const,
    },
    container: {
      backgroundColor: semanticColors.background.bottomSheet,
      borderTopLeftRadius: designTokens.borderRadius['2xl'],
      borderTopRightRadius: designTokens.borderRadius['2xl'],
      padding: componentSpacing.modal.padding,
      maxHeight: '90%',
      shadowColor: designTokens.shadows.xl.shadowColor,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: designTokens.shadows.xl.shadowOpacity,
      shadowRadius: designTokens.shadows.xl.shadowRadius,
      elevation: designTokens.shadows.xl.elevation,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: semanticColors.border.secondary,
      borderRadius: designTokens.borderRadius.full,
      alignSelf: 'center' as const,
      marginBottom: componentSpacing.modal.contentGap,
    },
  },
} as const;

// ==================== EDUCATIONAL COMPONENT SPECIFICATIONS ====================

export const educationalSpecs = {
  // Ranking Badge
  rankingBadge: {
    container: {
      width: componentSpacing.educational.medalSize,
      height: componentSpacing.educational.medalSize,
      borderRadius: designTokens.borderRadius.full,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      shadowColor: designTokens.shadows.md.shadowColor,
      shadowOffset: designTokens.shadows.md.shadowOffset,
      shadowOpacity: designTokens.shadows.md.shadowOpacity,
      shadowRadius: designTokens.shadows.md.shadowRadius,
      elevation: designTokens.shadows.md.elevation,
    },
    text: {
      ...textStyles.rankingNumber,
      color: semanticColors.text.inverse,
    },
    positions: {
      1: { backgroundColor: semanticColors.ranking.gold.main },
      2: { backgroundColor: semanticColors.ranking.silver.main },
      3: { backgroundColor: semanticColors.ranking.bronze.main },
      default: { backgroundColor: semanticColors.secondary.main },
    },
  },

  // Progress Bar
  progressBar: {
    container: {
      height: componentSpacing.educational.progressBarHeight,
      backgroundColor: semanticColors.background.secondary,
      borderRadius: designTokens.borderRadius.full,
      overflow: 'hidden' as const,
      marginVertical: componentSpacing.educational.progressMargin,
    },
    fill: {
      height: '100%',
      backgroundColor: semanticColors.primary.main,
      borderRadius: designTokens.borderRadius.full,
    },
    text: {
      ...textStyles.caption,
      color: semanticColors.text.secondary,
      textAlign: 'center' as const,
      marginTop: designTokens.spacing[1],
    },
  },

  // Vocabulary Card
  vocabularyCard: {
    container: {
      backgroundColor: semanticColors.background.elevated,
      borderRadius: designTokens.borderRadius.lg,
      padding: componentSpacing.educational.vocabularyCardPadding,
      margin: componentSpacing.educational.vocabularyGap,
      shadowColor: designTokens.shadows.base.shadowColor,
      shadowOffset: designTokens.shadows.base.shadowOffset,
      shadowOpacity: designTokens.shadows.base.shadowOpacity,
      shadowRadius: designTokens.shadows.base.shadowRadius,
      elevation: designTokens.shadows.base.elevation,
      borderWidth: 1,
      borderColor: semanticColors.border.primary,
    },
    word: {
      ...textStyles.vocabularyWord,
      color: semanticColors.text.primary,
      marginBottom: designTokens.spacing[2],
    },
    definition: {
      ...textStyles.vocabularyDefinition,
      color: semanticColors.text.secondary,
    },
    flipped: {
      backgroundColor: semanticColors.primary.surface,
      borderColor: semanticColors.primary.main,
    },
  },

  // Task Card
  taskCard: {
    container: {
      backgroundColor: semanticColors.background.elevated,
      borderRadius: designTokens.borderRadius.base,
      padding: componentSpacing.educational.lessonPadding,
      marginVertical: componentSpacing.educational.taskGap,
      borderLeftWidth: 4,
      shadowColor: designTokens.shadows.sm.shadowColor,
      shadowOffset: designTokens.shadows.sm.shadowOffset,
      shadowOpacity: designTokens.shadows.sm.shadowOpacity,
      shadowRadius: designTokens.shadows.sm.shadowRadius,
      elevation: designTokens.shadows.sm.elevation,
    },
    title: {
      ...textStyles.lessonTitle,
      color: semanticColors.text.primary,
      marginBottom: designTokens.spacing[2],
    },
    instruction: {
      ...textStyles.taskInstruction,
      color: semanticColors.text.secondary,
    },
    status: {
      notStarted: { borderLeftColor: semanticColors.secondary.main },
      inProgress: { borderLeftColor: semanticColors.warning.main },
      completed: { borderLeftColor: semanticColors.success.main },
      overdue: { borderLeftColor: semanticColors.error.main },
    },
  },

  // Quiz Option
  quizOption: {
    default: {
      backgroundColor: semanticColors.background.primary,
      borderColor: semanticColors.border.primary,
      borderWidth: 2,
      borderRadius: designTokens.borderRadius.sm,
      padding: componentSpacing.educational.answerPadding,
      marginVertical: designTokens.spacing[2],
      minHeight: designTokens.touchTargets.comfortable,
    },
    selected: {
      backgroundColor: semanticColors.primary.surface,
      borderColor: semanticColors.primary.main,
    },
    correct: {
      backgroundColor: semanticColors.success.surface,
      borderColor: semanticColors.success.main,
    },
    incorrect: {
      backgroundColor: semanticColors.error.surface,
      borderColor: semanticColors.error.main,
    },
    text: {
      ...textStyles.body,
      color: semanticColors.text.primary,
    },
  },

  // Subject Badge
  subjectBadge: {
    container: {
      paddingHorizontal: designTokens.spacing[3],
      paddingVertical: designTokens.spacing[1],
      borderRadius: designTokens.borderRadius.full,
      alignSelf: 'flex-start' as const,
    },
    text: {
      ...textStyles.badge,
      color: semanticColors.text.inverse,
    },
  },

  // Achievement Badge
  achievementBadge: {
    container: {
      backgroundColor: semanticColors.background.elevated,
      borderRadius: designTokens.borderRadius.lg,
      padding: designTokens.spacing[3],
      alignItems: 'center' as const,
      shadowColor: designTokens.shadows.sm.shadowColor,
      shadowOffset: designTokens.shadows.sm.shadowOffset,
      shadowOpacity: designTokens.shadows.sm.shadowOpacity,
      shadowRadius: designTokens.shadows.sm.shadowRadius,
      elevation: designTokens.shadows.sm.elevation,
    },
    icon: {
      width: designTokens.spacing[8],
      height: designTokens.spacing[8],
      marginBottom: designTokens.spacing[2],
    },
    title: {
      ...textStyles.caption,
      color: semanticColors.text.primary,
      textAlign: 'center' as const,
    },
    unlocked: {
      backgroundColor: semanticColors.primary.surface,
      borderWidth: 2,
      borderColor: semanticColors.primary.main,
    },
    locked: {
      backgroundColor: semanticColors.background.secondary,
      opacity: designTokens.opacity.disabled,
    },
  },
} as const;

// ==================== LOADING SPECIFICATIONS ====================

export const loadingSpecs = {
  // Spinner
  spinner: {
    small: { size: 16 },
    medium: { size: 24 },
    large: { size: 32 },
    color: semanticColors.primary.main,
  },

  // Skeleton
  skeleton: {
    backgroundColor: semanticColors.background.secondary,
    borderRadius: designTokens.borderRadius.xs,
    animationDuration: 1500,
  },

  // Loading Overlay
  overlay: {
    backgroundColor: semanticColors.background.overlay,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: designTokens.zIndex.overlay,
  },
} as const;

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get button specifications by variant and size
 */
export const getButtonSpec = (variant: keyof typeof buttonSpecs, size: keyof typeof buttonSpecs.sizes = 'medium') => {
  if (variant === 'sizes') return buttonSpecs.sizes[size];
  
  const baseSpec = buttonSpecs[variant as keyof Omit<typeof buttonSpecs, 'sizes'>];
  const sizeSpec = buttonSpecs.sizes[size];
  
  return {
    ...baseSpec,
    default: {
      ...baseSpec.default,
      ...sizeSpec,
    },
    text: {
      ...baseSpec.text,
      default: {
        ...baseSpec.text.default,
        ...sizeSpec.text,
      },
    },
  };
};

/**
 * Get card specifications by variant
 */
export const getCardSpec = (variant: keyof typeof cardSpecs = 'default') => {
  return cardSpecs[variant];
};

/**
 * Get educational component specification
 */
export const getEducationalSpec = (component: keyof typeof educationalSpecs) => {
  return educationalSpecs[component];
};

export type ButtonVariant = keyof typeof buttonSpecs;
export type ButtonSize = keyof typeof buttonSpecs.sizes;
export type CardVariant = keyof typeof cardSpecs;
export type EducationalComponent = keyof typeof educationalSpecs;

export default {
  button: buttonSpecs,
  card: cardSpecs,
  input: inputSpecs,
  modal: modalSpecs,
  educational: educationalSpecs,
  loading: loadingSpecs,
  utils: {
    getButtonSpec,
    getCardSpec,
    getEducationalSpec,
  },
};