/**
 * Navigation Test Helpers
 * Harry School Student App
 * 
 * Utility functions for testing navigation flows with age-appropriate adaptations
 */

import { Page, expect } from '@playwright/test';
import { StudentAgeGroup } from '../../navigation/types';

export interface StudentTestProfile {
  id: string;
  name: string;
  age: number;
  ageGroup: StudentAgeGroup;
  language: 'en' | 'ru' | 'uz';
  theme: 'light' | 'dark';
  gamificationEnabled: boolean;
}

export const TEST_STUDENTS: Record<string, StudentTestProfile> = {
  elementary: {
    id: 'student_elem_001',
    name: 'Alex Elementary',
    age: 10,
    ageGroup: '10-12',
    language: 'en',
    theme: 'light',
    gamificationEnabled: true,
  },
  middle: {
    id: 'student_mid_001',
    name: 'Sam Middle',
    age: 14,
    ageGroup: '13-15',
    language: 'ru',
    theme: 'light',
    gamificationEnabled: true,
  },
  secondary: {
    id: 'student_sec_001',
    name: 'Jordan Secondary',
    age: 17,
    ageGroup: '16-18',
    language: 'en',
    theme: 'dark',
    gamificationEnabled: false,
  },
};

/**
 * Navigate to the student app and wait for initial load
 */
export async function navigateToStudentApp(page: Page, baseUrl: string = 'exp://127.0.0.1:8081'): Promise<void> {
  await page.goto(baseUrl);
  
  // Wait for app to initialize
  await page.waitForSelector('[data-testid="student-app-root"]', { timeout: 10000 });
  
  // Wait for navigation to be ready
  await page.waitForFunction(() => {
    return window.navigation && window.navigation.ready;
  }, { timeout: 5000 });
}

/**
 * Simulate student authentication with age-specific profile
 */
export async function authenticateStudent(page: Page, profile: StudentTestProfile): Promise<void> {
  // Navigate to auth screen if not already there
  const isAuthScreen = await page.locator('[data-testid="auth-screen"]').isVisible();
  if (!isAuthScreen) {
    await page.goto('/auth');
  }

  // Fill authentication form
  await page.fill('[data-testid="student-id-input"]', profile.id);
  await page.fill('[data-testid="student-name-input"]', profile.name);
  
  // Select age group
  await page.selectOption('[data-testid="age-group-select"]', profile.ageGroup);
  
  // Select language
  await page.selectOption('[data-testid="language-select"]', profile.language);
  
  // Submit authentication
  await page.click('[data-testid="auth-submit-button"]');
  
  // Wait for authentication success and navigation
  await page.waitForSelector('[data-testid="main-tab-navigator"]', { timeout: 8000 });
  
  // Verify student profile is loaded
  await expect(page.locator('[data-testid="student-profile-name"]')).toContainText(profile.name);
}

/**
 * Get age-appropriate expectations for tab bar elements
 */
export function getAgeAppropriateExpectations(ageGroup: StudentAgeGroup) {
  switch (ageGroup) {
    case '10-12':
      return {
        iconSize: { min: 26, max: 30 }, // 28pt expected
        touchTargetSize: { min: 54, max: 58 }, // 56pt expected
        fontSize: { min: 11, max: 13 }, // 12pt expected
        labelsVisible: true,
        celebrationEnabled: true,
        progressRingsEnabled: true,
      };
    case '13-15':
      return {
        iconSize: { min: 22, max: 26 }, // 24pt expected
        touchTargetSize: { min: 46, max: 50 }, // 48pt expected
        fontSize: { min: 9, max: 11 }, // 10pt expected
        labelsVisible: true,
        celebrationEnabled: true,
        progressRingsEnabled: true,
      };
    case '16-18':
      return {
        iconSize: { min: 22, max: 26 }, // 24pt expected
        touchTargetSize: { min: 46, max: 50 }, // 48pt expected
        fontSize: { min: 9, max: 11 }, // 10pt expected
        labelsVisible: 'contextual', // May be hidden in minimal variant
        celebrationEnabled: false,
        progressRingsEnabled: true,
      };
  }
}

/**
 * Test tab navigation with age-appropriate expectations
 */
