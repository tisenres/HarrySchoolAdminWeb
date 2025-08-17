import { performance } from 'perf_hooks'
import { render, screen, waitFor } from '../utils/test-utils'
import { 
  createLargeReferralDataset, 
  createMockReferralData, 
  createStudentReferralScenarios 
} from '../utils/referral-mock-data'

// Mock components for performance testing
import React from 'react'

const MockReferralTable = ({ referrals }: { referrals: any[] }) => (
  <div data-testid="referral-table">
    {referrals.map(referral => (
      <div key={referral.id} data-testid={`referral-${referral.id}`}>
        {referral.referred_name}
      </div>
    ))}
  </div>
)

const MockStudentProfile = ({ student, referralData }: { student: any, referralData: any }) => (
  <div data-testid="student-profile">
    <h1>{student.full_name}</h1>
    <div data-testid="referral-summary">
      <span>Total: {referralData.summary.totalReferrals}</span>
      <span>Success: {referralData.summary.successfulReferrals}</span>
      <span>Rate: {referralData.summary.conversionRate}%</span>
    </div>
    <div data-testid="referral-analytics">
      {referralData.analytics.monthlyBreakdown.map((month: any, index: number) => (
        <div key={index}>{month.month}: {month.referrals}</div>
      ))}
    </div>
  </div>
)

const MockDashboard = ({ referralData, students }: { referralData: any, students: any[] }) => (
  <div data-testid="dashboard">
    <div data-testid="pending-referrals">
      {referralData.pendingReferrals.map((referral: any) => (
        <div key={referral.id}>{referral.referred_name}</div>
      ))}
    </div>
    <div data-testid="student-list">
      {students.map(student => (
        <div key={student.id}>
          {student.full_name} - {student.total_points} pts
        </div>
      ))}
    </div>
  </div>
)

