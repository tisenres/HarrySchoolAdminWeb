// Simple in-memory cache for auth data to reduce redundant requests
interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

class AuthCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 30000 // 30 seconds

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
}

export const authCache = new AuthCache()

// Cleanup expired entries every minute
if (typeof window === 'undefined') {
  setInterval(() => authCache.cleanup(), 60000)
}