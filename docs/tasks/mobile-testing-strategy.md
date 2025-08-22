# Mobile Testing Strategy: Harry School CRM React Native Apps

**Agent**: test-automator  
**Date**: 2025-01-21  
**Apps**: Student App, Teacher App (React Native + Expo)

## Executive Summary

This comprehensive testing strategy addresses the unique challenges of testing educational mobile applications in an Islamic cultural context with multi-language support (English, Russian, Uzbek), age-adaptive interfaces (elementary 10-12 vs secondary 13-18), and offline-first architecture.

## Testing Pyramid Overview

```
           E2E Tests (Detox)
          /                 \
         /    Integration     \
        /       Tests         \
       /_____________________\
      /                       \
     /     Component Tests     \
    /    (React Native TL)     \
   /_________________________\
  /                           \
 /        Unit Tests          \
/          (Jest)             \
/_____________________________\
```

### Coverage Targets
- **Unit Tests**: 90% coverage
- **Component Tests**: 85% coverage  
- **Integration Tests**: 75% coverage
- **E2E Tests**: Critical user journeys only

## 1. Testing Pyramid Implementation

### Unit Tests (Jest)

#### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/navigation/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@supabase|react-native-vector-icons)/)',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
  },
};
```

#### Jest Setup File
```javascript
// jest-setup.js
import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { MMKV } from 'react-native-mmkv';

// Mock MMKV
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock Expo modules
jest.mock('expo-localization', () => ({
  locale: 'en-US',
  locales: ['en-US'],
  timezone: 'America/New_York',
  isoCurrencyCodes: ['USD'],
  region: 'US',
  getLocalizationAsync: jest.fn(() => 
    Promise.resolve({
      locale: 'en-US',
      locales: ['en-US'],
      timezone: 'America/New_York',
      isoCurrencyCodes: ['USD'],
      region: 'US',
    })
  ),
}));

// Mock react-native-localize
jest.mock('react-native-localize', () => ({
  findBestLanguageTag: jest.fn(() => ({ languageTag: 'en' })),
  getLocales: jest.fn(() => [{ languageCode: 'en', countryCode: 'US' }]),
  getNumberFormatSettings: jest.fn(() => ({
    decimalSeparator: '.',
    groupingSeparator: ',',
  })),
  getCalendar: jest.fn(() => 'gregorian'),
  getCountry: jest.fn(() => 'US'),
  getCurrencies: jest.fn(() => ['USD']),
  getTemperatureUnit: jest.fn(() => 'celsius'),
  getTimeZone: jest.fn(() => 'Europe/London'),
  uses24HourClock: jest.fn(() => false),
  usesMetricSystem: jest.fn(() => true),
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
      })),
    },
  })),
}));

// Mock Lottie
jest.mock('lottie-react-native', () => 'LottieView');

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(),
    Directions: {},
  };
});

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
```

#### Utility Functions Testing
```typescript
// src/utils/__tests__/islamicCalendar.test.ts
import { 
  getIslamicDate, 
  isPrayerTime, 
  getQiblaDirection,
  formatIslamicDate 
} from '../islamicCalendar';

describe('Islamic Calendar Utils', () => {
  describe('getIslamicDate', () => {
    test('converts Gregorian date to Hijri', () => {
      const gregorianDate = new Date('2024-01-01');
      const hijriDate = getIslamicDate(gregorianDate);
      
      expect(hijriDate).toHaveProperty('year');
      expect(hijriDate).toHaveProperty('month');
      expect(hijriDate).toHaveProperty('day');
      expect(hijriDate.year).toBeGreaterThan(1400);
    });

    test('handles invalid dates gracefully', () => {
      const invalidDate = new Date('invalid');
      const result = getIslamicDate(invalidDate);
      
      expect(result).toBeNull();
    });
  });

  describe('isPrayerTime', () => {
    test('returns true during prayer times', () => {
      // Mock prayer time (12:00 PM - Dhuhr)
      const prayerTime = new Date();
      prayerTime.setHours(12, 0, 0, 0);
      
      const result = isPrayerTime(prayerTime, { lat: 41.2995, lon: 69.2401 }); // Tashkent
      expect(typeof result).toBe('boolean');
    });

    test('requires valid coordinates', () => {
      const now = new Date();
      
      expect(() => isPrayerTime(now, { lat: 200, lon: 300 }))
        .toThrow('Invalid coordinates');
    });
  });
});
```

#### Age-Adaptive Component Testing
```typescript
// src/components/__tests__/AgeAdaptiveButton.test.ts
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AgeAdaptiveButton } from '../AgeAdaptiveButton';

describe('AgeAdaptiveButton', () => {
  const mockProps = {
    title: 'Test Button',
    onPress: jest.fn(),
    ageGroup: 'elementary' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders elementary style for younger students', () => {
    const { getByText, getByTestId } = render(
      <AgeAdaptiveButton {...mockProps} ageGroup="elementary" />
    );
    
    const button = getByTestId('age-adaptive-button');
    const text = getByText('Test Button');
    
    expect(button).toHaveStyle({
      borderRadius: 16, // More rounded for elementary
      paddingVertical: 16, // Larger touch target
    });
    
    expect(text).toHaveStyle({
      fontSize: 18, // Larger text for elementary
      fontWeight: '700', // Bolder for elementary
    });
  });

  test('renders secondary style for older students', () => {
    const { getByText, getByTestId } = render(
      <AgeAdaptiveButton {...mockProps} ageGroup="secondary" />
    );
    
    const button = getByTestId('age-adaptive-button');
    const text = getByText('Test Button');
    
    expect(button).toHaveStyle({
      borderRadius: 8, // Less rounded for secondary
      paddingVertical: 12, // Standard touch target
    });
    
    expect(text).toHaveStyle({
      fontSize: 16, // Standard text for secondary
      fontWeight: '600', // Standard weight
    });
  });

  test('handles press events correctly', () => {
    const { getByTestId } = render(
      <AgeAdaptiveButton {...mockProps} />
    );
    
    const button = getByTestId('age-adaptive-button');
    fireEvent.press(button);
    
    expect(mockProps.onPress).toHaveBeenCalledTimes(1);
  });

  test('shows loading state', () => {
    const { getByTestId, queryByText } = render(
      <AgeAdaptiveButton {...mockProps} loading={true} />
    );
    
    const button = getByTestId('age-adaptive-button');
    const loadingIndicator = getByTestId('loading-indicator');
    
    expect(loadingIndicator).toBeTruthy();
    expect(queryByText('Test Button')).toBeNull();
    expect(button).toBeDisabled();
  });

  test('applies disabled state correctly', () => {
    const { getByTestId } = render(
      <AgeAdaptiveButton {...mockProps} disabled={true} />
    );
    
    const button = getByTestId('age-adaptive-button');
    
    expect(button).toBeDisabled();
    expect(button).toHaveStyle({
      opacity: 0.5,
    });
  });
});
```

### Component Tests (React Native Testing Library)

#### Dashboard Component Testing
```typescript
// src/screens/__tests__/DashboardScreen.test.tsx
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardScreen } from '../DashboardScreen';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardData } from '../../hooks/useDashboardData';

// Mock hooks
jest.mock('../../hooks/useAuth');
jest.mock('../../hooks/useDashboardData');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseDashboardData = useDashboardData as jest.MockedFunction<typeof useDashboardData>;

