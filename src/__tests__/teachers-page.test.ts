import { TeacherService } from '@/lib/services/teacher-service'
import { TeachersExportService } from '@/lib/services/teachers-export-service'
import { TeachersImportService } from '@/lib/services/teachers-import-service'
import type { Teacher, TeacherFilters } from '@/types/teacher'

// Mock fetch globally
global.fetch = jest.fn()

// Mock the services
jest.mock('@/lib/services/teacher-service')
jest.mock('@/lib/services/teachers-export-service')
jest.mock('@/lib/services/teachers-import-service')
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          is: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => ({ data: [], error: null }))
            }))
          }))
        }))
      })),
      insert: jest.fn(() => ({ data: null, error: null })),
      update: jest.fn(() => ({ data: null, error: null })),
      delete: jest.fn(() => ({ data: null, error: null }))
    }))
  }
}))

describe('Teachers Page Functionality', () => {
  const mockTeacher: Teacher = {
    id: '1',
    organization_id: 'org-1',
    first_name: 'John',
    last_name: 'Doe',
    full_name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+998901234567',
    specializations: ['English', 'IELTS Preparation'],
    education: "Master's in English",
    experience: 5,
    hire_date: '2020-01-15',
    employment_status: 'active',
    contract_type: 'full_time',
    is_active: true,
    salary: 5000,
    created_at: '2020-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('CRUD Operations', () => {
    it('should fetch teachers list from API', async () => {
      const mockResponse = {
        success: true,
        data: [mockTeacher],
        count: 1,
        total_pages: 1
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/teachers?page=1&limit=20')
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/teachers?page=1&limit=20')
      expect(result.data).toHaveLength(1)
      expect(result.data[0].full_name).toBe('John Doe')
    })

    it('should create a new teacher', async () => {
      const newTeacher = {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+998901234568',
        specializations: ['Mathematics'],
        employment_status: 'active' as const,
        contract_type: 'full_time' as const
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { ...newTeacher, id: '2' } })
      })

      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeacher)
      })
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/teachers', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(newTeacher)
      }))
      expect(result.success).toBe(true)
      expect(result.data.email).toBe('jane.smith@example.com')
    })

    it('should update an existing teacher', async () => {
      const updates = {
        specializations: ['English', 'Business English'],
        salary: 5500
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { ...mockTeacher, ...updates } })
      })

      const response = await fetch('/api/teachers/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/teachers/1', expect.objectContaining({
        method: 'PUT'
      }))
      expect(result.data.salary).toBe(5500)
      expect(result.data.specializations).toContain('Business English')
    })

    it('should delete a teacher', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTeacher })
      })

      const response = await fetch('/api/teachers/1', {
        method: 'DELETE'
      })
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/teachers/1', expect.objectContaining({
        method: 'DELETE'
      }))
      expect(result.success).toBe(true)
    })

    it('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' })
      })

      const response = await fetch('/api/teachers')
      const result = await response.json()

      expect(response.ok).toBe(false)
      expect(result.error).toBe('Server error')
    })
  })

  describe('Search and Filtering', () => {
    it('should filter teachers by search query', async () => {
      const filters: TeacherFilters = {
        search: 'John'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockTeacher],
          count: 1
        })
      })

      const params = new URLSearchParams({ query: 'John' })
      const response = await fetch(`/api/teachers?${params}`)
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('query=John'))
      expect(result.data[0].full_name).toContain('John')
    })

    it('should filter teachers by employment status', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockTeacher],
          count: 1
        })
      })

      const params = new URLSearchParams({ employment_status: 'active' })
      const response = await fetch(`/api/teachers?${params}`)
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('employment_status=active'))
      expect(result.data[0].employment_status).toBe('active')
    })

    it('should filter teachers by specializations', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockTeacher],
          count: 1
        })
      })

      const params = new URLSearchParams({ specializations: 'English,IELTS Preparation' })
      const response = await fetch(`/api/teachers?${params}`)
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('specializations='))
      expect(result.data[0].specializations).toContain('English')
    })

    it('should handle pagination correctly', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: Array(20).fill(mockTeacher),
          count: 50,
          total_pages: 3
        })
      })

      const params = new URLSearchParams({ page: '2', limit: '20' })
      const response = await fetch(`/api/teachers?${params}`)
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('page=2'))
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('limit=20'))
      expect(result.total_pages).toBe(3)
      expect(result.data).toHaveLength(20)
    })

    it('should sort teachers by different fields', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockTeacher],
          count: 1
        })
      })

      const params = new URLSearchParams({ 
        sort_by: 'hire_date',
        sort_order: 'desc'
      })
      const response = await fetch(`/api/teachers?${params}`)
      
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('sort_by=hire_date'))
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('sort_order=desc'))
    })
  })

  describe('Data Validation', () => {
    it('should validate required fields when creating teacher', async () => {
      const invalidTeacher = {
        first_name: '',  // Required field missing
        email: 'invalid-email',  // Invalid email format
        phone: '123'  // Invalid phone format
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Validation error',
          details: [
            { field: 'first_name', message: 'Required' },
            { field: 'email', message: 'Invalid email' },
            { field: 'phone', message: 'Invalid phone number' }
          ]
        })
      })

      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidTeacher)
      })
      const result = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
      expect(result.error).toBe('Validation error')
      expect(result.details).toHaveLength(3)
    })

    it('should validate email format', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.uk']
      const invalidEmails = ['invalid', '@example.com', 'test@', 'test@.com']

      validEmails.forEach(email => {
        expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(true)
      })

      invalidEmails.forEach(email => {
        expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(false)
      })
    })

    it('should validate phone number format', () => {
      const validPhones = ['+998901234567', '+998331234567', '+998951234567']
      const invalidPhones = ['901234567', '+99890123', 'abc123456', '']

      validPhones.forEach(phone => {
        expect(/^\+998[0-9]{9}$/.test(phone)).toBe(true)
      })

      invalidPhones.forEach(phone => {
        expect(/^\+998[0-9]{9}$/.test(phone)).toBe(false)
      })
    })

    it('should validate specializations array', async () => {
      const teacherWithInvalidSpecializations = {
        ...mockTeacher,
        specializations: []  // Empty array not allowed
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'At least one specialization is required'
        })
      })

      const response = await fetch('/api/teachers', {
        method: 'POST',
        body: JSON.stringify(teacherWithInvalidSpecializations)
      })
      const result = await response.json()

      expect(result.error).toContain('specialization')
    })
  })

  describe('Import/Export Functionality', () => {
    it('should export teachers to Excel format', async () => {
      const mockExportService = TeachersExportService as jest.MockedClass<typeof TeachersExportService>
      const exportSpy = jest.fn()
      mockExportService.prototype.exportToExcel = exportSpy

      const service = new TeachersExportService()
      await service.exportToExcel([mockTeacher], ['full_name', 'email', 'phone'])

      expect(exportSpy).toHaveBeenCalledWith(
        [mockTeacher],
        ['full_name', 'email', 'phone']
      )
    })

    it('should import teachers from Excel file', async () => {
      const mockImportService = TeachersImportService as jest.MockedClass<typeof TeachersImportService>
      const importSpy = jest.fn().mockResolvedValue({
        success: true,
        imported: 2,
        failed: 0,
        errors: []
      })
      mockImportService.prototype.importFromFile = importSpy

      const mockFile = new File([''], 'teachers.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      const service = new TeachersImportService()
      const result = await service.importFromFile(mockFile)

      expect(importSpy).toHaveBeenCalledWith(mockFile)
      expect(result.success).toBe(true)
      expect(result.imported).toBe(2)
    })

    it('should handle import errors and provide feedback', async () => {
      const mockImportService = TeachersImportService as jest.MockedClass<typeof TeachersImportService>
      const importSpy = jest.fn().mockResolvedValue({
        success: false,
        imported: 1,
        failed: 2,
        errors: [
          { row: 2, field: 'email', message: 'Invalid email format' },
          { row: 3, field: 'phone', message: 'Invalid phone number' }
        ]
      })
      mockImportService.prototype.importFromFile = importSpy

      const mockFile = new File([''], 'teachers.xlsx')
      const service = new TeachersImportService()
      const result = await service.importFromFile(mockFile)

      expect(result.success).toBe(false)
      expect(result.failed).toBe(2)
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0].row).toBe(2)
    })

    it('should generate import template', async () => {
      const mockImportService = TeachersImportService as jest.MockedClass<typeof TeachersImportService>
      const templateSpy = jest.fn()
      mockImportService.prototype.generateTemplate = templateSpy

      const service = new TeachersImportService()
      await service.generateTemplate()

      expect(templateSpy).toHaveBeenCalled()
    })
  })

  describe('Bulk Operations', () => {
    it('should delete multiple teachers at once', async () => {
      const teacherIds = ['1', '2', '3']
      
      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        })
      })

      const deletePromises = teacherIds.map(id =>
        fetch(`/api/teachers/${id}`, { method: 'DELETE' })
      )
      
      await Promise.all(deletePromises)
      
      expect(fetch).toHaveBeenCalledTimes(3)
      teacherIds.forEach(id => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/teachers/${id}`,
          expect.objectContaining({ method: 'DELETE' })
        )
      })
    })

    it('should update status for multiple teachers', async () => {
      const updates = { is_active: false }
      const teacherIds = ['1', '2']

      ;(global.fetch as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        })
      })

      const updatePromises = teacherIds.map(id =>
        fetch(`/api/teachers/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        })
      )

      await Promise.all(updatePromises)

      expect(fetch).toHaveBeenCalledTimes(2)
      teacherIds.forEach(id => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/teachers/${id}`,
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(updates)
          })
        )
      })
    })
  })

  describe('Statistics Calculation', () => {
    it('should calculate correct statistics from teacher data', () => {
      const teachers: Teacher[] = [
        { ...mockTeacher, is_active: true, contract_type: 'full_time' },
        { ...mockTeacher, id: '2', is_active: true, contract_type: 'part_time' },
        { ...mockTeacher, id: '3', is_active: false, contract_type: 'full_time' },
        { ...mockTeacher, id: '4', is_active: true, contract_type: 'contract' },
      ]

      const statistics = {
        total: teachers.length,
        active: teachers.filter(t => t.is_active).length,
        inactive: teachers.filter(t => !t.is_active).length,
        full_time: teachers.filter(t => t.contract_type === 'full_time').length,
        part_time: teachers.filter(t => t.contract_type === 'part_time').length,
        contract: teachers.filter(t => t.contract_type === 'contract').length
      }

      expect(statistics.total).toBe(4)
      expect(statistics.active).toBe(3)
      expect(statistics.inactive).toBe(1)
      expect(statistics.full_time).toBe(2)
      expect(statistics.part_time).toBe(1)
      expect(statistics.contract).toBe(1)
    })
  })
})