import { BaseService } from './base-service'
import { getSupabaseClient } from '@/lib/supabase-client'
import type { 
  NotificationWithRelations, 
  CreateNotificationRequest, 
  NotificationFilters,
  NotificationStats,
  NotificationType,
  NotificationPriority 
} from '@/types/notification'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'

export class NotificationService extends BaseService {
  constructor() {
    super('notifications', async () => getSupabaseClient())
  }

  /**
   * Get notifications for the current user with optional filters
   */
  async getNotifications(
    filters: NotificationFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: NotificationWithRelations[]
    count: number
    hasMore: boolean
  }> {
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()

    let query = supabase
      .from('notifications')
      .select(`
        *,
        related_student:related_student_id(id, full_name, student_id),
        related_teacher:related_teacher_id(id, full_name, employee_id),
        related_group:related_group_id(id, name, group_code)
      `)
      .eq('organization_id', organizationId)

    // Apply user-specific filters
    query = query.or(`user_id.eq.${user.id},role_target.cs.{${await this.getCurrentUserRole()}}`)

    // Apply base filters (exclude soft deleted)
    query = this.applyBaseFilters(query)

    // Apply custom filters
    if (filters.type && filters.type.length > 0) {
      query = query.in('type', filters.type)
    }

    if (filters.priority && filters.priority.length > 0) {
      query = query.in('priority', filters.priority)
    }

    if (filters.is_read !== undefined) {
      query = query.eq('is_read', filters.is_read)
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,message.ilike.%${filters.search}%`)
    }

    // Check if notifications are expired
    const now = new Date().toISOString()
    query = query.or(`expires_at.is.null,expires_at.gte.${now}`)

    // Apply sorting and pagination
    query = this.applySorting(query, 'created_at', 'desc')
    
    // Get count first
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .or(`user_id.eq.${user.id},role_target.cs.{${await this.getCurrentUserRole()}}`)

    // Apply pagination
    query = this.applyPagination(query, page, limit)

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`)
    }

