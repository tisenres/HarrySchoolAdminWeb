import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'
import { Database } from '@/types/database'
import { uuidSchema } from '@/lib/validations'

type Notification = Database['public']['Tables']['notifications']['Row']
type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

export const notificationInsertSchema = z.object({
  organization_id: uuidSchema,
  user_id: uuidSchema.optional(),
  role_target: z.array(z.enum(['admin', 'superadmin'])).optional(),
  type: z.enum(['info', 'warning', 'error', 'success', 'system', 'user_action', 'data_change']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  action_url: z.string().url().optional(),
  related_student_id: uuidSchema.optional(),
  related_teacher_id: uuidSchema.optional(),
  related_group_id: uuidSchema.optional(),
  delivery_method: z.array(z.enum(['in_app', 'email', 'push', 'sms'])).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  scheduled_for: z.string().datetime().optional(),
  expires_at: z.string().datetime().optional(),
  metadata: z.object({}).passthrough().optional()
})

export class NotificationService {
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

  async create(notificationData: z.infer<typeof notificationInsertSchema>): Promise<Notification> {
    const validatedData = notificationInsertSchema.parse(notificationData)

    const { data, error } = await this.supabase
      .from('notifications')
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

  async getByUser(
    userId?: string,
    options: {
      page?: number
      limit?: number
      unreadOnly?: boolean
      type?: string
      priority?: string
    } = {}
  ): Promise<{ data: Notification[], count: number }> {
    const { profile } = await this.checkPermission(['admin', 'superadmin'])

    const { page = 1, limit = 20, unreadOnly = false, type, priority } = options

    let query = this.supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('organization_id', profile.organization_id)
      .eq('deleted_at', null)

    // Filter by user or role
    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      // Show notifications for current user or their role
      query = query.or(`user_id.eq.${profile.id},role_target.cs.{${profile.role}}`)
    }

    // Apply filters
    if (unreadOnly) {
      query = query.eq('is_read', false)
    }
    if (type) {
      query = query.eq('type', type)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Order by priority and created_at
    query = query.order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) throw error
    return { data: data || [], count: count || 0 }
  }

  async markAsRead(id: string): Promise<void> {
    const { user, profile } = await this.checkPermission(['admin', 'superadmin'])

    const { error } = await this.supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .or(`user_id.eq.${user.id},role_target.cs.{${profile.role}}`)

    if (error) throw error
  }

  async markAllAsRead(userId?: string): Promise<void> {
    const { user, profile } = await this.checkPermission(['admin', 'superadmin'])

    let query = this.supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', profile.organization_id)
      .eq('is_read', false)

    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      query = query.or(`user_id.eq.${user.id},role_target.cs.{${profile.role}}`)
    }

    const { error } = await query

    if (error) throw error
  }

  async delete(id: string): Promise<void> {
    const { user, profile } = await this.checkPermission(['admin', 'superadmin'])

    const { error } = await this.supabase
      .from('notifications')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id
      })
      .eq('id', id)
      .eq('organization_id', profile.organization_id)

    if (error) throw error
  }

  // Helper method to create system notifications
  async createSystemNotification(
    organizationId: string,
    type: 'user_action' | 'data_change' | 'system',
    title: string,
    message: string,
    options: {
      userId?: string
      roleTarget?: ('admin' | 'superadmin')[]
      actionUrl?: string
      relatedStudentId?: string
      relatedTeacherId?: string
      relatedGroupId?: string
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      metadata?: Record<string, any>
    } = {}
  ): Promise<Notification> {
    return this.create({
      organization_id: organizationId,
      user_id: options.userId,
      role_target: options.roleTarget,
      type,
      title,
      message,
      action_url: options.actionUrl,
      related_student_id: options.relatedStudentId,
      related_teacher_id: options.relatedTeacherId,
      related_group_id: options.relatedGroupId,
      priority: options.priority || 'medium',
      delivery_method: ['in_app'],
      metadata: options.metadata
    })
  }

  // Helper method to log user actions
  async logUserAction(
    action: string,
    entity: string,
    entityId: string,
    details?: Record<string, any>
  ): Promise<void> {
    const { user, profile } = await this.checkPermission(['admin', 'superadmin'])

    const title = `${action} ${entity}`
    const message = `${profile.full_name || user.email} ${action.toLowerCase()} a ${entity.toLowerCase()}`

    await this.createSystemNotification(
      profile.organization_id,
      'user_action',
      title,
      message,
      {
        userId: user.id,
        priority: 'low',
        metadata: {
          action,
          entity,
          entity_id: entityId,
          user_id: user.id,
          user_email: user.email,
          timestamp: new Date().toISOString(),
          ...details
        }
      }
    )
  }

  // Helper method to log data changes
  async logDataChange(
    entity: string,
    entityId: string,
    changeType: 'created' | 'updated' | 'deleted',
    changes?: Record<string, { old: any, new: any }>
  ): Promise<void> {
    const { user, profile } = await this.checkPermission(['admin', 'superadmin'])

    const title = `${entity} ${changeType}`
    const message = `${entity} was ${changeType} by ${profile.full_name || user.email}`

    await this.createSystemNotification(
      profile.organization_id,
      'data_change',
      title,
      message,
      {
        priority: 'low',
        metadata: {
          entity,
          entity_id: entityId,
          change_type: changeType,
          changes,
          user_id: user.id,
          user_email: user.email,
          timestamp: new Date().toISOString()
        }
      }
    )
  }

  async getUnreadCount(userId?: string): Promise<number> {
    const { user, profile } = await this.checkPermission(['admin', 'superadmin'])

    let query = this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)
      .eq('is_read', false)
      .eq('deleted_at', null)

    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      query = query.or(`user_id.eq.${user.id},role_target.cs.{${profile.role}}`)
    }

    const { count, error } = await query

    if (error) throw error
    return count || 0
  }
}

export default new NotificationService()