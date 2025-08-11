'use client'

/**
 * Basic integration test for the notifications system
 * This test verifies that components can be rendered without crashing
 */

import React from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotificationBell } from '@/components/admin/notifications/notification-bell'
import { NotificationItem } from '@/components/admin/notifications/notification-item'
import type { NotificationWithRelations } from '@/types/notification'

// Mock the Supabase client
jest.mock('@/lib/supabase-client', () => ({
  getSupabaseClient: () => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          or: jest.fn(() => ({
            is: jest.fn(() => ({
              range: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            }))
          }))
        }))
      }))
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn()
      }))
    }))
  })
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' })
}))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
)

describe('Notifications System', () => {
  beforeEach(() => {
    queryClient.clear()
  })

  describe('NotificationBell Component', () => {
    it('renders without crashing', () => {
      expect(() => {
        render(
          <TestWrapper>
            <NotificationBell />
          </TestWrapper>
        )
      }).not.toThrow()
    })

    it('renders bell icon', () => {
      const { container } = render(
        <TestWrapper>
          <NotificationBell />
        </TestWrapper>
      )
      
      // Check if bell icon or button exists
      const bellElements = container.querySelectorAll('[data-testid="notification-bell"], button, svg')
      expect(bellElements.length).toBeGreaterThan(0)
    })
  })

  describe('NotificationItem Component', () => {
    const mockNotification: NotificationWithRelations = {
      id: 'test-id',
      organization_id: 'org-id',
      user_id: 'user-id',
      role_target: ['admin'],
      type: 'system',
      title: 'Test Notification',
      message: 'This is a test notification',
      priority: 'normal',
      is_read: false,
      delivery_method: ['in_app'],
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      deleted_by: null,
      action_url: null,
      related_student_id: null,
      related_teacher_id: null,
      related_group_id: null,
      read_at: null,
      scheduled_for: null,
      expires_at: null
    }

    it('renders without crashing', () => {
      expect(() => {
        render(
          <TestWrapper>
            <NotificationItem notification={mockNotification} />
          </TestWrapper>
        )
      }).not.toThrow()
    })

    it('displays notification title', () => {
      const { getByText } = render(
        <TestWrapper>
          <NotificationItem notification={mockNotification} />
        </TestWrapper>
      )
      
      expect(getByText('Test Notification')).toBeInTheDocument()
    })

    it('displays notification message', () => {
      const { getByText } = render(
        <TestWrapper>
          <NotificationItem notification={mockNotification} />
        </TestWrapper>
      )
      
      expect(getByText('This is a test notification')).toBeInTheDocument()
    })

    it('shows unread state correctly', () => {
      const { container } = render(
        <TestWrapper>
          <NotificationItem notification={mockNotification} />
        </TestWrapper>
      )
      
      // Check for unread indicators (badge, styling, etc.)
      const unreadIndicators = container.querySelectorAll('[class*="unread"], [class*="New"]')
      expect(unreadIndicators.length).toBeGreaterThan(0)
    })
  })

  describe('Notification Types', () => {
    it('handles all notification types', () => {
      const notificationTypes = ['system', 'enrollment', 'payment', 'schedule', 'achievement', 'reminder', 'alert'] as const
      
      notificationTypes.forEach(type => {
        const notification: NotificationWithRelations = {
          id: `test-${type}`,
          organization_id: 'org-id',
          user_id: 'user-id',
          role_target: ['admin'],
          type: type,
          title: `${type} notification`,
          message: `This is a ${type} notification`,
          priority: 'normal',
          is_read: false,
          delivery_method: ['in_app'],
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          deleted_by: null,
          action_url: null,
          related_student_id: null,
          related_teacher_id: null,
          related_group_id: null,
          read_at: null,
          scheduled_for: null,
          expires_at: null
        }

        expect(() => {
          render(
            <TestWrapper>
              <NotificationItem notification={notification} />
            </TestWrapper>
          )
        }).not.toThrow()
      })
    })
  })

  describe('Notification Priorities', () => {
    it('handles all priority levels', () => {
      const priorities = ['low', 'normal', 'high', 'urgent'] as const
      
      priorities.forEach(priority => {
        const notification: NotificationWithRelations = {
          id: `test-${priority}`,
          organization_id: 'org-id',
          user_id: 'user-id',
          role_target: ['admin'],
          type: 'system',
          title: `${priority} priority notification`,
          message: `This is a ${priority} priority notification`,
          priority: priority,
          is_read: false,
          delivery_method: ['in_app'],
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          deleted_by: null,
          action_url: null,
          related_student_id: null,
          related_teacher_id: null,
          related_group_id: null,
          read_at: null,
          scheduled_for: null,
          expires_at: null
        }

        expect(() => {
          render(
            <TestWrapper>
              <NotificationItem notification={notification} />
            </TestWrapper>
          )
        }).not.toThrow()
      })
    })
  })
})

// Simple smoke test to ensure TypeScript types are working
describe('TypeScript Types', () => {
  it('notification types are properly defined', () => {
    const mockNotification: NotificationWithRelations = {
      id: 'test-id',
      organization_id: 'org-id',
      user_id: 'user-id',
      role_target: ['admin'],
      type: 'system',
      title: 'Test',
      message: 'Test message',
      priority: 'normal',
      is_read: false,
      delivery_method: ['in_app'],
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      deleted_by: null,
      action_url: null,
      related_student_id: null,
      related_teacher_id: null,
      related_group_id: null,
      read_at: null,
      scheduled_for: null,
      expires_at: null
    }

    expect(mockNotification.type).toBe('system')
    expect(mockNotification.priority).toBe('normal')
    expect(mockNotification.is_read).toBe(false)
  })
})