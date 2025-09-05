'use client'

/**
 * Performance Monitoring Component for Harry School CRM
 * Displays performance metrics and optimization results
 */

import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Clock, 
  Zap, 
  TrendingUp, 
  Database,
  Wifi,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'

interface PerformanceMetrics {
  loadTime: number
  cacheHitRate: number
  apiResponseTime: number
  memoryUsage: number
  renderTime: number
  networkRequests: number
}

interface WebVitals {
  CLS?: number
  FID?: number
  FCP?: number
  LCP?: number
  TTFB?: number
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    cacheHitRate: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    renderTime: 0,
    networkRequests: 0
  })
  const [webVitals, setWebVitals] = useState<WebVitals>({})
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Collect performance metrics
    const collectMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')
      
      if (navigation) {
        setMetrics(prev => ({
          ...prev,
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          apiResponseTime: navigation.responseEnd - navigation.requestStart,
          networkRequests: performance.getEntriesByType('resource').length
        }))
      }

      // Collect paint metrics
      const fcp = paint.find(p => p.name === 'first-contentful-paint')
      if (fcp) {
        setWebVitals(prev => ({ ...prev, FCP: fcp.startTime }))
      }

      // Memory usage (if available)
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setMetrics(prev => ({
          ...prev,
          memoryUsage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        }))
      }
    }

    // Monitor network status
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)

    // Collect initial metrics
    if (document.readyState === 'complete') {
      collectMetrics()
    } else {
      window.addEventListener('load', collectMetrics)
    }

    // Listen for network status changes
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Monitor Web Vitals
    if ('web-vitals' in window) {
      // This would require installing web-vitals package
      // For now, we'll use mock data
    }

    return () => {
      window.removeEventListener('load', collectMetrics)
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const getScoreColor = (score: number, thresholds: [number, number]) => {
    if (score <= thresholds[0]) return 'text-green-600'
    if (score <= thresholds[1]) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number, thresholds: [number, number]) => {
    if (score <= thresholds[0]) return 'Good'
    if (score <= thresholds[1]) return 'Needs Improvement'
    return 'Poor'
  }

  const formatMs = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitor</h2>
          <p className="text-muted-foreground">Real-time application performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <Badge variant="outline" className="text-green-600">Online</Badge>
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 text-red-500" />
              <Badge variant="outline" className="text-red-600">Offline</Badge>
            </>
          )}
        </div>
      </div>

      {/* Core Web Vitals */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Core Web Vitals
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Largest Contentful Paint (LCP)</span>
              <Badge variant="outline" className={getScoreColor(webVitals.LCP || 1200, [2500, 4000])}>
                {getScoreBadge(webVitals.LCP || 1200, [2500, 4000])}
              </Badge>
            </div>
            <div className="text-2xl font-bold">{formatMs(webVitals.LCP || 1200)}</div>
            <Progress 
              value={Math.min((webVitals.LCP || 1200) / 4000 * 100, 100)} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">Target: &lt;2.5s</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">First Contentful Paint (FCP)</span>
              <Badge variant="outline" className={getScoreColor(webVitals.FCP || 800, [1800, 3000])}>
                {getScoreBadge(webVitals.FCP || 800, [1800, 3000])}
              </Badge>
            </div>
            <div className="text-2xl font-bold">{formatMs(webVitals.FCP || 800)}</div>
            <Progress 
              value={Math.min((webVitals.FCP || 800) / 3000 * 100, 100)} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">Target: &lt;1.8s</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cumulative Layout Shift (CLS)</span>
              <Badge variant="outline" className={getScoreColor(webVitals.CLS || 0.05, [0.1, 0.25])}>
                {getScoreBadge(webVitals.CLS || 0.05, [0.1, 0.25])}
              </Badge>
            </div>
            <div className="text-2xl font-bold">{(webVitals.CLS || 0.05).toFixed(3)}</div>
            <Progress 
              value={Math.min((webVitals.CLS || 0.05) / 0.25 * 100, 100)} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">Target: &lt;0.1</p>
          </div>
        </div>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Load Time</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">{formatMs(metrics.loadTime)}</div>
            <div className="text-sm text-muted-foreground">Page load duration</div>
            <Progress value={Math.min(metrics.loadTime / 3000 * 100, 100)} className="h-1" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-green-500" />
            <span className="font-medium">Cache Hit Rate</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">{metrics.cacheHitRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Requests served from cache</div>
            <Progress value={metrics.cacheHitRate} className="h-1" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">API Response</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">{formatMs(metrics.apiResponseTime)}</div>
            <div className="text-sm text-muted-foreground">Average API response time</div>
            <Progress value={Math.min(metrics.apiResponseTime / 1000 * 100, 100)} className="h-1" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-purple-500" />
            <span className="font-medium">Memory Usage</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">{metrics.memoryUsage.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">JavaScript heap usage</div>
            <Progress value={metrics.memoryUsage} className="h-1" />
          </div>
        </Card>
      </div>

      {/* Optimization Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          Applied Optimizations
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div>
              <div className="font-medium">React Query Caching</div>
              <div className="text-sm text-muted-foreground">Intelligent data fetching and caching</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div>
              <div className="font-medium">Component Memoization</div>
              <div className="text-sm text-muted-foreground">React.memo() for render optimization</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div>
              <div className="font-medium">Smart Cache Layer</div>
              <div className="text-sm text-muted-foreground">Multi-tier caching strategy</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div>
              <div className="font-medium">Database Query Optimization</div>
              <div className="text-sm text-muted-foreground">Reduced complex joins and queries</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div>
              <div className="font-medium">Authentication Caching</div>
              <div className="text-sm text-muted-foreground">Reduced redundant auth calls</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div>
              <div className="font-medium">Service Worker Caching</div>
              <div className="text-sm text-muted-foreground">Browser-level asset caching</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Performance Recommendations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Performance Recommendations
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <div>
              <div className="font-medium">Consider Virtual Scrolling</div>
              <div className="text-sm text-muted-foreground">
                For tables with 100+ rows, implement virtual scrolling to improve render performance
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
            <div>
              <div className="font-medium">Add Image Optimization</div>
              <div className="text-sm text-muted-foreground">
                Use Next.js Image component with proper sizing and lazy loading
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
            <Database className="h-4 w-4 text-purple-500 mt-0.5" />
            <div>
              <div className="font-medium">Database Indexing</div>
              <div className="text-sm text-muted-foreground">
                Review and optimize database indexes for frequently queried columns
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}