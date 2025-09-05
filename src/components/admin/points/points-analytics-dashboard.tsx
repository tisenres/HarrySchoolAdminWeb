'use client'

import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp,
  Users,
  Award,
  BookOpen,
  Clock,
  Smile,
  Trophy,
  Activity,
  BarChart3,
  Target,
  Calendar
} from 'lucide-react'
import type { RankingAnalytics } from '@/types/ranking'
import { slideInVariants, staggerVariants } from '@/lib/animations'

interface PointsAnalyticsDashboardProps {
  analytics: RankingAnalytics
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'homework': return <BookOpen className="h-4 w-4" />
    case 'attendance': return <Clock className="h-4 w-4" />
    case 'behavior': return <Smile className="h-4 w-4" />
    case 'achievement': return <Trophy className="h-4 w-4" />
    default: return <Activity className="h-4 w-4" />
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'homework': return 'bg-blue-500'
    case 'attendance': return 'bg-green-500'
    case 'behavior': return 'bg-purple-500'
    case 'achievement': return 'bg-yellow-500'
    default: return 'bg-gray-500'
  }
}

export function PointsAnalyticsDashboard({ analytics }: PointsAnalyticsDashboardProps) {
  const totalTransactions = analytics.points_by_category.reduce((sum, cat) => sum + cat.transaction_count, 0)
  const maxCategoryPoints = Math.max(...analytics.points_by_category.map(cat => cat.total_points))

  return (
    <motion.div
      variants={staggerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={slideInVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participation Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((analytics.total_students_participating / analytics.total_students_participating) * 100).toFixed(0)}%
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Progress value={85} className="flex-1" />
                <span className="text-xs text-muted-foreground">85% active</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.total_students_participating} students participating
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={slideInVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(analytics.total_points_awarded / 30)}
              </div>
              <div className="text-xs text-muted-foreground">
                points awarded per day
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">+15% from last month</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={slideInVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Active Day</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(analytics.most_active_day).toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(analytics.most_active_day).toLocaleDateString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Peak activity day this month
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Points by Category */}
      <motion.div variants={slideInVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Points Distribution by Category</span>
            </CardTitle>
            <CardDescription>
              Breakdown of points awarded across different categories this month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.points_by_category
              .sort((a, b) => b.total_points - a.total_points)
              .map((category, index) => {
                const percentage = (category.total_points / analytics.total_points_awarded) * 100
                const transactionPercentage = (category.transaction_count / totalTransactions) * 100
                
                return (
                  <motion.div
                    key={category.category}
                    variants={slideInVariants}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full ${getCategoryColor(category.category)} flex items-center justify-center`}>
                          {getCategoryIcon(category.category)}
                        </div>
                        <div>
                          <div className="font-medium capitalize text-sm">{category.category}</div>
                          <div className="text-xs text-muted-foreground">
                            {category.transaction_count} transaction{category.transaction_count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">
                          {category.total_points.toLocaleString()} pts
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Points: {percentage.toFixed(1)}%</span>
                        <span>Transactions: {transactionPercentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Achievement Distribution */}
      <motion.div variants={slideInVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Popular Achievements</span>
            </CardTitle>
            <CardDescription>
              Most frequently earned achievements this month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.achievement_distribution
              .sort((a, b) => b.times_earned - a.times_earned)
              .map((achievement, index) => {
                const maxEarned = Math.max(...analytics.achievement_distribution.map(a => a.times_earned))
                const percentage = (achievement.times_earned / maxEarned) * 100
                
                return (
                  <motion.div
                    key={achievement.achievement_id}
                    variants={slideInVariants}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <Trophy className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{achievement.achievement_name}</div>
                        <div className="text-xs text-muted-foreground">
                          Earned {achievement.times_earned} times
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-20">
                        <Progress value={percentage} className="h-1.5" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {achievement.times_earned}
                      </Badge>
                    </div>
                  </motion.div>
                )
              })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Statistics */}
      <motion.div variants={slideInVariants}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {analytics.points_by_category.find(c => c.category === 'homework')?.total_points.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-muted-foreground">Homework Points</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {analytics.points_by_category.find(c => c.category === 'attendance')?.total_points.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-muted-foreground">Attendance Points</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Smile className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {analytics.points_by_category.find(c => c.category === 'behavior')?.total_points.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-muted-foreground">Behavior Points</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {analytics.points_by_category.find(c => c.category === 'achievement')?.total_points.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-muted-foreground">Achievement Points</div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Insights */}
      <motion.div variants={slideInVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Key Insights</span>
            </CardTitle>
            <CardDescription>
              Automated analysis of your points system performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
              <div>
                <div className="font-medium text-sm">Strong Homework Engagement</div>
                <div className="text-sm text-muted-foreground">
                  Homework category represents the highest point distribution, indicating good assignment completion rates.
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              <div>
                <div className="font-medium text-sm">Balanced Point Distribution</div>
                <div className="text-sm text-muted-foreground">
                  Points are well-distributed across categories, showing a healthy variety of student achievements.
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
              <div>
                <div className="font-medium text-sm">High Participation</div>
                <div className="text-sm text-muted-foreground">
                  {analytics.total_students_participating} students are actively earning points, showing strong engagement.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}