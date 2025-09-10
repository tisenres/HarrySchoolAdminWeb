import { getApiClient, getCurrentUser, getCurrentProfile } from '@/lib/supabase-unified'
import { z } from 'zod'
import organizationService from './organization-service'
import profileService from './profile-service'

const systemSettingsSchema = z.object({
  maintenance_mode: z.boolean().optional(),
  maintenance_message: z.string().optional(),
  backup_schedule: z.object({
    enabled: z.boolean(),
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  }).optional(),
  notification_settings: z.object({
    email_enabled: z.boolean(),
    push_enabled: z.boolean(),
    sms_enabled: z.boolean(),
    admin_notifications: z.boolean()
  }).optional(),
  security_settings: z.object({
    password_policy: z.object({
      min_length: z.number().min(6).max(32),
      require_uppercase: z.boolean(),
      require_lowercase: z.boolean(),
      require_numbers: z.boolean(),
      require_symbols: z.boolean()
    }).optional(),
    session_timeout: z.number().min(15).max(1440), // minutes
    max_login_attempts: z.number().min(3).max(10)
  }).optional(),
  feature_flags: z.object({}).passthrough().optional()
})

const organizationSettingsSchema = z.object({
  timezone: z.string(),
  language: z.enum(['en', 'ru', 'uz']),
  currency: z.string(),
  date_format: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).optional(),
  time_format: z.enum(['12', '24']).optional(),
  academic_year: z.object({
    start_month: z.number().min(1).max(12),
    end_month: z.number().min(1).max(12)
  }).optional(),
  enrollment_settings: z.object({
    allow_online_enrollment: z.boolean(),
    require_parent_approval: z.boolean(),
    auto_assign_student_ids: z.boolean(),
    student_id_prefix: z.string().optional()
  }).optional(),
  payment_settings: z.object({
    default_currency: z.string(),
    payment_reminder_days: z.array(z.number()),
    late_fee_amount: z.number().optional(),
    late_fee_currency: z.string().optional()
  }).optional(),
  branding: z.object({
    logo_url: z.string().url().optional(),
    primary_color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    secondary_color: z.string().regex(/^#[0-9A-F]{6}$/i).optional()
  }).optional()
})

export class SettingsService {
  private async getSupabase() {
    return await getApiClient()
  }

  async checkPermission(allowedRoles: string[] = ['admin', 'superadmin']) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const profile = await getCurrentProfile()
    if (!profile || !allowedRoles.includes(profile.role)) {
      throw new Error('Insufficient permissions')
    }

