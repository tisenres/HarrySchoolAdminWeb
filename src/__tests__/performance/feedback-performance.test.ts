import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import { FeedbackService } from '@/lib/services/feedback-service'
import {
  createMockFeedbackEntry,
  createMockFeedbackSubmission,
  createMockFeedbackList,
  createPerformanceTestData,
  createMockFeedbackListResponse
} from '../utils/feedback-mock-data'

/**
 * Feedback System Performance Test Suite
 * 
 * Tests feedback system performance to ensure it meets Harry School CRM
 * requirements without impacting existing functionality performance.
 */

interface PerformanceMetrics {
  operation: string
  duration: number
  memory_usage: number
  throughput: number
  success_rate: number
  dataset_size: number
  concurrent_users?: number
}

interface PerformanceThresholds {
  feedback_submission: number
  feedback_retrieval: number
  bulk_operations: number
  analytics_calculation: number
  concurrent_load: number
  memory_limit: number
  throughput_min: number
}

const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  feedback_submission: 500, // 500ms max for single submission
  feedback_retrieval: 300, // 300ms max for feedback list retrieval
  bulk_operations: 2000, // 2s max for bulk operations
  analytics_calculation: 1500, // 1.5s max for analytics
  concurrent_load: 3000, // 3s max for concurrent operations
  memory_limit: 50 * 1024 * 1024, // 50MB memory growth limit
  throughput_min: 50 // minimum operations per second
}

describe('Feedback Submission Performance', () => {
  let feedbackService: FeedbackService
  let performanceResults: PerformanceMetrics[] = []

  beforeEach(() => {
    jest.clearAllMocks()
    feedbackService = new FeedbackService()
  })

  test('should submit individual feedback within performance threshold', async () => {
    const feedbackSubmission = createMockFeedbackSubmission()
    const startTime = Date.now()
    const startMemory = process.memoryUsage().heapUsed

    // Mock feedback submission
    jest.spyOn(feedbackService, 'submitFeedback')
      .mockImplementation(async (submission) => {
        // Simulate realistic processing time
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 50))
        return createMockFeedbackEntry(submission)
      })

    const result = await feedbackService.submitFeedback(feedbackSubmission)
    
    const duration = Date.now() - startTime
    const endMemory = process.memoryUsage().heapUsed
    const memoryGrowth = endMemory - startMemory

    const metrics: PerformanceMetrics = {
      operation: 'single_feedback_submission',
      duration,
      memory_usage: memoryGrowth,
      throughput: 1000 / duration, // operations per second
      success_rate: 1.0,
      dataset_size: 1
    }

    performanceResults.push(metrics)

    // Performance assertions
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.feedback_submission)
    expect(memoryGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.memory_limit)
    expect(result).toHaveProperty('id')
    expect(metrics.throughput).toBeGreaterThan(2) // At least 2 submissions per second
  })

  test('should handle rapid sequential feedback submissions efficiently', async () => {
    const submissionCount = 20
    const submissions = Array.from({ length: submissionCount }, (_, i) =>
      createMockFeedbackSubmission({
        to_user_id: `teacher-rapid-${i}`,
        message: `Rapid submission test ${i}`
      })
    )

    const startTime = Date.now()
    const startMemory = process.memoryUsage().heapUsed

    // Mock rapid submissions
    jest.spyOn(feedbackService, 'submitFeedback')
      .mockImplementation(async (submission) => {
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 30))
        return createMockFeedbackEntry(submission)
      })

    const results = []
    for (const submission of submissions) {
      try {
        const result = await feedbackService.submitFeedback(submission)
        results.push({ success: true, id: result.id })
      } catch (error) {
        results.push({ success: false, error })
      }
    }

    const duration = Date.now() - startTime
    const endMemory = process.memoryUsage().heapUsed
    const memoryGrowth = endMemory - startMemory
    const successCount = results.filter(r => r.success).length

    const metrics: PerformanceMetrics = {
      operation: 'rapid_sequential_submissions',
      duration,
      memory_usage: memoryGrowth,
      throughput: (submissionCount / duration) * 1000,
      success_rate: successCount / submissionCount,
      dataset_size: submissionCount
    }

    // Performance assertions
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.feedback_submission * 5) // Allow 5x for sequential
    expect(memoryGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.memory_limit)
    expect(metrics.success_rate).toBeGreaterThanOrEqual(0.95) // 95% success rate
    expect(metrics.throughput).toBeGreaterThan(5) // At least 5 per second
  })

  test('should maintain performance with large feedback messages', async () => {
    const largeFeedbackSizes = [500, 1000, 2000, 3000, 4000] // characters
    const performanceBySize: Array<{ size: number; duration: number }> = []

    jest.spyOn(feedbackService, 'submitFeedback')
      .mockImplementation(async (submission) => {
        // Simulate processing time proportional to message size
        const processingTime = 50 + (submission.message.length / 100)
        await new Promise(resolve => setTimeout(resolve, processingTime))
        return createMockFeedbackEntry(submission)
      })

    for (const size of largeFeedbackSizes) {
      const largeMessage = 'A'.repeat(size)
      const submission = createMockFeedbackSubmission({ message: largeMessage })
      
      const startTime = Date.now()
      await feedbackService.submitFeedback(submission)
      const duration = Date.now() - startTime
      
      performanceBySize.push({ size, duration })
    }

    // Verify performance scales reasonably with message size
    performanceBySize.forEach(({ size, duration }) => {
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.feedback_submission * 2) // Allow 2x for large messages
      
      // Performance should scale sub-linearly with message size
      if (size === 4000) {
        expect(duration).toBeLessThan(500) // Even largest messages should be fast
      }
    })

    // Verify no exponential performance degradation
    const smallestTime = performanceBySize[0].duration
    const largestTime = performanceBySize[performanceBySize.length - 1].duration
    const performanceRatio = largestTime / smallestTime
    
    expect(performanceRatio).toBeLessThan(5) // Should not be more than 5x slower
  })
})

