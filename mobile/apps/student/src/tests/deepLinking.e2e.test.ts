/**
 * Deep Linking E2E Tests for Harry School Student App
 * 
 * Comprehensive test suite for age-appropriate deep linking functionality
 * Based on mobile architecture research and cultural integration requirements
 */

import { test, expect, Page } from '@playwright/test';

interface StudentTestContext {
  age: number;
  isAuthenticated: boolean;
  parentalSettings: {
    oversightRequired: boolean;
    familyNotifications: boolean;
    restrictedFeatures: string[];
    approvedTeachers: string[];
  };
}

class DeepLinkingTestSuite {
  private page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Test deep linking for different age groups
   */
  async testAgeGroupDeepLinking(context: StudentTestContext) {
    const { age, isAuthenticated, parentalSettings } = context;
    
    // Test basic navigation
    await this.testBasicNavigation(age);
    
    // Test age-specific restrictions
    await this.testAgeRestrictions(age);
    
    // Test authentication requirements
    await this.testAuthenticationFlow(isAuthenticated);
    
    // Test parental oversight
    if (age <= 12) {
      await this.testParentalOversight(parentalSettings);
    }
    
    // Test cultural integration
    await this.testCulturalIntegration();
  }

  /**
   * Test basic navigation deep links
   */
  private async testBasicNavigation(age: number) {
    const basicRoutes = [
      { url: 'harryschool://home', expectedScreen: 'Home' },
      { url: 'harryschool://schedule/month', expectedScreen: 'Schedule' },
      { url: 'harryschool://vocabulary', expectedScreen: 'Vocabulary' }
    ];

    for (const route of basicRoutes) {
      await test.step(`Navigate to ${route.url}`, async () => {
        // Simulate deep link
        await this.simulateDeepLink(route.url);
        
        // Verify navigation
        await expect(this.page.locator(`[data-testid="${route.expectedScreen.toLowerCase()}-screen"]`))
          .toBeVisible({ timeout: 5000 });
        
        // Verify age-appropriate layout
        await this.verifyAgeAppropriateLayout(age);
      });
    }
  }

  /**
   * Test age-specific access restrictions
   */
  private async testAgeRestrictions(age: number) {
    const restrictedRoutes = [
      { url: 'harryschool://settings/privacy', minAge: 13 },
      { url: 'harryschool://settings/payments', minAge: 15 },
      { url: 'harryschool://settings/advanced', minAge: 16 }
    ];

    for (const route of restrictedRoutes) {
      await test.step(`Test age restriction for ${route.url}`, async () => {
        await this.simulateDeepLink(route.url);
        
        if (age < route.minAge) {
          // Should show age restriction dialog
          await expect(this.page.locator('[data-testid="age-restriction-dialog"]'))
            .toBeVisible({ timeout: 3000 });
          
          // Verify age-appropriate message
          const message = await this.page.locator('[data-testid="restriction-message"]').textContent();
          expect(message).toContain(this.getAgeAppropriateMessage(age));
        } else {
          // Should navigate successfully
          await expect(this.page.locator('[data-testid="settings-screen"]'))
            .toBeVisible({ timeout: 5000 });
        }
      });
    }
  }

  /**
   * Test authentication flow
   */
  private async testAuthenticationFlow(isAuthenticated: boolean) {
    const protectedRoutes = [
      'harryschool://profile/overview',
      'harryschool://schedule/month',
      'harryschool://request/lesson/create'
    ];

    for (const url of protectedRoutes) {
      await test.step(`Test authentication for ${url}`, async () => {
        // Clear authentication state
        if (!isAuthenticated) {
          await this.clearAuthentication();
        }
        
        await this.simulateDeepLink(url);
        
        if (!isAuthenticated) {
          // Should redirect to login
          await expect(this.page.locator('[data-testid="login-screen"]'))
            .toBeVisible({ timeout: 5000 });
        } else {
          // Should navigate to protected route
          await expect(this.page.locator('[data-testid*="screen"]'))
            .toBeVisible({ timeout: 5000 });
        }
      });
    }
  }

