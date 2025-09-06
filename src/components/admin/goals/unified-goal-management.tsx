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
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Calendar } from '@/components/ui/calendar'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Target,
  Plus,
  Calendar as CalendarIcon,
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  Clock,
  Award,
  Brain,
  Heart,
  Lightbulb,
  Star,
  Trophy,
  ArrowRight,
  Eye,
  Edit,
  Share,
  MessageSquare,
  Bell,
  Search,
  Filter,
  BarChart3,
  Zap,
  Crown,
  AlertTriangle,
  Info
} from 'lucide-react'
import { format } from 'date-fns'
import type { TeacherWithRanking, StudentWithRanking } from '@/types/ranking'

// Goal types and interfaces
interface Goal {
  id: string
  user_id: string
  user_type: 'teacher' | 'student'
  title: string
  description: string
  category: GoalCategory
  type: GoalType
  smart_criteria: SMARTCriteria
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'pending_approval'
  progress_percentage: number
  milestones: Milestone[]
  collaborators: Collaborator[]
  mentor_id?: string
  mentor_name?: string
  created_at: Date
  target_date: Date
  completed_at?: Date
  last_updated: Date
  
  // Cross-impact tracking
  related_goals: string[]
  organizational_alignment: OrganizationalAlignment
  performance_correlation: PerformanceCorrelation
  
  // Approval workflow
  requires_approval: boolean
  approved_by?: string
  approval_notes?: string
  resource_requirements?: ResourceRequirement[]
}

interface SMARTCriteria {
  specific: string
  measurable: MeasurableMetric[]
  achievable: string
  relevant: string
  time_bound: {
    start_date: Date
    target_date: Date
    check_in_frequency: 'weekly' | 'biweekly' | 'monthly'
  }
}

interface MeasurableMetric {
  metric_name: string
  current_value: number
  target_value: number
  unit: string
  measurement_method: string
}

interface Milestone {
  id: string
  title: string
  description: string
  due_date: Date
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  completion_percentage: number
  points_reward?: number
  completed_at?: Date
}

interface Collaborator {
  user_id: string
  user_name: string
  user_type: 'teacher' | 'student'
  role: 'mentor' | 'mentee' | 'peer' | 'supervisor'
  contribution_type: 'support' | 'accountability' | 'expertise' | 'resources'
}

interface OrganizationalAlignment {
  school_goals: string[]
  department_goals: string[]
  alignment_score: number
  contribution_description: string
}

interface PerformanceCorrelation {
  affects_ranking: boolean
  affects_compensation: boolean
  point_impact: number
  achievement_unlocks: string[]
}

interface ResourceRequirement {
  type: 'budget' | 'time' | 'materials' | 'training' | 'technology'
  description: string
  estimated_cost?: number
  approval_required: boolean
}

type GoalCategory = 
  // Student categories
  | 'academic_performance' | 'skill_development' | 'behavioral_improvement' 
  | 'extracurricular' | 'career_exploration' | 'peer_leadership'
  // Teacher categories  
  | 'teaching_effectiveness' | 'professional_certification' | 'student_impact'
  | 'leadership_development' | 'curriculum_innovation' | 'mentorship'

type GoalType = 
  | 'learning_objective' | 'performance_improvement' | 'behavioral_development'
  | 'collaborative_project' | 'certification' | 'innovation'

