/**
 * home-tasks.test.ts
 * Comprehensive test suite for Harry School Home Tasks module
 */

import { test, expect } from '@playwright/test';

// Mock data for testing
const mockStudent = {
  id: 'test-student-123',
  name: 'Anvar Karimov',
  ageGroup: '13-15' as const,
  nativeLanguage: 'uz' as const,
  level: 'intermediate',
};

const mockLesson = {
  id: 'test-lesson-456',
  title: 'Daily Life Conversations',
  description: 'Practice everyday English conversations with cultural context',
  level: 'intermediate',
  ageGroup: '13-15' as const,
  totalTasks: 5,
  estimatedDuration: 45,
};

const mockTextTask = {
  id: 'test-task-text-789',
  lessonId: mockLesson.id,
  title: 'Reading: A Day with Oybek\'s Family',
  taskType: 'text' as const,
  orderIndex: 1,
  taskData: {
    content: 'Oybek lives in Tashkent with his family. Every morning, his mother makes fresh bread and tea...',
    questions: [
      {
        type: 'multiple_choice',
        question: 'Where does Oybek live?',
        options: ['Samarkand', 'Tashkent', 'Bukhara', 'Fergana'],
        correct: 1,
      },
    ],
  },
};

const mockWritingTask = {
  id: 'test-task-writing-790',
  lessonId: mockLesson.id,
  title: 'Writing: My Perfect Day',
  taskType: 'writing' as const,
  orderIndex: 3,
  taskData: {
    prompt: 'Write about your perfect day at home with your family.',
    minWordCount: 60,
    maxWordCount: 120,
    promptType: 'creative',
  },
};

