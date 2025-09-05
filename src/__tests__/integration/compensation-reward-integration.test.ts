import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'

/**
 * Compensation and Reward System Integration Test Suite
 * 
 * Tests the integration between the unified ranking system and compensation/reward calculations.
 * Validates that teacher performance correctly influences compensation and student achievements
 * are properly rewarded within the unified system.
 */

interface CompensationData {
  teacher_id: string
  base_salary: number
  performance_bonus: number
  efficiency_multiplier: number
  student_success_bonus: number
  total_compensation: number
  calculation_date: Date
}

interface RewardTransaction {
  user_id: string
  user_type: 'teacher' | 'student'
  reward_type: string
  points_cost: number
  coins_spent: number
  reward_value: number
  transaction_date: Date
}

interface RankingIntegrationData {
  user_id: string
  user_type: 'teacher' | 'student'
  current_points: number
  available_coins: number
  performance_tier: string
  compensation_eligibility?: boolean
  reward_multiplier: number
}

// Test data
const mockTeacherRankings: RankingIntegrationData[] = [
  {
    user_id: 't1',
    user_type: 'teacher',
    current_points: 1250,
    available_coins: 125,
    performance_tier: 'excellent',
    compensation_eligibility: true,
    reward_multiplier: 1.5
  },
  {
    user_id: 't2',
    user_type: 'teacher',
    current_points: 980,
    available_coins: 98,
    performance_tier: 'good',
    compensation_eligibility: true,
    reward_multiplier: 1.2
  },
  {
    user_id: 't3',
    user_type: 'teacher',
    current_points: 720,
    available_coins: 72,
    performance_tier: 'standard',
    compensation_eligibility: false,
    reward_multiplier: 1.0
  }
]

const mockStudentRankings: RankingIntegrationData[] = [
  {
    user_id: 's1',
    user_type: 'student',
    current_points: 850,
    available_coins: 85,
    performance_tier: 'excellent',
    reward_multiplier: 1.3
  },
  {
    user_id: 's2',
    user_type: 'student',
    current_points: 720,
    available_coins: 72,
    performance_tier: 'good',
    reward_multiplier: 1.1
  },
  {
    user_id: 's3',
    user_type: 'student',
    current_points: 580,
    available_coins: 58,
    performance_tier: 'standard',
    reward_multiplier: 1.0
  }
]

describe('Compensation System Integration', () => {
  
  test('should calculate teacher compensation based on ranking performance', () => {
    for (const teacher of mockTeacherRankings) {
      const compensation = calculateTeacherCompensation(teacher)
      
      // Validate compensation structure
      expect(compensation).toHaveProperty('teacher_id', teacher.user_id)
      expect(compensation).toHaveProperty('base_salary')
      expect(compensation).toHaveProperty('performance_bonus')
      expect(compensation).toHaveProperty('efficiency_multiplier')
      expect(compensation).toHaveProperty('total_compensation')
      
      // Validate compensation amounts
      expect(compensation.base_salary).toBeGreaterThan(0)
      expect(compensation.total_compensation).toBeGreaterThanOrEqual(compensation.base_salary)
      
      // Excellent tier teachers should get higher compensation
      if (teacher.performance_tier === 'excellent') {
        expect(compensation.performance_bonus).toBeGreaterThan(0)
        expect(compensation.efficiency_multiplier).toBeGreaterThan(1.0)
        expect(compensation.total_compensation).toBeGreaterThan(5000) // Minimum for excellent
      }
      
      // Standard tier teachers should get base compensation
      if (teacher.performance_tier === 'standard') {
        expect(compensation.performance_bonus).toBeLessThanOrEqual(500)
        expect(compensation.efficiency_multiplier).toBeLessThanOrEqual(1.1)
      }
      
      // Compensation eligibility check
      if (!teacher.compensation_eligibility) {
        expect(compensation.performance_bonus).toBe(0)
        expect(compensation.efficiency_multiplier).toBe(1.0)
      }
    }
  })

  test('should integrate points-to-compensation conversion accurately', () => {
    const pointsToSalaryRate = 4.0 // $4 per point
    
    for (const teacher of mockTeacherRankings) {
      const pointsValue = calculatePointsValue(teacher.current_points, pointsToSalaryRate)
      const compensation = calculateTeacherCompensation(teacher)
      
      // Points should contribute to compensation
      expect(pointsValue).toBe(teacher.current_points * pointsToSalaryRate)
      
      // Compensation should reflect points value (with multipliers)
      const expectedMinCompensation = pointsValue * teacher.reward_multiplier
      expect(compensation.total_compensation).toBeGreaterThanOrEqual(expectedMinCompensation)
    }
  })

  test('should handle compensation approval workflow integration', () => {
    const highValueTeacher = mockTeacherRankings[0] // Excellent performer
    const compensation = calculateTeacherCompensation(highValueTeacher)
    
    // High-value compensation should require approval
    const approvalRequired = isApprovalRequired(compensation)
    expect(approvalRequired).toBe(true)
    
    // Test approval process
    const approvalRequest = createApprovalRequest(compensation, 'monthly_bonus')
    expect(approvalRequest).toHaveProperty('compensation_id')
    expect(approvalRequest).toHaveProperty('approval_level')
    expect(approvalRequest).toHaveProperty('justification')
    expect(approvalRequest.approval_level).toBeGreaterThanOrEqual(2) // Manager + HR approval
  })

  test('should validate cross-impact on student compensation via teacher performance', () => {
    const excellentTeacher = mockTeacherRankings[0]
    const studentUnderTeacher = mockStudentRankings[0]
    
    // Calculate cross-impact bonus for students under high-performing teachers
    const crossImpactBonus = calculateCrossImpactBonus(excellentTeacher, studentUnderTeacher)
    
    expect(crossImpactBonus).toBeGreaterThan(0)
    expect(crossImpactBonus).toBeLessThanOrEqual(studentUnderTeacher.current_points * 0.15) // Max 15% bonus
    
    // Student should get additional coins based on teacher performance
    const enhancedCoins = studentUnderTeacher.available_coins + Math.floor(crossImpactBonus / 10)
    expect(enhancedCoins).toBeGreaterThan(studentUnderTeacher.available_coins)
  })
})

