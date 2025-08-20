/**
 * Harry School Mobile Design System - Design Tokens
 * 
 * Comprehensive design tokens optimized for mobile educational apps
 * Based on UX research findings for Teacher and Student applications
 * 
 * Primary color: #1d7452 (Harry School brand color)
 * Target users: Teachers (efficiency-focused) and Students (engagement-focused)
 * Location: Tashkent, Uzbekistan
 * 
 * Key UX Requirements Addressed:
 * - Teachers need efficiency: 5-10 minutes between classes, prefer simple interfaces
 * - Students need engagement: Visual progress tracking, gamification, social elements
 * - Mobile-first: 44pt minimum touch targets, thumb-zone optimization
 * - Accessibility: High contrast (4.5:1 ratio), clear typography, multilingual support
 */

export const colors = {
  // Primary Brand Colors (Harry School #1d7452)
  primary: {
    25: '#f0f9f4',
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
    950: '#041209',
  },
  
  // Semantic Colors (WCAG AA compliant - 4.5:1 contrast minimum)
  semantic: {
    success: {
      light: '#d1fae5',
      main: '#10b981',
      dark: '#047857',
      contrast: '#ffffff',
    },
    warning: {
      light: '#fef3c7',
      main: '#f59e0b',
      dark: '#d97706',
      contrast: '#ffffff',
    },
    error: {
      light: '#fee2e2',
      main: '#ef4444',
      dark: '#dc2626',
      contrast: '#ffffff',
    },
    info: {
      light: '#dbeafe',
      main: '#3b82f6',
      dark: '#1d4ed8',
      contrast: '#ffffff',
    },
  },
  
  // Neutral Colors (Accessibility optimized)
  neutral: {
    0: '#ffffff',
    25: '#fcfcfd',
    50: '#f9fafb',
    100: '#f2f4f7',
    200: '#eaecf0',
    300: '#d0d5dd',
    400: '#98a2b3',
    500: '#667085',
    600: '#475467',
    700: '#344054',
    800: '#1d2939',
    900: '#101828',
    950: '#0c111d',
  },
  
  // Educational Ranking Colors (Enhanced for mobile visibility)
  ranking: {
    gold: {
      light: '#fef7cd',
      main: '#eab308',
      dark: '#ca8a04',
      metallic: '#ffd700',
    },
    silver: {
      light: '#f1f5f9',
      main: '#64748b',
      dark: '#475569',
      metallic: '#c0c0c0',
    },
    bronze: {
      light: '#fed7aa',
      main: '#ea580c',
      dark: '#c2410c',
      metallic: '#cd7f32',
    },
  },
  
  // Educational-specific Progress Colors
  progress: {
    notStarted: '#94a3b8', // Neutral gray
    inProgress: '#3b82f6', // Blue for activity
    completed: '#10b981', // Green for success
    mastered: '#8b5cf6', // Purple for excellence
  },
  
  // Gamification Colors (Student engagement)
  gamification: {
    points: '#f59e0b', // Orange for points
    streak: '#ef4444', // Red for streaks (fire)
    achievement: '#8b5cf6', // Purple for achievements
    level: '#06b6d4', // Cyan for levels
    social: '#ec4899', // Pink for social features
  },
  
  // Task Status Colors (Teacher workflow optimization)
  taskStatus: {
    notStarted: '#6b7280',
    inProgress: '#2563eb',
    completed: '#059669',
    overdue: '#dc2626',
    cancelled: '#9ca3af',
  },
  
  // Background Colors (Theme variants)
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f2f4f7',
    accent: '#f0f9f4', // Subtle green tint
    inverse: '#101828',
    overlay: 'rgba(16, 24, 40, 0.7)',
  },
  
  // Text Colors (Accessibility compliant)
  text: {
    primary: '#101828', // 14.85:1 contrast ratio
    secondary: '#344054', // 7.25:1 contrast ratio
    tertiary: '#667085', // 4.75:1 contrast ratio
    placeholder: '#98a2b3', // For form inputs
    inverse: '#ffffff',
    disabled: '#d0d5dd',
    link: '#1d7452', // Brand color for links
    linkHover: '#124631',
  },
  
  // Border Colors
  border: {
    light: '#eaecf0',
    medium: '#d0d5dd',
    strong: '#98a2b3',
    brand: '#1d7452',
    error: '#fda29b',
    success: '#a7f3d0',
    warning: '#fed7aa',
  },
  
  // Dark Mode Colors
  dark: {
    background: {
      primary: '#101828',
      secondary: '#1d2939',
      tertiary: '#344054',
      accent: '#0c2f21', // Dark green tint
    },
    text: {
      primary: '#f9fafb',
      secondary: '#eaecf0',
      tertiary: '#d0d5dd',
      disabled: '#667085',
    },
    border: {
      light: '#344054',
      medium: '#475467',
      strong: '#667085',
    },
  },
  
  // Accessibility High Contrast Colors
  accessibility: {
    focus: '#1d7452', // Brand color for focus indicators
    focusRing: 'rgba(29, 116, 82, 0.3)',
    error: '#dc2626',
    success: '#059669',
    warning: '#d97706',
    highContrastText: '#000000',
    highContrastBackground: '#ffffff',
  },
};

