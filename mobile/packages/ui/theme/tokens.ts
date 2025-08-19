/**
 * Harry School Mobile Design System - Design Tokens
 * 
 * Comprehensive design tokens optimized for mobile educational apps
 * Primary color: #1d7452 (Harry School brand color)
 */

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#e6f2ed',
    100: '#cce5db',
    200: '#99cbb7',
    300: '#66b194',
    400: '#339770',
    500: '#1d7452', // Primary brand color
    600: '#175d42',
    700: '#124631',
    800: '#0c2f21',
    900: '#061810',
  },
  
  // Semantic Colors
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  // Neutral Colors
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },
  
  // Educational Ranking Colors
  ranking: {
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
  },
  
  // Background Colors
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    inverse: '#1e293b',
  },
  
  // Text Colors
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    tertiary: '#94a3b8',
    inverse: '#ffffff',
  },
};

export const typography = {
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 32,
    '2xl': 36,
    '3xl': 42,
    '4xl': 48,
  },
  
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
  '5xl': 128,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// Mobile Touch Targets (WCAG AA compliant)
export const touchTargets = {
  minimum: 44, // iOS minimum
  recommended: 48, // Material Design recommendation
  large: 56,
  extraLarge: 64,
};

// Shadow/Elevation System
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 10,
  },
};

// Animation Tokens
export const animation = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    linear: 'linear',
    easeOut: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    easeIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    easeInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  },
};

// Opacity Scale
export const opacity = {
  disabled: 0.4,
  hover: 0.8,
  active: 0.6,
  overlay: 0.5,
};

// Z-Index Scale
export const zIndex = {
  base: 0,
  overlay: 10,
  modal: 20,
  popover: 30,
  tooltip: 40,
  toast: 50,
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  touchTargets,
  shadows,
  animation,
  opacity,
  zIndex,
};