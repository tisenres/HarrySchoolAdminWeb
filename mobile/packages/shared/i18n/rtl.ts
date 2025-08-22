import { I18nManager } from 'react-native';
import { getCurrentLanguage, SupportedLanguage } from './index';

// RTL languages that will be supported
const RTL_LANGUAGES: string[] = ['ar', 'fa', 'he', 'ur'];

// Future supported language that will require RTL
export type FutureRTLLanguage = 'ar'; // Arabic

// Check if a language requires RTL layout
export const isRTLLanguage = (language?: SupportedLanguage | FutureRTLLanguage): boolean => {
  const lang = language || getCurrentLanguage();
  return RTL_LANGUAGES.includes(lang);
};

// Get text direction for a language
export const getTextDirection = (language?: SupportedLanguage | FutureRTLLanguage): 'ltr' | 'rtl' => {
  return isRTLLanguage(language) ? 'rtl' : 'ltr';
};

// Set RTL layout for the app
export const setRTLLayout = (isRTL: boolean): void => {
  try {
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(isRTL);
      // Note: In React Native, changing RTL requires app restart
      console.warn('RTL layout change requires app restart to take effect');
    }
  } catch (error) {
    console.error('Failed to set RTL layout:', error);
  }
};

// Initialize RTL based on current language
export const initializeRTL = (): void => {
  const currentLanguage = getCurrentLanguage();
  const shouldBeRTL = isRTLLanguage(currentLanguage);
  
  if (shouldBeRTL !== I18nManager.isRTL) {
    setRTLLayout(shouldBeRTL);
  }
};

// RTL-aware style utilities
export interface RTLStyle {
  marginLeft?: number | string;
  marginRight?: number | string;
  paddingLeft?: number | string;
  paddingRight?: number | string;
  left?: number | string;
  right?: number | string;
  borderLeftWidth?: number;
  borderRightWidth?: number;
  borderLeftColor?: string;
  borderRightColor?: string;
  textAlign?: 'left' | 'right' | 'center' | 'justify';
}

// Convert LTR styles to RTL-aware styles
export const rtlStyle = (
  styles: RTLStyle,
  language?: SupportedLanguage | FutureRTLLanguage
): RTLStyle => {
  const isRTL = isRTLLanguage(language);
  
  if (!isRTL) {
    return styles;
  }
  
  // Create a copy of styles and swap RTL properties
  const rtlStyles: RTLStyle = { ...styles };
  
  // Swap margin properties
  if (styles.marginLeft !== undefined || styles.marginRight !== undefined) {
    rtlStyles.marginLeft = styles.marginRight;
    rtlStyles.marginRight = styles.marginLeft;
  }
  
  // Swap padding properties
  if (styles.paddingLeft !== undefined || styles.paddingRight !== undefined) {
    rtlStyles.paddingLeft = styles.paddingRight;
    rtlStyles.paddingRight = styles.paddingLeft;
  }
  
  // Swap position properties
  if (styles.left !== undefined || styles.right !== undefined) {
    rtlStyles.left = styles.right;
    rtlStyles.right = styles.left;
  }
  
  // Swap border properties
  if (styles.borderLeftWidth !== undefined || styles.borderRightWidth !== undefined) {
    rtlStyles.borderLeftWidth = styles.borderRightWidth;
    rtlStyles.borderRightWidth = styles.borderLeftWidth;
  }
  
  if (styles.borderLeftColor !== undefined || styles.borderRightColor !== undefined) {
    rtlStyles.borderLeftColor = styles.borderRightColor;
    rtlStyles.borderRightColor = styles.borderLeftColor;
  }
  
  // Swap text alignment
  if (styles.textAlign === 'left') {
    rtlStyles.textAlign = 'right';
  } else if (styles.textAlign === 'right') {
    rtlStyles.textAlign = 'left';
  }
  
  return rtlStyles;
};

// RTL-aware flex direction
export const rtlFlexDirection = (
  direction: 'row' | 'row-reverse' | 'column' | 'column-reverse',
  language?: SupportedLanguage | FutureRTLLanguage
): 'row' | 'row-reverse' | 'column' | 'column-reverse' => {
  const isRTL = isRTLLanguage(language);
  
  if (!isRTL) {
    return direction;
  }
  
  // Reverse row directions for RTL
  switch (direction) {
    case 'row':
      return 'row-reverse';
    case 'row-reverse':
      return 'row';
    default:
      return direction;
  }
};

// RTL-aware text alignment
export const rtlTextAlign = (
  align: 'left' | 'right' | 'center' | 'justify' | 'auto',
  language?: SupportedLanguage | FutureRTLLanguage
): 'left' | 'right' | 'center' | 'justify' | 'auto' => {
  const isRTL = isRTLLanguage(language);
  
  if (!isRTL || align === 'center' || align === 'justify' || align === 'auto') {
    return align;
  }
  
  // Swap left and right for RTL
  switch (align) {
    case 'left':
      return 'right';
    case 'right':
      return 'left';
    default:
      return align;
  }
};

// Get appropriate transform for RTL (for icons, arrows, etc.)
export const rtlTransform = (
  language?: SupportedLanguage | FutureRTLLanguage
): Array<{ scaleX: number }> => {
  const isRTL = isRTLLanguage(language);
  return isRTL ? [{ scaleX: -1 }] : [];
};

// RTL-aware icon helper
export const getRTLIcon = (
  ltrIcon: string,
  rtlIcon: string,
  language?: SupportedLanguage | FutureRTLLanguage
): string => {
  return isRTLLanguage(language) ? rtlIcon : ltrIcon;
};

