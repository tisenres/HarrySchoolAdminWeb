/**
 * Optimized React Query hooks for Teachers data
 * Eliminates N+1 queries and implements better cache management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, cacheConfig, cacheUtils } from '@/lib/react-query-optimized'
import type { Teacher, TeacherFilters, TeacherSortConfig } from '@/types/teacher'
import type { CreateTeacherRequest } from '@/lib/validations/teacher'

/**
 * OPTIMIZED: Hook to fetch teachers list with teacher count and group assignments
 */
export function useOptimizedTeachers(
  filters?: TeacherFilters,
  sort?: TeacherSortConfig,
  pagination?: { page: number; limit: number }
) {
  const page = pagination?.page || 1
  const limit = pagination?.limit || 20

  return useQuery({
    queryKey: queryKeys.teachers.list(filters, sort, page),
    queryFn: async () => {
      const queryParams: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
        sort_field: sort?.field || 'full_name',
        sort_direction: sort?.direction || 'asc',
        include_counts: 'true', // Request enriched data
      }
      
      if (filters?.search) queryParams['query'] = filters.search
      if (filters?.employment_status) {
        queryParams['employment_status'] = Array.isArray(filters.employment_status) 
          ? filters.employment_status.join(',') 
          : filters.employment_status
      }
      if (filters?.specializations && filters.specializations.length > 0) {
        queryParams['specializations'] = filters.specializations.join(',')
      }
      if (filters?.is_active !== undefined) {
        queryParams['is_active'] = filters.is_active.toString()
      }
      
      const params = new URLSearchParams(queryParams)
      const response = await fetch(`/api/teachers?${params}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch teachers')
      }
      
      return response.json()
    },
    ...cacheConfig.listData,
    staleTime: 5 * 60 * 1000, // 5 minutes for teacher data
    gcTime: 15 * 60 * 1000, // 15 minutes cache
  })
}

/**
 * Hook to fetch teacher statistics
 */
export function useTeachersStats() {
  return useQuery({
    queryKey: queryKeys.teachers.stats(),
    queryFn: async () => {
      const response = await fetch('/api/teachers/stats', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch teacher statistics')
      }
      
      return response.json()
    },
    ...cacheConfig.dashboardData,
  })
}

/**
 * OPTIMIZED: Hook to fetch a single teacher with group assignments
 */
export function useTeacherDetail(teacherId: string) {
  return useQuery({
    queryKey: queryKeys.teachers.detail(teacherId),
    queryFn: async () => {
      const response = await fetch(`/api/teachers/${teacherId}?include_groups=true`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch teacher')
      }
      
      return response.json()
    },
    ...cacheConfig.userData,
    enabled: !!teacherId,
  })
}

/**
 * OPTIMIZED: Hook to create a new teacher with optimistic updates
 */
export function useCreateTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (teacherData: CreateTeacherRequest) => {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(teacherData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create teacher')
      }
      
      return response.json()
    },
    
    onMutate: async (newTeacher) => {
      // Cancel outgoing refetches
      await cacheUtils.cancelQueries(queryKeys.teachers.all)
      
      // Snapshot previous values
      const previousQueries = new Map()
      
      // Optimistically add to first page of each query
      const existingQueries = queryClient.getQueriesData({ queryKey: queryKeys.teachers.lists() })
      
      existingQueries.forEach(([queryKey, data]: [any, any]) => {
        previousQueries.set(queryKey, data)
        
        if (data && Array.isArray(data.data)) {
          const [, , , filters, sort, page] = queryKey
          if (page === 1) {
            // Add to first page
            const optimisticTeacher = {
              id: 'temp-' + Date.now(),
              ...newTeacher,
              full_name: `${newTeacher.first_name} ${newTeacher.last_name}`,
              group_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            
            queryClient.setQueryData(queryKey, {
              ...data,
              data: [optimisticTeacher, ...data.data.slice(0, -1)],
              count: data.count + 1,
              total_pages: Math.ceil((data.count + 1) / (data.limit || 20))
            })
          }
        }
      })
      
      // Optimistically update stats
      const currentStats = queryClient.getQueryData(queryKeys.teachers.stats())
      if (currentStats && typeof currentStats === 'object') {
        queryClient.setQueryData(queryKeys.teachers.stats(), {
          ...currentStats,
          total: ((currentStats as any).total || 0) + 1,
          active: newTeacher.is_active !== false ? ((currentStats as any).active || 0) + 1 : (currentStats as any).active,
          [newTeacher.employment_status || 'unknown']: ((currentStats as any)[newTeacher.employment_status || 'unknown'] || 0) + 1,
        })
      }
      
      return { previousQueries }
    },
    
    onError: (err, newTeacher, context) => {
      // Rollback optimistic updates
      if (context?.previousQueries) {
        context.previousQueries.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    
    onSettled: () => {
      // Refetch to get accurate data
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.all })
    }
  })
}

/**
 * OPTIMIZED: Hook to update an existing teacher with surgical cache updates
 */
export function useUpdateTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTeacherRequest> }) => {
      const response = await fetch(`/api/teachers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update teacher')
      }
      
      return response.json()
    },
    
    onMutate: async ({ id, data }) => {
      await cacheUtils.cancelQueries(queryKeys.teachers.all)
      
      // Get current teacher data
      const currentTeacher = queryClient.getQueryData(queryKeys.teachers.detail(id))
      
      // Optimistically update detail cache
      if (currentTeacher) {
        queryClient.setQueryData(queryKeys.teachers.detail(id), {
          ...currentTeacher,
          ...data,
          full_name: data.first_name || data.last_name 
            ? `${data.first_name || (currentTeacher as any).first_name} ${data.last_name || (currentTeacher as any).last_name}`
            : (currentTeacher as any).full_name,
          updated_at: new Date().toISOString(),
        })
      }
      
      // Optimistically update in list caches
      queryClient.setQueriesData(
        { queryKey: queryKeys.teachers.lists() },
        (oldData: any) => {
          if (!oldData || !Array.isArray(oldData.data)) return oldData
          
          return {
            ...oldData,
            data: oldData.data.map((teacher: Teacher) =>
              teacher.id === id ? {
                ...teacher,
                ...data,
                full_name: data.first_name || data.last_name 
                  ? `${data.first_name || teacher.first_name} ${data.last_name || teacher.last_name}`
                  : teacher.full_name,
                updated_at: new Date().toISOString(),
              } : teacher
            )
          }
        }
      )
      
      return { currentTeacher }
    },
    
    onError: (err, { id }, context) => {
      // Rollback optimistic updates
      if (context?.currentTeacher) {
        queryClient.setQueryData(queryKeys.teachers.detail(id), context.currentTeacher)
      }
      // Invalidate list caches to get fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.lists() })
    },
    
    onSettled: () => {
      // Invalidate stats as they might be affected
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.stats() })
    }
  })
}

