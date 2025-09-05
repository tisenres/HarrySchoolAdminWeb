/**
 * Cache Service with Key Management
 * High-level caching layer with intelligent key generation and invalidation
 */

import { redisClient } from './redis-client'

// Cache key patterns for different data types
export const CacheKeys = {
  // Session data
  SESSION: (sessionId: string) => `session:${sessionId}`,
  USER_SESSION: (userId: string) => `user_session:${userId}`,
  AUTH_PROFILE: (userId: string) => `auth_profile:${userId}`,
  
  // Organization data
  ORGANIZATION: (orgId: string) => `org:${orgId}`,
  ORG_USERS: (orgId: string) => `org_users:${orgId}`,
  
  // Students data
  STUDENT: (orgId: string, studentId: string) => `student:${orgId}:${studentId}`,
  STUDENTS_LIST: (orgId: string, filters: string, page: number) => `students:${orgId}:${filters}:${page}`,
  STUDENT_STATS: (orgId: string) => `student_stats:${orgId}`,
  STUDENT_ENROLLMENTS: (orgId: string, studentId: string) => `student_enrollments:${orgId}:${studentId}`,
  
  // Teachers data
  TEACHER: (orgId: string, teacherId: string) => `teacher:${orgId}:${teacherId}`,
  TEACHERS_LIST: (orgId: string, filters: string, page: number) => `teachers:${orgId}:${filters}:${page}`,
  TEACHER_STATS: (orgId: string) => `teacher_stats:${orgId}`,
  TEACHER_GROUPS: (orgId: string, teacherId: string) => `teacher_groups:${orgId}:${teacherId}`,
  
  // Groups data
  GROUP: (orgId: string, groupId: string) => `group:${orgId}:${groupId}`,
  GROUPS_LIST: (orgId: string, filters: string, page: number) => `groups:${orgId}:${filters}:${page}`,
  GROUP_STATS: (orgId: string) => `group_stats:${orgId}`,
  GROUP_AVAILABLE: (orgId: string) => `groups_available:${orgId}`,
  
  // Dashboard data
  DASHBOARD_STATS: (orgId: string) => `dashboard_stats:${orgId}`,
  DASHBOARD_RECENT: (orgId: string) => `dashboard_recent:${orgId}`,
  
  // Real-time data
  NOTIFICATIONS: (userId: string) => `notifications:${userId}`,
  ACTIVITY_LOG: (orgId: string, page: number) => `activity_log:${orgId}:${page}`,
  
  // System data
  SYSTEM_HEALTH: () => `system:health`,
  API_METRICS: (endpoint: string) => `metrics:${endpoint}`,
} as const

// Cache TTL (Time To Live) configurations in seconds
export const CacheTTL = {
  // Session data - shorter TTL for security
  SESSION: 30 * 60, // 30 minutes
  AUTH_PROFILE: 60 * 60, // 1 hour
  
  // User data - medium TTL
  USER_DATA: 15 * 60, // 15 minutes
  USER_LIST: 10 * 60, // 10 minutes
  
  // Statistics - longer TTL as they change less frequently
  STATS: 5 * 60, // 5 minutes
  DASHBOARD: 2 * 60, // 2 minutes
  
  // Real-time data - very short TTL
  NOTIFICATIONS: 1 * 60, // 1 minute
  ACTIVITY: 30, // 30 seconds
  
  // System data
  SYSTEM: 5 * 60, // 5 minutes
  METRICS: 1 * 60, // 1 minute
} as const

// Cache invalidation patterns
export const InvalidationPatterns = {
  USER_DATA: (orgId: string, userId: string) => [
    `*:${orgId}:${userId}`,
    `user_session:${userId}`,
    `auth_profile:${userId}`,
  ],
  
  STUDENT_DATA: (orgId: string) => [
    `students:${orgId}:*`,
    `student_stats:${orgId}`,
    `dashboard_stats:${orgId}`,
  ],
  
  TEACHER_DATA: (orgId: string) => [
    `teachers:${orgId}:*`,
    `teacher_stats:${orgId}`,
    `dashboard_stats:${orgId}`,
  ],
  
  GROUP_DATA: (orgId: string) => [
    `groups:${orgId}:*`,
    `group_stats:${orgId}`,
    `groups_available:${orgId}`,
    `dashboard_stats:${orgId}`,
  ],
  
  ORGANIZATION_DATA: (orgId: string) => [
    `org:${orgId}`,
    `org_users:${orgId}`,
    `dashboard_stats:${orgId}`,
    `*:${orgId}:*`,
  ],
} as const

/**
 * High-level cache service with intelligent key management
 */
