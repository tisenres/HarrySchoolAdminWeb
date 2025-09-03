/**
 * Database Query Caching Layer
 * Intelligent caching for frequently accessed database queries
 */

import { cacheService, CacheKeys, CacheTTL, CacheUtils, InvalidationPatterns } from './cache-service'

// Query result wrapper with metadata
interface CachedQueryResult<T = any> {
  data: T
  metadata: {
    query_hash: string
    cached_at: number
    expires_at: number
    hit_count: number
    organization_id: string
    table_name: string
    filters_applied?: Record<string, any>
  }
}

// Query caching configuration
interface QueryCacheConfig {
  ttl?: number
  skipCache?: boolean
  forceRefresh?: boolean
  tags?: string[] // For invalidation grouping
}

// Query performance metrics
interface QueryMetrics {
  query_hash: string
  execution_time: number
  cache_hit: boolean
  result_size: number
  timestamp: number
}

/**
 * High-performance database query caching service
 */
class QueryCacheService {
  private metricsEnabled = process.env.NODE_ENV === 'development'

  /**
   * Execute query with caching support
   */
  async executeQuery<T = any>(
    queryId: string,
    organizationId: string,
    tableName: string,
    queryFunction: () => Promise<T>,
    config: QueryCacheConfig = {}
  ): Promise<T> {
    const startTime = Date.now()
    const queryHash = this.generateQueryHash(queryId, organizationId)
    
    try {
      // Check if we should skip cache
      if (config.skipCache || config.forceRefresh) {
        const result = await queryFunction()
        await this.setCachedQuery(queryHash, organizationId, tableName, result, config)
        this.recordMetrics(queryHash, Date.now() - startTime, false, result)
        return result
      }

      // Try to get from cache first
      const cached = await this.getCachedQuery<T>(queryHash)
      if (cached) {
        // Increment hit count
        await this.incrementHitCount(queryHash)
        this.recordMetrics(queryHash, Date.now() - startTime, true, cached.data)
        return cached.data
      }

      // Execute query and cache result
      const result = await queryFunction()
      await this.setCachedQuery(queryHash, organizationId, tableName, result, config)
      this.recordMetrics(queryHash, Date.now() - startTime, false, result)
      
      return result
    } catch (error) {
      console.warn(`Query cache error for ${queryId}:`, error)
      // Fallback to direct execution on cache error
      return await queryFunction()
    }
  }

  /**
   * Cache frequently accessed list queries
   */
  async cacheListQuery<T = any>(
    entity: string,
    organizationId: string,
    filters: Record<string, any>,
    pagination: { page: number; limit: number },
    queryFunction: () => Promise<T>,
    config: QueryCacheConfig = {}
  ): Promise<T> {
    const queryId = CacheUtils.generateListKey(entity, organizationId, filters, pagination.page)
    
    return this.executeQuery(
      queryId,
      organizationId,
      entity,
      queryFunction,
      {
        ttl: CacheTTL.USER_LIST,
        tags: [`${entity}_list`, `org_${organizationId}`],
        ...config
      }
    )
  }

  /**
   * Cache entity detail queries
   */
  async cacheEntityQuery<T = any>(
    entity: string,
    organizationId: string,
    entityId: string,
    queryFunction: () => Promise<T>,
    config: QueryCacheConfig = {}
  ): Promise<T> {
    const queryId = CacheUtils.generateEntityKey(entity, organizationId, entityId)
    
    return this.executeQuery(
      queryId,
      organizationId,
      entity,
      queryFunction,
      {
        ttl: CacheTTL.USER_DATA,
        tags: [`${entity}_detail`, `org_${organizationId}`, `${entity}_${entityId}`],
        ...config
      }
    )
  }

  /**
   * Cache statistics queries
   */
  async cacheStatsQuery<T = any>(
    entity: string,
    organizationId: string,
    queryFunction: () => Promise<T>,
    config: QueryCacheConfig = {}
  ): Promise<T> {
    const queryId = CacheUtils.generateStatsKey(entity, organizationId)
    
    return this.executeQuery(
      queryId,
      organizationId,
      `${entity}_stats`,
      queryFunction,
      {
        ttl: CacheTTL.STATS,
        tags: [`${entity}_stats`, `org_${organizationId}`, 'dashboard_stats'],
        ...config
      }
    )
  }

