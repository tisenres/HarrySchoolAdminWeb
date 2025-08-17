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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  DollarSign,
  Calculator,
  TrendingUp,
  Users,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Target,
  Briefcase,
  PieChart,
  BarChart3,
  Eye,
  Plus,
  Edit,
  Download,
  Calendar,
  Star,
  GraduationCap,
  Brain,
  Heart,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Lock,
  Unlock
} from 'lucide-react'
import type { TeacherWithRanking, CompensationAdjustment } from '@/types/ranking'

// Compensation calculation types
interface CompensationCalculation {
  teacher_id: string
  base_salary: number
  performance_score: number
  efficiency_percentage: number
  quality_score: number
  student_correlation: number
  performance_tier: 'standard' | 'good' | 'excellent' | 'outstanding'
  time_period: 'quarterly' | 'annual'
  
  // Calculated values
  performance_multiplier: number
  correlation_multiplier: number
  tier_multiplier: number
  bonus_amount: number
  salary_adjustment: number
  total_compensation_change: number
  
  // Budget impact
  budget_impact: number
  organization_budget_percentage: number
}

interface CompensationApproval {
  id: string
  teacher_id: string
  teacher_name: string
  adjustment_type: 'bonus' | 'salary_increase' | 'performance_award'
  amount: number
  justification: string
  performance_metrics: {
    efficiency: number
    quality: number
    correlation: number
    tier: string
  }
  requested_by: string
  status: 'pending' | 'approved' | 'rejected' | 'requires_superadmin'
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
  notes?: string
}

interface BudgetConstraints {
  total_budget: number
  allocated_budget: number
  remaining_budget: number
  compensation_budget_percentage: number
  max_individual_adjustment: number
  requires_approval_threshold: number
}

