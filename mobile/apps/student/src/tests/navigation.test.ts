/**
 * Navigation Flow Tests for Harry School Student App
 * 
 * Comprehensive test suite for navigation patterns and user flows
 * Tests age-appropriate navigation and accessibility features
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration for different student age groups
const AGE_GROUPS = {
  ELEMENTARY: '10-12',
  MIDDLE: '13-15',
  HIGH: '16-18',
} as const;

const STUDENT_PROFILES = {
  elementary: {
    id: 'student_elem_001',
    name: 'Emily Johnson',
    ageGroup: AGE_GROUPS.ELEMENTARY,
    grade: '5th Grade',
    preferences: {
      language: 'en' as const,
      theme: 'light' as const,
      accessibility: {
        largeText: true,
        highContrast: false,
        reducedMotion: false,
      },
    },
  },
  secondary: {
    id: 'student_sec_001', 
    name: 'Alex Rodriguez',
    ageGroup: AGE_GROUPS.HIGH,
    grade: '11th Grade',
    preferences: {
      language: 'en' as const,
      theme: 'dark' as const,
      accessibility: {
        largeText: false,
        highContrast: false,
        reducedMotion: false,
      },
    },
  },
};

// Helper function to simulate app launch with different user profiles
async function launchAppWithProfile(page: Page, profileType: keyof typeof STUDENT_PROFILES) {
  const profile = STUDENT_PROFILES[profileType];
  
  await page.goto('/');
  
  // Wait for app to initialize
  await page.waitForLoadState('networkidle');
  
  // Set profile data in local storage
  await page.evaluate((profile) => {
    localStorage.setItem('student_profile', JSON.stringify(profile));
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('auth_token', JSON.stringify({
      token: 'mock_token_123',
      userId: profile.id,
      role: 'student',
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    }));
  }, profile);
  
  // Reload to apply profile
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  return profile;
}

// Navigation flow tests
test.describe('Navigation Flows - Elementary Students (10-12)', () => {
  test('should render age-appropriate tab bar with larger touch targets', async ({ page }) => {
    const profile = await launchAppWithProfile(page, 'elementary');
    
    // Verify main tabs are visible
    const tabs = ['Home', 'Lessons', 'Schedule', 'Words', 'Profile'];
    
    for (const tabName of tabs) {
      const tab = page.locator(`[data-testid="tab-${tabName.toLowerCase()}"]`);
      await expect(tab).toBeVisible();
      
      // Check touch target size for younger students (should be larger)
      const boundingBox = await tab.boundingBox();
      expect(boundingBox?.height).toBeGreaterThanOrEqual(56); // Minimum 56pt for elementary
    }
  });

  test('should navigate through all main tabs', async ({ page }) => {
    await launchAppWithProfile(page, 'elementary');
    
    const tabFlow = [
      { tab: 'Home', expectedTitle: 'Student Dashboard' },
      { tab: 'Lessons', expectedTitle: 'My Courses' },
      { tab: 'Schedule', expectedTitle: 'My Schedule' },
      { tab: 'Words', expectedTitle: 'Vocabulary Lists' },
      { tab: 'Profile', expectedTitle: 'My Profile' },
    ];
    
    for (const { tab, expectedTitle } of tabFlow) {
      await page.click(`[data-testid="tab-${tab.toLowerCase()}"]`);
      await page.waitForTimeout(500); // Allow for animation
      
      // Verify we're on the correct screen
      await expect(page.locator('text=' + expectedTitle)).toBeVisible();
    }
  });

  test('should display development badges on placeholder screens', async ({ page }) => {
    await launchAppWithProfile(page, 'elementary');
    
    // Navigate to lessons and verify placeholder
    await page.click('[data-testid="tab-lessons"]');
    await expect(page.locator('text=IN DEVELOPMENT')).toBeVisible();
    
    // Verify placeholder content
    await expect(page.locator('text=My Courses')).toBeVisible();
    await expect(page.locator('text=Planned Features:')).toBeVisible();
  });
});

test.describe('Navigation Flows - Secondary Students (13-18)', () => {
  test('should render standard tab bar with appropriate sizing', async ({ page }) => {
    const profile = await launchAppWithProfile(page, 'secondary');
    
    const tabs = ['Home', 'Lessons', 'Schedule', 'Words', 'Profile'];
    
    for (const tabName of tabs) {
      const tab = page.locator(`[data-testid="tab-${tabName.toLowerCase()}"]`);
      await expect(tab).toBeVisible();
      
      // Check touch target size for older students (should be standard)
      const boundingBox = await tab.boundingBox();
      expect(boundingBox?.height).toBeGreaterThanOrEqual(48); // Standard 48pt for secondary
      expect(boundingBox?.height).toBeLessThan(60); // But not as large as elementary
    }
  });

  test('should support dark theme preferences', async ({ page }) => {
    const profile = await launchAppWithProfile(page, 'secondary');
    
    // Verify dark theme is applied (secondary student has dark theme preference)
    const backgroundColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    
    // Should be a dark color (not white)
    expect(backgroundColor).not.toBe('rgb(255, 255, 255)');
  });
});

test.describe('Deep Navigation Flows', () => {
  test('should navigate deep into lesson stack', async ({ page }) => {
    await launchAppWithProfile(page, 'elementary');
    
    // Start from home
    await page.click('[data-testid="tab-home"]');
    await expect(page.locator('text=Student Dashboard')).toBeVisible();
    
    // Navigate to lessons
    await page.click('[data-testid="tab-lessons"]');
    await expect(page.locator('text=My Courses')).toBeVisible();
    
    // TODO: When actual screens are implemented, test deep navigation
    // For now, verify the placeholder back button works
    await page.click('text=← Go Back');
    await expect(page.locator('text=My Courses')).toBeVisible();
  });

  test('should handle tab switching during navigation', async ({ page }) => {
    await launchAppWithProfile(page, 'secondary');
    
    // Navigate through multiple tabs quickly
    const quickTabFlow = ['lessons', 'schedule', 'vocabulary', 'profile', 'home'];
    
    for (const tab of quickTabFlow) {
      await page.click(`[data-testid="tab-${tab}"]`);
      await page.waitForTimeout(200); // Quick succession
    }
    
    // Should end up on Home tab
    await expect(page.locator('text=Student Dashboard')).toBeVisible();
  });
});

test.describe('Accessibility Tests', () => {
  test('should support keyboard navigation', async ({ page }) => {
    await launchAppWithProfile(page, 'elementary');
    
    // Test tab key navigation through tabs
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verify focused element is a tab
    const focusedElement = await page.locator(':focus');
    const testId = await focusedElement.getAttribute('data-testid');
    expect(testId).toContain('tab-');
  });

  test('should have proper accessibility labels', async ({ page }) => {
    await launchAppWithProfile(page, 'elementary');
    
    // Verify tab accessibility labels
    const homeTab = page.locator('[data-testid="tab-home"]');
    const ariaLabel = await homeTab.getAttribute('aria-label');
    expect(ariaLabel).toContain('Home screen');
    
    const lessonsTab = page.locator('[data-testid="tab-lessons"]');
    const lessonsAriaLabel = await lessonsTab.getAttribute('aria-label');
    expect(lessonsAriaLabel).toContain('Lessons screen');
  });

  test('should support screen reader announcements', async ({ page }) => {
    await launchAppWithProfile(page, 'secondary');
    
    // Test ARIA live regions for navigation updates
    await page.click('[data-testid="tab-lessons"]');
    
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeVisible();
  });
});

test.describe('Performance Tests', () => {
  test('should load navigation within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await launchAppWithProfile(page, 'elementary');
    
    // Verify all tabs are rendered within reasonable time
    await expect(page.locator('[data-testid="tab-home"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-lessons"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-schedule"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-vocabulary"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-profile"]')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
  });

  test('should handle rapid tab switching without performance issues', async ({ page }) => {
    await launchAppWithProfile(page, 'secondary');
    
    const startTime = Date.now();
    
    // Rapid tab switching test
    for (let i = 0; i < 10; i++) {
      const tabs = ['home', 'lessons', 'schedule', 'vocabulary', 'profile'];
      const randomTab = tabs[Math.floor(Math.random() * tabs.length)];
      await page.click(`[data-testid="tab-${randomTab}"]`);
      await page.waitForTimeout(50); // Very fast switching
    }
    
    const totalTime = Date.now() - startTime;
    expect(totalTime).toBeLessThan(2000); // Should handle rapid switching smoothly
  });
});

test.describe('Offline Navigation', () => {
  test('should handle offline navigation gracefully', async ({ page }) => {
    await launchAppWithProfile(page, 'elementary');
    
    // Simulate offline state
    await page.context().setOffline(true);
    
    // Tab navigation should still work offline
    await page.click('[data-testid="tab-lessons"]');
    await expect(page.locator('text=My Courses')).toBeVisible();
    
    // Should show offline indicator (when implemented)
    // await expect(page.locator('text=Offline')).toBeVisible();
    
    // Restore online state
    await page.context().setOffline(false);
  });
});

test.describe('Error Handling', () => {
  test('should handle navigation errors gracefully', async ({ page }) => {
    await launchAppWithProfile(page, 'elementary');
    
    // Test error boundary by causing an error (when error boundaries are implemented)
    // For now, test that basic navigation doesn't crash
    
    const tabs = ['home', 'lessons', 'schedule', 'vocabulary', 'profile'];
    
    for (const tab of tabs) {
      await page.click(`[data-testid="tab-${tab}"]`);
      
      // Verify no error states are visible
      await expect(page.locator('text=Something went wrong')).not.toBeVisible();
      await expect(page.locator('text=Error')).not.toBeVisible();
    }
  });
});