  /**
   * Test parental oversight requirements
   */
  private async testParentalOversight(parentalSettings: any) {
    const oversightRequiredRoutes = [
      'harryschool://profile/settings',
      'harryschool://settings/privacy'
    ];

    for (const url of oversightRequiredRoutes) {
      await test.step(`Test parental oversight for ${url}`, async () => {
        await this.simulateDeepLink(url);
        
        if (parentalSettings.oversightRequired) {
          // Should show parental supervision dialog
          await expect(this.page.locator('[data-testid="parental-supervision-dialog"]'))
            .toBeVisible({ timeout: 3000 });
          
          // Test asking for parent help
          await this.page.click('[data-testid="ask-parent-btn"]');
          
          if (parentalSettings.familyNotifications) {
            await expect(this.page.locator('[data-testid="parent-notified-message"]'))
              .toBeVisible();
          } else {
            await expect(this.page.locator('[data-testid="ask-parent-guidance"]'))
              .toBeVisible();
          }
        }
      });
    }
  }

  /**
   * Test cultural integration features
   */
  private async testCulturalIntegration() {
    await test.step('Test Islamic calendar integration', async () => {
      await this.simulateDeepLink('harryschool://schedule/month');
      
      // Test Islamic calendar toggle
      await this.page.click('[data-testid="islamic-calendar-toggle"]');
      await expect(this.page.locator('[data-testid="islamic-date-display"]'))
        .toBeVisible();
      
      // Test prayer time markers
      const prayerMarkers = this.page.locator('[data-testid="prayer-time-marker"]');
      await expect(prayerMarkers).toHaveCount(5); // Five daily prayers
    });

    await test.step('Test cultural greetings', async () => {
      await this.simulateDeepLink('harryschool://profile/overview');
      
      // Test Islamic greeting
      const greeting = await this.page.locator('[data-testid="cultural-greeting"]').textContent();
      expect(greeting).toMatch(/(Assalamu alaykum|Ahlan wa sahlan|Masa'a alkhayr)/);
    });
  }

  /**
   * Test deep link URL parsing and validation
   */
  async testUrlParsing() {
    const testCases = [
      {
        url: 'harryschool://schedule/week/2024-03-15',
        expectedParams: { view: 'week', date: '2024-03-15' }
      },
      {
        url: 'harryschool://class/math-101/attendance',
        expectedParams: { classId: 'math-101', action: 'attendance' }
      },
      {
        url: 'harryschool://profile/achievements',
        expectedParams: { section: 'achievements' }
      },
      {
        url: 'harryschool://request/lesson/create',
        expectedParams: { type: 'lesson', action: 'create' }
      }
    ];

    for (const testCase of testCases) {
      await test.step(`Parse URL: ${testCase.url}`, async () => {
        await this.simulateDeepLink(testCase.url);
        
        // Verify parameters are correctly parsed and passed
        const pageParams = await this.page.evaluate(() => {
          // Access route params from React Navigation
          return window.__REACT_NAVIGATION_PARAMS__;
        });
        
        expect(pageParams).toMatchObject(testCase.expectedParams);
      });
    }
  }

  /**
   * Test security validation
   */
  async testSecurityValidation() {
    const maliciousUrls = [
      'javascript:alert("xss")',
      'harryschool://../../etc/passwd',
      'https://malicious-site.com/harryschool/',
      'harryschool://../admin/delete-all'
    ];

    for (const url of maliciousUrls) {
      await test.step(`Test security for malicious URL: ${url}`, async () => {
        await this.simulateDeepLink(url);
        
        // Should not navigate anywhere dangerous
        await expect(this.page.locator('[data-testid="security-error"]'))
          .toBeVisible({ timeout: 3000 });
      });
    }
  }

  /**
   * Test offline deep linking
   */
  async testOfflineDeepLinking() {
    await test.step('Test deep linking while offline', async () => {
      // Simulate offline condition
      await this.page.context().setOffline(true);
      
      await this.simulateDeepLink('harryschool://schedule/month');
      
      // Should show offline message but preserve the deep link
      await expect(this.page.locator('[data-testid="offline-banner"]'))
        .toBeVisible();
      
      // When back online, should navigate to the deep linked screen
      await this.page.context().setOffline(false);
      await this.page.reload();
      
      await expect(this.page.locator('[data-testid="schedule-screen"]'))
        .toBeVisible({ timeout: 10000 });
    });
  }

  /**
   * Helper methods
   */
  private async simulateDeepLink(url: string) {
    // Simulate deep link by calling the deep linking service
    await this.page.evaluate((deepLinkUrl) => {
      // Access the deep linking service
      if (window.__DEEP_LINK_SERVICE__) {
        window.__DEEP_LINK_SERVICE__.handleDeepLink(deepLinkUrl);
      }
    }, url);
    
    // Wait for navigation to complete
    await this.page.waitForTimeout(1000);
  }

  private async verifyAgeAppropriateLayout(age: number) {
    if (age <= 12) {
      // Elementary: Large touch targets
      const touchTargets = this.page.locator('[role="button"], [data-testid*="button"]');
      const count = await touchTargets.count();
      
      for (let i = 0; i < Math.min(5, count); i++) {
        const element = touchTargets.nth(i);
        const box = await element.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(52);
          expect(box.height).toBeGreaterThanOrEqual(52);
        }
      }
    }
  }

  private getAgeAppropriateMessage(age: number): string {
    if (age <= 12) {
      return 'You need permission to access this';
    } else if (age <= 15) {
      return 'help manage this setting for your safety';
    } else {
      return 'not available for your age';
    }
  }

  private async clearAuthentication() {
    await this.page.evaluate(() => {
      // Clear authentication tokens
      localStorage.removeItem('authToken');
      sessionStorage.clear();
    });
  }
}

// Test cases for different age groups
test.describe('Deep Linking - Elementary Students (10-12)', () => {
  const elementaryContext: StudentTestContext = {
    age: 11,
    isAuthenticated: true,
    parentalSettings: {
      oversightRequired: true,
      familyNotifications: true,
      restrictedFeatures: ['privacy', 'payments'],
      approvedTeachers: ['teacher-1', 'teacher-2']
    }
  };

  test('should handle deep links with parental oversight', async ({ page }) => {
    const testSuite = new DeepLinkingTestSuite(page);
    await testSuite.testAgeGroupDeepLinking(elementaryContext);
  });

  test('should show age-appropriate restrictions', async ({ page }) => {
    const testSuite = new DeepLinkingTestSuite(page);
    await testSuite.testAgeRestrictions(elementaryContext.age);
  });
});

test.describe('Deep Linking - Middle School Students (13-15)', () => {
  const middleSchoolContext: StudentTestContext = {
    age: 14,
    isAuthenticated: true,
    parentalSettings: {
      oversightRequired: false,
      familyNotifications: true,
      restrictedFeatures: ['payments'],
      approvedTeachers: []
    }
  };

  test('should handle deep links with guided access', async ({ page }) => {
    const testSuite = new DeepLinkingTestSuite(page);
    await testSuite.testAgeGroupDeepLinking(middleSchoolContext);
  });

  test('should provide educational guidance for restrictions', async ({ page }) => {
    const testSuite = new DeepLinkingTestSuite(page);
    await testSuite.testAgeRestrictions(middleSchoolContext.age);
  });
});

test.describe('Deep Linking - High School Students (16-18)', () => {
  const highSchoolContext: StudentTestContext = {
    age: 17,
    isAuthenticated: true,
    parentalSettings: {
      oversightRequired: false,
      familyNotifications: false,
      restrictedFeatures: [],
      approvedTeachers: []
    }
  };

  test('should handle deep links with full access', async ({ page }) => {
    const testSuite = new DeepLinkingTestSuite(page);
    await testSuite.testAgeGroupDeepLinking(highSchoolContext);
  });

  test('should provide advanced features access', async ({ page }) => {
    const testSuite = new DeepLinkingTestSuite(page);
    await testSuite.testAgeRestrictions(highSchoolContext.age);
  });
});

test.describe('Deep Linking - Security & Validation', () => {
  test('should parse URLs correctly', async ({ page }) => {
    const testSuite = new DeepLinkingTestSuite(page);
    await testSuite.testUrlParsing();
  });

  test('should validate security threats', async ({ page }) => {
    const testSuite = new DeepLinkingTestSuite(page);
    await testSuite.testSecurityValidation();
  });

  test('should handle offline scenarios', async ({ page }) => {
    const testSuite = new DeepLinkingTestSuite(page);
    await testSuite.testOfflineDeepLinking();
  });
});

test.describe('Deep Linking - Cultural Integration', () => {
  test('should integrate Islamic calendar features', async ({ page }) => {
    const testSuite = new DeepLinkingTestSuite(page);
    await testSuite.testCulturalIntegration();
  });

  test('should handle multi-language navigation', async ({ page }) => {
    const testSuite = new DeepLinkingTestSuite(page);
    
    const languages = ['en', 'ru', 'uz'];
    for (const lang of languages) {
      await test.step(`Test navigation in ${lang}`, async () => {
        // Set language preference
        await page.evaluate((language) => {
          localStorage.setItem('preferredLanguage', language);
        }, lang);
        
        await testSuite.simulateDeepLink('harryschool://profile/overview');
        
        // Verify language-appropriate content
        const greeting = await page.locator('[data-testid="cultural-greeting"]').textContent();
        expect(greeting).toBeTruthy();
      });
    }
  });
});