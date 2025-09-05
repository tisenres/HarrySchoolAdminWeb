'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Target,
  Clock,
  DollarSign,
  BookOpen,
  Medal,
  Star,
  Activity,
  MessageSquare,
  Heart,
  ThumbsUp,
  AlertCircle
} from 'lucide-react'

// Import types
import { RankingAnalytics } from '@/types/ranking'
import { FeedbackAnalytics } from '@/types/feedback'

interface RankingsAnalyticsDashboardProps {
  userTypeFilter: 'student' | 'teacher' | 'combined'
}

export function RankingsAnalyticsDashboard({ userTypeFilter }: RankingsAnalyticsDashboardProps) {
  const t = useTranslations('rankings')
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month')
  const [isLoading, setIsLoading] = useState(false)

  // Mock analytics data (will be replaced with real API calls)
  const [analyticsData] = useState<RankingAnalytics>({
    total_points_awarded: 15420,
    total_users_participating: 245,
    total_students_participating: 220,
    total_teachers_participating: 25,
    average_points_per_user: 62.9,
    average_points_per_student: 58.2,
    average_points_per_teacher: 128.7,
    most_active_day: 'Wednesday',
    top_performers: [],
    top_students: [],
    top_teachers: [],
    recent_activity: [],
    achievement_distribution: [
      { achievement_id: '1', achievement_name: 'Perfect Attendance', times_earned: 45, user_type: 'student' },
      { achievement_id: '2', achievement_name: 'Homework Master', times_earned: 38, user_type: 'student' },
      { achievement_id: '3', achievement_name: 'Outstanding Teaching', times_earned: 8, user_type: 'teacher' },
      { achievement_id: '4', achievement_name: 'Class Participation', times_earned: 62, user_type: 'student' },
      { achievement_id: '5', achievement_name: 'Innovation Leader', times_earned: 5, user_type: 'teacher' }
    ],
    points_by_category: [
      { category: 'homework', total_points: 4200, transaction_count: 168, user_type: 'student' },
      { category: 'attendance', total_points: 2850, transaction_count: 285, user_type: 'student' },
      { category: 'participation', total_points: 3100, transaction_count: 155, user_type: 'student' },
      { category: 'teaching_quality', total_points: 1850, transaction_count: 37, user_type: 'teacher' },
      { category: 'professional_development', total_points: 980, transaction_count: 28, user_type: 'teacher' },
      { category: 'administrative', total_points: 640, transaction_count: 32, user_type: 'teacher' }
    ],
    teacher_performance_metrics: {
      average_efficiency: 89.3,
      average_quality_score: 86.7,
      performance_distribution: [
        { tier: 'outstanding', count: 3, percentage: 12 },
        { tier: 'excellent', count: 8, percentage: 32 },
        { tier: 'good', count: 11, percentage: 44 },
        { tier: 'standard', count: 3, percentage: 12 }
      ]
    },
    compensation_impact: {
      total_bonuses_awarded: 25800,
      average_performance_bonus: 1032,
      pending_compensation_adjustments: 7
    }
  })

  // Mock feedback analytics data integrated with rankings
  const [feedbackAnalytics] = useState<FeedbackAnalytics>({
    organization_overview: {
      total_feedback_entries: 1847,
      average_rating: 4.2,
      feedback_velocity: 62, // feedback per week
      response_rate: 84.5
    },
    teacher_insights: {
      highest_rated_teachers: [
        { teacher_id: '1', teacher_name: 'Sarah Johnson', average_rating: 4.8, feedback_count: 45 },
        { teacher_id: '2', teacher_name: 'Mike Chen', average_rating: 4.7, feedback_count: 38 },
        { teacher_id: '3', teacher_name: 'Emma Wilson', average_rating: 4.6, feedback_count: 42 }
      ],
      improvement_opportunities: [
        { teacher_id: '4', teacher_name: 'Alex Brown', lowest_category: 'communication', average_rating: 3.2, suggestion: 'Focus on clearer instruction delivery' }
      ]
    },
    student_insights: {
      most_engaged_students: [
        { student_id: '1', student_name: 'David Smith', feedback_given_count: 28, engagement_score: 92 },
        { student_id: '2', student_name: 'Lisa Wang', feedback_given_count: 24, engagement_score: 88 }
      ],
      feedback_quality_leaders: [
        { student_id: '1', student_name: 'David Smith', helpful_feedback_count: 22, average_quality_score: 4.5 }
      ]
    },
    category_performance: [
      { category: 'teaching_quality', average_rating: 4.3, feedback_count: 312, trend: 'improving' },
      { category: 'communication', average_rating: 4.1, feedback_count: 298, trend: 'stable' },
      { category: 'behavior', average_rating: 3.9, feedback_count: 185, trend: 'improving' },
      { category: 'homework', average_rating: 4.0, feedback_count: 267, trend: 'declining' },
      { category: 'attendance', average_rating: 4.4, feedback_count: 156, trend: 'stable' },
      { category: 'professional_development', average_rating: 4.5, feedback_count: 89, trend: 'improving' }
    ],
    correlation_insights: {
      feedback_to_performance: 0.78, // Strong positive correlation
      feedback_to_retention: 0.65,
      feedback_to_engagement: 0.82
    }
  })

  // Mock trend data with feedback correlation
  const trendData = [
    { 
      name: 'Week 1', 
      students: 1200, 
      teachers: 380, 
      total: 1580,
      feedback_count: 45,
      avg_feedback_rating: 4.1,
      feedback_impact_points: 280
    },
    { 
      name: 'Week 2', 
      students: 1450, 
      teachers: 420, 
      total: 1870,
      feedback_count: 52,
      avg_feedback_rating: 4.3,
      feedback_impact_points: 340
    },
    { 
      name: 'Week 3', 
      students: 1380, 
      teachers: 450, 
      total: 1830,
      feedback_count: 48,
      avg_feedback_rating: 4.2,
      feedback_impact_points: 315
    },
    { 
      name: 'Week 4', 
      students: 1620, 
      teachers: 480, 
      total: 2100,
      feedback_count: 58,
      avg_feedback_rating: 4.4,
      feedback_impact_points: 385
    }
  ]

  // Combined category data with feedback correlation
  const categoryCorrelationData = analyticsData.points_by_category.map(category => {
    const feedbackCategory = feedbackAnalytics.category_performance.find(f => f.category === category.category)
    return {
      ...category,
      feedback_rating: feedbackCategory?.average_rating || 0,
      feedback_count: feedbackCategory?.feedback_count || 0,
      feedback_trend: feedbackCategory?.trend || 'stable',
      correlation_strength: feedbackCategory ? 
        (feedbackCategory.average_rating * category.total_points / 10000).toFixed(2) : '0.00'
    }
  })

  const categoryColors = {
    homework: '#3B82F6',
    attendance: '#10B981',
    participation: '#8B5CF6',
    teaching_quality: '#F59E0B',
    professional_development: '#EF4444',
    administrative: '#6B7280'
  }

  const performanceTierColors = {
    outstanding: '#F59E0B',
    excellent: '#10B981',
    good: '#3B82F6',
    standard: '#6B7280'
  }

  const filteredPointsData = analyticsData.points_by_category.filter(item => {
    if (userTypeFilter === 'combined') return true
    return item.user_type === userTypeFilter
  })

  const filteredAchievementsData = analyticsData.achievement_distribution.filter(item => {
    if (userTypeFilter === 'combined') return true
    return item.user_type === userTypeFilter || item.user_type === 'both'
  })

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalParticipants')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userTypeFilter === 'student' ? analyticsData.total_students_participating :
               userTypeFilter === 'teacher' ? analyticsData.total_teachers_participating :
               analyticsData.total_users_participating}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('avgPointsPerUser')}</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userTypeFilter === 'student' ? analyticsData.average_points_per_student.toFixed(1) :
               userTypeFilter === 'teacher' ? analyticsData.average_points_per_teacher.toFixed(1) :
               analyticsData.average_points_per_user.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per {userTypeFilter === 'combined' ? 'user' : userTypeFilter} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback Engagement</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedbackAnalytics.organization_overview.response_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              <Heart className="inline h-3 w-3 mr-1" />
              Avg rating: {feedbackAnalytics.organization_overview.average_rating.toFixed(1)}/5
            </p>
          </CardContent>
        </Card>

        {userTypeFilter === 'teacher' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('avgEfficiency')}</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.teacher_performance_metrics.average_efficiency.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                <ThumbsUp className="inline h-3 w-3 mr-1" />
                Quality: {analyticsData.teacher_performance_metrics.average_quality_score.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        )}

        {userTypeFilter !== 'teacher' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feedback Quality</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(feedbackAnalytics.correlation_insights.feedback_to_performance * 100).toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Performance correlation
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalAchievements')}</CardTitle>
            <Medal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredAchievementsData.reduce((sum, item) => sum + item.times_earned, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {feedbackAnalytics.organization_overview.total_feedback_entries} feedback entries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="trends">{t('trends')}</TabsTrigger>
          <TabsTrigger value="achievements">{t('achievements')}</TabsTrigger>
          {userTypeFilter === 'teacher' && (
            <TabsTrigger value="performance">{t('performance')}</TabsTrigger>
          )}
          {(userTypeFilter === 'teacher' || userTypeFilter === 'combined') && (
            <TabsTrigger value="compensation">{t('compensation')}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Points by Category with Feedback Correlation */}
            <Card>
              <CardHeader>
                <CardTitle>{t('pointsByCategory')} & Feedback Impact</CardTitle>
                <CardDescription>Points distribution with feedback correlation strength</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={categoryCorrelationData.filter(item => {
                    if (userTypeFilter === 'combined') return true
                    return item.user_type === userTypeFilter
                  })}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'total_points') return [value, 'Points']
                        if (name === 'feedback_rating') return [value, 'Avg Rating']
                        if (name === 'feedback_count') return [value, 'Feedback Count']
                        return [value, name]
                      }}
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="total_points" 
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                      name="total_points"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="feedback_rating" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      name="feedback_rating"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Feedback Impact Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Feedback Quality by Category</CardTitle>
                <CardDescription>Average ratings and trends across performance areas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={feedbackAnalytics.category_performance.filter(category => {
                    if (userTypeFilter === 'combined') return true
                    if (userTypeFilter === 'student') return ['homework', 'attendance', 'behavior'].includes(category.category)
                    if (userTypeFilter === 'teacher') return ['teaching_quality', 'communication', 'professional_development'].includes(category.category)
                    return true
                  })}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'average_rating') return [`${value}/5`, 'Rating']
                        return [value, name]
                      }}
                    />
                    <Bar 
                      dataKey="average_rating" 
                      fill={(entry) => {
                        if (entry.trend === 'improving') return '#10B981'
                        if (entry.trend === 'declining') return '#EF4444'
                        return '#6B7280'
                      }}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Improving</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Declining</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-500 rounded"></div>
                    <span>Stable</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feedback Insights Cards */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Feedback Velocity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {feedbackAnalytics.organization_overview.feedback_velocity}
                </div>
                <p className="text-sm text-muted-foreground">entries per week</p>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Response Rate</span>
                    <span>{feedbackAnalytics.organization_overview.response_rate.toFixed(1)}%</span>
                  </div>
                  <Progress value={feedbackAnalytics.organization_overview.response_rate} className="h-2 mt-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  Performance Correlation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {(feedbackAnalytics.correlation_insights.feedback_to_performance * 100).toFixed(0)}%
                </div>
                <p className="text-sm text-muted-foreground">feedback ↔ performance</p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Engagement</span>
                    <span>{(feedbackAnalytics.correlation_insights.feedback_to_engagement * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Retention</span>
                    <span>{(feedbackAnalytics.correlation_insights.feedback_to_retention * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Quality Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {feedbackAnalytics.organization_overview.average_rating.toFixed(1)}/5
                </div>
                <p className="text-sm text-muted-foreground">average rating</p>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Total Feedback</span>
                    <span>{feedbackAnalytics.organization_overview.total_feedback_entries}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span>Active Categories</span>
                    <span>{feedbackAnalytics.category_performance.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>{t('pointsTrends')} & Feedback Impact</CardTitle>
                <CardDescription>Performance trends with feedback correlation analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'students') return [value, 'Student Points']
                        if (name === 'teachers') return [value, 'Teacher Points']
                        if (name === 'total') return [value, 'Total Points']
                        if (name === 'feedback_count') return [value, 'Feedback Count']
                        if (name === 'avg_feedback_rating') return [`${value}/5`, 'Avg Rating']
                        if (name === 'feedback_impact_points') return [value, 'Feedback Impact']
                        return [value, name]
                      }}
                    />
                    {userTypeFilter === 'combined' && (
                      <>
                        <Area 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="students" 
                          stackId="1"
                          stroke="#3B82F6" 
                          fill="#3B82F6" 
                          fillOpacity={0.6}
                          name="students"
                        />
                        <Area 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="teachers" 
                          stackId="1"
                          stroke="#10B981" 
                          fill="#10B981" 
                          fillOpacity={0.6}
                          name="teachers"
                        />
                      </>
                    )}
                    {userTypeFilter === 'student' && (
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="students" 
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.6}
                        name="students"
                      />
                    )}
                    {userTypeFilter === 'teacher' && (
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="teachers" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.6}
                        name="teachers"
                      />
                    )}
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="avg_feedback_rating" 
                      stroke="#F59E0B" 
                      strokeWidth={3}
                      dot={{ fill: '#F59E0B', strokeWidth: 2, r: 5 }}
                      name="avg_feedback_rating"
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="feedback_impact_points" 
                      fill="#8B5CF6" 
                      fillOpacity={0.7}
                      name="feedback_impact_points"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Feedback Trend Analysis */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Feedback Quality Trends
                </CardTitle>
                <CardDescription>Rating trends by category over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedbackAnalytics.category_performance
                    .filter(category => {
                      if (userTypeFilter === 'combined') return true
                      if (userTypeFilter === 'student') return ['homework', 'attendance', 'behavior'].includes(category.category)
                      if (userTypeFilter === 'teacher') return ['teaching_quality', 'communication', 'professional_development'].includes(category.category)
                      return true
                    })
                    .map((category) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium capitalize">
                            {category.category.replace('_', ' ')}
                          </span>
                          <Badge variant={
                            category.trend === 'improving' ? 'default' :
                            category.trend === 'declining' ? 'destructive' : 
                            'secondary'
                          }>
                            {category.trend === 'improving' && <TrendingUp className="h-3 w-3 mr-1" />}
                            {category.trend === 'declining' && <TrendingDown className="h-3 w-3 mr-1" />}
                            {category.trend}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-bold">{category.average_rating.toFixed(1)}/5</span>
                          <span className="text-muted-foreground">({category.feedback_count} reviews)</span>
                        </div>
                      </div>
                      <Progress value={(category.average_rating / 5) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Engagement Trends
                </CardTitle>
                <CardDescription>Feedback engagement vs performance correlation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Performance Correlation</span>
                      <span className="text-sm font-bold text-green-600">
                        {(feedbackAnalytics.correlation_insights.feedback_to_performance * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={feedbackAnalytics.correlation_insights.feedback_to_performance * 100} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-1">Strong positive correlation</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Engagement Correlation</span>
                      <span className="text-sm font-bold text-blue-600">
                        {(feedbackAnalytics.correlation_insights.feedback_to_engagement * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={feedbackAnalytics.correlation_insights.feedback_to_engagement * 100} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-1">Very strong correlation</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Retention Impact</span>
                      <span className="text-sm font-bold text-purple-600">
                        {(feedbackAnalytics.correlation_insights.feedback_to_retention * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={feedbackAnalytics.correlation_insights.feedback_to_retention * 100} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-1">Moderate positive impact</p>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Weekly Feedback Velocity</span>
                      <span className="text-lg font-bold text-orange-600">
                        {feedbackAnalytics.organization_overview.feedback_velocity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">entries per week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Traditional Achievements */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Medal className="h-5 w-5" />
                Performance Achievements
              </h3>
              {filteredAchievementsData.map((achievement) => (
                <Card key={achievement.achievement_id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Medal className="h-8 w-8 text-purple-500" />
                      <div>
                        <h3 className="font-medium">{achievement.achievement_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t('earnedBy', { count: achievement.times_earned })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {t(achievement.user_type)}
                      </Badge>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{achievement.times_earned}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Feedback-Based Insights */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Feedback Recognition
              </h3>
              
              {/* Top Rated Teachers */}
              {(userTypeFilter === 'teacher' || userTypeFilter === 'combined') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Highest Rated Teachers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {feedbackAnalytics.teacher_insights.highest_rated_teachers.slice(0, 3).map((teacher, index) => (
                      <div key={teacher.teacher_id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            'bg-orange-600 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="font-medium text-sm">{teacher.teacher_name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-yellow-600">
                            {teacher.average_rating.toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {teacher.feedback_count} reviews
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Most Engaged Students */}
              {(userTypeFilter === 'student' || userTypeFilter === 'combined') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      Most Engaged Students
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {feedbackAnalytics.student_insights.most_engaged_students.slice(0, 3).map((student, index) => (
                      <div key={student.student_id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-red-500 text-white' :
                            index === 1 ? 'bg-pink-400 text-white' :
                            'bg-purple-500 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="font-medium text-sm">{student.student_name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-600">
                            {student.engagement_score}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {student.feedback_given_count} feedback given
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Improvement Areas */}
              {feedbackAnalytics.teacher_insights.improvement_opportunities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      Improvement Focus Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {feedbackAnalytics.teacher_insights.improvement_opportunities.map((opportunity) => (
                      <div key={opportunity.teacher_id} className="p-3 border rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{opportunity.teacher_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {opportunity.lowest_category.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Current Rating</span>
                          <span className="text-sm font-medium">{opportunity.average_rating}/5</span>
                        </div>
                        <Progress value={(opportunity.average_rating / 5) * 100} className="h-2 mb-2" />
                        <p className="text-xs text-muted-foreground italic">
                          {opportunity.suggestion}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {userTypeFilter === 'teacher' && (
          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('performanceDistribution')}</CardTitle>
                  <CardDescription>Performance tiers with feedback quality correlation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analyticsData.teacher_performance_metrics.performance_distribution.map((tier) => (
                    <div key={tier.tier} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{t(`performanceTier.${tier.tier}`)}</span>
                          <Badge variant="outline" className="text-xs">
                            {tier.count} teachers
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {tier.percentage}%
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs">
                              {tier.tier === 'outstanding' ? '4.5+' :
                               tier.tier === 'excellent' ? '4.0+' :
                               tier.tier === 'good' ? '3.5+' : '3.0+'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Progress value={tier.percentage} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('averageMetrics')} & Feedback Impact</CardTitle>
                  <CardDescription>Performance metrics enhanced with feedback correlation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{t('efficiency')}</span>
                      <span className="text-sm font-bold">
                        {analyticsData.teacher_performance_metrics.average_efficiency.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={analyticsData.teacher_performance_metrics.average_efficiency} className="h-2" />
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      <span>Feedback correlation:</span>
                      <span className="font-medium text-green-600">
                        {(feedbackAnalytics.correlation_insights.feedback_to_performance * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{t('quality')}</span>
                      <span className="text-sm font-bold">
                        {analyticsData.teacher_performance_metrics.average_quality_score.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={analyticsData.teacher_performance_metrics.average_quality_score} className="h-2" />
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      <span>Avg feedback rating:</span>
                      <span className="font-medium text-yellow-600">
                        {feedbackAnalytics.organization_overview.average_rating.toFixed(1)}/5
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Feedback Engagement</span>
                      <span className="text-sm font-bold">
                        {feedbackAnalytics.organization_overview.response_rate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={feedbackAnalytics.organization_overview.response_rate} className="h-2" />
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      <span>Weekly velocity:</span>
                      <span className="font-medium text-blue-600">
                        {feedbackAnalytics.organization_overview.feedback_velocity} entries
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feedback Performance Breakdown */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Top Performance Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {feedbackAnalytics.category_performance
                      .filter(cat => ['teaching_quality', 'communication', 'professional_development'].includes(cat.category))
                      .sort((a, b) => b.average_rating - a.average_rating)
                      .slice(0, 3)
                      .map((category, index) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-green-500 text-white' :
                            index === 1 ? 'bg-blue-500 text-white' :
                            'bg-purple-500 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium capitalize">
                            {category.category.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-600">
                            {category.average_rating.toFixed(1)}/5
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {category.feedback_count} reviews
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    Focus Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {feedbackAnalytics.category_performance
                      .filter(cat => ['teaching_quality', 'communication', 'professional_development'].includes(cat.category))
                      .sort((a, b) => a.average_rating - b.average_rating)
                      .slice(0, 2)
                      .map((category) => (
                      <div key={category.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {category.category.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-bold">
                            {category.average_rating.toFixed(1)}/5
                          </span>
                        </div>
                        <Progress value={(category.average_rating / 5) * 100} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Trend: {category.trend}</span>
                          <span>{category.feedback_count} reviews</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    Performance Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Rating Impact</span>
                        <span className="text-sm font-bold text-blue-600">
                          +{((feedbackAnalytics.organization_overview.average_rating - 3) * 10).toFixed(0)} pts
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Above baseline performance
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Engagement Bonus</span>
                        <span className="text-sm font-bold text-green-600">
                          +{Math.round(feedbackAnalytics.organization_overview.response_rate * 0.5)} pts
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        High feedback participation
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Quality Multiplier</span>
                        <span className="text-sm font-bold text-purple-600">
                          {(feedbackAnalytics.correlation_insights.feedback_to_performance + 0.2).toFixed(1)}x
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Performance enhancement factor
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {(userTypeFilter === 'teacher' || userTypeFilter === 'combined') && (
          <TabsContent value="compensation" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('totalBonusesAwarded')}</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${analyticsData.compensation_impact.total_bonuses_awarded.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This quarter
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <MessageSquare className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-blue-600">
                      +${Math.round(analyticsData.compensation_impact.total_bonuses_awarded * 0.15).toLocaleString()} from feedback
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('averageBonus')}</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${analyticsData.compensation_impact.average_performance_bonus.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per teacher
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-yellow-600">
                      {feedbackAnalytics.organization_overview.average_rating.toFixed(1)}/5 avg rating impact
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('pendingAdjustments')}</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.compensation_impact.pending_compensation_adjustments}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting approval
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-orange-500" />
                    <span className="text-xs text-orange-600">
                      {feedbackAnalytics.teacher_insights.improvement_opportunities.length} need review
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feedback-Based Compensation Analysis */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-green-500" />
                    Feedback-Based Bonuses
                  </CardTitle>
                  <CardDescription>Compensation adjustments driven by feedback ratings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {feedbackAnalytics.teacher_insights.highest_rated_teachers.slice(0, 3).map((teacher, index) => (
                      <div key={teacher.teacher_id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{teacher.teacher_name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {teacher.feedback_count} reviews • {teacher.average_rating.toFixed(1)}/5 rating
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            +${Math.round((teacher.average_rating - 3) * 200)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Quality bonus
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t text-center">
                      <p className="text-sm font-medium">
                        Total Feedback Bonuses: 
                        <span className="text-green-600 ml-1">
                          ${feedbackAnalytics.teacher_insights.highest_rated_teachers
                            .reduce((sum, teacher) => sum + Math.round((teacher.average_rating - 3) * 200), 0)
                            .toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Performance Impact Analysis
                  </CardTitle>
                  <CardDescription>How feedback correlates with compensation outcomes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Feedback-Performance Correlation</span>
                        <span className="text-lg font-bold text-blue-600">
                          {(feedbackAnalytics.correlation_insights.feedback_to_performance * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={feedbackAnalytics.correlation_insights.feedback_to_performance * 100} className="h-3" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Strong correlation drives bonus eligibility
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Rating Impact on Salary</span>
                        <span className="text-lg font-bold text-green-600">
                          {((feedbackAnalytics.organization_overview.average_rating - 3) * 5).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={((feedbackAnalytics.organization_overview.average_rating - 3) / 2) * 100} className="h-3" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Above baseline rating improvement
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Retention Bonus Factor</span>
                        <span className="text-lg font-bold text-purple-600">
                          {(feedbackAnalytics.correlation_insights.feedback_to_retention + 0.3).toFixed(1)}x
                        </span>
                      </div>
                      <Progress value={feedbackAnalytics.correlation_insights.feedback_to_retention * 100} className="h-3" />
                      <p className="text-xs text-muted-foreground mt-1">
                        High-rated teachers receive retention bonuses
                      </p>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-orange-600">
                            {Math.round(feedbackAnalytics.organization_overview.feedback_velocity * 52 * 0.1)}
                          </div>
                          <p className="text-xs text-muted-foreground">Annual feedback impact points</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-cyan-600">
                            ${Math.round(analyticsData.compensation_impact.average_performance_bonus * feedbackAnalytics.correlation_insights.feedback_to_performance).toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground">Avg feedback-driven bonus</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}