/**
 * Mock notification service for testing the notification UI components
 * This provides sample data when the database is not available
 */

import type { 
  NotificationWithRelations, 
  NotificationFilters,
  NotificationStats,
  NotificationType,
  NotificationPriority 
} from '@/types/notification'

// Mock notification data
const MOCK_NOTIFICATIONS: NotificationWithRelations[] = [
  {
    id: '1',
    organization_id: 'test-org',
    type: 'system' as NotificationType,
    title: 'System Update Available',
    message: 'A new system update is available. Please review and install.',
    priority: 'high' as NotificationPriority,
    is_read: false,
    user_id: null,
    role_target: ['admin', 'superadmin'],
    related_student_id: null,
    related_teacher_id: null,
    related_group_id: null,
    action_url: '/settings/system',
    scheduled_for: null,
    expires_at: null,
    metadata: {},
    delivery_method: ['in_app'],
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read_at: null,
    deleted_at: null,
    deleted_by: null
  },
  {
    id: '2',
    organization_id: 'test-org',
    type: 'enrollment' as NotificationType,
    title: 'New Student Enrollment',
    message: 'Sarah Johnson has enrolled in English Advanced Group A.',
    priority: 'normal' as NotificationPriority,
    is_read: false,
    user_id: null,
    role_target: ['admin', 'superadmin'],
    related_student_id: 'student-1',
    related_teacher_id: null,
    related_group_id: 'group-1',
    action_url: '/students',
    scheduled_for: null,
    expires_at: null,
    metadata: {
      student_name: 'Sarah Johnson',
      group_name: 'English Advanced Group A'
    },
    delivery_method: ['in_app'],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read_at: null,
    deleted_at: null,
    deleted_by: null
  },
  {
    id: '3',
    organization_id: 'test-org',
    type: 'payment' as NotificationType,
    title: 'Payment Overdue',
    message: 'Payment for Michael Smith is 5 days overdue. Total amount: $250.',
    priority: 'urgent' as NotificationPriority,
    is_read: true,
    user_id: null,
    role_target: ['admin', 'superadmin'],
    related_student_id: 'student-2',
    related_teacher_id: null,
    related_group_id: null,
    action_url: '/students?search=Michael+Smith',
    scheduled_for: null,
    expires_at: null,
    metadata: {
      student_name: 'Michael Smith',
      amount: 250,
      days_overdue: 5
    },
    delivery_method: ['in_app', 'email'],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    deleted_at: null,
    deleted_by: null
  },
  {
    id: '4',
    organization_id: 'test-org',
    type: 'security' as NotificationType,
    title: 'New Login Detected',
    message: 'A new login was detected from Chrome on Windows. If this wasn\'t you, please secure your account.',
    priority: 'high' as NotificationPriority,
    is_read: false,
    user_id: null,
    role_target: ['admin', 'superadmin'],
    related_student_id: null,
    related_teacher_id: null,
    related_group_id: null,
    action_url: '/settings/security',
    scheduled_for: null,
    expires_at: null,
    metadata: {
      browser: 'Chrome',
      os: 'Windows',
      ip: '192.168.1.100'
    },
    delivery_method: ['in_app', 'email'],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    read_at: null,
    deleted_at: null,
    deleted_by: null
  },
  {
    id: '5',
    organization_id: 'test-org',
    type: 'backup' as NotificationType,
    title: 'Backup Completed Successfully',
    message: 'Daily backup completed successfully. All data has been safely stored.',
    priority: 'low' as NotificationPriority,
    is_read: true,
    user_id: null,
    role_target: ['admin', 'superadmin'],
    related_student_id: null,
    related_teacher_id: null,
    related_group_id: null,
    action_url: '/settings/backup',
    scheduled_for: null,
    expires_at: null,
    metadata: {
      backup_size: '2.4 GB',
      duration: '15 minutes'
    },
    delivery_method: ['in_app'],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    read_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    deleted_at: null,
    deleted_by: null
  }
]

