'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus, Award, History, BarChart3, MessageSquare } from 'lucide-react'
import { StudentRankingOverview } from './student-ranking-overview'
import { PointsTransactionHistory } from './points-transaction-history'
import { AchievementGallery } from './achievement-gallery'
import { QuickPointAward } from './quick-point-award'
import type { Student } from '@/types/student'
import type { StudentRanking, PointsTransaction, StudentAchievement, PointsAwardRequest } from '@/types/ranking'
import type { StudentFeedbackOverview, FeedbackFormData, FeedbackEntry } from '@/types/feedback'
import { fadeVariants } from '@/lib/animations'
import { FeedbackPointsHistory } from './feedback-points-history'
import { QuickFeedbackModal } from './quick-feedback-modal'
import { feedbackService } from '@/lib/services/feedback-service'

interface StudentRankingTabProps {
  student: Student
  loading?: boolean
}

// Mock data - in real implementation, this would come from API calls
const generateMockRanking = (studentId: string): StudentRanking => ({
  id: `ranking-${studentId}`,
  student_id: studentId,
  organization_id: 'org-1',
  total_points: Math.floor(Math.random() * 500) + 100,
  available_coins: Math.floor(Math.random() * 50) + 10,
  spent_coins: Math.floor(Math.random() * 30),
  current_level: Math.floor(Math.random() * 10) + 1,
  current_rank: Math.floor(Math.random() * 50) + 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

const generateMockTransactions = (studentId: string): PointsTransaction[] => {
  const categories = ['homework', 'attendance', 'behavior', 'achievement', 'manual']
  const types: Array<'earned' | 'deducted' | 'bonus'> = ['earned', 'earned', 'earned', 'deducted', 'bonus']
  const reasons = [
    'Homework completed on time',
    'Perfect attendance this week',
    'Helped classmate with assignment',
    'Late submission penalty',
    'Exceptional participation',
    'Quiz completed excellently',
    'Behavior improvement',
    'Bonus points for creativity'
  ]

  return Array.from({ length: 20 }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)]
    const basePoints = Math.floor(Math.random() * 20) + 1
    const points = type === 'deducted' ? -basePoints : basePoints
    
    return {
      id: `transaction-${i}`,
      student_id: studentId,
      organization_id: 'org-1',
      transaction_type: type,
      points_amount: points,
      coins_earned: type !== 'deducted' ? Math.floor(points / 5) : 0,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      awarded_by: 'admin-1',
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      awarded_by_profile: {
        full_name: 'Admin User',
        avatar_url: undefined
      }
    }
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

const generateMockAchievements = (studentId: string): StudentAchievement[] => {
  const achievementTypes = ['homework', 'attendance', 'behavior', 'streak', 'milestone', 'special']
  const achievementData = [
    { name: 'Homework Hero', desc: 'Completed 10 homework assignments in a row', icon: '📚', color: '#4F7942' },
    { name: 'Perfect Attendance', desc: 'No absences for a full month', icon: '📅', color: '#10B981' },
    { name: 'Helping Hand', desc: 'Helped 5 classmates this week', icon: '🤝', color: '#8B5CF6' },
    { name: 'Speed Reader', desc: 'Read 3 books this month', icon: '📖', color: '#F59E0B' },
    { name: 'Math Wizard', desc: 'Scored 100% on 3 math tests', icon: '🧮', color: '#EF4444' },
    { name: 'Early Bird', desc: 'Arrived early every day this week', icon: '🌅', color: '#06B6D4' }
  ]

  return Array.from({ length: Math.floor(Math.random() * 6) + 2 }, (_, i) => {
    const data = achievementData[i % achievementData.length]
    const type = achievementTypes[Math.floor(Math.random() * achievementTypes.length)]
    
    return {
      id: `student-achievement-${i}`,
      student_id: studentId,
      achievement_id: `achievement-${i}`,
      organization_id: 'org-1',
      earned_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      awarded_by: 'admin-1',
      notes: `Earned for exceptional ${type} performance`,
      achievement: {
        id: `achievement-${i}`,
        organization_id: 'org-1',
        name: data.name,
        description: data.desc,
        icon_name: data.icon,
        badge_color: data.color,
        points_reward: Math.floor(Math.random() * 20) + 5,
        coins_reward: Math.floor(Math.random() * 10) + 2,
        achievement_type: type,
        is_active: true,
        created_by: 'admin-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      awarded_by_profile: {
        full_name: 'Admin User',
        avatar_url: undefined
      }
    }
  }).sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())
}

const generateMockFeedback = (studentId: string, direction: 'given' | 'received'): FeedbackEntry[] => {
  const categories = ['teaching_quality', 'communication', 'behavior', 'homework', 'attendance']
  const messages = [
    'Great teaching style and clear explanations',
    'Very helpful and patient with questions',
    'Excellent communication skills',
    'Always punctual and well-prepared',
    'Creates a positive learning environment'
  ]

  return Array.from({ length: Math.floor(Math.random() * 5) + 2 }, (_, i) => ({
    id: `feedback-${direction}-${i}`,
    organization_id: 'org-1',
    from_user_id: direction === 'given' ? studentId : `teacher-${i}`,
    to_user_id: direction === 'given' ? `teacher-${i}` : studentId,
    from_user_type: direction === 'given' ? 'student' as const : 'teacher' as const,
    to_user_type: direction === 'given' ? 'teacher' as const : 'student' as const,
    message: messages[Math.floor(Math.random() * messages.length)],
    rating: Math.floor(Math.random() * 2) + 4, // 4-5 rating
    category: categories[Math.floor(Math.random() * categories.length)],
    is_anonymous: Math.random() > 0.7,
    affects_ranking: true,
    ranking_points_impact: Math.floor(Math.random() * 30) + 20,
    status: 'active' as const,
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    from_user_profile: direction === 'given' ? {
      full_name: 'Current Student',
      avatar_url: undefined,
      user_type: 'student' as const
    } : {
      full_name: `Teacher ${i + 1}`,
      avatar_url: undefined,
      user_type: 'teacher' as const
    },
    to_user_profile: direction === 'given' ? {
      full_name: `Teacher ${i + 1}`,
      avatar_url: undefined,
      user_type: 'teacher' as const
    } : {
      full_name: 'Current Student',
      avatar_url: undefined,
      user_type: 'student' as const
    }
  })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export function StudentRankingTab({ student, loading = false }: StudentRankingTabProps) {
  const [ranking, setRanking] = useState<StudentRanking | null>(null)
  const [transactions, setTransactions] = useState<PointsTransaction[]>([])
  const [achievements, setAchievements] = useState<StudentAchievement[]>([])
  const [feedbackOverview, setFeedbackOverview] = useState<StudentFeedbackOverview | null>(null)
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [isPointAwardOpen, setIsPointAwardOpen] = useState(false)
  const [pointAwardLoading, setPointAwardLoading] = useState(false)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  // Load mock data on component mount
  useEffect(() => {
    if (student.id) {
      setRanking(generateMockRanking(student.id))
      setTransactions(generateMockTransactions(student.id))
      setAchievements(generateMockAchievements(student.id))
      loadFeedbackData()
    }
  }, [student.id])

  const loadFeedbackData = async () => {
    try {
      // In a real implementation, this would call the actual feedback service
      // For now, we'll generate some mock feedback data
      const mockFeedbackOverview: StudentFeedbackOverview = {
        feedback_given: {
          total_submitted: Math.floor(Math.random() * 15) + 5,
          recent_submissions: generateMockFeedback(student.id, 'given'),
          engagement_score: Math.floor(Math.random() * 40) + 60,
          categories_covered: ['teaching_quality', 'communication', 'behavior']
        },
        feedback_received: {
          total_received: Math.floor(Math.random() * 20) + 10,
          average_rating: 4.2 + Math.random() * 0.7,
          recent_feedback: generateMockFeedback(student.id, 'received'),
          improvement_suggestions: []
        },
        ranking_impact: {
          points_from_engagement: Math.floor(Math.random() * 100) + 50,
          quality_bonus: Math.floor(Math.random() * 30) + 10,
          feedback_streaks: Math.floor(Math.random() * 5)
        }
      }
      
      setFeedbackOverview(mockFeedbackOverview)
      setFeedbackEntries([
        ...mockFeedbackOverview.feedback_given.recent_submissions,
        ...mockFeedbackOverview.feedback_received.recent_feedback
      ])
    } catch (error) {
      console.error('Error loading feedback data:', error)
    }
  }

  const handlePointAward = async (data: PointsAwardRequest) => {
    setPointAwardLoading(true)
    try {
      // Mock API call - in real implementation, this would call the actual API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Create mock transaction
      const newTransaction: PointsTransaction = {
        id: `transaction-new-${Date.now()}`,
        student_id: student.id,
        organization_id: 'org-1',
        transaction_type: data.transaction_type || 'earned',
        points_amount: data.points_amount,
        coins_earned: Math.max(0, Math.floor(data.points_amount / 5)),
        reason: data.reason,
        category: data.category,
        awarded_by: 'current-admin',
        created_at: new Date().toISOString(),
        awarded_by_profile: {
          full_name: 'Current Admin',
          avatar_url: undefined
        }
      }

      // Update transactions
      setTransactions(prev => [newTransaction, ...prev])

      // Update ranking
      if (ranking) {
        const newTotalPoints = ranking.total_points + data.points_amount
        const newCoins = ranking.available_coins + Math.max(0, Math.floor(data.points_amount / 5))
        setRanking(prev => prev ? {
          ...prev,
          total_points: newTotalPoints,
          available_coins: newCoins,
          current_level: Math.floor(newTotalPoints / 100) + 1,
          updated_at: new Date().toISOString()
        } : null)
      }

      console.log('Points awarded successfully:', data)
    } catch (error) {
      console.error('Error awarding points:', error)
      throw error
    } finally {
      setPointAwardLoading(false)
    }
  }

  const handleFeedbackSubmit = async (data: FeedbackFormData) => {
    setFeedbackLoading(true)
    try {
      // Mock feedback submission - in real implementation, this would call the actual API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Create mock feedback entry
      const newFeedback: FeedbackEntry = {
        id: `feedback-new-${Date.now()}`,
        organization_id: 'org-1',
        from_user_id: student.id,
        to_user_id: data.to_user_id,
        from_user_type: 'student',
        to_user_type: data.to_user_type,
        message: data.message,
        rating: data.rating,
        category: data.category,
        is_anonymous: data.is_anonymous,
        affects_ranking: true,
        ranking_points_impact: data.rating * 10,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        from_user_profile: {
          full_name: student.full_name,
          avatar_url: undefined,
          user_type: 'student'
        },
        to_user_profile: {
          full_name: 'Teacher Name',
          avatar_url: undefined,
          user_type: 'teacher'
        }
      }

      // Update feedback data
      setFeedbackEntries(prev => [newFeedback, ...prev])
      if (feedbackOverview) {
        setFeedbackOverview(prev => prev ? {
          ...prev,
          feedback_given: {
            ...prev.feedback_given,
            total_submitted: prev.feedback_given.total_submitted + 1,
            recent_submissions: [newFeedback, ...prev.feedback_given.recent_submissions.slice(0, 4)]
          }
        } : null)
      }

      console.log('Feedback submitted successfully:', data)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      throw error
    } finally {
      setFeedbackLoading(false)
    }
  }

  if (loading || !ranking) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header with Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Student Ranking</h3>
          <p className="text-sm text-muted-foreground">
            Points, achievements, and performance tracking
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPointAwardOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Award Points
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Award className="h-4 w-4 mr-2" />
            Grant Achievement
          </Button>
        </div>
      </div>

      {/* Ranking Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>History</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Achievements</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Feedback</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2" disabled>
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <StudentRankingOverview
            ranking={ranking}
            recentAchievements={achievements.slice(0, 3)}
            feedbackOverview={feedbackOverview}
            onQuickPointAward={() => setIsPointAwardOpen(true)}
            onSubmitFeedback={() => setIsFeedbackModalOpen(true)}
            onViewFeedbackDetails={() => setActiveTab('feedback')}
            loading={false}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <PointsTransactionHistory
            transactions={transactions}
            loading={false}
          />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <AchievementGallery
            achievements={achievements}
            loading={false}
          />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <FeedbackPointsHistory
            feedbackEntries={feedbackEntries}
            loading={false}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
            <p className="text-muted-foreground">
              Detailed performance analytics and insights will be available in the next update.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Point Award Modal */}
      <QuickPointAward
        open={isPointAwardOpen}
        onOpenChange={setIsPointAwardOpen}
        studentIds={[student.id]}
        studentNames={[student.full_name]}
        onSubmit={handlePointAward}
        loading={pointAwardLoading}
      />

      {/* Quick Feedback Modal */}
      <QuickFeedbackModal
        open={isFeedbackModalOpen}
        onOpenChange={setIsFeedbackModalOpen}
        recipientId="teacher-1" // Mock teacher ID
        recipientName="Ms. Johnson" // Mock teacher name
        recipientType="teacher"
        onSubmit={handleFeedbackSubmit}
        loading={feedbackLoading}
      />
    </motion.div>
  )
}