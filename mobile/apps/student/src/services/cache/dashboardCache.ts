/**
 * Student Dashboard Cache Service
 * Harry School Student App
 * 
 * Multi-layer caching system with MMKV storage and memory optimization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  StudentRankingData, 
  StudentAchievementData, 
  LeaderboardData 
} from '../supabase/dashboardSubscriptions';
import { 
  TodayScheduleItem, 
  PendingTaskData, 
  QuickStatsData 
} from '../supabase/dashboardData';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time To Live in milliseconds
  version: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
  hitRatio: number;
}

/**
 * Cache configuration for different data types
 */
const CACHE_CONFIG = {
  rankings: { ttl: 5 * 60 * 1000, maxEntries: 10 }, // 5 minutes, 10 entries
  achievements: { ttl: 30 * 60 * 1000, maxEntries: 50 }, // 30 minutes, 50 entries
  leaderboard: { ttl: 10 * 60 * 1000, maxEntries: 5 }, // 10 minutes, 5 entries
  schedule: { ttl: 60 * 60 * 1000, maxEntries: 20 }, // 1 hour, 20 entries
  tasks: { ttl: 15 * 60 * 1000, maxEntries: 100 }, // 15 minutes, 100 entries
  stats: { ttl: 5 * 60 * 1000, maxEntries: 10 }, // 5 minutes, 10 entries
  dashboard: { ttl: 2 * 60 * 1000, maxEntries: 5 }, // 2 minutes, 5 entries (composite data)
} as const;

export type CacheType = keyof typeof CACHE_CONFIG;

/**
 * LRU Cache implementation for memory layer
 */