    return { user, profile }
  }

  // System-wide settings (superadmin only)
  async getSystemSettings() {
    await this.checkPermission(['superadmin'])

    // For now, return default system settings
    // In a real implementation, these would be stored in a system_settings table
    return {
      maintenance_mode: false,
      maintenance_message: '',
      backup_schedule: {
        enabled: true,
        frequency: 'daily' as const,
        time: '02:00'
      },
      notification_settings: {
        email_enabled: true,
        push_enabled: true,
        sms_enabled: false,
        admin_notifications: true
      },
      security_settings: {
        password_policy: {
          min_length: 8,
          require_uppercase: true,
          require_lowercase: true,
          require_numbers: true,
          require_symbols: false
        },
        session_timeout: 480, // 8 hours
        max_login_attempts: 5
      },
      feature_flags: {
        advanced_reporting: true,
        bulk_operations: true,
        api_access: false
      }
    }
  }

  async updateSystemSettings(settings: z.infer<typeof systemSettingsSchema>) {
    await this.checkPermission(['superadmin'])

    const validatedData = systemSettingsSchema.parse(settings)

    // In a real implementation, these would be stored in a system_settings table
    // For now, we'll just validate and return the settings
    return validatedData
  }

  // Organization settings
  async getOrganizationSettings(organizationId?: string) {
    const { profile } = await this.checkPermission(['admin', 'superadmin'])

    const targetOrganization = profile.role === 'admin' ? profile.organization_id : organizationId

    if (!targetOrganization) {
      throw new Error('Organization ID required')
    }

    const organization = await organizationService.getByIdInternal(targetOrganization)
    if (!organization) {
      throw new Error('Organization not found')
    }

    // Merge organization settings with defaults
    const defaultSettings = {
      timezone: 'Asia/Tashkent',
      language: 'en' as const,
      currency: 'UZS',
      date_format: 'DD/MM/YYYY' as const,
      time_format: '24' as const,
      academic_year: {
        start_month: 9,
        end_month: 6
      },
      enrollment_settings: {
        allow_online_enrollment: false,
        require_parent_approval: true,
        auto_assign_student_ids: true,
        student_id_prefix: 'STU'
      },
      payment_settings: {
        default_currency: 'UZS',
        payment_reminder_days: [7, 3, 1],
        late_fee_amount: 50000,
        late_fee_currency: 'UZS'
      },
      branding: {
        logo_url: organization.logo_url,
        primary_color: '#1d7452',
        secondary_color: '#059669'
      }
    }

    return {
      ...defaultSettings,
      ...organization.settings
    }
  }

  async updateOrganizationSettings(
    settings: z.infer<typeof organizationSettingsSchema>,
    organizationId?: string
  ) {
    const { profile } = await this.checkPermission(['admin', 'superadmin'])

    const targetOrganization = profile.role === 'admin' ? profile.organization_id : organizationId

    if (!targetOrganization) {
      throw new Error('Organization ID required')
    }

    const validatedData = organizationSettingsSchema.parse(settings)

    // Update organization settings
    const updatedOrganization = await organizationService.update(targetOrganization, {
      settings: validatedData
    })

    return updatedOrganization.settings
  }

  // User preferences
  async getUserPreferences(userId?: string) {
    const { user, profile } = await this.checkPermission(['admin', 'superadmin'])

    const targetUser = userId || user.id

    // Users can only access their own preferences unless they're superadmin
    if (profile.role !== 'superadmin' && targetUser !== user.id) {
      throw new Error('Cannot access other user preferences')
    }

    const userProfile = await profileService.getById(targetUser)
    if (!userProfile) {
      throw new Error('User not found')
    }

    return {
      language_preference: userProfile.language_preference || 'en',
      timezone: userProfile.timezone || 'Asia/Tashkent',
      notification_preferences: userProfile.notification_preferences || {
        email: true,
        push: true,
        sms: false
      }
    }
  }

  async updateUserPreferences(
    preferences: {
      language_preference?: string
      timezone?: string
      notification_preferences?: {
        email: boolean
        push: boolean
        sms: boolean
      }
    },
    userId?: string
  ) {
    const { user, profile } = await this.checkPermission(['admin', 'superadmin'])

    const targetUser = userId || user.id

    // Users can only update their own preferences unless they're superadmin
    if (profile.role !== 'superadmin' && targetUser !== user.id) {
      throw new Error('Cannot update other user preferences')
    }

    const updatedProfile = await profileService.update(targetUser, preferences)

    return {
      language_preference: updatedProfile.language_preference,
      timezone: updatedProfile.timezone,
      notification_preferences: updatedProfile.notification_preferences
    }
  }

  // Archive management
  async getArchivedRecords(
    entity: 'teachers' | 'students' | 'groups' | 'profiles',
    options: {
      page?: number
      limit?: number
      organizationId?: string
    } = {}
  ) {
    const { profile } = await this.checkPermission(['admin', 'superadmin'])

    const { page = 1, limit = 20, organizationId } = options
    const targetOrganization = profile.role === 'admin' ? profile.organization_id : organizationId

    let query = this.supabase
      .from(entity)
      .select('*', { count: 'exact' })
      .not('deleted_at', 'is', null)

    if (targetOrganization) {
      query = query.eq('organization_id', targetOrganization)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Order by deleted_at
    query = query.order('deleted_at', { ascending: false })

    const { data, error, count } = await query

    if (error) throw error
    return { data: data || [], count: count || 0 }
  }

  async restoreArchivedRecord(
    entity: 'teachers' | 'students' | 'groups' | 'profiles',
    recordId: string
  ) {
    const { user, profile } = await this.checkPermission(['admin', 'superadmin'])

    let query = this.supabase
      .from(entity)
      .update({
        deleted_at: null,
        deleted_by: null,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', recordId)
      .not('deleted_at', 'is', null)

    if (profile.role === 'admin') {
      query = query.eq('organization_id', profile.organization_id)
    }

    const { data, error } = await query.select().single()

    if (error) throw error
    return data
  }

  async permanentlyDeleteRecord(
    entity: 'teachers' | 'students' | 'groups' | 'profiles',
    recordId: string
  ) {
    await this.checkPermission(['superadmin']) // Only superadmin can permanently delete

    const { error } = await this.supabase
      .from(entity)
      .delete()
      .eq('id', recordId)
      .not('deleted_at', 'is', null)

    if (error) throw error
  }
}

export default new SettingsService()