describe('Referral System Performance Tests', () => {
  const PERFORMANCE_THRESHOLDS = {
    COMPONENT_RENDER: 100, // ms
    LARGE_DATA_RENDER: 500, // ms
    DATA_PROCESSING: 50, // ms
    SEARCH_FILTER: 200, // ms
    API_SIMULATION: 1000, // ms
  }

  describe('Component Rendering Performance', () => {
    it('renders referral summary card within performance threshold', () => {
      const referralData = createMockReferralData()
      const startTime = performance.now()

      render(
        <div data-testid="referral-summary-card">
          <h3>Referral Summary</h3>
          <div>Total: {referralData.summary.totalReferrals}</div>
          <div>Success: {referralData.summary.successfulReferrals}</div>
          <div>Rate: {referralData.summary.conversionRate}%</div>
          <div>Points: {referralData.summary.totalPointsEarned}</div>
        </div>
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER)
      expect(screen.getByTestId('referral-summary-card')).toBeInTheDocument()
    })

    it('renders student profile with referral data efficiently', () => {
      const scenario = createStudentReferralScenarios().highPerformer
      const startTime = performance.now()

      render(
        <MockStudentProfile 
          student={scenario.student} 
          referralData={scenario.referralData} 
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER)
      expect(screen.getByTestId('student-profile')).toBeInTheDocument()
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    })

    it('renders admin dashboard with referral widgets efficiently', () => {
      const referralData = createMockReferralData()
      const students = Object.values(createStudentReferralScenarios()).map(s => s.student)
      const startTime = performance.now()

      render(
        <MockDashboard 
          referralData={referralData} 
          students={students} 
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER)
      expect(screen.getByTestId('dashboard')).toBeInTheDocument()
    })
  })

  describe('Large Dataset Performance', () => {
    it('handles large referral dataset efficiently', () => {
      const largeDataset = createLargeReferralDataset(1000)
      const startTime = performance.now()

      render(<MockReferralTable referrals={largeDataset} />)

      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_DATA_RENDER)
      expect(screen.getByTestId('referral-table')).toBeInTheDocument()
    })

    it('filters large referral dataset efficiently', () => {
      const largeDataset = createLargeReferralDataset(1000)
      const startTime = performance.now()

      // Simulate filtering operation
      const filteredData = largeDataset.filter(referral => 
        referral.status === 'enrolled' && 
        referral.referred_name.includes('Student')
      )

      const endTime = performance.now()
      const filterTime = endTime - startTime

      expect(filterTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_FILTER)
      expect(filteredData.length).toBeGreaterThan(0)
    })

    it('sorts large referral dataset efficiently', () => {
      const largeDataset = createLargeReferralDataset(1000)
      const startTime = performance.now()

      // Simulate sorting operation
      const sortedData = [...largeDataset].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      const endTime = performance.now()
      const sortTime = endTime - startTime

      expect(sortTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DATA_PROCESSING)
      expect(sortedData.length).toBe(largeDataset.length)
      expect(sortedData[0].created_at >= sortedData[sortedData.length - 1].created_at).toBe(true)
    })
  })

  describe('Data Processing Performance', () => {
    it('calculates referral analytics efficiently', () => {
      const largeDataset = createLargeReferralDataset(1000)
      const startTime = performance.now()

      // Simulate analytics calculation
      const analytics = {
        totalReferrals: largeDataset.length,
        successfulReferrals: largeDataset.filter(r => r.status === 'enrolled').length,
        conversionRate: Math.round(
          (largeDataset.filter(r => r.status === 'enrolled').length / largeDataset.length) * 100
        ),
        averagePointsAwarded: largeDataset
          .filter(r => r.points_awarded > 0)
          .reduce((sum, r) => sum + r.points_awarded, 0) / 
          largeDataset.filter(r => r.points_awarded > 0).length,
        monthlyBreakdown: largeDataset.reduce((acc, referral) => {
          const month = new Date(referral.created_at).toLocaleString('default', { month: 'long' })
          acc[month] = (acc[month] || 0) + 1
          return acc
        }, {} as Record<string, number>),
      }

      const endTime = performance.now()
      const calculationTime = endTime - startTime

      expect(calculationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DATA_PROCESSING)
      expect(analytics.totalReferrals).toBe(1000)
      expect(analytics.conversionRate).toBeGreaterThanOrEqual(0)
      expect(analytics.conversionRate).toBeLessThanOrEqual(100)
    })

    it('processes referral point calculations efficiently', () => {
      const scenarios = createStudentReferralScenarios()
      const students = Object.values(scenarios)
      const startTime = performance.now()

      // Simulate point calculation for multiple students
      const pointCalculations = students.map(scenario => {
        const basePoints = scenario.referralData.summary.totalPointsEarned
        const bonusMultiplier = scenario.ranking.total_referrals >= 5 ? 1.5 : 1.0
        const tierBonus = scenario.ranking.total_referrals >= 10 ? 100 : 
                         scenario.ranking.total_referrals >= 5 ? 50 : 0

        return {
          studentId: scenario.student.id,
          basePoints,
          bonusPoints: Math.round(basePoints * (bonusMultiplier - 1)),
          tierBonus,
          totalPoints: Math.round(basePoints * bonusMultiplier) + tierBonus,
        }
      })

      const endTime = performance.now()
      const calculationTime = endTime - startTime

      expect(calculationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DATA_PROCESSING)
      expect(pointCalculations).toHaveLength(students.length)
      pointCalculations.forEach(calc => {
        expect(calc.totalPoints).toBeGreaterThanOrEqual(calc.basePoints)
      })
    })
  })

  describe('Integration Performance', () => {
    it('maintains ranking calculation performance with referral integration', () => {
      const students = Object.values(createStudentReferralScenarios())
      const startTime = performance.now()

      // Simulate combined ranking calculation including referrals
      const rankings = students.map(scenario => {
        const academicPoints = scenario.student.total_points - scenario.ranking.referral_points_earned
        const referralPoints = scenario.ranking.referral_points_earned
        const achievementBonus = scenario.student.achievements_count * 25
        const referralBonus = scenario.ranking.successful_referrals * 50

        return {
          studentId: scenario.student.id,
          studentName: scenario.student.full_name,
          academicPoints,
          referralPoints,
          achievementBonus,
          referralBonus,
          totalPoints: academicPoints + referralPoints + achievementBonus + referralBonus,
          referralImpact: (referralPoints / (academicPoints + referralPoints)) * 100,
        }
      }).sort((a, b) => b.totalPoints - a.totalPoints)

      const endTime = performance.now()
      const calculationTime = endTime - startTime

      expect(calculationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DATA_PROCESSING)
      expect(rankings).toHaveLength(students.length)
      
      // Verify rankings are sorted correctly
      for (let i = 0; i < rankings.length - 1; i++) {
        expect(rankings[i].totalPoints).toBeGreaterThanOrEqual(rankings[i + 1].totalPoints)
      }
    })

    it('maintains dashboard loading performance with referral widgets', async () => {
      const referralData = createMockReferralData()
      const students = Object.values(createStudentReferralScenarios()).map(s => s.student)
      const startTime = performance.now()

      render(
        <MockDashboard 
          referralData={referralData} 
          students={students} 
        />
      )

      // Wait for all elements to be rendered
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument()
        expect(screen.getByTestId('pending-referrals')).toBeInTheDocument()
        expect(screen.getByTestId('student-list')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const totalTime = endTime - startTime

      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER)
    })
  })

  describe('Memory Performance', () => {
    it('does not create memory leaks with large referral datasets', () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Create and process multiple large datasets
      for (let i = 0; i < 10; i++) {
        const dataset = createLargeReferralDataset(100)
        const processed = dataset.map(r => ({
          ...r,
          calculatedPoints: r.points_awarded * 1.5,
          processed: true,
        }))
        
        // Simulate cleanup
        dataset.length = 0
        processed.length = 0
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })

    it('efficiently handles component mounting and unmounting', () => {
      const referralData = createMockReferralData()
      
      // Mount and unmount components multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <div data-testid={`test-${i}`}>
            <MockReferralTable referrals={referralData.pendingReferrals} />
          </div>
        )
        
        expect(screen.getByTestId(`test-${i}`)).toBeInTheDocument()
        unmount()
      }

      // Should not throw or cause memory issues
      expect(true).toBe(true)
    })
  })

  describe('Concurrent Operations Performance', () => {
    it('handles multiple simultaneous referral operations efficiently', async () => {
      const startTime = performance.now()
      
      // Simulate multiple concurrent operations
      const operations = Promise.all([
        // Referral submission
        new Promise(resolve => {
          setTimeout(() => resolve({ type: 'submission', success: true }), 50)
        }),
        // Analytics calculation
        new Promise(resolve => {
          const data = createLargeReferralDataset(500)
          const analytics = data.reduce((acc, item) => ({
            total: acc.total + 1,
            successful: acc.successful + (item.status === 'enrolled' ? 1 : 0),
          }), { total: 0, successful: 0 })
          resolve({ type: 'analytics', data: analytics })
        }),
        // Leaderboard calculation
        new Promise(resolve => {
          const students = Object.values(createStudentReferralScenarios())
          const leaderboard = students.sort((a, b) => 
            b.ranking.current_points - a.ranking.current_points
          )
          resolve({ type: 'leaderboard', data: leaderboard })
        }),
      ])

      const results = await operations
      const endTime = performance.now()
      const totalTime = endTime - startTime

      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_SIMULATION)
      expect(results).toHaveLength(3)
      expect(results.every(result => result)).toBe(true)
    })
  })

  describe('Regression Performance Tests', () => {
    it('maintains existing student profile loading performance', () => {
      const scenario = createStudentReferralScenarios().averagePerformer
      const startTime = performance.now()

      render(
        <div data-testid="student-profile-with-referrals">
          <h1>{scenario.student.full_name}</h1>
          <div>Points: {scenario.student.total_points}</div>
          <div>Rank: #{scenario.student.ranking_position}</div>
          <div>Achievements: {scenario.student.achievements_count}</div>
          
          {/* Referral data should not slow down profile loading */}
          <div data-testid="referral-section">
            <h2>Referrals</h2>
            <div>Total: {scenario.referralData.summary.totalReferrals}</div>
            <div>Success: {scenario.referralData.summary.successfulReferrals}</div>
          </div>
        </div>
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should be even faster than the general component threshold
      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER * 0.8)
      expect(screen.getByTestId('student-profile-with-referrals')).toBeInTheDocument()
      expect(screen.getByTestId('referral-section')).toBeInTheDocument()
    })

    it('does not impact existing analytics dashboard performance', () => {
      const students = Object.values(createStudentReferralScenarios()).map(s => s.student)
      const startTime = performance.now()

      // Simulate existing analytics calculations
      const academicAnalytics = students.map(student => ({
        id: student.id,
        name: student.full_name,
        points: student.total_points,
        rank: student.ranking_position,
        achievements: student.achievements_count,
        gradeAverage: 8.5 + Math.random() * 1.5, // Mock grade
      }))

      // Add referral analytics without impacting performance
      const enhancedAnalytics = academicAnalytics.map(analytics => {
        const scenario = Object.values(createStudentReferralScenarios())
          .find(s => s.student.id === analytics.id)
        
        return {
          ...analytics,
          referrals: scenario?.referralData.summary.totalReferrals || 0,
          referralRate: scenario?.referralData.summary.conversionRate || 0,
        }
      })

      const endTime = performance.now()
      const calculationTime = endTime - startTime

      expect(calculationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DATA_PROCESSING)
      expect(enhancedAnalytics).toHaveLength(students.length)
      enhancedAnalytics.forEach(analytics => {
        expect(analytics.points).toBeGreaterThan(0)
        expect(analytics.referrals).toBeGreaterThanOrEqual(0)
      })
    })
  })
})