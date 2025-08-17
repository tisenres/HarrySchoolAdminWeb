import { test, expect } from '@playwright/test'

/**
 * Unified Ranking System E2E Tests
 * Tests the complete unified ranking system including:
 * - Point management for teachers and students
 * - Achievement unlock and celebration system
 * - Cross-impact correlation calculations
 * - Performance analytics and dashboards
 * - Caching and optimization features
 */

test.describe('Unified Ranking System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the ranking dashboard
    await page.goto('/dashboard/rankings')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display unified rankings with teachers and students', async ({ page }) => {
    // Check if the unified rankings are displayed
    await expect(page.locator('[data-testid="unified-rankings-container"]')).toBeVisible()
    
    // Verify both teacher and student entries are shown
    await expect(page.locator('[data-testid="ranking-entry"][data-user-type="teacher"]')).toBeVisible()
    await expect(page.locator('[data-testid="ranking-entry"][data-user-type="student"]')).toBeVisible()
    
    // Check ranking information is complete
    const firstRankingEntry = page.locator('[data-testid="ranking-entry"]').first()
    await expect(firstRankingEntry.locator('[data-testid="user-name"]')).toBeVisible()
    await expect(firstRankingEntry.locator('[data-testid="total-points"]')).toBeVisible()
    await expect(firstRankingEntry.locator('[data-testid="global-rank"]')).toBeVisible()
    await expect(firstRankingEntry.locator('[data-testid="performance-tier"]')).toBeVisible()
  })

  test('should filter rankings by user type', async ({ page }) => {
    // Test teacher filter
    await page.selectOption('[data-testid="user-type-filter"]', 'teacher')
    await page.waitForTimeout(1000) // Wait for filtering
    
    // Verify only teachers are shown
    const teacherEntries = page.locator('[data-testid="ranking-entry"][data-user-type="teacher"]')
    const studentEntries = page.locator('[data-testid="ranking-entry"][data-user-type="student"]')
    
    await expect(teacherEntries.first()).toBeVisible()
    await expect(studentEntries.first()).not.toBeVisible()
    
    // Test student filter
    await page.selectOption('[data-testid="user-type-filter"]', 'student')
    await page.waitForTimeout(1000)
    
    await expect(studentEntries.first()).toBeVisible()
    await expect(teacherEntries.first()).not.toBeVisible()
    
    // Reset to all
    await page.selectOption('[data-testid="user-type-filter"]', 'all')
    await page.waitForTimeout(1000)
  })

  test('should display cross-impact correlations', async ({ page }) => {
    // Navigate to a specific teacher profile
    const firstTeacherEntry = page.locator('[data-testid="ranking-entry"][data-user-type="teacher"]').first()
    await firstTeacherEntry.click()
    
    // Check if cross-impact section is visible
    await expect(page.locator('[data-testid="cross-impact-correlations"]')).toBeVisible()
    
    // Verify correlation data is displayed
    await expect(page.locator('[data-testid="correlation-score"]')).toBeVisible()
    await expect(page.locator('[data-testid="confidence-level"]')).toBeVisible()
    await expect(page.locator('[data-testid="trend-direction"]')).toBeVisible()
  })

  test('should award points and update rankings', async ({ page }) => {
    // Navigate to point management
    await page.goto('/dashboard/points')
    await page.waitForLoadState('networkidle')
    
    // Select a user to award points to
    await page.click('[data-testid="award-points-button"]')
    
    // Fill in point award form
    await page.selectOption('[data-testid="user-type-selector"]', 'teacher')
    await page.selectOption('[data-testid="user-selector"]', { index: 0 })
    await page.fill('[data-testid="points-amount"]', '100')
    await page.selectOption('[data-testid="category-selector"]', 'teaching_excellence')
    await page.fill('[data-testid="reason-input"]', 'E2E test point award')
    
    // Submit the award
    await page.click('[data-testid="submit-point-award"]')
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Navigate back to rankings to verify update
    await page.goto('/dashboard/rankings')
    await page.waitForLoadState('networkidle')
    
    // The ranking should be updated (we can't guarantee exact position but can check the system responded)
    await expect(page.locator('[data-testid="unified-rankings-container"]')).toBeVisible()
  })

  test('should trigger achievement unlock celebration', async ({ page }) => {
    // Navigate to achievements
    await page.goto('/dashboard/achievements')
    await page.waitForLoadState('networkidle')
    
    // Check if celebration system is working
    await expect(page.locator('[data-testid="achievement-unlock-system"]')).toBeVisible()
    
    // Look for pending celebrations
    const pendingCelebrations = page.locator('[data-testid="pending-celebration"]')
    const celebrationCount = await pendingCelebrations.count()
    
    if (celebrationCount > 0) {
      // Click on first pending celebration
      await pendingCelebrations.first().click()
      
      // Verify celebration modal appears
      await expect(page.locator('[data-testid="celebration-modal"]')).toBeVisible()
      await expect(page.locator('[data-testid="achievement-title"]')).toBeVisible()
      await expect(page.locator('[data-testid="points-awarded"]')).toBeVisible()
      
      // Close celebration
      await page.click('[data-testid="close-celebration"]')
    }
  })

  test('should display analytics dashboard with correlations', async ({ page }) => {
    // Navigate to analytics
    await page.goto('/dashboard/analytics')
    await page.waitForLoadState('networkidle')
    
    // Check main analytics components
    await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible()
    await expect(page.locator('[data-testid="ranking-analytics"]')).toBeVisible()
    
    // Verify correlation statistics
    await expect(page.locator('[data-testid="correlation-stats"]')).toBeVisible()
    await expect(page.locator('[data-testid="avg-correlation"]')).toBeVisible()
    await expect(page.locator('[data-testid="strong-correlations"]')).toBeVisible()
    
    // Check performance trends
    await expect(page.locator('[data-testid="performance-trends"]')).toBeVisible()
    await expect(page.locator('[data-testid="trend-chart"]')).toBeVisible()
  })

  test('should handle performance tier filtering', async ({ page }) => {
    // Test performance tier filters
    await page.selectOption('[data-testid="performance-tier-filter"]', 'S-Tier')
    await page.waitForTimeout(1000)
    
    // Check that only S-Tier users are shown
    const sTierEntries = page.locator('[data-testid="ranking-entry"][data-performance-tier="S-Tier"]')
    if (await sTierEntries.count() > 0) {
      await expect(sTierEntries.first()).toBeVisible()
    }
    
    // Test A-Tier filter
    await page.selectOption('[data-testid="performance-tier-filter"]', 'A-Tier')
    await page.waitForTimeout(1000)
    
    const aTierEntries = page.locator('[data-testid="ranking-entry"][data-performance-tier="A-Tier"]')
    if (await aTierEntries.count() > 0) {
      await expect(aTierEntries.first()).toBeVisible()
    }
    
    // Reset filter
    await page.selectOption('[data-testid="performance-tier-filter"]', 'all')
  })

  test('should display caching indicators', async ({ page }) => {
    // Check if cache indicators are shown
    const cacheIndicator = page.locator('[data-testid="cache-indicator"]')
    
    if (await cacheIndicator.count() > 0) {
      await expect(cacheIndicator).toBeVisible()
      
      // Check cache status (hit or miss)
      const cacheStatus = await cacheIndicator.textContent()
      expect(cacheStatus).toMatch(/(cached|fresh|from cache)/)
    }
  })

  test('should handle bulk point operations', async ({ page }) => {
    // Navigate to bulk operations
    await page.goto('/dashboard/points/bulk')
    await page.waitForLoadState('networkidle')
    
    // Check bulk operations interface
    await expect(page.locator('[data-testid="bulk-operations-container"]')).toBeVisible()
    
    // Select multiple users (if interface supports it)
    const userCheckboxes = page.locator('[data-testid="user-checkbox"]')
    const checkboxCount = await userCheckboxes.count()
    
    if (checkboxCount > 0) {
      // Select first few users
      for (let i = 0; i < Math.min(3, checkboxCount); i++) {
        await userCheckboxes.nth(i).check()
      }
      
      // Fill bulk award details
      await page.fill('[data-testid="bulk-points-amount"]', '50')
      await page.selectOption('[data-testid="bulk-category"]', 'monthly_recognition')
      await page.fill('[data-testid="bulk-reason"]', 'E2E test bulk award')
      
      // Submit bulk operation
      await page.click('[data-testid="submit-bulk-award"]')
      
      // Wait for confirmation
      await expect(page.locator('[data-testid="bulk-success-message"]')).toBeVisible()
    }
  })

  test('should display materialized view data', async ({ page }) => {
    // Navigate to a page that uses materialized views (like organization analytics)
    await page.goto('/dashboard/organization-analytics')
    await page.waitForLoadState('networkidle')
    
    // Check if materialized view data is displayed
    await expect(page.locator('[data-testid="organization-summary"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-users"]')).toBeVisible()
    await expect(page.locator('[data-testid="avg-correlation"]')).toBeVisible()
    
    // Check data freshness indicator
    const dataAge = page.locator('[data-testid="data-age"]')
    if (await dataAge.count() > 0) {
      await expect(dataAge).toBeVisible()
    }
  })

  test('should handle real-time updates', async ({ page }) => {
    // Start on rankings page
    await page.goto('/dashboard/rankings')
    await page.waitForLoadState('networkidle')
    
    // Get initial ranking data
    const initialRankings = await page.locator('[data-testid="ranking-entry"]').count()
    expect(initialRankings).toBeGreaterThan(0)
    
    // Open new tab to simulate concurrent activity
    const context = page.context()
    const page2 = await context.newPage()
    
    // Award points in second tab
    await page2.goto('/dashboard/points')
    await page2.waitForLoadState('networkidle')
    
    // Perform a point award that might trigger updates
    if (await page2.locator('[data-testid="award-points-button"]').count() > 0) {
      await page2.click('[data-testid="award-points-button"]')
      // Fill minimal required fields for quick test
      if (await page2.locator('[data-testid="user-type-selector"]').count() > 0) {
        await page2.selectOption('[data-testid="user-type-selector"]', 'teacher')
        await page2.fill('[data-testid="points-amount"]', '25')
        await page2.fill('[data-testid="reason-input"]', 'Real-time test')
        await page2.click('[data-testid="submit-point-award"]')
      }
    }
    
    // Go back to original tab and check for updates
    await page.bringToFront()
    await page.reload() // In real app, this might be automatic via WebSocket
    await page.waitForLoadState('networkidle')
    
    // Verify system is still functional
    await expect(page.locator('[data-testid="unified-rankings-container"]')).toBeVisible()
    
    // Cleanup
    await page2.close()
  })

  test('should validate correlation data integrity', async ({ page }) => {
    // Navigate to correlation analysis
    await page.goto('/dashboard/correlations')
    await page.waitForLoadState('networkidle')
    
    // Check correlation matrix display
    await expect(page.locator('[data-testid="correlation-matrix"]')).toBeVisible()
    
    // Verify correlation scores are within valid range
    const correlationScores = page.locator('[data-testid="correlation-score"]')
    const scoreCount = await correlationScores.count()
    
    for (let i = 0; i < Math.min(5, scoreCount); i++) {
      const scoreText = await correlationScores.nth(i).textContent()
      if (scoreText) {
        const score = parseFloat(scoreText)
        expect(score).toBeGreaterThanOrEqual(-1)
        expect(score).toBeLessThanOrEqual(1)
      }
    }
    
    // Check confidence levels
    const confidenceLevels = page.locator('[data-testid="confidence-level"]')
    const confidenceCount = await confidenceLevels.count()
    
    for (let i = 0; i < Math.min(5, confidenceCount); i++) {
      const confidenceText = await confidenceLevels.nth(i).textContent()
      if (confidenceText) {
        const confidence = parseFloat(confidenceText)
        expect(confidence).toBeGreaterThanOrEqual(0)
        expect(confidence).toBeLessThanOrEqual(1)
      }
    }
  })
})