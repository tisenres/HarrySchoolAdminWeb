import { test, expect } from '@playwright/test'

/**
 * E2E tests to demonstrate and verify the student page issues
 * These tests should FAIL initially, then PASS after fixes are implemented
 */

test.describe('Student Page Issues - TDD Approach', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the students page
    await page.goto('/en/students')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test.describe('Search Debouncing Issue', () => {
    test('should debounce search input and not make excessive API calls', async ({ page }) => {
      // Monitor API calls
      const apiCalls: string[] = []
      
      page.on('request', request => {
        if (request.url().includes('/api/students') && request.url().includes('query=')) {
          apiCalls.push(request.url())
        }
      })

      // Find search input
      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first()
      
      // Type rapidly (should not trigger multiple API calls)
      await searchInput.fill('')
      await searchInput.type('J', { delay: 50 })
      await searchInput.type('o', { delay: 50 })
      await searchInput.type('h', { delay: 50 })
      await searchInput.type('n', { delay: 50 })

      // Wait a short time (less than debounce delay)
      await page.waitForTimeout(300)

      // Should not have made API calls yet
      expect(apiCalls.length).toBe(0)

      // Wait for debounce to complete
      await page.waitForTimeout(300)

      // Should have made exactly one API call after debounce
      await expect(() => {
        expect(apiCalls.length).toBe(1)
        expect(apiCalls[0]).toContain('query=John')
      }).toPass({ timeout: 2000 })
    })

    test('should reset timer on rapid typing', async ({ page }) => {
      const apiCalls: string[] = []
      
      page.on('request', request => {
        if (request.url().includes('/api/students') && request.url().includes('query=')) {
          apiCalls.push(request.url())
        }
      })

      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first()
      
      // Type first character
      await searchInput.fill('J')
      
      // Wait 300ms (less than 500ms debounce)
      await page.waitForTimeout(300)
      
      // Type more before debounce completes
      await searchInput.fill('Jane')
      
      // Wait another 300ms
      await page.waitForTimeout(300)
      
      // Should not have made API call for 'J'
      const jCalls = apiCalls.filter(call => call.includes('query=J') && !call.includes('Jane'))
      expect(jCalls.length).toBe(0)
      
      // Wait for full debounce
      await page.waitForTimeout(300)
      
      // Should have made call for 'Jane'
      await expect(() => {
        const janeCalls = apiCalls.filter(call => call.includes('query=Jane'))
        expect(janeCalls.length).toBe(1)
      }).toPass({ timeout: 2000 })
    })
  })

  test.describe('Checkbox Interaction Issue', () => {
    test('should handle checkbox clicks without triggering navigation', async ({ page }) => {
      // Wait for students to load
      await page.waitForSelector('table tbody tr', { timeout: 10000 })
      
      // Get current URL
      const initialUrl = page.url()
      
      // Find first checkbox in table
      const firstCheckbox = page.locator('table tbody tr:first-child input[type="checkbox"]')
      
      // Click the checkbox
      await firstCheckbox.click()
      
      // Wait a moment for any potential navigation
      await page.waitForTimeout(500)
      
      // URL should not have changed (no navigation)
      expect(page.url()).toBe(initialUrl)
      
      // Checkbox should be checked
      await expect(firstCheckbox).toBeChecked()
    })

    test('should allow row click for navigation but not checkbox click', async ({ page }) => {
      await page.waitForSelector('table tbody tr', { timeout: 10000 })
      
      const firstRow = page.locator('table tbody tr:first-child')
      const firstCheckbox = firstRow.locator('input[type="checkbox"]')
      const firstNameCell = firstRow.locator('td').nth(1) // Assuming name is second column
      
      // Click checkbox should not navigate
      const initialUrl = page.url()
      await firstCheckbox.click()
      await page.waitForTimeout(500)
      expect(page.url()).toBe(initialUrl)
      
      // Click name cell should navigate
      await firstNameCell.click()
      await page.waitForTimeout(1000)
      
      // Should have navigated to student detail page
      expect(page.url()).toContain('/students/')
      expect(page.url()).not.toBe(initialUrl)
    })

    test('should handle multiple checkbox selections', async ({ page }) => {
      await page.waitForSelector('table tbody tr', { timeout: 10000 })
      
      const checkboxes = page.locator('table tbody tr input[type="checkbox"]')
      const checkboxCount = await checkboxes.count()
      
      if (checkboxCount > 0) {
        // Select first checkbox
        await checkboxes.nth(0).click()
        await expect(checkboxes.nth(0)).toBeChecked()
        
        if (checkboxCount > 1) {
          // Select second checkbox
          await checkboxes.nth(1).click()
          await expect(checkboxes.nth(1)).toBeChecked()
          
          // Both should remain checked
          await expect(checkboxes.nth(0)).toBeChecked()
          await expect(checkboxes.nth(1)).toBeChecked()
        }
      }
    })
  })

  test.describe('Table Scrolling Issue', () => {
    test('should have scrollable table container', async ({ page }) => {
      await page.waitForSelector('table', { timeout: 10000 })
      
      // Find the table container
      const tableContainer = page.locator('table').locator('xpath=..') // Parent element
      
      // Check if container has scroll styles
      const overflow = await tableContainer.evaluate(el => {
        const styles = window.getComputedStyle(el)
        return {
          overflow: styles.overflow,
          overflowX: styles.overflowX,
          overflowY: styles.overflowY
        }
      })
      
      // Should have some form of scrolling enabled
      const hasScroll = overflow.overflow === 'auto' || 
                       overflow.overflow === 'scroll' ||
                       overflow.overflowX === 'auto' ||
                       overflow.overflowX === 'scroll' ||
                       overflow.overflowY === 'auto' ||
                       overflow.overflowY === 'scroll'
      
      expect(hasScroll).toBe(true)
    })

    test('should maintain table structure with large datasets', async ({ page }) => {
      await page.waitForSelector('table', { timeout: 10000 })
      
      // Check table has proper structure
      const table = page.locator('table')
      const thead = table.locator('thead')
      const tbody = table.locator('tbody')
      
      await expect(thead).toBeVisible()
      await expect(tbody).toBeVisible()
      
      // Check headers are present
      const headers = thead.locator('th')
      const headerCount = await headers.count()
      expect(headerCount).toBeGreaterThan(0)
    })
  })

  test.describe('Individual Student API Issue', () => {
    test('should load individual student page without 500 errors', async ({ page }) => {
      // First navigate to students list
      await page.goto('/en/students')
      await page.waitForSelector('table tbody tr', { timeout: 10000 })
      
      // Get first student link/button
      const firstStudentLink = page.locator('table tbody tr:first-child a, table tbody tr:first-child button').first()
      
      if (await firstStudentLink.count() > 0) {
        // Monitor network responses
        const responses: { url: string; status: number }[] = []
        
        page.on('response', response => {
          if (response.url().includes('/api/students/')) {
            responses.push({
              url: response.url(),
              status: response.status()
            })
          }
        })
        
        // Click to navigate to student detail
        await firstStudentLink.click()
        
        // Wait for page to load
        await page.waitForLoadState('networkidle')
        
        // Check that we're on a student detail page
        expect(page.url()).toContain('/students/')
        
        // Wait for any API calls to complete
        await page.waitForTimeout(2000)
        
        // Check for any 500 errors
        const serverErrors = responses.filter(r => r.status >= 500)
        expect(serverErrors.length).toBe(0)
        
        // Should have successful API responses
        const successfulCalls = responses.filter(r => r.status < 400)
        expect(successfulCalls.length).toBeGreaterThan(0)
      }
    })

    test('should handle direct navigation to student detail page', async ({ page }) => {
      // Try to navigate directly to a student detail page
      // This should either work or return 404, but not 500
      const responses: number[] = []
      
      page.on('response', response => {
        if (response.url().includes('/api/students/')) {
          responses.push(response.status())
        }
      })
      
      // Navigate to a specific student (using a common test ID)
      await page.goto('/en/students/test-student-id')
      
      // Wait for network activity
      await page.waitForTimeout(3000)
      
      // Should not have any 500 errors
      const serverErrors = responses.filter(status => status >= 500)
      expect(serverErrors.length).toBe(0)
    })
  })

  test.describe('Overall Page Functionality', () => {
    test('should load students page without errors', async ({ page }) => {
      const consoleErrors: string[] = []
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })
      
      await page.goto('/en/students')
      await page.waitForLoadState('networkidle')
      
      // Should not have console errors
      const significantErrors = consoleErrors.filter(error => 
        !error.includes('favicon') && // Ignore favicon errors
        !error.includes('chunk') // Ignore chunk loading errors in dev
      )
      
      expect(significantErrors.length).toBe(0)
    })

    test('should display key UI elements', async ({ page }) => {
      await page.goto('/en/students')
      await page.waitForLoadState('networkidle')
      
      // Should have main content
      await expect(page.locator('table')).toBeVisible({ timeout: 10000 })
      
      // Should have search functionality
      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first()
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible()
      }
    })
  })
})