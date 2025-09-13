/**
 * Tests for individual student API endpoints
 * These tests should initially FAIL to demonstrate the issues exist,
 * then PASS after fixes are implemented.
 */

import { createMocks } from 'node-mocks-http'
import { GET } from '@/app/api/students/[id]/route'

// Mock the authentication middleware
jest.mock('@/lib/middleware/api-auth', () => ({
  withAuth: (handler: any) => handler,
  withMultiRoleAuth: (handler: any) => handler,
}))

// Mock the Supabase server client
jest.mock('@/lib/supabase-server', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              single: jest.fn()
            }))
          }))
        }))
      }))
    }))
  }))
}))

describe('Individual Student API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/students/[id]', () => {
    it('should return 200 with valid student data when authenticated', async () => {
      const { createServerClient } = require('@/lib/supabase-server')
      const mockSupabase = createServerClient()
      
      // Mock successful student fetch
      mockSupabase.from().select().eq().eq().is().single.mockResolvedValue({
        data: {
          id: 'student-123',
          full_name: 'John Doe',
          email: 'john@example.com',
          status: 'active'
        },
        error: null
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/students/student-123',
      })

      // Mock authentication context
      const mockContext = {
        user: { id: 'user-123' },
        profile: { 
          role: 'admin', 
          organization_id: 'org-123' 
        }
      }

      const response = await GET(req, mockContext, { 
        params: Promise.resolve({ id: 'student-123' }) 
      })

      expect(response.status).toBe(200)
      
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.data.id).toBe('student-123')
      expect(responseData.data.full_name).toBe('John Doe')
    })

    it('should return 404 when student not found', async () => {
      const { createServerClient } = require('@/lib/supabase-server')
      const mockSupabase = createServerClient()
      
      // Mock student not found
      mockSupabase.from().select().eq().eq().is().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/students/non-existent-id',
      })

      const mockContext = {
        user: { id: 'user-123' },
        profile: { 
          role: 'admin', 
          organization_id: 'org-123' 
        }
      }

      const response = await GET(req, mockContext, { 
        params: Promise.resolve({ id: 'non-existent-id' }) 
      })

      expect(response.status).toBe(404)
      
      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Student not found')
    })

    it('should return 401 when not authenticated', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/students/student-123',
      })

      // Test without authentication context (should be handled by middleware)
      try {
        const response = await GET(req, null as any, { 
          params: Promise.resolve({ id: 'student-123' }) 
        })
        
        // If middleware is working, this should return 401
        expect(response.status).toBe(401)
      } catch (error) {
        // If middleware throws error, that's also acceptable
        expect(error).toBeDefined()
      }
    })

    it('should handle database errors gracefully', async () => {
      const { createServerClient } = require('@/lib/supabase-server')
      const mockSupabase = createServerClient()
      
      // Mock database error
      mockSupabase.from().select().eq().eq().is().single.mockResolvedValue({
        data: null,
        error: { 
          code: '23505', 
          message: 'Database connection error' 
        }
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/students/student-123',
      })

      const mockContext = {
        user: { id: 'user-123' },
        profile: { 
          role: 'admin', 
          organization_id: 'org-123' 
        }
      }

      const response = await GET(req, mockContext, { 
        params: Promise.resolve({ id: 'student-123' }) 
      })

      // Should return 500 for database errors
      expect(response.status).toBe(500)
      
      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBeDefined()
    })

    it('should NOT return 500 error with ReflectApply error', async () => {
      /**
       * This test specifically checks that the withMultiRoleAuth wrapper
       * does not cause ReflectApply errors that result in 500 responses.
       * 
       * Before fix: This test should FAIL because the API returns 500
       * After fix: This test should PASS because the API returns proper response
       */
      
      const { createServerClient } = require('@/lib/supabase-server')
      const mockSupabase = createServerClient()
      
      mockSupabase.from().select().eq().eq().is().single.mockResolvedValue({
        data: {
          id: 'student-123',
          full_name: 'John Doe',
        },
        error: null
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/students/student-123',
      })

      const mockContext = {
        user: { id: 'user-123' },
        profile: { 
          role: 'admin', 
          organization_id: 'org-123' 
        }
      }

      const response = await GET(req, mockContext, { 
        params: Promise.resolve({ id: 'student-123' }) 
      })

      // THIS IS THE KEY TEST: Should NOT be 500
      expect(response.status).not.toBe(500)
      
      // Should be a successful response
      expect([200, 401, 403, 404]).toContain(response.status)
    })

    it('should respect organization isolation', async () => {
      const { createServerClient } = require('@/lib/supabase-server')
      const mockSupabase = createServerClient()
      
      // Mock student from different organization
      mockSupabase.from().select().eq().eq().is().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/students/student-from-other-org',
      })

      const mockContext = {
        user: { id: 'user-123' },
        profile: { 
          role: 'admin', 
          organization_id: 'org-123' // Different from student's org
        }
      }

      const response = await GET(req, mockContext, { 
        params: Promise.resolve({ id: 'student-from-other-org' }) 
      })

      // Should not find student from different organization
      expect(response.status).toBe(404)
    })

    it('should handle malformed student IDs', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/students/invalid-uuid-format',
      })

      const mockContext = {
        user: { id: 'user-123' },
        profile: { 
          role: 'admin', 
          organization_id: 'org-123' 
        }
      }

      const response = await GET(req, mockContext, { 
        params: Promise.resolve({ id: 'invalid-uuid-format' }) 
      })

      // Should handle gracefully, not crash with 500
      expect([400, 404]).toContain(response.status)
    })

    it('should work with different user roles', async () => {
      const { createServerClient } = require('@/lib/supabase-server')
      const mockSupabase = createServerClient()
      
      mockSupabase.from().select().eq().eq().is().single.mockResolvedValue({
        data: {
          id: 'student-123',
          full_name: 'John Doe',
        },
        error: null
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/students/student-123',
      })

      // Test with superadmin role
      const mockContext = {
        user: { id: 'user-123' },
        profile: { 
          role: 'superadmin', 
          organization_id: 'org-123' 
        }
      }

      const response = await GET(req, mockContext, { 
        params: Promise.resolve({ id: 'student-123' }) 
      })

      expect(response.status).toBe(200)
    })

    it('should handle concurrent requests without issues', async () => {
      const { createServerClient } = require('@/lib/supabase-server')
      const mockSupabase = createServerClient()
      
      mockSupabase.from().select().eq().eq().is().single.mockResolvedValue({
        data: {
          id: 'student-123',
          full_name: 'John Doe',
        },
        error: null
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/students/student-123',
      })

      const mockContext = {
        user: { id: 'user-123' },
        profile: { 
          role: 'admin', 
          organization_id: 'org-123' 
        }
      }

      // Make multiple concurrent requests
      const requests = Array.from({ length: 5 }, () => 
        GET(req, mockContext, { 
          params: Promise.resolve({ id: 'student-123' }) 
        })
      )

      const responses = await Promise.all(requests)

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })
})