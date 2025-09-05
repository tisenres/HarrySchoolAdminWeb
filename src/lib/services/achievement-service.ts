import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Achievement, StudentAchievement, AchievementAwardRequest } from '@/types/ranking'
import type { CreateNotificationRequest } from '@/types/notification'

export interface AchievementFilters {
  type?: string
  status?: 'active' | 'inactive' | 'archived' | 'all'
  search?: string
  rarity?: string
}

export interface AchievementCreateData {
  name: string
  description?: string
  icon_name: string
  badge_color: string
  points_reward: number
  coins_reward: number
  achievement_type: 'homework' | 'attendance' | 'behavior' | 'streak' | 'milestone' | 'special'
  is_active: boolean
}

export interface AchievementUpdateData extends Partial<AchievementCreateData> {
  id: string
}

export interface AchievementAnalyticsData {
  achievement_id: string
  achievement_name: string
  icon_name: string
  badge_color: string
  achievement_type: string
  times_earned: number
  total_points_awarded: number
  total_coins_awarded: number
  unique_recipients: number
  first_earned: string
  last_earned: string
  completion_rate: number
}

export interface AchievementStats {
  total_achievements: number
  active_achievements: number
  total_points_awarded: number
  total_coins_awarded: number
  unique_recipients: number
  recent_activity: StudentAchievement[]
}

class AchievementService {
  private supabase = createClientComponentClient()

  /**
   * Fetch all achievements with filtering options
   */
  async getAchievements(filters: AchievementFilters = {}): Promise<{
    achievements: Achievement[]
    total: number
  }> {
    try {
      const { type, status = 'active', search, rarity } = filters

      // Build API URL with query parameters
      const params = new URLSearchParams()
      if (type && type !== 'all') params.set('type', type)
      if (status && status !== 'all') params.set('status', status)
      if (search) params.set('search', search)
      if (rarity && rarity !== 'all') params.set('rarity', rarity)

      const response = await fetch(`/api/achievements?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch achievements')
      }

      const data = await response.json()
      return {
        achievements: data.achievements || [],
        total: data.achievements?.length || 0
      }
    } catch (error) {
      console.error('Error fetching achievements:', error)
      throw error
    }
  }

  /**
   * Get a single achievement by ID
   */
  async getAchievement(id: string): Promise<Achievement | null> {
    try {
      const response = await fetch(`/api/achievements/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch achievement')
      }

      const data = await response.json()
      return data.achievement
    } catch (error) {
      console.error('Error fetching achievement:', error)
      throw error
    }
  }

