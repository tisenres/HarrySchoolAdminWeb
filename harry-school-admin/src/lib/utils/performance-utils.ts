/**
 * Performance Utilities for Harry School CRM
 * 
 * Provides utilities for monitoring, benchmarking, and optimizing
 * database operations and query performance in mock services.
 */

// Performance measurement interfaces
export interface PerformanceProfiler {
  start(): void
  end(): number
  getStats(): PerformanceStats
}

export interface PerformanceStats {
  totalOperations: number
  averageTime: number
  fastestTime: number
  slowestTime: number
  lastTime: number
}

export interface QueryBenchmark {
  operation: string
  dataset: string
  recordCount: number
  executionTime: number
  cacheHit: boolean
  timestamp: number
}

export interface OptimizationReport {
  service: string
  totalQueries: number
  averageQueryTime: number
  cacheHitRate: number
  slowQueries: QueryBenchmark[]
  recommendations: string[]
}

/**
 * Performance profiler class
 */
export class PerformanceProfiler implements PerformanceProfiler {
  private stats: PerformanceStats = {
    totalOperations: 0,
    averageTime: 0,
    fastestTime: Number.MAX_VALUE,
    slowestTime: 0,
    lastTime: 0
  }
  
  private startTime: number = 0

  start(): void {
    this.startTime = performance.now()
  }

  end(): number {
    const endTime = performance.now()
    const duration = endTime - this.startTime
    
    // Update statistics
    this.stats.totalOperations++
    this.stats.lastTime = duration
    
    if (duration < this.stats.fastestTime) {
      this.stats.fastestTime = duration
    }
    
    if (duration > this.stats.slowestTime) {
      this.stats.slowestTime = duration
    }
    
    this.stats.averageTime = 
      (this.stats.averageTime * (this.stats.totalOperations - 1) + duration) / 
      this.stats.totalOperations
    
    return duration
  }

  getStats(): PerformanceStats {
    return { ...this.stats }
  }

  reset(): void {
    this.stats = {
      totalOperations: 0,
      averageTime: 0,
      fastestTime: Number.MAX_VALUE,
      slowestTime: 0,
      lastTime: 0
    }
  }
}

/**
 * Query benchmark collector
 */
export class QueryBenchmarkCollector {
  private benchmarks: QueryBenchmark[] = []
  private maxBenchmarks: number = 1000

  addBenchmark(benchmark: QueryBenchmark): void {
    this.benchmarks.push({
      ...benchmark,
      timestamp: Date.now()
    })
    
    // Keep only the latest benchmarks
    if (this.benchmarks.length > this.maxBenchmarks) {
      this.benchmarks = this.benchmarks.slice(-this.maxBenchmarks)
    }
  }

  getBenchmarks(operation?: string, limit?: number): QueryBenchmark[] {
    let filtered = this.benchmarks
    
    if (operation) {
      filtered = filtered.filter(b => b.operation === operation)
    }
    
    if (limit) {
      filtered = filtered.slice(-limit)
    }
    
    return [...filtered]
  }

  getSlowQueries(thresholdMs: number = 100): QueryBenchmark[] {
    return this.benchmarks
      .filter(b => b.executionTime > thresholdMs)
      .sort((a, b) => b.executionTime - a.executionTime)
  }

  getAverageTime(operation?: string): number {
    const filtered = operation 
      ? this.benchmarks.filter(b => b.operation === operation)
      : this.benchmarks
    
    if (filtered.length === 0) return 0
    
    return filtered.reduce((sum, b) => sum + b.executionTime, 0) / filtered.length
  }

  getCacheHitRate(operation?: string): number {
    const filtered = operation 
      ? this.benchmarks.filter(b => b.operation === operation)
      : this.benchmarks
    
    if (filtered.length === 0) return 0
    
    const hits = filtered.filter(b => b.cacheHit).length
    return (hits / filtered.length) * 100
  }

  clear(): void {
    this.benchmarks = []
  }
}

/**
 * Performance optimization analyzer
 */
