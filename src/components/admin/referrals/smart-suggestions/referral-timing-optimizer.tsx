'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { 
  Clock,
  TrendingUp,
  Calendar,
  Star,
  Target,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Users,
  MessageCircle,
  Trophy,
  BarChart3,
  Settings,
  Brain
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserEngagementData {
  user_id: string
  current_engagement_score: number
  recent_activities: {
    achievements_unlocked: number
    feedback_given: number
    goals_completed: number
    streak_days: number
    last_positive_feedback: Date | null
    last_achievement: Date | null
  }
  engagement_history: {
    date: string
    score: number
    activities: string[]
  }[]
  peak_engagement_patterns: {
    day_of_week: number
    hour_of_day: number
    frequency: number
  }[]
}

interface TimingRecommendation {
  id: string
  type: 'immediate' | 'scheduled' | 'wait'
  confidence_score: number
  optimal_time: Date | null
  reasoning: string
  triggers: string[]
  success_probability: number
  engagement_context: string
  suggested_approach: string
}

interface ReferralTimingOptimizerProps {
  userEngagementData: UserEngagementData
  onScheduleReminder: (time: Date) => void
  onCreateReferralNow: () => void
  onViewAnalytics: () => void
  settings: {
    enable_smart_timing: boolean
    auto_suggest: boolean
    consider_peer_activity: boolean
    respect_quiet_hours: boolean
  }
  onSettingsChange: (settings: any) => void
}

