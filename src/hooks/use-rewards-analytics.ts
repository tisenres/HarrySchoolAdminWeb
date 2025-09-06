import { useQuery } from '@tanstack/react-query'
import { rewardsService, RewardsAnalytics } from '@/lib/services/rewards-service'

export function useRewardsAnalytics(dateFrom?: Date, dateTo?: Date) {
  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ['rewards-analytics', dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: async () => {
      return await rewardsService.getAnalytics(dateFrom, dateTo)
    },
    staleTime: 0, // Always fresh for immediate updates
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  return {
    analytics,
    isLoading,
    error: error?.message || null,
    refetch
  }
}