export class PerformanceOptimizer {
  private benchmarkCollector: QueryBenchmarkCollector

  constructor(benchmarkCollector: QueryBenchmarkCollector) {
    this.benchmarkCollector = benchmarkCollector
  }

  generateOptimizationReport(serviceName: string): OptimizationReport {
    const benchmarks = this.benchmarkCollector.getBenchmarks()
    const slowQueries = this.benchmarkCollector.getSlowQueries(50) // 50ms threshold
    
    const totalQueries = benchmarks.length
    const averageQueryTime = this.benchmarkCollector.getAverageTime()
    const cacheHitRate = this.benchmarkCollector.getCacheHitRate()
    
    const recommendations = this.generateRecommendations(
      averageQueryTime,
      cacheHitRate,
      slowQueries
    )

    return {
      service: serviceName,
      totalQueries,
      averageQueryTime,
      cacheHitRate,
      slowQueries: slowQueries.slice(0, 10), // Top 10 slowest
      recommendations
    }
  }

  private generateRecommendations(
    avgTime: number, 
    cacheHitRate: number, 
    slowQueries: QueryBenchmark[]
  ): string[] {
    const recommendations: string[] = []

    // Query time recommendations
    if (avgTime > 100) {
      recommendations.push(
        `Average query time (${avgTime.toFixed(1)}ms) exceeds target of 100ms. ` +
        `Consider implementing better indexing or reducing dataset size.`
      )
    }

    if (avgTime > 50 && avgTime <= 100) {
      recommendations.push(
        `Query performance (${avgTime.toFixed(1)}ms) is above optimal range. ` +
        `Review filtering algorithms and consider additional caching.`
      )
    }

    // Cache hit rate recommendations
    if (cacheHitRate < 50) {
      recommendations.push(
        `Low cache hit rate (${cacheHitRate.toFixed(1)}%). ` +
        `Consider increasing cache TTL or implementing smarter cache warming strategies.`
      )
    }

    if (cacheHitRate < 70 && cacheHitRate >= 50) {
      recommendations.push(
        `Cache hit rate (${cacheHitRate.toFixed(1)}%) has room for improvement. ` +
        `Review cache invalidation patterns and query patterns.`
      )
    }

    // Slow query recommendations
    if (slowQueries.length > 0) {
      const slowestQuery = slowQueries[0]
      recommendations.push(
        `Detected ${slowQueries.length} slow queries. ` +
        `Slowest: ${slowestQuery.operation} (${slowestQuery.executionTime.toFixed(1)}ms). ` +
        `Consider optimizing these operations first.`
      )
    }

    // Search operation recommendations
    const searchQueries = slowQueries.filter(q => q.operation.includes('search'))
    if (searchQueries.length > 0) {
      recommendations.push(
        `Search operations are slow (${searchQueries.length} instances). ` +
        `Implement full-text search indexes and fuzzy matching optimizations.`
      )
    }

    // Filter operation recommendations
    const filterQueries = slowQueries.filter(q => q.operation.includes('filter'))
    if (filterQueries.length > 0) {
      recommendations.push(
        `Filter operations need optimization (${filterQueries.length} instances). ` +
        `Consider pre-computing filter options and using bitmap indexes.`
      )
    }

    return recommendations
  }

  /**
   * Get performance targets for different operations
   */
  getPerformanceTargets(): Record<string, number> {
    return {
      search: 50,      // ms for search operations
      filter: 100,     // ms for complex filters
      sort: 50,        // ms for sorting operations
      statistics: 100, // ms for statistics calculation
      pagination: 50,  // ms for pagination
      query: 200,      // ms for general queries
      'batch-get': 75  // ms for batch operations
    }
  }

  /**
   * Check if operation meets performance targets
   */
  isPerformanceTarget(operation: string, executionTime: number): boolean {
    const targets = this.getPerformanceTargets()
    const target = targets[operation] || targets.query
    return executionTime <= target
  }
}

/**
 * Memory usage profiler for large datasets
 */
