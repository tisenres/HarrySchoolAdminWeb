import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NetInfo } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  etag?: string;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheConfig {
  defaultTTL: number; // Time to live in ms
  maxSize: number; // Max cache size in bytes
  maxEntries: number; // Max number of entries
  cleanupInterval: number; // Cleanup interval in ms
}

interface QueryMetrics {
  queryKey: string;
  duration: number;
  timestamp: number;
  cacheHit: boolean;
  networkType: string;
  dataSize: number;
  error?: string;
}

interface NetworkCondition {
  type: string; // 'wifi', 'cellular', 'none'
  effectiveType?: string; // '4g', '3g', '2g', 'slow-2g'
  isInternetReachable: boolean;
}

/**
 * Performance optimization system for mobile Supabase operations
 * Implements intelligent caching, query optimization, and network-aware strategies
 */
export class PerformanceManager {
  private static readonly CACHE_KEY_PREFIX = '@harry-school:cache:';
  private static readonly METRICS_KEY = '@harry-school:query-metrics';
  private static readonly NETWORK_KEY = '@harry-school:network-condition';
  
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cacheConfig: CacheConfig;
  private currentCacheSize = 0;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private metricsBuffer: QueryMetrics[] = [];
  private networkCondition: NetworkCondition | null = null;
  private performanceListeners: Set<(metrics: QueryMetrics) => void> = new Set();

  constructor(config?: Partial<CacheConfig>) {
    this.cacheConfig = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 10 * 1024 * 1024, // 10MB
      maxEntries: 1000,
      cleanupInterval: 2 * 60 * 1000, // 2 minutes
      ...config,
    };

