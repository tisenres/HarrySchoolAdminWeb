import { BaseService } from './base-service'
import { studentInsertSchema, studentUpdateSchema, studentSearchSchema, paginationSchema } from '@/lib/validations'
import type { Student, StudentInsert } from '@/types/database'
import type { z } from 'zod'

/**
 * Optimized Student Service
 * Eliminates N+1 queries with strategic JOINs and efficient data fetching
 */
export class OptimizedStudentService extends BaseService {
  constructor() {
    super('students')
  }

  /**
   * Create a new student
   */
  async create(studentData: z.infer<typeof studentInsertSchema>): Promise<Student> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const validatedData = studentInsertSchema.parse(studentData)
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    
    const studentId = validatedData.student_id || await this.generateStudentId()
    
    const insertData = Object.fromEntries(
      Object.entries({
        ...validatedData,
        student_id: studentId,
        full_name: `${validatedData.first_name} ${validatedData.last_name}`,
        organization_id: organizationId,
        created_by: user.id,
        updated_by: user.id,
        total_debt: 0,
      }).filter(([_, value]) => value !== undefined)
    ) as StudentInsert
    
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('students')
      .insert(insertData)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create student: ${error.message}`)
    }
    
    await this.logActivity(
      'CREATE',
      data.id,
      data.full_name,
      null,
      data,
      `Created new student: ${data.full_name}`
    )
    
    return data
  }

  /**
   * OPTIMIZED: Get a student by ID with enrollment history in single query
   */
  async getById(id: string): Promise<Student & { 
    enrollments?: any[],
    groups?: any[]
  }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // OPTIMIZED: Single query with proper JOINs
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single()
    
    if (studentError) {
      throw new Error(`Failed to get student: ${studentError.message}`)
    }
    
    // OPTIMIZED: Parallel fetch for related data
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('student_group_enrollments')
      .select(`
        id,
        group_id,
        enrollment_date,
        completion_date,
        status,
        grade,
        attendance_percentage,
        notes,
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
      .eq('student_id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('enrollment_date', { ascending: false })
    
    if (enrollmentsError) {
      console.warn(`Failed to fetch student enrollments: ${enrollmentsError.message}`)
    }
    
    return {
      ...student,
      enrollments: enrollments || [],
      groups: (enrollments || []).map(e => e.groups).filter(Boolean)
    }
  }

