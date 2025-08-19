/**
 * Service Worker Registration and Management for Harry School CRM
 * Provides browser-level caching and offline capabilities
 */

interface ServiceWorkerConfig {
  enabled: boolean
  debug: boolean
  updateCheckInterval: number
}

class ServiceWorkerManager {
  private config: ServiceWorkerConfig
  private registration: ServiceWorkerRegistration | null = null

  constructor(config: Partial<ServiceWorkerConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      debug: process.env.NODE_ENV === 'development',
      updateCheckInterval: 60000, // 1 minute
      ...config
    }
  }

  /**
   * Register the service worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported() || !this.config.enabled) {
      if (this.config.debug) {
        console.log('Service Worker not supported or disabled')
      }
      return null
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      if (this.config.debug) {
        console.log('Service Worker registered successfully:', this.registration)
      }

      this.setupEventListeners()
      this.checkForUpdates()

      return this.registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return null
    }
  }

  /**
   * Check if service workers are supported
   */
  private isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'caches' in window
    )
  }

  /**
   * Set up event listeners for service worker events
   */
  private setupEventListeners(): void {
    if (!this.registration) return

    // Listen for new service worker becoming available
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration?.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          this.onUpdateAvailable()
        }
      })
    })

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleMessage(event.data)
    })

    // Listen for controller change (new SW takes control)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (this.config.debug) {
        console.log('Service Worker controller changed')
      }
      // Reload the page to ensure new SW is used
      window.location.reload()
    })
  }

  /**
   * Check for service worker updates
   */
  private async checkForUpdates(): Promise<void> {
    if (!this.registration) return

    try {
      await this.registration.update()
      
      // Set up periodic update checks
      setInterval(async () => {
        try {
          await this.registration?.update()
        } catch (error) {
          if (this.config.debug) {
            console.warn('Service Worker update check failed:', error)
          }
        }
      }, this.config.updateCheckInterval)
    } catch (error) {
      if (this.config.debug) {
        console.warn('Service Worker update failed:', error)
      }
    }
  }

  /**
   * Handle service worker update available
   */
  private onUpdateAvailable(): void {
    if (this.config.debug) {
      console.log('Service Worker update available')
    }

    // Show update notification to user
    this.showUpdateNotification()
  }

  /**
   * Show update notification to user
   */
  private showUpdateNotification(): void {
    // In a real app, you'd show a toast/banner to the user
    if (this.config.debug) {
      console.log('New version available! Reload to update.')
    }

    // For now, auto-update after a short delay
    setTimeout(() => {
      this.skipWaiting()
    }, 5000)
  }

  /**
   * Skip waiting and activate new service worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) return

    // Send message to service worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }

  /**
   * Handle messages from service worker
   */
  private handleMessage(data: any): void {
    if (this.config.debug) {
      console.log('Message from Service Worker:', data)
    }

    switch (data.type) {
      case 'CACHE_UPDATED':
        // Handle cache update notification
        break
      case 'OFFLINE':
        // Handle offline status
        this.onOffline()
        break
      case 'ONLINE':
        // Handle online status  
        this.onOnline()
        break
    }
  }

  /**
   * Handle offline event
   */
  private onOffline(): void {
    if (this.config.debug) {
      console.log('Application is offline')
    }
    // Show offline indicator
    document.body.classList.add('offline')
  }

  /**
   * Handle online event
   */
  private onOnline(): void {
    if (this.config.debug) {
      console.log('Application is online')
    }
    // Hide offline indicator
    document.body.classList.remove('offline')
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateCache(pattern: string): Promise<void> {
    if (!this.registration?.active) return

    this.registration.active.postMessage({
      type: 'CACHE_INVALIDATE',
      pattern
    })
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    if (!this.registration?.active) return

    this.registration.active.postMessage({
      type: 'CACHE_CLEAR'
    })
  }

  /**
   * Get cache status
   */
  async getCacheStatus(): Promise<{
    caches: string[]
    totalSize: number
  }> {
    if (!this.isSupported()) {
      return { caches: [], totalSize: 0 }
    }

    try {
      const cacheNames = await caches.keys()
      let totalSize = 0

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName)
        const requests = await cache.keys()
        
        for (const request of requests) {
          try {
            const response = await cache.match(request)
            if (response && response.headers.get('content-length')) {
              totalSize += parseInt(response.headers.get('content-length') || '0')
            }
          } catch (error) {
            // Ignore errors when calculating size
          }
        }
      }

      return {
        caches: cacheNames,
        totalSize
      }
    } catch (error) {
      console.error('Failed to get cache status:', error)
      return { caches: [], totalSize: 0 }
    }
  }

  /**
   * Unregister service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) return false

    try {
      const result = await this.registration.unregister()
      this.registration = null
      
      if (this.config.debug) {
        console.log('Service Worker unregistered successfully')
      }
      
      return result
    } catch (error) {
      console.error('Service Worker unregistration failed:', error)
      return false
    }
  }
}

// Global service worker manager instance
export const serviceWorkerManager = new ServiceWorkerManager()

/**
 * Initialize service worker when the app starts
 */
export async function initializeServiceWorker(): Promise<void> {
  if (typeof window === 'undefined') return

  // Wait for page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      serviceWorkerManager.register()
    })
  } else {
    serviceWorkerManager.register()
  }

  // Add offline/online event listeners
  window.addEventListener('online', () => {
    serviceWorkerManager['onOnline']()
  })

  window.addEventListener('offline', () => {
    serviceWorkerManager['onOffline']()
  })
}

/**
 * Cache invalidation helpers for different data types
 */
export const swCacheInvalidation = {
  teachers: () => serviceWorkerManager.invalidateCache('/api/teachers'),
  students: () => serviceWorkerManager.invalidateCache('/api/students'),
  groups: () => serviceWorkerManager.invalidateCache('/api/groups'),
  dashboard: () => serviceWorkerManager.invalidateCache('/api/dashboard'),
  all: () => serviceWorkerManager.clearCache()
}