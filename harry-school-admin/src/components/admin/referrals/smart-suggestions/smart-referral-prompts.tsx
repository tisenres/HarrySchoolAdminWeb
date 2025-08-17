'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MessageCircle,
  UserPlus,
  Star,
  TrendingUp,
  Calendar,
  Clock,
  Heart,
  Lightbulb,
  Users,
  Target,
  Sparkles,
  Trophy,
  CheckCircle2,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EngagementContext {
  type: 'achievement' | 'goal_completion' | 'positive_feedback' | 'milestone' | 'streak' | 'improvement'
  user_id: string
  user_name: string
  user_type: 'student' | 'teacher'
  context_data: {
    description: string
    category: string
    points_impact?: number
    streak_count?: number
    improvement_percentage?: number
    milestone_type?: string
  }
  engagement_score: number
  optimal_timing: boolean
}

interface ReferralPrompt {
  id: string
  trigger_type: string
  title: string
  message: string
  call_to_action: string
  timing_reason: string
  success_factors: string[]
  priority: 'low' | 'normal' | 'high'
  style: 'celebration' | 'motivational' | 'social' | 'achievement'
  auto_dismiss_delay?: number
}

interface SmartReferralPromptsProps {
  engagementContext?: EngagementContext
  isVisible: boolean
  onCreateReferral: () => void
  onDismiss: () => void
  onSnooze: (duration: number) => void
  onDisableType: (type: string) => void
  settings: {
    enable_achievement_prompts: boolean
    enable_milestone_prompts: boolean
    enable_social_prompts: boolean
    prompt_frequency: 'low' | 'normal' | 'high'
    auto_dismiss: boolean
  }
}

