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
import { Slider } from '@/components/ui/slider'
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
  Crown,
  Award,
  Medal,
  Gem,
  Sparkles,
  Users,
  TrendingUp,
  Plus,
  Edit,
  Eye,
  Settings,
  Filter,
  Search,
  BarChart3,
  PieChart,
  Activity,
  GraduationCap,
  BookOpen,
  Brain,
  Heart,
  Lightbulb,
  Rocket,
  Shield,
  Zap,
  Target,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Trash2,
  Copy
} from 'lucide-react'

interface AchievementCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  user_types: ('teacher' | 'student' | 'both')[]
  requirements: {
    minimum_level?: number
    prerequisite_categories?: string[]
    department_specific?: boolean
  }
  point_multipliers: {
    teacher: number
    student: number
  }
  cross_impact_eligible: boolean
  seasonal_variants: boolean
  difficulty_range: [number, number] // Min and max difficulty ratings
  estimated_completion_time: {
    min_days: number
    max_days: number
  }
  statistics: {
    total_achievements: number
    total_unlocked: number
    avg_completion_rate: number
    popularity_score: number
  }
  created_at: Date
  status: 'active' | 'deprecated' | 'beta'
}

interface RarityLevel {
  id: string
  name: string
  description: string
  tier: number
  color: string
  background_color: string
  icon: string
  point_multiplier: number
  coin_multiplier: number
  unlock_probability: number // Base probability of unlocking (0-1)
  special_effects: {
    celebration_duration: number // seconds
    visual_effects: string[]
    sound_effects: boolean
    announcement_scope: 'private' | 'peers' | 'department' | 'organization'
  }
  requirements: {
    minimum_user_level: number
    prerequisite_rarities?: string[]
    achievement_count_threshold?: number
  }
  privileges: string[]
  display_priority: number
  statistics: {
    total_achievements: number
    distribution_percentage: number
    avg_unlock_time: number
    user_retention_impact: number
  }
}

interface CategoryMetrics {
  category_id: string
  engagement_score: number
  completion_velocity: number
  user_satisfaction: number
  cross_impact_efficiency: number
  retention_correlation: number
  difficulty_progression: number[]
}

