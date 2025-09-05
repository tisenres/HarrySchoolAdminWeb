'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  MessageSquare,
  Star,
  TrendingUp,
  Clock,
  Users,
  Award,
  ChevronRight,
  Lightbulb,
  Target,
  CheckCircle2,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { NotificationWithRelations } from '@/types/notification'

interface FeedbackOpportunity {
  id: string
  type: 'class_completion' | 'achievement_unlock' | 'goal_milestone' | 'interaction_quality' | 'periodic_reminder'
  title: string
  description: string
  context: {
    userId: string
    userName: string
    userType: 'student' | 'teacher'
    groupId?: string
    groupName?: string
    achievementName?: string
    goalName?: string
  }
  suggestedTemplates: string[]
  urgency: 'low' | 'medium' | 'high'
  expiresAt?: Date
  metadata?: {
    lastInteractionDate?: Date
    interactionCount?: number
    averageRating?: number
    responseRate?: number
  }
}

interface FeedbackOpportunityWidgetProps {
  opportunities: FeedbackOpportunity[]
  onSubmitFeedback: (opportunityId: string, templateId?: string) => void
  onDismiss: (opportunityId: string) => void
  className?: string
  maxDisplayed?: number
}

export function FeedbackOpportunityWidget({
  opportunities = [],
  onSubmitFeedback,
  onDismiss,
  className,
  maxDisplayed = 3
}: FeedbackOpportunityWidgetProps) {
  const { toast } = useToast()
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  // Filter out dismissed opportunities and sort by urgency
  const activeOpportunities = opportunities
    .filter(opp => !dismissedIds.has(opp.id))
    .sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 }
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
    })
    .slice(0, maxDisplayed)

  const handleDismiss = (opportunityId: string) => {
    setDismissedIds(prev => new Set([...prev, opportunityId]))
    onDismiss(opportunityId)
    
    toast({
      title: "Feedback suggestion dismissed",
      description: "We'll suggest similar opportunities later."
    })
  }

  const handleSubmitFeedback = (opportunityId: string, templateId?: string) => {
    onSubmitFeedback(opportunityId, templateId)
    
    toast({
      title: "Feedback submitted successfully",
      description: "Your feedback helps improve the learning experience."
    })
  }

  const getOpportunityIcon = (type: FeedbackOpportunity['type']) => {
    switch (type) {
      case 'class_completion':
        return CheckCircle2
      case 'achievement_unlock':
        return Award
      case 'goal_milestone':
        return Target
      case 'interaction_quality':
        return Star
      case 'periodic_reminder':
        return Clock
      default:
        return Lightbulb
    }
  }

  const getUrgencyColor = (urgency: FeedbackOpportunity['urgency']) => {
    switch (urgency) {
      case 'high':
        return 'border-orange-200 bg-orange-50'
      case 'medium':
        return 'border-blue-200 bg-blue-50'
      case 'low':
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getUrgencyBadgeVariant = (urgency: FeedbackOpportunity['urgency']) => {
    switch (urgency) {
      case 'high':
        return 'destructive' as const
      case 'medium':
        return 'default' as const
      case 'low':
        return 'secondary' as const
    }
  }

  if (activeOpportunities.length === 0) {
    return null
  }

  return (
    <Card className={cn("border-l-4 border-l-blue-500", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-4 w-4 text-blue-500" />
            <span>Feedback Opportunities</span>
            <Badge variant="outline" className="text-xs">
              {activeOpportunities.length}
            </Badge>
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>Smart suggestions</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeOpportunities.map((opportunity) => {
          const IconComponent = getOpportunityIcon(opportunity.type)
          
          return (
            <div
              key={opportunity.id}
              className={cn(
                "p-3 rounded-lg border transition-all hover:shadow-sm",
                getUrgencyColor(opportunity.urgency)
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start space-x-2 flex-1">
                  <IconComponent className="h-4 w-4 mt-0.5 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium truncate">
                        {opportunity.title}
                      </h4>
                      <Badge
                        variant={getUrgencyBadgeVariant(opportunity.urgency)}
                        className="text-xs"
                      >
                        {opportunity.urgency}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {opportunity.description}
                    </p>
                    
                    {/* Context Information */}
                    <div className="flex items-center space-x-3 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{opportunity.context.userName}</span>
                      </div>
                      {opportunity.context.groupName && (
                        <div className="flex items-center space-x-1">
                          <span>•</span>
                          <span>{opportunity.context.groupName}</span>
                        </div>
                      )}
                      {opportunity.expiresAt && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Expires {opportunity.expiresAt.toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Metadata Display */}
                    {opportunity.metadata && (
                      <div className="flex items-center space-x-3 mt-1 text-xs">
                        {opportunity.metadata.averageRating && (
                          <span className="text-green-600">
                            Avg: {opportunity.metadata.averageRating.toFixed(1)}/5
                          </span>
                        )}
                        {opportunity.metadata.responseRate && (
                          <span className="text-blue-600">
                            Response: {Math.round(opportunity.metadata.responseRate * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => handleDismiss(opportunity.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-2">
                  {opportunity.suggestedTemplates.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {opportunity.suggestedTemplates.length} templates
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleSubmitFeedback(opportunity.id)}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Give Feedback
                  </Button>
                  {opportunity.suggestedTemplates.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-blue-600 hover:text-blue-700"
                      onClick={() => handleSubmitFeedback(opportunity.id, opportunity.suggestedTemplates[0])}
                    >
                      Use Template
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Summary Footer */}
        <div className="pt-2 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Suggestions based on recent activities and engagement patterns
          </p>
        </div>
      </CardContent>
    </Card>
  )
}