export function SmartReferralPrompts({
  engagementContext,
  isVisible,
  onCreateReferral,
  onDismiss,
  onSnooze,
  onDisableType,
  settings
}: SmartReferralPromptsProps) {
  const [currentPrompt, setCurrentPrompt] = useState<ReferralPrompt | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (engagementContext && isVisible && shouldShowPrompt()) {
      const prompt = generateContextualPrompt(engagementContext)
      setCurrentPrompt(prompt)
      setIsAnimating(true)

      // Auto-dismiss if enabled and prompt has delay
      if (settings.auto_dismiss && prompt.auto_dismiss_delay) {
        setTimeout(() => {
          handleDismiss()
        }, prompt.auto_dismiss_delay)
      }
    }
  }, [engagementContext, isVisible])

  const shouldShowPrompt = (): boolean => {
    if (!engagementContext) return false
    
    const typeEnabled = {
      achievement: settings.enable_achievement_prompts,
      milestone: settings.enable_milestone_prompts,
      positive_feedback: settings.enable_social_prompts,
      goal_completion: settings.enable_achievement_prompts,
      streak: settings.enable_achievement_prompts,
      improvement: settings.enable_social_prompts
    }

    return typeEnabled[engagementContext.type] && 
           engagementContext.engagement_score >= 60 &&
           engagementContext.optimal_timing
  }

  const generateContextualPrompt = (context: EngagementContext): ReferralPrompt => {
    const prompts = {
      achievement: {
        celebration: {
          title: "🎉 Amazing achievement!",
          message: "Your success story could inspire a friend to start their own learning journey here!",
          call_to_action: "Share your success",
          timing_reason: "Achievement celebrations are perfect moments to showcase positive outcomes",
          success_factors: ["Positive emotion", "Concrete evidence", "Social proof"],
          style: "celebration" as const,
          auto_dismiss_delay: 10000
        },
        motivational: {
          title: "💪 You're on fire!",
          message: "Know someone who could benefit from the same supportive environment that helped you succeed?",
          call_to_action: "Help a friend grow",
          timing_reason: "High engagement moments show genuine enthusiasm",
          success_factors: ["Personal experience", "Authenticity", "Peer influence"],
          style: "motivational" as const
        }
      },
      goal_completion: {
        achievement: {
          title: "🎯 Goal crushed!",
          message: "Your dedication paid off! Share how our structured approach helps achieve goals.",
          call_to_action: "Refer someone goal-oriented",
          timing_reason: "Goal completion demonstrates program effectiveness",
          success_factors: ["Proven results", "Structured approach", "Goal-oriented matching"],
          style: "achievement" as const,
          auto_dismiss_delay: 8000
        }
      },
      positive_feedback: {
        social: {
          title: "⭐ Great feedback received!",
          message: "The positive feedback you're getting shows the quality of our community. Know others who'd appreciate this?",
          call_to_action: "Invite to the community",
          timing_reason: "Positive feedback moments highlight community quality",
          success_factors: ["Community validation", "Social proof", "Quality indicator"],
          style: "social" as const
        }
      },
      milestone: {
        celebration: {
          title: "🏆 Milestone reached!",
          message: "Every milestone is worth celebrating and sharing! Your progress could motivate a friend to start their journey.",
          call_to_action: "Celebrate with a referral",
          timing_reason: "Milestones mark significant progress worth sharing",
          success_factors: ["Progress demonstration", "Achievement celebration", "Inspiration factor"],
          style: "celebration" as const,
          auto_dismiss_delay: 12000
        }
      },
      streak: {
        motivational: {
          title: "🔥 Streak extended!",
          message: "Your consistency is inspiring! Share how our supportive environment helps maintain momentum.",
          call_to_action: "Help someone build habits",
          timing_reason: "Streaks show the power of consistent engagement",
          success_factors: ["Consistency demonstration", "Habit formation", "Support system"],
          style: "motivational" as const
        }
      },
      improvement: {
        motivational: {
          title: "📈 Incredible improvement!",
          message: "Your growth journey is remarkable! Know someone who could benefit from the same personalized support?",
          call_to_action: "Share the growth",
          timing_reason: "Improvement showcases personalized program effectiveness",
          success_factors: ["Personal growth", "Customized support", "Transformation story"],
          style: "motivational" as const
        }
      }
    }

    const contextPrompts = prompts[context.type]
    const promptKey = Object.keys(contextPrompts)[0]
    const selectedPrompt = contextPrompts[promptKey as keyof typeof contextPrompts]

    return {
      id: `prompt_${context.type}_${Date.now()}`,
      trigger_type: context.type,
      priority: context.engagement_score >= 80 ? 'high' : 'normal',
      ...selectedPrompt
    }
  }

  const handleDismiss = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setCurrentPrompt(null)
      onDismiss()
    }, 300)
  }

  const handleSnooze = (hours: number) => {
    onSnooze(hours * 60 * 60 * 1000) // Convert to milliseconds
    handleDismiss()
  }

  const getStyleClasses = (style: string) => {
    const styles = {
      celebration: "from-yellow-50 to-orange-50 border-l-yellow-500",
      motivational: "from-blue-50 to-purple-50 border-l-blue-500", 
      social: "from-green-50 to-teal-50 border-l-green-500",
      achievement: "from-purple-50 to-pink-50 border-l-purple-500"
    }
    return styles[style as keyof typeof styles] || styles.motivational
  }

  const getIconComponent = (style: string) => {
    const icons = {
      celebration: Trophy,
      motivational: Target,
      social: Users,
      achievement: Star
    }
    return icons[style as keyof typeof icons] || Target
  }

  const getPriorityClasses = (priority: string) => {
    return {
      high: "shadow-lg ring-2 ring-purple-200",
      normal: "shadow-md",
      low: "shadow-sm"
    }[priority] || "shadow-md"
  }

  if (!isVisible || !currentPrompt || !engagementContext) return null

  const IconComponent = getIconComponent(currentPrompt.style)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300, scale: 0.9 }}
        animate={{ 
          opacity: isAnimating ? 1 : 0, 
          x: isAnimating ? 0 : 300, 
          scale: isAnimating ? 1 : 0.9 
        }}
        exit={{ opacity: 0, x: 300, scale: 0.9 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          duration: 0.3
        }}
        className="fixed top-20 right-4 z-50 max-w-sm"
      >
        <Card className={cn(
          "bg-gradient-to-br border-l-4",
          getStyleClasses(currentPrompt.style),
          getPriorityClasses(currentPrompt.priority)
        )}>
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                  <IconComponent className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">{currentPrompt.title}</div>
                  <Badge variant="outline" className="text-xs mt-1">
                    Perfect timing!
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Context Display */}
            <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg border mb-3">
              <Sparkles className="h-3 w-3 text-purple-500" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">
                  {engagementContext.context_data.description}
                </div>
                <div className="text-xs text-muted-foreground">
                  {engagementContext.context_data.category}
                  {engagementContext.context_data.points_impact && 
                    ` • +${engagementContext.context_data.points_impact} points`
                  }
                </div>
              </div>
            </div>

            {/* Message */}
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              {currentPrompt.message}
            </p>

            {/* Success Factors */}
            <div className="mb-3">
              <div className="text-xs font-medium text-muted-foreground mb-1">Why this works:</div>
              <div className="flex flex-wrap gap-1">
                {currentPrompt.success_factors.slice(0, 2).map((factor, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button 
                onClick={onCreateReferral}
                size="sm" 
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <UserPlus className="h-3 w-3 mr-2" />
                {currentPrompt.call_to_action}
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleSnooze(1)}
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 text-xs"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  1h later
                </Button>
                <Button 
                  onClick={() => handleSnooze(24)}
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 text-xs"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Tomorrow
                </Button>
                <Button 
                  onClick={() => onDisableType(currentPrompt.trigger_type)}
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 text-xs text-red-600"
                >
                  Disable
                </Button>
              </div>
            </div>

            {/* Timing Explanation */}
            <div className="mt-3 p-2 bg-white/50 rounded text-xs text-gray-600 flex items-start gap-2">
              <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>{currentPrompt.timing_reason}</span>
            </div>

            {/* Positive reinforcement */}
            <div className="mt-2 flex items-center justify-center gap-1 text-xs text-purple-600">
              <Heart className="h-3 w-3" />
              <span>Your success helps others discover opportunity</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}