// Common RTL icon mappings
export const RTL_ICONS = {
  // Navigation arrows
  arrowLeft: { ltr: 'arrow-left', rtl: 'arrow-right' },
  arrowRight: { ltr: 'arrow-right', rtl: 'arrow-left' },
  chevronLeft: { ltr: 'chevron-left', rtl: 'chevron-right' },
  chevronRight: { ltr: 'chevron-right', rtl: 'chevron-left' },
  
  // Menu and navigation
  menu: { ltr: 'menu', rtl: 'menu' }, // Usually stays the same
  back: { ltr: 'arrow-left', rtl: 'arrow-right' },
  forward: { ltr: 'arrow-right', rtl: 'arrow-left' },
  
  // Text formatting
  alignLeft: { ltr: 'align-left', rtl: 'align-right' },
  alignRight: { ltr: 'align-right', rtl: 'align-left' },
  
  // Media controls
  previous: { ltr: 'skip-previous', rtl: 'skip-next' },
  next: { ltr: 'skip-next', rtl: 'skip-previous' },
  
  // Directional actions
  undo: { ltr: 'undo', rtl: 'redo' },
  redo: { ltr: 'redo', rtl: 'undo' },
};

// Helper to get RTL-appropriate icon name
export const getRTLIconName = (
  iconType: keyof typeof RTL_ICONS,
  language?: SupportedLanguage | FutureRTLLanguage
): string => {
  const isRTL = isRTLLanguage(language);
  const iconConfig = RTL_ICONS[iconType];
  return isRTL ? iconConfig.rtl : iconConfig.ltr;
};

// Arabic text utilities (for future Arabic support)
export const ARABIC_NUMERALS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
export const WESTERN_NUMERALS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// Convert Western numerals to Arabic numerals
export const toArabicNumerals = (text: string): string => {
  return text.replace(/[0-9]/g, (digit) => {
    return ARABIC_NUMERALS[parseInt(digit, 10)];
  });
};

// Convert Arabic numerals to Western numerals
export const toWesternNumerals = (text: string): string => {
  return text.replace(/[٠-٩]/g, (digit) => {
    const index = ARABIC_NUMERALS.indexOf(digit);
    return index !== -1 ? WESTERN_NUMERALS[index] : digit;
  });
};

// Format numbers for RTL languages
export const formatNumberForRTL = (
  number: number | string,
  language?: SupportedLanguage | FutureRTLLanguage,
  useArabicNumerals: boolean = false
): string => {
  const numStr = number.toString();
  const isRTL = isRTLLanguage(language);
  
  if (isRTL && language === 'ar' && useArabicNumerals) {
    return toArabicNumerals(numStr);
  }
  
  return numStr;
};

// CSS/Style helpers for RTL
export const rtlStyleSheet = {
  // Commonly used RTL-aware styles
  textAlignStart: (language?: SupportedLanguage | FutureRTLLanguage) => ({
    textAlign: isRTLLanguage(language) ? 'right' as const : 'left' as const,
  }),
  
  textAlignEnd: (language?: SupportedLanguage | FutureRTLLanguage) => ({
    textAlign: isRTLLanguage(language) ? 'left' as const : 'right' as const,
  }),
  
  marginStart: (value: number, language?: SupportedLanguage | FutureRTLLanguage) => 
    isRTLLanguage(language) 
      ? { marginRight: value } 
      : { marginLeft: value },
  
  marginEnd: (value: number, language?: SupportedLanguage | FutureRTLLanguage) => 
    isRTLLanguage(language) 
      ? { marginLeft: value } 
      : { marginRight: value },
  
  paddingStart: (value: number, language?: SupportedLanguage | FutureRTLLanguage) => 
    isRTLLanguage(language) 
      ? { paddingRight: value } 
      : { paddingLeft: value },
  
  paddingEnd: (value: number, language?: SupportedLanguage | FutureRTLLanguage) => 
    isRTLLanguage(language) 
      ? { paddingLeft: value } 
      : { paddingRight: value },
  
  borderStartWidth: (value: number, language?: SupportedLanguage | FutureRTLLanguage) => 
    isRTLLanguage(language) 
      ? { borderRightWidth: value } 
      : { borderLeftWidth: value },
  
  borderEndWidth: (value: number, language?: SupportedLanguage | FutureRTLLanguage) => 
    isRTLLanguage(language) 
      ? { borderLeftWidth: value } 
      : { borderRightWidth: value },
};

// Animation direction helpers for RTL
export const rtlAnimationDirection = (
  language?: SupportedLanguage | FutureRTLLanguage
): 'left-to-right' | 'right-to-left' => {
  return isRTLLanguage(language) ? 'right-to-left' : 'left-to-right';
};

// Gesture direction helpers for RTL
export const rtlSwipeDirection = (
  direction: 'left' | 'right' | 'up' | 'down',
  language?: SupportedLanguage | FutureRTLLanguage
): 'left' | 'right' | 'up' | 'down' => {
  const isRTL = isRTLLanguage(language);
  
  if (!isRTL) {
    return direction;
  }
  
  // Reverse horizontal swipes for RTL
  switch (direction) {
    case 'left':
      return 'right';
    case 'right':
      return 'left';
    default:
      return direction;
  }
};

export default {
  isRTLLanguage,
  getTextDirection,
  setRTLLayout,
  initializeRTL,
  rtlStyle,
  rtlFlexDirection,
  rtlTextAlign,
  rtlTransform,
  getRTLIcon,
  getRTLIconName,
  toArabicNumerals,
  toWesternNumerals,
  formatNumberForRTL,
  rtlStyleSheet,
  rtlAnimationDirection,
  rtlSwipeDirection,
  RTL_ICONS,
};