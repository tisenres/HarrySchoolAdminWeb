/**
 * Custom React Query hooks for Teachers data
 * Optimized for performance with smart caching and background updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, cacheConfig, cacheUtils } from '@/lib/react-query'
import type { Teacher, TeacherFilters, TeacherSortConfig } from '@/types/teacher'
import type { CreateTeacherRequest } from '@/lib/validations/teacher'

/**
 * Hook to fetch teachers list with filtering, sorting, and pagination
 */
export function useTeachers(
  filters?: TeacherFilters,
  sort?: TeacherSortConfig,
  pagination?: { page: number; limit: number }
) {
  const page = pagination?.page || 1
  const limit = pagination?.limit || 20

  return useQuery({
    queryKey: queryKeys.teachersList(filters, sort, page),
    queryFn: async () => {
      const queryParams: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
        sort_by: sort?.field || 'full_name',
        sort_order: sort?.direction || 'asc',
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
    // Enable background refetching for better UX
    refetchOnWindowFocus: true,
    // Prefetch next page when we're on a page with more data
    onSuccess: (data) => {
      const queryClient = useQueryClient()
      if (data.total_pages && page < data.total_pages) {
        // Prefetch next page
        queryClient.prefetchQuery({
          queryKey: queryKeys.teachersList(filters, sort, page + 1),
          queryFn: async () => {
            const nextPageParams = new URLSearchParams({
              ...queryParams,
              page: (page + 1).toString(),
            })
            const response = await fetch(`/api/teachers?${nextPageParams}`, {
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
            })
            return response.json()
          },
        })
      }
    },
  })
}

/**
 * Hook to fetch teacher statistics
 */
export function useTeachersStats() {
  return useQuery({
    queryKey: queryKeys.teachersStats(),
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
 * Hook to fetch a single teacher by ID
 */
export function useTeacher(teacherId: string) {
  return useQuery({
    queryKey: queryKeys.teacherDetail(teacherId),
    queryFn: async () => {
      const response = await fetch(`/api/teachers/${teacherId}`, {
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
    enabled: !!teacherId, // Only run if teacherId is provided
  })
}

/**
 * Hook to create a new teacher
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
    onSuccess: (newTeacher) => {
      // Invalidate teachers list to refetch with new data
      cacheUtils.invalidateEntity('teachers')
      
      // Optionally add the new teacher to existing cache
      const existingQueries = queryClient.getQueriesData({ queryKey: queryKeys.teachers })
      existingQueries.forEach(([queryKey, data]: [any, any]) => {
        if (data && Array.isArray(data.data)) {
          queryClient.setQueryData(queryKey, {
            ...data,
            data: [newTeacher, ...data.data],
            count: data.count + 1,
          })
        }
      })
      
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: queryKeys.teachersStats() })
    },
  })
}

/**
 * Hook to update an existing teacher
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
    onSuccess: (updatedTeacher, { id }) => {
      // Update the teacher detail cache
      queryClient.setQueryData(queryKeys.teacherDetail(id), updatedTeacher)
      
      // Update the teacher in all list caches
      const existingQueries = queryClient.getQueriesData({ queryKey: queryKeys.teachers })
      existingQueries.forEach(([queryKey, data]: [any, any]) => {
        if (data && Array.isArray(data.data)) {
          queryClient.setQueryData(queryKey, {
            ...data,
            data: data.data.map((teacher: Teacher) =>
              teacher.id === id ? updatedTeacher : teacher
            ),
          })
        }
      })
      
      // Invalidate stats in case the update affects them
      queryClient.invalidateQueries({ queryKey: queryKeys.teachersStats() })
    },
  })
}

/**
 * Hook to delete a teacher
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
    onSuccess: (_, teacherId) => {
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: queryKeys.teacherDetail(teacherId) })
      
      // Remove from all list caches
      const existingQueries = queryClient.getQueriesData({ queryKey: queryKeys.teachers })
      existingQueries.forEach(([queryKey, data]: [any, any]) => {
        if (data && Array.isArray(data.data)) {
          queryClient.setQueryData(queryKey, {
            ...data,
            data: data.data.filter((teacher: Teacher) => teacher.id !== teacherId),
            count: Math.max(0, data.count - 1),
          })
        }
      })
      
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: queryKeys.teachersStats() })
    },
  })
}

/**
 * Hook to bulk delete teachers
 */
export function useBulkDeleteTeachers() {
  const queryClient = useQueryClient()

  return useMutation({
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
      // Remove from detail caches
      teacherIds.forEach(id => {
        queryClient.removeQueries({ queryKey: queryKeys.teacherDetail(id) })
      })
      
      // Remove from all list caches
      const existingQueries = queryClient.getQueriesData({ queryKey: queryKeys.teachers })
      existingQueries.forEach(([queryKey, data]: [any, any]) => {
        if (data && Array.isArray(data.data)) {
          queryClient.setQueryData(queryKey, {
            ...data,
            data: data.data.filter((teacher: Teacher) => !teacherIds.includes(teacher.id)),
            count: Math.max(0, data.count - result.success),
          })
        }
      })
      
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: queryKeys.teachersStats() })
    },
  })
}

/**
 * Utility hook to prefetch teachers data
 */
export function usePrefetchTeachers() {
  const queryClient = useQueryClient()

  return {
    prefetchTeachers: (filters?: TeacherFilters, sort?: TeacherSortConfig, page = 1) => {
      return cacheUtils.prefetch(
        queryKeys.teachersList(filters, sort, page),
        async () => {
          const queryParams: Record<string, string> = {
            page: page.toString(),
            limit: '20',
            sort_by: sort?.field || 'full_name',
            sort_order: sort?.direction || 'asc',
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
          
          return response.json()
        }
      )
    },
    prefetchTeacherStats: () => {
      return cacheUtils.prefetch(
        queryKeys.teachersStats(),
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