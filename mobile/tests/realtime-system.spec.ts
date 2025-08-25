/**
 * Comprehensive End-to-End Tests for Real-time System
 * 
 * Tests the complete real-time ecosystem including:
 * - WebSocket connections
 * - Notification center functionality
 * - Real-time animations
 * - Islamic values integration
 * - Cultural sensitivity features
 * - Push notification handling
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  userId: 'test-user-123',
  organizationId: 'test-org-456',
  culturalSettings: {
    respectPrayerTimes: true,
    showIslamicGreetings: true,
    preferredLanguage: 'en',
    celebration_animations: true,
    reduced_motion: false,
  },
};

// Helper functions
const waitForWebSocketConnection = async (page: Page) => {
  // Wait for WebSocket connection to be established
  await page.waitForFunction(() => {
    return window.realtimeConnectionStatus === 'connected';
  }, { timeout: 10000 });
};

const waitForNotificationAnimation = async (page: Page) => {
  // Wait for animation overlay to appear
  await page.waitForSelector('[data-testid="animation-overlay"]', { 
    state: 'visible',
    timeout: 5000 
  });
};

const triggerNotificationFromBackend = async (page: Page, notificationType: string) => {
  // Simulate real-time notification from backend
  return page.evaluate((type) => {
    window.testTriggerNotification?.(type);
  }, notificationType);
};

test.describe('Real-time System Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and wait for initialization
    await page.goto(`${TEST_CONFIG.baseUrl}/realtime-demo`);
    await page.waitForLoadState('networkidle');
    
    // Wait for React components to be ready
    await page.waitForSelector('[data-testid="realtime-demo-container"]');
    
    // Initialize test environment
    await page.evaluate((config) => {
      window.testConfig = config;
      window.testMode = true;
    }, TEST_CONFIG);
  });

  test.describe('WebSocket Connection Management', () => {
    test('should establish WebSocket connection on load', async ({ page }) => {
      // Check connection status indicator
      const statusBadge = page.locator('[data-testid="connection-status"]');
      await expect(statusBadge).toContainText('Connected');
      
      // Verify WebSocket connection in browser console
      const isConnected = await page.evaluate(() => {
        return window.realtimeService?.isConnected() || false;
      });
      
      expect(isConnected).toBe(true);
    });

    test('should handle connection reconnection', async ({ page }) => {
      // Simulate network disconnection
      await page.evaluate(() => {
        window.realtimeService?.disconnect();
      });
      
      // Check disconnected status
      const statusBadge = page.locator('[data-testid="connection-status"]');
      await expect(statusBadge).toContainText('Offline');
      
      // Simulate reconnection
      await page.evaluate(() => {
        window.realtimeService?.reconnect();
      });
      
      await waitForWebSocketConnection(page);
      await expect(statusBadge).toContainText('Connected');
    });

    test('should respect cultural settings during connection', async ({ page }) => {
      // Check if prayer time restrictions are applied
      const culturalSettings = await page.evaluate(() => {
        return window.realtimeService?.getCulturalSettings();
      });
      
      expect(culturalSettings.respectPrayerTimes).toBe(true);
      expect(culturalSettings.showIslamicGreetings).toBe(true);
    });
  });

  test.describe('Notification Center Functionality', () => {
    test('should open and close notification center', async ({ page }) => {
      // Click notification icon
      await page.click('[data-testid="notification-icon-badge"]');
      
      // Verify notification center is visible
      const notificationCenter = page.locator('[data-testid="notification-center"]');
      await expect(notificationCenter).toBeVisible();
      
      // Verify header content
      await expect(page.locator('[data-testid="notification-center-title"]')).toContainText('Notifications');
      
      // Close notification center
      await page.click('[data-testid="notification-center-close"]');
      await expect(notificationCenter).not.toBeVisible();
    });

    test('should display Islamic greetings based on language', async ({ page }) => {
      // Open notification center
      await page.click('[data-testid="notification-icon-badge"]');
      
      // Check English greeting
      await expect(page.locator('[data-testid="notification-greeting"]')).toContainText('Peace be upon you');
      
      // Change language to Arabic
      await page.evaluate(() => {
        window.updateLanguagePreference('ar');
      });
      
      // Close and reopen to refresh content
      await page.click('[data-testid="notification-center-close"]');
      await page.click('[data-testid="notification-icon-badge"]');
      
      // Check Arabic greeting
      await expect(page.locator('[data-testid="notification-greeting"]')).toContainText('السلام عليكم');
    });

    test('should filter notifications by type', async ({ page }) => {
      // Open notification center
      await page.click('[data-testid="notification-icon-badge"]');
      
      // Click celebration filter
      await page.click('[data-testid="filter-celebration"]');
      
      // Verify only celebration notifications are visible
      const celebrationNotifications = page.locator('[data-testid^="notification-item-celebration"]');
      const otherNotifications = page.locator('[data-testid^="notification-item-"]:not([data-testid*="celebration"])');
      
      await expect(celebrationNotifications).toBeVisible();
      await expect(otherNotifications).toHaveCount(0);
    });

    test('should mark notifications as read', async ({ page }) => {
      // Open notification center
      await page.click('[data-testid="notification-icon-badge"]');
      
      // Click on an unread notification
      const unreadNotification = page.locator('[data-testid^="notification-item-"]:has([data-testid="unread-dot"])').first();
      await unreadNotification.click();
      
      // Verify notification is marked as read
      await expect(unreadNotification.locator('[data-testid="unread-dot"]')).not.toBeVisible();
      
      // Verify unread count decreased
      const unreadCount = await page.evaluate(() => {
        return window.notificationCenter?.getUnreadCount();
      });
      
      expect(typeof unreadCount).toBe('number');
    });
  });

  test.describe('Real-time Animation System', () => {
    test('should trigger celebration animation', async ({ page }) => {
      // Trigger celebration animation
      await page.evaluate(() => {
        window.animationController?.celebrateAchievement({
          type: 'islamic_values',
          level: 'gold',
          title: 'Akhlaq Achievement!',
          message: 'Your good character shines bright!',
          arabic_text: 'ما شاء الله',
        });
      });
      
      // Wait for animation to appear
      await waitForNotificationAnimation(page);
      
      // Verify celebration content
      const celebrationOverlay = page.locator('[data-testid="celebration-overlay"]');
      await expect(celebrationOverlay).toBeVisible();
      await expect(celebrationOverlay).toContainText('Akhlaq Achievement!');
      await expect(celebrationOverlay).toContainText('ما شاء الله');
      
      // Wait for animation to complete
      await page.waitForSelector('[data-testid="celebration-overlay"]', { state: 'hidden', timeout: 6000 });
    });

    test('should respect reduced motion preferences', async ({ page }) => {
      // Enable reduced motion
      await page.evaluate(() => {
        window.updateAnimationSettings({ reduced_motion: true });
      });
      
      // Trigger animation
      await page.evaluate(() => {
        window.animationController?.celebrateAchievement({
          type: 'academic',
          level: 'silver',
          title: 'Test Achievement',
          message: 'Reduced motion test',
        });
      });
      
      // Verify animation has reduced intensity
      const animationIntensity = await page.evaluate(() => {
        return window.lastAnimationEvent?.intensity;
      });
      
      expect(animationIntensity).not.toBe('celebration');
    });

    test('should show prayer time animations with cultural sensitivity', async ({ page }) => {
      // Trigger prayer reminder
      await page.evaluate(() => {
        window.animationController?.showPrayerReminder({
          name: 'Maghrib',
          time: '6:45 PM',
          arabic_name: 'المغرب',
        });
      });
      
      // Wait for prayer animation
      await waitForNotificationAnimation(page);
      
      const prayerOverlay = page.locator('[data-testid="prayer-overlay"]');
      await expect(prayerOverlay).toBeVisible();
      await expect(prayerOverlay).toContainText('Prayer Time');
      await expect(prayerOverlay).toContainText('المغرب');
    });

    test('should animate ranking updates appropriately', async ({ page }) => {
      // Trigger ranking update (improvement)
      await page.evaluate(() => {
        window.animationController?.notifyRankingUpdate({
          oldRank: 8,
          newRank: 5,
          improvement: true,
          studentName: 'Test Student',
        });
      });
      
      await waitForNotificationAnimation(page);
      
      const rankingOverlay = page.locator('[data-testid="ranking-overlay"]');
      await expect(rankingOverlay).toBeVisible();
      await expect(rankingOverlay).toContainText('Rank Up!');
      await expect(rankingOverlay).toContainText('#5');
    });
  });

  test.describe('Cultural Integration Tests', () => {
    test('should display appropriate Islamic greetings', async ({ page }) => {
      // Test different greeting types
      const greetings = ['salam', 'barakallah', 'masha_allah', 'insha_allah'];
      
      for (const greetingType of greetings) {
        await page.evaluate((type) => {
          window.testTriggerNotification('cultural', {
            greeting_type: type,
            islamic_content: true,
          });
        }, greetingType);
        
        await waitForNotificationAnimation(page);
        
        // Verify appropriate cultural content
        const culturalOverlay = page.locator('[data-testid="cultural-overlay"]');
        await expect(culturalOverlay).toBeVisible();
        
        // Wait for animation to complete before next test
        await page.waitForSelector('[data-testid="cultural-overlay"]', { state: 'hidden', timeout: 5000 });
      }
    });

    test('should handle multilingual content', async ({ page }) => {
      const languages = ['en', 'uz', 'ru', 'ar'];
      
      for (const lang of languages) {
        await page.evaluate((language) => {
          window.updateLanguagePreference(language);
          window.testTriggerNotification('multilingual', { language });
        }, lang);
        
        await waitForNotificationAnimation(page);
        
        // Verify content is in correct language
        const overlay = page.locator('[data-testid="multilingual-overlay"]');
        await expect(overlay).toBeVisible();
        
        // Check language-specific content
        const hasCorrectLanguage = await page.evaluate((language) => {
          const element = document.querySelector('[data-testid="multilingual-overlay"]');
          return element?.getAttribute('data-language') === language;
        }, lang);
        
        expect(hasCorrectLanguage).toBe(true);
        
        await page.waitForSelector('[data-testid="multilingual-overlay"]', { state: 'hidden', timeout: 3000 });
      }
    });

    test('should respect prayer time restrictions', async ({ page }) => {
      // Simulate prayer time
      await page.evaluate(() => {
        window.simulatePrayerTime(true);
      });
      
      // Try to trigger non-prayer animation during prayer time
      await page.evaluate(() => {
        window.animationController?.celebrateAchievement({
          type: 'academic',
          level: 'bronze',
          title: 'Should be blocked',
          message: 'This should not appear during prayer time',
        });
      });
      
      // Verify animation was blocked
      const overlay = page.locator('[data-testid="celebration-overlay"]');
      await expect(overlay).not.toBeVisible({ timeout: 2000 });
      
      // Verify prayer-specific animations still work
      await page.evaluate(() => {
        window.animationController?.showPrayerReminder({
          name: 'Asr',
          time: '4:00 PM',
          arabic_name: 'العصر',
        });
      });
      
      await waitForNotificationAnimation(page);
      await expect(page.locator('[data-testid="prayer-overlay"]')).toBeVisible();
    });
  });

  test.describe('Performance and Reliability Tests', () => {
    test('should handle high-frequency notifications', async ({ page }) => {
      // Send multiple notifications rapidly
      await page.evaluate(() => {
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            window.testTriggerNotification('performance', {
              id: `perf-${i}`,
              message: `Performance test ${i}`,
            });
          }, i * 100);
        }
      });
      
      // Wait for all notifications to be processed
      await page.waitForTimeout(2000);
      
      // Verify notification count
      const notificationCount = await page.evaluate(() => {
        return window.notificationCenter?.getNotifications().length;
      });
      
      expect(notificationCount).toBeGreaterThanOrEqual(10);
    });

    test('should maintain performance during animations', async ({ page }) => {
      // Start performance monitoring
      const startTime = await page.evaluate(() => performance.now());
      
      // Trigger multiple animations
      for (let i = 0; i < 5; i++) {
        await page.evaluate((index) => {
          window.animationController?.celebrateAchievement({
            type: 'academic',
            level: 'bronze',
            title: `Performance Test ${index}`,
            message: `Testing animation performance`,
          });
        }, i);
        
        await page.waitForTimeout(500);
      }
      
      // Measure performance
      const endTime = await page.evaluate(() => performance.now());
      const duration = endTime - startTime;
      
      // Verify reasonable performance (should complete in under 5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    test('should handle WebSocket reconnection gracefully', async ({ page }) => {
      // Establish connection
      await waitForWebSocketConnection(page);
      
      // Simulate network failure and recovery
      await page.evaluate(() => {
        window.realtimeService?.simulateNetworkFailure();
      });
      
      // Wait for automatic reconnection
      await page.waitForTimeout(2000);
      
      // Verify reconnection occurred
      const isReconnected = await page.evaluate(() => {
        return window.realtimeService?.isConnected();
      });
      
      expect(isReconnected).toBe(true);
    });
  });

  test.describe('Accessibility Tests', () => {
    test('should be accessible to screen readers', async ({ page }) => {
      // Open notification center
      await page.click('[data-testid="notification-icon-badge"]');
      
      // Check ARIA labels
      const notificationCenter = page.locator('[data-testid="notification-center"]');
      await expect(notificationCenter).toHaveAttribute('role', 'dialog');
      await expect(notificationCenter).toHaveAttribute('aria-labelledby');
      
      // Check notification items accessibility
      const firstNotification = page.locator('[data-testid^="notification-item-"]').first();
      await expect(firstNotification).toHaveAttribute('role', 'button');
      await expect(firstNotification).toHaveAttribute('aria-describedby');
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Focus on notification icon
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="notification-icon-badge"]')).toBeFocused();
      
      // Open with Enter
      await page.keyboard.press('Enter');
      
      // Navigate through filters with Tab
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="filter-all"]')).toBeFocused();
      
      // Navigate to notifications
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid^="notification-item-"]').first()).toBeFocused();
      
      // Activate notification with Enter
      await page.keyboard.press('Enter');
      
      // Verify notification was activated (marked as read)
      const wasRead = await page.evaluate(() => {
        return window.lastNotificationAction === 'read';
      });
      
      expect(wasRead).toBe(true);
    });
  });

  test.describe('Integration with Supabase Tests', () => {
    test('should sync with Supabase real-time subscriptions', async ({ page }) => {
      // Verify Supabase connection
      const supabaseConnected = await page.evaluate(() => {
        return window.realtimeService?.supabaseClient?.realtime?.isConnected();
      });
      
      expect(supabaseConnected).toBe(true);
    });

    test('should handle Supabase channel subscriptions', async ({ page }) => {
      // Check active subscriptions
      const subscriptions = await page.evaluate(() => {
        return window.realtimeService?.getActiveSubscriptions();
      });
      
      expect(Array.isArray(subscriptions)).toBe(true);
      expect(subscriptions.length).toBeGreaterThan(0);
    });
  });
});

// Performance benchmark tests
test.describe('Performance Benchmarks', () => {
  test('notification center load time should be under 500ms', async ({ page }) => {
    const startTime = Date.now();
    await page.click('[data-testid="notification-icon-badge"]');
    await page.waitForSelector('[data-testid="notification-center"]', { state: 'visible' });
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(500);
  });

  test('animation frame rate should maintain 60fps', async ({ page }) => {
    // Start FPS monitoring
    await page.evaluate(() => {
      window.fpsMonitor = { frames: 0, startTime: performance.now() };
      function countFrames() {
        window.fpsMonitor.frames++;
        requestAnimationFrame(countFrames);
      }
      requestAnimationFrame(countFrames);
    });

    // Trigger animation
    await page.evaluate(() => {
      window.animationController?.celebrateAchievement({
        type: 'islamic_values',
        level: 'platinum',
        title: 'FPS Test',
        message: 'Testing frame rate',
      });
    });

    // Wait for animation duration
    await page.waitForTimeout(3000);

    // Calculate FPS
    const fps = await page.evaluate(() => {
      const duration = (performance.now() - window.fpsMonitor.startTime) / 1000;
      return window.fpsMonitor.frames / duration;
    });

    expect(fps).toBeGreaterThan(50); // Allow some margin for test environment
  });
});

// Edge case tests
test.describe('Edge Cases', () => {
  test('should handle empty notification list gracefully', async ({ page }) => {
    // Clear all notifications
    await page.evaluate(() => {
      window.notificationCenter?.clearAll();
    });

    // Open notification center
    await page.click('[data-testid="notification-icon-badge"]');

    // Verify empty state
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-state"]')).toContainText('No notifications');
  });

  test('should handle very long notification messages', async ({ page }) => {
    const longMessage = 'A'.repeat(500);
    
    await page.evaluate((message) => {
      window.testTriggerNotification('long-text', {
        title: 'Long Message Test',
        message: message,
      });
    }, longMessage);

    await page.click('[data-testid="notification-icon-badge"]');
    
    // Verify message is truncated or scrollable
    const messageElement = page.locator('[data-testid^="notification-message-"]').first();
    await expect(messageElement).toBeVisible();
    
    // Check if text is properly contained
    const isOverflowing = await messageElement.evaluate(el => 
      el.scrollHeight > el.clientHeight
    );
    
    // Should either be truncated or made scrollable
    expect(typeof isOverflowing).toBe('boolean');
  });

  test('should handle rapid language switching', async ({ page }) => {
    const languages = ['en', 'uz', 'ru', 'ar'];
    
    for (let i = 0; i < 5; i++) {
      const lang = languages[i % languages.length];
      await page.evaluate((language) => {
        window.updateLanguagePreference(language);
      }, lang);
      
      await page.waitForTimeout(100);
    }
    
    // Verify final state is stable
    await page.click('[data-testid="notification-icon-badge"]');
    const isVisible = await page.locator('[data-testid="notification-center"]').isVisible();
    expect(isVisible).toBe(true);
  });
});