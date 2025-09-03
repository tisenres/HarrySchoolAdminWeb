/**
 * Authentication result caching system
 * Reduces auth calls from 4 per request to 1 by caching user + profile + organization data
 */

interface CachedAuthResult {
  user: any
  profile: any
  organization?: any
  cachedAt: number
  expiresAt: number
}

class AuthCache {
  private cache = new Map<string, CachedAuthResult>()
  private readonly TTL = 5 * 60 * 1000 // 5 minutes in milliseconds
  private readonly MAX_CACHE_SIZE = 1000 // Maximum number of cached entries
  private readonly CLEANUP_THRESHOLD = 0.8 // Clean when cache reaches 80% capacity
  private cleanupInterval: NodeJS.Timeout
  private hitCount = 0
  private missCount = 0

  constructor() {
    // Clean up expired entries every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 2 * 60 * 1000)
  }

  /**
   * Generate cache key from user session
   */
  private generateKey(userId: string, sessionHash?: string): string {
    const hash = sessionHash || 'no-session'
    return `auth:${userId}:${hash}`
  }

  /**
   * Get authentication result from cache
   */
  get(userId: string, sessionHash?: string): CachedAuthResult | null {
    const key = this.generateKey(userId, sessionHash)
    const cached = this.cache.get(key)
    
    if (!cached) {
      this.missCount++
      return null
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key)
      this.missCount++
      return null
    }

    this.hitCount++
    return cached
  }

  /**
   * Store authentication result in cache
   */
  set(userId: string, authResult: { user: any; profile: any; organization?: any }, sessionHash?: string): void {
    // Check if cache size limit reached and trigger cleanup if needed
    if (this.cache.size >= this.MAX_CACHE_SIZE * this.CLEANUP_THRESHOLD) {
      this.forceCleanup()
    }
    
    const key = this.generateKey(userId, sessionHash)
    const now = Date.now()
    
    const cachedResult: CachedAuthResult = {
      ...authResult,
      cachedAt: now,
      expiresAt: now + this.TTL
    }

    this.cache.set(key, cachedResult)
    
    // Hard limit - if we're still over capacity after cleanup, remove oldest entries
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      this.evictOldestEntries()
    }
  }

  /**
   * Invalidate cache for specific user
   */
  invalidate(userId: string, sessionHash?: string): void {
    if (sessionHash) {
      const key = this.generateKey(userId, sessionHash)
      this.cache.delete(key)
    } else {
      // Invalidate all sessions for this user
      const prefix = `auth:${userId}:`
      for (const [key] of this.cache) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key)
        }
      }
    }
  }

  /**
   * Clear all cached auth results
   */
  clear(): void {
    this.cache.clear()
    this.hitCount = 0
    this.missCount = 0
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hitRate: number; totalRequests: number; memoryUsage: string } {
    const totalRequests = this.hitCount + this.missCount
    const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) : 0
    
    return {
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimal places
      totalRequests,
      memoryUsage: `${this.cache.size}/${this.MAX_CACHE_SIZE}`
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, cached] of this.cache) {
      if (now > cached.expiresAt) {
        this.cache.delete(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[AUTH-CACHE] Cleaned up ${cleanedCount} expired entries. Cache size: ${this.cache.size}`)
    }
  }

  /**
   * Force cleanup - more aggressive than regular cleanup
   */
  private forceCleanup(): void {
    const now = Date.now()
    let cleanedCount = 0

    // First, remove all expired entries
    for (const [key, cached] of this.cache) {
      if (now > cached.expiresAt) {
        this.cache.delete(key)
        cleanedCount++
      }
    }

    // If still over threshold, remove entries that are close to expiring (within 1 minute)
    if (this.cache.size >= this.MAX_CACHE_SIZE * this.CLEANUP_THRESHOLD) {
      const gracePeriod = 60 * 1000 // 1 minute
      for (const [key, cached] of this.cache) {
        if (now + gracePeriod > cached.expiresAt) {
          this.cache.delete(key)
          cleanedCount++
        }
        
        // Stop if we're under the threshold
        if (this.cache.size < this.MAX_CACHE_SIZE * this.CLEANUP_THRESHOLD) {
          break
        }
      }
    }

    if (cleanedCount > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[AUTH-CACHE] Force cleanup removed ${cleanedCount} entries. Cache size: ${this.cache.size}`)
    }
  }

  /**
   * Evict oldest entries when hard limit is reached
   */
  private evictOldestEntries(): void {
    // Convert to array and sort by cachedAt timestamp (oldest first)
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.cachedAt - b.cachedAt)
    
    // Remove oldest entries until we're under the limit
    let evictedCount = 0
    while (this.cache.size > this.MAX_CACHE_SIZE && evictedCount < entries.length) {
      const [key] = entries[evictedCount]
      this.cache.delete(key)
      evictedCount++
    }

    if (evictedCount > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[AUTH-CACHE] Evicted ${evictedCount} oldest entries. Cache size: ${this.cache.size}`)
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
  }
}

// Export singleton instance
export const authCache = new AuthCache()

// Export types for TypeScript support
export type { CachedAuthResult }