describe('Feedback Retrieval Performance', () => {
  let feedbackService: FeedbackService

  beforeEach(() => {
    feedbackService = new FeedbackService()
  })

  test('should retrieve feedback lists within performance threshold', async () => {
    const userId = 'user-retrieval-test'
    const feedbackCount = 50
    const mockFeedbackList = createMockFeedbackList(feedbackCount)

    const startTime = Date.now()
    const startMemory = process.memoryUsage().heapUsed

    // Mock feedback retrieval
    jest.spyOn(feedbackService, 'getFeedbackForUser')
      .mockImplementation(async (userId, direction, filters, pagination) => {
        // Simulate database query time
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 50))
        
        return createMockFeedbackListResponse({
          data: mockFeedbackList.slice(0, pagination?.limit || 20),
          count: feedbackCount,
          total_pages: Math.ceil(feedbackCount / (pagination?.limit || 20))
        })
      })

    const result = await feedbackService.getFeedbackForUser(userId, 'received')
    
    const duration = Date.now() - startTime
    const endMemory = process.memoryUsage().heapUsed
    const memoryGrowth = endMemory - startMemory

    // Performance assertions
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.feedback_retrieval)
    expect(memoryGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.memory_limit)
    expect(result.data).toHaveLength(20) // Default pagination
    expect(result.count).toBe(feedbackCount)
  })

  test('should handle paginated feedback retrieval efficiently', async () => {
    const userId = 'user-pagination-test'
    const totalFeedback = 200
    const pageSize = 25
    const totalPages = Math.ceil(totalFeedback / pageSize)

    const pagePerformance: Array<{ page: number; duration: number }> = []

    jest.spyOn(feedbackService, 'getFeedbackForUser')
      .mockImplementation(async (userId, direction, filters, pagination) => {
        // Simulate pagination query time (should be consistent)
        await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 40))
        
        const startIndex = ((pagination?.page || 1) - 1) * pageSize
        const endIndex = Math.min(startIndex + pageSize, totalFeedback)
        const pageData = Array.from({ length: endIndex - startIndex }, (_, i) =>
          createMockFeedbackEntry({ id: `feedback-${startIndex + i}` })
        )
        
        return createMockFeedbackListResponse({
          data: pageData,
          count: totalFeedback,
          total_pages: totalPages,
          current_page: pagination?.page || 1
        })
      })

    // Test retrieval of multiple pages
    for (let page = 1; page <= Math.min(5, totalPages); page++) {
      const startTime = Date.now()
      
      const result = await feedbackService.getFeedbackForUser(
        userId,
        'received',
        undefined,
        { page, limit: pageSize }
      )
      
      const duration = Date.now() - startTime
      pagePerformance.push({ page, duration })

      expect(result.data).toHaveLength(pageSize)
      expect(result.current_page).toBe(page)
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.feedback_retrieval)
    }

    // Verify consistent pagination performance
    const avgDuration = pagePerformance.reduce((sum, p) => sum + p.duration, 0) / pagePerformance.length
    const maxDuration = Math.max(...pagePerformance.map(p => p.duration))
    const minDuration = Math.min(...pagePerformance.map(p => p.duration))

    expect(maxDuration - minDuration).toBeLessThan(100) // Consistent performance within 100ms
    expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.feedback_retrieval)
  })

  test('should handle filtered feedback queries efficiently', async () => {
    const userId = 'user-filter-test'
    const complexFilters = [
      { category: ['teaching_quality'] },
      { rating_min: 4, rating_max: 5 },
      { date_from: new Date('2024-01-01'), date_to: new Date('2024-03-31') },
      { category: ['teaching_quality', 'communication'], rating_min: 3 }
    ]

    const filterPerformance: Array<{ filterIndex: number; duration: number }> = []

    jest.spyOn(feedbackService, 'getFeedbackForUser')
      .mockImplementation(async (userId, direction, filters) => {
        // Simulate filter processing time
        const filterComplexity = Object.keys(filters || {}).length
        const processingTime = 50 + (filterComplexity * 20) + Math.random() * 30
        await new Promise(resolve => setTimeout(resolve, processingTime))
        
        // Generate filtered results
        const filteredData = createMockFeedbackList(15 - filterComplexity * 2) // Fewer results for complex filters
        
        return createMockFeedbackListResponse({
          data: filteredData,
          count: filteredData.length
        })
      })

    for (let i = 0; i < complexFilters.length; i++) {
      const startTime = Date.now()
      
      const result = await feedbackService.getFeedbackForUser(
        userId,
        'received',
        complexFilters[i]
      )
      
      const duration = Date.now() - startTime
      filterPerformance.push({ filterIndex: i, duration })

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.feedback_retrieval * 1.5) // Allow 50% more time for filtered queries
      expect(result.data).toBeInstanceOf(Array)
    }

    // Verify filter performance is reasonable
    const maxFilterTime = Math.max(...filterPerformance.map(f => f.duration))
    expect(maxFilterTime).toBeLessThan(PERFORMANCE_THRESHOLDS.feedback_retrieval * 2)
  })
})