export class MockNotificationService {
  /**
   * Get mock notifications with optional filters
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))

    let filteredData = [...MOCK_NOTIFICATIONS]

    // Apply filters
    if (filters.type && filters.type.length > 0) {
      filteredData = filteredData.filter(n => filters.type!.includes(n.type))
    }

    if (filters.priority && filters.priority.length > 0) {
      filteredData = filteredData.filter(n => filters.priority!.includes(n.priority))
    }

    if (filters.is_read !== undefined) {
      filteredData = filteredData.filter(n => n.is_read === filters.is_read)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredData = filteredData.filter(n => 
        n.title.toLowerCase().includes(searchLower) ||
        n.message.toLowerCase().includes(searchLower)
      )
    }

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedData = filteredData.slice(startIndex, endIndex)

    return {
      data: paginatedData,
      count: filteredData.length,
      hasMore: endIndex < filteredData.length
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return MOCK_NOTIFICATIONS.filter(n => !n.is_read).length
  }

  /**
   * Get notification statistics
   */
  async getStats(): Promise<NotificationStats> {
    await new Promise(resolve => setTimeout(resolve, 150))

    const stats: NotificationStats = {
      total_count: MOCK_NOTIFICATIONS.length,
      unread_count: MOCK_NOTIFICATIONS.filter(n => !n.is_read).length,
      by_type: {} as Record<NotificationType, number>,
      by_priority: {} as Record<NotificationPriority, number>
    }

    // Initialize counters
    const types: NotificationType[] = ['system', 'enrollment', 'payment', 'schedule', 'achievement', 'reminder', 'alert', 'security', 'backup', 'maintenance']
    const priorities: NotificationPriority[] = ['low', 'normal', 'high', 'urgent']

    types.forEach(type => stats.by_type[type] = 0)
    priorities.forEach(priority => stats.by_priority[priority] = 0)

    // Count by type and priority
    MOCK_NOTIFICATIONS.forEach(notification => {
      if (types.includes(notification.type)) {
        stats.by_type[notification.type]++
      }
      if (priorities.includes(notification.priority)) {
        stats.by_priority[notification.priority]++
      }
    })

    return stats
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<NotificationWithRelations> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const notification = MOCK_NOTIFICATIONS.find(n => n.id === notificationId)
    if (!notification) {
      throw new Error('Notification not found')
    }

    notification.is_read = true
    notification.read_at = new Date().toISOString()
    notification.updated_at = new Date().toISOString()

    return notification
  }

  /**
   * Mark notification as unread
   */
  async markAsUnread(notificationId: string): Promise<NotificationWithRelations> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const notification = MOCK_NOTIFICATIONS.find(n => n.id === notificationId)
    if (!notification) {
      throw new Error('Notification not found')
    }

    notification.is_read = false
    notification.read_at = null
    notification.updated_at = new Date().toISOString()

    return notification
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.is_read).length
    const now = new Date().toISOString()

    MOCK_NOTIFICATIONS.forEach(notification => {
      if (!notification.is_read) {
        notification.is_read = true
        notification.read_at = now
        notification.updated_at = now
      }
    })

    return unreadCount
  }

  /**
   * Delete a notification (remove from mock data)
   */
  async deleteNotification(notificationId: string): Promise<NotificationWithRelations> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const index = MOCK_NOTIFICATIONS.findIndex(n => n.id === notificationId)
    if (index === -1) {
      throw new Error('Notification not found')
    }

    const notification = MOCK_NOTIFICATIONS[index]
    MOCK_NOTIFICATIONS.splice(index, 1)

    return notification
  }

  /**
   * Get a single notification by ID
   */
  async getNotificationById(notificationId: string): Promise<NotificationWithRelations | null> {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return MOCK_NOTIFICATIONS.find(n => n.id === notificationId) || null
  }
}

// Export singleton instance
export const mockNotificationService = new MockNotificationService()