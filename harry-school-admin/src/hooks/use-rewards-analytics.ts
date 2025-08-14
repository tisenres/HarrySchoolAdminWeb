import { useState, useEffect } from 'react'
import { rewardsService, RewardsAnalytics } from '@/lib/services/rewards-service'

export function useRewardsAnalytics(dateFrom?: Date, dateTo?: Date) {
  const [analytics, setAnalytics] = useState<RewardsAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await rewardsService.getAnalytics(dateFrom, dateTo)
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [dateFrom, dateTo])

  const refetch = () => {
    fetchAnalytics()
  }

  return {
    analytics,
    isLoading,
    error,
    refetch
  }
}