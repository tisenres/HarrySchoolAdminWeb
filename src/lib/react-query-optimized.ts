/**
 * Optimized React Query configuration
 * Fixes over-invalidation and improves cache management
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'

// Performance monitoring for queries
const queryCache = new QueryCache({
  onError: (error, query) => {
    if (process.env.NODE_ENV === 'development') {
      try {
        // Enhanced error inspection and serialization
        let errorInfo = 'Unknown error'
        try {
          if (error instanceof Error) {
            errorInfo = `${error.name}: ${error.message}`
            if (error.stack) {
              errorInfo += `\nStack: ${error.stack.split('\n')[0]}`
            }
          } else if (error && typeof error === 'object') {
            // Handle error objects from fetch, axios, etc.
            const errorObj = error as any
            if (errorObj.message) {
              errorInfo = errorObj.message
            } else if (errorObj.status && errorObj.statusText) {
              errorInfo = `HTTP ${errorObj.status}: ${errorObj.statusText}`
            } else if (errorObj.response?.status) {
              errorInfo = `HTTP ${errorObj.response.status}: ${errorObj.response.statusText || 'Request failed'}`
            } else {
              errorInfo = JSON.stringify(error, null, 2)
            }
          } else {
            errorInfo = String(error)
          }
        } catch (serializeError) {
          errorInfo = `[Error serialization failed: ${serializeError}]`
        }

        const queryKey = query?.queryKey ? 
          (Array.isArray(query.queryKey) ? 
            query.queryKey.map(k => {
              try {
                return typeof k === 'object' ? JSON.stringify(k) : String(k)
              } catch {
                return '[Complex Object]'
              }
            }) : 
            String(query.queryKey)
          ) : 
          '[No Query Key]'
        
        console.error('[React Query] Query failed:', {
          queryKey,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          error: errorInfo
        })
      } catch (logError) {
        console.error('[React Query] Query failed with logging error:', logError)
      }
    }
  },
  onSuccess: (data, query) => {
    if (process.env.NODE_ENV === 'development') {
      try {
        const queryKey = query?.queryKey ? 
          (Array.isArray(query.queryKey) ? 
            query.queryKey.map(k => {
              try {
                return typeof k === 'object' ? JSON.stringify(k) : String(k)
              } catch {
                return '[Complex Object]'
              }
            }) : 
            String(query.queryKey)
          ) : 
          '[No Query Key]'
        
        console.log('[React Query] Query success:', queryKey)
      } catch (logError) {
        console.error('[React Query] Query success logging error:', logError)
      }
    }
  }
})

// Performance monitoring for mutations
const mutationCache = new MutationCache({
  onError: (error, variables, context, mutation) => {
    if (process.env.NODE_ENV === 'development') {
      try {
        const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error')
        const mutationKey = mutation?.options?.mutationKey || '[No Mutation Key]'
        
        console.error('[React Query] Mutation failed:', {
          mutationKey,
          error: errorMessage
        })
      } catch (logError) {
        console.error('[React Query] Mutation failed with logging error:', logError)
      }
    }
  },
  onSuccess: (data, variables, context, mutation) => {
    if (process.env.NODE_ENV === 'development') {
      try {
        const mutationKey = mutation?.options?.mutationKey || '[No Mutation Key]'
        console.log('[React Query] Mutation success:', mutationKey)
      } catch (logError) {
        console.error('[React Query] Mutation success logging error:', logError)
      }
    }
  }
})

// Create optimized query client
export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      // OPTIMIZED: Longer stale time to reduce unnecessary fetches
      staleTime: 10 * 60 * 1000, // 10 minutes (was 5)
      
      // OPTIMIZED: Much longer cache time
      gcTime: 30 * 60 * 1000, // 30 minutes (was 20)
      
      // Smart retry logic
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        // Retry server errors up to 2 times
        return failureCount < 2
      },
      
      // OPTIMIZED: Prevent aggressive refetching
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      refetchOnMount: true, // Changed from 'never' to true for data consistency
      
      // No automatic background refetching
      refetchInterval: false,
      
      // Structural sharing for better performance
      structuralSharing: true,
      
      // Network mode for better offline support
      networkMode: 'online'
    },
    mutations: {
      // Retry mutations once on network errors
      retry: (failureCount, error: any) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        return failureCount < 1
      },
      
      // Network mode for mutations
      networkMode: 'online'
    },
  },
})

/**
 * Optimized query key factories
 * Consistent structure for better cache management
 */
