/**
 * Mock Teacher Service for Client-Side Development
 * 
 * This service provides a client-side implementation for teacher operations
 * using mock data. It simulates API calls and database operations without
 * requiring server-side access or service role keys.
 * 
 * Security Note: This service is safe for client-side usage as it doesn't
 * access any server-side resources or sensitive environment variables.
 */

import { createMockTeacherList, createMockTeacher } from '@/__tests__/utils/mock-data'
import type { Teacher, TeacherFilters, TeacherSortConfig } from '@/types/teacher'
import type { CreateTeacherRequest } from '@/lib/validations/teacher'

export class MockTeacherService {
  private static instance: MockTeacherService
  private teachers: Teacher[]
  private nextId: number = 1

  constructor() {
    // Initialize with comprehensive mock data
    this.teachers = this.generateMockTeachers()
  }

  static getInstance(): MockTeacherService {
    if (!MockTeacherService.instance) {
      MockTeacherService.instance = new MockTeacherService()
    }
    return MockTeacherService.instance
  }

  private generateMockTeachers(): Teacher[] {
    const specializations = [
      'English', 'Mathematics', 'Computer Science', 'IELTS Preparation', 
      'TOEFL Preparation', 'Business English', 'Physics', 'Chemistry', 
      'Biology', 'Academic Writing', 'Conversation', 'Grammar'
    ]

    return createMockTeacherList(15).map((teacher, index) => ({
      ...teacher,
      id: `teacher-${index + 1}`,
      organization_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      employee_id: `HS2024${String(index + 1).padStart(3, '0')}`,
      employment_status: index % 4 === 0 ? 'inactive' : 'active',
      contract_type: index % 2 === 0 ? 'full_time' : 'part_time',
      specializations: specializations.slice(index % 3, (index % 3) + 2),
      salary_amount: index % 2 === 0 ? 8000000 : 5000000,
      is_active: index % 5 !== 4, // 80% active
      hire_date: new Date(2024, index % 12, (index % 28) + 1),
    }))
  }

  /**
   * Simulate API delay
   */
  private async delay(ms: number = 300): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get all teachers with filtering, searching, and pagination
   */
  async getAll(
    filters?: TeacherFilters,
    sortConfig?: TeacherSortConfig,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    data: Teacher[]
    count: number
    total_pages: number
    current_page: number
    page_size: number
  }> {
    await this.delay()

    let filteredTeachers = [...this.teachers]

    // Apply filters
    if (filters) {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredTeachers = filteredTeachers.filter(teacher => {
          const searchableText = `${teacher.full_name} ${teacher.email || ''} ${teacher.phone} ${teacher.employee_id || ''}`.toLowerCase()
          return searchableText.includes(searchLower)
        })
      }

      if (filters.employment_status?.length) {
        filteredTeachers = filteredTeachers.filter(t => 
          filters.employment_status!.includes(t.employment_status)
        )
      }

      if (filters.specializations?.length) {
        filteredTeachers = filteredTeachers.filter(t => 
          filters.specializations!.some(spec => t.specializations.includes(spec))
        )
      }

      if (filters.is_active !== undefined) {
        filteredTeachers = filteredTeachers.filter(t => t.is_active === filters.is_active)
      }

      if (filters.contract_type?.length) {
        filteredTeachers = filteredTeachers.filter(t => 
          filters.contract_type!.includes(t.contract_type!)
        )
      }
    }

    // Apply sorting
    if (sortConfig) {
      filteredTeachers.sort((a, b) => {
        const aValue = a[sortConfig.field as keyof Teacher]
        const bValue = b[sortConfig.field as keyof Teacher]
        
        if (aValue === undefined && bValue === undefined) return 0
        if (aValue === undefined) return 1
        if (bValue === undefined) return -1
        
        let comparison = 0
        if (aValue < bValue) comparison = -1
        if (aValue > bValue) comparison = 1
        
        return sortConfig.direction === 'desc' ? -comparison : comparison
      })
    }

    // Apply pagination
    const totalCount = filteredTeachers.length
    const totalPages = Math.ceil(totalCount / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedTeachers = filteredTeachers.slice(startIndex, endIndex)

    return {
      data: paginatedTeachers,
      count: totalCount,
      total_pages: totalPages,
      current_page: page,
      page_size: pageSize
    }
  }

