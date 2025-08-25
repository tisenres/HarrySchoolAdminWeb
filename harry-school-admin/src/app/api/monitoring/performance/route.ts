import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/api-auth'
import { getCacheStats, getCacheMemoryStats } from '@/lib/utils/api-cache'
// Import connection pool stats conditionally
let getConnectionPoolStats: any = null
try {
  const supabaseServer = require('@/lib/supabase-server')
  getConnectionPoolStats = supabaseServer.getConnectionPoolStats
} catch (error) {
  console.warn('Connection pool stats not available')
}

export const GET = withAuth(async (request: NextRequest, context) => {
  try {
    // Only superadmin can view performance metrics
    if (context.profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Collect performance metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      cache: {
        ...getCacheStats(),
        memory: getCacheMemoryStats()
      },
      database: {
        connectionPool: getConnectionPoolStats ? getConnectionPoolStats() : {
          total: 0,
          inUse: 0,
          available: 0,
          maxConnections: 0
        }
      },
      system: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      performance: {
        eventLoopDelay: await getEventLoopDelay(),
        cpuUsage: process.cpuUsage(),
        resourceUsage: process.resourceUsage?.() || null
      }
    }

    const response = NextResponse.json({
      success: true,
      data: metrics
    })

    // Add performance headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('X-Monitoring-Version', '1.0')
    
    return response

  } catch (error) {
    console.error('Performance monitoring error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get performance metrics' 
      },
      { status: 500 }
    )
  }
}, 'superadmin')

// Helper function to measure event loop delay
function getEventLoopDelay(): Promise<number> {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint()
    setImmediate(() => {
      const delay = Number(process.hrtime.bigint() - start) / 1000000 // Convert to milliseconds
      resolve(delay)
    })
  })
}

// Performance optimization recommendations endpoint
export const POST = withAuth(async (request: NextRequest, context) => {
  try {
    if (context.profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const metrics = {
      cache: getCacheStats(),
      memory: getCacheMemoryStats(),
      database: getConnectionPoolStats ? getConnectionPoolStats() : { total: 0, inUse: 0, available: 0 },
      system: process.memoryUsage()
    }

    const recommendations = generateRecommendations(metrics)

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        recommendations,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Performance analysis error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to analyze performance' 
      },
      { status: 500 }
    )
  }
}, 'superadmin')

function generateRecommendations(metrics: any): Array<{
  type: 'warning' | 'info' | 'error'
  category: string
  message: string
  action?: string
}> {
  const recommendations: Array<{
    type: 'warning' | 'info' | 'error'
    category: string
    message: string
    action?: string
  }> = []

  // Cache performance recommendations
  if (metrics.cache.hitRate < 50) {
    recommendations.push({
      type: 'warning',
      category: 'Cache',
      message: `Low cache hit rate: ${metrics.cache.hitRate.toFixed(2)}%`,
      action: 'Consider increasing cache TTL or reviewing cache keys'
    })
  }

  if (metrics.memory.usagePercentage > 80) {
    recommendations.push({
      type: 'error',
      category: 'Memory',
      message: `High cache memory usage: ${metrics.memory.usagePercentage.toFixed(2)}%`,
      action: 'Consider reducing cache size or implementing more aggressive cleanup'
    })
  }

  // Database connection pool recommendations
  if (metrics.database.inUse / metrics.database.total > 0.8) {
    recommendations.push({
      type: 'warning',
      category: 'Database',
      message: `High connection pool usage: ${metrics.database.inUse}/${metrics.database.total}`,
      action: 'Consider increasing connection pool size or optimizing queries'
    })
  }

  // Memory recommendations
  const memoryUsagePercent = (metrics.system.heapUsed / metrics.system.heapTotal) * 100
  if (memoryUsagePercent > 85) {
    recommendations.push({
      type: 'error',
      category: 'System Memory',
      message: `High heap memory usage: ${memoryUsagePercent.toFixed(2)}%`,
      action: 'Consider scaling horizontally or optimizing memory usage'
    })
  }

  // Positive recommendations
  if (metrics.cache.hitRate > 80) {
    recommendations.push({
      type: 'info',
      category: 'Cache',
      message: `Excellent cache performance: ${metrics.cache.hitRate.toFixed(2)}% hit rate`,
    })
  }

  if (metrics.database.available / metrics.database.total > 0.5) {
    recommendations.push({
      type: 'info',
      category: 'Database',
      message: `Healthy database connection pool utilization`,
    })
  }

  return recommendations
}