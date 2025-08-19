/**
 * React Query configuration for Harry School CRM
 * Optimized for admin panel performance with smart caching strategies
 */

import { QueryClient } from '@tanstack/react-query'

// Create a custom query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Keep data in cache for 10 minutes after component unmounts
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      
      // Retry failed requests 2 times with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        return failureCount < 2
      },
      
      // Enable background refetching for better UX
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      
      // Don't refetch on mount if data is still fresh
      refetchOnMount: false,
      
      // Use stale-while-revalidate pattern
      refetchInterval: false,
    },
    mutations: {
      // Retry mutations once on network errors
      retry: (failureCount, error: any) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        return failureCount < 1
      },
    },
  },
})

/**
 * Query key factories for consistent cache management
 * This ensures we can easily invalidate related queries
 */
export const queryKeys = {
  // Authentication and user data
  auth: ['auth'] as const,
  currentUser: () => [...queryKeys.auth, 'current-user'] as const,
  organization: (orgId: string) => [...queryKeys.auth, 'organization', orgId] as const,
  
  // Teachers
  teachers: ['teachers'] as const,
  teachersList: (filters?: any, sort?: any, page?: number) => 
    [...queryKeys.teachers, 'list', { filters, sort, page }] as const,
  teachersStats: () => [...queryKeys.teachers, 'stats'] as const,
  teacherDetail: (id: string) => [...queryKeys.teachers, 'detail', id] as const,
  
  // Students  
  students: ['students'] as const,
  studentsList: (filters?: any, sort?: any, page?: number) =>
    [...queryKeys.students, 'list', { filters, sort, page }] as const,
  studentsStats: () => [...queryKeys.students, 'stats'] as const,
  studentDetail: (id: string) => [...queryKeys.students, 'detail', id] as const,
  
  // Groups
  groups: ['groups'] as const,
  groupsList: (filters?: any, sort?: any, page?: number) =>
    [...queryKeys.groups, 'list', { filters, sort, page }] as const,
  groupsStats: () => [...queryKeys.groups, 'stats'] as const,
  groupDetail: (id: string) => [...queryKeys.groups, 'detail', id] as const,
  
  // Dashboard
  dashboard: ['dashboard'] as const,
  dashboardStats: () => [...queryKeys.dashboard, 'stats'] as const,
  recentActivity: (limit?: number) => [...queryKeys.dashboard, 'activity', limit] as const,
  integratedAnalytics: (orgId: string) => [...queryKeys.dashboard, 'analytics', orgId] as const,
  
  // Settings and configuration
  settings: ['settings'] as const,
  systemSettings: () => [...queryKeys.settings, 'system'] as const,
} as const

/**
 * Cache time configurations for different data types
 */
export const cacheConfig = {
  // Very stable data - cache for longer
  staticData: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
  },
  
  // User/org data - moderate caching
  userData: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000,    // 20 minutes
  },
  
  // List data - balanced caching
  listData: {
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
  },
  
  // Dashboard/stats - frequent updates
  dashboardData: {
    staleTime: 30 * 1000,      // 30 seconds
    gcTime: 2 * 60 * 1000,     // 2 minutes
  },
  
  // Real-time data - minimal caching
  realTimeData: {
    staleTime: 0,              // Always stale
    gcTime: 1 * 60 * 1000,     // 1 minute
  },
} as const

/**
 * Utility functions for cache management
 */
export const cacheUtils = {
  /**
   * Invalidate all queries for a specific entity type
   */
  invalidateEntity: (entityType: keyof typeof queryKeys) => {
    queryClient.invalidateQueries({ queryKey: queryKeys[entityType] })
  },
  
  /**
   * Remove all cached data for a specific entity
   */
  removeEntity: (entityType: keyof typeof queryKeys) => {
    queryClient.removeQueries({ queryKey: queryKeys[entityType] })
  },
  
  /**
   * Prefetch data for better performance
   */
  prefetch: async (queryKey: any[], queryFn: () => Promise<any>, options = {}) => {
    return queryClient.prefetchQuery({
      queryKey,
      queryFn,
      ...cacheConfig.listData,
      ...options,
    })
  },
  
  /**
   * Set query data directly (for optimistic updates)
   */
  setQueryData: (queryKey: any[], data: any) => {
    queryClient.setQueryData(queryKey, data)
  },
  
  /**
   * Get cached query data
   */
  getQueryData: (queryKey: any[]) => {
    return queryClient.getQueryData(queryKey)
  },
}

/**
 * Performance monitoring for React Query
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Monitor query performance
  queryClient.getQueryCache().subscribe((event) => {
    if (event?.type === 'added') {
      console.log('🚀 Query added to cache:', event.query.queryKey)
    } else if (event?.type === 'updated' && event.action?.type === 'success') {
      console.log('✅ Query success:', event.query.queryKey)
    }
  })
}

export default queryClient