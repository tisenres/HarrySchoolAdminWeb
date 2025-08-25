import { 
  useMemo, 
  useCallback, 
  useRef, 
  useEffect,
  DependencyList,
  MutableRefObject,
} from 'react';
import { MMKV } from 'react-native-mmkv';
import { InteractionManager } from 'react-native';

// Memoization storage for persistent caching
const memoStorage = new MMKV({
  id: 'memoization-cache',
  encryptionKey: 'harry-school-memo',
});

// Enhanced useMemo with cache invalidation and cultural context
export function useEnhancedMemo<T>(
  factory: () => T,
  deps: DependencyList,
  options?: {
    cacheKey?: string;
    ttl?: number; // Time to live in milliseconds
    respectPrayerTime?: boolean;
    culturalContext?: 'normal' | 'prayer_time' | 'ramadan';
    enablePersistence?: boolean;
  }
): T {
  const {
    cacheKey,
    ttl = 0,
    respectPrayerTime = false,
    culturalContext = 'normal',
    enablePersistence = false,
  } = options || {};

  // Check prayer time for cultural context
  const checkPrayerTime = useCallback(() => {
    if (!respectPrayerTime) return false;
    const hour = new Date().getHours();
    return [5, 12, 15, 18, 20].includes(hour);
  }, [respectPrayerTime]);

  // Enhanced memo with cultural awareness and persistence
  return useMemo(() => {
    // Check if prayer time should affect computation
    if (respectPrayerTime && checkPrayerTime() && culturalContext === 'prayer_time') {
      // Return cached result during prayer time to avoid heavy computations
      if (enablePersistence && cacheKey) {
        const cachedValue = memoStorage.getString(cacheKey);
        if (cachedValue) {
          try {
            return JSON.parse(cachedValue);
          } catch {
            // If parsing fails, proceed with normal computation
          }
        }
      }
    }

    // Check TTL if cache key is provided
    if (enablePersistence && cacheKey && ttl > 0) {
      const cacheTimestamp = memoStorage.getNumber(`${cacheKey}-timestamp`);
      if (cacheTimestamp && Date.now() - cacheTimestamp < ttl) {
        const cachedValue = memoStorage.getString(cacheKey);
        if (cachedValue) {
          try {
            return JSON.parse(cachedValue);
          } catch {
            // If parsing fails, proceed with normal computation
          }
        }
      }
    }

    // Compute new value
    const result = factory();

    // Cache the result if persistence is enabled
    if (enablePersistence && cacheKey) {
      try {
        memoStorage.set(cacheKey, JSON.stringify(result));
        if (ttl > 0) {
          memoStorage.set(`${cacheKey}-timestamp`, Date.now());
        }
      } catch (error) {
        console.warn('Failed to cache memoized value:', error);
      }
    }

    return result;
  }, deps);
}

// Enhanced useCallback with performance optimization
export function useEnhancedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList,
  options?: {
    debounceMs?: number;
    throttleMs?: number;
    respectPrayerTime?: boolean;
    enableAsyncOptimization?: boolean;
  }
): T {
  const {
    debounceMs = 0,
    throttleMs = 0,
    respectPrayerTime = false,
    enableAsyncOptimization = false,
  } = options || {};

  const debounceRef = useRef<NodeJS.Timeout>();
  const throttleRef = useRef<number>(0);
  const lastCallRef = useRef<number>(0);

  const checkPrayerTime = useCallback(() => {
    if (!respectPrayerTime) return false;
    const hour = new Date().getHours();
    return [5, 12, 15, 18, 20].includes(hour);
  }, [respectPrayerTime]);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      // Throttling logic
      if (throttleMs > 0 && now - lastCallRef.current < throttleMs) {
        return;
      }
      
      // Prayer time optimization - reduce frequency during prayer
      if (respectPrayerTime && checkPrayerTime()) {
        const prayerThrottleMs = Math.max(throttleMs * 2, 500);
        if (now - lastCallRef.current < prayerThrottleMs) {
          return;
        }
      }

      lastCallRef.current = now;

      // Debouncing logic
      if (debounceMs > 0) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        
        debounceRef.current = setTimeout(() => {
          if (enableAsyncOptimization) {
            InteractionManager.runAfterInteractions(() => {
              callback(...args);
            });
          } else {
            callback(...args);
          }
        }, debounceMs);
        return;
      }

      // Direct execution with async optimization
      if (enableAsyncOptimization) {
        InteractionManager.runAfterInteractions(() => {
          callback(...args);
        });
      } else {
        callback(...args);
      }
    }) as T,
    deps
  );
}