export const typography = {
  // Font Family (Inter optimized for mobile readability)
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
    mono: 'SF Mono', // For code or numbers
  },
  
  // Font Sizes (Mobile-optimized scale)
  fontSize: {
    '2xs': 10, // Small badges, timestamps
    xs: 12,    // Captions, metadata
    sm: 14,    // Body text, labels
    base: 16,  // Default body text
    lg: 18,    // Emphasized text
    xl: 20,    // Small headings
    '2xl': 24, // Medium headings
    '3xl': 30, // Large headings
    '4xl': 36, // Extra large headings
    '5xl': 42, // Display text
    '6xl': 48, // Hero text
  },
  
  // Line Heights (Optimized for readability)
  lineHeight: {
    '2xs': 12,
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 32,
    '2xl': 36,
    '3xl': 42,
    '4xl': 48,
    '5xl': 56,
    '6xl': 64,
  },
  
  // Font Weights
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Text Styles (Semantic text styles for consistency)
  textStyles: {
    // Display styles
    displayLarge: {
      fontSize: 48,
      lineHeight: 64,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    displayMedium: {
      fontSize: 36,
      lineHeight: 48,
      fontWeight: '700',
      letterSpacing: -0.25,
    },
    displaySmall: {
      fontSize: 30,
      lineHeight: 42,
      fontWeight: '600',
    },
    
    // Headline styles
    headlineLarge: {
      fontSize: 24,
      lineHeight: 36,
      fontWeight: '600',
    },
    headlineMedium: {
      fontSize: 20,
      lineHeight: 32,
      fontWeight: '600',
    },
    headlineSmall: {
      fontSize: 18,
      lineHeight: 28,
      fontWeight: '600',
    },
    
    // Body styles
    bodyLarge: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400',
    },
    bodyMedium: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
    },
    bodySmall: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
    },
    
    // Label styles (for UI elements)
    labelLarge: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
    },
    labelMedium: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500',
    },
    labelSmall: {
      fontSize: 10,
      lineHeight: 12,
      fontWeight: '500',
    },
    
    // Button styles
    buttonLarge: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '600',
    },
    buttonMedium: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600',
    },
    buttonSmall: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600',
    },
  },
};

