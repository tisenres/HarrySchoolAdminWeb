'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Bell,
  Clock,
  Target,
  MessageCircle,
  BarChart3,
  Lightbulb,
  Trophy
} from 'lucide-react'

// Import all smart suggestion components
import { ReferralOpportunityWidget } from './referral-opportunity-widget'
import { SmartReferralPrompts } from './smart-referral-prompts'
import { ReferralSuggestionBot } from './referral-suggestion-bot'
import { ReferralTimingOptimizer } from './referral-timing-optimizer'
import { ReferralQualityHelper } from './referral-quality-helper'

interface SmartSuggestionSettings {
  enable_opportunity_widgets: boolean
  enable_smart_prompts: boolean
  enable_coaching_bot: boolean
  enable_timing_optimizer: boolean
  enable_quality_helper: boolean
  prompt_frequency: 'low' | 'normal' | 'high'
  auto_dismiss_prompts: boolean
  respect_quiet_hours: boolean
  suggestion_sensitivity: 'conservative' | 'balanced' | 'aggressive'
}

interface UserEngagementState {
  user_id: string
  user_name: string
  user_type: 'student' | 'teacher'
  current_engagement_score: number
  recent_achievements: any[]
  recent_feedback: any[]
  current_goals: string[]
  experience_level: 'beginner' | 'intermediate' | 'advanced'
  referral_history: {
    total_sent: number
    successful: number
    conversion_rate: number
  }
}

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

