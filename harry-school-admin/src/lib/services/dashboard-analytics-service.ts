/**
 * Dashboard Analytics Service for Harry School CRM
 * Integrates referral analytics with existing organizational metrics
 */

import { supabase } from '@/lib/supabase-client'
import { referralAdminService } from './referral-admin-service'
import type { ReferralAnalytics } from '@/types/referral'

export interface DashboardAnalytics {
  // Existing metrics
  totalStudents: number
  activeStudents: number
  totalGroups: number
  activeGroups: number
  totalTeachers: number
  activeTeachers: number
  recentEnrollments: number
  upcomingClasses: number
  outstandingBalance: number
  monthlyRevenue: number
  studentGrowth: number
  groupGrowth: number
  revenueGrowth: number
  
  // Integrated referral metrics
  totalReferrals: number
  pendingReferrals: number
  referralConversionRate: number
  referralRevenue: number
  referralGrowth: number
  referralROI: number
  
  // Performance correlations
  referralToPerformanceRatio: number
  referralStudentRetention: number
  referralStudentSatisfaction: number
}

export interface IntegratedPerformanceMetrics {
  overall_score: number
  academic_performance: number
  engagement_score: number
  retention_rate: number
  referral_contribution: number
  growth_trend: number
  organizational_health: number
}

class DashboardAnalyticsService {
  private supabaseClient = supabase

  /**
   * Get integrated dashboard statistics including referral data
   */
  async getIntegratedDashboardStats(organizationId: string): Promise<DashboardAnalytics> {
    try {
      // Get existing organizational data
      const [
        studentsData,
        groupsData,
        teachersData,
        referralData
      ] = await Promise.all([
        this.getStudentMetrics(organizationId),
        this.getGroupMetrics(organizationId),
        this.getTeacherMetrics(organizationId),
        referralAdminService.getReferralAnalytics(organizationId)
      ])

      // Calculate integrated metrics
      const totalStudents = studentsData.total
      const referralStudents = this.calculateReferralStudents(referralData)
      const referralToPerformanceRatio = totalStudents > 0 ? (referralStudents / totalStudents) * 100 : 0

      return {
        // Standard metrics
        totalStudents: studentsData.total,
        activeStudents: studentsData.active,
        totalGroups: groupsData.total,
        activeGroups: groupsData.active,
        totalTeachers: teachersData.total,
        activeTeachers: teachersData.active,
        recentEnrollments: studentsData.recentEnrollments,
        upcomingClasses: groupsData.upcomingClasses,
        outstandingBalance: 15240, // Mock data - replace with actual finance service
        monthlyRevenue: 89500, // Mock data - replace with actual finance service
        studentGrowth: studentsData.growth,
        groupGrowth: groupsData.growth,
        revenueGrowth: 12.8, // Mock data - replace with actual finance service
        
        // Referral metrics
        totalReferrals: referralData?.total_referrals || 0,
        pendingReferrals: await this.getPendingReferralsCount(organizationId),
        referralConversionRate: referralData?.conversion_rate || 0,
        referralRevenue: this.calculateReferralRevenue(referralData),
        referralGrowth: await this.calculateReferralGrowth(organizationId),
        referralROI: await this.calculateReferralROI(organizationId),
        
        // Performance correlations
        referralToPerformanceRatio,
        referralStudentRetention: 94.2, // Mock data - integrate with actual retention metrics
        referralStudentSatisfaction: 4.6 // Mock data - integrate with actual satisfaction metrics
      }
    } catch (error) {
      console.error('Error fetching integrated dashboard stats:', error)
      throw error
    }
  }

  /**
   * Get performance metrics with referral correlation analysis
   */
  async getIntegratedPerformanceMetrics(organizationId: string): Promise<IntegratedPerformanceMetrics> {
    try {
      const referralData = await referralAdminService.getReferralAnalytics(organizationId)
      
      // Calculate integrated performance score
      const academicPerformance = 84.5 // Mock - integrate with actual academic data
      const engagementScore = 78.2 // Mock - integrate with actual engagement data
      const retentionRate = 91.8 // Mock - integrate with actual retention data
      const referralContribution = (referralData?.conversion_rate || 0) * 0.3 // Weight referral impact
      
      const overallScore = (
        academicPerformance * 0.3 +
        engagementScore * 0.25 +
        retentionRate * 0.25 +
        referralContribution * 0.2
      )

      return {
        overall_score: overallScore,
        academic_performance: academicPerformance,
        engagement_score: engagementScore,
        retention_rate: retentionRate,
        referral_contribution: referralContribution,
        growth_trend: 15.7, // Mock - integrate with actual growth metrics
        organizational_health: 89.3 // Mock - integrate with actual health metrics
      }
    } catch (error) {
      console.error('Error fetching integrated performance metrics:', error)
      throw error
    }
  }