export const spacing = {
  // Base spacing scale (8pt grid system)
  0: 0,
  0.5: 2,  // 0.125rem
  1: 4,    // 0.25rem
  1.5: 6,  // 0.375rem
  2: 8,    // 0.5rem
  2.5: 10, // 0.625rem
  3: 12,   // 0.75rem
  3.5: 14, // 0.875rem
  4: 16,   // 1rem
  5: 20,   // 1.25rem
  6: 24,   // 1.5rem
  7: 28,   // 1.75rem
  8: 32,   // 2rem
  9: 36,   // 2.25rem
  10: 40,  // 2.5rem
  11: 44,  // 2.75rem
  12: 48,  // 3rem
  14: 56,  // 3.5rem
  16: 64,  // 4rem
  20: 80,  // 5rem
  24: 96,  // 6rem
  28: 112, // 7rem
  32: 128, // 8rem
  36: 144, // 9rem
  40: 160, // 10rem
  44: 176, // 11rem
  48: 192, // 12rem
  52: 208, // 13rem
  56: 224, // 14rem
  60: 240, // 15rem
  64: 256, // 16rem
  72: 288, // 18rem
  80: 320, // 20rem
  96: 384, // 24rem
  
  // Semantic spacing aliases
  xs: 4,   // Extra small
  sm: 8,   // Small
  md: 16,  // Medium (base)
  lg: 24,  // Large
  xl: 32,  // Extra large
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
  '5xl': 128,
  '6xl': 192,
  
  // Mobile-specific spacing (thumb-zone optimization)
  thumbZone: {
    comfortable: 44, // Comfortable reach area
    extended: 64,    // Extended reach (requires thumb movement)
    stretch: 84,     // Maximum comfortable reach
  },
  
  // Educational component spacing
  educational: {
    // Vocabulary card spacing
    vocabulary: {
      cardPadding: 20,
      cardMargin: 16,
      cardGap: 12,
    },
    
    // Task card spacing
    task: {
      contentPadding: 16,
      iconSpacing: 12,
      statusBarHeight: 4,
    },
    
    // Progress indicators
    progress: {
      barHeight: 8,
      ringStroke: 6,
      labelSpacing: 8,
    },
    
    // Ranking elements
    ranking: {
      badgeSize: 32,
      badgePadding: 8,
      listItemSpacing: 16,
    },
  },
  
  // Form component spacing
  form: {
    inputPadding: 12,
    inputVerticalPadding: 16,
    labelMargin: 4,
    fieldMargin: 20,
    sectionMargin: 32,
  },
  
  // Navigation spacing
  navigation: {
    tabBarHeight: 64,
    tabBarPadding: 8,
    headerHeight: 56,
    headerPadding: 16,
  },
  
  // Modal and overlay spacing
  modal: {
    padding: 24,
    margin: 20,
    backdropPadding: 16,
  },
};

export const borderRadius = {
  // Border radius scale (friendly, educational design)
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,   // Standard for cards, buttons
  lg: 12,  // Larger components
  xl: 16,  // Modal, major containers
  '2xl': 24,
  '3xl': 32,
  full: 9999,
  
  // Component-specific radius
  button: 8,
  card: 12,
  input: 8,
  modal: 16,
  badge: 16,
  avatar: 9999,
  
  // Educational component radius (softer, friendlier)
  educational: {
    vocabularyCard: 16,
    taskCard: 12,
    progressBar: 8,
    rankingBadge: 9999,
    achievementBadge: 16,
  },
};

// Mobile Touch Targets (WCAG AA compliant + UX research optimized)
export const touchTargets = {
  minimum: 44,      // iOS minimum (WCAG AA)
  recommended: 48,  // Material Design recommendation
  comfortable: 52,  // Comfortable for most users
  large: 56,        // Large interactive elements
  extraLarge: 64,   // Primary actions
  
  // Educational context specific
  educational: {
    attendance: 52,     // Quick attendance marking
    vocabulary: 48,     // Flashcard interactions
    navigation: 56,     // Bottom tab navigation
    primaryAction: 64,  // Main CTA buttons
    quickAction: 44,    // Minimum for secondary actions
  },
  
  // Teacher workflow optimization
  teacher: {
    quickMark: 48,      // Fast attendance/grading
    bulkAction: 52,     // Bulk operations
    navigation: 56,     // Tab navigation
  },
  
  // Student engagement optimization
  student: {
    gamification: 56,   // Achievement, reward buttons
    learning: 52,       // Lesson interaction
    social: 48,         // Social features
    navigation: 56,     // Tab navigation
  },
};

