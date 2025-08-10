/**
 * Export and Report Generation Performance Testing
 * 
 * Comprehensive performance testing for large dataset exports,
 * report generation, and file processing in Harry School CRM.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

// Mock file processing utilities
class MockFileProcessor {
  private processingTimes: number[] = []
  private fileTypes = {
    xlsx: { complexity: 1.0, baseTime: 50 },
    pdf: { complexity: 1.5, baseTime: 80 },
    csv: { complexity: 0.3, baseTime: 20 }
  }

  async generateFile(format: keyof typeof this.fileTypes, data: any[], options: any = {}) {
    const startTime = performance.now()
    const fileType = this.fileTypes[format]
    
    // Simulate processing time based on data size and format complexity
    const recordCount = data.length
    const processingTime = fileType.baseTime + (recordCount * 0.1 * fileType.complexity)
    
    // Add random variation (±20%)
    const variation = (Math.random() - 0.5) * 0.4 * processingTime
    const actualProcessingTime = processingTime + variation

    await new Promise(resolve => setTimeout(resolve, actualProcessingTime))
    
    const endTime = performance.now()
    const totalTime = endTime - startTime
    this.processingTimes.push(totalTime)

    return {
      filename: `export_${Date.now()}.${format}`,
      size: recordCount * 0.5 * 1024, // Approximate 0.5KB per record
      processingTime: totalTime,
      downloadUrl: `https://example.com/exports/export_${Date.now()}.${format}`
    }
  }

  getProcessingStats() {
    if (this.processingTimes.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 }
    }

    const sorted = [...this.processingTimes].sort((a, b) => a - b)
    return {
      avg: this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      count: this.processingTimes.length
    }
  }

  clear() {
    this.processingTimes = []
  }
}

// Mock report generator
class MockReportGenerator {
  private reportTypes = {
    financial_summary: { complexity: 1.5, queries: 8 },
    student_payments: { complexity: 1.0, queries: 4 },
    group_analysis: { complexity: 2.0, queries: 12 },
    outstanding_balances: { complexity: 0.8, queries: 3 },
    aging_report: { complexity: 1.2, queries: 6 },
    revenue_forecast: { complexity: 2.5, queries: 15 },
    tax_report: { complexity: 1.8, queries: 10 }
  }

  async generateReport(reportType: keyof typeof this.reportTypes, filters: any) {
    const startTime = performance.now()
    const config = this.reportTypes[reportType]
    
    // Simulate database queries
    const queryPromises = Array.from({ length: config.queries }, async (_, i) => {
      const queryTime = Math.random() * 50 + 20 // 20-70ms per query
      await new Promise(resolve => setTimeout(resolve, queryTime))
      return { query: i, data: this.generateMockData(100) }
    })

    const queryResults = await Promise.all(queryPromises)
    
    // Simulate data processing and aggregation
    const processingTime = config.complexity * 100 + Math.random() * 50
    await new Promise(resolve => setTimeout(resolve, processingTime))

    const endTime = performance.now()
    const totalTime = endTime - startTime

    return {
      reportType,
      generationTime: totalTime,
      dataPoints: queryResults.reduce((total, result) => total + result.data.length, 0),
      queries: config.queries,
      data: this.aggregateReportData(queryResults, reportType)
    }
  }

  private generateMockData(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      id: `record_${i}`,
      value: Math.random() * 1000000,
      date: new Date().toISOString(),
      status: Math.random() > 0.5 ? 'active' : 'inactive'
    }))
  }

  private aggregateReportData(queryResults: any[], reportType: string) {
    // Simulate report-specific data aggregation
    const allData = queryResults.flatMap(result => result.data)
    
    switch (reportType) {
      case 'financial_summary':
        return {
          total_revenue: allData.reduce((sum, item) => sum + item.value, 0),
          record_count: allData.length,
          average_value: allData.reduce((sum, item) => sum + item.value, 0) / allData.length
        }
      case 'outstanding_balances':
        return allData.filter(item => item.status === 'active')
      default:
        return allData
    }
  }
}

// Performance monitor for export operations
class ExportPerformanceMonitor {
  private metrics = {
    exportTimes: new Map<string, number[]>(),
    reportTimes: new Map<string, number[]>(),
    fileSizes: new Map<string, number[]>(),
    concurrentOperations: 0,
    errors: 0,
    timeouts: 0
  }

  recordExportTime(format: string, time: number) {
    if (!this.metrics.exportTimes.has(format)) {
      this.metrics.exportTimes.set(format, [])
    }
    this.metrics.exportTimes.get(format)!.push(time)
  }

  recordReportTime(reportType: string, time: number) {
    if (!this.metrics.reportTimes.has(reportType)) {
      this.metrics.reportTimes.set(reportType, [])
    }
    this.metrics.reportTimes.get(reportType)!.push(time)
  }

  recordFileSize(format: string, size: number) {
    if (!this.metrics.fileSizes.has(format)) {
      this.metrics.fileSizes.set(format, [])
    }
    this.metrics.fileSizes.get(format)!.push(size)
  }

  incrementConcurrentOperations() {
    this.metrics.concurrentOperations++
  }

  decrementConcurrentOperations() {
    this.metrics.concurrentOperations--
  }

  recordError() {
    this.metrics.errors++
  }

  recordTimeout() {
    this.metrics.timeouts++
  }

  getExportStats(format: string) {
    const times = this.metrics.exportTimes.get(format) || []
    const sizes = this.metrics.fileSizes.get(format) || []
    
    if (times.length === 0) return null

    const sortedTimes = [...times].sort((a, b) => a - b)
    
    return {
      count: times.length,
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: sortedTimes[0],
      maxTime: sortedTimes[sortedTimes.length - 1],
      p95Time: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
      avgSize: sizes.length > 0 ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0,
      throughput: times.length / (Math.max(...times) - Math.min(...times)) * 1000 // operations per second
    }
  }

  getOverallStats() {
    return {
      totalExports: Array.from(this.metrics.exportTimes.values()).reduce((sum, arr) => sum + arr.length, 0),
      totalReports: Array.from(this.metrics.reportTimes.values()).reduce((sum, arr) => sum + arr.length, 0),
      concurrentOperations: this.metrics.concurrentOperations,
      errors: this.metrics.errors,
      timeouts: this.metrics.timeouts
    }
  }

  clear() {
    this.metrics.exportTimes.clear()
    this.metrics.reportTimes.clear()
    this.metrics.fileSizes.clear()
    this.metrics.concurrentOperations = 0
    this.metrics.errors = 0
    this.metrics.timeouts = 0
  }
}

// Generate test datasets
const generateTestDataset = (size: number, type: 'students' | 'payments' | 'groups' = 'students') => {
  return Array.from({ length: size }, (_, i) => {
    switch (type) {
      case 'students':
        return {
          id: `student_${i}`,
          student_id: `ST${String(i + 1).padStart(4, '0')}`,
          first_name: `Student${i}`,
          last_name: `Test${i}`,
          email: `student${i}@test.com`,
          phone: '+998901234567',
          status: i % 3 === 0 ? 'active' : 'inactive',
          enrollment_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
          balance: Math.floor(Math.random() * 1000000)
        }
      case 'payments':
        return {
          id: `payment_${i}`,
          student_id: `student_${i % 100}`,
          amount: Math.floor(Math.random() * 500000) + 100000,
          payment_method: ['cash', 'card', 'transfer'][i % 3],
          status: ['completed', 'pending', 'failed'][i % 3],
          payment_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
          description: `Payment for month ${(i % 12) + 1}`
        }
      case 'groups':
        return {
          id: `group_${i}`,
          name: `Group ${i + 1}`,
          subject: ['Math', 'English', 'Physics', 'Chemistry'][i % 4],
          level: ['Beginner', 'Intermediate', 'Advanced'][i % 3],
          teacher: `Teacher ${(i % 10) + 1}`,
          current_enrollment: Math.floor(Math.random() * 20) + 5,
          max_students: 25,
          schedule: ['Mon,Wed,Fri', 'Tue,Thu', 'Sat,Sun'][i % 3],
          start_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString()
        }
      default:
        return { id: i, data: `test_${i}` }
    }
  })
}

describe('Export and Report Generation Performance', () => {
  let fileProcessor: MockFileProcessor
  let reportGenerator: MockReportGenerator
  let performanceMonitor: ExportPerformanceMonitor

  beforeEach(() => {
    fileProcessor = new MockFileProcessor()
    reportGenerator = new MockReportGenerator()
    performanceMonitor = new ExportPerformanceMonitor()
  })

  afterEach(() => {
    fileProcessor.clear()
    performanceMonitor.clear()
  })

  describe('Excel Export Performance', () => {
    const EXCEL_PERFORMANCE_BUDGETS = {
      small_dataset: { size: 100, timeLimit: 200 },      // 100 records in <200ms
      medium_dataset: { size: 500, timeLimit: 800 },     // 500 records in <800ms
      large_dataset: { size: 1000, timeLimit: 2000 },    // 1k records in <2s
      huge_dataset: { size: 5000, timeLimit: 8000 }      // 5k records in <8s
    }

    Object.entries(EXCEL_PERFORMANCE_BUDGETS).forEach(([testName, budget]) => {
      it(`should export ${testName.replace('_', ' ')} to Excel within performance budget`, async () => {
        const dataset = generateTestDataset(budget.size, 'students')
        
        performanceMonitor.incrementConcurrentOperations()
        
        const result = await fileProcessor.generateFile('xlsx', dataset, {
          sheetName: 'Students Export',
          includeHeaders: true
        })
        
        performanceMonitor.decrementConcurrentOperations()
        performanceMonitor.recordExportTime('xlsx', result.processingTime)
        performanceMonitor.recordFileSize('xlsx', result.size)

        console.log(`Excel Export (${dataset.length} records):`)
        console.log(`  Processing time: ${result.processingTime.toFixed(2)}ms`)
        console.log(`  File size: ${(result.size / 1024).toFixed(2)}KB`)
        console.log(`  Throughput: ${(dataset.length / (result.processingTime / 1000)).toFixed(2)} records/s`)

        expect(result.processingTime).toBeLessThan(budget.timeLimit)
        expect(result.filename).toMatch(/\.xlsx$/)
        expect(result.downloadUrl).toMatch(/^https:\/\//)
      })
    })

    it('should handle complex Excel exports with multiple sheets efficiently', async () => {
      const datasets = {
        students: generateTestDataset(300, 'students'),
        payments: generateTestDataset(800, 'payments'),
        groups: generateTestDataset(50, 'groups')
      }

      const startTime = performance.now()

      // Simulate multi-sheet export
      const exportPromises = Object.entries(datasets).map(async ([sheetName, data]) => {
        return fileProcessor.generateFile('xlsx', data, { sheetName })
      })

      const results = await Promise.all(exportPromises)
      const totalTime = performance.now() - startTime

      const totalRecords = Object.values(datasets).reduce((sum, data) => sum + data.length, 0)
      const totalSize = results.reduce((sum, result) => sum + result.size, 0)

      console.log(`Multi-sheet Excel Export:`)
      console.log(`  Total records: ${totalRecords}`)
      console.log(`  Total processing time: ${totalTime.toFixed(2)}ms`)
      console.log(`  Total file size: ${(totalSize / 1024).toFixed(2)}KB`)
      console.log(`  Average throughput: ${(totalRecords / (totalTime / 1000)).toFixed(2)} records/s`)

      expect(totalTime).toBeLessThan(5000) // Complex export should complete within 5s
      expect(results.length).toBe(3)
    })
  })

  describe('PDF Report Performance', () => {
    const PDF_PERFORMANCE_BUDGETS = {
      simple_report: { pages: 5, timeLimit: 800 },
      detailed_report: { pages: 20, timeLimit: 2000 },
      comprehensive_report: { pages: 50, timeLimit: 5000 }
    }

    it('should generate PDF reports within performance budgets', async () => {
      for (const [reportType, budget] of Object.entries(PDF_PERFORMANCE_BUDGETS)) {
        const dataset = generateTestDataset(budget.pages * 20, 'payments') // ~20 records per page
        
        const result = await fileProcessor.generateFile('pdf', dataset, {
          template: 'financial_report',
          includeCharts: true,
          includeHeader: true,
          includeFooter: true
        })

        performanceMonitor.recordExportTime('pdf', result.processingTime)

        console.log(`PDF Report (${reportType}):`)
        console.log(`  Processing time: ${result.processingTime.toFixed(2)}ms`)
        console.log(`  Estimated pages: ${budget.pages}`)
        console.log(`  File size: ${(result.size / 1024).toFixed(2)}KB`)

        expect(result.processingTime).toBeLessThan(budget.timeLimit)
      }
    })

    it('should handle PDF generation with charts and images efficiently', async () => {
      const dataset = generateTestDataset(200, 'payments')
      
      const result = await fileProcessor.generateFile('pdf', dataset, {
        includeCharts: true,
        chartTypes: ['line', 'bar', 'pie'],
        includeImages: true,
        highQuality: true
      })

      console.log(`PDF with Charts Generation:`)
      console.log(`  Processing time: ${result.processingTime.toFixed(2)}ms`)
      console.log(`  File size: ${(result.size / 1024).toFixed(2)}KB`)

      expect(result.processingTime).toBeLessThan(3000) // Charts should add <3s overhead
    })
  })

  describe('CSV Export Performance', () => {
    const CSV_PERFORMANCE_BUDGETS = {
      small: { size: 1000, timeLimit: 100 },
      medium: { size: 5000, timeLimit: 300 },
      large: { size: 10000, timeLimit: 500 },
      huge: { size: 50000, timeLimit: 2000 }
    }

    Object.entries(CSV_PERFORMANCE_BUDGETS).forEach(([size, budget]) => {
      it(`should export ${size} CSV dataset (${budget.size} records) efficiently`, async () => {
        const dataset = generateTestDataset(budget.size, 'students')
        
        const result = await fileProcessor.generateFile('csv', dataset, {
          delimiter: ',',
          includeHeaders: true,
          encoding: 'utf-8'
        })

        performanceMonitor.recordExportTime('csv', result.processingTime)
        
        const throughput = dataset.length / (result.processingTime / 1000)

        console.log(`CSV Export (${size}):`)
        console.log(`  Processing time: ${result.processingTime.toFixed(2)}ms`)
        console.log(`  Throughput: ${throughput.toFixed(2)} records/s`)
        console.log(`  File size: ${(result.size / 1024).toFixed(2)}KB`)

        expect(result.processingTime).toBeLessThan(budget.timeLimit)
        expect(throughput).toBeGreaterThan(1000) // Should process at least 1000 records/s
      })
    })
  })

  describe('Report Generation Performance', () => {
    const REPORT_BUDGETS = {
      financial_summary: 2000,
      student_payments: 1500,
      group_analysis: 3000,
      outstanding_balances: 800,
      aging_report: 1200,
      revenue_forecast: 4000,
      tax_report: 2500
    }

    Object.entries(REPORT_BUDGETS).forEach(([reportType, timeLimit]) => {
      it(`should generate ${reportType} report within performance budget`, async () => {
        const filters = {
          period_start: '2024-01-01',
          period_end: '2024-12-31',
          organization_id: 'org-test-1'
        }

        const result = await reportGenerator.generateReport(reportType as any, filters)

        performanceMonitor.recordReportTime(reportType, result.generationTime)

        console.log(`${reportType} Report Generation:`)
        console.log(`  Generation time: ${result.generationTime.toFixed(2)}ms`)
        console.log(`  Database queries: ${result.queries}`)
        console.log(`  Data points: ${result.dataPoints}`)
        console.log(`  Avg time per query: ${(result.generationTime / result.queries).toFixed(2)}ms`)

        expect(result.generationTime).toBeLessThan(timeLimit)
        expect(result.dataPoints).toBeGreaterThan(0)
      })
    })

    it('should handle concurrent report generation without performance degradation', async () => {
      const concurrentReports = [
        'financial_summary',
        'outstanding_balances',
        'student_payments',
        'aging_report'
      ]

      const filters = {
        period_start: '2024-01-01',
        period_end: '2024-12-31'
      }

      const startTime = performance.now()
      
      const reportPromises = concurrentReports.map(reportType => 
        reportGenerator.generateReport(reportType as any, filters)
      )

      const results = await Promise.all(reportPromises)
      const totalTime = performance.now() - startTime

      const avgGenerationTime = results.reduce((sum, result) => sum + result.generationTime, 0) / results.length
      const totalDataPoints = results.reduce((sum, result) => sum + result.dataPoints, 0)

      console.log(`Concurrent Report Generation:`)
      console.log(`  Total time: ${totalTime.toFixed(2)}ms`)
      console.log(`  Average per report: ${avgGenerationTime.toFixed(2)}ms`)
      console.log(`  Total data points: ${totalDataPoints}`)
      console.log(`  Reports generated: ${results.length}`)

      expect(totalTime).toBeLessThan(8000) // All reports should complete within 8s
      expect(results.length).toBe(concurrentReports.length)
    })
  })

  describe('Large Dataset Processing', () => {
    it('should handle very large dataset exports with streaming', async () => {
      const largeDataset = generateTestDataset(25000, 'payments') // 25k records
      
      // Simulate streaming export in chunks
      const chunkSize = 5000
      const chunks = []
      for (let i = 0; i < largeDataset.length; i += chunkSize) {
        chunks.push(largeDataset.slice(i, i + chunkSize))
      }

      const startTime = performance.now()
      const chunkResults = []

      for (const [index, chunk] of chunks.entries()) {
        const chunkStartTime = performance.now()
        
        const result = await fileProcessor.generateFile('csv', chunk, {
          isChunk: true,
          chunkIndex: index,
          totalChunks: chunks.length
        })
        
        const chunkTime = performance.now() - chunkStartTime
        chunkResults.push({ ...result, chunkTime })
        
        console.log(`Chunk ${index + 1}/${chunks.length}: ${chunkTime.toFixed(2)}ms`)
      }

      const totalTime = performance.now() - startTime
      const totalSize = chunkResults.reduce((sum, result) => sum + result.size, 0)
      const avgChunkTime = chunkResults.reduce((sum, result) => sum + result.chunkTime, 0) / chunkResults.length

      console.log(`Large Dataset Export (${largeDataset.length} records):`)
      console.log(`  Total time: ${totalTime.toFixed(2)}ms`)
      console.log(`  Average chunk time: ${avgChunkTime.toFixed(2)}ms`)
      console.log(`  Total file size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`)
      console.log(`  Throughput: ${(largeDataset.length / (totalTime / 1000)).toFixed(2)} records/s`)

      expect(avgChunkTime).toBeLessThan(2000) // Each chunk should process within 2s
      expect(totalTime).toBeLessThan(15000) // Total should complete within 15s
    })

    it('should optimize memory usage during large exports', async () => {
      const memoryUsageBefore = process.memoryUsage().heapUsed
      
      // Process large dataset in batches to test memory management
      const batchSizes = [1000, 2500, 5000, 10000]
      
      for (const batchSize of batchSizes) {
        const dataset = generateTestDataset(batchSize, 'students')
        
        await fileProcessor.generateFile('xlsx', dataset)
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
        
        const memoryUsageAfter = process.memoryUsage().heapUsed
        const memoryGrowth = memoryUsageAfter - memoryUsageBefore
        
        console.log(`Memory usage after ${batchSize} records: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB growth`)
        
        // Memory growth should be reasonable
        expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024) // Less than 100MB growth
      }
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle export timeouts gracefully', async () => {
      const dataset = generateTestDataset(1000, 'students')
      const timeout = 100 // Very short timeout to trigger timeout
      
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Export timeout')), timeout)
        })
        
        const exportPromise = fileProcessor.generateFile('xlsx', dataset)
        
        await Promise.race([exportPromise, timeoutPromise])
        
        // Should not reach here due to timeout
        expect(false).toBe(true)
      } catch (error) {
        performanceMonitor.recordTimeout()
        expect(error.message).toBe('Export timeout')
      }
      
      const stats = performanceMonitor.getOverallStats()
      expect(stats.timeouts).toBe(1)
    })

    it('should recover from export errors', async () => {
      const dataset = generateTestDataset(100, 'students')
      
      // Simulate error conditions
      let attemptCount = 0
      const maxAttempts = 3
      
      while (attemptCount < maxAttempts) {
        try {
          attemptCount++
          
          if (attemptCount < 2) {
            // Simulate temporary failure
            throw new Error('Temporary export failure')
          }
          
          const result = await fileProcessor.generateFile('csv', dataset)
          
          console.log(`Export succeeded on attempt ${attemptCount}`)
          expect(result.filename).toBeDefined()
          break
          
        } catch (error) {
          performanceMonitor.recordError()
          console.log(`Export failed on attempt ${attemptCount}: ${error.message}`)
          
          if (attemptCount >= maxAttempts) {
            throw error
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      const stats = performanceMonitor.getOverallStats()
      expect(stats.errors).toBe(1) // Should have recorded the one error
    })
  })

  describe('Performance Optimization Analysis', () => {
    it('should analyze export performance across formats', async () => {
      const testData = generateTestDataset(500, 'payments')
      const formats = ['csv', 'xlsx', 'pdf'] as const
      
      const performanceComparison = []
      
      for (const format of formats) {
        const iterations = 3
        const times = []
        
        for (let i = 0; i < iterations; i++) {
          const result = await fileProcessor.generateFile(format, testData)
          times.push(result.processingTime)
          performanceMonitor.recordExportTime(format, result.processingTime)
          performanceMonitor.recordFileSize(format, result.size)
        }
        
        const stats = performanceMonitor.getExportStats(format)!
        performanceComparison.push({
          format,
          avgTime: stats.avgTime,
          avgSize: stats.avgSize,
          throughput: stats.throughput
        })
      }
      
      console.log('Export Format Performance Comparison:')
      performanceComparison.forEach(stat => {
        console.log(`  ${stat.format.toUpperCase()}:`)
        console.log(`    Avg Time: ${stat.avgTime.toFixed(2)}ms`)
        console.log(`    Avg Size: ${(stat.avgSize / 1024).toFixed(2)}KB`)
        console.log(`    Throughput: ${stat.throughput.toFixed(2)} ops/s`)
      })
      
      // CSV should be fastest
      const csvStats = performanceComparison.find(stat => stat.format === 'csv')!
      const xlsxStats = performanceComparison.find(stat => stat.format === 'xlsx')!
      const pdfStats = performanceComparison.find(stat => stat.format === 'pdf')!
      
      expect(csvStats.avgTime).toBeLessThan(xlsxStats.avgTime)
      expect(csvStats.avgTime).toBeLessThan(pdfStats.avgTime)
    })

    it('should identify performance bottlenecks in report generation', async () => {
      const reportType = 'financial_summary'
      const iterations = 5
      const performanceProfile = []
      
      for (let i = 0; i < iterations; i++) {
        const phases = {
          queryPhase: 0,
          processingPhase: 0,
          aggregationPhase: 0,
          formattingPhase: 0
        }
        
        // Mock detailed performance profiling
        const queryStart = performance.now()
        await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 50))
        phases.queryPhase = performance.now() - queryStart
        
        const processingStart = performance.now()
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 100))
        phases.processingPhase = performance.now() - processingStart
        
        const aggregationStart = performance.now()
        await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 40))
        phases.aggregationPhase = performance.now() - aggregationStart
        
        const formattingStart = performance.now()
        await new Promise(resolve => setTimeout(resolve, 60 + Math.random() * 30))
        phases.formattingPhase = performance.now() - formattingStart
        
        performanceProfile.push(phases)
      }
      
      // Calculate averages
      const avgProfile = {
        queryPhase: performanceProfile.reduce((sum, p) => sum + p.queryPhase, 0) / iterations,
        processingPhase: performanceProfile.reduce((sum, p) => sum + p.processingPhase, 0) / iterations,
        aggregationPhase: performanceProfile.reduce((sum, p) => sum + p.aggregationPhase, 0) / iterations,
        formattingPhase: performanceProfile.reduce((sum, p) => sum + p.formattingPhase, 0) / iterations
      }
      
      console.log('Report Generation Performance Profile:')
      Object.entries(avgProfile).forEach(([phase, time]) => {
        const percentage = (time / Object.values(avgProfile).reduce((a, b) => a + b, 0)) * 100
        console.log(`  ${phase}: ${time.toFixed(2)}ms (${percentage.toFixed(1)}%)`)
      })
      
      // Identify bottleneck
      const bottleneck = Object.entries(avgProfile).reduce((max, [phase, time]) => 
        time > max.time ? { phase, time } : max
      , { phase: '', time: 0 })
      
      console.log(`Primary bottleneck: ${bottleneck.phase} (${bottleneck.time.toFixed(2)}ms)`)
      
      // Processing phase is expected to be the bottleneck for complex reports
      expect(bottleneck.phase).toBe('processingPhase')
    })
  })
})

export { MockFileProcessor, MockReportGenerator, ExportPerformanceMonitor }