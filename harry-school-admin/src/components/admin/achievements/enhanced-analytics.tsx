'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Calendar,
  Download,
  Filter,
  Star,
  Trophy,
  Target,
  Zap,
  BookOpen,
  Clock,
  Activity,
  PieChart,
  LineChart,
  BarChart,
  MapPin,
  UserCheck,
  Timer,
  Percent,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart,
  ScatterChart,
  Scatter,
  RadialBarChart,
  RadialBar,
  ComposedChart
} from 'recharts'
import type { Achievement, StudentAchievement } from '@/types/ranking'
import { achievementService } from '@/lib/services/achievement-service'
import { fadeVariants, staggerContainer, staggerItem } from '@/lib/animations'

interface EnhancedAnalytics {
  overview: {
    total_achievements: number
    active_achievements: number
    total_awards: number
    unique_recipients: number
    avg_achievements_per_student: number
    total_points_awarded: number
    total_coins_awarded: number
    completion_rate: number
    engagement_score: number
  }
  trends: {
    daily_awards: Array<{
      date: string
      achievements_awarded: number
      unique_students: number
      points_awarded: number
      coins_awarded: number
      completion_rate: number
    }>
    weekly_trends: Array<{
      week: string
      achievements: number
      growth_rate: number
    }>
    monthly_comparison: Array<{
      month: string
      current_year: number
      previous_year: number
    }>
  }
  distribution: {
    by_type: Array<{
      type: string
      count: number
      percentage: number
      avg_points: number
      completion_rate: number
    }>
    by_rarity: Array<{
      rarity: string
      count: number
      percentage: number
      total_points: number
    }>
    by_time: Array<{
      hour: number
      awards: number
      day_of_week: string
    }>
  }
  performance: {
    top_achievements: Array<{
      id: string
      name: string
      icon_name: string
      badge_color: string
      times_earned: number
      completion_rate: number
      avg_time_to_earn: number
      points_awarded: number
      trend: 'up' | 'down' | 'stable'
    }>
    underperforming: Array<{
      id: string
      name: string
      icon_name: string
      badge_color: string
      times_earned: number
      completion_rate: number
      issues: string[]
      suggestions: string[]
    }>
    student_progress: Array<{
      student_id: string
      student_name: string
      total_achievements: number
      total_points: number
      recent_activity: number
      engagement_level: 'high' | 'medium' | 'low'
      favorite_category: string
    }>
  }
  insights: {
    patterns: Array<{
      pattern: string
      description: string
      confidence: number
      impact: 'high' | 'medium' | 'low'
      action_required: boolean
    }>
    recommendations: Array<{
      title: string
      description: string
      category: 'engagement' | 'performance' | 'design' | 'rewards'
      priority: 'high' | 'medium' | 'low'
      effort: 'low' | 'medium' | 'high'
    }>
    alerts: Array<{
      type: 'warning' | 'info' | 'success'
      title: string
      message: string
      created_at: string
    }>
  }
}

