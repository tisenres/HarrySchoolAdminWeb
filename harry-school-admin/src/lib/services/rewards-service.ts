import { getSupabaseClient } from '@/lib/supabase-client'
import { Database } from '@/types/database'
import { RewardsCatalogItem, RewardRedemption } from '@/types/ranking'

type RewardsCatalog = Database['public']['Tables']['rewards_catalog']['Row']
type RewardsCatalogInsert = Database['public']['Tables']['rewards_catalog']['Insert']
type RewardsCatalogUpdate = Database['public']['Tables']['rewards_catalog']['Update']

type RewardRedemptionRow = Database['public']['Tables']['reward_redemptions']['Row']
type RewardRedemptionInsert = Database['public']['Tables']['reward_redemptions']['Insert']
type RewardRedemptionUpdate = Database['public']['Tables']['reward_redemptions']['Update']

export interface RewardFilters {
  search?: string
  reward_type?: string
  reward_category?: string
  is_active?: boolean
  is_featured?: boolean
  min_cost?: number
  max_cost?: number
}

export interface RedemptionFilters {
  status?: string
  student_id?: string
  reward_id?: string
  date_from?: Date
  date_to?: Date
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface RewardWithStats extends RewardsCatalogItem {
  stats?: {
    total_redemptions: number
    pending_redemptions: number
    approved_redemptions: number
    delivered_redemptions: number
  }
}

export interface RedemptionWithDetails extends RewardRedemption {
  reward?: RewardsCatalogItem
  student?: {
    id: string
    full_name: string
    first_name: string
    last_name: string
    primary_phone?: string
    email?: string
  }
  approved_by_profile?: {
    full_name: string
  }
  delivered_by_profile?: {
    full_name: string
  }
}

export interface RewardsAnalytics {
  overview: {
    total_rewards: number
    total_redemptions: number
    pending_redemptions: number
    total_coins_spent: number
    active_students: number
    avg_approval_time_hours: number
  }
  popular_rewards: Array<{
    reward_id: string
    reward_name: string
    reward_type: string
    coin_cost: number
    redemption_count: number
    total_coins_spent: number
  }>
  redemptions_by_status: Record<string, number>
  redemptions_by_type: Record<string, number>
  daily_trends: Array<{
    date: string
    redemptions: number
    coins_spent: number
  }>
  top_students: Array<{
    student_id: string
    student_name: string
    redemption_count: number
    total_coins_spent: number
  }>
  period: {
    from: string
    to: string
  }
}

class RewardsService {
  private supabase = getSupabaseClient()

  // Rewards Catalog Management
  async getRewards(filters: RewardFilters & PaginationParams = {}) {
    const {
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc',
      ...filterParams
    } = filters

    try {
      const response = await fetch(`/api/rewards?${new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by,
        sort_order,
        ...Object.fromEntries(
          Object.entries(filterParams).filter(([_, v]) => v !== undefined && v !== '')
        )
      })}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch rewards')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching rewards:', error)
      throw error
    }
  }

  async getReward(id: string): Promise<RewardWithStats> {
    try {
      const response = await fetch(`/api/rewards/${id}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch reward')
      }

      const data = await response.json()
      return data.reward
    } catch (error) {
      console.error('Error fetching reward:', error)
      throw error
    }
  }

  async createReward(data: Omit<RewardsCatalogInsert, 'organization_id' | 'created_by'>): Promise<RewardsCatalogItem> {
    try {
      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create reward')
      }

      const result = await response.json()
      return result.reward
    } catch (error) {
      console.error('Error creating reward:', error)
      throw error
    }
  }

