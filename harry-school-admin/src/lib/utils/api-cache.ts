/**
 * API Response Cache for Harry School CRM
 * Provides in-memory caching for API responses to improve performance
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
  key: string
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 30 * 1000 // 30 seconds for API responses
  private statsTTL = 2 * 60 * 1000 // 2 minutes for statistics
  private listTTL = 60 * 1000 // 1 minute for lists

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
   * Set cached data
   */
  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
      key
    })
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry || Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }
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
   * Clear all cache entries for a prefix
   */
  clearPrefix(prefix: string): void {
    for (const [key] of this.cache.entries()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clean expired entries
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key)
      }
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
   * Get cache statistics for monitoring
   */
  getStats(): {
    size: number
    entries: { key: string; age: number; ttl: number }[]
    hitRate: number
  } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: Math.max(0, entry.expiry - now)
    }))

    return {
      size: this.cache.size,
      entries,
      hitRate: 0 // Would need hit tracking for this
    }
  }

  /**
   * Cache wrapper function for API calls
   */
  async cached<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl = this.defaultTTL
  ): Promise<T> {
    // Try cache first
    const cached = this.get<T>(key)
    if (cached) {
      return cached
    }

    // Fetch fresh data
    const data = await fetchFn()
    this.set(key, data, ttl)
    return data
  }
}

export const apiCache = new ApiCache()

// Cleanup expired entries every 2 minutes
if (typeof window === 'undefined') {
  setInterval(() => apiCache.cleanup(), 2 * 60 * 1000)
}