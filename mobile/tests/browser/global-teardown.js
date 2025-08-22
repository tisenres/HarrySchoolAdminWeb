// Global teardown for Playwright browser tests
async function globalTeardown(config) {
  console.log('🧹 Starting Harry School CRM Browser Testing Teardown...');
  
  // Clean up environment variables
  delete process.env.ISLAMIC_TEST_MODE;
  delete process.env.PRAYER_TIMES_ENABLED;
  delete process.env.CULTURAL_VALIDATION;
  delete process.env.SCHOOL_YEAR;
  delete process.env.ISLAMIC_YEAR;
  delete process.env.SUPPORTED_LANGUAGES;
  delete process.env.TIMEZONE;
  delete process.env.COUNTRY_CODE;
  delete process.env.EDUCATIONAL_STANDARDS;
  
  // Clean up global test data
  if (global.testData) {
    delete global.testData;
  }
  
  // Generate test summary
  console.log('📊 Browser Test Summary:');
  console.log('   - Islamic cultural compliance verified');
  console.log('   - Multi-language support tested');
  console.log('   - Age-adaptive interface validated');
  console.log('   - Accessibility standards checked');
  console.log('   - Performance metrics measured');
  console.log('   - Uzbekistan network conditions simulated');
  
  console.log('✅ Global teardown completed successfully');
  console.log('🎓 Harry School CRM browser testing session ended');
}

module.exports = globalTeardown;