import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { Database } from '@/types/database'
import { uuidSchema, nameSchema, emailSchema, phoneSchema } from '@/lib/validations'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export const profileInsertSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  email: emailSchema,
  full_name: nameSchema,
  avatar_url: z.string().url().optional(),
  phone: phoneSchema.optional(),
  role: z.enum(['superadmin', 'admin']),
  language_preference: z.string().optional(),
  timezone: z.string().optional(),
  notification_preferences: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean()
  }).optional()
})

export const profileUpdateSchema = profileInsertSchema.partial().omit({ id: true })

export class ProfileService {
  private supabase = createClient()

  async checkPermission(allowedRoles: string[] = ['superadmin', 'admin']) {
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

  async getUserOrganization(): Promise<string | null> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    return profile?.organization_id || null
  }

  async create(profileData: z.infer<typeof profileInsertSchema>): Promise<Profile> {
    await this.checkPermission(['superadmin'])

    const validatedData = profileInsertSchema.parse(profileData)

    const { data, error } = await this.supabase
      .from('profiles')
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

  async getById(id: string): Promise<Profile | null> {
    const { profile: currentProfile } = await this.checkPermission(['superadmin', 'admin'])

    let query = this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('deleted_at', null)

    // Admins can only see profiles from their organization
    if (currentProfile.role === 'admin') {
      query = query.eq('organization_id', currentProfile.organization_id)
    }

    const { data, error } = await query.single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .eq('deleted_at', null)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async getByOrganization(organizationId?: string): Promise<Profile[]> {
    const { profile: currentProfile } = await this.checkPermission(['superadmin', 'admin'])

    let query = this.supabase
      .from('profiles')
      .select('*')
      .eq('deleted_at', null)
      .order('created_at', { ascending: false })

    // Determine which organization to query
    let targetOrganization = organizationId
    if (currentProfile.role === 'admin') {
      // Admins can only see profiles from their own organization
      targetOrganization = currentProfile.organization_id
    } else if (!organizationId) {
      // If no organization specified and user is superadmin, return all
      const { data, error } = await query
      if (error) throw error
      return data || []
    }

    if (targetOrganization) {
      query = query.eq('organization_id', targetOrganization)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async update(id: string, updateData: z.infer<typeof profileUpdateSchema>): Promise<Profile> {
    const { profile: currentProfile } = await this.checkPermission(['superadmin', 'admin'])

    // Users can update their own profile, admins can update profiles in their org
    if (currentProfile.role === 'admin' && id !== currentProfile.id) {
      // Check if target profile is in same organization
      const targetProfile = await this.getById(id)
      if (!targetProfile || targetProfile.organization_id !== currentProfile.organization_id) {
        throw new Error('Cannot update profile from different organization')
      }
    }

    const validatedData = profileUpdateSchema.parse(updateData)

    const { data, error } = await this.supabase
      .from('profiles')
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

  async updateLastLogin(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .update({
        last_login_at: new Date().toISOString(),
        login_count: this.supabase.rpc('increment_login_count', { profile_id: id })
      })
      .eq('id', id)

    if (error) throw error
  }

  async softDelete(id: string): Promise<void> {
    const { user, profile: currentProfile } = await this.checkPermission(['superadmin'])

    // Prevent self-deletion
    if (id === user.id) {
      throw new Error('Cannot delete your own profile')
    }

    const { error } = await this.supabase
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id
      })
      .eq('id', id)
      .eq('deleted_at', null)

    if (error) throw error
  }

  async searchProfiles(query: string, organizationId?: string): Promise<Profile[]> {
    const { profile: currentProfile } = await this.checkPermission(['superadmin', 'admin'])

    let searchQuery = this.supabase
      .from('profiles')
      .select('*')
      .eq('deleted_at', null)
      .ilike('full_name', `%${query}%`)
      .order('full_name')

    // Apply organization filter
    let targetOrganization = organizationId
    if (currentProfile.role === 'admin') {
      targetOrganization = currentProfile.organization_id
    }

    if (targetOrganization) {
      searchQuery = searchQuery.eq('organization_id', targetOrganization)
    }

    const { data, error } = await searchQuery
    if (error) throw error
    return data || []
  }
}

export default new ProfileService()