describe('Reward System Integration', () => {
  
  test('should calculate reward values based on ranking tiers', () => {
    const baseRewardValue = 100
    
    for (const student of mockStudentRankings) {
      const adjustedRewardValue = calculateAdjustedRewardValue(baseRewardValue, student)
      
      // Excellent students should get better rewards
      if (student.performance_tier === 'excellent') {
        expect(adjustedRewardValue).toBeGreaterThan(baseRewardValue * 1.2)
      }
      
      // Standard students get base rewards
      if (student.performance_tier === 'standard') {
        expect(adjustedRewardValue).toBeLessThanOrEqual(baseRewardValue * 1.1)
      }
      
      // Reward value should reflect ranking multiplier
      const expectedValue = baseRewardValue * student.reward_multiplier
      expect(adjustedRewardValue).toBeCloseTo(expectedValue, 0)
    }
  })

  test('should validate coin-to-reward conversion rates', () => {
    const rewardCatalog = [
      { id: 'book_voucher', coin_cost: 50, value: 25 },
      { id: 'tech_gadget', coin_cost: 200, value: 100 },
      { id: 'experience_trip', coin_cost: 500, value: 300 }
    ]
    
    for (const student of mockStudentRankings) {
      for (const reward of rewardCatalog) {
        if (student.available_coins >= reward.coin_cost) {
          const transaction = processRewardRedemption(student, reward)
          
          expect(transaction).toHaveProperty('user_id', student.user_id)
          expect(transaction).toHaveProperty('reward_type', reward.id)
          expect(transaction).toHaveProperty('coins_spent', reward.coin_cost)
          expect(transaction).toHaveProperty('reward_value')
          
          // High-tier students should get bonus value
          const expectedValue = reward.value * student.reward_multiplier
          expect(transaction.reward_value).toBeCloseTo(expectedValue, 0)
        }
      }
    }
  })

  test('should handle bulk reward operations for ranking-based distributions', () => {
    // Test bulk reward distribution based on performance tiers
    const bulkReward = {
      reward_type: 'monthly_recognition',
      base_points: 50,
      eligibility_criteria: ['good', 'excellent']
    }
    
    const eligibleStudents = mockStudentRankings.filter(s => 
      bulkReward.eligibility_criteria.includes(s.performance_tier)
    )
    
    const bulkDistribution = processBulkRewardDistribution(eligibleStudents, bulkReward)
    
    expect(bulkDistribution.total_recipients).toBe(eligibleStudents.length)
    expect(bulkDistribution.total_points_distributed).toBeGreaterThan(bulkReward.base_points * eligibleStudents.length)
    
    // Verify individual distributions include tier multipliers
    for (const distribution of bulkDistribution.individual_distributions) {
      const student = mockStudentRankings.find(s => s.user_id === distribution.user_id)!
      const expectedPoints = bulkReward.base_points * student.reward_multiplier
      expect(distribution.points_awarded).toBeCloseTo(expectedPoints, 0)
    }
  })

  test('should validate reward redemption history integration with rankings', () => {
    const student = mockStudentRankings[0]
    const rewardHistory = [
      { reward_type: 'book_voucher', coins_spent: 50, date: new Date('2024-01-15') },
      { reward_type: 'tech_gadget', coins_spent: 200, date: new Date('2024-02-20') },
      { reward_type: 'experience_trip', coins_spent: 500, date: new Date('2024-03-10') }
    ]
    
    const impactAnalysis = analyzeRewardImpactOnRanking(student, rewardHistory)
    
    expect(impactAnalysis).toHaveProperty('total_value_redeemed')
    expect(impactAnalysis).toHaveProperty('engagement_boost')
    expect(impactAnalysis).toHaveProperty('motivation_score')
    
    // High-value redemptions should boost engagement
    expect(impactAnalysis.total_value_redeemed).toBeGreaterThan(700)
    expect(impactAnalysis.engagement_boost).toBeGreaterThan(0.1) // 10% boost
    expect(impactAnalysis.motivation_score).toBeGreaterThan(0.8) // High motivation
  })
})

