'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase'
import { NotificationService } from '@/lib/services/notification-service'
import type { 
  NotificationWithRelations,
  NotificationFilters,
  NotificationStats,
  NotificationUIState,
  CreateNotificationRequest
} from '@/types/notification'

// Initialize notification service
const notificationService = new NotificationService()

// Query keys
const QUERY_KEYS = {
  notifications: (filters: NotificationFilters, page: number) => ['notifications', filters, page],
  unreadCount: ['notifications', 'unread-count'],
  stats: ['notifications', 'stats'],
  notification: (id: string) => ['notifications', id]
} as const

export function useNotifications(filters: NotificationFilters = {}, page: number = 1, limit: number = 20) {
  const [uiState, setUIState] = useState<NotificationUIState>({
    isOpen: false,
    selectedNotification: null,
    filters,
    isLoading: false,
    hasNewNotifications: false
  })

  const queryClient = useQueryClient()
  const subscriptionRef = useRef<any>(null)

  // Fetch notifications with fallback to mock service
  const {
    data: notificationsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.notifications(filters, page),
    queryFn: async () => {
      return await notificationService.getNotifications(filters, page, limit)
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false
  })

  // Fetch unread count with fallback to mock service
  const {
    data: unreadCount = 0,
    refetch: refetchUnreadCount
  } = useQuery({
    queryKey: QUERY_KEYS.unreadCount,
    queryFn: async () => {
      return await notificationService.getUnreadCount()
    },
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: true
  })

  // Fetch notification stats with fallback to mock service
  const {
    data: stats,
    refetch: refetchStats
  } = useQuery({
    queryKey: QUERY_KEYS.stats,
    queryFn: async () => {
      return await notificationService.getStats()
    },
    staleTime: 60000 // 1 minute
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      refetchStats()
    },
    onError: (error: any) => {
      toast.error('Failed to mark notification as read', {
        description: error.message
      })
    }
  })

  // Mark as unread mutation
  const markAsUnreadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsUnread(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      refetchStats()
    },
    onError: (error: any) => {
      toast.error('Failed to mark notification as unread', {
        description: error.message
      })
    }
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      refetchStats()
      toast.success(`Marked ${count} notifications as read`)
    },
    onError: (error: any) => {
      toast.error('Failed to mark all notifications as read', {
        description: error.message
      })
    }
  })

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      refetchStats()
      toast.success('Notification deleted')
    },
    onError: (error: any) => {
      toast.error('Failed to delete notification', {
        description: error.message
      })
    }
  })

  // Create notification mutation
  const createNotificationMutation = useMutation({
    mutationFn: (request: CreateNotificationRequest) => notificationService.createNotification(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      refetchUnreadCount()
      refetchStats()
      toast.success('Notification created')
    },
    onError: (error: any) => {
      toast.error('Failed to create notification', {
        description: error.message
      })
    }
  })

  // Real-time subscription setup
  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    // Set up real-time subscription for notifications
    subscriptionRef.current = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('Notification real-time update:', payload)

          // Handle different types of events
          switch (payload.eventType) {
            case 'INSERT':
              // New notification received
              setUIState(prev => ({ ...prev, hasNewNotifications: true }))
              queryClient.invalidateQueries({ queryKey: ['notifications'] })
              refetchUnreadCount()
              refetchStats()
              
              // Show toast for new high priority notifications
              if (payload.new && payload.new.priority === 'high' || payload.new.priority === 'urgent') {
                toast.info(payload.new.title, {
                  description: payload.new.message,
                  action: {
                    label: 'View',
                    onClick: () => openNotification(payload.new.id)
                  }
                })
              }
              break

            case 'UPDATE':
              // Notification updated (e.g., marked as read)
              queryClient.invalidateQueries({ queryKey: ['notifications'] })
              if (payload.old?.is_read !== payload.new?.is_read) {
                refetchUnreadCount()
              }
              break

            case 'DELETE':
              // Notification deleted
              queryClient.invalidateQueries({ queryKey: ['notifications'] })
              refetchUnreadCount()
              refetchStats()
              break
          }
        }
      )
      .subscribe()

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [queryClient, refetchUnreadCount, refetchStats])

  // UI state management functions
  const openDropdown = useCallback(() => {
    setUIState(prev => ({ 
      ...prev, 
      isOpen: true, 
      hasNewNotifications: false 
    }))
  }, [])

  const closeDropdown = useCallback(() => {
    setUIState(prev => ({ ...prev, isOpen: false }))
  }, [])

  const toggleDropdown = useCallback(() => {
    setUIState(prev => ({ 
      ...prev, 
      isOpen: !prev.isOpen,
      hasNewNotifications: prev.isOpen ? prev.hasNewNotifications : false
    }))
  }, [])

  const openNotification = useCallback((notification: NotificationWithRelations | string) => {
    if (typeof notification === 'string') {
      // If ID is provided, we'll fetch the notification in the modal
      setUIState(prev => ({ 
        ...prev, 
        selectedNotification: { id: notification } as NotificationWithRelations 
      }))
    } else {
      setUIState(prev => ({ ...prev, selectedNotification: notification }))
    }
  }, [])

  const closeNotification = useCallback(() => {
    setUIState(prev => ({ ...prev, selectedNotification: null }))
  }, [])

  const updateFilters = useCallback((newFilters: Partial<NotificationFilters>) => {
    setUIState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }))
  }, [])

  // Action functions
  const markAsRead = useCallback((notificationId: string) => {
    markAsReadMutation.mutate(notificationId)
  }, [markAsReadMutation])

  const markAsUnread = useCallback((notificationId: string) => {
    markAsUnreadMutation.mutate(notificationId)
  }, [markAsUnreadMutation])

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate()
  }, [markAllAsReadMutation])

  const deleteNotification = useCallback((notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId)
  }, [deleteNotificationMutation])

  const createNotification = useCallback((request: CreateNotificationRequest) => {
    createNotificationMutation.mutate(request)
  }, [createNotificationMutation])

  const refreshNotifications = useCallback(() => {
    refetch()
    refetchUnreadCount()
    refetchStats()
  }, [refetch, refetchUnreadCount, refetchStats])

  // Play notification sound (optional)
  const playNotificationSound = useCallback(() => {
    if (typeof window !== 'undefined' && 'Audio' in window) {
      try {
        const audio = new Audio('/sounds/notification.mp3')
        audio.volume = 0.3
        audio.play().catch(() => {
          // Ignore errors if sound can't be played
        })
      } catch {
        // Ignore if Audio API is not available
      }
    }
  }, [])

  return {
    // Data
    notifications: notificationsData?.data || [],
    hasMore: notificationsData?.hasMore || false,
    totalCount: notificationsData?.count || 0,
    unreadCount,
    stats,
    
    // UI State
    isOpen: uiState.isOpen,
    selectedNotification: uiState.selectedNotification,
    filters: uiState.filters,
    isLoading: isLoading || uiState.isLoading,
    hasNewNotifications: uiState.hasNewNotifications,
    error,

    // Loading states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAsUnread: markAsUnreadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
    isCreating: createNotificationMutation.isPending,

    // UI Actions
    openDropdown,
    closeDropdown,
    toggleDropdown,
    openNotification,
    closeNotification,
    updateFilters,

    // Data Actions
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refreshNotifications,
    playNotificationSound
  }
}

// Hook for fetching a single notification
export function useNotification(notificationId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.notification(notificationId || ''),
    queryFn: () => notificationId ? notificationService.getNotificationById(notificationId) : null,
    enabled: !!notificationId,
    staleTime: 30000
  })
}

// Hook for managing notification preferences
export function useNotificationPreferences() {
  const queryClient = useQueryClient()

  const updatePreferences = useMutation({
    mutationFn: async (preferences: Partial<Record<string, boolean>>) => {
      // This would integrate with the profiles table notification_preferences
      // For now, we'll store in localStorage as a fallback
      localStorage.setItem('notification_preferences', JSON.stringify(preferences))
      return preferences
    },
    onSuccess: () => {
      toast.success('Notification preferences updated')
    },
    onError: (error: any) => {
      toast.error('Failed to update preferences', {
        description: error.message
      })
    }
  })

  const getPreferences = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('notification_preferences')
        return stored ? JSON.parse(stored) : {}
      } catch {
        return {}
      }
    }
    return {}
  }, [])

  return {
    preferences: getPreferences(),
    updatePreferences: updatePreferences.mutate,
    isUpdating: updatePreferences.isPending
  }
}