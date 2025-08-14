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
  AreaChart
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
  Activity
} from 'lucide-react'

// Import types
import { RankingAnalytics } from '@/types/ranking'

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

  // Mock trend data
  const trendData = [
    { name: 'Week 1', students: 1200, teachers: 380, total: 1580 },
    { name: 'Week 2', students: 1450, teachers: 420, total: 1870 },
    { name: 'Week 3', students: 1380, teachers: 450, total: 1830 },
    { name: 'Week 4', students: 1620, teachers: 480, total: 2100 }
  ]

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">{t('totalAchievements')}</CardTitle>
            <Medal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredAchievementsData.reduce((sum, item) => sum + item.times_earned, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all categories
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
                Quality: {analyticsData.teacher_performance_metrics.average_quality_score.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        )}

        {userTypeFilter !== 'teacher' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('mostActiveDay')}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.most_active_day}</div>
              <p className="text-xs text-muted-foreground">
                Peak engagement day
              </p>
            </CardContent>
          </Card>
        )}
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
            {/* Points by Category */}
            <Card>
              <CardHeader>
                <CardTitle>{t('pointsByCategory')}</CardTitle>
                <CardDescription>{t('pointsByCategoryDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filteredPointsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="total_points" 
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Achievement Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>{t('achievementDistribution')}</CardTitle>
                <CardDescription>{t('achievementDistributionDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={filteredAchievementsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="times_earned"
                    >
                      {filteredAchievementsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(categoryColors)[index % Object.values(categoryColors).length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('pointsTrends')}</CardTitle>
              <CardDescription>{t('pointsTrendsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  {userTypeFilter === 'combined' && (
                    <>
                      <Area 
                        type="monotone" 
                        dataKey="students" 
                        stackId="1"
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="teachers" 
                        stackId="1"
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.6}
                      />
                    </>
                  )}
                  {userTypeFilter === 'student' && (
                    <Area 
                      type="monotone" 
                      dataKey="students" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.6}
                    />
                  )}
                  {userTypeFilter === 'teacher' && (
                    <Area 
                      type="monotone" 
                      dataKey="teachers" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.6}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="space-y-4">
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
        </TabsContent>

        {userTypeFilter === 'teacher' && (
          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('performanceDistribution')}</CardTitle>
                  <CardDescription>{t('performanceDistributionDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analyticsData.teacher_performance_metrics.performance_distribution.map((tier) => (
                    <div key={tier.tier} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t(`performanceTier.${tier.tier}`)}</span>
                        <span className="text-sm text-muted-foreground">
                          {tier.count} teachers ({tier.percentage}%)
                        </span>
                      </div>
                      <Progress value={tier.percentage} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('averageMetrics')}</CardTitle>
                  <CardDescription>{t('averageMetricsDescription')}</CardDescription>
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
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{t('quality')}</span>
                      <span className="text-sm font-bold">
                        {analyticsData.teacher_performance_metrics.average_quality_score.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={analyticsData.teacher_performance_metrics.average_quality_score} className="h-2" />
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}