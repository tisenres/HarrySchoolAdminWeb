/**
 * Test Helper Utilities for Real-time System Testing
 * 
 * Provides common functions and utilities for testing the real-time system
 * with cultural sensitivity and Islamic values integration.
 */

import { Page, expect, Locator } from '@playwright/test';

export interface TestUser {
  id: string;
  name: string;
  role: 'student' | 'teacher';
  organizationId: string;
  culturalSettings: {
    respectPrayerTimes: boolean;
    showIslamicGreetings: boolean;
    preferredLanguage: 'en' | 'uz' | 'ru' | 'ar';
    celebration_animations: boolean;
  };
}

export interface TestNotification {
  id?: string;
  type: 'celebration' | 'ranking' | 'prayer' | 'task' | 'attendance' | 'system';
  title: string;
  message: string;
  culturalContext?: {
    islamic_content?: boolean;
    prayer_time_sensitive?: boolean;
    arabic_text?: string;
    greeting_type?: string;
  };
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface TestAnimation {
  type: 'celebration' | 'notification' | 'ranking' | 'prayer' | 'attendance' | 'task_complete';
  intensity: 'low' | 'medium' | 'high' | 'celebration';
  culturalContext?: any;
  duration?: number;
}

/**
 * Real-time Connection Helpers
 */
export class RealtimeTestHelpers {
  constructor(private page: Page) {}

  async waitForWebSocketConnection(timeout = 10000): Promise<void> {
    await this.page.waitForFunction(
      () => window.realtimeConnectionStatus === 'connected',
      { timeout }
    );
  }

  async disconnectWebSocket(): Promise<void> {
    await this.page.evaluate(() => {
      window.realtimeService?.disconnect();
    });
  }

  async reconnectWebSocket(): Promise<void> {
    await this.page.evaluate(() => {
      window.realtimeService?.reconnect();
    });
    await this.waitForWebSocketConnection();
  }

  async getConnectionStatus(): Promise<'connected' | 'disconnected' | 'connecting'> {
    return await this.page.evaluate(() => {
      return window.realtimeConnectionStatus || 'disconnected';
    });
  }

  async simulateNetworkFailure(): Promise<void> {
    await this.page.evaluate(() => {
      window.realtimeService?.simulateNetworkFailure();
    });
  }

  async getActiveSubscriptions(): Promise<string[]> {
    return await this.page.evaluate(() => {
      return window.realtimeService?.getActiveSubscriptions() || [];
    });
  }
}

/**
 * Notification Center Helpers
 */
export class NotificationCenterHelpers {
  constructor(private page: Page) {}

  async openNotificationCenter(): Promise<void> {
    await this.page.click('[data-testid="notification-icon-badge"]');
    await this.page.waitForSelector('[data-testid="notification-center"]', { state: 'visible' });
  }

  async closeNotificationCenter(): Promise<void> {
    await this.page.click('[data-testid="notification-center-close"]');
    await this.page.waitForSelector('[data-testid="notification-center"]', { state: 'hidden' });
  }

  async getUnreadCount(): Promise<number> {
    return await this.page.evaluate(() => {
      return window.notificationCenter?.getUnreadCount() || 0;
    });
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.page.evaluate((id) => {
      window.notificationCenter?.markAsRead(id);
    }, notificationId);
  }

  async clearAllNotifications(): Promise<void> {
    await this.page.evaluate(() => {
      window.notificationCenter?.clearAll();
    });
  }

  async filterNotifications(filterType: string): Promise<void> {
    await this.openNotificationCenter();
    await this.page.click(`[data-testid="filter-${filterType}"]`);
  }

  async getVisibleNotifications(): Promise<TestNotification[]> {
    return await this.page.evaluate(() => {
      return window.notificationCenter?.getVisibleNotifications() || [];
    });
  }

  async sendTestNotification(notification: TestNotification): Promise<void> {
    await this.page.evaluate((notif) => {
      window.testTriggerNotification(notif.type, notif);
    }, notification);
  }
}

/**
 * Animation System Helpers
 */
export class AnimationTestHelpers {
  constructor(private page: Page) {}

  async waitForAnimation(animationType: string, timeout = 5000): Promise<void> {
    await this.page.waitForSelector(
      `[data-testid="${animationType}-overlay"]`,
      { state: 'visible', timeout }
    );
  }

  async waitForAnimationComplete(animationType: string, timeout = 10000): Promise<void> {
    await this.page.waitForSelector(
      `[data-testid="${animationType}-overlay"]`,
      { state: 'hidden', timeout }
    );
  }

