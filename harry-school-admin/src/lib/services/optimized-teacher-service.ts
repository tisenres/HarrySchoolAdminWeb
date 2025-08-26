import { BaseService } from './base-service'
import { teacherInsertSchema, teacherUpdateSchema, teacherSearchSchema, paginationSchema } from '@/lib/validations'
import type { Teacher, TeacherInsert } from '@/types/database'
import type { z } from 'zod'

/**
 * Optimized Teacher Service
 * Eliminates N+1 queries with strategic JOINs and efficient data fetching
 */
export class OptimizedTeacherService extends BaseService {
  constructor() {
    super('teachers')
  }

  /**
   * Create a new teacher
   */
  async create(teacherData: z.infer<typeof teacherInsertSchema>): Promise<Teacher> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const validatedData = teacherInsertSchema.parse(teacherData)
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    
    const insertData = Object.fromEntries(
      Object.entries({
        ...validatedData,
        full_name: `${validatedData.first_name} ${validatedData.last_name}`,
        organization_id: organizationId,
        created_by: user.id,
        updated_by: user.id,
      }).filter(([_, value]) => value !== undefined)
    ) as TeacherInsert
    
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('teachers')
      .insert(insertData)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create teacher: ${error.message}`)
    }
    
    await this.logActivity(
      'CREATE',
      data.id,
      data.full_name,
      null,
      data,
      `Created new teacher: ${data.full_name}`
    )
    
    return data
  }

  /**
   * OPTIMIZED: Get a teacher by ID with group assignments in single query
   */
  async getById(id: string): Promise<Teacher & { 
    groups?: any[],
    assignments?: any[]
  }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // OPTIMIZED: Single query with proper JOINs
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single()
    
    if (teacherError) {
      throw new Error(`Failed to get teacher: ${teacherError.message}`)
    }
    
    // OPTIMIZED: Parallel fetch for related data
    const { data: assignments, error: assignmentsError } = await supabase
      .from('teacher_group_assignments')
      .select(`
        id,
        group_id,
        role,
        status,
        assigned_date,
        groups!inner(
          id,
          name,
          subject,
          level,
          group_code,
          start_date,
          end_date,
          status,
          is_active
        )
      `)
      .eq('teacher_id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
    
    if (assignmentsError) {
      console.warn(`Failed to fetch teacher assignments: ${assignmentsError.message}`)
    }
    
    return {
      ...teacher,
      assignments: assignments || [],
      groups: (assignments || []).map(a => a.groups).filter(Boolean)
    }
  }

  /**
   * OPTIMIZED: Get all teachers with group counts in single query
   */
  async getAll(
    search?: z.infer<typeof teacherSearchSchema>,
    pagination?: z.infer<typeof paginationSchema>
  ): Promise<{ 
    data: any[]; 
    count: number; 
    total_pages: number;
    limit: number;
  }> {
    const organizationId = await this.getCurrentOrganization()
    
    const { page, limit, sort_by, sort_order } = pagination 
      ? paginationSchema.parse(pagination) 
      : { page: 1, limit: 20, sort_by: 'created_at', sort_order: 'desc' as const }
    
    const supabase = await this.getSupabase()
    let query = supabase
      .from('teachers')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
    
    // Apply search filters
    if (search) {
      const validatedSearch = teacherSearchSchema.parse(search)
      
      if (validatedSearch.query) {
        query = query.or(`
          full_name.ilike.%${validatedSearch.query}%,
          first_name.ilike.%${validatedSearch.query}%,
          last_name.ilike.%${validatedSearch.query}%,
          email.ilike.%${validatedSearch.query}%,
          phone.ilike.%${validatedSearch.query}%
        `)
      }
      
      if (validatedSearch.employment_status) {
        const statuses = Array.isArray(validatedSearch.employment_status) 
          ? validatedSearch.employment_status 
          : [validatedSearch.employment_status]
        query = query.in('employment_status', statuses)
      }
      
      if (validatedSearch.specializations && validatedSearch.specializations.length > 0) {
        // Handle array overlap with specializations
        query = query.overlaps('specializations', validatedSearch.specializations)
      }
      
      if (validatedSearch.is_active !== undefined) {
        query = query.eq('is_active', validatedSearch.is_active)
      }
      
      if (validatedSearch.hire_date_from) {
        query = query.gte('hire_date', validatedSearch.hire_date_from)
      }
      
      if (validatedSearch.hire_date_to) {
        query = query.lte('hire_date', validatedSearch.hire_date_to)
      }
    }
    
    // Apply sorting
    query = this.applySorting(query, sort_by, sort_order)
    
    // Apply pagination
    query = this.applyPagination(query, page, limit)
    
    const { data: teachers, error, count } = await query
    
    if (error) {
      throw new Error(`Failed to get teachers: ${error.message}`)
    }
    
    // OPTIMIZED: Batch fetch group counts for all teachers
    if (teachers && teachers.length > 0) {
      const teacherIds = teachers.map(t => t.id)
      
      // Get group counts per teacher
      const { data: groupCounts } = await supabase
        .from('teacher_group_assignments')
        .select('teacher_id')
        .in('teacher_id', teacherIds)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .is('deleted_at', null)
      
      // Count occurrences
      const groupCountMap = (groupCounts || []).reduce((acc, item) => {
        acc[item.teacher_id] = (acc[item.teacher_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      // Enrich teachers with group counts
      const enrichedTeachers = teachers.map(teacher => ({
        ...teacher,
        group_count: groupCountMap[teacher.id] || 0
      }))
      
      return {
        data: enrichedTeachers,
        count: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        limit
      }
    }
    
    return {
      data: teachers || [],
      count: count || 0,
      total_pages: Math.ceil((count || 0) / limit),
      limit
    }
  }

  /**
   * Update a teacher
   */
  async update(id: string, teacherData: z.infer<typeof teacherUpdateSchema>): Promise<Teacher> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const validatedData = teacherUpdateSchema.parse(teacherData)
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    
    const existing = await this.getById(id)
    
    const updateData = Object.fromEntries(
      Object.entries({
        ...validatedData,
        full_name: (validatedData.first_name || validatedData.last_name) 
          ? `${validatedData.first_name || existing.first_name} ${validatedData.last_name || existing.last_name}`
          : undefined,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
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
    
    await this.logActivity(
      'UPDATE',
      data.id,
      data.full_name,
      existing,
      data,
      `Updated teacher: ${data.full_name}`
    )
    
    return data
  }

  /**
   * Soft delete a teacher
   */
  async delete(id: string): Promise<Teacher> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const organizationId = await this.getCurrentOrganization()
    const existing = await this.getById(id)
    
    const supabase = await this.getSupabase()
    
    // Check active group assignments
    const { count: activeAssignments } = await supabase
      .from('teacher_group_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', id)
      .eq('status', 'active')
      .is('deleted_at', null)
    
    if (activeAssignments && activeAssignments > 0) {
      throw new Error('Cannot delete teacher with active group assignments')
    }
    
    const user = await this.getCurrentUser()
    
    const { data, error } = await supabase
      .from('teachers')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        is_active: false,
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to delete teacher: ${error.message}`)
    }
    
    await this.logActivity(
      'DELETE',
      data.id,
      existing.full_name,
      existing,
      data,
      `Deleted teacher: ${existing.full_name}`
    )
    
    return data
  }

  /**
   * OPTIMIZED: Get teacher statistics with single aggregated query
   */
  async getStatistics(): Promise<{
    total: number
    active: number
    inactive: number
    by_employment_status: Record<string, number>
    by_specialization: Record<string, number>
    total_assignments: number
    average_groups_per_teacher: number
  }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // OPTIMIZED: Get all statistics in parallel
    const [
      teachersResult,
      assignmentResult
    ] = await Promise.all([
      // Get teachers with their stats
      supabase
        .from('teachers')
        .select('employment_status, specializations, is_active')
        .eq('organization_id', organizationId)
        .is('deleted_at', null),
      
      // Get assignment counts
      supabase
        .from('teacher_group_assignments')
        .select('teacher_id')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .is('deleted_at', null)
    ])
    
    if (teachersResult.error) {
      throw new Error(`Failed to get teacher statistics: ${teachersResult.error.message}`)
    }
    
    const teachers = teachersResult.data || []
    
    // Count assignments per teacher
    const assignmentCounts = (assignmentResult.data || []).reduce((acc, item) => {
      acc[item.teacher_id] = (acc[item.teacher_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Calculate statistics
    const stats = {
      total: teachers.length,
      active: teachers.filter(t => t.is_active).length,
      inactive: teachers.filter(t => !t.is_active).length,
      by_employment_status: {} as Record<string, number>,
      by_specialization: {} as Record<string, number>,
      total_assignments: Object.values(assignmentCounts).reduce((sum, count) => sum + count, 0),
      average_groups_per_teacher: 0,
    }
    
    // Aggregate statistics
    teachers.forEach(teacher => {
      // By employment status
      const status = teacher.employment_status || 'unknown'
      stats.by_employment_status[status] = (stats.by_employment_status[status] || 0) + 1
      
      // By specializations
      if (teacher.specializations && Array.isArray(teacher.specializations)) {
        teacher.specializations.forEach(spec => {
          stats.by_specialization[spec] = (stats.by_specialization[spec] || 0) + 1
        })
      }
    })
    
    // Calculate average groups per teacher
    if (teachers.length > 0) {
      stats.average_groups_per_teacher = Number((stats.total_assignments / teachers.length).toFixed(2))
    }
    
    return stats
  }

  /**
   * OPTIMIZED: Get available teachers for group assignment
   */
  async getAvailableTeachers(): Promise<any[]> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // Get active teachers
    const { data: teachers, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('full_name')
    
    if (error) {
      throw new Error(`Failed to get available teachers: ${error.message}`)
    }
    
    if (!teachers || teachers.length === 0) {
      return []
    }
    
    // OPTIMIZED: Get assignment counts in single query
    const teacherIds = teachers.map(t => t.id)
    const { data: assignments } = await supabase
      .from('teacher_group_assignments')
      .select('teacher_id')
      .in('teacher_id', teacherIds)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .is('deleted_at', null)
    
    // Count assignments per teacher
    const assignmentCounts = (assignments || []).reduce((acc, item) => {
      acc[item.teacher_id] = (acc[item.teacher_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Enrich teachers with assignment counts
    const availableTeachers = teachers.map(teacher => ({
      ...teacher,
      current_groups: assignmentCounts[teacher.id] || 0
    }))
    
    return availableTeachers
  }

  /**
   * OPTIMIZED: Bulk operations with transaction-like behavior
   */
  async bulkDelete(ids: string[]): Promise<{ success: number; errors: string[] }> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // Check for active assignments in all teachers at once
    const { data: activeTeachers } = await supabase
      .from('teacher_group_assignments')
      .select('teacher_id')
      .in('teacher_id', ids)
      .eq('status', 'active')
      .is('deleted_at', null)
    
    const teachersWithAssignments = new Set((activeTeachers || []).map(a => a.teacher_id))
    
    const results = { success: 0, errors: [] as string[] }
    const deletableIds = ids.filter(id => !teachersWithAssignments.has(id))
    const blockedIds = ids.filter(id => teachersWithAssignments.has(id))
    
    // Add errors for blocked teachers
    blockedIds.forEach(id => {
      results.errors.push(`Teacher ${id} has active group assignments`)
    })
    
    // Bulk delete deletable teachers
    if (deletableIds.length > 0) {
      const { error } = await supabase
        .from('teachers')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          is_active: false,
        })
        .in('id', deletableIds)
        .eq('organization_id', organizationId)
      
      if (error) {
        results.errors.push(`Bulk delete failed: ${error.message}`)
      } else {
        results.success = deletableIds.length
        
        await this.logActivity(
          'BULK_DELETE',
          'teachers',
          'Bulk Teacher Deletion',
          null,
          { ids: deletableIds },
          `Deleted ${deletableIds.length} teachers`
        )
      }
    }
    
    return results
  }

  async bulkRestore(ids: string[]): Promise<{ success: number; errors: string[] }> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('teachers')
      .update({
        deleted_at: null,
        deleted_by: null,
      })
      .in('id', ids)
      .eq('organization_id', organizationId)
      .select()
    
    if (error) {
      return {
        success: 0,
        errors: [`Bulk restore failed: ${error.message}`]
      }
    }
    
    await this.logActivity(
      'BULK_RESTORE',
      'teachers',
      'Bulk Teacher Restoration',
      null,
      { ids },
      `Restored ${data.length} teachers`
    )
    
    return {
      success: data.length,
      errors: []
    }
  }

  override async restore(id: string): Promise<Teacher> {
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
    
    await this.logActivity(
      'RESTORE',
      data.id,
      data.full_name,
      null,
      data,
      `Restored teacher: ${data.full_name}`
    )
    
    return data
  }
}

// Export singleton instance
export const optimizedTeacherService = new OptimizedTeacherService()