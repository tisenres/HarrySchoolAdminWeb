import { test as setup, expect } from '@playwright/test'

const authFile = 'tests/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/en/login')
  
  // Handle authentication - Skip for now and use manual session
  // This would normally handle the login flow, but for demo purposes,
  // we'll create a mock authenticated state
  
  // Mock authentication by setting up the session storage/cookies
  await page.addInitScript(() => {
    // Mock authentication state
    localStorage.setItem('supabase.auth.token', JSON.stringify({
      access_token: 'mock_access_token',
      user: {
        id: 'test-user-id',
        email: 'test@harryschool.com',
        role: 'admin'
      }
    }))
  })
  
  // Try to navigate to the students page directly
  await page.goto('/en/students')
  
  // Wait a bit for any redirects to settle
  await page.waitForTimeout(2000)
  
  // Save authentication state
  await page.context().storageState({ path: authFile })
})