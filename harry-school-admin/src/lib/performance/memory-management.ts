/**
 * Memory Management and Leak Detection Utilities
 * 
 * Provides tools for detecting and preventing memory leaks
 * in React components and application state.
 */

import { useEffect, useRef, useState } from 'react'

export interface MemoryProfile {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  timestamp: number
}

export interface LeakDetectionResult {
  isLeaking: boolean
  growthRate: number
  severity: 'low' | 'medium' | 'high'
  recommendations: string[]
}

export interface ComponentMemoryTracker {
  componentName: string
  mountTime: number
  unmountTime?: number
  memoryAtMount: number
  memoryAtUnmount?: number
  leakDetected: boolean
}

class MemoryManager {
  private memoryProfiles: MemoryProfile[] = []
  private componentTrackers = new Map<string, ComponentMemoryTracker>()
  private intervals = new Set<NodeJS.Timeout>()
  private observers = new Set<PerformanceObserver>()
  private eventListeners = new Map<string, EventListener>()
  private isMonitoring = false
  private readonly maxProfiles = 100

  // Start memory monitoring
  startMonitoring(interval: number = 5000): void {
    if (this.isMonitoring || typeof window === 'undefined') return

    this.isMonitoring = true
    
    // Profile memory usage at intervals
    const profileInterval = setInterval(() => {
      this.recordMemoryProfile()
    }, interval)
    
    this.intervals.add(profileInterval)

    // Monitor for memory pressure events
    this.setupMemoryPressureHandling()

    // Track performance entries that might indicate memory issues
    this.setupPerformanceMonitoring()
  }

  // Stop memory monitoring
  stopMonitoring(): void {
    this.isMonitoring = false
    
    // Clear intervals
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals.clear()

    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()

    // Remove event listeners
    this.eventListeners.forEach((listener, event) => {
      window.removeEventListener(event, listener)
    })
    this.eventListeners.clear()
  }

  // Record current memory usage
  private recordMemoryProfile(): void {
    if (!('memory' in performance)) return

    const memory = (performance as any).memory
    const profile: MemoryProfile = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: Date.now(),
    }

    this.memoryProfiles.push(profile)

    // Keep only the most recent profiles
    if (this.memoryProfiles.length > this.maxProfiles) {
      this.memoryProfiles = this.memoryProfiles.slice(-this.maxProfiles)
    }