    this.initializePerformanceMonitoring();
    this.loadCacheFromStorage();
    this.startCleanupTimer();
  }

  /**
   * Execute query with intelligent caching and performance monitoring
   */
  async executeQuery<T>(
    queryKey: string,
    queryFn: (client: SupabaseClient<Database>) => Promise<{ data: T | null; error: any }>,
    client: SupabaseClient<Database>,
    options: {
      ttl?: number;
      forceRefresh?: boolean;
      enableCache?: boolean;
      priority?: 'high' | 'medium' | 'low';
      networkOptimized?: boolean;
    } = {}
  ): Promise<{ data: T | null; error: any; fromCache?: boolean; metrics?: QueryMetrics }> {
    const startTime = Date.now();
    const { ttl = this.cacheConfig.defaultTTL, forceRefresh = false, enableCache = true } = options;
    
    // Check cache first (unless force refresh)
    if (enableCache && !forceRefresh) {
      const cached = await this.getCachedData<T>(queryKey);
      if (cached) {
        const metrics = this.createMetrics(queryKey, Date.now() - startTime, true, 0);
        this.recordMetrics(metrics);
        return { data: cached, error: null, fromCache: true, metrics };
      }
    }

    // Optimize query based on network conditions
    const optimizedQuery = await this.optimizeQueryForNetwork(queryFn, options);
    
    try {
      // Execute the query
      const result = await optimizedQuery(client);
      const duration = Date.now() - startTime;
      const dataSize = this.estimateDataSize(result.data);
      
      // Cache successful results
      if (enableCache && result.data && !result.error) {
        await this.setCachedData(queryKey, result.data, ttl);
      }

      const metrics = this.createMetrics(queryKey, duration, false, dataSize, result.error?.message);
      this.recordMetrics(metrics);

      return { ...result, fromCache: false, metrics };
    } catch (error) {
      const duration = Date.now() - startTime;
      const metrics = this.createMetrics(queryKey, duration, false, 0, error.message);
      this.recordMetrics(metrics);
      
      throw error;
    }
  }

  /**
   * Prefetch data for improved user experience
   */
  async prefetchData<T>(
    queryKey: string,
    queryFn: (client: SupabaseClient<Database>) => Promise<{ data: T | null; error: any }>,
    client: SupabaseClient<Database>,
    priority: 'high' | 'medium' | 'low' = 'low'
  ): Promise<void> {
    // Only prefetch on good network conditions
    const networkCondition = await this.getNetworkCondition();
    if (!this.shouldPrefetch(networkCondition, priority)) {
      return;
    }

    // Check if already cached and not expired
    const cached = await this.getCachedData<T>(queryKey);
    if (cached) {
      return;
    }

    try {
      await this.executeQuery(queryKey, queryFn, client, {
        priority,
        networkOptimized: true,
      });
    } catch (error) {
      // Prefetch failures shouldn't affect the main flow
      console.warn('Prefetch failed for', queryKey, error);
    }
  }

  /**
   * Batch multiple queries for efficiency
   */
  async executeBatch<T>(
    queries: Array<{
      key: string;
      query: (client: SupabaseClient<Database>) => Promise<{ data: T | null; error: any }>;
      options?: any;
    }>,
    client: SupabaseClient<Database>
  ): Promise<Array<{ data: T | null; error: any; fromCache?: boolean }>> {
    const networkCondition = await this.getNetworkCondition();
    const batchSize = this.getBatchSize(networkCondition);
    
    const results: Array<{ data: T | null; error: any; fromCache?: boolean }> = [];
    
    // Process queries in batches
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      const batchPromises = batch.map(({ key, query, options }) =>
        this.executeQuery(key, query, client, options)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({ data: null, error: { message: result.reason.message } });
        }
      });
      
      // Add delay between batches on slower networks
      if (i + batchSize < queries.length && networkCondition?.effectiveType === '2g') {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Invalidate cache entries
   */
  async invalidateCache(pattern?: string): Promise<void> {
    if (pattern) {
      // Invalidate entries matching pattern
      const regex = new RegExp(pattern);
      const keysToRemove: string[] = [];
      
      this.cache.forEach((_, key) => {
        if (regex.test(key)) {
          keysToRemove.push(key);
        }
      });
      
      keysToRemove.forEach(key => this.cache.delete(key));
      await this.persistCacheToStorage();
    } else {
      // Clear all cache
      this.cache.clear();
      this.currentCacheSize = 0;
      await AsyncStorage.multiRemove(
        (await AsyncStorage.getAllKeys()).filter(key => 
          key.startsWith(PerformanceManager.CACHE_KEY_PREFIX)
        )
      );
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: number;
    hitRate: number;
    averageAccessTime: number;
    topQueries: Array<{ key: string; accessCount: number; size: number }>;
  } {
    const entries = Array.from(this.cache.entries());
    const totalAccess = entries.reduce((sum, [, entry]) => sum + entry.accessCount, 0);
    const totalHits = this.metricsBuffer.filter(m => m.cacheHit).length;
    const totalQueries = this.metricsBuffer.length;
    
    const topQueries = entries
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        size: entry.size,
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    return {
      size: this.currentCacheSize,
      entries: this.cache.size,
      hitRate: totalQueries > 0 ? (totalHits / totalQueries) * 100 : 0,
      averageAccessTime: this.metricsBuffer.length > 0 
        ? this.metricsBuffer.reduce((sum, m) => sum + m.duration, 0) / this.metricsBuffer.length
        : 0,
      topQueries,
    };
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<{
    averageQueryTime: number;
    cacheHitRate: number;
    networkBreakdown: Record<string, number>;
    slowQueries: QueryMetrics[];
    errorRate: number;
  }> {
    const metrics = await this.getStoredMetrics();
    const totalQueries = metrics.length;
    
    if (totalQueries === 0) {
      return {
        averageQueryTime: 0,
        cacheHitRate: 0,
        networkBreakdown: {},
        slowQueries: [],
        errorRate: 0,
      };
    }

    const averageQueryTime = metrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries;
    const cacheHits = metrics.filter(m => m.cacheHit).length;
    const errors = metrics.filter(m => m.error).length;
    
    const networkBreakdown = metrics.reduce((acc, m) => {
      acc[m.networkType] = (acc[m.networkType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const slowQueries = metrics
      .filter(m => m.duration > 2000) // Queries taking more than 2 seconds
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      averageQueryTime,
      cacheHitRate: (cacheHits / totalQueries) * 100,
      networkBreakdown,
      slowQueries,
      errorRate: (errors / totalQueries) * 100,
    };
  }

  /**
   * Subscribe to performance events
   */
  addEventListener(listener: (metrics: QueryMetrics) => void): () => void {
    this.performanceListeners.add(listener);
    return () => this.performanceListeners.delete(listener);
  }

  // Private helper methods

  private async getCachedData<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.currentCacheSize -= entry.size;
      return null;
    }
    
    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    return entry.data;
  }

  private async setCachedData<T>(key: string, data: T, ttl: number): Promise<void> {
    const size = this.estimateDataSize(data);
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      size,
      accessCount: 1,
      lastAccessed: now,
    };
    
    // Check cache limits
    await this.ensureCacheSpace(size);
    
    this.cache.set(key, entry);
    this.currentCacheSize += size;
    
    // Persist to storage for important entries
    await this.persistCacheEntry(key, entry);
  }

  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    // If adding this entry would exceed limits, remove old entries
    while (
      (this.currentCacheSize + requiredSize > this.cacheConfig.maxSize) ||
      (this.cache.size >= this.cacheConfig.maxEntries)
    ) {
      await this.evictLRUEntry();
    }
  }

  private async evictLRUEntry(): Promise<void> {
    let oldestEntry: [string, CacheEntry<any>] | null = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestEntry = [key, entry];
      }
    }
    
    if (oldestEntry) {
      const [key, entry] = oldestEntry;
      this.cache.delete(key);
      this.currentCacheSize -= entry.size;
      await AsyncStorage.removeItem(PerformanceManager.CACHE_KEY_PREFIX + key);
    }
  }

  private async optimizeQueryForNetwork<T>(
    queryFn: (client: SupabaseClient<Database>) => Promise<{ data: T | null; error: any }>,
    options: any
  ): Promise<(client: SupabaseClient<Database>) => Promise<{ data: T | null; error: any }>> {
    const networkCondition = await this.getNetworkCondition();
    
    if (!options.networkOptimized) {
      return queryFn;
    }
    
    // Optimize based on network conditions
    return async (client: SupabaseClient<Database>) => {
      // Add timeout based on network speed
      const timeout = this.getTimeoutForNetwork(networkCondition);
      
      return Promise.race([
        queryFn(client),
        new Promise<{ data: null; error: any }>((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        ),
      ]);
    };
  }

  private shouldPrefetch(networkCondition: NetworkCondition | null, priority: string): boolean {
    if (!networkCondition?.isInternetReachable) {
      return false;
    }
    
    // Only prefetch on good connections for low priority
    if (priority === 'low' && networkCondition.type !== 'wifi') {
      return false;
    }
    
    // Don't prefetch on very slow connections
    if (networkCondition.effectiveType === 'slow-2g') {
      return false;
    }
    
    return true;
  }

  private getBatchSize(networkCondition: NetworkCondition | null): number {
    if (!networkCondition) return 3;
    
    switch (networkCondition.effectiveType) {
      case '4g':
        return 10;
      case '3g':
        return 5;
      case '2g':
        return 2;
      case 'slow-2g':
        return 1;
      default:
        return 3;
    }
  }

  private getTimeoutForNetwork(networkCondition: NetworkCondition | null): number {
    if (!networkCondition) return 10000; // 10 seconds default
    
    switch (networkCondition.effectiveType) {
      case '4g':
        return 5000;
      case '3g':
        return 10000;
      case '2g':
        return 20000;
      case 'slow-2g':
        return 30000;
      default:
        return 10000;
    }
  }

  private estimateDataSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      // Fallback estimation
      return JSON.stringify(data || {}).length * 2; // Rough estimate
    }
  }

  private createMetrics(
    queryKey: string,
    duration: number,
    cacheHit: boolean,
    dataSize: number,
    error?: string
  ): QueryMetrics {
    return {
      queryKey,
      duration,
      timestamp: Date.now(),
      cacheHit,
      networkType: this.networkCondition?.type || 'unknown',
      dataSize,
      error,
    };
  }

  private recordMetrics(metrics: QueryMetrics): void {
    this.metricsBuffer.push(metrics);
    
    // Limit buffer size
    if (this.metricsBuffer.length > 1000) {
      this.metricsBuffer = this.metricsBuffer.slice(-500);
    }
    
    // Notify listeners
    this.performanceListeners.forEach(listener => {
      try {
        listener(metrics);
      } catch (error) {
        console.error('Error in performance listener:', error);
      }
    });
    
    // Periodically persist metrics
    if (this.metricsBuffer.length % 50 === 0) {
      this.persistMetrics();
    }
  }

  private async initializePerformanceMonitoring(): Promise<void> {
    // Monitor network conditions
    NetInfo?.addEventListener?.(state => {
      this.networkCondition = {
        type: state.type,
        effectiveType: state.details?.effectiveType,
        isInternetReachable: state.isInternetReachable ?? false,
      };
    });
    
    // Get initial network state
    NetInfo?.fetch?.().then(state => {
      this.networkCondition = {
        type: state.type,
        effectiveType: state.details?.effectiveType,
        isInternetReachable: state.isInternetReachable ?? false,
      };
    });
  }

  private async getNetworkCondition(): Promise<NetworkCondition | null> {
    if (this.networkCondition) {
      return this.networkCondition;
    }
    
    // Fallback to stored condition
    try {
      const stored = await AsyncStorage.getItem(PerformanceManager.NETWORK_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private async loadCacheFromStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(PerformanceManager.CACHE_KEY_PREFIX));
      
      if (cacheKeys.length === 0) return;
      
      const cacheEntries = await AsyncStorage.multiGet(cacheKeys);
      
      for (const [key, value] of cacheEntries) {
        if (value) {
          try {
            const entry: CacheEntry<any> = JSON.parse(value);
            const cacheKey = key.replace(PerformanceManager.CACHE_KEY_PREFIX, '');
            
            // Check if still valid
            if (Date.now() < entry.expiresAt) {
              this.cache.set(cacheKey, entry);
              this.currentCacheSize += entry.size;
            }
          } catch (error) {
            // Remove invalid cache entry
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
    }
  }

  private async persistCacheEntry(key: string, entry: CacheEntry<any>): Promise<void> {
    try {
      await AsyncStorage.setItem(
        PerformanceManager.CACHE_KEY_PREFIX + key,
        JSON.stringify(entry)
      );
    } catch (error) {
      // Storage failed, continue without persistence
      console.warn('Failed to persist cache entry:', error);
    }
  }

  private async persistCacheToStorage(): Promise<void> {
    try {
      const operations: Array<[string, string]> = [];
      
      this.cache.forEach((entry, key) => {
        operations.push([
          PerformanceManager.CACHE_KEY_PREFIX + key,
          JSON.stringify(entry),
        ]);
      });
      
      await AsyncStorage.multiSet(operations);
    } catch (error) {
      console.error('Failed to persist cache:', error);
    }
  }

  private async persistMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        PerformanceManager.METRICS_KEY,
        JSON.stringify(this.metricsBuffer.slice(-500)) // Keep last 500 entries
      );
    } catch (error) {
      console.error('Failed to persist metrics:', error);
    }
  }

  private async getStoredMetrics(): Promise<QueryMetrics[]> {
    try {
      const stored = await AsyncStorage.getItem(PerformanceManager.METRICS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return this.metricsBuffer;
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.cacheConfig.cleanupInterval);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
        this.currentCacheSize -= entry.size;
      }
    });
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      this.persistCacheToStorage();
    }
  }

  cleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.performanceListeners.clear();
    this.persistMetrics();
    this.persistCacheToStorage();
  }
}

export type { CacheConfig, QueryMetrics, NetworkCondition };