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

// ==================== AVATAR SPECIFICATIONS ====================

export const avatarSpecs = {
  // Size Variations
  sizes: {
    xs: {
      container: {
        width: 24,
        height: 24,
        borderRadius: 12,
      },
      text: {
        fontSize: 10,
        fontWeight: '600',
      },
      status: {
        width: 6,
        height: 6,
        borderRadius: 3,
        borderWidth: 1,
      },
    },
    sm: {
      container: {
        width: 32,
        height: 32,
        borderRadius: 16,
      },
      text: {
        fontSize: 12,
        fontWeight: '600',
      },
      status: {
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 1.5,
      },
    },
    md: {
      container: {
        width: 40,
        height: 40,
        borderRadius: 20,
      },
      text: {
        fontSize: 14,
        fontWeight: '600',
      },
      status: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
      },
    },
    lg: {
      container: {
        width: 56,
        height: 56,
        borderRadius: 28,
      },
      text: {
        fontSize: 18,
        fontWeight: '600',
      },
      status: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
      },
    },
    xl: {
      container: {
        width: 80,
        height: 80,
        borderRadius: 40,
      },
      text: {
        fontSize: 24,
        fontWeight: '700',
      },
      status: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 3,
      },
    },
    xxl: {
      container: {
        width: 120,
        height: 120,
        borderRadius: 60,
      },
      text: {
        fontSize: 36,
        fontWeight: '700',
      },
      status: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 4,
      },
    },
  },

  // Status Indicators
  status: {
    online: {
      backgroundColor: semanticColors.semantic.success.main,
      borderColor: semanticColors.background.primary,
    },
    away: {
      backgroundColor: semanticColors.semantic.warning.main,
      borderColor: semanticColors.background.primary,
    },
    busy: {
      backgroundColor: semanticColors.semantic.error.main,
      borderColor: semanticColors.background.primary,
    },
    offline: {
      backgroundColor: semanticColors.neutral[400],
      borderColor: semanticColors.background.primary,
    },
  },

  // Role Indicators
  roles: {
    teacher: {
      borderColor: semanticColors.primary.main,
      borderWidth: 2,
      backgroundColor: semanticColors.primary.surface,
    },
    student: {
      borderColor: '#3b82f6',
      borderWidth: 2,
      backgroundColor: semanticColors.background.primary,
    },
    admin: {
      borderColor: '#8b5cf6',
      borderWidth: 2,
      backgroundColor: '#f3f0ff',
    },
  },

  // Shapes
  shapes: {
    circle: {
      borderRadius: 9999,
    },
    rounded: {
      borderRadius: designTokens.borderRadius.lg,
    },
  },

  // Fallback styles
  fallback: {
    backgroundColor: semanticColors.background.secondary,
    color: semanticColors.text.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
} as const;

// ==================== BADGE SPECIFICATIONS ====================

