/**
 * Generic CRUD hooks for data operations
 * Provides reusable patterns for Create, Read, Update, Delete operations
 */

import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { logger } from '@/lib/utils/logger'
import type { 
  ApiResponse, 
  PaginationParams, 
  PaginatedResponse,
  AsyncState 
} from '@/types/common'

/**
 * Configuration for CRUD operations
 */
export interface CrudConfig<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  /** Base API endpoint */
  endpoint: string
  /** Resource name for logging and notifications */
  resourceName: string
  /** Transform data before sending to API */
  transformRequest?: (data: TCreate | TUpdate) => unknown
  /** Transform response data */
  transformResponse?: (data: unknown) => T
  /** Custom error handler */
  onError?: (error: Error) => void
  /** Custom success handler */
  onSuccess?: (data: T) => void
  /** Enable optimistic updates */
  optimisticUpdate?: boolean
  /** Cache key for React Query integration */
  cacheKey?: string[]
}

/**
 * Generic hook for list operations with pagination
 */
export function useList<T>(config: CrudConfig<T>) {
  const [state, setState] = useState<AsyncState<PaginatedResponse<T>>>({
    loading: false,
    error: null,
  })
  const { toast } = useToast()

  const fetchList = useCallback(
    async (params?: PaginationParams & Record<string, unknown>) => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const queryParams = new URLSearchParams()
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, String(value))
            }
          })
        }

        const response = await fetch(`${config.endpoint}?${queryParams}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch ${config.resourceName}s`)
        }

        const result: ApiResponse<PaginatedResponse<T>> = await response.json()
        
        if (!result.success || !result.data) {
          throw new Error(result.message || 'Failed to fetch data')
        }

        const transformedData = config.transformResponse 
          ? {
              ...result.data,
              data: result.data.data.map(config.transformResponse)
            }
          : result.data

        setState({
          data: transformedData,
          loading: false,
          error: null,
        })

        return transformedData
      } catch (error) {
        const err = error as Error
        logger.error(`Failed to fetch ${config.resourceName}s`, err)
        setState({
          loading: false,
          error: err,
        })
        
        if (config.onError) {
          config.onError(err)
        } else {
          toast({
            title: 'Error',
            description: err.message,
            variant: 'destructive',
          })
        }
        
        throw err
      }
    },
    [config, toast]
  )

  return {
    ...state,
    fetchList,
    refetch: fetchList,
  }
}

/**
 * Generic hook for single item operations
 */
export function useItem<T>(config: CrudConfig<T>) {
  const [state, setState] = useState<AsyncState<T>>({
    loading: false,
    error: null,
  })
  const { toast } = useToast()

  const fetchItem = useCallback(
    async (id: string) => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetch(`${config.endpoint}/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch ${config.resourceName}`)
        }

        const result: ApiResponse<T> = await response.json()
        
        if (!result.success || !result.data) {
          throw new Error(result.message || 'Failed to fetch data')
        }

        const transformedData = config.transformResponse 
          ? config.transformResponse(result.data)
          : result.data

        setState({
          data: transformedData,
          loading: false,
          error: null,
        })

        return transformedData
      } catch (error) {
        const err = error as Error
        logger.error(`Failed to fetch ${config.resourceName}`, err)
        setState({
          loading: false,
          error: err,
        })
        
        if (config.onError) {
          config.onError(err)
        } else {
          toast({
            title: 'Error',
            description: err.message,
            variant: 'destructive',
          })
        }
        
        throw err
      }
    },
    [config, toast]
  )

  return {
    ...state,
    fetchItem,
    refetch: fetchItem,
  }
}

/**
 * Generic hook for create operations
 */
export function useCreate<T, TCreate = Partial<T>>(config: CrudConfig<T, TCreate>) {
  const [state, setState] = useState<AsyncState<T>>({
    loading: false,
    error: null,
  })
  const { toast } = useToast()

  const create = useCallback(
    async (data: TCreate) => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const requestData = config.transformRequest 
          ? config.transformRequest(data)
          : data

        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(requestData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || `Failed to create ${config.resourceName}`)
        }

        const result: ApiResponse<T> = await response.json()
        
        if (!result.success || !result.data) {
          throw new Error(result.message || 'Failed to create')
        }

        const transformedData = config.transformResponse 
          ? config.transformResponse(result.data)
          : result.data

        setState({
          data: transformedData,
          loading: false,
          error: null,
        })

        toast({
          title: 'Success',
          description: `${config.resourceName} created successfully`,
        })

        if (config.onSuccess) {
          config.onSuccess(transformedData)
        }

        return transformedData
      } catch (error) {
        const err = error as Error
        logger.error(`Failed to create ${config.resourceName}`, err)
        setState({
          loading: false,
          error: err,
        })
        
        if (config.onError) {
          config.onError(err)
        } else {
          toast({
            title: 'Error',
            description: err.message,
            variant: 'destructive',
          })
        }
        
        throw err
      }
    },
    [config, toast]
  )

  return {
    ...state,
    create,
    isCreating: state.loading,
  }
}

/**
 * Generic hook for update operations
 */
