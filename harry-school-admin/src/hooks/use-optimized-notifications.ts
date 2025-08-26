'use client'

/**
 * Optimized Notifications Hook
 * Fixes memory leaks and over-invalidation issues
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase'
import { NotificationService } from '@/lib/services/notification-service'
import type { 
  NotificationWithRelations,
  NotificationFilters,
  NotificationStats,
  CreateNotificationRequest
} from '@/types/notification'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Initialize notification service once
const notificationService = new NotificationService()

// Query keys factory
const QUERY_KEYS = {
  all: ['notifications'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters: NotificationFilters, page: number) => 
    [...QUERY_KEYS.lists(), { filters, page }] as const,
  unreadCount: () => [...QUERY_KEYS.all, 'unread-count'] as const,
  stats: () => [...QUERY_KEYS.all, 'stats'] as const,
  detail: (id: string) => [...QUERY_KEYS.all, 'detail', id] as const,
} as const

export function useOptimizedNotifications(
  filters: NotificationFilters = {}, 
  page: number = 1, 
  limit: number = 20
) {
  const [hasNewNotifications, setHasNewNotifications] = useState(false)
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const mountedRef = useRef(true)

  // Fetch notifications
  const {
    data: notificationsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.list(filters, page),
    queryFn: async () => {
      return await notificationService.getNotifications(filters, page, limit)
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
    refetchInterval: false, // FIX: Remove constant background requests
  })

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: QUERY_KEYS.unreadCount(),
    queryFn: async () => {
      return await notificationService.getUnreadCount()
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: false, // FIX: No auto-refetch, rely on mutations/realtime
  })

  // Fetch notification stats
  const { data: stats } = useQuery({
    queryKey: QUERY_KEYS.stats(),
    queryFn: async () => {
      return await notificationService.getStats()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  // Mark as read mutation with optimistic update
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.all })
      
      // Snapshot previous values
      const previousNotifications = queryClient.getQueryData(QUERY_KEYS.list(filters, page))
      const previousUnread = queryClient.getQueryData(QUERY_KEYS.unreadCount())
      
      // Optimistically update notifications list
      queryClient.setQueryData(
        QUERY_KEYS.list(filters, page),
        (old: any) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((n: NotificationWithRelations) =>
              n.id === notificationId ? { ...n, is_read: true } : n
            )
          }
        }
      )
      
      // Optimistically update unread count
      queryClient.setQueryData(
        QUERY_KEYS.unreadCount(),
        (old: number) => Math.max(0, old - 1)
      )
      
      return { previousNotifications, previousUnread }
    },
    
    onError: (err, notificationId, context) => {
      // Rollback on error
      if (context) {
        queryClient.setQueryData(QUERY_KEYS.list(filters, page), context.previousNotifications)
        queryClient.setQueryData(QUERY_KEYS.unreadCount(), context.previousUnread)
      }
      toast.error('Failed to mark notification as read')
    },
    
    onSettled: () => {
      // Refetch stats after mutation
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats() })
    }
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.all })
      
      // Optimistically update all notifications to read
      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.lists() },
        (old: any) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((n: NotificationWithRelations) => ({ ...n, is_read: true }))
          }
        }
      )
      
      // Set unread count to 0
      queryClient.setQueryData(QUERY_KEYS.unreadCount(), 0)
    },
    
    onSuccess: (count) => {
      toast.success(`Marked ${count} notifications as read`)
    },
    
    onError: () => {
      // Invalidate all to get fresh data on error
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      toast.error('Failed to mark all notifications as read')
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats() })
    }
  })

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.deleteNotification(notificationId),
    
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.all })
      
      const previousNotifications = queryClient.getQueryData(QUERY_KEYS.list(filters, page))
      
      // Optimistically remove from list
      queryClient.setQueryData(
        QUERY_KEYS.list(filters, page),
        (old: any) => {
          if (!old) return old
          const deletedNotification = old.data.find((n: NotificationWithRelations) => n.id === notificationId)
          const newData = old.data.filter((n: NotificationWithRelations) => n.id !== notificationId)
          
          // Update unread count if deleted notification was unread
          if (deletedNotification && !deletedNotification.is_read) {
            queryClient.setQueryData(
              QUERY_KEYS.unreadCount(),
              (old: number) => Math.max(0, old - 1)
            )
          }
          
          return {
            ...old,
            data: newData,
            count: old.count - 1
          }
        }
      )
      
      return { previousNotifications }
    },
    
    onError: (err, notificationId, context) => {
      if (context) {
        queryClient.setQueryData(QUERY_KEYS.list(filters, page), context.previousNotifications)
      }
      toast.error('Failed to delete notification')
    },
    
    onSuccess: () => {
      toast.success('Notification deleted')
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats() })
    }
  })

  // Real-time subscription with proper cleanup
  useEffect(() => {
    mountedRef.current = true
    const supabase = getSupabaseClient()
    if (!supabase) return

    // Setup subscription
    const setupSubscription = async () => {
      try {
        const channel = supabase
          .channel('notifications_realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications'
            },
            (payload) => {
              if (!mountedRef.current) return
              
              console.log('Notification realtime:', payload.eventType)
              
              switch (payload.eventType) {
                case 'INSERT':
                  setHasNewNotifications(true)
                  
                  // Only invalidate the current list query
                  queryClient.invalidateQueries({ 
                    queryKey: QUERY_KEYS.list(filters, page),
                    exact: true 
                  })
                  
                  // Update counts
                  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount() })
                  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats() })
                  
                  // Show toast for high priority
                  if (payload.new && (payload.new.priority === 'high' || payload.new.priority === 'urgent')) {
                    toast.info(payload.new.title, {
                      description: payload.new.message,
                    })
                  }
                  break

                case 'UPDATE':
                  // Surgical update for specific notification
                  if (payload.new) {
                    queryClient.setQueriesData(
                      { queryKey: QUERY_KEYS.lists() },
                      (old: any) => {
                        if (!old) return old
                        return {
                          ...old,
                          data: old.data.map((n: NotificationWithRelations) =>
                            n.id === payload.new.id ? { ...n, ...payload.new } : n
                          )
                        }
                      }
                    )
                    
                    // Update unread count if read status changed
                    if (payload.old?.is_read !== payload.new?.is_read) {
                      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount() })
                    }
                  }
                  break

                case 'DELETE':
                  // Remove from cache
                  if (payload.old) {
                    queryClient.setQueriesData(
                      { queryKey: QUERY_KEYS.lists() },
                      (old: any) => {
                        if (!old) return old
                        return {
                          ...old,
                          data: old.data.filter((n: NotificationWithRelations) => n.id !== payload.old.id),
                          count: old.count - 1
                        }
                      }
                    )
                    
                    // Update counts
                    if (!payload.old.is_read) {
                      queryClient.setQueryData(
                        QUERY_KEYS.unreadCount(),
                        (old: number) => Math.max(0, old - 1)
                      )
                    }
                    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats() })
                  }
                  break
              }
            }
          )
          .subscribe()

        channelRef.current = channel
      } catch (error) {
        console.error('Failed to setup notifications subscription:', error)
      }
    }

    setupSubscription()

    // Cleanup
    return () => {
      mountedRef.current = false
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, []) // FIX: Remove dependencies to prevent re-subscriptions

  // Actions
  const markAsRead = useCallback((notificationId: string) => {
    markAsReadMutation.mutate(notificationId)
  }, [markAsReadMutation])

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate()
  }, [markAllAsReadMutation])

  const deleteNotification = useCallback((notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId)
  }, [deleteNotificationMutation])

  const refreshNotifications = useCallback(() => {
    // Only refetch what's needed
    queryClient.invalidateQueries({ 
      queryKey: QUERY_KEYS.list(filters, page),
      exact: true 
    })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount() })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats() })
  }, [queryClient, filters, page])

  const clearNewNotificationsFlag = useCallback(() => {
    setHasNewNotifications(false)
  }, [])

  return {
    // Data
    notifications: notificationsData?.data || [],
    hasMore: notificationsData?.hasMore || false,
    totalCount: notificationsData?.count || 0,
    unreadCount,
    stats,
    
    // State
    isLoading,
    hasNewNotifications,
    error,

    // Loading states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,

    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    clearNewNotificationsFlag,
  }
}

// Hook for fetching a single notification
export function useNotificationDetail(notificationId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(notificationId || ''),
    queryFn: () => notificationId ? notificationService.getNotificationById(notificationId) : null,
    enabled: !!notificationId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}