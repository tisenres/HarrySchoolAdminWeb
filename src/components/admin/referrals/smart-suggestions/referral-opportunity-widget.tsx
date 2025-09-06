'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users,
  UserPlus,
  TrendingUp,
  Sparkles,
  Heart,
  Star,
  Trophy,
  Target,
  Lightbulb,
  MessageCircle,
  Clock,
  Smile
} from 'lucide-react'

interface AchievementContext {
  achievement_id: string
  achievement_title: string
  user_id: string
  user_name: string
  user_type: 'student' | 'teacher'
  points_awarded: number
  rarity: string
  achievement_category: string
}

interface ReferralOpportunity {
  id: string
  trigger: 'achievement_unlock' | 'goal_completion' | 'milestone_reached' | 'positive_feedback'
  suggestion_text: string
  reasoning: string
  confidence_score: number
  potential_matches: string[]
  timing_score: number
  success_probability: number
}

interface ReferralOpportunityWidgetProps {
  achievementContext?: AchievementContext
  isVisible: boolean
  onDismiss: () => void
  onCreateReferral: () => void
  onRemindLater: () => void
  onViewTips: () => void
}

export function ReferralOpportunityWidget({
  achievementContext,
  isVisible,
  onDismiss,
  onCreateReferral,
  onRemindLater,
  onViewTips
}: ReferralOpportunityWidgetProps) {
  const [opportunity, setOpportunity] = useState<ReferralOpportunity | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Generate intelligent referral opportunity based on achievement context
  useEffect(() => {
    if (achievementContext && isVisible) {
      const generatedOpportunity = generateReferralOpportunity(achievementContext)
      setOpportunity(generatedOpportunity)
    }
  }, [achievementContext, isVisible])

  const generateReferralOpportunity = (context: AchievementContext): ReferralOpportunity => {
    const opportunities = {
      'academic_excellence': {
        suggestion: "Perfect timing to share your success! 📚 Friends who love learning might be inspired by your achievement.",
        reasoning: "Academic achievements show great learning outcomes that attract similar motivated individuals.",
        confidence: 85,
        matches: ['study buddies', 'academic peers', 'motivated learners']
      },
      'collaboration': {
        suggestion: "Your teamwork skills shine! 🤝 Know someone who values collaboration and community learning?",
        reasoning: "Collaborative achievements demonstrate the social learning environment here.",
        confidence: 80,
        matches: ['team players', 'community-minded friends', 'social learners']
      },
      'consistency': {
        suggestion: "Your dedication is inspiring! 💪 Share this milestone with friends who appreciate consistent growth.",
        reasoning: "Consistency achievements show the supportive, structured learning environment.",
        confidence: 90,
        matches: ['goal-oriented friends', 'discipline-focused individuals', 'growth mindset people']
      },
      'innovation': {
        suggestion: "Your creative thinking deserves recognition! 💡 Know any innovative minds who'd thrive here?",
        reasoning: "Innovation achievements showcase our creative and forward-thinking approach.",
        confidence: 75,
        matches: ['creative thinkers', 'innovators', 'out-of-the-box learners']
      },
      'mentorship': {
        suggestion: "You're making a real difference! 🌟 Share how rewarding teaching others can be.",
        reasoning: "Mentorship achievements demonstrate the collaborative teaching culture.",
        confidence: 88,
        matches: ['natural mentors', 'helper personalities', 'teaching-inclined friends']
      }
    }

    const categoryData = opportunities[context.achievement_category as keyof typeof opportunities] || 
                        opportunities.academic_excellence

    return {
      id: `opp_${context.achievement_id}_${Date.now()}`,
      trigger: 'achievement_unlock',
      suggestion_text: categoryData.suggestion,
      reasoning: categoryData.reasoning,
      confidence_score: categoryData.confidence,
      potential_matches: categoryData.matches,
      timing_score: 95, // High timing score during achievement celebration
      success_probability: Math.min(90, categoryData.confidence + context.points_awarded / 50)
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200'
    return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  }

  const getTimingIndicator = (score: number) => {
    if (score >= 90) return { text: 'Perfect Time', icon: Trophy, color: 'text-green-600' }
    if (score >= 70) return { text: 'Good Time', icon: Target, color: 'text-blue-600' }
    return { text: 'Consider Later', icon: Clock, color: 'text-yellow-600' }
  }

  if (!isVisible || !opportunity || !achievementContext) return null

  const timingIndicator = getTimingIndicator(opportunity.timing_score)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <Card className="shadow-xl border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">Referral Opportunity</CardTitle>
                  <CardDescription className="text-xs">Share your success!</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                ×
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Achievement Context */}
            <div className="flex items-center gap-2 p-2 bg-white rounded-lg border">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{achievementContext.achievement_title}</div>
                <div className="text-xs text-muted-foreground">+{achievementContext.points_awarded} points</div>
              </div>
            </div>

            {/* Suggestion */}
            <div className="space-y-2">
              <p className="text-sm leading-relaxed">{opportunity.suggestion_text}</p>
              
              {/* Timing & Confidence Indicators */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <timingIndicator.icon className={`h-3 w-3 ${timingIndicator.color}`} />
                  <span className={`text-xs ${timingIndicator.color}`}>{timingIndicator.text}</span>
                </div>
                <Badge className={`text-xs ${getConfidenceColor(opportunity.confidence_score)}`}>
                  {opportunity.confidence_score}% confidence
                </Badge>
              </div>
            </div>

            {/* Potential Matches Preview */}
            {!showDetails && opportunity.potential_matches.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Great for:</div>
                <div className="flex flex-wrap gap-1">
                  {opportunity.potential_matches.slice(0, 2).map((match, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {match}
                    </Badge>
                  ))}
                  {opportunity.potential_matches.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{opportunity.potential_matches.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Detailed View */}
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 border-t pt-3"
              >
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Why now?</div>
                  <p className="text-xs text-gray-600">{opportunity.reasoning}</p>
                </div>
                
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Perfect matches:</div>
                  <div className="flex flex-wrap gap-1">
                    {opportunity.potential_matches.map((match, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {match}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="font-medium text-purple-600">{opportunity.timing_score}%</div>
                    <div className="text-muted-foreground">Timing</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="font-medium text-green-600">{opportunity.success_probability.toFixed(0)}%</div>
                    <div className="text-muted-foreground">Success</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button 
                  onClick={onCreateReferral}
                  size="sm" 
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Refer Friend
                </Button>
                <Button 
                  onClick={() => setShowDetails(!showDetails)}
                  variant="outline" 
                  size="sm"
                >
                  {showDetails ? 'Less' : 'More'}
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={onRemindLater}
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 text-xs"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Remind me later
                </Button>
                <Button 
                  onClick={onViewTips}
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 text-xs"
                >
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Get tips
                </Button>
              </div>
            </div>

            {/* Positive Reinforcement */}
            <div className="flex items-center justify-center gap-1 text-xs text-purple-600 bg-purple-50 rounded p-2">
              <Heart className="h-3 w-3" />
              <span>Sharing success builds our community</span>
              <Smile className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}