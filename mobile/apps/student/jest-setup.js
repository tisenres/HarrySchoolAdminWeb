import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Mock MMKV storage
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    delete: jest.fn(),
    getAllKeys: jest.fn(() => []),
    clearAll: jest.fn(),
  })),
}));

// Mock react-native-localize
jest.mock('react-native-localize', () => ({
  findBestLanguageTag: jest.fn(() => ({ languageTag: 'en', isRTL: false })),
  getLocales: jest.fn(() => [{ languageCode: 'en', countryCode: 'US' }]),
  getNumberFormatSettings: jest.fn(() => ({
    decimalSeparator: '.',
    groupingSeparator: ',',
  })),
  getCalendar: jest.fn(() => 'gregorian'),
  getCountry: jest.fn(() => 'US'),
  getCurrencies: jest.fn(() => ['USD']),
  getTemperatureUnit: jest.fn(() => 'celsius'),
  getTimeZone: jest.fn(() => 'America/New_York'),
  uses24HourClock: jest.fn(() => false),
  usesMetricSystem: jest.fn(() => false),
}));

// Mock moment
jest.mock('moment', () => {
  const moment = jest.requireActual('moment');
  return {
    ...moment,
    locale: jest.fn(),
    duration: jest.fn(() => ({
      asHours: jest.fn(() => 1),
      minutes: jest.fn(() => 30),
    })),
  };
});

// Mock i18next
jest.mock('i18next', () => ({
  init: jest.fn(() => Promise.resolve()),
  changeLanguage: jest.fn(() => Promise.resolve()),
  t: jest.fn((key) => key),
  exists: jest.fn(() => true),
  language: 'en',
  languages: ['en', 'ru', 'uz'],
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: jest.fn((key) => key),
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(() => Promise.resolve()),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

// Mock Expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
}));

jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn(() => Promise.resolve()),
  },
}));

// Mock React Native components that need special handling
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock global console to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock Dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({ width: 375, height: 812 })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios || obj.default),
}));

// Islamic cultural testing helpers
global.islamicTestHelpers = {
  mockPrayerTimes: {
    fajr: '05:30',
    sunrise: '06:45',
    dhuhr: '12:15',
    asr: '15:30',
    maghrib: '18:45',
    isha: '20:00',
  },
  mockIslamicGreeting: 'Assalamu alaikum',
  mockHijriDate: '15 Ramadan 1445',
  mockQiblaDirection: 295, // degrees for Tashkent
};

// Age-adaptive testing helpers
global.ageTestHelpers = {
  elementary: { minAge: 10, maxAge: 12 },
  middle: { minAge: 13, maxAge: 15 },
  high: { minAge: 16, maxAge: 18 },
  getAgeGroup: (age) => {
    if (age <= 12) return 'elementary';
    if (age <= 15) return 'middle';
    return 'high';
  },
};

// Cultural testing helpers
global.culturalTestHelpers = {
  uzbekLanguagePatterns: {
    latinScript: true,
    cyrillicScript: false,
    pluralization: 'simple', // Uzbek has simpler pluralization than Russian
  },
  russianLanguagePatterns: {
    pluralization: 'complex', // Russian has complex pluralization rules
    cases: ['nominative', 'genitive', 'dative', 'accusative', 'instrumental', 'prepositional'],
  },
  educationalContext: {
    schoolYear: '2024-2025',
    semester: 'first',
    islamicYear: 1445,
  },
};