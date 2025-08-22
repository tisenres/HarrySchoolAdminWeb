import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Colors - Modern, vibrant, and accessible
export const COLORS = {
  // Primary brand colors
  primary: '#1d7452',
  primaryLight: '#2d9e6a',
  primaryDark: '#165a3f',
  
  // Secondary colors
  secondary: '#6366f1',
  secondaryLight: '#8b5cf6',
  secondaryDark: '#4f46e5',
  
  // Accent colors for gamification
  gold: '#f59e0b',
  goldLight: '#fbbf24',
  goldDark: '#d97706',
  
  purple: '#8b5cf6',
  purpleLight: '#a78bfa',
  purpleDark: '#7c3aed',
  
  pink: '#ec4899',
  pinkLight: '#f472b6',
  pinkDark: '#db2777',
  
  cyan: '#06b6d4',
  cyanLight: '#22d3ee',
  cyanDark: '#0891b2',
  
  // Status colors
  success: '#10b981',
  successLight: '#34d399',
  successDark: '#059669',
  
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  warningDark: '#d97706',
  
  error: '#ef4444',
  errorLight: '#f87171',
  errorDark: '#dc2626',
  
  info: '#3b82f6',
  infoLight: '#60a5fa',
  infoDark: '#2563eb',
  
  // Neutral colors
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  black: '#000000',
  
  // Semantic colors
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  
  text: '#1a1a1a',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  textInverted: '#ffffff',
  
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderDark: '#cbd5e1',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',
  overlayDark: 'rgba(0, 0, 0, 0.8)',
  
  // Achievement rarity colors
  common: '#94a3b8',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b',
  
  // Subject colors
  english: '#3b82f6',
  math: '#10b981',
  science: '#f59e0b',
  history: '#8b5cf6',
  art: '#ec4899',
  music: '#06b6d4',
  
  // Level colors (gradient stops)
  level1: '#dcfce7', // light green
  level5: '#bbf7d0',
  level10: '#86efac',
  level15: '#4ade80',
  level20: '#22c55e',
  level25: '#16a34a',
  level30: '#15803d',
};

// Typography scale
export const TYPOGRAPHY = {
  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
  
  // Font weights
  thin: '100' as const,
  extraLight: '200' as const,
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
  black: '900' as const,
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
    widest: 1,
  },
};

// Spacing scale (in pixels)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
  '7xl': 96,
  '8xl': 128,
};

// Border radius scale
export const BORDER_RADIUS = {
  none: 0,
  xs: 2,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  base: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Dimensions
export const DIMENSIONS = {
  screenWidth,
  screenHeight,
  isSmallScreen: screenWidth < 375,
  isLargeScreen: screenWidth > 414,
  
  // Common component sizes
  buttonHeight: 48,
  inputHeight: 48,
  tabBarHeight: 80,
  headerHeight: 56,
  cardMinHeight: 120,
  
  // Responsive breakpoints
  breakpoints: {
    sm: 480,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
};

// Animation durations
export const ANIMATIONS = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
  },
  
  easing: {
    linear: 'linear' as const,
    ease: 'ease' as const,
    easeIn: 'ease-in' as const,
    easeOut: 'ease-out' as const,
    easeInOut: 'ease-in-out' as const,
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' as const,
  },
};

// Z-index scale
export const Z_INDEX = {
  hide: -1,
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  tooltip: 600,
  toast: 700,
  max: 999,
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  DIMENSIONS,
  ANIMATIONS,
  Z_INDEX,
};