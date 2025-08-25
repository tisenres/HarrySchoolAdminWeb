import { NextRequest, NextResponse } from 'next/server'

// Optional import for DOMPurify (fallback to basic sanitization)
let DOMPurify: any = null
try {
  DOMPurify = require('isomorphic-dompurify')
} catch (error) {
  console.warn('DOMPurify not available, using basic sanitization')
}

// Enhanced caching middleware
export function withCaching(
  handler: Function,
  ttl: number = 60,
  staleWhileRevalidate: number = 300
) {
  return async (...args: any[]) => {
    const response = await handler(...args)
    
    if (response instanceof NextResponse && response.status === 200) {
      response.headers.set(
        'Cache-Control', 
        `public, s-maxage=${ttl}, stale-while-revalidate=${staleWhileRevalidate}`
      )
      response.headers.set('Vary', 'Accept, Accept-Encoding')
      response.headers.set('ETag', `"${Date.now()}"`)
    }
    
    return response
  }
}

// Input sanitization utility with fallback
export function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    const sanitized = data.trim()
    
    if (DOMPurify) {
      return DOMPurify.sanitize(sanitized)
    } else {
      // Basic XSS protection without DOMPurify
      return sanitized
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
    }
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item))
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  return data
}

// Rate limiting middleware
const rateLimiter = new Map<string, number[]>()

export function withRateLimit(requests: number = 100, windowMs: number = 60000) {
  return function(handler: Function) {
    return async (request: NextRequest, ...args: any[]) => {
      const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
      const now = Date.now()
      const windowStart = now - windowMs
      
      const userRequests = rateLimiter.get(clientIP) || []
      const recentRequests = userRequests.filter((time: number) => time > windowStart)
      
      if (recentRequests.length >= requests) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429, headers: { 'Retry-After': String(Math.ceil(windowMs / 1000)) } }
        )
      }
      
      rateLimiter.set(clientIP, [...recentRequests, now])
      return handler(request, ...args)
    }
  }
}

// Timeout wrapper for promises
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ])
}

// Circuit breaker pattern for external services
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  
  constructor(
    private maxFailures: number = 5,
    private resetTimeoutMs: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'HALF_OPEN'
      } else {
        throw new Error('Service temporarily unavailable (circuit breaker open)')
      }
    }

    try {
      const result = await withTimeout(operation(), 30000)
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failures = 0
    this.state = 'CLOSED'
  }

  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()
    if (this.failures >= this.maxFailures) {
      this.state = 'OPEN'
    }
  }
}

// Performance monitoring middleware
export function withPerformanceMonitoring(handler: Function) {
  return async (...args: any[]) => {
    const startTime = Date.now()
    const startMemory = process.memoryUsage()
    
    try {
      const result = await handler(...args)
      
      // Log performance metrics
      const duration = Date.now() - startTime
      const memoryUsed = process.memoryUsage().heapUsed - startMemory.heapUsed
      
      if (duration > 1000 || memoryUsed > 10 * 1024 * 1024) { // Log slow requests or high memory usage
        console.log(`[PERFORMANCE] Route: ${args[0]?.url || 'unknown'}, Duration: ${duration}ms, Memory: ${Math.round(memoryUsed / 1024 / 1024)}MB`)
      }
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[PERFORMANCE ERROR] Route failed after ${duration}ms:`, error.message)
      throw error
    }
  }
}

// Global error boundary for API routes
export function withErrorBoundary(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      // Log error details
      console.error('[API ERROR]', {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        route: args[0]?.url || 'unknown'
      })

      // Return appropriate error response
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        return NextResponse.json(
          { error: 'Request timeout - please try again' },
          { status: 408 }
        )
      }

      if (error.message.includes('circuit breaker') || error.message.includes('Service temporarily unavailable')) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable - please try again later' },
          { status: 503 }
        )
      }

      if (error.message.includes('Rate limit')) {
        return NextResponse.json(
          { error: 'Too many requests - please slow down' },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Resource cleanup manager
export class ResourceManager {
  private timers: NodeJS.Timeout[] = []
  private connections: any[] = []
  private cleanup: (() => void)[] = []

  addTimer(timer: NodeJS.Timeout) {
    this.timers.push(timer)
  }

  addConnection(connection: any) {
    this.connections.push(connection)
  }

  addCleanup(cleanupFn: () => void) {
    this.cleanup.push(cleanupFn)
  }

  cleanup() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers = []

    // Close all connections
    this.connections.forEach(conn => {
      try {
        if (conn.close) conn.close()
        if (conn.destroy) conn.destroy()
        if (conn.end) conn.end()
      } catch (error) {
        console.warn('Error closing connection:', error)
      }
    })
    this.connections = []

    // Run custom cleanup functions
    this.cleanup.forEach(cleanupFn => {
      try {
        cleanupFn()
      } catch (error) {
        console.warn('Error in cleanup function:', error)
      }
    })
    this.cleanup = []

    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
  }
}

// Combine multiple middleware functions
export function withMiddleware(...middlewares: Function[]) {
  return function(handler: Function) {
    return middlewares.reduceRight((acc, middleware) => {
      return middleware(acc)
    }, handler)
  }
}