describe('DashboardScreen', () => {
  let queryClient: QueryClient;

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockUseAuth.mockReturnValue({
      user: {
        id: '123',
        email: 'student@test.com',
        role: 'student',
        ageGroup: 'elementary',
      },
      loading: false,
      signOut: jest.fn(),
    });

    mockUseDashboardData.mockReturnValue({
      data: {
        todaySchedule: [
          {
            id: '1',
            subject: 'Arabic',
            time: '09:00',
            teacher: 'Ustaz Ahmad',
            room: 'A101',
          },
        ],
        recentAchievements: [
          {
            id: '1',
            title: 'First Surah Memorized',
            icon: '🕌',
            date: '2024-01-20',
          },
        ],
        pendingTasks: 2,
        weeklyProgress: 85,
        rank: { position: 5, total: 25 },
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  test('renders dashboard components correctly', async () => {
    const { getByText, getByTestId } = renderWithProviders(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText('Today\'s Schedule')).toBeTruthy();
      expect(getByText('Arabic')).toBeTruthy();
      expect(getByText('Ustaz Ahmad')).toBeTruthy();
      expect(getByText('Recent Achievements')).toBeTruthy();
      expect(getByText('First Surah Memorized')).toBeTruthy();
    });

    const progressIndicator = getByTestId('weekly-progress');
    expect(progressIndicator).toBeTruthy();
  });

  test('shows age-appropriate content for elementary students', async () => {
    const { getByText } = renderWithProviders(<DashboardScreen />);

    await waitFor(() => {
      // Elementary students see more encouraging language
      expect(getByText('Great job this week!')).toBeTruthy();
      expect(getByText('🌟')).toBeTruthy(); // More emojis for elementary
    });
  });

  test('shows different content for secondary students', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '123',
        email: 'student@test.com',
        role: 'student',
        ageGroup: 'secondary',
      },
      loading: false,
      signOut: jest.fn(),
    });

    const { getByText, queryByText } = renderWithProviders(<DashboardScreen />);

    await waitFor(() => {
      // Secondary students see more mature language
      expect(queryByText('Great job this week!')).toBeNull();
      expect(getByText('Weekly Progress: 85%')).toBeTruthy();
    });
  });

  test('handles loading state', () => {
    mockUseDashboardData.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    const { getByTestId } = renderWithProviders(<DashboardScreen />);
    
    expect(getByTestId('loading-skeleton')).toBeTruthy();
  });

  test('handles error state with retry', async () => {
    const mockRefetch = jest.fn();
    mockUseDashboardData.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    });

    const { getByText, getByTestId } = renderWithProviders(<DashboardScreen />);
    
    expect(getByText('Something went wrong')).toBeTruthy();
    
    const retryButton = getByTestId('retry-button');
    fireEvent.press(retryButton);
    
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  test('navigates to schedule on schedule card press', () => {
    const mockNavigate = jest.fn();
    const navigation = { navigate: mockNavigate };

    const { getByTestId } = renderWithProviders(
      <DashboardScreen navigation={navigation} />
    );

    const scheduleCard = getByTestId('schedule-card');
    fireEvent.press(scheduleCard);

    expect(mockNavigate).toHaveBeenCalledWith('Schedule');
  });
});
```

#### Prayer Time Component Testing
```typescript
// src/components/__tests__/PrayerTimeCard.test.tsx
import React from 'react';
import { render, act } from '@testing-library/react-native';
import { PrayerTimeCard } from '../PrayerTimeCard';
import * as islamicCalendar from '../../utils/islamicCalendar';

jest.mock('../../utils/islamicCalendar');

describe('PrayerTimeCard', () => {
  const mockGetPrayerTimes = islamicCalendar.getPrayerTimes as jest.Mock;
  const mockGetNextPrayer = islamicCalendar.getNextPrayer as jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    
    mockGetPrayerTimes.mockReturnValue({
      fajr: '05:30',
      dhuhr: '12:15',
      asr: '15:45',
      maghrib: '18:20',
      isha: '19:50',
    });

    mockGetNextPrayer.mockReturnValue({
      name: 'dhuhr',
      time: '12:15',
      timeUntil: '2h 15m',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('displays current prayer times', () => {
    const { getByText } = render(
      <PrayerTimeCard coordinates={{ lat: 41.2995, lon: 69.2401 }} />
    );

    expect(getByText('Prayer Times')).toBeTruthy();
    expect(getByText('Fajr')).toBeTruthy();
    expect(getByText('05:30')).toBeTruthy();
    expect(getByText('Dhuhr')).toBeTruthy();
    expect(getByText('12:15')).toBeTruthy();
  });

  test('highlights next prayer', () => {
    const { getByTestId } = render(
      <PrayerTimeCard coordinates={{ lat: 41.2995, lon: 69.2401 }} />
    );

    const nextPrayerItem = getByTestId('prayer-item-dhuhr');
    expect(nextPrayerItem).toHaveStyle({
      backgroundColor: expect.stringContaining('#'),
    });
  });

  test('shows countdown to next prayer', () => {
    const { getByText } = render(
      <PrayerTimeCard coordinates={{ lat: 41.2995, lon: 69.2401 }} />
    );

    expect(getByText('Next: Dhuhr in 2h 15m')).toBeTruthy();
  });

  test('updates countdown every minute', () => {
    mockGetNextPrayer
      .mockReturnValueOnce({
        name: 'dhuhr',
        time: '12:15',
        timeUntil: '2h 15m',
      })
      .mockReturnValueOnce({
        name: 'dhuhr',
        time: '12:15',
        timeUntil: '2h 14m',
      });

    const { getByText, rerender } = render(
      <PrayerTimeCard coordinates={{ lat: 41.2995, lon: 69.2401 }} />
    );

    expect(getByText('Next: Dhuhr in 2h 15m')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(60000); // 1 minute
    });

    rerender(<PrayerTimeCard coordinates={{ lat: 41.2995, lon: 69.2401 }} />);

    expect(getByText('Next: Dhuhr in 2h 14m')).toBeTruthy();
  });

  test('handles missing coordinates gracefully', () => {
    const { getByText } = render(<PrayerTimeCard />);

    expect(getByText('Location needed for prayer times')).toBeTruthy();
  });

  test('shows loading state while calculating', () => {
    mockGetPrayerTimes.mockReturnValue(null);
    
    const { getByTestId } = render(
      <PrayerTimeCard coordinates={{ lat: 41.2995, lon: 69.2401 }} />
    );

    expect(getByTestId('prayer-times-loading')).toBeTruthy();
  });
});
```

### Integration Tests

#### Authentication Flow Testing
```typescript
// src/__tests__/auth.integration.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase');

describe('Authentication Integration', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  test('successful student login flow', async () => {
    const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;
    mockSignIn.mockResolvedValue({
      data: {
        user: {
          id: '123',
          email: 'student@test.com',
          user_metadata: {
            role: 'student',
            age_group: 'elementary',
            grade: 5,
          },
        },
        session: { access_token: 'token123' },
      },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn('student@test.com', 'password123');
    });

    expect(result.current.user).toEqual({
      id: '123',
      email: 'student@test.com',
      role: 'student',
      ageGroup: 'elementary',
      grade: 5,
    });
    expect(result.current.loading).toBe(false);
  });

  test('handles role-based access control', async () => {
    const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;
    mockSignIn.mockResolvedValue({
      data: {
        user: {
          id: '456',
          email: 'teacher@test.com',
          user_metadata: {
            role: 'teacher',
            subjects: ['Arabic', 'Islamic Studies'],
          },
        },
        session: { access_token: 'token456' },
      },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn('teacher@test.com', 'password123');
    });

    expect(result.current.user?.role).toBe('teacher');
    expect(result.current.hasRole('teacher')).toBe(true);
    expect(result.current.hasRole('student')).toBe(false);
  });

  test('handles authentication errors', async () => {
    const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;
    mockSignIn.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      try {
        await result.current.signIn('wrong@test.com', 'wrongpassword');
      } catch (error) {
        expect(error.message).toBe('Invalid login credentials');
      }
    });

    expect(result.current.user).toBeNull();
  });
});
```

## 2. Internationalization (i18n) Testing

### Multi-language Support Testing
```typescript
// src/i18n/__tests__/i18n.test.ts
import i18n, { changeLanguage, formatCurrency, formatDate } from '../index';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';