    // Check for memory leaks
    if (this.memoryProfiles.length >= 10) {
      const leakResult = this.detectMemoryLeak()
      if (leakResult.isLeaking && leakResult.severity === 'high') {
        console.warn('Memory leak detected:', leakResult)
        this.triggerGarbageCollection()
      }
    }
  }

  // Detect memory leaks based on memory growth patterns
  detectMemoryLeak(): LeakDetectionResult {
    if (this.memoryProfiles.length < 10) {
      return {
        isLeaking: false,
        growthRate: 0,
        severity: 'low',
        recommendations: [],
      }
    }

    const recent = this.memoryProfiles.slice(-10)
    const older = this.memoryProfiles.slice(-20, -10)

    const recentAvg = recent.reduce((sum, p) => sum + p.usedJSHeapSize, 0) / recent.length
    const olderAvg = older.reduce((sum, p) => sum + p.usedJSHeapSize, 0) / older.length

    const growthRate = ((recentAvg - olderAvg) / olderAvg) * 100
    const isLeaking = growthRate > 5 // More than 5% growth

    let severity: 'low' | 'medium' | 'high' = 'low'
    if (growthRate > 20) severity = 'high'
    else if (growthRate > 10) severity = 'medium'

    const recommendations = this.generateMemoryRecommendations(growthRate, recent)

    return {
      isLeaking,
      growthRate,
      severity,
      recommendations,
    }
  }

  // Generate recommendations based on memory patterns
  private generateMemoryRecommendations(
    growthRate: number,
    profiles: MemoryProfile[]
  ): string[] {
    const recommendations: string[] = []
    const latestProfile = profiles[profiles.length - 1]
    if (!latestProfile) return recommendations
    const usagePercentage = (latestProfile.usedJSHeapSize / latestProfile.jsHeapSizeLimit) * 100

    if (growthRate > 15) {
      recommendations.push('High memory growth detected. Check for event listeners not being cleaned up.')
      recommendations.push('Review component unmounting and ensure proper cleanup in useEffect.')
    }

    if (usagePercentage > 80) {
      recommendations.push('Memory usage is high. Consider implementing data virtualization for large lists.')
      recommendations.push('Review image loading and consider using optimized formats and lazy loading.')
    }

    if (growthRate > 10) {
      recommendations.push('Consider using React.memo() and useMemo() to prevent unnecessary re-renders.')
      recommendations.push('Check for closures that might be holding references to large objects.')
    }

    const componentLeaks = Array.from(this.componentTrackers.values()).filter(t => t.leakDetected)
    if (componentLeaks.length > 0) {
      recommendations.push(`Components with potential leaks: ${componentLeaks.map(c => c.componentName).join(', ')}`)
    }

    return recommendations
  }

  // Setup memory pressure event handling
  private setupMemoryPressureHandling(): void {
    if (typeof window === 'undefined') return

    // Listen for memory pressure (if supported)
    const handleMemoryPressure = () => {
      console.warn('Memory pressure detected, running cleanup...')
      this.performEmergencyCleanup()
    }

    // Chrome's memory pressure API (experimental)
    if ('memory' in navigator && 'onmemorypressure' in navigator) {
      const listener = handleMemoryPressure as EventListener
      ;(navigator as any).addEventListener('memorypressure', listener)
      this.eventListeners.set('memorypressure', listener)
    }

    // Fallback: monitor for high memory usage
    const checkMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        
        if (usagePercentage > 90) {
          handleMemoryPressure()
        }
      }
    }

    const memoryCheckInterval = setInterval(checkMemoryUsage, 10000)
    this.intervals.add(memoryCheckInterval)
  }

  // Setup performance monitoring for memory-related issues
  private setupPerformanceMonitoring(): void {
    if (typeof PerformanceObserver === 'undefined') return

    try {
      // Monitor long tasks that might indicate memory pressure
      const longTaskObserver = new PerformanceObserver((list) => {
        const longTasks = list.getEntries()
        longTasks.forEach(entry => {
          if (entry.duration > 100) { // Tasks longer than 100ms
            console.warn('Long task detected (possible memory pressure):', entry)
          }
        })
      })

      longTaskObserver.observe({ type: 'longtask', buffered: true })
      this.observers.add(longTaskObserver)
    } catch (error) {
      // longtask not supported
    }

    try {
      // Monitor memory-related performance entries
      const measureObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.name.includes('memory') && entry.duration > 50) {
            console.log('Memory-related performance entry:', entry)
          }
        })
      })

      measureObserver.observe({ type: 'measure', buffered: true })
      this.observers.add(measureObserver)
    } catch (error) {
      // measure not supported
    }
  }

  // Track component memory usage
  trackComponent(componentName: string): string {
    const trackerId = `${componentName}-${Date.now()}-${Math.random()}`
    const memoryAtMount = this.getCurrentMemoryUsage()

    const tracker: ComponentMemoryTracker = {
      componentName,
      mountTime: Date.now(),
      memoryAtMount,
      leakDetected: false,
    }

    this.componentTrackers.set(trackerId, tracker)
    return trackerId
  }

  // Stop tracking component and check for leaks
  untrackComponent(trackerId: string): void {
    const tracker = this.componentTrackers.get(trackerId)
    if (!tracker) return

    const memoryAtUnmount = this.getCurrentMemoryUsage()
    const memoryDelta = memoryAtUnmount - tracker.memoryAtMount
    const timeAlive = Date.now() - tracker.mountTime

    tracker.unmountTime = Date.now()
    tracker.memoryAtUnmount = memoryAtUnmount

    // Check for potential memory leak
    // If component held significant memory for a long time
    if (memoryDelta > 1024 * 1024 && timeAlive > 30000) { // 1MB over 30 seconds
      tracker.leakDetected = true
      console.warn(`Potential memory leak in component ${tracker.componentName}:`, {
        memoryDelta: this.formatBytes(memoryDelta),
        timeAlive: `${timeAlive / 1000}s`,
      })
    }

    // Clean up after some time
    setTimeout(() => {
      this.componentTrackers.delete(trackerId)
    }, 60000) // Keep for 1 minute for analysis
  }

  // Get current memory usage
  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  // Trigger garbage collection (if available)
  private triggerGarbageCollection(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc()
      console.log('Garbage collection triggered')
    }
  }

  // Perform emergency cleanup
  private performEmergencyCleanup(): void {
    // Clear caches
    this.clearCaches()
    
    // Force garbage collection
    this.triggerGarbageCollection()
    
    // Emit memory pressure event for components to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('memorypressure', {
        detail: { severity: 'high' }
      }))
    }
  }

  // Clear various caches to free memory
  private clearCaches(): void {
    // Clear image caches if available
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('image') || name.includes('media')) {
            caches.delete(name)
          }
        })
      })
    }
  }

  // Format bytes for human-readable output
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get memory statistics
  getMemoryStats(): {
    current?: MemoryProfile
    profiles: MemoryProfile[]
    leakDetection: LeakDetectionResult
    componentTrackers: ComponentMemoryTracker[]
  } {
    const current = this.memoryProfiles[this.memoryProfiles.length - 1]
    const leakDetection = this.detectMemoryLeak()
    const componentTrackers = Array.from(this.componentTrackers.values())

    return {
      ...(current ? { current } : {}),
      profiles: [...this.memoryProfiles],
      leakDetection,
      componentTrackers,
    }
  }

  // Clear all stored data
  clearData(): void {
    this.memoryProfiles = []
    this.componentTrackers.clear()
  }
}

