import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'
import { Database } from '@/types/database'
import { uuidSchema, nameSchema, emailSchema, phoneSchema } from '@/lib/validations'

type Organization = Database['public']['Tables']['organizations']['Row']
type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
type OrganizationUpdate = Database['public']['Tables']['organizations']['Update']

export const organizationInsertSchema = z.object({
  name: nameSchema,
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  logo_url: z.string().url().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    postal_code: z.string().optional()
  }).optional(),
  contact_info: z.object({
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
    website: z.string().url().optional()
  }).optional(),
  settings: z.object({
    timezone: z.string().optional(),
    language: z.string().optional(),
    currency: z.string().optional()
  }).optional(),
  subscription_plan: z.enum(['basic', 'pro', 'enterprise']).optional(),
  max_students: z.number().int().positive().optional(),
  max_teachers: z.number().int().positive().optional(),
  max_groups: z.number().int().positive().optional()
})

export const organizationUpdateSchema = organizationInsertSchema.partial()

export class OrganizationService {
  private supabase = createClient()

  async checkPermission(allowedRoles: string[] = ['superadmin']) {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !allowedRoles.includes(profile.role)) {
      throw new Error('Insufficient permissions')
    }

    return { user, profile }
  }

  async create(organizationData: z.infer<typeof organizationInsertSchema>): Promise<Organization> {
    await this.checkPermission(['superadmin'])

    const validatedData = organizationInsertSchema.parse(organizationData)

    const { data, error } = await this.supabase
      .from('organizations')
      .insert({
        ...validatedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getById(id: string): Promise<Organization | null> {
    await this.checkPermission(['superadmin', 'admin'])

    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .eq('deleted_at', null)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async getBySlug(slug: string): Promise<Organization | null> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .eq('deleted_at', null)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async getAll(): Promise<Organization[]> {
    await this.checkPermission(['superadmin'])

    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async update(id: string, updateData: z.infer<typeof organizationUpdateSchema>): Promise<Organization> {
    await this.checkPermission(['superadmin'])

    const validatedData = organizationUpdateSchema.parse(updateData)

    const { data, error } = await this.supabase
      .from('organizations')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('deleted_at', null)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async softDelete(id: string): Promise<void> {
    const { user } = await this.checkPermission(['superadmin'])

    const { error } = await this.supabase
      .from('organizations')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id
      })
      .eq('id', id)
      .eq('deleted_at', null)

    if (error) throw error
  }

  async getUsageStats(id: string) {
    await this.checkPermission(['superadmin', 'admin'])

    const [
      { count: teacherCount },
      { count: studentCount },
      { count: groupCount }
    ] = await Promise.all([
      this.supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', id)
        .eq('deleted_at', null),
      this.supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', id)
        .eq('deleted_at', null),
      this.supabase
        .from('groups')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', id)
        .eq('deleted_at', null)
    ])

    return {
      teachers: teacherCount || 0,
      students: studentCount || 0,
      groups: groupCount || 0
    }
  }
}

export default new OrganizationService()