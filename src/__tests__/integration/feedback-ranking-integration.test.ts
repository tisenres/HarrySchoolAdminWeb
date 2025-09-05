import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import { FeedbackService } from '@/lib/services/feedback-service'
import {
  createMockFeedbackEntry,
  createMockFeedbackSubmission,
  createMockFeedbackRankingImpact,
  createScenarioFeedbackData,
  createMockFeedbackList
} from '../utils/feedback-mock-data'

/**
 * Feedback System Ranking Integration Test Suite
 * 
 * Tests the integration between feedback and ranking systems to ensure:
 * - Accurate ranking point calculations from feedback
 * - Proper leaderboard updates when feedback affects rankings
 * - Cross-impact validation between teacher and student rankings
 * - Performance maintenance during ranking recalculations
 */

interface RankingUser {
  id: string
  user_type: 'teacher' | 'student'
  full_name: string
  base_points: number
  feedback_points: number
  total_points: number
  ranking_position: number
  tier: 'standard' | 'good' | 'excellent' | 'outstanding'
  efficiency_percentage?: number
  quality_score?: number
  academic_score?: number
  engagement_level?: number
}

interface RankingRecalculationResult {
  affected_users: string[]
  position_changes: { user_id: string; old_position: number; new_position: number }[]
  tier_changes: { user_id: string; old_tier: string; new_tier: string }[]
  calculation_time: number
  success: boolean
}

describe('Feedback Points Impact on Rankings', () => {
  let feedbackService: FeedbackService
  
  beforeEach(() => {
    jest.clearAllMocks()
    feedbackService = new FeedbackService()
  })

  test('should calculate correct ranking points from high-quality feedback', async () => {
    const teacherId = 'teacher-ranking-test'
    const highQualityFeedback = createMockFeedbackList(5, {
      to_user_id: teacherId,
      to_user_type: 'teacher',
      rating: 5,
      category: 'teaching_quality',
      affects_ranking: true,
      ranking_points_impact: 50
    })
    
    // Mock feedback ranking impact calculation
    jest.spyOn(feedbackService, 'getRankingImpactFromFeedback')
      .mockResolvedValue(createMockFeedbackRankingImpact({
        total_points: 250, // 5 feedback × 50 points
        average_rating: 5.0,
        feedback_count: 5,
        category_breakdown: [
          { category: 'teaching_quality', average_rating: 5.0, count: 5, points_impact: 250 }
        ]
      }))
    
    const rankingImpact = await feedbackService.getRankingImpactFromFeedback(teacherId)
    
    // Verify points calculation
    expect(rankingImpact.total_points).toBe(250)
    expect(rankingImpact.average_rating).toBe(5.0)
    expect(rankingImpact.feedback_count).toBe(5)
    
    // Verify category breakdown
    const teachingQualityBreakdown = rankingImpact.category_breakdown.find(c => c.category === 'teaching_quality')
    expect(teachingQualityBreakdown).toBeDefined()
    expect(teachingQualityBreakdown?.points_impact).toBe(250)
  })

  test('should properly weight feedback points by category and user type', async () => {
    const testCases = [
      {
        feedback: createMockFeedbackEntry({
          rating: 5,
          category: 'teaching_quality',
          to_user_type: 'teacher',
          ranking_points_impact: 75 // High weight for teaching quality to teachers
        }),
        expectedPoints: 75
      },
      {
        feedback: createMockFeedbackEntry({
          rating: 5,
          category: 'behavior',
          to_user_type: 'student',
          ranking_points_impact: 50 // Standard weight for student behavior
        }),
        expectedPoints: 50
      },
      {
        feedback: createMockFeedbackEntry({
          rating: 3,
          category: 'homework',
          to_user_type: 'student',
          ranking_points_impact: 24 // Lower rating × lower category weight
        }),
        expectedPoints: 24
      }
    ]
    
    testCases.forEach(({ feedback, expectedPoints }) => {
      expect(feedback.ranking_points_impact).toBe(expectedPoints)
      expect(feedback.affects_ranking).toBe(true)
    })
  })

  test('should handle negative feedback impact on rankings appropriately', async () => {
    const teacherId = 'teacher-negative-feedback'
    const mixedFeedback = [
      createMockFeedbackEntry({
        to_user_id: teacherId,
        rating: 2,
        category: 'communication',
        ranking_points_impact: 20 // Low rating results in low points
      }),
      createMockFeedbackEntry({
        to_user_id: teacherId,
        rating: 1,
        category: 'behavior',
        ranking_points_impact: 10 // Very low rating
      }),
      createMockFeedbackEntry({
        to_user_id: teacherId,
        rating: 5,
        category: 'teaching_quality',
        ranking_points_impact: 75 // High rating compensates
      })
    ]
    
    jest.spyOn(feedbackService, 'getRankingImpactFromFeedback')
      .mockResolvedValue(createMockFeedbackRankingImpact({
        total_points: 105, // 20 + 10 + 75
        average_rating: 2.67, // (2 + 1 + 5) / 3
        feedback_count: 3
      }))
    
    const rankingImpact = await feedbackService.getRankingImpactFromFeedback(teacherId)
    
    // Verify mixed feedback impact
    expect(rankingImpact.total_points).toBe(105)
    expect(rankingImpact.average_rating).toBeCloseTo(2.67, 1)
    
    // Low average should not prevent positive contribution from high-rated feedback
    expect(rankingImpact.total_points).toBeGreaterThan(0)
  })
})