export function AchievementCategoriesRarity() {
  const [selectedTab, setSelectedTab] = useState('categories')
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false)
  const [showCreateRarityDialog, setShowCreateRarityDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | null>(null)
  const [selectedRarity, setSelectedRarity] = useState<RarityLevel | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'trophy',
    color: '#3B82F6',
    user_types: ['both'] as ('teacher' | 'student' | 'both')[],
    teacher_multiplier: 1.0,
    student_multiplier: 1.0,
    cross_impact_eligible: true,
    seasonal_variants: false,
    min_difficulty: 1,
    max_difficulty: 5,
    min_completion_days: 7,
    max_completion_days: 90
  })

  const [rarityForm, setRarityForm] = useState({
    name: '',
    description: '',
    tier: 1,
    color: '#6B7280',
    background_color: '#F3F4F6',
    icon: 'award',
    point_multiplier: 1.0,
    coin_multiplier: 1.0,
    unlock_probability: 0.8,
    celebration_duration: 3,
    announcement_scope: 'private' as RarityLevel['special_effects']['announcement_scope'],
    minimum_user_level: 1,
    achievement_threshold: 0
  })

  // Mock data
  const [categories] = useState<AchievementCategory[]>([
    {
      id: 'teaching_excellence',
      name: 'Teaching Excellence',
      description: 'Achievements focused on exceptional teaching performance, student engagement, and pedagogical innovation',
      icon: 'graduation-cap',
      color: '#3B82F6',
      user_types: ['teacher'],
      requirements: {
        minimum_level: 3,
        department_specific: false
      },
      point_multipliers: {
        teacher: 1.5,
        student: 1.0
      },
      cross_impact_eligible: true,
      seasonal_variants: true,
      difficulty_range: [2, 5],
      estimated_completion_time: {
        min_days: 30,
        max_days: 180
      },
      statistics: {
        total_achievements: 12,
        total_unlocked: 85,
        avg_completion_rate: 68.2,
        popularity_score: 8.7
      },
      created_at: new Date('2024-01-15'),
      status: 'active'
    },
    {
      id: 'academic_excellence',
      name: 'Academic Excellence',
      description: 'Student achievements recognizing outstanding academic performance and intellectual growth',
      icon: 'book-open',
      color: '#10B981',
      user_types: ['student'],
      requirements: {
        minimum_level: 1
      },
      point_multipliers: {
        teacher: 1.0,
        student: 1.3
      },
      cross_impact_eligible: true,
      seasonal_variants: false,
      difficulty_range: [1, 4],
      estimated_completion_time: {
        min_days: 14,
        max_days: 120
      },
      statistics: {
        total_achievements: 18,
        total_unlocked: 234,
        avg_completion_rate: 45.8,
        popularity_score: 9.2
      },
      created_at: new Date('2024-01-20'),
      status: 'active'
    },
    {
      id: 'collaboration',
      name: 'Collaboration & Teamwork',
      description: 'Cross-impact achievements recognizing positive teacher-student interactions and peer collaboration',
      icon: 'users',
      color: '#8B5CF6',
      user_types: ['both'],
      requirements: {
        minimum_level: 2,
        prerequisite_categories: ['teaching_excellence', 'academic_excellence']
      },
      point_multipliers: {
        teacher: 1.8,
        student: 1.6
      },
      cross_impact_eligible: true,
      seasonal_variants: true,
      difficulty_range: [3, 5],
      estimated_completion_time: {
        min_days: 45,
        max_days: 240
      },
      statistics: {
        total_achievements: 8,
        total_unlocked: 42,
        avg_completion_rate: 23.5,
        popularity_score: 8.9
      },
      created_at: new Date('2024-02-01'),
      status: 'active'
    },
    {
      id: 'innovation',
      name: 'Innovation & Creativity',
      description: 'Achievements rewarding creative problem-solving, innovative teaching methods, and original thinking',
      icon: 'lightbulb',
      color: '#F59E0B',
      user_types: ['both'],
      requirements: {
        minimum_level: 4
      },
      point_multipliers: {
        teacher: 2.0,
        student: 1.5
      },
      cross_impact_eligible: true,
      seasonal_variants: false,
      difficulty_range: [3, 5],
      estimated_completion_time: {
        min_days: 60,
        max_days: 300
      },
      statistics: {
        total_achievements: 6,
        total_unlocked: 18,
        avg_completion_rate: 12.3,
        popularity_score: 7.8
      },
      created_at: new Date('2024-02-10'),
      status: 'beta'
    }
  ])

  const [rarityLevels] = useState<RarityLevel[]>([
    {
      id: 'common',
      name: 'Common',
      description: 'Basic achievements available to most users with consistent effort',
      tier: 1,
      color: '#6B7280',
      background_color: '#F3F4F6',
      icon: 'award',
      point_multiplier: 1.0,
      coin_multiplier: 1.0,
      unlock_probability: 0.85,
      special_effects: {
        celebration_duration: 3,
        visual_effects: ['fade_in', 'gentle_glow'],
        sound_effects: false,
        announcement_scope: 'private'
      },
      requirements: {
        minimum_user_level: 1
      },
      privileges: ['basic_recognition'],
      display_priority: 1,
      statistics: {
        total_achievements: 25,
        distribution_percentage: 45.5,
        avg_unlock_time: 21,
        user_retention_impact: 0.15
      }
    },
    {
      id: 'uncommon',
      name: 'Uncommon',
      description: 'Achievements requiring moderate dedication and skill development',
      tier: 2,
      color: '#10B981',
      background_color: '#D1FAE5',
      icon: 'medal',
      point_multiplier: 1.25,
      coin_multiplier: 1.2,
      unlock_probability: 0.65,
      special_effects: {
        celebration_duration: 5,
        visual_effects: ['slide_up', 'sparkle_effect', 'color_burst'],
        sound_effects: true,
        announcement_scope: 'peers'
      },
      requirements: {
        minimum_user_level: 2,
        achievement_count_threshold: 3
      },
      privileges: ['peer_recognition', 'profile_badge'],
      display_priority: 2,
      statistics: {
        total_achievements: 18,
        distribution_percentage: 32.7,
        avg_unlock_time: 45,
        user_retention_impact: 0.28
      }
    },
    {
      id: 'rare',
      name: 'Rare',
      description: 'Challenging achievements for dedicated users showing exceptional performance',
      tier: 3,
      color: '#3B82F6',
      background_color: '#DBEAFE',
      icon: 'star',
      point_multiplier: 1.5,
      coin_multiplier: 1.5,
      unlock_probability: 0.35,
      special_effects: {
        celebration_duration: 8,
        visual_effects: ['dramatic_entrance', 'particle_system', 'color_wave', 'golden_frame'],
        sound_effects: true,
        announcement_scope: 'department'
      },
      requirements: {
        minimum_user_level: 4,
        prerequisite_rarities: ['uncommon'],
        achievement_count_threshold: 8
      },
      privileges: ['department_recognition', 'priority_support', 'mentor_eligibility'],
      display_priority: 3,
      statistics: {
        total_achievements: 12,
        distribution_percentage: 18.2,
        avg_unlock_time: 89,
        user_retention_impact: 0.45
      }
    },
    {
      id: 'epic',
      name: 'Epic',
      description: 'Elite achievements for outstanding individuals making significant organizational impact',
      tier: 4,
      color: '#8B5CF6',
      background_color: '#EDE9FE',
      icon: 'crown',
      point_multiplier: 2.0,
      coin_multiplier: 2.0,
      unlock_probability: 0.15,
      special_effects: {
        celebration_duration: 12,
        visual_effects: ['epic_entrance', 'lightning_effects', 'rainbow_burst', 'screen_shake', 'confetti'],
        sound_effects: true,
        announcement_scope: 'organization'
      },
      requirements: {
        minimum_user_level: 6,
        prerequisite_rarities: ['rare'],
        achievement_count_threshold: 15
      },
      privileges: ['organizational_recognition', 'leadership_opportunities', 'conference_speaking', 'special_projects'],
      display_priority: 4,
      statistics: {
        total_achievements: 5,
        distribution_percentage: 3.2,
        avg_unlock_time: 156,
        user_retention_impact: 0.72
      }
    },
    {
      id: 'legendary',
      name: 'Legendary',
      description: 'Mythical achievements for extraordinary individuals who redefine excellence',
      tier: 5,
      color: '#DC2626',
      background_color: '#FEE2E2',
      icon: 'gem',
      point_multiplier: 3.0,
      coin_multiplier: 3.0,
      unlock_probability: 0.05,
      special_effects: {
        celebration_duration: 20,
        visual_effects: ['legendary_portal', 'divine_light', 'cosmic_effects', 'reality_distortion', 'eternal_glow'],
        sound_effects: true,
        announcement_scope: 'organization'
      },
      requirements: {
        minimum_user_level: 8,
        prerequisite_rarities: ['epic'],
        achievement_count_threshold: 25
      },
      privileges: ['legendary_status', 'permanent_recognition', 'mentorship_program', 'curriculum_influence', 'legacy_projects'],
      display_priority: 5,
      statistics: {
        total_achievements: 2,
        distribution_percentage: 0.4,
        avg_unlock_time: 287,
        user_retention_impact: 0.95
      }
    }
  ])

  const [categoryMetrics] = useState<CategoryMetrics[]>([
    {
      category_id: 'teaching_excellence',
      engagement_score: 8.7,
      completion_velocity: 0.65,
      user_satisfaction: 9.1,
      cross_impact_efficiency: 0.82,
      retention_correlation: 0.78,
      difficulty_progression: [2.1, 2.8, 3.5, 4.2, 4.9]
    },
    {
      category_id: 'academic_excellence',
      engagement_score: 9.2,
      completion_velocity: 0.78,
      user_satisfaction: 8.9,
      cross_impact_efficiency: 0.75,
      retention_correlation: 0.85,
      difficulty_progression: [1.2, 1.9, 2.6, 3.3, 4.0]
    },
    {
      category_id: 'collaboration',
      engagement_score: 8.9,
      completion_velocity: 0.42,
      user_satisfaction: 9.4,
      cross_impact_efficiency: 0.94,
      retention_correlation: 0.91,
      difficulty_progression: [3.1, 3.6, 4.2, 4.7, 5.0]
    },
    {
      category_id: 'innovation',
      engagement_score: 7.8,
      completion_velocity: 0.31,
      user_satisfaction: 8.7,
      cross_impact_efficiency: 0.88,
      retention_correlation: 0.73,
      difficulty_progression: [3.5, 4.0, 4.4, 4.8, 5.0]
    }
  ])

  const iconOptions = [
    { id: 'trophy', name: 'Trophy', icon: Trophy },
    { id: 'star', name: 'Star', icon: Star },
    { id: 'crown', name: 'Crown', icon: Crown },
    { id: 'award', name: 'Award', icon: Award },
    { id: 'medal', name: 'Medal', icon: Medal },
    { id: 'gem', name: 'Gem', icon: Gem },
    { id: 'graduation-cap', name: 'Graduation Cap', icon: GraduationCap },
    { id: 'book-open', name: 'Book', icon: BookOpen },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'lightbulb', name: 'Lightbulb', icon: Lightbulb },
    { id: 'rocket', name: 'Rocket', icon: Rocket },
    { id: 'shield', name: 'Shield', icon: Shield },
    { id: 'heart', name: 'Heart', icon: Heart },
    { id: 'brain', name: 'Brain', icon: Brain },
    { id: 'target', name: 'Target', icon: Target },
    { id: 'zap', name: 'Lightning', icon: Zap }
  ]

  const colorOptions = [
    { id: '#3B82F6', name: 'Blue' },
    { id: '#10B981', name: 'Green' },
    { id: '#8B5CF6', name: 'Purple' },
    { id: '#F59E0B', name: 'Yellow' },
    { id: '#DC2626', name: 'Red' },
    { id: '#6B7280', name: 'Gray' },
    { id: '#EC4899', name: 'Pink' },
    { id: '#14B8A6', name: 'Teal' }
  ]

  const filteredCategories = categories.filter(category =>
    searchQuery === '' || 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredRarities = rarityLevels.filter(rarity =>
    searchQuery === '' || 
    rarity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rarity.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getIconComponent = (iconId: string) => {
    const iconOption = iconOptions.find(opt => opt.id === iconId)
    return iconOption ? iconOption.icon : Trophy
  }

  const getRarityIcon = (iconId: string) => {
    const iconMap: Record<string, any> = {
      award: Award,
      medal: Medal,
      star: Star,
      crown: Crown,
      gem: Gem,
      trophy: Trophy
    }
    return iconMap[iconId] || Award
  }

  const handleCreateCategory = () => {
    console.log('Creating category:', categoryForm)
    setShowCreateCategoryDialog(false)
    setCategoryForm({
      name: '',
      description: '',
      icon: 'trophy',
      color: '#3B82F6',
      user_types: ['both'],
      teacher_multiplier: 1.0,
      student_multiplier: 1.0,
      cross_impact_eligible: true,
      seasonal_variants: false,
      min_difficulty: 1,
      max_difficulty: 5,
      min_completion_days: 7,
      max_completion_days: 90
    })
  }

  const handleCreateRarity = () => {
    console.log('Creating rarity:', rarityForm)
    setShowCreateRarityDialog(false)
    setRarityForm({
      name: '',
      description: '',
      tier: 1,
      color: '#6B7280',
      background_color: '#F3F4F6',
      icon: 'award',
      point_multiplier: 1.0,
      coin_multiplier: 1.0,
      unlock_probability: 0.8,
      celebration_duration: 3,
      announcement_scope: 'private',
      minimum_user_level: 1,
      achievement_threshold: 0
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
                Achievement Categories & Rarity System
              </CardTitle>
              <CardDescription>
                Comprehensive management of achievement organization and progression tiers
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="rarities">Rarity Levels</TabsTrigger>
              <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
              <TabsTrigger value="distribution">Distribution Analysis</TabsTrigger>
            </TabsList>

            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-4 items-center flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
                <Button onClick={() => setShowCreateCategoryDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Category
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCategories.map((category) => {
                  const IconComponent = getIconComponent(category.icon)
                  const metrics = categoryMetrics.find(m => m.category_id === category.id)
                  
                  return (
                    <Card key={category.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => setSelectedCategory(category)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                                 style={{ backgroundColor: category.color + '20' }}>
                              <IconComponent className="h-6 w-6" style={{ color: category.color }} />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{category.name}</CardTitle>
                              <Badge className={`${
                                category.status === 'active' ? 'bg-green-100 text-green-800' :
                                category.status === 'beta' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {category.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 mb-4">
                          {category.description}
                        </p>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">User Types:</span>
                            <div className="flex gap-1">
                              {category.user_types.map(type => (
                                <Badge key={type} variant="outline" className="text-xs capitalize">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Achievements:</span>
                            <span className="font-medium">{category.statistics.total_achievements}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Completion Rate:</span>
                            <span className="font-medium">{category.statistics.avg_completion_rate}%</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Popularity:</span>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{category.statistics.popularity_score}/10</span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-3 w-3 ${
                                      i < category.statistics.popularity_score / 2 
                                        ? 'text-yellow-400 fill-current' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          {category.cross_impact_eligible && (
                            <div className="flex items-center gap-2 p-2 bg-orange-50 rounded text-sm">
                              <Zap className="h-4 w-4 text-orange-600" />
                              <span className="text-orange-700">Cross-Impact Eligible</span>
                            </div>
                          )}

                          {metrics && (
                            <div className="pt-2 border-t">
                              <div className="text-xs text-muted-foreground mb-2">Performance Metrics</div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>Engagement: {metrics.engagement_score}/10</div>
                                <div>Velocity: {Math.round(metrics.completion_velocity * 100)}%</div>
                                <div>Satisfaction: {metrics.user_satisfaction}/10</div>
                                <div>Retention: {Math.round(metrics.retention_correlation * 100)}%</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            {/* Rarity Levels Tab */}
            <TabsContent value="rarities" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-4 items-center flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search rarities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
                <Button onClick={() => setShowCreateRarityDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rarity Level
                </Button>
              </div>

              <div className="space-y-4">
                {filteredRarities.sort((a, b) => a.tier - b.tier).map((rarity) => {
                  const IconComponent = getRarityIcon(rarity.icon)
                  
                  return (
                    <Card key={rarity.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => setSelectedRarity(rarity)}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl flex items-center justify-center"
                                 style={{ backgroundColor: rarity.background_color, border: `2px solid ${rarity.color}` }}>
                              <IconComponent className="h-8 w-8" style={{ color: rarity.color }} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-bold" style={{ color: rarity.color }}>
                                  {rarity.name}
                                </h3>
                                <Badge className="text-xs">Tier {rarity.tier}</Badge>
                              </div>
                              <p className="text-gray-700 max-w-md">{rarity.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold" style={{ color: rarity.color }}>
                              {rarity.point_multiplier}x
                            </div>
                            <div className="text-sm text-muted-foreground">Point Multiplier</div>
                          </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-4">
                          <div>
                            <Label className="text-sm font-medium">Distribution</Label>
                            <div className="mt-2 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Achievements:</span>
                                <span className="font-medium">{rarity.statistics.total_achievements}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Distribution:</span>
                                <span className="font-medium">{rarity.statistics.distribution_percentage}%</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Unlock Rate:</span>
                                <span className="font-medium">{Math.round(rarity.unlock_probability * 100)}%</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Requirements</Label>
                            <div className="mt-2 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Min Level:</span>
                                <span className="font-medium">{rarity.requirements.minimum_user_level}</span>
                              </div>
                              {rarity.requirements.achievement_count_threshold && (
                                <div className="flex justify-between text-sm">
                                  <span>Achievement Count:</span>
                                  <span className="font-medium">{rarity.requirements.achievement_count_threshold}+</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm">
                                <span>Avg Unlock Time:</span>
                                <span className="font-medium">{rarity.statistics.avg_unlock_time}d</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Rewards & Effects</Label>
                            <div className="mt-2 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Coin Multiplier:</span>
                                <span className="font-medium">{rarity.coin_multiplier}x</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Celebration:</span>
                                <span className="font-medium">{rarity.special_effects.celebration_duration}s</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Announcement:</span>
                                <span className="font-medium capitalize">{rarity.special_effects.announcement_scope}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Impact</Label>
                            <div className="mt-2 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Retention Impact:</span>
                                <span className="font-medium">{Math.round(rarity.statistics.user_retention_impact * 100)}%</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Special Effects:</span>
                                <span className="font-medium">{rarity.special_effects.visual_effects.length}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Privileges:</span>
                                <span className="font-medium">{rarity.privileges.length}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {rarity.privileges.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <Label className="text-sm font-medium">Special Privileges</Label>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {rarity.privileges.map((privilege, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {privilege.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            {/* Performance Metrics Tab */}
            <TabsContent value="metrics" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Category Performance Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {categoryMetrics.map((metrics) => {
                        const category = categories.find(c => c.id === metrics.category_id)
                        if (!category) return null
                        
                        return (
                          <div key={metrics.category_id} className="p-4 border rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 rounded flex items-center justify-center"
                                   style={{ backgroundColor: category.color + '20' }}>
                                <Trophy className="h-4 w-4" style={{ color: category.color }} />
                              </div>
                              <div>
                                <div className="font-medium">{category.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {category.statistics.total_achievements} achievements
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid gap-3 md:grid-cols-2 text-sm">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Engagement:</span>
                                  <span className="font-medium">{metrics.engagement_score}/10</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Completion Velocity:</span>
                                  <span className="font-medium">{Math.round(metrics.completion_velocity * 100)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>User Satisfaction:</span>
                                  <span className="font-medium">{metrics.user_satisfaction}/10</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Cross-Impact Efficiency:</span>
                                  <span className="font-medium">{Math.round(metrics.cross_impact_efficiency * 100)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Retention Correlation:</span>
                                  <span className="font-medium">{Math.round(metrics.retention_correlation * 100)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Avg Difficulty:</span>
                                  <span className="font-medium">
                                    {(metrics.difficulty_progression.reduce((a, b) => a + b, 0) / metrics.difficulty_progression.length).toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Rarity Distribution Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {rarityLevels.map((rarity) => {
                        return (
                          <div key={rarity.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded flex items-center justify-center"
                                     style={{ backgroundColor: rarity.background_color, border: `1px solid ${rarity.color}` }}>
                                  {React.createElement(getRarityIcon(rarity.icon), { 
                                    className: "h-4 w-4", 
                                    style: { color: rarity.color } 
                                  })}
                                </div>
                                <div>
                                  <div className="font-medium">{rarity.name}</div>
                                  <div className="text-sm text-muted-foreground">Tier {rarity.tier}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold" style={{ color: rarity.color }}>
                                  {rarity.statistics.distribution_percentage}%
                                </div>
                                <div className="text-xs text-muted-foreground">of achievements</div>
                              </div>
                            </div>
                            
                            <div className="grid gap-2 md:grid-cols-3 text-sm">
                              <div className="text-center p-2 bg-gray-50 rounded">
                                <div className="font-medium">{Math.round(rarity.unlock_probability * 100)}%</div>
                                <div className="text-xs text-muted-foreground">Unlock Rate</div>
                              </div>
                              <div className="text-center p-2 bg-blue-50 rounded">
                                <div className="font-medium">{rarity.statistics.avg_unlock_time}d</div>
                                <div className="text-xs text-muted-foreground">Avg Time</div>
                              </div>
                              <div className="text-center p-2 bg-green-50 rounded">
                                <div className="font-medium">{Math.round(rarity.statistics.user_retention_impact * 100)}%</div>
                                <div className="text-xs text-muted-foreground">Retention Impact</div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Distribution Analysis Tab */}
            <TabsContent value="distribution" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Achievement Distribution by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {categories.map((category) => {
                        const totalAchievements = categories.reduce((sum, c) => sum + c.statistics.total_achievements, 0)
                        const percentage = Math.round((category.statistics.total_achievements / totalAchievements) * 100)
                        
                        return (
                          <div key={category.id} className="p-3 border rounded">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: category.color }} />
                                <span className="font-medium">{category.name}</span>
                              </div>
                              <span className="text-sm font-medium">{percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${percentage}%`, 
                                  backgroundColor: category.color 
                                }}
                              />
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                              <span>{category.statistics.total_achievements} achievements</span>
                              <span>{category.statistics.total_unlocked} unlocked</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Rarity Level Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {rarityLevels.sort((a, b) => b.tier - a.tier).map((rarity) => {
                        return (
                          <div key={rarity.id} className="p-3 border rounded">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: rarity.color }} />
                                <span className="font-medium">{rarity.name}</span>
                                <Badge variant="outline" className="text-xs">Tier {rarity.tier}</Badge>
                              </div>
                              <span className="text-sm font-medium">{rarity.statistics.distribution_percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${rarity.statistics.distribution_percentage}%`, 
                                  backgroundColor: rarity.color 
                                }}
                              />
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                              <span>{rarity.statistics.total_achievements} achievements</span>
                              <span>{rarity.point_multiplier}x multiplier</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cross-Category Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Cross-Category Rarity Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Category</th>
                          {rarityLevels.map(rarity => (
                            <th key={rarity.id} className="text-center p-2" style={{ color: rarity.color }}>
                              {rarity.name}
                            </th>
                          ))}
                          <th className="text-center p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((category) => (
                          <tr key={category.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{category.name}</td>
                            {rarityLevels.map(rarity => {
                              // Mock distribution for demo
                              const count = Math.floor(Math.random() * 5) + 1
                              return (
                                <td key={rarity.id} className="text-center p-2">
                                  {count}
                                </td>
                              )
                            })}
                            <td className="text-center p-2 font-medium">
                              {category.statistics.total_achievements}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Category Dialog */}
      <Dialog open={showCreateCategoryDialog} onOpenChange={setShowCreateCategoryDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Achievement Category</DialogTitle>
            <DialogDescription>
              Define a new category for organizing achievements
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Category Name</Label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  placeholder="e.g., Leadership Excellence"
                />
              </div>
              <div>
                <Label>Color</Label>
                <Select value={categoryForm.color} onValueChange={(value) => setCategoryForm({...categoryForm, color: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map(color => (
                      <SelectItem key={color.id} value={color.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: color.id }} />
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                placeholder="Describe the purpose and focus of this achievement category..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Icon</Label>
                <Select value={categoryForm.icon} onValueChange={(value) => setCategoryForm({...categoryForm, icon: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(icon => {
                      const IconComponent = icon.icon
                      return (
                        <SelectItem key={icon.id} value={icon.id}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {icon.name}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>User Types</Label>
                <Select value={categoryForm.user_types[0]} onValueChange={(value: any) => setCategoryForm({...categoryForm, user_types: [value]})}>
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
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Point Multipliers</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Teacher Multiplier</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={categoryForm.teacher_multiplier}
                    onChange={(e) => setCategoryForm({...categoryForm, teacher_multiplier: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Student Multiplier</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={categoryForm.student_multiplier}
                    onChange={(e) => setCategoryForm({...categoryForm, student_multiplier: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Configuration</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <Label>Cross-Impact Eligible</Label>
                  <Switch
                    checked={categoryForm.cross_impact_eligible}
                    onCheckedChange={(checked) => setCategoryForm({...categoryForm, cross_impact_eligible: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Seasonal Variants</Label>
                  <Switch
                    checked={categoryForm.seasonal_variants}
                    onCheckedChange={(checked) => setCategoryForm({...categoryForm, seasonal_variants: checked})}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCategoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory}>
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Rarity Dialog */}
      <Dialog open={showCreateRarityDialog} onOpenChange={setShowCreateRarityDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Rarity Level</DialogTitle>
            <DialogDescription>
              Define a new rarity tier for achievement progression
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Rarity Name</Label>
                <Input
                  value={rarityForm.name}
                  onChange={(e) => setRarityForm({...rarityForm, name: e.target.value})}
                  placeholder="e.g., Mythic"
                />
              </div>
              <div>
                <Label>Tier Level</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={rarityForm.tier}
                  onChange={(e) => setRarityForm({...rarityForm, tier: Number(e.target.value)})}
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={rarityForm.description}
                onChange={(e) => setRarityForm({...rarityForm, description: e.target.value})}
                placeholder="Describe the significance and requirements of this rarity level..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Primary Color</Label>
                <Input
                  type="color"
                  value={rarityForm.color}
                  onChange={(e) => setRarityForm({...rarityForm, color: e.target.value})}
                />
              </div>
              <div>
                <Label>Background Color</Label>
                <Input
                  type="color"
                  value={rarityForm.background_color}
                  onChange={(e) => setRarityForm({...rarityForm, background_color: e.target.value})}
                />
              </div>
              <div>
                <Label>Icon</Label>
                <Select value={rarityForm.icon} onValueChange={(value) => setRarityForm({...rarityForm, icon: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="award">Award</SelectItem>
                    <SelectItem value="medal">Medal</SelectItem>
                    <SelectItem value="star">Star</SelectItem>
                    <SelectItem value="crown">Crown</SelectItem>
                    <SelectItem value="gem">Gem</SelectItem>
                    <SelectItem value="trophy">Trophy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Multipliers & Effects</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Point Multiplier</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={rarityForm.point_multiplier}
                    onChange={(e) => setRarityForm({...rarityForm, point_multiplier: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Coin Multiplier</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={rarityForm.coin_multiplier}
                    onChange={(e) => setRarityForm({...rarityForm, coin_multiplier: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Unlock Probability</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[rarityForm.unlock_probability]}
                      onValueChange={(value) => setRarityForm({...rarityForm, unlock_probability: value[0]})}
                      max={1}
                      min={0}
                      step={0.01}
                    />
                    <div className="text-sm text-muted-foreground text-center">
                      {Math.round(rarityForm.unlock_probability * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Celebration Effects</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Celebration Duration (seconds)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={rarityForm.celebration_duration}
                    onChange={(e) => setRarityForm({...rarityForm, celebration_duration: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Announcement Scope</Label>
                  <Select value={rarityForm.announcement_scope} onValueChange={(value: any) => setRarityForm({...rarityForm, announcement_scope: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="peers">Peers Only</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="organization">Organization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Requirements</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Minimum User Level</Label>
                  <Input
                    type="number"
                    min="1"
                    value={rarityForm.minimum_user_level}
                    onChange={(e) => setRarityForm({...rarityForm, minimum_user_level: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Achievement Count Threshold</Label>
                  <Input
                    type="number"
                    min="0"
                    value={rarityForm.achievement_threshold}
                    onChange={(e) => setRarityForm({...rarityForm, achievement_threshold: Number(e.target.value)})}
                    placeholder="0 = no threshold"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateRarityDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRarity}>
              Create Rarity Level
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Details Dialog */}
      {selectedCategory && (
        <Dialog open={!!selectedCategory} onOpenChange={() => setSelectedCategory(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {React.createElement(getIconComponent(selectedCategory.icon), { 
                  className: "h-5 w-5", 
                  style: { color: selectedCategory.color } 
                })}
                {selectedCategory.name}
              </DialogTitle>
              <DialogDescription>
                Category configuration and performance metrics
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-gray-700">{selectedCategory.description}</p>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Configuration</Label>
                  <div className="space-y-2 text-sm">
                    <div>User Types: {selectedCategory.user_types.join(', ')}</div>
                    <div>Teacher Multiplier: {selectedCategory.point_multipliers.teacher}x</div>
                    <div>Student Multiplier: {selectedCategory.point_multipliers.student}x</div>
                    <div>Cross-Impact: {selectedCategory.cross_impact_eligible ? 'Yes' : 'No'}</div>
                    <div>Seasonal Variants: {selectedCategory.seasonal_variants ? 'Yes' : 'No'}</div>
                  </div>
                </div>
                
                <div>
                  <Label>Statistics</Label>
                  <div className="space-y-2 text-sm">
                    <div>Total Achievements: {selectedCategory.statistics.total_achievements}</div>
                    <div>Total Unlocked: {selectedCategory.statistics.total_unlocked}</div>
                    <div>Completion Rate: {selectedCategory.statistics.avg_completion_rate}%</div>
                    <div>Popularity Score: {selectedCategory.statistics.popularity_score}/10</div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Requirements</Label>
                <div className="p-3 border rounded bg-gray-50">
                  <div className="text-sm space-y-1">
                    {selectedCategory.requirements.minimum_level && (
                      <div>Minimum Level: {selectedCategory.requirements.minimum_level}</div>
                    )}
                    {selectedCategory.requirements.prerequisite_categories && (
                      <div>Prerequisites: {selectedCategory.requirements.prerequisite_categories.join(', ')}</div>
                    )}
                    {selectedCategory.requirements.department_specific && (
                      <div>Department Specific: Yes</div>
                    )}
                    <div>Difficulty Range: {selectedCategory.difficulty_range[0]} - {selectedCategory.difficulty_range[1]}</div>
                    <div>
                      Completion Time: {selectedCategory.estimated_completion_time.min_days} - {selectedCategory.estimated_completion_time.max_days} days
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                Close
              </Button>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Rarity Details Dialog */}
      {selectedRarity && (
        <Dialog open={!!selectedRarity} onOpenChange={() => setSelectedRarity(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ color: selectedRarity.color }}>
                {React.createElement(getRarityIcon(selectedRarity.icon), { 
                  className: "h-5 w-5", 
                  style: { color: selectedRarity.color } 
                })}
                {selectedRarity.name}
              </DialogTitle>
              <DialogDescription>
                Rarity level configuration and impact analysis
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-gray-700">{selectedRarity.description}</p>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Multipliers & Effects</Label>
                  <div className="space-y-2 text-sm">
                    <div>Tier: {selectedRarity.tier}</div>
                    <div>Point Multiplier: {selectedRarity.point_multiplier}x</div>
                    <div>Coin Multiplier: {selectedRarity.coin_multiplier}x</div>
                    <div>Unlock Probability: {Math.round(selectedRarity.unlock_probability * 100)}%</div>
                    <div>Celebration: {selectedRarity.special_effects.celebration_duration}s</div>
                  </div>
                </div>
                
                <div>
                  <Label>Statistics</Label>
                  <div className="space-y-2 text-sm">
                    <div>Total Achievements: {selectedRarity.statistics.total_achievements}</div>
                    <div>Distribution: {selectedRarity.statistics.distribution_percentage}%</div>
                    <div>Avg Unlock Time: {selectedRarity.statistics.avg_unlock_time} days</div>
                    <div>Retention Impact: {Math.round(selectedRarity.statistics.user_retention_impact * 100)}%</div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Requirements</Label>
                <div className="p-3 border rounded bg-gray-50">
                  <div className="text-sm space-y-1">
                    <div>Minimum User Level: {selectedRarity.requirements.minimum_user_level}</div>
                    {selectedRarity.requirements.achievement_count_threshold && (
                      <div>Achievement Threshold: {selectedRarity.requirements.achievement_count_threshold}+</div>
                    )}
                    {selectedRarity.requirements.prerequisite_rarities && (
                      <div>Prerequisites: {selectedRarity.requirements.prerequisite_rarities.join(', ')}</div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label>Special Effects</Label>
                <div className="p-3 border rounded bg-blue-50">
                  <div className="text-sm space-y-1">
                    <div>Visual Effects: {selectedRarity.special_effects.visual_effects.join(', ')}</div>
                    <div>Sound Effects: {selectedRarity.special_effects.sound_effects ? 'Yes' : 'No'}</div>
                    <div>Announcement Scope: {selectedRarity.special_effects.announcement_scope}</div>
                  </div>
                </div>
              </div>

              {selectedRarity.privileges.length > 0 && (
                <div>
                  <Label>Special Privileges</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedRarity.privileges.map((privilege, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {privilege.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRarity(null)}>
                Close
              </Button>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Rarity Level
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}