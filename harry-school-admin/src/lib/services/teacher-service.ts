import { BaseService } from './base-service'
import { apiCache } from '@/lib/utils/api-cache'
import { teacherInsertSchema, teacherUpdateSchema, teacherSearchSchema, paginationSchema } from '@/lib/validations'
import type { Teacher, TeacherInsert } from '@/types/database'
import type { Database } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { z } from 'zod'

export class TeacherService extends BaseService {
  constructor(tableName: string = 'teachers', supabaseClientProvider?: () => Promise<SupabaseClient<Database>>) {
    super(tableName as any, supabaseClientProvider)
  }

  /**
   * Create a new teacher
   */
  async create(teacherData: z.infer<typeof teacherInsertSchema>): Promise<Teacher> {
    // Check permissions
    await this.checkPermission(['admin', 'superadmin'])
    
    // Validate input
    const validatedData = teacherInsertSchema.parse(teacherData)
    
    // Get current user and organization
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    
    // Ensure teacher belongs to user's organization
    // Filter out undefined properties for exactOptionalPropertyTypes compatibility
    const insertData = Object.fromEntries(
      Object.entries({
        ...validatedData,
        organization_id: organizationId,
        created_by: user.id,
        updated_by: user.id,
      }).filter(([_, value]) => value !== undefined)
    ) as TeacherInsert
    
    // Insert teacher
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('teachers')
      .insert(insertData)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create teacher: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'CREATE',
      data.id,
      `${data.first_name} ${data.last_name}`,
      null,
      data,
      `Created new teacher: ${data.first_name} ${data.last_name}`
    )
    
