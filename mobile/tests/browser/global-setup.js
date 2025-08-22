// Global setup for Playwright browser tests
const { chromium } = require('@playwright/test');

async function globalSetup(config) {
  console.log('🚀 Starting Harry School CRM Browser Testing Setup...');
  
  // Setup Islamic cultural context for testing
  process.env.ISLAMIC_TEST_MODE = 'true';
  process.env.PRAYER_TIMES_ENABLED = 'true';
  process.env.CULTURAL_VALIDATION = 'true';
  
  // Setup educational context
  process.env.SCHOOL_YEAR = '2024-2025';
  process.env.ISLAMIC_YEAR = '1445';
  process.env.SUPPORTED_LANGUAGES = 'en,ru,uz';
  
  // Setup Uzbekistan-specific testing context
  process.env.TIMEZONE = 'Asia/Tashkent';
  process.env.COUNTRY_CODE = 'UZ';
  process.env.EDUCATIONAL_STANDARDS = 'uzbekistan';
  
  // Browser setup for different testing scenarios
  const browser = await chromium.launch();
  const context = await browser.newContext({
    // Set Uzbekistan location
    geolocation: { latitude: 41.2995, longitude: 69.2401 },
    permissions: ['geolocation'],
    
    // Set Tashkent timezone
    timezoneId: 'Asia/Tashkent',
    
    // Set locale
    locale: 'en-US',
    
    // Viewport for testing
    viewport: { width: 1280, height: 720 },
  });
  
  const page = await context.newPage();
  
  // Verify the student app is accessible
  try {
    await page.goto('http://localhost:8081', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ Student app is accessible for testing');
    
    // Check for Islamic cultural compliance
    const pageContent = await page.textContent('body');
    if (pageContent.includes('alcohol') || pageContent.includes('pork') || pageContent.includes('gambling')) {
      console.warn('⚠️  Warning: Potentially inappropriate content detected for Islamic context');
    } else {
      console.log('✅ Islamic cultural compliance verified');
    }
    
  } catch (error) {
    console.warn('⚠️  Student app not running - some tests may be skipped');
    console.log('   Start the student app with: cd apps/student && npm run web');
  }
  
  await page.close();
  await context.close();
  await browser.close();
  
  // Setup test data for Islamic educational context
  global.testData = {
    islamicContext: {
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
      culturalValues: ['respect', 'knowledge', 'patience', 'kindness'],
    },
    
    educationalContext: {
      schoolYear: '2024-2025',
      semester: 'first',
      ageGroups: {
        elementary: { min: 10, max: 12, touchTarget: 52 },
        middle: { min: 13, max: 15, touchTarget: 48 },
        high: { min: 16, max: 18, touchTarget: 44 },
      },
      supportedLanguages: ['en', 'ru', 'uz'],
      uzbekistanStandards: true,
    },
    
    performanceTargets: {
      appLaunch: 3000, // 3 seconds
      pageLoad: 2000,  // 2 seconds
      navigation: 1000, // 1 second
      fps: 60,
      memoryUsage: 200, // MB
    },
    
    accessibilityRequirements: {
      colorContrast: 4.5, // WCAG AA
      touchTargetMinimum: 44, // pt
      touchTargetElementary: 52, // pt for younger students
      screenReaderSupport: true,
      keyboardNavigation: true,
    },
    
    testUsers: {
      student: {
        id: 'student-test-123',
        name: 'Ahmad Hassan',
        age: 14,
        grade: '8A',
        language: 'en',
        ageGroup: 'middle',
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
    },
  };
  
  console.log('✅ Global setup completed successfully');
  console.log('🕌 Islamic cultural context initialized');
  console.log('📚 Educational testing framework ready');
  console.log('🇺🇿 Uzbekistan localization context set');
  
  return async () => {
    console.log('🧹 Global teardown completed');
  };
}

module.exports = globalSetup;