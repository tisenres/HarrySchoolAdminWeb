import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'
import { Database } from '@/types/database'
import { uuidSchema, nameSchema } from '@/lib/validations'

type Group = Database['public']['Tables']['groups']['Row']
type GroupInsert = Database['public']['Tables']['groups']['Insert']
type GroupUpdate = Database['public']['Tables']['groups']['Update']

export const groupInsertSchema = z.object({
  organization_id: uuidSchema,
  name: nameSchema,
  description: z.string().optional(),
  group_code: z.string().optional(),
  subject: z.string().min(1),
  level: z.string().optional(),
  curriculum: z.object({}).passthrough().optional(),
  schedule: z.object({
    days: z.array(z.string()),
    start_time: z.string(),
    end_time: z.string(),
    room: z.string().optional()
  }),
  start_date: z.string().date(),
  end_date: z.string().date().optional(),
  duration_weeks: z.number().int().positive().optional(),
  max_students: z.number().int().positive(),
  group_type: z.enum(['regular', 'intensive', 'individual', 'online']).optional(),
  price_per_student: z.number().positive().optional(),
  currency: z.string().optional(),
  payment_frequency: z.enum(['monthly', 'quarterly', 'annual', 'one_time']).optional(),
  classroom: z.string().optional(),
  online_meeting_url: z.string().url().optional(),
  required_materials: z.object({}).passthrough().optional(),
  notes: z.string().optional()
})

export const groupUpdateSchema = groupInsertSchema.partial().omit({ organization_id: true })

export class GroupService {
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

  async create(groupData: z.infer<typeof groupInsertSchema>): Promise<Group> {
    const { user } = await this.checkPermission(['admin', 'superadmin'])
    
    const validatedData = groupInsertSchema.parse(groupData)

    const { data, error } = await this.supabase
      .from('groups')
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

  async getById(id: string): Promise<Group | null> {
    const { profile } = await this.checkPermission(['admin', 'superadmin'])

    let query = this.supabase
      .from('groups')
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
      subject?: string
      level?: string
      status?: string
    } = {}
  ): Promise<{ data: Group[], count: number }> {
    const { profile } = await this.checkPermission(['admin', 'superadmin'])

    const { page = 1, limit = 20, search, subject, level, status } = options

    let query = this.supabase
      .from('groups')
      .select('*', { count: 'exact' })
      .eq('deleted_at', null)

    // Apply organization filter
    const targetOrganization = profile.role === 'admin' ? profile.organization_id : organizationId
    if (targetOrganization) {
      query = query.eq('organization_id', targetOrganization)
    }

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,subject.ilike.%${search}%`)
    }
    if (subject) {
      query = query.eq('subject', subject)
    }
    if (level) {
      query = query.eq('level', level)
    }
    if (status) {
      query = query.eq('status', status)
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

  async update(id: string, updateData: z.infer<typeof groupUpdateSchema>): Promise<Group> {
    const { user, profile } = await this.checkPermission(['admin', 'superadmin'])

    const validatedData = groupUpdateSchema.parse(updateData)

    let query = this.supabase
      .from('groups')
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
      .from('groups')
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

  async getGroupStats(id: string) {
    const { profile } = await this.checkPermission(['admin', 'superadmin'])

    let groupQuery = this.supabase
      .from('groups')
      .select('max_students, current_enrollment')
      .eq('id', id)
      .eq('deleted_at', null)

    if (profile.role === 'admin') {
      groupQuery = groupQuery.eq('organization_id', profile.organization_id)
    }

    const { data: groupData, error: groupError } = await groupQuery.single()
    if (groupError) throw groupError

    const { count: enrolledCount } = await this.supabase
      .from('student_group_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', id)
      .eq('status', 'enrolled')

    const { count: teacherCount } = await this.supabase
      .from('teacher_group_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', id)
      .eq('status', 'active')

    return {
      maxStudents: groupData.max_students,
      currentEnrollment: enrolledCount || 0,
      availableSpots: groupData.max_students - (enrolledCount || 0),
      teacherCount: teacherCount || 0,
      utilizationRate: ((enrolledCount || 0) / groupData.max_students) * 100
    }
  }

  async getGroupTeachers(id: string) {
    const { profile } = await this.checkPermission(['admin', 'superadmin'])

    let query = this.supabase
      .from('teacher_group_assignments')
      .select(`
        *,
        teachers (
          id,
          first_name,
          last_name,
          full_name,
          email,
          phone,
          specializations
        )
      `)
      .eq('group_id', id)
      .eq('status', 'active')

    if (profile.role === 'admin') {
      query = query.eq('organization_id', profile.organization_id)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async getGroupStudents(id: string) {
    const { profile } = await this.checkPermission(['admin', 'superadmin'])

    let query = this.supabase
      .from('student_group_enrollments')
      .select(`
        *,
        students (
          id,
          first_name,
          last_name,
          full_name,
          email,
          primary_phone,
          enrollment_status,
          payment_status
        )
      `)
      .eq('group_id', id)
      .eq('status', 'enrolled')

    if (profile.role === 'admin') {
      query = query.eq('organization_id', profile.organization_id)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async assignTeacher(groupId: string, teacherId: string, role: 'primary' | 'assistant' = 'primary') {
    const { user, profile } = await this.checkPermission(['admin', 'superadmin'])

    const { data, error } = await this.supabase
      .from('teacher_group_assignments')
      .insert({
        organization_id: profile.organization_id,
        teacher_id: teacherId,
        group_id: groupId,
        role,
        start_date: new Date().toISOString().split('T')[0],
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async enrollStudent(groupId: string, studentId: string, startDate?: string) {
    const { user, profile } = await this.checkPermission(['admin', 'superadmin'])

    const { data, error } = await this.supabase
      .from('student_group_enrollments')
      .insert({
        organization_id: profile.organization_id,
        student_id: studentId,
        group_id: groupId,
        enrollment_date: new Date().toISOString().split('T')[0],
        start_date: startDate || new Date().toISOString().split('T')[0],
        status: 'enrolled',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

const groupService = new GroupService()
export default groupService
export { groupService }