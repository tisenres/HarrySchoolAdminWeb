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
  private cleanupInterval: NodeJS.Timeout

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
      return null
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return cached
  }

  /**
   * Store authentication result in cache
   */
  set(userId: string, authResult: { user: any; profile: any; organization?: any }, sessionHash?: string): void {
    const key = this.generateKey(userId, sessionHash)
    const now = Date.now()
    
    const cachedResult: CachedAuthResult = {
      ...authResult,
      cachedAt: now,
      expiresAt: now + this.TTL
    }

    this.cache.set(key, cachedResult)
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
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: Implement hit rate tracking
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

    if (cleanedCount > 0) {
      console.log(`[AUTH-CACHE] Cleaned up ${cleanedCount} expired entries. Cache size: ${this.cache.size}`)
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