export async function testTabNavigation(page: Page, profile: StudentTestProfile): Promise<void> {
  const expectations = getAgeAppropriateExpectations(profile.ageGroup);
  
  const tabs = ['home', 'lessons', 'schedule', 'vocabulary', 'profile'];
  
  for (const tabId of tabs) {
    // Click tab
    const tabSelector = `[data-testid="tab-${tabId}"]`;
    await page.click(tabSelector);
    
    // Wait for tab to become active
    await page.waitForFunction(
      (id) => document.querySelector(`[data-testid="tab-${id}"]`)?.classList.contains('active'),
      tabId,
      { timeout: 2000 }
    );
    
    // Verify active state
    await expect(page.locator(`${tabSelector}.active`)).toBeVisible();
    
    // Check age-appropriate styling
    const iconElement = page.locator(`${tabSelector} [data-testid="tab-icon"]`);
    const iconBox = await iconElement.boundingBox();
    
    if (iconBox) {
      expect(iconBox.width).toBeGreaterThanOrEqual(expectations.iconSize.min);
      expect(iconBox.width).toBeLessThanOrEqual(expectations.iconSize.max);
    }
    
    // Check touch target size
    const tabBox = await page.locator(tabSelector).boundingBox();
    if (tabBox) {
      expect(Math.min(tabBox.width, tabBox.height)).toBeGreaterThanOrEqual(expectations.touchTargetSize.min);
    }
    
    // Verify screen content loads
    await page.waitForSelector(`[data-testid="${tabId}-screen"]`, { timeout: 3000 });
    
    // Small delay between tab switches
    await page.waitForTimeout(200);
  }
}

/**
 * Test accessibility features
 */
export async function testAccessibility(page: Page): Promise<void> {
  // Test keyboard navigation
  await page.keyboard.press('Tab');
  const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
  expect(focusedElement).toContain('tab-');
  
  // Test screen reader labels
  const tabs = await page.locator('[role="tab"]').all();
  for (const tab of tabs) {
    const ariaLabel = await tab.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel!.length).toBeGreaterThan(0);
  }
  
  // Test WCAG contrast ratios (simplified check)
  const activeTab = page.locator('[role="tab"][aria-selected="true"]');
  const styles = await activeTab.evaluate((el) => {
    const computed = getComputedStyle(el);
    return {
      color: computed.color,
      backgroundColor: computed.backgroundColor,
    };
  });
  
  // Basic contrast check (simplified)
  expect(styles.color).not.toBe(styles.backgroundColor);
}

/**
 * Test offline functionality
 */
export async function testOfflineMode(page: Page): Promise<void> {
  // Simulate offline state
  await page.context().setOffline(true);
  
  // Wait for offline indicator
  await page.waitForSelector('[data-testid="offline-banner"]', { timeout: 3000 });
  
  // Test offline-capable tabs (home, lessons, vocabulary, profile)
  const offlineTabs = ['home', 'lessons', 'vocabulary', 'profile'];
  
  for (const tabId of offlineTabs) {
    await page.click(`[data-testid="tab-${tabId}"]`);
    
    // Verify tab is accessible
    await expect(page.locator(`[data-testid="tab-${tabId}"]`)).not.toHaveClass(/disabled/);
    
    // Verify screen loads offline content
    await page.waitForSelector(`[data-testid="${tabId}-screen"]`, { timeout: 2000 });
  }
  
  // Test online-only tab (schedule)
  const scheduleTab = page.locator('[data-testid="tab-schedule"]');
  
  // Should show offline indicator
  await expect(scheduleTab.locator('[data-testid="offline-indicator"]')).toBeVisible();
  
  // Should still be clickable but show offline message
  await page.click('[data-testid="tab-schedule"]');
  await page.waitForSelector('[data-testid="offline-message"]', { timeout: 2000 });
  
  // Restore online state
  await page.context().setOffline(false);
  await page.waitForSelector('[data-testid="offline-banner"]', { state: 'hidden', timeout: 3000 });
}

/**
 * Test gamification features
 */