export function ReferralTimingOptimizer({
  userEngagementData,
  onScheduleReminder,
  onCreateReferralNow,
  onViewAnalytics,
  settings,
  onSettingsChange
}: ReferralTimingOptimizerProps) {
  const [currentRecommendation, setCurrentRecommendation] = useState<TimingRecommendation | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (settings.enable_smart_timing) {
      analyzeOptimalTiming()
    }
  }, [userEngagementData, settings.enable_smart_timing])

  const analyzeOptimalTiming = async () => {
    setIsAnalyzing(true)
    
    // Simulate AI analysis
    setTimeout(() => {
      const recommendation = generateTimingRecommendation(userEngagementData)
      setCurrentRecommendation(recommendation)
      setIsAnalyzing(false)
    }, 2000)
  }

  const generateTimingRecommendation = (data: UserEngagementData): TimingRecommendation => {
    const now = new Date()
    const engagementScore = data.current_engagement_score
    const recentAchievements = data.recent_activities.achievements_unlocked
    const lastAchievement = data.recent_activities.last_achievement
    const streakDays = data.recent_activities.streak_days
    
    // Immediate opportunity (high engagement + recent positive event)
    if (engagementScore >= 80 && recentAchievements > 0 && lastAchievement) {
      const hoursSinceAchievement = (now.getTime() - lastAchievement.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceAchievement <= 2) {
        return {
          id: `immediate_${Date.now()}`,
          type: 'immediate',
          confidence_score: 95,
          optimal_time: null,
          reasoning: "Perfect moment! You just achieved something great and your engagement is at peak level.",
          triggers: ['recent_achievement', 'high_engagement', 'positive_momentum'],
          success_probability: 88,
          engagement_context: `${engagementScore}% engagement score with fresh achievement`,
          suggested_approach: "Share your excitement and recent success as a natural conversation starter"
        }
      }
    }

    // Scheduled opportunity (good patterns + optimal timing)
    if (engagementScore >= 60 && streakDays >= 7) {
      const optimalHour = findOptimalTimeSlot(data.peak_engagement_patterns)
      const nextOptimalTime = getNextOptimalTime(optimalHour)
      
      return {
        id: `scheduled_${Date.now()}`,
        type: 'scheduled',
        confidence_score: 82,
        optimal_time: nextOptimalTime,
        reasoning: "Your engagement patterns show optimal times for authentic conversations about your progress.",
        triggers: ['consistent_streak', 'good_engagement', 'optimal_timing_pattern'],
        success_probability: 75,
        engagement_context: `${streakDays}-day streak with consistent ${engagementScore}% engagement`,
        suggested_approach: "Highlight your consistency and the supportive environment that helps maintain streaks"
      }
    }

    // Wait recommendation (low engagement or poor timing)
    return {
      id: `wait_${Date.now()}`,
      type: 'wait',
      confidence_score: 45,
      optimal_time: getNextEngagementPeak(data),
      reasoning: "Current engagement is lower than optimal. Wait for the next positive milestone or achievement.",
      triggers: ['low_engagement', 'awaiting_positive_event'],
      success_probability: 35,
      engagement_context: `${engagementScore}% engagement - below optimal threshold`,
      suggested_approach: "Focus on your own growth first, then share when you have exciting progress to discuss"
    }
  }

  const findOptimalTimeSlot = (patterns: any[]) => {
    if (patterns.length === 0) return 14 // Default to 2 PM
    
    // Find most frequent engagement time
    const hourFrequency = patterns.reduce((acc, pattern) => {
      acc[pattern.hour_of_day] = (acc[pattern.hour_of_day] || 0) + pattern.frequency
      return acc
    }, {} as Record<number, number>)
    
    return Object.entries(hourFrequency)
      .sort(([,a], [,b]) => b - a)[0][0]
  }

  const getNextOptimalTime = (hour: number) => {
    const now = new Date()
    const optimal = new Date()
    optimal.setHours(parseInt(hour.toString()), 0, 0, 0)
    
    if (optimal <= now) {
      optimal.setDate(optimal.getDate() + 1)
    }
    
    return optimal
  }

  const getNextEngagementPeak = (data: UserEngagementData) => {
    // Predict next likely engagement peak based on patterns
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return nextWeek
  }

  const getRecommendationStyle = (type: string) => {
    const styles = {
      immediate: {
        border: 'border-green-500',
        bg: 'from-green-50 to-emerald-50',
        icon: Zap,
        color: 'text-green-600'
      },
      scheduled: {
        border: 'border-blue-500',
        bg: 'from-blue-50 to-indigo-50',
        icon: Calendar,
        color: 'text-blue-600'
      },
      wait: {
        border: 'border-yellow-500',
        bg: 'from-yellow-50 to-orange-50',
        icon: Clock,
        color: 'text-yellow-600'
      }
    }
    return styles[type as keyof typeof styles] || styles.wait
  }

  const getConfidenceLevel = (score: number) => {
    if (score >= 80) return { level: 'High', color: 'text-green-600' }
    if (score >= 60) return { level: 'Medium', color: 'text-blue-600' }
    return { level: 'Low', color: 'text-yellow-600' }
  }

  const formatTime = (date: Date | null) => {
    if (!date) return 'N/A'
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (!settings.enable_smart_timing) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="font-medium mb-2">Smart Timing Disabled</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enable smart timing to get AI-powered recommendations for optimal referral moments
          </p>
          <Button 
            onClick={() => onSettingsChange({ ...settings, enable_smart_timing: true })}
            size="sm"
          >
            Enable Smart Timing
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Referral Timing Optimizer
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-powered optimal timing for authentic referral conversations
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onViewAnalytics}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Engagement Status */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Engagement</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {userEngagementData.current_engagement_score}%
              </div>
              <Progress 
                value={userEngagementData.current_engagement_score} 
                className="h-1 mt-2" 
              />
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Recent Wins</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {userEngagementData.recent_activities.achievements_unlocked}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                achievements this week
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Streak</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {userEngagementData.recent_activities.streak_days}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                days consistent
              </p>
            </Card>
          </div>

          {/* Analysis Status */}
          {isAnalyzing && (
            <Card className="p-4 border-blue-200 bg-blue-50">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <div>
                  <div className="text-sm font-medium">Analyzing optimal timing...</div>
                  <div className="text-xs text-muted-foreground">
                    Considering engagement patterns, recent activities, and peer dynamics
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Timing Recommendation */}
          {currentRecommendation && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={cn(
                "border-l-4 bg-gradient-to-br",
                getRecommendationStyle(currentRecommendation.type).border,
                getRecommendationStyle(currentRecommendation.type).bg
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const IconComponent = getRecommendationStyle(currentRecommendation.type).icon
                        return <IconComponent className={cn("h-6 w-6", getRecommendationStyle(currentRecommendation.type).color)} />
                      })()}
                      <div>
                        <h3 className="font-semibold capitalize">
                          {currentRecommendation.type} Opportunity
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {getConfidenceLevel(currentRecommendation.confidence_score).level} confidence
                        </p>
                      </div>
                    </div>
                    <Badge className={cn(
                      "border-0",
                      getConfidenceLevel(currentRecommendation.confidence_score).color,
                      "bg-white/60"
                    )}>
                      {currentRecommendation.confidence_score}%
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {/* Reasoning */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Why this timing?</h4>
                      <p className="text-sm text-gray-700">{currentRecommendation.reasoning}</p>
                    </div>

                    {/* Context */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Your context</h4>
                      <p className="text-sm text-gray-600">{currentRecommendation.engagement_context}</p>
                    </div>

                    {/* Triggers */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Key factors</h4>
                      <div className="flex flex-wrap gap-1">
                        {currentRecommendation.triggers.map((trigger, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {trigger.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Success Metrics */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-white/60 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {currentRecommendation.success_probability}%
                        </div>
                        <div className="text-xs text-muted-foreground">Success probability</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {currentRecommendation.optimal_time ? formatTime(currentRecommendation.optimal_time) : 'Now'}
                        </div>
                        <div className="text-xs text-muted-foreground">Optimal time</div>
                      </div>
                    </div>

                    {/* Suggested Approach */}
                    <div className="p-3 bg-white/80 rounded-lg border">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Suggested approach
                      </h4>
                      <p className="text-sm text-gray-700">{currentRecommendation.suggested_approach}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {currentRecommendation.type === 'immediate' && (
                        <Button onClick={onCreateReferralNow} className="flex-1">
                          <Users className="h-4 w-4 mr-2" />
                          Create Referral Now
                        </Button>
                      )}
                      
                      {currentRecommendation.type === 'scheduled' && currentRecommendation.optimal_time && (
                        <Button 
                          onClick={() => onScheduleReminder(currentRecommendation.optimal_time!)} 
                          className="flex-1"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Reminder
                        </Button>
                      )}
                      
                      {currentRecommendation.type === 'wait' && (
                        <Button variant="outline" className="flex-1" disabled>
                          <Clock className="h-4 w-4 mr-2" />
                          Wait for Better Timing
                        </Button>
                      )}
                      
                      <Button variant="outline" onClick={analyzeOptimalTiming}>
                        Refresh Analysis
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Settings Panel */}
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Timing Optimizer Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Smart Timing</div>
                      <div className="text-sm text-muted-foreground">
                        Use AI to analyze optimal referral timing
                      </div>
                    </div>
                    <Switch
                      checked={settings.enable_smart_timing}
                      onCheckedChange={(checked) => 
                        onSettingsChange({ ...settings, enable_smart_timing: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto-suggest</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically show timing recommendations
                      </div>
                    </div>
                    <Switch
                      checked={settings.auto_suggest}
                      onCheckedChange={(checked) => 
                        onSettingsChange({ ...settings, auto_suggest: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Consider Peer Activity</div>
                      <div className="text-sm text-muted-foreground">
                        Factor in community engagement patterns
                      </div>
                    </div>
                    <Switch
                      checked={settings.consider_peer_activity}
                      onCheckedChange={(checked) => 
                        onSettingsChange({ ...settings, consider_peer_activity: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Respect Quiet Hours</div>
                      <div className="text-sm text-muted-foreground">
                        Avoid suggestions during off-hours
                      </div>
                    </div>
                    <Switch
                      checked={settings.respect_quiet_hours}
                      onCheckedChange={(checked) => 
                        onSettingsChange({ ...settings, respect_quiet_hours: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}