// Mock enhanced analytics data
const mockEnhancedAnalytics: EnhancedAnalytics = {
  overview: {
    total_achievements: 24,
    active_achievements: 20,
    total_awards: 892,
    unique_recipients: 156,
    avg_achievements_per_student: 5.7,
    total_points_awarded: 67400,
    total_coins_awarded: 33700,
    completion_rate: 68.5,
    engagement_score: 8.2
  },
  trends: {
    daily_awards: [
      { date: '2024-02-01', achievements_awarded: 45, unique_students: 32, points_awarded: 3400, coins_awarded: 1700, completion_rate: 71.2 },
      { date: '2024-02-02', achievements_awarded: 52, unique_students: 38, points_awarded: 3900, coins_awarded: 1950, completion_rate: 73.5 },
      { date: '2024-02-03', achievements_awarded: 38, unique_students: 29, points_awarded: 2850, coins_awarded: 1425, completion_rate: 65.8 },
      { date: '2024-02-04', achievements_awarded: 61, unique_students: 42, points_awarded: 4575, coins_awarded: 2288, completion_rate: 75.3 },
      { date: '2024-02-05', achievements_awarded: 47, unique_students: 35, points_awarded: 3525, coins_awarded: 1763, completion_rate: 69.7 },
      { date: '2024-02-06', achievements_awarded: 34, unique_students: 26, points_awarded: 2550, coins_awarded: 1275, completion_rate: 62.1 },
      { date: '2024-02-07', achievements_awarded: 49, unique_students: 37, points_awarded: 3675, coins_awarded: 1838, completion_rate: 72.4 }
    ],
    weekly_trends: [
      { week: 'Week 1', achievements: 287, growth_rate: 12.5 },
      { week: 'Week 2', achievements: 324, growth_rate: 12.9 },
      { week: 'Week 3', achievements: 298, growth_rate: -8.0 },
      { week: 'Week 4', achievements: 356, growth_rate: 19.5 }
    ],
    monthly_comparison: [
      { month: 'Jan', current_year: 1250, previous_year: 1180 },
      { month: 'Feb', current_year: 892, previous_year: 945 },
      { month: 'Mar', current_year: 0, previous_year: 1120 },
      { month: 'Apr', current_year: 0, previous_year: 1085 }
    ]
  },
  distribution: {
    by_type: [
      { type: 'homework', count: 284, percentage: 31.8, avg_points: 87, completion_rate: 78.5 },
      { type: 'attendance', count: 198, percentage: 22.2, avg_points: 92, completion_rate: 85.2 },
      { type: 'behavior', count: 156, percentage: 17.5, avg_points: 65, completion_rate: 72.3 },
      { type: 'streak', count: 124, percentage: 13.9, avg_points: 108, completion_rate: 45.8 },
      { type: 'milestone', count: 89, percentage: 10.0, avg_points: 195, completion_rate: 32.1 },
      { type: 'special', count: 41, percentage: 4.6, avg_points: 285, completion_rate: 18.7 }
    ],
    by_rarity: [
      { rarity: 'Common', count: 598, percentage: 67.0, total_points: 35890 },
      { rarity: 'Rare', count: 213, percentage: 23.9, total_points: 18420 },
      { rarity: 'Epic', count: 61, percentage: 6.8, total_points: 9150 },
      { rarity: 'Legendary', count: 20, percentage: 2.2, total_points: 3940 }
    ],
    by_time: [
      { hour: 8, awards: 45, day_of_week: 'Monday' },
      { hour: 9, awards: 62, day_of_week: 'Monday' },
      { hour: 10, awards: 78, day_of_week: 'Monday' },
      { hour: 11, awards: 85, day_of_week: 'Monday' },
      { hour: 12, awards: 34, day_of_week: 'Monday' },
      { hour: 13, awards: 67, day_of_week: 'Monday' },
      { hour: 14, awards: 92, day_of_week: 'Monday' },
      { hour: 15, awards: 76, day_of_week: 'Monday' },
      { hour: 16, awards: 54, day_of_week: 'Monday' },
      { hour: 17, awards: 23, day_of_week: 'Monday' }
    ]
  },
  performance: {
    top_achievements: [
      {
        id: '1',
        name: 'Perfect Attendance',
        icon_name: '📅',
        badge_color: '#4F7942',
        times_earned: 89,
        completion_rate: 85.2,
        avg_time_to_earn: 720, // hours
        points_awarded: 8900,
        trend: 'up'
      },
      {
        id: '2',
        name: 'Homework Champion',
        icon_name: '📚',
        badge_color: '#8B5CF6',
        times_earned: 76,
        completion_rate: 78.5,
        avg_time_to_earn: 168,
        points_awarded: 5700,
        trend: 'up'
      },
      {
        id: '3',
        name: 'Class Helper',
        icon_name: '🤝',
        badge_color: '#F59E0B',
        times_earned: 54,
        completion_rate: 72.3,
        avg_time_to_earn: 360,
        points_awarded: 3240,
        trend: 'stable'
      }
    ],
    underperforming: [
      {
        id: '4',
        name: 'Innovation Award',
        icon_name: '💡',
        badge_color: '#EF4444',
        times_earned: 3,
        completion_rate: 12.5,
        issues: ['Too difficult criteria', 'Unclear requirements', 'Low awareness'],
        suggestions: ['Simplify criteria', 'Add examples', 'Promote more actively']
      },
      {
        id: '5',
        name: 'Study Streak Master',
        icon_name: '⚡',
        badge_color: '#06B6D4',
        times_earned: 8,
        completion_rate: 24.2,
        issues: ['Long streak requirement', 'No progress tracking'],
        suggestions: ['Reduce streak length', 'Add progress indicators']
      }
    ],
    student_progress: [
      {
        student_id: '1',
        student_name: 'Alice Johnson',
        total_achievements: 12,
        total_points: 1450,
        recent_activity: 8,
        engagement_level: 'high',
        favorite_category: 'homework'
      },
      {
        student_id: '2',
        student_name: 'Bob Smith',
        total_achievements: 8,
        total_points: 920,
        recent_activity: 3,
        engagement_level: 'medium',
        favorite_category: 'attendance'
      },
      {
        student_id: '3',
        student_name: 'Carol Davis',
        total_achievements: 15,
        total_points: 1890,
        recent_activity: 12,
        engagement_level: 'high',
        favorite_category: 'behavior'
      }
    ]
  },
  insights: {
    patterns: [
      {
        pattern: 'Peak Award Time',
        description: 'Most achievements are awarded between 10-11 AM and 2-3 PM',
        confidence: 0.89,
        impact: 'medium',
        action_required: false
      },
      {
        pattern: 'Type Preference',
        description: 'Students show 3x higher engagement with homework achievements vs special achievements',
        confidence: 0.92,
        impact: 'high',
        action_required: true
      },
      {
        pattern: 'Completion Drop-off',
        description: 'Achievement completion rates drop significantly for milestones requiring >30 days',
        confidence: 0.85,
        impact: 'high',
        action_required: true
      }
    ],
    recommendations: [
      {
        title: 'Redesign Special Achievements',
        description: 'Break down complex special achievements into smaller, more achievable milestones',
        category: 'design',
        priority: 'high',
        effort: 'medium'
      },
      {
        title: 'Implement Progress Tracking',
        description: 'Add visual progress indicators for long-term achievements to maintain motivation',
        category: 'engagement',
        priority: 'high',
        effort: 'high'
      },
      {
        title: 'Optimize Reward Balance',
        description: 'Increase coin rewards for underperforming achievement types to boost engagement',
        category: 'rewards',
        priority: 'medium',
        effort: 'low'
      }
    ],
    alerts: [
      {
        type: 'warning',
        title: 'Low Engagement Alert',
        message: 'Special achievement engagement has dropped 25% this month',
        created_at: '2024-02-10T10:30:00Z'
      },
      {
        type: 'success',
        title: 'Milestone Reached',
        message: 'Homework achievements have reached 80% completion rate target',
        created_at: '2024-02-09T15:45:00Z'
      },
      {
        type: 'info',
        title: 'Trend Analysis',
        message: 'Weekend achievement awards are 40% lower than weekdays',
        created_at: '2024-02-08T09:15:00Z'
      }
    ]
  }
}