// Custom hook for memoizing expensive operations
export function useExpensiveMemo<T>(
  factory: () => T,
  deps: DependencyList,
  options?: {
    skipOnLowMemory?: boolean;
    skipDuringAnimations?: boolean;
    culturalContext?: 'normal' | 'prayer_time' | 'ramadan';
    fallbackValue?: T;
  }
): T {
  const {
    skipOnLowMemory = true,
    skipDuringAnimations = true,
    culturalContext = 'normal',
    fallbackValue,
  } = options || {};

  const [isAnimating, setIsAnimating] = useState(false);
  const [isLowMemory, setIsLowMemory] = useState(false);
  const lastResultRef = useRef<T | undefined>();

  // Monitor animation state (simplified)
  useEffect(() => {
    if (skipDuringAnimations) {
      // This would be connected to animation state in a real implementation
      // For now, we'll use a simple heuristic
      const animationTimer = setTimeout(() => setIsAnimating(false), 100);
      return () => clearTimeout(animationTimer);
    }
  }, [skipDuringAnimations]);

  return useMemo(() => {
    // Skip expensive computation during animations
    if (skipDuringAnimations && isAnimating) {
      return lastResultRef.current || fallbackValue as T;
    }

    // Skip expensive computation on low memory
    if (skipOnLowMemory && isLowMemory) {
      return lastResultRef.current || fallbackValue as T;
    }

    // Skip during prayer time for cultural respect
    if (culturalContext === 'prayer_time') {
      const hour = new Date().getHours();
      if ([5, 12, 15, 18, 20].includes(hour)) {
        return lastResultRef.current || fallbackValue as T;
      }
    }

    const result = factory();
    lastResultRef.current = result;
    return result;
  }, deps);
}

// Hook for memoizing component props with deep comparison
export function useDeepMemo<T>(
  value: T,
  options?: {
    maxDepth?: number;
    respectPrayerTime?: boolean;
  }
): T {
  const { maxDepth = 3, respectPrayerTime = false } = options || {};
  const prevValueRef = useRef<T>();

  return useMemo(() => {
    // Prayer time optimization - return previous value to avoid deep comparison
    if (respectPrayerTime) {
      const hour = new Date().getHours();
      if ([5, 12, 15, 18, 20].includes(hour) && prevValueRef.current !== undefined) {
        return prevValueRef.current;
      }
    }

    // Deep comparison logic (simplified)
    if (deepEqual(value, prevValueRef.current, 0, maxDepth)) {
      return prevValueRef.current as T;
    }

    prevValueRef.current = value;
    return value;
  }, [value, maxDepth, respectPrayerTime]);
}

// Utility function for deep equality check
function deepEqual(a: any, b: any, depth: number, maxDepth: number): boolean {
  if (depth >= maxDepth) return a === b;
  
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key], depth + 1, maxDepth)) return false;
    }
    
    return true;
  }
  
  return false;
}

