'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  BarChart3,
  TrendingUp,
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
  PieChart,
  LineChart,
  Activity
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
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
  AreaChart
} from 'recharts'
import type { Achievement, StudentAchievement } from '@/types/ranking'
import { fadeVariants, staggerContainer, staggerItem } from '@/lib/animations'

// Mock data
interface AchievementAnalytics {
  achievement_id: string
  achievement_name: string
  icon_name: string
  badge_color: string
  achievement_type: string
  times_earned: number
  total_points_awarded: number
  total_coins_awarded: number
  unique_recipients: number
  first_earned: string
  last_earned: string
  completion_rate: number
}

interface DailyAchievementData {
  date: string
  achievements_earned: number
  unique_students: number
  total_points: number
  total_coins: number
}

interface TypeDistribution {
  type: string
  count: number
  percentage: number
  color: string
}

const mockAnalytics: AchievementAnalytics[] = [
  {
    achievement_id: '1',
    achievement_name: 'Perfect Attendance',
    icon_name: '📅',
    badge_color: '#4F7942',
    achievement_type: 'attendance',
    times_earned: 45,
    total_points_awarded: 4500,
    total_coins_awarded: 2250,
    unique_recipients: 45,
    first_earned: '2024-01-15T10:00:00Z',
    last_earned: '2024-02-10T15:30:00Z',
    completion_rate: 65.2
  },
  {
    achievement_id: '2',
    achievement_name: 'Homework Champion',
    icon_name: '📚',
    badge_color: '#8B5CF6',
    achievement_type: 'homework',
    times_earned: 89,
    total_points_awarded: 6675,
    total_coins_awarded: 2225,
    unique_recipients: 67,
    first_earned: '2024-01-10T14:30:00Z',
    last_earned: '2024-02-12T09:15:00Z',
    completion_rate: 97.3
  },
  {
    achievement_id: '3',
    achievement_name: 'Class Helper',
    icon_name: '🤝',
    badge_color: '#F59E0B',
    achievement_type: 'behavior',
    times_earned: 34,
    total_points_awarded: 2040,
    total_coins_awarded: 1020,
    unique_recipients: 28,
    first_earned: '2024-01-05T09:15:00Z',
    last_earned: '2024-02-08T16:45:00Z',
    completion_rate: 40.6
  },
  {
    achievement_id: '4',
    achievement_name: 'Study Streak Master',
    icon_name: '⚡',
    badge_color: '#EF4444',
    achievement_type: 'streak',
    times_earned: 23,
    total_points_awarded: 2760,
    total_coins_awarded: 1380,
    unique_recipients: 20,
    first_earned: '2024-01-20T16:45:00Z',
    last_earned: '2024-02-11T11:20:00Z',
    completion_rate: 29.0
  },
  {
    achievement_id: '5',
    achievement_name: 'Level 5 Scholar',
    icon_name: '🎯',
    badge_color: '#06B6D4',
    achievement_type: 'milestone',
    times_earned: 12,
    total_points_awarded: 2400,
    total_coins_awarded: 1200,
    unique_recipients: 12,
    first_earned: '2024-02-01T11:20:00Z',
    last_earned: '2024-02-12T14:10:00Z',
    completion_rate: 17.4
  },
  {
    achievement_id: '6',
    achievement_name: 'Student of the Month',
    icon_name: '👑',
    badge_color: '#8B5CF6',
    achievement_type: 'special',
    times_earned: 3,
    total_points_awarded: 900,
    total_coins_awarded: 450,
    unique_recipients: 3,
    first_earned: '2024-02-05T13:30:00Z',
    last_earned: '2024-02-12T10:00:00Z',
    completion_rate: 4.3
  }
]