test.describe('Harry School Home Tasks Module', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/lessons**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [mockLesson],
          total: 1,
        }),
      });
    });

    await page.route('**/api/tasks**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [mockTextTask, mockWritingTask],
          total: 2,
        }),
      });
    });

    await page.route('**/api/student-progress**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          completedTasks: 0,
          totalTasks: 5,
          averageScore: 0,
          timeSpent: 0,
        }),
      });
    });

    // Navigate to the Home Tasks module
    await page.goto('/student/home-tasks');
  });

  test('should display lessons list with age-appropriate styling', async ({ page }) => {
    // Wait for lessons to load
    await expect(page.locator('[data-testid="lessons-list"]')).toBeVisible();
    
    // Check lesson card is displayed
    const lessonCard = page.locator('[data-testid="lesson-card"]').first();
    await expect(lessonCard).toBeVisible();
    await expect(lessonCard).toContainText('Daily Life Conversations');
    
    // Check age-appropriate styling (13-15 age group should have productivity focus)
    await expect(lessonCard.locator('[data-testid="lesson-progress"]')).toBeVisible();
    await expect(lessonCard.locator('[data-testid="lesson-duration"]')).toContainText('45 min');
  });

  test('should navigate to lesson detail screen', async ({ page }) => {
    // Click on lesson card
    await page.locator('[data-testid="lesson-card"]').first().click();
    
    // Should navigate to lesson detail
    await expect(page).toHaveURL(/.*\/lessons\/test-lesson-456/);
    
    // Check lesson detail header
    await expect(page.locator('[data-testid="lesson-title"]')).toContainText('Daily Life Conversations');
    
    // Check task list is displayed
    await expect(page.locator('[data-testid="task-list"]')).toBeVisible();
    
    // Check individual tasks are shown
    const textTask = page.locator('[data-testid="task-item"]').first();
    await expect(textTask).toContainText('Reading: A Day with Oybek\'s Family');
  });

  test('should handle text task completion flow', async ({ page }) => {
    // Navigate to lesson detail
    await page.locator('[data-testid="lesson-card"]').first().click();
    
    // Click on text task
    await page.locator('[data-testid="task-item"]').first().click();
    
    // Should navigate to text task screen
    await expect(page).toHaveURL(/.*\/tasks\/test-task-text-789/);
    
    // Check text task content is displayed
    await expect(page.locator('[data-testid="reading-content"]')).toContainText('Oybek lives in Tashkent');
    
    // Check questions are displayed
    await expect(page.locator('[data-testid="question-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="question-0"]')).toContainText('Where does Oybek live?');
    
    // Select an answer
    await page.locator('[data-testid="option-1"]').click();
    
    // Submit answers
    await page.locator('[data-testid="submit-answers"]').click();
    
    // Check feedback is displayed
    await expect(page.locator('[data-testid="task-feedback"]')).toBeVisible();
    await expect(page.locator('[data-testid="score-display"]')).toBeVisible();
  });

  test('should handle writing task with age-adaptive interface', async ({ page }) => {
    // Navigate to lesson detail
    await page.locator('[data-testid="lesson-card"]').first().click();
    
    // Click on writing task
    await page.locator('[data-testid="task-item"]').nth(1).click();
    
    // Should navigate to writing task screen
    await expect(page).toHaveURL(/.*\/tasks\/test-task-writing-790/);
    
    // Check writing prompt is displayed
    await expect(page.locator('[data-testid="writing-prompt"]')).toContainText('Write about your perfect day at home');
    
    // Check word count indicator
    await expect(page.locator('[data-testid="word-count"]')).toContainText('0 / 60');
    
    // Type in text area
    const textArea = page.locator('[data-testid="writing-input"]');
    await textArea.fill('My perfect day starts with my family having breakfast together. We eat fresh bread and drink tea while talking about our dreams. Then we visit my grandmother and help her cook plov. In the evening, we sit in our garden and share stories under the stars. This makes me very happy because family time is precious.');
    
    // Check word count updates
    await expect(page.locator('[data-testid="word-count"]')).toContainText('60 / 60');
    
    // Check submit button becomes enabled
    await expect(page.locator('[data-testid="submit-writing"]')).toBeEnabled();
    
    // Submit writing
    await page.locator('[data-testid="submit-writing"]').click();
    
    // Check AI evaluation loading state
    await expect(page.locator('[data-testid="evaluation-loading"]')).toBeVisible();
    
    // Mock AI evaluation response
    await page.route('**/api/ai/evaluate-text**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overallScore: 85,
          rubricScores: {
            grammar: 80,
            vocabulary: 85,
            creativity: 90,
            cultural_connection: 88,
          },
          strengths: ['Great use of family themes', 'Clear expression of ideas'],
          improvements: ['Add more descriptive words', 'Try longer sentences'],
          culturalNotes: 'Your writing beautifully reflects Uzbek family values',
        }),
      });
    });
    
    // Wait for evaluation results
    await expect(page.locator('[data-testid="writing-results"]')).toBeVisible({ timeout: 5000 });
    
    // Check evaluation scores are displayed
    await expect(page.locator('[data-testid="overall-score"]')).toContainText('85%');
    
    // Check cultural feedback is shown
    await expect(page.locator('[data-testid="cultural-notes"]')).toContainText('Uzbek family values');
  });

  test('should handle offline functionality', async ({ page }) => {
    // Simulate offline condition
    await page.context().setOffline(true);
    
    // Navigate to lessons (should work with cached data)
    await page.goto('/student/home-tasks');
    
    // Check offline indicator is shown
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Check cached lessons are still displayed
    await expect(page.locator('[data-testid="lessons-list"]')).toBeVisible();
    
    // Try to start a task (should show offline notice)
    await page.locator('[data-testid="lesson-card"]').first().click();
    await page.locator('[data-testid="task-item"]').first().click();
    
    // Should show offline task interface
    await expect(page.locator('[data-testid="offline-task-notice"]')).toBeVisible();
    
    // Should still allow task interaction
    await expect(page.locator('[data-testid="reading-content"]')).toBeVisible();
    
    // Restore online connection
    await page.context().setOffline(false);
    
    // Check sync indicator appears
    await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible({ timeout: 3000 });
  });

  test('should handle age-adaptive content for elementary students', async ({ page }) => {
    // Mock elementary student context
    await page.route('**/api/student/profile**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockStudent,
          ageGroup: '10-12',
          level: 'beginner',
        }),
      });
    });

    await page.goto('/student/home-tasks');
    
    // Check elementary styling is applied
    const lessonCard = page.locator('[data-testid="lesson-card"]').first();
    
    // Elementary students should see more gamified interface
    await expect(lessonCard.locator('[data-testid="lesson-stars"]')).toBeVisible();
    await expect(lessonCard.locator('[data-testid="lesson-badge"]')).toBeVisible();
    
    // Check larger touch targets for elementary
    const cardButton = lessonCard.locator('button');
    const buttonBox = await cardButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThan(60); // Minimum 60px for elementary
  });

  test('should handle cultural adaptation features', async ({ page }) => {
    // Navigate to writing task
    await page.locator('[data-testid="lesson-card"]').first().click();
    await page.locator('[data-testid="task-item"]').nth(1).click();
    
    // Check cultural context is displayed
    await expect(page.locator('[data-testid="cultural-context"]')).toBeVisible();
    
    // Check help panel has culturally relevant hints
    await page.locator('[data-testid="help-button"]').click();
    await expect(page.locator('[data-testid="help-panel"]')).toBeVisible();
    
    // Should show Uzbek-specific writing suggestions
    await expect(page.locator('[data-testid="cultural-hints"]')).toContainText('family');
    
    // Check language support features
    await expect(page.locator('[data-testid="native-language-support"]')).toBeVisible();
  });

  test('should track task progress and time', async ({ page }) => {
    // Navigate to text task
    await page.locator('[data-testid="lesson-card"]').first().click();
    await page.locator('[data-testid="task-item"]').first().click();
    
    // Check timer starts automatically
    await expect(page.locator('[data-testid="task-timer"]')).toBeVisible();
    
    // Wait for timer to show some progress
    await page.waitForTimeout(2000);
    
    // Check timer shows elapsed time
    const timerText = await page.locator('[data-testid="task-timer"]').textContent();
    expect(timerText).toMatch(/00:0[0-9]/); // Should show seconds
    
    // Check progress tracking
    await expect(page.locator('[data-testid="task-progress"]')).toBeVisible();
    
    // Complete some questions
    await page.locator('[data-testid="option-1"]').click();
    
    // Check progress updates
    await expect(page.locator('[data-testid="progress-percentage"]')).toContainText('50%');
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/lessons**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    await page.goto('/student/home-tasks');
    
    // Check error state is displayed
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // Mock successful retry
    await page.route('**/api/lessons**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [mockLesson],
          total: 1,
        }),
      });
    });

    // Click retry
    await page.locator('[data-testid="retry-button"]').click();
    
    // Check content loads successfully
    await expect(page.locator('[data-testid="lessons-list"]')).toBeVisible();
  });

  test('should handle accessibility requirements', async ({ page }) => {
    await page.goto('/student/home-tasks');
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="lesson-card"]:focus')).toBeVisible();
    
    // Check ARIA labels
    const lessonCard = page.locator('[data-testid="lesson-card"]').first();
    await expect(lessonCard).toHaveAttribute('aria-label');
    
    // Check screen reader content
    await expect(page.locator('[data-testid="sr-lesson-description"]')).toBeVisible();
    
    // Check high contrast support
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('[data-testid="lessons-list"]')).toBeVisible();
    
    // Check touch target sizes (minimum 48px)
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(48);
        expect(box.width).toBeGreaterThanOrEqual(48);
      }
    }
  });

  test('should handle performance requirements', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/student/home-tasks');
    
    // Measure page load time
    const startTime = Date.now();
    await expect(page.locator('[data-testid="lessons-list"]')).toBeVisible();
    const loadTime = Date.now() - startTime;
    
    // Should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
    
    // Check smooth animations
    const lessonCard = page.locator('[data-testid="lesson-card"]').first();
    await lessonCard.hover();
    
    // Should have transition effects
    await expect(lessonCard).toHaveCSS('transition-duration', /[0-9]+ms/);
    
    // Check memory usage doesn't grow excessively
    // (This would require custom performance APIs in real implementation)
  });

  test('should sync data when connection restored', async ({ page }) => {
    // Start offline
    await page.context().setOffline(true);
    await page.goto('/student/home-tasks');
    
    // Make some changes while offline
    await page.locator('[data-testid="lesson-card"]').first().click();
    await page.locator('[data-testid="task-item"]').first().click();
    
    // Answer questions offline
    await page.locator('[data-testid="option-1"]').click();
    
    // Restore connection
    await page.context().setOffline(false);
    
    // Mock sync API
    await page.route('**/api/sync**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          synced: true,
          conflicts: 0,
          timestamp: new Date().toISOString(),
        }),
      });
    });

    // Should automatically sync
    await expect(page.locator('[data-testid="sync-success"]')).toBeVisible({ timeout: 5000 });
    
    // Check data integrity after sync
    await expect(page.locator('[data-testid="option-1"]:checked')).toBeVisible();
  });

});

