'use client'

import { formatDistanceToNow, format } from 'date-fns'
import { 
  X, 
  Clock, 
  User, 
  Users, 
  GraduationCap, 
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  Calendar,
  Tag,
  AlertTriangle
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { NotificationWithRelations } from '@/types/notification'
import { NOTIFICATION_COLORS, NOTIFICATION_ICONS } from '@/types/notification'
import { useNotification } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'

interface NotificationModalProps {
  notification: NotificationWithRelations
  isOpen: boolean
  onClose: () => void
  onMarkAsRead: (id: string) => void
  onMarkAsUnread: (id: string) => void
  onDelete: (id: string) => void
}

export function NotificationModal({
  notification: initialNotification,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete
}: NotificationModalProps) {
  // Fetch fresh notification data if we only have an ID
  const { data: freshNotification } = useNotification(
    typeof initialNotification.id === 'string' && !initialNotification.title 
      ? initialNotification.id 
      : null
  )

  const notification = freshNotification || initialNotification
  
  if (!notification) return null

  const colors = NOTIFICATION_COLORS[notification.priority || 'normal']
  const isUnread = !notification.is_read

  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id)
  }

  const handleMarkAsUnread = () => {
    onMarkAsUnread(notification.id)
  }

  const handleDelete = () => {
    onDelete(notification.id)
    onClose()
  }

  const handleExternalLink = () => {
    if (notification.action_url) {
      window.open(notification.action_url, '_blank')
    }
  }

  const getRelatedEntityDetails = () => {
    if (notification.related_student) {
      return {
        icon: User,
        label: 'Student',
        name: notification.related_student.full_name,
        id: notification.related_student.student_id || notification.related_student.id
      }
    }
    if (notification.related_teacher) {
      return {
        icon: GraduationCap,
        label: 'Teacher',
        name: notification.related_teacher.full_name,
        id: notification.related_teacher.employee_id || notification.related_teacher.id
      }
    }
    if (notification.related_group) {
      return {
        icon: Users,
        label: 'Group',
        name: notification.related_group.name,
        id: notification.related_group.group_code || notification.related_group.id
      }
    }
    return null
  }

  const relatedEntity = getRelatedEntityDetails()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  'p-2 rounded-full',
                  colors.bg,
                  colors.icon
                )}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <DialogTitle className={cn(
                      'text-lg font-semibold',
                      isUnread ? colors.text : 'text-gray-900'
                    )}>
                      {notification.title}
                    </DialogTitle>
                    
                    {notification.priority && notification.priority !== 'normal' && (
                      <Badge 
                        variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'}
                      >
                        {notification.priority}
                      </Badge>
                    )}
                    
                    {isUnread && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        Unread
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      <span className="capitalize">{notification.type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(notification.created_at || ''), { 
                        addSuffix: true 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-4">
              {isUnread ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAsRead}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Mark as Read
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAsUnread}
                >
                  <EyeOff className="mr-2 h-4 w-4" />
                  Mark as Unread
                </Button>
              )}

              {notification.action_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExternalLink}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Link
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Message Content */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Message</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {notification.message}
                </p>
              </div>
            </div>

            {/* Related Entity */}
            {relatedEntity && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Related {relatedEntity.label}</h3>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <relatedEntity.icon className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">{relatedEntity.name}</p>
                    <p className="text-sm text-gray-600">ID: {relatedEntity.id}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata */}
            {notification.metadata && Object.keys(notification.metadata).length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Additional Details</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(notification.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Delivery Information */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Delivery Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Created:</span>
                  <p className="font-medium">
                    {format(new Date(notification.created_at || ''), 'PPp')}
                  </p>
                </div>
                
                {notification.read_at && (
                  <div>
                    <span className="text-gray-600">Read:</span>
                    <p className="font-medium">
                      {format(new Date(notification.read_at), 'PPp')}
                    </p>
                  </div>
                )}
                
                {notification.scheduled_for && (
                  <div>
                    <span className="text-gray-600">Scheduled:</span>
                    <p className="font-medium">
                      {format(new Date(notification.scheduled_for), 'PPp')}
                    </p>
                  </div>
                )}
                
                {notification.expires_at && (
                  <div>
                    <span className="text-gray-600">Expires:</span>
                    <p className="font-medium">
                      {format(new Date(notification.expires_at), 'PPp')}
                    </p>
                  </div>
                )}
                
                <div>
                  <span className="text-gray-600">Delivery Method:</span>
                  <p className="font-medium capitalize">
                    {notification.delivery_method?.join(', ') || 'In-app'}
                  </p>
                </div>
                
                <div>
                  <span className="text-gray-600">Priority:</span>
                  <Badge 
                    variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'}
                    className="ml-2"
                  >
                    {notification.priority || 'normal'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Target Information */}
            {notification.role_target && notification.role_target.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Target Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {notification.role_target.map((role, index) => (
                    <Badge key={index} variant="outline" className="capitalize">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}