    return data
  }

  /**
   * Get a teacher by ID
   */
  async getById(id: string): Promise<Teacher> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single()
    
    if (error) {
      throw new Error(`Failed to get teacher: ${error.message}`)
    }
    
    return data
  }

  /**
   * Get all teachers with optional filtering, searching, and pagination
   */
  async getAll(
    search?: z.infer<typeof teacherSearchSchema>,
    pagination?: z.infer<typeof paginationSchema>
  ): Promise<{ data: Teacher[]; count: number; total_pages: number }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // Validate pagination
    const { page, limit, sort_by, sort_order } = pagination 
      ? paginationSchema.parse(pagination) 
      : { page: 1, limit: 20, sort_by: 'created_at', sort_order: 'desc' as const }
    
    // Start building query
    let query = supabase
      .from('teachers')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
    
    // Apply search filters
    if (search) {
      const validatedSearch = teacherSearchSchema.parse(search)
      
      // Text search across name, email, phone, employee_id
      if (validatedSearch.query) {
        const searchTerm = `%${validatedSearch.query}%`
        query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},employee_id.ilike.${searchTerm}`)
      }
      
      if (validatedSearch.employment_status) {
        query = query.eq('employment_status', validatedSearch.employment_status)
      }
      
      if (validatedSearch.specializations && validatedSearch.specializations.length > 0) {
        query = query.overlaps('specializations', validatedSearch.specializations)
      }
      
      if (validatedSearch.hire_date_from) {
        query = query.gte('hire_date', validatedSearch.hire_date_from)
      }
      
      if (validatedSearch.hire_date_to) {
        query = query.lte('hire_date', validatedSearch.hire_date_to)
      }
      
      if (validatedSearch.is_active !== undefined) {
        query = query.eq('is_active', validatedSearch.is_active)
      }
    }
    
    // Apply sorting
    query = this.applySorting(query, sort_by, sort_order)
    
    // Apply pagination
    query = this.applyPagination(query, page, limit)
    
    const { data, error, count } = await query
    
    if (error) {
      throw new Error(`Failed to get teachers: ${error.message}`)
    }

    // Get all teacher counts in a single batch query (skip in development for performance)
    const enhancedData = process.env.NODE_ENV === 'development' && process.env.DISABLE_TEACHER_COUNTS === 'true'
      ? data?.map(teacher => ({ ...teacher, active_groups: 0, total_students: 0 })) || []
      : await this.enhanceTeachersWithCounts(data || [])
    
    const total_pages = Math.ceil((count || 0) / limit)
    
    return {
      data: enhancedData,
      count: count || 0,
      total_pages,
    }
  }

  /**
   * Update a teacher
   */
  async update(id: string, teacherData: z.infer<typeof teacherUpdateSchema>): Promise<Teacher> {
    // Check permissions
    await this.checkPermission(['admin', 'superadmin'])
    
    // Validate input
    const validatedData = teacherUpdateSchema.parse(teacherData)
    
    // Get current user and organization
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    
    // Get existing teacher for audit log
    const existing = await this.getById(id)
    
    // Update teacher
    // Filter out undefined properties for exactOptionalPropertyTypes compatibility
    const updateData = Object.fromEntries(
      Object.entries({
        ...validatedData,
        updated_by: user.id,
      }).filter(([_, value]) => value !== undefined)
    )
    
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('teachers')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update teacher: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'UPDATE',
      data.id,
      `${data.first_name} ${data.last_name}`,
      existing,
      data,
      `Updated teacher: ${data.first_name} ${data.last_name}`
    )
    
    return data
  }

  /**
   * Soft delete a teacher
   */
  async delete(id: string): Promise<Teacher> {
    // Check permissions
    await this.checkPermission(['admin', 'superadmin'])
    
    const organizationId = await this.getCurrentOrganization()
    
    // Get existing teacher for audit log
    const existing = await this.getById(id)
    
    // Perform soft delete
    const user = await this.getCurrentUser()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('teachers')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to delete teacher: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'DELETE',
      data.id,
      `${existing.first_name} ${existing.last_name}`,
      existing,
      data,
      `Deleted teacher: ${existing.first_name} ${existing.last_name}`
    )
    
    return data
  }

  /**
   * Restore a soft-deleted teacher
   */
  override async restore(id: string): Promise<Teacher> {
    // Check permissions
    await this.checkPermission(['admin', 'superadmin'])
    
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('teachers')
      .update({
        deleted_at: null,
        deleted_by: null,
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to restore teacher: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'RESTORE',
      data.id,
      `${data.first_name} ${data.last_name}`,
      null,
      data,
      `Restored teacher: ${data.first_name} ${data.last_name}`
    )
    
    return data
  }

  /**
   * Get teachers by specialization
   */
  async getBySpecialization(specialization: string): Promise<Teacher[]> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .eq('is_active', true)
      .contains('specializations', [specialization])
      .order('first_name')
    
    if (error) {
      throw new Error(`Failed to get teachers by specialization: ${error.message}`)
    }
    
    return data || []
  }

  /**
   * Get teachers available for assignment (active and not overloaded)
   */
  async getAvailableTeachers(): Promise<Teacher[]> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('teachers')
      .select(`
        *,
        teacher_group_assignments!inner(
          id,
          status,
          deleted_at
        )
      `)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .eq('is_active', true)
      .eq('employment_status', 'active')
      .order('first_name')
    
    if (error) {
      throw new Error(`Failed to get available teachers: ${error.message}`)
    }
    
    return data || []
  }

  /**
   * Get teacher statistics
   */
  async getStatistics(): Promise<{
    total: number
    active: number
    inactive: number
    by_employment_status: Record<string, number>
    by_specialization: Record<string, number>
  }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // Get all teachers for statistics
    const { data, error } = await supabase
      .from('teachers')
      .select('employment_status, specializations, is_active')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
    
    if (error) {
      throw new Error(`Failed to get teacher statistics: ${error.message}`)
    }
    
    const teachers = data || []
    
    // Calculate statistics
    const stats = {
      total: teachers.length,
      active: teachers.filter(t => t.is_active).length,
      inactive: teachers.filter(t => !t.is_active).length,
      by_employment_status: {} as Record<string, number>,
      by_specialization: {} as Record<string, number>,
    }
    
    // Group by employment status
    teachers.forEach(teacher => {
      const status = teacher.employment_status || 'unknown'
      stats.by_employment_status[status] = (stats.by_employment_status[status] || 0) + 1
    })
    
    // Group by specializations
    teachers.forEach(teacher => {
      const specializations = teacher.specializations || []
      specializations.forEach(spec => {
        stats.by_specialization[spec] = (stats.by_specialization[spec] || 0) + 1
      })
    })
    
    return stats
  }

  /**
   * Bulk operations
   */
  async bulkDelete(ids: string[]): Promise<{ success: number; errors: string[] }> {
    await this.checkPermission(['admin', 'superadmin'])
    
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

  async bulkRestore(ids: string[]): Promise<{ success: number; errors: string[] }> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const results = { success: 0, errors: [] as string[] }
    
    for (const id of ids) {
      try {
        await this.restore(id)
        results.success++
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        results.errors.push(`Failed to restore teacher ${id}: ${message}`)
      }
    }
    
    return results
  }

  /**
   * Enhance teachers with counts using optimized queries
   * OPTIMIZED VERSION: Uses separate, simpler queries instead of complex joins
   */
  async enhanceTeachersWithCounts(teachers: any[]): Promise<any[]> {
    if (teachers.length === 0) return []

    // Skip heavy count queries in development for better performance
    if (process.env.NODE_ENV === 'development' && process.env.DISABLE_TEACHER_COUNTS === 'true') {
      return teachers.map(teacher => ({
        ...teacher,
        active_groups: 0,
        total_students: 0
      }))
    }

    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    const teacherIds = teachers.map(t => t.id)

    // OPTIMIZATION 1: Use two separate, simpler queries instead of complex join
    
    // Query 1: Get group counts per teacher (much faster without joins)
    const { data: groupAssignments } = await supabase
      .from('teacher_group_assignments')
      .select('teacher_id, group_id')
      .in('teacher_id', teacherIds)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)

    // Query 2: Get student enrollments for these groups (separate query is faster)
    const groupIds = [...new Set(groupAssignments?.map(g => g.group_id) || [])]
    let studentEnrollments: any[] = []
    
    if (groupIds.length > 0) {
      // Break down into chunks to avoid hitting URL length limits
      const chunkSize = 50
      const chunks = []
      for (let i = 0; i < groupIds.length; i += chunkSize) {
        chunks.push(groupIds.slice(i, i + chunkSize))
      }
      
      const enrollmentPromises = chunks.map(chunk => 
        supabase
          .from('student_group_enrollments')
          .select('group_id, student_id, students!inner(id, is_active)')
          .in('group_id', chunk)
          .is('deleted_at', null)
      )
      
      const results = await Promise.all(enrollmentPromises)
      studentEnrollments = results.flatMap(result => result.data || [])
    }

    // OPTIMIZATION 2: Process data more efficiently using Maps
    const teacherCounts: Record<string, { active_groups: number; total_students: number }> = {}
    const teacherToGroups = new Map<string, Set<string>>()
    const groupToStudents = new Map<string, Set<string>>()
    
    // Initialize counts
    teacherIds.forEach(teacherId => {
      teacherCounts[teacherId] = { active_groups: 0, total_students: 0 }
      teacherToGroups.set(teacherId, new Set())
    })

    // Build teacher -> groups mapping
    groupAssignments?.forEach(assignment => {
      teacherToGroups.get(assignment.teacher_id)?.add(assignment.group_id)
    })

    // Build group -> students mapping (only active students)
    studentEnrollments.forEach(enrollment => {
      if (enrollment.students?.is_active) {
        if (!groupToStudents.has(enrollment.group_id)) {
          groupToStudents.set(enrollment.group_id, new Set())
        }
        groupToStudents.get(enrollment.group_id)?.add(enrollment.student_id)
      }
    })

    // Calculate final counts
    teacherToGroups.forEach((groups, teacherId) => {
      const uniqueStudents = new Set<string>()
      
      groups.forEach(groupId => {
        const studentsInGroup = groupToStudents.get(groupId)
        studentsInGroup?.forEach(studentId => uniqueStudents.add(studentId))
      })
      
      teacherCounts[teacherId] = {
        active_groups: groups.size,
        total_students: uniqueStudents.size
      }
    })

    // Enhance teachers with their counts
    return teachers.map(teacher => ({
      ...teacher,
      active_groups: teacherCounts[teacher.id]?.active_groups || 0,
      total_students: teacherCounts[teacher.id]?.total_students || 0
    }))
  }

  /**
   * Get teacher's group and student counts (individual - use enhanceTeachersWithCounts for batch)
   */
  async getTeacherCounts(teacherId: string): Promise<{
    active_groups: number
    total_students: number
  }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()

    // Get active groups count
    const { count: groupsCount } = await supabase
      .from('teacher_group_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)

    // Get total students count across all assigned groups
    const { data: assignmentData } = await supabase
      .from('teacher_group_assignments')
      .select(`
        group_id,
        groups!inner(
          id,
          student_group_enrollments!inner(
            student_id,
            students!inner(
              id,
              is_active
            )
          )
        )
      `)
      .eq('teacher_id', teacherId)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)

    // Count unique active students across all groups
    const uniqueStudentIds = new Set<string>()
    if (assignmentData) {
      assignmentData.forEach((assignment: any) => {
        if (assignment.groups?.student_group_enrollments) {
          assignment.groups.student_group_enrollments.forEach((enrollment: any) => {
            if (enrollment.students?.is_active) {
              uniqueStudentIds.add(enrollment.student_id)
            }
          })
        }
      })
    }

    return {
      active_groups: groupsCount || 0,
      total_students: uniqueStudentIds.size
    }
  }

  /**
   * Get teacher statistics for dashboard - OPTIMIZED with caching
   */
  async getStats() {
    const { organizationId } = await this.getUserContext()
    
    // Try cache first
    const cached = apiCache.getStats(`teacher:${organizationId}`)
    if (cached) {
      return cached
    }

    const supabase = await this.getSupabase()

    // Get all statistics in a single optimized query
    const { data, error } = await supabase
      .from('teachers')
      .select('is_active, employment_type')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)

    if (error) {
      throw new Error(`Failed to get teacher statistics: ${error.message}`)
    }

    // Calculate statistics from the single query result
    const total = data?.length || 0
    const active = data?.filter(t => t.is_active).length || 0
    const fullTime = data?.filter(t => t.employment_type === 'full_time').length || 0

    const stats = {
      total,
      active,
      full_time: fullTime
    }

    // Cache the results
    apiCache.setStats(`teacher:${organizationId}`, stats)
    
    return stats
  }
}

export const teacherService = new TeacherService()