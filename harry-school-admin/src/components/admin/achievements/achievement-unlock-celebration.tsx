'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Trophy,
  Crown,
  Star,
  Sparkles,
  Gift,
  Zap,
  Target,
  Award,
  PartyPopper,
  Gem,
  Medal,
  Rocket,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Eye,
  Download,
  Share2,
  Bell,
  Heart,
  ThumbsUp,
  MessageCircle,
  Camera,
  Video,
  Music
} from 'lucide-react'

interface Achievement {
  id: string
  title: string
  description: string
  user_type: 'teacher' | 'student' | 'both'
  category: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  points_reward: number
  coin_reward: number
  icon: string
  unlock_conditions: {
    type: 'points' | 'streak' | 'milestone' | 'collaboration' | 'cross_impact'
    target_value: number
    time_window?: number
    correlation_requirement?: number
  }
  celebration_config: {
    duration: number
    visual_effects: string[]
    sound_effects: string[]
    animation_type: 'bounce' | 'zoom' | 'float' | 'sparkle' | 'confetti'
    announcement_scope: 'private' | 'peers' | 'department' | 'organization'
  }
  special_privileges?: string[]
  unlock_timestamp?: Date
  user_id?: string
  user_name?: string
}

interface UnlockEvent {
  id: string
  achievement_id: string
  achievement_title: string
  user_id: string
  user_name: string
  user_type: 'teacher' | 'student'
  unlock_timestamp: Date
  celebration_status: 'queued' | 'playing' | 'completed' | 'skipped'
  triggered_by: string
  rarity: string
  points_awarded: number
  audience_size: number
  engagement_metrics: {
    congratulations_received: number
    shares: number
    views: number
  }
}

interface CelebrationSettings {
  auto_play: boolean
  sound_enabled: boolean
  animation_intensity: 'minimal' | 'standard' | 'enhanced' | 'spectacular'
  notification_preferences: {
    personal_achievements: boolean
    peer_achievements: boolean
    department_achievements: boolean
    rare_achievements: boolean
  }
  privacy_settings: {
    share_achievements: boolean
    allow_congratulations: boolean
    public_profile_display: boolean
  }
}