  async triggerCelebrationAnimation(achievement: {
    type: 'academic' | 'character' | 'helping' | 'islamic_values';
    level: 'bronze' | 'silver' | 'gold' | 'platinum';
    title: string;
    message: string;
    arabic_text?: string;
  }): Promise<void> {
    await this.page.evaluate((data) => {
      window.animationController?.celebrateAchievement(data);
    }, achievement);
  }

  async triggerRankingAnimation(ranking: {
    oldRank: number;
    newRank: number;
    improvement: boolean;
    studentName: string;
  }): Promise<void> {
    await this.page.evaluate((data) => {
      window.animationController?.notifyRankingUpdate(data);
    }, ranking);
  }

  async triggerPrayerReminder(prayer: {
    name: string;
    time: string;
    arabic_name: string;
  }): Promise<void> {
    await this.page.evaluate((data) => {
      window.animationController?.showPrayerReminder(data);
    }, prayer);
  }

  async getLastAnimationEvent(): Promise<TestAnimation | null> {
    return await this.page.evaluate(() => {
      return window.lastAnimationEvent || null;
    });
  }

  async setAnimationSettings(settings: {
    enabled?: boolean;
    reduced_motion?: boolean;
    celebration_animations?: boolean;
  }): Promise<void> {
    await this.page.evaluate((options) => {
      window.updateAnimationSettings(options);
    }, settings);
  }

  async measureAnimationFrameRate(): Promise<number> {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        let frames = 0;
        const startTime = performance.now();
        
        function countFrames() {
          frames++;
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrames);
          } else {
            resolve(frames);
          }
        }
        
        requestAnimationFrame(countFrames);
      });
    });
  }
}

/**
 * Cultural Integration Helpers
 */
export class CulturalTestHelpers {
  constructor(private page: Page) {}

  async setLanguage(language: 'en' | 'uz' | 'ru' | 'ar'): Promise<void> {
    await this.page.evaluate((lang) => {
      window.updateLanguagePreference(lang);
    }, language);
  }

  async setPrayerTimeMode(enabled: boolean): Promise<void> {
    await this.page.evaluate((prayerMode) => {
      window.simulatePrayerTime(prayerMode);
    }, enabled);
  }

  async setRamadanMode(enabled: boolean): Promise<void> {
    await this.page.evaluate((ramadanMode) => {
      window.simulateRamadanPeriod(ramadanMode);
    }, enabled);
  }

  async getDisplayedGreeting(): Promise<string> {
    await this.page.waitForSelector('[data-testid="notification-greeting"]');
    return await this.page.textContent('[data-testid="notification-greeting"]') || '';
  }

  async checkArabicTextDisplay(): Promise<boolean> {
    const arabicElements = await this.page.$$('[data-testid*="arabic-text"]');
    return arabicElements.length > 0;
  }

  async triggerIslamicCelebration(valueType: string): Promise<void> {
    const islamicValues = {
      akhlaq: {
        name: 'Akhlaq (Good Character)',
        arabic: 'الأخلاق',
        message: 'Your beautiful character reflects Islamic values!',
      },
      taqwa: {
        name: 'Taqwa (God-consciousness)',
        arabic: 'التقوى',
        message: 'Your God-consciousness in studies is inspiring!',
      },
      ihsan: {
        name: 'Ihsan (Excellence)',
        arabic: 'الإحسان',
        message: 'Your pursuit of excellence is truly inspiring!',
      },
    };

    const value = islamicValues[valueType] || islamicValues.akhlaq;
    
    await this.page.evaluate((data) => {
      window.animationController?.celebrateIslamicValue(data);
    }, { ...value, context: 'behavior' });
  }
}

/**
 * Performance Testing Helpers
 */
export class PerformanceTestHelpers {
  constructor(private page: Page) {}

  async measureLoadTime(action: () => Promise<void>): Promise<number> {
    const startTime = Date.now();
    await action();
    return Date.now() - startTime;
  }

  async measureNotificationCenterLoadTime(): Promise<number> {
    return this.measureLoadTime(async () => {
      await this.page.click('[data-testid="notification-icon-badge"]');
      await this.page.waitForSelector('[data-testid="notification-center"]', { state: 'visible' });
    });
  }

  async stressTestNotifications(count: number): Promise<{
    totalTime: number;
    averageTime: number;
    errors: number;
  }> {
    const startTime = Date.now();
    let errors = 0;

    for (let i = 0; i < count; i++) {
      try {
        await this.page.evaluate((index) => {
          window.testTriggerNotification('stress', {
            id: `stress-${index}`,
            title: `Stress Test ${index}`,
            message: `Testing notification ${index}`,
          });
        }, i);
        
        await this.page.waitForTimeout(50); // Small delay
      } catch (error) {
        errors++;
      }
    }

    const totalTime = Date.now() - startTime;
    return {
      totalTime,
      averageTime: totalTime / count,
      errors,
    };
  }

