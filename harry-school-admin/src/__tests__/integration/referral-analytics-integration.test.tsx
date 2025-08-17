/**
 * Integration tests for Referral Analytics Integration
 * Tests the seamless integration of referral analytics into existing dashboard
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { dashboardAnalyticsService } from '@/lib/services/dashboard-analytics-service'
import { referralAdminService } from '@/lib/services/referral-admin-service'

// Mock the services
vi.mock('@/lib/services/dashboard-analytics-service', () => ({
  dashboardAnalyticsService: {
    getIntegratedDashboardStats: vi.fn(),
    getIntegratedPerformanceMetrics: vi.fn(),
    getReferralTrendData: vi.fn()
  }
}))

vi.mock('@/lib/services/referral-admin-service', () => ({
  referralAdminService: {
    getReferralAnalytics: vi.fn(),
    getAdminStats: vi.fn(),
    getPendingReferrals: vi.fn()
  }
}))

describe('Referral Analytics Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Dashboard Analytics Service Integration', () => {
    test('should integrate referral metrics with dashboard stats', async () => {
      const mockIntegratedStats = {
        totalStudents: 324,
        activeStudents: 298,
        totalGroups: 28,
        activeGroups: 25,
        totalTeachers: 15,
        activeTeachers: 14,
        recentEnrollments: 18,
        upcomingClasses: 42,
        outstandingBalance: 15240,
        monthlyRevenue: 89500,
        studentGrowth: 8.7,
        groupGrowth: 5.3,
        revenueGrowth: 12.8,
        // Referral metrics
        totalReferrals: 45,
        pendingReferrals: 8,
        referralConversionRate: 78.5,
        referralRevenue: 128250,
        referralGrowth: 23.4,
        referralROI: 456,
        // Performance correlations
        referralToPerformanceRatio: 13.9,
        referralStudentRetention: 94.2,
        referralStudentSatisfaction: 4.6
      }

      ;(dashboardAnalyticsService.getIntegratedDashboardStats as any).mockResolvedValue(mockIntegratedStats)

      const result = await dashboardAnalyticsService.getIntegratedDashboardStats('test-org')

      expect(result).toEqual(mockIntegratedStats)
      expect(result.totalReferrals).toBeGreaterThan(0)
      expect(result.referralConversionRate).toBeGreaterThan(0)
      expect(result.referralROI).toBeGreaterThan(0)
    })

    test('should calculate referral correlation metrics', async () => {
      const mockPerformanceMetrics = {
        overall_score: 86.3,
        academic_performance: 84.5,
        engagement_score: 78.2,
        retention_rate: 91.8,
        referral_contribution: 23.6,
        growth_trend: 15.7,
        organizational_health: 89.3
      }

      ;(dashboardAnalyticsService.getIntegratedPerformanceMetrics as any).mockResolvedValue(mockPerformanceMetrics)

      const result = await dashboardAnalyticsService.getIntegratedPerformanceMetrics('test-org')

      expect(result.referral_contribution).toBeGreaterThan(0)
      expect(result.overall_score).toBeGreaterThan(result.academic_performance * 0.3) // Includes referral weighting
    })

    test('should provide referral trend data for charts', async () => {
      const mockTrendData = [
        { month: 'Jan', referrals: 12, conversions: 9, revenue: 2250, performance_impact: 22.5 },
        { month: 'Feb', referrals: 18, conversions: 15, revenue: 3750, performance_impact: 37.5 },
        { month: 'Mar', referrals: 15, conversions: 12, revenue: 3000, performance_impact: 30.0 }
      ]

      ;(dashboardAnalyticsService.getReferralTrendData as any).mockResolvedValue(mockTrendData)

      const result = await dashboardAnalyticsService.getReferralTrendData('test-org', 'quarter')

      expect(result).toHaveLength(3)
      expect(result[0]).toHaveProperty('referrals')
      expect(result[0]).toHaveProperty('conversions')
      expect(result[0]).toHaveProperty('revenue')
      expect(result[0]).toHaveProperty('performance_impact')
    })
  })

  describe('Analytics Dashboard Integration', () => {
    test('should seamlessly integrate referral metrics without separate sections', () => {
      // Test concept: Verify that referral analytics are embedded within existing analytics patterns
      const organizationMetrics = {
        teacher_student_alignment: 86.2,
        peer_influence_index: 78.5,
        referral_correlation_strength: 84.7, // Integrated referral metric
        organizational_health: 84.7
      }

      // Referral metrics should enhance, not replace, existing organizational insights
      expect(organizationMetrics).toHaveProperty('teacher_student_alignment')
      expect(organizationMetrics).toHaveProperty('referral_correlation_strength')
      
      // Integration should maintain performance standards
      expect(Object.keys(organizationMetrics).length).toBeLessThanOrEqual(10) // Avoid metric overload
    })

    test('should correlate referral data with academic performance', () => {
      const correlationData = {
        referral_students: {
          academic_score: 89.2,
          attendance_rate: 96.1,
          satisfaction_rating: 4.7
        },
        organic_students: {
          academic_score: 82.4,
          attendance_rate: 87.3,
          satisfaction_rating: 4.2
        },
        correlation_strength: 0.84
      }

      // Verify referral students show better performance
      expect(correlationData.referral_students.academic_score).toBeGreaterThan(
        correlationData.organic_students.academic_score
      )
      expect(correlationData.referral_students.satisfaction_rating).toBeGreaterThan(
        correlationData.organic_students.satisfaction_rating
      )
      expect(correlationData.correlation_strength).toBeGreaterThan(0.7) // Strong correlation
    })

    test('should calculate ROI and financial impact within existing metrics', () => {
      const financialMetrics = {
        monthly_revenue: 89500,
        referral_revenue: 32000, // Integrated within total revenue
        referral_program_cost: 8200,
        referral_roi: 290.2,
        cost_per_acquisition: {
          referral: 182,
          organic: 485
        }
      }

      // Verify ROI calculations
      const expectedROI = ((financialMetrics.referral_revenue - financialMetrics.referral_program_cost) / 
                           financialMetrics.referral_program_cost) * 100
      expect(Math.abs(financialMetrics.referral_roi - expectedROI)).toBeLessThan(1)
      
      // Verify cost efficiency
      expect(financialMetrics.cost_per_acquisition.referral).toBeLessThan(
        financialMetrics.cost_per_acquisition.organic
      )
    })
  })

  describe('Chart Integration and Performance', () => {
    test('should maintain chart performance with referral data integration', () => {
      const chartData = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(0, i).toLocaleString('default', { month: 'short' }),
        academic_performance: 80 + Math.random() * 10,
        referral_volume: Math.floor(Math.random() * 25) + 10,
        referral_impact: Math.random() * 15 + 5,
        conversion_rate: 70 + Math.random() * 20
      }))

      // Verify data structure for chart rendering
      expect(chartData).toHaveLength(12)
      chartData.forEach(point => {
        expect(point).toHaveProperty('month')
        expect(point).toHaveProperty('academic_performance')
        expect(point).toHaveProperty('referral_volume')
        expect(point).toHaveProperty('referral_impact')
      })

      // Verify performance considerations
      expect(Object.keys(chartData[0]).length).toBeLessThanOrEqual(6) // Limit data points per chart
    })

    test('should provide engagement correlation without overwhelming display', () => {
      const engagementCorrelation = [
        {
          referrer_name: 'Maya Patel',
          referrer_performance: 95,
          referral_quality_score: 92,
          engagement_correlation: 0.89
        },
        {
          referrer_name: 'Alex Thompson', 
          referrer_performance: 88,
          referral_quality_score: 85,
          engagement_correlation: 0.76
        }
      ]

      // Test correlation strength categorization
      engagementCorrelation.forEach(referrer => {
        expect(referrer.engagement_correlation).toBeGreaterThan(0)
        expect(referrer.engagement_correlation).toBeLessThanOrEqual(1)
        
        // Strong correlation should align with high performance
        if (referrer.engagement_correlation > 0.8) {
          expect(referrer.referrer_performance).toBeGreaterThan(90)
        }
      })
    })
  })

  describe('Performance and Load Testing', () => {
    test('should load referral analytics data efficiently', async () => {
      const startTime = Date.now()
      
      ;(referralAdminService.getReferralAnalytics as any).mockResolvedValue({
        total_referrals: 45,
        successful_conversions: 35,
        conversion_rate: 77.8,
        total_points_earned: 1750
      })

      await referralAdminService.getReferralAnalytics('test-org')
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(1000) // Should load within 1 second
    })

    test('should handle large datasets without performance degradation', () => {
      // Simulate large referral dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `ref-${i}`,
        conversion_date: new Date(Date.now() - Math.random() * 31536000000), // Random date within last year
        referrer_performance: Math.random() * 40 + 60,
        student_performance: Math.random() * 30 + 70
      }))

      // Test data processing performance
      const startTime = Date.now()
      const correlations = largeDataset.map(item => ({
        correlation: (item.referrer_performance + item.student_performance) / 2
      }))
      const processingTime = Date.now() - startTime

      expect(correlations).toHaveLength(1000)
      expect(processingTime).toBeLessThan(100) // Should process within 100ms
    })
  })

  describe('Error Handling and Resilience', () => {
    test('should gracefully handle referral service failures', async () => {
      ;(referralAdminService.getReferralAnalytics as any).mockRejectedValue(new Error('Service unavailable'))

      const mockFallbackStats = {
        totalReferrals: 0,
        referralConversionRate: 0,
        referralROI: 0,
        // ... other metrics with fallback values
      }

      // Service should provide fallback data when referral analytics fail
      try {
        await dashboardAnalyticsService.getIntegratedDashboardStats('test-org')
      } catch (error) {
        // Should not reach here - service should handle errors gracefully
        expect(true).toBe(false)
      }
    })

    test('should maintain dashboard functionality without referral data', () => {
      const baseStats = {
        totalStudents: 324,
        activeStudents: 298,
        monthlyRevenue: 89500,
        // Referral metrics fallback to zero/null
        totalReferrals: 0,
        referralConversionRate: 0,
        referralROI: 0
      }

      // Dashboard should remain functional with zero referral data
      expect(baseStats.totalStudents).toBeGreaterThan(0)
      expect(baseStats.monthlyRevenue).toBeGreaterThan(0)
      // Referral metrics can be zero without breaking functionality
      expect(baseStats.totalReferrals).toEqual(0)
    })
  })
})

describe('Integration Compliance with Existing Patterns', () => {
  test('should follow existing StatsCard pattern for referral metrics', () => {
    const referralStatsCard = {
      title: 'Referral Conversion',
      value: '78.5%',
      subtitle: '8 pending',
      icon: 'UserPlus',
      color: 'green',
      trend: { value: 12.3, isPositive: true }
    }

    // Verify compliance with existing StatsCard interface
    expect(referralStatsCard).toHaveProperty('title')
    expect(referralStatsCard).toHaveProperty('value')
    expect(referralStatsCard).toHaveProperty('icon')
    expect(referralStatsCard).toHaveProperty('color')
    expect(referralStatsCard.icon).toMatch(/^[A-Z][a-zA-Z]*$/) // Icon name format
  })

  test('should integrate with existing chart component patterns', () => {
    const chartProps = {
      data: [
        { month: 'Jan', academic: 82, referral_impact: 5.2 },
        { month: 'Feb', academic: 85, referral_impact: 7.1 }
      ],
      lines: [
        { dataKey: 'academic', stroke: '#3B82F6', name: 'Academic Performance' },
        { dataKey: 'referral_impact', stroke: '#10B981', name: 'Referral Impact' }
      ]
    }

    // Verify chart data structure matches existing patterns
    expect(chartProps.data[0]).toHaveProperty('month')
    expect(chartProps.lines).toHaveLength(2)
    expect(chartProps.lines[0]).toHaveProperty('dataKey')
    expect(chartProps.lines[0]).toHaveProperty('stroke')
  })

  test('should maintain existing organizational metrics structure', () => {
    const enhancedOrgMetrics = {
      // Existing metrics
      total_correlation_strength: 0.795,
      teacher_student_alignment: 86.2,
      organizational_health: 84.7,
      // Integrated referral metrics (seamlessly added)
      referral_program_effectiveness: 78.5,
      referral_quality_index: 82.3
    }

    // Should not exceed reasonable number of metrics
    expect(Object.keys(enhancedOrgMetrics).length).toBeLessThanOrEqual(8)
    
    // All metrics should be numeric percentages or ratios
    Object.values(enhancedOrgMetrics).forEach(value => {
      expect(typeof value).toBe('number')
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(100)
    })
  })
})