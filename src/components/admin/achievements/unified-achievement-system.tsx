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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  Trophy,
  Star,
  Target,
  Zap,
  Crown,
  Award,
  Medal,
  Gem,
  Sparkles,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Edit,
  Eye,
  Settings,
  Filter,
  Search,
  Download,
  Upload,
  BarChart3,
  PieChart,
  Activity,
  User,
  GraduationCap,
  BookOpen,
  Brain,
  Heart,
  Lightbulb,
  Rocket,
  Shield
} from 'lucide-react'

interface Achievement {
  id: string
  title: string
  description: string
  category: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  user_type: 'teacher' | 'student' | 'both'
  criteria: {
    type: 'points_threshold' | 'streak_days' | 'performance_tier' | 'cross_impact_score' | 'composite'
    value: number | string
    conditions: any[]
  }
  rewards: {
    points: number
    coins: number
    special_privileges?: string[]
    badge_color: string
    badge_icon: string
  }
  unlock_conditions: {
    prerequisite_achievements?: string[]
    minimum_level?: number
    department_specific?: string[]
    time_based?: {
      available_from?: Date
      available_until?: Date
      seasonal?: boolean
    }
  }
  cross_impact_effects: {
    teacher_student_boost?: number
    peer_influence_multiplier?: number
    organizational_recognition?: boolean
  }
  status: 'active' | 'hidden' | 'seasonal' | 'limited_time' | 'disabled'
  created_at: Date
  created_by: string
  statistics: {
    total_unlocked: number
    completion_rate: number
    average_unlock_time: number
    difficulty_rating: number
  }
}

interface UserAchievement {
  id: string
  user_id: string
  user_name: string
  user_type: 'teacher' | 'student'
  achievement_id: string
  achievement_title: string
  unlocked_at: Date
  progress_when_unlocked: any
  celebration_shown: boolean
  shared_publicly: boolean
  impact_metrics?: {
    points_gained: number
    level_increase: boolean
    peer_reactions: number
    mentor_recognition: boolean
  }
}

interface AchievementTemplate {
  id: string
  name: string
  description: string
  category: string
  suggested_criteria: any
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  estimated_completion_time: string
  tags: string[]
}

