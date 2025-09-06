/**
 * Performance Testing Utilities for Harry School CRM
 * 
 * Provides automated performance testing and benchmarking capabilities
 * for database operations and mock services.
 */

import { studentService } from '@/lib/services/student-service'
import groupService from '@/lib/services/group-service'
import { teacherService } from '@/lib/services/teacher-service'
import { performanceMonitor, PerformanceProfiler } from './performance-utils'
import type { StudentFilters, StudentSortConfig } from '@/types/student'
import type { GroupFilters, GroupSortConfig } from '@/types/group'

// Test scenarios interface
interface TestScenario {
  name: string
  operation: () => Promise<any>
  expectedTime: number // milliseconds
  iterations: number
}

interface PerformanceTestResult {
  scenario: string
  iterations: number
  totalTime: number
  averageTime: number
  fastestTime: number
  slowestTime: number
  expectedTime: number
  passed: boolean
  improvement?: number
}

interface ServiceBenchmarkResult {
  serviceName: string
  results: PerformanceTestResult[]
  overallScore: number
  recommendations: string[]
}

/**
 * Performance test runner for mock services
 */
export class PerformanceTestRunner {
  private profiler = new PerformanceProfiler()

  /**
   * Run comprehensive performance tests
   */
  async runAllTests(): Promise<{
    studentService: ServiceBenchmarkResult
    groupService: ServiceBenchmarkResult
    overall: {
      totalTests: number
      passedTests: number
      failedTests: number
      overallScore: number
    }
  }> {
    console.log('🚀 Starting comprehensive performance tests...')
    
    // Start memory profiling
    performanceMonitor.startMemoryProfiling()

    // Run student service tests
    const studentResults = await this.testStudentService()
    
    // Run group service tests  
    const groupResults = await this.testGroupService()

    // Calculate overall results
    const totalTests = studentResults.results.length + groupResults.results.length
    const passedTests = [...studentResults.results, ...groupResults.results]
      .filter(r => r.passed).length
    const failedTests = totalTests - passedTests
    const overallScore = (passedTests / totalTests) * 100

    console.log(`✅ Performance tests completed: ${passedTests}/${totalTests} passed`)
    
    return {
      studentService: studentResults,
      groupService: groupResults,
      overall: {
        totalTests,
        passedTests,
        failedTests,
        overallScore
      }
    }
  }

  /**
   * Test student service performance
   */
  async testStudentService(): Promise<ServiceBenchmarkResult> {
    console.log('📚 Testing Student Service Performance...')

    const scenarios: TestScenario[] = [
      {
        name: 'Get all students (no filters)',
        operation: () => studentService.getAll(),
        expectedTime: 100,
        iterations: 10
      },
      {
        name: 'Search students by name',
        operation: () => studentService.getAll({ search: 'Ali' }),
        expectedTime: 50,
        iterations: 15
      },
      {
        name: 'Filter by status',
        operation: () => studentService.getAll({ status: ['active'] }),
        expectedTime: 75,
        iterations: 10
      },
      {
        name: 'Complex filters (status + payment)',
        operation: () => studentService.getAll({ 
          status: ['active'], 
          payment_status: ['overdue'] 
        }),
        expectedTime: 100,
        iterations: 10
      },
      {
        name: 'Sort by name',
        operation: () => studentService.getAll(
          {},
          { field: 'full_name', direction: 'asc' }
        ),
        expectedTime: 50,
        iterations: 8
      },
      {
        name: 'Get student statistics',
        operation: () => studentService.getStatistics(),
        expectedTime: 100,
        iterations: 5
      },
      {
        name: 'Get student by ID',
        operation: async () => {
          const all = await studentService.getAll({}, undefined, 1, 5)
          return studentService.getById(all.data[0]?.id || 'test')
        },
        expectedTime: 25,
        iterations: 20
      },
      {
        name: 'Pagination (page 5)',
        operation: () => studentService.getAll({}, undefined, 5, 20),
        expectedTime: 50,
        iterations: 10
      },
      {
        name: 'Large page size (100 items)',
        operation: () => studentService.getAll({}, undefined, 1, 100),
        expectedTime: 150,
        iterations: 5
      },
      {
        name: 'Search with fuzzy matching',
        operation: () => studentService.getAll({ search: 'Alij' }), // Partial match
        expectedTime: 75,
        iterations: 10
      }
    ]

    const results = await this.runScenarios(scenarios, 'student')
    const overallScore = this.calculateServiceScore(results)
    const recommendations = this.generateStudentRecommendations(results)

    return {
      serviceName: 'Student Service',
      results,
      overallScore,
      recommendations
    }
  }