export const badgeSpecs = {
  // Notification Badge
  notification: {
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: semanticColors.semantic.error.main,
      position: 'absolute' as const,
      top: -4,
      right: -4,
    },
    number: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: semanticColors.semantic.error.main,
      paddingHorizontal: 6,
      paddingVertical: 2,
      position: 'absolute' as const,
      top: -8,
      right: -8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    text: {
      color: semanticColors.text.onPrimary,
      fontSize: 10,
      fontWeight: '700',
      textAlign: 'center' as const,
    },
  },

  // Achievement Badge
  achievement: {
    gold: {
      backgroundColor: semanticColors.ranking.gold.metallic,
      borderColor: semanticColors.ranking.gold.main,
      borderWidth: 2,
      shadowColor: semanticColors.ranking.gold.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    silver: {
      backgroundColor: semanticColors.ranking.silver.metallic,
      borderColor: semanticColors.ranking.silver.main,
      borderWidth: 2,
      shadowColor: semanticColors.ranking.silver.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 3,
    },
    bronze: {
      backgroundColor: semanticColors.ranking.bronze.metallic,
      borderColor: semanticColors.ranking.bronze.main,
      borderWidth: 2,
      shadowColor: semanticColors.ranking.bronze.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 3,
    },
  },

  // Status Badge
  status: {
    active: {
      backgroundColor: semanticColors.semantic.success.light,
      color: semanticColors.semantic.success.dark,
      borderColor: semanticColors.semantic.success.main,
      borderWidth: 1,
    },
    pending: {
      backgroundColor: semanticColors.semantic.warning.light,
      color: semanticColors.semantic.warning.dark,
      borderColor: semanticColors.semantic.warning.main,
      borderWidth: 1,
    },
    inactive: {
      backgroundColor: semanticColors.background.secondary,
      color: semanticColors.text.tertiary,
      borderColor: semanticColors.border.primary,
      borderWidth: 1,
    },
    error: {
      backgroundColor: semanticColors.semantic.error.light,
      color: semanticColors.semantic.error.dark,
      borderColor: semanticColors.semantic.error.main,
      borderWidth: 1,
    },
  },

  // Badge Sizes
  sizes: {
    small: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      fontSize: 10,
      borderRadius: 4,
    },
    medium: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 12,
      borderRadius: 6,
    },
    large: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      fontSize: 14,
      borderRadius: 8,
    },
  },
} as const;

// ==================== TAB BAR SPECIFICATIONS ====================