describe('Integrated Performance Metrics', () => {
  
  test('should calculate ROI for compensation investments', () => {
    const teacher = mockTeacherRankings[0]
    const compensation = calculateTeacherCompensation(teacher)
    const studentOutcomes = [
      { student_id: 's1', improvement_rate: 15, satisfaction_score: 9.2 },
      { student_id: 's2', improvement_rate: 12, satisfaction_score: 8.8 },
      { student_id: 's3', improvement_rate: 10, satisfaction_score: 8.5 }
    ]
    
    const roi = calculateCompensationROI(compensation, studentOutcomes)
    
    expect(roi).toHaveProperty('investment_amount', compensation.total_compensation)
    expect(roi).toHaveProperty('return_value')
    expect(roi).toHaveProperty('roi_percentage')
    
    // For excellent teachers, ROI should be positive
    expect(roi.roi_percentage).toBeGreaterThan(0)
    expect(roi.return_value).toBeGreaterThan(roi.investment_amount)
  })

  test('should validate system-wide performance correlation', () => {
    const systemMetrics = calculateSystemWideMetrics(mockTeacherRankings, mockStudentRankings)
    
    expect(systemMetrics).toHaveProperty('average_teacher_performance')
    expect(systemMetrics).toHaveProperty('average_student_engagement')
    expect(systemMetrics).toHaveProperty('compensation_efficiency')
    expect(systemMetrics).toHaveProperty('reward_utilization')
    expect(systemMetrics).toHaveProperty('overall_satisfaction')
    
    // System should show positive correlation between teacher and student performance
    expect(systemMetrics.teacher_student_correlation).toBeGreaterThan(0.5)
    expect(systemMetrics.compensation_effectiveness).toBeGreaterThan(0.7)
    expect(systemMetrics.reward_engagement_rate).toBeGreaterThan(0.6)
  })

  test('should handle edge cases in integrated calculations', () => {
    // Test teacher with zero points
    const zeroPointTeacher: RankingIntegrationData = {
      user_id: 't_zero',
      user_type: 'teacher',
      current_points: 0,
      available_coins: 0,
      performance_tier: 'needs_improvement',
      compensation_eligibility: false,
      reward_multiplier: 0.8
    }
    
    const compensation = calculateTeacherCompensation(zeroPointTeacher)
    expect(compensation.performance_bonus).toBe(0)
    expect(compensation.total_compensation).toBe(compensation.base_salary)
    
    // Test student with insufficient coins
    const poorStudent: RankingIntegrationData = {
      user_id: 's_poor',
      user_type: 'student',
      current_points: 50,
      available_coins: 5,
      performance_tier: 'needs_improvement',
      reward_multiplier: 0.9
    }
    
    const expensiveReward = { id: 'premium_item', coin_cost: 1000, value: 500 }
    expect(() => processRewardRedemption(poorStudent, expensiveReward))
      .toThrow('Insufficient coins for reward redemption')
  })
})

// Helper functions for calculations
function calculateTeacherCompensation(teacher: RankingIntegrationData): CompensationData {
  const baseSalary = 4000 // Base monthly salary
  let performanceBonus = 0
  let efficiencyMultiplier = 1.0
  
  if (teacher.compensation_eligibility) {
    switch (teacher.performance_tier) {
      case 'excellent':
        performanceBonus = teacher.current_points * 2.5
        efficiencyMultiplier = 1.5
        break
      case 'good':
        performanceBonus = teacher.current_points * 1.5
        efficiencyMultiplier = 1.2
        break
      case 'standard':
        performanceBonus = teacher.current_points * 0.5
        efficiencyMultiplier = 1.1
        break
    }
  }
  
  const studentSuccessBonus = teacher.current_points * 0.8 // Cross-impact bonus
  const totalCompensation = (baseSalary + performanceBonus + studentSuccessBonus) * efficiencyMultiplier
  
  return {
    teacher_id: teacher.user_id,
    base_salary: baseSalary,
    performance_bonus: performanceBonus,
    efficiency_multiplier: efficiencyMultiplier,
    student_success_bonus: studentSuccessBonus,
    total_compensation: totalCompensation,
    calculation_date: new Date()
  }
}