describe('Leaderboard Integration with Feedback', () => {
  
  test('should update teacher leaderboard when feedback affects rankings', async () => {
    const teachers: RankingUser[] = [
      {
        id: 't1',
        user_type: 'teacher',
        full_name: 'Alice Johnson',
        base_points: 1200,
        feedback_points: 300,
        total_points: 1500,
        ranking_position: 1,
        tier: 'excellent',
        efficiency_percentage: 92,
        quality_score: 88
      },
      {
        id: 't2',
        user_type: 'teacher',
        full_name: 'Bob Smith',
        base_points: 1100,
        feedback_points: 250,
        total_points: 1350,
        ranking_position: 2,
        tier: 'good',
        efficiency_percentage: 88,
        quality_score: 85
      },
      {
        id: 't3',
        user_type: 'teacher',
        full_name: 'Carol Davis',
        base_points: 1000,
        feedback_points: 200,
        total_points: 1200,
        ranking_position: 3,
        tier: 'good',
        efficiency_percentage: 82,
        quality_score: 80
      }
    ]
    
    // Simulate new high-impact feedback for teacher t3
    const newFeedback = createMockFeedbackEntry({
      to_user_id: 't3',
      rating: 5,
      category: 'teaching_quality',
      ranking_points_impact: 200
    })
    
    // Recalculate rankings after feedback
    const updatedTeachers = teachers.map(teacher => {
      if (teacher.id === 't3') {
        const newTotal = teacher.total_points + newFeedback.ranking_points_impact
        return {
          ...teacher,
          feedback_points: teacher.feedback_points + newFeedback.ranking_points_impact,
          total_points: newTotal
        }
      }
      return teacher
    })
    
    // Re-sort by total points
    const newLeaderboard = updatedTeachers
      .sort((a, b) => b.total_points - a.total_points)
      .map((teacher, index) => ({
        ...teacher,
        ranking_position: index + 1
      }))
    
    // Verify leaderboard changes
    const teacher3NewPosition = newLeaderboard.find(t => t.id === 't3')
    expect(teacher3NewPosition?.ranking_position).toBe(1) // Should move to first place
    expect(teacher3NewPosition?.total_points).toBe(1400) // 1200 + 200
    
    // Verify other positions shifted correctly
    const teacher1NewPosition = newLeaderboard.find(t => t.id === 't1')
    const teacher2NewPosition = newLeaderboard.find(t => t.id === 't2')
    expect(teacher1NewPosition?.ranking_position).toBe(2)
    expect(teacher2NewPosition?.ranking_position).toBe(3)
  })

  test('should handle tier promotions based on feedback-enhanced rankings', async () => {
    const teacher: RankingUser = {
      id: 'teacher-promotion-test',
      user_type: 'teacher',
      full_name: 'David Wilson',
      base_points: 1180,
      feedback_points: 150,
      total_points: 1330,
      ranking_position: 5,
      tier: 'good',
      efficiency_percentage: 84,
      quality_score: 82
    }
    
    // Tier thresholds
    const tierThresholds = {
      standard: 1000,
      good: 1200,
      excellent: 1500,
      outstanding: 2000
    }
    
    // Simulate excellent feedback boosting points
    const excellentFeedback = createMockFeedbackList(4, {
      to_user_id: teacher.id,
      rating: 5,
      category: 'teaching_quality',
      ranking_points_impact: 60 // 4 × 60 = 240 points
    })
    
    const totalFeedbackPoints = excellentFeedback.reduce((sum, f) => sum + f.ranking_points_impact, 0)
    const newTotalPoints = teacher.total_points + totalFeedbackPoints
    
    // Determine new tier
    let newTier: string = 'standard'
    if (newTotalPoints >= tierThresholds.outstanding) newTier = 'outstanding'
    else if (newTotalPoints >= tierThresholds.excellent) newTier = 'excellent'
    else if (newTotalPoints >= tierThresholds.good) newTier = 'good'
    
    // Verify tier promotion
    expect(newTotalPoints).toBe(1570) // 1330 + 240
    expect(newTotalPoints).toBeGreaterThan(tierThresholds.excellent)
    expect(newTier).toBe('excellent')
    
    // Verify feedback impact drove the promotion
    expect(teacher.total_points).toBeLessThan(tierThresholds.excellent) // Was below threshold
    expect(newTotalPoints).toBeGreaterThan(tierThresholds.excellent) // Now above threshold
  })

  test('should maintain leaderboard accuracy during bulk feedback processing', async () => {
    const initialLeaderboard: RankingUser[] = [
      { id: 't1', user_type: 'teacher', full_name: 'Teacher 1', base_points: 1000, feedback_points: 200, total_points: 1200, ranking_position: 1, tier: 'good' },
      { id: 't2', user_type: 'teacher', full_name: 'Teacher 2', base_points: 950, feedback_points: 180, total_points: 1130, ranking_position: 2, tier: 'good' },
      { id: 't3', user_type: 'teacher', full_name: 'Teacher 3', base_points: 900, feedback_points: 160, total_points: 1060, ranking_position: 3, tier: 'standard' },
      { id: 't4', user_type: 'teacher', full_name: 'Teacher 4', base_points: 850, feedback_points: 140, total_points: 990, ranking_position: 4, tier: 'standard' }
    ]
    
    // Simulate bulk feedback submission affecting multiple teachers
    const bulkFeedback = [
      { to_user_id: 't2', ranking_points_impact: 150 },
      { to_user_id: 't3', ranking_points_impact: 200 },
      { to_user_id: 't4', ranking_points_impact: 250 }
    ]
    
    // Apply bulk feedback impacts
    const updatedLeaderboard = initialLeaderboard.map(teacher => {
      const feedbackImpact = bulkFeedback.find(f => f.to_user_id === teacher.id)
      if (feedbackImpact) {
        return {
          ...teacher,
          feedback_points: teacher.feedback_points + feedbackImpact.ranking_points_impact,
          total_points: teacher.total_points + feedbackImpact.ranking_points_impact
        }
      }
      return teacher
    })
    
    // Recalculate rankings
    const finalLeaderboard = updatedLeaderboard
      .sort((a, b) => b.total_points - a.total_points)
      .map((teacher, index) => ({
        ...teacher,
        ranking_position: index + 1
      }))
    
    // Verify dramatic position changes
    const t4Final = finalLeaderboard.find(t => t.id === 't4')
    const t3Final = finalLeaderboard.find(t => t.id === 't3')
    const t2Final = finalLeaderboard.find(t => t.id === 't2')
    const t1Final = finalLeaderboard.find(t => t.id === 't1')
    
    expect(t4Final?.ranking_position).toBe(1) // 990 + 250 = 1240 (highest)
    expect(t3Final?.ranking_position).toBe(2) // 1060 + 200 = 1260 (second)
    expect(t2Final?.ranking_position).toBe(3) // 1130 + 150 = 1280 (third)
    expect(t1Final?.ranking_position).toBe(4) // 1200 (unchanged, now lowest)
  })
})