  async getMemoryUsage(): Promise<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  }> {
    return await this.page.evaluate(() => {
      return (performance as any).memory || {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
      };
    });
  }
}

/**
 * Accessibility Testing Helpers
 */
export class AccessibilityTestHelpers {
  constructor(private page: Page) {}

  async checkAriaLabels(selector: string): Promise<boolean> {
    const element = this.page.locator(selector);
    const hasAriaLabel = await element.getAttribute('aria-label').then(label => !!label);
    const hasAriaLabelledBy = await element.getAttribute('aria-labelledby').then(labelledBy => !!labelledBy);
    
    return hasAriaLabel || hasAriaLabelledBy;
  }

  async testKeyboardNavigation(): Promise<{
    canFocusNotificationIcon: boolean;
    canOpenWithKeyboard: boolean;
    canNavigateNotifications: boolean;
  }> {
    // Test notification icon focus
    await this.page.keyboard.press('Tab');
    const notificationIconFocused = await this.page.locator('[data-testid="notification-icon-badge"]').isFocused();

    // Test opening with keyboard
    await this.page.keyboard.press('Enter');
    const centerVisible = await this.page.locator('[data-testid="notification-center"]').isVisible();

    // Test navigation within center
    await this.page.keyboard.press('Tab');
    const firstNotificationFocused = await this.page.locator('[data-testid^="notification-item-"]').first().isFocused();

    return {
      canFocusNotificationIcon: notificationIconFocused,
      canOpenWithKeyboard: centerVisible,
      canNavigateNotifications: firstNotificationFocused,
    };
  }

  async checkScreenReaderCompatibility(): Promise<{
    hasProperRoles: boolean;
    hasDescriptiveText: boolean;
    hasHeadingStructure: boolean;
  }> {
    const notificationCenter = this.page.locator('[data-testid="notification-center"]');
    
    const hasRole = await notificationCenter.getAttribute('role').then(role => role === 'dialog');
    const hasAriaLabel = await this.checkAriaLabels('[data-testid="notification-center"]');
    const hasHeadings = await this.page.locator('h1, h2, h3, h4, h5, h6').count() > 0;

    return {
      hasProperRoles: hasRole,
      hasDescriptiveText: hasAriaLabel,
      hasHeadingStructure: hasHeadings,
    };
  }
}

/**
 * Main Test Helper Class
 * Combines all helper classes for easy access
 */
export class RealtimeSystemTestHelpers {
  public realtime: RealtimeTestHelpers;
  public notifications: NotificationCenterHelpers;
  public animations: AnimationTestHelpers;
  public cultural: CulturalTestHelpers;
  public performance: PerformanceTestHelpers;
  public accessibility: AccessibilityTestHelpers;

  constructor(private page: Page) {
    this.realtime = new RealtimeTestHelpers(page);
    this.notifications = new NotificationCenterHelpers(page);
    this.animations = new AnimationTestHelpers(page);
    this.cultural = new CulturalTestHelpers(page);
    this.performance = new PerformanceTestHelpers(page);
    this.accessibility = new AccessibilityTestHelpers(page);
  }

  async initializePage(user: TestUser): Promise<void> {
    await this.page.goto('/realtime-demo');
    await this.page.waitForLoadState('networkidle');
    
    // Initialize test user context
    await this.page.evaluate((userData) => {
      window.testUser = userData;
      window.testMode = true;
    }, user);
    
    // Wait for components to initialize
    await this.page.waitForSelector('[data-testid="realtime-demo-container"]');
  }

  async cleanup(): Promise<void> {
    await this.notifications.clearAllNotifications();
    await this.page.evaluate(() => {
      window.testCleanup?.();
    });
  }
}

/**
 * Custom assertions for Islamic/Cultural content
 */
export const culturalAssertions = {
  async toContainIslamicGreeting(locator: Locator) {
    const text = await locator.textContent();
    const islamicGreetings = [
      'Assalamu alaikum',
      'Peace be upon you',
      'السلام عليكم',
      'Barakallahu',
      'Masha Allah',
      'Insha Allah',
    ];
    
    const hasGreeting = islamicGreetings.some(greeting => 
      text?.toLowerCase().includes(greeting.toLowerCase())
    );
    
    expect(hasGreeting).toBe(true);
  },

  async toContainArabicText(locator: Locator) {
    const text = await locator.textContent() || '';
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    expect(hasArabic).toBe(true);
  },

  async toRespectPrayerTime(page: Page) {
    const isPrayerTime = await page.evaluate(() => window.isPrayerTime);
    const animationsBlocked = await page.evaluate(() => window.animationsBlockedForPrayer);
    
    if (isPrayerTime) {
      expect(animationsBlocked).toBe(true);
    }
  },
};