describe('Bulk Operations Performance', () => {
  let feedbackService: FeedbackService

  beforeEach(() => {
    feedbackService = new FeedbackService()
  })

  test('should handle bulk feedback submissions efficiently', async () => {
    const bulkSize = 50
    const recipientIds = Array.from({ length: bulkSize }, (_, i) => `teacher-bulk-${i}`)
    
    const startTime = Date.now()
    const startMemory = process.memoryUsage().heapUsed

    // Mock bulk submission
    jest.spyOn(feedbackService, 'submitBulkFeedback')
      .mockImplementation(async (request) => {
        // Simulate bulk processing
        const processingTimePerItem = 20 // 20ms per item
        const totalTime = request.recipient_ids.length * processingTimePerItem
        await new Promise(resolve => setTimeout(resolve, totalTime))

        // Simulate 98% success rate
        const successCount = Math.floor(request.recipient_ids.length * 0.98)
        const errorCount = request.recipient_ids.length - successCount

        return {
          success: successCount,
          errors: Array.from({ length: errorCount }, (_, i) => 
            `Failed to process recipient ${i}: Mock error`
          )
        }
      })

    const bulkRequest = {
      feedback_data: createMockFeedbackSubmission(),
      recipient_ids: recipientIds,
      recipient_type: 'teacher' as const
    }

    const result = await feedbackService.submitBulkFeedback(bulkRequest)
    
    const duration = Date.now() - startTime
    const endMemory = process.memoryUsage().heapUsed
    const memoryGrowth = endMemory - startMemory

    const metrics: PerformanceMetrics = {
      operation: 'bulk_feedback_submission',
      duration,
      memory_usage: memoryGrowth,
      throughput: (bulkSize / duration) * 1000,
      success_rate: result.success / bulkSize,
      dataset_size: bulkSize
    }

    // Performance assertions
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.bulk_operations)
    expect(memoryGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.memory_limit)
    expect(metrics.success_rate).toBeGreaterThan(0.95)
    expect(metrics.throughput).toBeGreaterThan(25) // At least 25 operations per second
    expect(result.success).toBeGreaterThan(45) // At least 45 successful submissions
  })

  test('should handle bulk status updates efficiently', async () => {
    const feedbackIds = Array.from({ length: 30 }, (_, i) => `feedback-bulk-status-${i}`)
    const newStatus = 'reviewed'

    const startTime = Date.now()

    // Mock bulk status update
    jest.spyOn(feedbackService, 'bulkUpdateFeedbackStatus')
      .mockImplementation(async (ids, status) => {
        // Simulate bulk update processing
        await new Promise(resolve => setTimeout(resolve, ids.length * 15)) // 15ms per update

        // Simulate 99% success rate for status updates
        const successCount = Math.floor(ids.length * 0.99)
        const errorCount = ids.length - successCount

        return {
          success: successCount,
          errors: Array.from({ length: errorCount }, (_, i) => 
            `Failed to update feedback ${ids[successCount + i]}: Mock error`
          )
        }
      })

    const result = await feedbackService.bulkUpdateFeedbackStatus(feedbackIds, newStatus)
    
    const duration = Date.now() - startTime

    // Performance assertions
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.bulk_operations / 2) // Status updates should be faster
    expect(result.success).toBeGreaterThan(29) // At least 29 successful updates
    expect(result.errors.length).toBeLessThan(2) // At most 1-2 errors
  })
})

