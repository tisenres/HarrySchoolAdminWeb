import { MMKV } from 'react-native-mmkv';
import { InteractionManager, AppState, AppStateStatus } from 'react-native';

// Strategic caching configuration
interface CacheConfig {
  namespace: string;
  defaultTTL: number;
  maxMemoryUsage: number; // in MB
  enablePersistence: boolean;
  respectPrayerTime: boolean;
  culturalContext: 'normal' | 'prayer_time' | 'ramadan';
  userType: 'student' | 'teacher' | 'admin';
  compressionEnabled: boolean;
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  priority: 'critical' | 'high' | 'normal' | 'low';
  userType: string;
  compressed?: boolean;
}

interface CacheMetrics {
  hitCount: number;
  missCount: number;
  evictionCount: number;
  compressionRatio: number;
  memoryUsage: number;
  persistenceHits: number;
}

// Educational context cache patterns
const CACHE_PATTERNS = {
  student: {
    critical: ['profile', 'dashboard', 'current-lessons', 'vocabulary-progress'],
    high: ['lesson-content', 'achievements', 'schedule'],
    normal: ['historical-data', 'settings', 'feedback'],
    low: ['analytics', 'archived-content'],
  },
  teacher: {
    critical: ['profile', 'dashboard', 'active-groups', 'attendance-data'],
    high: ['student-performance', 'lesson-plans', 'evaluations'],
    normal: ['historical-attendance', 'reports', 'settings'],
    low: ['archived-data', 'system-logs'],
  },
  admin: {
    critical: ['system-status', 'active-users', 'critical-alerts'],
    high: ['user-management', 'reports', 'system-metrics'],
    normal: ['historical-data', 'configuration', 'logs'],
    low: ['archived-reports', 'audit-trails'],
  },
};

// Strategic Cache Manager
export class StrategicCacheManager {
  private static instances = new Map<string, StrategicCacheManager>();
  private memoryCache = new Map<string, CacheEntry>();
  private persistentCache: MMKV;
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private cleanupTimer?: NodeJS.Timeout;
  private compressionWorker?: any;

  private constructor(config: CacheConfig) {
    this.config = config;
    this.metrics = {
      hitCount: 0,
      missCount: 0,
      evictionCount: 0,
      compressionRatio: 1.0,
      memoryUsage: 0,
      persistenceHits: 0,
    };

    // Initialize persistent storage
    this.persistentCache = new MMKV({
      id: `strategic-cache-${config.namespace}-${config.userType}`,
      encryptionKey: `harry-school-cache-${config.userType}`,
    });

    this.initializeCache();
    this.startCleanupTimer();
    this.setupAppStateHandling();
  }

  static getInstance(config: CacheConfig): StrategicCacheManager {
    const key = `${config.namespace}-${config.userType}`;
    if (!StrategicCacheManager.instances.has(key)) {
      StrategicCacheManager.instances.set(key, new StrategicCacheManager(config));
    }
    return StrategicCacheManager.instances.get(key)!;
  }

  private initializeCache() {
    // Load critical data from persistent cache on startup
    this.preloadCriticalData();
    
    // Initialize compression if enabled
    if (this.config.compressionEnabled) {
      this.initializeCompression();
    }
  }

  private async preloadCriticalData() {
    const criticalKeys = CACHE_PATTERNS[this.config.userType].critical;
    
    InteractionManager.runAfterInteractions(() => {
      criticalKeys.forEach(pattern => {
        const keys = this.persistentCache.getAllKeys()
          .filter(key => key.includes(pattern));
        
        keys.forEach(key => {
          try {
            const persistentData = this.persistentCache.getString(key);
            if (persistentData) {
              const entry: CacheEntry = JSON.parse(persistentData);
              
              // Check if still valid
              if (this.isEntryValid(entry)) {
                this.memoryCache.set(key, {
                  ...entry,
                  lastAccessed: Date.now(),
                });
                this.metrics.persistenceHits++;
              } else {
                // Clean up expired data
                this.persistentCache.delete(key);
              }
            }
          } catch (error) {
            console.warn(`Failed to preload cache entry ${key}:`, error);
          }
        });
      });
    });
  }

