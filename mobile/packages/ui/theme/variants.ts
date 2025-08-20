/**
 * Harry School Mobile Design System - Theme Variants
 * 
 * Teacher Theme: Professional, efficiency-focused design
 * Student Theme: Engaging, gamified design  
 * 
 * Based on UX research findings:
 * - Teachers: Need efficiency, simple interfaces, quick actions
 * - Students: Need engagement, visual progress, social elements
 */

import { colors, spacing, shadows, animation, typography, borderRadius, touchTargets } from './tokens';

// Base Theme Configuration
export const baseTheme = {
  colors,
  spacing,
  shadows,
  animation,
  typography,
  borderRadius,
  touchTargets,
};

// Teacher Theme - Professional & Efficient
export const teacherTheme = {
  ...baseTheme,
  
  // Professional color palette
  colors: {
    ...colors,
    primary: {
      ...colors.primary,
      main: colors.primary[600], // Darker, more professional
      light: colors.primary[500],
      dark: colors.primary[700],
    },
    
    // Muted semantic colors for professional feel
    semantic: {
      success: { ...colors.semantic.success, main: '#059669' },
      warning: { ...colors.semantic.warning, main: '#d97706' },
      error: { ...colors.semantic.error, main: '#dc2626' },
      info: { ...colors.semantic.info, main: '#1d4ed8' },
    },
    
    // Professional background colors
    background: {
      ...colors.background,
      primary: '#ffffff',
      secondary: '#fafafa',
      accent: colors.primary[25], // Very subtle brand tint
    },
  },
  
  // Subtle shadows for professional appearance
  shadows: {
    ...shadows,
    default: shadows.teacher.card,
    modal: shadows.teacher.modal,
  },
  
  // Efficient animations - faster for productivity
  animations: {
    ...animation,
    duration: {
      ...animation.duration,
      fast: 100,    // Even faster feedback
      normal: 200,  // Quicker transitions
      slow: 300,    // Reduced from 500ms
    },
    presets: {
      ...animation.presets,
      // Quick feedback for efficiency
      feedback: {
        duration: 100,
        easing: animation.easing.easeOut,
      },
      // Minimal celebration (professional context)
      celebration: {
        duration: 200,
        easing: animation.easing.standard,
      },
    },
  },
  
  // Component specifications
  components: {
    // Primary action buttons - efficiency focused
    Button: {
      primary: {
        backgroundColor: colors.primary[600],
        color: colors.text.inverse,
        borderRadius: borderRadius.button,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        minHeight: touchTargets.teacher.quickMark,
        ...shadows.teacher.card,
      },
      secondary: {
        backgroundColor: colors.background.secondary,
        color: colors.primary[600],
        borderWidth: 1,
        borderColor: colors.primary[600],
        borderRadius: borderRadius.button,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        minHeight: touchTargets.teacher.quickMark,
      },
      // Quick action button for attendance/grading
      quickAction: {
        backgroundColor: colors.primary[500],
        color: colors.text.inverse,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        minHeight: touchTargets.teacher.quickMark,
        ...shadows.xs,
      },
    },
    
    // Efficient card design
    Card: {
      default: {
        backgroundColor: colors.background.primary,
        borderRadius: borderRadius.card,
        padding: spacing.md,
        ...shadows.teacher.card,
        borderWidth: 1,
        borderColor: colors.border.light,
      },
      interactive: {
        backgroundColor: colors.background.primary,
        borderRadius: borderRadius.card,
        padding: spacing.md,
        ...shadows.sm,
        borderWidth: 1,
        borderColor: colors.border.light,
      },
    },
    
    // Professional form inputs
    Input: {
      default: {
        backgroundColor: colors.background.primary,
        borderWidth: 1,
        borderColor: colors.border.medium,
        borderRadius: borderRadius.input,
        paddingHorizontal: spacing.form.inputPadding,
        paddingVertical: spacing.form.inputVerticalPadding,
        minHeight: touchTargets.teacher.quickMark,
        ...typography.textStyles.bodyMedium,
      },
      focused: {
        borderColor: colors.primary[600],
        ...shadows.focus,
      },
    },
    
    // Bottom tab navigation - professional
    TabNavigation: {
      container: {
        height: spacing.navigation.tabBarHeight,
        backgroundColor: colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
        paddingHorizontal: spacing.xs,
        ...shadows.sm,
      },
      tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xs,
        minHeight: touchTargets.teacher.navigation,
      },
      activeTab: {
        backgroundColor: colors.primary[50],
        borderRadius: borderRadius.sm,
      },
      label: {
        ...typography.textStyles.labelSmall,
        color: colors.text.secondary,
        marginTop: spacing[1],
      },
      activeLabel: {
        color: colors.primary[600],
        fontWeight: typography.fontWeight.semibold,
      },
    },
  },
  
  // Teacher-specific educational components
  educational: {
    // Attendance marking interface
    AttendanceCard: {
      container: {
        backgroundColor: colors.background.primary,
        borderRadius: borderRadius.educational.taskCard,
        padding: spacing.educational.task.contentPadding,
        marginVertical: spacing.xs,
        ...shadows.teacher.card,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary[500],
      },
      studentName: {
        ...typography.textStyles.bodyMedium,
        color: colors.text.primary,
        fontWeight: typography.fontWeight.medium,
      },
      statusButtons: {
        flexDirection: 'row',
        marginTop: spacing.sm,
        gap: spacing.xs,
      },
      statusButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        minHeight: touchTargets.teacher.quickMark,
        minWidth: touchTargets.teacher.quickMark,
      },
    },
    
    // Student performance summary
    PerformanceCard: {
      container: {
        backgroundColor: colors.background.primary,
        borderRadius: borderRadius.card,
        padding: spacing.lg,
        ...shadows.teacher.card,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
      },
      title: {
        ...typography.textStyles.headlineSmall,
        color: colors.text.primary,
      },
      metric: {
        ...typography.textStyles.labelLarge,
        color: colors.text.secondary,
      },
    },
  },
};

