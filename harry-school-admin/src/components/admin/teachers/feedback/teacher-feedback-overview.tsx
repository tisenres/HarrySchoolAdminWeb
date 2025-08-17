'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
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
  MessageSquare,
  Star,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Clock,
  Target,
  BarChart3,
  Activity,
  Plus,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { feedbackService } from '@/lib/services/feedback-service'
import type { TeacherFeedbackOverview, FeedbackEntry } from '@/types/feedback'
import type { TeacherWithRanking } from '@/types/ranking'

interface TeacherFeedbackOverviewProps {
  teacher: TeacherWithRanking
}

export function TeacherFeedbackOverview({ teacher }: TeacherFeedbackOverviewProps) {
  const [feedbackData, setFeedbackData] = useState<TeacherFeedbackOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadFeedbackData()
  }, [teacher.teacher_id])

  const loadFeedbackData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await feedbackService.getTeacherFeedbackOverview(teacher.teacher_id)
      setFeedbackData(data)
    } catch (err) {
      console.error('Error loading feedback data:', err)
      setError('Failed to load feedback data')
      // Fallback to mock data for demonstration
      setFeedbackData(getMockFeedbackData())
    } finally {
      setIsLoading(false)
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 3.5) return 'text-blue-600'
    if (rating >= 2.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'teaching_quality': return <Award className="h-4 w-4 text-blue-500" />
      case 'communication': return <MessageSquare className="h-4 w-4 text-green-500" />
      case 'behavior': return <Users className="h-4 w-4 text-purple-500" />
      case 'professional_development': return <Target className="h-4 w-4 text-orange-500" />
      default: return <Star className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Activity className="h-4 w-4 text-gray-500" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Unable to load feedback data
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>{error} - Showing sample data for demonstration.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!feedbackData) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Feedback Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackData.summary.total_received}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <span>Last 30 days: {feedbackData.summary.recent_count}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRatingColor(feedbackData.summary.average_rating_received)}`}>
              {feedbackData.summary.average_rating_received.toFixed(1)}
            </div>
            <div className="flex items-center space-x-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(feedbackData.summary.average_rating_received)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Student Engagement</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedbackData.student_engagement.total_students_providing_feedback}
            </div>
            <div className="text-xs text-muted-foreground">
              {Math.round(feedbackData.student_engagement.response_rate * 100)}% response rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ranking Impact</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              +{feedbackData.summary.ranking_impact.total_points_from_feedback}
            </div>
            <div className="text-xs text-muted-foreground">
              Quality score: +{feedbackData.summary.ranking_impact.quality_score_impact.toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Feedback Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">By Category</TabsTrigger>
            <TabsTrigger value="recent">Recent Feedback</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Feedback by Category</CardTitle>
              <CardDescription>Performance breakdown across different areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedbackData.summary.category_breakdown.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(category.category)}
                        <span className="text-sm font-medium capitalize">
                          {category.category.replace('_', ' ')}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {category.count} reviews
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-bold ${getRatingColor(category.rating)}`}>
                          {category.rating.toFixed(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({category.percentage.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={category.rating * 20} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Improvement Areas */}
          {feedbackData.improvement_areas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Areas for Improvement</CardTitle>
                <CardDescription>Based on recent feedback patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedbackData.improvement_areas.map((area, index) => (
                    <div key={index} className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium capitalize">
                          {area.category.replace('_', ' ')}
                        </h4>
                        <span className={`text-sm font-bold ${getRatingColor(area.average_rating)}`}>
                          {area.average_rating.toFixed(1)}/5.0
                        </span>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {area.suggested_actions.map((action, actionIndex) => (
                          <li key={actionIndex} className="flex items-start space-x-2">
                            <CheckCircle className="h-3 w-3 mt-1 text-blue-500" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {feedbackData.summary.category_breakdown.map((category) => (
              <Card key={category.category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center space-x-2">
                    {getCategoryIcon(category.category)}
                    <span className="capitalize">{category.category.replace('_', ' ')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Average Rating</span>
                      <span className={`text-lg font-bold ${getRatingColor(category.rating)}`}>
                        {category.rating.toFixed(1)}
                      </span>
                    </div>
                    <Progress value={category.rating * 20} className="h-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{category.count} reviews</span>
                      <span className="text-muted-foreground">{category.percentage.toFixed(0)}% of total</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Feedback</CardTitle>
              <CardDescription>Latest feedback received from students</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackData.recent_feedback.length > 0 ? (
                <div className="space-y-4">
                  {feedbackData.recent_feedback.map((feedback) => (
                    <div key={feedback.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < feedback.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {feedback.category.replace('_', ' ')}
                          </Badge>
                          {feedback.is_anonymous && (
                            <Badge variant="secondary" className="text-xs">
                              Anonymous
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(feedback.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{feedback.message}</p>
                      {!feedback.is_anonymous && feedback.from_user_profile && (
                        <p className="text-xs text-muted-foreground">
                          From: {feedback.from_user_profile.full_name}
                        </p>
                      )}
                      {feedback.admin_response && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                          <p className="text-sm text-blue-800">{feedback.admin_response}</p>
                          <p className="text-xs text-blue-600 mt-1">
                            Response by {feedback.responded_by_profile?.full_name} • {formatDate(feedback.responded_at!)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent feedback found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Feedback Trends</CardTitle>
              <CardDescription>Performance trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackData.feedback_trends.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Average Rating</TableHead>
                      <TableHead>Points Impact</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbackData.feedback_trends.map((trend, index) => {
                      const previousTrend = feedbackData.feedback_trends[index + 1]
                      return (
                        <TableRow key={trend.period}>
                          <TableCell>{trend.period}</TableCell>
                          <TableCell>{trend.count}</TableCell>
                          <TableCell>
                            <span className={getRatingColor(trend.rating)}>
                              {trend.rating.toFixed(1)}
                            </span>
                          </TableCell>
                          <TableCell>+{trend.points_impact}</TableCell>
                          <TableCell>
                            {previousTrend && getTrendIcon(trend.rating, previousTrend.rating)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trend data available</p>
                  <p className="text-sm">More data will appear as feedback accumulates</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Mock data for demonstration when service is not available
function getMockFeedbackData(): TeacherFeedbackOverview {
  return {
    summary: {
      total_received: 24,
      total_given: 0,
      average_rating_received: 4.3,
      average_rating_given: 0,
      recent_count: 6,
      category_breakdown: [
        { category: 'teaching_quality', rating: 4.5, count: 10, percentage: 41.7 },
        { category: 'communication', rating: 4.2, count: 8, percentage: 33.3 },
        { category: 'behavior', rating: 4.1, count: 4, percentage: 16.7 },
        { category: 'professional_development', rating: 4.0, count: 2, percentage: 8.3 }
      ],
      monthly_trends: [],
      ranking_impact: {
        total_points_from_feedback: 185,
        ranking_position_change: 2,
        quality_score_impact: 8.5,
        efficiency_impact: 5.2
      }
    },
    recent_feedback: [
      {
        id: '1',
        organization_id: 'org-1',
        from_user_id: 'student-1',
        to_user_id: 'teacher-1',
        from_user_type: 'student',
        to_user_type: 'teacher',
        message: 'Excellent teaching style, very engaging and clear explanations. Really helped me understand complex topics.',
        rating: 5,
        category: 'teaching_quality',
        is_anonymous: false,
        affects_ranking: true,
        ranking_points_impact: 25,
        status: 'active',
        created_at: '2025-01-15T10:30:00Z',
        updated_at: '2025-01-15T10:30:00Z',
        from_user_profile: {
          full_name: 'Sarah Johnson',
          user_type: 'student'
        }
      }
    ],
    feedback_trends: [
      { period: 'Jan 2025', rating: 4.3, count: 6, points_impact: 45 },
      { period: 'Dec 2024', rating: 4.1, count: 8, points_impact: 52 },
      { period: 'Nov 2024', rating: 4.0, count: 5, points_impact: 35 }
    ],
    student_engagement: {
      total_students_providing_feedback: 18,
      feedback_frequency: 1.3,
      response_rate: 0.72
    },
    improvement_areas: [
      {
        category: 'communication',
        average_rating: 4.2,
        suggested_actions: [
          'Consider providing more detailed feedback on assignments',
          'Increase frequency of one-on-one check-ins with students'
        ]
      }
    ]
  }
}