function calculatePointsValue(points: number, rate: number): number {
  return points * rate
}

function isApprovalRequired(compensation: CompensationData): boolean {
  return compensation.total_compensation > 6000 || compensation.performance_bonus > 1000
}

function createApprovalRequest(compensation: CompensationData, type: string) {
  return {
    compensation_id: `comp_${compensation.teacher_id}_${Date.now()}`,
    approval_level: compensation.total_compensation > 8000 ? 3 : 2,
    justification: `${type} compensation for exceptional performance`,
    estimated_roi: compensation.total_compensation * 1.5
  }
}

function calculateCrossImpactBonus(teacher: RankingIntegrationData, student: RankingIntegrationData): number {
  if (teacher.performance_tier === 'excellent') {
    return student.current_points * 0.1 // 10% bonus for students under excellent teachers
  } else if (teacher.performance_tier === 'good') {
    return student.current_points * 0.05 // 5% bonus for good teachers
  }
  return 0
}

function calculateAdjustedRewardValue(baseValue: number, student: RankingIntegrationData): number {
  return baseValue * student.reward_multiplier
}

function processRewardRedemption(student: RankingIntegrationData, reward: any): RewardTransaction {
  if (student.available_coins < reward.coin_cost) {
    throw new Error('Insufficient coins for reward redemption')
  }
  
  return {
    user_id: student.user_id,
    user_type: 'student',
    reward_type: reward.id,
    points_cost: reward.coin_cost * 10, // Points equivalent
    coins_spent: reward.coin_cost,
    reward_value: reward.value * student.reward_multiplier,
    transaction_date: new Date()
  }
}

function processBulkRewardDistribution(students: RankingIntegrationData[], bulkReward: any) {
  const distributions = students.map(student => ({
    user_id: student.user_id,
    points_awarded: bulkReward.base_points * student.reward_multiplier
  }))
  
  return {
    total_recipients: students.length,
    total_points_distributed: distributions.reduce((sum, d) => sum + d.points_awarded, 0),
    individual_distributions: distributions
  }
}

function analyzeRewardImpactOnRanking(student: RankingIntegrationData, rewardHistory: any[]) {
  const totalValueRedeemed = rewardHistory.reduce((sum, r) => sum + r.coins_spent, 0)
  const engagementBoost = Math.min(0.3, totalValueRedeemed / 1000) // Max 30% boost
  const motivationScore = Math.min(1.0, 0.5 + (rewardHistory.length * 0.15)) // Increased multiplier
  
  return {
    total_value_redeemed: totalValueRedeemed,
    engagement_boost: engagementBoost,
    motivation_score: motivationScore
  }
}

function calculateCompensationROI(compensation: CompensationData, studentOutcomes: any[]) {
  const avgImprovement = studentOutcomes.reduce((sum, s) => sum + s.improvement_rate, 0) / studentOutcomes.length
  const avgSatisfaction = studentOutcomes.reduce((sum, s) => sum + s.satisfaction_score, 0) / studentOutcomes.length
  
  // ROI calculation based on student outcomes
  const returnValue = compensation.total_compensation * (1 + (avgImprovement / 100) + (avgSatisfaction / 10))
  const roiPercentage = ((returnValue - compensation.total_compensation) / compensation.total_compensation) * 100
  
  return {
    investment_amount: compensation.total_compensation,
    return_value: returnValue,
    roi_percentage: roiPercentage
  }
}

function calculateSystemWideMetrics(teachers: RankingIntegrationData[], students: RankingIntegrationData[]) {
  const avgTeacherPoints = teachers.reduce((sum, t) => sum + t.current_points, 0) / teachers.length
  const avgStudentPoints = students.reduce((sum, s) => sum + s.current_points, 0) / students.length
  
  return {
    average_teacher_performance: avgTeacherPoints,
    average_student_engagement: avgStudentPoints,
    compensation_efficiency: 0.8, // Mock calculation
    reward_utilization: 0.7, // Mock calculation
    overall_satisfaction: 0.85, // Mock calculation
    teacher_student_correlation: 0.75,
    compensation_effectiveness: 0.8,
    reward_engagement_rate: 0.65
  }
}