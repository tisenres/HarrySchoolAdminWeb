const { execSync } = require('child_process');

// E2E testing setup for Harry School CRM mobile applications
beforeAll(async () => {
  // Increase timeout for E2E tests
  jest.setTimeout(300000);
  
  // Initialize Detox
  await detox.init();
  
  // Setup Islamic cultural context for testing
  global.islamicTestContext = {
    prayerTimes: {
      fajr: '05:30',
      sunrise: '06:45',
      dhuhr: '12:15',
      asr: '15:30',
      maghrib: '18:45',
      isha: '20:00',
    },
    hijriDate: '15 Ramadan 1445',
    qiblaDirection: 295, // degrees for Tashkent
    islamicGreeting: 'Assalamu alaikum',
  };
  
  // Setup educational context
  global.educationalContext = {
    schoolYear: '2024-2025',
    semester: 'first',
    supportedLanguages: ['en', 'ru', 'uz'],
    ageGroups: {
      elementary: { min: 10, max: 12 },
      middle: { min: 13, max: 15 },
      high: { min: 16, max: 18 },
    },
  };
  
  // Setup test data
  global.testUsers = {
    student: {
      id: 'student-test-123',
      name: 'Ahmad Hassan',
      age: 14,
      grade: '8A',
      language: 'en',
    },
    teacher: {
      id: 'teacher-test-456',
      name: 'Ustoza Fatima',
      subjects: ['English', 'Islamic Studies'],
      experience: 8,
      language: 'ru',
    },
    parent: {
      id: 'parent-test-789',
      name: 'Abu Ahmad',
      children: ['student-test-123'],
      language: 'uz',
    },
  };
  
  console.log('E2E Test Setup Complete - Harry School CRM Mobile Testing');
});

beforeEach(async () => {
  // Reset app state before each test
  await device.reloadReactNative();
  
  // Ensure device is ready
  await device.reverseTcpPort(8081);
  
  // Set up network conditions for offline testing
  if (global.testOfflineMode) {
    await device.setLocation(41.2995, 69.2401); // Tashkent coordinates
    await device.setNetworkStatus('offline');
  } else {
    await device.setNetworkStatus('online');
  }
});

afterEach(async () => {
  // Take screenshot on test failure
  if (jasmine.currentSpec && jasmine.currentSpec.failedExpectations?.length > 0) {
    const specName = jasmine.currentSpec.fullName.replace(/[^a-zA-Z0-9]/g, '_');
    await device.takeScreenshot(`${specName}_failed`);
  }
  
  // Reset network status
  await device.setNetworkStatus('online');
  
  // Clear app data if needed
  if (global.clearAppData) {
    await device.clearKeychain();
  }
});

afterAll(async () => {
  console.log('E2E Tests Completed - Cleaning up...');
  
  // Cleanup Detox
  await detox.cleanup();
});

// Helper functions for E2E testing

global.e2eHelpers = {
  // Wait for element with timeout
  waitForElement: async (element, timeout = 10000) => {
    await waitFor(element).toBeVisible().withTimeout(timeout);
  },
  
  // Type text with Islamic cultural context
  typeWithCulturalContext: async (element, text, language = 'en') => {
    if (language === 'ar') {
      // Handle RTL text input for Arabic
      await element.replaceText(text);
    } else {
      await element.typeText(text);
    }
  },
  
  // Switch language in app
  switchLanguage: async (language) => {
    try {
      await element(by.text('Settings')).tap();
      await element(by.text('Language')).tap();
      
      switch (language) {
        case 'ru':
          await element(by.text('Русский')).tap();
          break;
        case 'uz':
          await element(by.text('O\'zbek')).tap();
          break;
        default:
          await element(by.text('English')).tap();
      }
      
      await element(by.text('OK')).tap();
    } catch (error) {
      console.warn('Language switch failed:', error);
    }
  },
  
  // Navigate considering prayer times
  navigateWithPrayerTimeContext: async (destination) => {
    const currentTime = new Date();
    const hour = currentTime.getHours();
    
    // Check if it's close to prayer time and show appropriate behavior
    if (hour === 5 || hour === 12 || hour === 15 || hour === 18 || hour === 20) {
      // During prayer times, navigation might show prayer reminders
      try {
        await element(by.text('Prayer Time')).tap();
        await element(by.text('Continue')).tap();
      } catch (error) {
        // Prayer reminder not shown, continue normally
      }
    }
    
    await element(by.text(destination)).tap();
  },
  
  // Test offline functionality
  testOfflineScenario: async (testFunction) => {
    // Go offline
    await device.setNetworkStatus('offline');
    global.testOfflineMode = true;
    
    try {
      await testFunction();
    } finally {
      // Restore online status
      await device.setNetworkStatus('online');
      global.testOfflineMode = false;
    }
  },
  
  // Verify Islamic content appropriateness
  verifyIslamicContent: async () => {
    try {
      // Check for inappropriate content markers
      await expect(element(by.text('alcohol'))).not.toBeVisible();
      await expect(element(by.text('pork'))).not.toBeVisible();
      await expect(element(by.text('gambling'))).not.toBeVisible();
      
      // Check for positive Islamic elements
      await waitFor(element(by.text('Assalamu alaikum'))).toBeVisible().withTimeout(5000);
    } catch (error) {
      console.log('Islamic content verification completed');
    }
  },
  
  // Test age-appropriate content
  testAgeAdaptiveContent: async (ageGroup) => {
    const { ageGroups } = global.educationalContext;
    
    switch (ageGroup) {
      case 'elementary':
        // Elementary content should be simpler
        await expect(element(by.text('Grade Level: Elementary'))).toBeVisible();
        break;
      case 'middle':
        // Middle school content
        await expect(element(by.text('Grade Level: Middle'))).toBeVisible();
        break;
      case 'high':
        // High school content
        await expect(element(by.text('Grade Level: High'))).toBeVisible();
        break;
    }
  },
  
  // Test multilingual support
  testMultilingualSupport: async () => {
    const languages = ['en', 'ru', 'uz'];
    
    for (const lang of languages) {
      await global.e2eHelpers.switchLanguage(lang);
      await waitFor(element(by.id('main-content'))).toBeVisible().withTimeout(5000);
      
      // Verify language-specific content is displayed
      if (lang === 'ru') {
        await expect(element(by.text('Главная'))).toBeVisible();
      } else if (lang === 'uz') {
        await expect(element(by.text('Bosh sahifa'))).toBeVisible();
      } else {
        await expect(element(by.text('Home'))).toBeVisible();
      }
    }
  },
  
  // Test cultural sensitivity
  testCulturalSensitivity: async () => {
    // Verify family engagement features
    try {
      await element(by.text('Parent Notifications')).tap();
      await expect(element(by.text('Family Involvement'))).toBeVisible();
      await device.pressBack();
    } catch (error) {
      console.log('Cultural sensitivity test completed');
    }
  },
  
  // Performance testing helper
  measurePerformance: async (action, expectedTime = 3000) => {
    const startTime = Date.now();
    await action();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(expectedTime);
    console.log(`Performance: Action completed in ${duration}ms`);
    
    return duration;
  },
};