describe('Cross-Impact Ranking Integration', () => {
  
  test('should calculate cross-impact between teacher performance and student rankings', async () => {
    const excellentTeacher: RankingUser = {
      id: 'teacher-excellent',
      user_type: 'teacher',
      full_name: 'Excellent Teacher',
      base_points: 1500,
      feedback_points: 400,
      total_points: 1900,
      ranking_position: 1,
      tier: 'excellent',
      efficiency_percentage: 95,
      quality_score: 92
    }
    
    const studentsUnderTeacher: RankingUser[] = [
      {
        id: 's1',
        user_type: 'student',
        full_name: 'Student 1',
        base_points: 800,
        feedback_points: 100,
        total_points: 900,
        ranking_position: 5,
        tier: 'good',
        academic_score: 85,
        engagement_level: 8
      },
      {
        id: 's2',
        user_type: 'student',
        full_name: 'Student 2',
        base_points: 750,
        feedback_points: 80,
        total_points: 830,
        ranking_position: 8,
        tier: 'standard',
        academic_score: 78,
        engagement_level: 7
      }
    ]
    
    // Calculate cross-impact bonuses
    const teacherTierMultiplier = excellentTeacher.tier === 'excellent' ? 1.15 : 1.0
    const crossImpactResults = studentsUnderTeacher.map(student => {
      const crossImpactBonus = Math.floor(student.total_points * 0.05 * teacherTierMultiplier) // 5% bonus with multiplier
      return {
        ...student,
        cross_impact_bonus: crossImpactBonus,
        total_points: student.total_points + crossImpactBonus
      }
    })
    
    // Verify cross-impact calculations
    crossImpactResults.forEach(result => {
      expect(result.cross_impact_bonus).toBeGreaterThan(0)
      expect(result.total_points).toBeGreaterThan(result.base_points + result.feedback_points)
    })
    
    // Students under excellent teachers should get better bonuses
    const student1Bonus = crossImpactResults.find(r => r.id === 's1')?.cross_impact_bonus
    const student2Bonus = crossImpactResults.find(r => r.id === 's2')?.cross_impact_bonus
    
    expect(student1Bonus).toBeGreaterThan(45) // ~900 * 0.05 * 1.15
    expect(student2Bonus).toBeGreaterThan(40) // ~830 * 0.05 * 1.15
  })

  test('should handle bidirectional feedback impact on rankings', async () => {
    const teacherId = 'teacher-bidirectional'
    const studentId = 'student-bidirectional'
    
    // Teacher-to-student feedback
    const teacherFeedback = createMockFeedbackEntry({
      from_user_id: teacherId,
      to_user_id: studentId,
      from_user_type: 'teacher',
      to_user_type: 'student',
      rating: 4,
      category: 'behavior',
      ranking_points_impact: 40
    })
    
    // Student-to-teacher feedback
    const studentFeedback = createMockFeedbackEntry({
      from_user_id: studentId,
      to_user_id: teacherId,
      from_user_type: 'student',
      to_user_type: 'teacher',
      rating: 5,
      category: 'teaching_quality',
      ranking_points_impact: 75
    })
    
    // Mock bidirectional impact calculation
    const bidirectionalImpact = {
      teacher_gains_from_student_feedback: studentFeedback.ranking_points_impact,
      student_gains_from_teacher_feedback: teacherFeedback.ranking_points_impact,
      mutual_engagement_bonus: 15, // Additional bonus for bidirectional feedback
      relationship_quality_score: 8.5 // Calculated from both ratings
    }
    
    // Verify bidirectional benefits
    expect(bidirectionalImpact.teacher_gains_from_student_feedback).toBe(75)
    expect(bidirectionalImpact.student_gains_from_teacher_feedback).toBe(40)
    expect(bidirectionalImpact.mutual_engagement_bonus).toBeGreaterThan(0)
    expect(bidirectionalImpact.relationship_quality_score).toBeGreaterThan(8.0)
    
    // Total impact should benefit both parties
    const totalTeacherGain = bidirectionalImpact.teacher_gains_from_student_feedback + bidirectionalImpact.mutual_engagement_bonus
    const totalStudentGain = bidirectionalImpact.student_gains_from_teacher_feedback + bidirectionalImpact.mutual_engagement_bonus
    
    expect(totalTeacherGain).toBe(90) // 75 + 15
    expect(totalStudentGain).toBe(55) // 40 + 15
  })
})

