/**
 * Admin Referral Service for Harry School CRM
 * Provides referral management functionality for administrators
 * Integrates with existing service patterns
 */

import { supabase } from '@/lib/supabase-client'
import type { 
  StudentReferral, 
  ReferralAnalytics, 
  ReferralSummary 
} from '@/types/referral'

export interface AdminReferralFilters {
  status?: 'pending' | 'contacted' | 'enrolled' | 'declined'
  referrer_type?: 'student' | 'teacher'
  date_range?: {
    start: string
    end: string
  }
  organization_id?: string
}

export interface AdminReferralStats {
  total_referrals: number
  pending_referrals: number
  contacted_referrals: number
  enrolled_referrals: number
  declined_referrals: number
  conversion_rate: number
  pending_contact_queue: number
  recent_activity: StudentReferral[]
}

export interface BulkReferralAction {
  referral_ids: string[]
  action: 'contact' | 'enroll' | 'decline' | 'delete'
  notes?: string
  enrolled_student_id?: string
}

class ReferralAdminService {
  private supabaseClient = supabase

  /**
   * Get referrals with admin filtering and pagination
   */
  async getReferrals(
    filters: AdminReferralFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    try {
      let query = this.supabaseClient
        .from('student_referrals')
        .select(`
          *,
          enrolled_student:students(id, full_name, student_id),
          created_by_profile:profiles(full_name, avatar_url)
        `)
        .eq('organization_id', filters.organization_id || '')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.referrer_type) {
        query = query.eq('referrer_type', filters.referrer_type)
      }

      if (filters.date_range) {
        query = query
          .gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end)
      }

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data as StudentReferral[],
        count: count || 0,
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      }
    } catch (error) {
      console.error('Error fetching referrals:', error)
      throw error
    }
  }

  /**
   * Get admin referral statistics for dashboard
   */
  async getAdminStats(organization_id: string): Promise<AdminReferralStats> {
    try {
      const { data: referrals, error } = await this.supabaseClient
        .from('student_referrals')
        .select('*')
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const totalReferrals = referrals?.length || 0
      const pendingReferrals = referrals?.filter(r => r.status === 'pending').length || 0
      const contactedReferrals = referrals?.filter(r => r.status === 'contacted').length || 0
      const enrolledReferrals = referrals?.filter(r => r.status === 'enrolled').length || 0
      const declinedReferrals = referrals?.filter(r => r.status === 'declined').length || 0

      return {
        total_referrals: totalReferrals,
        pending_referrals: pendingReferrals,
        contacted_referrals: contactedReferrals,
        enrolled_referrals: enrolledReferrals,
        declined_referrals: declinedReferrals,
        conversion_rate: totalReferrals > 0 ? (enrolledReferrals / totalReferrals) * 100 : 0,
        pending_contact_queue: pendingReferrals,
        recent_activity: referrals?.slice(0, 5) || []
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      throw error
    }
  }

  /**
   * Get pending referrals that need administrative contact
   */
  async getPendingReferrals(organization_id: string, limit: number = 10) {
    try {
      const { data, error } = await this.supabaseClient
        .from('student_referrals')
        .select(`
          *,
          created_by_profile:profiles(full_name, avatar_url)
        `)
        .eq('organization_id', organization_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) throw error

      return data as StudentReferral[]
    } catch (error) {
      console.error('Error fetching pending referrals:', error)
      throw error
    }
  }

  /**
   * Update referral status (admin action)
   */
  async updateReferralStatus(
    referralId: string,
    status: 'contacted' | 'enrolled' | 'declined',
    updates: {
      contact_notes?: string
      enrolled_student_id?: string
      updated_by: string
    }
  ) {
    try {
      const { data, error } = await this.supabaseClient
        .from('student_referrals')
        .update({
          status,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', referralId)
        .select()
        .single()

      if (error) throw error

      // If enrolled, award points to referrer
      if (status === 'enrolled' && data) {
        await this.awardReferralPoints(data as StudentReferral)
      }

      return data as StudentReferral
    } catch (error) {
      console.error('Error updating referral status:', error)
      throw error
    }
  }

  /**
   * Bulk update referral statuses
   */
  async bulkUpdateReferrals(action: BulkReferralAction) {
    try {
      const updates: any = {
        updated_at: new Date().toISOString()
      }

      switch (action.action) {
        case 'contact':
          updates.status = 'contacted'
          if (action.notes) updates.contact_notes = action.notes
          break
        case 'enroll':
          updates.status = 'enrolled'
          if (action.enrolled_student_id) {
            updates.enrolled_student_id = action.enrolled_student_id
          }
          break
        case 'decline':
          updates.status = 'declined'
          if (action.notes) updates.contact_notes = action.notes
          break
        case 'delete':
          // Handle deletion separately
          const { error: deleteError } = await this.supabaseClient
            .from('student_referrals')
            .delete()
            .in('id', action.referral_ids)

          if (deleteError) throw deleteError
          return { success: true, deleted_count: action.referral_ids.length }
      }

      if (action.action !== 'delete') {
        const { data, error } = await this.supabaseClient
          .from('student_referrals')
          .update(updates)
          .in('id', action.referral_ids)
          .select()

        if (error) throw error

        // Award points for enrolled referrals
        if (action.action === 'enroll' && data) {
          for (const referral of data as StudentReferral[]) {
            await this.awardReferralPoints(referral)
          }
        }

        return { success: true, updated_count: data.length, data }
      }
    } catch (error) {
      console.error('Error bulk updating referrals:', error)
      throw error
    }
  }

  /**
   * Get referral analytics for admin dashboard
   */
  async getReferralAnalytics(
    organization_id: string,
    date_range?: { start: string; end: string }
  ): Promise<ReferralAnalytics> {
    try {
      let query = this.supabaseClient
        .from('student_referrals')
        .select('*')
        .eq('organization_id', organization_id)

      if (date_range) {
        query = query
          .gte('created_at', date_range.start)
          .lte('created_at', date_range.end)
      }

      const { data: referrals, error } = await query

      if (error) throw error

      // Calculate analytics
      const totalReferrals = referrals?.length || 0
      const successfulConversions = referrals?.filter(r => r.status === 'enrolled').length || 0
      const conversionRate = totalReferrals > 0 ? (successfulConversions / totalReferrals) * 100 : 0
      const totalPointsEarned = referrals?.reduce((sum, r) => sum + r.points_awarded, 0) || 0

      // Group by month for breakdown
      const monthlyBreakdown = this.generateMonthlyBreakdown(referrals || [])

      // Get top referrers
      const topReferrers = this.calculateTopReferrers(referrals || [])

      return {
        total_referrals: totalReferrals,
        successful_conversions: successfulConversions,
        conversion_rate: conversionRate,
        total_points_earned: totalPointsEarned,
        monthly_breakdown: monthlyBreakdown,
        top_referrers: topReferrers,
        referral_sources: [
          { source: 'Student Referrals', count: totalReferrals, percentage: 100 }
        ]
      }
    } catch (error) {
      console.error('Error fetching referral analytics:', error)
      throw error
    }
  }

  /**
   * Award points for successful referral
   */
  private async awardReferralPoints(referral: StudentReferral) {
    try {
      // Award 100 points for successful referral (configurable)
      const pointsToAward = 100

      // Create points transaction
      const { data: transaction, error: transactionError } = await this.supabaseClient
        .from('points_transactions')
        .insert({
          user_id: referral.referrer_id,
          points_amount: pointsToAward,
          transaction_type: 'earned',
          category: 'referral',
          subcategory: 'successful_enrollment',
          reference_type: 'student_referral',
          reference_id: referral.id,
          organization_id: referral.organization_id,
          created_by: 'system'
        })
        .select()
        .single()

      if (transactionError) throw transactionError

      // Update referral with points info
      await this.supabaseClient
        .from('student_referrals')
        .update({
          points_awarded: pointsToAward,
          points_transaction_id: transaction.id
        })
        .eq('id', referral.id)

      // Update user ranking
      await this.supabaseClient.rpc('update_user_ranking_points', {
        p_user_id: referral.referrer_id,
        p_points_change: pointsToAward,
        p_organization_id: referral.organization_id
      })

    } catch (error) {
      console.error('Error awarding referral points:', error)
      // Don't throw - this shouldn't block the main operation
    }
  }

  /**
   * Generate monthly breakdown for analytics
   */
  private generateMonthlyBreakdown(referrals: StudentReferral[]) {
    const monthlyData: { [key: string]: { referrals: number; conversions: number; points: number } } = {}

    referrals.forEach(referral => {
      const date = new Date(referral.created_at)
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { referrals: 0, conversions: 0, points: 0 }
      }

      monthlyData[monthKey].referrals++
      if (referral.status === 'enrolled') {
        monthlyData[monthKey].conversions++
        monthlyData[monthKey].points += referral.points_awarded
      }
    })

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      referrals: data.referrals,
      conversions: data.conversions,
      points: data.points
    }))
  }

  /**
   * Calculate top referrers for analytics
   */
  private calculateTopReferrers(referrals: StudentReferral[]) {
    const referrerData: { [key: string]: any } = {}

    referrals.forEach(referral => {
      const key = referral.referrer_id
      if (!referrerData[key]) {
        referrerData[key] = {
          referrer_id: referral.referrer_id,
          referrer_name: 'Unknown', // This would be populated from relations
          referrer_type: referral.referrer_type,
          total_referrals: 0,
          successful_referrals: 0,
          points_earned: 0
        }
      }

      referrerData[key].total_referrals++
      if (referral.status === 'enrolled') {
        referrerData[key].successful_referrals++
        referrerData[key].points_earned += referral.points_awarded
      }
    })

    return Object.values(referrerData).map((data: any) => ({
      ...data,
      conversion_rate: data.total_referrals > 0 ? (data.successful_referrals / data.total_referrals) * 100 : 0
    }))
  }

  /**
   * Get student referral summary for student profile
   */
  async getStudentReferralSummary(studentId: string): Promise<ReferralSummary | null> {
    try {
      const { data: referrals, error } = await this.supabaseClient
        .from('student_referrals')
        .select('*')
        .eq('referrer_id', studentId)
        .eq('referrer_type', 'student')

      if (error) throw error

      if (!referrals || referrals.length === 0) {
        return null
      }

      const totalReferrals = referrals.length
      const successfulReferrals = referrals.filter(r => r.status === 'enrolled').length
      const pendingReferrals = referrals.filter(r => r.status === 'pending').length
      const conversionRate = totalReferrals > 0 ? (successfulReferrals / totalReferrals) * 100 : 0
      const pointsEarned = referrals.reduce((sum, r) => sum + r.points_awarded, 0)

      return {
        total_referrals: totalReferrals,
        successful_referrals: successfulReferrals,
        pending_referrals: pendingReferrals,
        conversion_rate: conversionRate,
        points_earned: pointsEarned,
        recent_referrals: referrals.slice(0, 5)
      }
    } catch (error) {
      console.error('Error fetching student referral summary:', error)
      return null
    }
  }
}

export const referralAdminService = new ReferralAdminService()