    return {
      data: data as NotificationWithRelations[],
      count: count || 0,
      hasMore: (page * limit) < (count || 0)
    }
  }

  /**
   * Get unread notification count for the current user
   */
  async getUnreadCount(): Promise<number> {
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    const userRole = await this.getCurrentUserRole()

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_read', false)
      .or(`user_id.eq.${user.id},role_target.cs.{${userRole}}`)
      .is('deleted_at', null)
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)

    if (error) {
      throw new Error(`Failed to fetch unread count: ${error.message}`)
    }

    return count || 0
  }

  /**
   * Get notification statistics
   */
  async getStats(): Promise<NotificationStats> {
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    const userRole = await this.getCurrentUserRole()

    const { data, error } = await supabase
      .from('notifications')
      .select('type, priority, is_read')
      .eq('organization_id', organizationId)
      .or(`user_id.eq.${user.id},role_target.cs.{${userRole}}`)
      .is('deleted_at', null)
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)

    if (error) {
      throw new Error(`Failed to fetch notification stats: ${error.message}`)
    }

    const stats: NotificationStats = {
      total_count: data.length,
      unread_count: data.filter(n => !n.is_read).length,
      by_type: {} as Record<NotificationType, number>,
      by_priority: {} as Record<NotificationPriority, number>
    }

    // Initialize counters
    const types: NotificationType[] = ['system', 'enrollment', 'payment', 'schedule', 'achievement', 'reminder', 'alert']
    const priorities: NotificationPriority[] = ['low', 'normal', 'high', 'urgent']

    types.forEach(type => stats.by_type[type] = 0)
    priorities.forEach(priority => stats.by_priority[priority] = 0)

    // Count by type and priority
    data.forEach(notification => {
      if (notification.type && types.includes(notification.type as NotificationType)) {
        stats.by_type[notification.type as NotificationType]++
      }
      if (notification.priority && priorities.includes(notification.priority as NotificationPriority)) {
        stats.by_priority[notification.priority as NotificationPriority]++
      }
    })

    return stats
  }

  /**
   * Create a new notification
   */
  async createNotification(request: CreateNotificationRequest): Promise<Tables<'notifications'>> {
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()

    const notificationData: TablesInsert<'notifications'> = {
      organization_id: organizationId,
      type: request.type,
      title: request.title,
      message: request.message,
      priority: request.priority || 'normal',
      action_url: request.action_url,
      user_id: request.user_id,
      role_target: request.role_target,
      related_student_id: request.related_student_id,
      related_teacher_id: request.related_teacher_id,
      related_group_id: request.related_group_id,
      scheduled_for: request.scheduled_for,
      expires_at: request.expires_at,
      metadata: request.metadata || {},
      delivery_method: ['in_app'],
      is_read: false
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`)
    }

    // Log the activity
    await this.logActivity(
      'CREATE',
      data.id,
      data.title,
      null,
      data,
      `Created ${data.type} notification`
    )

    return data
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<Tables<'notifications'>> {
    const user = await this.getCurrentUser()
    const supabase = await this.getSupabase()

    const updateData: TablesUpdate<'notifications'> = {
      is_read: true,
      read_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', notificationId)
      .or(`user_id.eq.${user.id},role_target.cs.{${await this.getCurrentUserRole()}}`)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`)
    }

    return data
  }

  /**
   * Mark notification as unread
   */
  async markAsUnread(notificationId: string): Promise<Tables<'notifications'>> {
    const user = await this.getCurrentUser()
    const supabase = await this.getSupabase()

    const updateData: TablesUpdate<'notifications'> = {
      is_read: false,
      read_at: null,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', notificationId)
      .or(`user_id.eq.${user.id},role_target.cs.{${await this.getCurrentUserRole()}}`)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to mark notification as unread: ${error.message}`)
    }

    return data
  }

  /**
   * Mark all notifications as read for the current user
   */
  async markAllAsRead(): Promise<number> {
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    const userRole = await this.getCurrentUserRole()

    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('is_read', false)
      .or(`user_id.eq.${user.id},role_target.cs.{${userRole}}`)
      .is('deleted_at', null)
      .select('id')

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`)
    }

    return data?.length || 0
  }

  /**
   * Delete a notification (soft delete)
   */
  async deleteNotification(notificationId: string): Promise<Tables<'notifications'>> {
    const user = await this.getCurrentUser()
    const supabase = await this.getSupabase()

    // First get the notification to log it
    const { data: notification } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .or(`user_id.eq.${user.id},role_target.cs.{${await this.getCurrentUserRole()}}`)
      .single()

    const result = await this.softDelete(notificationId)

    if (notification) {
      await this.logActivity(
        'DELETE',
        notificationId,
        notification.title,
        notification,
        null,
        `Deleted ${notification.type} notification`
      )
    }

    return result
  }

  /**
   * Get a single notification by ID
   */
  async getNotificationById(notificationId: string): Promise<NotificationWithRelations | null> {
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        related_student:related_student_id(id, full_name, student_id),
        related_teacher:related_teacher_id(id, full_name, employee_id),
        related_group:related_group_id(id, name, group_code)
      `)
      .eq('id', notificationId)
      .eq('organization_id', organizationId)
      .or(`user_id.eq.${user.id},role_target.cs.{${await this.getCurrentUserRole()}}`)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch notification: ${error.message}`)
    }

    return data as NotificationWithRelations
  }

  /**
   * Create system notification for all admins
   */
  async createSystemNotification(
    title: string, 
    message: string, 
    priority: NotificationPriority = 'normal',
    metadata?: Record<string, any>
  ): Promise<Tables<'notifications'>> {
    return this.createNotification({
      type: 'system',
      title,
      message,
      priority,
      role_target: ['admin', 'superadmin'],
      metadata
    })
  }

  /**
   * Create enrollment notification
   */
  async createEnrollmentNotification(
    title: string,
    message: string,
    studentId: string,
    groupId?: string,
    priority: NotificationPriority = 'normal'
  ): Promise<Tables<'notifications'>> {
    return this.createNotification({
      type: 'enrollment',
      title,
      message,
      priority,
      related_student_id: studentId,
      related_group_id: groupId,
      role_target: ['admin', 'superadmin']
    })
  }

  /**
   * Create payment reminder notification
   */
  async createPaymentNotification(
    title: string,
    message: string,
    studentId: string,
    priority: NotificationPriority = 'high'
  ): Promise<Tables<'notifications'>> {
    return this.createNotification({
      type: 'payment',
      title,
      message,
      priority,
      related_student_id: studentId,
      role_target: ['admin', 'superadmin']
    })
  }
}