// Goal templates
const GOAL_TEMPLATES = {
  student: [
    {
      category: 'academic_performance',
      title: 'Improve Math Grade',
      description: 'Raise math grade from C to B by end of semester',
      smart_template: {
        specific: 'Improve math grade through consistent homework completion and test preparation',
        measurable: [{ metric_name: 'Grade Average', current_value: 75, target_value: 85, unit: '%', measurement_method: 'Grade book tracking' }],
        achievable: 'Achievable through daily study sessions and teacher support',
        relevant: 'Relevant to academic advancement and future course placement',
        time_bound: { check_in_frequency: 'weekly' as const }
      }
    },
    {
      category: 'peer_leadership',
      title: 'Mentor Junior Students',
      description: 'Become a peer tutor and help 3 junior students improve their academic performance',
      smart_template: {
        specific: 'Provide weekly tutoring sessions to junior students in math and science',
        measurable: [{ metric_name: 'Students Mentored', current_value: 0, target_value: 3, unit: 'students', measurement_method: 'Mentorship tracking' }],
        achievable: 'Achievable with teacher coordination and structured program',
        relevant: 'Develops leadership skills and contributes to school community',
        time_bound: { check_in_frequency: 'biweekly' as const }
      }
    }
  ],
  teacher: [
    {
      category: 'teaching_effectiveness',
      title: 'Improve Student Engagement',
      description: 'Increase student engagement scores through interactive teaching methods',
      smart_template: {
        specific: 'Implement project-based learning and technology integration in daily lessons',
        measurable: [{ metric_name: 'Engagement Score', current_value: 70, target_value: 85, unit: '%', measurement_method: 'Student surveys and observation' }],
        achievable: 'Achievable through professional development and gradual implementation',
        relevant: 'Directly impacts student learning outcomes and performance',
        time_bound: { check_in_frequency: 'monthly' as const }
      }
    },
    {
      category: 'professional_certification',
      title: 'Complete Master\'s Degree',
      description: 'Complete Master\'s degree in Education within 2 years',
      smart_template: {
        specific: 'Enroll in and complete Master\'s program with focus on curriculum development',
        measurable: [{ metric_name: 'Credits Completed', current_value: 0, target_value: 36, unit: 'credits', measurement_method: 'University transcript' }],
        achievable: 'Achievable with part-time enrollment and administrative support',
        relevant: 'Enhances teaching skills and career advancement opportunities',
        time_bound: { check_in_frequency: 'monthly' as const }
      }
    }
  ]
}