  /**
   * Create a new achievement
   */
  async createAchievement(achievementData: AchievementCreateData): Promise<Achievement> {
    try {
      const response = await fetch('/api/achievements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(achievementData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create achievement')
      }

      const data = await response.json()
      return data.achievement
    } catch (error) {
      console.error('Error creating achievement:', error)
      throw error
    }
  }

  /**
   * Update an existing achievement
   */
  async updateAchievement(achievementData: AchievementUpdateData): Promise<Achievement> {
    try {
      const { id, ...updateData } = achievementData
      
      const response = await fetch(`/api/achievements/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update achievement')
      }

      const data = await response.json()
      return data.achievement
    } catch (error) {
      console.error('Error updating achievement:', error)
      throw error
    }
  }

  /**
   * Toggle achievement active status
   */
  async toggleAchievementStatus(id: string, isActive: boolean): Promise<Achievement> {
    try {
      return await this.updateAchievement({ id, is_active: isActive })
    } catch (error) {
      console.error('Error toggling achievement status:', error)
      throw error
    }
  }

  /**
   * Archive an achievement (soft delete)
   */
  async archiveAchievement(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/achievements/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to archive achievement')
      }
    } catch (error) {
      console.error('Error archiving achievement:', error)
      throw error
    }
  }

  /**
   * Restore an archived achievement
   */
  async restoreAchievement(id: string): Promise<Achievement> {
    try {
      const response = await fetch(`/api/achievements/${id}/restore`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to restore achievement')
      }

      const data = await response.json()
      return data.achievement
    } catch (error) {
      console.error('Error restoring achievement:', error)
      throw error
    }
  }

  /**
   * Permanently delete an achievement
   */
  async deleteAchievement(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/achievements/${id}?permanent=true`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete achievement')
      }
    } catch (error) {
      console.error('Error deleting achievement:', error)
      throw error
    }
  }

  /**
   * Duplicate an achievement
   */
  async duplicateAchievement(id: string, newName?: string): Promise<Achievement> {
    try {
      const originalAchievement = await this.getAchievement(id)
      if (!originalAchievement) {
        throw new Error('Achievement not found')
      }

      const duplicatedData: AchievementCreateData = {
        name: newName || `${originalAchievement.name} (Copy)`,
        description: originalAchievement.description,
        icon_name: originalAchievement.icon_name || '🏆',
        badge_color: originalAchievement.badge_color || '#4F7942',
        points_reward: originalAchievement.points_reward,
        coins_reward: originalAchievement.coins_reward,
        achievement_type: originalAchievement.achievement_type as any,
        is_active: false, // Start as inactive for review
      }

      return await this.createAchievement(duplicatedData)
    } catch (error) {
      console.error('Error duplicating achievement:', error)
      throw error
    }
  }

  /**
   * Award achievement to students
   */
  async awardAchievement(awardData: AchievementAwardRequest): Promise<{
    awarded_count: number
    skipped_count: number
    achievements: StudentAchievement[]
  }> {
    try {
      const response = await fetch('/api/achievements/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(awardData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to award achievement')
      }

      const data = await response.json()
      
      // Create notifications for awarded achievements
      if (data.achievements && data.achievements.length > 0) {
        await this.createAchievementNotifications(data.achievements)
      }

      return {
        awarded_count: data.awarded_count,
        skipped_count: data.skipped_count,
        achievements: data.achievements,
      }
    } catch (error) {
      console.error('Error awarding achievement:', error)
      throw error
    }
  }

  /**
   * Create notifications for awarded achievements
   */
  private async createAchievementNotifications(achievements: StudentAchievement[]): Promise<void> {
    try {
      for (const studentAchievement of achievements) {
        // Get student info for notification
        const { data: student } = await this.supabase
          .from('students')
          .select('id, full_name, student_id')
          .eq('id', studentAchievement.student_id)
          .single()

        if (!student) continue

        // Get achievement info for notification
        const achievement = await this.getAchievement(studentAchievement.achievement_id)
        if (!achievement) continue

        // Create notification request
        const notificationRequest: CreateNotificationRequest = {
          type: 'achievement',
          title: `🎉 Achievement Unlocked: ${achievement.name}!`,
          message: `Congratulations! You've earned the "${achievement.name}" achievement and received ${achievement.points_reward} points and ${achievement.coins_reward} coins!`,
          priority: this.getNotificationPriority(achievement.achievement_type),
          action_url: `/dashboard/achievements/${achievement.id}`,
          related_student_id: student.id,
          metadata: {
            achievement_id: achievement.id,
            achievement_name: achievement.name,
            achievement_type: achievement.achievement_type,
            points_earned: achievement.points_reward,
            coins_earned: achievement.coins_reward,
            icon: achievement.icon_name,
            badge_color: achievement.badge_color,
            earned_at: studentAchievement.earned_at,
            rarity: this.getAchievementRarity(achievement.achievement_type).label
          }
        }

        // Send notification
        await this.sendNotification(notificationRequest)
      }
    } catch (error) {
      console.error('Error creating achievement notifications:', error)
      // Don't throw - notifications are not critical for achievement awarding
    }
  }

  /**
   * Send notification via API
   */
  private async sendNotification(notificationRequest: CreateNotificationRequest): Promise<void> {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationRequest),
      })

      if (!response.ok) {
        console.error('Failed to send achievement notification:', await response.text())
      }
    } catch (error) {
      console.error('Error sending achievement notification:', error)
    }
  }

  /**
   * Get notification priority based on achievement type
   */
  private getNotificationPriority(achievementType: string): 'low' | 'normal' | 'high' | 'urgent' {
    switch (achievementType) {
      case 'special':
        return 'high'
      case 'milestone':
        return 'high'
      case 'streak':
        return 'normal'
      case 'homework':
      case 'attendance':
      case 'behavior':
      default:
        return 'normal'
    }
  }

  /**
   * Bulk award achievements with notifications
   */
  async bulkAwardAchievements(awards: AchievementAwardRequest[]): Promise<{
    total_awarded: number
    total_skipped: number
    achievements: StudentAchievement[]
  }> {
    try {
      let totalAwarded = 0
      let totalSkipped = 0
      const allAchievements: StudentAchievement[] = []

      // Process awards in batches to avoid overwhelming the notification system
      const batchSize = 10
      for (let i = 0; i < awards.length; i += batchSize) {
        const batch = awards.slice(i, i + batchSize)
        
        const batchPromises = batch.map(async (award) => {
          try {
            const result = await this.awardAchievement(award)
            totalAwarded += result.awarded_count
            totalSkipped += result.skipped_count
            allAchievements.push(...result.achievements)
            return result
          } catch (error) {
            console.error('Error in batch award:', error)
            totalSkipped += 1
            return null
          }
        })

        await Promise.all(batchPromises)
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < awards.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      return {
        total_awarded: totalAwarded,
        total_skipped: totalSkipped,
        achievements: allAchievements
      }
    } catch (error) {
      console.error('Error in bulk award achievements:', error)
      throw error
    }
  }

  /**
   * Create ceremony achievement notifications
   */
  async createCeremonyNotifications(ceremonyId: string, achievements: StudentAchievement[]): Promise<void> {
    try {
      // Group achievements by student
      const studentAchievements = achievements.reduce((acc, achievement) => {
        if (!acc[achievement.student_id]) {
          acc[achievement.student_id] = []
        }
        acc[achievement.student_id].push(achievement)
        return acc
      }, {} as Record<string, StudentAchievement[]>)

      // Create ceremony invitation notifications
      for (const [studentId, studentAchievements] of Object.entries(studentAchievements)) {
        const { data: student } = await this.supabase
          .from('students')
          .select('id, full_name, student_id')
          .eq('id', studentId)
          .single()

        if (!student) continue

        const achievementCount = studentAchievements.length
        const achievementNames = studentAchievements
          .slice(0, 3) // Show first 3 achievements
          .map(sa => {
            // We'd need to fetch achievement names, but for now use IDs
            return `Achievement ${sa.achievement_id.slice(-4)}`
          })
          .join(', ')

        const moreText = achievementCount > 3 ? ` and ${achievementCount - 3} more` : ''

        const notificationRequest: CreateNotificationRequest = {
          type: 'achievement',
          title: '🎭 Achievement Ceremony Invitation',
          message: `You're invited to the achievement ceremony! You'll be recognized for: ${achievementNames}${moreText}.`,
          priority: 'high',
          action_url: `/dashboard/ceremonies/${ceremonyId}`,
          related_student_id: student.id,
          metadata: {
            ceremony_id: ceremonyId,
            achievement_count: achievementCount,
            achievement_ids: studentAchievements.map(sa => sa.achievement_id),
            ceremony_type: 'achievement_recognition'
          }
        }

        await this.sendNotification(notificationRequest)
      }
    } catch (error) {
      console.error('Error creating ceremony notifications:', error)
    }
  }

  /**
   * Get achievement analytics data
   */
  async getAchievementAnalytics(timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<{
    analytics: AchievementAnalyticsData[]
    stats: AchievementStats
  }> {
    try {
      const response = await fetch(`/api/achievements/analytics?range=${timeRange}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch achievement analytics')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching achievement analytics:', error)
      throw error
    }
  }

  /**
   * Get student achievements for a specific student
   */
  async getStudentAchievements(studentId: string): Promise<StudentAchievement[]> {
    try {
      const { data, error } = await this.supabase
        .from('student_achievements')
        .select(`
          *,
          achievement:achievements(*),
          awarded_by_profile:profiles!awarded_by(full_name, avatar_url)
        `)
        .eq('student_id', studentId)
        .is('deleted_at', null)
        .order('earned_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching student achievements:', error)
      throw error
    }
  }

  /**
   * Get achievement recipients
   */
  async getAchievementRecipients(achievementId: string): Promise<StudentAchievement[]> {
    try {
      const { data, error } = await this.supabase
        .from('student_achievements')
        .select(`
          *,
          student:students(id, full_name, avatar_url),
          awarded_by_profile:profiles!awarded_by(full_name, avatar_url)
        `)
        .eq('achievement_id', achievementId)
        .is('deleted_at', null)
        .order('earned_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching achievement recipients:', error)
      throw error
    }
  }

  /**
   * Bulk create achievements from templates
   */
  async bulkCreateAchievements(achievements: AchievementCreateData[]): Promise<Achievement[]> {
    try {
      const createdAchievements: Achievement[] = []
      
      for (const achievementData of achievements) {
        const achievement = await this.createAchievement(achievementData)
        createdAchievements.push(achievement)
      }

      return createdAchievements
    } catch (error) {
      console.error('Error bulk creating achievements:', error)
      throw error
    }
  }

  /**
   * Get achievement templates
   */
  getAchievementTemplates(): AchievementCreateData[] {
    return [
      {
        name: 'Perfect Attendance',
        description: 'Attended all classes for a full month without any absences',
        icon_name: '📅',
        badge_color: '#4F7942',
        points_reward: 100,
        coins_reward: 50,
        achievement_type: 'attendance',
        is_active: true,
      },
      {
        name: 'Homework Champion',
        description: 'Completed all homework assignments for two consecutive weeks',
        icon_name: '📚',
        badge_color: '#8B5CF6',
        points_reward: 75,
        coins_reward: 25,
        achievement_type: 'homework',
        is_active: true,
      },
      {
        name: 'Class Helper',
        description: 'Consistently helped classmates and showed excellent behavior',
        icon_name: '🤝',
        badge_color: '#F59E0B',
        points_reward: 60,
        coins_reward: 30,
        achievement_type: 'behavior',
        is_active: true,
      },
      {
        name: 'Study Streak Master',
        description: 'Maintained a 10-day consecutive study streak',
        icon_name: '⚡',
        badge_color: '#EF4444',
        points_reward: 120,
        coins_reward: 60,
        achievement_type: 'streak',
        is_active: true,
      },
      {
        name: 'Level Master',
        description: 'Reached a new level in the ranking system',
        icon_name: '🎯',
        badge_color: '#06B6D4',
        points_reward: 200,
        coins_reward: 100,
        achievement_type: 'milestone',
        is_active: true,
      },
      {
        name: 'Student of the Month',
        description: 'Outstanding performance and dedication throughout the month',
        icon_name: '👑',
        badge_color: '#8B5CF6',
        points_reward: 300,
        coins_reward: 150,
        achievement_type: 'special',
        is_active: true,
      },
    ]
  }

  /**
   * Get achievement rarity information
   */
  getAchievementRarity(type: string) {
    switch (type) {
      case 'special': 
        return { 
          label: 'Legendary', 
          level: 'legendary',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          bgGradient: 'from-purple-500 to-pink-500',
          multiplier: 3
        }
      case 'milestone': 
        return { 
          label: 'Epic', 
          level: 'epic',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          bgGradient: 'from-orange-500 to-red-500',
          multiplier: 2
        }
      case 'streak': 
        return { 
          label: 'Rare', 
          level: 'rare',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          bgGradient: 'from-blue-500 to-cyan-500',
          multiplier: 1.5
        }
      default: 
        return { 
          label: 'Common', 
          level: 'common',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          bgGradient: 'from-gray-500 to-gray-600',
          multiplier: 1
        }
    }
  }

  /**
   * Validate achievement data
   */
  validateAchievementData(data: Partial<AchievementCreateData>): string[] {
    const errors: string[] = []

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Achievement name is required')
    } else if (data.name.length > 100) {
      errors.push('Achievement name must be 100 characters or less')
    }

    if (!data.icon_name || data.icon_name.trim().length === 0) {
      errors.push('Achievement icon is required')
    }

    if (!data.badge_color || data.badge_color.trim().length === 0) {
      errors.push('Badge color is required')
    }

    if (data.points_reward !== undefined && (data.points_reward < 0 || data.points_reward > 1000)) {
      errors.push('Points reward must be between 0 and 1000')
    }

    if (data.coins_reward !== undefined && (data.coins_reward < 0 || data.coins_reward > 500)) {
      errors.push('Coins reward must be between 0 and 500')
    }

    if (data.achievement_type && !['homework', 'attendance', 'behavior', 'streak', 'milestone', 'special'].includes(data.achievement_type)) {
      errors.push('Invalid achievement type')
    }

    return errors
  }
}

export const achievementService = new AchievementService()