// Student Theme - Engaging & Gamified
export const studentTheme = {
  ...baseTheme,
  
  // Vibrant, engaging color palette
  colors: {
    ...colors,
    primary: {
      ...colors.primary,
      main: colors.primary[500], // Standard brand color
      light: colors.primary[300],
      dark: colors.primary[700],
    },
    
    // Enhanced semantic colors for engagement
    semantic: {
      success: { ...colors.semantic.success, main: '#10b981' },
      warning: { ...colors.semantic.warning, main: '#f59e0b' },
      error: { ...colors.semantic.error, main: '#ef4444' },
      info: { ...colors.semantic.info, main: '#3b82f6' },
    },
    
    // Engaging background colors
    background: {
      ...colors.background,
      primary: '#ffffff',
      secondary: '#f8fafc',
      accent: colors.primary[50], // Subtle brand accent
    },
    
    // Gamification color enhancements
    gamification: colors.gamification,
  },
  
  // Enhanced shadows for engagement
  shadows: {
    ...shadows,
    default: shadows.student.card,
    achievement: shadows.student.achievement,
    ranking: shadows.student.ranking,
  },
  
  // Full animation suite with celebrations
  animations: {
    ...animation,
    presets: {
      ...animation.presets,
      // Celebratory animations for achievements
      celebration: {
        duration: 800,
        easing: animation.easing.bounce,
      },
      // Satisfying feedback for interactions
      feedback: {
        duration: 200,
        easing: animation.easing.easeOut,
      },
    },
  },
  
  // Component specifications
  components: {
    // Engaging action buttons
    Button: {
      primary: {
        backgroundColor: colors.primary[500],
        color: colors.text.inverse,
        borderRadius: borderRadius.button,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        minHeight: touchTargets.student.learning,
        ...shadows.student.card,
      },
      gamification: {
        backgroundColor: colors.gamification.achievement,
        color: colors.text.inverse,
        borderRadius: borderRadius.xl,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        minHeight: touchTargets.student.gamification,
        ...shadows.student.achievement,
      },
      social: {
        backgroundColor: colors.gamification.social,
        color: colors.text.inverse,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        minHeight: touchTargets.student.social,
        ...shadows.md,
      },
    },
    
    // Engaging card design
    Card: {
      default: {
        backgroundColor: colors.background.primary,
        borderRadius: borderRadius.educational.vocabularyCard,
        padding: spacing.lg,
        ...shadows.student.card,
      },
      interactive: {
        backgroundColor: colors.background.primary,
        borderRadius: borderRadius.educational.vocabularyCard,
        padding: spacing.lg,
        ...shadows.md,
      },
      achievement: {
        backgroundColor: colors.background.primary,
        borderRadius: borderRadius.educational.achievementBadge,
        padding: spacing.lg,
        ...shadows.student.achievement,
        borderWidth: 2,
        borderColor: colors.gamification.achievement,
      },
    },
    
    // Engaging form inputs
    Input: {
      default: {
        backgroundColor: colors.background.secondary,
        borderWidth: 0,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        minHeight: touchTargets.student.learning,
        ...typography.textStyles.bodyLarge,
      },
      focused: {
        backgroundColor: colors.background.primary,
        ...shadows.focus,
        borderWidth: 2,
        borderColor: colors.primary[500],
      },
    },
    
    // Engaging bottom tab navigation
    TabNavigation: {
      container: {
        height: spacing.navigation.tabBarHeight,
        backgroundColor: colors.background.primary,
        borderTopWidth: 0,
        paddingHorizontal: spacing.sm,
        ...shadows.lg,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
      },
      tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        minHeight: touchTargets.student.navigation,
        borderRadius: borderRadius.md,
      },
      activeTab: {
        backgroundColor: colors.primary[50],
        transform: [{ scale: 1.05 }],
        ...shadows.sm,
      },
      label: {
        ...typography.textStyles.labelMedium,
        color: colors.text.tertiary,
        marginTop: spacing[1],
      },
      activeLabel: {
        ...typography.textStyles.labelMedium,
        color: colors.primary[500],
        fontWeight: typography.fontWeight.bold,
      },
    },
  },
  
  // Student-specific educational components
  educational: {
    // Vocabulary flashcard
    VocabularyCard: {
      container: {
        backgroundColor: colors.background.primary,
        borderRadius: borderRadius.educational.vocabularyCard,
        padding: spacing.educational.vocabulary.cardPadding,
        minHeight: 200,
        ...shadows.student.card,
        borderWidth: 2,
        borderColor: colors.border.light,
      },
      flipped: {
        backgroundColor: colors.background.accent,
        ...shadows.lg,
        borderColor: colors.primary[200],
      },
      word: {
        ...typography.textStyles.displaySmall,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.md,
      },
      definition: {
        ...typography.textStyles.bodyLarge,
        color: colors.text.secondary,
        textAlign: 'center',
      },
    },
    
    // Achievement badge
    AchievementBadge: {
      container: {
        backgroundColor: colors.gamification.achievement,
        borderRadius: borderRadius.educational.achievementBadge,
        padding: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
        minHeight: 80,
        ...shadows.student.achievement,
      },
      icon: {
        width: 32,
        height: 32,
        marginBottom: spacing.xs,
      },
      title: {
        ...typography.textStyles.labelSmall,
        color: colors.text.inverse,
        fontWeight: typography.fontWeight.bold,
        textAlign: 'center',
      },
    },
    
    // Progress indicator
    ProgressIndicator: {
      container: {
        backgroundColor: colors.background.primary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        ...shadows.sm,
      },
      bar: {
        height: spacing.educational.progress.barHeight,
        backgroundColor: colors.neutral[200],
        borderRadius: borderRadius.full,
        overflow: 'hidden',
      },
      fill: {
        height: '100%',
        backgroundColor: colors.primary[500],
        borderRadius: borderRadius.full,
      },
      label: {
        ...typography.textStyles.labelMedium,
        color: colors.text.secondary,
        marginTop: spacing.educational.progress.labelSpacing,
        textAlign: 'center',
      },
    },
    
    // Ranking display
    RankingCard: {
      container: {
        backgroundColor: colors.background.primary,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.student.ranking,
        borderWidth: 3,
      },
      gold: {
        borderColor: colors.ranking.gold.main,
        backgroundColor: colors.ranking.gold.light,
      },
      silver: {
        borderColor: colors.ranking.silver.main,
        backgroundColor: colors.ranking.silver.light,
      },
      bronze: {
        borderColor: colors.ranking.bronze.main,
        backgroundColor: colors.ranking.bronze.light,
      },
      rank: {
        ...typography.textStyles.displayMedium,
        fontWeight: typography.fontWeight.extrabold,
        textAlign: 'center',
        marginBottom: spacing.sm,
      },
      name: {
        ...typography.textStyles.headlineSmall,
        textAlign: 'center',
        marginBottom: spacing.xs,
      },
      score: {
        ...typography.textStyles.bodyLarge,
        textAlign: 'center',
        color: colors.text.secondary,
      },
    },
  },
};