export function UnifiedGoalManagement() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [filterUserType, setFilterUserType] = useState<'all' | 'teacher' | 'student'>('all')
  const [filterStatus, setFilterStatus] = useState<string>('active')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Create goal form state
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    user_type: 'student',
    category: 'academic_performance',
    type: 'learning_objective',
    priority: 'medium',
    status: 'draft',
    progress_percentage: 0,
    milestones: [],
    collaborators: [],
    related_goals: [],
    smart_criteria: {
      specific: '',
      measurable: [],
      achievable: '',
      relevant: '',
      time_bound: {
        start_date: new Date(),
        target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        check_in_frequency: 'weekly'
      }
    },
    organizational_alignment: {
      school_goals: [],
      department_goals: [],
      alignment_score: 0,
      contribution_description: ''
    },
    performance_correlation: {
      affects_ranking: false,
      affects_compensation: false,
      point_impact: 0,
      achievement_unlocks: []
    }
  })

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)

  // Mock data
  const [teachers] = useState<TeacherWithRanking[]>([
    {
      id: 't1', user_id: 't1', teacher_id: 't1', user_type: 'teacher',
      full_name: 'Sarah Johnson', efficiency_percentage: 95, quality_score: 88, performance_tier: 'excellent',
      ranking: { id: 'r1', user_id: 't1', organization_id: 'org1', user_type: 'teacher', total_points: 1250, available_coins: 125, spent_coins: 25, current_level: 8, current_rank: 2, efficiency_percentage: 95, quality_score: 88, performance_tier: 'excellent', created_at: '2024-01-01', updated_at: '2024-03-15' }
    }
  ])

  const [students] = useState<StudentWithRanking[]>([
    {
      id: 's1', user_id: 's1', student_id: 's1', user_type: 'student',
      full_name: 'Emma Chen',
      ranking: { id: 'r2', user_id: 's1', organization_id: 'org1', user_type: 'student', total_points: 850, available_coins: 85, spent_coins: 15, current_level: 6, current_rank: 5, created_at: '2024-01-01', updated_at: '2024-03-15' }
    }
  ])

  // Initialize with mock goals
  useEffect(() => {
    const mockGoals: Goal[] = [
      {
        id: 'g1',
        user_id: 's1',
        user_type: 'student',
        title: 'Improve Mathematics Performance',
        description: 'Raise math grade from C+ to B+ by end of quarter through consistent study and homework completion',
        category: 'academic_performance',
        type: 'performance_improvement',
        smart_criteria: {
          specific: 'Improve math grade through daily practice, homework completion, and test preparation',
          measurable: [
            { metric_name: 'Grade Average', current_value: 78, target_value: 87, unit: '%', measurement_method: 'Grade book tracking' },
            { metric_name: 'Homework Completion', current_value: 75, target_value: 95, unit: '%', measurement_method: 'Assignment tracking' }
          ],
          achievable: 'Achievable through daily 30-minute study sessions and weekly teacher check-ins',
          relevant: 'Directly impacts academic standing and preparation for advanced courses',
          time_bound: {
            start_date: new Date('2024-03-01'),
            target_date: new Date('2024-05-31'),
            check_in_frequency: 'weekly'
          }
        },
        priority: 'high',
        status: 'active',
        progress_percentage: 65,
        milestones: [
          {
            id: 'm1',
            title: 'Complete Unit 3 with B or better',
            description: 'Master algebraic equations and score 85% or higher on unit test',
            due_date: new Date('2024-04-15'),
            status: 'completed',
            completion_percentage: 100,
            points_reward: 25,
            completed_at: new Date('2024-04-12')
          },
          {
            id: 'm2',
            title: 'Maintain 95% homework completion',
            description: 'Complete all homework assignments for 4 consecutive weeks',
            due_date: new Date('2024-05-01'),
            status: 'in_progress',
            completion_percentage: 80
          }
        ],
        collaborators: [
          {
            user_id: 't1',
            user_name: 'Sarah Johnson',
            user_type: 'teacher',
            role: 'mentor',
            contribution_type: 'expertise'
          }
        ],
        mentor_id: 't1',
        mentor_name: 'Sarah Johnson',
        created_at: new Date('2024-03-01'),
        target_date: new Date('2024-05-31'),
        last_updated: new Date('2024-04-12'),
        related_goals: [],
        organizational_alignment: {
          school_goals: ['academic_excellence', 'student_success'],
          department_goals: ['math_proficiency'],
          alignment_score: 85,
          contribution_description: 'Contributes to school-wide math proficiency goals'
        },
        performance_correlation: {
          affects_ranking: true,
          affects_compensation: false,
          point_impact: 50,
          achievement_unlocks: ['math_champion', 'academic_improver']
        },
        requires_approval: false
      },
      {
        id: 'g2',
        user_id: 't1',
        user_type: 'teacher',
        title: 'Implement Project-Based Learning',
        description: 'Integrate project-based learning methods into curriculum to increase student engagement by 20%',
        category: 'teaching_effectiveness',
        type: 'innovation',
        smart_criteria: {
          specific: 'Design and implement 4 major project-based learning units across the semester',
          measurable: [
            { metric_name: 'Student Engagement Score', current_value: 72, target_value: 87, unit: '%', measurement_method: 'Student surveys and classroom observation' },
            { metric_name: 'Project Completion Rate', current_value: 0, target_value: 95, unit: '%', measurement_method: 'Assignment tracking' }
          ],
          achievable: 'Achievable through professional development training and gradual implementation',
          relevant: 'Aligns with school focus on innovative teaching and student-centered learning',
          time_bound: {
            start_date: new Date('2024-02-01'),
            target_date: new Date('2024-06-30'),
            check_in_frequency: 'monthly'
          }
        },
        priority: 'high',
        status: 'active',
        progress_percentage: 45,
        milestones: [
          {
            id: 'm3',
            title: 'Complete PBL Training Course',
            description: 'Finish 20-hour professional development course on project-based learning',
            due_date: new Date('2024-03-15'),
            status: 'completed',
            completion_percentage: 100,
            completed_at: new Date('2024-03-10')
          },
          {
            id: 'm4',
            title: 'Launch First Project Unit',
            description: 'Implement first project-based unit with student groups',
            due_date: new Date('2024-04-30'),
            status: 'in_progress',
            completion_percentage: 75
          }
        ],
        collaborators: [
          {
            user_id: 'admin1',
            user_name: 'Michael Chen',
            user_type: 'teacher',
            role: 'supervisor',
            contribution_type: 'support'
          }
        ],
        created_at: new Date('2024-02-01'),
        target_date: new Date('2024-06-30'),
        last_updated: new Date('2024-04-15'),
        related_goals: ['g1'],
        organizational_alignment: {
          school_goals: ['innovative_teaching', 'student_engagement'],
          department_goals: ['curriculum_modernization'],
          alignment_score: 92,
          contribution_description: 'Directly supports school initiative for innovative teaching methods'
        },
        performance_correlation: {
          affects_ranking: true,
          affects_compensation: true,
          point_impact: 75,
          achievement_unlocks: ['innovative_educator', 'engagement_expert']
        },
        requires_approval: true,
        approved_by: 'admin1',
        approval_notes: 'Approved with budget allocation for training and materials',
        resource_requirements: [
          {
            type: 'budget',
            description: 'Training course fees and project materials',
            estimated_cost: 1500,
            approval_required: true
          },
          {
            type: 'time',
            description: 'Additional planning time for project design',
            approval_required: false
          }
        ]
      }
    ]
    setGoals(mockGoals)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'on_hold': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'pending_approval': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: GoalCategory) => {
    switch (category) {
      case 'academic_performance': return <BookOpen className="h-4 w-4" />
      case 'skill_development': return <Brain className="h-4 w-4" />
      case 'behavioral_improvement': return <Heart className="h-4 w-4" />
      case 'extracurricular': return <Star className="h-4 w-4" />
      case 'career_exploration': return <Target className="h-4 w-4" />
      case 'peer_leadership': return <Users className="h-4 w-4" />
      case 'teaching_effectiveness': return <GraduationCap className="h-4 w-4" />
      case 'professional_certification': return <Award className="h-4 w-4" />
      case 'student_impact': return <TrendingUp className="h-4 w-4" />
      case 'leadership_development': return <Crown className="h-4 w-4" />
      case 'curriculum_innovation': return <Lightbulb className="h-4 w-4" />
      case 'mentorship': return <Users className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template)
    setNewGoal(prev => ({
      ...prev,
      title: template.title,
      description: template.description,
      category: template.category,
      smart_criteria: {
        ...prev.smart_criteria!,
        ...template.smart_template
      }
    }))
  }

  const handleCreateGoal = () => {
    const goalId = `g${Date.now()}`
    const goal: Goal = {
      id: goalId,
      user_id: newGoal.user_id || '',
      user_type: newGoal.user_type!,
      title: newGoal.title!,
      description: newGoal.description!,
      category: newGoal.category!,
      type: newGoal.type!,
      smart_criteria: newGoal.smart_criteria!,
      priority: newGoal.priority!,
      status: newGoal.status!,
      progress_percentage: 0,
      milestones: [],
      collaborators: [],
      created_at: new Date(),
      target_date: newGoal.smart_criteria!.time_bound.target_date,
      last_updated: new Date(),
      related_goals: [],
      organizational_alignment: newGoal.organizational_alignment!,
      performance_correlation: newGoal.performance_correlation!,
      requires_approval: newGoal.performance_correlation!.point_impact > 50
    }

    setGoals(prev => [goal, ...prev])
    setShowCreateDialog(false)
    
    // Reset form
    setNewGoal({
      user_type: 'student',
      category: 'academic_performance',
      type: 'learning_objective',
      priority: 'medium',
      status: 'draft',
      progress_percentage: 0,
      milestones: [],
      collaborators: [],
      related_goals: []
    })
    setSelectedTemplate(null)
  }

  const filteredGoals = goals.filter(goal => {
    const matchesUserType = filterUserType === 'all' || goal.user_type === filterUserType
    const matchesStatus = filterStatus === 'all' || goal.status === filterStatus
    const matchesCategory = filterCategory === 'all' || goal.category === filterCategory
    const matchesSearch = searchTerm === '' || 
      goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goal.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesUserType && matchesStatus && matchesCategory && matchesSearch
  })

  const getGoalStats = () => {
    const total = goals.length
    const active = goals.filter(g => g.status === 'active').length
    const completed = goals.filter(g => g.status === 'completed').length
    const avgProgress = goals.reduce((sum, g) => sum + g.progress_percentage, 0) / total

    return { total, active, completed, avgProgress }
  }

  const stats = getGoalStats()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Target className="h-5 w-5" />
                Unified Goal Management
              </CardTitle>
              <CardDescription>
                SMART goal setting and tracking for students and teachers with cross-impact analysis
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Goal Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Across all users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Successfully achieved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.avgProgress.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Overall completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals List with Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Goals Overview
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search goals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterUserType} onValueChange={(value: any) => setFilterUserType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="teacher">Teachers</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="pending_approval">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="academic_performance">Academic</SelectItem>
                  <SelectItem value="teaching_effectiveness">Teaching</SelectItem>
                  <SelectItem value="professional_certification">Certification</SelectItem>
                  <SelectItem value="peer_leadership">Leadership</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Goals List */}
          <div className="space-y-4">
            {filteredGoals.map((goal) => (
              <div key={goal.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                      {getCategoryIcon(goal.category)}
                    </div>
                    <div>
                      <h4 className="font-semibold">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(goal.priority)}>
                      {goal.priority}
                    </Badge>
                    <Badge className={getStatusColor(goal.status)}>
                      {goal.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">
                      {goal.user_type === 'teacher' ? 'Teacher' : 'Student'}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 mb-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Progress</Label>
                    <div className="mt-1">
                      <Progress value={goal.progress_percentage} className="mb-1" />
                      <div className="text-sm font-medium">{goal.progress_percentage}% complete</div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Target Date</Label>
                    <div className="text-sm font-medium mt-1">
                      {format(goal.target_date, 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Impact</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {goal.performance_correlation.affects_ranking && (
                        <Badge variant="outline" className="text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Ranking
                        </Badge>
                      )}
                      {goal.performance_correlation.point_impact > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          +{goal.performance_correlation.point_impact}pts
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {goal.milestones.length > 0 && (
                  <div className="mb-3">
                    <Label className="text-xs text-muted-foreground">Recent Milestones</Label>
                    <div className="grid gap-2 md:grid-cols-2 mt-2">
                      {goal.milestones.slice(0, 2).map((milestone) => (
                        <div key={milestone.id} className="flex items-center justify-between p-2 border rounded text-sm">
                          <span className={milestone.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                            {milestone.title}
                          </span>
                          <Badge className={milestone.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                            {milestone.status === 'completed' ? 'Done' : `${milestone.completion_percentage}%`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {goal.mentor_name && (
                      <span>Mentor: {goal.mentor_name}</span>
                    )}
                    <span>Created: {format(goal.created_at, 'MMM dd')}</span>
                    {goal.organizational_alignment.alignment_score > 0 && (
                      <span>Alignment: {goal.organizational_alignment.alignment_score}%</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setSelectedGoal(goal)
                      setShowDetailDialog(true)
                    }}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredGoals.length === 0 && (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No goals found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterUserType !== 'all' || filterStatus !== 'all' || filterCategory !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'Create your first goal to get started with goal tracking.'}
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Goal
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Goal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Goal
            </DialogTitle>
            <DialogDescription>
              Use the SMART framework to create a well-defined, achievable goal
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="smart">SMART Criteria</TabsTrigger>
              <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
              <TabsTrigger value="impact">Impact & Alignment</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Goal Templates</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {GOAL_TEMPLATES[newGoal.user_type as keyof typeof GOAL_TEMPLATES]?.map((template, index) => (
                    <Button
                      key={index}
                      variant={selectedTemplate === template ? 'default' : 'outline'}
                      onClick={() => handleTemplateSelect(template)}
                      className="justify-start h-auto p-3"
                    >
                      <div className="text-left">
                        <div className="font-medium">{template.title}</div>
                        <div className="text-sm text-muted-foreground">{template.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>User Type</Label>
                  <Select value={newGoal.user_type} onValueChange={(value: any) => setNewGoal({...newGoal, user_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newGoal.category} onValueChange={(value: any) => setNewGoal({...newGoal, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {newGoal.user_type === 'student' ? (
                        <>
                          <SelectItem value="academic_performance">Academic Performance</SelectItem>
                          <SelectItem value="skill_development">Skill Development</SelectItem>
                          <SelectItem value="behavioral_improvement">Behavioral Improvement</SelectItem>
                          <SelectItem value="extracurricular">Extracurricular</SelectItem>
                          <SelectItem value="peer_leadership">Peer Leadership</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="teaching_effectiveness">Teaching Effectiveness</SelectItem>
                          <SelectItem value="professional_certification">Professional Certification</SelectItem>
                          <SelectItem value="student_impact">Student Impact</SelectItem>
                          <SelectItem value="leadership_development">Leadership Development</SelectItem>
                          <SelectItem value="curriculum_innovation">Curriculum Innovation</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Goal Title</Label>
                <Input
                  value={newGoal.title || ''}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="Enter a clear, specific goal title"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newGoal.description || ''}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  placeholder="Provide a detailed description of what you want to achieve"
                  className="min-h-20"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newGoal.priority} onValueChange={(value: any) => setNewGoal({...newGoal, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newGoal.smart_criteria?.time_bound.target_date ? 
                          format(newGoal.smart_criteria.time_bound.target_date, 'PPP') : 
                          'Pick a date'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newGoal.smart_criteria?.time_bound.target_date}
                        onSelect={(date) => date && setNewGoal({
                          ...newGoal,
                          smart_criteria: {
                            ...newGoal.smart_criteria!,
                            time_bound: {
                              ...newGoal.smart_criteria!.time_bound,
                              target_date: date
                            }
                          }
                        })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="smart" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">SMART Criteria Framework</h4>
                  <p className="text-sm text-muted-foreground">
                    Define your goal using the SMART framework: Specific, Measurable, Achievable, Relevant, Time-bound
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Specific - What exactly will you accomplish?</Label>
                  <Textarea
                    value={newGoal.smart_criteria?.specific || ''}
                    onChange={(e) => setNewGoal({
                      ...newGoal,
                      smart_criteria: {
                        ...newGoal.smart_criteria!,
                        specific: e.target.value
                      }
                    })}
                    placeholder="Be specific about what you want to achieve, how, and why"
                    className="min-h-16"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Measurable - How will you track progress?</Label>
                  <div className="space-y-3">
                    {newGoal.smart_criteria?.measurable.map((metric, index) => (
                      <div key={index} className="grid gap-2 md:grid-cols-4 p-3 border rounded-lg">
                        <Input 
                          placeholder="Metric name"
                          value={metric.metric_name}
                          onChange={(e) => {
                            const updated = [...(newGoal.smart_criteria?.measurable || [])]
                            updated[index] = { ...metric, metric_name: e.target.value }
                            setNewGoal({
                              ...newGoal,
                              smart_criteria: {
                                ...newGoal.smart_criteria!,
                                measurable: updated
                              }
                            })
                          }}
                        />
                        <Input 
                          type="number"
                          placeholder="Current"
                          value={metric.current_value}
                          onChange={(e) => {
                            const updated = [...(newGoal.smart_criteria?.measurable || [])]
                            updated[index] = { ...metric, current_value: Number(e.target.value) }
                            setNewGoal({
                              ...newGoal,
                              smart_criteria: {
                                ...newGoal.smart_criteria!,
                                measurable: updated
                              }
                            })
                          }}
                        />
                        <Input 
                          type="number"
                          placeholder="Target"
                          value={metric.target_value}
                          onChange={(e) => {
                            const updated = [...(newGoal.smart_criteria?.measurable || [])]
                            updated[index] = { ...metric, target_value: Number(e.target.value) }
                            setNewGoal({
                              ...newGoal,
                              smart_criteria: {
                                ...newGoal.smart_criteria!,
                                measurable: updated
                              }
                            })
                          }}
                        />
                        <Input 
                          placeholder="Unit"
                          value={metric.unit}
                          onChange={(e) => {
                            const updated = [...(newGoal.smart_criteria?.measurable || [])]
                            updated[index] = { ...metric, unit: e.target.value }
                            setNewGoal({
                              ...newGoal,
                              smart_criteria: {
                                ...newGoal.smart_criteria!,
                                measurable: updated
                              }
                            })
                          }}
                        />
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const newMetric = {
                          metric_name: '',
                          current_value: 0,
                          target_value: 0,
                          unit: '',
                          measurement_method: ''
                        }
                        setNewGoal({
                          ...newGoal,
                          smart_criteria: {
                            ...newGoal.smart_criteria!,
                            measurable: [...(newGoal.smart_criteria?.measurable || []), newMetric]
                          }
                        })
                      }}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Metric
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Achievable - Is this goal realistic?</Label>
                  <Textarea
                    value={newGoal.smart_criteria?.achievable || ''}
                    onChange={(e) => setNewGoal({
                      ...newGoal,
                      smart_criteria: {
                        ...newGoal.smart_criteria!,
                        achievable: e.target.value
                      }
                    })}
                    placeholder="Explain why this goal is achievable given your current situation and resources"
                    className="min-h-16"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Relevant - Why does this goal matter?</Label>
                  <Textarea
                    value={newGoal.smart_criteria?.relevant || ''}
                    onChange={(e) => setNewGoal({
                      ...newGoal,
                      smart_criteria: {
                        ...newGoal.smart_criteria!,
                        relevant: e.target.value
                      }
                    })}
                    placeholder="Describe how this goal aligns with your larger objectives and why it's important"
                    className="min-h-16"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Time-bound - Check-in Frequency</Label>
                  <Select 
                    value={newGoal.smart_criteria?.time_bound.check_in_frequency} 
                    onValueChange={(value: any) => setNewGoal({
                      ...newGoal,
                      smart_criteria: {
                        ...newGoal.smart_criteria!,
                        time_bound: {
                          ...newGoal.smart_criteria!.time_bound,
                          check_in_frequency: value
                        }
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="collaboration" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Collaboration & Support</h4>
                  <p className="text-sm text-muted-foreground">
                    Add mentors, peers, and collaborators to support your goal achievement
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Mentor/Supervisor (Optional)</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a mentor" />
                    </SelectTrigger>
                    <SelectContent>
                      {(newGoal.user_type === 'student' ? teachers : teachers).map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Collaboration Type</Label>
                  <div className="grid gap-2">
                    {['Peer Support', 'Mentorship', 'Group Project', 'Accountability Partner'].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox id={type} />
                        <Label htmlFor={type}>{type}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Resource Requirements</Label>
                  <Textarea
                    placeholder="List any resources, support, or approvals needed to achieve this goal"
                    className="min-h-16"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="impact" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Impact & Organizational Alignment</h4>
                  <p className="text-sm text-muted-foreground">
                    Define how this goal contributes to larger objectives and performance tracking
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Organizational Contribution</Label>
                  <Textarea
                    value={newGoal.organizational_alignment?.contribution_description || ''}
                    onChange={(e) => setNewGoal({
                      ...newGoal,
                      organizational_alignment: {
                        ...newGoal.organizational_alignment!,
                        contribution_description: e.target.value
                      }
                    })}
                    placeholder="Describe how achieving this goal contributes to school/department objectives"
                    className="min-h-16"
                  />
                </div>

                <div className="space-y-4">
                  <h5 className="font-medium">Performance Impact</h5>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="affects_ranking"
                        checked={newGoal.performance_correlation?.affects_ranking || false}
                        onCheckedChange={(checked) => setNewGoal({
                          ...newGoal,
                          performance_correlation: {
                            ...newGoal.performance_correlation!,
                            affects_ranking: !!checked
                          }
                        })}
                      />
                      <Label htmlFor="affects_ranking">Affects ranking/performance metrics</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="affects_compensation"
                        checked={newGoal.performance_correlation?.affects_compensation || false}
                        onCheckedChange={(checked) => setNewGoal({
                          ...newGoal,
                          performance_correlation: {
                            ...newGoal.performance_correlation!,
                            affects_compensation: !!checked
                          }
                        })}
                      />
                      <Label htmlFor="affects_compensation">Affects compensation (teachers only)</Label>
                    </div>

                    <div className="space-y-2">
                      <Label>Point Impact</Label>
                      <Input
                        type="number"
                        value={newGoal.performance_correlation?.point_impact || 0}
                        onChange={(e) => setNewGoal({
                          ...newGoal,
                          performance_correlation: {
                            ...newGoal.performance_correlation!,
                            point_impact: Number(e.target.value)
                          }
                        })}
                        placeholder="Points awarded for goal completion"
                      />
                      {(newGoal.performance_correlation?.point_impact || 0) > 50 && (
                        <div className="text-xs text-orange-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          High-impact goals require administrative approval
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateGoal}
              disabled={!newGoal.title || !newGoal.description || !newGoal.smart_criteria?.specific}
            >
              Create Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goal Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {selectedGoal?.title}
            </DialogTitle>
            <DialogDescription>
              Goal details, progress tracking, and collaboration
            </DialogDescription>
          </DialogHeader>

          {selectedGoal && (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
                <TabsTrigger value="impact">Impact</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Goal Description</h4>
                    <p className="text-sm">{selectedGoal.description}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="p-3">
                      <div className="text-sm text-muted-foreground">Status</div>
                      <Badge className={getStatusColor(selectedGoal.status)}>
                        {selectedGoal.status.replace('_', ' ')}
                      </Badge>
                    </Card>
                    <Card className="p-3">
                      <div className="text-sm text-muted-foreground">Priority</div>
                      <Badge className={getPriorityColor(selectedGoal.priority)}>
                        {selectedGoal.priority}
                      </Badge>
                    </Card>
                    <Card className="p-3">
                      <div className="text-sm text-muted-foreground">Progress</div>
                      <div className="text-lg font-semibold">{selectedGoal.progress_percentage}%</div>
                    </Card>
                    <Card className="p-3">
                      <div className="text-sm text-muted-foreground">Target Date</div>
                      <div className="text-lg font-semibold">{format(selectedGoal.target_date, 'MMM dd, yyyy')}</div>
                    </Card>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">SMART Criteria</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Specific</Label>
                        <p className="text-sm text-muted-foreground">{selectedGoal.smart_criteria.specific}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Measurable</Label>
                        <div className="space-y-1 mt-1">
                          {selectedGoal.smart_criteria.measurable.map((metric, index) => (
                            <div key={index} className="text-sm text-muted-foreground">
                              {metric.metric_name}: {metric.current_value} → {metric.target_value} {metric.unit}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Achievable</Label>
                        <p className="text-sm text-muted-foreground">{selectedGoal.smart_criteria.achievable}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Relevant</Label>
                        <p className="text-sm text-muted-foreground">{selectedGoal.smart_criteria.relevant}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="progress" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Overall Progress</h4>
                    <Progress value={selectedGoal.progress_percentage} className="mb-2" />
                    <div className="text-sm text-muted-foreground">
                      {selectedGoal.progress_percentage}% complete
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Milestones</h4>
                    <div className="space-y-3">
                      {selectedGoal.milestones.map((milestone) => (
                        <div key={milestone.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{milestone.title}</h5>
                            <Badge className={milestone.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                              {milestone.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Due: {format(milestone.due_date, 'MMM dd, yyyy')}</span>
                            {milestone.points_reward && (
                              <Badge variant="outline">+{milestone.points_reward} points</Badge>
                            )}
                          </div>
                          {milestone.status !== 'completed' && (
                            <Progress value={milestone.completion_percentage} className="mt-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="collaboration" className="space-y-4">
                <div className="space-y-4">
                  {selectedGoal.mentor_name && (
                    <div>
                      <h4 className="font-medium mb-2">Mentor</h4>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-bold">
                          {selectedGoal.mentor_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{selectedGoal.mentor_name}</div>
                          <div className="text-sm text-muted-foreground">Primary mentor</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedGoal.collaborators.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Collaborators</h4>
                      <div className="space-y-2">
                        {selectedGoal.collaborators.map((collaborator, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                                {collaborator.user_name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium">{collaborator.user_name}</div>
                                <div className="text-sm text-muted-foreground capitalize">{collaborator.role}</div>
                              </div>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {collaborator.contribution_type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-2">Communication</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Update
                      </Button>
                      <Button variant="outline" size="sm">
                        <Bell className="h-4 w-4 mr-2" />
                        Schedule Check-in
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="impact" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Organizational Alignment</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Alignment Score</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={selectedGoal.organizational_alignment.alignment_score} className="flex-1" />
                          <span className="text-sm font-medium">{selectedGoal.organizational_alignment.alignment_score}%</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Contribution</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedGoal.organizational_alignment.contribution_description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Performance Impact</h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Card className="p-3">
                        <div className="text-sm text-muted-foreground">Point Impact</div>
                        <div className="text-lg font-semibold">+{selectedGoal.performance_correlation.point_impact}</div>
                      </Card>
                      <Card className="p-3">
                        <div className="text-sm text-muted-foreground">Affects Ranking</div>
                        <div className="text-lg font-semibold">
                          {selectedGoal.performance_correlation.affects_ranking ? 'Yes' : 'No'}
                        </div>
                      </Card>
                    </div>
                  </div>

                  {selectedGoal.performance_correlation.achievement_unlocks.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Achievement Unlocks</h4>
                      <div className="flex gap-2 flex-wrap">
                        {selectedGoal.performance_correlation.achievement_unlocks.map((achievement, index) => (
                          <Badge key={index} variant="outline" className="capitalize">
                            <Trophy className="h-3 w-3 mr-1" />
                            {achievement.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}