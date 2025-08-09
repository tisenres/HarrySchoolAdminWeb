import { BaseService } from './base-service'
import { teacherInsertSchema, teacherUpdateSchema, teacherSearchSchema, paginationSchema } from '@/lib/validations'
import type { Teacher, TeacherInsert } from '@/types/database'
import type { z } from 'zod'

export class TeacherService extends BaseService {
  constructor() {
    super('teachers')
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
    
    const total_pages = Math.ceil((count || 0) / limit)
    
    return {
      data: data || [],
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
}