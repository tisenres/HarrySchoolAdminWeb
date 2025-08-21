/**
 * React Hooks for Harry School Mobile API
 * 
 * Custom hooks that provide a React-friendly interface to the mobile API services
 * with proper lifecycle management, caching, and error handling.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getMobileSupabaseClient } from '../supabase/client';
import type { 
  SupabaseResponse,
  ConnectionStatus,
  AuthUser,
  RealtimeSubscriptionOptions,
  RealtimeEvent,
  QueryPerformanceMetric
} from '../types/supabase';

/**
 * Hook to access the main Supabase client
 */
export const useSupabase = () => {
  const client = getMobileSupabaseClient();
  
  return {
    client: client?.getClient(),
    mobileClient: client,
    errorHandler: client?.getErrorHandler(),
    securityManager: client?.getSecurityManager(),
    performanceManager: client?.getPerformanceManager(),
    cacheManager: client?.getCacheManager(),
    realtimeService: client?.getRealtimeService(),
    storageService: client?.getStorageService(),
    offlineQueue: client?.getOfflineQueue()
  };
};

/**
 * Hook for authentication state management
 */
export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { client, mobileClient, securityManager } = useSupabase();
  
  useEffect(() => {
    if (!client || !mobileClient) return;
    
    // Get initial user
    const getInitialUser = async () => {
      try {
        const currentUser = await mobileClient.getCurrentUser();
        setUser(currentUser);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    getInitialUser();
    
    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        setError(null);
        
        try {
          if (event === 'SIGNED_IN' && session) {
            await securityManager?.onSignIn(session);
            const currentUser = await mobileClient.getCurrentUser();
            setUser(currentUser);
          } else if (event === 'SIGNED_OUT') {
            await securityManager?.onSignOut();
            setUser(null);
          } else if (event === 'TOKEN_REFRESHED' && session) {
            await securityManager?.onTokenRefresh(session);
            const currentUser = await mobileClient.getCurrentUser();
            setUser(currentUser);
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [client, mobileClient, securityManager]);
  
  const signIn = useCallback(async (email: string, password: string) => {
    if (!client) throw new Error('Supabase client not available');
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await client.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);
  
  const signOut = useCallback(async () => {
    if (!client) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);
  
  const refreshSession = useCallback(async () => {
    if (!client) return;
    
    try {
      const { error } = await client.auth.refreshSession();
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [client]);
  
  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    refreshSession,
    isAuthenticated: !!user
  };
};

/**
 * Hook for connection status monitoring
 */
export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const { mobileClient } = useSupabase();
  
  useEffect(() => {
    if (!mobileClient) return;
    
    // Get initial status
    setStatus(mobileClient.getConnectionStatus());
    
    // Listen for status changes
    const unsubscribe = mobileClient.onConnectionStatusChange((newStatus) => {
      setStatus(newStatus);
    });
    
    return unsubscribe;
  }, [mobileClient]);
  
  return {
    status,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting' || status === 'reconnecting',
    isDisconnected: status === 'disconnected',
    isFailed: status === 'failed'
  };
};

/**
 * Hook for real-time subscriptions
 */
export const useRealtime = <T = any>(
  options: RealtimeSubscriptionOptions,
  callback: (event: RealtimeEvent<T>) => void,
  dependencies: any[] = []
) => {
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { realtimeService } = useSupabase();
  const callbackRef = useRef(callback);
  
  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (!realtimeService) return;
    
    const subscribe = async () => {
      try {
        setError(null);
        const result = await realtimeService.subscribe<T>(options, callbackRef.current);
        
        if (result.error) {
          setError(result.error.message);
          return;
        }
        
        setSubscriptionId(result.data);
      } catch (err: any) {
        setError(err.message);
      }
    };
    
    subscribe();
    
    return () => {
      if (subscriptionId && realtimeService) {
        realtimeService.unsubscribe(subscriptionId);
      }
    };
  }, [realtimeService, ...dependencies]);
  
  const unsubscribe = useCallback(() => {
    if (subscriptionId && realtimeService) {
      realtimeService.unsubscribe(subscriptionId);
      setSubscriptionId(null);
    }
  }, [subscriptionId, realtimeService]);
  
  return {
    subscriptionId,
    error,
    unsubscribe,
    isSubscribed: !!subscriptionId
  };
};

/**
 * Hook for offline queue monitoring
 */
export const useOfflineQueue = () => {
  const [queueSize, setQueueSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingErrors, setProcessingErrors] = useState<string[]>([]);
  const { offlineQueue } = useSupabase();
  
  useEffect(() => {
    if (!offlineQueue) return;
    
    const updateQueueStatus = async () => {
      try {
        const status = await offlineQueue.getStatus();
        setQueueSize(status.totalOperations);
        setIsProcessing(status.isProcessing);
      } catch (error) {
        // Handle error silently
      }
    };
    
    // Update status periodically
    updateQueueStatus();
    const interval = setInterval(updateQueueStatus, 5000); // Every 5 seconds
    
    return () => clearInterval(interval);
  }, [offlineQueue]);
  
  const processQueue = useCallback(async () => {
    if (!offlineQueue) return;
    
    try {
      setProcessingErrors([]);
      setIsProcessing(true);
      await offlineQueue.processQueue();
    } catch (error: any) {
      setProcessingErrors(prev => [...prev, error.message]);
    } finally {
      setIsProcessing(false);
    }
  }, [offlineQueue]);
  
  const clearQueue = useCallback(async () => {
    if (!offlineQueue) return;
    
    try {
      await offlineQueue.clear();
      setQueueSize(0);
    } catch (error) {
      // Handle error
    }
  }, [offlineQueue]);
  
  return {
    queueSize,
    isProcessing,
    processingErrors,
    processQueue,
    clearQueue,
    hasQueuedOperations: queueSize > 0
  };
};

/**
 * Hook for performance monitoring
 */
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<QueryPerformanceMetric[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { performanceManager } = useSupabase();
  
  useEffect(() => {
    if (!performanceManager) return;
    
    setIsMonitoring(true);
    
    // Listen for performance events
    const unsubscribe = performanceManager.addEventListener((metric) => {
      setMetrics(prev => [...prev.slice(-49), metric]); // Keep last 50 metrics
    });
    
    return () => {
      unsubscribe();
      setIsMonitoring(false);
    };
  }, [performanceManager]);
  
  const getStats = useCallback(async () => {
    if (!performanceManager) return null;
    
    try {
      return await performanceManager.getPerformanceMetrics();
    } catch (error) {
      return null;
    }
  }, [performanceManager]);
  
  const clearCache = useCallback(async () => {
    if (!performanceManager) return;
    
    try {
      await performanceManager.invalidateCache();
    } catch (error) {
      // Handle error
    }
  }, [performanceManager]);
  
  return {
    metrics,
    isMonitoring,
    getStats,
    clearCache,
    averageQueryTime: metrics.length > 0 
      ? metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length 
      : 0,
    recentSlowQueries: metrics.filter(m => m.duration > 1000).slice(-10)
  };
};

/**
 * Hook for database queries with caching and error handling
 */
export const useQuery = <T>(
  queryKey: string,
  queryFn: () => Promise<SupabaseResponse<T>>,
  options: {
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
    cacheTime?: number;
    staleTime?: number;
  } = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { cacheManager } = useSupabase();
  const lastFetchTime = useRef<number>(0);
  
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 1 * 60 * 1000   // 1 minute
  } = options;
  
  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first
      if (!force && cacheManager) {
        const cached = cacheManager.get<T>(queryKey);
        const now = Date.now();
        
        if (cached && (now - lastFetchTime.current) < staleTime) {
          setData(cached);
          setLoading(false);
          return;
        }
      }
      
      const result = await queryFn();
      
      if (result.error) {
        setError(result.error.message);
        return;
      }
      
      setData(result.data);
      lastFetchTime.current = Date.now();
      
      // Cache the result
      if (cacheManager && result.data) {
        cacheManager.set(queryKey, result.data, cacheTime);
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [queryKey, queryFn, enabled, cacheManager, cacheTime, staleTime]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Refetch on window focus if enabled
  useEffect(() => {
    if (!refetchOnWindowFocus) return;
    
    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFetchTime.current > staleTime) {
        fetchData();
      }
    };
    
    // In React Native, you might use AppState instead
    // AppState.addEventListener('change', (nextAppState) => {
    //   if (nextAppState === 'active') {
    //     handleFocus();
    //   }
    // });
    
    return () => {
      // Clean up listeners
    };
  }, [refetchOnWindowFocus, staleTime, fetchData]);
  
  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);
  
  const invalidate = useCallback(() => {
    if (cacheManager) {
      cacheManager.delete(queryKey);
    }
  }, [cacheManager, queryKey]);
  
  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
    isStale: Date.now() - lastFetchTime.current > staleTime
  };
};

/**
 * Hook for educational context management
 */
export const useEducationalContext = () => {
  const { errorHandler } = useSupabase();
  
  const setContext = useCallback((context: {
    userId?: string;
    userType?: 'student' | 'teacher' | 'admin';
    organizationId?: string;
    currentScreen?: string;
    workflow?: string;
  }) => {
    errorHandler?.setEducationalContext(context);
  }, [errorHandler]);
  
  const clearContext = useCallback(() => {
    errorHandler?.clearEducationalContext();
  }, [errorHandler]);
  
  return {
    setContext,
    clearContext
  };
};