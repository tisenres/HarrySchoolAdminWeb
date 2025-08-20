/**
 * Harry School Mobile Design System
 * 
 * Main export file for the comprehensive design system
 * Optimized for Teacher and Student mobile applications
 */

// Core design tokens (enhanced)
export * from './tokens';

// Theme Modules (existing)
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './theme';
export * from './animations';

// New comprehensive modules
export * from './variants';
export * from './accessibility';
export * from './performance';

// Theme Provider and Context
export * from './ThemeProvider';
export { default as ThemeProvider } from './ThemeProvider';

// Main Theme Object (existing + enhanced)
export { default as theme } from './theme';
export { harrySchoolTheme, studentTheme, teacherTheme, darkTheme, getTheme, getComponent, getComponentVariant } from './theme';

// Enhanced theme variants
export { 
  baseTheme, 
  getThemeVariant, 
  getComponentStyle, 
  getEducationalStyle 
} from './variants';

// Component specifications
export { 
  Button, 
  Card, 
  Educational,
  getComponentState,
  getComponentSize
} from './components';

// Accessibility utilities
export { 
  accessibilityUtils,
  accessibilityStandards,
  highContrastColors 
} from './accessibility';

// Performance utilities
export { 
  performanceUtils,
  performanceTargets 
} from './performance';

// Animation System
export { animations } from './animations';

// Animation Configuration & Adaptive System
export { 
  animationConfig, 
  useAnimationConfig, 
  EducationalPresets,
  AnimationConfigManager 
} from './animationConfig';

// Utility functions
export const createTheme = (variant: 'teacher' | 'student' | 'dark' = 'student') => {
  return getThemeVariant(variant);
};

// Enhanced theme objects
export const teacherAppTheme = createTheme('teacher');
export const studentAppTheme = createTheme('student');
export const darkModeTheme = createTheme('dark');