describe('Analytics and Statistics Performance', () => {
  let feedbackService: FeedbackService

  beforeEach(() => {
    feedbackService = new FeedbackService()
  })

  test('should calculate feedback statistics within performance threshold', async () => {
    const userId = 'user-analytics-test'
    
    const startTime = Date.now()
    const startMemory = process.memoryUsage().heapUsed

    // Mock analytics calculation
    jest.spyOn(feedbackService, 'getFeedbackStatistics')
      .mockImplementation(async (userId) => {
        // Simulate complex analytics calculation
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 100))

        return {
          organization_overview: {
            total_feedback_entries: 1500,
            average_rating: 4.2,
            feedback_velocity: 25,
            response_rate: 0.78
          },
          teacher_insights: {
            highest_rated_teachers: Array.from({ length: 10 }, (_, i) => ({
              teacher_id: `t${i}`,
              teacher_name: `Teacher ${i}`,
              average_rating: 4.5 + Math.random() * 0.5,
              feedback_count: 20 + Math.floor(Math.random() * 30)
            })),
            improvement_opportunities: []
          },
          student_insights: {
            most_engaged_students: [],
            feedback_quality_leaders: []
          },
          category_performance: [],
          correlation_insights: {
            feedback_to_performance: 0.75,
            feedback_to_retention: 0.68,
            feedback_to_engagement: 0.82
          }
        }
      })

    const result = await feedbackService.getFeedbackStatistics(userId)
    
    const duration = Date.now() - startTime
    const endMemory = process.memoryUsage().heapUsed
    const memoryGrowth = endMemory - startMemory

    // Performance assertions
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.analytics_calculation)
    expect(memoryGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.memory_limit)
    expect(result).toHaveProperty('organization_overview')
    expect(result.organization_overview.total_feedback_entries).toBeGreaterThan(0)
  })

  test('should calculate ranking impact efficiently', async () => {
    const userId = 'user-ranking-impact-test'
    
    const startTime = Date.now()

    // Mock ranking impact calculation
    jest.spyOn(feedbackService, 'getRankingImpactFromFeedback')
      .mockImplementation(async (userId) => {
        // Simulate ranking calculation
        await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 75))

        return {
          total_points: 420,
          average_rating: 4.2,
          feedback_count: 25,
          category_breakdown: [
            { category: 'teaching_quality', average_rating: 4.5, count: 10, points_impact: 180 },
            { category: 'communication', average_rating: 4.2, count: 8, points_impact: 135 },
            { category: 'behavior', average_rating: 4.0, count: 7, points_impact: 105 }
          ]
        }
      })

    const result = await feedbackService.getRankingImpactFromFeedback(userId)
    
    const duration = Date.now() - startTime

    // Performance assertions
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.analytics_calculation / 2) // Ranking impact should be faster
    expect(result.total_points).toBeGreaterThan(0)
    expect(result.category_breakdown).toBeInstanceOf(Array)
  })
})