export const queryKeys = {
  // Authentication
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
  },
  
  // Teachers
  teachers: {
    all: ['teachers'] as const,
    lists: () => [...queryKeys.teachers.all, 'list'] as const,
    list: (filters?: any, sort?: any, page?: number) => 
      [...queryKeys.teachers.lists(), { filters, sort, page }] as const,
    detail: (id: string) => [...queryKeys.teachers.all, 'detail', id] as const,
    stats: () => [...queryKeys.teachers.all, 'stats'] as const,
  },
  
  // Students
  students: {
    all: ['students'] as const,
    lists: () => [...queryKeys.students.all, 'list'] as const,
    list: (filters?: any, sort?: any, page?: number) =>
      [...queryKeys.students.lists(), { filters, sort, page }] as const,
    detail: (id: string) => [...queryKeys.students.all, 'detail', id] as const,
    stats: () => [...queryKeys.students.all, 'stats'] as const,
  },
  
  // Groups
  groups: {
    all: ['groups'] as const,
    lists: () => [...queryKeys.groups.all, 'list'] as const,
    list: (filters?: any, sort?: any, page?: number) =>
      [...queryKeys.groups.lists(), { filters, sort, page }] as const,
    detail: (id: string) => [...queryKeys.groups.all, 'detail', id] as const,
    stats: () => [...queryKeys.groups.all, 'stats'] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters?: any, page?: number) => 
      [...queryKeys.notifications.lists(), { filters, page }] as const,
    detail: (id: string) => [...queryKeys.notifications.all, 'detail', id] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
    stats: () => [...queryKeys.notifications.all, 'stats'] as const,
  },
  
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    activity: (limit?: number) => [...queryKeys.dashboard.all, 'activity', limit] as const,
    analytics: (orgId: string) => [...queryKeys.dashboard.all, 'analytics', orgId] as const,
  },
  
  // Settings
  settings: {
    all: ['settings'] as const,
    system: () => [...queryKeys.settings.all, 'system'] as const,
    organization: () => [...queryKeys.settings.all, 'organization'] as const,
    users: () => [...queryKeys.settings.all, 'users'] as const,
  },
} as const

/**
 * Cache time configurations
 */
export const cacheConfig = {
  // Very stable data (settings, configurations)
  staticData: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  },
  
  // User/profile data
  userData: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  },
  
  // List data (teachers, students, groups)
  listData: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  
  // Dashboard/stats data
  dashboardData: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  },
  
  // Real-time or frequently changing data
  realTimeData: {
    staleTime: 0, // Always stale
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
} as const

/**
 * Optimized cache utilities
 */
export const cacheUtils = {
  /**
   * Surgical invalidation - only invalidate specific queries
   */
  invalidateSpecific: (queryKey: readonly unknown[]) => {
    return queryClient.invalidateQueries({ 
      queryKey,
      exact: true // Only invalidate exact matches
    })
  },
  
  /**
   * Invalidate all queries for an entity type
   */
  invalidateEntity: (entity: keyof typeof queryKeys) => {
    return queryClient.invalidateQueries({ 
      queryKey: queryKeys[entity].all 
    })
  },
  
  /**
   * Update specific query data without refetching
   */
  updateQueryData: <T>(queryKey: readonly unknown[], updater: (old: T | undefined) => T) => {
    return queryClient.setQueryData(queryKey, updater)
  },
  
  /**
   * Batch update multiple queries
   */
  batchUpdate: (updates: Array<{ key: readonly unknown[], updater: (old: any) => any }>) => {
    queryClient.setMutationDefaults(['batchUpdate'], {
      mutationFn: async () => {
        updates.forEach(({ key, updater }) => {
          queryClient.setQueryData(key, updater)
        })
      }
    })
  },
  
  /**
   * Prefetch with proper error handling
   */
  safePrefetch: async (queryKey: readonly unknown[], queryFn: () => Promise<any>, config = {}) => {
    try {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        ...cacheConfig.listData,
        ...config,
      })
    } catch (error) {
      console.error('Prefetch failed:', { queryKey, error })
    }
  },
  
  /**
   * Cancel queries to prevent race conditions
   */
  cancelQueries: (queryKey: readonly unknown[]) => {
    return queryClient.cancelQueries({ queryKey })
  },
  
  /**
   * Get cached data without subscribing
   */
  getCachedData: <T>(queryKey: readonly unknown[]): T | undefined => {
    return queryClient.getQueryData(queryKey)
  },
  
  /**
   * Check if query is fetching
   */
  isFetching: (queryKey: readonly unknown[]): boolean => {
    return queryClient.isFetching({ queryKey }) > 0
  },
  
  /**
   * Optimistic update helper
   */
  optimisticUpdate: <T>(
    queryKey: readonly unknown[],
    updater: (old: T | undefined) => T,
    rollback?: (context: T | undefined) => void
  ) => {
    const previousData = queryClient.getQueryData<T>(queryKey)
    queryClient.setQueryData(queryKey, updater)
    
    return {
      rollback: () => {
        if (rollback) {
          rollback(previousData)
        } else {
          queryClient.setQueryData(queryKey, previousData)
        }
      }
    }
  },
}

/**
 * Performance monitoring in development
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Monitor cache size
  setInterval(() => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    const mutations = queryClient.getMutationCache().getAll()
    
    if (queries.length > 100) {
      console.warn(`⚠️ Query cache is large: ${queries.length} queries cached`)
    }
    
    if (mutations.length > 20) {
      console.warn(`⚠️ Mutation cache is large: ${mutations.length} mutations cached`)
    }
  }, 30000) // Check every 30 seconds
}

export default queryClient