export function AchievementUnlockCelebration() {
  const [selectedTab, setSelectedTab] = useState('unlock_queue')
  const [playingCelebration, setPlayingCelebration] = useState<UnlockEvent | null>(null)
  const [celebrationSettings, setCelebrationSettings] = useState<CelebrationSettings>({
    auto_play: true,
    sound_enabled: true,
    animation_intensity: 'standard',
    notification_preferences: {
      personal_achievements: true,
      peer_achievements: true,
      department_achievements: true,
      rare_achievements: true
    },
    privacy_settings: {
      share_achievements: true,
      allow_congratulations: true,
      public_profile_display: true
    }
  })
  const [selectedUnlockEvent, setSelectedUnlockEvent] = useState<UnlockEvent | null>(null)
  const [filterRarity, setFilterRarity] = useState('all')
  const [filterUserType, setFilterUserType] = useState('all')

  // Mock data
  const [pendingUnlocks] = useState<UnlockEvent[]>([
    {
      id: 'unlock1',
      achievement_id: 'ach_excellence_streak',
      achievement_title: 'Excellence Streak Master',
      user_id: 't1',
      user_name: 'Sarah Johnson',
      user_type: 'teacher',
      unlock_timestamp: new Date('2024-03-15T14:30:00'),
      celebration_status: 'queued',
      triggered_by: 'streak_milestone',
      rarity: 'epic',
      points_awarded: 500,
      audience_size: 0,
      engagement_metrics: {
        congratulations_received: 0,
        shares: 0,
        views: 0
      }
    },
    {
      id: 'unlock2',
      achievement_id: 'ach_cross_impact_hero',
      achievement_title: 'Cross-Impact Hero',
      user_id: 's12',
      user_name: 'Alex Chen',
      user_type: 'student',
      unlock_timestamp: new Date('2024-03-15T15:45:00'),
      celebration_status: 'queued',
      triggered_by: 'correlation_boost',
      rarity: 'legendary',
      points_awarded: 1000,
      audience_size: 0,
      engagement_metrics: {
        congratulations_received: 0,
        shares: 0,
        views: 0
      }
    }
  ])

  const [recentUnlocks] = useState<UnlockEvent[]>([
    {
      id: 'unlock3',
      achievement_id: 'ach_mentor_excellence',
      achievement_title: 'Mentor Excellence',
      user_id: 't5',
      user_name: 'Michael Rodriguez',
      user_type: 'teacher',
      unlock_timestamp: new Date('2024-03-14T16:20:00'),
      celebration_status: 'completed',
      triggered_by: 'mentorship_milestone',
      rarity: 'rare',
      points_awarded: 250,
      audience_size: 25,
      engagement_metrics: {
        congratulations_received: 12,
        shares: 3,
        views: 45
      }
    },
    {
      id: 'unlock4',
      achievement_id: 'ach_collaborative_learner',
      achievement_title: 'Collaborative Learner',
      user_id: 's8',
      user_name: 'Emma Wilson',
      user_type: 'student',
      unlock_timestamp: new Date('2024-03-14T11:15:00'),
      celebration_status: 'completed',
      triggered_by: 'group_performance',
      rarity: 'uncommon',
      points_awarded: 100,
      audience_size: 18,
      engagement_metrics: {
        congratulations_received: 8,
        shares: 1,
        views: 32
      }
    },
    {
      id: 'unlock5',
      achievement_id: 'ach_innovation_pioneer',
      achievement_title: 'Innovation Pioneer',
      user_id: 't3',
      user_name: 'Dr. Lisa Park',
      user_type: 'teacher',
      unlock_timestamp: new Date('2024-03-13T09:45:00'),
      celebration_status: 'completed',
      triggered_by: 'innovation_metrics',
      rarity: 'epic',
      points_awarded: 750,
      audience_size: 67,
      engagement_metrics: {
        congratulations_received: 28,
        shares: 9,
        views: 134
      }
    }
  ])

  const [achievements] = useState<Achievement[]>([
    {
      id: 'ach_excellence_streak',
      title: 'Excellence Streak Master',
      description: 'Maintain exceptional performance for 30 consecutive days',
      user_type: 'teacher',
      category: 'consistency',
      rarity: 'epic',
      points_reward: 500,
      coin_reward: 50,
      icon: 'crown',
      unlock_conditions: {
        type: 'streak',
        target_value: 30,
        time_window: 30
      },
      celebration_config: {
        duration: 8000,
        visual_effects: ['golden_crown_animation', 'streak_counter_display', 'excellence_badge_glow'],
        sound_effects: ['triumph_fanfare', 'crown_chime'],
        animation_type: 'sparkle',
        announcement_scope: 'department'
      },
      special_privileges: ['streak_bonus_multiplier', 'priority_scheduling', 'excellence_badge_display']
    },
    {
      id: 'ach_cross_impact_hero',
      title: 'Cross-Impact Hero',
      description: 'Achieve the highest cross-impact correlation score in the organization',
      user_type: 'both',
      category: 'collaboration',
      rarity: 'legendary',
      points_reward: 1000,
      coin_reward: 100,
      icon: 'zap',
      unlock_conditions: {
        type: 'cross_impact',
        target_value: 95,
        correlation_requirement: 0.85
      },
      celebration_config: {
        duration: 12000,
        visual_effects: ['lightning_bolt_cascade', 'impact_wave_animation', 'legendary_aura'],
        sound_effects: ['epic_orchestral', 'lightning_thunder', 'achievement_bells'],
        animation_type: 'confetti',
        announcement_scope: 'organization'
      },
      special_privileges: ['cross_impact_mentor_badge', 'collaboration_priority', 'legendary_profile_frame']
    }
  ])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50 text-gray-700'
      case 'uncommon': return 'border-green-300 bg-green-50 text-green-700'
      case 'rare': return 'border-blue-300 bg-blue-50 text-blue-700'
      case 'epic': return 'border-purple-300 bg-purple-50 text-purple-700'
      case 'legendary': return 'border-yellow-300 bg-yellow-50 text-yellow-700'
      default: return 'border-gray-300 bg-gray-50 text-gray-700'
    }
  }

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Star className="h-4 w-4" />
      case 'uncommon': return <Award className="h-4 w-4" />
      case 'rare': return <Gem className="h-4 w-4" />
      case 'epic': return <Crown className="h-4 w-4" />
      case 'legendary': return <Trophy className="h-4 w-4" />
      default: return <Star className="h-4 w-4" />
    }
  }

  const getCelebrationStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'bg-yellow-100 text-yellow-800'
      case 'playing': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'skipped': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const playCelebration = (unlockEvent: UnlockEvent) => {
    setPlayingCelebration(unlockEvent)
    
    // Update celebration status
    unlockEvent.celebration_status = 'playing'
    
    // Simulate celebration duration
    setTimeout(() => {
      if (playingCelebration?.id === unlockEvent.id) {
        setPlayingCelebration(null)
        unlockEvent.celebration_status = 'completed'
        unlockEvent.engagement_metrics.views += Math.floor(Math.random() * 20) + 10
      }
    }, 5000) // 5 second celebration
  }

  const skipCelebration = (unlockEvent: UnlockEvent) => {
    unlockEvent.celebration_status = 'skipped'
    setPlayingCelebration(null)
  }

  const filteredRecentUnlocks = recentUnlocks.filter(unlock => {
    const matchesRarity = filterRarity === 'all' || unlock.rarity === filterRarity
    const matchesUserType = filterUserType === 'all' || unlock.user_type === filterUserType
    return matchesRarity && matchesUserType
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <PartyPopper className="h-5 w-5" />
                Achievement Unlock & Celebration System
              </CardTitle>
              <CardDescription>
                Manage achievement unlocks and celebrate user accomplishments with engaging animations
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedTab('settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="unlock_queue">Unlock Queue</TabsTrigger>
              <TabsTrigger value="recent_unlocks">Recent Unlocks</TabsTrigger>
              <TabsTrigger value="celebration_preview">Preview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Unlock Queue */}
            <TabsContent value="unlock_queue" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <span className="font-medium">Pending Celebrations ({pendingUnlocks.length})</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => pendingUnlocks.forEach(u => playCelebration(u))}>
                    <Play className="h-4 w-4 mr-2" />
                    Play All
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Queue
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {pendingUnlocks.map((unlock) => (
                  <Card key={unlock.id} className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getRarityColor(unlock.rarity)}`}>
                            {getRarityIcon(unlock.rarity)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-lg">{unlock.achievement_title}</span>
                              <Badge className={getRarityColor(unlock.rarity)}>
                                {unlock.rarity}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {unlock.user_name} • {unlock.user_type} • {unlock.unlock_timestamp.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Trophy className="h-4 w-4 text-yellow-500" />
                                <span>{unlock.points_awarded} points</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Zap className="h-4 w-4 text-blue-500" />
                                <span>Triggered by: {unlock.triggered_by}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getCelebrationStatusColor(unlock.celebration_status)}>
                            {unlock.celebration_status}
                          </Badge>
                          <Button onClick={() => playCelebration(unlock)}>
                            <Play className="h-4 w-4 mr-2" />
                            Celebrate
                          </Button>
                          <Button variant="outline" onClick={() => skipCelebration(unlock)}>
                            Skip
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {pendingUnlocks.length === 0 && (
                  <Card className="p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                    <p className="text-muted-foreground">No pending achievement celebrations at the moment.</p>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Recent Unlocks */}
            <TabsContent value="recent_unlocks" className="space-y-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Recent Achievement Unlocks</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={filterRarity} onValueChange={setFilterRarity}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rarities</SelectItem>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="uncommon">Uncommon</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterUserType} onValueChange={setFilterUserType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="teacher">Teachers</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                {filteredRecentUnlocks.map((unlock) => (
                  <Card key={unlock.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRarityColor(unlock.rarity)}`}>
                            {getRarityIcon(unlock.rarity)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{unlock.achievement_title}</span>
                              <Badge className={getRarityColor(unlock.rarity)}>
                                {unlock.rarity}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {unlock.user_name} • {unlock.user_type} • {unlock.unlock_timestamp.toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-blue-500" />
                                <span>{unlock.audience_size} viewers</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ThumbsUp className="h-4 w-4 text-green-500" />
                                <span>{unlock.engagement_metrics.congratulations_received} congratulations</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Share2 className="h-4 w-4 text-purple-500" />
                                <span>{unlock.engagement_metrics.shares} shares</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedUnlockEvent(unlock)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <Video className="h-4 w-4 mr-2" />
                            Replay
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Celebration Preview */}
            <TabsContent value="celebration_preview" className="space-y-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Celebration Preview Center</span>
                </div>
                <p className="text-muted-foreground mb-6">
                  Preview and test achievement celebrations before they go live
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {achievements.map((achievement) => (
                  <Card key={achievement.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="text-center mb-4">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 ${getRarityColor(achievement.rarity)}`}>
                          {getRarityIcon(achievement.rarity)}
                        </div>
                        <h3 className="font-bold text-lg mb-1">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                        <Badge className={getRarityColor(achievement.rarity)}>
                          {achievement.rarity}
                        </Badge>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span>Celebration Duration:</span>
                          <span>{achievement.celebration_config.duration / 1000}s</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Animation Type:</span>
                          <span className="capitalize">{achievement.celebration_config.animation_type}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Announcement Scope:</span>
                          <span className="capitalize">{achievement.celebration_config.announcement_scope}</span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <Label className="text-sm font-medium">Visual Effects:</Label>
                        <div className="flex flex-wrap gap-1">
                          {achievement.celebration_config.visual_effects.map(effect => (
                            <Badge key={effect} variant="outline" className="text-xs">
                              {effect.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <Label className="text-sm font-medium">Sound Effects:</Label>
                        <div className="flex flex-wrap gap-1">
                          {achievement.celebration_config.sound_effects.map(sound => (
                            <Badge key={sound} variant="outline" className="text-xs">
                              {sound.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button className="w-full" onClick={() => {
                        // Create a mock unlock event for preview
                        const mockUnlock: UnlockEvent = {
                          id: `preview_${achievement.id}`,
                          achievement_id: achievement.id,
                          achievement_title: achievement.title,
                          user_id: 'preview_user',
                          user_name: 'Preview User',
                          user_type: achievement.user_type === 'both' ? 'teacher' : achievement.user_type,
                          unlock_timestamp: new Date(),
                          celebration_status: 'queued',
                          triggered_by: 'preview_test',
                          rarity: achievement.rarity,
                          points_awarded: achievement.points_reward,
                          audience_size: 1,
                          engagement_metrics: {
                            congratulations_received: 0,
                            shares: 0,
                            views: 0
                          }
                        }
                        playCelebration(mockUnlock)
                      }}>
                        <Play className="h-4 w-4 mr-2" />
                        Preview Celebration
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {recentUnlocks.length + pendingUnlocks.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Unlocks Today</div>
                    </div>
                    <Trophy className="h-8 w-8 text-blue-500" />
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {recentUnlocks.filter(u => u.celebration_status === 'completed').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Celebrations Completed</div>
                    </div>
                    <PartyPopper className="h-8 w-8 text-green-500" />
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {recentUnlocks.reduce((sum, u) => sum + u.engagement_metrics.congratulations_received, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Congratulations</div>
                    </div>
                    <Heart className="h-8 w-8 text-purple-500" />
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {recentUnlocks.reduce((sum, u) => sum + u.audience_size, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Celebration Views</div>
                    </div>
                    <Eye className="h-8 w-8 text-orange-500" />
                  </div>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Celebration Engagement Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentUnlocks.map((unlock) => (
                      <div key={unlock.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRarityColor(unlock.rarity)}`}>
                            {getRarityIcon(unlock.rarity)}
                          </div>
                          <div>
                            <div className="font-medium">{unlock.achievement_title}</div>
                            <div className="text-sm text-muted-foreground">{unlock.user_name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="font-bold">{unlock.audience_size}</div>
                            <div className="text-muted-foreground">Views</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{unlock.engagement_metrics.congratulations_received}</div>
                            <div className="text-muted-foreground">Congratulations</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{unlock.engagement_metrics.shares}</div>
                            <div className="text-muted-foreground">Shares</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">
                              {unlock.engagement_metrics.congratulations_received > 0 
                                ? Math.round((unlock.engagement_metrics.congratulations_received / unlock.audience_size) * 100)
                                : 0}%
                            </div>
                            <div className="text-muted-foreground">Engagement Rate</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Celebration Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Auto-play Celebrations</Label>
                        <p className="text-sm text-muted-foreground">Automatically play celebrations when achievements are unlocked</p>
                      </div>
                      <Button
                        variant={celebrationSettings.auto_play ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCelebrationSettings(prev => ({ ...prev, auto_play: !prev.auto_play }))}
                      >
                        {celebrationSettings.auto_play ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Sound Effects</Label>
                        <p className="text-sm text-muted-foreground">Enable celebration sound effects and audio feedback</p>
                      </div>
                      <Button
                        variant={celebrationSettings.sound_enabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCelebrationSettings(prev => ({ ...prev, sound_enabled: !prev.sound_enabled }))}
                      >
                        {celebrationSettings.sound_enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="font-medium">Animation Intensity</Label>
                      <p className="text-sm text-muted-foreground">Choose the level of visual effects for celebrations</p>
                      <Select 
                        value={celebrationSettings.animation_intensity} 
                        onValueChange={(value: any) => setCelebrationSettings(prev => ({ ...prev, animation_intensity: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimal">Minimal - Simple animations</SelectItem>
                          <SelectItem value="standard">Standard - Balanced effects</SelectItem>
                          <SelectItem value="enhanced">Enhanced - Rich animations</SelectItem>
                          <SelectItem value="spectacular">Spectacular - Full effects</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="font-medium">Notification Preferences</Label>
                    <div className="space-y-3">
                      {Object.entries(celebrationSettings.notification_preferences).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                          <Button
                            variant={value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCelebrationSettings(prev => ({
                              ...prev,
                              notification_preferences: {
                                ...prev.notification_preferences,
                                [key]: !value
                              }
                            }))}
                          >
                            {value ? "On" : "Off"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="font-medium">Privacy Settings</Label>
                    <div className="space-y-3">
                      {Object.entries(celebrationSettings.privacy_settings).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                          <Button
                            variant={value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCelebrationSettings(prev => ({
                              ...prev,
                              privacy_settings: {
                                ...prev.privacy_settings,
                                [key]: !value
                              }
                            }))}
                          >
                            {value ? "Enabled" : "Disabled"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Active Celebration Overlay */}
      {playingCelebration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 animate-pulse" />
            <CardContent className="p-8 text-center relative z-10">
              <div className="animate-bounce mb-4">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${getRarityColor(playingCelebration.rarity)}`}>
                  {getRarityIcon(playingCelebration.rarity)}
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">{playingCelebration.achievement_title}</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Congratulations, {playingCelebration.user_name}!
              </p>
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="font-bold">{playingCelebration.points_awarded} points</span>
                </div>
                <Badge className={getRarityColor(playingCelebration.rarity)}>
                  {playingCelebration.rarity}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => skipCelebration(playingCelebration)}>
                  Skip
                </Button>
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Unlock Event Details Dialog */}
      {selectedUnlockEvent && (
        <Dialog open={!!selectedUnlockEvent} onOpenChange={() => setSelectedUnlockEvent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Achievement Unlock Details</DialogTitle>
              <DialogDescription>
                Complete information for {selectedUnlockEvent.achievement_title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 ${getRarityColor(selectedUnlockEvent.rarity)}`}>
                  {getRarityIcon(selectedUnlockEvent.rarity)}
                </div>
                <h3 className="text-xl font-bold mb-1">{selectedUnlockEvent.achievement_title}</h3>
                <Badge className={getRarityColor(selectedUnlockEvent.rarity)}>
                  {selectedUnlockEvent.rarity}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>User Information</Label>
                  <div className="p-3 border rounded bg-gray-50">
                    <div className="font-medium">{selectedUnlockEvent.user_name}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {selectedUnlockEvent.user_type} (ID: {selectedUnlockEvent.user_id})
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Unlock Details</Label>
                  <div className="p-3 border rounded bg-blue-50">
                    <div className="text-sm">
                      <div>Unlocked: {selectedUnlockEvent.unlock_timestamp.toLocaleString()}</div>
                      <div>Triggered by: {selectedUnlockEvent.triggered_by}</div>
                      <div>Points awarded: {selectedUnlockEvent.points_awarded}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Engagement Metrics</Label>
                <div className="grid gap-4 md:grid-cols-3 mt-2">
                  <div className="p-3 border rounded text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedUnlockEvent.audience_size}</div>
                    <div className="text-sm text-muted-foreground">Viewers</div>
                  </div>
                  <div className="p-3 border rounded text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedUnlockEvent.engagement_metrics.congratulations_received}</div>
                    <div className="text-sm text-muted-foreground">Congratulations</div>
                  </div>
                  <div className="p-3 border rounded text-center">
                    <div className="text-2xl font-bold text-purple-600">{selectedUnlockEvent.engagement_metrics.shares}</div>
                    <div className="text-sm text-muted-foreground">Shares</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Send Congratulations
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Achievement
                </Button>
                <Button variant="outline">
                  <Camera className="h-4 w-4 mr-2" />
                  Screenshot
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}