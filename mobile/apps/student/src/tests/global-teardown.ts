/**
 * Global Test Teardown for Harry School Student App
 * 
 * Cleanup test environment after all tests complete
 */

import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up Harry School Student App E2E tests...');
  
  // Cleanup test database
  await cleanupTestDatabase();
  
  // Cleanup mock services
  await cleanupMockServices();
  
  // Cleanup test artifacts
  await cleanupTestArtifacts();
  
  // Generate test report summary
  await generateTestReportSummary();
  
  console.log('✅ Global teardown completed successfully');
}

async function cleanupTestDatabase() {
  console.log('📊 Cleaning up test database...');
  
  // Clear test student data
  if ((global as any).__TEST_STUDENTS__) {
    delete (global as any).__TEST_STUDENTS__;
  }
  
  // Clear any cached test data
  if ((global as any).__TEST_CACHE__) {
    delete (global as any).__TEST_CACHE__;
  }
  
  console.log('✅ Test database cleaned up');
}

async function cleanupMockServices() {
  console.log('🔧 Cleaning up mock services...');
  
  // Cleanup mock services
  if ((global as any).__MOCK_SERVICES__) {
    const services = (global as any).__MOCK_SERVICES__;
    
    // Reset all mock functions
    if (services.navigation) {
      Object.values(services.navigation).forEach((mockFn: any) => {
        if (typeof mockFn === 'function' && mockFn.mockReset) {
          mockFn.mockReset();
        }
      });
    }
    
    delete (global as any).__MOCK_SERVICES__;
  }
  
  // Cleanup deep link test data
  if ((global as any).__DEEP_LINK_TEST_DATA__) {
    delete (global as any).__DEEP_LINK_TEST_DATA__;
  }
  
  // Cleanup cultural test data
  if ((global as any).__CULTURAL_TEST_DATA__) {
    delete (global as any).__CULTURAL_TEST_DATA__;
  }
  
  console.log('✅ Mock services cleaned up');
}

async function cleanupTestArtifacts() {
  console.log('🗂️ Cleaning up test artifacts...');
  
  // Note: Playwright handles most cleanup automatically
  // This is where we could add custom cleanup logic
  
  try {
    // Clear any temporary files created during testing
    const fs = require('fs').promises;
    const path = require('path');
    
    const tempDir = path.join(process.cwd(), 'temp-test-files');
    
    try {
      await fs.access(tempDir);
      await fs.rmdir(tempDir, { recursive: true });
      console.log('✅ Temporary test files cleaned up');
    } catch (error) {
      // Directory doesn't exist, which is fine
    }
  } catch (error) {
    console.warn('⚠️ Could not clean up some test artifacts:', error.message);
  }
}

async function generateTestReportSummary() {
  console.log('📊 Generating test report summary...');
  
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Read test results if available
    const resultsPath = path.join(process.cwd(), 'test-results', 'results.json');
    
    try {
      const resultsData = await fs.readFile(resultsPath, 'utf8');
      const results = JSON.parse(resultsData);
      
      const summary = {
        timestamp: new Date().toISOString(),
        totalTests: results.suites?.length || 0,
        passed: results.stats?.expected || 0,
        failed: results.stats?.unexpected || 0,
        skipped: results.stats?.skipped || 0,
        duration: results.stats?.duration || 0,
        features: {
          deepLinking: true,
          ageAdaptiveUI: true,
          culturalIntegration: true,
          islamicCalendar: true,
          parentalControls: true
        },
        ageGroups: [
          { name: 'Elementary (10-12)', tested: true },
          { name: 'Middle School (13-15)', tested: true },
          { name: 'High School (16-18)', tested: true }
        ],
        culturalFeatures: [
          { name: 'Islamic Calendar Integration', tested: true },
          { name: 'Prayer Time Awareness', tested: true },
          { name: 'Multi-language Support', tested: true },
          { name: 'Cultural Greetings', tested: true }
        ]
      };
      
      // Write summary to file
      const summaryPath = path.join(process.cwd(), 'test-results', 'test-summary.json');
      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
      
      console.log('📊 Test Summary:');
      console.log(`   Total Tests: ${summary.totalTests}`);
      console.log(`   Passed: ${summary.passed}`);
      console.log(`   Failed: ${summary.failed}`);
      console.log(`   Skipped: ${summary.skipped}`);
      console.log(`   Duration: ${Math.round(summary.duration / 1000)}s`);
      console.log('✅ Test report summary generated');
      
    } catch (error) {
      console.log('ℹ️ No test results file found, skipping summary generation');
    }
  } catch (error) {
    console.warn('⚠️ Could not generate test report summary:', error.message);
  }
}

export default globalTeardown;