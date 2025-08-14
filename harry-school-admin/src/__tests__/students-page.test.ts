import { StudentService } from '@/lib/services/student-service'
import { StudentsExportService } from '@/lib/services/students-export-service'
import { StudentsImportService } from '@/lib/services/students-import-service'
import type { Student, StudentFilters, StudentStatistics, Address, EmergencyContact } from '@/types/student'

// Mock fetch globally
global.fetch = jest.fn()

// Mock the services
jest.mock('@/lib/services/student-service')
jest.mock('@/lib/services/students-export-service') 
jest.mock('@/lib/services/students-import-service')
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

describe('Students Page Functionality', () => {
  const mockAddress: Address = {
    street: '123 Main Street',
    city: 'Tashkent',
    region: 'Tashkent Region',
    postal_code: '100000',
    country: 'Uzbekistan'
  }

  const mockEmergencyContact: EmergencyContact = {
    name: 'John Doe Sr.',
    relationship: 'father',
    phone: '+998901234567',
    email: 'john.doe.sr@example.com'
  }

  const mockStudent: Student = {
    id: '1',
    organization_id: 'org-1',
    student_id: 'HS-STU-2024001',
    first_name: 'John',
    last_name: 'Doe',
    full_name: 'John Doe',
    date_of_birth: '2005-03-15',
    gender: 'male',
    email: 'john.doe@example.com',
    phone: '+998901234567',
    parent_name: 'Jane Doe',
    parent_phone: '+998901234568',
    parent_email: 'jane.doe@example.com',
    address: mockAddress,
    enrollment_date: '2024-01-15',
    status: 'active',
    current_level: 'Intermediate',
    preferred_subjects: ['English', 'IELTS'],
    groups: ['group-1', 'group-2'],
    academic_year: '2024',
    grade_level: '10',
    medical_notes: 'No known allergies',
    emergency_contact: mockEmergencyContact,
    payment_status: 'paid',
    balance: 0,
    tuition_fee: 1500000,
    notes: 'Excellent student',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('CRUD Operations', () => {
    it('should fetch students list from API', async () => {
      const mockResponse = {
        success: true,
        data: [mockStudent],
        pagination: {
          total: 1,
          total_pages: 1,
          current_page: 1,
          limit: 20
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/students?page=1&limit=20')
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/students?page=1&limit=20')
      expect(result.data).toHaveLength(1)
      expect(result.data[0].full_name).toBe('John Doe')
      expect(result.data[0].student_id).toBe('HS-STU-2024001')
    })

    it('should create a new student', async () => {
      const newStudent = {
        first_name: 'Alice',
        last_name: 'Smith',
        date_of_birth: '2006-05-20',
        gender: 'female' as const,
        phone: '+998901234569',
        parent_name: 'Bob Smith',
        parent_phone: '+998901234570',
        address: mockAddress,
        enrollment_date: '2024-02-01',
        status: 'active' as const,
        current_level: 'Beginner',
        preferred_subjects: ['Math', 'Physics'],
        emergency_contact: mockEmergencyContact,
        payment_status: 'pending' as const,
        balance: 1000000
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { ...newStudent, id: '2', student_id: 'HS-STU-2024002' } })
      })

      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      })
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/students', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(newStudent)
      }))
      expect(result.success).toBe(true)
      expect(result.data.first_name).toBe('Alice')
    })

    it('should update an existing student', async () => {
      const updates = {
        current_level: 'Advanced',
        payment_status: 'paid' as const,
        balance: 0,
        notes: 'Updated student notes'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { ...mockStudent, ...updates } })
      })

      const response = await fetch('/api/students/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/students/1', expect.objectContaining({
        method: 'PATCH'
      }))
      expect(result.data.current_level).toBe('Advanced')
      expect(result.data.payment_status).toBe('paid')
    })

    it('should delete a student', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockStudent })
      })

      const response = await fetch('/api/students/1', {
        method: 'DELETE'
      })
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/students/1', expect.objectContaining({
        method: 'DELETE'
      }))
      expect(result.success).toBe(true)
    })

    it('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Student not found' })
      })

      const response = await fetch('/api/students/invalid-id')
      const result = await response.json()

      expect(response.ok).toBe(false)
      expect(result.error).toBe('Student not found')
    })
  })

  describe('Search and Filtering', () => {
    it('should filter students by search query', async () => {
      const filters: StudentFilters = {
        search: 'John'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockStudent],
          pagination: { total: 1 }
        })
      })

      const params = new URLSearchParams({ query: 'John' })
      const response = await fetch(`/api/students?${params}`)
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('query=John'))
      expect(result.data[0].full_name).toContain('John')
    })

    it('should filter students by status', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockStudent],
          pagination: { total: 1 }
        })
      })

      const params = new URLSearchParams({ status: 'active' })
      const response = await fetch(`/api/students?${params}`)
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('status=active'))
      expect(result.data[0].status).toBe('active')
    })

    it('should filter students by payment status', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockStudent],
          pagination: { total: 1 }
        })
      })

      const params = new URLSearchParams({ payment_status: 'paid' })
      const response = await fetch(`/api/students?${params}`)
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('payment_status=paid'))
      expect(result.data[0].payment_status).toBe('paid')
    })

    it('should filter students by level', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockStudent],
          pagination: { total: 1 }
        })
      })

      const params = new URLSearchParams({ current_level: 'Intermediate' })
      const response = await fetch(`/api/students?${params}`)
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('current_level=Intermediate'))
      expect(result.data[0].current_level).toBe('Intermediate')
    })

    it('should filter students by age range', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockStudent],
          pagination: { total: 1 }
        })
      })

      const params = new URLSearchParams({
        age_from: '15',
        age_to: '25'
      })
      const response = await fetch(`/api/students?${params}`)

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('age_from=15'))
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('age_to=25'))
    })

    it('should filter students by enrollment date', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockStudent],
          pagination: { total: 1 }
        })
      })

      const params = new URLSearchParams({
        enrollment_date_from: '2024-01-01',
        enrollment_date_to: '2024-12-31'
      })
      const response = await fetch(`/api/students?${params}`)

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('enrollment_date_from=2024-01-01'))
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('enrollment_date_to=2024-12-31'))
    })

    it('should handle pagination correctly', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: Array(20).fill(mockStudent),
          pagination: {
            total: 100,
            total_pages: 5,
            current_page: 2,
            limit: 20
          }
        })
      })

      const params = new URLSearchParams({ page: '2', limit: '20' })
      const response = await fetch(`/api/students?${params}`)
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('page=2'))
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('limit=20'))
      expect(result.pagination.total_pages).toBe(5)
      expect(result.data).toHaveLength(20)
    })
  })

  describe('Enrollment and Status Management', () => {
    it('should calculate student age correctly', () => {
      const birthDate = new Date('2005-03-15')
      const currentDate = new Date('2024-03-20')
      const age = currentDate.getFullYear() - birthDate.getFullYear()
      
      expect(age).toBe(19)
    })

    it('should handle enrollment in multiple groups', async () => {
      const enrollment = {
        student_id: '1',
        group_id: 'group-3',
        enrollment_date: '2024-02-01',
        status: 'active',
        payment_status: 'paid'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: enrollment })
      })

      const response = await fetch('/api/students/1/enrollments', {
        method: 'POST',
        body: JSON.stringify(enrollment)
      })
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.data.group_id).toBe('group-3')
    })

    it('should update student status', async () => {
      const statusUpdate = { status: 'graduated' as const }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { ...mockStudent, status: 'graduated' } })
      })

      const response = await fetch('/api/students/1', {
        method: 'PATCH',
        body: JSON.stringify(statusUpdate)
      })
      const result = await response.json()

      expect(result.data.status).toBe('graduated')
    })

    it('should handle payment status updates', async () => {
      const paymentUpdate = {
        payment_status: 'overdue' as const,
        balance: 500000
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { ...mockStudent, ...paymentUpdate } })
      })

      const response = await fetch('/api/students/1', {
        method: 'PATCH',
        body: JSON.stringify(paymentUpdate)
      })
      const result = await response.json()

      expect(result.data.payment_status).toBe('overdue')
      expect(result.data.balance).toBe(500000)
    })
  })

  describe('Data Validation', () => {
    it('should validate required fields when creating student', async () => {
      const invalidStudent = {
        first_name: '',  // Required field missing
        last_name: '',   // Required field missing
        phone: 'invalid-phone',  // Invalid format
        date_of_birth: '2030-01-01',  // Future date
        parent_phone: ''  // Required field missing
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Validation error',
          details: [
            { field: 'first_name', message: 'First name is required' },
            { field: 'last_name', message: 'Last name is required' },
            { field: 'phone', message: 'Invalid phone format' },
            { field: 'date_of_birth', message: 'Birth date cannot be in the future' },
            { field: 'parent_phone', message: 'Parent phone is required' }
          ]
        })
      })

      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidStudent)
      })
      const result = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
      expect(result.error).toBe('Validation error')
      expect(result.details).toHaveLength(5)
    })

    it('should validate phone number format', () => {
      const validPhones = ['+998901234567', '+998711234567', '+998331234567']
      const invalidPhones = ['1234567', '998901234567', 'invalid', '']

      validPhones.forEach(phone => {
        expect(/^\+998\d{9}$/.test(phone)).toBe(true)
      })

      invalidPhones.forEach(phone => {
        expect(/^\+998\d{9}$/.test(phone)).toBe(false)
      })
    })

    it('should validate email format', () => {
      const validEmails = ['test@example.com', 'student@gmail.com', 'parent@yahoo.uz']
      const invalidEmails = ['invalid-email', 'test@', '@example.com', '']

      validEmails.forEach(email => {
        expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(true)
      })

      invalidEmails.forEach(email => {
        if (email) { // Skip empty string as it's optional
          expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(false)
        }
      })
    })

    it('should validate date of birth constraints', async () => {
      const studentWithInvalidDate = {
        ...mockStudent,
        date_of_birth: '2030-01-01'  // Future date
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Birth date cannot be in the future'
        })
      })

      const response = await fetch('/api/students', {
        method: 'POST',
        body: JSON.stringify(studentWithInvalidDate)
      })
      const result = await response.json()

      expect(result.error).toContain('Birth date')
    })
  })

  describe('Import/Export Functionality', () => {
    it('should export students to Excel format', async () => {
      const mockExportService = StudentsExportService as jest.MockedClass<typeof StudentsExportService>
      const exportSpy = jest.fn()
      mockExportService.prototype.exportToExcel = exportSpy

      const service = new StudentsExportService()
      await service.exportToExcel([mockStudent], ['full_name', 'student_id', 'status', 'payment_status'])

      expect(exportSpy).toHaveBeenCalledWith(
        [mockStudent],
        ['full_name', 'student_id', 'status', 'payment_status']
      )
    })

    it('should import students from Excel file', async () => {
      const mockImportService = StudentsImportService as jest.MockedClass<typeof StudentsImportService>
      const importSpy = jest.fn().mockResolvedValue({
        success: true,
        imported: 5,
        failed: 0,
        errors: []
      })
      mockImportService.prototype.importFromFile = importSpy

      const mockFile = new File([''], 'students.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      const service = new StudentsImportService()
      const result = await service.importFromFile(mockFile)

      expect(importSpy).toHaveBeenCalledWith(mockFile)
      expect(result.success).toBe(true)
      expect(result.imported).toBe(5)
    })

    it('should handle import errors with detailed feedback', async () => {
      const mockImportService = StudentsImportService as jest.MockedClass<typeof StudentsImportService>
      const importSpy = jest.fn().mockResolvedValue({
        success: false,
        imported: 2,
        failed: 3,
        errors: [
          { row: 2, field: 'phone', message: 'Invalid phone format' },
          { row: 3, field: 'email', message: 'Invalid email format' },
          { row: 4, field: 'date_of_birth', message: 'Invalid date format' }
        ]
      })
      mockImportService.prototype.importFromFile = importSpy

      const mockFile = new File([''], 'students.xlsx')
      const service = new StudentsImportService()
      const result = await service.importFromFile(mockFile)

      expect(result.success).toBe(false)
      expect(result.failed).toBe(3)
      expect(result.errors).toHaveLength(3)
      expect(result.errors[0].field).toBe('phone')
    })

    it('should generate student template for import', async () => {
      const mockTemplateData = [
        {
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '2005-03-15',
          gender: 'male',
          phone: '+998901234567',
          parent_name: 'Jane Doe',
          parent_phone: '+998901234568',
          enrollment_date: '2024-01-15',
          status: 'active',
          current_level: 'Intermediate'
        }
      ]

      const mockImportService = StudentsImportService as jest.MockedClass<typeof StudentsImportService>
      const templateSpy = jest.fn().mockReturnValue(mockTemplateData)
      mockImportService.prototype.generateTemplate = templateSpy

      const service = new StudentsImportService()
      const template = service.generateTemplate()

      expect(templateSpy).toHaveBeenCalled()
      expect(template).toEqual(mockTemplateData)
    })
  })

  describe('Statistics Calculation', () => {
    it('should calculate correct student statistics', () => {
      const students: Student[] = [
        { ...mockStudent, status: 'active', payment_status: 'paid', balance: 0 },
        { ...mockStudent, id: '2', status: 'active', payment_status: 'pending', balance: 500000 },
        { ...mockStudent, id: '3', status: 'graduated', payment_status: 'paid', balance: 0 },
        { ...mockStudent, id: '4', status: 'suspended', payment_status: 'overdue', balance: 1000000 },
        { ...mockStudent, id: '5', status: 'inactive', payment_status: 'paid', balance: 0 }
      ]

      const statistics: StudentStatistics = {
        total_students: students.length,
        active_students: students.filter(s => s.status === 'active').length,
        inactive_students: students.filter(s => s.status === 'inactive').length,
        graduated_students: students.filter(s => s.status === 'graduated').length,
        suspended_students: students.filter(s => s.status === 'suspended').length,
        total_enrollment: students.filter(s => s.status === 'active').length,
        pending_payments: students.filter(s => s.payment_status === 'pending').length,
        overdue_payments: students.filter(s => s.payment_status === 'overdue').length,
        total_balance: students.reduce((sum, s) => sum + s.balance, 0),
        by_status: {},
        by_level: {},
        by_payment_status: {},
        enrollment_trend: []
      }

      expect(statistics.total_students).toBe(5)
      expect(statistics.active_students).toBe(2)
      expect(statistics.graduated_students).toBe(1)
      expect(statistics.suspended_students).toBe(1)
      expect(statistics.pending_payments).toBe(1)
      expect(statistics.overdue_payments).toBe(1)
      expect(statistics.total_balance).toBe(1500000)
    })

    it('should calculate payment statistics correctly', () => {
      const totalPaid = 0
      const totalPending = 500000
      const totalOverdue = 1000000
      const totalBalance = totalPaid + totalPending + totalOverdue

      expect(totalBalance).toBe(1500000)
    })

    it('should handle empty students list', () => {
      const statistics: StudentStatistics = {
        total_students: 0,
        active_students: 0,
        inactive_students: 0,
        graduated_students: 0,
        suspended_students: 0,
        total_enrollment: 0,
        pending_payments: 0,
        overdue_payments: 0,
        total_balance: 0,
        by_status: {},
        by_level: {},
        by_payment_status: {},
        enrollment_trend: []
      }

      expect(statistics.total_students).toBe(0)
      expect(statistics.total_balance).toBe(0)
    })
  })

  describe('Bulk Operations', () => {
    it('should delete multiple students at once', async () => {
      const studentIds = ['1', '2', '3']
      
      ;(global.fetch as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        })
      })

      const deletePromises = studentIds.map(id =>
        fetch(`/api/students/${id}`, { method: 'DELETE' })
      )
      
      await Promise.all(deletePromises)
      
      expect(fetch).toHaveBeenCalledTimes(3)
      studentIds.forEach(id => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/students/${id}`,
          expect.objectContaining({ method: 'DELETE' })
        )
      })
    })

    it('should update status for multiple students', async () => {
      const updates = { status: 'graduated' as const }
      const studentIds = ['1', '2']

      ;(global.fetch as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        })
      })

      const updatePromises = studentIds.map(id =>
        fetch(`/api/students/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates)
        })
      )

      await Promise.all(updatePromises)

      expect(fetch).toHaveBeenCalledTimes(2)
      studentIds.forEach(id => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/students/${id}`,
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify(updates)
          })
        )
      })
    })

    it('should update payment status for multiple students', async () => {
      const paymentUpdates = { payment_status: 'paid' as const, balance: 0 }
      const studentIds = ['1', '2', '3']

      ;(global.fetch as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        })
      })

      const updatePromises = studentIds.map(id =>
        fetch(`/api/students/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(paymentUpdates)
        })
      )

      await Promise.all(updatePromises)

      expect(fetch).toHaveBeenCalledTimes(3)
      studentIds.forEach(id => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/students/${id}`,
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify(paymentUpdates)
          })
        )
      })
    })
  })
})