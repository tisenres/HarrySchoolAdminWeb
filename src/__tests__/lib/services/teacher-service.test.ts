import { TeacherService } from '@/lib/services/teacher-service'
import { 
  createMockTeacher,
  createMockCreateTeacherRequest
} from '../../utils/mock-data'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
}

// Mock query builder
const mockQuery = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  overlaps: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn(),
}

// Mock BaseService methods
jest.mock('@/lib/services/base-service', () => {
  return {
    BaseService: class MockBaseService {
      protected supabase = mockSupabase
      protected tableName: string

      constructor(tableName: string) {
        this.tableName = tableName
      }

      protected async checkPermission(_roles: string[]) {
        return true
      }

      protected async getCurrentUser() {
        return { id: 'user-id', email: 'test@example.com' }
      }

      protected async getCurrentOrganization() {
        return 'org-id'
      }

      protected async logActivity(
        _action: string,
        _entityId: string,
        _entityName: string,
        _oldData: any,
        _newData: any,
        _description: string
      ) {
        return Promise.resolve()
      }

      protected applySorting(query: any, sortBy: string, sortOrder: string) {
        return query.order(sortBy, { ascending: sortOrder === 'asc' })
      }

      protected applyPagination(query: any, page: number, limit: number) {
        const offset = (page - 1) * limit
        return query.range(offset, offset + limit - 1)
      }
    }
  }
})