class LRUCache<T> {
  private capacity: number;
  private cache: Map<string, CacheEntry<T>>;
  private accessOrder: string[];

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
    this.accessOrder = [];
  }

  get(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.delete(key);
      return null;
    }

    // Move to front (most recently used)
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.unshift(key);

    return entry;
  }

  set(key: string, entry: CacheEntry<T>): void {
    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    }

    // Add new entry
    this.cache.set(key, entry);
    this.accessOrder.unshift(key);

    // Evict least recently used if over capacity
    while (this.accessOrder.length > this.capacity) {
      const lruKey = this.accessOrder.pop();
      if (lruKey) {
        this.cache.delete(lruKey);
      }
    }
  }

  delete(key: string): boolean {
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

/**
 * Dashboard Cache Manager
 */
class DashboardCacheManager {
  private memoryCache: Map<CacheType, LRUCache<any>>;
  private metrics: Map<CacheType, CacheMetrics>;
  private version = 1; // Increment to invalidate all caches

  constructor() {
    this.memoryCache = new Map();
    this.metrics = new Map();
    
    // Initialize memory caches for each type
    Object.entries(CACHE_CONFIG).forEach(([type, config]) => {
      this.memoryCache.set(type as CacheType, new LRUCache(config.maxEntries));
      this.metrics.set(type as CacheType, {
        hits: 0,
        misses: 0,
        evictions: 0,
        totalSize: 0,
        hitRatio: 0
      });
    });
  }

  /**
   * Get data from cache (memory first, then persistent storage)
   */
  async get<T>(type: CacheType, key: string): Promise<T | null> {
    const fullKey = `${type}:${key}`;
    
    try {
      // Try memory cache first
      const memoryEntry = this.memoryCache.get(type)?.get(fullKey);
      if (memoryEntry) {
        this.updateMetrics(type, 'hit');
        return memoryEntry.data;
      }

      // Try persistent storage
      const persistentData = await AsyncStorage.getItem(fullKey);
      if (persistentData) {
        const entry: CacheEntry<T> = JSON.parse(persistentData);
        
        // Check if expired
        if (Date.now() <= entry.timestamp + entry.ttl && entry.version === this.version) {
          // Move to memory cache
          this.memoryCache.get(type)?.set(fullKey, entry);
          this.updateMetrics(type, 'hit');
          return entry.data;
        } else {
          // Remove expired entry
          await AsyncStorage.removeItem(fullKey);
        }
      }

      this.updateMetrics(type, 'miss');
      return null;

    } catch (error) {
      console.warn('⚠️ Cache read error:', error);
      this.updateMetrics(type, 'miss');
      return null;
    }
  }

  /**
   * Set data in cache (both memory and persistent storage)
   */
  async set<T>(type: CacheType, key: string, data: T): Promise<void> {
    const fullKey = `${type}:${key}`;
    const config = CACHE_CONFIG[type];
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: config.ttl,
      version: this.version
    };

    try {
      // Set in memory cache
      this.memoryCache.get(type)?.set(fullKey, entry);

      // Set in persistent storage (fire-and-forget)
      AsyncStorage.setItem(fullKey, JSON.stringify(entry)).catch(error => {
        console.warn('⚠️ Persistent cache write error:', error);
      });

      this.updateMetrics(type, 'set');

    } catch (error) {
      console.warn('⚠️ Cache write error:', error);
    }
  }

  /**
   * Get data with stale-while-revalidate pattern
   */
  async getWithRevalidate<T>(
    type: CacheType,
    key: string,
    fetchFunction: () => Promise<T>,
    staleTime: number = 60000 // 1 minute
  ): Promise<{ data: T; isStale: boolean }> {
    
    const cachedData = await this.get<T>(type, key);
    
    if (cachedData) {
      // Check if data is stale
      const fullKey = `${type}:${key}`;
      const memoryEntry = this.memoryCache.get(type)?.get(fullKey);
      const isStale = memoryEntry ? 
        Date.now() > memoryEntry.timestamp + staleTime : 
        false;

      if (isStale) {
        // Background revalidation
        fetchFunction().then(freshData => {
          this.set(type, key, freshData);
        }).catch(error => {
          console.warn('⚠️ Background revalidation failed:', error);
        });
      }

      return { data: cachedData, isStale };
    }

    // No cached data, fetch fresh
    try {
      const freshData = await fetchFunction();
      await this.set(type, key, freshData);
      return { data: freshData, isStale: false };
    } catch (error) {
      console.error('❌ Failed to fetch fresh data:', error);
      throw error;
    }
  }

  /**
   * Delete specific cache entry
   */
  async delete(type: CacheType, key: string): Promise<void> {
    const fullKey = `${type}:${key}`;
    
    try {
      // Remove from memory
      this.memoryCache.get(type)?.delete(fullKey);
      
      // Remove from persistent storage
      await AsyncStorage.removeItem(fullKey);
      
    } catch (error) {
      console.warn('⚠️ Cache deletion error:', error);
    }
  }

  /**
   * Clear all caches of a specific type
   */
  async clear(type: CacheType): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.get(type)?.clear();
      
      // Get all keys for this type from persistent storage
      const allKeys = await AsyncStorage.getAllKeys();
      const typeKeys = allKeys.filter(key => key.startsWith(`${type}:`));
      
      // Remove all keys for this type
      if (typeKeys.length > 0) {
        await AsyncStorage.multiRemove(typeKeys);
      }

      // Reset metrics
      this.metrics.set(type, {
        hits: 0,
        misses: 0,
        evictions: 0,
        totalSize: 0,
        hitRatio: 0
      });

    } catch (error) {
      console.warn('⚠️ Cache clear error:', error);
    }
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    for (const type of Object.keys(CACHE_CONFIG) as CacheType[]) {
      await this.clear(type);
    }
  }

  /**
   * Get cache metrics
   */
  getMetrics(type?: CacheType): CacheMetrics | Map<CacheType, CacheMetrics> {
    if (type) {
      return this.metrics.get(type) || {
        hits: 0,
        misses: 0,
        evictions: 0,
        totalSize: 0,
        hitRatio: 0
      };
    }
    return this.metrics;
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(type: CacheType, operation: 'hit' | 'miss' | 'set'): void {
    const metrics = this.metrics.get(type);
    if (!metrics) return;

    switch (operation) {
      case 'hit':
        metrics.hits++;
        break;
      case 'miss':
        metrics.misses++;
        break;
      case 'set':
        metrics.totalSize = this.memoryCache.get(type)?.size() || 0;
        break;
    }

    metrics.hitRatio = metrics.hits / (metrics.hits + metrics.misses) || 0;
    this.metrics.set(type, metrics);
  }

  /**
   * Preload critical dashboard data
   */
  async preloadDashboardData(studentId: string): Promise<void> {
    const criticalKeys = [
      `rankings:${studentId}`,
      `stats:${studentId}`,
      `schedule:${studentId}:${new Date().toDateString()}`
    ];

    // Check what's already cached
    const promises = criticalKeys.map(async (key) => {
      const [type, ...keyParts] = key.split(':');
      const cacheKey = keyParts.join(':');
      const cached = await this.get(type as CacheType, cacheKey);
      return { key, cached: !!cached };
    });

    const results = await Promise.allSettled(promises);
    const uncachedKeys = results
      .filter(result => result.status === 'fulfilled' && !result.value.cached)
      .map(result => result.status === 'fulfilled' ? result.value.key : '');

    console.log(`📊 Dashboard cache preload: ${criticalKeys.length - uncachedKeys.length}/${criticalKeys.length} items cached`);
  }

  /**
   * Invalidate caches when user data changes
   */
  async invalidateUserData(studentId: string): Promise<void> {
    const userKeys = [
      `rankings:${studentId}`,
      `achievements:${studentId}`,
      `stats:${studentId}`,
      `tasks:${studentId}`,
      `schedule:${studentId}:${new Date().toDateString()}`
    ];

    await Promise.allSettled(
      userKeys.map(key => {
        const [type, ...keyParts] = key.split(':');
        return this.delete(type as CacheType, keyParts.join(':'));
      })
    );

    console.log('🔄 User data cache invalidated');
  }

  /**
   * Background cleanup of expired entries
   */
  async cleanupExpired(): Promise<number> {
    let cleanedCount = 0;

    try {
      // Get all keys from persistent storage
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => 
        Object.keys(CACHE_CONFIG).some(type => key.startsWith(`${type}:`))
      );

      // Check each key for expiration
      const expiredKeys: string[] = [];
      
      for (const key of cacheKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const entry: CacheEntry = JSON.parse(data);
            if (Date.now() > entry.timestamp + entry.ttl || entry.version < this.version) {
              expiredKeys.push(key);
            }
          }
        } catch (error) {
          // Invalid data, mark for deletion
          expiredKeys.push(key);
        }
      }

      // Remove expired keys
      if (expiredKeys.length > 0) {
        await AsyncStorage.multiRemove(expiredKeys);
        cleanedCount = expiredKeys.length;
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
      }

    } catch (error) {
      console.warn('⚠️ Cache cleanup error:', error);
    }

    return cleanedCount;
  }
}