  /**
   * Get teacher by ID
   */
  async getById(id: string): Promise<Teacher | null> {
    await this.delay()
    return this.teachers.find(teacher => teacher.id === id) || null
  }

  /**
   * Create a new teacher
   */
  async create(teacherData: CreateTeacherRequest): Promise<Teacher> {
    await this.delay(500) // Longer delay for create operations

    const baseTeacher = createMockTeacher()
    const newTeacher = {
      ...baseTeacher,
      id: `teacher-new-${this.nextId++}`,
      organization_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      first_name: teacherData.first_name,
      last_name: teacherData.last_name,
      full_name: `${teacherData.first_name} ${teacherData.last_name}`,
      email: teacherData.email,
      phone: teacherData.phone,
      date_of_birth: teacherData.date_of_birth,
      gender: teacherData.gender,
      employee_id: teacherData.employee_id,
      hire_date: teacherData.hire_date,
      employment_status: teacherData.employment_status,
      contract_type: teacherData.contract_type,
      salary_amount: teacherData.salary_amount,
      salary_currency: 'UZS',
      specializations: teacherData.specializations,
      qualifications: teacherData.qualifications || [],
      certifications: teacherData.certifications || [],
      languages_spoken: teacherData.languages_spoken,
      documents: [],
      ...(teacherData.address && { address: teacherData.address }),
      ...(teacherData.emergency_contact && { emergency_contact: teacherData.emergency_contact }),
      notes: teacherData.notes,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    } as Teacher

    this.teachers.push(newTeacher)
    return newTeacher
  }

  /**
   * Update an existing teacher
   */
  async update(id: string, teacherData: Partial<CreateTeacherRequest>): Promise<Teacher> {
    await this.delay(500)

    const teacherIndex = this.teachers.findIndex(teacher => teacher.id === id)
    if (teacherIndex === -1) {
      throw new Error('Teacher not found')
    }

    const existingTeacher = this.teachers[teacherIndex]
    const updatedTeacher = {
      ...existingTeacher,
      ...teacherData,
      full_name: teacherData.first_name && teacherData.last_name 
        ? `${teacherData.first_name} ${teacherData.last_name}`
        : existingTeacher?.full_name || '',
      updated_at: new Date()
    } as Teacher

    this.teachers[teacherIndex] = updatedTeacher
    return updatedTeacher
  }

  /**
   * Delete a teacher (soft delete simulation)
   */
  async delete(id: string): Promise<Teacher> {
    await this.delay()

    const teacherIndex = this.teachers.findIndex(teacher => teacher.id === id)
    if (teacherIndex === -1) {
      throw new Error('Teacher not found')
    }

    const teacher = this.teachers[teacherIndex]
    const deletedTeacher = {
      ...teacher,
      is_active: false,
      updated_at: new Date()
    } as Teacher

    this.teachers[teacherIndex] = deletedTeacher
    return deletedTeacher
  }

  /**
   * Bulk delete teachers
   */
  async bulkDelete(ids: string[]): Promise<{ success: number; errors: string[] }> {
    await this.delay(700)

    const results = { success: 0, errors: [] as string[] }

    for (const id of ids) {
      try {
        await this.delete(id)
        results.success++
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        results.errors.push(`Failed to delete teacher ${id}: ${message}`)
      }
    }

    return results
  }

  /**
   * Get teacher statistics
   */
  async getStatistics(): Promise<{
    total: number
    active: number
    inactive: number
    full_time: number
    part_time: number
    by_specialization: Record<string, number>
  }> {
    await this.delay()

    const stats = {
      total: this.teachers.length,
      active: this.teachers.filter(t => t.employment_status === 'active').length,
      inactive: this.teachers.filter(t => t.employment_status !== 'active').length,
      full_time: this.teachers.filter(t => t.contract_type === 'full_time').length,
      part_time: this.teachers.filter(t => t.contract_type === 'part_time').length,
      by_specialization: {} as Record<string, number>
    }

    // Count by specializations
    this.teachers.forEach(teacher => {
      teacher.specializations.forEach(spec => {
        stats.by_specialization[spec] = (stats.by_specialization[spec] || 0) + 1
      })
    })

    return stats
  }

  /**
   * Reset to initial data (useful for testing)
   */
  reset(): void {
    this.teachers = this.generateMockTeachers()
    this.nextId = this.teachers.length + 1
  }
}

// Export singleton instance
export const mockTeacherService = MockTeacherService.getInstance()