'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  MessageSquare,
  Star,
  Plus,
  TrendingUp,
  Users,
  Clock,
  Award,
  ChevronRight
} from 'lucide-react'
import { FeedbackSubmissionForm } from './feedback-submission-form'
import type { TeacherWithRanking } from '@/types/ranking'

interface ContextualFeedbackWidgetProps {
  teacher: TeacherWithRanking
  context?: 'profile' | 'group' | 'ranking'
  showQuickActions?: boolean
  embeddedView?: boolean
  groupContext?: { id: string; name: string; subject?: string }
  className?: string
}

export function ContextualFeedbackWidget({
  teacher,
  context = 'profile',
  showQuickActions = true,
  embeddedView = true,
  groupContext,
  className = ''
}: ContextualFeedbackWidgetProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)

  // Mock feedback summary data - would come from API in real implementation
  const feedbackSummary = {
    totalReceived: 24,
    averageRating: 4.3,
    recentCount: 6,
    lastWeekChange: +0.2,
    categoryBreakdown: [
      { category: 'Teaching Quality', rating: 4.5, percentage: 85 },
      { category: 'Communication', rating: 4.2, percentage: 80 },
      { category: 'Behavior', rating: 4.1, percentage: 78 }
    ],
    rankingImpact: {
      pointsFromFeedback: 185,
      qualityContribution: 8.5
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 3.5) return 'text-blue-600'
    if (rating >= 2.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}`
  }

  if (context === 'ranking') {
    // Compact widget for ranking/performance context
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Feedback Impact</span>
            </div>
            <Badge variant="outline" className="text-xs">
              +{feedbackSummary.rankingImpact.pointsFromFeedback} pts
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Avg Rating</span>
              <span className={`text-sm font-bold ${getRatingColor(feedbackSummary.averageRating)}`}>
                {feedbackSummary.averageRating.toFixed(1)}/5.0
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Quality Impact</span>
              <span className="text-sm font-medium text-blue-600">
                +{feedbackSummary.rankingImpact.qualityContribution}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Recent Trend</span>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">
                  {formatChange(feedbackSummary.lastWeekChange)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (context === 'group') {
    // Group context widget
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Class Feedback</span>
            </div>
            {showQuickActions && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowFeedbackForm(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Recent Rating</p>
              <div className="flex items-center space-x-1">
                <span className={`text-lg font-bold ${getRatingColor(feedbackSummary.averageRating)}`}>
                  {feedbackSummary.averageRating.toFixed(1)}
                </span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.floor(feedbackSummary.averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Participation</p>
              <p className="text-lg font-bold">{feedbackSummary.recentCount}</p>
              <p className="text-xs text-muted-foreground">this month</p>
            </div>
          </div>
          
          {groupContext && (
            <div className="p-2 bg-muted rounded text-center">
              <p className="text-xs text-muted-foreground">
                Share feedback about <span className="font-medium">{teacher.full_name}</span> in {groupContext.name}
              </p>
            </div>
          )}
        </CardContent>

        <FeedbackSubmissionForm
          recipient={teacher}
          groupContext={groupContext}
          open={showFeedbackForm}
          onOpenChange={setShowFeedbackForm}
          onSubmit={() => {
            setShowFeedbackForm(false)
            // Refresh data in real implementation
          }}
        />
      </Card>
    )
  }

  // Default profile context widget
  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Student Feedback</span>
          </div>
          {showQuickActions && (
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowFeedbackForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Give Feedback
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{feedbackSummary.totalReceived}</div>
            <div className="text-xs text-muted-foreground">Total Reviews</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getRatingColor(feedbackSummary.averageRating)}`}>
              {feedbackSummary.averageRating.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Avg Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              +{feedbackSummary.rankingImpact.pointsFromFeedback}
            </div>
            <div className="text-xs text-muted-foreground">Ranking Points</div>
          </div>
        </div>

        {/* Recent Trend */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Recent Trend</span>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">
                {formatChange(feedbackSummary.lastWeekChange)} this week
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{feedbackSummary.recentCount} reviews in the last 30 days</span>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Performance by Category</h4>
          {feedbackSummary.categoryBreakdown.map((category, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm">{category.category}</span>
                <span className={`text-sm font-medium ${getRatingColor(category.rating)}`}>
                  {category.rating.toFixed(1)}
                </span>
              </div>
              <Progress value={category.percentage} className="h-2" />
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        {showQuickActions && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">
                  Help {teacher.full_name} improve
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowFeedbackForm(true)}
                className="text-blue-600 hover:text-blue-700"
              >
                Share Feedback
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <FeedbackSubmissionForm
        recipient={teacher}
        groupContext={groupContext}
        open={showFeedbackForm}
        onOpenChange={setShowFeedbackForm}
        onSubmit={() => {
          setShowFeedbackForm(false)
          // Refresh data in real implementation
        }}
      />
    </Card>
  )
}