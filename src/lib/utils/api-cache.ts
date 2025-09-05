/**
 * Enhanced API Response Cache for Harry School CRM
 * Provides in-memory caching with memory management and performance optimization
 */

// Import OptimizedApiCache conditionally to avoid circular dependencies
let OptimizedApiCache: any = null
try {
  const memoryManagement = require('./memory-management')
  OptimizedApiCache = memoryManagement.OptimizedApiCache
} catch (error) {
  // Fallback to Map if memory-management is not available
  console.warn('OptimizedApiCache not available, using basic Map')
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
  key: string
  size: number
  hitCount: number
  lastAccessed: number
}

class ApiCache {
  private cache = OptimizedApiCache ? new OptimizedApiCache() : new Map<string, any>()
  private hitStats = new Map<string, { hits: number, misses: number }>()
  private defaultTTL = 30 * 1000 // 30 seconds for API responses
  private statsTTL = 2 * 60 * 1000 // 2 minutes for statistics
  private listTTL = 60 * 1000 // 1 minute for lists
  private cleanupInterval: NodeJS.Timeout
  
  constructor() {
    // Auto-cleanup every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.performMaintenance()
    }, 2 * 60 * 1000)
  }

  /**
   * Generate cache key from request parameters
   */
  private generateKey(prefix: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|')
    return `${prefix}:${sortedParams}`
  }

  /**
   * Set cached data with enhanced tracking
   */
  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      expiry: now + ttl,
      key,
      size: this.estimateSize(data),
      hitCount: 0,
      lastAccessed: now
    })
    
    // Initialize hit stats if not exists
    if (!this.hitStats.has(key)) {
      this.hitStats.set(key, { hits: 0, misses: 0 })
    }
  }

  /**
   * Get cached data with hit tracking
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | null
    const stats = this.hitStats.get(key) || { hits: 0, misses: 0 }
    
    if (!entry || Date.now() > entry.expiry) {
      this.cache.delete(key)
      stats.misses++
      this.hitStats.set(key, stats)
      return null
    }
    
    // Update access tracking
    entry.hitCount++
    entry.lastAccessed = Date.now()
    stats.hits++
    this.hitStats.set(key, stats)
    
    return entry.data
  }

  /**
   * Check if data exists in cache and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Clear specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache entries for a prefix with stats cleanup
   */
  clearPrefix(prefix: string): number {
    let cleared = 0
    for (const [key] of this.cache.entries()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
        this.hitStats.delete(key)
        cleared++
      }
    }
    return cleared
  }

  /**
   * Clear all cache with stats reset
   */
  clear(): void {
    this.cache.clear()
    this.hitStats.clear()
  }

  /**
   * Enhanced cleanup with performance optimization
   */
  cleanup(): { expired: number, evicted: number } {
    if (this.cache.cleanup) {
      return this.cache.cleanup()
    } else {
      // Basic cleanup for Map fallback
      const now = Date.now()
      let expired = 0
      for (const [key, entry] of this.cache.entries()) {
        if (entry && now > entry.expiry) {
          this.cache.delete(key)
          expired++
        }
      }
      return { expired, evicted: 0 }
    }
  }
  
  /**
   * Comprehensive maintenance including LRU eviction
   */
  performMaintenance(): { expired: number, evicted: number, hitRate: number } {
    const cleanupResult = this.cleanup()
    
    // Calculate overall hit rate
    let totalHits = 0
    let totalMisses = 0
    
    for (const stats of this.hitStats.values()) {
      totalHits += stats.hits
      totalMisses += stats.misses
    }
    
    const hitRate = totalHits + totalMisses > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 0
    
    // Log performance if hit rate is low
    if (hitRate < 50 && totalHits + totalMisses > 100) {
      console.log(`[CACHE] Low hit rate: ${hitRate.toFixed(2)}% (${totalHits} hits, ${totalMisses} misses)`)
    }
    
    return {
      ...cleanupResult,
      hitRate
    }
  }

  // Specialized methods for different data types
  
  /**
   * Cache list data (teachers, students, etc.)
   */
  setList<T>(prefix: string, params: Record<string, any>, data: T): string {
    const key = this.generateKey(prefix, params)
    this.set(key, data, this.listTTL)
    return key
  }

  getList<T>(prefix: string, params: Record<string, any>): T | null {
    const key = this.generateKey(prefix, params)
    return this.get<T>(key)
  }

  /**
   * Cache statistics data
   */
  setStats<T>(prefix: string, data: T): string {
    const key = `${prefix}:stats`
    this.set(key, data, this.statsTTL)
    return key
  }

  getStats<T>(prefix: string): T | null {
    const key = `${prefix}:stats`
    return this.get<T>(key)
  }

  /**
   * Invalidate related caches when data changes
   */
  invalidateRelated(resource: string): void {
    // Clear all caches related to the resource
    this.clearPrefix(`${resource}:`)
    
    // Also clear dashboard stats that might depend on this resource
    this.clearPrefix('stats:')
    this.clearPrefix('dashboard:')
  }

  /**
   * Enhanced cache statistics for monitoring
   */
  getStats(): {
    size: number
    memoryStats: any
    hitRate: number
    topKeys: Array<{ key: string, hits: number, size: number }>
    performance: {
      avgHitTime: number
      avgMissTime: number
    }
  } {
    // Calculate hit rates
    let totalHits = 0
    let totalMisses = 0
    
    for (const stats of this.hitStats.values()) {
      totalHits += stats.hits
      totalMisses += stats.misses
    }
    
    const hitRate = totalHits + totalMisses > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 0
    
    // Get top performing cache keys
    const topKeys = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        hits: entry.hitCount || 0,
        size: entry.size || 0
      }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10)
    
    return {
      size: this.cache.size,
      memoryStats: this.cache.getMemoryStats ? this.cache.getMemoryStats() : { currentUsage: 0, maxUsage: 0, usagePercentage: 0 },
      hitRate,
      topKeys,
      performance: {
        avgHitTime: 1, // Placeholder - would need actual timing
        avgMissTime: 50 // Placeholder - would need actual timing
      }
    }
  }

  /**
   * Enhanced cache wrapper with performance monitoring
   */
  async cached<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl = this.defaultTTL,
    options: {
      skipCache?: boolean
      refreshInBackground?: boolean
      onCacheHit?: (key: string) => void
      onCacheMiss?: (key: string, fetchTime: number) => void
    } = {}
  ): Promise<T> {
    const { skipCache = false, refreshInBackground = false, onCacheHit, onCacheMiss } = options
    
    // Skip cache if requested
    if (skipCache) {
      const startTime = Date.now()
      const data = await fetchFn()
      onCacheMiss?.(key, Date.now() - startTime)
      this.set(key, data, ttl)
      return data
    }
    
    // Try cache first
    const cached = this.get<T>(key)
    if (cached) {
      onCacheHit?.(key)
      
      // Refresh in background if requested
      if (refreshInBackground) {
        setTimeout(async () => {
          try {
            const freshData = await fetchFn()
            this.set(key, freshData, ttl)
          } catch (error) {
            console.warn(`Background refresh failed for key ${key}:`, error)
          }
        }, 0)
      }
      
      return cached
    }

    // Fetch fresh data
    const startTime = Date.now()
    const data = await fetchFn()
    const fetchTime = Date.now() - startTime
    
    onCacheMiss?.(key, fetchTime)
    this.set(key, data, ttl)
    return data
  }
  
  /**
   * Estimate memory size of data
   */
  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2 // UTF-16 estimate
    } catch {
      return 1000 // Default size for non-serializable data
    }
  }
  
  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clear()
  }
}

export const apiCache = new ApiCache()

// Export cache statistics for monitoring
export const getCacheStats = () => apiCache.getStats()
export const getCacheMemoryStats = () => {
  if (apiCache.cache.getMemoryStats) {
    return apiCache.cache.getMemoryStats()
  } else {
    return { currentUsage: 0, maxUsage: 0, usagePercentage: 0, entryCount: apiCache.cache.size }
  }
}

// Graceful shutdown for server environments
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    apiCache.destroy()
  })
  process.on('SIGINT', () => {
    apiCache.destroy()
  })
}