export async function testGamification(page: Page, profile: StudentTestProfile): Promise<void> {
  if (!profile.gamificationEnabled) {
    // Verify gamification elements are not present
    await expect(page.locator('[data-testid="progress-ring"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="streak-indicator"]')).not.toBeVisible();
    return;
  }
  
  // Test progress rings
  const tabsWithProgress = ['home', 'lessons', 'vocabulary'];
  
  for (const tabId of tabsWithProgress) {
    const progressRing = page.locator(`[data-testid="tab-${tabId}"] [data-testid="progress-ring"]`);
    if (await progressRing.isVisible()) {
      // Verify progress ring has valid progress value
      const progressValue = await progressRing.getAttribute('data-progress');
      if (progressValue) {
        const progress = parseInt(progressValue);
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(100);
      }
    }
  }
  
  // Test streak indicators
  const homeTab = page.locator('[data-testid="tab-home"]');
  const streakIndicator = homeTab.locator('[data-testid="streak-indicator"]');
  
  if (await streakIndicator.isVisible()) {
    const streakCount = await streakIndicator.getAttribute('data-streak');
    if (streakCount) {
      expect(parseInt(streakCount)).toBeGreaterThan(0);
    }
  }
  
  // Test achievement celebrations (if any are active)
  const achievementCelebration = page.locator('[data-testid="achievement-celebration"]');
  if (await achievementCelebration.isVisible()) {
    // Verify celebration animation completes
    await page.waitForSelector('[data-testid="achievement-celebration"]', { 
      state: 'hidden', 
      timeout: 2000 
    });
  }
}

/**
 * Test performance metrics
 */
export async function testPerformance(page: Page): Promise<void> {
  // Measure tab switching performance
  const performanceEntries: number[] = [];
  
  const tabs = ['home', 'lessons', 'schedule', 'vocabulary', 'profile'];
  
  for (const tabId of tabs) {
    const startTime = Date.now();
    
    await page.click(`[data-testid="tab-${tabId}"]`);
    await page.waitForSelector(`[data-testid="${tabId}-screen"]`);
    
    const endTime = Date.now();
    const switchTime = endTime - startTime;
    performanceEntries.push(switchTime);
    
    // Each tab switch should be under 300ms
    expect(switchTime).toBeLessThan(300);
  }
  
  // Average performance should be under 200ms
  const averageTime = performanceEntries.reduce((a, b) => a + b, 0) / performanceEntries.length;
  expect(averageTime).toBeLessThan(200);
  
  console.log(`Average tab switch time: ${averageTime.toFixed(2)}ms`);
}

/**
 * Test multilingual support
 */
export async function testMultilingual(page: Page, language: 'en' | 'ru' | 'uz'): Promise<void> {
  // Change language setting
  await page.goto('/settings/language');
  await page.selectOption('[data-testid="language-select"]', language);
  await page.click('[data-testid="save-language-button"]');
  
  // Navigate back to main app
  await page.goto('/');
  await page.waitForSelector('[data-testid="main-tab-navigator"]');
  
  // Verify tab labels are in selected language
  const tabs = await page.locator('[role="tab"]').all();
  
  for (const tab of tabs) {
    const tabText = await tab.textContent();
    if (tabText) {
      // Basic check that text is not empty and contains appropriate characters
      expect(tabText.length).toBeGreaterThan(0);
      
      if (language === 'ru') {
        // Should contain Cyrillic characters for Russian
        expect(/[а-яё]/i.test(tabText)).toBeTruthy();
      } else if (language === 'uz') {
        // Should use Latin script for Uzbek
        expect(/[a-z]/i.test(tabText)).toBeTruthy();
      } else {
        // English should use Latin script
        expect(/[a-z]/i.test(tabText)).toBeTruthy();
      }
    }
  }
}

/**
 * Test error handling and recovery
 */
export async function testErrorHandling(page: Page): Promise<void> {
  // Simulate network error during navigation
  await page.route('**/api/**', (route) => {
    route.abort('failed');
  });
  
  // Try to navigate to schedule (requires network)
  await page.click('[data-testid="tab-schedule"]');
  
  // Should show error message
  await page.waitForSelector('[data-testid="network-error-message"]', { timeout: 3000 });
  
  // Test retry functionality
  await page.unroute('**/api/**');
  await page.click('[data-testid="retry-button"]');
  
  // Should successfully load after retry
  await page.waitForSelector('[data-testid="schedule-screen"]', { timeout: 5000 });
}

/**
 * Cleanup function for test teardown
 */
export async function cleanupTest(page: Page): Promise<void> {
  // Clear any stored authentication
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // Reset network conditions
  await page.context().setOffline(false);
  
  // Clear any routes
  await page.unrouteAll();
}