export function EnhancedAchievementAnalytics() {
  const [analytics, setAnalytics] = useState<EnhancedAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('achievements')
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>()

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAnalytics(mockEnhancedAnalytics)
      setLoading(false)
    }, 1000)
  }, [timeRange])

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'homework': return <BookOpen className="h-4 w-4" />
      case 'attendance': return <Clock className="h-4 w-4" />
      case 'behavior': return <Star className="h-4 w-4" />
      case 'streak': return <Zap className="h-4 w-4" />
      case 'milestone': return <Target className="h-4 w-4" />
      case 'special': return <Trophy className="h-4 w-4" />
      default: return <Award className="h-4 w-4" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />
      case 'stable': return <Minus className="h-4 w-4 text-gray-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'info': return <Eye className="h-4 w-4 text-blue-600" />
      default: return <Eye className="h-4 w-4 text-gray-600" />
    }
  }

  const formatTime = (hours: number) => {
    if (hours < 24) return `${hours}h`
    if (hours < 168) return `${Math.round(hours / 24)}d`
    return `${Math.round(hours / 168)}w`
  }

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-64 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header with Controls */}
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <BarChart3 className="h-6 w-6" />
            <span>Enhanced Achievement Analytics</span>
          </h2>
          <p className="text-muted-foreground">
            Comprehensive insights into achievement performance and student engagement
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <DatePickerWithRange
            date={dateRange}
            setDate={setDateRange}
          />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics Overview */}
      <motion.div variants={staggerItem}>
        <Card>
          <CardHeader>
            <CardTitle>Key Performance Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analytics.overview.total_awards}</div>
                <div className="text-sm text-muted-foreground">Total Awards</div>
                <div className="flex items-center justify-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-xs text-green-600">+12%</span>
                </div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">{analytics.overview.unique_recipients}</div>
                <div className="text-sm text-muted-foreground">Active Students</div>
                <div className="flex items-center justify-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-xs text-green-600">+8%</span>
                </div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{analytics.overview.completion_rate}%</div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
                <div className="flex items-center justify-center mt-1">
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                  <span className="text-xs text-red-600">-3%</span>
                </div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{analytics.overview.avg_achievements_per_student}</div>
                <div className="text-sm text-muted-foreground">Avg per Student</div>
                <div className="flex items-center justify-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-xs text-green-600">+5%</span>
                </div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{analytics.overview.engagement_score}/10</div>
                <div className="text-sm text-muted-foreground">Engagement Score</div>
                <div className="flex items-center justify-center mt-1">
                  <Minus className="h-3 w-3 text-gray-600 mr-1" />
                  <span className="text-xs text-gray-600">Stable</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alerts and Insights */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Alerts & Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.insights.alerts.map((alert, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Key Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.insights.recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{rec.title}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={
                          rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }
                      >
                        {rec.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {rec.effort} effort
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Analytics Tabs */}
      <motion.div variants={staggerItem}>
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="trends" className="flex items-center space-x-2">
              <LineChart className="h-4 w-4" />
              <span>Trends</span>
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex items-center space-x-2">
              <PieChart className="h-4 w-4" />
              <span>Distribution</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Performance</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Students</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Insights</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Achievement Awards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={analytics.trends.daily_awards}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="achievements_awarded" fill="#4F7942" name="Achievements" />
                        <Line yAxisId="right" type="monotone" dataKey="completion_rate" stroke="#8B5CF6" name="Completion Rate %" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Growth Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={analytics.trends.weekly_trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="achievements" fill="#4F7942" />
                        <Bar dataKey="growth_rate" fill="#8B5CF6" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Year-over-Year Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={analytics.trends.monthly_comparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="current_year" stroke="#4F7942" strokeWidth={3} name="2024" />
                      <Line type="monotone" dataKey="previous_year" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 5" name="2023" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribution by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Tooltip />
                        <RechartsPieChart 
                          data={analytics.distribution.by_type} 
                          cx="50%" 
                          cy="50%" 
                          outerRadius={120} 
                          dataKey="count"
                        >
                          {analytics.distribution.by_type.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                          ))}
                        </RechartsPieChart>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {analytics.distribution.by_type.map((item, index) => (
                      <div key={item.type} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          {getAchievementIcon(item.type)}
                          <span className="capitalize">{item.type}</span>
                        </div>
                        <div className="text-right">
                          <div>{item.count} ({item.percentage}%)</div>
                          <div className="text-xs text-muted-foreground">{item.completion_rate}% completion</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Award Time Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.distribution.by_time}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="hour" 
                          tickFormatter={(value) => `${value}:00`}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => `${value}:00`}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="awards" 
                          stroke="#4F7942" 
                          fill="#4F7942" 
                          fillOpacity={0.6} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.performance.top_achievements.map((achievement, index) => (
                      <div key={achievement.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm"
                            style={{ backgroundColor: achievement.badge_color }}
                          >
                            {achievement.icon_name}
                          </div>
                          <div>
                            <h4 className="font-medium">{achievement.name}</h4>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>{achievement.times_earned} awards</span>
                              <span>{achievement.completion_rate}% completion</span>
                              <span>Avg: {formatTime(achievement.avg_time_to_earn)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(achievement.trend)}
                          <Badge variant="outline">
                            {achievement.points_awarded} pts
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Underperforming Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.performance.underperforming.map((achievement, index) => (
                      <div key={achievement.id} className="p-3 border rounded-lg">
                        <div className="flex items-center space-x-3 mb-2">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                            style={{ backgroundColor: achievement.badge_color }}
                          >
                            {achievement.icon_name}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{achievement.name}</h4>
                            <div className="text-xs text-muted-foreground">
                              {achievement.times_earned} awards • {achievement.completion_rate}% completion
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 ml-11">
                          <div>
                            <h5 className="text-xs font-medium text-red-600 mb-1">Issues:</h5>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {achievement.issues.map((issue, i) => (
                                <li key={i}>• {issue}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h5 className="text-xs font-medium text-green-600 mb-1">Suggestions:</h5>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {achievement.suggestions.map((suggestion, i) => (
                                <li key={i}>• {suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Achievements</TableHead>
                      <TableHead>Total Points</TableHead>
                      <TableHead>Recent Activity</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Favorite Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.performance.student_progress.map((student) => (
                      <TableRow key={student.student_id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
                              {student.student_name.charAt(0)}
                            </div>
                            <span className="font-medium">{student.student_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{student.total_achievements}</TableCell>
                        <TableCell>{student.total_points.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span>{student.recent_activity}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getEngagementColor(student.engagement_level)}>
                            {student.engagement_level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getAchievementIcon(student.favorite_category)}
                            <span className="capitalize">{student.favorite_category}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pattern Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.insights.patterns.map((pattern, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{pattern.pattern}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            className={
                              pattern.impact === 'high' ? 'bg-red-100 text-red-800' :
                              pattern.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }
                          >
                            {pattern.impact} impact
                          </Badge>
                          <Badge variant="outline">
                            {Math.round(pattern.confidence * 100)}% confidence
                          </Badge>
                          {pattern.action_required && (
                            <Badge className="bg-orange-100 text-orange-800">
                              Action needed
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{pattern.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}