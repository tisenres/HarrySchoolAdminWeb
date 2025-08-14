'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Trophy,
  TrendingUp,
  TrendingDown,
  Award,
  DollarSign,
  Calendar,
  Activity,
  Target,
  Star,
  BookOpen,
  Users,
  Settings,
  Lightbulb,
  Clock,
  Plus,
  Eye,
  FileText,
  BarChart3,
  Medal
} from 'lucide-react'

// Import components
import { TeacherEvaluationInterface } from '@/components/admin/rankings/teacher-evaluation-interface'
import { CompensationManagement } from '@/components/admin/rankings/compensation-management'

// Import types
import { 
  TeacherWithRanking, 
  PointsTransaction, 
  StudentAchievement,
  CompensationAdjustment,
  TeacherEvaluationSession
} from '@/types/ranking'

interface TeacherPerformanceTabProps {
  teacher: TeacherWithRanking
}

export function TeacherPerformanceTab({ teacher }: TeacherPerformanceTabProps) {
  const t = useTranslations('rankings')
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState('overview')

  // Mock data (will be replaced with real API calls)
  const [performanceHistory] = useState<TeacherEvaluationSession[]>([
    {
      id: '1',
      teacher_id: teacher.teacher_id,
      evaluator_id: 'admin-1',
      evaluation_period_start: '2025-01-01',
      evaluation_period_end: '2025-01-31',
      criteria_scores: [
        { criteria_id: '1', criteria_name: 'Teaching Quality', score: 92, max_points: 100, weight_percentage: 30, notes: 'Excellent student engagement' },
        { criteria_id: '2', criteria_name: 'Student Performance', score: 88, max_points: 100, weight_percentage: 25, notes: 'Good improvement in test scores' },
        { criteria_id: '3', criteria_name: 'Professional Development', score: 95, max_points: 100, weight_percentage: 20, notes: 'Completed advanced training' },
        { criteria_id: '4', criteria_name: 'Administrative Tasks', score: 85, max_points: 100, weight_percentage: 15, notes: 'Timely submissions' },
        { criteria_id: '5', criteria_name: 'Collaboration', score: 90, max_points: 100, weight_percentage: 10, notes: 'Great teamwork' }
      ],
      overall_score: 90.2,
      efficiency_percentage: 87.5,
      quality_score: 90.4,
      performance_tier: 'excellent',
      compensation_recommendation: {
        adjustment_type: 'bonus',
        amount: 1500,
        justification: 'Excellent performance with outstanding student engagement'
      },
      created_at: '2025-02-01T10:00:00Z',
      updated_at: '2025-02-01T10:00:00Z'
    }
  ])

  const [recentTransactions] = useState<PointsTransaction[]>([
    {
      id: '1',
      user_id: teacher.teacher_id,
      organization_id: 'org-1',
      user_type: 'teacher',
      transaction_type: 'earned',
      points_amount: 25,
      coins_earned: 12,
      reason: 'Outstanding Teaching Performance',
      category: 'teaching_quality',
      awarded_by: 'admin-1',
      efficiency_impact: 5,
      quality_impact: 8,
      affects_salary: true,
      monetary_impact: 50,
      created_at: '2025-02-01T14:30:00Z',
      awarded_by_profile: {
        full_name: 'Admin User'
      }
    },
    {
      id: '2',
      user_id: teacher.teacher_id,
      organization_id: 'org-1',
      user_type: 'teacher',
      transaction_type: 'bonus',
      points_amount: 15,
      coins_earned: 7,
      reason: 'Innovation in Teaching Methods',
      category: 'professional_development',
      awarded_by: 'admin-1',
      efficiency_impact: 2,
      quality_impact: 6,
      affects_salary: false,
      created_at: '2025-01-28T09:15:00Z',
      awarded_by_profile: {
        full_name: 'Admin User'
      }
    }
  ])

  const [recentAchievements] = useState<StudentAchievement[]>([
    {
      id: '1',
      student_id: teacher.teacher_id, // Using teacher_id as user_id for teacher achievements
      achievement_id: 'ach-1',
      organization_id: 'org-1',
      earned_at: '2025-01-25T16:00:00Z',
      awarded_by: 'admin-1',
      notes: 'Exceptional student feedback scores',
      achievement: {
        id: 'ach-1',
        organization_id: 'org-1',
        name: 'Outstanding Teaching',
        description: 'Exceptional teaching performance with student satisfaction > 95%',
        icon: 'award',
        badge_color: 'gold',
        points_required: 100,
        coins_reward: 50,
        bonus_points: 25,
        achievement_type: 'teaching_quality',
        target_user_type: 'teacher',
        professional_development: false,
        is_active: true,
        created_by: 'admin-1',
        created_at: '2025-01-01',
        updated_at: '2025-01-01'
      }
    }
  ])

  // Performance metrics calculation
  const currentRanking = teacher.ranking
  const performanceMetrics = {
    totalPoints: currentRanking?.total_points || 0,
    currentLevel: currentRanking?.current_level || 1,
    currentRank: currentRanking?.current_rank || 0,
    efficiencyPercentage: currentRanking?.efficiency_percentage || 0,
    qualityScore: currentRanking?.quality_score || 0,
    performanceTier: currentRanking?.performance_tier || 'standard'
  }

  const getPerformanceTierColor = (tier?: string) => {
    switch (tier) {
      case 'outstanding': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200'
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Activity className="h-4 w-4 text-gray-500" />
  }

  const getCriteriaIcon = (criteriaName: string) => {
    switch (criteriaName.toLowerCase()) {
      case 'teaching quality': return <BookOpen className="h-4 w-4 text-blue-500" />
      case 'student performance': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'professional development': return <Lightbulb className="h-4 w-4 text-yellow-500" />
      case 'administrative tasks': return <Settings className="h-4 w-4 text-gray-500" />
      case 'collaboration': return <Users className="h-4 w-4 text-purple-500" />
      default: return <Star className="h-4 w-4" />
    }
  }

  const handleNewEvaluation = async (evaluation: Omit<TeacherEvaluationSession, 'id' | 'created_at' | 'updated_at'>) => {
    console.log('New evaluation submitted:', evaluation)
    // In real implementation, this would call the API
    setShowEvaluationDialog(false)
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {performanceHistory[0]?.overall_score?.toFixed(1) || '0.0'}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(90.2, 85.5)}
              <span>+4.7 from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {performanceMetrics.efficiencyPercentage.toFixed(1)}%
            </div>
            <Progress value={performanceMetrics.efficiencyPercentage} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {performanceMetrics.qualityScore.toFixed(1)}
            </div>
            <Progress value={performanceMetrics.qualityScore} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Tier</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={`${getPerformanceTierColor(performanceMetrics.performanceTier)} text-sm`}>
              {performanceMetrics.performanceTier.charAt(0).toUpperCase() + performanceMetrics.performanceTier.slice(1)}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Rank #{performanceMetrics.currentRank || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Management Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
            <TabsTrigger value="transactions">Point History</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>
          
          <Button onClick={() => setShowEvaluationDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Evaluation
          </Button>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Activity Summary */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Points */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Points</CardTitle>
                <CardDescription>Latest point awards and transactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentTransactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      <Award className="h-4 w-4 text-blue-500 mt-1" />
                      <div>
                        <p className="text-sm font-medium">{transaction.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.category} • {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                        {transaction.affects_salary && transaction.monetary_impact && (
                          <Badge variant="outline" className="text-xs mt-1">
                            <DollarSign className="h-2 w-2 mr-1" />
                            ${transaction.monetary_impact}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        +{transaction.points_amount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        points
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Achievements</CardTitle>
                <CardDescription>Unlocked badges and recognition</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentAchievements.slice(0, 3).map((achievement) => (
                  <div key={achievement.id} className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Medal className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{achievement.achievement?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {achievement.achievement?.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(achievement.earned_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      +{achievement.achievement?.coins_reward} coins
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Performance Breakdown */}
          {performanceHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Latest Evaluation Breakdown</CardTitle>
                <CardDescription>
                  Performance across evaluation criteria from {performanceHistory[0].evaluation_period_start} to {performanceHistory[0].evaluation_period_end}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceHistory[0].criteria_scores.map((criteria) => (
                    <div key={criteria.criteria_id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getCriteriaIcon(criteria.criteria_name)}
                          <span className="text-sm font-medium">{criteria.criteria_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {criteria.weight_percentage}% weight
                          </Badge>
                        </div>
                        <span className="text-sm font-bold">
                          {criteria.score}/{criteria.max_points}
                        </span>
                      </div>
                      <Progress value={criteria.score} className="h-2" />
                      {criteria.notes && (
                        <p className="text-xs text-muted-foreground ml-6">
                          {criteria.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Evaluations</CardTitle>
              <CardDescription>Historical performance evaluation results</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Overall Score</TableHead>
                      <TableHead>Efficiency</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Compensation</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceHistory.map((evaluation) => (
                      <TableRow key={evaluation.id}>
                        <TableCell>
                          <div className="text-sm">
                            {evaluation.evaluation_period_start} - {evaluation.evaluation_period_end}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-blue-600">
                            {evaluation.overall_score.toFixed(1)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-green-600">
                            {evaluation.efficiency_percentage.toFixed(1)}%
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-purple-600">
                            {evaluation.quality_score.toFixed(1)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPerformanceTierColor(evaluation.performance_tier)}>
                            {evaluation.performance_tier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {evaluation.compensation_recommendation ? (
                            <Badge variant="outline" className="text-green-600">
                              <DollarSign className="h-3 w-3 mr-1" />
                              ${evaluation.compensation_recommendation.amount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No evaluations found</p>
                  <p className="text-sm">Create a new evaluation to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Point Transaction History</CardTitle>
              <CardDescription>All point awards, bonuses, and deductions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Impact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={transaction.transaction_type === 'earned' ? 'default' : 'secondary'}
                        >
                          {transaction.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-green-600">
                          +{transaction.points_amount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{transaction.reason}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground capitalize">
                          {transaction.category.replace('_', ' ')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          <div>Efficiency: +{transaction.efficiency_impact}</div>
                          <div>Quality: +{transaction.quality_impact}</div>
                          {transaction.affects_salary && (
                            <Badge variant="outline" className="text-xs">
                              <DollarSign className="h-2 w-2 mr-1" />
                              ${transaction.monetary_impact}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Professional Achievements</CardTitle>
              <CardDescription>Recognition and badges earned for teaching excellence</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentAchievements.map((achievement) => (
                  <Card key={achievement.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                          <Medal className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{achievement.achievement?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {achievement.achievement?.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              +{achievement.achievement?.coins_reward} coins
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(achievement.earned_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Evaluation Dialog */}
      {showEvaluationDialog && (
        <TeacherEvaluationInterface
          open={showEvaluationDialog}
          onOpenChange={setShowEvaluationDialog}
          teacher={teacher}
          evaluationPeriod={{
            start: new Date().toISOString().split('T')[0],
            end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }}
          onSubmit={handleNewEvaluation}
        />
      )}
    </div>
  )
}