describe('Internationalization', () => {
  describe('Language switching', () => {
    test('changes language to Russian', async () => {
      await changeLanguage('ru');
      expect(i18n.language).toBe('ru');
    });

    test('changes language to Uzbek', async () => {
      await changeLanguage('uz');
      expect(i18n.language).toBe('uz');
    });

    test('falls back to English for unsupported language', async () => {
      await changeLanguage('fr' as any);
      expect(i18n.language).toBe('en');
    });
  });

  describe('Translation rendering', () => {
    const TestComponent = () => {
      const { t } = useTranslation('common');
      return <Text testID="test-text">{t('app.name')}</Text>;
    };

    test('renders English translations', async () => {
      await changeLanguage('en');
      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId('test-text')).toHaveTextContent('Harry School');
    });

    test('renders Russian translations', async () => {
      await changeLanguage('ru');
      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId('test-text')).toHaveTextContent('Школа Гарри');
    });

    test('renders Uzbek translations', async () => {
      await changeLanguage('uz');
      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId('test-text')).toHaveTextContent('Garri Maktabi');
    });
  });

  describe('Pluralization', () => {
    test('handles Russian pluralization correctly', async () => {
      await changeLanguage('ru');
      const { t } = useTranslation();
      
      expect(t('time.minutesAgo', { count: 1 })).toBe('1 минута назад');
      expect(t('time.minutesAgo', { count: 2 })).toBe('2 минуты назад');
      expect(t('time.minutesAgo', { count: 5 })).toBe('5 минут назад');
    });

    test('handles Uzbek pluralization correctly', async () => {
      await changeLanguage('uz');
      const { t } = useTranslation();
      
      expect(t('time.minutesAgo', { count: 1 })).toBe('1 daqiqa oldin');
      expect(t('time.minutesAgo', { count: 5 })).toBe('5 daqiqa oldin');
    });
  });

  describe('Cultural formatting', () => {
    test('formats currency according to locale', () => {
      expect(formatCurrency(1500, 'UZS')).toMatch(/1[,\s]500/);
      expect(formatCurrency(15.50, 'USD')).toMatch(/\$15\.50/);
    });

    test('formats dates according to locale', async () => {
      const testDate = new Date('2024-01-15');
      
      await changeLanguage('en');
      expect(formatDate(testDate)).toBe('Jan 15, 2024');
      
      await changeLanguage('ru');
      expect(formatDate(testDate)).toBe('15 января 2024 г.');
      
      await changeLanguage('uz');
      expect(formatDate(testDate)).toBe('15 yanvar, 2024');
    });
  });

  describe('Islamic cultural context', () => {
    test('provides Islamic education terms', async () => {
      await changeLanguage('en');
      const { t } = useTranslation('cultural');
      
      expect(t('islamic.terms.surah')).toBe('Surah');
      expect(t('islamic.terms.hadith')).toBe('Hadith');
      expect(t('islamic.terms.qibla')).toBe('Qibla');
    });

    test('provides respectful address forms', async () => {
      await changeLanguage('en');
      const { t } = useTranslation('cultural');
      
      expect(t('address.teacher.male')).toBe('Ustaz');
      expect(t('address.teacher.female')).toBe('Ustazah');
    });
  });

  describe('RTL preparation', () => {
    test('detects RTL languages correctly', () => {
      expect(i18n.dir('ar')).toBe('rtl');
      expect(i18n.dir('en')).toBe('ltr');
      expect(i18n.dir('ru')).toBe('ltr');
      expect(i18n.dir('uz')).toBe('ltr');
    });

    test('provides text alignment for RTL', () => {
      const getTextAlign = (language: string) => 
        i18n.dir(language) === 'rtl' ? 'right' : 'left';
      
      expect(getTextAlign('ar')).toBe('right');
      expect(getTextAlign('en')).toBe('left');
    });
  });
});
```

### Translation Key Validation
```typescript
// src/i18n/__tests__/translation-keys.test.ts
import enCommon from '../locales/en/common.json';
import ruCommon from '../locales/ru/common.json';
import uzCommon from '../locales/uz/common.json';

describe('Translation Key Consistency', () => {
  const flattenKeys = (obj: any, prefix = ''): string[] => {
    let keys: string[] = [];
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        keys = keys.concat(flattenKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys;
  };

  test('all languages have same translation keys', () => {
    const enKeys = flattenKeys(enCommon).sort();
    const ruKeys = flattenKeys(ruCommon).sort();
    const uzKeys = flattenKeys(uzCommon).sort();

    expect(ruKeys).toEqual(enKeys);
    expect(uzKeys).toEqual(enKeys);
  });

  test('no translation keys are empty', () => {
    const checkEmptyValues = (obj: any, path = ''): string[] => {
      const emptyKeys: string[] = [];
      for (const key in obj) {
        const fullPath = path ? `${path}.${key}` : key;
        if (typeof obj[key] === 'object') {
          emptyKeys.push(...checkEmptyValues(obj[key], fullPath));
        } else if (!obj[key] || obj[key].trim() === '') {
          emptyKeys.push(fullPath);
        }
      }
      return emptyKeys;
    };

    const enEmpty = checkEmptyValues(enCommon);
    const ruEmpty = checkEmptyValues(ruCommon);
    const uzEmpty = checkEmptyValues(uzCommon);

    expect(enEmpty).toEqual([]);
    expect(ruEmpty).toEqual([]);
    expect(uzEmpty).toEqual([]);
  });

  test('interpolation placeholders are consistent', () => {
    const extractPlaceholders = (text: string): string[] => {
      const matches = text.match(/\{\{[\w.]+\}\}/g);
      return matches ? matches.sort() : [];
    };

    const checkPlaceholders = (enObj: any, compareObj: any, path = '') => {
      for (const key in enObj) {
        const fullPath = path ? `${path}.${key}` : key;
        if (typeof enObj[key] === 'object') {
          checkPlaceholders(enObj[key], compareObj[key], fullPath);
        } else if (typeof enObj[key] === 'string') {
          const enPlaceholders = extractPlaceholders(enObj[key]);
          const comparePlaceholders = extractPlaceholders(compareObj[key]);
          
          expect(comparePlaceholders).toEqual(enPlaceholders);
        }
      }
    };

    expect(() => checkPlaceholders(enCommon, ruCommon)).not.toThrow();
    expect(() => checkPlaceholders(enCommon, uzCommon)).not.toThrow();
  });
});
```

## 3. Offline Testing

### Data Synchronization Testing
```typescript
// src/services/__tests__/offlineSync.test.ts
import { OfflineSyncManager } from '../offlineSync';
import { storage } from '../storage';
import { supabase } from '../../lib/supabase';

jest.mock('../storage');
jest.mock('../../lib/supabase');

describe('Offline Synchronization', () => {
  let syncManager: OfflineSyncManager;

  beforeEach(() => {
    syncManager = new OfflineSyncManager();
    jest.clearAllMocks();
  });

  describe('Offline data storage', () => {
    test('stores attendance data offline', async () => {
      const attendanceData = {
        id: 'temp-123',
        studentId: 'student-456',
        date: '2024-01-20',
        status: 'present',
        timestamp: Date.now(),
        synced: false,
      };

      await syncManager.storeOfflineData('attendance', attendanceData);

      expect(storage.setItem).toHaveBeenCalledWith(
        'offline_attendance_temp-123',
        JSON.stringify(attendanceData)
      );
    });

    test('stores lesson progress offline', async () => {
      const lessonProgress = {
        id: 'temp-456',
        lessonId: 'lesson-789',
        studentId: 'student-123',
        progress: 0.75,
        completedAt: Date.now(),
        answers: ['A', 'B', 'C'],
        synced: false,
      };

      await syncManager.storeOfflineData('lessonProgress', lessonProgress);

      expect(storage.setItem).toHaveBeenCalledWith(
        'offline_lessonProgress_temp-456',
        JSON.stringify(lessonProgress)
      );
    });
  });

  describe('Data synchronization', () => {
    test('syncs attendance data when online', async () => {
      const offlineAttendance = [
        {
          id: 'temp-123',
          studentId: 'student-456',
          date: '2024-01-20',
          status: 'present',
          synced: false,
        },
      ];

      (storage.getAllKeys as jest.Mock).mockResolvedValue([
        'offline_attendance_temp-123'
      ]);
      (storage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(offlineAttendance[0])
      );
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: [{ id: 'real-123' }], error: null }),
      });

      const result = await syncManager.syncOfflineData();

      expect(result.attendance.success).toBe(1);
      expect(result.attendance.failed).toBe(0);
      expect(storage.removeItem).toHaveBeenCalledWith('offline_attendance_temp-123');
    });

    test('handles sync conflicts with server data', async () => {
      const offlineData = {
        id: 'temp-123',
        studentId: 'student-456',
        date: '2024-01-20',
        status: 'present',
        lastModified: Date.now() - 10000, // 10 seconds ago
        synced: false,
      };

      const serverData = {
        id: 'real-123',
        studentId: 'student-456',
        date: '2024-01-20',
        status: 'absent',
        lastModified: Date.now() - 5000, // 5 seconds ago (newer)
      };

      (storage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(offlineData));
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [serverData], error: null }),
        insert: jest.fn(),
      });

      const conflictResolver = jest.fn().mockResolvedValue('server');
      syncManager.setConflictResolver(conflictResolver);

      await syncManager.resolveConflict('attendance', offlineData, serverData);

      expect(conflictResolver).toHaveBeenCalledWith({
        type: 'attendance',
        offline: offlineData,
        server: serverData,
        resolution: 'timestamp', // Server data is newer
      });
    });

    test('retries failed sync operations', async () => {
      const offlineData = {
        id: 'temp-123',
        studentId: 'student-456',
        date: '2024-01-20',
        status: 'present',
        synced: false,
        retryCount: 0,
      };

      (storage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(offlineData));
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn()
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({ data: [{ id: 'real-123' }], error: null }),
      });

      const result = await syncManager.syncWithRetry('attendance', offlineData);

      expect(result.success).toBe(true);
      expect(result.retryCount).toBe(2);
    });
  });

  describe('Network status handling', () => {
    test('queues operations when offline', async () => {
      syncManager.setNetworkStatus(false);

      const attendanceData = {
        studentId: 'student-456',
        status: 'present',
      };

      await syncManager.markAttendance(attendanceData);

      expect(syncManager.getQueueSize()).toBe(1);
      expect(storage.setItem).toHaveBeenCalled();
    });

    test('processes queue when coming back online', async () => {
      // Start offline with queued operations
      syncManager.setNetworkStatus(false);
      await syncManager.markAttendance({ studentId: '1', status: 'present' });
      await syncManager.markAttendance({ studentId: '2', status: 'absent' });

      expect(syncManager.getQueueSize()).toBe(2);

      // Mock successful sync
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      // Come back online
      syncManager.setNetworkStatus(true);
      await syncManager.processQueue();

      expect(syncManager.getQueueSize()).toBe(0);
    });
  });

  describe('Storage optimization', () => {
    test('cleans up old offline data', async () => {
      const oldData = {
        id: 'temp-old',
        timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days old
        synced: true,
      };

      const recentData = {
        id: 'temp-recent',
        timestamp: Date.now() - (1 * 60 * 60 * 1000), // 1 hour old
        synced: true,
      };

      (storage.getAllKeys as jest.Mock).mockResolvedValue([
        'offline_attendance_temp-old',
        'offline_attendance_temp-recent',
      ]);
      (storage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(oldData))
        .mockResolvedValueOnce(JSON.stringify(recentData));

      await syncManager.cleanupOldData();

      expect(storage.removeItem).toHaveBeenCalledWith('offline_attendance_temp-old');
      expect(storage.removeItem).not.toHaveBeenCalledWith('offline_attendance_temp-recent');
    });

    test('compresses large offline datasets', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        data: 'x'.repeat(1000), // 1KB per item
      }));

      const compressed = await syncManager.compressData(largeDataset);
      const decompressed = await syncManager.decompressData(compressed);

      expect(compressed.length).toBeLessThan(JSON.stringify(largeDataset).length);
      expect(decompressed).toEqual(largeDataset);
    });
  });
});
```

### Offline UI Component Testing
```typescript
// src/components/__tests__/OfflineIndicator.test.tsx
import React from 'react';
import { render, act } from '@testing-library/react-native';
import { OfflineIndicator } from '../OfflineIndicator';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useOfflineSync } from '../../hooks/useOfflineSync';