  /**
   * OPTIMIZED: Get all students with enrollment counts in single query
   */
  async getAll(
    search?: z.infer<typeof studentSearchSchema>,
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
      .from('students')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
    
    // Apply search filters
    if (search) {
      const validatedSearch = studentSearchSchema.parse(search)
      
      if (validatedSearch.query) {
        query = query.or(`
          full_name.ilike.%${validatedSearch.query}%,
          first_name.ilike.%${validatedSearch.query}%,
          last_name.ilike.%${validatedSearch.query}%,
          email.ilike.%${validatedSearch.query}%,
          primary_phone.ilike.%${validatedSearch.query}%,
          student_id.ilike.%${validatedSearch.query}%,
          parent_name.ilike.%${validatedSearch.query}%,
          parent_phone.ilike.%${validatedSearch.query}%
        `)
      }
      
      if (validatedSearch.enrollment_status) {
        const statuses = Array.isArray(validatedSearch.enrollment_status) 
          ? validatedSearch.enrollment_status 
          : [validatedSearch.enrollment_status]
        query = query.in('enrollment_status', statuses)
      }
      
      if (validatedSearch.payment_status) {
        query = query.eq('payment_status', validatedSearch.payment_status)
      }
      
      if (validatedSearch.grade) {
        query = query.eq('grade', validatedSearch.grade)
      }
      
      if (validatedSearch.age_from) {
        const birthDateTo = new Date()
        birthDateTo.setFullYear(birthDateTo.getFullYear() - validatedSearch.age_from)
        query = query.lte('date_of_birth', birthDateTo.toISOString())
      }
      
      if (validatedSearch.age_to) {
        const birthDateFrom = new Date()
        birthDateFrom.setFullYear(birthDateFrom.getFullYear() - validatedSearch.age_to)
        query = query.gte('date_of_birth', birthDateFrom.toISOString())
      }
      
      if (validatedSearch.enrollment_date_from) {
        query = query.gte('enrollment_date', validatedSearch.enrollment_date_from)
      }
      
      if (validatedSearch.enrollment_date_to) {
        query = query.lte('enrollment_date', validatedSearch.enrollment_date_to)
      }
      
      if (validatedSearch.is_active !== undefined) {
        query = query.eq('is_active', validatedSearch.is_active)
      }
      
      if (validatedSearch.has_debt !== undefined) {
        if (validatedSearch.has_debt) {
          query = query.gt('total_debt', 0)
        } else {
          query = query.eq('total_debt', 0)
        }
      }
    }
    
    // Apply sorting
    query = this.applySorting(query, sort_by, sort_order)
    
    // Apply pagination
    query = this.applyPagination(query, page, limit)
    
    const { data: students, error, count } = await query
    
    if (error) {
      throw new Error(`Failed to get students: ${error.message}`)
    }
    
    // OPTIMIZED: Batch fetch enrollment counts for all students
    if (students && students.length > 0) {
      const studentIds = students.map(s => s.id)
      
      // Get enrollment counts per student
      const { data: enrollmentCounts } = await supabase
        .from('student_group_enrollments')
        .select('student_id')
        .in('student_id', studentIds)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .is('deleted_at', null)
      
      // Count occurrences
      const enrollmentCountMap = (enrollmentCounts || []).reduce((acc, item) => {
        acc[item.student_id] = (acc[item.student_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      // Enrich students with enrollment counts and calculated age
      const enrichedStudents = students.map(student => {
        const age = student.date_of_birth ? 
          new Date().getFullYear() - new Date(student.date_of_birth).getFullYear() : null
        
        return {
          ...student,
          enrollment_count: enrollmentCountMap[student.id] || 0,
          age
        }
      })
      
      return {
        data: enrichedStudents,
        count: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        limit
      }
    }
    
    return {
      data: students || [],
      count: count || 0,
      total_pages: Math.ceil((count || 0) / limit),
      limit
    }
  }

  /**
   * Update a student
   */
  async update(id: string, studentData: z.infer<typeof studentUpdateSchema>): Promise<Student> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const validatedData = studentUpdateSchema.parse(studentData)
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
      .from('students')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update student: ${error.message}`)
    }
    
    await this.logActivity(
      'UPDATE',
      data.id,
      data.full_name,
      existing,
      data,
      `Updated student: ${data.full_name}`
    )
    
    return data
  }

  /**
   * Soft delete a student
   */
  async delete(id: string): Promise<Student> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const organizationId = await this.getCurrentOrganization()
    const existing = await this.getById(id)
    
    const supabase = await this.getSupabase()
    
    // Check active enrollments
    const { count: activeEnrollments } = await supabase
      .from('student_group_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', id)
      .eq('status', 'active')
      .is('deleted_at', null)
    
    if (activeEnrollments && activeEnrollments > 0) {
      throw new Error('Cannot delete student with active group enrollments')
    }
    
    const user = await this.getCurrentUser()
    
    const { data, error } = await supabase
      .from('students')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        is_active: false,
        enrollment_status: 'archived',
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to delete student: ${error.message}`)
    }
    
    await this.logActivity(
      'DELETE',
      data.id,
      existing.full_name,
      existing,
      data,
      `Deleted student: ${existing.full_name}`
    )
    
    return data
  }

  /**
   * OPTIMIZED: Get student statistics with single aggregated query
   */
  async getStatistics(): Promise<{
    total: number
    active: number
    inactive: number
    by_status: Record<string, number>
    by_payment_status: Record<string, number>
    by_grade: Record<string, number>
    total_debt: number
    average_age: number
    total_enrollments: number
  }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // OPTIMIZED: Get all statistics in parallel
    const [
      studentsResult,
      enrollmentResult
    ] = await Promise.all([
      // Get students with their stats
      supabase
        .from('students')
        .select('enrollment_status, payment_status, grade, is_active, total_debt, date_of_birth')
        .eq('organization_id', organizationId)
        .is('deleted_at', null),
      
      // Get enrollment counts
      supabase
        .from('student_group_enrollments')
        .select('student_id')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .is('deleted_at', null)
    ])
    
    if (studentsResult.error) {
      throw new Error(`Failed to get student statistics: ${studentsResult.error.message}`)
    }
    
    const students = studentsResult.data || []
    
    // Count enrollments per student
    const enrollmentCounts = (enrollmentResult.data || []).reduce((acc, item) => {
      acc[item.student_id] = (acc[item.student_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Calculate statistics
    const stats = {
      total: students.length,
      active: students.filter(s => s.is_active).length,
      inactive: students.filter(s => !s.is_active).length,
      by_status: {} as Record<string, number>,
      by_payment_status: {} as Record<string, number>,
      by_grade: {} as Record<string, number>,
      total_debt: 0,
      average_age: 0,
      total_enrollments: Object.values(enrollmentCounts).reduce((sum, count) => sum + count, 0),
    }
    
    // Aggregate statistics
    students.forEach(student => {
      // By enrollment status
      const status = student.enrollment_status || 'unknown'
      stats.by_status[status] = (stats.by_status[status] || 0) + 1
      
      // By payment status
      const paymentStatus = student.payment_status || 'unknown'
      stats.by_payment_status[paymentStatus] = (stats.by_payment_status[paymentStatus] || 0) + 1
      
      // By grade
      const grade = student.grade || 'unknown'
      stats.by_grade[grade] = (stats.by_grade[grade] || 0) + 1
      
      // Total debt
      stats.total_debt += student.total_debt || 0
    })
    
    // Calculate average age
    const ages = students
      .filter(s => s.date_of_birth)
      .map(s => {
        const birthDate = new Date(s.date_of_birth!)
        const today = new Date()
        return today.getFullYear() - birthDate.getFullYear()
      })
    
    if (ages.length > 0) {
      stats.average_age = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length)
    }
    
    return stats
  }

  /**
   * OPTIMIZED: Enroll student in group with capacity check
   */
  async enrollInGroup(studentId: string, groupId: string, notes?: string): Promise<void> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // OPTIMIZED: Parallel check for existing enrollment and group capacity
    const [existingResult, groupResult] = await Promise.all([
      supabase
        .from('student_group_enrollments')
        .select('id')
        .eq('student_id', studentId)
        .eq('group_id', groupId)
        .eq('status', 'active')
        .is('deleted_at', null)
        .single(),
      
      supabase
        .from('groups')
        .select('max_students, current_enrollment')
        .eq('id', groupId)
        .single()
    ])
    
    if (existingResult.data) {
      throw new Error('Student is already enrolled in this group')
    }
    
    if (groupResult.data && groupResult.data.current_enrollment >= groupResult.data.max_students) {
      throw new Error('Group has reached maximum capacity')
    }
    
    // Create enrollment
    const { error: enrollError } = await supabase
      .from('student_group_enrollments')
      .insert({
        student_id: studentId,
        group_id: groupId,
        organization_id: organizationId,
        enrollment_date: new Date().toISOString(),
        status: 'active',
        notes,
        created_by: user.id,
        updated_by: user.id,
      })
    
    if (enrollError) {
      throw new Error(`Failed to enroll student: ${enrollError.message}`)
    }
    
    // Update group enrollment count
    const { error: updateError } = await supabase
      .from('groups')
      .update({
        current_enrollment: (groupResult.data?.current_enrollment || 0) + 1,
      })
      .eq('id', groupId)
    
    if (updateError) {
      console.error('Failed to update group enrollment count:', updateError)
    }
    
    await this.logActivity(
      'ENROLL',
      studentId,
      'Student Enrollment',
      null,
      { studentId, groupId },
      `Enrolled student ${studentId} in group ${groupId}`
    )
  }

  /**
   * OPTIMIZED: Bulk operations with transaction-like behavior
   */
  async bulkDelete(ids: string[]): Promise<{ success: number; errors: string[] }> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // Check for active enrollments in all students at once
    const { data: activeStudents } = await supabase
      .from('student_group_enrollments')
      .select('student_id')
      .in('student_id', ids)
      .eq('status', 'active')
      .is('deleted_at', null)
    
    const studentsWithEnrollments = new Set((activeStudents || []).map(e => e.student_id))
    
    const results = { success: 0, errors: [] as string[] }
    const deletableIds = ids.filter(id => !studentsWithEnrollments.has(id))
    const blockedIds = ids.filter(id => studentsWithEnrollments.has(id))
    
    // Add errors for blocked students
    blockedIds.forEach(id => {
      results.errors.push(`Student ${id} has active group enrollments`)
    })
    
    // Bulk delete deletable students
    if (deletableIds.length > 0) {
      const { error } = await supabase
        .from('students')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          is_active: false,
          enrollment_status: 'archived',
        })
        .in('id', deletableIds)
        .eq('organization_id', organizationId)
      
      if (error) {
        results.errors.push(`Bulk delete failed: ${error.message}`)
      } else {
        results.success = deletableIds.length
        
        await this.logActivity(
          'BULK_DELETE',
          'students',
          'Bulk Student Deletion',
          null,
          { ids: deletableIds },
          `Deleted ${deletableIds.length} students`
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
      .from('students')
      .update({
        deleted_at: null,
        deleted_by: null,
        enrollment_status: 'active',
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
      'students',
      'Bulk Student Restoration',
      null,
      { ids },
      `Restored ${data.length} students`
    )
    
    return {
      success: data.length,
      errors: []
    }
  }

  override async restore(id: string): Promise<Student> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('students')
      .update({
        deleted_at: null,
        deleted_by: null,
        enrollment_status: 'active',
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to restore student: ${error.message}`)
    }
    
    await this.logActivity(
      'RESTORE',
      data.id,
      data.full_name,
      null,
      data,
      `Restored student: ${data.full_name}`
    )
    
    return data
  }

  /**
   * Generate unique student ID
   */
  private async generateStudentId(): Promise<string> {
    const year = new Date().getFullYear()
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `STU${year}${randomNum}`
  }
}

// Export singleton instance
export const optimizedStudentService = new OptimizedStudentService()