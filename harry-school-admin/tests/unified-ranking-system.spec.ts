import { test, expect } from '@playwright/test'

test.describe('Unified Ranking System Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/en/login')
    
    // Fill in the actual credentials
    await page.fill('input[type="email"]', 'admin@harryschool.uz')
    await page.fill('input[type="password"]', 'Admin123!')
    
    // Click sign in button
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Wait for authentication to complete and redirect
    await page.waitForURL('**/en/**', { timeout: 10000 })
    
    // Additional wait to ensure the page is fully loaded
    await page.waitForLoadState('networkidle')
  })

  test.describe('Rankings Page Navigation', () => {
    test('should navigate to rankings page from sidebar', async ({ page }) => {
      // Look for rankings link in sidebar
      await page.getByRole('link', { name: /rankings/i }).click()
      
      // Verify we're on the rankings page
      await expect(page).toHaveURL('/en/rankings')
      
      // Check for page title
      await expect(page.locator('h1')).toContainText('Rankings')
    })

    test('should display unified rankings interface with tabs', async ({ page }) => {
      await page.goto('/en/rankings')
      
      // Check for main tabs
      const expectedTabs = ['Overview', 'Leaderboards', 'Points', 'Achievements', 'Rewards', 'Analytics']
      
      for (const tabName of expectedTabs) {
        await expect(page.getByRole('tab', { name: tabName })).toBeVisible()
      }
    })

    test('should have user type filter options', async ({ page }) => {
      await page.goto('/en/rankings')
      
      // Look for user type filter dropdown
      const userTypeFilter = page.locator('[data-testid="user-type-filter"]')
      await expect(userTypeFilter).toBeVisible()
      
      // Open dropdown and check options
      await userTypeFilter.click()
      await expect(page.getByRole('option', { name: 'Students' })).toBeVisible()
      await expect(page.getByRole('option', { name: 'Teachers' })).toBeVisible()
      await expect(page.getByRole('option', { name: 'Combined' })).toBeVisible()
    })
  })

  test.describe('Teacher Performance Tab Integration', () => {
    test('should display performance tab in teacher profile', async ({ page }) => {
      // Navigate to teachers page
      await page.goto('/en/teachers')
      
      // Wait for teachers to load and click on first teacher
      await page.waitForSelector('[data-testid="teachers-table"]')
      const firstTeacherRow = page.locator('[data-testid="teacher-row"]').first()
      await firstTeacherRow.click()
      
      // Check for performance tab
      await expect(page.getByRole('tab', { name: 'Performance' })).toBeVisible()
    })

    test('should show performance metrics when performance tab is clicked', async ({ page }) => {
      await page.goto('/en/teachers')
      
      // Navigate to teacher profile
      await page.waitForSelector('[data-testid="teachers-table"]')
      const firstTeacherRow = page.locator('[data-testid="teacher-row"]').first()
      await firstTeacherRow.click()
      
      // Click performance tab
      await page.getByRole('tab', { name: 'Performance' }).click()
      
      // Check for performance metrics cards
      await expect(page.getByText('Overall Score')).toBeVisible()
      await expect(page.getByText('Efficiency')).toBeVisible()
      await expect(page.getByText('Quality Score')).toBeVisible()
      await expect(page.getByText('Performance Tier')).toBeVisible()
    })

    test('should have new evaluation button in performance tab', async ({ page }) => {
      await page.goto('/en/teachers')
      
      await page.waitForSelector('[data-testid="teachers-table"]')
      const firstTeacherRow = page.locator('[data-testid="teacher-row"]').first()
      await firstTeacherRow.click()
      
      await page.getByRole('tab', { name: 'Performance' }).click()
      
      // Look for New Evaluation button
      await expect(page.getByRole('button', { name: 'New Evaluation' })).toBeVisible()
    })
  })

  test.describe('Teacher Evaluation Workflow', () => {
    test('should open evaluation dialog when new evaluation is clicked', async ({ page }) => {
      await page.goto('/en/teachers')
      
      await page.waitForSelector('[data-testid="teachers-table"]')
      const firstTeacherRow = page.locator('[data-testid="teacher-row"]').first()
      await firstTeacherRow.click()
      
      await page.getByRole('tab', { name: 'Performance' }).click()
      await page.getByRole('button', { name: 'New Evaluation' }).click()
      
      // Check evaluation dialog opens
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByText('Teacher Performance Evaluation')).toBeVisible()
    })

    test('should display evaluation criteria with sliders', async ({ page }) => {
      await page.goto('/en/teachers')
      
      await page.waitForSelector('[data-testid="teachers-table"]')
      const firstTeacherRow = page.locator('[data-testid="teacher-row"]').first()
      await firstTeacherRow.click()
      
      await page.getByRole('tab', { name: 'Performance' }).click()
      await page.getByRole('button', { name: 'New Evaluation' }).click()
      
      // Check for evaluation criteria
      const expectedCriteria = [
        'Teaching Quality',
        'Student Performance', 
        'Professional Development',
        'Administrative Tasks',
        'Collaboration'
      ]
      
      for (const criteria of expectedCriteria) {
        await expect(page.getByText(criteria)).toBeVisible()
      }
      
      // Check for sliders
      const sliders = page.locator('input[type="range"]')
      await expect(sliders).toHaveCount(expectedCriteria.length)
    })

    test('should show performance summary as criteria are scored', async ({ page }) => {
      await page.goto('/en/teachers')
      
      await page.waitForSelector('[data-testid="teachers-table"]')
      const firstTeacherRow = page.locator('[data-testid="teacher-row"]').first()
      await firstTeacherRow.click()
      
      await page.getByRole('tab', { name: 'Performance' }).click()
      await page.getByRole('button', { name: 'New Evaluation' }).click()
      
      // Adjust first slider
      const firstSlider = page.locator('input[type="range"]').first()
      await firstSlider.fill('85')
      
      // Check performance summary updates
      await expect(page.getByText('Performance Summary')).toBeVisible()
      await expect(page.locator('[data-testid="overall-score"]')).toContainText('85')
    })
  })

  test.describe('Compensation Management Features', () => {
    test('should show compensation recommendation for high performance', async ({ page }) => {
      await page.goto('/en/teachers')
      
      await page.waitForSelector('[data-testid="teachers-table"]')
      const firstTeacherRow = page.locator('[data-testid="teacher-row"]').first()
      await firstTeacherRow.click()
      
      await page.getByRole('tab', { name: 'Performance' }).click()
      await page.getByRole('button', { name: 'New Evaluation' }).click()
      
      // Set high scores (85+) on all criteria
      const sliders = page.locator('input[type="range"]')
      for (let i = 0; i < 5; i++) {
        await sliders.nth(i).fill('90')
      }
      
      // Click auto-generate compensation
      await page.getByRole('button', { name: 'Auto-Generate' }).click()
      
      // Check compensation section appears
      await expect(page.getByText('Compensation Recommendation')).toBeVisible()
      await expect(page.getByText('Performance Bonus')).toBeVisible()
    })

    test('should navigate to compensation management from rankings', async ({ page }) => {
      await page.goto('/en/rankings')
      
      // Look for compensation/salary management section
      await page.getByRole('tab', { name: 'Analytics' }).click()
      
      // Should have teacher compensation analytics
      await expect(page.getByText(/compensation/i)).toBeVisible()
    })
  })

  test.describe('Unified Point Award System', () => {
    test('should show unified point award modal with teacher options', async ({ page }) => {
      await page.goto('/en/rankings')
      
      // Look for quick actions or point award button
      await page.getByRole('button', { name: /award points/i }).click()
      
      // Check for unified modal with user type selection
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByText('Award Points')).toBeVisible()
      
      // Check for user type selection
      await expect(page.getByText('Student')).toBeVisible()
      await expect(page.getByText('Teacher')).toBeVisible()
    })

    test('should show teacher-specific categories when teacher is selected', async ({ page }) => {
      await page.goto('/en/rankings')
      
      await page.getByRole('button', { name: /award points/i }).click()
      
      // Select teacher option
      await page.getByRole('radio', { name: 'Teacher' }).click()
      
      // Check for teacher-specific categories
      const teacherCategories = [
        'Teaching Quality',
        'Professional Development',
        'Student Mentoring',
        'Innovation'
      ]
      
      for (const category of teacherCategories) {
        await expect(page.getByText(category)).toBeVisible()
      }
    })

    test('should show salary impact for high-value teacher awards', async ({ page }) => {
      await page.goto('/en/rankings')
      
      await page.getByRole('button', { name: /award points/i }).click()
      
      // Select teacher and high-value award
      await page.getByRole('radio', { name: 'Teacher' }).click()
      
      // Select a high-value preset
      await page.getByText('Outstanding Teaching').click()
      
      // Check for salary impact warning/info
      await expect(page.getByText(/salary impact/i)).toBeVisible()
      await expect(page.getByText(/\$50/)).toBeVisible() // Expected monetary impact
    })
  })

  test.describe('Leaderboard Integration', () => {
    test('should display unified leaderboard with student and teacher options', async ({ page }) => {
      await page.goto('/en/rankings')
      
      await page.getByRole('tab', { name: 'Leaderboards' }).click()
      
      // Check for unified leaderboard
      await expect(page.getByText('Top Performers')).toBeVisible()
      
      // Check for filter options
      await expect(page.getByRole('button', { name: 'Students' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Teachers' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'All' })).toBeVisible()
    })

    test('should show different metrics for students vs teachers', async ({ page }) => {
      await page.goto('/en/rankings')
      await page.getByRole('tab', { name: 'Leaderboards' }).click()
      
      // Filter to teachers only
      await page.getByRole('button', { name: 'Teachers' }).click()
      
      // Check for teacher-specific metrics
      await expect(page.getByText('Efficiency')).toBeVisible()
      await expect(page.getByText('Quality Score')).toBeVisible()
      await expect(page.getByText('Performance Tier')).toBeVisible()
      
      // Filter to students only
      await page.getByRole('button', { name: 'Students' }).click()
      
      // Check for student-specific metrics  
      await expect(page.getByText('Level')).toBeVisible()
      await expect(page.getByText('Coins')).toBeVisible()
    })
  })
})