  /**
   * Test group service performance
   */
  async testGroupService(): Promise<ServiceBenchmarkResult> {
    console.log('👥 Testing Group Service Performance...')

    const scenarios: TestScenario[] = [
      {
        name: 'Get all groups (no filters)',
        operation: () => groupService.getAll(),
        expectedTime: 100,
        iterations: 10
      },
      {
        name: 'Search groups by name',
        operation: () => groupService.getAll({ search: 'English' }),
        expectedTime: 50,
        iterations: 15
      },
      {
        name: 'Filter by subject',
        operation: () => groupService.getAll({ subject: ['English'] }),
        expectedTime: 50,
        iterations: 12
      },
      {
        name: 'Filter by level and status',
        operation: () => groupService.getAll({ 
          level: ['Beginner'], 
          status: ['active'] 
        }),
        expectedTime: 75,
        iterations: 10
      },
      {
        name: 'Check available capacity',
        operation: () => groupService.getAll({ has_capacity: true }),
        expectedTime: 60,
        iterations: 10
      },
      {
        name: 'Get group statistics',
        operation: () => groupService.getStatistics(),
        expectedTime: 100,
        iterations: 5
      },
      {
        name: 'Get group by ID',
        operation: async () => {
          const all = await groupService.getAll({}, undefined, 1, 5)
          return groupService.getById(all.data[0]?.id || 'test')
        },
        expectedTime: 30,
        iterations: 15
      },
      {
        name: 'Sort by enrollment',
        operation: () => groupService.getAll(
          {},
          { field: 'enrollment_percentage', direction: 'desc' }
        ),
        expectedTime: 75,
        iterations: 8
      },
      {
        name: 'Schedule conflict check',
        operation: async () => {
          const schedule = [
            { day: 'monday', start_time: '10:00', end_time: '11:30', room: 'Room 101' }
          ]
          return groupService.checkScheduleConflicts?.(schedule)
        },
        expectedTime: 50,
        iterations: 20
      },
      {
        name: 'Get filter options',
        operation: () => groupService.getFilterOptions?.(),
        expectedTime: 25,
        iterations: 10
      }
    ]

    const results = await this.runScenarios(scenarios, 'group')
    const overallScore = this.calculateServiceScore(results)
    const recommendations = this.generateGroupRecommendations(results)

    return {
      serviceName: 'Group Service',
      results,
      overallScore,
      recommendations
    }
  }

  /**
   * Run performance scenarios
   */
  private async runScenarios(
    scenarios: TestScenario[], 
    serviceType: string
  ): Promise<PerformanceTestResult[]> {
    const results: PerformanceTestResult[] = []

    for (const scenario of scenarios) {
      console.log(`  ⏱️  Testing: ${scenario.name}`)
      
      const times: number[] = []
      let totalTime = 0

      // Warm up
      try {
        await scenario.operation()
      } catch (error) {
        console.warn(`Warmup failed for ${scenario.name}:`, error)
      }

      // Run iterations
      for (let i = 0; i < scenario.iterations; i++) {
        this.profiler.start()
        
        try {
          await scenario.operation()
          const executionTime = this.profiler.end()
          times.push(executionTime)
          totalTime += executionTime

          // Record for global monitoring
          performanceMonitor.recordQuery(
            scenario.name,
            serviceType,
            executionTime,
            0,
            false
          )
          
          performanceMonitor.sampleMemory()
        } catch (error) {
          console.error(`Error in ${scenario.name}:`, error)
          const failTime = this.profiler.end()
          times.push(failTime * 2) // Penalty for errors
          totalTime += failTime * 2
        }
      }

      const averageTime = totalTime / scenario.iterations
      const fastestTime = Math.min(...times)
      const slowestTime = Math.max(...times)
      const passed = averageTime <= scenario.expectedTime

      results.push({
        scenario: scenario.name,
        iterations: scenario.iterations,
        totalTime,
        averageTime,
        fastestTime,
        slowestTime,
        expectedTime: scenario.expectedTime,
        passed,
        improvement: scenario.expectedTime > 0 ? 
          ((scenario.expectedTime - averageTime) / scenario.expectedTime) * 100 : 0
      })

      const status = passed ? '✅' : '❌'
      const improvement = results[results.length - 1].improvement
      console.log(`    ${status} ${averageTime.toFixed(1)}ms avg (expected: ${scenario.expectedTime}ms)` +
        (improvement !== undefined ? ` | ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}% vs target` : ''))
    }

    return results
  }

