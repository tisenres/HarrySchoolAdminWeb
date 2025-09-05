import { reportsService } from '@/lib/services/reports-service'
import { ImportExportService } from '@/lib/services/import-export-service'

// Mock the ImportExportService
jest.mock('@/lib/services/import-export-service', () => ({
  ImportExportService: {
    exportMultiSheet: jest.fn(),
    exportToExcel: jest.fn(),
    downloadBlob: jest.fn()
  }
}))

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({ data: [], error: null }))
          }))
        }))
      }))
    }))
  }
}))

describe('Reports Export Functionality', () => {
  const mockDateRange = {
    from: new Date('2024-01-01'),
    to: new Date('2024-01-31')
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateExportableData', () => {
    it('should generate exportable revenue report data', async () => {
      const result = await reportsService.generateExportableData('revenue', mockDateRange)
      
      expect(result).toHaveProperty('title', 'Revenue Report')
      expect(result).toHaveProperty('headers')
      expect(result).toHaveProperty('rows')
      expect(result).toHaveProperty('summary')
      expect(result.headers).toEqual(['Month', 'Revenue'])
    })

    it('should generate exportable outstanding balances data', async () => {
      const result = await reportsService.generateExportableData('outstanding', mockDateRange)
      
      expect(result).toHaveProperty('title', 'Outstanding Balances Report')
      expect(result.headers).toEqual(['Student Name', 'Amount Owed', 'Days Overdue'])
      expect(result).toHaveProperty('summary')
      expect(result.summary).toHaveProperty('totalOutstanding')
      expect(result.summary).toHaveProperty('studentsCount')
    })

    it('should generate exportable payment history data', async () => {
      const result = await reportsService.generateExportableData('payment_history', mockDateRange)
      
      expect(result).toHaveProperty('title', 'Payment History Report')
      expect(result.headers).toEqual(['Metric', 'Value'])
      expect(result.rows).toEqual([
        ['Total Payments', 0],
        ['Total Amount', 0], 
        ['Average Payment', 0]
      ])
    })

    it('should throw error for unsupported report types', async () => {
      await expect(
        reportsService.generateExportableData('group_analysis' as any, mockDateRange)
      ).rejects.toThrow('Export not implemented for report type: group_analysis')
    })
  })

  describe('Export Integration', () => {
    it('should call ImportExportService.exportMultiSheet for Excel export', () => {
      const mockExportMultiSheet = ImportExportService.exportMultiSheet as jest.MockedFunction<typeof ImportExportService.exportMultiSheet>
      
      const sheets = [
        {
          name: 'Summary',
          headers: ['Metric', 'Value'],
          data: [['Total Revenue', 1000]]
        },
        {
          name: 'Details', 
          headers: ['Month', 'Revenue'],
          data: [['Jan', 1000]]
        }
      ]
      
      ImportExportService.exportMultiSheet(sheets, 'test_report')
      
      expect(mockExportMultiSheet).toHaveBeenCalledWith(sheets, 'test_report')
    })

    it('should call ImportExportService.exportToExcel for CSV export', () => {
      const mockExportToExcel = ImportExportService.exportToExcel as jest.MockedFunction<typeof ImportExportService.exportToExcel>
      
      const csvData = [
        ['Month', 'Revenue'],
        ['Jan', 1000],
        ['Feb', 1200]
      ]
      
      ImportExportService.exportToExcel(csvData, {
        filename: 'test_report',
        format: 'csv',
        includeHeaders: true
      })
      
      expect(mockExportToExcel).toHaveBeenCalledWith(csvData, {
        filename: 'test_report',
        format: 'csv', 
        includeHeaders: true
      })
    })
  })
})

describe('Report Data Validation', () => {
  const mockDateRange = {
    from: new Date('2024-01-01'),
    to: new Date('2024-01-31')
  }

  it('should handle empty revenue data gracefully', async () => {
    const result = await reportsService.generateExportableData('revenue', mockDateRange)
    
    expect(result.rows).toBeDefined()
    expect(Array.isArray(result.rows)).toBe(true)
    expect(result.summary).toHaveProperty('totalRevenue')
  })

  it('should handle empty outstanding balances gracefully', async () => {
    const result = await reportsService.generateExportableData('outstanding', mockDateRange)
    
    expect(result.rows).toBeDefined()
    expect(Array.isArray(result.rows)).toBe(true)
    expect(result.summary.totalOutstanding).toBe(0)
    expect(result.summary.studentsCount).toBe(0)
  })

  it('should format date range correctly', async () => {
    const result = await reportsService.generateExportableData('revenue', mockDateRange)
    
    expect(result.dateRange).toContain('1/1/2024')
    expect(result.dateRange).toContain('1/31/2024')
  })
})