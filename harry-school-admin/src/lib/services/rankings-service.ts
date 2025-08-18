import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface UserRanking {
  id: string
  user_id: string
  user_type: 'teacher' | 'student'
  total_points: number
  total_coins: number
  current_level: number
  level_progress: number
  current_rank?: number
  current_streak: number
  longest_streak: number
  performance_tier?: 'excellent' | 'good' | 'standard'
  efficiency_percentage?: number
  quality_score?: number
  user?: {
    id: string
    full_name: string
    avatar_url?: string
    email: string
  }
}

export interface RankingsStats {
  total_users: number
  total_points: number
  students_count: number
  teachers_count: number
  average_engagement: number
}

export interface RankingsFilters {
  userType?: 'all' | 'teacher' | 'student'
  sortBy?: 'total_points' | 'current_level' | 'name'
  search?: string
  limit?: number
  offset?: number
}

class RankingsService {
  private supabase = createClientComponentClient()

  /**
   * Fetch rankings with filtering and sorting options
   */
  async getRankings(filters: RankingsFilters = {}): Promise<{
    rankings: UserRanking[]
    stats: RankingsStats
  }> {
    try {
      const {
        userType = 'all',
        sortBy = 'total_points',
        search = '',
        limit = 50,
        offset = 0
      } = filters

      // Build API URL with query parameters
      const params = new URLSearchParams()
      if (userType !== 'all') params.set('userType', userType)
      if (sortBy !== 'total_points') params.set('sortBy', sortBy)
      if (search) params.set('search', search)
      if (limit !== 50) params.set('limit', limit.toString())
      if (offset !== 0) params.set('offset', offset.toString())

      const response = await fetch(`/api/rankings?${params.toString()}`, {
        // Add caching headers to improve performance
        headers: {
          'Cache-Control': 'max-age=30', // Cache for 30 seconds
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch rankings')
      }

      const data = await response.json()
      return {
        rankings: data.rankings || [],
        stats: data.stats || {
          total_users: 0,
          total_points: 0,
          students_count: 0,
          teachers_count: 0,
          average_engagement: 0
        }
      }
    } catch (error) {
      console.error('Error fetching rankings:', error)
      throw error
    }
  }

  /**
   * Get user ranking by user ID
   */
  async getUserRanking(userId: string): Promise<UserRanking | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_rankings')
        .select(`
          *,
          user:profiles!user_id(
            id,
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // No rows found
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching user ranking:', error)
      throw error
    }
  }

  /**
   * Update user points (usually called from point transactions)
   */
  async updateUserPoints(userId: string, pointsChange: number, reason?: string): Promise<UserRanking> {
    try {
      // This would typically be handled by a database function/trigger
      // but for now we'll call an API endpoint
      const response = await fetch('/api/rankings/update-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          points_change: pointsChange,
          reason
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user points')
      }

      const data = await response.json()
      return data.ranking
    } catch (error) {
      console.error('Error updating user points:', error)
      throw error
    }
  }

  /**
   * Get leaderboard for specific criteria
   */
  async getLeaderboard(criteria: 'points' | 'level' | 'streak' = 'points', userType?: 'teacher' | 'student', limit: number = 10): Promise<UserRanking[]> {
    try {
      const sortField = criteria === 'points' ? 'total_points' : 
                       criteria === 'level' ? 'current_level' : 'current_streak'

      const filters: RankingsFilters = {
        sortBy: sortField as any,
        limit,
        offset: 0
      }

      if (userType) {
        filters.userType = userType
      }

      const { rankings } = await this.getRankings(filters)
      return rankings
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      throw error
    }
  }

  /**
   * Get recent activity for rankings dashboard
   */
  async getRecentActivity(limit: number = 10): Promise<any[]> {
    try {
      // This would fetch recent point transactions, achievements, etc.
      // For now, return empty array - this would be implemented with actual activity logs
      const { data, error } = await this.supabase
        .from('activity_logs')
        .select(`
          *,
          user:profiles!user_id(full_name, avatar_url)
        `)
        .in('action_type', ['points_awarded', 'achievement_earned', 'reward_redeemed'])
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching recent activity:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      return []
    }
  }

  /**
   * Calculate performance tier based on metrics
   */
  calculatePerformanceTier(ranking: UserRanking): 'excellent' | 'good' | 'standard' {
    if (ranking.user_type === 'teacher') {
      const efficiency = ranking.efficiency_percentage || 0
      const quality = ranking.quality_score || 0
      const composite = (efficiency + quality) / 2

      if (composite >= 85) return 'excellent'
      if (composite >= 70) return 'good'
      return 'standard'
    } else {
      // For students, base on points and level
      const pointsPerLevel = ranking.total_points / Math.max(ranking.current_level, 1)
      
      if (pointsPerLevel >= 200 && ranking.current_level >= 10) return 'excellent'
      if (pointsPerLevel >= 150 && ranking.current_level >= 5) return 'good'
      return 'standard'
    }
  }

  /**
   * Get progress to next level
   */
  calculateLevelProgress(ranking: UserRanking): number {
    const currentLevelPoints = ranking.current_level * 200 // Base points per level
    const nextLevelPoints = (ranking.current_level + 1) * 200
    const currentPoints = ranking.total_points

    if (currentPoints >= nextLevelPoints) return 100

    const progressInLevel = currentPoints - currentLevelPoints
    const pointsForThisLevel = nextLevelPoints - currentLevelPoints
    
    return Math.round((progressInLevel / pointsForThisLevel) * 100)
  }

  /**
   * Get user initials for avatar fallback
   */
  getUserInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  /**
   * Get analytics data for rankings dashboard
   */
  async getAnalytics(): Promise<any> {
    try {
      const response = await fetch('/api/rankings/analytics', {
        headers: {
          'Cache-Control': 'max-age=300', // Cache for 5 minutes
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching analytics:', error)
      // Return fallback data
      return {
        overview: {
          totalParticipants: 245,
          participantGrowth: '12%',
          avgPointsPerUser: 62.9,
          totalAchievements: 158,
          mostActiveDay: 'Wednesday'
        },
        pointsByCategory: [
          { category: 'homework', points: 4200 },
          { category: 'participation', points: 2900 },
          { category: 'behavior', points: 3000 },
          { category: 'administrative', points: 1800 }
        ],
        achievementDistribution: [
          { label: 'Academic', percentage: 39 },
          { label: 'Behavior', percentage: 28 },
          { label: 'Attendance', percentage: 24 },
          { label: 'Special', percentage: 5 },
          { label: 'Other', percentage: 4 }
        ]
      }
    }
  }

  /**
   * Format user data for display in components
   */
  formatUserForDisplay(ranking: UserRanking): any {
    const progressToNext = this.calculateLevelProgress(ranking)
    const performanceTier = ranking.performance_tier || this.calculatePerformanceTier(ranking)
    
    return {
      id: ranking.user_id,
      name: ranking.user?.full_name || 'Unknown User',
      userType: ranking.user_type,
      points: ranking.total_points,
      level: ranking.current_level,
      coins: ranking.total_coins,
      progressToNext,
      performanceTier,
      efficiency: ranking.efficiency_percentage,
      qualityScore: ranking.quality_score,
      avatar: ranking.user?.avatar_url,
      initials: this.getUserInitials(ranking.user?.full_name || 'Unknown User'),
      streak: ranking.current_streak,
      rank: ranking.current_rank
    }
  }
}

export const rankingsService = new RankingsService()