import i18n, { Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { findBestLanguageTag } from 'react-native-localize';
import { MMKV } from 'react-native-mmkv';
import moment from 'moment';
import 'moment/locale/ru';
import 'moment/locale/uz-latn';

// Import translations
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enLessons from './locales/en/lessons.json';
import enProfile from './locales/en/profile.json';
import enSettings from './locales/en/settings.json';
import enTeacher from './locales/en/teacher.json';
import enStudent from './locales/en/student.json';
import enParent from './locales/en/parent.json';
import enCultural from './locales/en/cultural.json';

import ruCommon from './locales/ru/common.json';
import ruAuth from './locales/ru/auth.json';
import ruDashboard from './locales/ru/dashboard.json';
import ruLessons from './locales/ru/lessons.json';
import ruProfile from './locales/ru/profile.json';
import ruSettings from './locales/ru/settings.json';
import ruTeacher from './locales/ru/teacher.json';
import ruStudent from './locales/ru/student.json';
import ruParent from './locales/ru/parent.json';
import ruCultural from './locales/ru/cultural.json';

import uzCommon from './locales/uz/common.json';
import uzAuth from './locales/uz/auth.json';
import uzDashboard from './locales/uz/dashboard.json';
import uzLessons from './locales/uz/lessons.json';
import uzProfile from './locales/uz/profile.json';
import uzSettings from './locales/uz/settings.json';
import uzTeacher from './locales/uz/teacher.json';
import uzStudent from './locales/uz/student.json';
import uzParent from './locales/uz/parent.json';
import uzCultural from './locales/uz/cultural.json';

// High-performance storage
const storage = new MMKV({ id: 'i18n-storage' });

// Supported languages
export const supportedLanguages = {
  en: 'English',
  ru: 'Русский',
  uz: "O'zbek",
} as const;

export type SupportedLanguage = keyof typeof supportedLanguages;

// Available locales for device detection
const availableLanguages = ['en', 'ru', 'uz'];

// Translation resources
const resources: Resource = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    lessons: enLessons,
    profile: enProfile,
    settings: enSettings,
    teacher: enTeacher,
    student: enStudent,
    parent: enParent,
    cultural: enCultural,
  },
  ru: {
    common: ruCommon,
    auth: ruAuth,
    dashboard: ruDashboard,
    lessons: ruLessons,
    profile: ruProfile,
    settings: ruSettings,
    teacher: ruTeacher,
    student: ruStudent,
    parent: ruParent,
    cultural: ruCultural,
  },
  uz: {
    common: uzCommon,
    auth: uzAuth,
    dashboard: uzDashboard,
    lessons: uzLessons,
    profile: uzProfile,
    settings: uzSettings,
    teacher: uzTeacher,
    student: uzStudent,
    parent: uzParent,
    cultural: uzCultural,
  },
};

// Get stored language preference
function getStoredLanguage(): SupportedLanguage | null {
  try {
    const stored = storage.getString('language');
    return stored && stored in supportedLanguages ? (stored as SupportedLanguage) : null;
  } catch (error) {
    console.warn('Failed to get stored language:', error);
    return null;
  }
}

// Store language preference
function storeLanguage(language: SupportedLanguage): void {
  try {
    storage.set('language', language);
  } catch (error) {
    console.warn('Failed to store language:', error);
  }
}

// Detect device language
function detectDeviceLanguage(): SupportedLanguage {
  try {
    const deviceLanguage = findBestLanguageTag(availableLanguages);
    if (deviceLanguage && deviceLanguage.languageTag in supportedLanguages) {
      return deviceLanguage.languageTag as SupportedLanguage;
    }
  } catch (error) {
    console.warn('Failed to detect device language:', error);
  }
  
  // Default to English if detection fails
  return 'en';
}

// Get initial language
function getInitialLanguage(): SupportedLanguage {
  // Priority: stored > device detected > default English
  return getStoredLanguage() || detectDeviceLanguage() || 'en';
}

// Pluralization rules for Russian and Uzbek
const pluralRules = {
  ru: (count: number): number => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    
    if (mod10 === 1 && mod100 !== 11) return 0; // один день
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 1; // два дня
    return 2; // пять дней
  },
  
  uz: (count: number): number => {
    // Uzbek has simpler pluralization
    return count === 1 ? 0 : 1;
  },
  
  en: (count: number): number => {
    return count === 1 ? 0 : 1;
  },
};

