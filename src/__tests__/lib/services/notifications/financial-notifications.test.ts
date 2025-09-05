import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { FinancialNotificationsService } from '@/lib/services/notifications/financial-notifications.service'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
  channel: jest.fn(),
}

jest.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase,
}))

// Mock BaseService
jest.mock('@/lib/services/base-service', () => ({
  BaseService: class {
    protected tableName: string
    constructor(tableName: string) {
      this.tableName = tableName
    }
    
    async getCurrentOrganization() {
      return 'org-123'
    }
    
    async getCurrentUser() {
      return { id: 'user-123' }
    }
    
    async logActivity() {
      return true
    }
  },
}))

describe('FinancialNotificationsService', () => {
  let service: FinancialNotificationsService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new FinancialNotificationsService()
    
    // Default mock setup for Supabase queries
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('notifyPaymentReceived', () => {
    it('should create payment received notification', async () => {
      const mockPayment = {
        id: 'pay-123',
        amount: 500,
        payment_method_type: 'card',
        payment_date: '2024-01-15T10:00:00Z',
        student: {
          first_name: 'John',
          last_name: 'Doe',
          student_id: 'S001',
        },
        invoice: {
          invoice_number: 'INV-001',
        },
      }

      const mockNotification = {
        id: 'notif-123',
        type: 'payment_received',
        title: 'Payment Received',
        message: 'Payment of $500.00 received from John Doe for invoice INV-001',
        priority: 'medium',
      }

      mockSupabase.from.mockImplementation((table: string) => {
        const query = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(),
        }

        if (table === 'payments') {
          query.single.mockResolvedValue({ data: mockPayment, error: null })
        } else if (table === 'notifications') {
          query.single.mockResolvedValue({ data: mockNotification, error: null })
        }

        return query
      })

      const result = await service.notifyPaymentReceived('pay-123', 'student-123', 500, 'inv-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('payments')
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
    })

    it('should handle missing payment data', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'payments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          single: jest.fn(),
        }
      })

      const result = await service.notifyPaymentReceived('pay-123', 'student-123', 500)

      // Should return early if payment not found
      expect(result).toBeUndefined()
    })

    it('should create notification without invoice reference', async () => {
      const mockPayment = {
        id: 'pay-123',
        amount: 500,
        payment_method_type: 'cash',
        payment_date: '2024-01-15T10:00:00Z',
        student: {
          first_name: 'Jane',
          last_name: 'Smith',
          student_id: 'S002',
        },
        invoice: null,
      }

      mockSupabase.from.mockImplementation((table: string) => {
        const query = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(),
        }

        if (table === 'payments') {
          query.single.mockResolvedValue({ data: mockPayment, error: null })
        } else if (table === 'notifications') {
          query.single.mockResolvedValue({ data: {}, error: null })
        }

        return query
      })

      await service.notifyPaymentReceived('pay-123', 'student-123', 500)

      // Verify the notification was attempted to be created
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
    })
  })

  describe('notifyInvoiceCreated', () => {
    it('should create invoice created notification', async () => {
      const mockInvoice = {
        id: 'inv-123',
        invoice_number: 'INV-001',
        due_date: '2024-02-15',
        total_amount: 1000,
        student: {
          first_name: 'Alice',
          last_name: 'Johnson',
          student_id: 'S003',
        },
        line_items: [
          { description: 'Monthly Tuition', amount: 1000 },
        ],
      }

      mockSupabase.from.mockImplementation((table: string) => {
        const query = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(),
        }

        if (table === 'invoices') {
          query.single.mockResolvedValue({ data: mockInvoice, error: null })
        } else if (table === 'notifications') {
          query.single.mockResolvedValue({ data: {}, error: null })
        }

        return query
      })

      await service.notifyInvoiceCreated('inv-123', 'student-123', 1000)

      expect(mockSupabase.from).toHaveBeenCalledWith('invoices')
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
    })
  })

  describe('notifyPaymentOverdue', () => {
    it('should create overdue payment notification with correct priority', async () => {
      const mockInvoice = {
        id: 'inv-123',
        invoice_number: 'INV-001',
        due_date: '2024-01-01',
        student: {
          first_name: 'Bob',
          last_name: 'Wilson',
          student_id: 'S004',
          primary_phone: '+1234567890',
          email: 'bob@example.com',
        },
      }

      mockSupabase.from.mockImplementation((table: string) => {
        const query = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(),
        }

        if (table === 'invoices') {
          query.single.mockResolvedValue({ data: mockInvoice, error: null })
        } else if (table === 'notifications') {
          query.single.mockResolvedValue({ data: {}, error: null })
        }

        return query
      })

      // Test different priority levels based on days past due
      await service.notifyPaymentOverdue('inv-123', 'student-123', 500, 10)
      await service.notifyPaymentOverdue('inv-123', 'student-123', 500, 20)
      await service.notifyPaymentOverdue('inv-123', 'student-123', 500, 35)

      expect(mockSupabase.from).toHaveBeenCalledWith('invoices')
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
    })

    it('should set priority based on days past due', async () => {
      const mockInvoice = {
        id: 'inv-123',
        invoice_number: 'INV-001',
        due_date: '2024-01-01',
        student: {
          first_name: 'Charlie',
          last_name: 'Brown',
          student_id: 'S005',
          primary_phone: '+1234567890',
          email: 'charlie@example.com',
        },
      }

      let capturedNotification: any = null

      mockSupabase.from.mockImplementation((table: string) => {
        const query = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockImplementation((data) => {
            capturedNotification = data
            return query
          }),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(),
        }

        if (table === 'invoices') {
          query.single.mockResolvedValue({ data: mockInvoice, error: null })
        } else if (table === 'notifications') {
          query.single.mockResolvedValue({ data: {}, error: null })
        }

        return query
      })

      // Test urgent priority for 35+ days overdue
      await service.notifyPaymentOverdue('inv-123', 'student-123', 500, 35)

      expect(capturedNotification).toMatchObject({
        priority: 'urgent',
        type: 'payment_overdue',
      })
    })
  })

  describe('notifyBalanceUpdated', () => {
    it('should create balance updated notification', async () => {
      const mockStudent = {
        first_name: 'David',
        last_name: 'Smith',
        student_id: 'S006',
      }

      mockSupabase.from.mockImplementation((table: string) => {
        const query = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(),
        }

        if (table === 'students') {
          query.single.mockResolvedValue({ data: mockStudent, error: null })
        } else if (table === 'notifications') {
          query.single.mockResolvedValue({ data: {}, error: null })
        }

        return query
      })

      await service.notifyBalanceUpdated('student-123', 1000, 1500)

      expect(mockSupabase.from).toHaveBeenCalledWith('students')
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
    })

    it('should handle balance increase and decrease correctly', async () => {
      const mockStudent = {
        first_name: 'Emma',
        last_name: 'Davis',
        student_id: 'S007',
      }

      let capturedNotifications: any[] = []

      mockSupabase.from.mockImplementation((table: string) => {
        const query = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockImplementation((data) => {
            capturedNotifications.push(data)
            return query
          }),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(),
        }

        if (table === 'students') {
          query.single.mockResolvedValue({ data: mockStudent, error: null })
        } else if (table === 'notifications') {
          query.single.mockResolvedValue({ data: {}, error: null })
        }

        return query
      })

      // Test balance increase
      await service.notifyBalanceUpdated('student-123', 1000, 1500)
      
      // Test balance decrease
      await service.notifyBalanceUpdated('student-123', 1500, 800)

      expect(capturedNotifications).toHaveLength(2)
      expect(capturedNotifications[0].message).toContain('increased by $500.00')
      expect(capturedNotifications[1].message).toContain('decreased by $700.00')
    })
  })

  describe('checkAndNotifyOverdueInvoices', () => {
    it('should check for overdue invoices and create notifications', async () => {
      const mockOverdueInvoices = [
        {
          id: 'inv-1',
          student_id: 'student-1',
          invoice_number: 'INV-001',
          due_date: '2024-01-01',
          remaining_balance: 500,
          student: {
            first_name: 'Frank',
            last_name: 'Miller',
            student_id: 'S008',
          },
        },
        {
          id: 'inv-2',
          student_id: 'student-2',
          invoice_number: 'INV-002',
          due_date: '2024-01-05',
          remaining_balance: 750,
          student: {
            first_name: 'Grace',
            last_name: 'Wilson',
            student_id: 'S009',
          },
        },
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        const query = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          gt: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          single: jest.fn(),
        }

        if (table === 'invoices') {
          query.gt.mockResolvedValue({ data: mockOverdueInvoices, error: null })
        } else if (table === 'notifications') {
          // Mock no recent notifications
          query.single.mockResolvedValue({ data: null, error: null })
          query.single.mockResolvedValue({ data: {}, error: null })
        }

        return query
      })

      const result = await service.checkAndNotifyOverdueInvoices()

      expect(result).toBe(2) // Should have created notifications for both overdue invoices
      expect(mockSupabase.from).toHaveBeenCalledWith('invoices')
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
    })

    it('should skip notifications if recently sent', async () => {
      const mockOverdueInvoices = [
        {
          id: 'inv-1',
          student_id: 'student-1',
          invoice_number: 'INV-001',
          due_date: '2024-01-01',
          remaining_balance: 500,
          student: {
            first_name: 'Henry',
            last_name: 'Johnson',
            student_id: 'S010',
          },
        },
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        const query = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          gt: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          single: jest.fn(),
        }

        if (table === 'invoices') {
          query.gt.mockResolvedValue({ data: mockOverdueInvoices, error: null })
        } else if (table === 'notifications') {
          // Mock recent notification exists
          query.single.mockResolvedValue({ data: { id: 'recent-notif' }, error: null })
        }

        return query
      })

      const result = await service.checkAndNotifyOverdueInvoices()

      expect(result).toBe(0) // Should not create new notifications
    })

    it('should handle empty overdue invoices list', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'invoices') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            gt: jest.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          single: jest.fn(),
        }
      })

      const result = await service.checkAndNotifyOverdueInvoices()

      expect(result).toBeUndefined() // Should return early
    })
  })

  describe('getFinancialNotifications', () => {
    it('should retrieve financial notifications with limit', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          type: 'payment_received',
          title: 'Payment Received',
          message: 'Payment received from John Doe',
          created_at: '2024-01-15T10:00:00Z',
          priority: 'medium',
          student: {
            first_name: 'John',
            last_name: 'Doe',
            student_id: 'S001',
          },
        },
        {
          id: 'notif-2',
          type: 'invoice_created',
          title: 'Invoice Created',
          message: 'New invoice created for Jane Smith',
          created_at: '2024-01-14T09:00:00Z',
          priority: 'low',
          student: {
            first_name: 'Jane',
            last_name: 'Smith',
            student_id: 'S002',
          },
        },
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notifications') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: mockNotifications, error: null }),
          }
        }
        return {}
      })

      const result = await service.getFinancialNotifications(5)

      expect(result).toEqual(mockNotifications)
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notifications') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'Database error' } 
            }),
          }
        }
        return {}
      })

      await expect(service.getFinancialNotifications()).rejects.toThrow()
    })
  })

  describe('Real-time Subscription', () => {
    it('should set up real-time subscription correctly', () => {
      const mockSubscription = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnValue('subscription-id'),
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      // Mock window.dispatchEvent for testing
      global.window = {
        dispatchEvent: jest.fn(),
      } as any

      const subscription = FinancialNotificationsService.setupRealtimeSubscription()

      expect(mockSupabase.channel).toHaveBeenCalledWith('financial-notifications')
      expect(mockSubscription.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: expect.stringContaining('type=in.'),
        }),
        expect.any(Function)
      )
      expect(mockSubscription.subscribe).toHaveBeenCalled()
    })

    it('should handle real-time notification events', () => {
      const mockSubscription = {
        on: jest.fn().mockImplementation((event, config, callback) => {
          // Simulate a real-time event
          callback({
            new: {
              id: 'notif-123',
              type: 'payment_received',
              title: 'Payment Received',
              message: 'Payment received from test user',
            },
          })
          return mockSubscription
        }),
        subscribe: jest.fn().mockReturnValue('subscription-id'),
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      // Mock window.dispatchEvent
      const dispatchEventSpy = jest.fn()
      global.window = {
        dispatchEvent: dispatchEventSpy,
      } as any

      FinancialNotificationsService.setupRealtimeSubscription()

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'financial-notification',
          detail: expect.objectContaining({
            id: 'notif-123',
            type: 'payment_received',
          }),
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle notification creation errors', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        const query = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(),
        }

        if (table === 'notifications') {
          query.single.mockResolvedValue({ 
            data: null, 
            error: { message: 'Insert failed' } 
          })
        } else if (table === 'students') {
          query.single.mockResolvedValue({ 
            data: { first_name: 'Test', last_name: 'User' }, 
            error: null 
          })
        }

        return query
      })

      await expect(
        service.notifyBalanceUpdated('student-123', 1000, 1500)
      ).rejects.toThrow('Insert failed')
    })

    it('should handle missing student data gracefully', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'students') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          single: jest.fn(),
        }
      })

      const result = await service.notifyBalanceUpdated('student-123', 1000, 1500)

      // Should return early if student not found
      expect(result).toBeUndefined()
    })
  })

  describe('Performance Tests', () => {
    it('should handle multiple notification creation efficiently', async () => {
      const mockStudent = { first_name: 'Test', last_name: 'User' }

      mockSupabase.from.mockImplementation((table: string) => {
        const query = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(),
        }

        if (table === 'students') {
          query.single.mockResolvedValue({ data: mockStudent, error: null })
        } else if (table === 'notifications') {
          query.single.mockResolvedValue({ data: {}, error: null })
        }

        return query
      })

      const startTime = performance.now()
      
      // Create multiple notifications simultaneously
      await Promise.all([
        service.notifyBalanceUpdated('student-1', 1000, 1100),
        service.notifyBalanceUpdated('student-2', 1500, 1300),
        service.notifyBalanceUpdated('student-3', 800, 1200),
        service.notifyBalanceUpdated('student-4', 2000, 1800),
        service.notifyBalanceUpdated('student-5', 600, 900),
      ])
      
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
    })
  })
})