export function UnifiedAchievementSystem() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false)
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterUserType, setFilterUserType] = useState('all')
  const [filterRarity, setFilterRarity] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Form state for creating achievements
  const [achievementForm, setAchievementForm] = useState({
    title: '',
    description: '',
    category: '',
    rarity: 'common' as Achievement['rarity'],
    user_type: 'both' as Achievement['user_type'],
    criteria_type: 'points_threshold',
    criteria_value: 0,
    reward_points: 0,
    reward_coins: 0,
    badge_color: '#3B82F6',
    badge_icon: 'trophy',
    cross_impact_enabled: false,
    teacher_student_boost: 0,
    seasonal: false
  })

  // Mock data
  const [achievements] = useState<Achievement[]>([
    {
      id: 'ach1',
      title: 'Teaching Excellence Master',
      description: 'Achieve and maintain exceptional teaching performance with student satisfaction above 90%',
      category: 'teaching_excellence',
      rarity: 'epic',
      user_type: 'teacher',
      criteria: {
        type: 'composite',
        value: 90,
        conditions: [
          { metric: 'student_satisfaction', operator: '>=', value: 90 },
          { metric: 'performance_tier', operator: '==', value: 'excellent' },
          { metric: 'consecutive_months', operator: '>=', value: 3 }
        ]
      },
      rewards: {
        points: 500,
        coins: 100,
        special_privileges: ['priority_scheduling', 'mentorship_opportunities'],
        badge_color: '#8B5CF6',
        badge_icon: 'crown'
      },
      unlock_conditions: {
        minimum_level: 5,
        prerequisite_achievements: ['ach_basic_teaching']
      },
      cross_impact_effects: {
        teacher_student_boost: 15,
        peer_influence_multiplier: 1.3,
        organizational_recognition: true
      },
      status: 'active',
      created_at: new Date('2024-01-15'),
      created_by: 'admin1',
      statistics: {
        total_unlocked: 12,
        completion_rate: 8.2,
        average_unlock_time: 145,
        difficulty_rating: 4.2
      }
    },
    {
      id: 'ach2',
      title: 'Academic Achievement Star',
      description: 'Maintain top 10% academic performance for an entire semester',
      category: 'academic_excellence',
      rarity: 'rare',
      user_type: 'student',
      criteria: {
        type: 'composite',
        value: 10,
        conditions: [
          { metric: 'percentile_rank', operator: '<=', value: 10 },
          { metric: 'semester_duration', operator: '>=', value: 1 },
          { metric: 'minimum_subjects', operator: '>=', value: 5 }
        ]
      },
      rewards: {
        points: 300,
        coins: 50,
        special_privileges: ['academic_recognition', 'scholarship_eligibility'],
        badge_color: '#F59E0B',
        badge_icon: 'star'
      },
      unlock_conditions: {
        minimum_level: 3
      },
      cross_impact_effects: {
        peer_influence_multiplier: 1.2,
        organizational_recognition: true
      },
      status: 'active',
      created_at: new Date('2024-02-01'),
      created_by: 'admin1',
      statistics: {
        total_unlocked: 28,
        completion_rate: 15.3,
        average_unlock_time: 89,
        difficulty_rating: 3.8
      }
    },
    {
      id: 'ach3',
      title: 'Cross-Impact Champion',
      description: 'Generate positive cross-impact effects that benefit both teachers and students',
      category: 'collaboration',
      rarity: 'legendary',
      user_type: 'both',
      criteria: {
        type: 'cross_impact_score',
        value: 85,
        conditions: [
          { metric: 'cross_impact_score', operator: '>=', value: 85 },
          { metric: 'sustained_period', operator: '>=', value: 60 },
          { metric: 'beneficiary_count', operator: '>=', value: 10 }
        ]
      },
      rewards: {
        points: 750,
        coins: 150,
        special_privileges: ['leadership_recognition', 'mentorship_badge', 'conference_invitation'],
        badge_color: '#DC2626',
        badge_icon: 'gem'
      },
      unlock_conditions: {
        minimum_level: 7,
        prerequisite_achievements: ['ach1', 'ach2']
      },
      cross_impact_effects: {
        teacher_student_boost: 25,
        peer_influence_multiplier: 1.5,
        organizational_recognition: true
      },
      status: 'active',
      created_at: new Date('2024-01-20'),
      created_by: 'admin1',
      statistics: {
        total_unlocked: 3,
        completion_rate: 2.1,
        average_unlock_time: 287,
        difficulty_rating: 4.9
      }
    }
  ])

  const [userAchievements] = useState<UserAchievement[]>([
    {
      id: 'ua1',
      user_id: 't1',
      user_name: 'Sarah Johnson',
      user_type: 'teacher',
      achievement_id: 'ach1',
      achievement_title: 'Teaching Excellence Master',
      unlocked_at: new Date('2024-03-10'),
      progress_when_unlocked: { satisfaction_score: 94, performance_months: 4 },
      celebration_shown: true,
      shared_publicly: true,
      impact_metrics: {
        points_gained: 500,
        level_increase: true,
        peer_reactions: 15,
        mentor_recognition: true
      }
    },
    {
      id: 'ua2',
      user_id: 's3',
      user_name: 'Emma Chen',
      user_type: 'student',
      achievement_id: 'ach2',
      achievement_title: 'Academic Achievement Star',
      unlocked_at: new Date('2024-03-08'),
      progress_when_unlocked: { percentile: 8, semester_gpa: 3.9 },
      celebration_shown: true,
      shared_publicly: false,
      impact_metrics: {
        points_gained: 300,
        level_increase: true,
        peer_reactions: 8,
        mentor_recognition: false
      }
    }
  ])

  const [achievementTemplates] = useState<AchievementTemplate[]>([
    {
      id: 'template1',
      name: 'Points Milestone Achievement',
      description: 'Award achievement when user reaches specific point thresholds',
      category: 'progression',
      suggested_criteria: {
        type: 'points_threshold',
        thresholds: [100, 500, 1000, 2500, 5000]
      },
      difficulty_level: 'beginner',
      estimated_completion_time: '1-3 months',
      tags: ['points', 'progression', 'milestone']
    },
    {
      id: 'template2',
      name: 'Consistency Streak Achievement',
      description: 'Reward users for maintaining consistent performance over time',
      category: 'consistency',
      suggested_criteria: {
        type: 'streak_days',
        options: [7, 14, 30, 60, 90]
      },
      difficulty_level: 'intermediate',
      estimated_completion_time: '1-6 months',
      tags: ['consistency', 'streak', 'endurance']
    },
    {
      id: 'template3',
      name: 'Cross-Impact Excellence',
      description: 'Recognize users who create positive impact across teacher-student relationships',
      category: 'collaboration',
      suggested_criteria: {
        type: 'cross_impact_score',
        benchmarks: [70, 80, 90, 95]
      },
      difficulty_level: 'advanced',
      estimated_completion_time: '3-12 months',
      tags: ['cross-impact', 'collaboration', 'excellence']
    }
  ])

  const categories = [
    { id: 'teaching_excellence', label: 'Teaching Excellence', icon: GraduationCap, color: 'blue' },
    { id: 'academic_excellence', label: 'Academic Excellence', icon: BookOpen, color: 'green' },
    { id: 'collaboration', label: 'Collaboration', icon: Users, color: 'purple' },
    { id: 'innovation', label: 'Innovation', icon: Lightbulb, color: 'yellow' },
    { id: 'leadership', label: 'Leadership', icon: Crown, color: 'red' },
    { id: 'consistency', label: 'Consistency', icon: Target, color: 'indigo' },
    { id: 'mentorship', label: 'Mentorship', icon: Heart, color: 'pink' },
    { id: 'progression', label: 'Progression', icon: TrendingUp, color: 'emerald' }
  ]

  const rarityConfig = {
    common: { color: 'bg-gray-100 text-gray-800', icon: Award, multiplier: 1.0 },
    uncommon: { color: 'bg-green-100 text-green-800', icon: Medal, multiplier: 1.2 },
    rare: { color: 'bg-blue-100 text-blue-800', icon: Star, multiplier: 1.5 },
    epic: { color: 'bg-purple-100 text-purple-800', icon: Crown, multiplier: 2.0 },
    legendary: { color: 'bg-red-100 text-red-800', icon: Gem, multiplier: 3.0 }
  }

  const filteredAchievements = achievements.filter(achievement => {
    const matchesCategory = filterCategory === 'all' || achievement.category === filterCategory
    const matchesUserType = filterUserType === 'all' || achievement.user_type === filterUserType || achievement.user_type === 'both'
    const matchesRarity = filterRarity === 'all' || achievement.rarity === filterRarity
    const matchesSearch = searchQuery === '' || 
      achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCategory && matchesUserType && matchesRarity && matchesSearch
  })

  const handleCreateAchievement = () => {
    // Implementation would create new achievement
    console.log('Creating achievement:', achievementForm)
    setShowCreateDialog(false)
    // Reset form
    setAchievementForm({
      title: '',
      description: '',
      category: '',
      rarity: 'common',
      user_type: 'both',
      criteria_type: 'points_threshold',
      criteria_value: 0,
      reward_points: 0,
      reward_coins: 0,
      badge_color: '#3B82F6',
      badge_icon: 'trophy',
      cross_impact_enabled: false,
      teacher_student_boost: 0,
      seasonal: false
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Unified Achievement System
              </CardTitle>
              <CardDescription>
                Comprehensive achievement framework for teachers and students with cross-impact recognition
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowTemplatesDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Achievement
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="unlocked">Recent Unlocks</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{achievements.length}</div>
                      <div className="text-sm text-muted-foreground">Total Achievements</div>
                    </div>
                    <Trophy className="h-8 w-8 text-blue-500" />
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{userAchievements.length}</div>
                      <div className="text-sm text-muted-foreground">Recent Unlocks</div>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(achievements.reduce((sum, a) => sum + a.statistics.completion_rate, 0) / achievements.length)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Completion Rate</div>
                    </div>
                    <Target className="h-8 w-8 text-purple-500" />
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {achievements.filter(a => a.user_type === 'both').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Cross-Impact Achievements</div>
                    </div>
                    <Zap className="h-8 w-8 text-orange-500" />
                  </div>
                </Card>
              </div>

              {/* Rarity Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Achievement Rarity Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(rarityConfig).map(([rarity, config]) => {
                      const count = achievements.filter(a => a.rarity === rarity).length
                      const percentage = Math.round((count / achievements.length) * 100)
                      
                      return (
                        <div key={rarity} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <config.icon className="h-5 w-5" />
                            <div>
                              <div className="font-medium capitalize">{rarity}</div>
                              <div className="text-sm text-muted-foreground">
                                {config.multiplier}x reward multiplier
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={config.color}>
                              {count} achievements ({percentage}%)
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Achievement Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userAchievements.slice(0, 5).map((userAch) => (
                      <div key={userAch.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            userAch.user_type === 'teacher' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {userAch.user_type === 'teacher' ? <GraduationCap className="h-5 w-5" /> : <User className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="font-medium">{userAch.user_name}</div>
                            <div className="text-sm text-muted-foreground">
                              Unlocked "{userAch.achievement_title}"
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            +{userAch.impact_metrics?.points_gained} points
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {userAch.unlocked_at.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements Management */}
            <TabsContent value="achievements" className="space-y-6">
              {/* Filters */}
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Label>Search Achievements</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by title or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>User Type</Label>
                  <Select value={filterUserType} onValueChange={setFilterUserType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="teacher">Teachers</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rarity</Label>
                  <Select value={filterRarity} onValueChange={setFilterRarity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rarities</SelectItem>
                      {Object.keys(rarityConfig).map(rarity => (
                        <SelectItem key={rarity} value={rarity} className="capitalize">{rarity}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Achievements Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAchievements.map((achievement) => (
                  <Card key={achievement.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedAchievement(achievement)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center`}
                             style={{ backgroundColor: achievement.rewards.badge_color + '20' }}>
                          <Trophy className="h-6 w-6" style={{ color: achievement.rewards.badge_color }} />
                        </div>
                        <Badge className={rarityConfig[achievement.rarity].color}>
                          {achievement.rarity}
                        </Badge>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{achievement.title}</CardTitle>
                        <div className="text-sm text-muted-foreground capitalize">
                          {achievement.category.replace('_', ' ')} • {achievement.user_type}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 mb-4">
                        {achievement.description}
                      </p>
                      
                      <div className="grid gap-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Rewards:</span>
                          <span className="font-medium">
                            {achievement.rewards.points} pts, {achievement.rewards.coins} coins
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Unlocked:</span>
                          <span className="font-medium">{achievement.statistics.total_unlocked} times</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Completion:</span>
                          <span className="font-medium">{achievement.statistics.completion_rate}%</span>
                        </div>
                      </div>

                      {achievement.cross_impact_effects.teacher_student_boost && (
                        <div className="flex items-center gap-2 p-2 bg-orange-50 rounded text-sm">
                          <Zap className="h-4 w-4 text-orange-600" />
                          <span className="text-orange-700">
                            +{achievement.cross_impact_effects.teacher_student_boost}% Cross-Impact
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Recent Unlocks */}
            <TabsContent value="unlocked" className="space-y-6">
              <div className="space-y-4">
                {userAchievements.map((userAch) => (
                  <Card key={userAch.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            userAch.user_type === 'teacher' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {userAch.user_type === 'teacher' ? <GraduationCap className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{userAch.user_name}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {userAch.user_type} • {userAch.unlocked_at.toLocaleString()}
                            </div>
                            <div className="text-lg font-bold text-purple-600 mt-1">
                              {userAch.achievement_title}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {userAch.shared_publicly && (
                            <Badge variant="outline">Public</Badge>
                          )}
                          {userAch.impact_metrics?.level_increase && (
                            <Badge className="bg-yellow-100 text-yellow-800">Level Up!</Badge>
                          )}
                        </div>
                      </div>

                      {userAch.impact_metrics && (
                        <div className="grid gap-3 md:grid-cols-4 text-sm">
                          <div className="text-center p-2 bg-green-50 rounded">
                            <div className="font-bold text-green-600">+{userAch.impact_metrics.points_gained}</div>
                            <div className="text-green-700">Points</div>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <div className="font-bold text-blue-600">{userAch.impact_metrics.peer_reactions}</div>
                            <div className="text-blue-700">Reactions</div>
                          </div>
                          <div className="text-center p-2 bg-purple-50 rounded">
                            <div className="font-bold text-purple-600">
                              {userAch.impact_metrics.mentor_recognition ? 'Yes' : 'No'}
                            </div>
                            <div className="text-purple-700">Mentor Recognition</div>
                          </div>
                          <div className="text-center p-2 bg-orange-50 rounded">
                            <div className="font-bold text-orange-600">
                              {userAch.celebration_shown ? 'Shown' : 'Pending'}
                            </div>
                            <div className="text-orange-700">Celebration</div>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs text-muted-foreground">
                          Progress when unlocked: {JSON.stringify(userAch.progress_when_unlocked)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Difficulty Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {achievements.map((achievement) => (
                        <div key={achievement.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex-1">
                            <div className="font-medium">{achievement.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {achievement.statistics.completion_rate}% completion rate
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {achievement.statistics.difficulty_rating}/5
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {achievement.statistics.average_unlock_time}d avg
                              </div>
                            </div>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${
                                    i < achievement.statistics.difficulty_rating 
                                      ? 'text-yellow-400 fill-current' 
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Cross-Impact Effectiveness
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {achievements
                        .filter(a => a.cross_impact_effects.teacher_student_boost)
                        .map((achievement) => (
                          <div key={achievement.id} className="p-3 border rounded">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium">{achievement.title}</div>
                              <Badge className="bg-orange-100 text-orange-800">
                                +{achievement.cross_impact_effects.teacher_student_boost}%
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Unlocked {achievement.statistics.total_unlocked} times • 
                              {achievement.cross_impact_effects.peer_influence_multiplier}x peer influence
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Categories */}
            <TabsContent value="categories" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {categories.map((category) => {
                  const categoryAchievements = achievements.filter(a => a.category === category.id)
                  const totalUnlocked = categoryAchievements.reduce((sum, a) => sum + a.statistics.total_unlocked, 0)
                  
                  return (
                    <Card key={category.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${category.color}-100 text-${category.color}-600`}>
                            <category.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">{category.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {categoryAchievements.length} achievements
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total Unlocks:</span>
                            <span className="font-medium">{totalUnlocked}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Avg Completion:</span>
                            <span className="font-medium">
                              {Math.round(categoryAchievements.reduce((sum, a) => sum + a.statistics.completion_rate, 0) / categoryAchievements.length || 0)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cross-Impact:</span>
                            <span className="font-medium">
                              {categoryAchievements.filter(a => a.cross_impact_effects.teacher_student_boost).length} achievements
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Achievement Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Achievement</DialogTitle>
            <DialogDescription>
              Design a new achievement for the unified teacher-student ranking system
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Basic Information</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Achievement Title</Label>
                  <Input
                    value={achievementForm.title}
                    onChange={(e) => setAchievementForm({...achievementForm, title: e.target.value})}
                    placeholder="e.g., Teaching Excellence Master"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={achievementForm.category} onValueChange={(value) => setAchievementForm({...achievementForm, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={achievementForm.description}
                  onChange={(e) => setAchievementForm({...achievementForm, description: e.target.value})}
                  placeholder="Describe what users need to do to earn this achievement..."
                />
              </div>
            </div>

            <Separator />

            {/* Configuration */}
            <div className="space-y-4">
              <h4 className="font-medium">Achievement Configuration</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Rarity</Label>
                  <Select value={achievementForm.rarity} onValueChange={(value: any) => setAchievementForm({...achievementForm, rarity: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(rarityConfig).map(rarity => (
                        <SelectItem key={rarity} value={rarity} className="capitalize">{rarity}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>User Type</Label>
                  <Select value={achievementForm.user_type} onValueChange={(value: any) => setAchievementForm({...achievementForm, user_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">Teachers Only</SelectItem>
                      <SelectItem value="student">Students Only</SelectItem>
                      <SelectItem value="both">Both Teachers and Students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Criteria Type</Label>
                  <Select value={achievementForm.criteria_type} onValueChange={(value) => setAchievementForm({...achievementForm, criteria_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points_threshold">Points Threshold</SelectItem>
                      <SelectItem value="streak_days">Streak Days</SelectItem>
                      <SelectItem value="performance_tier">Performance Tier</SelectItem>
                      <SelectItem value="cross_impact_score">Cross-Impact Score</SelectItem>
                      <SelectItem value="composite">Composite Criteria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Criteria Value</Label>
                  <Input
                    type="number"
                    value={achievementForm.criteria_value}
                    onChange={(e) => setAchievementForm({...achievementForm, criteria_value: Number(e.target.value)})}
                    placeholder="e.g., 1000 for points threshold"
                  />
                </div>
                <div>
                  <Label>Badge Color</Label>
                  <Input
                    type="color"
                    value={achievementForm.badge_color}
                    onChange={(e) => setAchievementForm({...achievementForm, badge_color: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Rewards */}
            <div className="space-y-4">
              <h4 className="font-medium">Rewards</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Points Reward</Label>
                  <Input
                    type="number"
                    value={achievementForm.reward_points}
                    onChange={(e) => setAchievementForm({...achievementForm, reward_points: Number(e.target.value)})}
                    placeholder="Points to award"
                  />
                </div>
                <div>
                  <Label>Coins Reward</Label>
                  <Input
                    type="number"
                    value={achievementForm.reward_coins}
                    onChange={(e) => setAchievementForm({...achievementForm, reward_coins: Number(e.target.value)})}
                    placeholder="Coins to award"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Cross-Impact Effects */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Cross-Impact Effects</h4>
                <Switch
                  checked={achievementForm.cross_impact_enabled}
                  onCheckedChange={(checked) => setAchievementForm({...achievementForm, cross_impact_enabled: checked})}
                />
              </div>
              {achievementForm.cross_impact_enabled && (
                <div>
                  <Label>Teacher-Student Boost (%)</Label>
                  <Input
                    type="number"
                    value={achievementForm.teacher_student_boost}
                    onChange={(e) => setAchievementForm({...achievementForm, teacher_student_boost: Number(e.target.value)})}
                    placeholder="e.g., 15 for 15% boost"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAchievement}>
              Create Achievement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Achievement Templates</DialogTitle>
            <DialogDescription>
              Pre-built templates to quickly create common achievement types
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {achievementTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">{template.description}</div>
                    </div>
                    <Badge className={`capitalize ${
                      template.difficulty_level === 'beginner' ? 'bg-green-100 text-green-800' :
                      template.difficulty_level === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                      template.difficulty_level === 'advanced' ? 'bg-purple-100 text-purple-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {template.difficulty_level}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-2">
                      {template.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                    <span className="text-muted-foreground">{template.estimated_completion_time}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplatesDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Achievement Details Dialog */}
      {selectedAchievement && (
        <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" style={{ color: selectedAchievement.rewards.badge_color }} />
                {selectedAchievement.title}
              </DialogTitle>
              <DialogDescription>
                Achievement details and unlock criteria
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge className={rarityConfig[selectedAchievement.rarity].color}>
                  {selectedAchievement.rarity}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {selectedAchievement.user_type}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {selectedAchievement.category.replace('_', ' ')}
                </Badge>
              </div>

              <p className="text-gray-700">{selectedAchievement.description}</p>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Unlock Criteria</Label>
                  <div className="p-3 border rounded bg-gray-50">
                    <div className="text-sm">
                      <div>Type: {selectedAchievement.criteria.type.replace('_', ' ')}</div>
                      <div>Value: {selectedAchievement.criteria.value}</div>
                      {selectedAchievement.criteria.conditions.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-medium">Conditions:</div>
                          {selectedAchievement.criteria.conditions.map((condition, index) => (
                            <div key={index} className="text-xs text-muted-foreground">
                              {condition.metric} {condition.operator} {condition.value}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label>Rewards</Label>
                  <div className="p-3 border rounded bg-green-50">
                    <div className="text-sm">
                      <div>Points: +{selectedAchievement.rewards.points}</div>
                      <div>Coins: +{selectedAchievement.rewards.coins}</div>
                      {selectedAchievement.rewards.special_privileges && (
                        <div className="mt-2">
                          <div className="text-xs font-medium">Special Privileges:</div>
                          {selectedAchievement.rewards.special_privileges.map((privilege, index) => (
                            <div key={index} className="text-xs text-green-700">{privilege}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {(selectedAchievement.cross_impact_effects.teacher_student_boost || 
                selectedAchievement.cross_impact_effects.peer_influence_multiplier) && (
                <div>
                  <Label>Cross-Impact Effects</Label>
                  <div className="p-3 border rounded bg-orange-50">
                    <div className="text-sm space-y-1">
                      {selectedAchievement.cross_impact_effects.teacher_student_boost && (
                        <div>Teacher-Student Boost: +{selectedAchievement.cross_impact_effects.teacher_student_boost}%</div>
                      )}
                      {selectedAchievement.cross_impact_effects.peer_influence_multiplier && (
                        <div>Peer Influence: {selectedAchievement.cross_impact_effects.peer_influence_multiplier}x multiplier</div>
                      )}
                      {selectedAchievement.cross_impact_effects.organizational_recognition && (
                        <div>Organizational Recognition: Yes</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Statistics</Label>
                  <div className="space-y-2 text-sm">
                    <div>Total Unlocked: {selectedAchievement.statistics.total_unlocked}</div>
                    <div>Completion Rate: {selectedAchievement.statistics.completion_rate}%</div>
                    <div>Avg Unlock Time: {selectedAchievement.statistics.average_unlock_time} days</div>
                    <div>Difficulty: {selectedAchievement.statistics.difficulty_rating}/5</div>
                  </div>
                </div>
                
                <div>
                  <Label>Management</Label>
                  <div className="space-y-2 text-sm">
                    <div>Status: {selectedAchievement.status}</div>
                    <div>Created: {selectedAchievement.created_at.toLocaleDateString()}</div>
                    <div>Created by: {selectedAchievement.created_by}</div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedAchievement(null)}>
                Close
              </Button>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Achievement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}