/**
 * OPTIMIZED: Hook to delete a teacher with cache cleanup
 */
export function useDeleteTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (teacherId: string) => {
      const response = await fetch(`/api/teachers/${teacherId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete teacher')
      }
      
      return response.json()
    },
    
    onMutate: async (teacherId) => {
      await cacheUtils.cancelQueries(queryKeys.teachers.all)
      
      // Get teacher data for rollback
      const teacherData = queryClient.getQueryData(queryKeys.teachers.detail(teacherId))
      
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: queryKeys.teachers.detail(teacherId) })
      
      // Remove from list caches
      queryClient.setQueriesData(
        { queryKey: queryKeys.teachers.lists() },
        (oldData: any) => {
          if (!oldData || !Array.isArray(oldData.data)) return oldData
          
          return {
            ...oldData,
            data: oldData.data.filter((teacher: Teacher) => teacher.id !== teacherId),
            count: Math.max(0, oldData.count - 1),
            total_pages: Math.ceil(Math.max(0, oldData.count - 1) / (oldData.limit || 20))
          }
        }
      )
      
      // Update stats optimistically
      if (teacherData) {
        const currentStats = queryClient.getQueryData(queryKeys.teachers.stats())
        if (currentStats && typeof currentStats === 'object') {
          const teacher = teacherData as any
          queryClient.setQueryData(queryKeys.teachers.stats(), {
            ...currentStats,
            total: Math.max(0, ((currentStats as any).total || 0) - 1),
            active: teacher.is_active 
              ? Math.max(0, ((currentStats as any).active || 0) - 1)
              : (currentStats as any).active,
            [teacher.employment_status || 'unknown']: Math.max(0, ((currentStats as any)[teacher.employment_status || 'unknown'] || 0) - 1),
          })
        }
      }
      
      return { teacherData }
    },
    
    onError: (err, teacherId, context) => {
      // Invalidate all teacher queries to get fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.all })
    },
    
    onSettled: () => {
      // Ensure stats are up to date
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.stats() })
    }
  })
}

/**
 * OPTIMIZED: Hook for bulk teacher operations
 */
export function useBulkTeacherOperations() {
  const queryClient = useQueryClient()

  const bulkDelete = useMutation({
    mutationFn: async (teacherIds: string[]) => {
      const response = await fetch('/api/teachers/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: teacherIds }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete teachers')
      }
      
      return response.json()
    },
    
    onSuccess: (result, teacherIds) => {
      // Remove from all caches
      teacherIds.forEach(id => {
        queryClient.removeQueries({ queryKey: queryKeys.teachers.detail(id) })
      })
      
      // Update list caches
      queryClient.setQueriesData(
        { queryKey: queryKeys.teachers.lists() },
        (oldData: any) => {
          if (!oldData || !Array.isArray(oldData.data)) return oldData
          
          return {
            ...oldData,
            data: oldData.data.filter((teacher: Teacher) => !teacherIds.includes(teacher.id)),
            count: Math.max(0, oldData.count - (result.success || 0)),
          }
        }
      )
      
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.stats() })
    }
  })

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ teacherIds, status }: { teacherIds: string[]; status: boolean }) => {
      const response = await fetch('/api/teachers/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: teacherIds, data: { is_active: status } }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update teacher status')
      }
      
      return response.json()
    },
    
    onSuccess: (result, { teacherIds, status }) => {
      // Update list caches
      queryClient.setQueriesData(
        { queryKey: queryKeys.teachers.lists() },
        (oldData: any) => {
          if (!oldData || !Array.isArray(oldData.data)) return oldData
          
          return {
            ...oldData,
            data: oldData.data.map((teacher: Teacher) =>
              teacherIds.includes(teacher.id) 
                ? { ...teacher, is_active: status, updated_at: new Date().toISOString() }
                : teacher
            )
          }
        }
      )
      
      // Update detail caches
      teacherIds.forEach(id => {
        queryClient.setQueryData(queryKeys.teachers.detail(id), (oldData: any) => {
          if (!oldData) return oldData
          return { 
            ...oldData, 
            is_active: status,
            updated_at: new Date().toISOString()
          }
        })
      })
      
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.stats() })
    }
  })

  return {
    bulkDelete: bulkDelete.mutate,
    bulkUpdateStatus: bulkUpdateStatus.mutate,
    isBulkDeleting: bulkDelete.isPending,
    isBulkUpdating: bulkUpdateStatus.isPending,
  }
}

/**
 * Hook to prefetch teachers data
 */
export function usePrefetchTeachers() {
  return {
    prefetchTeachers: (filters?: TeacherFilters, sort?: TeacherSortConfig, page = 1) => {
      return cacheUtils.safePrefetch(
        queryKeys.teachers.list(filters, sort, page),
        async () => {
          const queryParams: Record<string, string> = {
            page: page.toString(),
            limit: '20',
            sort_field: sort?.field || 'full_name',
            sort_direction: sort?.direction || 'asc',
          }
          
          if (filters?.search) queryParams['query'] = filters.search
          if (filters?.employment_status) {
            queryParams['employment_status'] = Array.isArray(filters.employment_status) 
              ? filters.employment_status.join(',') 
              : filters.employment_status
          }
          
          const params = new URLSearchParams(queryParams)
          const response = await fetch(`/api/teachers?${params}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          
          return response.json()
        },
        cacheConfig.listData
      )
    },
    
    prefetchTeacherStats: () => {
      return cacheUtils.safePrefetch(
        queryKeys.teachers.stats(),
        async () => {
          const response = await fetch('/api/teachers/stats', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          return response.json()
        },
        cacheConfig.dashboardData
      )
    },
  }
}