  async updateReward(id: string, data: Partial<RewardsCatalogUpdate>): Promise<RewardsCatalogItem> {
    try {
      const response = await fetch(`/api/rewards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update reward')
      }

      const result = await response.json()
      return result.reward
    } catch (error) {
      console.error('Error updating reward:', error)
      throw error
    }
  }

  async deleteReward(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/rewards/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete reward')
      }
    } catch (error) {
      console.error('Error deleting reward:', error)
      throw error
    }
  }

  // Reward Redemptions Management
  async getRedemptions(filters: RedemptionFilters & PaginationParams = {}) {
    const {
      page = 1,
      limit = 20,
      sort_by = 'redeemed_at',
      sort_order = 'desc',
      ...filterParams
    } = filters

    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by,
        sort_order,
      })

      // Add filters
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          if (value instanceof Date) {
            searchParams.append(key, value.toISOString())
          } else {
            searchParams.append(key, value.toString())
          }
        }
      })

      const response = await fetch(`/api/rewards/redemptions?${searchParams}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch redemptions')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching redemptions:', error)
      throw error
    }
  }

  async getRedemption(id: string): Promise<RedemptionWithDetails> {
    try {
      const response = await fetch(`/api/rewards/redemptions/${id}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch redemption')
      }

      const data = await response.json()
      return data.redemption
    } catch (error) {
      console.error('Error fetching redemption:', error)
      throw error
    }
  }

  async createRedemption(data: {
    reward_id: string
    student_id: string
    request_notes?: string
    delivery_method?: string
    delivery_address?: string
  }): Promise<RedemptionWithDetails> {
    try {
      const response = await fetch('/api/rewards/redemptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create redemption')
      }

      const result = await response.json()
      return result.redemption
    } catch (error) {
      console.error('Error creating redemption:', error)
      throw error
    }
  }

  async updateRedemption(id: string, data: {
    status?: 'pending' | 'approved' | 'delivered' | 'cancelled' | 'rejected'
    admin_notes?: string
    delivery_date?: string
    delivery_address?: string
    tracking_number?: string
    certificate_number?: string
  }): Promise<RedemptionWithDetails> {
    try {
      const response = await fetch(`/api/rewards/redemptions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update redemption')
      }

      const result = await response.json()
      return result.redemption
    } catch (error) {
      console.error('Error updating redemption:', error)
      throw error
    }
  }