// Export singleton instance
export const dashboardCache = new DashboardCacheManager();

/**
 * Dashboard-specific cache helpers
 */
export class DashboardCacheHelpers {
  
  static async cacheStudentRanking(studentId: string, data: StudentRankingData): Promise<void> {
    await dashboardCache.set('rankings', studentId, data);
  }

  static async getCachedStudentRanking(studentId: string): Promise<StudentRankingData | null> {
    return dashboardCache.get<StudentRankingData>('rankings', studentId);
  }

  static async cacheStudentAchievements(studentId: string, data: StudentAchievementData[]): Promise<void> {
    await dashboardCache.set('achievements', studentId, data);
  }

  static async getCachedStudentAchievements(studentId: string): Promise<StudentAchievementData[] | null> {
    return dashboardCache.get<StudentAchievementData[]>('achievements', studentId);
  }

  static async cacheLeaderboard(organizationId: string, data: LeaderboardData[]): Promise<void> {
    await dashboardCache.set('leaderboard', organizationId, data);
  }

  static async getCachedLeaderboard(organizationId: string): Promise<LeaderboardData[] | null> {
    return dashboardCache.get<LeaderboardData[]>('leaderboard', organizationId);
  }

  static async cacheTodaySchedule(studentId: string, data: TodayScheduleItem[]): Promise<void> {
    const dateKey = `${studentId}:${new Date().toDateString()}`;
    await dashboardCache.set('schedule', dateKey, data);
  }

  static async getCachedTodaySchedule(studentId: string): Promise<TodayScheduleItem[] | null> {
    const dateKey = `${studentId}:${new Date().toDateString()}`;
    return dashboardCache.get<TodayScheduleItem[]>('schedule', dateKey);
  }

  static async cachePendingTasks(studentId: string, data: PendingTaskData[]): Promise<void> {
    await dashboardCache.set('tasks', studentId, data);
  }

  static async getCachedPendingTasks(studentId: string): Promise<PendingTaskData[] | null> {
    return dashboardCache.get<PendingTaskData[]>('tasks', studentId);
  }

  static async cacheQuickStats(studentId: string, data: QuickStatsData): Promise<void> {
    await dashboardCache.set('stats', studentId, data);
  }

  static async getCachedQuickStats(studentId: string): Promise<QuickStatsData | null> {
    return dashboardCache.get<QuickStatsData>('stats', studentId);
  }

  static async cacheDashboardData(
    studentId: string, 
    data: {
      ranking: StudentRankingData | null;
      achievements: StudentAchievementData[];
      leaderboard: LeaderboardData[];
      schedule: TodayScheduleItem[];
      tasks: PendingTaskData[];
      stats: QuickStatsData | null;
    }
  ): Promise<void> {
    await dashboardCache.set('dashboard', studentId, data);
  }

  static async getCachedDashboardData(studentId: string) {
    return dashboardCache.get('dashboard', studentId);
  }
}

// Initialize background cleanup
setInterval(() => {
  dashboardCache.cleanupExpired();
}, 60 * 60 * 1000); // Run every hour