interface EngagementEvent {
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

interface SmartReferralSuggestionsIntegrationProps {
  userEngagementState: UserEngagementState
  onCreateReferral: () => void
  onScheduleReminder: (time: Date) => void
  onViewAnalytics: () => void
}

export function SmartReferralSuggestionsIntegration({
  userEngagementState,
  onCreateReferral,
  onScheduleReminder,
  onViewAnalytics
}: SmartReferralSuggestionsIntegrationProps) {
  // Component visibility states
  const [showOpportunityWidget, setShowOpportunityWidget] = useState(false)
  const [showSmartPrompts, setShowSmartPrompts] = useState(false)
  const [showCoachingBot, setShowCoachingBot] = useState(false)
  const [isBotMinimized, setIsBotMinimized] = useState(false)
  
  // Current contexts
  const [currentAchievementContext, setCurrentAchievementContext] = useState<AchievementContext | null>(null)
  const [currentEngagementEvent, setCurrentEngagementEvent] = useState<EngagementEvent | null>(null)
  
  // Settings and preferences
  const [settings, setSettings] = useState<SmartSuggestionSettings>({
    enable_opportunity_widgets: true,
    enable_smart_prompts: true,
    enable_coaching_bot: true,
    enable_timing_optimizer: true,
    enable_quality_helper: true,
    prompt_frequency: 'normal',
    auto_dismiss_prompts: true,
    respect_quiet_hours: true,
    suggestion_sensitivity: 'balanced'
  })

  // Active suggestion tracking
  const [activeSuggestions, setActiveSuggestions] = useState<string[]>([])
  const [suggestionMetrics, setSuggestionMetrics] = useState({
    total_shown: 0,
    total_acted_on: 0,
    total_dismissed: 0,
    success_rate: 0
  })

  // Listen for achievement celebrations (this would integrate with existing achievement system)
  useEffect(() => {
    const handleAchievementUnlock = (achievementData: any) => {
      if (!settings.enable_opportunity_widgets) return

      setCurrentAchievementContext({
        achievement_id: achievementData.id,
        achievement_title: achievementData.title,
        user_id: achievementData.user_id,
        user_name: achievementData.user_name,
        user_type: achievementData.user_type,
        points_awarded: achievementData.points_awarded,
        rarity: achievementData.rarity,
        achievement_category: achievementData.category || 'academic_excellence'
      })

      setShowOpportunityWidget(true)
      trackSuggestionShown('opportunity_widget')

      // Auto-dismiss after delay if enabled
      if (settings.auto_dismiss_prompts) {
        setTimeout(() => {
          setShowOpportunityWidget(false)
        }, 15000)
      }
    }

    // This would be connected to the actual achievement system
    // window.addEventListener('achievement-unlocked', handleAchievementUnlock)
    
    // For demo, simulate achievement unlock
    const demoAchievement = () => {
      if (userEngagementState.recent_achievements.length > 0) {
        const recent = userEngagementState.recent_achievements[0]
        handleAchievementUnlock({
          id: 'demo_achievement',
          title: 'Consistency Champion',
          user_id: userEngagementState.user_id,
          user_name: userEngagementState.user_name,
          user_type: userEngagementState.user_type,
          points_awarded: 100,
          rarity: 'rare',
          category: 'consistency'
        })
      }
    }

    // Trigger demo after component mount
    setTimeout(demoAchievement, 2000)

    return () => {
      // window.removeEventListener('achievement-unlocked', handleAchievementUnlock)
    }
  }, [settings, userEngagementState])

  // Listen for high engagement moments
  useEffect(() => {
    const checkEngagementTriggers = () => {
      if (!settings.enable_smart_prompts) return

      const { current_engagement_score, recent_achievements, recent_feedback } = userEngagementState

      // Trigger smart prompts on high engagement
      if (current_engagement_score >= 75 && recent_achievements.length > 0) {
        const engagementEvent: EngagementEvent = {
          type: 'achievement',
          user_id: userEngagementState.user_id,
          user_name: userEngagementState.user_name,
          user_type: userEngagementState.user_type,
          context_data: {
            description: 'Recent achievement unlocked',
            category: 'performance',
            points_impact: 100
          },
          engagement_score: current_engagement_score,
          optimal_timing: true
        }

        setCurrentEngagementEvent(engagementEvent)
        setShowSmartPrompts(true)
        trackSuggestionShown('smart_prompt')
      }
    }

    const interval = setInterval(checkEngagementTriggers, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [settings, userEngagementState])

  const trackSuggestionShown = (type: string) => {
    setActiveSuggestions(prev => [...prev, type])
    setSuggestionMetrics(prev => ({
      ...prev,
      total_shown: prev.total_shown + 1
    }))
  }

  const trackSuggestionActedOn = (type: string) => {
    setActiveSuggestions(prev => prev.filter(s => s !== type))
    setSuggestionMetrics(prev => ({
      ...prev,
      total_acted_on: prev.total_acted_on + 1,
      success_rate: ((prev.total_acted_on + 1) / prev.total_shown) * 100
    }))
  }

  const trackSuggestionDismissed = (type: string) => {
    setActiveSuggestions(prev => prev.filter(s => s !== type))
    setSuggestionMetrics(prev => ({
      ...prev,
      total_dismissed: prev.total_dismissed + 1
    }))
  }

  const handleOpportunityWidgetAction = useCallback((action: string) => {
    switch (action) {
      case 'create_referral':
        trackSuggestionActedOn('opportunity_widget')
        onCreateReferral()
        setShowOpportunityWidget(false)
        break
      case 'remind_later':
        const reminderTime = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours later
        onScheduleReminder(reminderTime)
        setShowOpportunityWidget(false)
        break
      case 'view_tips':
        setShowCoachingBot(true)
        setShowOpportunityWidget(false)
        break
      case 'dismiss':
        trackSuggestionDismissed('opportunity_widget')
        setShowOpportunityWidget(false)
        break
    }
  }, [onCreateReferral, onScheduleReminder])

  const handleSmartPromptAction = useCallback((action: string) => {
    switch (action) {
      case 'create_referral':
        trackSuggestionActedOn('smart_prompt')
        onCreateReferral()
        setShowSmartPrompts(false)
        break
      case 'snooze':
        setShowSmartPrompts(false)
        // Would implement actual snooze logic
        break
      case 'disable_type':
        setSettings(prev => ({ ...prev, enable_smart_prompts: false }))
        setShowSmartPrompts(false)
        break
      case 'dismiss':
        trackSuggestionDismissed('smart_prompt')
        setShowSmartPrompts(false)
        break
    }
  }, [onCreateReferral])

  const mockUserEngagementData = {
    user_id: userEngagementState.user_id,
    current_engagement_score: userEngagementState.current_engagement_score,
    recent_activities: {
      achievements_unlocked: userEngagementState.recent_achievements.length,
      feedback_given: userEngagementState.recent_feedback?.length || 0,
      goals_completed: 2,
      streak_days: 14,
      last_positive_feedback: new Date(Date.now() - 24 * 60 * 60 * 1000),
      last_achievement: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    engagement_history: [
      { date: '2024-03-15', score: 85, activities: ['achievement', 'feedback'] },
      { date: '2024-03-14', score: 78, activities: ['goal_completion'] }
    ],
    peak_engagement_patterns: [
      { day_of_week: 1, hour_of_day: 14, frequency: 12 },
      { day_of_week: 3, hour_of_day: 16, frequency: 10 }
    ]
  }

  return (
    <div className="space-y-6">
      {/* Main Integration Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Smart Referral Suggestions
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-powered contextual guidance for authentic referral opportunities
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {activeSuggestions.length} active
              </Badge>
              <Badge variant="outline" className="text-xs text-green-600">
                {suggestionMetrics.success_rate.toFixed(1)}% success
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="dashboard">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="timing">Timing</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Engagement Overview */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Engagement Score</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {userEngagementState.current_engagement_score}%
                  </div>
                  <p className="text-xs text-muted-foreground">Current level</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Suggestions</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {suggestionMetrics.total_shown}
                  </div>
                  <p className="text-xs text-muted-foreground">Total shown</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Success Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {suggestionMetrics.success_rate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Acted upon</p>
                </Card>
              </div>

              {/* Active Components Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Active Suggestion Components</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Opportunity Widgets</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={showOpportunityWidget ? "default" : "secondary"}>
                          {showOpportunityWidget ? "Active" : "Standby"}
                        </Badge>
                        <Switch
                          checked={settings.enable_opportunity_widgets}
                          onCheckedChange={(checked) => 
                            setSettings(prev => ({ ...prev, enable_opportunity_widgets: checked }))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Smart Prompts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={showSmartPrompts ? "default" : "secondary"}>
                          {showSmartPrompts ? "Active" : "Standby"}
                        </Badge>
                        <Switch
                          checked={settings.enable_smart_prompts}
                          onCheckedChange={(checked) => 
                            setSettings(prev => ({ ...prev, enable_smart_prompts: checked }))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Coaching Bot</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={showCoachingBot ? "default" : "secondary"}>
                          {showCoachingBot ? "Active" : "Available"}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowCoachingBot(true)}
                        >
                          Open
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">Timing Optimizer</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Always On</Badge>
                        <Switch
                          checked={settings.enable_timing_optimizer}
                          onCheckedChange={(checked) => 
                            setSettings(prev => ({ ...prev, enable_timing_optimizer: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button onClick={() => setShowCoachingBot(true)}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Get Coaching
                </Button>
                <Button variant="outline" onClick={onCreateReferral}>
                  <Users className="h-4 w-4 mr-2" />
                  Create Referral
                </Button>
                <Button variant="outline" onClick={onViewAnalytics}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </TabsContent>

            {/* Timing Optimizer Tab */}
            <TabsContent value="timing" className="space-y-6">
              <ReferralTimingOptimizer
                userEngagementData={mockUserEngagementData}
                onScheduleReminder={onScheduleReminder}
                onCreateReferralNow={onCreateReferral}
                onViewAnalytics={onViewAnalytics}
                settings={{
                  enable_smart_timing: settings.enable_timing_optimizer,
                  auto_suggest: true,
                  consider_peer_activity: true,
                  respect_quiet_hours: settings.respect_quiet_hours
                }}
                onSettingsChange={(newSettings) => 
                  setSettings(prev => ({ ...prev, ...newSettings }))
                }
              />
            </TabsContent>

            {/* Quality Helper Tab */}
            <TabsContent value="quality" className="space-y-6">
              <ReferralQualityHelper
                userContext={{
                  user_id: userEngagementState.user_id,
                  user_name: userEngagementState.user_name,
                  experience_level: userEngagementState.experience_level,
                  recent_achievements: userEngagementState.recent_achievements.map(a => a.title || 'Achievement'),
                  referral_history: userEngagementState.referral_history
                }}
                onPreviewReferral={(content) => {
                  console.log('Preview referral:', content)
                }}
                onSendReferral={(content, recipient) => {
                  console.log('Send referral to:', recipient, content)
                  onCreateReferral()
                }}
              />
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Suggestion Settings</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Customize how and when you receive referral suggestions
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Component Controls</h3>
                      
                      {Object.entries({
                        enable_opportunity_widgets: 'Opportunity Widgets',
                        enable_smart_prompts: 'Smart Prompts',
                        enable_coaching_bot: 'Coaching Bot',
                        enable_timing_optimizer: 'Timing Optimizer',
                        enable_quality_helper: 'Quality Helper'
                      }).map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm">{label}</span>
                          <Switch
                            checked={settings[key as keyof SmartSuggestionSettings] as boolean}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, [key]: checked }))
                            }
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Preferences</h3>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto-dismiss prompts</span>
                        <Switch
                          checked={settings.auto_dismiss_prompts}
                          onCheckedChange={(checked) => 
                            setSettings(prev => ({ ...prev, auto_dismiss_prompts: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Respect quiet hours</span>
                        <Switch
                          checked={settings.respect_quiet_hours}
                          onCheckedChange={(checked) => 
                            setSettings(prev => ({ ...prev, respect_quiet_hours: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Floating Suggestion Components */}
      <AnimatePresence>
        {/* Opportunity Widget */}
        <ReferralOpportunityWidget
          achievementContext={currentAchievementContext}
          isVisible={showOpportunityWidget}
          onDismiss={() => handleOpportunityWidgetAction('dismiss')}
          onCreateReferral={() => handleOpportunityWidgetAction('create_referral')}
          onRemindLater={() => handleOpportunityWidgetAction('remind_later')}
          onViewTips={() => handleOpportunityWidgetAction('view_tips')}
        />

        {/* Smart Prompts */}
        <SmartReferralPrompts
          engagementContext={currentEngagementEvent}
          isVisible={showSmartPrompts}
          onCreateReferral={() => handleSmartPromptAction('create_referral')}
          onDismiss={() => handleSmartPromptAction('dismiss')}
          onSnooze={(duration) => {
            setTimeout(() => setShowSmartPrompts(true), duration)
            setShowSmartPrompts(false)
          }}
          onDisableType={(type) => handleSmartPromptAction('disable_type')}
          settings={{
            enable_achievement_prompts: settings.enable_smart_prompts,
            enable_milestone_prompts: settings.enable_smart_prompts,
            enable_social_prompts: settings.enable_smart_prompts,
            prompt_frequency: settings.prompt_frequency,
            auto_dismiss: settings.auto_dismiss_prompts
          }}
        />

        {/* Coaching Bot */}
        <ReferralSuggestionBot
          isOpen={showCoachingBot}
          isMinimized={isBotMinimized}
          onClose={() => setShowCoachingBot(false)}
          onMinimize={() => setIsBotMinimized(true)}
          onMaximize={() => setIsBotMinimized(false)}
          userContext={{
            user_id: userEngagementState.user_id,
            user_name: userEngagementState.user_name,
            referral_experience: userEngagementState.experience_level === 'beginner' ? 'none' : 
                               userEngagementState.experience_level === 'intermediate' ? 'some' : 'experienced',
            recent_achievements: userEngagementState.recent_achievements.map(a => a.title || 'Achievement'),
            current_goals: userEngagementState.current_goals
          }}
        />
      </AnimatePresence>
    </div>
  )
}