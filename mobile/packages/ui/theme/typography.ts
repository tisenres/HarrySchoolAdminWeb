/**
 * Harry School Mobile Design System - Typography System
 * 
 * Complete text style system optimized for mobile educational apps
 */

import { typography as typographyTokens, colors } from './tokens';

// Base text styles using design tokens
export const textStyles = {
  // Heading styles
  h1: {
    fontFamily: typographyTokens.fontFamily.bold,
    fontSize: typographyTokens.fontSize['4xl'],
    lineHeight: typographyTokens.fontSize['4xl'] * 1.2,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  
  h2: {
    fontFamily: typographyTokens.fontFamily.bold,
    fontSize: typographyTokens.fontSize['3xl'],
    lineHeight: typographyTokens.fontSize['3xl'] * 1.2,
    color: colors.text.primary,
    letterSpacing: -0.25,
  },
  
  h3: {
    fontFamily: typographyTokens.fontFamily.semibold,
    fontSize: typographyTokens.fontSize['2xl'],
    lineHeight: typographyTokens.fontSize['2xl'] * 1.25,
    color: colors.text.primary,
  },
  
  h4: {
    fontFamily: typographyTokens.fontFamily.semibold,
    fontSize: typographyTokens.fontSize.xl,
    lineHeight: typographyTokens.fontSize.xl * 1.3,
    color: colors.text.primary,
  },
  
  h5: {
    fontFamily: typographyTokens.fontFamily.semibold,
    fontSize: typographyTokens.fontSize.lg,
    lineHeight: typographyTokens.fontSize.lg * 1.4,
    color: colors.text.primary,
  },
  
  h6: {
    fontFamily: typographyTokens.fontFamily.medium,
    fontSize: typographyTokens.fontSize.base,
    lineHeight: typographyTokens.fontSize.base * 1.5,
    color: colors.text.primary,
  },
  
  // Body text styles
  bodyLarge: {
    fontFamily: typographyTokens.fontFamily.regular,
    fontSize: typographyTokens.fontSize.lg,
    lineHeight: typographyTokens.fontSize.lg * 1.6,
    color: colors.text.primary,
  },
  
  body: {
    fontFamily: typographyTokens.fontFamily.regular,
    fontSize: typographyTokens.fontSize.base,
    lineHeight: typographyTokens.fontSize.base * 1.5,
    color: colors.text.primary,
  },
  
  bodySmall: {
    fontFamily: typographyTokens.fontFamily.regular,
    fontSize: typographyTokens.fontSize.sm,
    lineHeight: typographyTokens.fontSize.sm * 1.4,
    color: colors.text.secondary,
  },
  
  // Caption and helper text
  caption: {
    fontFamily: typographyTokens.fontFamily.regular,
    fontSize: typographyTokens.fontSize.xs,
    lineHeight: typographyTokens.fontSize.xs * 1.3,
    color: colors.text.tertiary,
  },
  
  // Button and interactive text
  buttonLarge: {
    fontFamily: typographyTokens.fontFamily.semibold,
    fontSize: typographyTokens.fontSize.lg,
    lineHeight: typographyTokens.fontSize.lg * 1.2,
    letterSpacing: 0.25,
  },
  
  button: {
    fontFamily: typographyTokens.fontFamily.semibold,
    fontSize: typographyTokens.fontSize.base,
    lineHeight: typographyTokens.fontSize.base * 1.2,
    letterSpacing: 0.25,
  },
  
  buttonSmall: {
    fontFamily: typographyTokens.fontFamily.medium,
    fontSize: typographyTokens.fontSize.sm,
    lineHeight: typographyTokens.fontSize.sm * 1.2,
    letterSpacing: 0.1,
  },
};

// Educational-specific text styles
export const educationalTextStyles = {
  // Lesson content
  lessonTitle: {
    fontFamily: typographyTokens.fontFamily.bold,
    fontSize: typographyTokens.fontSize['2xl'],
    lineHeight: typographyTokens.fontSize['2xl'] * 1.3,
    color: colors.text.primary,
  },
  
  lessonContent: {
    fontFamily: typographyTokens.fontFamily.regular,
    fontSize: typographyTokens.fontSize.lg,
    lineHeight: typographyTokens.fontSize.lg * 1.6,
    color: colors.text.primary,
  },
  
  // Vocabulary styles
  vocabularyWord: {
    fontFamily: typographyTokens.fontFamily.bold,
    fontSize: typographyTokens.fontSize.xl,
    lineHeight: typographyTokens.fontSize.xl * 1.2,
    color: colors.primary[600],
  },
  
  vocabularyDefinition: {
    fontFamily: typographyTokens.fontFamily.regular,
    fontSize: typographyTokens.fontSize.base,
    lineHeight: typographyTokens.fontSize.base * 1.5,
    color: colors.text.primary,
    fontStyle: 'italic',
  },
  
  vocabularyExample: {
    fontFamily: typographyTokens.fontFamily.regular,
    fontSize: typographyTokens.fontSize.sm,
    lineHeight: typographyTokens.fontSize.sm * 1.4,
    color: colors.text.secondary,
  },
  
  // Grade and score displays
  gradeDisplay: {
    fontFamily: typographyTokens.fontFamily.bold,
    fontSize: typographyTokens.fontSize['3xl'],
    lineHeight: typographyTokens.fontSize['3xl'] * 1.1,
    textAlign: 'center' as const,
  },
  
  percentageDisplay: {
    fontFamily: typographyTokens.fontFamily.semibold,
    fontSize: typographyTokens.fontSize.xl,
    lineHeight: typographyTokens.fontSize.xl * 1.2,
  },
  
  // Ranking styles
  rankingPosition: {
    fontFamily: typographyTokens.fontFamily.bold,
    fontSize: typographyTokens.fontSize['4xl'],
    lineHeight: typographyTokens.fontSize['4xl'] * 1.1,
    textAlign: 'center' as const,
  },
  
  rankingLabel: {
    fontFamily: typographyTokens.fontFamily.medium,
    fontSize: typographyTokens.fontSize.sm,
    lineHeight: typographyTokens.fontSize.sm * 1.3,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
};

// Form and input text styles
export const formTextStyles = {
  label: {
    fontFamily: typographyTokens.fontFamily.medium,
    fontSize: typographyTokens.fontSize.sm,
    lineHeight: typographyTokens.fontSize.sm * 1.3,
    color: colors.text.primary,
    marginBottom: 4,
  },
  
  input: {
    fontFamily: typographyTokens.fontFamily.regular,
    fontSize: typographyTokens.fontSize.base,
    lineHeight: typographyTokens.fontSize.base * 1.4,
    color: colors.text.primary,
  },
  
  placeholder: {
    fontFamily: typographyTokens.fontFamily.regular,
    fontSize: typographyTokens.fontSize.base,
    lineHeight: typographyTokens.fontSize.base * 1.4,
    color: colors.text.tertiary,
  },
  
  helperText: {
    fontFamily: typographyTokens.fontFamily.regular,
    fontSize: typographyTokens.fontSize.xs,
    lineHeight: typographyTokens.fontSize.xs * 1.3,
    color: colors.text.secondary,
    marginTop: 4,
  },
  
  errorText: {
    fontFamily: typographyTokens.fontFamily.medium,
    fontSize: typographyTokens.fontSize.xs,
    lineHeight: typographyTokens.fontSize.xs * 1.3,
    color: colors.semantic.error,
    marginTop: 4,
  },
};

// Utility functions for text styles
export const getTextStyle = (variant: keyof typeof textStyles) => {
  return textStyles[variant];
};

export const getEducationalTextStyle = (variant: keyof typeof educationalTextStyles) => {
  return educationalTextStyles[variant];
};

export const getFormTextStyle = (variant: keyof typeof formTextStyles) => {
  return formTextStyles[variant];
};

// Responsive text size utility
export const getResponsiveTextSize = (baseSize: number, screenWidth: number) => {
  // Scale factor based on screen width
  const scaleFactor = Math.max(0.8, Math.min(1.2, screenWidth / 375)); // 375 is iPhone 6/7/8 width
  return Math.round(baseSize * scaleFactor);
};

// Text accessibility helpers
export const accessibilityTextStyles = {
  // High contrast text for accessibility
  highContrast: {
    color: colors.text.primary,
    fontWeight: typographyTokens.fontWeight.semibold,
  },
  
  // Large text for better readability
  largeText: {
    fontSize: typographyTokens.fontSize.lg,
    lineHeight: typographyTokens.fontSize.lg * 1.5,
  },
  
  // Focus indicators for text elements
  focusVisible: {
    outline: `2px solid ${colors.primary[500]}`,
    outlineOffset: 2,
  },
};

export const typography = {
  tokens: typographyTokens,
  textStyles,
  educational: educationalTextStyles,
  form: formTextStyles,
  accessibility: accessibilityTextStyles,
  utils: {
    getTextStyle,
    getEducationalTextStyle,
    getFormTextStyle,
    getResponsiveTextSize,
  },
};

export default typography;