export function useUpdate<T, TUpdate = Partial<T>>(config: CrudConfig<T, unknown, TUpdate>) {
  const [state, setState] = useState<AsyncState<T>>({
    loading: false,
    error: null,
  })
  const { toast } = useToast()

  const update = useCallback(
    async (id: string, data: TUpdate) => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const requestData = config.transformRequest 
          ? config.transformRequest(data)
          : data

        const response = await fetch(`${config.endpoint}/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(requestData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || `Failed to update ${config.resourceName}`)
        }

        const result: ApiResponse<T> = await response.json()
        
        if (!result.success || !result.data) {
          throw new Error(result.message || 'Failed to update')
        }

        const transformedData = config.transformResponse 
          ? config.transformResponse(result.data)
          : result.data

        setState({
          data: transformedData,
          loading: false,
          error: null,
        })

        toast({
          title: 'Success',
          description: `${config.resourceName} updated successfully`,
        })

        if (config.onSuccess) {
          config.onSuccess(transformedData)
        }

        return transformedData
      } catch (error) {
        const err = error as Error
        logger.error(`Failed to update ${config.resourceName}`, err)
        setState({
          loading: false,
          error: err,
        })
        
        if (config.onError) {
          config.onError(err)
        } else {
          toast({
            title: 'Error',
            description: err.message,
            variant: 'destructive',
          })
        }
        
        throw err
      }
    },
    [config, toast]
  )

  return {
    ...state,
    update,
    isUpdating: state.loading,
  }
}

/**
 * Generic hook for delete operations
 */
export function useDelete<T>(config: CrudConfig<T>) {
  const [state, setState] = useState<AsyncState<void>>({
    loading: false,
    error: null,
  })
  const { toast } = useToast()

  const deleteItem = useCallback(
    async (id: string) => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetch(`${config.endpoint}/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || `Failed to delete ${config.resourceName}`)
        }

        setState({
          loading: false,
          error: null,
        })

        toast({
          title: 'Success',
          description: `${config.resourceName} deleted successfully`,
        })

        return true
      } catch (error) {
        const err = error as Error
        logger.error(`Failed to delete ${config.resourceName}`, err)
        setState({
          loading: false,
          error: err,
        })
        
        if (config.onError) {
          config.onError(err)
        } else {
          toast({
            title: 'Error',
            description: err.message,
            variant: 'destructive',
          })
        }
        
        throw err
      }
    },
    [config, toast]
  )

  return {
    ...state,
    deleteItem,
    isDeleting: state.loading,
  }
}

/**
 * Combined CRUD hook for all operations
 */
export function useCrud<T, TCreate = Partial<T>, TUpdate = Partial<T>>(
  config: CrudConfig<T, TCreate, TUpdate>
) {
  const list = useList<T>(config)
  const item = useItem<T>(config)
  const createHook = useCreate<T, TCreate>(config)
  const updateHook = useUpdate<T, TUpdate>(config)
  const deleteHook = useDelete<T>(config)

  return {
    // List operations
    items: list.data?.data || [],
    pagination: list.data?.pagination,
    isLoading: list.loading,
    error: list.error,
    fetchList: list.fetchList,
    
    // Single item operations
    currentItem: item.data,
    isLoadingItem: item.loading,
    fetchItem: item.fetchItem,
    
    // Create operations
    create: createHook.create,
    isCreating: createHook.isCreating,
    
    // Update operations
    update: updateHook.update,
    isUpdating: updateHook.isUpdating,
    
    // Delete operations
    deleteItem: deleteHook.deleteItem,
    isDeleting: deleteHook.isDeleting,
    
    // Refresh data
    refresh: () => {
      list.refetch()
    },
  }
}

/**
 * Hook for bulk operations
 */
export function useBulkOperations<T>(config: CrudConfig<T>) {
  const [state, setState] = useState<AsyncState<void>>({
    loading: false,
    error: null,
  })
  const { toast } = useToast()

  const bulkDelete = useCallback(
    async (ids: string[]) => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetch(`${config.endpoint}/bulk-delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ ids }),
        })

        if (!response.ok) {
          throw new Error(`Failed to delete ${config.resourceName}s`)
        }

        setState({
          loading: false,
          error: null,
        })

        toast({
          title: 'Success',
          description: `${ids.length} ${config.resourceName}(s) deleted successfully`,
        })

        return true
      } catch (error) {
        const err = error as Error
        logger.error(`Failed to bulk delete ${config.resourceName}s`, err)
        setState({
          loading: false,
          error: err,
        })
        
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        })
        
        throw err
      }
    },
    [config, toast]
  )

  const bulkUpdate = useCallback(
    async (ids: string[], updates: Partial<T>) => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetch(`${config.endpoint}/bulk-update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ ids, updates }),
        })

        if (!response.ok) {
          throw new Error(`Failed to update ${config.resourceName}s`)
        }

        setState({
          loading: false,
          error: null,
        })

        toast({
          title: 'Success',
          description: `${ids.length} ${config.resourceName}(s) updated successfully`,
        })

        return true
      } catch (error) {
        const err = error as Error
        logger.error(`Failed to bulk update ${config.resourceName}s`, err)
        setState({
          loading: false,
          error: err,
        })
        
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        })
        
        throw err
      }
    },
    [config, toast]
  )

  return {
    ...state,
    bulkDelete,
    bulkUpdate,
    isProcessing: state.loading,
  }
}