jest.mock('../../hooks/useNetworkStatus');
jest.mock('../../hooks/useOfflineSync');

describe('OfflineIndicator', () => {
  const mockUseNetworkStatus = useNetworkStatus as jest.Mock;
  const mockUseOfflineSync = useOfflineSync as jest.Mock;

  beforeEach(() => {
    mockUseNetworkStatus.mockReturnValue({
      isConnected: true,
      isInternetReachable: true,
    });

    mockUseOfflineSync.mockReturnValue({
      queueSize: 0,
      syncing: false,
      lastSyncTime: Date.now(),
    });
  });

  test('shows nothing when online and no queue', () => {
    const { queryByTestId } = render(<OfflineIndicator />);
    
    expect(queryByTestId('offline-indicator')).toBeNull();
  });

  test('shows offline indicator when disconnected', () => {
    mockUseNetworkStatus.mockReturnValue({
      isConnected: false,
      isInternetReachable: false,
    });

    const { getByTestId, getByText } = render(<OfflineIndicator />);
    
    expect(getByTestId('offline-indicator')).toBeTruthy();
    expect(getByText('Offline')).toBeTruthy();
  });

  test('shows queue size when items pending sync', () => {
    mockUseOfflineSync.mockReturnValue({
      queueSize: 5,
      syncing: false,
      lastSyncTime: Date.now() - 60000,
    });

    const { getByText } = render(<OfflineIndicator />);
    
    expect(getByText('5 items pending sync')).toBeTruthy();
  });

  test('shows syncing indicator during sync', () => {
    mockUseOfflineSync.mockReturnValue({
      queueSize: 3,
      syncing: true,
      lastSyncTime: Date.now(),
    });

    const { getByText, getByTestId } = render(<OfflineIndicator />);
    
    expect(getByText('Syncing...')).toBeTruthy();
    expect(getByTestId('sync-spinner')).toBeTruthy();
  });

  test('shows last sync time', () => {
    const lastSyncTime = Date.now() - (5 * 60 * 1000); // 5 minutes ago
    
    mockUseOfflineSync.mockReturnValue({
      queueSize: 0,
      syncing: false,
      lastSyncTime,
    });

    const { getByText } = render(<OfflineIndicator />);
    
    expect(getByText('Last sync: 5 minutes ago')).toBeTruthy();
  });

  test('handles manual sync trigger', () => {
    const mockTriggerSync = jest.fn();
    
    mockUseOfflineSync.mockReturnValue({
      queueSize: 2,
      syncing: false,
      lastSyncTime: Date.now() - 60000,
      triggerSync: mockTriggerSync,
    });

    const { getByTestId } = render(<OfflineIndicator />);
    
    const syncButton = getByTestId('manual-sync-button');
    fireEvent.press(syncButton);
    
    expect(mockTriggerSync).toHaveBeenCalledTimes(1);
  });
});
```

## 4. Authentication Testing

### Login Flow Testing
```typescript
// src/screens/__tests__/LoginScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';
import { useAuth } from '../../hooks/useAuth';

jest.mock('../../hooks/useAuth');

