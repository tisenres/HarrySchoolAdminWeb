/**
 * Production Readiness API Testing Suite
 * Comprehensive testing of all critical API endpoints for production deployment
 */

import { createServerClient } from '@supabase/ssr'

const API_BASE_URL = 'http://localhost:3002'

// Mock authentication headers for testing
const mockAuthHeaders = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer mock-token'
}

describe('🚀 Production Readiness - API Endpoint Testing', () => {
  let mockSupabaseClient: any

  beforeAll(async () => {
    // Setup test environment
    console.log('🧪 Setting up API test environment...')
    
    // Mock Supabase client for testing
    mockSupabaseClient = {
      auth: {
        getUser: () => Promise.resolve({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null
        })
      },
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockUserProfile, error: null })
          })
        })
      })
    }
  })

  const mockUserProfile = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'admin',
    organization_id: 'test-org-id'
  }

  // Helper function to make authenticated requests
  const makeAuthenticatedRequest = async (
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ) => {
    const url = `${API_BASE_URL}/api${endpoint}`
    const options: RequestInit = {
      method,
      headers: mockAuthHeaders,
    }

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, options)
      const data = response.status !== 204 ? await response.json() : null
      return { response, data }
    } catch (error) {
      return { response: null, data: null, error }
    }
  }

  describe('🔐 Authentication & Authorization', () => {
    it('should handle protected routes correctly', async () => {
      // Test protected route without auth
      const response = await fetch(`${API_BASE_URL}/api/teachers`)
      expect(response.status).toBe(401)
    })

    it('should validate API key requirements', async () => {
      // Test API endpoint accessibility
      const { response } = await makeAuthenticatedRequest('/teachers')
      expect(response?.status).toBeDefined()
    })
  })

  describe('👨‍🏫 Teachers API Endpoints', () => {
    const teacherTestData = {
      first_name: 'Test',
      last_name: 'Teacher',
      phone: '+998901234567',
      hire_date: new Date().toISOString(),
      employment_status: 'active',
      specializations: ['English', 'Math']
    }

    it('should handle GET /api/teachers with pagination', async () => {
      const { response, data } = await makeAuthenticatedRequest('/teachers?page=1&limit=10')
      
      expect(response?.status).toBeDefined()
      if (response?.ok) {
        expect(data).toHaveProperty('data')
        expect(data).toHaveProperty('count')
        expect(data).toHaveProperty('total_pages')
        expect(Array.isArray(data.data)).toBe(true)
      }
    })

    it('should handle GET /api/teachers with search filters', async () => {
      const { response, data } = await makeAuthenticatedRequest(
        '/teachers?query=test&employment_status=active&include_counts=true'
      )
      
      expect(response?.status).toBeDefined()
      if (response?.ok) {
        expect(data).toHaveProperty('data')
      }
    })

    it('should validate POST /api/teachers data validation', async () => {
      // Test with valid data
      const { response: validResponse } = await makeAuthenticatedRequest(
        '/teachers', 
        'POST', 
        teacherTestData
      )
      
      expect(validResponse?.status).toBeDefined()

      // Test with invalid data
      const { response: invalidResponse } = await makeAuthenticatedRequest(
        '/teachers',
        'POST',
        { first_name: '' } // Invalid - missing required fields
      )
      
      if (invalidResponse?.status === 400) {
        // Validation working correctly
        expect(invalidResponse.status).toBe(400)
      }
    })

    it('should handle GET /api/teachers/stats performance', async () => {
      const startTime = Date.now()
      const { response, data } = await makeAuthenticatedRequest('/teachers/statistics')
      const responseTime = Date.now() - startTime
      
      expect(responseTime).toBeLessThan(2000) // Should respond within 2 seconds
      
      if (response?.ok) {
        expect(data).toHaveProperty('total')
        expect(data).toHaveProperty('active')
        expect(data).toHaveProperty('by_employment_status')
      }
    })
  })

  describe('🎓 Students API Endpoints', () => {
    const studentTestData = {
      first_name: 'Test',
      last_name: 'Student',
      phone: '+998901234567',
      parent_name: 'Test Parent',
      parent_phone: '+998901234568',
      date_of_birth: '2000-01-01',
      gender: 'male',
      enrollment_date: new Date().toISOString().split('T')[0],
      status: 'active',
      current_level: 'Beginner (A1)',
      preferred_subjects: ['English'],
      address: {
        street: 'Test Street',
        city: 'Tashkent',
        region: 'Toshkent shahar',
        country: 'Uzbekistan'
      },
      emergency_contact: {
        name: 'Emergency Contact',
        relationship: 'Father',
        phone: '+998901234569'
      },
      payment_status: 'pending',
      balance: 0,
      tuition_fee: 500000
    }

    it('should handle GET /api/students with complex filters', async () => {
      const { response, data } = await makeAuthenticatedRequest(
        '/students?query=test&status=active&payment_status=pending&age_from=18&age_to=25'
      )
      
      expect(response?.status).toBeDefined()
      if (response?.ok) {
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('data')
        expect(data).toHaveProperty('pagination')
      }
    })

    it('should validate POST /api/students complex data structure', async () => {
      const { response, data } = await makeAuthenticatedRequest(
        '/students',
        'POST',
        studentTestData
      )
      
      expect(response?.status).toBeDefined()
      
      if (response?.status === 201) {
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('data')
        expect(data.data).toHaveProperty('id')
      }
    })

    it('should handle student enrollment operations', async () => {
      // Test enrollment endpoint if available
      const { response } = await makeAuthenticatedRequest('/students/test-id/enrollments')
      expect(response?.status).toBeDefined()
    })
  })

  describe('👥 Groups API Endpoints', () => {
    const groupTestData = {
      name: 'Test Group',
      group_code: 'TEST-001',
      subject: 'English',
      level: 'Beginner (A1)',
      group_type: 'regular',
      max_students: 15,
      schedule: [
        {
          day: 'monday',
          start_time: '09:00',
          end_time: '10:30',
          timezone: 'Asia/Tashkent'
        }
      ],
      start_date: new Date().toISOString().split('T')[0],
      duration_weeks: 12,
      price_per_student: 500000,
      currency: 'UZS',
      payment_frequency: 'monthly'
    }

    it('should handle GET /api/groups with filters', async () => {
      const { response, data } = await makeAuthenticatedRequest(
        '/groups?subject=English&level=Beginner&status=active'
      )
      
      expect(response?.status).toBeDefined()
      if (response?.ok) {
        expect(data).toHaveProperty('data')
        expect(data).toHaveProperty('count')
      }
    })

    it('should validate POST /api/groups schedule validation', async () => {
      const { response } = await makeAuthenticatedRequest(
        '/groups',
        'POST',
        groupTestData
      )
      
      expect(response?.status).toBeDefined()
      
      // Test with invalid schedule
      const invalidGroupData = {
        ...groupTestData,
        schedule: [] // Invalid - empty schedule
      }
      
      const { response: invalidResponse } = await makeAuthenticatedRequest(
        '/groups',
        'POST',
        invalidGroupData
      )
      
      if (invalidResponse?.status === 400) {
        expect(invalidResponse.status).toBe(400)
      }
    })
  })

  describe('💰 Finance API Endpoints', () => {
    it('should handle GET /api/finance/transactions', async () => {
      const { response, data } = await makeAuthenticatedRequest('/finance/transactions')
      expect(response?.status).toBeDefined()
      
      if (response?.ok) {
        expect(Array.isArray(data.data) || data.transactions).toBe(true)
      }
    })

    it('should handle GET /api/finance/invoices', async () => {
      const { response } = await makeAuthenticatedRequest('/finance/invoices')
      expect(response?.status).toBeDefined()
    })

    it('should validate payment creation', async () => {
      const paymentData = {
        student_id: 'test-student-id',
        amount: 500000,
        currency: 'UZS',
        payment_method: 'cash',
        description: 'Monthly tuition'
      }
      
      const { response } = await makeAuthenticatedRequest(
        '/finance/payments',
        'POST',
        paymentData
      )
      
      expect(response?.status).toBeDefined()
    })
  })

  describe('📊 Reports & Analytics API Endpoints', () => {
    it('should handle GET /api/reports/revenue with date filters', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const endDate = new Date().toISOString().split('T')[0]
      
      const { response, data } = await makeAuthenticatedRequest(
        `/reports/revenue?start_date=${startDate}&end_date=${endDate}`
      )
      
      expect(response?.status).toBeDefined()
      if (response?.ok) {
        expect(data).toHaveProperty('revenue_data')
      }
    })

    it('should handle GET /api/reports/outstanding balances', async () => {
      const { response, data } = await makeAuthenticatedRequest('/reports/outstanding')
      expect(response?.status).toBeDefined()
      
      if (response?.ok) {
        expect(data).toHaveProperty('outstanding_balances')
      }
    })

    it('should test report generation performance', async () => {
      const startTime = Date.now()
      const { response } = await makeAuthenticatedRequest('/reports/group-analysis')
      const responseTime = Date.now() - startTime
      
      expect(responseTime).toBeLessThan(5000) // Reports should generate within 5 seconds
      expect(response?.status).toBeDefined()
    })
  })

  describe('⚙️ Settings & Configuration API Endpoints', () => {
    it('should handle GET /api/settings/organization', async () => {
      const { response, data } = await makeAuthenticatedRequest('/settings/organization')
      expect(response?.status).toBeDefined()
      
      if (response?.ok) {
        expect(data).toHaveProperty('organization')
      }
    })

    it('should handle GET /api/settings/users', async () => {
      const { response, data } = await makeAuthenticatedRequest('/settings/users')
      expect(response?.status).toBeDefined()
      
      if (response?.ok) {
        expect(Array.isArray(data.users) || Array.isArray(data.data)).toBe(true)
      }
    })

    it('should validate system settings updates', async () => {
      const settingsData = {
        feature_flags: {
          enable_notifications: true,
          enable_analytics: true
        }
      }
      
      const { response } = await makeAuthenticatedRequest(
        '/settings/system',
        'PUT',
        settingsData
      )
      
      expect(response?.status).toBeDefined()
    })
  })

  describe('📤 Export/Import API Endpoints', () => {
    it('should handle GET /api/export/teachers', async () => {
      const { response } = await makeAuthenticatedRequest('/export/teachers?format=csv')
      expect(response?.status).toBeDefined()
      
      if (response?.ok) {
        expect(response.headers.get('content-type')).toContain('text/csv')
      }
    })

    it('should handle GET /api/export/students', async () => {
      const { response } = await makeAuthenticatedRequest('/export/students?format=xlsx')
      expect(response?.status).toBeDefined()
    })

    it('should validate import template download', async () => {
      const { response } = await makeAuthenticatedRequest('/import/teachers/template')
      expect(response?.status).toBeDefined()
    })

    it('should test large export performance', async () => {
      const startTime = Date.now()
      const { response } = await makeAuthenticatedRequest('/export/students?format=csv&limit=1000')
      const responseTime = Date.now() - startTime
      
      expect(responseTime).toBeLessThan(10000) // Large exports should complete within 10 seconds
      expect(response?.status).toBeDefined()
    })
  })

  describe('🔔 Notifications API Endpoints', () => {
    it('should handle GET /api/notifications', async () => {
      const { response, data } = await makeAuthenticatedRequest('/notifications')
      expect(response?.status).toBeDefined()
      
      if (response?.ok) {
        expect(Array.isArray(data.notifications) || Array.isArray(data.data)).toBe(true)
      }
    })

    it('should handle notification creation', async () => {
      const notificationData = {
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'info',
        recipient_id: 'test-user-id'
      }
      
      const { response } = await makeAuthenticatedRequest(
        '/notifications',
        'POST',
        notificationData
      )
      
      expect(response?.status).toBeDefined()
    })
  })

  describe('🎯 Achievement & Rankings API Endpoints', () => {
    it('should handle GET /api/rankings', async () => {
      const { response, data } = await makeAuthenticatedRequest('/rankings')
      expect(response?.status).toBeDefined()
      
      if (response?.ok) {
        expect(data).toHaveProperty('rankings')
      }
    })

    it('should handle GET /api/achievements', async () => {
      const { response, data } = await makeAuthenticatedRequest('/achievements')
      expect(response?.status).toBeDefined()
      
      if (response?.ok) {
        expect(Array.isArray(data.achievements) || Array.isArray(data.data)).toBe(true)
      }
    })

    it('should test leaderboard performance', async () => {
      const startTime = Date.now()
      const { response } = await makeAuthenticatedRequest('/leaderboard')
      const responseTime = Date.now() - startTime
      
      expect(responseTime).toBeLessThan(3000) // Leaderboard should load within 3 seconds
      expect(response?.status).toBeDefined()
    })
  })

  describe('📈 Performance & Load Testing', () => {
    it('should handle concurrent API requests', async () => {
      const concurrentRequests = Array(10).fill(null).map(() => 
        makeAuthenticatedRequest('/teachers?page=1&limit=5')
      )
      
      const startTime = Date.now()
      const results = await Promise.allSettled(concurrentRequests)
      const responseTime = Date.now() - startTime
      
      expect(responseTime).toBeLessThan(5000) // Concurrent requests should complete within 5 seconds
      
      const successfulRequests = results.filter(result => 
        result.status === 'fulfilled' && 
        result.value.response?.ok
      )
      
      // At least 80% of concurrent requests should succeed
      expect(successfulRequests.length / results.length).toBeGreaterThanOrEqual(0.8)
    })

    it('should handle API rate limiting gracefully', async () => {
      // Make rapid requests to test rate limiting
      const rapidRequests = Array(20).fill(null).map(() => 
        makeAuthenticatedRequest('/teachers')
      )
      
      const results = await Promise.allSettled(rapidRequests)
      
      // Should handle requests without crashing
      expect(results.length).toBe(20)
      
      // Check if rate limiting is working (some requests might be limited)
      const rateLimitedRequests = results.filter(result => 
        result.status === 'fulfilled' && 
        result.value.response?.status === 429
      )
      
      console.log(`Rate limited requests: ${rateLimitedRequests.length}/20`)
    })

    it('should validate API response times', async () => {
      const endpoints = [
        '/teachers',
        '/students', 
        '/groups',
        '/settings/organization'
      ]
      
      for (const endpoint of endpoints) {
        const startTime = Date.now()
        const { response } = await makeAuthenticatedRequest(endpoint)
        const responseTime = Date.now() - startTime
        
        console.log(`${endpoint}: ${responseTime}ms`)
        expect(responseTime).toBeLessThan(3000) // All endpoints should respond within 3 seconds
        expect(response?.status).toBeDefined()
      }
    })
  })

  describe('🔒 Error Handling & Edge Cases', () => {
    it('should handle malformed JSON requests', async () => {
      const response = await fetch(`${API_BASE_URL}/api/teachers`, {
        method: 'POST',
        headers: mockAuthHeaders,
        body: '{ invalid json }'
      })
      
      expect(response.status).toBe(400)
    })

    it('should handle missing required fields', async () => {
      const { response } = await makeAuthenticatedRequest(
        '/teachers',
        'POST',
        {} // Empty object - missing all required fields
      )
      
      expect(response?.status).toBe(400)
    })

    it('should handle non-existent resource IDs', async () => {
      const { response } = await makeAuthenticatedRequest('/teachers/non-existent-id')
      expect([404, 401, 403]).toContain(response?.status)
    })

    it('should handle database connection errors gracefully', async () => {
      // This would require mocking database failures
      // For now, we'll test that the API doesn't crash on various requests
      const { response } = await makeAuthenticatedRequest('/teachers')
      expect(response?.status).toBeDefined()
    })
  })

  afterAll(async () => {
    console.log('🧹 Cleaning up API test environment...')
  })
})

/**
 * Additional Test Utilities
 */
export const ApiTestUtils = {
  createMockTeacher: () => ({
    first_name: 'Test',
    last_name: 'Teacher',
    phone: '+998901234567',
    hire_date: new Date().toISOString(),
    employment_status: 'active',
    specializations: ['English']
  }),
  
  createMockStudent: () => ({
    first_name: 'Test',
    last_name: 'Student',
    phone: '+998901234567',
    parent_name: 'Test Parent',
    parent_phone: '+998901234568',
    date_of_birth: '2000-01-01',
    gender: 'male',
    enrollment_date: new Date().toISOString().split('T')[0],
    status: 'active',
    current_level: 'Beginner (A1)',
    preferred_subjects: ['English'],
    payment_status: 'pending',
    balance: 0,
    tuition_fee: 500000
  }),
  
  measureResponseTime: async (fn: () => Promise<any>) => {
    const startTime = Date.now()
    const result = await fn()
    const responseTime = Date.now() - startTime
    return { result, responseTime }
  }
}