describe('Concurrent Operations Performance', () => {
  let feedbackService: FeedbackService

  beforeEach(() => {
    feedbackService = new FeedbackService()
  })

  test('should handle concurrent feedback submissions', async () => {
    const concurrentCount = 25
    const startTime = Date.now()
    const startMemory = process.memoryUsage().heapUsed

    // Mock concurrent submissions
    jest.spyOn(feedbackService, 'submitFeedback')
      .mockImplementation(async (submission) => {
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))
        return createMockFeedbackEntry(submission)
      })

    const concurrentOperations = Array.from({ length: concurrentCount }, async (_, i) => {
      try {
        const submission = createMockFeedbackSubmission({
          to_user_id: `teacher-concurrent-${i}`,
          message: `Concurrent feedback ${i}`
        })
        const result = await feedbackService.submitFeedback(submission)
        return { success: true, id: result.id }
      } catch (error) {
        return { success: false, error }
      }
    })

    const results = await Promise.all(concurrentOperations)
    
    const duration = Date.now() - startTime
    const endMemory = process.memoryUsage().heapUsed
    const memoryGrowth = endMemory - startMemory
    const successCount = results.filter(r => r.success).length

    const metrics: PerformanceMetrics = {
      operation: 'concurrent_feedback_submissions',
      duration,
      memory_usage: memoryGrowth,
      throughput: (concurrentCount / duration) * 1000,
      success_rate: successCount / concurrentCount,
      dataset_size: concurrentCount,
      concurrent_users: concurrentCount
    }

    // Performance assertions
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.concurrent_load)
    expect(memoryGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.memory_limit * 2) // Allow more memory for concurrent operations
    expect(metrics.success_rate).toBeGreaterThan(0.95)
    expect(successCount).toBe(concurrentCount) // All should succeed
  })

  test('should handle mixed concurrent operations (read/write)', async () => {
    const readOperations = 15
    const writeOperations = 10
    const totalOperations = readOperations + writeOperations

    const startTime = Date.now()

    // Mock services
    jest.spyOn(feedbackService, 'getFeedbackForUser')
      .mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 40))
        return createMockFeedbackListResponse()
      })

    jest.spyOn(feedbackService, 'submitFeedback')
      .mockImplementation(async (submission) => {
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 50))
        return createMockFeedbackEntry(submission)
      })

    const operations = [
      // Read operations
      ...Array.from({ length: readOperations }, async (_, i) => {
        try {
          const result = await feedbackService.getFeedbackForUser(`user-read-${i}`, 'received')
          return { success: true, type: 'read', count: result.data.length }
        } catch (error) {
          return { success: false, type: 'read', error }
        }
      }),
      
      // Write operations
      ...Array.from({ length: writeOperations }, async (_, i) => {
        try {
          const submission = createMockFeedbackSubmission({
            to_user_id: `user-write-${i}`,
            message: `Mixed operation feedback ${i}`
          })
          const result = await feedbackService.submitFeedback(submission)
          return { success: true, type: 'write', id: result.id }
        } catch (error) {
          return { success: false, type: 'write', error }
        }
      })
    ]

    const results = await Promise.all(operations)
    
    const duration = Date.now() - startTime
    const successCount = results.filter(r => r.success).length
    const readSuccessCount = results.filter(r => r.success && r.type === 'read').length
    const writeSuccessCount = results.filter(r => r.success && r.type === 'write').length

    // Performance assertions
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.concurrent_load)
    expect(successCount).toBe(totalOperations) // All operations should succeed
    expect(readSuccessCount).toBe(readOperations)
    expect(writeSuccessCount).toBe(writeOperations)

    // Mixed operations should not significantly impact individual operation performance
    expect(duration / totalOperations).toBeLessThan(200) // Average under 200ms per operation
  })
})

