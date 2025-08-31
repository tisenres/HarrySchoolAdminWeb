import { NextRequest, NextResponse } from 'next/server'
import { RATE_LIMITS } from '@/lib/security/sanitization'

/**
 * Rate limiting store using in-memory Map with TTL
 * In production, this should be replaced with Redis or similar persistent store
 */
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup(): void {
    const now = Date.now()
    let cleanedCount = 0
    
    for (const [key, data] of this.store) {
      if (now > data.resetTime) {
        this.store.delete(key)
        cleanedCount++
      }
    }
    
    if (cleanedCount > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[RATE-LIMIT] Cleaned up ${cleanedCount} expired entries. Store size: ${this.store.size}`)
    }
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now()
    const resetTime = now + windowMs
    const existing = this.store.get(key)

    if (!existing || now > existing.resetTime) {
      // First request in window or window expired
      const data = { count: 1, resetTime }
      this.store.set(key, data)
      return data
    } else {
      // Increment existing count
      existing.count++
      this.store.set(key, existing)
      return existing
    }
  }

  getStats(): { size: number; memory: string } {
    return {
      size: this.store.size,
      memory: `${this.store.size}/10000` // Arbitrary limit for monitoring
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// Global rate limit store instance
const rateLimitStore = new RateLimitStore()

/**
 * Generate rate limit key for request identification
 */
function generateRateLimitKey(request: NextRequest, type: string): string {
  // Get IP address with fallback for proxy headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || request.ip || 'unknown'
  
  // Include user agent hash to prevent simple IP rotation attacks
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const userAgentHash = require('crypto').createHash('md5').update(userAgent).digest('hex').substring(0, 8)
  
  return `${type}:${ip}:${userAgentHash}`
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimit(config: {
  windowMs: number
  max: number
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}) {
  return async function rateLimitMiddleware(
    request: NextRequest,
    type: string = 'default'
  ): Promise<NextResponse | null> {
    const key = generateRateLimitKey(request, type)
    const { count, resetTime } = rateLimitStore.increment(key, config.windowMs)

    if (count > config.max) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
      
      const response = NextResponse.json(
        {
          success: false,
          error: config.message || 'Too many requests, please try again later.',
          retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
            'X-RateLimit-Policy': `${config.max};w=${Math.ceil(config.windowMs / 1000)}`
          }
        }
      )

      // Log rate limit violations in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[RATE-LIMIT] ${type.toUpperCase()} limit exceeded for ${key}: ${count}/${config.max}`)
      }

      return response
    }

    // Add rate limit headers to successful requests
    const remaining = Math.max(0, config.max - count)
    
    return NextResponse.next({
      headers: {
        'X-RateLimit-Limit': config.max.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
        'X-RateLimit-Policy': `${config.max};w=${Math.ceil(config.windowMs / 1000)}`
      }
    })
  }
}

/**
 * Pre-configured rate limiters for different endpoints
 */
export const rateLimiters = {
  // General API endpoints
  api: createRateLimit({
    windowMs: RATE_LIMITS.api.windowMs,
    max: RATE_LIMITS.api.max,
    message: 'Too many API requests. Please wait before making more requests.'
  }),

  // Authentication endpoints (login, register, forgot password)
  auth: createRateLimit({
    windowMs: RATE_LIMITS.auth.windowMs,
    max: RATE_LIMITS.auth.max,
    message: 'Too many authentication attempts. Please wait 15 minutes before trying again.'
  }),

  // Dashboard and UI endpoints
  dashboard: createRateLimit({
    windowMs: RATE_LIMITS.dashboard.windowMs,
    max: RATE_LIMITS.dashboard.max,
    message: 'Too many dashboard requests. Please slow down.'
  }),

  // Strict rate limiting for sensitive operations
  sensitive: createRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // Only 3 attempts
    message: 'Too many attempts for sensitive operation. Please wait 5 minutes.'
  }),

  // File upload rate limiting
  upload: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 uploads per minute
    message: 'Too many file uploads. Please wait before uploading more files.'
  })
}

/**
 * Apply rate limiting to API routes with automatic type detection
 */
export async function applyRateLimit(
  request: NextRequest,
  routeType?: 'api' | 'auth' | 'dashboard' | 'sensitive' | 'upload'
): Promise<NextResponse | null> {
  // Auto-detect route type if not provided
  let type = routeType
  if (!type) {
    const pathname = request.nextUrl.pathname
    if (pathname.includes('/auth/') || pathname.includes('/login')) {
      type = 'auth'
    } else if (pathname.includes('/upload') || pathname.includes('/files')) {
      type = 'upload'
    } else if (pathname.includes('/api/')) {
      type = 'api'
    } else {
      type = 'dashboard'
    }
  }

  const rateLimiter = rateLimiters[type]
  return rateLimiter(request, type)
}

/**
 * Enhanced rate limiting with user-specific limits
 */
export async function applyUserRateLimit(
  request: NextRequest,
  userId: string,
  config: { windowMs: number; max: number; message?: string }
): Promise<NextResponse | null> {
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const userAgentHash = require('crypto').createHash('md5').update(userAgent).digest('hex').substring(0, 8)
  const key = `user:${userId}:${userAgentHash}`
  
  const { count, resetTime } = rateLimitStore.increment(key, config.windowMs)

  if (count > config.max) {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
    
    return NextResponse.json(
      {
        success: false,
        error: config.message || 'Too many requests for this user account.',
        retryAfter
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString()
        }
      }
    )
  }

  return null // No rate limit applied
}

/**
 * Get rate limit statistics for monitoring
 */
export function getRateLimitStats() {
  return rateLimitStore.getStats()
}

// Export the store for testing purposes
export { rateLimitStore }