  /**
   * Cache dashboard queries
   */
  async cacheDashboardQuery<T = any>(
    queryType: string,
    organizationId: string,
    queryFunction: () => Promise<T>,
    config: QueryCacheConfig = {}
  ): Promise<T> {
    const queryId = `dashboard_${queryType}:${organizationId}`
    
    return this.executeQuery(
      queryId,
      organizationId,
      'dashboard',
      queryFunction,
      {
        ttl: CacheTTL.DASHBOARD,
        tags: ['dashboard', `org_${organizationId}`],
        ...config
      }
    )
  }

  /**
   * Get cached query result
   */
  private async getCachedQuery<T = any>(queryHash: string): Promise<CachedQueryResult<T> | null> {
    try {
      const cached = await cacheService.get<CachedQueryResult<T>>(queryHash)
      
      if (!cached) return null

      // Check if expired
      if (Date.now() > cached.metadata.expires_at) {
        await cacheService.delete(queryHash)
        return null
      }

      return cached
    } catch (error) {
      console.warn(`Get cached query error: ${error}`)
      return null
    }
  }

  /**
   * Set cached query result
   */
  private async setCachedQuery<T = any>(
    queryHash: string,
    organizationId: string,
    tableName: string,
    data: T,
    config: QueryCacheConfig
  ): Promise<boolean> {
    try {
      const ttl = config.ttl || CacheTTL.USER_DATA
      const cachedResult: CachedQueryResult<T> = {
        data,
        metadata: {
          query_hash: queryHash,
          cached_at: Date.now(),
          expires_at: Date.now() + (ttl * 1000),
          hit_count: 0,
          organization_id: organizationId,
          table_name: tableName,
          filters_applied: {}
        }
      }

      return await cacheService.set(queryHash, cachedResult, ttl)
    } catch (error) {
      console.warn(`Set cached query error: ${error}`)
      return false
    }
  }

  /**
   * Invalidate query cache by patterns
   */
  async invalidateQueries(patterns: string[]): Promise<number> {
    try {
      return await cacheService.invalidatePatterns(patterns)
    } catch (error) {
      console.warn('Query invalidation error:', error)
      return 0
    }
  }

  /**
   * Invalidate all queries for an entity
   */
  async invalidateEntityQueries(entity: string, organizationId: string): Promise<number> {
    const patterns = [
      `${entity}:${organizationId}:*`,
      `${entity}_stats:${organizationId}`,
      `dashboard_*:${organizationId}`
    ]
    return await this.invalidateQueries(patterns)
  }

  /**
   * Invalidate specific entity detail cache
   */
  async invalidateEntityDetail(entity: string, organizationId: string, entityId: string): Promise<boolean> {
    const key = CacheUtils.generateEntityKey(entity, organizationId, entityId)
    return await cacheService.delete(key)
  }

  /**
   * Invalidate list queries for an entity
   */
  async invalidateListQueries(entity: string, organizationId: string): Promise<number> {
    const patterns = [`${entity}:${organizationId}:*`]
    return await this.invalidateQueries(patterns)
  }

  /**
   * Smart invalidation based on data changes
   */
  async invalidateOnDataChange(
    entity: string,
    organizationId: string,
    changeType: 'create' | 'update' | 'delete',
    entityId?: string
  ): Promise<void> {
    try {
      switch (changeType) {
        case 'create':
          // Invalidate list queries and stats
          await this.invalidateListQueries(entity, organizationId)
          await this.invalidateEntityQueries(`${entity}_stats`, organizationId)
          break

        case 'update':
          // Invalidate specific entity and related lists
          if (entityId) {
            await this.invalidateEntityDetail(entity, organizationId, entityId)
          }
          await this.invalidateListQueries(entity, organizationId)
          break

        case 'delete':
          // Invalidate everything for this entity
          await this.invalidateEntityQueries(entity, organizationId)
          break
      }

      // Always invalidate dashboard stats on any change
      await this.invalidateQueries([`dashboard_*:${organizationId}`])
    } catch (error) {
      console.warn('Smart invalidation error:', error)
    }
  }

  /**
   * Pre-warm cache with frequently accessed data
   */
  async prewarmCache(organizationId: string): Promise<void> {
    try {
      console.log(`🔥 Pre-warming query cache for organization ${organizationId}`)
      
      // This would typically involve fetching and caching frequently accessed queries
      // Implementation would depend on your specific query patterns
      
      const prewarmOperations = [
        // Dashboard stats
        async () => {
          console.log('Pre-warming dashboard queries...')
        },
        
        // Recent data
        async () => {
          console.log('Pre-warming recent data queries...')
        },
        
        // Statistics
        async () => {
          console.log('Pre-warming statistics queries...')
        }
      ]

      await Promise.allSettled(prewarmOperations.map(op => op()))
      console.log(`✅ Query cache pre-warming completed for organization ${organizationId}`)
    } catch (error) {
      console.warn('Cache pre-warming error:', error)
    }
  }

