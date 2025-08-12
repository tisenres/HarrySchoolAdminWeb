'use client'

import { useState } from 'react'
import { ChevronDown, CheckCheck, Settings, RefreshCw, Filter, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotificationItem } from './notification-item'
import type { 
  NotificationWithRelations,
  NotificationFilters,
  NotificationType,
  NotificationPriority
} from '@/types/notification'
import { cn } from '@/lib/utils'

interface NotificationDropdownProps {
  notifications: NotificationWithRelations[]
  unreadCount: number
  totalCount: number
  hasMore: boolean
  isLoading: boolean
  filters: NotificationFilters
  onMarkAsRead: (id: string) => void
  onMarkAsUnread: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
  onNotificationClick: (notification: NotificationWithRelations) => void
  onFiltersChange: (filters: Partial<NotificationFilters>) => void
  onRefresh: () => void
  onLoadMore?: () => void
  className?: string
}

// Move these inside the component to access translations

export function NotificationDropdown({
  notifications,
  unreadCount,
  totalCount,
  hasMore,
  isLoading,
  filters,
  onMarkAsRead,
  onMarkAsUnread,
  onMarkAllAsRead,
  onDelete,
  onNotificationClick,
  onFiltersChange,
  onRefresh,
  onLoadMore,
  className
}: NotificationDropdownProps) {
  const t = useTranslations('notifications')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all')
  const [showFilters, setShowFilters] = useState(false)

  const NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
    { value: 'system', label: t('types.system') },
    { value: 'enrollment', label: t('types.enrollment') },
    { value: 'payment', label: t('types.payment') },
    { value: 'schedule', label: 'Schedule' }, // Not in our translations yet
    { value: 'achievement', label: 'Achievement' }, // Not in our translations yet
    { value: 'reminder', label: t('types.reminder') },
    { value: 'alert', label: 'Alert' } // Not in our translations yet
  ]

  const NOTIFICATION_PRIORITIES: { value: NotificationPriority; label: string }[] = [
    { value: 'low', label: t('messages.low') },
    { value: 'normal', label: 'Normal' }, // Need to add to translations
    { value: 'high', label: t('messages.high') },
    { value: 'urgent', label: 'Urgent' } // Need to add to translations
  ]

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread' && notification.is_read) return false
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onFiltersChange({ search: value || undefined })
  }

  const handleTypeFilter = (types: string[]) => {
    onFiltersChange({ 
      type: types.length > 0 ? types as NotificationType[] : undefined 
    })
  }

  const handlePriorityFilter = (priorities: string[]) => {
    onFiltersChange({ 
      priority: priorities.length > 0 ? priorities as NotificationPriority[] : undefined 
    })
  }

  const handleReadStatusFilter = (status: string) => {
    if (status === 'all') {
      onFiltersChange({ is_read: undefined })
    } else {
      onFiltersChange({ is_read: status === 'read' })
    }
  }

  return (
    <div className={cn('bg-white rounded-lg border shadow-lg w-96 max-h-[600px] flex flex-col', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">{t('title')}</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-7 w-7"
            >
              <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="h-7 w-7"
            >
              <Filter className="h-3 w-3" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Settings className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onMarkAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  {t('dropdown.markAllAsRead')} ({unreadCount})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search notifications..." // TODO: Add to translations
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Select onValueChange={handleReadStatusFilter} defaultValue="all">
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.all')}</SelectItem>
                  <SelectItem value="unread">{t('filters.unread')}</SelectItem>
                  <SelectItem value="read">{t('filters.read')}</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => handleTypeFilter(value ? [value] : [])}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {NOTIFICATION_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'unread')} className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="all" className="text-xs">
              {t('filters.all')} ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              {t('filters.unread')} ({unreadCount})
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content */}
        <TabsContent value="all" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-2">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-sm">
                    {isLoading ? t('dropdown.refresh') + '...' : t('empty.noNotifications')}
                  </div>
                  {searchQuery && !isLoading && (
                    <div className="text-xs mt-1">
                      {t('empty.noFilteredNotifications')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={onMarkAsRead}
                      onUnread={onMarkAsUnread}
                      onDelete={onDelete}
                      onClick={onNotificationClick}
                      compact
                    />
                  ))}

                  {/* Load More Button */}
                  {hasMore && !isLoading && (
                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onLoadMore}
                        className="w-full"
                      >
                        {t('dropdown.viewAll')}
                      </Button>
                    </div>
                  )}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="text-center py-4">
                      <RefreshCw className="h-4 w-4 animate-spin mx-auto text-gray-400" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="unread" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-2">
              {filteredNotifications.filter(n => !n.is_read).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-sm">{t('empty.noUnreadNotifications')}</div>
                  <div className="text-xs mt-1">
                    {t('dropdown.allCaughtUp')}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications
                    .filter(notification => !notification.is_read)
                    .map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={onMarkAsRead}
                        onUnread={onMarkAsUnread}
                        onDelete={onDelete}
                        onClick={onNotificationClick}
                        compact
                      />
                    ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      {totalCount > 0 && (
        <>
          <Separator />
          <div className="p-3 text-center">
            <Button variant="ghost" size="sm" className="text-xs">
              {t('dropdown.viewAll')}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}