const mockDailyData: DailyAchievementData[] = [
  { date: '2024-02-01', achievements_earned: 15, unique_students: 12, total_points: 1150, total_coins: 575 },
  { date: '2024-02-02', achievements_earned: 23, unique_students: 18, total_points: 1720, total_coins: 860 },
  { date: '2024-02-03', achievements_earned: 18, unique_students: 15, total_points: 1380, total_coins: 690 },
  { date: '2024-02-04', achievements_earned: 31, unique_students: 24, total_points: 2310, total_coins: 1155 },
  { date: '2024-02-05', achievements_earned: 28, unique_students: 21, total_points: 2100, total_coins: 1050 },
  { date: '2024-02-06', achievements_earned: 19, unique_students: 16, total_points: 1425, total_coins: 712 },
  { date: '2024-02-07', achievements_earned: 22, unique_students: 19, total_points: 1650, total_coins: 825 },
]

const typeColors = {
  homework: '#8B5CF6',
  attendance: '#4F7942',
  behavior: '#F59E0B',
  streak: '#EF4444',
  milestone: '#06B6D4',
  special: '#8B5CF6'
}

export function AchievementAnalytics() {
  const [analytics, setAnalytics] = useState<AchievementAnalytics[]>([])
  const [dailyData, setDailyData] = useState<DailyAchievementData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedType, setSelectedType] = useState('all')

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAnalytics(mockAnalytics)
      setDailyData(mockDailyData)
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

  const getAchievementRarity = (type: string) => {
    switch (type) {
      case 'special': return { 
        label: 'Legendary', 
        color: 'bg-purple-100 text-purple-800 border-purple-200'
      }
      case 'milestone': return { 
        label: 'Epic', 
        color: 'bg-orange-100 text-orange-800 border-orange-200'
      }
      case 'streak': return { 
        label: 'Rare', 
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      }
      default: return { 
        label: 'Common', 
        color: 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  // Calculate summary statistics
  const totalAchievementsEarned = analytics.reduce((sum, a) => sum + a.times_earned, 0)
  const totalPointsAwarded = analytics.reduce((sum, a) => sum + a.total_points_awarded, 0)
  const totalCoinsAwarded = analytics.reduce((sum, a) => sum + a.total_coins_awarded, 0)
  const uniqueRecipients = Math.max(...analytics.map(a => a.unique_recipients), 0)

  // Calculate type distribution
  const typeDistribution: TypeDistribution[] = Object.entries(
    analytics.reduce((acc, item) => {
      acc[item.achievement_type] = (acc[item.achievement_type] || 0) + item.times_earned
      return acc
    }, {} as Record<string, number>)
  ).map(([type, count]) => ({
    type,
    count,
    percentage: (count / totalAchievementsEarned) * 100,
    color: typeColors[type as keyof typeof typeColors] || '#6B7280'
  }))

  // Filter analytics based on selected type
  const filteredAnalytics = selectedType === 'all' 
    ? analytics 
    : analytics.filter(a => a.achievement_type === selectedType)

  // Sort analytics by times earned (descending)
  const sortedAnalytics = [...filteredAnalytics].sort((a, b) => b.times_earned - a.times_earned)

  if (loading) {
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
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <BarChart3 className="h-6 w-6" />
            <span>Achievement Analytics</span>
          </h2>
          <p className="text-muted-foreground">
            Track achievement performance and student engagement metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
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
            Export
          </Button>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalAchievementsEarned}</div>
            <div className="text-sm text-muted-foreground">Achievements Earned</div>
            <div className="flex items-center justify-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+12% this month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{totalPointsAwarded.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Points Awarded</div>
            <div className="flex items-center justify-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+8% this month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{totalCoinsAwarded.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Coins Awarded</div>
            <div className="flex items-center justify-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+15% this month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{uniqueRecipients}</div>
            <div className="text-sm text-muted-foreground">Active Students</div>
            <div className="flex items-center justify-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+5% this month</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <motion.div variants={staggerItem}>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
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
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Daily Achievement Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Achievement Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => formatDate(value)}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="achievements_earned"
                        stackId="1"
                        stroke="#8B5CF6"
                        fill="#8B5CF6"
                        fillOpacity={0.6}
                        name="Achievements Earned"
                      />
                      <Area
                        type="monotone"
                        dataKey="unique_students"
                        stackId="2"
                        stroke="#4F7942"
                        fill="#4F7942"
                        fillOpacity={0.6}
                        name="Active Students"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Achievements */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Top Performing Achievements</CardTitle>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="homework">Homework</SelectItem>
                      <SelectItem value="attendance">Attendance</SelectItem>
                      <SelectItem value="behavior">Behavior</SelectItem>
                      <SelectItem value="streak">Streak</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="special">Special</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sortedAnalytics} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="achievement_name" 
                        width={150}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                  <div 
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                                    style={{ backgroundColor: data.badge_color }}
                                  >
                                    {data.icon_name}
                                  </div>
                                  <span className="font-medium">{label}</span>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div>Times Earned: {data.times_earned}</div>
                                  <div>Unique Recipients: {data.unique_recipients}</div>
                                  <div>Completion Rate: {data.completion_rate}%</div>
                                  <div>Points Awarded: {data.total_points_awarded}</div>
                                  <div>Coins Awarded: {data.total_coins_awarded}</div>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar 
                        dataKey="times_earned" 
                        fill="#4F7942"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Achievement Trends Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => formatDate(value)}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="achievements_earned"
                        stroke="#8B5CF6"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        name="Achievements Earned"
                      />
                      <Line
                        type="monotone"
                        dataKey="unique_students"
                        stroke="#4F7942"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        name="Active Students"
                      />
                      <Line
                        type="monotone"
                        dataKey="total_points"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="Points Awarded"
                      />
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
                  <CardTitle>Achievement Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-background border rounded-lg p-3 shadow-lg">
                                  <div className="flex items-center space-x-2 mb-1">
                                    {getAchievementIcon(data.type)}
                                    <span className="font-medium capitalize">{data.type}</span>
                                  </div>
                                  <div className="text-sm">
                                    <div>Count: {data.count}</div>
                                    <div>Percentage: {data.percentage.toFixed(1)}%</div>
                                  </div>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <RechartsPieChart 
                          data={typeDistribution} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={60} 
                          outerRadius={120} 
                          paddingAngle={2}
                          dataKey="count"
                        >
                          {typeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </RechartsPieChart>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {typeDistribution.map((item) => (
                      <div key={item.type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm capitalize">{item.type}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.count} ({item.percentage.toFixed(1)}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Completion Rate by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {typeDistribution.map((item) => {
                      const avgCompletionRate = analytics
                        .filter(a => a.achievement_type === item.type)
                        .reduce((avg, a, _, arr) => avg + a.completion_rate / arr.length, 0)

                      return (
                        <div key={item.type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getAchievementIcon(item.type)}
                              <span className="text-sm font-medium capitalize">{item.type}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {avgCompletionRate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${avgCompletionRate}%`,
                                backgroundColor: item.color
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Achievement Performance Table</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Achievement</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Times Earned</TableHead>
                      <TableHead className="text-right">Recipients</TableHead>
                      <TableHead className="text-right">Completion Rate</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="text-right">Coins</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAnalytics.map((achievement) => {
                      const rarity = getAchievementRarity(achievement.achievement_type)
                      return (
                        <TableRow key={achievement.achievement_id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                                style={{ backgroundColor: achievement.badge_color }}
                              >
                                {achievement.icon_name}
                              </div>
                              <div>
                                <div className="font-medium">{achievement.achievement_name}</div>
                                <Badge className={`${rarity.color} text-xs`}>
                                  {rarity.label}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getAchievementIcon(achievement.achievement_type)}
                              <span className="capitalize">{achievement.achievement_type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {achievement.times_earned}
                          </TableCell>
                          <TableCell className="text-right">
                            {achievement.unique_recipients}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div
                                  className="h-2 bg-primary rounded-full"
                                  style={{ width: `${achievement.completion_rate}%` }}
                                />
                              </div>
                              <span className="text-sm">{achievement.completion_rate}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-yellow-600">
                            {achievement.total_points_awarded.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {achievement.total_coins_awarded.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}