import { test, expect, Page, BrowserContext } from '@playwright/test';

// Playwright test configuration for offline scenarios
test.describe('Harry School Offline Capabilities - Browser Testing', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    // Create browser context with Islamic cultural locale
    context = await browser.newContext({
      locale: 'ar-SA', // Arabic (Saudi Arabia) for Islamic context
      timezoneId: 'Asia/Tashkent', // Tashkent timezone
      permissions: ['notifications'],
      geolocation: { latitude: 41.2995, longitude: 69.2401 } // Tashkent coordinates
    });
  });

  test.beforeEach(async () => {
    page = await context.newPage();
    
    // Mock Islamic prayer times API
    await page.route('**/prayer-times/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          fajr: '05:30',
          dhuhr: '12:15',
          asr: '15:30',
          maghrib: '18:45',
          isha: '20:15',
          date: new Date().toISOString().split('T')[0]
        })
      });
    });

    // Mock educational API endpoints
    await page.route('**/api/students/**', route => {
      if (!page.context().isOnline) {
        route.abort();
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'student-1',
            name: 'Ahmed Ali',
            grade: 'Grade 8',
            progress: { math: 85, science: 78 }
          })
        });
      }
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should handle offline teacher attendance marking', async () => {
    // Navigate to teacher attendance page
    await page.goto('/teacher/attendance');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="attendance-form"]');

    // Go offline
    await context.setOffline(true);

    // Mark attendance for students
    const students = [
      { id: 'student-1', name: 'Ahmed Ali', status: 'present' },
      { id: 'student-2', name: 'Fatima Hassan', status: 'absent' },
      { id: 'student-3', name: 'Omar Mahmud', status: 'present' }
    ];

    for (const student of students) {
      await page.check(`[data-testid="student-${student.id}-${student.status}"]`);
    }

    // Submit attendance
    await page.click('[data-testid="submit-attendance"]');

    // Verify offline notification
    await expect(page.locator('[data-testid="offline-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-notification"]')).toContainText(
      'Attendance saved locally. Will sync when connection is restored.'
    );

    // Verify attendance is stored locally
    const offlineData = await page.evaluate(() => {
      return localStorage.getItem('offline-attendance-queue');
    });
    expect(offlineData).toBeTruthy();

    // Go back online
    await context.setOffline(false);

    // Wait for automatic sync
    await page.waitForSelector('[data-testid="sync-success-notification"]', { timeout: 10000 });
    
    // Verify sync success message
    await expect(page.locator('[data-testid="sync-success-notification"]')).toContainText(
      'Attendance synchronized successfully'
    );
  });

  test('should respect prayer times in offline operations', async () => {
    await page.goto('/teacher/dashboard');

    // Mock current time to be during Dhuhr prayer (12:15)
    await page.addInitScript(() => {
      const mockDate = new Date();
      mockDate.setHours(12, 15, 0, 0);
      Date.now = () => mockDate.getTime();
    });

    await context.setOffline(true);

    // Try to perform bulk sync operation
    await page.click('[data-testid="bulk-sync-button"]');

    // Should show prayer time delay message
    await expect(page.locator('[data-testid="prayer-time-delay"]')).toBeVisible();
    await expect(page.locator('[data-testid="prayer-time-delay"]')).toContainText(
      'Operations will be processed after prayer time to respect Islamic values'
    );

    // Verify operations are queued but not processed
    const queueStatus = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('offline-queue-status') || '{}');
    });
    expect(queueStatus.culturallyDelayed).toBeTruthy();
  });

  test('should handle multilingual offline content', async () => {
    await page.goto('/student/lessons');

    // Set language preference to Arabic
    await page.click('[data-testid="language-selector"]');
    await page.click('[data-testid="language-arabic"]');

    await context.setOffline(true);

    // Access cached lesson content
    await page.click('[data-testid="lesson-mathematics-1"]');

    // Verify Arabic content is displayed from cache
    await expect(page.locator('[data-testid="lesson-title"]')).toContainText('مقدمة في الرياضيات');
    await expect(page.locator('[data-testid="lesson-content"]')).toContainText('المفاهيم الأساسية');

    // Verify offline indicator shows content is cached
    await expect(page.locator('[data-testid="offline-cached-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-cached-indicator"]')).toContainText(
      'محتوى محفوظ محلياً' // "Locally cached content" in Arabic
    );
  });

  test('should handle student progress tracking offline', async () => {
    await page.goto('/student/lessons/mathematics-basics');

    await context.setOffline(true);

    // Complete lesson activities
    await page.click('[data-testid="start-lesson"]');
    
    // Answer quiz questions
    await page.click('[data-testid="quiz-answer-1"]');
    await page.click('[data-testid="quiz-submit"]');

    // Complete writing exercise
    await page.fill('[data-testid="writing-exercise"]', 'My solution to the math problem...');
    await page.click('[data-testid="exercise-submit"]');

    // Verify progress is tracked locally
    const progressData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('student-progress-cache') || '{}');
    });
    expect(progressData['mathematics-basics']).toBeDefined();
    expect(progressData['mathematics-basics'].completionRate).toBeGreaterThan(0);

    // Verify offline progress indicator
    await expect(page.locator('[data-testid="offline-progress-saved"]')).toBeVisible();
  });

  test('should handle teacher grading workflow offline', async () => {
    await page.goto('/teacher/grading');

    await context.setOffline(true);

    // Grade student assignments
    const assignments = [
      { studentId: 'student-1', assignmentId: 'math-hw-1', grade: 85 },
      { studentId: 'student-2', assignmentId: 'math-hw-1', grade: 92 },
      { studentId: 'student-3', assignmentId: 'math-hw-1', grade: 78 }
    ];

    for (const assignment of assignments) {
      await page.fill(
        `[data-testid="grade-input-${assignment.studentId}-${assignment.assignmentId}"]`,
        assignment.grade.toString()
      );
      await page.fill(
        `[data-testid="feedback-input-${assignment.studentId}-${assignment.assignmentId}"]`,
        'Good work, keep improving!'
      );
    }

    await page.click('[data-testid="save-grades"]');

    // Verify offline grading notification
    await expect(page.locator('[data-testid="offline-grading-saved"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-grading-saved"]')).toContainText(
      'Grades saved offline. Will sync when connection restored.'
    );

    // Verify grades are cached with teacher authority
    const gradingData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('offline-grading-queue') || '{}');
    });
    expect(Object.keys(gradingData).length).toBe(3);
    expect(gradingData['student-1-math-hw-1'].grade).toBe(85);
    expect(gradingData['student-1-math-hw-1'].teacherAuthority).toBe(true);
  });

  test('should handle network reconnection with cultural timing', async () => {
    await page.goto('/teacher/dashboard');

    // Start offline
    await context.setOffline(true);

    // Queue several operations
    await page.click('[data-testid="create-assignment"]');
    await page.fill('[data-testid="assignment-title"]', 'Islamic History Quiz');
    await page.click('[data-testid="save-assignment"]');

    await page.click('[data-testid="update-student-profile"]');
    await page.fill('[data-testid="student-notes"]', 'Excellent progress in Arabic studies');
    await page.click('[data-testid="save-profile"]');

    // Mock current time to be during school hours (not prayer time)
    await page.addInitScript(() => {
      const mockDate = new Date();
      mockDate.setHours(10, 30, 0, 0); // 10:30 AM
      Date.now = () => mockDate.getTime();
    });

    // Go back online
    await context.setOffline(false);

    // Verify automatic sync starts
    await expect(page.locator('[data-testid="sync-in-progress"]')).toBeVisible();
    
    // Wait for sync completion
    await page.waitForSelector('[data-testid="sync-completed"]', { timeout: 15000 });

    // Verify all operations were synced
    await expect(page.locator('[data-testid="sync-completed"]')).toContainText(
      '2 operations synchronized successfully'
    );

    // Verify operations are no longer in offline queue
    const queueStatus = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('offline-queue-status') || '{}');
    });
    expect(queueStatus.totalOperations).toBe(0);
  });

  test('should handle data conflicts with educational hierarchy', async () => {
    await page.goto('/teacher/grades');

    // Start with online mode, load student grade
    await page.waitForSelector('[data-testid="student-1-math-grade"]');
    const originalGrade = await page.inputValue('[data-testid="student-1-math-grade"]');

    // Go offline
    await context.setOffline(true);

    // Teacher updates grade offline
    await page.fill('[data-testid="student-1-math-grade"]', '85');
    await page.click('[data-testid="save-grades"]');

    // Simulate student attempting to modify their own grade (should be prevented)
    await page.evaluate(() => {
      // Simulate student trying to modify grade in localStorage
      const studentAttempt = {
        studentId: 'student-1',
        subject: 'math',
        grade: 95,
        modifiedBy: 'student',
        timestamp: Date.now()
      };
      localStorage.setItem('student-grade-attempt', JSON.stringify(studentAttempt));
    });

    // Go back online
    await context.setOffline(false);

    // Wait for sync and conflict resolution
    await page.waitForSelector('[data-testid="sync-completed"]', { timeout: 15000 });

    // Verify teacher's grade takes precedence
    const finalGrade = await page.inputValue('[data-testid="student-1-math-grade"]');
    expect(finalGrade).toBe('85');

    // Verify conflict resolution notification
    await expect(page.locator('[data-testid="conflict-resolved"]')).toBeVisible();
    await expect(page.locator('[data-testid="conflict-resolved"]')).toContainText(
      'Teacher authority maintained in grade resolution'
    );
  });

  test('should optimize performance for low battery conditions', async () => {
    await page.goto('/student/lessons');

    // Mock low battery condition
    await page.addInitScript(() => {
      // Mock battery API
      Object.defineProperty(navigator, 'battery', {
        value: {
          level: 0.15, // 15% battery
          charging: false
        }
      });
    });

    await context.setOffline(true);

    // Perform battery-intensive operations
    await page.click('[data-testid="download-lesson-videos"]');

    // Verify battery optimization notification
    await expect(page.locator('[data-testid="battery-optimization"]')).toBeVisible();
    await expect(page.locator('[data-testid="battery-optimization"]')).toContainText(
      'Background operations paused to preserve battery'
    );

    // Verify operations are queued for later processing
    const batteryOptimizedQueue = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('battery-optimized-queue') || '{}');
    });
    expect(batteryOptimizedQueue.pausedOperations).toBeGreaterThan(0);
  });

  test('should handle cache cleanup during culturally appropriate times', async () => {
    await page.goto('/admin/cache-management');

    // Fill cache with test data
    await page.evaluate(() => {
      const testData = {
        'lesson-1': { content: 'Mathematics lesson...', size: 1024 },
        'lesson-2': { content: 'Science lesson...', size: 2048 },
        'cultural-content': { content: 'Islamic studies...', culturalPriority: 'high', size: 512 }
      };
      
      for (const [key, value] of Object.entries(testData)) {
        localStorage.setItem(`cache-${key}`, JSON.stringify(value));
      }
    });

    // Mock current time to be outside prayer times
    await page.addInitScript(() => {
      const mockDate = new Date();
      mockDate.setHours(14, 0, 0, 0); // 2:00 PM - between prayers
      Date.now = () => mockDate.getTime();
    });

    // Trigger cache cleanup
    await page.click('[data-testid="cleanup-cache"]');

    // Verify culturally sensitive content is preserved
    const cacheContent = await page.evaluate(() => {
      return localStorage.getItem('cache-cultural-content');
    });
    expect(cacheContent).toBeTruthy();

    // Verify cleanup happened at appropriate time
    await expect(page.locator('[data-testid="cleanup-completed"]')).toBeVisible();
    await expect(page.locator('[data-testid="cleanup-completed"]')).toContainText(
      'Cache cleaned during culturally appropriate timing'
    );
  });
});

