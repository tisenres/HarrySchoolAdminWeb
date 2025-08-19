/**
 * Enhanced authentication cache for Harry School CRM
 * Reduces redundant authentication and organization queries
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

class AuthCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 2 * 60 * 1000 // 2 minutes for auth data
  private orgTTL = 5 * 60 * 1000     // 5 minutes for organization data
  private userTTL = 3 * 60 * 1000    // 3 minutes for user data

  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry || Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }
    return entry.data
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key)
      }
    }
  }

  // Specialized methods for auth data
  setUser(userId: string, userData: any): void {
    this.set(`user:${userId}`, userData, this.userTTL)
  }

  getUser(userId: string): any | null {
    return this.get(`user:${userId}`)
  }

  setOrganization(userId: string, orgData: any): void {
    this.set(`org:${userId}`, orgData, this.orgTTL)
  }

  getOrganization(userId: string): any | null {
    return this.get(`org:${userId}`)
  }

  setProfile(userId: string, profileData: any): void {
    this.set(`profile:${userId}`, profileData, this.userTTL)
  }

  getProfile(userId: string): any | null {
    return this.get(`profile:${userId}`)
  }

  // Invalidate user-related caches when user logs out
  clearUserCache(userId: string): void {
    this.cache.delete(`user:${userId}`)
    this.cache.delete(`org:${userId}`)
    this.cache.delete(`profile:${userId}`)
  }

  // Get cache statistics for monitoring
  getStats(): {
    size: number
    entries: { key: string; age: number; ttl: number }[]
  } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: Math.max(0, entry.expiry - now)
    }))

    return {
      size: this.cache.size,
      entries
    }
  }
}

export const authCache = new AuthCache()

// Cleanup expired entries every minute
if (typeof window === 'undefined') {
  setInterval(() => authCache.cleanup(), 60000)
}