// Dark Theme - For both Teacher and Student
export const darkTheme = {
  ...baseTheme,
  
  // Dark mode color adjustments
  colors: {
    ...colors,
    primary: {
      ...colors.primary,
      main: colors.primary[400], // Lighter primary for dark backgrounds
      light: colors.primary[300],
      dark: colors.primary[500],
    },
    
    // Dark mode backgrounds
    background: {
      primary: colors.dark.background.primary,
      secondary: colors.dark.background.secondary,
      tertiary: colors.dark.background.tertiary,
      accent: colors.dark.background.accent,
      inverse: colors.background.primary,
      overlay: 'rgba(255, 255, 255, 0.1)',
    },
    
    // Dark mode text colors
    text: {
      primary: colors.dark.text.primary,
      secondary: colors.dark.text.secondary,
      tertiary: colors.dark.text.tertiary,
      disabled: colors.dark.text.disabled,
      inverse: colors.text.primary,
      link: colors.primary[400],
      linkHover: colors.primary[300],
    },
    
    // Dark mode borders
    border: {
      light: colors.dark.border.light,
      medium: colors.dark.border.medium,
      strong: colors.dark.border.strong,
      brand: colors.primary[400],
      error: colors.semantic.error.main,
      success: colors.semantic.success.main,
      warning: colors.semantic.warning.main,
    },
  },
  
  // Adjusted shadows for dark mode
  shadows: {
    ...shadows,
    // Minimal shadows in dark mode
    xs: { ...shadows.xs, shadowOpacity: 0.3 },
    sm: { ...shadows.sm, shadowOpacity: 0.3 },
    md: { ...shadows.md, shadowOpacity: 0.4 },
    lg: { ...shadows.lg, shadowOpacity: 0.5 },
    xl: { ...shadows.xl, shadowOpacity: 0.6 },
  },
};

// Theme Utilities
export const getThemeVariant = (variant: 'teacher' | 'student' | 'dark' = 'student') => {
  switch (variant) {
    case 'teacher':
      return teacherTheme;
    case 'dark':
      return darkTheme;
    case 'student':
    default:
      return studentTheme;
  }
};

// Component variant utilities
export const getComponentStyle = (
  theme: typeof teacherTheme | typeof studentTheme | typeof darkTheme,
  component: string,
  variant: string = 'default'
) => {
  const componentStyles = (theme.components as any)[component];
  return componentStyles?.[variant] || componentStyles?.default || {};
};

// Educational component utilities
export const getEducationalStyle = (
  theme: typeof teacherTheme | typeof studentTheme,
  component: string,
  variant: string = 'default'
) => {
  const educationalStyles = (theme.educational as any)[component];
  return educationalStyles?.[variant] || educationalStyles?.default || educationalStyles?.container || {};
};

// Export all theme variants
export default {
  teacher: teacherTheme,
  student: studentTheme,
  dark: darkTheme,
  base: baseTheme,
  getThemeVariant,
  getComponentStyle,
  getEducationalStyle,
};