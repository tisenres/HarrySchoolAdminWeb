import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { FinanceReportService } from '@/lib/services/finance/finance-report-service'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
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
    
    async getSupabase() {
      return {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn(),
        rpc: jest.fn(),
      }
    }
    
    async logActivity() {
      return true
    }
  },
}))

describe('FinanceReportService', () => {
  let service: FinanceReportService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new FinanceReportService()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('generateFinancialSummary', () => {
    it('should generate financial summary with valid filters', async () => {
      const mockSummary = {
        total_revenue: 50000,
        total_invoiced: 55000,
        total_collected: 50000,
        total_outstanding: 5000,
        collection_rate: 0.909,
        active_students: 150,
        average_payment: 333.33,
        total_refunds: 500,
        total_discounts: 2000,
        total_scholarships: 1500,
      }

      const supabase = await service.getSupabase()
      jest.mocked(supabase.rpc).mockResolvedValue({ data: mockSummary, error: null })

      const filters = {
        period_start: '2024-01-01',
        period_end: '2024-12-31',
        include_pending: true,
        include_refunded: true,
        currency: 'USD',
      }

      const result = await service.generateFinancialSummary(filters)

      expect(result).toEqual({
        organization_id: 'org-123',
        period_start: '2024-01-01',
        period_end: '2024-12-31',
        currency: 'USD',
        ...mockSummary,
      })

      expect(supabase.rpc).toHaveBeenCalledWith('generate_financial_summary', {
        p_organization_id: 'org-123',
        p_period_start: '2024-01-01',
        p_period_end: '2024-12-31',
        p_student_ids: null,
        p_group_ids: null,
        p_include_pending: true,
        p_include_refunded: true,
        p_currency: 'USD',
      })
    })

    it('should handle database errors', async () => {
      const supabase = await service.getSupabase()
      jest.mocked(supabase.rpc).mockResolvedValue({ 
        data: null, 
        error: { message: 'Database connection failed' } 
      })

      const filters = {
        period_start: '2024-01-01',
        period_end: '2024-12-31',
      }

      await expect(service.generateFinancialSummary(filters)).rejects.toThrow(
        'Failed to generate financial summary: Database connection failed'
      )
    })

    it('should handle optional filters', async () => {
      const supabase = await service.getSupabase()
      jest.mocked(supabase.rpc).mockResolvedValue({ data: {}, error: null })

      const filters = {
        period_start: '2024-01-01',
        period_end: '2024-12-31',
        student_ids: ['student-1', 'student-2'],
        group_ids: ['group-1'],
        include_pending: false,
        include_refunded: false,
      }

      await service.generateFinancialSummary(filters)

      expect(supabase.rpc).toHaveBeenCalledWith('generate_financial_summary', {
        p_organization_id: 'org-123',
        p_period_start: '2024-01-01',
        p_period_end: '2024-12-31',
        p_student_ids: ['student-1', 'student-2'],
        p_group_ids: ['group-1'],
        p_include_pending: false,
        p_include_refunded: false,
        p_currency: 'UZS', // default currency
      })
    })
  })

  describe('generateStudentPaymentHistory', () => {
    it('should generate payment history for a student', async () => {
      const mockHistory = {
        transactions: [
          {
            date: '2024-01-15',
            type: 'payment',
            description: 'Monthly tuition payment',
            amount: 500,
            balance: 0,
            reference: 'PAY-001',
          }
        ],
        current_balance: 0,
        total_invoiced: 500,
        total_paid: 500,
        total_refunded: 0,
      }

      const mockStudent = {
        first_name: 'John',
        last_name: 'Doe',
      }

      const supabase = await service.getSupabase()
      jest.mocked(supabase.rpc).mockResolvedValue({ data: mockHistory, error: null })
      jest.mocked(supabase.from).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockStudent, error: null }),
      } as any)

      const result = await service.generateStudentPaymentHistory('student-123')

      expect(result).toEqual({
        student_id: 'student-123',
        student_name: 'John Doe',
        ...mockHistory,
      })

      expect(supabase.rpc).toHaveBeenCalledWith('generate_student_payment_history', {
        p_organization_id: 'org-123',
        p_student_id: 'student-123',
        p_period_start: null,
        p_period_end: null,
      })
    })

    it('should handle period filters', async () => {
      const supabase = await service.getSupabase()
      jest.mocked(supabase.rpc).mockResolvedValue({ data: {}, error: null })
      jest.mocked(supabase.from).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { first_name: 'John', last_name: 'Doe' }, error: null }),
      } as any)

      await service.generateStudentPaymentHistory(
        'student-123',
        '2024-01-01',
        '2024-12-31'
      )

      expect(supabase.rpc).toHaveBeenCalledWith('generate_student_payment_history', {
        p_organization_id: 'org-123',
        p_student_id: 'student-123',
        p_period_start: '2024-01-01',
        p_period_end: '2024-12-31',
      })
    })
  })

  describe('getOutstandingBalances', () => {
    it('should get outstanding balances without filters', async () => {
      const mockBalances = [
        {
          student_id: 'student-1',
          student_name: 'John Doe',
          total_outstanding: 1000,
          oldest_due_date: '2024-01-01',
          risk_level: 'medium',
        },
        {
          student_id: 'student-2',
          student_name: 'Jane Smith',
          total_outstanding: 500,
          oldest_due_date: '2024-02-01',
          risk_level: 'low',
        },
      ]

      const supabase = await service.getSupabase()
      jest.mocked(supabase.from).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockBalances, error: null }),
      } as any)

      const result = await service.getOutstandingBalances()

      expect(result).toEqual(mockBalances)
    })

    it('should apply filters correctly', async () => {
      const supabase = await service.getSupabase()
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }
      
      jest.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const filters = {
        student_id: 'student-123',
        group_id: 'group-456',
        overdue_only: true,
        min_amount: 100,
      }

      await service.getOutstandingBalances(filters)

      expect(mockQuery.eq).toHaveBeenCalledWith('student_id', 'student-123')
      expect(mockQuery.eq).toHaveBeenCalledWith('group_id', 'group-456')
      expect(mockQuery.gte).toHaveBeenCalledWith('total_outstanding', 100)
    })
  })

  describe('getFinanceStatistics', () => {
    it('should get finance statistics with default period', async () => {
      const mockStats = {
        total_revenue: 100000,
        total_outstanding: 15000,
        collection_rate: 0.87,
        overdue_invoices: 12,
        active_payment_plans: 5,
        students_with_balance: 25,
        average_payment_amount: 450,
        payment_methods_breakdown: {
          card: 45,
          cash: 30,
          bank_transfer: 25,
        },
        monthly_revenue_trend: [
          { month: '2024-01', revenue: 45000, payments: 90 },
          { month: '2024-02', revenue: 48000, payments: 95 },
        ],
      }

      const supabase = await service.getSupabase()
      jest.mocked(supabase.rpc).mockResolvedValue({ data: mockStats, error: null })

      const result = await service.getFinanceStatistics()

      expect(result).toEqual(mockStats)
      expect(supabase.rpc).toHaveBeenCalledWith('get_finance_statistics', {
        p_organization_id: 'org-123',
        p_period_start: null,
        p_period_end: null,
      })
    })

    it('should get finance statistics with custom period', async () => {
      const supabase = await service.getSupabase()
      jest.mocked(supabase.rpc).mockResolvedValue({ data: {}, error: null })

      await service.getFinanceStatistics('2024-01-01', '2024-12-31')

      expect(supabase.rpc).toHaveBeenCalledWith('get_finance_statistics', {
        p_organization_id: 'org-123',
        p_period_start: '2024-01-01',
        p_period_end: '2024-12-31',
      })
    })
  })

  describe('generateAgingReport', () => {
    it('should generate aging report', async () => {
      const mockAging = {
        current: { count: 50, amount: 25000 },
        overdue_1_30: { count: 15, amount: 7500 },
        overdue_31_60: { count: 8, amount: 4000 },
        overdue_61_90: { count: 3, amount: 1500 },
        overdue_90_plus: { count: 2, amount: 1000 },
        total: { count: 78, amount: 39000 },
      }

      const supabase = await service.getSupabase()
      jest.mocked(supabase.rpc).mockResolvedValue({ data: mockAging, error: null })

      const result = await service.generateAgingReport()

      expect(result).toEqual(mockAging)
      expect(supabase.rpc).toHaveBeenCalledWith('generate_aging_report', {
        p_organization_id: 'org-123',
      })
    })
  })

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `record-${i}`,
        amount: Math.random() * 1000,
        date: new Date().toISOString(),
      }))

      const supabase = await service.getSupabase()
      jest.mocked(supabase.from).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: largeDataset, error: null }),
      } as any)

      const startTime = performance.now()
      const result = await service.getOutstandingBalances()
      const endTime = performance.now()

      expect(result).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(50) // Should complete within 50ms
    })

    it('should cache repeated queries appropriately', async () => {
      const supabase = await service.getSupabase()
      jest.mocked(supabase.rpc).mockResolvedValue({ data: {}, error: null })

      // Make multiple identical calls
      await service.getFinanceStatistics('2024-01-01', '2024-12-31')
      await service.getFinanceStatistics('2024-01-01', '2024-12-31')
      await service.getFinanceStatistics('2024-01-01', '2024-12-31')

      // Verify the RPC was called for each request (no caching implemented yet)
      expect(supabase.rpc).toHaveBeenCalledTimes(3)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const supabase = await service.getSupabase()
      jest.mocked(supabase.rpc).mockRejectedValue(new Error('Network error'))

      await expect(service.getFinanceStatistics()).rejects.toThrow(
        'Failed to get finance statistics: Network error'
      )
    })

    it('should handle malformed data responses', async () => {
      const supabase = await service.getSupabase()
      jest.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null })

      const result = await service.getFinanceStatistics()
      
      // Should handle null data gracefully
      expect(result).toBeNull()
    })

    it('should validate input parameters', async () => {
      const invalidFilters = {
        period_start: 'invalid-date',
        period_end: '2024-12-31',
      }

      await expect(service.generateFinancialSummary(invalidFilters)).rejects.toThrow()
    })
  })
})