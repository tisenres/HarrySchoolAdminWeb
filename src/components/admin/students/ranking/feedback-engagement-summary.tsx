'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  MessageSquare,
  TrendingUp,
  Star,
  ThumbsUp,
  Award,
  Users,
  Target,
  Zap
} from 'lucide-react'
import type { StudentFeedbackOverview } from '@/types/feedback'
import { fadeVariants, staggerContainer, staggerItem } from '@/lib/animations'

interface FeedbackEngagementSummaryProps {
  feedbackOverview: StudentFeedbackOverview | null
  loading?: boolean
  onViewDetails?: () => void
  onSubmitFeedback?: () => void
}

export function FeedbackEngagementSummary({
  feedbackOverview,
  loading = false,
  onViewDetails,
  onSubmitFeedback
}: FeedbackEngagementSummaryProps) {
  
  // Calculate engagement level based on feedback activity
  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (score >= 60) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    if (score >= 40) return { level: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    return { level: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-100' }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Feedback Engagement</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-20"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!feedbackOverview) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Feedback Engagement</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground mb-3">
              No feedback activity yet
            </p>
            {onSubmitFeedback && (
              <Button onClick={onSubmitFeedback} size="sm" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Engaging
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const engagementScore = feedbackOverview.feedback_given?.engagement_score || 0
  const engagement = getEngagementLevel(engagementScore)
  const totalGiven = feedbackOverview.feedback_given?.total_submitted || 0
  const totalReceived = feedbackOverview.feedback_received?.total_received || 0
  const averageRating = feedbackOverview.feedback_received?.average_rating || 0
  const engagementPoints = feedbackOverview.ranking_impact?.points_from_engagement || 0

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Feedback Engagement</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Engagement Score */}
          <motion.div variants={staggerItem}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Engagement Level</span>
              <Badge className={`${engagement.bgColor} ${engagement.color} border-0`}>
                {engagement.level}
              </Badge>
            </div>
            <Progress value={engagementScore} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {engagementScore}% engagement score
            </p>
          </motion.div>

          {/* Feedback Stats Grid */}
          <motion.div 
            variants={staggerContainer}
            className="grid grid-cols-2 gap-4"
          >
            {/* Feedback Given */}
            <motion.div variants={staggerItem} className="text-center p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <MessageSquare className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-xs font-medium">Given</span>
              </div>
              <div className="text-lg font-bold text-blue-600">{totalGiven}</div>
              <p className="text-xs text-muted-foreground">feedback submitted</p>
            </motion.div>

            {/* Feedback Received */}
            <motion.div variants={staggerItem} className="text-center p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <ThumbsUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs font-medium">Received</span>
              </div>
              <div className="text-lg font-bold text-green-600">{totalReceived}</div>
              <p className="text-xs text-muted-foreground">feedback received</p>
            </motion.div>
          </motion.div>

          {/* Average Rating & Points */}
          <motion.div variants={staggerItem} className="space-y-3">
            {/* Average Rating */}
            {averageRating > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Average Rating</span>
                </div>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= averageRating
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm font-medium ml-1">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
              </div>
            )}

            {/* Engagement Points */}
            {engagementPoints > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Engagement Points</span>
                </div>
                <div className="text-sm font-bold text-purple-600">
                  +{engagementPoints}
                </div>
              </div>
            )}
          </motion.div>

          {/* Recent Activity Preview */}
          {feedbackOverview.feedback_given?.recent_submissions && 
           feedbackOverview.feedback_given.recent_submissions.length > 0 && (
            <motion.div variants={staggerItem}>
              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Recent Activity</span>
                  {onViewDetails && (
                    <Button variant="ghost" size="sm" onClick={onViewDetails}>
                      View All
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {feedbackOverview.feedback_given.recent_submissions.slice(0, 2).map((feedback) => (
                    <div key={feedback.id} className="flex items-center space-x-2 text-xs">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-muted-foreground">
                        Feedback to {feedback.to_user_profile?.full_name || 'teacher'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {feedback.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div variants={staggerItem} className="flex gap-2 pt-2">
            {onSubmitFeedback && (
              <Button onClick={onSubmitFeedback} size="sm" className="flex-1">
                <MessageSquare className="h-4 w-4 mr-2" />
                Give Feedback
              </Button>
            )}
            {onViewDetails && (
              <Button onClick={onViewDetails} variant="outline" size="sm" className="flex-1">
                View Details
              </Button>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}