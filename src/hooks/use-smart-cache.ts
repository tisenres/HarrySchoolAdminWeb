/**
 * Enhanced React Query hooks with Smart Cache integration
 * Provides intelligent caching strategies for better performance
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { smartCache, cacheConfigs, cacheInvalidation } from '@/lib/services/smart-cache'
import { queryKeys } from '@/lib/react-query'

/**
 * Enhanced useQuery with smart cache integration
 */
export function useSmartQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: UseQueryOptions<T> & {
    smartCache?: keyof typeof cacheConfigs
    cacheKey?: string
    dependencies?: string[]
  } = {}
) {
  const { smartCache: cacheType, cacheKey, dependencies, ...queryOptions } = options
  const cacheConfig = cacheType ? cacheConfigs[cacheType] : cacheConfigs.listingData

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (cacheKey) {
        return smartCache.getOrFetch(cacheKey, queryFn, {
          ...cacheConfig,
          dependencies: dependencies || cacheConfig.dependencies
        })
      }
      return queryFn()
    },
    staleTime: cacheConfig.ttl * 0.5, // React Query stale time is half of cache TTL
    gcTime: cacheConfig.ttl * 2, // Garbage collection time is double
    ...queryOptions,
  })
}

/**
 * Enhanced teachers hooks with smart caching
 */
export function useTeachersWithSmartCache(
  filters?: any,
  sort?: any,
  pagination?: { page: number; limit: number }
) {
  const cacheKey = `teachers:${JSON.stringify({ filters, sort, page: pagination?.page || 1 })}`
  
  return useSmartQuery(
    queryKeys.teachersList(filters, sort, pagination?.page),
    async () => {
      const params = new URLSearchParams({
        page: (pagination?.page || 1).toString(),
        limit: (pagination?.limit || 20).toString(),
        ...(sort?.field && { sort_by: sort.field }),
        ...(sort?.direction && { sort_order: sort.direction }),
        ...Object.entries(filters || {}).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = value.toString()
          }
          return acc
        }, {} as Record<string, string>)
      })

      const response = await fetch(`/api/teachers?${params.toString()}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch teachers')
      }

      return response.json()
    },
    {
      smartCache: 'listingData',
      cacheKey,
      dependencies: ['teachers', 'data']
    }
  )
}

/**
 * Enhanced dashboard hooks with smart caching
 */
export function useDashboardWithSmartCache() {
  return useSmartQuery(
    ['dashboard', 'stats'],
    async () => {
      const [statsRes, activitiesRes, analyticsRes] = await Promise.all([
        fetch('/api/dashboard/stats', { credentials: 'include' }),
        fetch('/api/dashboard/activities', { credentials: 'include' }),
        fetch('/api/dashboard/analytics', { credentials: 'include' })
      ])

      const [statistics, activities, analytics] = await Promise.all([
        statsRes.ok ? statsRes.json() : null,
        activitiesRes.ok ? activitiesRes.json() : null,
        analyticsRes.ok ? analyticsRes.json() : null
      ])

      return {
        statistics,
        activities,
        integratedAnalytics: analytics
      }
    },
    {
      smartCache: 'analyticsData',
      cacheKey: 'dashboard:all',
      dependencies: ['dashboard', 'analytics', 'data']
    }
  )
}

/**
 * Smart cache mutation hooks with automatic invalidation
 */
export function useSmartMutation<T, V = unknown>(
  mutationFn: (variables: V) => Promise<T>,
  options: {
    onSuccessInvalidate?: () => void
    cacheKeys?: string[]
    dependencies?: string[]
  } = {}
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Invalidate React Query cache
      if (options.cacheKeys) {
        options.cacheKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] })
        })
      }

      // Invalidate smart cache
      if (options.dependencies) {
        options.dependencies.forEach(dep => {
          smartCache.invalidateByDependency(dep)
        })
      }

      // Custom invalidation
      if (options.onSuccessInvalidate) {
        options.onSuccessInvalidate()
      }
    },
  })
}

/**
 * Teacher mutations with smart cache invalidation
 */
export function useCreateTeacherSmart() {
  return useSmartMutation(
    async (data: any) => {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to create teacher')
      return response.json()
    },
    {
      cacheKeys: ['teachers', 'dashboard'],
      dependencies: ['teachers', 'data', 'analytics'],
      onSuccessInvalidate: cacheInvalidation.onTeacherChange
    }
  )
}

export function useUpdateTeacherSmart() {
  return useSmartMutation(
    async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/teachers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to update teacher')
      return response.json()
    },
    {
      cacheKeys: ['teachers', 'dashboard'],
      dependencies: ['teachers', 'data', 'analytics'],
      onSuccessInvalidate: cacheInvalidation.onTeacherChange
    }
  )
}

export function useDeleteTeacherSmart() {
  return useSmartMutation(
    async (id: string) => {
      const response = await fetch(`/api/teachers/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to delete teacher')
      return response.json()
    },
    {
      cacheKeys: ['teachers', 'dashboard'],
      dependencies: ['teachers', 'data', 'analytics'],
      onSuccessInvalidate: cacheInvalidation.onTeacherChange
    }
  )
}

