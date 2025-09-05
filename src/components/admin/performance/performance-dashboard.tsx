'use client'

import React, { useState, useEffect, memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Activity,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Monitor,
  RefreshCw,
  Download,
  Eye,
  Gauge,
  Network,
} from 'lucide-react'
import { 
  getPerformanceMonitor,
  type PerformanceMetric,
  type CustomMetric,
  PERFORMANCE_BUDGET
} from '@/lib/performance/web-vitals'
import { ClientOnly } from '@/components/ui/client-only'

interface PerformanceDashboardProps {
  className?: string
}

interface MetricCardProps {
  title: string
  value: string
  description: string
  rating: 'good' | 'needs-improvement' | 'poor'
  icon: React.ReactNode
  trend?: number
  budget?: number
}

const MetricCard = memo<MetricCardProps>(({ 
  title, 
  value, 
  description, 
  rating, 
  icon, 
  trend,
  budget 
}) => {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200'
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'poor': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getBadgeVariant = (rating: string) => {
    switch (rating) {
      case 'good': return 'default'
      case 'needs-improvement': return 'secondary'
      case 'poor': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`${getRatingColor(rating)} transition-colors duration-200`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="flex items-center space-x-2">
            {icon}
            <Badge variant={getBadgeVariant(rating)} className="capitalize">
              {rating.replace('-', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-1">{value}</div>
          <p className="text-xs text-muted-foreground mb-2">{description}</p>
          
          {budget && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Budget</span>
                <span>{budget}ms</span>
              </div>
              <Progress 
                value={Math.min(100, (parseFloat(value) / budget) * 100)}
                className="h-1"
              />
            </div>
          )}
          
          {trend !== undefined && (
            <div className="flex items-center text-xs mt-2">
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
              ) : (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1 rotate-180" />
              )}
              <span className={trend > 0 ? 'text-red-600' : 'text-green-600'}>
                {Math.abs(trend)}% from last session
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
})

MetricCard.displayName = 'MetricCard'

const ResourceTimingChart = memo(() => {
  const [resourceData, setResourceData] = useState<Array<{
    name: string
    duration: number
    type: string
  }>>([])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const resources = performance.getEntriesByType('resource')
      .slice(-20) // Last 20 resources
      .map(entry => {
        const resource = entry as PerformanceResourceTiming
        return {
          name: resource.name.split('/').pop() || 'Unknown',
          duration: resource.duration,
          type: getResourceType(resource.name),
        }
      })
      .sort((a, b) => b.duration - a.duration)

    setResourceData(resources)
  }, [])

  const getResourceType = (url: string): string => {
    if (url.includes('.js')) return 'JavaScript'
    if (url.includes('.css')) return 'Stylesheet'
    if (url.match(/\.(jpg|jpeg|png|gif|svg|webp|avif)/)) return 'Image'
    if (url.match(/\.(woff|woff2|ttf|otf)/)) return 'Font'
    return 'Other'
  }

  const getTypeColor = (type: string) => {
    const colors = {
      JavaScript: 'bg-yellow-500',
      Stylesheet: 'bg-blue-500',
      Image: 'bg-green-500',
      Font: 'bg-purple-500',
      Other: 'bg-gray-500',
    }
    return colors[type as keyof typeof colors] || colors.Other
  }

  return (
    <div className="space-y-3">
      {resourceData.slice(0, 10).map((resource, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${getTypeColor(resource.type)}`} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{resource.name}</div>
            <div className="text-xs text-muted-foreground">{resource.type}</div>
          </div>
          <div className="text-sm font-mono">
            {resource.duration.toFixed(0)}ms
          </div>
        </div>
      ))}
    </div>
  )
})

ResourceTimingChart.displayName = 'ResourceTimingChart'

export const PerformanceDashboard = memo<PerformanceDashboardProps>(({ className }) => {
  const [performanceData, setPerformanceData] = useState<{
    coreWebVitals: PerformanceMetric[]
    customMetrics: CustomMetric[]
    summary: {
      good: number
      needsImprovement: number
      poor: number
    }
    budgetStatus: Record<string, 'within' | 'over'>
  }>({
    coreWebVitals: [],
    customMetrics: [],
    summary: { good: 0, needsImprovement: 0, poor: 0 },
    budgetStatus: {}
  })

  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadPerformanceData = useCallback(() => {
    setIsLoading(true)
    try {
      const monitor = getPerformanceMonitor()
      const report = monitor.getPerformanceReport()
      setPerformanceData(report)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load performance data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPerformanceData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadPerformanceData, 30000)
    return () => clearInterval(interval)
  }, [loadPerformanceData])

  const formatMetricValue = (name: string, value: number): string => {
    if (name === 'CLS') {
      return value.toFixed(3)
    }
    return `${Math.round(value)}ms`
  }

  const getMetricIcon = (name: string) => {
    const icons = {
      LCP: <Eye className="h-4 w-4" />,
      FID: <Zap className="h-4 w-4" />,
      CLS: <Monitor className="h-4 w-4" />,
      FCP: <Gauge className="h-4 w-4" />,
      TTFB: <Network className="h-4 w-4" />,
    }
    return icons[name as keyof typeof icons] || <Activity className="h-4 w-4" />
  }

  const getMetricDescription = (name: string) => {
    const descriptions = {
      LCP: 'Largest Contentful Paint',
      FID: 'First Input Delay',
      CLS: 'Cumulative Layout Shift',
      FCP: 'First Contentful Paint',
      TTFB: 'Time to First Byte',
    }
    return descriptions[name as keyof typeof descriptions] || name
  }

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...performanceData,
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const overallScore = performanceData.coreWebVitals.length > 0 
    ? Math.round((performanceData.summary.good / performanceData.coreWebVitals.length) * 100)
    : 0

  if (isLoading && performanceData.coreWebVitals.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading performance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor Core Web Vitals and application performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Last updated: <ClientOnly fallback="Never">
              {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
            </ClientOnly>
          </div>
          <Button variant="outline" size="sm" onClick={loadPerformanceData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overall Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Overall Performance Score</span>
          </CardTitle>
          <CardDescription>
            Based on Core Web Vitals measurements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="text-4xl font-bold">
              {overallScore}
            </div>
            <div className="flex-1">
              <Progress value={overallScore} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Poor (0-49)</span>
                <span>Needs Improvement (50-89)</span>
                <span>Good (90-100)</span>
              </div>
            </div>
            <Badge 
              variant={overallScore >= 90 ? 'default' : overallScore >= 50 ? 'secondary' : 'destructive'}
            >
              {overallScore >= 90 ? 'Good' : overallScore >= 50 ? 'Needs Improvement' : 'Poor'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {performanceData.coreWebVitals.map((metric) => (
          <MetricCard
            key={metric.name}
            title={metric.name}
            value={formatMetricValue(metric.name, metric.value)}
            description={getMetricDescription(metric.name)}
            rating={metric.rating}
            icon={getMetricIcon(metric.name)}
            budget={PERFORMANCE_BUDGET[metric.name.toLowerCase() as keyof typeof PERFORMANCE_BUDGET]}
          />
        ))}
      </div>

      {/* Detailed Performance Data */}
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals Breakdown</CardTitle>
              <CardDescription>
                Detailed performance metrics with thresholds and ratings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.coreWebVitals.map((metric) => (
                  <div key={metric.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getMetricIcon(metric.name)}
                      <div>
                        <div className="font-medium">{metric.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {getMetricDescription(metric.name)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-mono text-lg">
                        {formatMetricValue(metric.name, metric.value)}
                      </div>
                      <Badge variant={
                        metric.rating === 'good' ? 'default' : 
                        metric.rating === 'needs-improvement' ? 'secondary' : 
                        'destructive'
                      }>
                        {metric.rating.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Loading Performance</CardTitle>
              <CardDescription>
                Top resources by loading time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResourceTimingChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Metrics</CardTitle>
              <CardDescription>
                Application-specific performance measurements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData.customMetrics.length > 0 ? (
                <div className="space-y-3">
                  {performanceData.customMetrics.slice(0, 10).map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{metric.name}</div>
                        {metric.tags && (
                          <div className="flex space-x-1 mt-1">
                            {Object.entries(metric.tags).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {value}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="font-mono">
                        {metric.value.toFixed(2)}ms
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No custom metrics recorded yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Recommendations</CardTitle>
              <CardDescription>
                Suggestions to improve Core Web Vitals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.coreWebVitals
                  .filter(metric => metric.rating !== 'good')
                  .map((metric) => (
                    <div key={metric.id} className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{metric.name} Optimization</span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {metric.name === 'LCP' && (
                          <>
                            <p>• Optimize images with next/image and modern formats (WebP/AVIF)</p>
                            <p>• Implement virtual scrolling for large lists</p>
                            <p>• Preload critical resources</p>
                          </>
                        )}
                        {metric.name === 'FID' && (
                          <>
                            <p>• Split large JavaScript bundles</p>
                            <p>• Use React.memo() for expensive components</p>
                            <p>• Implement code splitting with dynamic imports</p>
                          </>
                        )}
                        {metric.name === 'CLS' && (
                          <>
                            <p>• Set explicit dimensions for images and videos</p>
                            <p>• Reserve space for dynamic content</p>
                            <p>• Use transform/opacity for animations</p>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                }
                
                {performanceData.coreWebVitals.every(metric => metric.rating === 'good') && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Excellent Performance!</h3>
                    <p className="text-muted-foreground">
                      All Core Web Vitals are within the "Good" threshold.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
})

PerformanceDashboard.displayName = 'PerformanceDashboard'