// Initialize i18n
const initI18n = async (): Promise<void> => {
  const initialLanguage = getInitialLanguage();
  
  await i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3', // For React Native
      resources,
      lng: initialLanguage,
      fallbackLng: 'en',
      
      // Namespace configuration
      ns: [
        'common',
        'auth', 
        'dashboard',
        'lessons',
        'profile',
        'settings',
        'teacher',
        'student',
        'parent',
        'cultural'
      ],
      defaultNS: 'common',
      
      // Interpolation options
      interpolation: {
        escapeValue: false, // React already escapes
      },
      
      // Pluralization
      pluralSeparator: '_',
      
      // Performance
      saveMissing: __DEV__, // Only in development
      missingKeyHandler: __DEV__ ? (lng, ns, key) => {
        console.warn(`Missing translation: ${lng}:${ns}.${key}`);
      } : undefined,
      
      // React options
      react: {
        useSuspense: false, // Better for React Native
      },
    });

  // Set up pluralization rules
  i18n.services.pluralResolver.addRule('ru', {
    numbers: [0, 1, 2],
    plurals: pluralRules.ru,
  });
  
  i18n.services.pluralResolver.addRule('uz', {
    numbers: [0, 1],
    plurals: pluralRules.uz,
  });
};

// Change language function
export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    await i18n.changeLanguage(language);
    storeLanguage(language);
    
    // Update moment locale
    switch (language) {
      case 'ru':
        moment.locale('ru');
        break;
      case 'uz':
        moment.locale('uz-latn');
        break;
      default:
        moment.locale('en');
        break;
    }
  } catch (error) {
    console.error('Failed to change language:', error);
    throw error;
  }
};

// Get current language
export const getCurrentLanguage = (): SupportedLanguage => {
  return (i18n.language as SupportedLanguage) || 'en';
};

// Get language direction (for RTL preparation)
export const getLanguageDirection = (language?: SupportedLanguage): 'ltr' | 'rtl' => {
  const lang = language || getCurrentLanguage();
  
  // Future RTL languages
  const rtlLanguages: string[] = ['ar', 'fa', 'he'];
  
  return rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
};

// Format number according to locale
export const formatNumber = (
  number: number,
  options?: Intl.NumberFormatOptions
): string => {
  const language = getCurrentLanguage();
  
  // Locale mapping
  const localeMap = {
    en: 'en-US',
    ru: 'ru-RU', 
    uz: 'uz-UZ',
  };
  
  try {
    return new Intl.NumberFormat(localeMap[language], options).format(number);
  } catch {
    // Fallback for unsupported locales
    return new Intl.NumberFormat('en-US', options).format(number);
  }
};

// Format currency according to locale
export const formatCurrency = (
  amount: number,
  currency: 'UZS' | 'USD' | 'RUB' = 'UZS'
): string => {
  const language = getCurrentLanguage();
  
  const currencyOptions = {
    style: 'currency' as const,
    currency,
    minimumFractionDigits: currency === 'UZS' ? 0 : 2,
    maximumFractionDigits: currency === 'UZS' ? 0 : 2,
  };
  
  return formatNumber(amount, currencyOptions);
};

// Format date according to locale
export const formatDate = (
  date: Date | string | number,
  format?: string
): string => {
  const momentDate = moment(date);
  const language = getCurrentLanguage();
  
  // Set moment locale
  momentDate.locale(language === 'uz' ? 'uz-latn' : language);
  
  // Default format based on language
  const defaultFormats = {
    en: 'MMM D, YYYY',
    ru: 'D MMMM YYYY г.',
    uz: 'D MMMM, YYYY',
  };
  
  return momentDate.format(format || defaultFormats[language]);
};

// Format time according to locale
export const formatTime = (
  date: Date | string | number,
  format?: string
): string => {
  const momentDate = moment(date);
  const language = getCurrentLanguage();
  
  momentDate.locale(language === 'uz' ? 'uz-latn' : language);
  
  // Default format based on language (24-hour format preferred in Uzbekistan)
  const defaultFormats = {
    en: 'h:mm A',
    ru: 'HH:mm',
    uz: 'HH:mm',
  };
  
  return momentDate.format(format || defaultFormats[language]);
};

// Relative time formatting
export const formatRelativeTime = (date: Date | string | number): string => {
  const momentDate = moment(date);
  const language = getCurrentLanguage();
  
  momentDate.locale(language === 'uz' ? 'uz-latn' : language);
  
  return momentDate.fromNow();
};

// Check if language is RTL (for future Arabic support)
export const isRTL = (language?: SupportedLanguage): boolean => {
  return getLanguageDirection(language) === 'rtl';
};

// Cultural date formatting (including Islamic calendar preparation)
export const formatCulturalDate = (
  date: Date | string | number,
  includeHijri: boolean = false
): string => {
  const gregorianDate = formatDate(date);
  
  if (!includeHijri) {
    return gregorianDate;
  }
  
  // Future implementation for Hijri calendar
  // This would use moment-hijri or similar library
  // For now, just return Gregorian
  return gregorianDate;
};

// Initialize and export
initI18n().catch(console.error);

export default i18n;
export { i18n };

// Type definitions for better TypeScript support
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: typeof resources.en;
  }
}