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
import { Progress } from '@/components/ui/progress'
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
  Zap,
  Users,
  TrendingUp,
  Target,
  Award,
  Star,
  Crown,
  Gem,
  Heart,
  Brain,
  Lightbulb,
  Rocket,
  Shield,
  Plus,
  Edit,
  Eye,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Network,
  Link,
  Globe,
  Layers,
  GitBranch,
  Workflow,
  Gauge,
  Compass,
  Crosshair
} from 'lucide-react'

interface CrossImpactAchievement {
  id: string
  title: string
  description: string
  type: 'bidirectional' | 'teacher_to_student' | 'student_to_teacher' | 'collaborative' | 'ecosystem'
  trigger_conditions: {
    teacher_criteria: {
      performance_threshold?: number
      point_range?: [number, number]
      level_requirement?: number
      category_achievements?: string[]
      consecutive_periods?: number
    }
    student_criteria: {
      academic_threshold?: number
      engagement_level?: number
      improvement_rate?: number
      collaboration_score?: number
      peer_influence?: number
    }
    correlation_requirements: {
      minimum_correlation: number
      confidence_level: number
      sample_size: number
      time_window_days: number
    }
    group_dynamics: {
      minimum_group_size?: number
      diversity_score?: number
      collective_improvement?: number
    }
  }
  impact_calculations: {
    teacher_multiplier: number
    student_multiplier: number
    synergy_bonus: number
    cascade_effect: number
    organizational_boost: number
  }
  rewards: {
    teacher_points: number
    student_points: number
    shared_rewards: {
      team_coins: number
      special_privileges: string[]
      recognition_level: 'department' | 'organization' | 'external'
    }
    ecosystem_benefits: {
      department_boost: number
      mentorship_opportunities: boolean
      resource_allocation_priority: boolean
    }
  }
  measurement_metrics: {
    correlation_strength: number
    impact_radius: number
    sustainability_score: number
    peer_adoption_rate: number
    long_term_effectiveness: number
  }
  unlock_history: Array<{
    teacher_id: string
    student_ids: string[]
    unlock_date: Date
    correlation_score: number
    impact_measured: number
    follow_up_effects: string[]
  }>
  status: 'active' | 'monitoring' | 'experimental' | 'graduated'
  difficulty_tier: 'collaborative' | 'advanced' | 'expert' | 'legendary'
  created_at: Date
}

interface CorrelationPair {
  id: string
  teacher_id: string
  teacher_name: string
  student_id: string
  student_name: string
  correlation_coefficient: number
  confidence_interval: [number, number]
  statistical_significance: number
  measurement_period: {
    start_date: Date
    end_date: Date
    data_points: number
  }
  impact_evidence: {
    teacher_performance_change: number
    student_outcome_change: number
    cross_metrics: {
      engagement_correlation: number
      satisfaction_correlation: number
      achievement_correlation: number
    }
  }
  trending: 'improving' | 'stable' | 'declining'
  prediction_confidence: number
  intervention_recommendations: string[]
}

interface EcosystemMap {
  department_id: string
  network_nodes: Array<{
    user_id: string
    user_type: 'teacher' | 'student'
    influence_score: number
    connection_strength: number
    achievement_catalyst: boolean
  }>
  connection_matrix: number[][]
  influence_flows: Array<{
    from_user: string
    to_user: string
    impact_strength: number
    achievement_pathway: string[]
  }>
  collective_achievements: Array<{
    achievement_id: string
    participants: string[]
    synergy_score: number
    ecosystem_boost: number
  }>
  health_metrics: {
    collaboration_density: number
    knowledge_flow_rate: number
    achievement_propagation: number
    organizational_resilience: number
  }
}

interface CrossImpactAnalytics {
  total_cross_achievements: number
  active_correlations: number
  ecosystem_health_score: number
  collective_impact_multiplier: number
  trending_patterns: {
    strengthening_pairs: number
    emerging_collaborations: number
    high_impact_teachers: number
    catalyst_students: number
  }
  prediction_insights: {
    next_likely_achievements: Array<{
      achievement_id: string
      probability: number
      estimated_timeline: number
      key_participants: string[]
    }>
    risk_indicators: Array<{
      type: string
      severity: 'low' | 'medium' | 'high'
      affected_pairs: number
      mitigation_strategies: string[]
    }>
  }
}