/**
 * Prefetch helper with smart caching
 */
export function useSmartPrefetch() {
  const queryClient = useQueryClient()

  const prefetchTeachers = async (filters?: any, sort?: any, page = 1) => {
    const cacheKey = `teachers:${JSON.stringify({ filters, sort, page })}`
    const queryKey = queryKeys.teachersList(filters, sort, page)

    // Check smart cache first
    const cached = smartCache.get(cacheKey)
    if (cached) {
      queryClient.setQueryData(queryKey, cached)
      return
    }

    // Prefetch with React Query
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
          ...(sort?.field && { sort_by: sort.field }),
          ...(sort?.direction && { sort_order: sort.direction }),
          ...Object.entries(filters || {}).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              acc[key] = value.toString()
            }
            return acc
          }, {} as Record<string, string>)
        })

        const response = await fetch(`/api/teachers?${params.toString()}`, {
          credentials: 'include',
        })

        if (!response.ok) throw new Error('Failed to prefetch teachers')
        const data = await response.json()

        // Cache in smart cache
        smartCache.set(cacheKey, data, cacheConfigs.listingData)
        
        return data
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }

  const prefetchDashboard = async () => {
    const cacheKey = 'dashboard:all'
    const queryKey = ['dashboard', 'stats']

    const cached = smartCache.get(cacheKey)
    if (cached) {
      queryClient.setQueryData(queryKey, cached)
      return
    }

    await queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const [statsRes, activitiesRes, analyticsRes] = await Promise.all([
          fetch('/api/dashboard/stats', { credentials: 'include' }),
          fetch('/api/dashboard/activities', { credentials: 'include' }),
          fetch('/api/dashboard/analytics', { credentials: 'include' })
        ])

        const data = {
          statistics: statsRes.ok ? await statsRes.json() : null,
          activities: activitiesRes.ok ? await activitiesRes.json() : null,
          integratedAnalytics: analyticsRes.ok ? await analyticsRes.json() : null
        }

        smartCache.set(cacheKey, data, cacheConfigs.analyticsData)
        return data
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    })
  }

  return {
    prefetchTeachers,
    prefetchDashboard
  }
}

/**
 * Cache monitoring hook for development
 */
export function useCacheStats() {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['cache-stats'],
    queryFn: () => ({
      smartCache: smartCache.getStats(),
      reactQuery: {
        queries: queryClient.getQueryCache().getAll().length,
        mutations: queryClient.getMutationCache().getAll().length,
      }
    }),
    enabled: process.env.NODE_ENV === 'development',
    refetchInterval: 5000, // Update every 5 seconds in dev
  })
}