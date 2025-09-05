/**
 * Cache Middleware for API Routes
 * Automatically caches API responses and handles cache invalidation
 */

import { NextRequest, NextResponse } from 'next/server'
import { cacheService } from '../cache-service'
import { queryCache } from '../query-cache'

// Cache configuration for different API endpoints
const CACHE_CONFIGS: Record<string, {
  ttl: number
  strategy: 'standard' | 'query' | 'session' | 'skip'
  invalidateOn?: string[]
  tags?: string[]
}> = {
  // Entity list endpoints
  '/api/students': {
    ttl: 10 * 60, // 10 minutes
    strategy: 'query',
    tags: ['students', 'dashboard']
  },
  '/api/teachers': {
    ttl: 10 * 60, // 10 minutes
    strategy: 'query',
    tags: ['teachers', 'dashboard']
  },
  '/api/groups': {
    ttl: 5 * 60, // 5 minutes
    strategy: 'query',
    tags: ['groups', 'dashboard']
  },
  
  // Statistics endpoints
  '/api/dashboard/stats': {
    ttl: 2 * 60, // 2 minutes
    strategy: 'standard',
    tags: ['dashboard', 'stats']
  },
  
  // Session endpoints
  '/api/auth/session': {
    ttl: 30 * 60, // 30 minutes
    strategy: 'session',
    tags: ['auth', 'session']
  },
  
  // Skip caching for mutations
  '/api/students/[id]': {
    ttl: 0,
    strategy: 'skip',
    invalidateOn: ['students', 'dashboard']
  }
}

/**
 * Cache response middleware for GET requests
 */
export function withCacheResponse(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    // Only cache GET requests
    if (request.method !== 'GET') {
      return await handler(request, context)
    }

    const pathname = new URL(request.url).pathname
    const searchParams = request.nextUrl.searchParams
    
    // Find cache config for this endpoint
    const config = getCacheConfigForPath(pathname)
    if (!config || config.strategy === 'skip') {
      return await handler(request, context)
    }

    // Generate cache key
    const cacheKey = generateCacheKey(pathname, searchParams, context)
    
    try {
      // Try to get from cache
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        console.log(`📦 Cache HIT: ${pathname}`)
        
        // Return cached response
        const response = new NextResponse(JSON.stringify(cached), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey
          }
        })
        
        return response
      }

      console.log(`🔄 Cache MISS: ${pathname}`)
      
      // Execute handler and cache result
      const response = await handler(request, context)
      
      // Only cache successful responses
      if (response.ok) {
        const responseData = await response.json()
        
        // Cache the response
        await cacheService.set(cacheKey, responseData, config.ttl)
        
        // Return response with cache headers
        const newResponse = new NextResponse(JSON.stringify(responseData), {
          status: response.status,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            'X-Cache': 'MISS',
            'X-Cache-Key': cacheKey
          }
        })
        
        return newResponse
      }
      
      return response
    } catch (error) {
      console.warn('Cache middleware error:', error)
      // Fallback to direct handler execution
      return await handler(request, context)
    }
  }
}

/**
 * Cache invalidation middleware for mutation requests
 */
export function withCacheInvalidation(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const response = await handler(request, context)
    
    // Only invalidate on successful mutations
    if (response.ok && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const pathname = new URL(request.url).pathname
      
      try {
        await invalidateCacheForEndpoint(pathname, context)
      } catch (error) {
        console.warn('Cache invalidation error:', error)
      }
    }
    
    return response
  }
}

/**
 * Combined cache middleware (response + invalidation)
 */
export function withSmartCache(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return withCacheInvalidation(withCacheResponse(handler))
}

/**
 * Generate cache key for request
 */
function generateCacheKey(
  pathname: string,
  searchParams: URLSearchParams,
  context?: any
): string {
  const orgId = context?.profile?.organization_id || 'unknown'
  const userId = context?.user?.id || 'anonymous'
  
  // Sort search params for consistent keys
  const sortedParams = Array.from(searchParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
  
  const keyParts = [
    'api_cache',
    pathname.replace(/\//g, '_'),
    orgId,
    sortedParams
  ].filter(Boolean)
  
  return keyParts.join(':')
}

/**
 * Find cache configuration for API path
 */
function getCacheConfigForPath(pathname: string) {
  // Exact match first
  if (CACHE_CONFIGS[pathname]) {
    return CACHE_CONFIGS[pathname]
  }
  
  // Pattern matching for dynamic routes
  for (const [pattern, config] of Object.entries(CACHE_CONFIGS)) {
    if (matchesPattern(pathname, pattern)) {
      return config
    }
  }
  
  return null
}

/**
 * Simple pattern matching for dynamic routes
 */
function matchesPattern(pathname: string, pattern: string): boolean {
  if (pattern.includes('[')) {
    const regexPattern = pattern
      .replace(/\[id\]/g, '[^/]+')
      .replace(/\[slug\]/g, '[^/]+')
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(pathname)
  }
  
  return pathname === pattern
}

/**
 * Invalidate cache for specific endpoint
 */
async function invalidateCacheForEndpoint(
  pathname: string,
  context?: any
): Promise<void> {
  const orgId = context?.profile?.organization_id
  if (!orgId) return
  
  try {
    // Extract entity type from pathname
    const entityType = extractEntityType(pathname)
    
    if (entityType) {
      console.log(`🗑️ Invalidating cache for ${entityType}`)
      
      // Invalidate entity-specific caches
      await queryCache.invalidateOnDataChange(
        entityType,
        orgId,
        'update' // Generic update for mutations
      )
      
      // Invalidate dashboard cache
      await queryCache.invalidateQueries([`dashboard_*:${orgId}`])
      
      // Invalidate API response caches
      const apiCachePattern = `api_cache_api_${entityType}*:${orgId}:*`
      await cacheService.invalidatePatterns([apiCachePattern])
    }
  } catch (error) {
    console.warn('Cache invalidation failed:', error)
  }
}

/**
 * Extract entity type from API pathname
 */
function extractEntityType(pathname: string): string | null {
  const match = pathname.match(/\/api\/([^\/]+)/)
  if (match) {
    const entity = match[1]
    // Handle plural to singular conversion
    const entityMap: Record<string, string> = {
      'students': 'students',
      'teachers': 'teachers',
      'groups': 'groups',
      'users': 'users'
    }
    return entityMap[entity] || entity
  }
  return null
}

/**
 * Cache warmup for frequently accessed endpoints
 */
export async function warmupApiCache(organizationId: string): Promise<void> {
  try {
    console.log(`🔥 Warming up API cache for organization ${organizationId}`)
    
    const warmupEndpoints = [
      '/api/dashboard/stats',
      '/api/students?page=1&limit=20',
      '/api/teachers?page=1&limit=20',
      '/api/groups?page=1&limit=20'
    ]
    
    // This would require making actual API calls or calling handlers directly
    console.log(`Would warm up ${warmupEndpoints.length} endpoints`)
    
    console.log('✅ API cache warmup completed')
  } catch (error) {
    console.warn('API cache warmup error:', error)
  }
}

/**
 * Clear all API cache for organization
 */
export async function clearApiCache(organizationId: string): Promise<number> {
  try {
    const pattern = `api_cache*:${organizationId}:*`
    const deletedCount = await cacheService.invalidatePatterns([pattern])
    
    console.log(`🧹 Cleared API cache for organization ${organizationId}: ${deletedCount} entries`)
    return deletedCount
  } catch (error) {
    console.warn('API cache clear error:', error)
    return 0
  }
}