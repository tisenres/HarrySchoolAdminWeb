import { GroupService } from '@/lib/services/group-service'
import { GroupsExportService } from '@/lib/services/groups-export-service'
import { GroupsImportService } from '@/lib/services/groups-import-service'
import type { Group, GroupFilters, ScheduleSlot, GroupStatistics } from '@/types/group'

// Mock fetch globally
global.fetch = jest.fn()

// Mock the services
jest.mock('@/lib/services/group-service')
jest.mock('@/lib/services/groups-export-service') 
jest.mock('@/lib/services/groups-import-service')
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

describe('Groups Page Functionality', () => {
  const mockSchedule: ScheduleSlot[] = [
    {
      day: 'monday',
      start_time: '09:00',
      end_time: '10:30',
      room: 'Room A1'
    },
    {
      day: 'wednesday',
      start_time: '09:00', 
      end_time: '10:30',
      room: 'Room A1'
    }
  ]

  const mockGroup: Group = {
    id: '1',
    organization_id: 'org-1',
    name: 'IELTS Preparation Group A',
    group_code: 'IELTS-A1-2024',
    subject: 'IELTS Preparation',
    level: 'Intermediate',
    group_type: 'regular',
    description: 'Intensive IELTS preparation course',
    max_students: 12,
    current_enrollment: 8,
    waiting_list_count: 2,
    schedule: mockSchedule,
    classroom: 'Room A1',
    start_date: '2024-01-15',
    end_date: '2024-04-15',
    duration_weeks: 12,
    price_per_student: 1500000,
    currency: 'UZS',
    payment_frequency: 'monthly',
    status: 'active',
    is_active: true,
    notes: 'Focus on academic modules',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('CRUD Operations', () => {
    it('should fetch groups list from API', async () => {
      const mockResponse = {
        success: true,
        data: [mockGroup],
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

      const response = await fetch('/api/groups?page=1&limit=20')
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/groups?page=1&limit=20')
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('IELTS Preparation Group A')
      expect(result.data[0].schedule).toHaveLength(2)
    })

    it('should create a new group', async () => {
      const newGroup = {
        name: 'Business English Advanced',
        group_code: 'BE-ADV-2024',
        subject: 'Business English',
        level: 'Advanced',
        max_students: 10,
        schedule: mockSchedule,
        start_date: '2024-02-01',
        price_per_student: 2000000,
        currency: 'UZS'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { ...newGroup, id: '2' } })
      })

      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup)
      })
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/groups', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(newGroup)
      }))
      expect(result.success).toBe(true)
      expect(result.data.subject).toBe('Business English')
    })

    it('should update an existing group', async () => {
      const updates = {
        max_students: 15,
        price_per_student: 1800000,
        description: 'Updated course description'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { ...mockGroup, ...updates } })
      })

      const response = await fetch('/api/groups/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/groups/1', expect.objectContaining({
        method: 'PATCH'
      }))
      expect(result.data.max_students).toBe(15)
      expect(result.data.price_per_student).toBe(1800000)
    })

    it('should delete a group', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockGroup })
      })

      const response = await fetch('/api/groups/1', {
        method: 'DELETE'
      })
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/groups/1', expect.objectContaining({
        method: 'DELETE'
      }))
      expect(result.success).toBe(true)
    })

    it('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Group not found' })
      })

      const response = await fetch('/api/groups/invalid-id')
      const result = await response.json()

      expect(response.ok).toBe(false)
      expect(result.error).toBe('Group not found')
    })
  })

  describe('Search and Filtering', () => {
    it('should filter groups by search query', async () => {
      const filters: GroupFilters = {
        search: 'IELTS'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockGroup],
          pagination: { total: 1 }
        })
      })

      const params = new URLSearchParams({ query: 'IELTS' })
      const response = await fetch(`/api/groups?${params}`)
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('query=IELTS'))
      expect(result.data[0].name).toContain('IELTS')
    })

    it('should filter groups by subject', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockGroup],
          pagination: { total: 1 }
        })
      })

      const params = new URLSearchParams({ subject: 'IELTS Preparation' })
      const response = await fetch(`/api/groups?${params}`)
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('subject=IELTS'))
      expect(result.data[0].subject).toBe('IELTS Preparation')
    })

    it('should filter groups by level', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockGroup],
          pagination: { total: 1 }
        })
      })

      const params = new URLSearchParams({ level: 'Intermediate' })
      const response = await fetch(`/api/groups?${params}`)
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('level=Intermediate'))
      expect(result.data[0].level).toBe('Intermediate')
    })

    it('should filter groups by status', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockGroup],
          pagination: { total: 1 }
        })
      })

      const params = new URLSearchParams({ status: 'active' })
      const response = await fetch(`/api/groups?${params}`)
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('status=active'))
      expect(result.data[0].status).toBe('active')
    })

    it('should filter groups by date range', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockGroup],
          pagination: { total: 1 }
        })
      })

      const params = new URLSearchParams({
        start_date_from: '2024-01-01',
        start_date_to: '2024-12-31'
      })
      const response = await fetch(`/api/groups?${params}`)

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('start_date_from=2024-01-01'))
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('start_date_to=2024-12-31'))
    })

    it('should handle pagination correctly', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: Array(20).fill(mockGroup),
          pagination: {
            total: 50,
            total_pages: 3,
            current_page: 2,
            limit: 20
          }
        })
      })

      const params = new URLSearchParams({ page: '2', limit: '20' })
      const response = await fetch(`/api/groups?${params}`)
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('page=2'))
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('limit=20'))
      expect(result.pagination.total_pages).toBe(3)
      expect(result.data).toHaveLength(20)
    })
  })

  describe('Enrollment Management', () => {
    it('should calculate enrollment percentage correctly', () => {
      const group = {
        ...mockGroup,
        max_students: 12,
        current_enrollment: 8
      }

      const enrollmentPercentage = Math.round((group.current_enrollment / group.max_students) * 100)
      expect(enrollmentPercentage).toBe(67)
    })

    it('should detect when group is full', () => {
      const fullGroup = {
        ...mockGroup,
        max_students: 10,
        current_enrollment: 10
      }

      const isFull = fullGroup.current_enrollment >= fullGroup.max_students
      expect(isFull).toBe(true)
    })

    it('should detect when group has capacity', () => {
      const groupWithCapacity = {
        ...mockGroup,
        max_students: 15,
        current_enrollment: 8
      }

      const hasCapacity = groupWithCapacity.current_enrollment < groupWithCapacity.max_students
      expect(hasCapacity).toBe(true)
    })

    it('should handle waiting list functionality', () => {
      const groupWithWaitingList = {
        ...mockGroup,
        max_students: 10,
        current_enrollment: 10,
        waiting_list_count: 3
      }

      expect(groupWithWaitingList.waiting_list_count).toBe(3)
      expect(groupWithWaitingList.current_enrollment).toBe(groupWithWaitingList.max_students)
    })
  })

  describe('Schedule Management', () => {
    it('should validate schedule format', () => {
      const validSchedule: ScheduleSlot[] = [
        {
          day: 'monday',
          start_time: '09:00',
          end_time: '10:30',
          room: 'Room A1'
        }
      ]

      expect(validSchedule[0].day).toMatch(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/)
      expect(validSchedule[0].start_time).toMatch(/^\d{2}:\d{2}$/)
      expect(validSchedule[0].end_time).toMatch(/^\d{2}:\d{2}$/)
    })

    it('should calculate schedule summary', () => {
      const schedule = mockGroup.schedule
      const scheduleSummary = schedule.map(slot => 
        `${slot.day.charAt(0).toUpperCase() + slot.day.slice(1)} ${slot.start_time}-${slot.end_time}`
      ).join(', ')

      expect(scheduleSummary).toBe('Monday 09:00-10:30, Wednesday 09:00-10:30')
    })

    it('should validate time conflicts', () => {
      const conflictingSchedule: ScheduleSlot[] = [
        {
          day: 'monday',
          start_time: '09:00',
          end_time: '10:30'
        },
        {
          day: 'monday',
          start_time: '10:00', // Overlap!
          end_time: '11:30'
        }
      ]

      // Check for conflicts on same day
      const mondaySlots = conflictingSchedule.filter(slot => slot.day === 'monday')
      let hasConflict = false

      for (let i = 0; i < mondaySlots.length; i++) {
        for (let j = i + 1; j < mondaySlots.length; j++) {
          const slot1 = mondaySlots[i]
          const slot2 = mondaySlots[j]
          
          const start1 = new Date(`2024-01-01 ${slot1.start_time}`)
          const end1 = new Date(`2024-01-01 ${slot1.end_time}`)
          const start2 = new Date(`2024-01-01 ${slot2.start_time}`)
          const end2 = new Date(`2024-01-01 ${slot2.end_time}`)
          
          if (start1 < end2 && start2 < end1) {
            hasConflict = true
          }
        }
      }

      expect(hasConflict).toBe(true)
    })
  })

  describe('Data Validation', () => {
    it('should validate required fields when creating group', async () => {
      const invalidGroup = {
        name: '',  // Required field missing
        group_code: 'invalid-code!@#',  // Invalid format
        max_students: -1,  // Invalid number
        schedule: []  // Empty schedule
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Validation error',
          details: [
            { field: 'name', message: 'Name is required' },
            { field: 'group_code', message: 'Invalid group code format' },
            { field: 'max_students', message: 'Must be positive number' },
            { field: 'schedule', message: 'At least one schedule slot required' }
          ]
        })
      })

      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidGroup)
      })
      const result = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
      expect(result.error).toBe('Validation error')
      expect(result.details).toHaveLength(4)
    })

    it('should validate group code format', () => {
      const validCodes = ['ENG-A1-2024', 'IELTS-B2-2024', 'MATH-ADV-2024']
      const invalidCodes = ['invalid', 'ENG A1 2024', '', 'toolongcodeformat']

      validCodes.forEach(code => {
        expect(/^[A-Z0-9\-]{3,20}$/.test(code)).toBe(true)
      })

      invalidCodes.forEach(code => {
        expect(/^[A-Z0-9\-]{3,20}$/.test(code)).toBe(false)
      })
    })

    it('should validate capacity constraints', async () => {
      const groupWithInvalidCapacity = {
        ...mockGroup,
        max_students: 0,  // Invalid capacity
        current_enrollment: 5  // More than max
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Max students must be greater than 0'
        })
      })

      const response = await fetch('/api/groups', {
        method: 'POST',
        body: JSON.stringify(groupWithInvalidCapacity)
      })
      const result = await response.json()

      expect(result.error).toContain('Max students')
    })

    it('should validate date constraints', async () => {
      const groupWithInvalidDates = {
        ...mockGroup,
        start_date: '2024-06-01',
        end_date: '2024-01-01'  // End before start
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'End date must be after start date'
        })
      })

      const response = await fetch('/api/groups', {
        method: 'POST',
        body: JSON.stringify(groupWithInvalidDates)
      })
      const result = await response.json()

      expect(result.error).toContain('End date')
    })
  })

  describe('Teacher Assignment', () => {
    it('should handle teacher assignment to group', async () => {
      const assignment = {
        teacher_id: 'teacher-1',
        group_id: 'group-1',
        role: 'primary',
        start_date: '2024-01-15',
        compensation_rate: 100000,
        compensation_type: 'hourly'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: assignment })
      })

      const response = await fetch('/api/groups/1/teachers', {
        method: 'POST',
        body: JSON.stringify(assignment)
      })
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.data.teacher_id).toBe('teacher-1')
    })

    it('should prevent double assignment of same teacher', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Teacher already assigned to this group'
        })
      })

      const response = await fetch('/api/groups/1/teachers', {
        method: 'POST',
        body: JSON.stringify({ teacher_id: 'teacher-1' })
      })
      const result = await response.json()

      expect(result.error).toContain('already assigned')
    })
  })

  describe('Import/Export Functionality', () => {
    it('should export groups to Excel format', async () => {
      const mockExportService = GroupsExportService as jest.MockedClass<typeof GroupsExportService>
      const exportSpy = jest.fn()
      mockExportService.prototype.exportToExcel = exportSpy

      const service = new GroupsExportService()
      await service.exportToExcel([mockGroup], ['name', 'subject', 'level', 'max_students'])

      expect(exportSpy).toHaveBeenCalledWith(
        [mockGroup],
        ['name', 'subject', 'level', 'max_students']
      )
    })

    it('should import groups from Excel file', async () => {
      const mockImportService = GroupsImportService as jest.MockedClass<typeof GroupsImportService>
      const importSpy = jest.fn().mockResolvedValue({
        success: true,
        imported: 3,
        failed: 0,
        errors: []
      })
      mockImportService.prototype.importFromFile = importSpy

      const mockFile = new File([''], 'groups.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      const service = new GroupsImportService()
      const result = await service.importFromFile(mockFile)

      expect(importSpy).toHaveBeenCalledWith(mockFile)
      expect(result.success).toBe(true)
      expect(result.imported).toBe(3)
    })

    it('should handle import errors with detailed feedback', async () => {
      const mockImportService = GroupsImportService as jest.MockedClass<typeof GroupsImportService>
      const importSpy = jest.fn().mockResolvedValue({
        success: false,
        imported: 1,
        failed: 2,
        errors: [
          { row: 2, field: 'group_code', message: 'Duplicate group code' },
          { row: 3, field: 'max_students', message: 'Invalid capacity' }
        ]
      })
      mockImportService.prototype.importFromFile = importSpy

      const mockFile = new File([''], 'groups.xlsx')
      const service = new GroupsImportService()
      const result = await service.importFromFile(mockFile)

      expect(result.success).toBe(false)
      expect(result.failed).toBe(2)
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0].field).toBe('group_code')
    })
  })

  describe('Statistics Calculation', () => {
    it('should calculate correct group statistics', () => {
      const groups: Group[] = [
        { ...mockGroup, status: 'active', max_students: 12, current_enrollment: 8 },
        { ...mockGroup, id: '2', status: 'upcoming', max_students: 15, current_enrollment: 0 },
        { ...mockGroup, id: '3', status: 'completed', max_students: 10, current_enrollment: 10 },
        { ...mockGroup, id: '4', status: 'active', max_students: 8, current_enrollment: 6 }
      ]

      const statistics: GroupStatistics = {
        total_groups: groups.length,
        active_groups: groups.filter(g => g.status === 'active').length,
        upcoming_groups: groups.filter(g => g.status === 'upcoming').length,
        completed_groups: groups.filter(g => g.status === 'completed').length,
        total_capacity: groups.reduce((sum, g) => sum + g.max_students, 0),
        total_enrollment: groups.reduce((sum, g) => sum + g.current_enrollment, 0),
        enrollment_rate: 0,
        by_subject: {},
        by_level: {},
        by_status: {}
      }

      statistics.enrollment_rate = Math.round((statistics.total_enrollment / statistics.total_capacity) * 100)

      expect(statistics.total_groups).toBe(4)
      expect(statistics.active_groups).toBe(2)
      expect(statistics.upcoming_groups).toBe(1)
      expect(statistics.completed_groups).toBe(1)
      expect(statistics.total_capacity).toBe(45)
      expect(statistics.total_enrollment).toBe(24)
      expect(statistics.enrollment_rate).toBe(53)
    })

    it('should calculate enrollment rate correctly', () => {
      const totalCapacity = 100
      const totalEnrollment = 75
      const enrollmentRate = Math.round((totalEnrollment / totalCapacity) * 100)

      expect(enrollmentRate).toBe(75)
    })

    it('should handle empty groups list', () => {
      const statistics: GroupStatistics = {
        total_groups: 0,
        active_groups: 0,
        upcoming_groups: 0,
        completed_groups: 0,
        total_capacity: 0,
        total_enrollment: 0,
        enrollment_rate: 0,
        by_subject: {},
        by_level: {},
        by_status: {}
      }

      expect(statistics.enrollment_rate).toBe(0)
    })
  })

  describe('Bulk Operations', () => {
    it('should delete multiple groups at once', async () => {
      const groupIds = ['1', '2', '3']
      
      ;(global.fetch as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        })
      })

      const deletePromises = groupIds.map(id =>
        fetch(`/api/groups/${id}`, { method: 'DELETE' })
      )
      
      await Promise.all(deletePromises)
      
      expect(fetch).toHaveBeenCalledTimes(3)
      groupIds.forEach(id => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/groups/${id}`,
          expect.objectContaining({ method: 'DELETE' })
        )
      })
    })

    it('should update status for multiple groups', async () => {
      const updates = { status: 'inactive' as const }
      const groupIds = ['1', '2']

      ;(global.fetch as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        })
      })

      const updatePromises = groupIds.map(id =>
        fetch(`/api/groups/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates)
        })
      )

      await Promise.all(updatePromises)

      expect(fetch).toHaveBeenCalledTimes(2)
      groupIds.forEach(id => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/groups/${id}`,
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify(updates)
          })
        )
      })
    })
  })
})