export function CrossImpactAchievementSystem() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedAchievement, setSelectedAchievement] = useState<CrossImpactAchievement | null>(null)
  const [selectedPair, setSelectedPair] = useState<CorrelationPair | null>(null)
  const [filterType, setFilterType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Mock data
  const [crossImpactAchievements] = useState<CrossImpactAchievement[]>([
    {
      id: 'cia1',
      title: 'Synergistic Excellence Partnership',
      description: 'A bidirectional achievement recognizing exceptional teacher-student performance correlation that benefits both parties',
      type: 'bidirectional',
      trigger_conditions: {
        teacher_criteria: {
          performance_threshold: 85,
          consecutive_periods: 3,
          category_achievements: ['teaching_excellence']
        },
        student_criteria: {
          academic_threshold: 80,
          engagement_level: 8.5,
          improvement_rate: 15
        },
        correlation_requirements: {
          minimum_correlation: 0.75,
          confidence_level: 0.95,
          sample_size: 30,
          time_window_days: 90
        },
        group_dynamics: {
          minimum_group_size: 5,
          collective_improvement: 20
        }
      },
      impact_calculations: {
        teacher_multiplier: 1.8,
        student_multiplier: 1.6,
        synergy_bonus: 0.5,
        cascade_effect: 0.3,
        organizational_boost: 0.2
      },
      rewards: {
        teacher_points: 750,
        student_points: 500,
        shared_rewards: {
          team_coins: 200,
          special_privileges: ['priority_mentorship', 'conference_presentation', 'curriculum_input'],
          recognition_level: 'organization'
        },
        ecosystem_benefits: {
          department_boost: 15,
          mentorship_opportunities: true,
          resource_allocation_priority: true
        }
      },
      measurement_metrics: {
        correlation_strength: 0.82,
        impact_radius: 8.5,
        sustainability_score: 0.78,
        peer_adoption_rate: 0.45,
        long_term_effectiveness: 0.91
      },
      unlock_history: [
        {
          teacher_id: 't1',
          student_ids: ['s1', 's3', 's7'],
          unlock_date: new Date('2024-03-10'),
          correlation_score: 0.84,
          impact_measured: 92,
          follow_up_effects: ['peer_mentorship_increase', 'department_engagement_boost']
        }
      ],
      status: 'active',
      difficulty_tier: 'expert',
      created_at: new Date('2024-02-01')
    },
    {
      id: 'cia2',
      title: 'Catalyst Teacher Impact',
      description: 'Recognition for teachers whose performance improvements create measurable positive effects on multiple students',
      type: 'teacher_to_student',
      trigger_conditions: {
        teacher_criteria: {
          performance_threshold: 90,
          point_range: [1000, 2000],
          consecutive_periods: 2
        },
        student_criteria: {
          improvement_rate: 25,
          engagement_level: 7.0
        },
        correlation_requirements: {
          minimum_correlation: 0.65,
          confidence_level: 0.90,
          sample_size: 20,
          time_window_days: 60
        },
        group_dynamics: {
          minimum_group_size: 8,
          collective_improvement: 30
        }
      },
      impact_calculations: {
        teacher_multiplier: 2.2,
        student_multiplier: 1.4,
        synergy_bonus: 0.4,
        cascade_effect: 0.6,
        organizational_boost: 0.25
      },
      rewards: {
        teacher_points: 1000,
        student_points: 300,
        shared_rewards: {
          team_coins: 150,
          special_privileges: ['teaching_innovation_award', 'student_success_recognition'],
          recognition_level: 'department'
        },
        ecosystem_benefits: {
          department_boost: 20,
          mentorship_opportunities: true,
          resource_allocation_priority: false
        }
      },
      measurement_metrics: {
        correlation_strength: 0.71,
        impact_radius: 12.3,
        sustainability_score: 0.85,
        peer_adoption_rate: 0.38,
        long_term_effectiveness: 0.88
      },
      unlock_history: [
        {
          teacher_id: 't2',
          student_ids: ['s2', 's4', 's6', 's8', 's9'],
          unlock_date: new Date('2024-03-05'),
          correlation_score: 0.73,
          impact_measured: 87,
          follow_up_effects: ['teaching_method_adoption', 'student_confidence_increase']
        }
      ],
      status: 'active',
      difficulty_tier: 'advanced',
      created_at: new Date('2024-02-10')
    },
    {
      id: 'cia3',
      title: 'Student Leadership Ripple Effect',
      description: 'Achievement for students whose academic improvements inspire and positively impact teacher motivation and peer performance',
      type: 'student_to_teacher',
      trigger_conditions: {
        teacher_criteria: {
          performance_threshold: 80
        },
        student_criteria: {
          academic_threshold: 85,
          improvement_rate: 35,
          peer_influence: 0.7,
          collaboration_score: 90
        },
        correlation_requirements: {
          minimum_correlation: 0.60,
          confidence_level: 0.85,
          sample_size: 15,
          time_window_days: 45
        },
        group_dynamics: {
          minimum_group_size: 4,
          diversity_score: 0.8
        }
      },
      impact_calculations: {
        teacher_multiplier: 1.5,
        student_multiplier: 2.0,
        synergy_bonus: 0.3,
        cascade_effect: 0.4,
        organizational_boost: 0.15
      },
      rewards: {
        teacher_points: 400,
        student_points: 800,
        shared_rewards: {
          team_coins: 120,
          special_privileges: ['peer_leadership_badge', 'teacher_inspiration_award'],
          recognition_level: 'department'
        },
        ecosystem_benefits: {
          department_boost: 12,
          mentorship_opportunities: true,
          resource_allocation_priority: false
        }
      },
      measurement_metrics: {
        correlation_strength: 0.68,
        impact_radius: 6.8,
        sustainability_score: 0.72,
        peer_adoption_rate: 0.55,
        long_term_effectiveness: 0.79
      },
      unlock_history: [],
      status: 'monitoring',
      difficulty_tier: 'advanced',
      created_at: new Date('2024-02-15')
    },
    {
      id: 'cia4',
      title: 'Ecosystem Transformation Network',
      description: 'Legendary achievement for creating self-sustaining positive feedback loops across multiple teacher-student relationships',
      type: 'ecosystem',
      trigger_conditions: {
        teacher_criteria: {
          performance_threshold: 95,
          point_range: [2000, 5000],
          consecutive_periods: 6
        },
        student_criteria: {
          academic_threshold: 88,
          engagement_level: 9.0,
          improvement_rate: 40,
          peer_influence: 0.8
        },
        correlation_requirements: {
          minimum_correlation: 0.85,
          confidence_level: 0.99,
          sample_size: 50,
          time_window_days: 180
        },
        group_dynamics: {
          minimum_group_size: 15,
          diversity_score: 0.9,
          collective_improvement: 50
        }
      },
      impact_calculations: {
        teacher_multiplier: 3.0,
        student_multiplier: 2.5,
        synergy_bonus: 1.0,
        cascade_effect: 1.2,
        organizational_boost: 0.8
      },
      rewards: {
        teacher_points: 2000,
        student_points: 1500,
        shared_rewards: {
          team_coins: 500,
          special_privileges: ['ecosystem_architect', 'organizational_transformation_leader', 'external_conference_keynote'],
          recognition_level: 'external'
        },
        ecosystem_benefits: {
          department_boost: 40,
          mentorship_opportunities: true,
          resource_allocation_priority: true
        }
      },
      measurement_metrics: {
        correlation_strength: 0.00, // Not yet unlocked
        impact_radius: 0.0,
        sustainability_score: 0.00,
        peer_adoption_rate: 0.00,
        long_term_effectiveness: 0.00
      },
      unlock_history: [],
      status: 'experimental',
      difficulty_tier: 'legendary',
      created_at: new Date('2024-03-01')
    }
  ])

  const [correlationPairs] = useState<CorrelationPair[]>([
    {
      id: 'cp1',
      teacher_id: 't1',
      teacher_name: 'Sarah Johnson',
      student_id: 's1',
      student_name: 'Emma Chen',
      correlation_coefficient: 0.84,
      confidence_interval: [0.78, 0.90],
      statistical_significance: 0.001,
      measurement_period: {
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-03-15'),
        data_points: 45
      },
      impact_evidence: {
        teacher_performance_change: 15.2,
        student_outcome_change: 22.8,
        cross_metrics: {
          engagement_correlation: 0.79,
          satisfaction_correlation: 0.82,
          achievement_correlation: 0.86
        }
      },
      trending: 'improving',
      prediction_confidence: 0.92,
      intervention_recommendations: ['maintain_current_approach', 'expand_mentorship_role']
    },
    {
      id: 'cp2',
      teacher_id: 't2',
      teacher_name: 'Michael Chen',
      student_id: 's4',
      student_name: 'Alex Rodriguez',
      correlation_coefficient: 0.73,
      confidence_interval: [0.65, 0.81],
      statistical_significance: 0.005,
      measurement_period: {
        start_date: new Date('2024-02-01'),
        end_date: new Date('2024-03-15'),
        data_points: 32
      },
      impact_evidence: {
        teacher_performance_change: 12.5,
        student_outcome_change: 18.3,
        cross_metrics: {
          engagement_correlation: 0.71,
          satisfaction_correlation: 0.75,
          achievement_correlation: 0.78
        }
      },
      trending: 'stable',
      prediction_confidence: 0.87,
      intervention_recommendations: ['introduce_peer_collaboration', 'enhance_feedback_frequency']
    },
    {
      id: 'cp3',
      teacher_id: 't1',
      teacher_name: 'Sarah Johnson',
      student_id: 's7',
      student_name: 'Jordan Kim',
      correlation_coefficient: 0.68,
      confidence_interval: [0.58, 0.78],
      statistical_significance: 0.012,
      measurement_period: {
        start_date: new Date('2024-01-15'),
        end_date: new Date('2024-03-15'),
        data_points: 38
      },
      impact_evidence: {
        teacher_performance_change: 8.7,
        student_outcome_change: 16.2,
        cross_metrics: {
          engagement_correlation: 0.65,
          satisfaction_correlation: 0.71,
          achievement_correlation: 0.74
        }
      },
      trending: 'improving',
      prediction_confidence: 0.83,
      intervention_recommendations: ['increase_individual_attention', 'provide_additional_resources']
    }
  ])

  const [ecosystemMap] = useState<EcosystemMap>({
    department_id: 'math_dept',
    network_nodes: [
      { user_id: 't1', user_type: 'teacher', influence_score: 0.92, connection_strength: 0.87, achievement_catalyst: true },
      { user_id: 't2', user_type: 'teacher', influence_score: 0.78, connection_strength: 0.74, achievement_catalyst: false },
      { user_id: 's1', user_type: 'student', influence_score: 0.85, connection_strength: 0.82, achievement_catalyst: true },
      { user_id: 's4', user_type: 'student', influence_score: 0.72, connection_strength: 0.68, achievement_catalyst: false },
      { user_id: 's7', user_type: 'student', influence_score: 0.79, connection_strength: 0.75, achievement_catalyst: false }
    ],
    connection_matrix: [
      [1.0, 0.6, 0.9, 0.7, 0.8],
      [0.6, 1.0, 0.5, 0.8, 0.4],
      [0.9, 0.5, 1.0, 0.6, 0.7],
      [0.7, 0.8, 0.6, 1.0, 0.5],
      [0.8, 0.4, 0.7, 0.5, 1.0]
    ],
    influence_flows: [
      { from_user: 't1', to_user: 's1', impact_strength: 0.84, achievement_pathway: ['teaching_excellence', 'academic_achievement'] },
      { from_user: 's1', to_user: 't1', impact_strength: 0.76, achievement_pathway: ['student_motivation', 'teaching_satisfaction'] },
      { from_user: 't2', to_user: 's4', impact_strength: 0.73, achievement_pathway: ['methodology_improvement', 'skill_development'] }
    ],
    collective_achievements: [
      { achievement_id: 'cia1', participants: ['t1', 's1', 's7'], synergy_score: 0.89, ecosystem_boost: 0.35 }
    ],
    health_metrics: {
      collaboration_density: 0.78,
      knowledge_flow_rate: 0.82,
      achievement_propagation: 0.75,
      organizational_resilience: 0.91
    }
  })

  const [analytics] = useState<CrossImpactAnalytics>({
    total_cross_achievements: 4,
    active_correlations: 12,
    ecosystem_health_score: 0.84,
    collective_impact_multiplier: 1.45,
    trending_patterns: {
      strengthening_pairs: 8,
      emerging_collaborations: 5,
      high_impact_teachers: 3,
      catalyst_students: 4
    },
    prediction_insights: {
      next_likely_achievements: [
        { achievement_id: 'cia2', probability: 0.78, estimated_timeline: 21, key_participants: ['t2', 's4', 's6'] },
        { achievement_id: 'cia3', probability: 0.65, estimated_timeline: 35, key_participants: ['s1', 't1', 's3'] }
      ],
      risk_indicators: [
        { type: 'correlation_decline', severity: 'low', affected_pairs: 2, mitigation_strategies: ['increase_interaction_frequency', 'provide_additional_support'] },
        { type: 'achievement_stagnation', severity: 'medium', affected_pairs: 1, mitigation_strategies: ['introduce_new_challenges', 'peer_mentorship_program'] }
      ]
    }
  })

  const achievementTypeColors = {
    bidirectional: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-500' },
    teacher_to_student: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' },
    student_to_teacher: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
    collaborative: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500' },
    ecosystem: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' }
  }

  const difficultyTierConfig = {
    collaborative: { icon: Users, color: '#10B981', difficulty: 1 },
    advanced: { icon: Target, color: '#3B82F6', difficulty: 2 },
    expert: { icon: Crown, color: '#8B5CF6', difficulty: 3 },
    legendary: { icon: Gem, color: '#DC2626', difficulty: 4 }
  }

  const getCorrelationStrength = (coefficient: number) => {
    if (coefficient >= 0.8) return { label: 'Very Strong', color: 'text-green-600' }
    if (coefficient >= 0.6) return { label: 'Strong', color: 'text-blue-600' }
    if (coefficient >= 0.4) return { label: 'Moderate', color: 'text-yellow-600' }
    if (coefficient >= 0.2) return { label: 'Weak', color: 'text-orange-600' }
    return { label: 'Very Weak', color: 'text-red-600' }
  }

  const getTrendingIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <ArrowUp className="h-4 w-4 text-green-600" />
      case 'declining': return <ArrowDown className="h-4 w-4 text-red-600" />
      default: return <ArrowRight className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredAchievements = crossImpactAchievements.filter(achievement => {
    const matchesType = filterType === 'all' || achievement.type === filterType
    const matchesSearch = searchQuery === '' || 
      achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesType && matchesSearch
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Cross-Impact Achievement System
              </CardTitle>
              <CardDescription>
                Advanced achievement framework recognizing teacher-student correlation and collaborative excellence
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics Report
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Cross-Impact Achievement
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">System Overview</TabsTrigger>
              <TabsTrigger value="achievements">Cross-Impact Achievements</TabsTrigger>
              <TabsTrigger value="correlations">Active Correlations</TabsTrigger>
              <TabsTrigger value="ecosystem">Ecosystem Map</TabsTrigger>
              <TabsTrigger value="predictions">Predictive Analytics</TabsTrigger>
            </TabsList>

            {/* System Overview */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="p-4 border-l-4 border-l-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {analytics.total_cross_achievements}
                      </div>
                      <div className="text-sm text-muted-foreground">Cross-Impact Achievements</div>
                    </div>
                    <Zap className="h-8 w-8 text-purple-500" />
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {analytics.active_correlations}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Correlations</div>
                    </div>
                    <Network className="h-8 w-8 text-blue-500" />
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(analytics.ecosystem_health_score * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Ecosystem Health</div>
                    </div>
                    <Globe className="h-8 w-8 text-green-500" />
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {analytics.collective_impact_multiplier}x
                      </div>
                      <div className="text-sm text-muted-foreground">Impact Multiplier</div>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-500" />
                  </div>
                </Card>
              </div>

              {/* Trending Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Current Trending Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <ArrowUp className="h-5 w-5 text-green-600" />
                          <span>Strengthening Pairs</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {analytics.trending_patterns.strengthening_pairs}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Sparkles className="h-5 w-5 text-blue-600" />
                          <span>Emerging Collaborations</span>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          {analytics.trending_patterns.emerging_collaborations}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Crown className="h-5 w-5 text-purple-600" />
                          <span>High-Impact Teachers</span>
                        </div>
                        <Badge className="bg-purple-100 text-purple-800">
                          {analytics.trending_patterns.high_impact_teachers}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Star className="h-5 w-5 text-yellow-600" />
                          <span>Catalyst Students</span>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {analytics.trending_patterns.catalyst_students}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ecosystem Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    Ecosystem Health Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Collaboration Density</Label>
                          <span className="text-sm font-medium">
                            {Math.round(ecosystemMap.health_metrics.collaboration_density * 100)}%
                          </span>
                        </div>
                        <Progress value={ecosystemMap.health_metrics.collaboration_density * 100} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Knowledge Flow Rate</Label>
                          <span className="text-sm font-medium">
                            {Math.round(ecosystemMap.health_metrics.knowledge_flow_rate * 100)}%
                          </span>
                        </div>
                        <Progress value={ecosystemMap.health_metrics.knowledge_flow_rate * 100} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Achievement Propagation</Label>
                          <span className="text-sm font-medium">
                            {Math.round(ecosystemMap.health_metrics.achievement_propagation * 100)}%
                          </span>
                        </div>
                        <Progress value={ecosystemMap.health_metrics.achievement_propagation * 100} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Organizational Resilience</Label>
                          <span className="text-sm font-medium">
                            {Math.round(ecosystemMap.health_metrics.organizational_resilience * 100)}%
                          </span>
                        </div>
                        <Progress value={ecosystemMap.health_metrics.organizational_resilience * 100} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cross-Impact Achievements */}
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
                  <Label>Achievement Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="bidirectional">Bidirectional</SelectItem>
                      <SelectItem value="teacher_to_student">Teacher → Student</SelectItem>
                      <SelectItem value="student_to_teacher">Student → Teacher</SelectItem>
                      <SelectItem value="collaborative">Collaborative</SelectItem>
                      <SelectItem value="ecosystem">Ecosystem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Achievements Grid */}
              <div className="space-y-6">
                {filteredAchievements.map((achievement) => {
                  const typeConfig = achievementTypeColors[achievement.type]
                  const difficultyConfig = difficultyTierConfig[achievement.difficulty_tier]
                  const DifficultyIcon = difficultyConfig.icon
                  
                  return (
                    <Card key={achievement.id} 
                          className={`hover:shadow-lg transition-shadow cursor-pointer border-l-4 ${typeConfig.border}`}
                          onClick={() => setSelectedAchievement(achievement)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                                 style={{ backgroundColor: difficultyConfig.color + '20' }}>
                              <DifficultyIcon className="h-6 w-6" style={{ color: difficultyConfig.color }} />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{achievement.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`${typeConfig.bg} ${typeConfig.text} capitalize`}>
                                  {achievement.type.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {achievement.difficulty_tier}
                                </Badge>
                                <Badge className={
                                  achievement.status === 'active' ? 'bg-green-100 text-green-800' :
                                  achievement.status === 'monitoring' ? 'bg-blue-100 text-blue-800' :
                                  achievement.status === 'experimental' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }>
                                  {achievement.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold" style={{ color: difficultyConfig.color }}>
                              {achievement.impact_calculations.synergy_bonus}x
                            </div>
                            <div className="text-sm text-muted-foreground">Synergy Bonus</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 mb-4">
                          {achievement.description}
                        </p>
                        
                        {/* Rewards Summary */}
                        <div className="grid gap-3 md:grid-cols-3 mb-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-lg font-bold text-blue-600">
                              {achievement.rewards.teacher_points}
                            </div>
                            <div className="text-xs text-blue-700">Teacher Points</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-lg font-bold text-green-600">
                              {achievement.rewards.student_points}
                            </div>
                            <div className="text-xs text-green-700">Student Points</div>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-lg font-bold text-purple-600">
                              {achievement.rewards.shared_rewards.team_coins}
                            </div>
                            <div className="text-xs text-purple-700">Team Coins</div>
                          </div>
                        </div>

                        {/* Measurement Metrics */}
                        {achievement.measurement_metrics.correlation_strength > 0 && (
                          <div className="grid gap-3 md:grid-cols-2 text-sm">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Correlation Strength:</span>
                                <span className="font-medium">
                                  {achievement.measurement_metrics.correlation_strength.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Impact Radius:</span>
                                <span className="font-medium">
                                  {achievement.measurement_metrics.impact_radius.toFixed(1)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Sustainability:</span>
                                <span className="font-medium">
                                  {Math.round(achievement.measurement_metrics.sustainability_score * 100)}%
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Peer Adoption:</span>
                                <span className="font-medium">
                                  {Math.round(achievement.measurement_metrics.peer_adoption_rate * 100)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Long-term Effect:</span>
                                <span className="font-medium">
                                  {Math.round(achievement.measurement_metrics.long_term_effectiveness * 100)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Unlocked:</span>
                                <span className="font-medium">{achievement.unlock_history.length} times</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Unlock History Preview */}
                        {achievement.unlock_history.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="text-sm text-muted-foreground mb-2">Recent Unlock</div>
                            <div className="flex items-center justify-between text-sm">
                              <span>
                                {achievement.unlock_history[0].unlock_date.toLocaleDateString()} • 
                                {achievement.unlock_history[0].student_ids.length + 1} participants
                              </span>
                              <Badge variant="outline">
                                {achievement.unlock_history[0].correlation_score.toFixed(2)} correlation
                              </Badge>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            {/* Active Correlations */}
            <TabsContent value="correlations" className="space-y-6">
              <div className="space-y-4">
                {correlationPairs.map((pair) => {
                  const strength = getCorrelationStrength(pair.correlation_coefficient)
                  
                  return (
                    <Card key={pair.id} className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedPair(pair)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                              <Link className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {pair.teacher_name} ↔ {pair.student_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Teacher-Student Correlation Pair
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={strength.color.replace('text-', 'bg-').replace('-600', '-100') + ' ' + strength.color}>
                                  {strength.label}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  {getTrendingIcon(pair.trending)}
                                  <span className="text-xs capitalize">{pair.trending}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold" style={{ color: strength.color.replace('text-', '') }}>
                              {pair.correlation_coefficient.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Correlation Coefficient
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <Label className="text-sm">Impact Evidence</Label>
                            <div className="mt-2 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Teacher Change:</span>
                                <span className="font-medium text-blue-600">
                                  +{pair.impact_evidence.teacher_performance_change.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Student Change:</span>
                                <span className="font-medium text-green-600">
                                  +{pair.impact_evidence.student_outcome_change.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm">Cross Metrics</Label>
                            <div className="mt-2 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Engagement:</span>
                                <span className="font-medium">
                                  {pair.impact_evidence.cross_metrics.engagement_correlation.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Achievement:</span>
                                <span className="font-medium">
                                  {pair.impact_evidence.cross_metrics.achievement_correlation.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm">Statistics</Label>
                            <div className="mt-2 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Confidence:</span>
                                <span className="font-medium">
                                  {Math.round(pair.prediction_confidence * 100)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Data Points:</span>
                                <span className="font-medium">{pair.measurement_period.data_points}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {pair.intervention_recommendations.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <Label className="text-sm">Recommendations</Label>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {pair.intervention_recommendations.map((rec, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {rec.replace('_', ' ')}
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

            {/* Ecosystem Map */}
            <TabsContent value="ecosystem" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Department Network Visualization
                  </CardTitle>
                  <CardDescription>
                    Interactive map showing influence flows and achievement catalysts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Network Nodes */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Network Participants</Label>
                      <div className="space-y-3">
                        {ecosystemMap.network_nodes.map((node) => (
                          <div key={node.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                node.user_type === 'teacher' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                              }`}>
                                {node.user_type === 'teacher' ? 'T' : 'S'}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {node.user_type === 'teacher' ? 'Teacher' : 'Student'} {node.user_id}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Influence: {Math.round(node.influence_score * 100)}%
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {node.achievement_catalyst && (
                                <Badge className="bg-yellow-100 text-yellow-800">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  Catalyst
                                </Badge>
                              )}
                              <div className="text-right text-sm">
                                <div className="font-medium">
                                  {Math.round(node.connection_strength * 100)}%
                                </div>
                                <div className="text-muted-foreground">Connection</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Influence Flows */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Influence Flows</Label>
                      <div className="space-y-3">
                        {ecosystemMap.influence_flows.map((flow, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{flow.from_user}</span>
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{flow.to_user}</span>
                              </div>
                              <Badge variant="outline">
                                {flow.impact_strength.toFixed(2)}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Pathway: {flow.achievement_pathway.join(' → ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Collective Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Collective Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ecosystemMap.collective_achievements.map((achievement, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-medium">Achievement: {achievement.achievement_id}</div>
                            <div className="text-sm text-muted-foreground">
                              {achievement.participants.length} participants
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-purple-600">
                              {achievement.synergy_score.toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">Synergy Score</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            {achievement.participants.map((participant, pIndex) => (
                              <Badge key={pIndex} variant="outline" className="text-xs">
                                {participant}
                              </Badge>
                            ))}
                          </div>
                          <Badge className="bg-orange-100 text-orange-800">
                            +{Math.round(achievement.ecosystem_boost * 100)}% Ecosystem Boost
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Predictive Analytics */}
            <TabsContent value="predictions" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Next Likely Achievements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Compass className="h-5 w-5" />
                      Predicted Achievements
                    </CardTitle>
                    <CardDescription>
                      Achievements likely to be unlocked soon
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.prediction_insights.next_likely_achievements.map((prediction, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="font-medium">{prediction.achievement_id}</div>
                              <div className="text-sm text-muted-foreground">
                                Est. {prediction.estimated_timeline} days
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">
                                {Math.round(prediction.probability * 100)}%
                              </div>
                              <div className="text-sm text-muted-foreground">Probability</div>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm">Key Participants</Label>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {prediction.key_participants.map((participant, pIndex) => (
                                <Badge key={pIndex} variant="outline" className="text-xs">
                                  {participant}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <Progress value={prediction.probability * 100} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Indicators */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Risk Assessment
                    </CardTitle>
                    <CardDescription>
                      Potential issues requiring attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.prediction_insights.risk_indicators.map((risk, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="font-medium capitalize">
                                {risk.type.replace('_', ' ')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {risk.affected_pairs} pairs affected
                              </div>
                            </div>
                            <Badge className={
                              risk.severity === 'high' ? 'bg-red-100 text-red-800' :
                              risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {risk.severity}
                            </Badge>
                          </div>
                          
                          <div>
                            <Label className="text-sm">Mitigation Strategies</Label>
                            <div className="mt-1 space-y-1">
                              {risk.mitigation_strategies.map((strategy, sIndex) => (
                                <div key={sIndex} className="text-sm p-2 bg-gray-50 rounded">
                                  {strategy.replace('_', ' ')}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Trend Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Cross-Impact Trend Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">85%</div>
                      <div className="text-sm text-blue-700">Correlation Stability</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Cross-impact relationships remain stable over time
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">92%</div>
                      <div className="text-sm text-green-700">Achievement Sustainability</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Unlocked achievements maintain long-term benefits
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">76%</div>
                      <div className="text-sm text-purple-700">Ecosystem Growth</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Network effects expanding to new participants
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Achievement Details Dialog */}
      {selectedAchievement && (
        <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {selectedAchievement.title}
              </DialogTitle>
              <DialogDescription>
                Cross-impact achievement configuration and performance metrics
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <p className="text-gray-700">{selectedAchievement.description}</p>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Trigger Conditions</Label>
                  <div className="mt-2 p-3 border rounded bg-gray-50">
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="font-medium text-blue-600">Teacher Criteria:</div>
                        {selectedAchievement.trigger_conditions.teacher_criteria.performance_threshold && (
                          <div>Performance: ≥{selectedAchievement.trigger_conditions.teacher_criteria.performance_threshold}%</div>
                        )}
                        {selectedAchievement.trigger_conditions.teacher_criteria.consecutive_periods && (
                          <div>Duration: {selectedAchievement.trigger_conditions.teacher_criteria.consecutive_periods} periods</div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-green-600">Student Criteria:</div>
                        {selectedAchievement.trigger_conditions.student_criteria.academic_threshold && (
                          <div>Academic: ≥{selectedAchievement.trigger_conditions.student_criteria.academic_threshold}%</div>
                        )}
                        {selectedAchievement.trigger_conditions.student_criteria.improvement_rate && (
                          <div>Improvement: +{selectedAchievement.trigger_conditions.student_criteria.improvement_rate}%</div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-purple-600">Correlation Requirements:</div>
                        <div>Min Correlation: {selectedAchievement.trigger_conditions.correlation_requirements.minimum_correlation}</div>
                        <div>Confidence: {selectedAchievement.trigger_conditions.correlation_requirements.confidence_level}</div>
                        <div>Sample Size: {selectedAchievement.trigger_conditions.correlation_requirements.sample_size}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Impact Calculations</Label>
                  <div className="mt-2 p-3 border rounded bg-blue-50">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Teacher Multiplier:</span>
                        <span className="font-medium">{selectedAchievement.impact_calculations.teacher_multiplier}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Student Multiplier:</span>
                        <span className="font-medium">{selectedAchievement.impact_calculations.student_multiplier}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Synergy Bonus:</span>
                        <span className="font-medium">{selectedAchievement.impact_calculations.synergy_bonus}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cascade Effect:</span>
                        <span className="font-medium">{selectedAchievement.impact_calculations.cascade_effect}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Org Boost:</span>
                        <span className="font-medium">{selectedAchievement.impact_calculations.organizational_boost}x</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Rewards Structure</Label>
                <div className="mt-2 grid gap-4 md:grid-cols-3">
                  <div className="p-3 border rounded bg-blue-50">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {selectedAchievement.rewards.teacher_points}
                      </div>
                      <div className="text-sm text-blue-700">Teacher Points</div>
                    </div>
                  </div>
                  <div className="p-3 border rounded bg-green-50">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {selectedAchievement.rewards.student_points}
                      </div>
                      <div className="text-sm text-green-700">Student Points</div>
                    </div>
                  </div>
                  <div className="p-3 border rounded bg-purple-50">
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {selectedAchievement.rewards.shared_rewards.team_coins}
                      </div>
                      <div className="text-sm text-purple-700">Team Coins</div>
                    </div>
                  </div>
                </div>
                
                {selectedAchievement.rewards.shared_rewards.special_privileges.length > 0 && (
                  <div className="mt-3">
                    <Label className="text-xs">Special Privileges</Label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedAchievement.rewards.shared_rewards.special_privileges.map((privilege, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {privilege.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedAchievement.measurement_metrics.correlation_strength > 0 && (
                <div>
                  <Label className="text-sm font-medium">Performance Metrics</Label>
                  <div className="mt-2 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Correlation Strength:</span>
                        <span className="font-medium">{selectedAchievement.measurement_metrics.correlation_strength.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Impact Radius:</span>
                        <span className="font-medium">{selectedAchievement.measurement_metrics.impact_radius.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sustainability Score:</span>
                        <span className="font-medium">{Math.round(selectedAchievement.measurement_metrics.sustainability_score * 100)}%</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Peer Adoption Rate:</span>
                        <span className="font-medium">{Math.round(selectedAchievement.measurement_metrics.peer_adoption_rate * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Long-term Effectiveness:</span>
                        <span className="font-medium">{Math.round(selectedAchievement.measurement_metrics.long_term_effectiveness * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Unlocks:</span>
                        <span className="font-medium">{selectedAchievement.unlock_history.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedAchievement.unlock_history.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Unlock History</Label>
                  <div className="mt-2 space-y-3">
                    {selectedAchievement.unlock_history.map((unlock, index) => (
                      <div key={index} className="p-3 border rounded">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">
                            {unlock.unlock_date.toLocaleDateString()}
                          </div>
                          <Badge variant="outline">
                            {unlock.correlation_score.toFixed(2)} correlation
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Participants: {unlock.teacher_id}, {unlock.student_ids.join(', ')}
                        </div>
                        <div className="text-sm">
                          Impact Measured: {unlock.impact_measured}%
                        </div>
                        {unlock.follow_up_effects.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs font-medium">Follow-up Effects:</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {unlock.follow_up_effects.map((effect, eIndex) => (
                                <Badge key={eIndex} variant="outline" className="text-xs">
                                  {effect.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

      {/* Correlation Pair Details Dialog */}
      {selectedPair && (
        <Dialog open={!!selectedPair} onOpenChange={() => setSelectedPair(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Correlation Pair Analysis
              </DialogTitle>
              <DialogDescription>
                {selectedPair.teacher_name} ↔ {selectedPair.student_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Correlation Metrics</Label>
                  <div className="space-y-2 text-sm">
                    <div>Coefficient: {selectedPair.correlation_coefficient.toFixed(3)}</div>
                    <div>Confidence Interval: [{selectedPair.confidence_interval[0].toFixed(2)}, {selectedPair.confidence_interval[1].toFixed(2)}]</div>
                    <div>Statistical Significance: p &lt; {selectedPair.statistical_significance}</div>
                    <div>Prediction Confidence: {Math.round(selectedPair.prediction_confidence * 100)}%</div>
                  </div>
                </div>
                
                <div>
                  <Label>Measurement Period</Label>
                  <div className="space-y-2 text-sm">
                    <div>Start: {selectedPair.measurement_period.start_date.toLocaleDateString()}</div>
                    <div>End: {selectedPair.measurement_period.end_date.toLocaleDateString()}</div>
                    <div>Data Points: {selectedPair.measurement_period.data_points}</div>
                    <div>Trend: <span className="capitalize">{selectedPair.trending}</span></div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Impact Evidence</Label>
                <div className="grid gap-4 md:grid-cols-2 mt-2">
                  <div className="p-3 border rounded bg-blue-50">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        +{selectedPair.impact_evidence.teacher_performance_change.toFixed(1)}%
                      </div>
                      <div className="text-sm text-blue-700">Teacher Performance Change</div>
                    </div>
                  </div>
                  <div className="p-3 border rounded bg-green-50">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        +{selectedPair.impact_evidence.student_outcome_change.toFixed(1)}%
                      </div>
                      <div className="text-sm text-green-700">Student Outcome Change</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Cross Metrics</Label>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Engagement Correlation:</span>
                    <span className="font-medium">{selectedPair.impact_evidence.cross_metrics.engagement_correlation.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Satisfaction Correlation:</span>
                    <span className="font-medium">{selectedPair.impact_evidence.cross_metrics.satisfaction_correlation.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Achievement Correlation:</span>
                    <span className="font-medium">{selectedPair.impact_evidence.cross_metrics.achievement_correlation.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedPair.intervention_recommendations.length > 0 && (
                <div>
                  <Label>Intervention Recommendations</Label>
                  <div className="mt-2 space-y-2">
                    {selectedPair.intervention_recommendations.map((rec, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                        {rec.replace('_', ' ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPair(null)}>
                Close
              </Button>
              <Button>
                <Eye className="h-4 w-4 mr-2" />
                View Full Analysis
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}