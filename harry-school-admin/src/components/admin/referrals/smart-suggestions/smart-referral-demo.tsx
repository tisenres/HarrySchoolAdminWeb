'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain,
  Play,
  Trophy,
  Users,
  MessageCircle,
  Clock,
  Target,
  Sparkles,
  TrendingUp,
  Bell,
  Settings,
  Star,
  RefreshCw,
  Lightbulb
} from 'lucide-react'

// Import the intelligent suggestion components
import { SmartReferralSuggestionsIntegration } from './smart-referral-suggestions-integration'
import { AchievementReferralIntegration } from './achievement-referral-integration'

interface DemoScenario {
  id: string
  name: string
  description: string
  userContext: any
  triggerType: 'achievement' | 'engagement' | 'milestone' | 'feedback'
  expectedOutcome: string
}

export function SmartReferralDemo() {
  const [selectedScenario, setSelectedScenario] = useState<string>('high_achiever')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showAchievementCelebration, setShowAchievementCelebration] = useState(false)
  const [demoMetrics, setDemoMetrics] = useState({
    suggestions_shown: 0,
    interactions: 0,
    referrals_created: 0
  })

  const demoScenarios: DemoScenario[] = [
    {
      id: 'high_achiever',
      name: 'High-Achieving Student',
      description: 'Student with excellent performance and recent achievements',
      userContext: {
        user_id: 'demo_student_1',
        user_name: 'Sarah Chen',
        user_type: 'student',
        current_engagement_score: 92,
        recent_achievements: [
          { title: 'Excellence Streak Master', points: 500, category: 'consistency' },
          { title: 'Collaborative Learner', points: 250, category: 'collaboration' }
        ],
        recent_feedback: [
          { rating: 5, category: 'academic_performance' },
          { rating: 4, category: 'participation' }
        ],
        current_goals: ['Improve presentation skills', 'Master advanced topics'],
        experience_level: 'intermediate',
        referral_history: {
          total_sent: 2,
          successful: 1,
          conversion_rate: 50
        }
      },
      triggerType: 'achievement',
      expectedOutcome: 'Immediate opportunity widget + smart prompts'
    },
    {
      id: 'consistent_performer',
      name: 'Consistent Performer',
      description: 'Teacher with steady engagement and positive feedback',
      userContext: {
        user_id: 'demo_teacher_1',
        user_name: 'Michael Rodriguez',
        user_type: 'teacher',
        current_engagement_score: 78,
        recent_achievements: [
          { title: 'Mentor Excellence', points: 300, category: 'mentorship' }
        ],
        recent_feedback: [
          { rating: 4, category: 'teaching_quality' }
        ],
        current_goals: ['Expand teaching methods', 'Build stronger relationships'],
        experience_level: 'advanced',
        referral_history: {
          total_sent: 5,
          successful: 4,
          conversion_rate: 80
        }
      },
      triggerType: 'milestone',
      expectedOutcome: 'Timing optimizer + quality suggestions'
    },
    {
      id: 'newcomer',
      name: 'Enthusiastic Newcomer',
      description: 'New student with high initial engagement',
      userContext: {
        user_id: 'demo_student_2',
        user_name: 'Alex Johnson',
        user_type: 'student',
        current_engagement_score: 85,
        recent_achievements: [
          { title: 'First Steps', points: 100, category: 'onboarding' }
        ],
        recent_feedback: [],
        current_goals: ['Get familiar with platform', 'Meet other students'],
        experience_level: 'beginner',
        referral_history: {
          total_sent: 0,
          successful: 0,
          conversion_rate: 0
        }
      },
      triggerType: 'engagement',
      expectedOutcome: 'Coaching bot activation + beginner tips'
    }
  ]

  const demoSteps = [
    { name: 'User Context Analysis', duration: 2000 },
    { name: 'Engagement Monitoring', duration: 1500 },
    { name: 'Trigger Detection', duration: 1000 },
    { name: 'Suggestion Generation', duration: 2000 },
    { name: 'Contextual Display', duration: 1500 },
    { name: 'User Interaction', duration: 3000 }
  ]

  const getCurrentScenario = () => {
    return demoScenarios.find(s => s.id === selectedScenario) || demoScenarios[0]
  }

  const playDemo = async () => {
    setIsPlaying(true)
    setCurrentStep(0)
    setDemoMetrics({ suggestions_shown: 0, interactions: 0, referrals_created: 0 })

    // Simulate demo progression
    for (let i = 0; i < demoSteps.length; i++) {
      setCurrentStep(i)
      await new Promise(resolve => setTimeout(resolve, demoSteps[i].duration))
      
      // Trigger specific demo events
      if (i === 3) { // Suggestion Generation step
        setDemoMetrics(prev => ({ ...prev, suggestions_shown: prev.suggestions_shown + 1 }))
      }
      
      if (i === 4 && getCurrentScenario().triggerType === 'achievement') {
        setShowAchievementCelebration(true)
      }
    }

    setIsPlaying(false)
    setCurrentStep(0)
  }

  const handleDemoInteraction = (type: string) => {
    setDemoMetrics(prev => ({ 
      ...prev, 
      interactions: prev.interactions + 1,
      referrals_created: type === 'referral' ? prev.referrals_created + 1 : prev.referrals_created
    }))
  }

  const scenario = getCurrentScenario()

  return (
    <div className="space-y-6">
      {/* Demo Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Smart Referral Suggestions Demo
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Interactive demonstration of AI-powered contextual referral guidance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Live Demo
              </Badge>
              <Button
                onClick={playDemo}
                disabled={isPlaying}
                className={isPlaying ? "bg-orange-600" : ""}
              >
                {isPlaying ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isPlaying ? 'Running Demo' : 'Start Demo'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="scenarios">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="integration">Integration</TabsTrigger>
            </TabsList>

            {/* Demo Scenarios */}
            <TabsContent value="scenarios" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <h3 className="font-medium mb-3">Select Demo Scenario</h3>
                  <div className="grid gap-3">
                    {demoScenarios.map((demo) => (
                      <Card 
                        key={demo.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedScenario === demo.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedScenario(demo.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{demo.name}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{demo.description}</p>
                              <div className="flex items-center gap-2 text-xs">
                                <Badge variant="outline">{demo.userContext.user_type}</Badge>
                                <Badge variant="outline">{demo.triggerType}</Badge>
                                <Badge variant="outline" className="text-green-600">
                                  {demo.userContext.current_engagement_score}% engagement
                                </Badge>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Expected: {demo.expectedOutcome}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Current Scenario Details */}
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">Current Scenario: {scenario.name}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">User:</span> {scenario.userContext.user_name}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {scenario.userContext.user_type}
                      </div>
                      <div>
                        <span className="font-medium">Engagement:</span> {scenario.userContext.current_engagement_score}%
                      </div>
                      <div>
                        <span className="font-medium">Experience:</span> {scenario.userContext.experience_level}
                      </div>
                      <div>
                        <span className="font-medium">Recent Achievements:</span> {scenario.userContext.recent_achievements.length}
                      </div>
                      <div>
                        <span className="font-medium">Referral Success:</span> {scenario.userContext.referral_history.conversion_rate}%
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Demo Progress */}
                {isPlaying && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Demo Progress</h4>
                      <div className="space-y-2">
                        {demoSteps.map((step, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              index < currentStep ? 'bg-green-100 text-green-600' :
                              index === currentStep ? 'bg-blue-100 text-blue-600' :
                              'bg-gray-100 text-gray-400'
                            }`}>
                              {index < currentStep ? '✓' : index + 1}
                            </div>
                            <div className={`flex-1 ${
                              index === currentStep ? 'font-medium text-blue-600' : 
                              index < currentStep ? 'text-green-600' : 'text-gray-400'
                            }`}>
                              {step.name}
                            </div>
                            {index === currentStep && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Component Showcase */}
            <TabsContent value="components" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <h4 className="font-medium">Opportunity Widget</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Appears during achievement celebrations to suggest referral opportunities
                    </p>
                    <div className="space-y-2 text-xs">
                      <div>• Contextual to recent achievements</div>
                      <div>• Smart timing based on engagement</div>
                      <div>• Personalized suggestion text</div>
                      <div>• Multiple action options</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Bell className="h-5 w-5 text-blue-500" />
                      <h4 className="font-medium">Smart Prompts</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Toast-like notifications using existing notification patterns
                    </p>
                    <div className="space-y-2 text-xs">
                      <div>• Engagement-triggered</div>
                      <div>• Follows notification preferences</div>
                      <div>• Contextual messaging</div>
                      <div>• Snooze and disable options</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageCircle className="h-5 w-5 text-green-500" />
                      <h4 className="font-medium">Coaching Bot</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      AI assistant for referral guidance and tips
                    </p>
                    <div className="space-y-2 text-xs">
                      <div>• Conversational interface</div>
                      <div>• Personalized coaching</div>
                      <div>• Experience-based tips</div>
                      <div>• Real-time guidance</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-5 w-5 text-orange-500" />
                      <h4 className="font-medium">Timing Optimizer</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Analyzes optimal moments for referral conversations
                    </p>
                    <div className="space-y-2 text-xs">
                      <div>• Engagement pattern analysis</div>
                      <div>• Peak timing detection</div>
                      <div>• Success probability scoring</div>
                      <div>• Schedule reminders</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Demo Metrics */}
            <TabsContent value="metrics" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{demoMetrics.suggestions_shown}</div>
                  <div className="text-sm text-muted-foreground">Suggestions Shown</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{demoMetrics.interactions}</div>
                  <div className="text-sm text-muted-foreground">User Interactions</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{demoMetrics.referrals_created}</div>
                  <div className="text-sm text-muted-foreground">Referrals Created</div>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Expected Benefits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Increased Referral Rate
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• 40% increase in referral submissions</li>
                        <li>• Better timing leads to higher acceptance</li>
                        <li>• Contextual suggestions feel natural</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        Higher Quality Referrals
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Personalized message templates</li>
                        <li>• Better target audience matching</li>
                        <li>• Coaching improves success rate</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        Enhanced User Experience
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Non-intrusive suggestions</li>
                        <li>• Respects user preferences</li>
                        <li>• Integrates with existing workflows</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Intelligent Guidance
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• AI-powered coaching</li>
                        <li>• Data-driven timing optimization</li>
                        <li>• Continuous learning and improvement</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Live Integration */}
            <TabsContent value="integration" className="space-y-4">
              <SmartReferralSuggestionsIntegration
                userEngagementState={scenario.userContext}
                onCreateReferral={() => {
                  handleDemoInteraction('referral')
                  console.log('Creating referral...')
                }}
                onScheduleReminder={(time) => {
                  handleDemoInteraction('schedule')
                  console.log('Scheduling reminder for:', time)
                }}
                onViewAnalytics={() => {
                  handleDemoInteraction('analytics')
                  console.log('Viewing analytics...')
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Achievement Celebration Demo */}
      {showAchievementCelebration && (
        <AchievementReferralIntegration
          celebrationEvent={{
            achievement_id: 'demo_achievement',
            achievement_title: 'Excellence Streak Master',
            user_id: scenario.userContext.user_id,
            user_name: scenario.userContext.user_name,
            user_type: scenario.userContext.user_type,
            points_awarded: 500,
            rarity: 'epic',
            category: 'consistency',
            unlock_timestamp: new Date(),
            celebration_status: 'playing'
          }}
          isActive={true}
          onCelebrationComplete={() => {
            setShowAchievementCelebration(false)
            handleDemoInteraction('celebration_complete')
          }}
          onCreateReferral={() => {
            handleDemoInteraction('referral')
            setShowAchievementCelebration(false)
          }}
          onScheduleReminder={(time) => {
            handleDemoInteraction('schedule')
            setShowAchievementCelebration(false)
          }}
          settings={{
            enable_referral_suggestions: true,
            suggestion_timing: 'after',
            auto_suggest_threshold: 70
          }}
        />
      )}
    </div>
  )
}