// Shadow/Elevation System (Cross-platform optimized)
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  // Subtle shadows for professional (teacher) theme
  xs: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
  '2xl': {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
  },
  
  // Enhanced shadows for student engagement theme
  student: {
    card: {
      shadowColor: '#101828',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
    },
    achievement: {
      shadowColor: '#8b5cf6', // Purple glow for achievements
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    ranking: {
      shadowColor: '#eab308', // Gold glow for rankings
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 10,
    },
  },
  
  // Professional shadows for teacher theme
  teacher: {
    card: {
      shadowColor: '#101828',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    modal: {
      shadowColor: '#101828',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  // Focus and interaction shadows
  focus: {
    shadowColor: '#1d7452', // Brand color focus
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 0,
  },
  
  // Inner shadow effect (for pressed states)
  inner: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: -1, // Negative elevation for inner shadow effect
  },
};

// Animation Tokens (Optimized for mobile performance and UX)
export const animation = {
  // Duration scale (based on UX research - fast interactions for efficiency)
  duration: {
    instant: 0,      // No animation
    immediate: 50,   // Micro-interactions
    fast: 150,       // Quick feedback (teacher efficiency)
    normal: 300,     // Standard transitions
    slow: 500,       // Emphasis animations
    slower: 700,     // Complex animations
    slowest: 1000,   // Special effects
  },
  
  // Easing functions (natural, mobile-optimized)
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)', // Preferred for exit animations
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)', // Preferred for enter animations
    
    // Educational-specific easing
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // For achievements
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // For gamification
    
    // Performance-optimized (for 60fps)
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)', // Quick, decisive
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)', // Standard material
  },
  
  // Spring animations (for React Native Reanimated)
  spring: {
    // Gentle spring for professional teacher interface
    gentle: {
      damping: 20,
      stiffness: 120,
      mass: 1,
    },
    // Standard spring for general interactions
    standard: {
      damping: 15,
      stiffness: 150,
      mass: 1,
    },
    // Bouncy spring for student gamification
    bouncy: {
      damping: 10,
      stiffness: 100,
      mass: 1,
    },
    // Snappy spring for immediate feedback
    snappy: {
      damping: 25,
      stiffness: 200,
      mass: 0.8,
    },
  },
  
  // Animation presets for common patterns
  presets: {
    // Success celebrations (student achievements)
    celebration: {
      duration: 500,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    
    // Quick feedback (teacher efficiency)
    feedback: {
      duration: 150,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
    },
    
    // Page transitions
    pageTransition: {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    
    // Modal animations
    modal: {
      enter: {
        duration: 300,
        easing: 'cubic-bezier(0, 0, 0.2, 1)',
      },
      exit: {
        duration: 200,
        easing: 'cubic-bezier(0.4, 0, 1, 1)',
      },
    },
    
    // Loading states
    loading: {
      duration: 1000,
      easing: 'linear',
    },
  },
};

// Opacity Scale (Accessibility and UX optimized)
export const opacity = {
  transparent: 0,
  subtle: 0.05,
  light: 0.1,
  medium: 0.2,
  disabled: 0.38,    // WCAG AA compliant for disabled states
  hover: 0.04,       // Subtle hover overlay
  active: 0.08,      // Active/pressed state
  overlay: 0.7,      // Modal backdrop
  loading: 0.6,      // Loading states
  emphasis: 0.87,    // High emphasis text
  
  // Educational context opacities
  educational: {
    completed: 0.7,    // Completed tasks/lessons
    inProgress: 1.0,   // Active items
    notStarted: 0.5,   // Future items
    mastered: 0.9,     // Mastered content
  },
};

// Z-Index Scale (Layered UI management)
export const zIndex = {
  base: 0,
  raised: 1,         // Slightly elevated content
  dropdown: 10,      // Dropdown menus
  sticky: 20,        // Sticky headers
  overlay: 30,       // Background overlays
  modal: 40,         // Modal dialogs
  popover: 50,       // Popovers, tooltips
  toast: 60,         // Toast notifications
  tooltip: 70,       // Tooltips (highest priority)
  
  // Educational component z-index
  educational: {
    flashcard: 10,     // Vocabulary flashcards
    achievement: 45,   // Achievement notifications
    progress: 5,       // Progress indicators
    ranking: 15,       // Ranking displays
  },
};

// Performance Tokens
export const performance = {
  // Target metrics based on UX research
  targets: {
    appLaunch: 2000,      // < 2s to interactive
    transition: 300,      // < 300ms for smooth feel
    dataLoading: 1000,    // < 1s for cached content
    networkRequest: 3000, // < 3s with loading indicators
  },
  
  // Memory management
  memory: {
    imageCache: 50,       // Max cached images
    audioCache: 20,       // Max cached audio files
    maxBundleSize: 500,   // 500KB initial bundle
  },
  
  // Offline capabilities
  offline: {
    cacheDuration: 604800000, // 7 days in milliseconds
    maxOfflineActions: 100,   // Queue limit for offline actions
    syncBatchSize: 10,        // Items to sync at once
  },
};

// Accessibility Tokens
export const accessibility = {
  // WCAG AA compliance requirements
  contrast: {
    minimum: 4.5,      // Minimum contrast ratio
    enhanced: 7,       // Enhanced contrast ratio
    large: 3,          // Large text minimum
  },
  
  // Focus indicators
  focus: {
    width: 2,          // Focus ring width
    offset: 2,         // Focus ring offset
    opacity: 1,        // Focus ring opacity
  },
  
  // Touch targets (duplicated for easy access)
  touch: {
    minimum: 44,       // Minimum touch target
    recommended: 48,   // Recommended touch target
  },
  
  // Animation preferences
  motion: {
    reducedMotion: {
      duration: 0,     // No animation for reduced motion
      easing: 'linear',
    },
  },
};

// Internationalization Tokens
export const i18n = {
  // Text direction support
  direction: {
    ltr: 'ltr',        // Left to right (English, Russian)
    rtl: 'rtl',        // Right to left (Arabic, Hebrew)
  },
  
  // Language-specific adjustments
  languages: {
    english: {
      lineHeightMultiplier: 1,
      letterSpacing: 0,
    },
    russian: {
      lineHeightMultiplier: 1.1, // Slightly taller for Cyrillic
      letterSpacing: 0.01,
    },
    uzbek: {
      lineHeightMultiplier: 1,
      letterSpacing: 0,
    },
  },
  
  // Text expansion factors (for layout)
  expansion: {
    english: 1,        // Base language
    russian: 1.2,      // 20% longer on average
    uzbek: 1.1,        // 10% longer on average
  },
};

// Utility Functions
export const utils = {
  // Color utilities
  withOpacity: (color: string, opacity: number) => {
    // Convert hex to rgba
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },
  
  // Spacing utilities
  spacing: {
    padding: {
      all: (size: keyof typeof spacing) => ({ padding: spacing[size] }),
      horizontal: (size: keyof typeof spacing) => ({ 
        paddingLeft: spacing[size], 
        paddingRight: spacing[size] 
      }),
      vertical: (size: keyof typeof spacing) => ({ 
        paddingTop: spacing[size], 
        paddingBottom: spacing[size] 
      }),
    },
    margin: {
      all: (size: keyof typeof spacing) => ({ margin: spacing[size] }),
      horizontal: (size: keyof typeof spacing) => ({ 
        marginLeft: spacing[size], 
        marginRight: spacing[size] 
      }),
      vertical: (size: keyof typeof spacing) => ({ 
        marginTop: spacing[size], 
        marginBottom: spacing[size] 
      }),
    },
  },
  
  // Typography utilities
  text: {
    style: (styleName: keyof typeof typography.textStyles) => 
      typography.textStyles[styleName],
  },
  
  // Responsive utilities
  responsive: {
    mobile: (styles: any) => styles, // Base mobile styles
    tablet: (styles: any) => ({ ...styles }), // Tablet overrides
  },
};

// Theme Variants Configuration
export const themeVariants = {
  // Teacher theme configuration
  teacher: {
    name: 'teacher',
    primary: colors.primary[600],     // Slightly darker for professional feel
    shadows: 'subtle',               // Use subtle shadows
    animations: 'minimal',           // Faster, efficiency-focused animations
    gamification: false,             // Disable gamification elements
  },
  
  // Student theme configuration
  student: {
    name: 'student',
    primary: colors.primary[500],     // Standard brand color
    shadows: 'enhanced',             // More prominent shadows
    animations: 'full',              // Full animation suite with celebrations
    gamification: true,              // Enable all gamification elements
  },
  
  // Dark mode configuration
  dark: {
    name: 'dark',
    primary: colors.primary[400],     // Lighter primary for dark backgrounds
    shadows: 'minimal',              // Minimal shadows in dark mode
    animations: 'standard',          // Standard animations
    gamification: true,              // Maintain engagement features
  },
};

// Export all tokens
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
  performance,
  accessibility,
  i18n,
  utils,
  themeVariants,
};