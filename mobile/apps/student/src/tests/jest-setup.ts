/**
 * Jest Setup for Harry School Student App
 * 
 * Global test setup and mocks for unit tests
 */

import 'react-native-gesture-handler/jestSetup';

// Mock console methods in tests
global.console = {
  ...console,
  // Uncomment to ignore specific log types
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Expo modules
jest.mock('expo-linking', () => ({
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    dispatch: jest.fn(),
    isFocused: jest.fn(() => true),
    addListener: jest.fn(() => jest.fn()),
  }),
  useRoute: () => ({
    params: {},
    name: 'TestScreen',
    key: 'TestScreen-key',
  }),
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }: any) => children,
  createStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

// Mock React Navigation Stack
jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
  StackActions: {
    push: jest.fn(),
    pop: jest.fn(),
    popToTop: jest.fn(),
    replace: jest.fn(),
  },
}));

// Mock React Navigation Bottom Tabs
jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
  TabActions: {
    jumpTo: jest.fn(),
  },
}));

// Mock React Native components that might cause issues
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Vector Icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock Safe Area Context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
}));

// Mock Gesture Handler
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

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {};
  
  return Reanimated;
});

// Mock Async Storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(() => Promise.resolve({ error: null })),
      unsubscribe: jest.fn(() => Promise.resolve({ error: null })),
    })),
  })),
}));

// Mock Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  RN.Alert = {
    alert: jest.fn(),
  };
  
  return RN;
});

// Global test utilities
global.__TEST_UTILS__ = {
  // Mock student data for different age groups
  mockStudents: {
    elementary: {
      id: 'student-elementary',
      age: 11,
      name: 'Ahmed Al-Rashid',
      grade: 5,
      parentalSettings: {
        oversightRequired: true,
        familyNotifications: true,
        restrictedFeatures: ['privacy', 'payments'],
        approvedTeachers: ['teacher-1', 'teacher-2']
      },
      culturalPreferences: {
        language: 'en',
        islamicGreetings: true,
        showIslamicCalendar: true,
        prayerTimeAware: true
      }
    },
    
    middleSchool: {
      id: 'student-middle',
      age: 14,
      name: 'Fatima Karimova',
      grade: 8,
      parentalSettings: {
        oversightRequired: false,
        familyNotifications: true,
        restrictedFeatures: ['payments'],
        approvedTeachers: []
      },
      culturalPreferences: {
        language: 'ru',
        islamicGreetings: true,
        showIslamicCalendar: true,
        prayerTimeAware: true
      }
    },
    
    highSchool: {
      id: 'student-high',
      age: 17,
      name: 'Bobur Abdullayev',
      grade: 11,
      parentalSettings: {
        oversightRequired: false,
        familyNotifications: false,
        restrictedFeatures: [],
        approvedTeachers: []
      },
      culturalPreferences: {
        language: 'uz',
        islamicGreetings: true,
        showIslamicCalendar: true,
        prayerTimeAware: false
      }
    }
  },
  
  // Helper functions for tests
  mockDeepLinkConfig: (age: number, authenticated: boolean = true) => ({
    studentAge: age,
    authenticationStatus: authenticated ? 'authenticated' : 'unauthenticated',
    parentalSettings: {
      oversightRequired: age <= 12,
      familyNotifications: true,
      restrictedFeatures: age <= 12 ? ['privacy', 'payments'] : age <= 15 ? ['payments'] : [],
      approvedTeachers: []
    }
  }),
  
  // Wait for async operations in tests
  waitFor: async (callback: () => boolean, timeout: number = 5000): Promise<void> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (callback()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
  }
};

// Setup fake timers for testing
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});