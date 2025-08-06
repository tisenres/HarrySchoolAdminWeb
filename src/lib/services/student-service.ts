import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { Database } from '@/types/database'
import { uuidSchema, nameSchema, emailSchema, phoneSchema } from '@/lib/validations'

type Student = Database['public']['Tables']['students']['Row']
type StudentInsert = Database['public']['Tables']['students']['Insert']
type StudentUpdate = Database['public']['Tables']['students']['Update']

export const studentInsertSchema = z.object({
  organization_id: uuidSchema,
  first_name: nameSchema,
  last_name: nameSchema,
  date_of_birth: z.string().date(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  nationality: z.string().optional(),
  student_id: z.string().optional(),
  enrollment_date: z.string().date(),
  enrollment_status: z.enum(['active', 'inactive', 'graduated', 'transferred', 'expelled', 'on_hold']).optional(),
  grade_level: z.string().optional(),
  primary_phone: phoneSchema.optional(),
  secondary_phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    postal_code: z.string().optional()
  }).optional(),
  parent_guardian_info: z.object({
    father_name: z.string().optional(),
    mother_name: z.string().optional(),
    guardian_name: z.string().optional(),
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
    relationship: z.string().optional()
  }).optional(),
  emergency_contacts: z.array(z.object({
    name: z.string(),
    phone: phoneSchema,
    relationship: z.string(),
    email: emailSchema.optional()
  })).optional(),
  family_notes: z.string().optional(),
  previous_education: z.object({}).passthrough().optional(),
  special_needs: z.string().optional(),
  medical_notes: z.string().optional(),
  allergies: z.string().optional(),
  payment_plan: z.enum(['monthly', 'quarterly', 'annual', 'custom']).optional(),
  tuition_fee: z.number().positive().optional(),
  currency: z.string().optional(),
  payment_status: z.enum(['current', 'overdue', 'paid_ahead', 'partial', 'suspended']).optional(),
  profile_image_url: z.string().url().optional(),
  documents: z.object({}).passthrough().optional(),
  notes: z.string().optional()
})

export const studentUpdateSchema = studentInsertSchema.partial().omit({ organization_id: true })

export class StudentService {
  private supabase = createClient()

  async checkPermission(allowedRoles: string[] = ['admin', 'superadmin']) {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile || !allowedRoles.includes(profile.role)) {
      throw new Error('Insufficient permissions')
    }