  // Strategic caching with educational context
  async set<T>(
    key: string, 
    data: T, 
    options?: {
      ttl?: number;
      priority?: 'critical' | 'high' | 'normal' | 'low';
      persist?: boolean;
      compress?: boolean;
    }
  ): Promise<void> {
    const {
      ttl = this.config.defaultTTL,
      priority = this.determinePriority(key),
      persist = this.shouldPersist(key, priority),
      compress = this.shouldCompress(data),
    } = options || {};

    // Prayer time optimization - reduce cache writes during prayer
    if (this.config.respectPrayerTime && this.checkPrayerTime()) {
      // Delay non-critical writes
      if (priority === 'low' || priority === 'normal') {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    let processedData = data;
    let isCompressed = false;

    // Apply compression if needed
    if (compress && this.config.compressionEnabled) {
      try {
        processedData = await this.compressData(data);
        isCompressed = true;
      } catch (error) {
        console.warn('Compression failed, storing uncompressed:', error);
      }
    }

    const entry: CacheEntry<T> = {
      data: processedData,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      priority,
      userType: this.config.userType,
      compressed: isCompressed,
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);

    // Store in persistent cache if needed
    if (persist && this.config.enablePersistence) {
      try {
        this.persistentCache.set(key, JSON.stringify(entry));
      } catch (error) {
        console.warn(`Failed to persist cache entry ${key}:`, error);
      }
    }

    // Update metrics
    this.updateMemoryUsage();
    this.enforceMemoryLimits();
  }

  async get<T>(key: string, fallback?: T): Promise<T | undefined> {
    // Try memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isEntryValid(memoryEntry)) {
      // Update access metrics
      memoryEntry.accessCount++;
      memoryEntry.lastAccessed = Date.now();
      this.metrics.hitCount++;

      // Decompress if needed
      if (memoryEntry.compressed) {
        try {
          return await this.decompressData(memoryEntry.data);
        } catch (error) {
          console.warn('Decompression failed:', error);
          return fallback;
        }
      }

      return memoryEntry.data;
    }

    // Try persistent cache
    if (this.config.enablePersistence) {
      const persistentData = this.persistentCache.getString(key);
      if (persistentData) {
        try {
          const entry: CacheEntry<T> = JSON.parse(persistentData);
          
          if (this.isEntryValid(entry)) {
            // Promote to memory cache
            entry.accessCount++;
            entry.lastAccessed = Date.now();
            this.memoryCache.set(key, entry);
            this.metrics.persistenceHits++;

            // Decompress if needed
            if (entry.compressed) {
              return await this.decompressData(entry.data);
            }

            return entry.data;
          } else {
            // Clean up expired persistent entry
            this.persistentCache.delete(key);
          }
        } catch (error) {
          console.warn(`Failed to parse persistent cache entry ${key}:`, error);
        }
      }
    }

    // Cache miss
    this.metrics.missCount++;
    return fallback;
  }

  // Batch operations for better performance
  async setBatch<T>(entries: Array<{
    key: string;
    data: T;
    options?: {
      ttl?: number;
      priority?: 'critical' | 'high' | 'normal' | 'low';
      persist?: boolean;
    };
  }>): Promise<void> {
    // Process entries in parallel
    await Promise.allSettled(
      entries.map(({ key, data, options }) => this.set(key, data, options))
    );
  }

  async getBatch<T>(keys: string[]): Promise<Map<string, T | undefined>> {
    const results = new Map<string, T | undefined>();
    
    // Process in parallel
    const promises = keys.map(async key => {
      const value = await this.get<T>(key);
      results.set(key, value);
    });

    await Promise.allSettled(promises);
    return results;
  }

  // Educational context-aware cache invalidation
  invalidateByPattern(pattern: string | RegExp): number {
    let invalidatedCount = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    // Invalidate memory cache
    for (const [key] of this.memoryCache) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
        invalidatedCount++;
      }
    }

    // Invalidate persistent cache
    if (this.config.enablePersistence) {
      const persistentKeys = this.persistentCache.getAllKeys();
      persistentKeys.forEach(key => {
        if (regex.test(key)) {
          this.persistentCache.delete(key);
          invalidatedCount++;
        }
      });
    }

