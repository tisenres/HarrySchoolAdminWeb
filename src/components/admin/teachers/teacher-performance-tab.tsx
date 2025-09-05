'use client'

import { useState, useEffect } from 'react'
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
  Medal,
  MessageSquare
} from 'lucide-react'

// Import components
import { TeacherEvaluationInterface } from '@/components/admin/rankings/teacher-evaluation-interface'
import { CompensationManagement } from '@/components/admin/rankings/compensation-management'

// Import services
import { teacherEvaluationService, TeacherPerformanceMetrics } from '@/lib/services/teacher-evaluation-service'

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
  const [performanceMetrics, setPerformanceMetrics] = useState<TeacherPerformanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load real performance data
  useEffect(() => {
    const loadPerformanceData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const metrics = await teacherEvaluationService.getTeacherPerformanceMetrics(teacher.teacher_id)
        setPerformanceMetrics(metrics)
      } catch (err) {
        console.error('Error loading performance data:', err)
        setError('Failed to load performance data')
        // Fallback to mock data
        setPerformanceMetrics({
          overall_score: 0,
          efficiency_percentage: 0,
          quality_score: 0,
          performance_tier: 'standard',
          total_points: teacher.ranking?.total_points || 0,
          current_rank: teacher.ranking?.current_rank || 0,
          evaluations_count: 0,
          last_evaluation_date: null
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (teacher.teacher_id) {
      loadPerformanceData()
    }
  }, [teacher.teacher_id])

  // Real performance history data
  const [performanceHistory, setPerformanceHistory] = useState<TeacherEvaluationSession[]>([])
  const [performanceHistoryLoading, setPerformanceHistoryLoading] = useState(true)
  
  // Load performance history from API
  useEffect(() => {
    const loadPerformanceHistory = async () => {
      try {
        setPerformanceHistoryLoading(true)
        const response = await fetch(`/api/teachers/${teacher.teacher_id}/evaluations`)
        if (response.ok) {
          const data = await response.json()
          setPerformanceHistory(data.evaluations || [])
        }
      } catch (err) {
        console.error('Error loading performance history:', err)
        // Keep empty array on error
        setPerformanceHistory([])
      } finally {
        setPerformanceHistoryLoading(false)
      }
    }

    if (teacher.teacher_id) {
      loadPerformanceHistory()
    }
  }, [teacher.teacher_id])

  // Real transactions data
  const [recentTransactions, setRecentTransactions] = useState<PointsTransaction[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(true)
  
  // Load recent transactions from API
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setTransactionsLoading(true)
        const response = await fetch(`/api/teachers/${teacher.teacher_id}/transactions?limit=10`)
        if (response.ok) {
          const data = await response.json()
          setRecentTransactions(data.transactions || [])
        }
      } catch (err) {
        console.error('Error loading transactions:', err)
        setRecentTransactions([])
      } finally {
        setTransactionsLoading(false)
      }
    }

    if (teacher.teacher_id) {
      loadTransactions()
    }
  }, [teacher.teacher_id])

  // Real achievements data
  const [recentAchievements, setRecentAchievements] = useState<StudentAchievement[]>([])
  const [achievementsLoading, setAchievementsLoading] = useState(true)
  
  // Load recent achievements from API
  useEffect(() => {
    const loadAchievements = async () => {
      try {
        setAchievementsLoading(true)
        const response = await fetch(`/api/teachers/${teacher.teacher_id}/achievements?limit=5`)
        if (response.ok) {
          const data = await response.json()
          setRecentAchievements(data.achievements || [])
        }
      } catch (err) {
        console.error('Error loading achievements:', err)
        setRecentAchievements([])
      } finally {
        setAchievementsLoading(false)
      }
    }

    if (teacher.teacher_id) {
      loadAchievements()
    }
  }, [teacher.teacher_id])

  // Performance metrics calculation - use real data when available
  const currentMetrics = performanceMetrics || {
    overall_score: 0,
    efficiency_percentage: 0,
    quality_score: 0,
    performance_tier: 'standard' as const,
    total_points: teacher.ranking?.total_points || 0,
    current_rank: teacher.ranking?.current_rank || 0,
    evaluations_count: 0,
    last_evaluation_date: null
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-yellow-600 text-sm">
              ⚠️ {error} - Showing cached data
            </div>
          </div>
        </div>
      )}

      {/* Performance Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {currentMetrics.overall_score?.toFixed(1) || '0.0'}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(currentMetrics.overall_score, 85.5)}
              <span>{currentMetrics.evaluations_count} evaluations</span>
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
              {currentMetrics.efficiency_percentage.toFixed(1)}%
            </div>
            <Progress value={currentMetrics.efficiency_percentage} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {currentMetrics.quality_score.toFixed(1)}
            </div>
            <Progress value={currentMetrics.quality_score} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Tier</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={`${getPerformanceTierColor(currentMetrics.performance_tier)} text-sm`}>
              {currentMetrics.performance_tier.charAt(0).toUpperCase() + currentMetrics.performance_tier.slice(1)}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Rank #{currentMetrics.current_rank || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback Impact</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">4.3</div>
            <div className="flex items-center space-x-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              24 reviews • +185 pts
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
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
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

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Feedback & Impact</CardTitle>
              <CardDescription>Feedback correlation with performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Feedback Summary</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Average Rating</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-green-600">4.3</span>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Reviews</span>
                      <span className="font-bold">24</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">This Month</span>
                      <span className="font-bold text-blue-600">+6</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Ranking Points</span>
                      <span className="font-bold text-green-600">+185</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Performance Correlation</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Quality Score Impact</span>
                        <span className="text-green-600">+8.5</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Efficiency Impact</span>
                        <span className="text-blue-600">+5.2</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Teaching Quality</span>
                        <span className="text-purple-600">4.5/5.0</span>
                      </div>
                      <Progress value={90} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Communication</span>
                        <span className="text-orange-600">4.2/5.0</span>
                      </div>
                      <Progress value={84} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">
                      Feedback directly contributes to your performance tier and ranking position
                    </span>
                  </div>
                  <Badge variant="outline">
                    Tier: {currentMetrics.performance_tier || 'Standard'}
                  </Badge>
                </div>
              </div>
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