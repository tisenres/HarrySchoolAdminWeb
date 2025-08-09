import { BaseService } from './base-service'
import { studentInsertSchema, studentUpdateSchema, studentSearchSchema, paginationSchema } from '@/lib/validations'
import type { Student, StudentInsert } from '@/types/database'
import type { z } from 'zod'

export class StudentService extends BaseService {
  constructor() {
    super('students')
  }

  /**
   * Create a new student
   */
  async create(studentData: z.infer<typeof studentInsertSchema>): Promise<Student> {
    // Check permissions
    await this.checkPermission(['admin', 'superadmin'])
    
    // Validate input
    const validatedData = studentInsertSchema.parse(studentData)
    
    // Get current user and organization
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    
    // Generate unique student ID if not provided
    const studentId = validatedData.student_id || await this.generateStudentId()
    
    // Ensure student belongs to user's organization
    const insertData = Object.fromEntries(
      Object.entries({
        ...validatedData,
        student_id: studentId,
        organization_id: organizationId,
        created_by: user.id,
        updated_by: user.id,
        total_debt: 0,
      }).filter(([_, value]) => value !== undefined)
    ) as StudentInsert
    
    // Insert student
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('students')
      .insert(insertData)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create student: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'CREATE',
      data.id,
      `${data.first_name} ${data.last_name}`,
      null,
      data,
      `Created new student: ${data.first_name} ${data.last_name}`
    )
    
