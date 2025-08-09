import { BaseService } from './base-service'
import { groupInsertSchema, groupUpdateSchema, groupSearchSchema, paginationSchema } from '@/lib/validations'
import type { Group, GroupInsert } from '@/types/database'
import type { z } from 'zod'

export class GroupService extends BaseService {
  constructor() {
    super('groups')
  }

  /**
   * Create a new group
   */
  async create(groupData: z.infer<typeof groupInsertSchema>): Promise<Group> {
    // Check permissions
    await this.checkPermission(['admin', 'superadmin'])
    
    // Validate input
    const validatedData = groupInsertSchema.parse(groupData)
    
    // Get current user and organization
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    
    // Generate unique group code if not provided
    const groupCode = validatedData.group_code || await this.generateGroupCode(validatedData.subject, validatedData.level)
    
    // Ensure group belongs to user's organization
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
    
    // Insert group
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('groups')
      .insert(insertData)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create group: ${error.message}`)
    }
    
    // Log activity
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
   * Get a group by ID with related data
   */
  async getById(id: string): Promise<Group & { teachers?: any[], students?: any[] }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        teacher_group_assignments!inner(
          id,
          teacher_id,
          role,
          status,
          teachers!inner(
            id,
            first_name,
            last_name,
            full_name,
            email,
            phone,
            specializations
          )
        ),
        student_group_enrollments!inner(
          id,
          student_id,
          enrollment_date,
          status,
          students!inner(
            id,
            first_name,
            last_name,
            full_name,
            email,
            phone,
            student_status
          )
        )
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single()
    
    if (error) {
      throw new Error(`Failed to get group: ${error.message}`)
    }
    
    return data
  }

  /**
   * Get all groups with optional filtering, searching, and pagination
   */
  async getAll(
    search?: z.infer<typeof groupSearchSchema>,
    pagination?: z.infer<typeof paginationSchema>
  ): Promise<{ data: Group[]; count: number; total_pages: number }> {
    const organizationId = await this.getCurrentOrganization()
    
    // Validate pagination
    const { page, limit, sort_by, sort_order } = pagination 
      ? paginationSchema.parse(pagination) 
      : { page: 1, limit: 20, sort_by: 'created_at', sort_order: 'desc' as const }
    
    // Start building query
    const supabase = await this.getSupabase()
    let query = supabase
      .from('groups')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
    
    // Apply search filters
    if (search) {
      const validatedSearch = groupSearchSchema.parse(search)
      
      // Text search across name, subject, group_code
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
    
    const { data, error, count } = await query
    
    if (error) {
      throw new Error(`Failed to get groups: ${error.message}`)
    }
    
    const total_pages = Math.ceil((count || 0) / limit)
    
    return {
      data: data || [],
      count: count || 0,
      total_pages,
    }
  }

  /**
   * Update a group
   */
  async update(id: string, groupData: z.infer<typeof groupUpdateSchema>): Promise<Group> {
    // Check permissions
    await this.checkPermission(['admin', 'superadmin'])
    
    // Validate input
    const validatedData = groupUpdateSchema.parse(groupData)
    
    // Get current user and organization
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    
    // Get existing group for audit log
    const existing = await this.getById(id)
    
    // Update group
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
    
    // Log activity
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
    // Check permissions
    await this.checkPermission(['admin', 'superadmin'])
    
    const organizationId = await this.getCurrentOrganization()
    
    // Get existing group for audit log
    const existing = await this.getById(id)
    
    // Check if group has active enrollments
    const supabase = await this.getSupabase()
    const { count: activeEnrollments } = await supabase
      .from('student_group_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', id)
      .eq('status', 'active')
      .is('deleted_at', null)
    
    if (activeEnrollments && activeEnrollments > 0) {
      throw new Error('Cannot delete group with active student enrollments')
    }
    
    // Perform soft delete
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
    
    // Log activity
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
   * Restore a soft-deleted group
   */
  override async restore(id: string): Promise<Group> {
    // Check permissions
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
    
    // Log activity
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

  /**
   * Assign a teacher to a group
   */
  async assignTeacher(groupId: string, teacherId: string, role: string = 'primary'): Promise<void> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // Check if assignment already exists
    const { data: existing } = await supabase
      .from('teacher_group_assignments')
      .select('*')
      .eq('group_id', groupId)
      .eq('teacher_id', teacherId)
      .is('deleted_at', null)
      .single()
    
    if (existing) {
      throw new Error('Teacher is already assigned to this group')
    }
    
    // Create assignment
    const { error } = await supabase
      .from('teacher_group_assignments')
      .insert({
        group_id: groupId,
        teacher_id: teacherId,
        organization_id: organizationId,
        role,
        status: 'active',
        assigned_date: new Date().toISOString(),
        created_by: user.id,
        updated_by: user.id,
      })
    
    if (error) {
      throw new Error(`Failed to assign teacher: ${error.message}`)
    }
    
    await this.logActivity(
      'ASSIGN_TEACHER',
      groupId,
      'Teacher Assignment',
      null,
      { groupId, teacherId, role },
      `Assigned teacher ${teacherId} to group ${groupId}`
    )
  }

  /**
   * Remove a teacher from a group
   */
  async removeTeacher(groupId: string, teacherId: string): Promise<void> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const user = await this.getCurrentUser()
    const supabase = await this.getSupabase()
    
    const { error } = await supabase
      .from('teacher_group_assignments')
      .update({
        status: 'inactive',
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq('group_id', groupId)
      .eq('teacher_id', teacherId)
      .is('deleted_at', null)
    
    if (error) {
      throw new Error(`Failed to remove teacher: ${error.message}`)
    }
    
    await this.logActivity(
      'REMOVE_TEACHER',
      groupId,
      'Teacher Removal',
      null,
      { groupId, teacherId },
      `Removed teacher ${teacherId} from group ${groupId}`
    )
  }

  /**
   * Get available groups for enrollment
   */
  async getAvailableGroups(): Promise<Group[]> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .eq('is_active', true)
      .eq('status', 'active')
      .gt('max_students', 0) // Has capacity
      .order('name')
    
    if (error) {
      throw new Error(`Failed to get available groups: ${error.message}`)
    }
    
    // Filter groups that haven't reached max capacity
    const availableGroups = (data || []).filter(group => {
      const currentEnrollment = group.current_enrollment || 0
      return currentEnrollment < group.max_students
    })
    
    return availableGroups
  }

  /**
   * Get group statistics
   */
  async getStatistics(): Promise<{
    total: number
    active: number
    inactive: number
    by_status: Record<string, number>
    by_subject: Record<string, number>
    total_capacity: number
    total_enrolled: number
  }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // Get all groups for statistics
    const { data, error } = await supabase
      .from('groups')
      .select('status, subject, is_active, max_students, current_enrollment')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
    
    if (error) {
      throw new Error(`Failed to get group statistics: ${error.message}`)
    }
    
    const groups = data || []
    
    // Calculate statistics
    const stats = {
      total: groups.length,
      active: groups.filter(g => g.is_active).length,
      inactive: groups.filter(g => !g.is_active).length,
      by_status: {} as Record<string, number>,
      by_subject: {} as Record<string, number>,
      total_capacity: 0,
      total_enrolled: 0,
    }
    
    // Group by status
    groups.forEach(group => {
      const status = group.status || 'unknown'
      stats.by_status[status] = (stats.by_status[status] || 0) + 1
      
      // Sum capacities and enrollments
      stats.total_capacity += group.max_students || 0
      stats.total_enrolled += group.current_enrollment || 0
    })
    
    // Group by subject
    groups.forEach(group => {
      const subject = group.subject || 'unknown'
      stats.by_subject[subject] = (stats.by_subject[subject] || 0) + 1
    })
    
    return stats
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
        results.errors.push(`Failed to delete group ${id}: ${message}`)
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
        results.errors.push(`Failed to restore group ${id}: ${message}`)
      }
    }
    
    return results
  }
}

// Export singleton instance
export const groupService = new GroupService()