'use client'

/**
 * Cache Management Component for Harry School CRM
 * Provides cache monitoring and control for admins
 */

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  RefreshCw, 
  Trash2, 
  Database, 
  Activity, 
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { smartCache } from '@/lib/services/smart-cache'
import { serviceWorkerManager } from '@/lib/utils/service-worker'
import { useCacheStats } from '@/hooks/use-smart-cache'
import { useQuery } from '@tanstack/react-query'

export function CacheManagement() {
  const [isClearing, setIsClearing] = useState(false)
  const { data: cacheStats } = useCacheStats()

  const { data: swStatus } = useQuery({
    queryKey: ['service-worker-status'],
    queryFn: async () => {
      const status = await serviceWorkerManager.getCacheStatus()
      return {
        ...status,
        isActive: 'serviceWorker' in navigator && !!navigator.serviceWorker.controller
      }
    },
    enabled: typeof window !== 'undefined',
    refetchInterval: 10000 // Update every 10 seconds
  })

  const handleClearSmartCache = async () => {
    setIsClearing(true)
    try {
      smartCache.clear()
      // Trigger a refetch of cache stats
      window.location.reload()
    } catch (error) {
      console.error('Failed to clear smart cache:', error)
    } finally {
      setIsClearing(false)
    }
  }

  const handleClearServiceWorkerCache = async () => {
    setIsClearing(true)
    try {
      await serviceWorkerManager.clearCache()
      // Wait a bit for cache to clear
      setTimeout(() => setIsClearing(false), 2000)
    } catch (error) {
      console.error('Failed to clear service worker cache:', error)
      setIsClearing(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    return `${Math.round(ms / 60000)}m`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cache Management</h2>
          <p className="text-muted-foreground">Monitor and control application caching</p>
        </div>
      </div>

      {/* Cache Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Smart Cache</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">{cacheStats?.smartCache.size || 0}</div>
            <div className="text-sm text-muted-foreground">Active entries</div>
            {cacheStats?.smartCache.hitRate !== undefined && (
              <div className="text-xs text-green-600">
                {(cacheStats.smartCache.hitRate * 100).toFixed(1)}% hit rate
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-green-500" />
            <span className="font-medium">React Query</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">{cacheStats?.reactQuery.queries || 0}</div>
            <div className="text-sm text-muted-foreground">Cached queries</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <span className="font-medium">Service Worker</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">{swStatus?.caches.length || 0}</div>
            <div className="text-sm text-muted-foreground">Cache stores</div>
            <div className="flex items-center gap-1">
              {swStatus?.isActive ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">Active</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-orange-600">Inactive</span>
                </>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-indigo-500" />
            <span className="font-medium">Storage Used</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">
              {formatBytes(swStatus?.totalSize || 0)}
            </div>
            <div className="text-sm text-muted-foreground">Browser cache</div>
          </div>
        </Card>
      </div>

      {/* Smart Cache Details */}
      {cacheStats?.smartCache && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Smart Cache Details</h3>
            <Badge variant="outline">
              {cacheStats.smartCache.totalHits + cacheStats.smartCache.totalMisses} total requests
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Hit Rate</span>
                <span className="text-sm text-green-600">
                  {(cacheStats.smartCache.hitRate * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={cacheStats.smartCache.hitRate * 100} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Cache Hits:</span>
                <span className="font-medium text-green-600">{cacheStats.smartCache.totalHits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cache Misses:</span>
                <span className="font-medium text-red-600">{cacheStats.smartCache.totalMisses}</span>
              </div>
            </div>
          </div>

          {/* Cache Entries */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Active Cache Entries</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {cacheStats.smartCache.entries.slice(0, 10).map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{entry.key}</div>
                    <div className="text-muted-foreground">
                      Size: {formatBytes(entry.size)} • Age: {formatDuration(entry.age)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      TTL: {formatDuration(entry.ttl)}
                    </div>
                    <Progress 
                      value={(entry.ttl / (entry.ttl + entry.age)) * 100} 
                      className="w-12 h-1 mt-1" 
                    />
                  </div>
                </div>
              ))}
              {cacheStats.smartCache.entries.length > 10 && (
                <div className="text-center text-sm text-muted-foreground">
                  +{cacheStats.smartCache.entries.length - 10} more entries
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Service Worker Cache Details */}
      {swStatus && swStatus.caches.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Service Worker Caches</h3>
            <Badge variant="outline">{swStatus.caches.length} cache stores</Badge>
          </div>

          <div className="space-y-2">
            {swStatus.caches.map((cacheName) => (
              <div key={cacheName} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <div className="font-medium">{cacheName}</div>
                  <div className="text-sm text-muted-foreground">Browser-level cache</div>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cache Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Cache Actions</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-medium mb-2">Smart Cache</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Clear application-level cache including API responses and computed data.
            </p>
            <Button
              onClick={handleClearSmartCache}
              disabled={isClearing}
              variant="outline"
              className="w-full"
            >
              {isClearing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Clear Smart Cache
            </Button>
          </div>

          <div>
            <h4 className="font-medium mb-2">Browser Cache</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Clear browser-level cache including static assets and API responses.
            </p>
            <Button
              onClick={handleClearServiceWorkerCache}
              disabled={isClearing || !swStatus?.isActive}
              variant="outline"
              className="w-full"
            >
              {isClearing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Clear Browser Cache
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}