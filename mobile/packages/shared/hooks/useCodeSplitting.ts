import { useState, useEffect, useCallback, useRef } from 'react';
import { InteractionManager, AppState, AppStateStatus } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { BundleSplittingManager, detectDeviceClass, detectNetworkType } from '../utils/BundleOptimizer';

// Code splitting storage
const codeSplittingStorage = new MMKV({
  id: 'code-splitting-cache',
  encryptionKey: 'harry-school-splitting',
});

export interface CodeSplittingOptions {
  userType: 'student' | 'teacher' | 'admin';
  priority: 'critical' | 'high' | 'normal' | 'low';
  preloadOnIdle?: boolean;
  respectPrayerTime?: boolean;
  enablePreloading?: boolean;
  maxConcurrentLoads?: number;
  cacheStrategy?: 'memory' | 'disk' | 'both';
}

interface ChunkLoadState {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  loadTime: number;
  retryCount: number;
}

const defaultOptions: Required<CodeSplittingOptions> = {
  userType: 'student',
  priority: 'normal',
  preloadOnIdle: true,
  respectPrayerTime: true,
  enablePreloading: true,
  maxConcurrentLoads: 3,
  cacheStrategy: 'both',
};

// Hook for managing code splitting state
export const useCodeSplitting = (options: CodeSplittingOptions) => {
  const finalOptions = { ...defaultOptions, ...options };
  const [loadStates, setLoadStates] = useState<Map<string, ChunkLoadState>>(new Map());
  const [activeLoads, setActiveLoads] = useState(0);
  const loadQueueRef = useRef<Array<{
    chunkName: string;
    loadFunction: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    priority: number;
  }>>([]);
  const isProcessingRef = useRef(false);

  const bundleManager = BundleSplittingManager.getInstance({
    userType: finalOptions.userType,
    deviceClass: detectDeviceClass(),
    networkType: detectNetworkType(),
  });

  // Prayer time check
  const checkPrayerTime = useCallback(() => {
    if (!finalOptions.respectPrayerTime) return false;
    const hour = new Date().getHours();
    return [5, 12, 15, 18, 20].includes(hour);
  }, [finalOptions.respectPrayerTime]);

  // Priority mapping
  const getPriorityValue = (priority: string): number => {
    const priorities = { critical: 4, high: 3, normal: 2, low: 1 };
    return priorities[priority as keyof typeof priorities] || 2;
  };

  // Process load queue
  const processLoadQueue = useCallback(async () => {
    if (isProcessingRef.current || loadQueueRef.current.length === 0) return;
    if (activeLoads >= finalOptions.maxConcurrentLoads) return;

    isProcessingRef.current = true;

    try {
      // Sort queue by priority
      loadQueueRef.current.sort((a, b) => b.priority - a.priority);

      // Process chunks based on available slots
      const availableSlots = finalOptions.maxConcurrentLoads - activeLoads;
      const chunksToLoad = loadQueueRef.current.splice(0, availableSlots);

      await Promise.allSettled(
        chunksToLoad.map(async ({ chunkName, loadFunction, resolve, reject, priority }) => {
          setActiveLoads(prev => prev + 1);

          try {
            // Prayer time delay
            const prayerDelay = checkPrayerTime() ? 150 : 0;
            
            // Network-based delay
            const networkType = detectNetworkType();
            const networkDelay = {
              '2g': 500,
              '3g': 200,
              '4g': 50,
              'wifi': 0,
            }[networkType];

            // Total delay
            const totalDelay = prayerDelay + networkDelay;
            if (totalDelay > 0) {
              await new Promise(resolve => setTimeout(resolve, totalDelay));
            }

            const startTime = Date.now();
            const result = await loadFunction();
            const loadTime = Date.now() - startTime;

            // Update load state
            setLoadStates(prev => new Map(prev).set(chunkName, {
              isLoading: false,
              isLoaded: true,
              error: null,
              loadTime,
              retryCount: 0,
            }));

            // Cache successful load
            if (finalOptions.cacheStrategy === 'disk' || finalOptions.cacheStrategy === 'both') {
              codeSplittingStorage.set(`chunk-loaded-${chunkName}`, {
                timestamp: Date.now(),
                loadTime,
                userType: finalOptions.userType,
              });
            }

            resolve(result);
          } catch (error) {
            const currentState = loadStates.get(chunkName);
            const retryCount = (currentState?.retryCount || 0) + 1;

            setLoadStates(prev => new Map(prev).set(chunkName, {
              isLoading: false,
              isLoaded: false,
              error: error as Error,
              loadTime: 0,
              retryCount,
            }));

            // Retry logic with exponential backoff
            if (retryCount < 3) {
              const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
              setTimeout(() => {
                loadQueueRef.current.push({
                  chunkName,
                  loadFunction,
                  resolve,
                  reject,
                  priority,
                });
                processLoadQueue();
              }, retryDelay);
            } else {
              reject(error as Error);
            }
          } finally {
            setActiveLoads(prev => prev - 1);
          }
        })
      );
    } finally {
      isProcessingRef.current = false;
      
      // Continue processing if more items in queue
      if (loadQueueRef.current.length > 0) {
        setTimeout(processLoadQueue, 50);
      }
    }
  }, [activeLoads, finalOptions.maxConcurrentLoads, loadStates, checkPrayerTime, finalOptions.cacheStrategy, finalOptions.userType]);

  // Load chunk with priority queue
  const loadChunk = useCallback(<T>(
    chunkName: string,
    loadFunction: () => Promise<T>,
    priority: 'critical' | 'high' | 'normal' | 'low' = 'normal'
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      const currentState = loadStates.get(chunkName);
      if (currentState?.isLoaded) {
        resolve(loadFunction as any); // This would be the cached result in reality
        return;
      }

      // Check cache first
      if (finalOptions.cacheStrategy === 'disk' || finalOptions.cacheStrategy === 'both') {
        const cached = codeSplittingStorage.getString(`chunk-loaded-${chunkName}`);
        if (cached) {
          try {
            const cacheData = JSON.parse(cached);
            const cacheAge = Date.now() - cacheData.timestamp;
            
            // Use cache if less than 1 hour old
            if (cacheAge < 3600000) {
              setLoadStates(prev => new Map(prev).set(chunkName, {
                isLoading: false,
                isLoaded: true,
                error: null,
                loadTime: cacheData.loadTime,
                retryCount: 0,
              }));
              resolve(loadFunction as any);
              return;
            }
          } catch {
            // Invalid cache entry, continue with normal loading
          }
        }
      }

      // Add to load queue
      setLoadStates(prev => new Map(prev).set(chunkName, {
        isLoading: true,
        isLoaded: false,
        error: null,
        loadTime: 0,
        retryCount: 0,
      }));

      loadQueueRef.current.push({
        chunkName,
        loadFunction,
        resolve,
        reject,
        priority: getPriorityValue(priority),
      });

      processLoadQueue();
    });
  }, [loadStates, processLoadQueue, finalOptions.cacheStrategy]);

  // Preload chunks during idle time
  const preloadChunks = useCallback((
    chunkSpecs: Array<{
      name: string;
      loadFunction: () => Promise<any>;
      priority: 'critical' | 'high' | 'normal' | 'low';
    }>
  ) => {
    if (!finalOptions.enablePreloading) return;

    InteractionManager.runAfterInteractions(() => {
      chunkSpecs.forEach((spec, index) => {
        // Stagger preloading to avoid overwhelming the system
        setTimeout(() => {
          loadChunk(spec.name, spec.loadFunction, spec.priority).catch(error => {
            console.warn(`Failed to preload chunk ${spec.name}:`, error);
          });
        }, index * 100);
      });
    });
  }, [loadChunk, finalOptions.enablePreloading]);

  // Get loading state for a specific chunk
  const getChunkState = useCallback((chunkName: string): ChunkLoadState => {
    return loadStates.get(chunkName) || {
      isLoading: false,
      isLoaded: false,
      error: null,
      loadTime: 0,
      retryCount: 0,
    };
  }, [loadStates]);

  // Clear chunk cache
  const clearChunkCache = useCallback((chunkName?: string) => {
    if (chunkName) {
      codeSplittingStorage.delete(`chunk-loaded-${chunkName}`);
      setLoadStates(prev => {
        const newStates = new Map(prev);
        newStates.delete(chunkName);
        return newStates;
      });
    } else {
      // Clear all cache
      const keys = codeSplittingStorage.getAllKeys();
      keys.forEach(key => {
        if (key.startsWith('chunk-loaded-')) {
          codeSplittingStorage.delete(key);
        }
      });
      setLoadStates(new Map());
    }
  }, []);

  // Get statistics
  const getStatistics = useCallback(() => {
    const states = Array.from(loadStates.values());
    const loadedChunks = states.filter(state => state.isLoaded).length;
    const failedChunks = states.filter(state => state.error !== null).length;
    const averageLoadTime = states.reduce((sum, state) => sum + state.loadTime, 0) / states.length || 0;

    return {
      totalChunks: states.length,
      loadedChunks,
      failedChunks,
      loadingChunks: states.filter(state => state.isLoading).length,
      averageLoadTime: Math.round(averageLoadTime),
      queueSize: loadQueueRef.current.length,
      activeLoads,
      cacheHits: getCacheHits(),
    };
  }, [loadStates, activeLoads]);

  // Get cache hits
  const getCacheHits = useCallback(() => {
    const keys = codeSplittingStorage.getAllKeys();
    return keys.filter(key => key.startsWith('chunk-loaded-')).length;
  }, []);

  // App state change handler for background preloading
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && finalOptions.preloadOnIdle) {
        // Preload critical chunks when app goes to background
        const criticalChunks = getCriticalChunksForUserType(finalOptions.userType);
        preloadChunks(criticalChunks);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [finalOptions.preloadOnIdle, finalOptions.userType, preloadChunks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      loadQueueRef.current = [];
      isProcessingRef.current = false;
    };
  }, []);

  return {
    loadChunk,
    preloadChunks,
    getChunkState,
    clearChunkCache,
    getStatistics,
    isLoading: activeLoads > 0,
    queueSize: loadQueueRef.current.length,
  };
};