  async cancelRedemption(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/rewards/redemptions/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel redemption')
      }
    } catch (error) {
      console.error('Error cancelling redemption:', error)
      throw error
    }
  }

  // Bulk operations
  async approveMultipleRedemptions(redemptionIds: string[], adminNotes?: string): Promise<void> {
    try {
      const promises = redemptionIds.map(id => 
        this.updateRedemption(id, { 
          status: 'approved', 
          admin_notes: adminNotes 
        })
      )
      
      await Promise.all(promises)
    } catch (error) {
      console.error('Error approving multiple redemptions:', error)
      throw error
    }
  }

  async markMultipleAsDelivered(redemptionIds: string[], deliveryDate?: Date): Promise<void> {
    try {
      const promises = redemptionIds.map(id => 
        this.updateRedemption(id, { 
          status: 'delivered',
          delivery_date: deliveryDate?.toISOString() || new Date().toISOString()
        })
      )
      
      await Promise.all(promises)
    } catch (error) {
      console.error('Error marking multiple as delivered:', error)
      throw error
    }
  }

  // Analytics and Insights
  async getAnalytics(dateFrom?: Date, dateTo?: Date): Promise<RewardsAnalytics> {
    try {
      const searchParams = new URLSearchParams()
      
      if (dateFrom) {
        searchParams.append('date_from', dateFrom.toISOString())
      }
      if (dateTo) {
        searchParams.append('date_to', dateTo.toISOString())
      }

      const response = await fetch(`/api/rewards/analytics?${searchParams}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch analytics')
      }

      const data = await response.json()
      return data.analytics
    } catch (error) {
      console.error('Error fetching analytics:', error)
      throw error
    }
  }

  // Student-specific methods
  async getStudentEligibleRewards(studentId: string): Promise<RewardsCatalogItem[]> {
    try {
      const { data: rewards, error } = await this.supabase
        .from('rewards_catalog')
        .select('*')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('display_order')
        .order('coin_cost')

      if (error) throw error

      // Filter rewards based on eligibility
      const eligibleRewards = []
      for (const reward of rewards || []) {
        const { data: canRedeem } = await this.supabase.rpc('can_redeem_reward', {
          p_student_id: studentId,
          p_reward_id: reward.id
        })

        if (canRedeem) {
          eligibleRewards.push(reward)
        }
      }

      return eligibleRewards
    } catch (error) {
      console.error('Error fetching eligible rewards:', error)
      throw error
    }
  }

  async getStudentCoinBalance(studentId: string): Promise<number> {
    try {
      const { data: balance, error } = await this.supabase.rpc('get_student_coin_balance', {
        p_student_id: studentId
      })

      if (error) throw error
      return balance || 0
    } catch (error) {
      console.error('Error fetching student coin balance:', error)
      throw error
    }
  }

  async getStudentRedemptionHistory(studentId: string, limit = 10): Promise<RedemptionWithDetails[]> {
    try {
      const { data: redemptions, error } = await this.supabase
        .from('reward_redemptions')
        .select(`
          *,
          reward:rewards_catalog(id, name, reward_type, coin_cost, image_url),
          approved_by_profile:profiles!reward_redemptions_approved_by_fkey(full_name)
        `)
        .eq('student_id', studentId)
        .is('deleted_at', null)
        .order('redeemed_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return redemptions || []
    } catch (error) {
      console.error('Error fetching student redemption history:', error)
      throw error
    }
  }

  // Utility methods
  async checkRewardEligibility(studentId: string, rewardId: string): Promise<{
    canRedeem: boolean
    reason?: string
    coinBalance?: number
    coinCost?: number
  }> {
    try {
      // Get student coin balance
      const coinBalance = await this.getStudentCoinBalance(studentId)

      // Get reward details
      const reward = await this.getReward(rewardId)

      // Check basic eligibility
      if (!reward.is_active) {
        return { canRedeem: false, reason: 'Reward is not active', coinBalance, coinCost: reward.coin_cost }
      }

      if (coinBalance < reward.coin_cost) {
        return { canRedeem: false, reason: 'Insufficient coins', coinBalance, coinCost: reward.coin_cost }
      }

      // Use database function for comprehensive check
      const { data: canRedeem, error } = await this.supabase.rpc('can_redeem_reward', {
        p_student_id: studentId,
        p_reward_id: rewardId
      })

      if (error) throw error

      return { 
        canRedeem: canRedeem || false,
        reason: canRedeem ? undefined : 'Eligibility requirements not met',
        coinBalance,
        coinCost: reward.coin_cost
      }
    } catch (error) {
      console.error('Error checking reward eligibility:', error)
      throw error
    }
  }

  // Validation helpers
  validateRewardData(data: Partial<RewardsCatalogInsert>): string[] {
    const errors: string[] = []

    if (data.name && (data.name.length < 1 || data.name.length > 255)) {
      errors.push('Name must be between 1 and 255 characters')
    }

    if (data.coin_cost !== undefined && (data.coin_cost < 1 || data.coin_cost > 10000)) {
      errors.push('Coin cost must be between 1 and 10,000')
    }

    if (data.inventory_quantity !== undefined && data.inventory_quantity < 1) {
      errors.push('Inventory quantity must be at least 1')
    }

    if (data.max_redemptions_per_student !== undefined && data.max_redemptions_per_student < 1) {
      errors.push('Max redemptions per student must be at least 1')
    }

    if (data.valid_from && data.valid_until) {
      const fromDate = new Date(data.valid_from)
      const untilDate = new Date(data.valid_until)
      if (fromDate >= untilDate) {
        errors.push('Valid until date must be after valid from date')
      }
    }

    return errors
  }
}

export const rewardsService = new RewardsService()
export default rewardsService