// Hook for stable references with cultural context
export function useStableRef<T>(
  value: T,
  options?: {
    respectPrayerTime?: boolean;
    updateFrequency?: 'high' | 'medium' | 'low';
  }
): MutableRefObject<T> {
  const { respectPrayerTime = false, updateFrequency = 'medium' } = options || {};
  const ref = useRef<T>(value);
  const lastUpdateRef = useRef<number>(0);

  // Determine update frequency based on cultural context and settings
  const getUpdateInterval = () => {
    const baseInterval = {
      high: 0,     // Update every render
      medium: 100, // Update at most every 100ms
      low: 500,    // Update at most every 500ms
    }[updateFrequency];

    // Reduce update frequency during prayer time
    if (respectPrayerTime) {
      const hour = new Date().getHours();
      if ([5, 12, 15, 18, 20].includes(hour)) {
        return baseInterval * 3; // 3x slower during prayer
      }
    }

    return baseInterval;
  };

  useEffect(() => {
    const now = Date.now();
    const interval = getUpdateInterval();
    
    if (now - lastUpdateRef.current >= interval) {
      ref.current = value;
      lastUpdateRef.current = now;
    }
  });

  return ref;
}

// Educational context-aware memoization for student/teacher data
export function useEducationalMemo<T>(
  factory: () => T,
  deps: DependencyList,
  context: 'student' | 'teacher' | 'admin' = 'student'
): T {
  const culturalOptions = {
    respectPrayerTime: true,
    culturalContext: 'normal' as const,
    enablePersistence: context === 'teacher', // Teachers get persistent caching
    ttl: context === 'admin' ? 60000 : 300000, // Admin data expires faster
  };

  return useEnhancedMemo(factory, deps, {
    cacheKey: `educational-${context}-${deps.join('-')}`,
    ...culturalOptions,
  });
}

// Performance tracking for memoization effectiveness
export function useMemoizationStats() {
  const statsRef = useRef({
    hits: 0,
    misses: 0,
    computationTime: 0,
    cacheSize: 0,
  });

  const trackHit = useCallback(() => {
    statsRef.current.hits++;
  }, []);

  const trackMiss = useCallback((computationTime: number) => {
    statsRef.current.misses++;
    statsRef.current.computationTime += computationTime;
  }, []);

  const getStats = useCallback(() => {
    const stats = statsRef.current;
    const total = stats.hits + stats.misses;
    return {
      ...stats,
      hitRate: total > 0 ? stats.hits / total : 0,
      averageComputationTime: stats.misses > 0 ? stats.computationTime / stats.misses : 0,
    };
  }, []);

  const resetStats = useCallback(() => {
    statsRef.current = {
      hits: 0,
      misses: 0,
      computationTime: 0,
      cacheSize: 0,
    };
  }, []);

  return {
    trackHit,
    trackMiss,
    getStats,
    resetStats,
  };
}

// Cache cleanup utilities
export function useCacheCleanup() {
  const cleanupCache = useCallback((pattern?: string) => {
    try {
      if (pattern) {
        // Clean specific pattern
        const keys = memoStorage.getAllKeys();
        keys.forEach(key => {
          if (key.includes(pattern)) {
            memoStorage.delete(key);
          }
        });
      } else {
        // Clean all cache
        memoStorage.clearAll();
      }
    } catch (error) {
      console.warn('Failed to cleanup cache:', error);
    }
  }, []);

  const cleanupExpiredCache = useCallback(() => {
    try {
      const keys = memoStorage.getAllKeys();
      const now = Date.now();
      
      keys.forEach(key => {
        if (key.endsWith('-timestamp')) {
          const timestamp = memoStorage.getNumber(key);
          const cacheKey = key.replace('-timestamp', '');
          
          // Check if expired (TTL assumed to be 5 minutes if not specified)
          if (timestamp && now - timestamp > 300000) {
            memoStorage.delete(key);
            memoStorage.delete(cacheKey);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup expired cache:', error);
    }
  }, []);

  // Auto cleanup on app background/foreground
  useEffect(() => {
    const cleanup = () => cleanupExpiredCache();
    
    // Cleanup when component unmounts
    return cleanup;
  }, [cleanupExpiredCache]);

  return {
    cleanupCache,
    cleanupExpiredCache,
  };
}

export default {
  useEnhancedMemo,
  useEnhancedCallback,
  useExpensiveMemo,
  useDeepMemo,
  useStableRef,
  useEducationalMemo,
  useMemoizationStats,
  useCacheCleanup,
};