/**
 * Smart Caching Service for Harry School CRM
 * Advanced caching strategies for improved performance
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
  version: string
  dependencies?: string[]
}

interface CacheConfig {
  ttl: number
  version: string
  dependencies?: string[]
  maxSize?: number
}

class SmartCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes
  private readonly maxCacheSize = 1000
  private hitCount = 0
  private missCount = 0

  /**
   * Set cache entry with smart expiration and dependencies
   */
  set<T>(key: string, data: T, config: Partial<CacheConfig> = {}): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + (config.ttl || this.defaultTTL),
      version: config.version || '1.0.0',
      dependencies: config.dependencies,
    }

    // Handle cache size limit
    if (this.cache.size >= (config.maxSize || this.maxCacheSize)) {
      this.evictLeastRecentlyUsed()
    }

    this.cache.set(key, entry)
  }

  /**
   * Get cached data with dependency validation
   */
  get<T>(key: string, expectedVersion?: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.missCount++
      return null
    }

    // Check expiry
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      this.missCount++
      return null
    }

    // Check version compatibility
    if (expectedVersion && entry.version !== expectedVersion) {
      this.cache.delete(key)
      this.missCount++
      return null
    }

    this.hitCount++
    return entry.data
  }

  /**
   * Invalidate cache entries by dependency
   */
  invalidateByDependency(dependency: string): void {
    const keysToInvalidate: string[] = []
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.dependencies?.includes(dependency)) {
        keysToInvalidate.push(key)
      }
    }

    keysToInvalidate.forEach(key => this.cache.delete(key))
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidateByPattern(pattern: RegExp): void {
    const keysToInvalidate: string[] = []
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToInvalidate.push(key)
      }
    }

    keysToInvalidate.forEach(key => this.cache.delete(key))
  }

  /**
   * Prefetch data with background refresh
   */
  async prefetch<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    config: Partial<CacheConfig> = {}
  ): Promise<T> {
    const cached = this.get<T>(key)
    
    if (cached) {
      // Background refresh for stale data
      const entry = this.cache.get(key)
      if (entry && (Date.now() - entry.timestamp) > (config.ttl || this.defaultTTL) * 0.5) {
        setTimeout(async () => {
          try {
            const fresh = await fetchFn()
            this.set(key, fresh, config)
          } catch (error) {
            console.warn('Background refresh failed for key:', key, error)
          }
        }, 0)
      }
      return cached
    }

    // Fresh fetch
    const data = await fetchFn()
    this.set(key, data, config)
    return data
  }

  /**
   * Bulk set operation for related data
   */
  setBulk<T>(entries: Array<{ key: string; data: T; config?: Partial<CacheConfig> }>): void {
    entries.forEach(({ key, data, config }) => {
      this.set(key, data, config)
    })
  }

  /**
   * Get or fetch with automatic caching
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config: Partial<CacheConfig> = {}
  ): Promise<T> {
    const cached = this.get<T>(key, config.version)
    if (cached) return cached

    const data = await fetchFn()
    this.set(key, data, config)
    return data
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null
    let oldestTimestamp = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    hitRate: number
    totalHits: number
    totalMisses: number
    entries: Array<{ key: string; age: number; ttl: number; size: number }>
  } {
    const totalRequests = this.hitCount + this.missCount
    const now = Date.now()

    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: Math.max(0, entry.expiry - now),
      size: JSON.stringify(entry.data).length, // Approximate size
    }))

    return {
      size: this.cache.size,
      hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0,
      totalHits: this.hitCount,
      totalMisses: this.missCount,
      entries
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.hitCount = 0
    this.missCount = 0
  }

  /**
   * Warm up cache with predefined data
   */
  warmup<T>(entries: Array<{ key: string; data: T; config?: Partial<CacheConfig> }>): void {
    this.setBulk(entries)
  }
}

// Predefined cache configurations for different data types
export const cacheConfigs = {
  // Static reference data (specializations, statuses, etc.)
  staticData: {
    ttl: 30 * 60 * 1000, // 30 minutes
    version: '1.0.0',
    dependencies: ['system']
  },

  // User data (profiles, preferences)
  userData: {
    ttl: 10 * 60 * 1000, // 10 minutes  
    version: '1.0.0',
    dependencies: ['auth', 'profile']
  },

  // Listing data (teachers, students, groups)
  listingData: {
    ttl: 5 * 60 * 1000, // 5 minutes
    version: '1.0.0',
    dependencies: ['data']
  },

  // Dashboard analytics 
  analyticsData: {
    ttl: 2 * 60 * 1000, // 2 minutes
    version: '1.0.0',
    dependencies: ['analytics', 'data']
  },

  // Real-time data (notifications, activity)
  realTimeData: {
    ttl: 30 * 1000, // 30 seconds
    version: '1.0.0',
    dependencies: ['realtime']
  },

  // Search results
  searchData: {
    ttl: 3 * 60 * 1000, // 3 minutes
    version: '1.0.0',
    dependencies: ['search']
  }
}

// Global smart cache instance
export const smartCache = new SmartCache()

// Cleanup interval - run every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => smartCache.cleanup(), 5 * 60 * 1000)
}

// Cache invalidation helpers
export const cacheInvalidation = {
  // Invalidate when teacher data changes
  onTeacherChange: () => {
    smartCache.invalidateByDependency('data')
    smartCache.invalidateByDependency('analytics')
    smartCache.invalidateByPattern(/^teachers:/)
  },

  // Invalidate when student data changes  
  onStudentChange: () => {
    smartCache.invalidateByDependency('data')
    smartCache.invalidateByDependency('analytics')
    smartCache.invalidateByPattern(/^students:/)
  },

  // Invalidate when group data changes
  onGroupChange: () => {
    smartCache.invalidateByDependency('data')
    smartCache.invalidateByDependency('analytics')
    smartCache.invalidateByPattern(/^groups:/)
  },

  // Invalidate when user profile changes
  onProfileChange: () => {
    smartCache.invalidateByDependency('profile')
    smartCache.invalidateByPattern(/^profile:/)
  },

  // Invalidate auth-related cache
  onAuthChange: () => {
    smartCache.invalidateByDependency('auth')
    smartCache.invalidateByDependency('profile')
    smartCache.clear() // Full clear on auth changes for security
  }
}