    return invalidatedCount;
  }

  // User-specific cache invalidation
  invalidateUserData(userId: string): number {
    return this.invalidateByPattern(`user-${userId}-`);
  }

  // Cultural context-aware cache management
  adaptToCulturalContext(context: 'normal' | 'prayer_time' | 'ramadan'): void {
    this.config.culturalContext = context;

    switch (context) {
      case 'prayer_time':
        // Reduce cache operations during prayer
        this.config.defaultTTL *= 1.5; // Extend TTL to reduce churn
        break;
      case 'ramadan':
        // Optimize for reduced device usage patterns
        this.config.maxMemoryUsage *= 0.8; // Reduce memory usage
        this.enforceMemoryLimits();
        break;
      default:
        // Normal operations
        break;
    }
  }

  // Performance monitoring
  getMetrics(): CacheMetrics & { 
    hitRate: number; 
    memoryEfficiency: number;
    compressionEffectiveness: number;
  } {
    const total = this.metrics.hitCount + this.metrics.missCount;
    return {
      ...this.metrics,
      hitRate: total > 0 ? (this.metrics.hitCount / total) * 100 : 0,
      memoryEfficiency: this.calculateMemoryEfficiency(),
      compressionEffectiveness: this.calculateCompressionEffectiveness(),
    };
  }

  // Cache optimization
  optimize(): Promise<void> {
    return new Promise(resolve => {
      InteractionManager.runAfterInteractions(() => {
        // Remove expired entries
        this.cleanupExpiredEntries();
        
        // Optimize based on access patterns
        this.optimizeAccessPatterns();
        
        // Defragment if needed
        this.defragmentCache();
        
        resolve();
      });
    });
  }

  // Educational content preloading
  async preloadEducationalContent(userType: 'student' | 'teacher' | 'admin'): Promise<void> {
    const patterns = CACHE_PATTERNS[userType];
    
    // Preload critical content
    patterns.critical.forEach(pattern => {
      // This would trigger loading of critical data
      // Implementation depends on your data layer
    });
    
    // Preload high priority content during idle time
    InteractionManager.runAfterInteractions(() => {
      patterns.high.forEach(pattern => {
        // Preload high priority educational content
      });
    });
  }

  // Private helper methods
  private isEntryValid(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age < entry.ttl;
  }

  private determinePriority(key: string): 'critical' | 'high' | 'normal' | 'low' {
    const patterns = CACHE_PATTERNS[this.config.userType];
    
    for (const [priority, keyPatterns] of Object.entries(patterns)) {
      if (keyPatterns.some(pattern => key.includes(pattern))) {
        return priority as any;
      }
    }
    
    return 'normal';
  }

  private shouldPersist(key: string, priority: string): boolean {
    // Always persist critical and high priority data
    return priority === 'critical' || priority === 'high';
  }

  private shouldCompress(data: any): boolean {
    // Compress large objects or arrays
    const serialized = JSON.stringify(data);
    return serialized.length > 1024; // 1KB threshold
  }

  private async compressData(data: any): Promise<any> {
    // Simplified compression (in production, use proper compression library)
    const serialized = JSON.stringify(data);
    // This would use actual compression like LZ4 or gzip
    return { compressed: true, data: serialized, originalSize: serialized.length };
  }

  private async decompressData(compressedData: any): Promise<any> {
    if (compressedData.compressed) {
      return JSON.parse(compressedData.data);
    }
    return compressedData;
  }

  private checkPrayerTime(): boolean {
    const hour = new Date().getHours();
    return [5, 12, 15, 18, 20].includes(hour);
  }

  private updateMemoryUsage(): void {
    let usage = 0;
    for (const entry of this.memoryCache.values()) {
      usage += this.estimateEntrySize(entry);
    }
    this.metrics.memoryUsage = usage;
  }

  private estimateEntrySize(entry: CacheEntry): number {
    // Rough estimation in bytes
    return JSON.stringify(entry).length * 2; // Unicode overhead
  }

  private enforceMemoryLimits(): void {
    const maxBytes = this.config.maxMemoryUsage * 1024 * 1024; // MB to bytes
    
    if (this.metrics.memoryUsage > maxBytes) {
      // Evict LRU entries starting with lowest priority
      const entries = Array.from(this.memoryCache.entries())
        .sort((a, b) => {
          // Sort by priority then by last accessed
          const priorityOrder = { low: 0, normal: 1, high: 2, critical: 3 };
          const priorityDiff = priorityOrder[a[1].priority] - priorityOrder[b[1].priority];
          if (priorityDiff !== 0) return priorityDiff;
          return a[1].lastAccessed - b[1].lastAccessed;
        });

      // Remove entries until under limit
      while (this.metrics.memoryUsage > maxBytes && entries.length > 0) {
        const [key] = entries.shift()!;
        this.memoryCache.delete(key);
        this.metrics.evictionCount++;
        this.updateMemoryUsage();
      }
    }
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    
    // Memory cache cleanup
    for (const [key, entry] of this.memoryCache) {
      if (!this.isEntryValid(entry)) {
        this.memoryCache.delete(key);
      }
    }

    // Persistent cache cleanup
    if (this.config.enablePersistence) {
      const keys = this.persistentCache.getAllKeys();
      keys.forEach(key => {
        const data = this.persistentCache.getString(key);
        if (data) {
          try {
            const entry = JSON.parse(data);
            if (!this.isEntryValid(entry)) {
              this.persistentCache.delete(key);
            }
          } catch {
            // Invalid entry, remove it
            this.persistentCache.delete(key);
          }
        }
      });
    }
  }

  private optimizeAccessPatterns(): void {
    // Analyze access patterns and adjust priorities
    const entries = Array.from(this.memoryCache.entries());
    
    entries.forEach(([key, entry]) => {
      // Promote frequently accessed items
      if (entry.accessCount > 10 && entry.priority !== 'critical') {
        const newPriority = entry.priority === 'low' ? 'normal' : 
                           entry.priority === 'normal' ? 'high' : 'critical';
        entry.priority = newPriority;
      }
    });
  }

  private defragmentCache(): void {
    // Recreate memory cache to defragment
    const entries = Array.from(this.memoryCache.entries());
    this.memoryCache.clear();
    
    entries.forEach(([key, entry]) => {
      this.memoryCache.set(key, entry);
    });
  }

  private calculateMemoryEfficiency(): number {
    const totalEntries = this.memoryCache.size;
    if (totalEntries === 0) return 100;
    
    const criticalAndHigh = Array.from(this.memoryCache.values())
      .filter(entry => entry.priority === 'critical' || entry.priority === 'high')
      .length;
    
    return (criticalAndHigh / totalEntries) * 100;
  }

  private calculateCompressionEffectiveness(): number {
    if (!this.config.compressionEnabled) return 0;
    
    const compressedEntries = Array.from(this.memoryCache.values())
      .filter(entry => entry.compressed);
    
    if (compressedEntries.length === 0) return 0;
    
    // This would calculate actual compression ratio in production
    return this.metrics.compressionRatio * 100;
  }

  private startCleanupTimer(): void {
    // Cleanup every 5 minutes
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  private setupAppStateHandling(): void {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        // Flush memory cache to persistent storage for critical data
        this.flushCriticalDataToPersistence();
      } else if (nextAppState === 'active') {
        // Preload critical data back to memory
        this.preloadCriticalData();
      }
    });
  }

  private flushCriticalDataToPersistence(): void {
    if (!this.config.enablePersistence) return;
    
    for (const [key, entry] of this.memoryCache) {
      if (entry.priority === 'critical' || entry.priority === 'high') {
        try {
          this.persistentCache.set(key, JSON.stringify(entry));
        } catch (error) {
          console.warn(`Failed to flush critical data ${key}:`, error);
        }
      }
    }
  }

  private initializeCompression(): void {
    // Initialize compression worker if available
    // This would set up a compression worker in production
    this.compressionWorker = null; // Placeholder
  }

  // Cleanup
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.memoryCache.clear();
    this.compressionWorker = null;
  }
}