  /**
   * Get query cache statistics
   */
  async getCacheStats(organizationId?: string): Promise<{
    totalQueries: number
    cacheHitRate: number
    mostFrequentQueries: Array<{ query: string; hits: number }>
    storageUsed: string
  }> {
    try {
      // This would require more complex tracking
      return {
        totalQueries: 0,
        cacheHitRate: 0,
        mostFrequentQueries: [],
        storageUsed: '0 MB'
      }
    } catch (error) {
      console.warn('Cache stats error:', error)
      return {
        totalQueries: 0,
        cacheHitRate: 0,
        mostFrequentQueries: [],
        storageUsed: 'Error'
      }
    }
  }

  /**
   * Batch cache warm-up for multiple queries
   */
  async batchWarmup(
    queries: Array<{
      key: string
      organizationId: string
      tableName: string
      queryFunction: () => Promise<any>
      ttl?: number
    }>
  ): Promise<number> {
    try {
      let successCount = 0
      
      const batchOperations = queries.map(async (query) => {
        try {
          const result = await query.queryFunction()
          const success = await this.setCachedQuery(
            query.key,
            query.organizationId,
            query.tableName,
            result,
            { ttl: query.ttl }
          )
          if (success) successCount++
        } catch (error) {
          console.warn(`Batch warmup error for ${query.key}:`, error)
        }
      })

      await Promise.allSettled(batchOperations)
      return successCount
    } catch (error) {
      console.warn('Batch warmup error:', error)
      return 0
    }
  }

  /**
   * Record query performance metrics
   */
  private recordMetrics<T>(
    queryHash: string,
    executionTime: number,
    cacheHit: boolean,
    result: T
  ): void {
    if (!this.metricsEnabled) return

    try {
      const metrics: QueryMetrics = {
        query_hash: queryHash,
        execution_time: executionTime,
        cache_hit: cacheHit,
        result_size: JSON.stringify(result).length,
        timestamp: Date.now()
      }

      // Store metrics (in production, you might send to analytics)
      console.log(`📊 Query Metrics:`, {
        hash: queryHash.slice(0, 16) + '...',
        time: `${executionTime}ms`,
        cache: cacheHit ? 'HIT' : 'MISS',
        size: `${Math.round(metrics.result_size / 1024)}KB`
      })
    } catch (error) {
      // Metrics recording should not affect main functionality
    }
  }

  /**
   * Generate consistent query hash
   */
  private generateQueryHash(queryId: string, organizationId: string): string {
    return `query:${organizationId}:${queryId}`
  }

  /**
   * Increment hit count for cached query
   */
  private async incrementHitCount(queryHash: string): Promise<void> {
    try {
      const cached = await cacheService.get<CachedQueryResult>(queryHash)
      if (cached) {
        cached.metadata.hit_count += 1
        await cacheService.set(queryHash, cached)
      }
    } catch (error) {
      // Hit count increment failures should not affect functionality
    }
  }

  /**
   * Health check for query cache
   */
  async healthCheck(): Promise<{
    connected: boolean
    averageQueryTime: number
    hitRate: number
    errors: string[]
  }> {
    const errors: string[] = []
    
    try {
      const cacheHealth = await cacheService.healthCheck()
      
      if (!cacheHealth.connected) {
        errors.push('Cache not connected')
      }

      // Test query caching
      const testQuery = async () => ({ test: true, timestamp: Date.now() })
      const testResult = await this.executeQuery(
        'health_test',
        'test_org',
        'test_table',
        testQuery,
        { ttl: 10 }
      )

      if (!testResult) {
        errors.push('Query caching test failed')
      }

      return {
        connected: cacheHealth.connected,
        averageQueryTime: cacheHealth.latency || 0,
        hitRate: 0, // Would need metrics tracking
        errors
      }
    } catch (error) {
      errors.push(`Health check failed: ${error}`)
      return {
        connected: false,
        averageQueryTime: 0,
        hitRate: 0,
        errors
      }
    }
  }
}

// Export singleton instance
export const queryCache = new QueryCacheService()

// Export types
export type { CachedQueryResult, QueryCacheConfig, QueryMetrics }
export { QueryCacheService }