export function TeacherCompensationSystem() {
  const [selectedTeacher, setSelectedTeacher] = useState<string>('')
  const [calculationType, setCalculationType] = useState<'quarterly' | 'annual'>('quarterly')
  const [compensationCalculation, setCompensationCalculation] = useState<CompensationCalculation | null>(null)
  const [showCalculator, setShowCalculator] = useState(false)
  const [showApprovalQueue, setShowApprovalQueue] = useState(false)
  const [pendingApprovals, setPendingApprovals] = useState<CompensationApproval[]>([])
  const [budgetConstraints, setBudgetConstraints] = useState<BudgetConstraints | null>(null)
  const [loading, setLoading] = useState(false)

  // Mock data - Replace with actual API calls
  const [teachers] = useState<TeacherWithRanking[]>([
    {
      id: 't1',
      user_id: 't1',
      teacher_id: 't1',
      user_type: 'teacher',
      full_name: 'Sarah Johnson',
      efficiency_percentage: 95,
      quality_score: 88,
      performance_tier: 'excellent',
      ranking: {
        id: 'r1',
        user_id: 't1',
        organization_id: 'org1',
        user_type: 'teacher',
        total_points: 1250,
        available_coins: 125,
        spent_coins: 25,
        current_level: 8,
        current_rank: 2,
        efficiency_percentage: 95,
        quality_score: 88,
        performance_tier: 'excellent',
        created_at: '2024-01-01',
        updated_at: '2024-03-15'
      }
    },
    {
      id: 't2',
      user_id: 't2',
      teacher_id: 't2',
      user_type: 'teacher',
      full_name: 'Michael Chen',
      efficiency_percentage: 87,
      quality_score: 82,
      performance_tier: 'good',
      ranking: {
        id: 'r2',
        user_id: 't2',
        organization_id: 'org1',
        user_type: 'teacher',
        total_points: 980,
        available_coins: 98,
        spent_coins: 12,
        current_level: 6,
        current_rank: 5,
        efficiency_percentage: 87,
        quality_score: 82,
        performance_tier: 'good',
        created_at: '2024-01-01',
        updated_at: '2024-03-15'
      }
    },
    {
      id: 't3',
      user_id: 't3',
      teacher_id: 't3',
      user_type: 'teacher',
      full_name: 'Emma Rodriguez',
      efficiency_percentage: 92,
      quality_score: 85,
      performance_tier: 'excellent',
      ranking: {
        id: 'r3',
        user_id: 't3',
        organization_id: 'org1',
        user_type: 'teacher',
        total_points: 1180,
        available_coins: 118,
        spent_coins: 22,
        current_level: 7,
        current_rank: 3,
        efficiency_percentage: 92,
        quality_score: 85,
        performance_tier: 'excellent',
        created_at: '2024-01-01',
        updated_at: '2024-03-15'
      }
    }
  ])

  // Initialize budget constraints
  useEffect(() => {
    setBudgetConstraints({
      total_budget: 500000,
      allocated_budget: 320000,
      remaining_budget: 180000,
      compensation_budget_percentage: 64,
      max_individual_adjustment: 15000,
      requires_approval_threshold: 5000
    })

    // Mock pending approvals
    setPendingApprovals([
      {
        id: 'ca1',
        teacher_id: 't1',
        teacher_name: 'Sarah Johnson',
        adjustment_type: 'bonus',
        amount: 3500,
        justification: 'Exceptional student success correlation and teaching excellence',
        performance_metrics: {
          efficiency: 95,
          quality: 88,
          correlation: 0.84,
          tier: 'excellent'
        },
        requested_by: 'admin1',
        status: 'pending',
        created_at: '2024-03-15T10:00:00Z'
      },
      {
        id: 'ca2',
        teacher_id: 't2',
        teacher_name: 'Michael Chen',
        adjustment_type: 'salary_increase',
        amount: 8500,
        justification: 'Consistent performance improvement and student engagement',
        performance_metrics: {
          efficiency: 87,
          quality: 82,
          correlation: 0.78,
          tier: 'good'
        },
        requested_by: 'admin1',
        status: 'requires_superadmin',
        created_at: '2024-03-14T14:30:00Z'
      }
    ])
  }, [])

  const calculateCompensation = (teacherId: string, timePeriod: 'quarterly' | 'annual'): CompensationCalculation => {
    const teacher = teachers.find(t => t.teacher_id === teacherId)
    if (!teacher || !teacher.ranking) {
      throw new Error('Teacher not found or missing ranking data')
    }

    // Base salary (mock data)
    const baseSalary = 50000 // Should come from teacher's actual salary data

    // Performance calculation
    const performanceScore = (teacher.efficiency_percentage! + teacher.quality_score!) / 2
    const studentCorrelation = 0.84 // Mock correlation data - should come from analytics

    // Multipliers based on performance tier
    const tierMultipliers = {
      outstanding: 1.15, // +15%
      excellent: 1.08,   // +8%
      good: 1.03,        // +3%
      standard: 1.0      // 0%
    }

    // Calculate multipliers
    const performanceMultiplier = performanceScore / 100
    const correlationMultiplier = studentCorrelation
    const tierMultiplier = tierMultipliers[teacher.performance_tier!]
    const timePeriodMultiplier = timePeriod === 'quarterly' ? 0.25 : 1.0

    // Calculate bonus: base salary × (performance score / 100) × student correlation × time period
    const bonusAmount = baseSalary * performanceMultiplier * correlationMultiplier * timePeriodMultiplier

    // Calculate salary adjustment based on tier
    const salaryAdjustment = baseSalary * (tierMultiplier - 1.0)

    // Total compensation change
    const totalCompensationChange = bonusAmount + salaryAdjustment

    // Budget impact
    const budgetImpact = totalCompensationChange
    const organizationBudgetPercentage = budgetConstraints ? 
      (budgetImpact / budgetConstraints.total_budget) * 100 : 0

    return {
      teacher_id: teacherId,
      base_salary: baseSalary,
      performance_score: performanceScore,
      efficiency_percentage: teacher.efficiency_percentage!,
      quality_score: teacher.quality_score!,
      student_correlation: studentCorrelation,
      performance_tier: teacher.performance_tier!,
      time_period: timePeriod,
      performance_multiplier: performanceMultiplier,
      correlation_multiplier: correlationMultiplier,
      tier_multiplier: tierMultiplier,
      bonus_amount: bonusAmount,
      salary_adjustment: salaryAdjustment,
      total_compensation_change: totalCompensationChange,
      budget_impact: budgetImpact,
      organization_budget_percentage: organizationBudgetPercentage
    }
  }

  const handleCalculateCompensation = () => {
    if (!selectedTeacher) return

    setLoading(true)
    try {
      const calculation = calculateCompensation(selectedTeacher, calculationType)
      setCompensationCalculation(calculation)
    } catch (error) {
      console.error('Error calculating compensation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitForApproval = async (calculation: CompensationCalculation, justification: string) => {
    const teacher = teachers.find(t => t.teacher_id === calculation.teacher_id)
    if (!teacher) return

    const requiresSuperadmin = calculation.total_compensation_change > (budgetConstraints?.requires_approval_threshold || 5000)

    const newApproval: CompensationApproval = {
      id: `ca${Date.now()}`,
      teacher_id: calculation.teacher_id,
      teacher_name: teacher.full_name,
      adjustment_type: calculation.salary_adjustment > calculation.bonus_amount ? 'salary_increase' : 'bonus',
      amount: calculation.total_compensation_change,
      justification,
      performance_metrics: {
        efficiency: calculation.efficiency_percentage,
        quality: calculation.quality_score,
        correlation: calculation.student_correlation,
        tier: calculation.performance_tier
      },
      requested_by: 'current_admin',
      status: requiresSuperadmin ? 'requires_superadmin' : 'pending',
      created_at: new Date().toISOString()
    }

    setPendingApprovals(prev => [newApproval, ...prev])
    setCompensationCalculation(null)
    setSelectedTeacher('')
  }

  const getPerformanceTierColor = (tier: string) => {
    switch (tier) {
      case 'outstanding': return 'bg-purple-100 text-purple-800'
      case 'excellent': return 'bg-green-100 text-green-800'
      case 'good': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'requires_superadmin': return 'bg-orange-100 text-orange-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Teacher Compensation Management
              </CardTitle>
              <CardDescription>
                Performance-based compensation tracking and approval system
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCalculator(true)}>
                <Calculator className="h-4 w-4 mr-2" />
                Calculator
              </Button>
              <Button variant="outline" onClick={() => setShowApprovalQueue(true)}>
                <Clock className="h-4 w-4 mr-2" />
                Approval Queue ({pendingApprovals.filter(a => a.status === 'pending' || a.status === 'requires_superadmin').length})
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Budget Overview */}
      {budgetConstraints && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Budget Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  ${budgetConstraints.total_budget.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Budget</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  ${budgetConstraints.allocated_budget.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Allocated</div>
                <div className="text-xs text-muted-foreground">
                  {budgetConstraints.compensation_budget_percentage}% of total
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  ${budgetConstraints.remaining_budget.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Remaining</div>
                <div className="text-xs text-muted-foreground">
                  {((budgetConstraints.remaining_budget / budgetConstraints.total_budget) * 100).toFixed(1)}% available
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  ${budgetConstraints.max_individual_adjustment.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Max Individual</div>
                <div className="text-xs text-muted-foreground">
                  Adjustment limit
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calculations">Calculations</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="transparency">Transparency</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Teacher Performance & Compensation Overview
              </CardTitle>
              <CardDescription>
                Performance metrics and compensation eligibility for all teachers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teachers.map((teacher) => {
                  const calculation = calculateCompensation(teacher.teacher_id, 'quarterly')
                  return (
                    <div key={teacher.teacher_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {teacher.full_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold">{teacher.full_name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getPerformanceTierColor(teacher.performance_tier!)}>
                              {teacher.performance_tier?.charAt(0).toUpperCase() + teacher.performance_tier?.slice(1)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Performance: {((teacher.efficiency_percentage! + teacher.quality_score!) / 2).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            +${calculation.bonus_amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Quarterly Bonus</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            +${calculation.salary_adjustment.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Salary Adjustment</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">
                            +${calculation.total_compensation_change.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Total Change</div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTeacher(teacher.teacher_id)
                            setShowCalculator(true)
                          }}
                        >
                          <Calculator className="h-4 w-4 mr-2" />
                          Calculate
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculations Tab */}
        <TabsContent value="calculations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Compensation Methodology
              </CardTitle>
              <CardDescription>
                Transparent calculation showing how performance translates to compensation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Methodology Explanation */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Bonus Calculation Formula</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-mono bg-gray-50 p-3 rounded">
                      Bonus = Base Salary × (Performance / 100) × Correlation × Time Period
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      <div>• Performance: (Efficiency + Quality) / 2</div>
                      <div>• Correlation: Student success correlation (0.0-1.0)</div>
                      <div>• Time Period: 0.25 (quarterly) or 1.0 (annual)</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Salary Adjustment by Tier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Outstanding:</span>
                        <span className="font-semibold text-purple-600">+15%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Excellent:</span>
                        <span className="font-semibold text-green-600">+8%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Good:</span>
                        <span className="font-semibold text-blue-600">+3%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Standard:</span>
                        <span className="font-semibold text-gray-600">0%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Thresholds */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Performance Thresholds</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">95%+</div>
                      <div className="text-sm text-muted-foreground">Outstanding</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">85-94%</div>
                      <div className="text-sm text-muted-foreground">Excellent</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">75-84%</div>
                      <div className="text-sm text-muted-foreground">Good</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-600">Below 75%</div>
                      <div className="text-sm text-muted-foreground">Standard</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compensation Approval Queue
              </CardTitle>
              <CardDescription>
                Pending compensation adjustments requiring authorization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.filter(approval => 
                  approval.status === 'pending' || approval.status === 'requires_superadmin'
                ).map((approval) => (
                  <div key={approval.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-bold">
                          {approval.teacher_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold">{approval.teacher_name}</h4>
                          <p className="text-sm text-muted-foreground capitalize">
                            {approval.adjustment_type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            +${approval.amount.toLocaleString()}
                          </div>
                          <Badge className={getApprovalStatusColor(approval.status)}>
                            {approval.status === 'requires_superadmin' ? 'Needs Superadmin' : 'Pending Review'}
                          </Badge>
                        </div>
                        {approval.status === 'requires_superadmin' ? (
                          <Lock className="h-5 w-5 text-orange-600" />
                        ) : (
                          <Unlock className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                    </div>
                    
                    <div className="grid gap-3 md:grid-cols-2 mb-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Performance Metrics</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            Efficiency: {approval.performance_metrics.efficiency}%
                          </Badge>
                          <Badge variant="outline">
                            Quality: {approval.performance_metrics.quality}%
                          </Badge>
                          <Badge className={getPerformanceTierColor(approval.performance_metrics.tier)}>
                            {approval.performance_metrics.tier.charAt(0).toUpperCase() + approval.performance_metrics.tier.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Student Correlation</Label>
                        <div className="text-lg font-semibold">
                          {(approval.performance_metrics.correlation * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <Label className="text-xs text-muted-foreground">Justification</Label>
                      <p className="text-sm mt-1">{approval.justification}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Requested by {approval.requested_by} on {new Date(approval.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                        <Button variant="destructive" size="sm">
                          Reject
                        </Button>
                        <Button size="sm" disabled={approval.status === 'requires_superadmin'}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {pendingApprovals.filter(a => a.status === 'pending' || a.status === 'requires_superadmin').length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Pending Approvals</h3>
                    <p className="text-muted-foreground">
                      All compensation adjustments have been processed.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transparency Tab */}
        <TabsContent value="transparency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Compensation Transparency
              </CardTitle>
              <CardDescription>
                Clear explanation of compensation methodology for teachers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fair Compensation Analysis */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Compensation Equity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">94.2%</div>
                    <p className="text-xs text-muted-foreground">
                      Fair compensation distribution across performance levels
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Performance Recognition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">87.5%</div>
                    <p className="text-xs text-muted-foreground">
                      Teachers receiving performance-based compensation
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Goal Achievement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">78%</div>
                    <p className="text-xs text-muted-foreground">
                      Teachers meeting compensation goals
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Goal Setting Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Performance Goals & Compensation Targets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Efficiency Target: 90%+</div>
                        <div className="text-sm text-muted-foreground">Unlock higher tier compensation</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">+$5,000</div>
                        <div className="text-xs text-muted-foreground">Annual bonus potential</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Student Correlation: 0.8+</div>
                        <div className="text-sm text-muted-foreground">Strong student success correlation</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">+$3,500</div>
                        <div className="text-xs text-muted-foreground">Quarterly bonus boost</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Professional Development</div>
                        <div className="text-sm text-muted-foreground">Complete certification or training</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-600">+$2,000</div>
                        <div className="text-xs text-muted-foreground">Development bonus</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Compensation Calculator Dialog */}
      <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Compensation Calculator
            </DialogTitle>
            <DialogDescription>
              Calculate compensation adjustments based on performance metrics
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Select Teacher</Label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.teacher_id} value={teacher.teacher_id}>
                        {teacher.full_name} - {teacher.performance_tier?.charAt(0).toUpperCase() + teacher.performance_tier?.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Calculation Period</Label>
                <Select value={calculationType} onValueChange={(value: any) => setCalculationType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center">
              <Button onClick={handleCalculateCompensation} disabled={!selectedTeacher || loading}>
                {loading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Compensation
                  </>
                )}
              </Button>
            </div>

            {compensationCalculation && (
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="text-lg">Compensation Calculation Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm text-muted-foreground">Performance Metrics</Label>
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between">
                          <span>Efficiency:</span>
                          <span className="font-semibold">{compensationCalculation.efficiency_percentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quality Score:</span>
                          <span className="font-semibold">{compensationCalculation.quality_score}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Student Correlation:</span>
                          <span className="font-semibold">{(compensationCalculation.student_correlation * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Performance Tier:</span>
                          <Badge className={getPerformanceTierColor(compensationCalculation.performance_tier)}>
                            {compensationCalculation.performance_tier.charAt(0).toUpperCase() + compensationCalculation.performance_tier.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-muted-foreground">Compensation Breakdown</Label>
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between">
                          <span>Base Salary:</span>
                          <span className="font-semibold">${compensationCalculation.base_salary.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Performance Bonus:</span>
                          <span className="font-semibold text-green-600">+${compensationCalculation.bonus_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Salary Adjustment:</span>
                          <span className="font-semibold text-blue-600">+${compensationCalculation.salary_adjustment.toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="font-semibold">Total Change:</span>
                          <span className="font-bold text-green-600">+${compensationCalculation.total_compensation_change.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="p-3">
                      <div className="text-sm text-muted-foreground">Budget Impact</div>
                      <div className="text-lg font-bold">${compensationCalculation.budget_impact.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {compensationCalculation.organization_budget_percentage.toFixed(2)}% of organization budget
                      </div>
                    </Card>
                    
                    <div className="flex items-center gap-2">
                      {compensationCalculation.total_compensation_change > (budgetConstraints?.requires_approval_threshold || 5000) && (
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      )}
                      <span className="text-sm">
                        {compensationCalculation.total_compensation_change > (budgetConstraints?.requires_approval_threshold || 5000) 
                          ? 'Requires superadmin approval' 
                          : 'Can be approved by admin'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Justification</Label>
                    <Textarea 
                      placeholder="Provide justification for this compensation adjustment..."
                      className="min-h-20"
                      id="justification"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalculator(false)}>
              Cancel
            </Button>
            {compensationCalculation && (
              <Button 
                onClick={() => {
                  const justification = (document.getElementById('justification') as HTMLTextAreaElement)?.value || ''
                  handleSubmitForApproval(compensationCalculation, justification)
                  setShowCalculator(false)
                }}
              >
                Submit for Approval
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}