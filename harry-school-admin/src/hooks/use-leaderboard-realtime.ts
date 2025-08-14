'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface RankingChangeNotification {
  organization_id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  timestamp: string
  student_id: string
}

interface UseLeaderboardRealtimeProps {
  organizationId: string
  onRankingChange?: (notification: RankingChangeNotification) => void
  onDataRefresh?: () => void
  enabled?: boolean
}

export function useLeaderboardRealtime({
  organizationId,
  onRankingChange,
  onDataRefresh,
  enabled = true
}: UseLeaderboardRealtimeProps) {
  const { toast } = useToast()
  const supabase = createClient()
  const subscriptionRef = useRef<any>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced refresh to avoid excessive API calls
  const debouncedRefresh = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      onDataRefresh?.()
    }, 1000) // Wait 1 second before refreshing
  }, [onDataRefresh])

  // Handle ranking change notifications
  const handleRankingChange = useCallback((payload: any) => {
    try {
      const notification: RankingChangeNotification = JSON.parse(payload.payload)
      
      // Only process notifications for our organization
      if (notification.organization_id !== organizationId) {
        return
      }

      // Call callback if provided
      onRankingChange?.(notification)

      // Trigger data refresh
      debouncedRefresh()

      // Show toast notification for significant changes
      if (notification.table === 'points_transactions') {
        toast({
          title: "Ranking Updated",
          description: "Student rankings have been updated",
          duration: 3000
        })
      }

    } catch (error) {
      console.error('Error processing ranking change notification:', error)
    }
  }, [organizationId, onRankingChange, debouncedRefresh, toast])

  useEffect(() => {
    if (!enabled) {
      return
    }

    // Subscribe to PostgreSQL notifications
    const channel = supabase
      .channel('ranking_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'points_transactions'
      }, (payload) => {
        handleRankingChange({ payload: JSON.stringify({
          organization_id: payload.new?.organization_id || payload.old?.organization_id,
          operation: payload.eventType.toUpperCase(),
          table: 'points_transactions',
          timestamp: new Date().toISOString(),
          student_id: payload.new?.student_id || payload.old?.student_id
        })})
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'student_achievements'
      }, (payload) => {
        handleRankingChange({ payload: JSON.stringify({
          organization_id: payload.new?.organization_id || payload.old?.organization_id,
          operation: payload.eventType.toUpperCase(),
          table: 'student_achievements',
          timestamp: new Date().toISOString(),
          student_id: payload.new?.student_id || payload.old?.student_id
        })})
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to leaderboard real-time updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to leaderboard updates')
          toast({
            title: "Connection Error",
            description: "Real-time updates may not work properly",
            variant: "destructive"
          })
        }
      })

    subscriptionRef.current = channel

    return () => {
      // Cleanup subscription
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
      
      // Cleanup debounce timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
  }, [enabled, organizationId, handleRankingChange, supabase, toast])

  // Manual refresh function
  const refreshData = useCallback(() => {
    onDataRefresh?.()
  }, [onDataRefresh])

  // Check connection status
  const isConnected = subscriptionRef.current?.state === 'joined'

  return {
    isConnected,
    refreshData
  }
}

// Hook for optimized leaderboard data fetching with caching
export function useOptimizedLeaderboard(organizationId: string) {
  const fetchWithCache = useCallback(async (filters: any) => {
    const startTime = Date.now()
    
    try {
      // Try cached version first for basic queries
      if (!filters.group_id && !filters.achievement_type && !filters.category) {
        const supabase = createClient()
        
        const { data: cachedData, error: cacheError } = await supabase
          .rpc('get_cached_leaderboard', {
            p_organization_id: organizationId,
            p_search: filters.search || null,
            p_limit: filters.limit || 50,
            p_offset: filters.offset || 0
          })

        if (!cacheError && cachedData) {
          const queryTime = Date.now() - startTime
          
          // Transform cached data to match expected format
          const students = cachedData[0]?.students || []
          const totalCount = cachedData[0]?.total_count || 0

          return {
            students: Array.isArray(students) ? students : [],
            total_count: totalCount,
            pagination: {
              current_page: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
              page_size: filters.limit || 50,
              total_pages: Math.ceil(totalCount / (filters.limit || 50)),
              total_count: totalCount
            },
            performance: {
              query_time_ms: queryTime,
              cached: true
            }
          }
        }
      }

      // Fall back to full leaderboard function for complex queries
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_optimized_leaderboard', {
        p_organization_id: organizationId,
        p_group_id: filters.group_id || null,
        p_time_period: filters.time_period || 'all',
        p_achievement_type: filters.achievement_type || null,
        p_category: filters.category || null,
        p_search: filters.search || null,
        p_limit: filters.limit || 50,
        p_offset: filters.offset || 0
      })

      if (error) {
        throw error
      }

      const queryTime = Date.now() - startTime
      const students = data?.[0]?.students || []
      const totalCount = data?.[0]?.total_count || 0

      return {
        students: Array.isArray(students) ? students : [],
        total_count: totalCount,
        pagination: {
          current_page: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
          page_size: filters.limit || 50,
          total_pages: Math.ceil(totalCount / (filters.limit || 50)),
          total_count: totalCount
        },
        performance: {
          query_time_ms: queryTime,
          cached: false
        }
      }

    } catch (error) {
      console.error('Optimized leaderboard fetch error:', error)
      throw error
    }
  }, [organizationId])

  return { fetchWithCache }
}