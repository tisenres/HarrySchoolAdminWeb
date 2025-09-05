import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { ReportGeneratorService, type ReportFilters } from '@/lib/services/reports/report-generator.service'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn(),
}

jest.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase,
}))

// Mock XLSX library
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(() => ({})),
    json_to_sheet: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}))

// Mock jsPDF
jest.mock('jspdf', () => ({
  default: jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    text: jest.fn(),
    autoTable: jest.fn(),
    save: jest.fn(),
  })),
}))

describe('ReportGeneratorService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock setup
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('generateRevenueReport', () => {
    it('should generate revenue report with all data', async () => {
      const mockRevenue = [
        {
          month: '2024-01',
          gross_revenue: 50000,
          net_revenue: 47000,
          total_fees: 3000,
        },
        {
          month: '2024-02',
          gross_revenue: 52000,
          net_revenue: 49000,
          total_fees: 3000,
        },
      ]

      const mockPayments = [
        {
          id: 'pay-1',
          amount: 500,
          payment_date: '2024-01-15',
          student: { first_name: 'John', last_name: 'Doe', student_id: 'S001' },
          invoice: { invoice_number: 'INV-001' },
        },
      ]

      const mockTransactions = [
        {
          id: 'txn-1',
          amount: 500,
          transaction_date: '2024-01-15',
          type: 'payment',
        },
      ]

      // Mock the database queries
      mockSupabase.from.mockImplementation((table: string) => {
        const query = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
        }

        if (table === 'revenue_summary') {
          query.order.mockResolvedValue({ data: mockRevenue, error: null })
        } else if (table === 'payments') {
          query.lte.mockResolvedValue({ data: mockPayments, error: null })
        } else if (table === 'financial_transactions') {
          query.lte.mockResolvedValue({ data: mockTransactions, error: null })
        }

        return query
      })

      const filters: ReportFilters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        organizationId: 'org-123',
        reportType: 'revenue',
      }

      const result = await ReportGeneratorService.generateRevenueReport(filters)

      expect(result).toEqual({
        summary: mockRevenue,
        payments: mockPayments,
        transactions: mockTransactions,
        totals: {
          grossRevenue: 102000,
          netRevenue: 96000,
          totalFees: 6000,
          paymentCount: 1,
        },
      })
    })

    it('should handle empty revenue data', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: null }),
      }))

      const filters: ReportFilters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        organizationId: 'org-123',
        reportType: 'revenue',
      }

      const result = await ReportGeneratorService.generateRevenueReport(filters)

      expect(result.totals.grossRevenue).toBe(0)
      expect(result.totals.netRevenue).toBe(0)
      expect(result.totals.paymentCount).toBe(0)
    })

    it('should handle database errors', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database connection failed' } 
        }),
      }))

      const filters: ReportFilters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        organizationId: 'org-123',
        reportType: 'revenue',
      }

      await expect(ReportGeneratorService.generateRevenueReport(filters)).rejects.toThrow()
    })
  })

  describe('generateOutstandingBalancesReport', () => {
    it('should generate outstanding balances report', async () => {
      const mockBalances = [
        {
          student_id: 'student-1',
          student_name: 'John Doe',
          balance: 1000,
          risk_level: 'high',
        },
        {
          student_id: 'student-2',
          student_name: 'Jane Smith',
          balance: 500,
          risk_level: 'medium',
        },
      ]

      const mockOverdueInvoices = [
        {
          id: 'inv-1',
          invoice_number: 'INV-001',
          due_date: '2024-01-01',
          student: {
            first_name: 'John',
            last_name: 'Doe',
            primary_phone: '+1234567890',
            email: 'john@example.com',
          },
        },
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        const query = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gt: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
        }

        if (table === 'outstanding_balances') {
          query.order.mockResolvedValue({ data: mockBalances, error: null })
        } else if (table === 'invoices') {
          query.in.mockResolvedValue({ data: mockOverdueInvoices, error: null })
        }

        return query
      })

      const filters: ReportFilters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        organizationId: 'org-123',
        reportType: 'outstanding',
      }

      const result = await ReportGeneratorService.generateOutstandingBalancesReport(filters)

      expect(result.balances).toEqual(mockBalances)
      expect(result.overdueInvoices).toEqual(mockOverdueInvoices)
      expect(result.summary).toEqual({
        totalOutstanding: 1500,
        studentCount: 2,
        overdueCount: 1,
        riskBreakdown: {
          high: 1,
          medium: 1,
          low: 0,
        },
      })
    })

    it('should calculate risk levels correctly', async () => {
      const mockBalances = [
        { student_id: '1', balance: 1000, risk_level: 'high' },
        { student_id: '2', balance: 500, risk_level: 'high' },
        { student_id: '3', balance: 200, risk_level: 'medium' },
        { student_id: '4', balance: 100, risk_level: 'low' },
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'outstanding_balances') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gt: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockBalances, error: null }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }
      })

      const filters: ReportFilters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        organizationId: 'org-123',
        reportType: 'outstanding',
      }

      const result = await ReportGeneratorService.generateOutstandingBalancesReport(filters)

      expect(result.summary.riskBreakdown).toEqual({
        high: 2,
        medium: 1,
        low: 1,
      })
      expect(result.summary.totalOutstanding).toBe(1800)
    })
  })

  describe('generatePaymentHistoryReport', () => {
    it('should generate payment history report with statistics', async () => {
      const mockHistory = [
        {
          student_id: 'student-1',
          total_paid: 1500,
          payment_count: 3,
        },
      ]

      const mockPayments = [
        {
          id: 'pay-1',
          amount: 500,
          payment_date: '2024-01-15',
          payment_method_type: 'card',
          student: { first_name: 'John', last_name: 'Doe', student_id: 'S001' },
          invoice: { invoice_number: 'INV-001' },
          payment_method: { name: 'Credit Card' },
        },
        {
          id: 'pay-2',
          amount: 1000,
          payment_date: '2024-02-15',
          payment_method_type: 'cash',
          student: { first_name: 'Jane', last_name: 'Smith', student_id: 'S002' },
          invoice: { invoice_number: 'INV-002' },
          payment_method: { name: 'Cash' },
        },
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        const query = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
        }

        if (table === 'payment_history_summary') {
          query.eq.mockResolvedValue({ data: mockHistory, error: null })
        } else if (table === 'payments') {
          query.order.mockResolvedValue({ data: mockPayments, error: null })
        }

        return query
      })

      const filters: ReportFilters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        organizationId: 'org-123',
        reportType: 'payment_history',
      }

      const result = await ReportGeneratorService.generatePaymentHistoryReport(filters)

      expect(result.summary).toEqual(mockHistory)
      expect(result.payments).toEqual(mockPayments)
      expect(result.statistics).toEqual({
        totalAmount: 1500,
        paymentCount: 2,
        averagePayment: 750,
        paymentMethods: {
          card: 1,
          cash: 1,
        },
      })
    })

    it('should filter by student when studentId is provided', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: ReportFilters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        organizationId: 'org-123',
        studentId: 'student-123',
        reportType: 'payment_history',
      }

      await ReportGeneratorService.generatePaymentHistoryReport(filters)

      expect(mockQuery.eq).toHaveBeenCalledWith('student_id', 'student-123')
    })
  })

  describe('generateGroupRevenueAnalysis', () => {
    it('should generate group revenue analysis', async () => {
      const mockAnalysis = [
        {
          group_id: 'group-1',
          group_name: 'Math Group A',
          total_collected: 15000,
          outstanding_amount: 2000,
          total_invoiced: 17000,
        },
      ]

      const mockGroups = [
        {
          id: 'group-1',
          name: 'Math Group A',
          teacher_assignments: [
            { teacher: { first_name: 'John', last_name: 'Teacher' } },
          ],
          enrollments: [{ count: 15 }],
        },
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        const query = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
        }

        if (table === 'group_revenue_analysis') {
          query.order.mockResolvedValue({ data: mockAnalysis, error: null })
        } else if (table === 'groups') {
          query.eq.mockResolvedValue({ data: mockGroups, error: null })
        }

        return query
      })

      const filters: ReportFilters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        organizationId: 'org-123',
        reportType: 'group_analysis',
      }

      const result = await ReportGeneratorService.generateGroupRevenueAnalysis(filters)

      expect(result.analysis).toEqual(mockAnalysis)
      expect(result.groups).toEqual(mockGroups)
      expect(result.summary).toEqual({
        totalGroups: 1,
        totalRevenue: 15000,
        totalOutstanding: 2000,
        averageGroupRevenue: 15000,
      })
    })

    it('should filter by group when groupId is provided', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: ReportFilters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        organizationId: 'org-123',
        groupId: 'group-123',
        reportType: 'group_analysis',
      }

      await ReportGeneratorService.generateGroupRevenueAnalysis(filters)

      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'group-123')
    })
  })

  describe('generateStudentStatement', () => {
    it('should generate complete student statement', async () => {
      const mockStudent = {
        id: 'student-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      }

      const mockAccount = {
        student_id: 'student-1',
        current_balance: 500,
        credit_limit: 1000,
      }

      const mockInvoices = [
        {
          id: 'inv-1',
          invoice_number: 'INV-001',
          total_amount: 1000,
          paid_amount: 500,
          line_items: [
            {
              description: 'Monthly Tuition',
              quantity: 1,
              unit_price: 1000,
              line_total: 1000,
            },
          ],
        },
      ]

      const mockPayments = [
        {
          id: 'pay-1',
          amount: 500,
          payment_date: '2024-01-15',
        },
      ]

      const mockTransactions = [
        {
          id: 'txn-1',
          amount: 500,
          transaction_date: '2024-01-15',
          type: 'payment',
        },
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        const query = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          single: jest.fn(),
        }

        if (table === 'students') {
          query.single.mockResolvedValue({ data: mockStudent, error: null })
        } else if (table === 'student_accounts') {
          query.single.mockResolvedValue({ data: mockAccount, error: null })
        } else if (table === 'invoices') {
          query.order.mockResolvedValue({ data: mockInvoices, error: null })
        } else if (table === 'payments') {
          query.order.mockResolvedValue({ data: mockPayments, error: null })
        } else if (table === 'financial_transactions') {
          query.order.mockResolvedValue({ data: mockTransactions, error: null })
        }

        return query
      })

      const studentId = 'student-1'
      const filters: ReportFilters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        organizationId: 'org-123',
        reportType: 'student_statement',
      }

      const result = await ReportGeneratorService.generateStudentStatement(studentId, filters)

      expect(result.student).toEqual(mockStudent)
      expect(result.account).toEqual(mockAccount)
      expect(result.invoices).toEqual(mockInvoices)
      expect(result.payments).toEqual(mockPayments)
      expect(result.transactions).toEqual(mockTransactions)
      expect(result.summary).toEqual({
        currentBalance: 500,
        totalInvoiced: 1000,
        totalPaid: 500,
        outstandingAmount: 500,
      })
    })
  })

  describe('Export Functions', () => {
    it('should export to Excel format', () => {
      const testData = [
        { name: 'John Doe', amount: 500, date: '2024-01-15' },
        { name: 'Jane Smith', amount: 1000, date: '2024-02-15' },
      ]

      ReportGeneratorService.exportToExcel(testData, 'test_report')

      // Since we're mocking XLSX, we just verify the functions were called
      expect(jest.mocked(require('xlsx').utils.book_new)).toHaveBeenCalled()
      expect(jest.mocked(require('xlsx').utils.json_to_sheet)).toHaveBeenCalledWith(testData)
    })

    it('should export complex data to Excel with multiple sheets', () => {
      const complexData = {
        summary: [{ total: 1500, count: 2 }],
        details: [
          { name: 'John Doe', amount: 500 },
          { name: 'Jane Smith', amount: 1000 },
        ],
      }

      ReportGeneratorService.exportToExcel(complexData, 'complex_report')

      expect(jest.mocked(require('xlsx').utils.json_to_sheet)).toHaveBeenCalledTimes(2)
      expect(jest.mocked(require('xlsx').utils.book_append_sheet)).toHaveBeenCalledTimes(2)
    })

    it('should export to PDF format', () => {
      const testData = [
        { name: 'John Doe', amount: 500, date: '2024-01-15' },
        { name: 'Jane Smith', amount: 1000, date: '2024-02-15' },
      ]

      ReportGeneratorService.exportToPDF(testData, 'test_report', 'Test Report')

      const jsPDFMock = jest.mocked(require('jspdf').default)
      expect(jsPDFMock).toHaveBeenCalled()
    })

    it('should export to CSV format', () => {
      // Mock document and DOM methods for CSV export
      const mockLink = {
        setAttribute: jest.fn(),
        click: jest.fn(),
        style: { visibility: '' },
      }
      
      const mockDocument = {
        createElement: jest.fn().mockReturnValue(mockLink),
        body: {
          appendChild: jest.fn(),
          removeChild: jest.fn(),
        },
      }

      // Mock URL.createObjectURL
      global.URL = {
        createObjectURL: jest.fn().mockReturnValue('blob:mock-url'),
      } as any

      global.document = mockDocument as any

      const testData = [
        { name: 'John Doe', amount: 500, date: '2024-01-15' },
        { name: 'Jane Smith', amount: 1000, date: '2024-02-15' },
      ]

      ReportGeneratorService.exportToCSV(testData, 'test_report')

      expect(mockDocument.createElement).toHaveBeenCalledWith('a')
      expect(mockLink.click).toHaveBeenCalled()
    })

    it('should handle empty data for CSV export', () => {
      ReportGeneratorService.exportToCSV([], 'empty_report')

      // Should return early without creating any DOM elements
      expect(global.document?.createElement).not.toHaveBeenCalled()
    })
  })

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      const largePaymentData = Array.from({ length: 10000 }, (_, i) => ({
        id: `pay-${i}`,
        amount: Math.random() * 1000,
        payment_date: new Date().toISOString(),
        payment_method_type: 'card',
      }))

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: largePaymentData, error: null }),
      }))

      const filters: ReportFilters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        organizationId: 'org-123',
        reportType: 'payment_history',
      }

      const startTime = performance.now()
      const result = await ReportGeneratorService.generatePaymentHistoryReport(filters)
      const endTime = performance.now()

      expect(result.payments).toHaveLength(10000)
      expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
    })
  })

  describe('Error Handling', () => {
    it('should handle Supabase query errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database query failed' } 
        }),
      }))

      const filters: ReportFilters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        organizationId: 'org-123',
        reportType: 'revenue',
      }

      await expect(ReportGeneratorService.generateRevenueReport(filters)).rejects.toThrow()
    })

    it('should handle missing data gracefully', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: null }),
      }))

      const filters: ReportFilters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        organizationId: 'org-123',
        reportType: 'revenue',
      }

      const result = await ReportGeneratorService.generateRevenueReport(filters)

      expect(result.summary).toEqual([])
      expect(result.payments).toEqual([])
      expect(result.transactions).toEqual([])
    })
  })
})