// Performance test for offline operations
test.describe('Offline Performance Tests', () => {
  test('should handle large offline queues efficiently', async ({ page, context }) => {
    await page.goto('/teacher/bulk-operations');
    await context.setOffline(true);

    // Create large number of operations
    const startTime = Date.now();
    
    for (let i = 0; i < 100; i++) {
      await page.click('[data-testid="add-student-record"]');
      await page.fill(`[data-testid="student-name-${i}"]`, `Student ${i}`);
      await page.click('[data-testid="save-student-record"]');
    }

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Verify operations processed efficiently (under 10 seconds for 100 operations)
    expect(processingTime).toBeLessThan(10000);

    // Verify all operations queued
    const queueSize = await page.evaluate(() => {
      const queue = JSON.parse(localStorage.getItem('offline-operation-queue') || '[]');
      return queue.length;
    });
    expect(queueSize).toBe(100);
  });

  test('should maintain responsive UI during offline operations', async ({ page, context }) => {
    await page.goto('/student/interactive-lesson');
    await context.setOffline(true);

    // Start performance monitoring
    await page.evaluate(() => {
      window.performanceMetrics = [];
      const observer = new PerformanceObserver((list) => {
        window.performanceMetrics.push(...list.getEntries());
      });
      observer.observe({ entryTypes: ['measure', 'navigation'] });
    });

    // Perform UI interactions while offline operations are queued
    await page.click('[data-testid="start-quiz"]');
    await page.click('[data-testid="answer-1"]');
    await page.click('[data-testid="next-question"]');
    await page.click('[data-testid="answer-2"]');
    await page.click('[data-testid="submit-quiz"]');

    // Verify UI remains responsive (no long tasks > 50ms)
    const longTasks = await page.evaluate(() => {
      return window.performanceMetrics.filter(entry => entry.duration > 50);
    });
    expect(longTasks.length).toBe(0);
  });
});