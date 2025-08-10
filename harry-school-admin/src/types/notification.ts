import { type Tables } from './database'

export type NotificationRow = Tables<'notifications'>

export type NotificationType = 'system' | 'enrollment' | 'payment' | 'schedule' | 'achievement' | 'reminder' | 'alert'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export type NotificationDeliveryMethod = 'in_app' | 'email' | 'sms'

export interface NotificationWithRelations extends NotificationRow {
  related_student?: {
    id: string
    full_name: string
    student_id: string | null
  }
  related_teacher?: {
    id: string
    full_name: string
    employee_id: string | null
  }
  related_group?: {
    id: string
    name: string
    group_code: string | null
  }
}

export interface NotificationPreferences {
  email_notifications: boolean
  system_notifications: boolean
  student_updates: boolean
  payment_reminders: boolean
  enrollment_alerts: boolean
  schedule_changes: boolean
}

export interface CreateNotificationRequest {
  type: NotificationType
  title: string
  message: string
  priority?: NotificationPriority
  action_url?: string
  user_id?: string
  role_target?: string[]
  related_student_id?: string
  related_teacher_id?: string
  related_group_id?: string
  scheduled_for?: string
  expires_at?: string
  metadata?: Record<string, any>
}

export interface NotificationFilters {
  type?: NotificationType[]
  priority?: NotificationPriority[]
  is_read?: boolean
  date_from?: string
  date_to?: string
  search?: string
}

export interface NotificationStats {
  total_count: number
  unread_count: number
  by_type: Record<NotificationType, number>
  by_priority: Record<NotificationPriority, number>
}

export interface NotificationUIState {
  isOpen: boolean
  selectedNotification?: NotificationWithRelations | null
  filters: NotificationFilters
  isLoading: boolean
  hasNewNotifications: boolean
}

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  system: 'Settings',
  enrollment: 'UserPlus',
  payment: 'DollarSign',
  schedule: 'Calendar',
  achievement: 'Award',
  reminder: 'Clock',
  alert: 'AlertTriangle'
}

export const NOTIFICATION_COLORS: Record<NotificationPriority, {
  bg: string
  border: string
  text: string
  icon: string
}> = {
  low: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-500'
  },
  normal: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-800',
    icon: 'text-gray-500'
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    icon: 'text-orange-500'
  },
  urgent: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'text-red-500'
  }
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email_notifications: true,
  system_notifications: true,
  student_updates: true,
  payment_reminders: true,
  enrollment_alerts: true,
  schedule_changes: true
}