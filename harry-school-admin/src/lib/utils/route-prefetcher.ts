/**
 * Route prefetching utility for optimized navigation
 * Prefetches data for dashboard pages on hover/focus for instant navigation
 */

import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { queryKeys, cacheConfig } from '@/lib/react-query'

export function useRoutePrefetcher() {
  const queryClient = useQueryClient()
  
  const prefetchDashboard = useCallback(async () => {
    const orgId = typeof window !== 'undefined' 
      ? localStorage.getItem('organizationId') || 'default'
      : 'default'
    
    // Prefetch all dashboard queries in parallel
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboardStats(),
        queryFn: async () => {
          const response = await fetch('/api/dashboard/stats', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!response.ok) throw new Error('Failed to fetch dashboard stats')
          return response.json()
        },
        ...cacheConfig.dashboardData
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.recentActivity(5),
        queryFn: async () => {
          const response = await fetch('/api/activities?limit=5', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!response.ok) throw new Error('Failed to fetch recent activities')
          return response.json()
        },
        ...cacheConfig.realTimeData
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.integratedAnalytics(orgId),
        queryFn: async () => {
          const response = await fetch(`/api/analytics/integrated?org=${orgId}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!response.ok) throw new Error('Failed to fetch analytics')
          return response.json()
        },
        ...cacheConfig.dashboardData
      })
    ])
  }, [queryClient])
  
  const prefetchTeachers = useCallback(async () => {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: queryKeys.teachersList({}, { field: 'full_name', direction: 'asc' }, 1),
        queryFn: async () => {
          const response = await fetch('/api/teachers?page=1&limit=20&sort_by=full_name&sort_order=asc', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!response.ok) throw new Error('Failed to fetch teachers')
          return response.json()
        },
        ...cacheConfig.listData
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.teachersStats(),
        queryFn: async () => {
          const response = await fetch('/api/teachers/stats', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!response.ok) throw new Error('Failed to fetch teacher stats')
          return response.json()
        },
        ...cacheConfig.dashboardData
      })
    ])
  }, [queryClient])
  
  const prefetchStudents = useCallback(async () => {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: ['students', 'list', {}, { field: 'created_at', direction: 'desc' }, 1],
        queryFn: async () => {
          const response = await fetch('/api/students?page=1&limit=20&sort_by=created_at&sort_order=desc', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!response.ok) throw new Error('Failed to fetch students')
          return response.json()
        },
        ...cacheConfig.listData
      }),
      queryClient.prefetchQuery({
        queryKey: ['students', 'statistics'],
        queryFn: async () => {
          const response = await fetch('/api/students/statistics', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!response.ok) throw new Error('Failed to fetch student statistics')
          return response.json()
        },
        ...cacheConfig.dashboardData
      })
    ])
  }, [queryClient])
  
  const prefetchGroups = useCallback(async () => {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: ['groups', 'list', {}, { field: 'created_at', direction: 'desc' }, 1],
        queryFn: async () => {
          const response = await fetch('/api/groups?page=1&limit=20&sort_by=created_at&sort_order=desc', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!response.ok) throw new Error('Failed to fetch groups')
          return response.json()
        },
        ...cacheConfig.listData
      }),
      queryClient.prefetchQuery({
        queryKey: ['groups', 'statistics'],
        queryFn: async () => {
          const response = await fetch('/api/groups/statistics', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!response.ok) throw new Error('Failed to fetch group statistics')
          return response.json()
        },
        ...cacheConfig.dashboardData
      })
    ])
  }, [queryClient])
  
  const prefetchSettings = useCallback(async () => {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: ['settings', 'organization'],
        queryFn: async () => {
          const response = await fetch('/api/settings/organization', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!response.ok) throw new Error('Failed to fetch organization settings')
          return response.json()
        },
        ...cacheConfig.staticData
      }),
      queryClient.prefetchQuery({
        queryKey: ['settings', 'users'],
        queryFn: async () => {
          const response = await fetch('/api/settings/users', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!response.ok) throw new Error('Failed to fetch users')
          return response.json()
        },
        ...cacheConfig.listData
      })
    ])
  }, [queryClient])
  
  const prefetchRankings = useCallback(async () => {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: ['rankings', 'list'],
        queryFn: async () => {
          const response = await fetch('/api/rankings', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!response.ok) throw new Error('Failed to fetch rankings')
          return response.json()
        },
        ...cacheConfig.listData
      }),
      queryClient.prefetchQuery({
        queryKey: ['rankings', 'analytics'],
        queryFn: async () => {
          const response = await fetch('/api/rankings/analytics', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!response.ok) throw new Error('Failed to fetch ranking analytics')
          return response.json()
        },
        ...cacheConfig.dashboardData
      })
    ])
  }, [queryClient])
  
  return {
    prefetchDashboard,
    prefetchTeachers,
    prefetchStudents,
    prefetchGroups,
    prefetchSettings,
    prefetchRankings,
  }
}

/**
 * Smart prefetcher that only prefetches if data is not already cached
 */
export function useSmartPrefetcher() {
  const queryClient = useQueryClient()
  const prefetcher = useRoutePrefetcher()
  
  const smartPrefetch = useCallback((route: string) => {
    const prefetchMap: Record<string, () => Promise<void>> = {
      dashboard: prefetcher.prefetchDashboard,
      teachers: prefetcher.prefetchTeachers,
      students: prefetcher.prefetchStudents,
      groups: prefetcher.prefetchGroups,
      settings: prefetcher.prefetchSettings,
      rankings: prefetcher.prefetchRankings,
    }
    
    const prefetchFn = prefetchMap[route]
    if (!prefetchFn) return
    
    // Check if we have recent data cached
    const hasRecentData = (queryKey: any[]) => {
      const query = queryClient.getQueryState(queryKey)
      if (!query?.data) return false
      
      const dataTime = query.dataUpdatedAt
      const staleTime = 5 * 60 * 1000 // 5 minutes
      return Date.now() - dataTime < staleTime
    }
    
    // Only prefetch if we don't have recent data
    const shouldPrefetch = (() => {
      switch (route) {
        case 'dashboard':
          return !hasRecentData(queryKeys.dashboardStats())
        case 'teachers':
          return !hasRecentData(queryKeys.teachersStats())
        case 'students':
          return !hasRecentData(['students', 'statistics'])
        case 'groups':
          return !hasRecentData(['groups', 'statistics'])
        default:
          return true
      }
    })()
    
    if (shouldPrefetch) {
      prefetchFn().catch(error => {
        console.warn(`Failed to prefetch ${route}:`, error)
      })
    }
  }, [queryClient, prefetcher])
  
  return { smartPrefetch }
}