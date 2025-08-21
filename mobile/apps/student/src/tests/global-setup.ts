/**
 * Global Test Setup for Harry School Student App
 * 
 * Configures test environment for deep linking and mobile testing
 */

import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up Harry School Student App E2E tests...');
  
  // Setup test database state
  await setupTestDatabase();
  
  // Configure mock services
  await setupMockServices();
  
  // Setup deep linking test environment
  await setupDeepLinkingEnvironment();
  
  // Setup cultural integration test data
  await setupCulturalTestData();
  
  console.log('✅ Global setup completed successfully');
}

async function setupTestDatabase() {
  console.log('📊 Setting up test database...');
  
  // Mock student data for different age groups
  const testStudents = [
    {
      id: 'student-elementary',
      age: 11,
      name: 'Ahmed Al-Rashid',
      grade: 5,
      subjects: ['math', 'english', 'science'],
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
    {
      id: 'student-middle',
      age: 14,
      name: 'Fatima Karimova',
      grade: 8,
      subjects: ['math', 'english', 'science', 'history'],
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
    {
      id: 'student-high',
      age: 17,
      name: 'Bobur Abdullayev',
      grade: 11,
      subjects: ['math', 'english', 'physics', 'chemistry', 'computer-science'],
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
  ];
  
  // Store test data in global context
  (global as any).__TEST_STUDENTS__ = testStudents;
  
  console.log(`✅ Created ${testStudents.length} test student profiles`);
}

async function setupMockServices() {
  console.log('🔧 Setting up mock services...');
  
  // Mock authentication service
  const mockAuthService = {
    authenticate: async (studentId: string) => ({
      token: `mock-token-${studentId}`,
      expires: Date.now() + 3600000, // 1 hour
      role: 'student'
    }),
    
    validateToken: async (token: string) => ({
      valid: token.startsWith('mock-token-'),
      studentId: token.replace('mock-token-', ''),
      role: 'student'
    })
  };
  
  // Mock navigation service
  const mockNavigationService = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    isReady: jest.fn().mockReturnValue(true)
  };
  
  // Mock Supabase client
  const mockSupabaseClient = {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [], error: null })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      })
    }),
    
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockImplementation((callback) => {
        callback('SUBSCRIBED');
        return { unsubscribe: jest.fn() };
      })
    })
  };
  
  // Store mock services in global context
  (global as any).__MOCK_SERVICES__ = {
    auth: mockAuthService,
    navigation: mockNavigationService,
    supabase: mockSupabaseClient
  };
  
  console.log('✅ Mock services configured');
}

async function setupDeepLinkingEnvironment() {
  console.log('🔗 Setting up deep linking test environment...');
  
  // Mock URL schemes
  const mockUrlSchemes = [
    'harryschool://',
    'https://student.harryschool.app/',
    'https://app.harryschool.uz/'
  ];
  
  // Mock deep link test data
  const deepLinkTestData = {
    validUrls: [
      'harryschool://home',
      'harryschool://schedule/month',
      'harryschool://schedule/week/2024-03-15',
      'harryschool://class/math-101/view',
      'harryschool://profile/overview',
      'harryschool://settings/general',
      'harryschool://request/lesson/create',
      'harryschool://vocabulary/flashcards'
    ],
    
    restrictedUrls: {
      elementary: [
        'harryschool://settings/privacy',
        'harryschool://settings/payments',
        'harryschool://settings/advanced'
      ],
      middleSchool: [
        'harryschool://settings/payments',
        'harryschool://settings/advanced'
      ],
      highSchool: []
    },
    
    maliciousUrls: [
      'javascript:alert("xss")',
      'harryschool://../../etc/passwd',
      'https://malicious-site.com/harryschool/',
      'harryschool://../admin/delete-all'
    ]
  };
  
  // Store deep linking test data
  (global as any).__DEEP_LINK_TEST_DATA__ = deepLinkTestData;
  
  console.log('✅ Deep linking environment configured');
}

async function setupCulturalTestData() {
  console.log('🕌 Setting up cultural integration test data...');
  
  // Islamic calendar test data
  const islamicCalendarData = {
    events: [
      {
        name: 'Ramadan',
        gregorianDate: '2024-03-11',
        islamicDate: '1445-09-01',
        significance: 'high',
        description: 'Holy month of fasting'
      },
      {
        name: 'Eid al-Fitr',
        gregorianDate: '2024-04-10',
        islamicDate: '1445-10-01',
        significance: 'high',
        description: 'Festival of breaking the fast'
      },
      {
        name: 'Eid al-Adha',
        gregorianDate: '2024-06-17',
        islamicDate: '1445-12-10',
        significance: 'high',
        description: 'Festival of sacrifice'
      }
    ],
    
    prayerTimes: {
      tashkent: {
        fajr: '04:30',
        sunrise: '06:00',
        dhuhr: '12:30',
        asr: '16:00',
        maghrib: '18:45',
        isha: '20:15'
      }
    }
  };
  
  // Multi-language test data
  const languageTestData = {
    en: {
      greetings: {
        morning: 'Good morning',
        afternoon: 'Good afternoon',
        evening: 'Good evening'
      },
      navigation: {
        home: 'Home',
        schedule: 'Schedule',
        profile: 'Profile',
        vocabulary: 'Vocabulary'
      }
    },
    
    ru: {
      greetings: {
        morning: 'Доброе утро',
        afternoon: 'Добрый день',
        evening: 'Добрый вечер'
      },
      navigation: {
        home: 'Главная',
        schedule: 'Расписание',
        profile: 'Профиль',
        vocabulary: 'Словарь'
      }
    },
    
    uz: {
      greetings: {
        morning: 'Xayrli tong',
        afternoon: 'Xayrli kun',
        evening: 'Xayrli kech'
      },
      navigation: {
        home: 'Bosh sahifa',
        schedule: 'Jadval',
        profile: 'Profil',
        vocabulary: 'Lugʻat'
      }
    }
  };
  
  // Islamic greetings
  const islamicGreetings = {
    formal: ['Assalamu alaykum', 'Ahlan wa sahlan'],
    casual: ['Marhaba', 'Ahlan'],
    timeBasedFormal: {
      morning: 'Assalamu alaykum wa rahmatullahi wa barakatuh',
      afternoon: 'Ahlan wa sahlan',
      evening: 'Masa\'a alkhayr'
    }
  };
  
  // Store cultural test data
  (global as any).__CULTURAL_TEST_DATA__ = {
    islamicCalendar: islamicCalendarData,
    languages: languageTestData,
    islamicGreetings
  };
  
  console.log('✅ Cultural integration test data configured');
}

export default globalSetup;