class CacheService {
  /**
   * Get cached data with type safety
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      return await redisClient.get<T>(key)
    } catch (error) {
      console.warn(`Cache GET error for key ${key}:`, error)
      return null
    }
  }

  /**
   * Set cached data with automatic TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      return await redisClient.set(key, value, ttlSeconds)
    } catch (error) {
      console.warn(`Cache SET error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<boolean> {
    try {
      return await redisClient.del(key)
    } catch (error) {
      console.warn(`Cache DELETE error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Get or set cached data (cache-aside pattern)
   */
  async getOrSet<T = any>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key)
      if (cached !== null) {
        return cached
      }

      // Fetch data if not in cache
      const data = await fetchFunction()
      
      // Store in cache for next time
      await this.set(key, data, ttlSeconds)
      
      return data
    } catch (error) {
      console.warn(`Cache getOrSet error for key ${key}:`, error)
      // Fallback to direct fetch on cache error
      return await fetchFunction()
    }
  }

  /**
   * Invalidate cache patterns
   */
  async invalidatePatterns(patterns: string[]): Promise<number> {
    try {
      let totalDeleted = 0
      
      for (const pattern of patterns) {
        const deleted = await redisClient.delPattern(pattern)
        totalDeleted += deleted
      }
      
      return totalDeleted
    } catch (error) {
      console.warn('Cache invalidation error:', error)
      return 0
    }
  }

  /**
   * Batch get multiple cache keys
   */
  async multiGet<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      return await redisClient.mget<T>(keys)
    } catch (error) {
      console.warn('Cache multiGet error:', error)
      return keys.map(() => null)
    }
  }

  /**
   * Batch set multiple cache keys
   */
  async multiSet(keyValuePairs: Array<[string, any]>, ttlSeconds?: number): Promise<boolean> {
    try {
      return await redisClient.mset(keyValuePairs, ttlSeconds)
    } catch (error) {
      console.warn('Cache multiSet error:', error)
      return false
    }
  }

  /**
   * Generate hash for complex filter objects
   */
  generateFilterHash(filters: Record<string, any>): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((result, key) => {
        const value = filters[key]
        if (value !== undefined && value !== null && value !== '') {
          result[key] = Array.isArray(value) ? value.sort().join(',') : String(value)
        }
        return result
      }, {} as Record<string, string>)
    
    return Buffer.from(JSON.stringify(sortedFilters)).toString('base64').slice(0, 20)
  }

  /**
   * Smart cache warming for frequently accessed data
   */
  async warmCache(orgId: string): Promise<void> {
    try {
      console.log(`🔥 Warming cache for organization ${orgId}`)
      
      // Define cache warming operations
      const warmingOperations = [
        // Warm dashboard stats
        async () => {
          const key = CacheKeys.DASHBOARD_STATS(orgId)
          if (!(await redisClient.exists(key))) {
            // This would typically fetch from your services
            console.log(`Warming dashboard stats cache for ${orgId}`)
          }
        },
        
        // Warm available groups
        async () => {
          const key = CacheKeys.GROUP_AVAILABLE(orgId)
          if (!(await redisClient.exists(key))) {
            console.log(`Warming available groups cache for ${orgId}`)
          }
        },
        
        // Warm statistics
        async () => {
          const statsKeys = [
            CacheKeys.STUDENT_STATS(orgId),
            CacheKeys.TEACHER_STATS(orgId),
            CacheKeys.GROUP_STATS(orgId),
          ]
          
          for (const key of statsKeys) {
            if (!(await redisClient.exists(key))) {
              console.log(`Warming stats cache: ${key}`)
            }
          }
        }
      ]

      // Execute warming operations in parallel
      await Promise.allSettled(warmingOperations.map(op => op()))
      
      console.log(`✅ Cache warming completed for organization ${orgId}`)
    } catch (error) {
      console.warn('Cache warming error:', error)
    }
  }

  /**
   * Cache health check
   */
  async healthCheck(): Promise<{
    connected: boolean
    latency: number | null
    info: any
  }> {
    const startTime = Date.now()
    
    try {
      // Test basic operation
      const testKey = 'health_check'
      const testValue = { timestamp: Date.now() }
      
      await redisClient.set(testKey, testValue, 10) // 10 seconds TTL
      const retrieved = await redisClient.get(testKey)
      await redisClient.del(testKey)
      
      const latency = Date.now() - startTime
      const connected = retrieved !== null
      
      return {
        connected,
        latency: connected ? latency : null,
        info: redisClient.getConnectionInfo()
      }
    } catch (error) {
      return {
        connected: false,
        latency: null,
        info: redisClient.getConnectionInfo()
      }
    }
  }

  /**
   * Clear all cache for an organization
   */
  async clearOrganizationCache(orgId: string): Promise<number> {
    try {
      return await this.invalidatePatterns(InvalidationPatterns.ORGANIZATION_DATA(orgId))
    } catch (error) {
      console.warn(`Error clearing cache for organization ${orgId}:`, error)
      return 0
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number
    memoryUsage: string
    hitRate: number
  }> {
    try {
      // This would require Redis INFO command access
      // For now, return basic stats
      return {
        totalKeys: 0,
        memoryUsage: 'N/A',
        hitRate: 0
      }
    } catch (error) {
      console.warn('Error getting cache stats:', error)
      return {
        totalKeys: 0,
        memoryUsage: 'Error',
        hitRate: 0
      }
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService()

// Export utility functions for cache key generation
export const CacheUtils = {
  /**
   * Generate consistent list cache key
   */
  generateListKey: (entity: string, orgId: string, filters: any, page: number): string => {
    const filterHash = cacheService.generateFilterHash(filters || {})
    return `${entity}:${orgId}:${filterHash}:${page}`
  },

  /**
   * Generate consistent entity cache key
   */
  generateEntityKey: (entity: string, orgId: string, entityId: string): string => {
    return `${entity}:${orgId}:${entityId}`
  },

  /**
   * Generate consistent stats cache key
   */
  generateStatsKey: (entity: string, orgId: string): string => {
    return `${entity}_stats:${orgId}`
  },

  /**
   * Extract organization ID from cache key
   */
  extractOrgId: (key: string): string | null => {
    const parts = key.split(':')
    if (parts.length >= 2) {
      return parts[1]
    }
    return null
  }
} as const

export type { CacheService }
export { CacheService }