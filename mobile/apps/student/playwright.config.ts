/**
 * Playwright Configuration for Harry School Student App
 * 
 * E2E testing configuration for React Native app with deep linking
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:8081',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for each action */
    actionTimeout: 10000,
    
    /* Global timeout for navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers and mobile devices */
  projects: [
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        // Simulate mobile device for React Native testing
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
      },
    },
    
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        // Simulate iOS device for React Native testing
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
    
    {
      name: 'Tablet iPad',
      use: {
        ...devices['iPad Pro'],
        // Test on tablet for different layout testing
        viewport: { width: 1024, height: 1366 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },

    // Desktop browsers for development testing
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 }, // Mobile viewport on desktop
      },
    },
    
    {
      name: 'Desktop Safari',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 375, height: 812 }, // Mobile viewport on desktop
      },
    },
  ],

  /* Test matching patterns */
  testMatch: [
    '**/*.e2e.test.ts',
    '**/*.integration.test.ts'
  ],

  /* Exclude unit tests */
  testIgnore: [
    '**/*.unit.test.ts',
    '**/*.spec.ts'
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./src/tests/global-setup.ts'),
  globalTeardown: require.resolve('./src/tests/global-teardown.ts'),

  /* Test timeout */
  timeout: 60000,

  /* Expect timeout */
  expect: {
    timeout: 10000,
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results/',

  /* Configure test environment */
  webServer: [
    {
      command: 'npm run start:test',
      port: 8081,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        NODE_ENV: 'test',
        EXPO_USE_DEV_SERVER: 'true',
      }
    }
  ],

  /* Mobile-specific test configuration */
  metadata: {
    testType: 'e2e',
    platform: 'react-native',
    framework: 'expo',
    features: [
      'deep-linking',
      'age-adaptive-ui',
      'cultural-integration',
      'islamic-calendar',
      'parental-controls'
    ]
  }
});

// Export additional configuration for mobile testing
export const mobileTestConfig = {
  // Age groups for testing
  ageGroups: {
    elementary: { min: 10, max: 12, representative: 11 },
    middleSchool: { min: 13, max: 15, representative: 14 },
    highSchool: { min: 16, max: 18, representative: 17 }
  },
  
  // Deep link test URLs
  testUrls: {
    home: 'harryschool://home',
    schedule: {
      month: 'harryschool://schedule/month',
      week: 'harryschool://schedule/week',
      withDate: 'harryschool://schedule/week/2024-03-15'
    },
    classes: {
      view: 'harryschool://class/math-101/view',
      attendance: 'harryschool://class/math-101/attendance',
      homework: 'harryschool://class/math-101/homework'
    },
    profile: {
      overview: 'harryschool://profile/overview',
      achievements: 'harryschool://profile/achievements',
      settings: 'harryschool://profile/settings'
    },
    settings: {
      general: 'harryschool://settings/general',
      privacy: 'harryschool://settings/privacy',
      notifications: 'harryschool://settings/notifications',
      advanced: 'harryschool://settings/advanced'
    },
    requests: {
      lesson: 'harryschool://request/lesson/create',
      homework: 'harryschool://request/homework/create',
      tutoring: 'harryschool://request/tutoring/create'
    },
    vocabulary: {
      main: 'harryschool://vocabulary',
      flashcards: 'harryschool://vocabulary/flashcards',
      translator: 'harryschool://vocabulary/translator',
      games: 'harryschool://vocabulary/games'
    }
  },
  
  // Cultural integration test data
  cultural: {
    languages: ['en', 'ru', 'uz'],
    islamicCalendar: {
      events: ['Ramadan', 'Eid al-Fitr', 'Eid al-Adha'],
      prayerTimes: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
    },
    greetings: {
      islamic: ['Assalamu alaykum', 'Ahlan wa sahlan', 'Masa\'a alkhayr'],
      general: ['Good morning', 'Good afternoon', 'Good evening']
    }
  },
  
  // Accessibility test requirements
  accessibility: {
    minimumTouchTargetSize: {
      elementary: 52, // Larger for younger students
      middleSchool: 48,
      highSchool: 44
    },
    contrastRatio: {
      normal: 4.5,
      large: 3.0
    },
    screenReaderSupport: true,
    keyboardNavigation: true
  },
  
  // Performance benchmarks
  performance: {
    maxLoadTime: 3000, // 3 seconds
    maxNavigationTime: 500, // 500ms
    maxDeepLinkProcessingTime: 1000, // 1 second
    minFrameRate: 55 // FPS for smooth animations
  }
};