export const tabBarSpecs = {
  container: {
    height: 64,
    backgroundColor: semanticColors.background.primary,
    borderTopWidth: 1,
    borderTopColor: semanticColors.border.primary,
    flexDirection: 'row' as const,
    shadowColor: designTokens.shadows.xs.shadowColor,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },

  tab: {
    default: {
      flex: 1,
      minWidth: 60,
      maxWidth: 168,
      height: 56,
      paddingVertical: 8,
      paddingHorizontal: 4,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: 'transparent',
    },
    active: {
      backgroundColor: semanticColors.primary.surface,
    },
    pressed: {
      backgroundColor: semanticColors.background.secondary,
      transform: [{ scale: 0.95 }],
    },
  },

  icon: {
    default: {
      size: 24,
      color: semanticColors.text.tertiary,
      marginBottom: 4,
    },
    active: {
      color: semanticColors.primary.main,
    },
  },

  label: {
    default: {
      fontSize: 10,
      color: semanticColors.text.tertiary,
      fontWeight: '500',
    },
    active: {
      color: semanticColors.primary.main,
      fontWeight: '600',
    },
  },

  indicator: {
    position: 'absolute' as const,
    top: 0,
    height: 2,
    backgroundColor: semanticColors.primary.main,
    borderRadius: 1,
  },

  badge: {
    position: 'absolute' as const,
    top: 4,
    right: '30%',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: semanticColors.semantic.error.main,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
} as const;

// ==================== HEADER SPECIFICATIONS ====================

export const headerSpecs = {
  // Default Header
  default: {
    container: {
      height: 56,
      backgroundColor: semanticColors.background.primary,
      borderBottomWidth: 1,
      borderBottomColor: semanticColors.border.primary,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: semanticColors.text.primary,
      flex: 1,
      textAlign: 'center' as const,
    },
    subtitle: {
      fontSize: 12,
      fontWeight: '400',
      color: semanticColors.text.secondary,
      textAlign: 'center' as const,
    },
    backButton: {
      width: 44,
      height: 44,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    action: {
      width: 44,
      height: 44,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  },

  // Search Header
  search: {
    container: {
      height: 56,
      backgroundColor: semanticColors.background.primary,
      borderBottomWidth: 1,
      borderBottomColor: semanticColors.border.primary,
      paddingHorizontal: 16,
      justifyContent: 'center' as const,
    },
    searchBar: {
      height: 40,
      backgroundColor: semanticColors.background.secondary,
      borderRadius: 20,
      paddingHorizontal: 16,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    expanded: {
      height: 100,
    },
  },

  // Minimal Header
  minimal: {
    container: {
      height: 44,
      backgroundColor: 'transparent',
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
    },
  },

  // Contextual Header
  contextual: {
    container: {
      height: 56,
      backgroundColor: semanticColors.primary.main,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
    },
    text: {
      color: semanticColors.text.onPrimary,
    },
  },

  // Offline Indicator
  offlineIndicator: {
    height: 24,
    backgroundColor: semanticColors.semantic.warning.light,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
  },

  // Sync Status
  syncStatus: {
    syncing: {
      color: semanticColors.semantic.warning.main,
    },
    synced: {
      color: semanticColors.semantic.success.main,
    },
    error: {
      color: semanticColors.semantic.error.main,
    },
  },
} as const;

// ==================== EMPTY STATE SPECIFICATIONS ====================

export const emptyStateSpecs = {
  container: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 32,
  },

  illustration: {
    width: 160,
    height: 160,
    marginBottom: 24,
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    color: semanticColors.text.primary,
    textAlign: 'center' as const,
    marginBottom: 8,
  },

  description: {
    fontSize: 14,
    fontWeight: '400',
    color: semanticColors.text.secondary,
    textAlign: 'center' as const,
    marginBottom: 24,
    lineHeight: 20,
  },

  // Variant styles
  variants: {
    noData: {
      title: { color: semanticColors.text.primary },
      description: { color: semanticColors.text.secondary },
    },
    error: {
      title: { color: semanticColors.semantic.error.main },
      description: { color: semanticColors.text.secondary },
      container: { backgroundColor: semanticColors.semantic.error.light },
    },
    offline: {
      title: { color: semanticColors.text.primary },
      description: { color: semanticColors.text.secondary },
      container: { backgroundColor: semanticColors.semantic.warning.light },
    },
    firstTime: {
      title: { color: semanticColors.primary.main },
      description: { color: semanticColors.text.secondary },
    },
    achievement: {
      title: { color: semanticColors.ranking.gold.main },
      description: { color: semanticColors.text.primary },
      container: { backgroundColor: semanticColors.ranking.gold.light },
    },
  },

  // Size variations
  sizes: {
    fullScreen: {
      container: { padding: 32 },
      illustration: { width: 200, height: 200 },
    },
    inCard: {
      container: { padding: 16 },
      illustration: { width: 80, height: 80 },
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

// ==================== LOADING SCREEN SPECIFICATIONS ====================

export const loadingScreenSpecs = {
  // Spinner Loading
  spinner: {
    container: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: semanticColors.background.primary,
    },
    sizes: {
      small: { size: 16, strokeWidth: 2 },
      medium: { size: 24, strokeWidth: 2.5 },
      large: { size: 32, strokeWidth: 3 },
      xlarge: { size: 48, strokeWidth: 4 },
    },
    colors: {
      primary: semanticColors.primary.main,
      secondary: semanticColors.text.secondary,
      overlay: semanticColors.text.onPrimary,
    },
    animation: {
      duration: 1000,
      easing: 'linear',
    },
  },

  // Progress Bar Loading
  progressBar: {
    container: {
      width: '100%',
      height: 4,
      backgroundColor: semanticColors.background.secondary,
      borderRadius: 2,
      overflow: 'hidden' as const,
      marginVertical: 16,
    },
    fill: {
      height: '100%',
      backgroundColor: semanticColors.primary.main,
      borderRadius: 2,
    },
    text: {
      fontSize: 14,
      color: semanticColors.text.secondary,
      textAlign: 'center' as const,
      marginTop: 8,
    },
    estimatedTime: {
      fontSize: 12,
      color: semanticColors.text.tertiary,
      textAlign: 'center' as const,
      marginTop: 4,
    },
  },

  // Skeleton Loading
  skeleton: {
    backgroundColor: semanticColors.background.secondary,
    borderRadius: designTokens.borderRadius.xs,
    overflow: 'hidden' as const,
    shimmer: {
      colors: [
        semanticColors.background.secondary,
        semanticColors.background.tertiary,
        semanticColors.background.secondary,
      ],
      locations: [0, 0.5, 1],
      angle: 90,
    },
    animation: {
      duration: 1500,
      iteration: 'infinite',
    },
    variants: {
      text: { height: 12, marginVertical: 2 },
      title: { height: 20, marginVertical: 4 },
      image: { aspectRatio: 16 / 9 },
      card: { height: 120, borderRadius: designTokens.borderRadius.card },
      avatar: { borderRadius: 9999 },
    },
  },

  // Educational Content Loading (Student-specific)
  educational: {
    container: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: 32,
      backgroundColor: semanticColors.background.primary,
    },
    content: {
      marginTop: 24,
      alignItems: 'center' as const,
      maxWidth: 280,
    },
    word: {
      fontSize: 20,
      fontWeight: '600',
      color: semanticColors.primary.main,
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    definition: {
      fontSize: 14,
      color: semanticColors.text.secondary,
      textAlign: 'center' as const,
      lineHeight: 20,
    },
    tip: {
      fontSize: 14,
      color: semanticColors.text.primary,
      textAlign: 'center' as const,
      fontStyle: 'italic',
      lineHeight: 20,
    },
    cycleAnimation: {
      duration: 3000,
      fadeInOut: true,
    },
  },

  // Loading Overlay
  overlay: {
    container: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(16, 24, 40, 0.7)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      zIndex: designTokens.zIndex.overlay,
    },
    content: {
      backgroundColor: semanticColors.background.primary,
      borderRadius: designTokens.borderRadius.lg,
      padding: 24,
      alignItems: 'center' as const,
      minWidth: 160,
      shadowColor: designTokens.shadows.xl.shadowColor,
      shadowOffset: designTokens.shadows.xl.shadowOffset,
      shadowOpacity: designTokens.shadows.xl.shadowOpacity,
      shadowRadius: designTokens.shadows.xl.shadowRadius,
      elevation: designTokens.shadows.xl.elevation,
    },
    text: {
      fontSize: 14,
      color: semanticColors.text.secondary,
      marginTop: 12,
      textAlign: 'center' as const,
    },
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

// Type exports for all components
export type ButtonVariant = keyof typeof buttonSpecs;
export type ButtonSize = keyof typeof buttonSpecs.sizes;
export type CardVariant = keyof typeof cardSpecs;
export type InputVariant = keyof typeof inputSpecs;
export type AvatarSize = keyof typeof avatarSpecs.sizes;
export type AvatarStatus = keyof typeof avatarSpecs.status;
export type AvatarRole = keyof typeof avatarSpecs.roles;
export type BadgeType = keyof typeof badgeSpecs;
export type BadgeSize = keyof typeof badgeSpecs.sizes;
export type HeaderVariant = keyof typeof headerSpecs;
export type EmptyStateVariant = keyof typeof emptyStateSpecs.variants;
export type EmptyStateSize = keyof typeof emptyStateSpecs.sizes;
export type ModalVariant = keyof typeof modalSpecs;
export type LoadingScreenType = keyof typeof loadingScreenSpecs;
export type EducationalComponent = keyof typeof educationalSpecs;

export default {
  button: buttonSpecs,
  card: cardSpecs,
  input: inputSpecs,
  avatar: avatarSpecs,
  badge: badgeSpecs,
  tabBar: tabBarSpecs,
  header: headerSpecs,
  emptyState: emptyStateSpecs,
  modal: modalSpecs,
  loadingScreen: loadingScreenSpecs,
  educational: educationalSpecs,
  utils: {
    getButtonSpec,
    getCardSpec,
    getEducationalSpec,
  },
};