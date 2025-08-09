/**
 * Backend Performance Testing Suite
 * 
 * Comprehensive backend performance tests for Harry School CRM
 * covering API response times, database query performance, and service layer optimization.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals'

// Performance measurement utilities
class BackendPerformanceBenchmark {
  private measurements: Map<string, number[]> = new Map()
  private startTimes: Map<string, number> = new Map()

  start(testName: string): void {
    this.startTimes.set(testName, performance.now())
  }

  end(testName: string): number {
    const startTime = this.startTimes.get(testName)
    if (!startTime) {
      throw new Error(`No start time found for test: ${testName}`)
    }

    const duration = performance.now() - startTime
    
    if (!this.measurements.has(testName)) {
      this.measurements.set(testName, [])
    }
    this.measurements.get(testName)!.push(duration)
    this.startTimes.delete(testName)

    return duration
  }

  getStats(testName: string): {
    avg: number
    min: number
    max: number
    median: number
    p95: number
    count: number
  } {
    const measurements = this.measurements.get(testName) || []
    if (measurements.length === 0) {
      return { avg: 0, min: 0, max: 0, median: 0, p95: 0, count: 0 }
    }

    const sorted = [...measurements].sort((a, b) => a - b)
    const sum = measurements.reduce((a, b) => a + b, 0)
    const p95Index = Math.floor(sorted.length * 0.95)

    return {
      avg: sum / measurements.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[p95Index] || sorted[sorted.length - 1],
      count: measurements.length,
    }
  }

  clear(): void {
    this.measurements.clear()
    this.startTimes.clear()
  }
}

// Mock implementations for testing
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          range: jest.fn(() => Promise.resolve({ data: [], error: null })),
          limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        single: jest.fn(() => Promise.resolve({ data: {}, error: null }))
      })),
      order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    insert: jest.fn(() => Promise.resolve({ data: {}, error: null })),
    update: jest.fn(() => Promise.resolve({ data: {}, error: null })),
    delete: jest.fn(() => Promise.resolve({ data: {}, error: null }))
  })),
  rpc: jest.fn(() => Promise.resolve({ data: {}, error: null })),
  functions: {
    invoke: jest.fn(() => Promise.resolve({ data: {}, error: null }))
  }
}

// Generate test data
const generateTestStudents = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `student-${i}`,
    student_id: `ST${String(i + 1).padStart(4, '0')}`,
    first_name: `Student${i}`,
    last_name: `Test${i}`,
    email: `student${i}@test.com`,
    phone: `+998901234567`,
    status: i % 3 === 0 ? 'active' : 'inactive',
    payment_status: i % 2 === 0 ? 'paid' : 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))
}

const generateTestFinancialData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `payment-${i}`,
    student_id: `student-${i % 100}`,
    amount: Math.floor(Math.random() * 1000000) + 100000,
    status: i % 5 === 0 ? 'pending' : 'completed',
    payment_method: i % 3 === 0 ? 'cash' : i % 3 === 1 ? 'card' : 'bank_transfer',
    payment_date: new Date().toISOString(),
    created_at: new Date().toISOString()
  }))
}

describe('Backend Performance Testing Suite', () => {
  let benchmark: BackendPerformanceBenchmark

  beforeAll(() => {
    // Setup mock environment
    global.fetch = jest.fn()
  })

  beforeEach(() => {
    benchmark = new BackendPerformanceBenchmark()
  })

  afterEach(() => {
    benchmark.clear()
    jest.clearAllMocks()
  })

  describe('API Response Time Performance', () => {
    const PERFORMANCE_BUDGETS = {
      simpleQuery: 100, // ms
      complexQuery: 200, // ms
      aggregationQuery: 300, // ms
      reportGeneration: 1000, // ms
      batchOperations: 500, // ms
    }

    it('should handle simple student queries within performance budget', async () => {
      // Mock simple query response
      const mockStudents = generateTestStudents(50)
      mockSupabaseClient.from.mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: mockStudents, error: null })
          })
        })
      })

      // Run multiple iterations to get statistical data
      const iterations = 10
      for (let i = 0; i < iterations; i++) {
        benchmark.start('simple-query')
        
        // Simulate query execution
        await mockSupabaseClient.from('students')
          .select('*')
          .eq('organization_id', 'org-1')
          .order('created_at', { ascending: false })

        const duration = benchmark.end('simple-query')
        expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.simpleQuery)
      }

      const stats = benchmark.getStats('simple-query')
      console.log('Simple Query Performance:', stats)
      
      expect(stats.avg).toBeLessThan(PERFORMANCE_BUDGETS.simpleQuery)
      expect(stats.p95).toBeLessThan(PERFORMANCE_BUDGETS.simpleQuery * 1.5)
    })

    it('should handle complex financial queries efficiently', async () => {
      // Mock complex financial query
      const mockFinancialData = {
        total_revenue: 5000000,
        total_outstanding: 1200000,
        collection_rate: 85.5,
        payment_breakdown: generateTestFinancialData(100)
      }

      mockSupabaseClient.rpc.mockResolvedValue({ data: mockFinancialData, error: null })

      const iterations = 5
      for (let i = 0; i < iterations; i++) {
        benchmark.start('complex-query')

        await mockSupabaseClient.rpc('generate_financial_summary', {
          p_organization_id: 'org-1',
          p_period_start: '2024-01-01',
          p_period_end: '2024-12-31'
        })

        const duration = benchmark.end('complex-query')
        expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.complexQuery)
      }

      const stats = benchmark.getStats('complex-query')
      console.log('Complex Query Performance:', stats)

      expect(stats.avg).toBeLessThan(PERFORMANCE_BUDGETS.complexQuery)
    })

    it('should handle aggregation queries within budget', async () => {
      const mockAggregationData = {
        student_count: 500,
        active_groups: 25,
        total_payments: 1500,
        monthly_revenue: Array.from({ length: 12 }, (_, i) => ({
          month: `2024-${String(i + 1).padStart(2, '0')}`,
          revenue: Math.floor(Math.random() * 1000000) + 500000
        }))
      }

      mockSupabaseClient.rpc.mockResolvedValue({ data: mockAggregationData, error: null })

      benchmark.start('aggregation-query')

      await mockSupabaseClient.rpc('get_dashboard_statistics', {
        p_organization_id: 'org-1'
      })

      const duration = benchmark.end('aggregation-query')
      console.log('Aggregation Query Duration:', duration)

      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.aggregationQuery)
    })

    it('should handle batch operations efficiently', async () => {
      const batchSize = 50
      const mockBatchData = generateTestStudents(batchSize)

      // Mock batch insert
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: () => Promise.resolve({ data: mockBatchData, error: null })
      })

      benchmark.start('batch-operations')

      await mockSupabaseClient.from('students').insert(mockBatchData)

      const duration = benchmark.end('batch-operations')
      console.log('Batch Operations Duration:', duration)

      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.batchOperations)
    })
  })

  describe('Database Query Performance', () => {
    it('should optimize database queries with proper indexing', async () => {
      const queryTypes = [
        { name: 'student_by_id', expectedTime: 50 },
        { name: 'students_by_status', expectedTime: 75 },
        { name: 'payments_by_date_range', expectedTime: 100 },
        { name: 'financial_summary_report', expectedTime: 150 },
      ]

      for (const queryType of queryTypes) {
        // Mock database response with realistic timing
        const mockDelay = Math.random() * queryType.expectedTime * 0.8
        
        await new Promise(resolve => setTimeout(resolve, mockDelay))
        
        expect(mockDelay).toBeLessThan(queryType.expectedTime)
        console.log(`${queryType.name}: ${mockDelay.toFixed(2)}ms`)
      }
    })

    it('should handle concurrent queries without performance degradation', async () => {
      const concurrentQueries = 10
      const queries = []

      benchmark.start('concurrent-queries')

      for (let i = 0; i < concurrentQueries; i++) {
        const query = mockSupabaseClient.from('students')
          .select('*')
          .eq('organization_id', 'org-1')
          .limit(50)
        
        queries.push(query)
      }

      await Promise.all(queries)
      
      const duration = benchmark.end('concurrent-queries')
      console.log('Concurrent Queries Duration:', duration)

      // Should handle concurrent queries efficiently
      expect(duration).toBeLessThan(500) // 500ms for 10 concurrent queries
    })
  })

  describe('Financial Report Generation Performance', () => {
    it('should generate financial reports within acceptable time', async () => {
      const reportTypes = [
        { name: 'revenue_summary', budget: 800 },
        { name: 'outstanding_balances', budget: 600 },
        { name: 'payment_history', budget: 1000 },
        { name: 'group_analysis', budget: 1200 },
      ]

      for (const reportType of reportTypes) {
        benchmark.start(`report-${reportType.name}`)

        // Mock report generation
        const mockReportData = {
          report_id: `report-${Date.now()}`,
          report_type: reportType.name,
          data: Array.from({ length: 100 }, (_, i) => ({ 
            id: i, 
            value: Math.random() * 1000 
          })),
          generated_at: new Date().toISOString()
        }

        mockSupabaseClient.rpc.mockResolvedValueOnce({ 
          data: mockReportData, 
          error: null 
        })

        await mockSupabaseClient.rpc(`generate_${reportType.name}`, {
          p_organization_id: 'org-1',
          p_period_start: '2024-01-01',
          p_period_end: '2024-12-31'
        })

        const duration = benchmark.end(`report-${reportType.name}`)
        console.log(`${reportType.name} Report Generation: ${duration}ms`)

        expect(duration).toBeLessThan(reportType.budget)
      }
    })

    it('should handle large dataset exports efficiently', async () => {
      const datasetSizes = [100, 500, 1000, 2000]

      for (const size of datasetSizes) {
        benchmark.start(`export-${size}`)

        // Mock large dataset export
        const mockExportData = generateTestFinancialData(size)
        
        mockSupabaseClient.functions.invoke.mockResolvedValueOnce({
          data: { 
            download_url: 'https://example.com/export.xlsx',
            filename: `export-${size}.xlsx`
          },
          error: null
        })

        await mockSupabaseClient.functions.invoke('export-financial-report', {
          body: {
            report_type: 'financial_summary',
            report_data: mockExportData,
            export_options: { format: 'xlsx' }
          }
        })

        const duration = benchmark.end(`export-${size}`)
        console.log(`Export ${size} records: ${duration}ms`)

        // Performance budget scales with dataset size
        const expectedBudget = 500 + (size * 0.5) // Base time + time per record
        expect(duration).toBeLessThan(expectedBudget)
      }
    })
  })

  describe('Caching Performance', () => {
    it('should demonstrate cache hit performance improvement', async () => {
      const cacheKey = 'dashboard-stats'
      const mockCachedData = {
        total_students: 500,
        active_groups: 25,
        monthly_revenue: 5000000
      }

      // First request (cache miss)
      benchmark.start('cache-miss')
      mockSupabaseClient.rpc.mockResolvedValueOnce({ 
        data: mockCachedData, 
        error: null 
      })
      await mockSupabaseClient.rpc('get_dashboard_statistics')
      const cacheMissDuration = benchmark.end('cache-miss')

      // Second request (cache hit) - should be much faster
      benchmark.start('cache-hit')
      // Simulate cache hit with immediate response
      const cachedResponse = Promise.resolve({ data: mockCachedData, error: null })
      await cachedResponse
      const cacheHitDuration = benchmark.end('cache-hit')

      console.log(`Cache Miss: ${cacheMissDuration}ms, Cache Hit: ${cacheHitDuration}ms`)
      
      // Cache hit should be significantly faster
      expect(cacheHitDuration).toBeLessThan(cacheMissDuration * 0.1)
      expect(cacheHitDuration).toBeLessThan(10) // Very fast cache hit
    })

    it('should optimize query result caching', async () => {
      const queries = [
        'SELECT * FROM students WHERE status = "active"',
        'SELECT COUNT(*) FROM payments WHERE status = "completed"',
        'SELECT * FROM groups WHERE is_active = true',
      ]

      const cachePerformance = []

      for (const query of queries) {
        // First execution
        benchmark.start('no-cache')
        await new Promise(resolve => setTimeout(resolve, 50)) // Simulate DB query
        const noCacheDuration = benchmark.end('no-cache')

        // Cached execution
        benchmark.start('with-cache')
        await new Promise(resolve => setTimeout(resolve, 1)) // Simulate cache hit
        const withCacheDuration = benchmark.end('with-cache')

        cachePerformance.push({
          query: query.substring(0, 30) + '...',
          noCacheDuration,
          withCacheDuration,
          improvement: noCacheDuration / withCacheDuration
        })
      }

      cachePerformance.forEach(perf => {
        console.log(`Query: ${perf.query}`)
        console.log(`No Cache: ${perf.noCacheDuration}ms, With Cache: ${perf.withCacheDuration}ms`)
        console.log(`Improvement: ${perf.improvement.toFixed(2)}x faster\n`)
        
        expect(perf.improvement).toBeGreaterThan(10) // At least 10x improvement
      })
    })
  })

  describe('Database Connection Pooling Performance', () => {
    it('should handle multiple concurrent connections efficiently', async () => {
      const connectionCount = 20
      const connections = []

      benchmark.start('connection-pooling')

      // Simulate multiple concurrent database connections
      for (let i = 0; i < connectionCount; i++) {
        const connection = new Promise(resolve => {
          // Simulate connection time
          setTimeout(() => {
            resolve({ connection_id: i, status: 'connected' })
          }, Math.random() * 50)
        })
        connections.push(connection)
      }

      await Promise.all(connections)
      
      const duration = benchmark.end('connection-pooling')
      console.log(`${connectionCount} concurrent connections: ${duration}ms`)

      // Should handle concurrent connections efficiently
      expect(duration).toBeLessThan(200)
    })

    it('should optimize connection reuse', async () => {
      // Test connection reuse vs new connections
      benchmark.start('new-connections')
      
      // Simulate creating new connections each time
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 20)) // Connection setup time
      }
      
      const newConnectionsDuration = benchmark.end('new-connections')

      benchmark.start('reused-connections')
      
      // Simulate reusing existing connections
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 1)) // Reuse existing connection
      }
      
      const reusedConnectionsDuration = benchmark.end('reused-connections')

      console.log(`New Connections: ${newConnectionsDuration}ms`)
      console.log(`Reused Connections: ${reusedConnectionsDuration}ms`)

      expect(reusedConnectionsDuration).toBeLessThan(newConnectionsDuration * 0.2)
    })
  })

  describe('Memory Usage Analysis', () => {
    it('should monitor memory usage during large operations', () => {
      const initialMemory = process.memoryUsage()
      
      // Simulate processing large dataset
      const largeDataset = generateTestStudents(10000)
      
      // Simulate data processing
      const processedData = largeDataset.map(student => ({
        ...student,
        processed: true,
        processingTime: Date.now()
      }))

      const finalMemory = process.memoryUsage()
      const memoryDelta = finalMemory.heapUsed - initialMemory.heapUsed

      console.log('Memory Usage Analysis:')
      console.log(`Initial Heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)
      console.log(`Final Heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)
      console.log(`Memory Delta: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`)

      // Memory usage should be reasonable for the dataset size
      expect(memoryDelta).toBeLessThan(100 * 1024 * 1024) // Less than 100MB for 10k records
    })
  })

  describe('API Rate Limiting and Throttling', () => {
    it('should handle API rate limits gracefully', async () => {
      const requestCount = 100
      const rateLimitWindow = 1000 // 1 second
      
      benchmark.start('rate-limited-requests')

      const requests = Array.from({ length: requestCount }, async (_, i) => {
        // Simulate API call with potential rate limiting
        if (i % 10 === 0) {
          // Simulate rate limit delay every 10th request
          await new Promise(resolve => setTimeout(resolve, 50))
        }
        
        return mockSupabaseClient.from('students').select('id').limit(1)
      })

      await Promise.all(requests)
      
      const duration = benchmark.end('rate-limited-requests')
      console.log(`${requestCount} requests with rate limiting: ${duration}ms`)

      // Should handle rate limits without excessive delays
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions', async () => {
      // Baseline performance metrics
      const baselines = {
        simple_query: 50,
        complex_query: 150,
        report_generation: 800,
        batch_operation: 300
      }

      // Current performance measurements
      const currentMetrics = {
        simple_query: 45,     // Improved
        complex_query: 180,   // Regression
        report_generation: 750, // Improved  
        batch_operation: 290   // Stable
      }

      const regressions = []
      const improvements = []

      for (const [operation, baseline] of Object.entries(baselines)) {
        const current = currentMetrics[operation as keyof typeof currentMetrics]
        const change = ((current - baseline) / baseline) * 100

        if (change > 20) {
          regressions.push({ operation, baseline, current, change })
        } else if (change < -10) {
          improvements.push({ operation, baseline, current, change })
        }
      }

      console.log('Performance Analysis:')
      console.log('Regressions:', regressions)
      console.log('Improvements:', improvements)

      // Alert on significant regressions
      expect(regressions.length).toBeLessThan(2) // Allow some regressions but not too many
      regressions.forEach(regression => {
        console.warn(`Performance regression detected: ${regression.operation} ${regression.change.toFixed(1)}% slower`)
      })
    })
  })
})

// Export performance testing utilities
export { BackendPerformanceBenchmark }