describe('LoginScreen', () => {
  const mockUseAuth = useAuth as jest.Mock;
  const mockSignIn = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      loading: false,
      error: null,
    });
  });

  test('renders login form correctly', () => {
    const { getByTestId, getByText } = render(<LoginScreen />);

    expect(getByText('Welcome to Harry School')).toBeTruthy();
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('login-button')).toBeTruthy();
  });

  test('validates email format', async () => {
    const { getByTestId, getByText } = render(<LoginScreen />);

    const emailInput = getByTestId('email-input');
    const loginButton = getByTestId('login-button');

    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText('Please enter a valid email address')).toBeTruthy();
    });
  });

  test('validates password length', async () => {
    const { getByTestId, getByText } = render(<LoginScreen />);

    const passwordInput = getByTestId('password-input');
    const loginButton = getByTestId('login-button');

    fireEvent.changeText(passwordInput, '123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText('Password must be at least 8 characters')).toBeTruthy();
    });
  });

  test('submits valid credentials', async () => {
    const { getByTestId } = render(<LoginScreen />);

    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const loginButton = getByTestId('login-button');

    fireEvent.changeText(emailInput, 'student@test.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('student@test.com', 'password123');
    });
  });

  test('shows loading state during login', () => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      loading: true,
      error: null,
    });

    const { getByTestId, getByText } = render(<LoginScreen />);

    expect(getByText('Signing in...')).toBeTruthy();
    expect(getByTestId('login-button')).toBeDisabled();
  });

  test('displays error messages', () => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      loading: false,
      error: 'Invalid credentials',
    });

    const { getByText } = render(<LoginScreen />);

    expect(getByText('Invalid credentials')).toBeTruthy();
  });

  test('shows different UI for teacher vs student login', () => {
    const { getByTestId } = render(<LoginScreen userType="teacher" />);

    expect(getByTestId('teacher-login-form')).toBeTruthy();
    expect(getByText('Teacher Portal')).toBeTruthy();
  });

  test('handles remember me functionality', async () => {
    const { getByTestId } = render(<LoginScreen />);

    const rememberCheckbox = getByTestId('remember-me-checkbox');
    fireEvent.press(rememberCheckbox);

    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const loginButton = getByTestId('login-button');

    fireEvent.changeText(emailInput, 'student@test.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        'student@test.com', 
        'password123',
        { rememberMe: true }
      );
    });
  });
});
```

### Role-Based Access Testing
```typescript
// src/navigation/__tests__/ProtectedRoute.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '../../hooks/useAuth';

jest.mock('../../hooks/useAuth');

