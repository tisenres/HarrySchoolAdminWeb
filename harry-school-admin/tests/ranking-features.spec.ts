import { test, expect } from '@playwright/test'

// Test configuration
const AUTH_EMAIL = 'admin@harryschool.uz'
const AUTH_PASSWORD = 'Admin123!'
const BASE_URL = 'http://localhost:3006'

test.describe('Complete Ranking System Integration Tests', () => {
  // Authenticate before each test
  test.beforeEach(async ({ page }) => {
    // Set base URL
    await page.goto(`${BASE_URL}/en/login`)
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded')
    
    // Fill in credentials
    await page.fill('input[type="email"]', AUTH_EMAIL)
    await page.fill('input[type="password"]', AUTH_PASSWORD)
    
    // Submit login form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Wait for successful authentication
    await page.waitForURL('**/en/**', { timeout: 15000 })
    await page.waitForLoadState('networkidle')
  })

  test.describe('1. Rankings Page Overview', () => {
    test('should load rankings page with all main components', async ({ page }) => {
      // Navigate to rankings page
      await page.goto(`${BASE_URL}/en/rankings`)
      await page.waitForLoadState('networkidle')
      
      // Check page title
      await expect(page.locator('h1')).toContainText(/rankings/i)
      
      // Check for main stats cards
      const statsCards = page.locator('.grid > .card')
      await expect(statsCards).toHaveCount(4) // Should have 4 stat cards
      
      // Verify stats cards have content
      await expect(page.getByText(/total users|total students|total teachers/i)).toBeVisible()
      await expect(page.getByText(/total points awarded/i)).toBeVisible()
      await expect(page.getByText(/active achievements/i)).toBeVisible()
      await expect(page.getByText(/average engagement/i)).toBeVisible()
    })

    test('should have all required tabs', async ({ page }) => {
      await page.goto(`${BASE_URL}/en/rankings`)
      
      // Check for all tabs
      const tabs = ['Overview', 'Leaderboards', 'Points', 'Achievements', 'Rewards', 'Analytics']
      
      for (const tab of tabs) {
        await expect(page.getByRole('tab', { name: tab })).toBeVisible()
      }
    })

    test('should switch between user type filters', async ({ page }) => {
      await page.goto(`${BASE_URL}/en/rankings`)
      
      // Find user type filter
      const filterButton = page.locator('button').filter({ hasText: /combined|students|teachers/i }).first()
      await expect(filterButton).toBeVisible()
      
      // Click to open dropdown
      await filterButton.click()
      
      // Check filter options
      await expect(page.getByRole('option', { name: /students/i })).toBeVisible()
      await expect(page.getByRole('option', { name: /teachers/i })).toBeVisible()
      await expect(page.getByRole('option', { name: /combined/i })).toBeVisible()
    })
  })

  test.describe('2. Leaderboards Tab', () => {
    test('should display leaderboard with rankings', async ({ page }) => {
      await page.goto(`${BASE_URL}/en/rankings`)
      
      // Click on Leaderboards tab
      await page.getByRole('tab', { name: 'Leaderboards' }).click()
      await page.waitForLoadState('networkidle')
      
      // Check for leaderboard content
      await expect(page.getByText(/top performers/i)).toBeVisible()
      
      // Check for filter buttons
      await expect(page.getByRole('button', { name: /students/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /teachers/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /all/i })).toBeVisible()
    })

    test('should filter leaderboard by user type', async ({ page }) => {
      await page.goto(`${BASE_URL}/en/rankings`)
      await page.getByRole('tab', { name: 'Leaderboards' }).click()
      
      // Test filtering to teachers
      await page.getByRole('button', { name: 'Teachers' }).click()
      await page.waitForTimeout(500) // Wait for filter to apply
      
      // Should show teacher-specific metrics
      await expect(page.getByText(/efficiency|quality score|performance tier/i)).toBeVisible()
      
      // Test filtering to students
      await page.getByRole('button', { name: 'Students' }).click()
      await page.waitForTimeout(500)
      
      // Should show student-specific metrics
      await expect(page.getByText(/level|coins/i)).toBeVisible()
    })
  })

  test.describe('3. Points Management Tab', () => {
    test('should display points management interface', async ({ page }) => {
      await page.goto(`${BASE_URL}/en/rankings`)
      
      // Click on Points tab
      await page.getByRole('tab', { name: 'Points' }).click()
      await page.waitForLoadState('networkidle')
      
      // Check for points management components
      await expect(page.locator('text=/points management|point system/i')).toBeVisible()
      
      // Check for award points button
      const awardButton = page.getByRole('button', { name: /award points/i })
      if (await awardButton.isVisible()) {
        await awardButton.click()
        
        // Check modal opens
        await expect(page.getByRole('dialog')).toBeVisible()
        await expect(page.getByText(/award points/i)).toBeVisible()
        
        // Close modal
        await page.keyboard.press('Escape')
      }
    })
  })

  test.describe('4. Achievements Tab', () => {
    test('should display achievements management', async ({ page }) => {
      await page.goto(`${BASE_URL}/en/rankings`)
      
      // Click on Achievements tab
      await page.getByRole('tab', { name: 'Achievements' }).click()
      await page.waitForLoadState('networkidle')
      
      // Check for achievements content
      await expect(page.locator('text=/achievement|badge/i')).toBeVisible()
      
      // Check for create achievement button if exists
      const createButton = page.getByRole('button', { name: /create|add.*achievement/i })
      if (await createButton.isVisible()) {
        await expect(createButton).toBeVisible()
      }
    })
  })

  test.describe('5. Rewards Tab', () => {
    test('should display rewards catalog', async ({ page }) => {
      await page.goto(`${BASE_URL}/en/rankings`)
      
      // Click on Rewards tab
      await page.getByRole('tab', { name: 'Rewards' }).click()
      await page.waitForLoadState('networkidle')
      
      // Check for rewards content
      await expect(page.locator('text=/reward|catalog|redeem/i')).toBeVisible()
      
      // Check for rewards management buttons
      const addRewardButton = page.getByRole('button', { name: /add.*reward|create.*reward/i })
      if (await addRewardButton.isVisible()) {
        await expect(addRewardButton).toBeVisible()
      }
    })
  })

  test.describe('6. Analytics Tab', () => {
    test('should display analytics dashboard', async ({ page }) => {
      await page.goto(`${BASE_URL}/en/rankings`)
      
      // Click on Analytics tab
      await page.getByRole('tab', { name: 'Analytics' }).click()
      await page.waitForLoadState('networkidle')
      
      // Check for analytics content
      await expect(page.locator('text=/analytics|performance|metrics|statistics/i')).toBeVisible()
      
      // Check for charts or data visualizations
      const charts = page.locator('canvas, svg').filter({ has: page.locator('*') })
      const tables = page.locator('table')
      
      // Should have either charts or tables
      const hasVisualization = (await charts.count()) > 0 || (await tables.count()) > 0
      expect(hasVisualization).toBeTruthy()
    })
  })

  test.describe('7. Teacher Performance Integration', () => {
    test('should navigate to teacher profile and show performance tab', async ({ page }) => {
      // Navigate to teachers page
      await page.goto(`${BASE_URL}/en/teachers`)
      await page.waitForLoadState('networkidle')
      
      // Wait for teachers table to load
      await page.waitForSelector('table', { timeout: 10000 })
      
      // Click on first teacher if available
      const teacherRows = page.locator('tbody tr')
      const rowCount = await teacherRows.count()
      
      if (rowCount > 0) {
        // Click on the first teacher row
        await teacherRows.first().click()
        await page.waitForLoadState('networkidle')
        
        // Check for Performance tab
        const performanceTab = page.getByRole('tab', { name: 'Performance' })
        if (await performanceTab.isVisible()) {
          await performanceTab.click()
          
          // Check for performance metrics
          await expect(page.getByText(/overall score|efficiency|quality score/i)).toBeVisible()
          
          // Check for New Evaluation button
          await expect(page.getByRole('button', { name: /new evaluation/i })).toBeVisible()
        }
      }
    })

    test('should open teacher evaluation dialog', async ({ page }) => {
      await page.goto(`${BASE_URL}/en/teachers`)
      await page.waitForLoadState('networkidle')
      
      const teacherRows = page.locator('tbody tr')
      const rowCount = await teacherRows.count()
      
      if (rowCount > 0) {
        await teacherRows.first().click()
        await page.waitForLoadState('networkidle')
        
        const performanceTab = page.getByRole('tab', { name: 'Performance' })
        if (await performanceTab.isVisible()) {
          await performanceTab.click()
          
          // Click New Evaluation
          const evalButton = page.getByRole('button', { name: /new evaluation/i })
          if (await evalButton.isVisible()) {
            await evalButton.click()
            
            // Check evaluation dialog opens
            await expect(page.getByRole('dialog')).toBeVisible()
            await expect(page.getByText(/teacher.*evaluation|performance.*evaluation/i)).toBeVisible()
            
            // Check for evaluation criteria
            await expect(page.getByText(/teaching quality/i)).toBeVisible()
            await expect(page.getByText(/student performance/i)).toBeVisible()
          }
        }
      }
    })
  })

  test.describe('8. Supabase Integration Verification', () => {
    test('should fetch data from Supabase when changing tabs', async ({ page }) => {
      await page.goto(`${BASE_URL}/en/rankings`)
      
      // Monitor network requests to Supabase
      const supabaseRequests: string[] = []
      page.on('request', request => {
        const url = request.url()
        if (url.includes('supabase') || url.includes('/api/')) {
          supabaseRequests.push(url)
        }
      })
      
      // Click through tabs to trigger API calls
      await page.getByRole('tab', { name: 'Leaderboards' }).click()
      await page.waitForTimeout(1000)
      
      await page.getByRole('tab', { name: 'Points' }).click()
      await page.waitForTimeout(1000)
      
      await page.getByRole('tab', { name: 'Achievements' }).click()
      await page.waitForTimeout(1000)
      
      // Verify API calls were made
      console.log('API/Supabase requests made:', supabaseRequests.length)
      expect(supabaseRequests.length).toBeGreaterThan(0)
    })

    test('should handle loading states properly', async ({ page }) => {
      await page.goto(`${BASE_URL}/en/rankings`)
      
      // Look for loading indicators
      const loadingIndicators = page.locator('.animate-pulse, .animate-spin, [role="progressbar"]')
      
      // Initially might show loading
      if (await loadingIndicators.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        // Wait for loading to complete
        await expect(loadingIndicators.first()).toBeHidden({ timeout: 10000 })
      }
      
      // Content should be visible after loading
      await expect(page.locator('h1')).toBeVisible()
    })
  })

  test.describe('9. Quick Actions and Point Awards', () => {
    test('should open unified point award modal', async ({ page }) => {
      await page.goto(`${BASE_URL}/en/rankings`)
      
      // Look for quick actions or award points button
      const awardButton = page.getByRole('button', { name: /award.*points|quick.*action/i }).first()
      
      if (await awardButton.isVisible()) {
        await awardButton.click()
        
        // Check modal opens
        await expect(page.getByRole('dialog')).toBeVisible()
        
        // Check for user type selection
        const studentOption = page.getByText('Student')
        const teacherOption = page.getByText('Teacher')
        
        if (await studentOption.isVisible() && await teacherOption.isVisible()) {
          // Test teacher selection
          await teacherOption.click()
          
          // Should show teacher-specific categories
          await expect(page.getByText(/teaching quality|professional development/i)).toBeVisible()
        }
        
        // Close modal
        await page.keyboard.press('Escape')
      }
    })
  })

  test.describe('10. Data Persistence and Real-time Updates', () => {
    test('should persist filter selections when switching tabs', async ({ page }) => {
      await page.goto(`${BASE_URL}/en/rankings`)
      
      // Set filter to Teachers
      const filterButton = page.locator('button').filter({ hasText: /combined|students|teachers/i }).first()
      await filterButton.click()
      await page.getByRole('option', { name: /teachers/i }).click()
      
      // Switch tabs
      await page.getByRole('tab', { name: 'Leaderboards' }).click()
      await page.waitForTimeout(500)
      
      // Switch back
      await page.getByRole('tab', { name: 'Overview' }).click()
      
      // Filter should still be Teachers
      await expect(filterButton).toContainText(/teachers/i)
    })

    test('should update URL params when changing tabs', async ({ page }) => {
      await page.goto(`${BASE_URL}/en/rankings`)
      
      // Click on Leaderboards tab
      await page.getByRole('tab', { name: 'Leaderboards' }).click()
      
      // URL should contain tab parameter
      await expect(page).toHaveURL(/tab=leaderboards/i)
      
      // Click on Analytics tab
      await page.getByRole('tab', { name: 'Analytics' }).click()
      
      // URL should update
      await expect(page).toHaveURL(/tab=analytics/i)
    })
  })
})

