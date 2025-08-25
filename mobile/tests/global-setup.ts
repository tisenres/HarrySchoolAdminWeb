/**
 * Global setup for Playwright tests
 * Initializes test environment and data
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for real-time system tests...');

  try {
    // Launch browser for setup
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Setup test database and user data
    console.log('📊 Setting up test data...');
    
    // You would typically set up test data here
    // For now, we'll just verify the test environment
    await page.goto('http://localhost:3000/health');
    
    const isHealthy = await page.locator('text=OK').isVisible().catch(() => false);
    if (!isHealthy) {
      console.warn('⚠️ Health check failed, but continuing with tests...');
    }

    // Initialize test user and organization
    const testData = {
      user: {
        id: 'test-user-123',
        name: 'Test User',
        email: 'test@harryschool.com',
        role: 'student',
        organization_id: 'test-org-456',
        cultural_settings: {
          respectPrayerTimes: true,
          showIslamicGreetings: true,
          preferredLanguage: 'en',
          celebration_animations: true,
        },
      },
      organization: {
        id: 'test-org-456',
        name: 'Test Harry School',
        settings: {
          timezone: 'Asia/Tashkent',
          language: 'en',
          islamic_calendar: true,
        },
      },
    };

    // Store test data in browser storage for tests to use
    await page.addInitScript((data) => {
      window.testData = data;
      window.testMode = true;
      
      // Mock external services
      window.mockSupabase = {
        isConnected: true,
        subscriptions: [],
      };
      
      // Mock notification service
      window.mockNotifications = [];
      
      // Mock animation events
      window.mockAnimationEvents = [];
      
      console.log('✅ Test environment initialized');
    }, testData);

    await browser.close();
    
    console.log('✅ Global setup completed successfully');
    
    // Set environment variables for tests
    process.env.TEST_USER_ID = testData.user.id;
    process.env.TEST_ORG_ID = testData.organization.id;
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

export default globalSetup;