    return data
  }

  /**
   * Get a student by ID with enrollment history
   */
  async getById(id: string): Promise<Student & { enrollments?: any[] }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        student_group_enrollments!inner(
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
            end_date
          )
        )
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single()
    
    if (error) {
      throw new Error(`Failed to get student: ${error.message}`)
    }
    
    return data
  }

  /**
   * Get all students with optional filtering, searching, and pagination
   */
  async getAll(
    search?: z.infer<typeof studentSearchSchema>,
    pagination?: z.infer<typeof paginationSchema>
  ): Promise<{ data: Student[]; count: number; total_pages: number }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // Validate pagination
    const { page, limit, sort_by, sort_order } = pagination 
      ? paginationSchema.parse(pagination) 
      : { page: 1, limit: 20, sort_by: 'created_at', sort_order: 'desc' as const }
    
    // Start building query
    let query = supabase
      .from('students')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
    
    // Apply search filters
    if (search) {
      const validatedSearch = studentSearchSchema.parse(search)
      
      // Text search across name, email, phone, student_id
      if (validatedSearch.query) {
        query = query.or(`
          first_name.ilike.%${validatedSearch.query}%,
          last_name.ilike.%${validatedSearch.query}%,
          full_name.ilike.%${validatedSearch.query}%,
          email.ilike.%${validatedSearch.query}%,
          phone.ilike.%${validatedSearch.query}%,
          student_id.ilike.%${validatedSearch.query}%,
          parent_name.ilike.%${validatedSearch.query}%,
          parent_phone.ilike.%${validatedSearch.query}%
        `)
      }
      
      if (validatedSearch.student_status) {
        query = query.eq('student_status', validatedSearch.student_status)
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
    
    const { data, error, count } = await query
    
    if (error) {
      throw new Error(`Failed to get students: ${error.message}`)
    }
    
    const total_pages = Math.ceil((count || 0) / limit)
    
    return {
      data: data || [],
      count: count || 0,
      total_pages,
    }
  }

  /**
   * Update a student
   */
  async update(id: string, studentData: z.infer<typeof studentUpdateSchema>): Promise<Student> {
    // Check permissions
    await this.checkPermission(['admin', 'superadmin'])
    
    // Validate input
    const validatedData = studentUpdateSchema.parse(studentData)
    
    // Get current user and organization
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    
    // Get existing student for audit log
    const existing = await this.getById(id)
    
    // Update student
    const updateData = Object.fromEntries(
      Object.entries({
        ...validatedData,
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
    
    // Log activity
    await this.logActivity(
      'UPDATE',
      data.id,
      `${data.first_name} ${data.last_name}`,
      existing,
      data,
      `Updated student: ${data.first_name} ${data.last_name}`
    )
    
    return data
  }

  /**
   * Update student status with lifecycle tracking
   */
  async updateStatus(id: string, newStatus: string, reason?: string): Promise<Student> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const existing = await this.getById(id)
    const oldStatus = existing.student_status
    
    // Validate status transition
    this.validateStatusTransition(oldStatus, newStatus)
    
    // Update status
    const updated = await this.update(id, {
      student_status: newStatus,
      notes: reason ? `${existing.notes || ''}\n[${new Date().toISOString()}] Status changed from ${oldStatus} to ${newStatus}: ${reason}` : existing.notes,
    })
    
    // Log status change
    await this.logActivity(
      'STATUS_CHANGE',
      id,
      `${existing.first_name} ${existing.last_name}`,
      { status: oldStatus },
      { status: newStatus, reason },
      `Changed student status from ${oldStatus} to ${newStatus}`
    )
    
    // Handle status-specific actions
    await this.handleStatusChangeActions(id, oldStatus, newStatus)
    
    return updated
  }

  /**
   * Soft delete a student
   */
  async delete(id: string): Promise<Student> {
    // Check permissions
    await this.checkPermission(['admin', 'superadmin'])
    
    const organizationId = await this.getCurrentOrganization()
    
    // Get existing student for audit log
    const existing = await this.getById(id)
    
    // Check if student has active enrollments
    const supabase = await this.getSupabase()
    const { count: activeEnrollments } = await supabase
      .from('student_group_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', id)
      .eq('status', 'active')
      .is('deleted_at', null)
    
    if (activeEnrollments && activeEnrollments > 0) {
      throw new Error('Cannot delete student with active group enrollments')
    }
    
    // Perform soft delete
    const user = await this.getCurrentUser()
    
    const { data, error } = await supabase
      .from('students')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        is_active: false,
        student_status: 'archived',
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to delete student: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'DELETE',
      data.id,
      `${existing.first_name} ${existing.last_name}`,
      existing,
      data,
      `Deleted student: ${existing.first_name} ${existing.last_name}`
    )
    
    return data
  }

  /**
   * Restore a soft-deleted student
   */
  override async restore(id: string): Promise<Student> {
    // Check permissions
    await this.checkPermission(['admin', 'superadmin'])
    
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('students')
      .update({
        deleted_at: null,
        deleted_by: null,
        student_status: 'active',
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to restore student: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'RESTORE',
      data.id,
      `${data.first_name} ${data.last_name}`,
      null,
      data,
      `Restored student: ${data.first_name} ${data.last_name}`
    )
    
    return data
  }

  /**
   * Enroll student in a group
   */
  async enrollInGroup(studentId: string, groupId: string, notes?: string): Promise<void> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // Check if enrollment already exists
    const { data: existing } = await supabase
      .from('student_group_enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('group_id', groupId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single()
    
    if (existing) {
      throw new Error('Student is already enrolled in this group')
    }
    
    // Check group capacity
    const { data: group } = await supabase
      .from('groups')
      .select('max_students, current_enrollment')
      .eq('id', groupId)
      .single()
    
    if (group && group.current_enrollment >= group.max_students) {
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
        current_enrollment: (group?.current_enrollment || 0) + 1,
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
   * Remove student from a group
   */
  async unenrollFromGroup(studentId: string, groupId: string, reason?: string): Promise<void> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const user = await this.getCurrentUser()
    const supabase = await this.getSupabase()
    
    // Update enrollment status
    const { error: unenrollError } = await supabase
      .from('student_group_enrollments')
      .update({
        status: 'completed',
        completion_date: new Date().toISOString(),
        notes: reason,
        updated_by: user.id,
      })
      .eq('student_id', studentId)
      .eq('group_id', groupId)
      .eq('status', 'active')
      .is('deleted_at', null)
    
    if (unenrollError) {
      throw new Error(`Failed to unenroll student: ${unenrollError.message}`)
    }
    
    // Update group enrollment count
    const { data: group } = await supabase
      .from('groups')
      .select('current_enrollment')
      .eq('id', groupId)
      .single()
    
    if (group) {
      await supabase
        .from('groups')
        .update({
          current_enrollment: Math.max(0, (group.current_enrollment || 1) - 1),
        })
        .eq('id', groupId)
    }
    
    await this.logActivity(
      'UNENROLL',
      studentId,
      'Student Unenrollment',
      null,
      { studentId, groupId, reason },
      `Unenrolled student ${studentId} from group ${groupId}`
    )
  }

  /**
   * Get enrollment history for a student
   */
  async getEnrollmentHistory(studentId: string): Promise<any[]> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('student_group_enrollments')
      .select(`
        *,
        groups!inner(
          id,
          name,
          subject,
          level,
          group_code,
          start_date,
          end_date,
          teacher_group_assignments!inner(
            teachers!inner(
              id,
              first_name,
              last_name,
              full_name
            )
          )
        )
      `)
      .eq('student_id', studentId)
      .eq('organization_id', organizationId)
      .order('enrollment_date', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to get enrollment history: ${error.message}`)
    }
    
    return data || []
  }

  /**
   * Get student statistics
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
  }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // Get all students for statistics
    const { data, error } = await supabase
      .from('students')
      .select('student_status, payment_status, grade, is_active, total_debt, date_of_birth')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
    
    if (error) {
      throw new Error(`Failed to get student statistics: ${error.message}`)
    }
    
    const students = data || []
    
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
    }
    
    // Group by status
    students.forEach(student => {
      const status = student.student_status || 'unknown'
      stats.by_status[status] = (stats.by_status[status] || 0) + 1
      
      const paymentStatus = student.payment_status || 'unknown'
      stats.by_payment_status[paymentStatus] = (stats.by_payment_status[paymentStatus] || 0) + 1
      
      const grade = student.grade || 'unknown'
      stats.by_grade[grade] = (stats.by_grade[grade] || 0) + 1
      
      stats.total_debt += student.total_debt || 0
    })
    
    // Calculate average age
    const ages = students
      .filter(s => s.date_of_birth)
      .map(s => {
        const birthDate = new Date(s.date_of_birth!)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear()
        return age
      })
    
    if (ages.length > 0) {
      stats.average_age = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length)
    }
    
    return stats
  }

  /**
   * Generate unique student ID
   */
  private async generateStudentId(): Promise<string> {
    const year = new Date().getFullYear()
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `STU${year}${randomNum}`
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(oldStatus: string | null, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      'prospect': ['active', 'inactive', 'archived'],
      'active': ['on_hold', 'graduated', 'dropped', 'archived'],
      'on_hold': ['active', 'dropped', 'archived'],
      'graduated': ['alumni', 'archived'],
      'dropped': ['active', 'archived'],
      'alumni': ['archived'],
      'archived': ['active', 'prospect'],
    }
    
    const currentStatus = oldStatus || 'prospect'
    const allowedTransitions = validTransitions[currentStatus] || []
    
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`)
    }
  }

  /**
   * Handle status change actions
   */
  private async handleStatusChangeActions(studentId: string, oldStatus: string | null, newStatus: string): Promise<void> {
    // Handle specific status change actions
    if (newStatus === 'graduated') {
      // Mark all active enrollments as completed
      const supabase = await this.getSupabase()
      await supabase
        .from('student_group_enrollments')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString(),
          grade: 'graduated',
        })
        .eq('student_id', studentId)
        .eq('status', 'active')
    } else if (newStatus === 'dropped') {
      // Mark all active enrollments as dropped
      const supabase = await this.getSupabase()
      await supabase
        .from('student_group_enrollments')
        .update({
          status: 'dropped',
          completion_date: new Date().toISOString(),
        })
        .eq('student_id', studentId)
        .eq('status', 'active')
    }
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
        results.errors.push(`Failed to delete student ${id}: ${message}`)
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
        results.errors.push(`Failed to restore student ${id}: ${message}`)
      }
    }
    
    return results
  }

  async bulkUpdateStatus(ids: string[], newStatus: string, reason?: string): Promise<{ success: number; errors: string[] }> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const results = { success: 0, errors: [] as string[] }
    
    for (const id of ids) {
      try {
        await this.updateStatus(id, newStatus, reason)
        results.success++
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        results.errors.push(`Failed to update status for student ${id}: ${message}`)
      }
    }
    
    return results
  }
}

// Export singleton instance
export const studentService = new StudentService()