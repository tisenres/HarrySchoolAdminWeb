/**
 * Request Optimization Utilities
 * 
 * Provides request batching, deduplication, and caching
 * for optimal API performance in Harry School CRM.
 */

import { measureAsyncOperation } from './web-vitals'

export interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  retries?: number
  cacheKey?: string
  cacheTTL?: number
}

export interface BatchRequest {
  id: string
  config: RequestConfig
  resolve: (value: any) => void
  reject: (error: any) => void
  timestamp: number
}

export interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  exponentialBase: number
}

class RequestOptimizer {
  private pendingRequests = new Map<string, Promise<any>>()
  private batchQueue = new Map<string, BatchRequest[]>()
  private cache = new Map<string, CacheEntry>()
  private abortControllers = new Map<string, AbortController>()
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    exponentialBase: 2,
  }

  // Request deduplication
  async request<T>(config: RequestConfig): Promise<T> {
    const cacheKey = config.cacheKey || this.generateCacheKey(config)
    
    // Check cache first
    if (config.method === 'GET' && this.hasValidCache(cacheKey)) {
      return this.getFromCache(cacheKey)
    }

    // Check for pending identical requests
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!
    }

    // Create new request with performance monitoring
    const requestPromise = this.executeRequest<T>(config, cacheKey)
    
    // Store pending request for deduplication
    this.pendingRequests.set(cacheKey, requestPromise)

    try {
      const result = await requestPromise
      
      // Cache GET requests
      if (config.method === 'GET' && config.cacheTTL) {
        this.setCache(cacheKey, result, config.cacheTTL)
      }

      return result
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(cacheKey)
    }
  }

  // Batch multiple requests
  batch<T>(requests: RequestConfig[], batchSize: number = 10): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const results: T[] = new Array(requests.length)
      let completed = 0
      let hasError = false

      const processBatch = async (batch: RequestConfig[], startIndex: number) => {
        try {
          const batchPromises = batch.map((config, index) => 
            this.request<T>(config).then(result => {
              results[startIndex + index] = result
              completed++
              
              if (completed === requests.length && !hasError) {
                resolve(results)
              }
            })
          )

          await Promise.all(batchPromises)
        } catch (error) {
          if (!hasError) {
            hasError = true
            reject(error)
          }
        }
      }

      // Split requests into batches
      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize)
        processBatch(batch, i)
      }
    })
  }

  // Execute request with retry logic and performance monitoring
  private async executeRequest<T>(
    config: RequestConfig, 
    cacheKey: string
  ): Promise<T> {
    const operationName = `request-${config.method || 'GET'}-${config.url.split('/').pop()}`

    return measureAsyncOperation(operationName, async () => {
      return this.requestWithRetry<T>(config, cacheKey, 0)
    })
  }

  // Request with retry and exponential backoff
  private async requestWithRetry<T>(
    config: RequestConfig,
    cacheKey: string,
    attempt: number
  ): Promise<T> {
    try {
      // Create abort controller for this request
      const abortController = new AbortController()
      this.abortControllers.set(cacheKey, abortController)

      // Set up timeout
      const timeoutId = config.timeout 
        ? setTimeout(() => abortController.abort(), config.timeout)
        : null

      try {
        const response = await fetch(config.url, {
          method: config.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
          },
          ...(config.body ? { body: JSON.stringify(config.body) } : {}),
          signal: abortController.signal,
        })

        if (timeoutId) clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        return data
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
        this.abortControllers.delete(cacheKey)
      }
    } catch (error) {
      const maxRetries = config.retries ?? this.retryConfig.maxRetries
      
      if (attempt < maxRetries && this.isRetryableError(error)) {
        const delay = this.calculateRetryDelay(attempt)
        await this.delay(delay)
        return this.requestWithRetry<T>(config, cacheKey, attempt + 1)
      }

      throw error
    }
  }

  // Cancel pending request
  cancelRequest(cacheKey: string): boolean {
    const abortController = this.abortControllers.get(cacheKey)
    if (abortController) {
      abortController.abort()
      this.abortControllers.delete(cacheKey)
      this.pendingRequests.delete(cacheKey)
      return true
    }
    return false
  }

  // Cancel all pending requests
  cancelAllRequests(): void {
    this.abortControllers.forEach(controller => controller.abort())
    this.abortControllers.clear()
    this.pendingRequests.clear()
  }

  // Cache management
  private hasValidCache(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl
    if (isExpired) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  private getFromCache(key: string): any {
    const entry = this.cache.get(key)
    return entry ? entry.data : null
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })

    // Auto-cleanup expired entries
    setTimeout(() => {
      if (this.cache.has(key) && !this.hasValidCache(key)) {
        this.cache.delete(key)
      }
    }, ttl)
  }

  // Clear cache
  clearCache(keyPattern?: string): void {
    if (keyPattern) {
      const regex = new RegExp(keyPattern)
      for (const [key] of this.cache) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  // Get cache statistics
  getCacheStats(): {
    size: number
    entries: Array<{ key: string; age: number; ttl: number }>
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
    }))

    return {
      size: this.cache.size,
      entries,
    }
  }

  // Utility methods
  private generateCacheKey(config: RequestConfig): string {
    const parts = [
      config.method || 'GET',
      config.url,
      config.body ? JSON.stringify(config.body) : '',
    ]
    return btoa(parts.join('|'))
  }

  private isRetryableError(error: any): boolean {
    if (error.name === 'AbortError') return false
    if (error.message?.includes('Network')) return true
    if (error.message?.includes('timeout')) return true
    if (error.message?.includes('HTTP 5')) return true
    return false
  }

  private calculateRetryDelay(attempt: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.exponentialBase, attempt),
      this.retryConfig.maxDelay
    )
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay
    return delay + jitter
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Batch queue management (for future implementation)
  queueBatchRequest(endpoint: string, config: RequestConfig): Promise<any> {
    return new Promise((resolve, reject) => {
      const batchRequest: BatchRequest = {
        id: Math.random().toString(36),
        config,
        resolve,
        reject,
        timestamp: Date.now(),
      }

      if (!this.batchQueue.has(endpoint)) {
        this.batchQueue.set(endpoint, [])
      }

      this.batchQueue.get(endpoint)!.push(batchRequest)

      // Process batch after short delay to allow more requests to queue
      setTimeout(() => this.processBatchQueue(endpoint), 10)
    })
  }

  private processBatchQueue(endpoint: string): void {
    const batch = this.batchQueue.get(endpoint)
    if (!batch || batch.length === 0) return

    this.batchQueue.set(endpoint, [])

    // Process all requests in batch
    batch.forEach(async (batchRequest) => {
      try {
        const result = await this.request(batchRequest.config)
        batchRequest.resolve(result)
      } catch (error) {
        batchRequest.reject(error)
      }
    })
  }
}

