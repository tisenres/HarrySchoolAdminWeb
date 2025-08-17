'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy,
  Coins,
  Target,
  Award,
  TrendingUp,
  Star,
  Zap,
  Plus
} from 'lucide-react'
import type { StudentRanking, StudentAchievement } from '@/types/ranking'
import type { StudentFeedbackOverview } from '@/types/feedback'
import { fadeVariants, staggerContainer, staggerItem } from '@/lib/animations'
import { FeedbackEngagementSummary } from './feedback-engagement-summary'

interface StudentRankingOverviewProps {
  ranking: StudentRanking
  recentAchievements?: StudentAchievement[]
  feedbackOverview?: StudentFeedbackOverview | null
  onQuickPointAward?: () => void
  onAwardAchievement?: () => void
  onSubmitFeedback?: () => void
  onViewFeedbackDetails?: () => void
  loading?: boolean
}

export function StudentRankingOverview({
  ranking,
  recentAchievements = [],
  feedbackOverview,
  onQuickPointAward,
  onAwardAchievement,
  onSubmitFeedback,
  onViewFeedbackDetails,
  loading = false
}: StudentRankingOverviewProps) {
  
  // Calculate level progress (assuming 100 points per level)
  const pointsPerLevel = 100
  const currentLevelPoints = ranking.total_points % pointsPerLevel
  const progressToNextLevel = (currentLevelPoints / pointsPerLevel) * 100
  
  // Calculate rank display
  const getRankDisplay = (rank: number | null) => {
    if (!rank) return 'Unranked'
    if (rank === 1) return '🥇 1st Place'
    if (rank === 2) return '🥈 2nd Place'
    if (rank === 3) return '🥉 3rd Place'
    return `#${rank}`
  }
  
  const getRankColor = (rank: number | null) => {
    if (!rank) return 'bg-gray-100 text-gray-800 border-gray-200'
    if (rank <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (rank <= 10) return 'bg-blue-100 text-blue-800 border-blue-200'
    return 'bg-green-100 text-green-800 border-green-200'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-24"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Stats Cards */}
      <motion.div 
        variants={staggerItem}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        {/* Total Points */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {ranking.total_points.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time earned points
            </p>
          </CardContent>
        </Card>

        {/* Available Coins */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Coins</CardTitle>
            <Coins className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {ranking.available_coins}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready to spend
            </p>
          </CardContent>
        </Card>

        {/* Current Level */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Level</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              Level {ranking.current_level}
            </div>
            <div className="mt-2">
              <Progress value={progressToNextLevel} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {currentLevelPoints}/{pointsPerLevel} to next level
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current Rank */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Rank</CardTitle>
            <Trophy className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <Badge className={`${getRankColor(ranking.current_rank)} text-base font-bold mb-2`}>
              {getRankDisplay(ranking.current_rank)}
            </Badge>
            <p className="text-xs text-muted-foreground">
              Among all students
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions, Recent Achievements & Feedback Engagement */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {onQuickPointAward && (
                <Button 
                  onClick={onQuickPointAward}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Award Points
                </Button>
              )}
              {onAwardAchievement && (
                <Button 
                  onClick={onAwardAchievement}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Grant Achievement
                </Button>
              )}
              <Button 
                className="w-full justify-start"
                variant="outline"
                disabled
              >
                <Target className="h-4 w-4 mr-2" />
                Set Goal (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Achievements */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-4 w-4" />
                <span>Recent Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentAchievements.length > 0 ? (
                <div className="space-y-3">
                  {recentAchievements.slice(0, 3).map((achievement) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center space-x-3 p-3 bg-muted rounded-lg"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold`}
                           style={{ backgroundColor: achievement.achievement?.badge_color || '#4F7942' }}>
                        {achievement.achievement?.icon_name || '🏆'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {achievement.achievement?.name || 'Achievement'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(achievement.earned_at).toLocaleDateString()}
                        </p>
                      </div>
                      {achievement.achievement?.points_reward && (
                        <Badge variant="secondary" className="text-xs">
                          +{achievement.achievement.points_reward} pts
                        </Badge>
                      )}
                    </motion.div>
                  ))}
                  {recentAchievements.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{recentAchievements.length - 3} more achievements
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No achievements earned yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Keep up the good work to earn badges!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Feedback Engagement */}
        <motion.div variants={staggerItem}>
          <FeedbackEngagementSummary
            feedbackOverview={feedbackOverview}
            loading={loading}
            onViewDetails={onViewFeedbackDetails}
            onSubmitFeedback={onSubmitFeedback}
          />
        </motion.div>
      </div>

      {/* Progress Summary */}
      <motion.div variants={staggerItem}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Progress Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#4F7942]">
                  {ranking.total_points}
                </div>
                <p className="text-sm text-muted-foreground">Points Earned</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {recentAchievements.length}
                </div>
                <p className="text-sm text-muted-foreground">Achievements</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {ranking.spent_coins}
                </div>
                <p className="text-sm text-muted-foreground">Coins Spent</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {feedbackOverview?.feedback_given?.total_submitted || 0}
                </div>
                <p className="text-sm text-muted-foreground">Feedback Given</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}