export class MemoryProfiler {
  private initialMemory: number = 0
  private peakMemory: number = 0

  start(): void {
    if ('memory' in performance) {
      // @ts-ignore - performance.memory is available in Chrome
      this.initialMemory = performance.memory.usedJSHeapSize
      this.peakMemory = this.initialMemory
    }
  }

  sample(): void {
    if ('memory' in performance) {
      // @ts-ignore
      const currentMemory = performance.memory.usedJSHeapSize
      if (currentMemory > this.peakMemory) {
        this.peakMemory = currentMemory
      }
    }
  }

  getMemoryUsage(): { initial: number; peak: number; delta: number } {
    return {
      initial: this.initialMemory,
      peak: this.peakMemory,
      delta: this.peakMemory - this.initialMemory
    }
  }

  formatMemory(bytes: number): string {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }
}

/**
 * Database operation simulator with timing
 */
export class DatabaseSimulator {
  private latencyMs: number

  constructor(latencyMs: number = 50) {
    this.latencyMs = latencyMs
  }

  async simulateQuery(operation: string, recordCount: number = 0): Promise<number> {
    const baseLatency = this.latencyMs
    const scalingFactor = Math.log(recordCount + 1) * 2 // Logarithmic scaling
    const networkJitter = Math.random() * 20 - 10 // ±10ms jitter
    
    const totalLatency = Math.max(10, baseLatency + scalingFactor + networkJitter)
    
    await new Promise(resolve => setTimeout(resolve, totalLatency))
    return totalLatency
  }

  setLatency(latencyMs: number): void {
    this.latencyMs = latencyMs
  }
}

/**
 * Global performance monitor singleton
 */
export class GlobalPerformanceMonitor {
  private static instance: GlobalPerformanceMonitor
  private benchmarkCollector = new QueryBenchmarkCollector()
  private optimizer = new PerformanceOptimizer(this.benchmarkCollector)
  private memoryProfiler = new MemoryProfiler()

  static getInstance(): GlobalPerformanceMonitor {
    if (!GlobalPerformanceMonitor.instance) {
      GlobalPerformanceMonitor.instance = new GlobalPerformanceMonitor()
    }
    return GlobalPerformanceMonitor.instance
  }

  recordQuery(
    operation: string,
    service: string,
    executionTime: number,
    recordCount: number = 0,
    cacheHit: boolean = false
  ): void {
    this.benchmarkCollector.addBenchmark({
      operation: `${service}.${operation}`,
      dataset: service,
      executionTime,
      recordCount,
      cacheHit,
      timestamp: Date.now()
    })
  }

  generateReport(serviceName?: string): OptimizationReport | OptimizationReport[] {
    if (serviceName) {
      return this.optimizer.generateOptimizationReport(serviceName)
    }

    // Generate reports for all services
    const services = new Set(
      this.benchmarkCollector.getBenchmarks().map(b => b.dataset)
    )

    return Array.from(services).map(service => 
      this.optimizer.generateOptimizationReport(service)
    )
  }

  getGlobalStats(): {
    totalQueries: number
    averageTime: number
    cacheHitRate: number
    memoryUsage?: ReturnType<MemoryProfiler['getMemoryUsage']>
  } {
    return {
      totalQueries: this.benchmarkCollector.getBenchmarks().length,
      averageTime: this.benchmarkCollector.getAverageTime(),
      cacheHitRate: this.benchmarkCollector.getCacheHitRate(),
      memoryUsage: this.memoryProfiler.getMemoryUsage()
    }
  }

  startMemoryProfiling(): void {
    this.memoryProfiler.start()
  }

  sampleMemory(): void {
    this.memoryProfiler.sample()
  }

  clear(): void {
    this.benchmarkCollector.clear()
  }
}

// Export utilities
export const performanceMonitor = GlobalPerformanceMonitor.getInstance()
export { PerformanceProfiler, QueryBenchmarkCollector, PerformanceOptimizer, MemoryProfiler, DatabaseSimulator }