  /**
   * Calculate overall service score
   */
  private calculateServiceScore(results: PerformanceTestResult[]): number {
    if (results.length === 0) return 0

    const passedTests = results.filter(r => r.passed).length
    const baseScore = (passedTests / results.length) * 100

    // Bonus for performance improvements
    const averageImprovement = results
      .filter(r => r.improvement !== undefined)
      .reduce((sum, r) => sum + r.improvement!, 0) / results.length

    const performanceBonus = Math.max(0, Math.min(20, averageImprovement / 2))
    
    return Math.min(100, baseScore + performanceBonus)
  }

  /**
   * Generate recommendations for student service
   */
  private generateStudentRecommendations(results: PerformanceTestResult[]): string[] {
    const recommendations: string[] = []
    const failedTests = results.filter(r => !r.passed)

    if (failedTests.length === 0) {
      recommendations.push('🎉 All performance targets met! Student service is well optimized.')
      return recommendations
    }

    // Analyze specific failures
    failedTests.forEach(test => {
      const slowdown = test.averageTime - test.expectedTime
      
      if (test.scenario.includes('search')) {
        recommendations.push(
          `🔍 Search optimization needed: ${test.scenario} is ${slowdown.toFixed(1)}ms slower than target. ` +
          `Consider improving fuzzy search algorithms or search index structure.`
        )
      } else if (test.scenario.includes('filter')) {
        recommendations.push(
          `⚡ Filter optimization needed: ${test.scenario} needs improvement. ` +
          `Consider implementing bitmap indexes or pre-computed filter results.`
        )
      } else if (test.scenario.includes('statistics')) {
        recommendations.push(
          `📊 Statistics optimization needed: Consider implementing incremental statistics updates ` +
          `or materialized views for faster dashboard performance.`
        )
      } else if (test.scenario.includes('sort')) {
        recommendations.push(
          `📈 Sorting optimization needed: Pre-compute sort keys or implement more efficient sorting algorithms.`
        )
      }
    })

    // General recommendations based on overall performance
    const averageTime = results.reduce((sum, r) => sum + r.averageTime, 0) / results.length
    if (averageTime > 75) {
      recommendations.push(
        `⚠️  Overall performance is slower than optimal (${averageTime.toFixed(1)}ms average). ` +
        `Consider implementing more aggressive caching strategies.`
      )
    }

    return recommendations
  }

  /**
   * Generate recommendations for group service
   */
  private generateGroupRecommendations(results: PerformanceTestResult[]): string[] {
    const recommendations: string[] = []
    const failedTests = results.filter(r => !r.passed)

    if (failedTests.length === 0) {
      recommendations.push('🎉 All performance targets met! Group service is well optimized.')
      return recommendations
    }

    failedTests.forEach(test => {
      if (test.scenario.includes('conflict')) {
        recommendations.push(
          `⚡ Schedule conflict detection needs optimization. Consider implementing ` +
          `time-based indexing or conflict caching strategies.`
        )
      } else if (test.scenario.includes('enrollment') || test.scenario.includes('capacity')) {
        recommendations.push(
          `📊 Enrollment calculations are slow. Consider caching enrollment percentages ` +
          `and pre-computing capacity information.`
        )
      }
    })

    return recommendations
  }