// Helper to get critical chunks for each user type
const getCriticalChunksForUserType = (userType: 'student' | 'teacher' | 'admin') => {
  const criticalChunks = {
    student: [
      { name: 'StudentDashboard', loadFunction: () => import('../../apps/student/src/screens/DashboardScreen'), priority: 'critical' as const },
      { name: 'LessonsList', loadFunction: () => import('../../apps/student/src/screens/lessons/LessonsListScreen'), priority: 'high' as const },
      { name: 'VocabularyScreen', loadFunction: () => import('../../apps/student/src/screens/vocabulary/VocabularyScreen'), priority: 'high' as const },
    ],
    teacher: [
      { name: 'TeacherDashboard', loadFunction: () => import('../../apps/teacher/src/screens/DashboardScreen'), priority: 'critical' as const },
      { name: 'AttendanceScreen', loadFunction: () => import('../../apps/teacher/src/screens/AttendanceScreen'), priority: 'high' as const },
      { name: 'StudentsList', loadFunction: () => import('../../apps/teacher/src/screens/StudentsScreen'), priority: 'high' as const },
    ],
    admin: [
      { name: 'AdminDashboard', loadFunction: () => import('../../../src/components/admin/dashboard/dashboard'), priority: 'critical' as const },
      { name: 'TeachersManagement', loadFunction: () => import('../../../src/components/admin/teachers/teachers-table'), priority: 'high' as const },
      { name: 'StudentsManagement', loadFunction: () => import('../../../src/components/admin/students/students-table'), priority: 'high' as const },
    ],
  };

  return criticalChunks[userType] || criticalChunks.student;
};

// Educational context-aware code splitting hook
export const useEducationalCodeSplitting = (userType: 'student' | 'teacher' | 'admin') => {
  const deviceClass = detectDeviceClass();
  const networkType = detectNetworkType();

  // Adjust options based on device capabilities
  const options: CodeSplittingOptions = {
    userType,
    priority: 'normal',
    preloadOnIdle: deviceClass !== 'low',
    respectPrayerTime: true,
    enablePreloading: networkType === 'wifi' || networkType === '4g',
    maxConcurrentLoads: deviceClass === 'high' ? 5 : deviceClass === 'mid' ? 3 : 2,
    cacheStrategy: deviceClass === 'low' ? 'memory' : 'both',
  };

  return useCodeSplitting(options);
};

export default {
  useCodeSplitting,
  useEducationalCodeSplitting,
};