'use client'

import { formatDistanceToNow } from 'date-fns'
import { 
  Bell, 
  User, 
  Users, 
  GraduationCap, 
  DollarSign, 
  Calendar, 
  Award, 
  Clock, 
  AlertTriangle,
  Settings,
  UserPlus,
  MoreHorizontal,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  MessageSquare,
  Reply,
  Trophy,
  TrendingUp,
  MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { NotificationWithRelations, NotificationType } from '@/types/notification'
import { NOTIFICATION_COLORS } from '@/types/notification'

interface NotificationItemProps {
  notification: NotificationWithRelations
  onRead?: (id: string) => void
  onUnread?: (id: string) => void
  onDelete?: (id: string) => void
  onClick?: (notification: NotificationWithRelations) => void
  className?: string
  showActions?: boolean
  compact?: boolean
}

const NOTIFICATION_ICON_MAP: Record<NotificationType, typeof Bell> = {
  system: Settings,
  enrollment: UserPlus,
  payment: DollarSign,
  schedule: Calendar,
  achievement: Award,
  reminder: Clock,
  alert: AlertTriangle,
  feedback_received: MessageSquare,
  feedback_response: Reply,
  feedback_milestone: Trophy,
  feedback_impact: TrendingUp,
  feedback_reminder: MessageCircle
}

export function NotificationItem({
  notification,
  onRead,
  onUnread,
  onDelete,
  onClick,
  className,
  showActions = true,
  compact = false
}: NotificationItemProps) {
  const IconComponent = NOTIFICATION_ICON_MAP[notification.type] || Bell
  const colors = NOTIFICATION_COLORS[notification.priority || 'normal']
  const isUnread = !notification.is_read

  const handleClick = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('[data-dropdown-trigger]')) {
      return // Don't trigger onClick when clicking dropdown
    }
    onClick?.(notification)
    if (isUnread) {
      onRead?.(notification.id)
    }
  }

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRead?.(notification.id)
  }

  const handleMarkAsUnread = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUnread?.(notification.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(notification.id)
  }

  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (notification.action_url) {
      window.open(notification.action_url, '_blank')
    }
  }

  const getRelatedEntityText = () => {
    if (notification.related_student) {
      return `Student: ${notification.related_student.full_name}`
    }
    if (notification.related_teacher) {
      return `Teacher: ${notification.related_teacher.full_name}`
    }
    if (notification.related_group) {
      return `Group: ${notification.related_group.name}`
    }
    return null
  }

  const getFeedbackContextText = () => {
    if (!notification.type.startsWith('feedback_')) return null
    
    const metadata = notification.metadata as any
    if (!metadata) return null

    switch (notification.type) {
      case 'feedback_received':
        return `Category: ${metadata.category || 'General'} • Rating: ${metadata.rating || 'N/A'}/5`
      case 'feedback_milestone':
        return `Milestone: ${metadata.milestone_count || 'N/A'} ${metadata.milestone_type?.replace('_', ' ') || 'achievements'}`
      case 'feedback_impact':
        return `Points earned: +${metadata.points_impact || 0} • Category: ${metadata.category || 'General'}`
      case 'feedback_response':
        return `Response to your feedback`
      case 'feedback_reminder':
        return `Reminder: Share feedback to help our community`
      default:
        return null
    }
  }

  const relatedEntity = getRelatedEntityText()
  const feedbackContext = getFeedbackContextText()

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all hover:shadow-sm',
        isUnread
          ? `${colors.bg} ${colors.border} border-l-4`
          : 'bg-white border-gray-200 hover:bg-gray-50',
        compact && 'p-3',
        className
      )}
    >
      {/* Notification Icon */}
      <div className={cn(
        'flex-shrink-0 p-2 rounded-full',
        isUnread 
          ? `${colors.bg} ${colors.icon}` 
          : 'bg-gray-100 text-gray-500'
      )}>
        <IconComponent className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Title and Priority Badge */}
            <div className="flex items-center gap-2 mb-1">
              <h4 className={cn(
                'font-medium text-sm truncate',
                isUnread ? colors.text : 'text-gray-900'
              )}>
                {notification.title}
              </h4>
              
              {notification.priority && notification.priority !== 'normal' && (
                <Badge 
                  variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {notification.priority}
                </Badge>
              )}
            </div>

            {/* Message */}
            {!compact && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {notification.message}
              </p>
            )}

            {/* Related Entity */}
            {relatedEntity && !compact && (
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                {notification.related_student && <User className="h-3 w-3" />}
                {notification.related_teacher && <GraduationCap className="h-3 w-3" />}
                {notification.related_group && <Users className="h-3 w-3" />}
                {relatedEntity}
              </p>
            )}

            {/* Feedback Context */}
            {feedbackContext && !compact && (
              <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mb-2">
                {feedbackContext}
              </p>
            )}

            {/* Timestamp */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(notification.created_at || ''), { 
                addSuffix: true 
              })}
              {isUnread && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  New
                </Badge>
              )}
            </div>
          </div>

          {/* Actions Dropdown */}
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  data-dropdown-trigger
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isUnread ? (
                  <DropdownMenuItem onClick={handleMarkAsRead}>
                    <Eye className="mr-2 h-4 w-4" />
                    Mark as read
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleMarkAsUnread}>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Mark as unread
                  </DropdownMenuItem>
                )}
                
                {notification.action_url && (
                  <DropdownMenuItem onClick={handleExternalLink}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open link
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Unread Indicator */}
      {isUnread && (
        <div className="absolute right-2 top-2 h-2 w-2 bg-blue-500 rounded-full" />
      )}
    </div>
  )
}