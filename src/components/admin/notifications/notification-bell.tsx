'use client'

import { useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { NotificationDropdown } from './notification-dropdown'
import { NotificationModal } from './notification-modal'
import { useNotifications } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className }: NotificationBellProps) {
  const t = useTranslations('notifications')
  const {
    // Data
    notifications,
    unreadCount,
    totalCount,
    hasMore,
    
    // UI State
    isOpen,
    selectedNotification,
    isLoading,
    hasNewNotifications,
    filters,
    
    // Actions
    toggleDropdown,
    closeDropdown,
    openNotification,
    closeNotification,
    updateFilters,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    playNotificationSound
  } = useNotifications()

  const bellRef = useRef<HTMLButtonElement>(null)
  const prevUnreadCount = useRef(unreadCount)

  // Play sound when new notifications arrive
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current && prevUnreadCount.current > 0) {
      playNotificationSound()
    }
    prevUnreadCount.current = unreadCount
  }, [unreadCount, playNotificationSound])

  // Animate bell when there are new notifications
  const shouldPulse = hasNewNotifications || unreadCount > 0

  const handleBellClick = () => {
    toggleDropdown()
  }

  const handleNotificationClick = (notification: any) => {
    closeDropdown()
    openNotification(notification)
  }

  return (
    <>
      <Popover open={isOpen} onOpenChange={(open) => !open && closeDropdown()}>
        <PopoverTrigger asChild>
          <Button
            ref={bellRef}
            variant="ghost"
            size="icon"
            onClick={handleBellClick}
            className={cn(
              'relative',
              shouldPulse && 'animate-pulse',
              className
            )}
            aria-label={`${t('bell.label')} ${unreadCount > 0 ? `(${unreadCount} ${t('status.unread')})` : ''}`}
          >
            <Bell 
              className={cn(
                'h-4 w-4 transition-colors',
                unreadCount > 0 ? 'text-blue-600' : 'text-gray-600',
                hasNewNotifications && 'animate-bounce'
              )} 
            />
            
            {/* Unread Count Badge */}
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className={cn(
                  'absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs font-medium',
                  'animate-in zoom-in-50 duration-200',
                  hasNewNotifications && 'animate-pulse'
                )}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}

            {/* New notifications indicator dot */}
            {hasNewNotifications && (
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full animate-ping" />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent 
          align="end" 
          className="w-96 p-0 shadow-lg border-0"
          sideOffset={5}
        >
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            totalCount={totalCount}
            hasMore={hasMore}
            isLoading={isLoading}
            filters={filters}
            onMarkAsRead={markAsRead}
            onMarkAsUnread={markAsUnread}
            onMarkAllAsRead={markAllAsRead}
            onDelete={deleteNotification}
            onNotificationClick={handleNotificationClick}
            onFiltersChange={updateFilters}
            onRefresh={refreshNotifications}
          />
        </PopoverContent>
      </Popover>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <NotificationModal
          notification={selectedNotification}
          isOpen={!!selectedNotification}
          onClose={closeNotification}
          onMarkAsRead={markAsRead}
          onMarkAsUnread={markAsUnread}
          onDelete={deleteNotification}
        />
      )}
    </>
  )
}