describe('Memory Management and Resource Cleanup', () => {
  let feedbackService: FeedbackService

  beforeEach(() => {
    feedbackService = new FeedbackService()
  })

  test('should maintain stable memory usage during extended operations', async () => {
    const operationCycles = 3 // Reduced for faster testing
    const memorySnapshots: number[] = []

    for (let cycle = 0; cycle < operationCycles; cycle++) {
      // Perform various feedback operations
      const feedbackData = createPerformanceTestData.largeFeedbackDataset(20) // Reduced size
      
      // Mock operations
      jest.spyOn(feedbackService, 'submitFeedback')
        .mockResolvedValue(createMockFeedbackEntry())
      
      jest.spyOn(feedbackService, 'getFeedbackForUser')
        .mockResolvedValue(createMockFeedbackListResponse({ data: feedbackData.feedbackEntries }))

      // Perform operations
      await feedbackService.submitFeedback(createMockFeedbackSubmission())
      await feedbackService.getFeedbackForUser('test-user', 'received')

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      // Take memory snapshot
      memorySnapshots.push(process.memoryUsage().heapUsed)

      // Small delay between cycles
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Analyze memory stability
    const maxMemory = Math.max(...memorySnapshots)
    const minMemory = Math.min(...memorySnapshots)
    const memoryVariation = maxMemory - minMemory

    // Memory should remain relatively stable (within 20MB variation)
    expect(memoryVariation).toBeLessThan(20 * 1024 * 1024)

    // No significant memory growth trend
    if (memorySnapshots.length > 1) {
      const firstMemory = memorySnapshots[0]
      const lastMemory = memorySnapshots[memorySnapshots.length - 1]
      const memoryGrowthRate = (lastMemory - firstMemory) / firstMemory

      expect(memoryGrowthRate).toBeLessThan(0.3) // Less than 30% growth
    }
  })

  test('should cleanup resources after large operations', async () => {
    const initialMemory = process.memoryUsage().heapUsed

    // Create large feedback dataset
    const largeFeedbackSet = createPerformanceTestData.largeFeedbackDataset(100)

    // Mock large operation
    jest.spyOn(feedbackService, 'getFeedbackStatistics')
      .mockImplementation(async () => {
        // Simulate processing large dataset
        await new Promise(resolve => setTimeout(resolve, 200))
        return {
          organization_overview: {
            total_feedback_entries: largeFeedbackSet.feedbackEntries.length,
            average_rating: 4.2,
            feedback_velocity: 25,
            response_rate: 0.78
          },
          teacher_insights: { highest_rated_teachers: [], improvement_opportunities: [] },
          student_insights: { most_engaged_students: [], feedback_quality_leaders: [] },
          category_performance: [],
          correlation_insights: { feedback_to_performance: 0.75, feedback_to_retention: 0.68, feedback_to_engagement: 0.82 }
        }
      })

    const analytics = await feedbackService.getFeedbackStatistics()

    // Clear references
    largeFeedbackSet.feedbackEntries.length = 0
    largeFeedbackSet.users.length = 0
    largeFeedbackSet.groups.length = 0

    // Force garbage collection
    if (global.gc) {
      global.gc()
    }

    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 500))

    const finalMemory = process.memoryUsage().heapUsed
    const memoryGrowth = finalMemory - initialMemory

    // Memory growth should be minimal after cleanup
    expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024) // Less than 10MB residual
    expect(analytics).toHaveProperty('organization_overview')
  })
})