  /**
   * Get referral trend data for dashboard charts
   */
  async getReferralTrendData(organizationId: string, timeRange: 'week' | 'month' | 'quarter' | 'year') {
    try {
      const dateRange = this.getDateRange(timeRange)
      const referralData = await referralAdminService.getReferralAnalytics(organizationId, dateRange)
      
      // Transform data for chart display
      return referralData?.monthly_breakdown.map(month => ({
        month: month.month,
        referrals: month.referrals,
        conversions: month.conversions,
        revenue: month.points * 50, // Convert points to estimated revenue
        performance_impact: month.conversions * 2.5 // Estimated performance impact
      })) || []
    } catch (error) {
      console.error('Error fetching referral trend data:', error)
      return []
    }
  }

  // Private helper methods
  private async getStudentMetrics(organizationId: string) {
    // Mock implementation - replace with actual student service calls
    return {
      total: 324,
      active: 298,
      recentEnrollments: 18,
      growth: 8.7
    }
  }

  private async getGroupMetrics(organizationId: string) {
    // Mock implementation - replace with actual group service calls
    return {
      total: 28,
      active: 25,
      upcomingClasses: 42,
      growth: 5.3
    }
  }

  private async getTeacherMetrics(organizationId: string) {
    // Mock implementation - replace with actual teacher service calls
    return {
      total: 15,
      active: 14,
      growth: 2.1
    }
  }

  private calculateReferralStudents(referralData: ReferralAnalytics | null): number {
    return referralData?.successful_conversions || 0
  }

  private calculateReferralRevenue(referralData: ReferralAnalytics | null): number {
    // Estimate revenue based on successful conversions and average student value
    const conversions = referralData?.successful_conversions || 0
    const averageStudentValue = 2850 // Mock average student lifetime value
    return conversions * averageStudentValue
  }

  private async getPendingReferralsCount(organizationId: string): Promise<number> {
    try {
      const { data, error } = await this.supabaseClient
        .from('student_referrals')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
      
      if (error) throw error
      return data?.length || 0
    } catch (error) {
      console.error('Error fetching pending referrals count:', error)
      return 0
    }
  }

  private async calculateReferralGrowth(organizationId: string): Promise<number> {
    try {
      const currentMonth = new Date()
      const lastMonth = new Date()
      lastMonth.setMonth(currentMonth.getMonth() - 1)
      
      const [currentData, lastData] = await Promise.all([
        referralAdminService.getReferralAnalytics(organizationId, {
          start: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString(),
          end: currentMonth.toISOString()
        }),
        referralAdminService.getReferralAnalytics(organizationId, {
          start: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).toISOString(),
          end: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString()
        })
      ])
      
      const currentReferrals = currentData?.total_referrals || 0
      const lastReferrals = lastData?.total_referrals || 0
      
      if (lastReferrals === 0) return currentReferrals > 0 ? 100 : 0
      return ((currentReferrals - lastReferrals) / lastReferrals) * 100
    } catch (error) {
      console.error('Error calculating referral growth:', error)
      return 0
    }
  }

  private async calculateReferralROI(organizationId: string): Promise<number> {
    try {
      const referralData = await referralAdminService.getReferralAnalytics(organizationId)
      const revenue = this.calculateReferralRevenue(referralData)
      const programCost = 8200 // Mock program cost - replace with actual cost tracking
      
      if (programCost <= 0) return 0
      return ((revenue - programCost) / programCost) * 100
    } catch (error) {
      console.error('Error calculating referral ROI:', error)
      return 0
    }
  }

  private getDateRange(range: string) {
    const end = new Date()
    const start = new Date()
    
    switch (range) {
      case 'week':
        start.setDate(end.getDate() - 7)
        break
      case 'month':
        start.setDate(end.getDate() - 30)
        break
      case 'quarter':
        start.setDate(end.getDate() - 90)
        break
      case 'year':
        start.setFullYear(end.getFullYear() - 1)
        break
    }
    
    return {
      start: start.toISOString(),
      end: end.toISOString()
    }
  }
}

export const dashboardAnalyticsService = new DashboardAnalyticsService()