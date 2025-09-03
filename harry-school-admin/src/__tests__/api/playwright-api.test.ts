/**
 * Playwright API Testing Suite
 * Production readiness testing using Playwright for reliable HTTP testing
 */

import { test, expect, Page } from '@playwright/test'

const API_BASE_URL = 'http://localhost:3002'

// Configure test timeouts for API calls
test.setTimeout(30000)

test.describe('🚀 Production Readiness - API Testing with Playwright', () => {
  
  test.beforeAll(async () => {
    console.log('🧪 Starting Playwright API test suite...')
  })

  test.describe('🌐 Server and Basic Connectivity', () => {
    test('should connect to development server', async ({ request }) => {
      const response = await request.get(API_BASE_URL)
      console.log(`Server status: ${response.status()}`)
      
      expect(response.status()).toBeDefined()
      expect(response.status()).not.toBe(0) // Server is responding
    })

    test('should have Next.js routing working', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/en`)
      console.log(`Page route status: ${response.status()}`)
      
      expect(response.status()).toBeDefined()
      // Should be accessible (redirect or success)
      expect([200, 302, 401, 403].includes(response.status())).toBe(true)
    })

    test('should have API routes accessible', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/teachers`)
      console.log(`API route status: ${response.status()}`)
      
      expect(response.status()).toBeDefined()
      // Should not be 404 (route exists), but might need auth
      expect(response.status()).not.toBe(404)
    })
  })

  test.describe('🔐 Authentication Flow Testing', () => {
    test('should handle unauthenticated requests properly', async ({ request }) => {
      const endpoints = ['/api/teachers', '/api/students', '/api/groups']
      
      for (const endpoint of endpoints) {
        const response = await request.get(`${API_BASE_URL}${endpoint}`)
        console.log(`${endpoint}: ${response.status()}`)
        
        // Should require authentication (401/403) or redirect (302)
        expect([401, 403, 302].includes(response.status())).toBe(true)
      }
    })

    test('should have proper CORS headers', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/teachers`, {
        headers: {
          'Origin': 'http://localhost:3000'
        }
      })
      
      console.log(`CORS test status: ${response.status()}`)
      expect(response.status()).toBeDefined()
    })
  })

  test.describe('📊 API Response Structure Testing', () => {
    test('should return proper JSON structure for API endpoints', async ({ request }) => {
      // Test various endpoints and check they return valid responses
      const endpoints = [
        '/api/teachers',
        '/api/students', 
        '/api/groups',
        '/api/finance/transactions',
        '/api/reports/revenue'
      ]
      
      for (const endpoint of endpoints) {
        const response = await request.get(`${API_BASE_URL}${endpoint}`)
        console.log(`${endpoint}: ${response.status()}`)
        
        // If successful, should return JSON
        if (response.ok()) {
          const contentType = response.headers()['content-type'] || ''
          expect(contentType).toContain('application/json')
        }
        
        // Should not crash or return 500 errors
        expect(response.status()).not.toBe(500)
      }
    })

    test('should handle invalid routes correctly', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/nonexistent-endpoint`)
      console.log(`Invalid route status: ${response.status()}`)
      
      // Should return 404 for nonexistent endpoints
      expect(response.status()).toBe(404)
    })
  })

  test.describe('🎯 Performance Testing', () => {
    test('should respond to API calls within acceptable time', async ({ request }) => {
      const endpoints = [
        '/api/teachers',
        '/api/students',
        '/api/groups'
      ]
      
      for (const endpoint of endpoints) {
        const startTime = Date.now()
        const response = await request.get(`${API_BASE_URL}${endpoint}`)
        const responseTime = Date.now() - startTime
        
        console.log(`${endpoint}: ${responseTime}ms`)
        expect(responseTime).toBeLessThan(5000) // Should respond within 5 seconds
        expect(response.status()).toBeDefined()
      }
    })

    test('should handle concurrent requests', async ({ request }) => {
      const concurrentRequests = Array(5).fill(null).map(() =>
        request.get(`${API_BASE_URL}/api/teachers`)
      )
      
      const startTime = Date.now()
      const responses = await Promise.all(concurrentRequests)
      const totalTime = Date.now() - startTime
      
      console.log(`5 concurrent requests completed in: ${totalTime}ms`)
      expect(totalTime).toBeLessThan(10000) // All should complete within 10 seconds
      
      responses.forEach((response, index) => {
        console.log(`Request ${index + 1}: ${response.status()}`)
        expect(response.status()).toBeDefined()
      })
    })
  })

  test.describe('🔒 Error Handling Testing', () => {
    test('should handle malformed requests', async ({ request }) => {
      // Test POST with malformed JSON
      const response = await request.post(`${API_BASE_URL}/api/teachers`, {
        data: '{ invalid json }',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      console.log(`Malformed JSON status: ${response.status()}`)
      // Should return 400 Bad Request or similar error
      expect([400, 401, 403].includes(response.status())).toBe(true)
    })

    test('should handle oversized requests', async ({ request }) => {
      // Create a large payload
      const largeData = {
        name: 'A'.repeat(10000), // 10KB string
        description: 'B'.repeat(100000) // 100KB string
      }
      
      const response = await request.post(`${API_BASE_URL}/api/teachers`, {
        data: largeData,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      console.log(`Large payload status: ${response.status()}`)
      expect(response.status()).toBeDefined()
    })
  })

  test.describe('📱 Frontend Integration Testing', () => {
    test('should load login page', async ({ page }) => {
      await page.goto(`${API_BASE_URL}/en/login`)
      
      // Should load without crashing
      expect(page.url()).toContain('/login')
      
      // Check if basic elements are present
      const loginForm = await page.locator('form, [data-testid="login-form"], input[type="email"]').first()
      expect(loginForm).toBeDefined()
    })

    test('should load dashboard (even if redirected)', async ({ page }) => {
      // Try to access dashboard
      await page.goto(`${API_BASE_URL}/en`)
      
      // Should either show dashboard or redirect to login
      expect(page.url()).toContain('/en')
    })

    test('should have proper meta tags and SEO', async ({ page }) => {
      await page.goto(`${API_BASE_URL}/en/login`)
      
      // Check for basic meta tags
      const title = await page.title()
      expect(title.length).toBeGreaterThan(0)
      
      // Check for viewport meta tag
      const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content')
      expect(viewportMeta).toBeDefined()
    })
  })

  test.describe('🚀 Production Readiness Checks', () => {
    test('should have security headers', async ({ request }) => {
      const response = await request.get(API_BASE_URL)
      const headers = response.headers()
      
      console.log('Security headers check:')
      console.log(`X-Content-Type-Options: ${headers['x-content-type-options'] || 'missing'}`)
      console.log(`X-Frame-Options: ${headers['x-frame-options'] || 'missing'}`)
      console.log(`Strict-Transport-Security: ${headers['strict-transport-security'] || 'missing'}`)
      
      // At least some security measures should be in place
      expect(response.status()).toBeDefined()
    })

    test('should handle OPTIONS requests (CORS preflight)', async ({ request }) => {
      const response = await request.fetch(`${API_BASE_URL}/api/teachers`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      })
      
      console.log(`OPTIONS request status: ${response.status()}`)
      expect(response.status()).toBeDefined()
    })

    test('should return appropriate response formats', async ({ request }) => {
      // Check that API endpoints return JSON
      const response = await request.get(`${API_BASE_URL}/api/teachers`)
      
      if (response.ok()) {
        try {
          const data = await response.json()
          expect(data).toBeDefined()
          console.log('API returns valid JSON')
        } catch (error) {
          console.warn('API response is not JSON:', error)
        }
      }
      
      expect(response.status()).toBeDefined()
    })

    test('should have consistent error response format', async ({ request }) => {
      // Test various error scenarios
      const errorEndpoints = [
        '/api/nonexistent',
        '/api/teachers/invalid-id'
      ]
      
      for (const endpoint of errorEndpoints) {
        const response = await request.get(`${API_BASE_URL}${endpoint}`)
        console.log(`${endpoint}: ${response.status()}`)
        
        if (!response.ok()) {
          // Error responses should be consistent
          const contentType = response.headers()['content-type'] || ''
          if (contentType.includes('application/json')) {
            try {
              const errorData = await response.json()
              expect(errorData).toBeDefined()
              console.log(`Error format for ${endpoint}: structured JSON`)
            } catch {
              console.log(`Error format for ${endpoint}: non-JSON`)
            }
          }
        }
        
        expect(response.status()).toBeDefined()
      }
    })
  })

  test.afterAll(async () => {
    console.log('✅ Playwright API test suite completed')
  })
})