import { supabase } from '@/lib/supabase'
import type { Teacher, CreateTeacherRequest, UpdateTeacherRequest, TeacherFilters, TeacherSortConfig } from '@/types/teacher'

export class TeacherService {
  static async getTeachers(
    organizationId: string,
    filters?: TeacherFilters,
    sort?: TeacherSortConfig,
    page = 1,
    pageSize = 50
  ) {
    let query = supabase
      .from('teachers')
      .select(`
        *,
        teacher_assignment_stats!inner(
          active_groups,
          total_students
        )
      `)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)

    // Apply filters
    if (filters?.search) {
      query = query.or(`
        full_name.ilike.%${filters.search}%,
        email.ilike.%${filters.search}%,
        phone.ilike.%${filters.search}%,
        employee_id.ilike.%${filters.search}%
      `)
    }

    if (filters?.employment_status?.length) {
      query = query.in('employment_status', filters.employment_status)
    }

    if (filters?.contract_type?.length) {
      query = query.in('contract_type', filters.contract_type)
    }

    if (filters?.specializations?.length) {
      query = query.overlaps('specializations', filters.specializations)
    }

    if (filters?.hire_date_from) {
      query = query.gte('hire_date', filters.hire_date_from.toISOString())
    }

    if (filters?.hire_date_to) {
      query = query.lte('hire_date', filters.hire_date_to.toISOString())
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    // Apply sorting
    if (sort) {
      const ascending = sort.direction === 'asc'
      query = query.order(sort.field, { ascending })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch teachers: ${error.message}`)
    }

    return {
      data: data as unknown as Teacher[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  }

  static async getTeacher(id: string, organizationId: string) {
    const { data, error } = await supabase
      .from('teachers')
      .select(`
        *,
        teacher_assignment_stats(
          active_groups,
          total_students
        ),
        teacher_group_assignments(
          id,
          role,
          start_date,
          end_date,
          status,
          groups(
            id,
            name,
            subject,
            current_enrollment,
            max_students
          )
        )
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single()

    if (error) {
      throw new Error(`Failed to fetch teacher: ${error.message}`)
    }

    return data as unknown as Teacher
  }

  static async createTeacher(organizationId: string, teacherData: CreateTeacherRequest, userId: string) {
    // Filter out undefined properties for exactOptionalPropertyTypes compatibility
    const insertData = Object.fromEntries(
      Object.entries({
        ...teacherData,
        organization_id: organizationId,
        created_by: userId,
        updated_by: userId,
      }).filter(([_, value]) => value !== undefined)
    ) as any
    
    const { data, error } = await supabase
      .from('teachers')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create teacher: ${error.message}`)
    }

    // Log activity
    await this.logActivity('CREATE', 'teacher', data.id, `Created teacher: ${data.full_name}`, userId, organizationId)

    return data as unknown as Teacher
  }

  static async updateTeacher(teacherData: UpdateTeacherRequest, userId: string, organizationId: string) {
    const { id, ...updateData } = teacherData

    // Filter out undefined properties for exactOptionalPropertyTypes compatibility
    const filteredUpdateData = Object.fromEntries(
      Object.entries({
        ...updateData,
        updated_by: userId,
      }).filter(([_, value]) => value !== undefined)
    ) as any
    
    const { data, error } = await supabase
      .from('teachers')
      .update(filteredUpdateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update teacher: ${error.message}`)
    }

    // Log activity
    await this.logActivity('UPDATE', 'teacher', id, `Updated teacher: ${data.full_name}`, userId, organizationId)

    return data as unknown as Teacher
  }

  static async deleteTeacher(id: string, userId: string, organizationId: string) {
    const { data, error } = await supabase
      .from('teachers')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to delete teacher: ${error.message}`)
    }

    // Log activity
    await this.logActivity('DELETE', 'teacher', id, `Deleted teacher: ${data.full_name}`, userId, organizationId)

    return data as unknown as Teacher
  }

  static async bulkDeleteTeachers(ids: string[], userId: string, organizationId: string) {
    const { data, error } = await supabase
      .from('teachers')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
      })
      .in('id', ids)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .select()

    if (error) {
      throw new Error(`Failed to delete teachers: ${error.message}`)
    }

    // Log bulk activity
    await this.logActivity('BULK_DELETE', 'teacher', null, `Bulk deleted ${ids.length} teachers`, userId, organizationId)

    return data as unknown as Teacher[]
  }

  static async restoreTeacher(id: string, userId: string, organizationId: string) {
    const { data, error } = await supabase
      .from('teachers')
      .update({
        deleted_at: null,
        deleted_by: null,
        updated_by: userId,
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .not('deleted_at', 'is', null)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to restore teacher: ${error.message}`)
    }

    // Log activity
    await this.logActivity('RESTORE', 'teacher', id, `Restored teacher: ${data.full_name}`, userId, organizationId)

    return data as unknown as Teacher
  }

  static async getSpecializations(organizationId: string) {
    const { data, error } = await supabase
      .from('teachers')
      .select('specializations')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)

    if (error) {
      throw new Error(`Failed to fetch specializations: ${error.message}`)
    }

    // Extract unique specializations
    const allSpecializations = data.flatMap(teacher => teacher.specializations || [])
    return [...new Set(allSpecializations)].sort()
  }

  static async searchTeachers(organizationId: string, searchTerm: string, limit = 10) {
    const { data, error } = await supabase
      .from('teachers')
      .select('id, full_name, email, phone, specializations, employment_status')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .or(`
        full_name.ilike.%${searchTerm}%,
        email.ilike.%${searchTerm}%,
        phone.ilike.%${searchTerm}%,
        employee_id.ilike.%${searchTerm}%
      `)
      .limit(limit)

    if (error) {
      throw new Error(`Failed to search teachers: ${error.message}`)
    }

    return data
  }

  private static async logActivity(
    action: string,
    resourceType: string,
    resourceId: string | null,
    description: string,
    userId: string,
    organizationId: string
  ) {
    try {
      await supabase
        .from('activity_logs')
        .insert({
          organization_id: organizationId,
          user_id: userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          description,
          success: true,
        })
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }
}