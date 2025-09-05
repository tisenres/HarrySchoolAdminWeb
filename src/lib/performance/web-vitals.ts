/**
 * Web Vitals Performance Monitoring
 * 
 * Tracks Core Web Vitals and custom performance metrics
 * for Harry School CRM performance optimization.
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals'

export interface PerformanceMetric {
  id: string
  name: string
  value: number
  delta: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url: string
  userAgent: string
}

export interface CustomMetric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
}

export interface PerformanceBudget {
  lcp: number  // Largest Contentful Paint
  fid: number  // First Input Delay
  cls: number  // Cumulative Layout Shift
  fcp: number  // First Contentful Paint
  ttfb: number // Time to First Byte
}

// Performance budget thresholds (in milliseconds, except CLS)
export const PERFORMANCE_BUDGET: PerformanceBudget = {
  lcp: 2500,   // 2.5s for good
  fid: 100,    // 100ms for good
  cls: 0.1,    // 0.1 for good (unitless)
  fcp: 1800,   // 1.8s for good
  ttfb: 800,   // 800ms for good
}

// Rating thresholds for Core Web Vitals
const THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 },
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private customMetrics: CustomMetric[] = []
  private observers: Map<string, PerformanceObserver> = new Map()
  private isInitialized = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize()
    }
  }

  private initialize() {
    if (this.isInitialized) return

    // Initialize Core Web Vitals tracking
    this.trackCoreWebVitals()
    
    // Initialize custom performance tracking
    this.trackCustomMetrics()

    // Track navigation timing
    this.trackNavigationTiming()

    // Track resource timing
    this.trackResourceTiming()

    this.isInitialized = true
  }

  private trackCoreWebVitals() {
    const handleMetric = (metric: Metric) => {
      const performanceMetric: PerformanceMetric = {
        id: metric.id,
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        rating: this.getRating(metric.name as keyof PerformanceBudget, metric.value),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }

      this.metrics.push(performanceMetric)
      this.sendToAnalytics(performanceMetric)

      // Log poor metrics for debugging
      if (performanceMetric.rating === 'poor') {
        console.warn(`Poor ${metric.name} performance:`, performanceMetric)
      }
    }

    // Track all Core Web Vitals
    onCLS(handleMetric)
    onINP(handleMetric)
    onFCP(handleMetric)
    onLCP(handleMetric)
    onTTFB(handleMetric)
  }

  private trackCustomMetrics() {
    // Track Time to Interactive (TTI)
    this.measureTTI()

    // Track Total Blocking Time (TBT)
    this.measureTBT()

    // Track React hydration time
    this.measureReactHydration()

    // Track component render times
    this.trackComponentPerformance()
  }

  private trackNavigationTiming() {
    if (!('performance' in window) || !performance.getEntriesByType) return

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

        if (navigation) {
          this.recordCustomMetric('dns-lookup', navigation.domainLookupEnd - navigation.domainLookupStart)
          this.recordCustomMetric('tcp-connect', navigation.connectEnd - navigation.connectStart)
          this.recordCustomMetric('ssl-handshake', navigation.connectEnd - navigation.secureConnectionStart)
          this.recordCustomMetric('dom-parsing', navigation.domInteractive - navigation.responseEnd)
          this.recordCustomMetric('dom-content-loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart)
          this.recordCustomMetric('load-event', navigation.loadEventEnd - navigation.loadEventStart)
        }
      }, 0)
    })
  }

  private trackResourceTiming() {
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming
          
          // Track slow resources
          if (resource.duration > 1000) {
            this.recordCustomMetric('slow-resource', resource.duration, {
              resource: resource.name,
              type: this.getResourceType(resource.name),
            })
          }

          // Track large resources
          if (resource.transferSize > 1000000) { // > 1MB
            this.recordCustomMetric('large-resource', resource.transferSize, {
              resource: resource.name,
              type: this.getResourceType(resource.name),
            })
          }
        }
      }
    })

    resourceObserver.observe({ type: 'resource', buffered: true })
    this.observers.set('resource', resourceObserver)
  }

  private measureTTI() {
    // Simplified TTI measurement
    if (!('performance' in window)) return

    const longTaskObserver = new PerformanceObserver((list) => {
      const longTasks = list.getEntries()
      if (longTasks.length === 0) {
        // No long tasks detected, TTI is likely good
        this.recordCustomMetric('time-to-interactive', performance.now())
      }
    })

    try {
      longTaskObserver.observe({ type: 'longtask', buffered: true })
      this.observers.set('longtask', longTaskObserver)
    } catch (e) {
      // longtask not supported
    }
  }

  private measureTBT() {
    let totalBlockingTime = 0

    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          totalBlockingTime += entry.duration - 50
        }
      }
      this.recordCustomMetric('total-blocking-time', totalBlockingTime)
    })

    try {
      longTaskObserver.observe({ type: 'longtask', buffered: true })
    } catch (e) {
      // longtask not supported
    }
  }

  private measureReactHydration() {
    // Track React hydration using performance marks
    const originalMark = performance.mark
    
    performance.mark = function(name: string) {
      if (name === 'react-hydration-start') {
        performance.mark('app-hydration-start')
      } else if (name === 'react-hydration-end') {
        performance.mark('app-hydration-end')
        performance.measure('react-hydration', 'app-hydration-start', 'app-hydration-end')
      }
      return originalMark.call(this, name)
    }
  }

  private trackComponentPerformance() {
    // Track component render performance using User Timing API
    const measureObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('component-')) {
          this.recordCustomMetric('component-render', entry.duration, {
            component: entry.name,
          })
        }
      }
    })

    measureObserver.observe({ type: 'measure', buffered: true })
    this.observers.set('measure', measureObserver)
  }

  private getRating(metric: keyof PerformanceBudget, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = THRESHOLDS[metric]
    if (!threshold) return 'good'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script'
    if (url.includes('.css')) return 'stylesheet'
    if (url.match(/\.(jpg|jpeg|png|gif|svg|webp|avif)/)) return 'image'
    if (url.match(/\.(woff|woff2|ttf|otf)/)) return 'font'
    return 'other'
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // In production, send to your analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Google Analytics 4
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'web_vitals', {
          metric_name: metric.name,
          metric_value: metric.value,
          metric_rating: metric.rating,
        })
      }
    }

    // For development, just log
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metric:', metric)
    }
  }

  public recordCustomMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: CustomMetric = {
      name,
      value,
      timestamp: Date.now(),
      ...(tags ? { tags } : {}),
    }

    this.customMetrics.push(metric)

    // Log significant metrics
    if (value > 1000) {
      console.log(`Custom metric ${name}:`, value, tags)
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  public getCustomMetrics(): CustomMetric[] {
    return [...this.customMetrics]
  }

  public getPerformanceReport(): {
    coreWebVitals: PerformanceMetric[]
    customMetrics: CustomMetric[]
    summary: {
      good: number
      needsImprovement: number
      poor: number
    }
    budgetStatus: Record<keyof PerformanceBudget, 'within' | 'over'>
  } {
    const coreWebVitals = this.metrics.filter(m => 
      ['CLS', 'INP', 'LCP', 'FCP', 'TTFB'].includes(m.name)
    )

    const summary = coreWebVitals.reduce((acc, metric) => {
      acc[metric.rating === 'needs-improvement' ? 'needsImprovement' : metric.rating]++
      return acc
    }, { good: 0, needsImprovement: 0, poor: 0 })

    const budgetStatus = Object.keys(PERFORMANCE_BUDGET).reduce((acc, key) => {
      const budgetKey = key as keyof PerformanceBudget
      const metric = coreWebVitals.find(m => m.name.toLowerCase() === budgetKey)
      const budget = PERFORMANCE_BUDGET[budgetKey]
      
      if (metric) {
        acc[budgetKey] = metric.value <= budget ? 'within' : 'over'
      } else {
        acc[budgetKey] = 'within' // Default if not measured
      }
      
      return acc
    }, {} as Record<keyof PerformanceBudget, 'within' | 'over'>)

    return {
      coreWebVitals,
      customMetrics: this.customMetrics,
      summary,
      budgetStatus,
    }
  }

  public clearMetrics() {
    this.metrics = []
    this.customMetrics = []
  }

  public destroy() {
    this.observers.forEach((observer) => {
      observer.disconnect()
    })
    this.observers.clear()
    this.isInitialized = false
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor()
  }
  return performanceMonitor
}

// Utility functions for React components
export const measureComponentRender = (componentName: string) => {
  if (typeof window === 'undefined') return { start: () => {}, end: () => {} }

  return {
    start: () => {
      performance.mark(`${componentName}-start`)
    },
    end: () => {
      performance.mark(`${componentName}-end`)
      performance.measure(`component-${componentName}`, `${componentName}-start`, `${componentName}-end`)
    }
  }
}

export const measureAsyncOperation = async <T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> => {
  const monitor = getPerformanceMonitor()
  const start = performance.now()

  try {
    const result = await operation()
    const duration = performance.now() - start
    monitor.recordCustomMetric(`async-${operationName}`, duration)
    return result
  } catch (error) {
    const duration = performance.now() - start
    monitor.recordCustomMetric(`async-${operationName}-error`, duration)
    throw error
  }
}

// Export for direct use
export { PerformanceMonitor }