// Singleton instance
let requestOptimizer: RequestOptimizer | null = null

export const getRequestOptimizer = (): RequestOptimizer => {
  if (!requestOptimizer) {
    requestOptimizer = new RequestOptimizer()
  }
  return requestOptimizer
}

// Convenience functions
export const optimizedFetch = <T>(config: RequestConfig): Promise<T> => {
  return getRequestOptimizer().request<T>(config)
}

export const batchRequests = <T>(
  requests: RequestConfig[], 
  batchSize?: number
): Promise<T[]> => {
  return getRequestOptimizer().batch<T>(requests, batchSize)
}

export const cancelRequest = (cacheKey: string): boolean => {
  return getRequestOptimizer().cancelRequest(cacheKey)
}

export const clearRequestCache = (keyPattern?: string): void => {
  getRequestOptimizer().clearCache(keyPattern)
}

// React hook for optimized requests
export const useOptimizedRequest = () => {
  const optimizer = getRequestOptimizer()

  return {
    request: <T>(config: RequestConfig) => optimizer.request<T>(config),
    batch: <T>(requests: RequestConfig[], batchSize?: number) => 
      optimizer.batch<T>(requests, batchSize),
    cancel: (cacheKey: string) => optimizer.cancelRequest(cacheKey),
    clearCache: (keyPattern?: string) => optimizer.clearCache(keyPattern),
    getCacheStats: () => optimizer.getCacheStats(),
  }
}

// Export the main class
export { RequestOptimizer }