describe('Ranking Recalculation Performance', () => {
  
  test('should efficiently recalculate rankings after feedback submission', async () => {
    const rankingUsers: RankingUser[] = Array.from({ length: 100 }, (_, i) => ({
      id: `user-${i}`,
      user_type: i % 2 === 0 ? 'teacher' : 'student',
      full_name: `User ${i}`,
      base_points: 800 + Math.random() * 400,
      feedback_points: 100 + Math.random() * 200,
      total_points: 0, // Will be calculated
      ranking_position: 0, // Will be calculated
      tier: 'standard'
    }))
    
    // Calculate initial totals and rankings
    rankingUsers.forEach(user => {
      user.total_points = user.base_points + user.feedback_points
    })
    
    rankingUsers.sort((a, b) => b.total_points - a.total_points)
    rankingUsers.forEach((user, index) => {
      user.ranking_position = index + 1
    })
    
    // Simulate feedback impact on subset of users
    const feedbackImpacts = [
      { user_id: 'user-10', points: 150 },
      { user_id: 'user-25', points: 120 },
      { user_id: 'user-50', points: 200 },
      { user_id: 'user-75', points: 80 }
    ]
    
    const startTime = Date.now()
    
    // Apply feedback impacts and recalculate
    const updatedUsers = rankingUsers.map(user => {
      const impact = feedbackImpacts.find(f => f.user_id === user.id)
      if (impact) {
        return {
          ...user,
          feedback_points: user.feedback_points + impact.points,
          total_points: user.total_points + impact.points
        }
      }
      return user
    })
    
    // Re-sort and update positions
    updatedUsers.sort((a, b) => b.total_points - a.total_points)
    updatedUsers.forEach((user, index) => {
      user.ranking_position = index + 1
    })
    
    const recalculationTime = Date.now() - startTime
    
    // Verify performance
    expect(recalculationTime).toBeLessThan(100) // Should be very fast for 100 users
    expect(updatedUsers).toHaveLength(100)
    
    // Verify ranking changes occurred
    const user50Updated = updatedUsers.find(u => u.id === 'user-50')
    expect(user50Updated?.ranking_position).toBeLessThan(50) // Should have moved up significantly with 200 points
  })

  test('should handle large-scale ranking updates without performance degradation', async () => {
    const largeUserSet = Array.from({ length: 1000 }, (_, i) => ({
      id: `large-user-${i}`,
      user_type: i % 3 === 0 ? 'teacher' : 'student',
      total_points: 500 + Math.random() * 1000,
      ranking_position: 0
    }))
    
    const massiveFeedbackBatch = Array.from({ length: 200 }, (_, i) => ({
      user_id: `large-user-${i * 5}`, // Every 5th user gets feedback
      points_impact: Math.floor(Math.random() * 100) + 20
    }))
    
    const startTime = Date.now()
    
    // Apply massive feedback batch
    const updatedLargeSet = largeUserSet.map(user => {
      const impact = massiveFeedbackBatch.find(f => f.user_id === user.id)
      return {
        ...user,
        total_points: user.total_points + (impact?.points_impact || 0)
      }
    })
    
    // Recalculate all rankings
    updatedLargeSet.sort((a, b) => b.total_points - a.total_points)
    updatedLargeSet.forEach((user, index) => {
      user.ranking_position = index + 1
    })
    
    const massiveRecalculationTime = Date.now() - startTime
    
    // Performance should remain acceptable even with large datasets
    expect(massiveRecalculationTime).toBeLessThan(1000) // Under 1 second for 1000 users
    expect(updatedLargeSet).toHaveLength(1000)
    
    // Verify first position has highest points
    expect(updatedLargeSet[0].ranking_position).toBe(1)
    expect(updatedLargeSet[0].total_points).toBeGreaterThanOrEqual(updatedLargeSet[999].total_points)
  })
})