// Helper functions for complex test scenarios
async function simulateSlowNetwork(page: any) {
  await page.route('**/*', async route => {
    // Add 2-second delay to all requests
    await new Promise(resolve => setTimeout(resolve, 2000));
    await route.continue();
  });
}

async function mockAIEvaluation(page: any, taskType: 'text' | 'writing' | 'speaking', score: number = 85) {
  await page.route(`**/api/ai/evaluate-${taskType}**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        overallScore: score,
        rubricScores: {
          grammar: score - 5,
          vocabulary: score,
          content: score + 5,
        },
        strengths: ['Good effort', 'Clear communication'],
        improvements: ['Practice more', 'Expand vocabulary'],
        culturalNotes: 'Well connected to local context',
      }),
    });
  });
}

async function checkAgeAdaptiveStyles(page: any, ageGroup: '10-12' | '13-15' | '16-18') {
  const isElementary = ageGroup === '10-12';
  const isSecondary = ageGroup === '16-18';
  
  if (isElementary) {
    // Check gamified elements
    await expect(page.locator('[data-testid="achievement-stars"]')).toBeVisible();
    await expect(page.locator('[data-testid="celebration-animation"]')).toBeVisible();
  } else if (isSecondary) {
    // Check productivity focus
    await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="detailed-progress"]')).toBeVisible();
  }
}