// Performance and Error Handling Tests
test.describe('Error Handling and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/en/login`)
    await page.fill('input[type="email"]', AUTH_EMAIL)
    await page.fill('input[type="password"]', AUTH_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/en/**', { timeout: 15000 })
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Navigate to rankings
    await page.goto(`${BASE_URL}/en/rankings`)
    
    // Simulate offline mode
    await page.context().setOffline(true)
    
    // Try to switch tabs
    await page.getByRole('tab', { name: 'Leaderboards' }).click()
    
    // Should show error message or cached data
    const errorMessage = page.getByText(/error|offline|failed|cached/i)
    const hasContent = await page.locator('table, .card').count()
    
    // Should either show error or have cached content
    const handlesError = await errorMessage.isVisible().catch(() => false) || hasContent > 0
    expect(handlesError).toBeTruthy()
    
    // Restore connection
    await page.context().setOffline(false)
  })

  test('should handle empty data states', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/rankings`)
    
    // Check each tab for empty state handling
    const tabs = ['Leaderboards', 'Points', 'Achievements', 'Rewards']
    
    for (const tab of tabs) {
      await page.getByRole('tab', { name: tab }).click()
      await page.waitForTimeout(500)
      
      // Should either show data or empty state message
      const hasData = await page.locator('table tbody tr, .card').count() > 0
      const hasEmptyState = await page.getByText(/no.*found|empty|create.*first/i).isVisible().catch(() => false)
      
      expect(hasData || hasEmptyState).toBeTruthy()
    }
  })
})