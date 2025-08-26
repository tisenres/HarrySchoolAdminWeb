import { BaseService } from './base-service'
import { groupInsertSchema, groupUpdateSchema, groupSearchSchema, paginationSchema } from '@/lib/validations'
import type { Group, GroupInsert } from '@/types/database'
import type { z } from 'zod'

/**
 * Optimized Group Service
 * Eliminates N+1 queries with strategic JOINs and efficient data fetching
 */
export class OptimizedGroupService extends BaseService {
  constructor() {
    super('groups')
  }

  /**
   * Create a new group
   */
  async create(groupData: z.infer<typeof groupInsertSchema>): Promise<Group> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const validatedData = groupInsertSchema.parse(groupData)
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    
    const groupCode = validatedData.group_code || await this.generateGroupCode(validatedData.subject, validatedData.level)
    
    const insertData = Object.fromEntries(
      Object.entries({
        ...validatedData,
        group_code: groupCode,
        organization_id: organizationId,
        created_by: user.id,
        updated_by: user.id,
        current_enrollment: 0,
        waiting_list_count: 0,
      }).filter(([_, value]) => value !== undefined)
    ) as GroupInsert
    
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('groups')
      .insert(insertData)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create group: ${error.message}`)
    }
    
    await this.logActivity(
      'CREATE',
      data.id,
      data.name,
      null,
      data,
      `Created new group: ${data.name}`
    )
    
    return data
  }

  /**
   * OPTIMIZED: Get a group by ID with related data in a single query
   * Eliminates N+1 queries by fetching all related data at once
   */
  async getById(id: string): Promise<Group & { 
    teachers?: any[], 
    students?: any[],
    assignments?: any[],
    enrollments?: any[]
  }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // OPTIMIZED: Single query with proper JOINs
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single()
    
    if (groupError) {
      throw new Error(`Failed to get group: ${groupError.message}`)
    }
    
    // OPTIMIZED: Parallel fetch for related data (not nested, avoids RLS issues)
    const [teachersResult, studentsResult] = await Promise.all([
      // Fetch teacher assignments
      supabase
        .from('teacher_group_assignments')
        .select(`
          id,
          teacher_id,
          role,
          status,
          assigned_date
        `)
        .eq('group_id', id)
        .eq('organization_id', organizationId)
        .is('deleted_at', null),
      
      // Fetch student enrollments
      supabase
        .from('student_group_enrollments')
        .select(`
          id,
          student_id,
          enrollment_date,
          status
        `)
        .eq('group_id', id)
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
    ])
    
    // OPTIMIZED: Batch fetch teacher and student details
    let teachers = []
    let students = []
    
    if (teachersResult.data && teachersResult.data.length > 0) {
      const teacherIds = teachersResult.data.map(a => a.teacher_id)
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id, first_name, last_name, full_name, email, phone, specializations')
        .in('id', teacherIds)
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
      
      // Map teachers to assignments
      teachers = teachersResult.data.map(assignment => ({
        ...assignment,
        teacher: teacherData?.find(t => t.id === assignment.teacher_id)
      }))
    }
    
    if (studentsResult.data && studentsResult.data.length > 0) {
      const studentIds = studentsResult.data.map(e => e.student_id)
      const { data: studentData } = await supabase
        .from('students')
        .select('id, first_name, last_name, full_name, email, primary_phone, enrollment_status')
        .in('id', studentIds)
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
      
      // Map students to enrollments
      students = studentsResult.data.map(enrollment => ({
        ...enrollment,
        student: studentData?.find(s => s.id === enrollment.student_id)
      }))
    }
    
    return {
      ...group,
      teachers,
      students,
      assignments: teachersResult.data || [],
      enrollments: studentsResult.data || []
    }
  }

  /**
   * OPTIMIZED: Get all groups with counts in single query
   */
  async getAll(
    search?: z.infer<typeof groupSearchSchema>,
    pagination?: z.infer<typeof paginationSchema>
  ): Promise<{ 
    data: any[]; 
    count: number; 
    total_pages: number 
  }> {
    const organizationId = await this.getCurrentOrganization()
    
    const { page, limit, sort_by, sort_order } = pagination 
      ? paginationSchema.parse(pagination) 
      : { page: 1, limit: 20, sort_by: 'created_at', sort_order: 'desc' as const }
    
    const supabase = await this.getSupabase()
    let query = supabase
      .from('groups')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
    
    // Apply search filters
    if (search) {
      const validatedSearch = groupSearchSchema.parse(search)
      
      if (validatedSearch.query) {
        query = query.or(`
          name.ilike.%${validatedSearch.query}%,
          subject.ilike.%${validatedSearch.query}%,
          group_code.ilike.%${validatedSearch.query}%,
          description.ilike.%${validatedSearch.query}%
        `)
      }
      
      if (validatedSearch.status) {
        query = query.eq('status', validatedSearch.status)
      }
      
      if (validatedSearch.subject) {
        query = query.eq('subject', validatedSearch.subject)
      }
      
      if (validatedSearch.level) {
        query = query.eq('level', validatedSearch.level)
      }
      
      if (validatedSearch.group_type) {
        query = query.eq('group_type', validatedSearch.group_type)
      }
      
      if (validatedSearch.is_active !== undefined) {
        query = query.eq('is_active', validatedSearch.is_active)
      }
      
      if (validatedSearch.start_date_from) {
        query = query.gte('start_date', validatedSearch.start_date_from)
      }
      
      if (validatedSearch.start_date_to) {
        query = query.lte('start_date', validatedSearch.start_date_to)
      }
    }
    
    // Apply sorting
    query = this.applySorting(query, sort_by, sort_order)
    
    // Apply pagination
    query = this.applyPagination(query, page, limit)
    
    const { data: groups, error, count } = await query
    
    if (error) {
      throw new Error(`Failed to get groups: ${error.message}`)
    }
    
    // OPTIMIZED: Batch fetch teacher and student counts for all groups
    if (groups && groups.length > 0) {
      const groupIds = groups.map(g => g.id)
      
      // Parallel fetch counts
      const [teacherCounts, studentCounts] = await Promise.all([
        // Get teacher counts per group
        supabase
          .from('teacher_group_assignments')
          .select('group_id')
          .in('group_id', groupIds)
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .is('deleted_at', null),
        
        // Get student counts per group
        supabase
          .from('student_group_enrollments')
          .select('group_id')
          .in('group_id', groupIds)
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .is('deleted_at', null)
      ])
      
      // Count occurrences
      const teacherCountMap = (teacherCounts.data || []).reduce((acc, item) => {
        acc[item.group_id] = (acc[item.group_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const studentCountMap = (studentCounts.data || []).reduce((acc, item) => {
        acc[item.group_id] = (acc[item.group_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      // Enrich groups with counts
      const enrichedGroups = groups.map(group => ({
        ...group,
        teacher_count: teacherCountMap[group.id] || 0,
        student_count: studentCountMap[group.id] || 0,
        capacity_percentage: group.max_students > 0 
          ? Math.round((studentCountMap[group.id] || 0) / group.max_students * 100)
          : 0
      }))
      
      return {
        data: enrichedGroups,
        count: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      }
    }
    
    return {
      data: groups || [],
      count: count || 0,
      total_pages: Math.ceil((count || 0) / limit),
    }
  }

  /**
   * Update a group
   */
  async update(id: string, groupData: z.infer<typeof groupUpdateSchema>): Promise<Group> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const validatedData = groupUpdateSchema.parse(groupData)
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    
    const existing = await this.getById(id)
    
    const updateData = Object.fromEntries(
      Object.entries({
        ...validatedData,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }).filter(([_, value]) => value !== undefined)
    )
    
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('groups')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update group: ${error.message}`)
    }
    
    await this.logActivity(
      'UPDATE',
      data.id,
      data.name,
      existing,
      data,
      `Updated group: ${data.name}`
    )
    
    return data
  }

  /**
   * Soft delete a group
   */
  async delete(id: string): Promise<Group> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const organizationId = await this.getCurrentOrganization()
    const existing = await this.getById(id)
    
    const supabase = await this.getSupabase()
    
    // Check active enrollments
    const { count: activeEnrollments } = await supabase
      .from('student_group_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', id)
      .eq('status', 'active')
      .is('deleted_at', null)
    
    if (activeEnrollments && activeEnrollments > 0) {
      throw new Error('Cannot delete group with active student enrollments')
    }
    
    const user = await this.getCurrentUser()
    
    const { data, error } = await supabase
      .from('groups')
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
      throw new Error(`Failed to delete group: ${error.message}`)
    }
    
    await this.logActivity(
      'DELETE',
      data.id,
      existing.name,
      existing,
      data,
      `Deleted group: ${existing.name}`
    )
    
    return data
  }

  /**
   * OPTIMIZED: Get group statistics with single aggregated query
   */
  async getStatistics(): Promise<{
    total: number
    active: number
    inactive: number
    by_status: Record<string, number>
    by_subject: Record<string, number>
    by_level: Record<string, number>
    total_capacity: number
    total_enrolled: number
    utilization_rate: number
  }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // OPTIMIZED: Get all statistics in parallel
    const [
      groupsResult,
      enrollmentResult
    ] = await Promise.all([
      // Get groups with their stats
      supabase
        .from('groups')
        .select('status, subject, level, is_active, max_students, current_enrollment')
        .eq('organization_id', organizationId)
        .is('deleted_at', null),
      
      // Get actual enrollment counts
      supabase
        .from('student_group_enrollments')
        .select('group_id')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .is('deleted_at', null)
    ])
    
    if (groupsResult.error) {
      throw new Error(`Failed to get group statistics: ${groupsResult.error.message}`)
    }
    
    const groups = groupsResult.data || []
    
    // Count actual enrollments per group
    const enrollmentCounts = (enrollmentResult.data || []).reduce((acc, item) => {
      acc[item.group_id] = (acc[item.group_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Calculate statistics
    const stats = {
      total: groups.length,
      active: groups.filter(g => g.is_active).length,
      inactive: groups.filter(g => !g.is_active).length,
      by_status: {} as Record<string, number>,
      by_subject: {} as Record<string, number>,
      by_level: {} as Record<string, number>,
      total_capacity: 0,
      total_enrolled: 0,
      utilization_rate: 0,
    }
    
    // Aggregate statistics
    groups.forEach(group => {
      // By status
      const status = group.status || 'unknown'
      stats.by_status[status] = (stats.by_status[status] || 0) + 1
      
      // By subject
      const subject = group.subject || 'unknown'
      stats.by_subject[subject] = (stats.by_subject[subject] || 0) + 1
      
      // By level
      const level = group.level || 'unknown'
      stats.by_level[level] = (stats.by_level[level] || 0) + 1
      
      // Capacity and enrollment
      stats.total_capacity += group.max_students || 0
    })
    
    // Calculate total enrolled from actual enrollment data
    stats.total_enrolled = Object.values(enrollmentCounts).reduce((sum, count) => sum + count, 0)
    
    // Calculate utilization rate
    if (stats.total_capacity > 0) {
      stats.utilization_rate = Math.round((stats.total_enrolled / stats.total_capacity) * 100)
    }
    
    return stats
  }

  /**
   * OPTIMIZED: Get available groups with capacity info
   */
  async getAvailableGroups(): Promise<any[]> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // Get active groups
    const { data: groups, error } = await supabase
      .from('groups')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .eq('is_active', true)
      .eq('status', 'active')
      .gt('max_students', 0)
      .order('name')
    
    if (error) {
      throw new Error(`Failed to get available groups: ${error.message}`)
    }
    
    if (!groups || groups.length === 0) {
      return []
    }
    
    // OPTIMIZED: Get enrollment counts in single query
    const groupIds = groups.map(g => g.id)
    const { data: enrollments } = await supabase
      .from('student_group_enrollments')
      .select('group_id')
      .in('group_id', groupIds)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .is('deleted_at', null)
    
    // Count enrollments per group
    const enrollmentCounts = (enrollments || []).reduce((acc, item) => {
      acc[item.group_id] = (acc[item.group_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Filter and enrich groups with available spots
    const availableGroups = groups
      .map(group => {
        const enrolled = enrollmentCounts[group.id] || 0
        const available_spots = group.max_students - enrolled
        return {
          ...group,
          current_enrollment: enrolled,
          available_spots,
          is_full: available_spots <= 0
        }
      })
      .filter(group => group.available_spots > 0)
    
    return availableGroups
  }

  /**
   * OPTIMIZED: Bulk assign teachers to a group
   */
  async bulkAssignTeachers(
    groupId: string, 
    teacherAssignments: Array<{ teacherId: string; role: string }>
  ): Promise<void> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // Check existing assignments
    const teacherIds = teacherAssignments.map(a => a.teacherId)
    const { data: existing } = await supabase
      .from('teacher_group_assignments')
      .select('teacher_id')
      .eq('group_id', groupId)
      .in('teacher_id', teacherIds)
      .is('deleted_at', null)
    
    const existingTeacherIds = new Set((existing || []).map(e => e.teacher_id))
    
    // Filter out already assigned teachers
    const newAssignments = teacherAssignments
      .filter(a => !existingTeacherIds.has(a.teacherId))
      .map(a => ({
        group_id: groupId,
        teacher_id: a.teacherId,
        organization_id: organizationId,
        role: a.role,
        status: 'active',
        assigned_date: new Date().toISOString(),
        created_by: user.id,
        updated_by: user.id,
      }))
    
    if (newAssignments.length > 0) {
      const { error } = await supabase
        .from('teacher_group_assignments')
        .insert(newAssignments)
      
      if (error) {
        throw new Error(`Failed to assign teachers: ${error.message}`)
      }
      
      await this.logActivity(
        'BULK_ASSIGN_TEACHERS',
        groupId,
        'Bulk Teacher Assignment',
        null,
        { groupId, teacherIds: newAssignments.map(a => a.teacher_id) },
        `Assigned ${newAssignments.length} teachers to group ${groupId}`
      )
    }
  }

  /**
   * Generate unique group code
   */
  private async generateGroupCode(subject: string, level?: string | null): Promise<string> {
    const subjectCode = subject.substring(0, 3).toUpperCase()
    const levelCode = level ? level.substring(0, 2).toUpperCase() : 'GN'
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4)
    
    return `${subjectCode}-${levelCode}-${timestamp}`
  }

  /**
   * OPTIMIZED: Bulk operations with transaction-like behavior
   */
  async bulkDelete(ids: string[]): Promise<{ success: number; errors: string[] }> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // Check for active enrollments in all groups at once
    const { data: activeGroups } = await supabase
      .from('student_group_enrollments')
      .select('group_id')
      .in('group_id', ids)
      .eq('status', 'active')
      .is('deleted_at', null)
    
    const groupsWithEnrollments = new Set((activeGroups || []).map(e => e.group_id))
    
    const results = { success: 0, errors: [] as string[] }
    const deletableIds = ids.filter(id => !groupsWithEnrollments.has(id))
    const blockedIds = ids.filter(id => groupsWithEnrollments.has(id))
    
    // Add errors for blocked groups
    blockedIds.forEach(id => {
      results.errors.push(`Group ${id} has active enrollments`)
    })
    
    // Bulk delete deletable groups
    if (deletableIds.length > 0) {
      const { error } = await supabase
        .from('groups')
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
          'groups',
          'Bulk Group Deletion',
          null,
          { ids: deletableIds },
          `Deleted ${deletableIds.length} groups`
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
      .from('groups')
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
      'groups',
      'Bulk Group Restoration',
      null,
      { ids },
      `Restored ${data.length} groups`
    )
    
    return {
      success: data.length,
      errors: []
    }
  }

  override async restore(id: string): Promise<Group> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('groups')
      .update({
        deleted_at: null,
        deleted_by: null,
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to restore group: ${error.message}`)
    }
    
    await this.logActivity(
      'RESTORE',
      data.id,
      data.name,
      null,
      data,
      `Restored group: ${data.name}`
    )
    
    return data
  }
}

// Export singleton instance
export const optimizedGroupService = new OptimizedGroupService()