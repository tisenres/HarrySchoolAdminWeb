/**
 * Harry School Mobile Design System - Color System
 * 
 * Semantic color mappings and utility functions for consistent usage
 */

import { colors as colorTokens } from './tokens';

// Semantic color mappings for consistent usage
export const semanticColors = {
  // Primary actions and branding
  primary: {
    main: colorTokens.primary[500],
    light: colorTokens.primary[300],
    dark: colorTokens.primary[700],
    contrast: colorTokens.text.inverse,
  },
  
  // Secondary actions
  secondary: {
    main: colorTokens.neutral[600],
    light: colorTokens.neutral[400],
    dark: colorTokens.neutral[800],
    contrast: colorTokens.text.inverse,
  },
  
  // Status colors
  success: {
    main: colorTokens.semantic.success,
    light: '#6ee7b7',
    dark: '#047857',
    contrast: colorTokens.text.inverse,
  },
  
  warning: {
    main: colorTokens.semantic.warning,
    light: '#fde047',
    dark: '#b45309',
    contrast: colorTokens.text.primary,
  },
  
  error: {
    main: colorTokens.semantic.error,
    light: '#fca5a5',
    dark: '#dc2626',
    contrast: colorTokens.text.inverse,
  },
  
  info: {
    main: colorTokens.semantic.info,
    light: '#93c5fd',
    dark: '#1d4ed8',
    contrast: colorTokens.text.inverse,
  },
};

// Educational-specific color schemes
export const educationalColors = {
  // Subject colors for organization
  subjects: {
    english: '#8b5cf6',
    math: '#f59e0b',
    science: '#10b981',
    history: '#ef4444',
    language: '#3b82f6',
    arts: '#ec4899',
  },
  
  // Attendance status colors
  attendance: {
    present: semanticColors.success.main,
    absent: semanticColors.error.main,
    late: semanticColors.warning.main,
    excused: semanticColors.info.main,
  },
  
  // Task/assignment status colors
  taskStatus: {
    notStarted: colorTokens.neutral[400],
    inProgress: semanticColors.warning.main,
    completed: semanticColors.success.main,
    overdue: semanticColors.error.main,
    graded: semanticColors.info.main,
  },
  
  // Performance level colors
  performance: {
    excellent: '#10b981', // Green
    good: '#3b82f6',      // Blue
    average: '#f59e0b',   // Amber
    needsWork: '#ef4444', // Red
  },
};

// Ranking system colors with utility functions
export const rankingColors = {
  gold: colorTokens.ranking.gold,
  silver: colorTokens.ranking.silver,
  bronze: colorTokens.ranking.bronze,
  
  // Get color by position
  getPositionColor: (position: number): string => {
    if (position === 1) return colorTokens.ranking.gold;
    if (position === 2) return colorTokens.ranking.silver;
    if (position === 3) return colorTokens.ranking.bronze;
    return colorTokens.neutral[600];
  },
  
  // Get color by percentile
  getPercentileColor: (percentile: number): string => {
    if (percentile >= 90) return educationalColors.performance.excellent;
    if (percentile >= 75) return educationalColors.performance.good;
    if (percentile >= 50) return educationalColors.performance.average;
    return educationalColors.performance.needsWork;
  },
};

// Dark mode color overrides
export const darkModeColors = {
  background: {
    primary: colorTokens.neutral[900],
    secondary: colorTokens.neutral[800],
    tertiary: colorTokens.neutral[700],
    inverse: colorTokens.background.primary,
  },
  
  text: {
    primary: colorTokens.neutral[50],
    secondary: colorTokens.neutral[300],
    tertiary: colorTokens.neutral[400],
    inverse: colorTokens.text.primary,
  },
  
  border: {
    primary: colorTokens.neutral[700],
    secondary: colorTokens.neutral[600],
  },
};

// Accessibility helper functions
export const accessibilityColors = {
  // Get high contrast version of a color
  getHighContrast: (color: string, background: string = colorTokens.background.primary): string => {
    // This would typically use a color contrast calculation library
    // For now, return predetermined high contrast alternatives
    const contrastMap: Record<string, string> = {
      [colorTokens.primary[500]]: colorTokens.primary[700],
      [colorTokens.semantic.warning]: '#b45309',
      [colorTokens.neutral[400]]: colorTokens.neutral[600],
    };
    
    return contrastMap[color] || color;
  },
  
  // Check if color meets WCAG AA standards (4.5:1 ratio)
  meetsWCAGAA: (foreground: string, background: string): boolean => {
    // This would use a proper contrast ratio calculation
    // For now, return true for known good combinations
    const goodCombinations = [
      `${colorTokens.text.primary}-${colorTokens.background.primary}`,
      `${colorTokens.text.inverse}-${colorTokens.primary[500]}`,
      `${colorTokens.text.inverse}-${semanticColors.error.main}`,
    ];
    
    return goodCombinations.includes(`${foreground}-${background}`);
  },
};

// Utility function to get color with opacity
export const withOpacity = (color: string, opacity: number): string => {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const colors = {
  ...colorTokens,
  semantic: semanticColors,
  educational: educationalColors,
  ranking: rankingColors,
  darkMode: darkModeColors,
  accessibility: accessibilityColors,
  withOpacity,
};

export default colors;