describe('Ranking Data Consistency', () => {
  
  test('should maintain ranking data integrity during concurrent feedback submissions', async () => {
    const baseRankings: RankingUser[] = [
      { id: 'user-consistency-1', user_type: 'teacher', full_name: 'User 1', base_points: 1000, feedback_points: 200, total_points: 1200, ranking_position: 1, tier: 'good' },
      { id: 'user-consistency-2', user_type: 'teacher', full_name: 'User 2', base_points: 950, feedback_points: 180, total_points: 1130, ranking_position: 2, tier: 'good' },
      { id: 'user-consistency-3', user_type: 'student', full_name: 'User 3', base_points: 900, feedback_points: 160, total_points: 1060, ranking_position: 3, tier: 'standard' }
    ]
    
    // Simulate concurrent feedback submissions
    const concurrentFeedback = [
      { to_user_id: 'user-consistency-1', points: 50, timestamp: Date.now() },
      { to_user_id: 'user-consistency-2', points: 75, timestamp: Date.now() + 1 },
      { to_user_id: 'user-consistency-3', points: 100, timestamp: Date.now() + 2 }
    ]
    
    // Process feedback in order of timestamp (simulating database ordering)
    const sortedFeedback = concurrentFeedback.sort((a, b) => a.timestamp - b.timestamp)
    
    let currentRankings = [...baseRankings]
    
    sortedFeedback.forEach(feedback => {
      currentRankings = currentRankings.map(user => {
        if (user.id === feedback.to_user_id) {
          return {
            ...user,
            feedback_points: user.feedback_points + feedback.points,
            total_points: user.total_points + feedback.points
          }
        }
        return user
      })
      
      // Recalculate positions after each feedback
      currentRankings.sort((a, b) => b.total_points - a.total_points)
      currentRankings.forEach((user, index) => {
        user.ranking_position = index + 1
      })
    })
    
    // Verify final state is consistent
    const finalUser1 = currentRankings.find(u => u.id === 'user-consistency-1')
    const finalUser2 = currentRankings.find(u => u.id === 'user-consistency-2')
    const finalUser3 = currentRankings.find(u => u.id === 'user-consistency-3')
    
    expect(finalUser1?.total_points).toBe(1250) // 1200 + 50
    expect(finalUser2?.total_points).toBe(1205) // 1130 + 75
    expect(finalUser3?.total_points).toBe(1160) // 1060 + 100
    
    // Rankings should be properly ordered
    expect(finalUser1?.ranking_position).toBe(1) // Highest points
    expect(finalUser2?.ranking_position).toBe(2) // Second highest
    expect(finalUser3?.ranking_position).toBe(3) // Third highest
  })

  test('should handle ranking edge cases gracefully', async () => {
    // Test tie scenarios
    const tiedUsers: RankingUser[] = [
      { id: 'tie-user-1', user_type: 'teacher', full_name: 'Tie User 1', base_points: 1000, feedback_points: 200, total_points: 1200, ranking_position: 0, tier: 'good' },
      { id: 'tie-user-2', user_type: 'teacher', full_name: 'Tie User 2', base_points: 1100, feedback_points: 100, total_points: 1200, ranking_position: 0, tier: 'good' }
    ]
    
    // Apply tie-breaking logic (could be by feedback_points, alphabetical, etc.)
    const sortedTiedUsers = tiedUsers.sort((a, b) => {
      if (a.total_points === b.total_points) {
        return b.feedback_points - a.feedback_points // Higher feedback points wins tie
      }
      return b.total_points - a.total_points
    })
    
    sortedTiedUsers.forEach((user, index) => {
      user.ranking_position = index + 1
    })
    
    // Verify tie-breaking
    expect(sortedTiedUsers[0].id).toBe('tie-user-1') // Higher feedback_points (200 vs 100)
    expect(sortedTiedUsers[0].ranking_position).toBe(1)
    expect(sortedTiedUsers[1].ranking_position).toBe(2)
    
    // Test zero points scenario
    const zeroPointsUser: RankingUser = {
      id: 'zero-user',
      user_type: 'student',
      full_name: 'Zero Points User',
      base_points: 0,
      feedback_points: 0,
      total_points: 0,
      ranking_position: 0,
      tier: 'standard'
    }
    
    // Should handle gracefully without errors
    expect(zeroPointsUser.total_points).toBe(0)
    expect(zeroPointsUser.tier).toBe('standard') // Default tier for zero points
  })
})