describe('TeacherService', () => {
  let teacherService: TeacherService
  const mockTeacher = createMockTeacher()
  const mockTeacherRequest = createMockCreateTeacherRequest()

  beforeEach(() => {
    jest.clearAllMocks()
    teacherService = new TeacherService()
    mockSupabase.from.mockReturnValue(mockQuery)
  })

  describe('create', () => {
    it('creates a new teacher successfully', async () => {
      mockQuery.single.mockResolvedValue({
        data: mockTeacher,
        error: null
      })

      const result = await teacherService.create(mockTeacherRequest)

      expect(mockSupabase.from).toHaveBeenCalledWith('teachers')
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockTeacherRequest,
          organization_id: 'org-id',
          created_by: 'user-id',
          updated_by: 'user-id'
        })
      )
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(mockTeacher)
    })

    it('validates input data before creation', async () => {
      const invalidRequest = {
        ...mockTeacherRequest,
        first_name: '', // Invalid - required field
      }

      await expect(teacherService.create(invalidRequest)).rejects.toThrow()
    })

    it('handles database errors during creation', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      await expect(teacherService.create(mockTeacherRequest)).rejects.toThrow(
        'Failed to create teacher: Database error'
      )
    })

    it('requires admin permissions', async () => {
      // const originalCheckPermission = teacherService['checkPermission']
      teacherService['checkPermission'] = jest.fn().mockRejectedValue(new Error('Access denied'))

      await expect(teacherService.create(mockTeacherRequest)).rejects.toThrow('Access denied')
    })
  })

  describe('getById', () => {
    it('retrieves a teacher by ID successfully', async () => {
      mockQuery.single.mockResolvedValue({
        data: mockTeacher,
        error: null
      })

      const result = await teacherService.getById(mockTeacher.id)

      expect(mockSupabase.from).toHaveBeenCalledWith('teachers')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', mockTeacher.id)
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-id')
      expect(mockQuery.eq).toHaveBeenCalledWith('deleted_at', null)
      expect(result).toEqual(mockTeacher)
    })

    it('handles teacher not found', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'No rows returned' }
      })

      await expect(teacherService.getById('non-existent-id')).rejects.toThrow(
        'Failed to get teacher: No rows returned'
      )
    })

    it('filters by organization ID', async () => {
      mockQuery.single.mockResolvedValue({
        data: mockTeacher,
        error: null
      })

      await teacherService.getById(mockTeacher.id)

      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-id')
    })

    it('excludes soft-deleted teachers', async () => {
      mockQuery.single.mockResolvedValue({
        data: mockTeacher,
        error: null
      })

      await teacherService.getById(mockTeacher.id)

      expect(mockQuery.eq).toHaveBeenCalledWith('deleted_at', null)
    })
  })

  describe('getAll', () => {
    const mockTeachers = [mockTeacher]
    const mockResponse = {
      data: mockTeachers,
      error: null,
      count: mockTeachers.length
    }

    it('retrieves all teachers with default pagination', async () => {
      mockQuery.mockResolvedValue(mockResponse)

      const result = await teacherService.getAll()

      expect(mockSupabase.from).toHaveBeenCalledWith('teachers')
      expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact' })
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-id')
      expect(mockQuery.eq).toHaveBeenCalledWith('deleted_at', null)
      expect(result).toEqual({
        data: mockTeachers,
        count: mockTeachers.length,
        total_pages: 1
      })
    })

    it('applies text search filter', async () => {
      mockQuery.mockResolvedValue(mockResponse)

      await teacherService.getAll({ query: 'John Doe' })

      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('first_name.ilike.%John Doe%')
      )
    })

    it('applies employment status filter', async () => {
      mockQuery.mockResolvedValue(mockResponse)

      await teacherService.getAll({ employment_status: 'active' })

      expect(mockQuery.eq).toHaveBeenCalledWith('employment_status', 'active')
    })

    it('applies specializations filter', async () => {
      mockQuery.mockResolvedValue(mockResponse)

      await teacherService.getAll({ 
        specializations: ['English', 'Mathematics'] 
      })

      expect(mockQuery.overlaps).toHaveBeenCalledWith('specializations', ['English', 'Mathematics'])
    })

    it('applies date range filters', async () => {
      mockQuery.mockResolvedValue(mockResponse)
      const fromDate = new Date('2024-01-01')
      const toDate = new Date('2024-12-31')

      await teacherService.getAll({ 
        hire_date_from: fromDate,
        hire_date_to: toDate 
      })

      expect(mockQuery.gte).toHaveBeenCalledWith('hire_date', fromDate)
      expect(mockQuery.lte).toHaveBeenCalledWith('hire_date', toDate)
    })

    it('applies active status filter', async () => {
      mockQuery.mockResolvedValue(mockResponse)

      await teacherService.getAll({ is_active: true })

      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true)
    })

    it('applies custom pagination', async () => {
      mockQuery.mockResolvedValue(mockResponse)

      await teacherService.getAll(undefined, {
        page: 2,
        limit: 10,
        sort_by: 'full_name',
        sort_order: 'desc'
      })

      expect(mockQuery.order).toHaveBeenCalledWith('full_name', { ascending: false })
      expect(mockQuery.range).toHaveBeenCalledWith(10, 19) // page 2, limit 10
    })

    it('handles database errors', async () => {
      mockQuery.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: 0
      })

      await expect(teacherService.getAll()).rejects.toThrow(
        'Failed to get teachers: Database error'
      )
    })

    it('calculates total pages correctly', async () => {
      mockQuery.mockResolvedValue({
        data: mockTeachers,
        error: null,
        count: 45 // Should result in 3 pages with default limit of 20
      })

      const result = await teacherService.getAll()

      expect(result.total_pages).toBe(3)
    })
  })

  describe('update', () => {
    const updateData = {
      first_name: 'Updated John',
      last_name: 'Updated Doe'
    }

    beforeEach(() => {
      // Mock getById for existing teacher retrieval
      jest.spyOn(teacherService, 'getById').mockResolvedValue(mockTeacher)
    })

    it('updates a teacher successfully', async () => {
      const updatedTeacher = { ...mockTeacher, ...updateData }
      mockQuery.single.mockResolvedValue({
        data: updatedTeacher,
        error: null
      })

      const result = await teacherService.update(mockTeacher.id, updateData)

      expect(mockSupabase.from).toHaveBeenCalledWith('teachers')
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateData,
          updated_by: 'user-id'
        })
      )
      expect(mockQuery.eq).toHaveBeenCalledWith('id', mockTeacher.id)
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-id')
      expect(mockQuery.eq).toHaveBeenCalledWith('deleted_at', null)
      expect(result).toEqual(updatedTeacher)
    })

    it('validates update data', async () => {
      const invalidUpdate = {
        first_name: '', // Invalid
      }

      await expect(teacherService.update(mockTeacher.id, invalidUpdate)).rejects.toThrow()
    })

    it('requires admin permissions', async () => {
      teacherService['checkPermission'] = jest.fn().mockRejectedValue(new Error('Access denied'))

      await expect(teacherService.update(mockTeacher.id, updateData)).rejects.toThrow('Access denied')
    })

    it('handles teacher not found during update', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'No rows returned' }
      })

      await expect(teacherService.update(mockTeacher.id, updateData)).rejects.toThrow(
        'Failed to update teacher: No rows returned'
      )
    })
  })

  describe('delete (soft delete)', () => {
    beforeEach(() => {
      jest.spyOn(teacherService, 'getById').mockResolvedValue(mockTeacher)
    })

    it('soft deletes a teacher successfully', async () => {
      const deletedTeacher = { ...mockTeacher, deleted_at: new Date().toISOString() }
      mockQuery.single.mockResolvedValue({
        data: deletedTeacher,
        error: null
      })

      const result = await teacherService.delete(mockTeacher.id)

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(String),
          deleted_by: 'user-id'
        })
      )
      expect(result).toEqual(deletedTeacher)
    })

    it('requires admin permissions', async () => {
      teacherService['checkPermission'] = jest.fn().mockRejectedValue(new Error('Access denied'))

      await expect(teacherService.delete(mockTeacher.id)).rejects.toThrow('Access denied')
    })

    it('handles deletion errors', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Deletion failed' }
      })

      await expect(teacherService.delete(mockTeacher.id)).rejects.toThrow(
        'Failed to delete teacher: Deletion failed'
      )
    })
  })

  describe('restore', () => {
    it('restores a soft-deleted teacher successfully', async () => {
      const restoredTeacher = { ...mockTeacher, deleted_at: null }
      mockQuery.single.mockResolvedValue({
        data: restoredTeacher,
        error: null
      })

      const result = await teacherService.restore(mockTeacher.id)

      expect(mockQuery.update).toHaveBeenCalledWith({
        deleted_at: null,
        deleted_by: null
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', mockTeacher.id)
      expect(result).toEqual(restoredTeacher)
    })

    it('requires admin permissions', async () => {
      teacherService['checkPermission'] = jest.fn().mockRejectedValue(new Error('Access denied'))

      await expect(teacherService.restore(mockTeacher.id)).rejects.toThrow('Access denied')
    })
  })

  describe('getBySpecialization', () => {
    it('retrieves teachers by specialization', async () => {
      const englishTeachers = [mockTeacher]
      mockQuery.mockResolvedValue({
        data: englishTeachers,
        error: null
      })

      const result = await teacherService.getBySpecialization('English')

      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-id')
      expect(mockQuery.eq).toHaveBeenCalledWith('deleted_at', null)
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true)
      expect(mockQuery.contains).toHaveBeenCalledWith('specializations', ['English'])
      expect(mockQuery.order).toHaveBeenCalledWith('first_name')
      expect(result).toEqual(englishTeachers)
    })

    it('returns empty array when no teachers found', async () => {
      mockQuery.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await teacherService.getBySpecialization('NonExistent')

      expect(result).toEqual([])
    })
  })

  describe('getAvailableTeachers', () => {
    it('retrieves available teachers for assignment', async () => {
      const availableTeachers = [mockTeacher]
      mockQuery.mockResolvedValue({
        data: availableTeachers,
        error: null
      })

      const result = await teacherService.getAvailableTeachers()

      expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining('teacher_group_assignments'))
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true)
      expect(mockQuery.eq).toHaveBeenCalledWith('employment_status', 'active')
      expect(result).toEqual(availableTeachers)
    })
  })

  describe('getStatistics', () => {
    it('calculates teacher statistics correctly', async () => {
      const mockTeachersForStats = [
        { employment_status: 'active', specializations: ['English'], is_active: true },
        { employment_status: 'active', specializations: ['Mathematics'], is_active: true },
        { employment_status: 'inactive', specializations: ['English', 'Science'], is_active: false },
      ]

      mockQuery.mockResolvedValue({
        data: mockTeachersForStats,
        error: null
      })

      const result = await teacherService.getStatistics()

      expect(result).toEqual({
        total: 3,
        active: 2,
        inactive: 1,
        by_employment_status: {
          active: 2,
          inactive: 1
        },
        by_specialization: {
          English: 2,
          Mathematics: 1,
          Science: 1
        }
      })
    })

    it('handles empty data gracefully', async () => {
      mockQuery.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await teacherService.getStatistics()

      expect(result).toEqual({
        total: 0,
        active: 0,
        inactive: 0,
        by_employment_status: {},
        by_specialization: {}
      })
    })

    it('handles null specializations', async () => {
      const mockTeachersWithNullSpecs = [
        { employment_status: 'active', specializations: null, is_active: true },
      ]

      mockQuery.mockResolvedValue({
        data: mockTeachersWithNullSpecs,
        error: null
      })

      const result = await teacherService.getStatistics()

      expect(result.by_specialization).toEqual({})
    })
  })

  describe('bulkDelete', () => {
    it('deletes multiple teachers successfully', async () => {
      jest.spyOn(teacherService, 'delete')
        .mockResolvedValueOnce(mockTeacher)
        .mockResolvedValueOnce(mockTeacher)

      const result = await teacherService.bulkDelete(['id1', 'id2'])

      expect(result).toEqual({
        success: 2,
        errors: []
      })
    })

    it('handles partial failures gracefully', async () => {
      jest.spyOn(teacherService, 'delete')
        .mockResolvedValueOnce(mockTeacher)
        .mockRejectedValueOnce(new Error('Delete failed'))

      const result = await teacherService.bulkDelete(['id1', 'id2'])

      expect(result).toEqual({
        success: 1,
        errors: ['Failed to delete teacher id2: Delete failed']
      })
    })

    it('requires admin permissions', async () => {
      teacherService['checkPermission'] = jest.fn().mockRejectedValue(new Error('Access denied'))

      await expect(teacherService.bulkDelete(['id1', 'id2'])).rejects.toThrow('Access denied')
    })
  })

  describe('bulkRestore', () => {
    it('restores multiple teachers successfully', async () => {
      jest.spyOn(teacherService, 'restore')
        .mockResolvedValueOnce(mockTeacher)
        .mockResolvedValueOnce(mockTeacher)

      const result = await teacherService.bulkRestore(['id1', 'id2'])

      expect(result).toEqual({
        success: 2,
        errors: []
      })
    })

    it('handles partial failures gracefully', async () => {
      jest.spyOn(teacherService, 'restore')
        .mockResolvedValueOnce(mockTeacher)
        .mockRejectedValueOnce(new Error('Restore failed'))

      const result = await teacherService.bulkRestore(['id1', 'id2'])

      expect(result).toEqual({
        success: 1,
        errors: ['Failed to restore teacher id2: Restore failed']
      })
    })

    it('requires admin permissions', async () => {
      teacherService['checkPermission'] = jest.fn().mockRejectedValue(new Error('Access denied'))

      await expect(teacherService.bulkRestore(['id1', 'id2'])).rejects.toThrow('Access denied')
    })
  })

  describe('Error Handling', () => {
    it('handles Supabase connection errors', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Connection failed')
      })

      await expect(teacherService.getAll()).rejects.toThrow('Connection failed')
    })

    it('handles malformed query responses', async () => {
      mockQuery.mockResolvedValue({
        data: undefined,
        error: null,
        count: null
      })

      const result = await teacherService.getAll()

      expect(result).toEqual({
        data: [],
        count: 0,
        total_pages: 0
      })
    })

    it('handles permission check failures', async () => {
      teacherService['checkPermission'] = jest.fn().mockRejectedValue(new Error('Permission denied'))

      await expect(teacherService.create(mockTeacherRequest)).rejects.toThrow('Permission denied')
    })
  })

  describe('Data Validation', () => {
    it('validates complex nested objects', async () => {
      const invalidRequest = {
        ...mockTeacherRequest,
        qualifications: [
          {
            id: 'valid-id',
            degree: '', // Invalid - required
            institution: 'Valid University',
            year: 2020
          }
        ]
      }

      await expect(teacherService.create(invalidRequest)).rejects.toThrow()
    })

    it('validates array constraints', async () => {
      const requestWithEmptyArrays = {
        ...mockTeacherRequest,
        specializations: [], // Valid - can be empty
        languages_spoken: [] // Valid - can be empty
      }

      mockQuery.single.mockResolvedValue({
        data: mockTeacher,
        error: null
      })

      const result = await teacherService.create(requestWithEmptyArrays)

      expect(result).toEqual(mockTeacher)
    })

    it('handles date validation', async () => {
      const requestWithFutureDates = {
        ...mockTeacherRequest,
        hire_date: new Date(Date.now() + 86400000), // Tomorrow
        date_of_birth: new Date(Date.now() + 86400000) // Tomorrow
      }

      await expect(teacherService.create(requestWithFutureDates)).rejects.toThrow()
    })
  })
})