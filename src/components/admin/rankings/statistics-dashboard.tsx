'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { 
  Users, 
  Target, 
  Trophy, 
  Clock,
  TrendingUp,
  Activity,
  Award,
  Calendar
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalParticipants: number
    participantGrowth: string
    avgPointsPerUser: number
    totalAchievements: number
    mostActiveDay: string
  }
  pointsByCategory: Array<{
    category: string
    points: number
  }>
  achievementDistribution: Array<{
    label: string
    percentage: number
  }>
}

interface StatisticsKPICardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ComponentType<any>
  color: string
  growth?: string
}

const StatisticsKPICard: React.FC<StatisticsKPICardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color,
  growth 
}) => (
  <Card className="relative">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="text-2xl font-bold tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <p className="text-xs text-muted-foreground mt-2 flex items-center">
        {growth && (
          <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
        )}
        {subtitle}
      </p>
    </CardContent>
  </Card>
)

const CHART_COLORS = {
  primary: '#1d7452',
  blue: '#3b82f6',
  green: '#10b981',
  orange: '#f97316',
  purple: '#8b5cf6',
  pink: '#ec4899'
}

const PIE_COLORS = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#ec4899']

export function StatisticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/rankings/analytics')
        const data = await response.json()
        
        if (data) {
          setAnalyticsData(data)
        }
      } catch (error) {
        console.error('Failed to fetch analytics data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatisticsKPICard
          title="Total Participants"
          value={analyticsData.overview.totalParticipants}
          subtitle={`${analyticsData.overview.participantGrowth} from last month`}
          icon={Users}
          color="text-blue-500"
          growth={analyticsData.overview.participantGrowth}
        />
        
        <StatisticsKPICard
          title="Avg Points Per User"
          value={analyticsData.overview.avgPointsPerUser}
          subtitle="Per user this month"
          icon={Target}
          color="text-green-500"
        />
        
        <StatisticsKPICard
          title="Total Achievements"
          value={analyticsData.overview.totalAchievements}
          subtitle="Across all categories"
          icon={Trophy}
          color="text-orange-500"
        />
        
        <StatisticsKPICard
          title="Most Active Day"
          value={analyticsData.overview.mostActiveDay}
          subtitle="Peak engagement day"
          icon={Clock}
          color="text-purple-500"
        />
      </div>

      {/* Statistics Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Statistics Dashboard
              </CardTitle>
              <CardDescription>Detailed performance analytics and insights</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Calendar className="h-3 w-3 mr-1" />
              Live Data
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="compensation">Compensation</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Points by Category Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Points by Category</CardTitle>
                    <CardDescription>
                      Distribution of points across different categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.pointsByCategory} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="category" 
                          tick={{ fontSize: 12 }}
                          className="capitalize"
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar 
                          dataKey="points" 
                          fill={CHART_COLORS.blue}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Achievement Distribution Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Achievement Distribution</CardTitle>
                    <CardDescription>
                      Popular achievements and recognition patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.achievementDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="percentage"
                        >
                          {analyticsData.achievementDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`${value}%`, 'Percentage']}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          iconType="circle"
                          wrapperStyle={{ fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trends Analysis</CardTitle>
                  <CardDescription>Performance trends over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-12">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Trends Coming Soon</p>
                    <p className="text-sm">Historical performance analysis will be available here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Achievement Analytics</CardTitle>
                  <CardDescription>Detailed achievement performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card className="p-4 text-center bg-blue-50">
                      <div className="text-2xl font-bold text-blue-600">
                        {analyticsData.achievementDistribution.reduce((sum, a) => sum + a.percentage, 0)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Achievement Coverage</div>
                    </Card>
                    <Card className="p-4 text-center bg-green-50">
                      <div className="text-2xl font-bold text-green-600">
                        {analyticsData.achievementDistribution.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Categories</div>
                    </Card>
                    <Card className="p-4 text-center bg-orange-50">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.max(...analyticsData.achievementDistribution.map(a => a.percentage))}%
                      </div>
                      <div className="text-sm text-muted-foreground">Top Category</div>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    {analyticsData.achievementDistribution.map((achievement, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                          />
                          <div>
                            <div className="font-medium">{achievement.label}</div>
                            <div className="text-sm text-muted-foreground">
                              Achievement category
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-lg font-medium">
                          {achievement.percentage}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compensation" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compensation Analytics</CardTitle>
                  <CardDescription>Points and rewards distribution analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-12">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Compensation Analytics</p>
                    <p className="text-sm">Detailed compensation analysis coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}