    return { user, profile }
  }

  async create(studentData: z.infer<typeof studentInsertSchema>): Promise<Student> {
    const { user } = await this.checkPermission(['admin', 'superadmin'])
    
    const validatedData = studentInsertSchema.parse(studentData)

    const { data, error } = await this.supabase
      .from('students')
      .insert({
        ...validatedData,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getById(id: string): Promise<Student | null> {
    const { profile } = await this.checkPermission(['admin', 'superadmin'])

    let query = this.supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .eq('deleted_at', null)

    if (profile.role === 'admin') {
      query = query.eq('organization_id', profile.organization_id)
    }

    const { data, error } = await query.single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async getByOrganization(
    organizationId?: string,
    options: {
      page?: number
      limit?: number
      search?: string
      status?: string
      paymentStatus?: string
      gradeLevel?: string
    } = {}
  ): Promise<{ data: Student[], count: number }> {
    const { profile } = await this.checkPermission(['admin', 'superadmin'])

    const { page = 1, limit = 20, search, status, paymentStatus, gradeLevel } = options

    let query = this.supabase
      .from('students')
      .select('*', { count: 'exact' })
      .eq('deleted_at', null)

    // Apply organization filter
    const targetOrganization = profile.role === 'admin' ? profile.organization_id : organizationId
    if (targetOrganization) {
      query = query.eq('organization_id', targetOrganization)
    }

    // Apply filters
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,full_name.ilike.%${search}%,primary_phone.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (status) {
      query = query.eq('enrollment_status', status)
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus)
    }
    if (gradeLevel) {
      query = query.eq('grade_level', gradeLevel)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Order by created_at
    query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) throw error
    return { data: data || [], count: count || 0 }
  }

  async update(id: string, updateData: z.infer<typeof studentUpdateSchema>): Promise<Student> {
    const { user, profile } = await this.checkPermission(['admin', 'superadmin'])

    const validatedData = studentUpdateSchema.parse(updateData)

    let query = this.supabase
      .from('students')
      .update({
        ...validatedData,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('deleted_at', null)

    if (profile.role === 'admin') {
      query = query.eq('organization_id', profile.organization_id)
    }

    const { data, error } = await query.select().single()

    if (error) throw error
    return data
  }

  async softDelete(id: string): Promise<void> {
    const { user, profile } = await this.checkPermission(['admin', 'superadmin'])

    let query = this.supabase
      .from('students')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id
      })
      .eq('id', id)
      .eq('deleted_at', null)

    if (profile.role === 'admin') {
      query = query.eq('organization_id', profile.organization_id)
    }

    const { error } = await query

    if (error) throw error
  }

  async getStudentGroups(id: string) {
    const { profile } = await this.checkPermission(['admin', 'superadmin'])

    let query = this.supabase
      .from('student_group_enrollments')
      .select(`
        *,
        groups (
          id,
          name,
          description,
          subject,
          level,
          schedule,
          start_date,
          end_date,
          classroom,
          price_per_student,
          currency
        )
      `)
      .eq('student_id', id)
      .eq('status', 'enrolled')

    if (profile.role === 'admin') {
      query = query.eq('organization_id', profile.organization_id)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async getStudentPayments(id: string) {
    // This would integrate with a payments table when implemented
    // For now, return basic payment info from student record
    const student = await this.getById(id)
    if (!student) throw new Error('Student not found')

    return {
      currentBalance: 0,
      totalPaid: 0,
      totalDue: student.tuition_fee || 0,
      paymentStatus: student.payment_status,
      paymentPlan: student.payment_plan,
      currency: student.currency,
      payments: [] // Would come from payments table
    }
  }

  async updatePaymentStatus(id: string, status: 'current' | 'overdue' | 'paid_ahead' | 'partial' | 'suspended') {
    const { user, profile } = await this.checkPermission(['admin', 'superadmin'])

    let query = this.supabase
      .from('students')
      .update({
        payment_status: status,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('deleted_at', null)

    if (profile.role === 'admin') {
      query = query.eq('organization_id', profile.organization_id)
    }

    const { error } = await query

    if (error) throw error
  }

  async updateEnrollmentStatus(id: string, status: 'active' | 'inactive' | 'graduated' | 'transferred' | 'expelled' | 'on_hold') {
    const { user, profile } = await this.checkPermission(['admin', 'superadmin'])

    let query = this.supabase
      .from('students')
      .update({
        enrollment_status: status,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('deleted_at', null)

    if (profile.role === 'admin') {
      query = query.eq('organization_id', profile.organization_id)
    }

    const { error } = await query

    if (error) throw error
  }

  async searchStudents(query: string, organizationId?: string): Promise<Student[]> {
    const { profile } = await this.checkPermission(['admin', 'superadmin'])

    let searchQuery = this.supabase
      .from('students')
      .select('*')
      .eq('deleted_at', null)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,full_name.ilike.%${query}%,primary_phone.ilike.%${query}%`)
      .order('full_name')
      .limit(20)

    // Apply organization filter
    const targetOrganization = profile.role === 'admin' ? profile.organization_id : organizationId
    if (targetOrganization) {
      searchQuery = searchQuery.eq('organization_id', targetOrganization)
    }

    const { data, error } = await searchQuery
    if (error) throw error
    return data || []
  }

  async getEnrollmentStats(organizationId?: string) {
    const { profile } = await this.checkPermission(['admin', 'superadmin'])

    const targetOrganization = profile.role === 'admin' ? profile.organization_id : organizationId

    let baseQuery = this.supabase
      .from('students')
      .select('enrollment_status, payment_status', { count: 'exact', head: true })
      .eq('deleted_at', null)

    if (targetOrganization) {
      baseQuery = baseQuery.eq('organization_id', targetOrganization)
    }

    const [
      { count: totalStudents },
      { count: activeStudents },
      { count: inactiveStudents },
      { count: currentPayments },
      { count: overduePayments }
    ] = await Promise.all([
      baseQuery,
      baseQuery.eq('enrollment_status', 'active'),
      baseQuery.eq('enrollment_status', 'inactive'),
      baseQuery.eq('payment_status', 'current'),
      baseQuery.eq('payment_status', 'overdue')
    ])

    return {
      total: totalStudents || 0,
      active: activeStudents || 0,
      inactive: inactiveStudents || 0,
      currentPayments: currentPayments || 0,
      overduePayments: overduePayments || 0,
      retentionRate: totalStudents ? ((activeStudents || 0) / totalStudents) * 100 : 0
    }
  }
}

export default new StudentService()