describe('ProtectedRoute', () => {
  const mockUseAuth = useAuth as jest.Mock;
  const TestComponent = () => <Text testID="protected-content">Protected Content</Text>;

  test('renders content for authorized user', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '123',
        role: 'student',
        ageGroup: 'elementary',
      },
      loading: false,
    });

    const { getByTestId } = render(
      <ProtectedRoute allowedRoles={['student']}>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(getByTestId('protected-content')).toBeTruthy();
  });

  test('blocks content for unauthorized user', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '123',
        role: 'student',
        ageGroup: 'elementary',
      },
      loading: false,
    });

    const { queryByTestId, getByText } = render(
      <ProtectedRoute allowedRoles={['teacher']}>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(queryByTestId('protected-content')).toBeNull();
    expect(getByText('Access Denied')).toBeTruthy();
  });

  test('shows loading for pending authentication', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
    });

    const { getByTestId } = render(
      <ProtectedRoute allowedRoles={['student']}>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(getByTestId('auth-loading')).toBeTruthy();
  });

  test('redirects unauthenticated users', () => {
    const mockNavigate = jest.fn();
    
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    render(
      <ProtectedRoute 
        allowedRoles={['student']} 
        redirectTo="Login"
        navigation={{ navigate: mockNavigate }}
      >
        <TestComponent />
      </ProtectedRoute>
    );

    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  test('handles age group restrictions', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '123',
        role: 'student',
        ageGroup: 'elementary',
      },
      loading: false,
    });

    const { queryByTestId, getByText } = render(
      <ProtectedRoute 
        allowedRoles={['student']} 
        allowedAgeGroups={['secondary']}
      >
        <TestComponent />
      </ProtectedRoute>
    );

    expect(queryByTestId('protected-content')).toBeNull();
    expect(getByText('This content is for older students')).toBeTruthy();
  });

  test('allows multiple roles', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '123',
        role: 'teacher',
      },
      loading: false,
    });

    const { getByTestId } = render(
      <ProtectedRoute allowedRoles={['student', 'teacher']}>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(getByTestId('protected-content')).toBeTruthy();
  });
});
```

## 5. E2E Testing with Detox

### Detox Configuration
```javascript
// detox.config.js
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupFilesAfterEnv: ['<rootDir>/e2e/init.js'],
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/HarrySchoolStudent.app',
      build: 'xcodebuild -workspace ios/HarrySchoolStudent.xcworkspace -scheme HarrySchoolStudent -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_4_API_30',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
  },
};
```

### Student Journey E2E Tests
```typescript
// e2e/student-journey.e2e.ts
describe('Student Learning Journey', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  test('complete lesson with Islamic content', async () => {
    // Login as elementary student
    await element(by.id('email-input')).typeText('student.elementary@test.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    // Wait for dashboard to load
    await waitFor(element(by.id('dashboard-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Check Islamic greeting appears for younger students
    await expect(element(by.text('Assalamu Alaikum!'))).toBeVisible();

    // Navigate to lessons
    await element(by.id('lessons-tab')).tap();
    await waitFor(element(by.id('lessons-list')))
      .toBeVisible()
      .withTimeout(3000);

    // Select Arabic lesson
    await element(by.id('lesson-arabic-basics')).tap();

    // Wait for lesson to load
    await waitFor(element(by.id('lesson-content')))
      .toBeVisible()
      .withTimeout(5000);

    // Check age-appropriate content
    await expect(element(by.text('Let\'s learn Arabic letters!'))).toBeVisible();
    await expect(element(by.id('colorful-letter-display'))).toBeVisible();

    // Complete letter recognition task
    await element(by.id('letter-alif')).tap();
    await waitFor(element(by.text('Great job!')))
      .toBeVisible()
      .withTimeout(2000);

    // Continue through lesson
    await element(by.id('next-button')).tap();
    await element(by.id('letter-ba')).tap();
    await element(by.id('next-button')).tap();

    // Complete lesson
    await element(by.id('finish-lesson-button')).tap();

    // Check completion celebration (age-appropriate)
    await waitFor(element(by.id('lesson-completion-celebration')))
      .toBeVisible()
      .withTimeout(3000);
    
    await expect(element(by.text('🌟 Amazing work!'))).toBeVisible();

    // Verify progress tracking
    await element(by.id('back-to-lessons')).tap();
    await waitFor(element(by.id('lesson-arabic-basics-completed')))
      .toBeVisible()
      .withTimeout(2000);
  });

  test('prayer time notification and interaction', async () => {
    // Mock prayer time approaching
    await device.sendUserNotification({
      trigger: {
        type: 'timeInterval',
        timeInterval: 1,
      },
      title: 'Prayer Time',
      body: 'Maghrib prayer time is approaching',
      badge: 1,
      payload: {
        type: 'prayer-reminder',
        prayer: 'maghrib',
      },
    });

    // Check notification appears
    await waitFor(element(by.text('Prayer Time')))
      .toBeVisible()
      .withTimeout(5000);

    // Tap notification to open prayer times
    await element(by.text('Prayer Time')).tap();

    // Verify prayer times screen
    await waitFor(element(by.id('prayer-times-screen')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.text('Today\'s Prayer Times'))).toBeVisible();
    await expect(element(by.text('Maghrib'))).toBeVisible();
    await expect(element(by.id('qibla-direction'))).toBeVisible();

    // Check age-appropriate prayer guidance
    await expect(element(by.text('Time to pray! 🤲'))).toBeVisible();
  });

  test('offline lesson completion and sync', async () => {
    // Go offline
    await device.setStatusBar({ dataNetwork: 'none' });

    // Navigate to downloaded lesson
    await element(by.id('lessons-tab')).tap();
    await element(by.id('offline-lessons-filter')).tap();
    await element(by.id('lesson-hadith-kindness')).tap();

    // Complete offline lesson
    await waitFor(element(by.id('lesson-content')))
      .toBeVisible()
      .withTimeout(3000);

    await element(by.id('hadith-quiz-option-1')).tap();
    await element(by.id('submit-answer')).tap();
    await element(by.id('next-question')).tap();

    // Finish lesson offline
    await element(by.id('finish-lesson-button')).tap();

    // Check offline completion indicator
    await expect(element(by.id('offline-completion-badge'))).toBeVisible();
    await expect(element(by.text('Will sync when online'))).toBeVisible();

    // Go back online
    await device.setStatusBar({ dataNetwork: 'wifi' });

    // Wait for sync
    await waitFor(element(by.text('Syncing progress...')))
      .toBeVisible()
      .withTimeout(5000);

    await waitFor(element(by.text('Progress synced!')))
      .toBeVisible()
      .withTimeout(10000);

    // Verify lesson marked as completed online
    await element(by.id('profile-tab')).tap();
    await waitFor(element(by.id('recent-achievements')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.text('Hadith Lesson Completed'))).toBeVisible();
  });

  test('language switching maintains cultural context', async () => {
    // Go to settings
    await element(by.id('profile-tab')).tap();
    await element(by.id('settings-button')).tap();

    // Change to Uzbek
    await element(by.id('language-selector')).tap();
    await element(by.text('O\'zbek')).tap();

    // Verify Islamic greetings in Uzbek
    await element(by.id('back-button')).tap();
    await element(by.id('dashboard-tab')).tap();

    await expect(element(by.text('Assalomu alaykum!'))).toBeVisible();

    // Check prayer times in Uzbek
    await element(by.id('prayer-times-card')).tap();
    await expect(element(by.text('Namoz vaqtlari'))).toBeVisible();
    await expect(element(by.text('Bomdod'))).toBeVisible(); // Fajr in Uzbek

    // Switch to Russian
    await element(by.id('settings-button')).tap();
    await element(by.id('language-selector')).tap();
    await element(by.text('Русский')).tap();

    // Verify Islamic content in Russian
    await element(by.id('back-button')).tap();
    await expect(element(by.text('Ассаламу алейкум!'))).toBeVisible();

    // Check prayer times in Russian
    await element(by.id('prayer-times-card')).tap();
    await expect(element(by.text('Время намаза'))).toBeVisible();
    await expect(element(by.text('Фаджр'))).toBeVisible(); // Fajr in Russian
  });

  test('achievement system with Islamic values', async () => {
    // Complete multiple good deeds
    await element(by.id('good-deeds-tab')).tap();
    
    // Log helping classmate
    await element(by.id('add-good-deed')).tap();
    await element(by.id('deed-type-helping')).tap();
    await element(by.id('deed-description')).typeText('Helped Fatima with Arabic homework');
    await element(by.id('save-deed')).tap();

    // Log prayer completion
    await element(by.id('add-good-deed')).tap();
    await element(by.id('deed-type-prayer')).tap();
    await element(by.id('save-deed')).tap();

    // Check achievement notification
    await waitFor(element(by.text('New Achievement Unlocked!')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.text('Helper Badge'))).toBeVisible();
    await expect(element(by.text('You\'ve helped 5 classmates!'))).toBeVisible();

    // View achievements screen
    await element(by.id('view-achievements')).tap();
    
    // Check Islamic achievement categories
    await expect(element(by.text('Faith & Prayer'))).toBeVisible();
    await expect(element(by.text('Knowledge & Learning'))).toBeVisible();
    await expect(element(by.text('Kindness & Helping'))).toBeVisible();
    await expect(element(by.text('Community & Sharing'))).toBeVisible();

    // Check achievement progress
    await element(by.id('faith-achievements')).tap();
    await expect(element(by.id('prayer-consistency-badge'))).toBeVisible();
    await expect(element(by.id('quran-memorization-badge'))).toBeVisible();
  });
});
```

### Teacher Workflow E2E Tests
```typescript
// e2e/teacher-workflow.e2e.ts
describe('Teacher Daily Workflow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  test('attendance marking with offline support', async () => {
    // Login as teacher
    await element(by.id('email-input')).typeText('teacher@test.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    // Navigate to attendance
    await element(by.id('attendance-tab')).tap();
    
    // Select today's class
    await element(by.id('class-6a-arabic')).tap();

    // Wait for student list
    await waitFor(element(by.id('student-list')))
      .toBeVisible()
      .withTimeout(5000);

    // Mark attendance for multiple students
    await element(by.id('student-ahmad-present')).tap();
    await element(by.id('student-fatima-present')).tap();
    await element(by.id('student-omar-absent')).tap();
    await element(by.id('student-aisha-late')).tap();

    // Add note for late student
    await element(by.id('student-aisha-note')).tap();
    await element(by.id('note-input')).typeText('Traffic jam - valid excuse');
    await element(by.id('save-note')).tap();

    // Test offline functionality
    await device.setStatusBar({ dataNetwork: 'none' });
    
    // Continue marking attendance offline
    await element(by.id('student-khalid-present')).tap();
    
    // Check offline indicator
    await expect(element(by.id('offline-mode-indicator'))).toBeVisible();
    
    // Save attendance
    await element(by.id('save-attendance')).tap();
    
    // Check offline confirmation
    await expect(element(by.text('Attendance saved locally'))).toBeVisible();
    await expect(element(by.text('Will sync when online'))).toBeVisible();

    // Go back online
    await device.setStatusBar({ dataNetwork: 'wifi' });
    
    // Wait for sync
    await waitFor(element(by.text('Syncing attendance...')))
      .toBeVisible()
      .withTimeout(5000);
    
    await waitFor(element(by.text('Attendance synced successfully')))
      .toBeVisible()
      .withTimeout(10000);
  });

  test('student progress assessment with Islamic values', async () => {
    // Navigate to student progress
    await element(by.id('students-tab')).tap();
    await element(by.id('student-ahmad-profile')).tap();

    // Check academic progress
    await expect(element(by.text('Arabic: 85%'))).toBeVisible();
    await expect(element(by.text('Islamic Studies: 92%'))).toBeVisible();
    await expect(element(by.text('Quran Recitation: 78%'))).toBeVisible();

    // Check character development
    await element(by.id('character-tab')).tap();
    await expect(element(by.text('Kindness to Others'))).toBeVisible();
    await expect(element(by.text('Prayer Consistency'))).toBeVisible();
    await expect(element(by.text('Helping Classmates'))).toBeVisible();

    // Add character observation
    await element(by.id('add-observation')).tap();
    await element(by.id('observation-type')).tap();
    await element(by.text('Acts of Kindness')).tap();
    await element(by.id('observation-text')).typeText(
      'Ahmad helped Fatima understand Arabic grammar during group work'
    );
    await element(by.id('save-observation')).tap();

    // Check observation appears
    await expect(element(by.text('Acts of Kindness'))).toBeVisible();
    await expect(element(by.text('Ahmad helped Fatima'))).toBeVisible();
  });

  test('lesson planning with Islamic curriculum', async () => {
    // Navigate to lesson planner
    await element(by.id('lessons-tab')).tap();
    await element(by.id('create-lesson')).tap();

    // Set lesson details
    await element(by.id('lesson-title')).typeText('Names of Allah (Al-Asma ul-Husna)');
    await element(by.id('subject-selector')).tap();
    await element(by.text('Islamic Studies')).tap();
    await element(by.id('grade-selector')).tap();
    await element(by.text('Grade 6')).tap();

    // Set Islamic objectives
    await element(by.id('objectives-section')).tap();
    await element(by.id('add-objective')).tap();
    await element(by.id('objective-text')).typeText(
      'Students will learn 5 beautiful names of Allah and their meanings'
    );
    await element(by.id('add-objective')).tap();
    await element(by.id('objective-text')).typeText(
      'Students will reflect on how these names apply to daily life'
    );

    // Add Islamic activities
    await element(by.id('activities-section')).tap();
    await element(by.id('add-activity')).tap();
    await element(by.id('activity-type')).tap();
    await element(by.text('Recitation & Memorization')).tap();
    await element(by.id('activity-description')).typeText(
      'Recite and memorize Ar-Rahman, Ar-Rahim, Al-Malik, Al-Quddus, As-Salaam'
    );

    // Add reflection activity
    await element(by.id('add-activity')).tap();
    await element(by.id('activity-type')).tap();
    await element(by.text('Reflection & Discussion')).tap();
    await element(by.id('activity-description')).typeText(
      'Discuss how Allah\'s mercy (Ar-Rahman) shows in our daily lives'
    );

    // Set prayer break
    await element(by.id('schedule-section')).tap();
    await element(by.id('add-prayer-break')).tap();
    await element(by.id('prayer-time-dhuhr')).tap();

    // Save lesson
    await element(by.id('save-lesson')).tap();

    // Verify lesson created
    await waitFor(element(by.text('Lesson created successfully')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.text('Names of Allah (Al-Asma ul-Husna)'))).toBeVisible();
  });

  test('parent communication with cultural sensitivity', async () => {
    // Navigate to communications
    await element(by.id('communications-tab')).tap();
    
    // Send achievement notification
    await element(by.id('compose-message')).tap();
    await element(by.id('recipient-selector')).tap();
    await element(by.text('Ahmad\'s Parents')).tap();

    // Use respectful Islamic greeting
    await element(by.id('message-body')).typeText(
      'Assalamu Alaikum wa Rahmatullahi wa Barakatuh,\n\n' +
      'I hope this message finds your family in good health and faith.\n\n' +
      'I wanted to share some wonderful news about Ahmad\'s progress in Islamic Studies. ' +
      'He has memorized Surah Al-Fatihah beautifully and shows great understanding of its meaning.\n\n' +
      'May Allah continue to bless Ahmad\'s learning journey.\n\n' +
      'Barakallahu feeki,\nUstazah Sarah'
    );

    // Set message priority
    await element(by.id('priority-selector')).tap();
    await element(by.text('Good News')).tap();

    // Schedule for appropriate time
    await element(by.id('schedule-toggle')).tap();
    await element(by.id('time-picker')).setColumnToValue(0, '7'); // 7 PM
    await element(by.id('time-picker')).setColumnToValue(1, '00');

    // Send message
    await element(by.id('send-message')).tap();

    // Verify sent
    await waitFor(element(by.text('Message sent successfully')))
      .toBeVisible()
      .withTimeout(3000);

    // Check in sent messages
    await element(by.id('sent-tab')).tap();
    await expect(element(by.text('Ahmad\'s Parents'))).toBeVisible();
    await expect(element(by.text('Assalamu Alaikum wa Rahmatullahi'))).toBeVisible();
  });
});
```

## 6. Performance Testing

### App Startup Performance
```typescript
// e2e/performance.e2e.ts
describe('Performance Metrics', () => {
  test('app startup time under 3 seconds', async () => {
    const startTime = Date.now();
    
    await device.launchApp({ newInstance: true });
    
    // Wait for splash screen to disappear
    await waitFor(element(by.id('splash-screen')))
      .not.toBeVisible()
      .withTimeout(5000);
    
    // Wait for main content to load
    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(5000);
    
    const endTime = Date.now();
    const startupTime = endTime - startTime;
    
    expect(startupTime).toBeLessThan(3000); // 3 seconds
  });

  test('dashboard loads within 2 seconds after login', async () => {
    // Login
    await element(by.id('email-input')).typeText('student@test.com');
    await element(by.id('password-input')).typeText('password123');
    
    const loginStartTime = Date.now();
    await element(by.id('login-button')).tap();
    
    // Wait for dashboard
    await waitFor(element(by.id('dashboard-screen')))
      .toBeVisible()
      .withTimeout(5000);
    
    const dashboardLoadTime = Date.now() - loginStartTime;
    expect(dashboardLoadTime).toBeLessThan(2000); // 2 seconds
  });

  test('lesson list scrolling maintains 60fps', async () => {
    await element(by.id('lessons-tab')).tap();
    
    // Wait for lessons to load
    await waitFor(element(by.id('lessons-list')))
      .toBeVisible()
      .withTimeout(3000);
    
    // Performance monitoring during scroll
    const scrollPerformance = await device.captureViewHierarchy();
    
    // Scroll through lessons
    for (let i = 0; i < 10; i++) {
      await element(by.id('lessons-list')).scroll(200, 'down');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Check for frame drops
    const finalPerformance = await device.captureViewHierarchy();
    
    // This would need custom performance measurement
    // In practice, you'd use tools like Flipper or custom metrics
  });

  test('memory usage remains stable during extended use', async () => {
    // Simulate extended app usage
    const tasks = [
      () => element(by.id('dashboard-tab')).tap(),
      () => element(by.id('lessons-tab')).tap(),
      () => element(by.id('profile-tab')).tap(),
      () => element(by.id('vocabulary-tab')).tap(),
    ];
    
    // Cycle through tabs 20 times
    for (let cycle = 0; cycle < 20; cycle++) {
      for (const task of tasks) {
        await task();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Check app is still responsive
    await waitFor(element(by.id('dashboard-tab')))
      .toBeVisible()
      .withTimeout(2000);
    
    // In practice, you'd monitor memory usage through development tools
  });
});
```

### Component Performance Testing
```typescript
// src/components/__tests__/performance/LessonList.performance.test.tsx
import React from 'react';
import { render, act } from '@testing-library/react-native';
import { LessonList } from '../../LessonList';

describe('LessonList Performance', () => {
  test('renders 100 lessons efficiently', async () => {
    const largeLessonSet = Array.from({ length: 100 }, (_, i) => ({
      id: `lesson-${i}`,
      title: `Lesson ${i + 1}`,
      subject: 'Arabic',
      duration: 30,
      difficulty: 'intermediate',
      progress: Math.random() * 100,
    }));

    const startTime = performance.now();
    
    const { getByTestId } = render(
      <LessonList lessons={largeLessonSet} />
    );

    await act(async () => {
      // Wait for virtualized list to render
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within 100ms
    expect(renderTime).toBeLessThan(100);

    // Check that virtualization is working (not all items rendered)
    const renderedItems = getByTestId('lesson-list-content').children;
    expect(renderedItems.length).toBeLessThan(100);
  });

  test('smooth scrolling performance with animations', async () => {
    const lessons = Array.from({ length: 50 }, (_, i) => ({
      id: `lesson-${i}`,
      title: `Islamic Studies ${i + 1}`,
      subject: 'Islamic Studies',
      duration: 45,
      hasAnimation: true,
    }));

    const { getByTestId } = render(
      <LessonList lessons={lessons} enableAnimations={true} />
    );

    const scrollView = getByTestId('lesson-scroll-view');

    // Measure scroll performance
    const scrollStartTime = performance.now();
    
    // Simulate scroll events
    for (let i = 0; i < 10; i++) {
      act(() => {
        scrollView.props.onScroll({
          nativeEvent: {
            contentOffset: { y: i * 100 },
            contentSize: { height: 5000 },
            layoutMeasurement: { height: 600 },
          },
        });
      });
    }

    const scrollEndTime = performance.now();
    const scrollDuration = scrollEndTime - scrollStartTime;

    // Scroll handling should be under 50ms
    expect(scrollDuration).toBeLessThan(50);
  });

  test('image loading does not block UI', async () => {
    const lessonsWithImages = Array.from({ length: 20 }, (_, i) => ({
      id: `lesson-${i}`,
      title: `Quran Lesson ${i + 1}`,
      imageUrl: `https://example.com/lesson-${i}.jpg`,
      subject: 'Quran Studies',
    }));

    const renderStartTime = performance.now();

    const { getByTestId } = render(
      <LessonList lessons={lessonsWithImages} />
    );

    // UI should render immediately without waiting for images
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime;

    expect(renderTime).toBeLessThan(50);

    // Check that placeholder images are shown
    const firstLessonImage = getByTestId('lesson-0-image');
    expect(firstLessonImage.props.source).toEqual(
      expect.objectContaining({
        uri: expect.stringContaining('placeholder'),
      })
    );
  });
});
```

## 7. CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/mobile-tests.yml
name: Mobile App Testing

on:
  push:
    branches: [main, develop]
    paths:
      - 'mobile/**'
  pull_request:
    branches: [main]
    paths:
      - 'mobile/**'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: mobile/package-lock.json
          
      - name: Install dependencies
        working-directory: mobile
        run: npm ci
        
      - name: Run unit tests
        working-directory: mobile
        run: npm run test:unit -- --coverage --watchAll=false
        
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          directory: mobile/coverage
          flags: mobile-unit-tests
          
      - name: Check coverage threshold
        working-directory: mobile
        run: npm run test:coverage-check

  component-tests:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: mobile/package-lock.json
          
      - name: Install dependencies
        working-directory: mobile
        run: npm ci
        
      - name: Run component tests
        working-directory: mobile
        run: npm run test:components -- --watchAll=false
        
      - name: Generate component test report
        working-directory: mobile
        run: npm run test:report

  i18n-tests:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: mobile/package-lock.json
          
      - name: Install dependencies
        working-directory: mobile
        run: npm ci
        
      - name: Validate translation keys
        working-directory: mobile
        run: npm run test:i18n-keys
        
      - name: Test i18n functionality
        working-directory: mobile
        run: npm run test:i18n -- --watchAll=false
        
      - name: Check Islamic cultural content
        working-directory: mobile
        run: npm run test:cultural-content

  offline-tests:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: mobile/package-lock.json
          
      - name: Install dependencies
        working-directory: mobile
        run: npm ci
        
      - name: Test offline functionality
        working-directory: mobile
        run: npm run test:offline -- --watchAll=false
        
      - name: Test sync mechanisms
        working-directory: mobile
        run: npm run test:sync

  android-e2e:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: mobile/package-lock.json
          
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '11'
          
      - name: Install dependencies
        working-directory: mobile
        run: npm ci
        
      - name: Enable KVM
        run: |
          echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' | sudo tee /etc/udev/rules.d/99-kvm4all.rules
          sudo udevadm control --reload-rules
          sudo udevadm trigger --name-match=kvm
          
      - name: AVD cache
        uses: actions/cache@v3
        id: avd-cache
        with:
          path: |
            ~/.android/avd/*
            ~/.android/adb*
          key: avd-29
          
      - name: Create AVD and generate snapshot
        if: steps.avd-cache.outputs.cache-hit != 'true'
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 29
          target: google_apis
          arch: x86_64
          profile: Nexus 6
          cores: 2
          ram-size: 4096M
          heap-size: 512M
          script: echo "Generated AVD snapshot"
          
      - name: Build Android app
        working-directory: mobile
        run: |
          cd android
          ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug
          
      - name: Run E2E tests
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 29
          target: google_apis
          arch: x86_64
          profile: Nexus 6
          cores: 2
          ram-size: 4096M
          heap-size: 512M
          script: |
            cd mobile
            npm run test:e2e:android
            
      - name: Upload E2E test artifacts
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: android-e2e-artifacts
          path: |
            mobile/e2e/artifacts/**
            mobile/detox_tests_log.txt

  ios-e2e:
    runs-on: macos-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: mobile/package-lock.json
          
      - name: Install dependencies
        working-directory: mobile
        run: npm ci
        
      - name: Install Detox CLI
        run: npm install -g detox-cli
        
      - name: Build iOS app
        working-directory: mobile
        run: detox build --configuration ios.sim.debug
        
      - name: Run E2E tests
        working-directory: mobile
        run: detox test --configuration ios.sim.debug --cleanup
        
      - name: Upload E2E test artifacts
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: ios-e2e-artifacts
          path: |
            mobile/e2e/artifacts/**
            mobile/detox_tests_log.txt

  performance-tests:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: mobile/package-lock.json
          
      - name: Install dependencies
        working-directory: mobile
        run: npm ci
        
      - name: Run performance tests
        working-directory: mobile
        run: npm run test:performance
        
      - name: Bundle size analysis
        working-directory: mobile
        run: npm run analyze:bundle
        
      - name: Upload performance report
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: mobile/performance-report.html

  security-audit:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: mobile/package-lock.json
          
      - name: Install dependencies
        working-directory: mobile
        run: npm ci
        
      - name: Run security audit
        working-directory: mobile
        run: |
          npm audit --audit-level high
          npm run security:scan
          
      - name: Scan for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: mobile/
          base: main
          head: HEAD
```

### Package.json Test Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=__tests__.*\\.test\\.(ts|tsx)$",
    "test:components": "jest --testPathPattern=components.*\\.test\\.(ts|tsx)$",
    "test:integration": "jest --testPathPattern=integration.*\\.test\\.(ts|tsx)$",
    "test:i18n": "jest --testPathPattern=i18n.*\\.test\\.(ts|tsx)$",
    "test:i18n-keys": "node scripts/validate-i18n-keys.js",
    "test:cultural-content": "jest --testPathPattern=cultural.*\\.test\\.(ts|tsx)$",
    "test:offline": "jest --testPathPattern=offline.*\\.test\\.(ts|tsx)$",
    "test:sync": "jest --testPathPattern=sync.*\\.test\\.(ts|tsx)$",
    "test:performance": "jest --testPathPattern=performance.*\\.test\\.(ts|tsx)$",
    "test:coverage": "jest --coverage",
    "test:coverage-check": "jest --coverage --coverageThreshold='{\"global\":{\"branches\":90,\"functions\":90,\"lines\":90,\"statements\":90}}'",
    "test:watch": "jest --watch",
    "test:report": "jest --reporters=default --reporters=jest-html-reporters",
    "test:e2e:android": "detox test --configuration android.emu.debug",
    "test:e2e:ios": "detox test --configuration ios.sim.debug",
    "security:scan": "npm audit && snyk test",
    "analyze:bundle": "npx react-native-bundle-visualizer"
  }
}
```

## Testing Strategy Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Jest configuration with React Native Testing Library
- [ ] Create comprehensive mocking setup for Supabase, Expo modules
- [ ] Implement basic unit tests for utility functions
- [ ] Set up i18n testing framework
- [ ] Configure GitHub Actions CI pipeline

### Phase 2: Component Testing (Week 3-4)
- [ ] Test age-adaptive UI components (elementary vs secondary)
- [ ] Test Islamic cultural components (prayer times, Islamic calendar)
- [ ] Test offline-capable components with sync indicators
- [ ] Test multi-language rendering and cultural context
- [ ] Implement accessibility testing

### Phase 3: Integration & E2E (Week 5-6)
- [ ] Set up Detox for E2E testing
- [ ] Test complete user journeys (student lessons, teacher workflows)
- [ ] Test offline synchronization scenarios
- [ ] Test authentication flows and role-based access
- [ ] Performance testing and optimization

### Phase 4: Continuous Testing (Week 7-8)
- [ ] Refine CI/CD pipeline with parallel test execution
- [ ] Set up automated performance monitoring
- [ ] Implement security testing and dependency scanning
- [ ] Create comprehensive test reporting and coverage analysis
- [ ] Documentation and team training

## Quality Gates

### Required for Pull Request Approval
- ✅ Unit test coverage ≥ 90%
- ✅ Component test coverage ≥ 85%
- ✅ All i18n key validation passes
- ✅ Islamic cultural content tests pass
- ✅ Offline functionality tests pass
- ✅ No security vulnerabilities
- ✅ Performance benchmarks met

### Required for Production Release
- ✅ All E2E tests pass on iOS and Android
- ✅ Authentication and authorization tests pass
- ✅ Data synchronization tests pass
- ✅ Accessibility compliance verified
- ✅ Performance metrics within targets
- ✅ Bundle size optimization verified

## Conclusion

This comprehensive mobile testing strategy ensures the Harry School CRM mobile applications meet the highest standards for educational software while respecting Islamic cultural values and supporting diverse age groups. The multi-layered approach from unit tests to E2E scenarios, combined with robust CI/CD integration, provides confidence in the reliability, performance, and cultural appropriateness of the applications.

The strategy emphasizes the unique aspects of the Islamic educational context, including prayer time integration, cultural sensitivity in UI design, and age-appropriate content delivery, while maintaining technical excellence in offline-first architecture and multi-language support.