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

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  Link: 'Link',
  Tabs: 'Tabs',
  Stack: 'Stack',
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  })),
  useRoute: jest.fn(() => ({
    params: {},
  })),
  NavigationContainer: ({ children }) => children,
  useFocusEffect: jest.fn(),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: jest.fn(() => ({
    Navigator: 'Navigator',
    Screen: 'Screen',
  })),
}));

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Gesture Handler
jest.mock('react-native-gesture-handler', () => ({
  TouchableOpacity: 'TouchableOpacity',
  PanGestureHandler: 'PanGestureHandler',
  State: {},
}));

// Mock Safe Area Context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

// Mock SVG
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
  G: 'G',
}));

// Mock Lottie
jest.mock('lottie-react-native', () => 'LottieView');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
    channel: jest.fn(() => ({
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
  })),
}));

// Mock React Hook Form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    control: {},
    handleSubmit: jest.fn(),
    formState: { errors: {} },
    setValue: jest.fn(),
    watch: jest.fn(),
    reset: jest.fn(),
  })),
  Controller: ({ children }) => children,
}));

// Mock Zod
jest.mock('zod', () => ({
  z: {
    string: jest.fn(() => ({
      min: jest.fn().mockReturnThis(),
      max: jest.fn().mockReturnThis(),
      email: jest.fn().mockReturnThis(),
      optional: jest.fn().mockReturnThis(),
    })),
    object: jest.fn(() => ({
      parse: jest.fn(),
      safeParse: jest.fn(() => ({ success: true, data: {} })),
    })),
    number: jest.fn(() => ({
      min: jest.fn().mockReturnThis(),
      max: jest.fn().mockReturnThis(),
      optional: jest.fn().mockReturnThis(),
    })),
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

// Teacher-specific testing helpers
global.teacherTestHelpers = {
  mockTeacherProfile: {
    id: 'teacher-123',
    name: 'Ustoz Ahmad',
    subjects: ['English', 'Mathematics'],
    experience: 5,
    qualification: 'Bachelor in Education',
    islamicKnowledge: 'intermediate',
  },
  mockClassroom: {
    id: 'class-456',
    name: 'Grade 7A',
    capacity: 25,
    currentStudents: 23,
    ageGroup: 'middle',
  },
  mockAttendance: {
    date: '2024-01-15',
    students: [
      { id: 'student-1', name: 'Ali', present: true },
      { id: 'student-2', name: 'Fatima', present: false, excuse: 'illness' },
      { id: 'student-3', name: 'Hassan', present: true },
    ],
  },
  mockGradebook: {
    subject: 'English',
    assignments: [
      { id: 'hw-1', title: 'Grammar Exercise', maxScore: 100 },
      { id: 'quiz-1', title: 'Vocabulary Quiz', maxScore: 50 },
    ],
    grades: {
      'student-1': { 'hw-1': 85, 'quiz-1': 42 },
      'student-2': { 'hw-1': 92, 'quiz-1': 48 },
    },
  },
};