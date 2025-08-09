/**
 * Teachers API Integration Tests
 * Comprehensive testing for Teachers API endpoints including error cases
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/teachers/route'
import { TeacherService } from '@/lib/services/teacher-service'

// Mock the TeacherService
jest.mock('@/lib/services/teacher-service')
jest.mock('@/lib/middleware/api-auth', () => ({
  withAuth: (handler: any) => handler
}))

describe('Teachers API Integration Tests', () => {
  let mockTeacherService: jest.Mocked<TeacherService>
  let mockRequest: NextRequest
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Create mock service
    mockTeacherService = new TeacherService() as jest.Mocked<TeacherService>
    ;(TeacherService as jest.MockedClass<typeof TeacherService>).mockImplementation(() => mockTeacherService)
    
    // Create mock request
    mockRequest = new NextRequest('http://localhost:3000/api/teachers', {
      method: 'GET'
    })
  })

  describe('GET /api/teachers - Error Scenarios', () => {
    it('should handle TypeError from undefined Supabase client', async () => {
      // Mock the TypeError scenario
      mockTeacherService.getAll.mockRejectedValue(
        new TypeError("Cannot read properties of undefined (reading 'call')")
      )
      
      const response = await GET(mockRequest)
      
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should handle malformed SQL query with URL encoding', async () => {
      // Create request with URL-encoded search parameters
      const searchRequest = new NextRequest(
        'http://localhost:3000/api/teachers?query=John%20Doe&specializations=Math%2CScience',
        { method: 'GET' }
      )
      
      // Mock SQL error
      mockTeacherService.getAll.mockRejectedValue(
        new Error('Malformed SQL query: invalid character in specializations filter')
      )
      
      const response = await GET(searchRequest)
      
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toContain('SQL')
    })

    it('should handle missing environment variables error', async () => {
      mockTeacherService.getAll.mockRejectedValue(
        new Error('Missing Supabase environment variables')
      )
      
      const response = await GET(mockRequest)
      
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toContain('environment variables')
    })

    it('should handle database connection errors', async () => {
      mockTeacherService.getAll.mockRejectedValue(
        new Error('Database connection failed')
      )
      
      const response = await GET(mockRequest)
      
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toContain('connection failed')
    })

    it('should handle RLS policy violations', async () => {
      mockTeacherService.getAll.mockRejectedValue(
        Object.assign(new Error('Row Level Security policy violation'), {
          code: '42501'
        })
      )
      
      const response = await GET(mockRequest)
      
      expect(response.status).toBe(500)
    })
  })

  describe('GET /api/teachers - Query Parameter Validation', () => {
    it('should handle special characters in search query', async () => {
      const searchRequest = new NextRequest(
        'http://localhost:3000/api/teachers?query=John%20O%27Connor&employment_status=active',
        { method: 'GET' }
      )
      
      mockTeacherService.getAll.mockResolvedValue({
        data: [],
        count: 0,
        total_pages: 0
      })
      
      await GET(searchRequest)
      
      expect(mockTeacherService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "John O'Connor",
          employment_status: 'active'
        }),
        expect.any(Object)
      )
    })

    it('should handle array parameters (specializations)', async () => {
      const searchRequest = new NextRequest(
        'http://localhost:3000/api/teachers?specializations=Math,Science,English',
        { method: 'GET' }
      )
      
      mockTeacherService.getAll.mockResolvedValue({
        data: [],
        count: 0,
        total_pages: 0
      })
      
      await GET(searchRequest)
      
      expect(mockTeacherService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          specializations: ['Math', 'Science', 'English']
        }),
        expect.any(Object)
      )
    })

    it('should handle date range parameters', async () => {
      const searchRequest = new NextRequest(
        'http://localhost:3000/api/teachers?hire_date_from=2023-01-01&hire_date_to=2023-12-31',
        { method: 'GET' }
      )
      
      mockTeacherService.getAll.mockResolvedValue({
        data: [],
        count: 0,
        total_pages: 0
      })
      
      await GET(searchRequest)
      
      expect(mockTeacherService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          hire_date_from: '2023-01-01',
          hire_date_to: '2023-12-31'
        }),
        expect.any(Object)
      )
    })

    it('should handle boolean parameters correctly', async () => {
      const searchRequest = new NextRequest(
        'http://localhost:3000/api/teachers?is_active=true',
        { method: 'GET' }
      )
      
      mockTeacherService.getAll.mockResolvedValue({
        data: [],
        count: 0,
        total_pages: 0
      })
      
      await GET(searchRequest)
      
      expect(mockTeacherService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: true
        }),
        expect.any(Object)
      )
    })

    it('should handle pagination parameters', async () => {
      const searchRequest = new NextRequest(
        'http://localhost:3000/api/teachers?page=2&limit=50&sort_by=full_name&sort_order=desc',
        { method: 'GET' }
      )
      
      mockTeacherService.getAll.mockResolvedValue({
        data: [],
        count: 0,
        total_pages: 0
      })
      
      await GET(searchRequest)
      
      expect(mockTeacherService.getAll).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          page: 2,
          limit: 50,
          sort_by: 'full_name',
          sort_order: 'desc'
        })
      )
    })
  })

  describe('GET /api/teachers - Success Scenarios', () => {
    it('should return teachers data successfully', async () => {
      const mockTeachersData = [
        {
          id: '1',
          organization_id: 'org-1',
          first_name: 'John',
          last_name: 'Doe',
          full_name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          employment_status: 'active',
          specializations: ['Math', 'Science'],
          address: null,
          certifications: null,
          contract_type: null,
          created_at: '2024-01-01T00:00:00Z',
          created_by: null,
          date_of_birth: null,
          deleted_at: null,
          deleted_by: null,
          documents: null,
          emergency_contact: null,
          employee_id: null,
          gender: null,
          hire_date: '2024-01-01',
          is_active: true,
          languages_spoken: null,
          notes: null,
          profile_image_url: null,
          qualifications: null,
          salary_amount: null,
          salary_currency: null,
          updated_at: '2024-01-01T00:00:00Z',
          updated_by: null
        }
      ]
      
      mockTeacherService.getAll.mockResolvedValue({
        data: mockTeachersData,
        count: 1,
        total_pages: 1
      })
      
      const response = await GET(mockRequest)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toEqual(mockTeachersData)
      expect(data.count).toBe(1)
    })

    it('should handle empty results', async () => {
      mockTeacherService.getAll.mockResolvedValue({
        data: [],
        count: 0,
        total_pages: 0
      })
      
      const response = await GET(mockRequest)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toEqual([])
      expect(data.count).toBe(0)
    })
  })

  describe('POST /api/teachers - Validation Tests', () => {
    it('should validate required fields', async () => {
      const invalidData = {
        // Missing required fields
        first_name: '',
        email: 'invalid-email'
      }
      
      const postRequest = new NextRequest('http://localhost:3000/api/teachers', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const response = await POST(postRequest)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation error')
      expect(data.details).toBeDefined()
    })

    it('should validate email format', async () => {
      const invalidData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'invalid-email-format',
        phone: '+1234567890',
        employment_status: 'active'
      }
      
      const postRequest = new NextRequest('http://localhost:3000/api/teachers', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const response = await POST(postRequest)
      
      expect(response.status).toBe(400)
    })

    it('should validate phone format', async () => {
      const invalidData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: 'invalid-phone',
        employment_status: 'active'
      }
      
      const postRequest = new NextRequest('http://localhost:3000/api/teachers', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const response = await POST(postRequest)
      
      expect(response.status).toBe(400)
    })

    it('should create teacher successfully with valid data', async () => {
      const validData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        employment_status: 'active',
        specializations: ['Math', 'Science']
      }
      
      const createdTeacher = {
        id: '1',
        organization_id: 'org-1',
        ...validData,
        full_name: `${validData.first_name} ${validData.last_name}`,
        address: null,
        certifications: null,
        contract_type: null,
        created_at: '2024-01-01T00:00:00Z',
        created_by: null,
        date_of_birth: null,
        deleted_at: null,
        deleted_by: null,
        documents: null,
        emergency_contact: null,
        employee_id: null,
        gender: null,
        hire_date: '2024-01-01',
        is_active: true,
        languages_spoken: null,
        notes: null,
        profile_image_url: null,
        qualifications: null,
        salary_amount: null,
        salary_currency: null,
        updated_at: '2024-01-01T00:00:00Z',
        updated_by: null
      }
      mockTeacherService.create.mockResolvedValue(createdTeacher)
      
      const postRequest = new NextRequest('http://localhost:3000/api/teachers', {
        method: 'POST',
        body: JSON.stringify(validData),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const response = await POST(postRequest)
      
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data).toEqual(createdTeacher)
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should recover from transient database errors', async () => {
      let callCount = 0
      mockTeacherService.getAll.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.reject(new Error('Transient database error'))
        }
        return Promise.resolve({
          data: [],
          count: 0,
          total_pages: 0
        })
      })
      
      // First call should fail
      const response1 = await GET(mockRequest)
      expect(response1.status).toBe(500)
      
      // Second call should succeed
      const response2 = await GET(mockRequest)
      expect(response2.status).toBe(200)
    })

    it('should handle partial service failures gracefully', async () => {
      // Mock a scenario where the service returns empty results
      mockTeacherService.getAll.mockResolvedValue({
        data: [],
        count: 0,
        total_pages: 0
      })
      
      const response = await GET(mockRequest)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toEqual([])
    })

    it('should handle concurrent requests without race conditions', async () => {
      mockTeacherService.getAll.mockResolvedValue({
        data: [{
          id: '1',
          organization_id: 'org-1',
          first_name: 'Test',
          last_name: 'Teacher',
          full_name: 'Test Teacher',
          email: 'test@example.com',
          phone: '+1234567890',
          employment_status: 'active',
          specializations: ['Math'],
          address: null,
          certifications: null,
          contract_type: null,
          created_at: '2024-01-01T00:00:00Z',
          created_by: null,
          date_of_birth: null,
          deleted_at: null,
          deleted_by: null,
          documents: null,
          emergency_contact: null,
          employee_id: null,
          gender: null,
          hire_date: '2024-01-01',
          is_active: true,
          languages_spoken: null,
          notes: null,
          profile_image_url: null,
          qualifications: null,
          salary_amount: null,
          salary_currency: null,
          updated_at: '2024-01-01T00:00:00Z',
          updated_by: null
        }],
        count: 1,
        total_pages: 1
      })
      
      // Make multiple concurrent requests
      const requests = Array(5).fill(0).map(() => GET(mockRequest))
      const responses = await Promise.all(requests)
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
      
      // Service should have been called for each request
      expect(mockTeacherService.getAll).toHaveBeenCalledTimes(5)
    })
  })
})

// API Response Schema Validation Tests
describe('Teachers API Response Validation', () => {
  it('should validate GET response schema', async () => {
    const mockTeacherService = new TeacherService() as jest.Mocked<TeacherService>
    ;(TeacherService as jest.MockedClass<typeof TeacherService>).mockImplementation(() => mockTeacherService)
    
    mockTeacherService.getAll.mockResolvedValue({
      data: [
        {
          id: '1',
          organization_id: 'org-1',
          first_name: 'John',
          last_name: 'Doe',
          full_name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          employment_status: 'active',
          specializations: ['Math'],
          address: null,
          certifications: null,
          contract_type: null,
          created_at: '2023-01-01T00:00:00Z',
          created_by: null,
          date_of_birth: null,
          deleted_at: null,
          deleted_by: null,
          documents: null,
          emergency_contact: null,
          employee_id: null,
          gender: null,
          hire_date: '2023-01-01',
          is_active: true,
          languages_spoken: null,
          notes: null,
          profile_image_url: null,
          qualifications: null,
          salary_amount: null,
          salary_currency: null,
          updated_at: '2023-01-01T00:00:00Z',
          updated_by: null
        }
      ],
      count: 1,
      total_pages: 1
    })
    
    const mockRequest = new NextRequest('http://localhost:3000/api/teachers')
    const response = await GET(mockRequest)
    const data = await response.json()
    
    expect(data).toHaveProperty('data')
    expect(data).toHaveProperty('count')
    expect(Array.isArray(data.data)).toBe(true)
    expect(typeof data.count).toBe('number')
    
    if (data.data.length > 0) {
      const teacher = data.data[0]
      expect(teacher).toHaveProperty('id')
      expect(teacher).toHaveProperty('first_name')
      expect(teacher).toHaveProperty('last_name')
      expect(teacher).toHaveProperty('email')
      expect(teacher).toHaveProperty('employment_status')
    }
  })

  it('should validate POST response schema', async () => {
    const mockTeacherService = new TeacherService() as jest.Mocked<TeacherService>
    ;(TeacherService as jest.MockedClass<typeof TeacherService>).mockImplementation(() => mockTeacherService)
    
    const createdTeacher = {
      id: '1',
      organization_id: 'org-1',
      first_name: 'John',
      last_name: 'Doe',
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      employment_status: 'active',
      specializations: ['Math'],
      address: null,
      certifications: null,
      contract_type: null,
      created_at: '2023-01-01T00:00:00Z',
      created_by: null,
      date_of_birth: null,
      deleted_at: null,
      deleted_by: null,
      documents: null,
      emergency_contact: null,
      employee_id: null,
      gender: null,
      hire_date: '2023-01-01',
      is_active: true,
      languages_spoken: null,
      notes: null,
      profile_image_url: null,
      qualifications: null,
      salary_amount: null,
      salary_currency: null,
      updated_at: '2023-01-01T00:00:00Z',
      updated_by: null
    }
    
    mockTeacherService.create.mockResolvedValue(createdTeacher)
    
    const postRequest = new NextRequest('http://localhost:3000/api/teachers', {
      method: 'POST',
      body: JSON.stringify({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        employment_status: 'active'
      }),
      headers: { 'Content-Type': 'application/json' }
    })
    
    const response = await POST(postRequest)
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('first_name')
    expect(data).toHaveProperty('last_name')
    expect(data).toHaveProperty('email')
    expect(data).toHaveProperty('created_at')
  })
})