// Factory functions for common educational use cases
export const createStudentCache = (options?: Partial<CacheConfig>) =>
  StrategicCacheManager.getInstance({
    namespace: 'student-app',
    defaultTTL: 10 * 60 * 1000, // 10 minutes
    maxMemoryUsage: 20, // 20MB
    enablePersistence: true,
    respectPrayerTime: true,
    culturalContext: 'normal',
    userType: 'student',
    compressionEnabled: true,
    ...options,
  });

export const createTeacherCache = (options?: Partial<CacheConfig>) =>
  StrategicCacheManager.getInstance({
    namespace: 'teacher-app',
    defaultTTL: 15 * 60 * 1000, // 15 minutes
    maxMemoryUsage: 30, // 30MB
    enablePersistence: true,
    respectPrayerTime: true,
    culturalContext: 'normal',
    userType: 'teacher',
    compressionEnabled: true,
    ...options,
  });

export const createAdminCache = (options?: Partial<CacheConfig>) =>
  StrategicCacheManager.getInstance({
    namespace: 'admin-panel',
    defaultTTL: 5 * 60 * 1000, // 5 minutes (more frequent updates)
    maxMemoryUsage: 50, // 50MB
    enablePersistence: true,
    respectPrayerTime: true,
    culturalContext: 'normal',
    userType: 'admin',
    compressionEnabled: true,
    ...options,
  });

export default StrategicCacheManager;