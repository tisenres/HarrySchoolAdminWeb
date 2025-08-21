import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  strategy?: 'memory' | 'storage' | 'hybrid';
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private memoryStore = new Map<string, CacheItem<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  async set<T>(
    key: string, 
    data: T, 
    config: CacheConfig = {}
  ): Promise<void> {
    const { ttl = this.defaultTTL, strategy = 'hybrid' } = config;
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // Store in memory for fast access
    if (strategy === 'memory' || strategy === 'hybrid') {
      this.memoryStore.set(key, cacheItem);
    }

    // Store in AsyncStorage for persistence
    if (strategy === 'storage' || strategy === 'hybrid') {
      try {
        await AsyncStorage.setItem(
          `cache_${key}`, 
          JSON.stringify(cacheItem)
        );
      } catch (error) {
        console.warn('Failed to store in AsyncStorage:', error);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Try memory first for speed
    const memoryItem = this.memoryStore.get(key);
    if (memoryItem && this.isValid(memoryItem)) {
      return memoryItem.data;
    }

    // Fall back to AsyncStorage
    try {
      const storedItem = await AsyncStorage.getItem(`cache_${key}`);
      if (storedItem) {
        const cacheItem: CacheItem<T> = JSON.parse(storedItem);
        if (this.isValid(cacheItem)) {
          // Restore to memory for next access
          this.memoryStore.set(key, cacheItem);
          return cacheItem.data;
        } else {
          // Clean up expired storage item
          await AsyncStorage.removeItem(`cache_${key}`);
        }
      }
    } catch (error) {
      console.warn('Failed to read from AsyncStorage:', error);
    }

    return null;
  }

  async invalidate(key: string): Promise<void> {
    this.memoryStore.delete(key);
    try {
      await AsyncStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Failed to remove from AsyncStorage:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // Invalidate memory cache
    for (const key of this.memoryStore.keys()) {
      if (key.includes(pattern)) {
        this.memoryStore.delete(key);
      }
    }

    // Invalidate AsyncStorage
    try {
      const keys = await AsyncStorage.getAllKeys();
      const matchingKeys = keys.filter(key => 
        key.startsWith('cache_') && key.includes(pattern)
      );
      await AsyncStorage.multiRemove(matchingKeys);
    } catch (error) {
      console.warn('Failed to invalidate pattern from AsyncStorage:', error);
    }
  }

  async clearAll(): Promise<void> {
    this.memoryStore.clear();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Failed to clear AsyncStorage cache:', error);
    }
  }

  private isValid<T>(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp < item.ttl;
  }

  // Teacher-specific cache keys
  getTeacherKey(teacherId: string, dataType: string): string {
    return `teacher_${teacherId}_${dataType}`;
  }

  getDashboardKey(teacherId: string): string {
    return `dashboard_${teacherId}`;
  }

  getClassesKey(teacherId: string, date: string): string {
    return `classes_${teacherId}_${date}`;
  }

  getGroupsKey(teacherId: string): string {
    return `groups_${teacherId}`;
  }

  getPerformanceKey(teacherId: string): string {
    return `performance_${teacherId}`;
  }

  getBadgeCountsKey(teacherId: string): string {
    return `badge_counts_${teacherId}`;
  }
}

export const memoryCache = new MemoryCache();

// Teacher-specific cache utilities
export const teacherCache = {
  // Dashboard data caching
  async getDashboardData(teacherId: string) {
    return await memoryCache.get(memoryCache.getDashboardKey(teacherId));
  },

  async setDashboardData(teacherId: string, data: any) {
    await memoryCache.set(
      memoryCache.getDashboardKey(teacherId), 
      data, 
      { ttl: 2 * 60 * 1000 } // 2 minutes for dashboard
    );
  },

  // Classes data caching
  async getTodaysClasses(teacherId: string, date: string) {
    return await memoryCache.get(memoryCache.getClassesKey(teacherId, date));
  },

  async setTodaysClasses(teacherId: string, date: string, classes: any[]) {
    await memoryCache.set(
      memoryCache.getClassesKey(teacherId, date), 
      classes,
      { ttl: 10 * 60 * 1000 } // 10 minutes for classes
    );
  },

  // Groups data caching
  async getGroupsData(teacherId: string) {
    return await memoryCache.get(memoryCache.getGroupsKey(teacherId));
  },

  async setGroupsData(teacherId: string, groups: any[]) {
    await memoryCache.set(
      memoryCache.getGroupsKey(teacherId), 
      groups,
      { ttl: 5 * 60 * 1000 } // 5 minutes for groups
    );
  },

  // Performance data caching
  async getPerformanceData(teacherId: string) {
    return await memoryCache.get(memoryCache.getPerformanceKey(teacherId));
  },

  async setPerformanceData(teacherId: string, performance: any) {
    await memoryCache.set(
      memoryCache.getPerformanceKey(teacherId), 
      performance,
      { ttl: 15 * 60 * 1000 } // 15 minutes for performance
    );
  },

  // Badge counts caching
  async getBadgeCounts(teacherId: string) {
    return await memoryCache.get(memoryCache.getBadgeCountsKey(teacherId));
  },

  async setBadgeCounts(teacherId: string, counts: any) {
    await memoryCache.set(
      memoryCache.getBadgeCountsKey(teacherId), 
      counts,
      { ttl: 1 * 60 * 1000 } // 1 minute for badge counts
    );
  },

  // Invalidation helpers
  async invalidateTeacherData(teacherId: string) {
    await memoryCache.invalidatePattern(`teacher_${teacherId}`);
    await memoryCache.invalidatePattern(`dashboard_${teacherId}`);
    await memoryCache.invalidatePattern(`classes_${teacherId}`);
    await memoryCache.invalidatePattern(`groups_${teacherId}`);
    await memoryCache.invalidatePattern(`performance_${teacherId}`);
    await memoryCache.invalidatePattern(`badge_counts_${teacherId}`);
  },

  async invalidateAttendanceData(teacherId: string) {
    const today = new Date().toISOString().split('T')[0];
    await memoryCache.invalidate(memoryCache.getClassesKey(teacherId, today));
    await memoryCache.invalidate(memoryCache.getGroupsKey(teacherId));
    await memoryCache.invalidate(memoryCache.getBadgeCountsKey(teacherId));
  },
};