// Singleton instance
let memoryManager: MemoryManager | null = null

export const getMemoryManager = (): MemoryManager => {
  if (!memoryManager) {
    memoryManager = new MemoryManager()
  }
  return memoryManager
}

// React hooks for memory management

// Hook for tracking component memory usage
export const useMemoryTracker = (componentName: string) => {
  const trackerIdRef = useRef<string | null>(null)

  useEffect(() => {
    const manager = getMemoryManager()
    trackerIdRef.current = manager.trackComponent(componentName)

    return () => {
      if (trackerIdRef.current) {
        manager.untrackComponent(trackerIdRef.current)
      }
    }
  }, [componentName])
}

// Hook for handling memory pressure
export const useMemoryPressure = (onMemoryPressure: () => void) => {
  useEffect(() => {
    const handleMemoryPressure = (event: CustomEvent) => {
      console.log('Memory pressure detected in component:', event.detail)
      onMemoryPressure()
    }

    window.addEventListener('memorypressure', handleMemoryPressure as EventListener)
    
    return () => {
      window.removeEventListener('memorypressure', handleMemoryPressure as EventListener)
    }
  }, [onMemoryPressure])
}

// Hook for cleanup on component unmount
export const useCleanup = (cleanupFn: () => void) => {
  const cleanupRef = useRef(cleanupFn)
  cleanupRef.current = cleanupFn

  useEffect(() => {
    return () => {
      cleanupRef.current()
    }
  }, [])
}

// Hook for monitoring memory usage
export const useMemoryMonitor = (enabled: boolean = true) => {
  const [memoryStats, setMemoryStats] = useState<ReturnType<MemoryManager['getMemoryStats']> | null>(null)

  useEffect(() => {
    if (!enabled) return

    const manager = getMemoryManager()
    manager.startMonitoring()

    const updateStats = () => {
      setMemoryStats(manager.getMemoryStats())
    }

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000)
    updateStats() // Initial update

    return () => {
      clearInterval(interval)
      manager.stopMonitoring()
    }
  }, [enabled])

  return memoryStats
}

// Utility function to create safe cleanup handlers
export const createCleanupHandler = (cleanupFunctions: Array<() => void>) => {
  return () => {
    cleanupFunctions.forEach(cleanup => {
      try {
        cleanup()
      } catch (error) {
        console.error('Error during cleanup:', error)
      }
    })
  }
}

// Export the main class
export { MemoryManager }

// Additional utility functions
export const formatMemorySize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const getCurrentMemoryUsage = (): number => {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    return (performance as any).memory.usedJSHeapSize
  }
  return 0
}