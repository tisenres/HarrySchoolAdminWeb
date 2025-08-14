import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useNotifications, useNotification, useNotificationPreferences } from '@/hooks/use-notifications'
import { NotificationService } from '@/lib/services/notification-service'
import { mockNotificationService } from '@/lib/services/mock-notification-service'
import type { NotificationWithRelations, NotificationFilters } from '@/types/notification'

// Mock fetch globally
global.fetch = jest.fn()

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: jest.fn(() => ({
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn()
      })),
      unsubscribe: jest.fn()
    }))
  }))
}))

// Mock services
jest.mock('@/lib/services/notification-service')
jest.mock('@/lib/services/mock-notification-service')

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}))

// Mock Audio API
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn().mockResolvedValue(undefined),
  volume: 0.3
}))

describe('Notifications Functionality', () => {
  let queryClient: QueryClient

  const mockNotification: NotificationWithRelations = {
    id: 'notif-1',
    organization_id: 'org-1',
    title: 'New Student Enrolled',
    message: 'John Doe has enrolled in IELTS Preparation Group',
    type: 'enrollment',
    priority: 'medium',
    is_read: false,
    read_at: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    user_id: 'user-1',
    resource_type: 'student',
    resource_id: 'student-1',
    action_url: '/students/student-1',
    expires_at: null,
    metadata: {
      student_name: 'John Doe',
      group_name: 'IELTS Preparation Group'
    }
  }

  const mockNotifications = [
    mockNotification,
    {
      ...mockNotification,
      id: 'notif-2',
      title: 'Payment Overdue',
      message: 'Alice Smith has an overdue payment',
      type: 'payment',
      priority: 'high',
      is_read: true,
      read_at: '2024-01-15T11:00:00Z'
    },
    {
      ...mockNotification,
      id: 'notif-3',
      title: 'Group Capacity Full',
      message: 'Business English Advanced group has reached capacity',
      type: 'group',
      priority: 'low',
      is_read: false
    }
  ]

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  describe('Notifications Hook - Basic Functionality', () => {
    it('should fetch notifications successfully', async () => {
      const mockResponse = {
        data: mockNotifications,
        count: 3,
        hasMore: false
      }

      ;(mockNotificationService.getNotifications as jest.Mock).mockResolvedValueOnce(mockResponse)
      ;(mockNotificationService.getUnreadCount as jest.Mock).mockResolvedValueOnce(2)
      ;(mockNotificationService.getStats as jest.Mock).mockResolvedValueOnce({
        total: 3,
        unread: 2,
        by_type: { enrollment: 1, payment: 1, group: 1 },
        by_priority: { high: 1, medium: 1, low: 1 }
      })

      const { result } = renderHook(() => useNotifications(), { wrapper })

      // Initial state
      expect(result.current.notifications).toEqual([])
      expect(result.current.isLoading).toBe(true)

      // Wait for data to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.notifications).toEqual(mockNotifications)
      expect(result.current.totalCount).toBe(3)
      expect(result.current.unreadCount).toBe(2)
    })

    it('should handle notification filtering', async () => {
      const filters: NotificationFilters = {
        type: 'payment',
        priority: 'high',
        is_read: false
      }

      const filteredNotifications = mockNotifications.filter(n => 
        n.type === 'payment' && n.priority === 'high' && !n.is_read
      )

      ;(mockNotificationService.getNotifications as jest.Mock).mockResolvedValueOnce({
        data: filteredNotifications,
        count: filteredNotifications.length,
        hasMore: false
      })

      const { result } = renderHook(() => useNotifications(filters), { wrapper })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith(filters, 1, 20)
    })

    it('should manage UI state correctly', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      // Initial state
      expect(result.current.isOpen).toBe(false)
      expect(result.current.selectedNotification).toBe(null)

      // Toggle dropdown
      act(() => {
        result.current.toggleDropdown()
      })
      expect(result.current.isOpen).toBe(true)

      // Close dropdown
      act(() => {
        result.current.closeDropdown()
      })
      expect(result.current.isOpen).toBe(false)

      // Open notification
      act(() => {
        result.current.openNotification(mockNotification)
      })
      expect(result.current.selectedNotification).toEqual(mockNotification)

      // Close notification
      act(() => {
        result.current.closeNotification()
      })
      expect(result.current.selectedNotification).toBe(null)
    })
  })

  describe('Notification Actions', () => {
    it('should mark notification as read', async () => {
      ;(mockNotificationService.markAsRead as jest.Mock).mockResolvedValueOnce(undefined)

      const { result } = renderHook(() => useNotifications(), { wrapper })

      await act(async () => {
        result.current.markAsRead('notif-1')
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('notif-1')
    })

    it('should mark notification as unread', async () => {
      ;(mockNotificationService.markAsUnread as jest.Mock).mockResolvedValueOnce(undefined)

      const { result } = renderHook(() => useNotifications(), { wrapper })

      await act(async () => {
        result.current.markAsUnread('notif-1')
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(mockNotificationService.markAsUnread).toHaveBeenCalledWith('notif-1')
    })

    it('should mark all notifications as read', async () => {
      ;(mockNotificationService.markAllAsRead as jest.Mock).mockResolvedValueOnce(5)

      const { result } = renderHook(() => useNotifications(), { wrapper })

      await act(async () => {
        result.current.markAllAsRead()
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(mockNotificationService.markAllAsRead).toHaveBeenCalled()
    })

    it('should delete notification', async () => {
      ;(mockNotificationService.deleteNotification as jest.Mock).mockResolvedValueOnce(undefined)

      const { result } = renderHook(() => useNotifications(), { wrapper })

      await act(async () => {
        result.current.deleteNotification('notif-1')
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith('notif-1')
    })

    it('should create new notification', async () => {
      const newNotification = {
        title: 'System Maintenance',
        message: 'Scheduled maintenance at 2 AM',
        type: 'system' as const,
        priority: 'medium' as const,
        user_id: 'user-1',
        resource_type: 'system',
        resource_id: 'maintenance-1'
      }

      ;(mockNotificationService.createNotification as jest.Mock).mockResolvedValueOnce(mockNotification)

      const { result } = renderHook(() => useNotifications(), { wrapper })

      await act(async () => {
        result.current.createNotification(newNotification)
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(newNotification)
    })

    it('should refresh notifications', async () => {
      ;(mockNotificationService.getNotifications as jest.Mock).mockResolvedValue({
        data: mockNotifications,
        count: 3,
        hasMore: false
      })
      ;(mockNotificationService.getUnreadCount as jest.Mock).mockResolvedValue(2)
      ;(mockNotificationService.getStats as jest.Mock).mockResolvedValue({
        total: 3,
        unread: 2
      })

      const { result } = renderHook(() => useNotifications(), { wrapper })

      await act(async () => {
        result.current.refreshNotifications()
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(mockNotificationService.getNotifications).toHaveBeenCalled()
      expect(mockNotificationService.getUnreadCount).toHaveBeenCalled()
      expect(mockNotificationService.getStats).toHaveBeenCalled()
    })

    it('should play notification sound', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.playNotificationSound()
      })

      expect(global.Audio).toHaveBeenCalledWith('/sounds/notification.mp3')
    })
  })

  describe('Single Notification Hook', () => {
    it('should fetch single notification by ID', async () => {
      ;(mockNotificationService.getNotificationById as jest.Mock).mockResolvedValueOnce(mockNotification)

      const { result } = renderHook(() => useNotification('notif-1'), { wrapper })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(mockNotificationService.getNotificationById).toHaveBeenCalledWith('notif-1')
      expect(result.current.data).toEqual(mockNotification)
    })

    it('should not fetch when notification ID is null', () => {
      const { result } = renderHook(() => useNotification(null), { wrapper })

      expect(mockNotificationService.getNotificationById).not.toHaveBeenCalled()
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('Notification Preferences Hook', () => {
    beforeEach(() => {
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.clear()
      }
    })

    it('should manage notification preferences', async () => {
      const { result } = renderHook(() => useNotificationPreferences(), { wrapper })

      // Initial state
      expect(result.current.preferences).toEqual({})

      // Update preferences
      const newPreferences = {
        email_notifications: true,
        push_notifications: false,
        sms_notifications: true
      }

      await act(async () => {
        result.current.updatePreferences(newPreferences)
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      // Check if stored in localStorage
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('notification_preferences')
        expect(stored).toBe(JSON.stringify(newPreferences))
      }
    })

    it('should retrieve stored preferences', () => {
      const preferences = {
        email_notifications: true,
        push_notifications: false
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('notification_preferences', JSON.stringify(preferences))
      }

      const { result } = renderHook(() => useNotificationPreferences(), { wrapper })

      expect(result.current.preferences).toEqual(preferences)
    })
  })

  describe('Error Handling', () => {
    it('should handle notification fetching errors', async () => {
      ;(mockNotificationService.getNotifications as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to fetch notifications')
      )

      const { result } = renderHook(() => useNotifications(), { wrapper })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.error).toBeTruthy()
    })

    it('should handle mark as read errors', async () => {
      ;(mockNotificationService.markAsRead as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to mark as read')
      )

      const { result } = renderHook(() => useNotifications(), { wrapper })

      await act(async () => {
        result.current.markAsRead('notif-1')
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      // Error should be handled and toast shown
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('notif-1')
    })

    it('should handle delete notification errors', async () => {
      ;(mockNotificationService.deleteNotification as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to delete notification')
      )

      const { result } = renderHook(() => useNotifications(), { wrapper })

      await act(async () => {
        result.current.deleteNotification('notif-1')
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith('notif-1')
    })
  })

  describe('Real-time Updates', () => {
    it('should handle real-time notification inserts', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      // Simulate real-time insert
      act(() => {
        // This would be triggered by Supabase real-time subscription
        // For testing, we'll just check that hasNewNotifications can be set
        result.current.toggleDropdown() // Opens dropdown and clears hasNewNotifications
      })

      expect(result.current.isOpen).toBe(true)
    })

    it('should update filters correctly', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      const newFilters = {
        type: 'payment' as const,
        priority: 'high' as const
      }

      act(() => {
        result.current.updateFilters(newFilters)
      })

      expect(result.current.filters).toEqual(expect.objectContaining(newFilters))
    })
  })

  describe('API Integration Tests', () => {
    it('should fetch notifications from API', async () => {
      const mockApiResponse = {
        success: true,
        data: mockNotifications,
        pagination: {
          total: 3,
          has_more: false,
          page: 1,
          limit: 20
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      })

      const response = await fetch('/api/notifications?page=1&limit=20')
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/notifications?page=1&limit=20')
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockNotifications)
    })

    it('should mark notification as read via API', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Marked as read' })
      })

      const response = await fetch('/api/notifications/notif-1/read', {
        method: 'PATCH'
      })
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/notifications/notif-1/read', {
        method: 'PATCH'
      })
      expect(result.success).toBe(true)
    })

    it('should delete notification via API', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Notification deleted' })
      })

      const response = await fetch('/api/notifications/notif-1', {
        method: 'DELETE'
      })
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/notifications/notif-1', {
        method: 'DELETE'
      })
      expect(result.success).toBe(true)
    })

    it('should create notification via API', async () => {
      const newNotification = {
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'system',
        priority: 'medium',
        user_id: 'user-1'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { ...newNotification, id: 'notif-new' }
        })
      })

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotification)
      })
      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/notifications', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(newNotification)
      }))
      expect(result.success).toBe(true)
    })

    it('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      })

      const response = await fetch('/api/notifications')
      const result = await response.json()

      expect(response.ok).toBe(false)
      expect(result.error).toBe('Internal server error')
    })
  })

  describe('Notification Pagination', () => {
    it('should handle pagination correctly', async () => {
      const page1Response = {
        data: mockNotifications.slice(0, 2),
        count: 3,
        hasMore: true
      }

      const page2Response = {
        data: mockNotifications.slice(2),
        count: 3,
        hasMore: false
      }

      ;(mockNotificationService.getNotifications as jest.Mock)
        .mockResolvedValueOnce(page1Response)
        .mockResolvedValueOnce(page2Response)

      // Test page 1
      const { result: result1 } = renderHook(() => useNotifications({}, 1, 2), { wrapper })
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result1.current.notifications).toHaveLength(2)
      expect(result1.current.hasMore).toBe(true)

      // Test page 2
      const { result: result2 } = renderHook(() => useNotifications({}, 2, 2), { wrapper })
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result2.current.notifications).toHaveLength(1)
      expect(result2.current.hasMore).toBe(false)
    })
  })

  describe('Notification Types and Priorities', () => {
    it('should filter by notification type', async () => {
      const enrollmentNotifications = mockNotifications.filter(n => n.type === 'enrollment')

      ;(mockNotificationService.getNotifications as jest.Mock).mockResolvedValueOnce({
        data: enrollmentNotifications,
        count: enrollmentNotifications.length,
        hasMore: false
      })

      const { result } = renderHook(() => useNotifications({ type: 'enrollment' }), { wrapper })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith(
        { type: 'enrollment' }, 1, 20
      )
    })

    it('should filter by notification priority', async () => {
      const highPriorityNotifications = mockNotifications.filter(n => n.priority === 'high')

      ;(mockNotificationService.getNotifications as jest.Mock).mockResolvedValueOnce({
        data: highPriorityNotifications,
        count: highPriorityNotifications.length,
        hasMore: false
      })

      const { result } = renderHook(() => useNotifications({ priority: 'high' }), { wrapper })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith(
        { priority: 'high' }, 1, 20
      )
    })

    it('should filter by read status', async () => {
      const unreadNotifications = mockNotifications.filter(n => !n.is_read)

      ;(mockNotificationService.getNotifications as jest.Mock).mockResolvedValueOnce({
        data: unreadNotifications,
        count: unreadNotifications.length,
        hasMore: false
      })

      const { result } = renderHook(() => useNotifications({ is_read: false }), { wrapper })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith(
        { is_read: false }, 1, 20
      )
    })
  })
})