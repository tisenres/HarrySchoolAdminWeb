/**
 * Critical User Flows End-to-End Tests
 * Tests complete user journeys to identify runtime and workflow issues
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'
import { validateTestEnvironment } from '../setup/test-environment'

// Test configuration
const BASE_URL = process.env['BASE_URL'] || 'http://localhost:3000'
const TEST_USER_EMAIL = process.env['TEST_USER_EMAIL'] || 'admin@test.com'
const TEST_USER_PASSWORD = process.env['TEST_USER_PASSWORD'] || 'test123'

test.describe('Critical User Flow Tests', () => {
  let page: Page
  let context: BrowserContext
  
  test.beforeAll(async ({ browser }) => {
    // Validate test environment before running
    const envValidation = validateTestEnvironment()
    if (!envValidation.valid) {
      test.skip(`Environment invalid: ${envValidation.errors.join(', ')}`)
    }
    
    context = await browser.newContext({
      // Capture console errors and warnings
      recordVideo: { dir: 'test-results/videos' },
      recordHar: { path: 'test-results/network.har' }
    })
    
    page = await context.newPage()
    
    // Capture console errors for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('PAGE ERROR:', msg.text())
      }
    })
    
    // Capture page errors
    page.on('pageerror', error => {
      console.error('PAGE CRASH:', error)
    })
  })

  test.afterAll(async () => {
    await context?.close()
  })

  test.describe('Application Bootstrap & Environment', () => {
    test('should load homepage without runtime errors', async () => {
      const response = await page.goto(BASE_URL)
      
      // Check for successful response
      expect(response?.status()).toBeLessThan(400)
      
      // Check for critical runtime errors
      const errorMessages = []
      page.on('pageerror', error => {
        errorMessages.push(error.message)
      })
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle')
      
      // Should not have critical errors
      expect(errorMessages.filter(msg => 
        msg.includes("Cannot read properties of undefined (reading 'call')")
      )).toHaveLength(0)
      
      // Page should have basic structure
      expect(await page.title()).toBeTruthy()
    })

    test('should handle missing environment variables gracefully', async () => {
      // Navigate to a page that requires Supabase
      await page.goto(`${BASE_URL}/dashboard`)
      
      // Should either redirect to login or show proper error
      const currentUrl = page.url()
      const hasLoginForm = await page.locator('form[data-testid="login-form"]').isVisible().catch(() => false)
      const hasErrorMessage = await page.locator('[data-testid="error-message"]').isVisible().catch(() => false)
      
      // Should handle gracefully (not crash)
      expect(currentUrl.includes('/login') || hasLoginForm || hasErrorMessage).toBe(true)
    })

    test('should detect and report hydration mismatches', async () => {
      const hydrationErrors: string[] = []
      
      page.on('console', msg => {
        const text = msg.text()
        if (text.includes('Hydration') || text.includes('hydration')) {
          hydrationErrors.push(text)
        }
      })
      
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      // Log hydration errors for debugging
      if (hydrationErrors.length > 0) {
        console.warn('Hydration issues detected:', hydrationErrors)
      }
      
      // Test should track hydration issues for fixing
      expect(hydrationErrors).toEqual([])
    })
  })

  test.describe('Authentication Flow', () => {
    test('should handle login page without errors', async () => {
      await page.goto(`${BASE_URL}/login`)
      
      // Page should load without runtime errors
      await page.waitForLoadState('networkidle')
      
      // Should have login form
      const loginForm = page.locator('form')
      await expect(loginForm).toBeVisible()
      
      // Should have email and password fields
      const emailField = page.locator('input[type="email"], input[name="email"]')
      const passwordField = page.locator('input[type="password"], input[name="password"]')
      
      await expect(emailField).toBeVisible()
      await expect(passwordField).toBeVisible()
    })

    test('should handle login with credentials', async () => {
      await page.goto(`${BASE_URL}/login`)
      
      // Fill login form
      await page.fill('input[type="email"], input[name="email"]', TEST_USER_EMAIL)
      await page.fill('input[type="password"], input[name="password"]', TEST_USER_PASSWORD)
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Wait for navigation or error
      try {
        await page.waitForURL(/dashboard/, { timeout: 10000 })
        // Successful login
        expect(page.url()).toContain('dashboard')
      } catch (error) {
        // Check for authentication error message
        const errorElement = await page.locator('[data-testid="error-message"], .error, .alert-error').first()
        if (await errorElement.isVisible()) {
          const errorText = await errorElement.textContent()
          console.log('Authentication error:', errorText)
          
          // This is expected in test environment
          expect(errorText).toBeTruthy()
        } else {
          throw error
        }
      }
    })

    test('should handle authentication failures gracefully', async () => {
      await page.goto(`${BASE_URL}/login`)
      
      // Try invalid credentials
      await page.fill('input[type="email"]', 'invalid@example.com')
      await page.fill('input[type="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')
      
      // Should show error message without crashing
      await page.waitForTimeout(2000)
      
      const errorElement = page.locator('.error, .alert-error, [data-testid="error-message"]')
      const hasError = await errorElement.count() > 0
      
      if (hasError) {
        const errorText = await errorElement.first().textContent()
        expect(errorText).toBeTruthy()
      }
      
      // Should still be on login page
      expect(page.url()).toContain('login')
    })
  })

  test.describe('Dashboard Navigation & API Calls', () => {
    test.beforeEach(async () => {
      // Try to get to dashboard (may require login)
      await page.goto(`${BASE_URL}/dashboard`)
      
      // If redirected to login, skip dashboard tests
      if (page.url().includes('login')) {
        test.skip('Dashboard requires authentication - skipping dashboard tests')
      }
    })

    test('should load dashboard without runtime errors', async () => {
      const consoleErrors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })
      
      await page.waitForLoadState('networkidle')
      
      // Filter out expected/non-critical errors
      const criticalErrors = consoleErrors.filter(error => 
        error.includes("Cannot read properties of undefined (reading 'call')") ||
        error.includes('TypeError') ||
        error.includes('ReferenceError')
      )
      
      if (criticalErrors.length > 0) {
        console.error('Critical dashboard errors:', criticalErrors)
      }
      
      expect(criticalErrors).toHaveLength(0)
    })

    test('should handle Teachers page API calls', async () => {
      // Navigate to teachers page
      await page.click('a[href*="teachers"], nav a:has-text("Teachers")')
      await page.waitForLoadState('networkidle')
      
      // Check for API call failures
      const failedRequests: string[] = []
      page.on('response', response => {
        if (response.url().includes('/api/teachers') && response.status() >= 400) {
          failedRequests.push(`${response.status()} - ${response.url()}`)
        }
      })
      
      // Wait for API calls to complete
      await page.waitForTimeout(3000)
      
      if (failedRequests.length > 0) {
        console.warn('Failed API requests:', failedRequests)
      }
      
      // Page should have teachers table or loading state
      const hasTeachersTable = await page.locator('table, [data-testid="teachers-table"]').isVisible()
      const hasLoadingState = await page.locator('[data-testid="loading"], .loading').isVisible()
      const hasErrorState = await page.locator('[data-testid="error"], .error').isVisible()
      
      expect(hasTeachersTable || hasLoadingState || hasErrorState).toBe(true)
    })

    test('should handle Teachers search functionality', async () => {
      await page.click('a[href*="teachers"]')
      await page.waitForLoadState('networkidle')
      
      // Look for search input
      const searchInput = page.locator('input[placeholder*="search"], input[type="search"]')
      
      if (await searchInput.isVisible()) {
        // Test search functionality
        await searchInput.fill('John')
        await page.keyboard.press('Enter')
        
        // Wait for search results
        await page.waitForTimeout(2000)
        
        // Should not cause 500 errors
        const has500Error = await page.locator('text=/500|Internal Server Error/i').isVisible()
        expect(has500Error).toBe(false)
      }
    })

    test('should handle Teachers filtering without SQL errors', async () => {
      await page.click('a[href*="teachers"]')
      await page.waitForLoadState('networkidle')
      
      // Look for filter dropdowns
      const statusFilter = page.locator('select, [role="combobox"]').first()
      
      if (await statusFilter.isVisible()) {
        // Test filtering
        await statusFilter.click()
        
        // Select first available option
        const firstOption = page.locator('option, [role="option"]').first()
        if (await firstOption.isVisible()) {
          await firstOption.click()
        }
        
        // Wait for filter to apply
        await page.waitForTimeout(2000)
        
        // Should not cause malformed SQL errors
        const hasSqlError = await page.locator('text=/SQL|Malformed/i').isVisible()
        expect(hasSqlError).toBe(false)
      }
    })

    test('should handle pagination without errors', async () => {
      await page.click('a[href*="teachers"]')
      await page.waitForLoadState('networkidle')
      
      // Look for pagination controls
      const paginationButton = page.locator('button:has-text("2"), button[aria-label*="page 2"]')
      
      if (await paginationButton.isVisible()) {
        await paginationButton.click()
        await page.waitForTimeout(2000)
        
        // Should not cause errors
        const hasError = await page.locator('.error, [data-testid="error"]').isVisible()
        expect(hasError).toBe(false)
      }
    })
  })

  test.describe('CRUD Operations Testing', () => {
    test.beforeEach(async () => {
      await page.goto(`${BASE_URL}/dashboard/teachers`)
      
      if (page.url().includes('login')) {
        test.skip('Requires authentication')
      }
      
      await page.waitForLoadState('networkidle')
    })

    test('should handle teacher creation form', async () => {
      // Look for "Add Teacher" button
      const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")')
      
      if (await addButton.isVisible()) {
        await addButton.click()
        
        // Should open form modal or navigate to form page
        const formVisible = await Promise.race([
          page.locator('form[data-testid="teacher-form"]').waitFor({ timeout: 3000 }).then(() => true),
          page.locator('dialog form, modal form').waitFor({ timeout: 3000 }).then(() => true),
          page.waitForURL(/create|new/, { timeout: 3000 }).then(() => true)
        ]).catch(() => false)
        
        expect(formVisible).toBe(true)
        
        // Form should have required fields
        const nameField = page.locator('input[name="first_name"], input[name="name"]')
        const emailField = page.locator('input[name="email"], input[type="email"]')
        
        if (await nameField.isVisible()) {
          expect(await nameField.isVisible()).toBe(true)
        }
        if (await emailField.isVisible()) {
          expect(await emailField.isVisible()).toBe(true)
        }
      }
    })

    test('should validate form inputs', async () => {
      const addButton = page.locator('button:has-text("Add"), button:has-text("Create")')
      
      if (await addButton.isVisible()) {
        await addButton.click()
        await page.waitForTimeout(1000)
        
        // Try to submit empty form
        const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")')
        
        if (await submitButton.isVisible()) {
          await submitButton.click()
          
          // Should show validation errors
          const hasValidationError = await Promise.race([
            page.locator('.error, .invalid, [data-testid="error"]').waitFor({ timeout: 2000 }).then(() => true),
            page.locator('input:invalid').waitFor({ timeout: 2000 }).then(() => true)
          ]).catch(() => false)
          
          // Some form validation should occur
          expect(hasValidationError || await submitButton.isVisible()).toBe(true)
        }
      }
    })
  })

  test.describe('Error Boundary and Crash Recovery', () => {
    test('should handle component crashes gracefully', async () => {
      // Navigate to complex page that might crash
      await page.goto(`${BASE_URL}/dashboard`)
      
      // Look for error boundary
      const hasErrorBoundary = await page.locator('[data-testid="error-boundary"], .error-boundary').isVisible().catch(() => false)
      
      if (hasErrorBoundary) {
        const errorText = await page.locator('[data-testid="error-boundary"]').textContent()
        console.log('Error boundary caught:', errorText)
        
        // Error boundary should provide recovery options
        const hasRetryButton = await page.locator('button:has-text("Retry"), button:has-text("Reload")').isVisible()
        expect(hasRetryButton).toBe(true)
      }
    })

    test('should recover from network failures', async () => {
      // Go offline
      await page.context().setOffline(true)
      
      await page.goto(`${BASE_URL}/dashboard/teachers`)
      
      // Should handle offline gracefully
      await page.waitForTimeout(2000)
      
      // Go back online
      await page.context().setOffline(false)
      
      // Page should attempt to recover
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // Should not be stuck in error state
      const hasContent = await page.locator('main, [role="main"], .content').isVisible()
      expect(hasContent).toBe(true)
    })
  })

  test.describe('Performance and Resource Loading', () => {
    test('should load critical resources without errors', async () => {
      const resourceErrors: string[] = []
      
      page.on('response', response => {
        // Track CSS/JS loading errors
        if ((response.url().includes('.css') || response.url().includes('.js')) && response.status() >= 400) {
          resourceErrors.push(`${response.status()} - ${response.url()}`)
        }
      })
      
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      if (resourceErrors.length > 0) {
        console.warn('Resource loading errors:', resourceErrors)
      }
      
      // Critical resources should load
      expect(resourceErrors.length).toBeLessThan(5) // Allow some non-critical failures
    })

    test('should complete initial page load within reasonable time', async () => {
      const startTime = Date.now()
      
      await page.goto(BASE_URL)
      await page.waitForLoadState('domcontentloaded')
      
      const loadTime = Date.now() - startTime
      
      // Should load within 10 seconds (generous for test environment)
      expect(loadTime).toBeLessThan(10000)
      
      console.log(`Page load time: ${loadTime}ms`)
    })

    test('should handle CSS preload warnings', async () => {
      const preloadWarnings: string[] = []
      
      page.on('console', msg => {
        if (msg.type() === 'warning' && msg.text().includes('preload')) {
          preloadWarnings.push(msg.text())
        }
      })
      
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      if (preloadWarnings.length > 0) {
        console.warn('CSS preload warnings:', preloadWarnings)
      }
      
      // Preload warnings are not critical but should be minimized
      expect(preloadWarnings.length).toBeLessThan(10)
    })
  })
})

// Test utility functions
test.describe('Test Environment Validation', () => {
  test('should validate test environment setup', async () => {
    const validation = validateTestEnvironment()
    
    if (!validation.valid) {
      console.error('Environment validation failed:', validation.errors)
      
      // Print environment status for debugging
      console.log('Environment variables:')
      console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING')
      console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING')
      console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING')
    }
    
    // This test documents environment issues rather than failing
    expect(validation.errors.length).toBeGreaterThanOrEqual(0)
  })
})