  /**
   * Generate detailed performance report
   */
  generateReport(results: Awaited<ReturnType<typeof this.runAllTests>>): string {
    let report = '\n📊 PERFORMANCE TEST REPORT\n'
    report += '=' .repeat(50) + '\n\n'

    // Overall summary
    report += `Overall Score: ${results.overall.overallScore.toFixed(1)}/100\n`
    report += `Total Tests: ${results.overall.totalTests}\n`
    report += `Passed: ${results.overall.passedTests} ✅\n`
    report += `Failed: ${results.overall.failedTests} ❌\n\n`

    // Student service results
    report += `📚 STUDENT SERVICE (Score: ${results.studentService.overallScore.toFixed(1)}/100)\n`
    report += '-'.repeat(40) + '\n'
    
    results.studentService.results.forEach(result => {
      const status = result.passed ? '✅' : '❌'
      const improvement = result.improvement !== undefined ? 
        ` (${result.improvement > 0 ? '+' : ''}${result.improvement.toFixed(1)}%)` : ''
      
      report += `${status} ${result.scenario}\n`
      report += `   Average: ${result.averageTime.toFixed(1)}ms (expected: ${result.expectedTime}ms)${improvement}\n`
      report += `   Range: ${result.fastestTime.toFixed(1)}ms - ${result.slowestTime.toFixed(1)}ms\n\n`
    })

    // Student recommendations
    if (results.studentService.recommendations.length > 0) {
      report += 'Recommendations:\n'
      results.studentService.recommendations.forEach(rec => {
        report += `• ${rec}\n`
      })
      report += '\n'
    }

    // Group service results
    report += `👥 GROUP SERVICE (Score: ${results.groupService.overallScore.toFixed(1)}/100)\n`
    report += '-'.repeat(40) + '\n'
    
    results.groupService.results.forEach(result => {
      const status = result.passed ? '✅' : '❌'
      const improvement = result.improvement !== undefined ? 
        ` (${result.improvement > 0 ? '+' : ''}${result.improvement.toFixed(1)}%)` : ''
      
      report += `${status} ${result.scenario}\n`
      report += `   Average: ${result.averageTime.toFixed(1)}ms (expected: ${result.expectedTime}ms)${improvement}\n`
      report += `   Range: ${result.fastestTime.toFixed(1)}ms - ${result.slowestTime.toFixed(1)}ms\n\n`
    })

    // Group recommendations
    if (results.groupService.recommendations.length > 0) {
      report += 'Recommendations:\n'
      results.groupService.recommendations.forEach(rec => {
        report += `• ${rec}\n`
      })
      report += '\n'
    }

    // Global performance stats
    const globalStats = performanceMonitor.getGlobalStats()
    report += `🌐 GLOBAL PERFORMANCE STATS\n`
    report += '-'.repeat(40) + '\n'
    report += `Total Queries: ${globalStats.totalQueries}\n`
    report += `Average Time: ${globalStats.averageTime.toFixed(1)}ms\n`
    report += `Cache Hit Rate: ${globalStats.cacheHitRate.toFixed(1)}%\n`
    
    if (globalStats.memoryUsage) {
      const memory = globalStats.memoryUsage
      report += `Memory Delta: ${(memory.delta / 1024 / 1024).toFixed(2)} MB\n`
      report += `Peak Memory: ${(memory.peak / 1024 / 1024).toFixed(2)} MB\n`
    }

    report += '\n' + '='.repeat(50) + '\n'
    
    return report
  }

  /**
   * Quick performance check
   */
  async quickCheck(): Promise<{
    studentSearchTime: number
    groupSearchTime: number
    statisticsTime: number
    overallHealth: 'good' | 'warning' | 'critical'
  }> {
    console.log('🚀 Running quick performance check...')

    // Test critical operations
    const studentStart = performance.now()
    await studentService.getAll({ search: 'test' })
    const studentSearchTime = performance.now() - studentStart

    const groupStart = performance.now()
    await groupService.getAll({ search: 'test' })
    const groupSearchTime = performance.now() - groupStart

    const statsStart = performance.now()
    await studentService.getStatistics()
    const statisticsTime = performance.now() - statsStart

    // Determine overall health
    const maxTime = Math.max(studentSearchTime, groupSearchTime, statisticsTime)
    let overallHealth: 'good' | 'warning' | 'critical'
    
    if (maxTime < 100) {
      overallHealth = 'good'
    } else if (maxTime < 300) {
      overallHealth = 'warning'  
    } else {
      overallHealth = 'critical'
    }

    console.log(`Quick check completed: ${overallHealth.toUpperCase()}`)
    console.log(`Student search: ${studentSearchTime.toFixed(1)}ms`)
    console.log(`Group search: ${groupSearchTime.toFixed(1)}ms`)
    console.log(`Statistics: ${statisticsTime.toFixed(1)}ms`)

    return {
      studentSearchTime,
      groupSearchTime,
      statisticsTime,
      overallHealth
    }
  }
}

// Export singleton instance
export const performanceTestRunner = new PerformanceTestRunner()