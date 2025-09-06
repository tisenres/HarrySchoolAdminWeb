'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MessageSquare,
  Star,
  Calendar,
  TrendingUp,
  ThumbsUp,
  Users,
  Award
} from 'lucide-react'
import type { FeedbackEntry } from '@/types/feedback'
import { fadeVariants, staggerContainer, staggerItem } from '@/lib/animations'

interface FeedbackPointsHistoryProps {
  feedbackEntries: FeedbackEntry[]
  loading?: boolean
  showAsTransactions?: boolean
}

export function FeedbackPointsHistory({
  feedbackEntries,
  loading = false,
  showAsTransactions = false
}: FeedbackPointsHistoryProps) {
  
  // Filter feedback that affects ranking
  const rankingFeedback = useMemo(() => {
    return feedbackEntries.filter(fb => fb.affects_ranking && fb.ranking_points_impact > 0)
  }, [feedbackEntries])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      teaching_quality: 'bg-blue-100 text-blue-800 border-blue-200',
      communication: 'bg-green-100 text-green-800 border-green-200',
      behavior: 'bg-purple-100 text-purple-800 border-purple-200',
      homework: 'bg-orange-100 text-orange-800 border-orange-200',
      attendance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      professional_development: 'bg-pink-100 text-pink-800 border-pink-200'
    } as const
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Feedback Points History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (rankingFeedback.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Feedback Points History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-sm font-medium mb-2">No Feedback Points Yet</h3>
            <p className="text-xs text-muted-foreground">
              Points from received feedback will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Feedback Points History</span>
            </div>
            <Badge variant="secondary">
              {rankingFeedback.length} entries
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div variants={staggerContainer} className="space-y-4">
            {rankingFeedback.slice(0, 10).map((feedback, index) => (
              <motion.div
                key={feedback.id}
                variants={staggerItem}
                custom={index}
                className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Feedback Source Avatar */}
                <div className="flex-shrink-0">
                  {feedback.from_user_profile ? (
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={feedback.from_user_profile.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                        {feedback.from_user_profile.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Feedback Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium">
                          {feedback.from_user_profile?.full_name || 'Anonymous'}
                        </span>
                        <Badge className={getCategoryColor(feedback.category)} variant="outline">
                          {feedback.category.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      {/* Rating */}
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center space-x-1">
                          {getRatingStars(feedback.rating)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {feedback.rating}/5
                        </span>
                      </div>

                      {/* Message Preview */}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {feedback.message}
                      </p>
                    </div>

                    {/* Points Badge */}
                    <div className="flex-shrink-0 ml-4">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{feedback.ranking_points_impact} pts
                      </Badge>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      {feedback.group && (
                        <span className="flex items-center space-x-1">
                          <Award className="h-3 w-3" />
                          <span>{feedback.group.name}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(feedback.created_at)}</span>
                      </span>
                    </div>
                    
                    {feedback.is_anonymous && (
                      <Badge variant="outline" className="text-xs">
                        Anonymous
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Show more indicator */}
            {rankingFeedback.length > 10 && (
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  +{rankingFeedback.length - 10} more feedback entries
                </p>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}