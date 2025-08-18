'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { debounce } from 'lodash'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Target, 
  Award, 
  Medal, 
  Gift, 
  ChartLine, 
  Plus, 
  Users, 
  User,
  Search,
  Filter,
  TrendingUp,
  Star,
  Crown,
  Zap,
  Clock,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import { rankingsService } from '@/lib/services/rankings-service'
import type { UserRanking, RankingsStats } from '@/lib/services/rankings-service'
import { SkeletonTable, SkeletonStats, SkeletonCard } from '@/components/ui/skeleton-table'

interface User {
  id: string
  name: string
  userType: 'teacher' | 'student'
  points: number
  level: number
  efficiency?: number
  qualityScore?: number
  coins: number
  progressToNext: number
  performanceTier: 'excellent' | 'good' | 'standard'
  avatar?: string
  initials: string
  streak?: number
  rank?: number
}

export function ComprehensiveRankings() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('total_points')
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<RankingsStats>({
    total_users: 0,
    total_points: 0,
    students_count: 0,
    teachers_count: 0,
    average_engagement: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [showAwardPointsModal, setShowAwardPointsModal] = useState(false)
  const [showAchievementModal, setShowAchievementModal] = useState(false)
  const [showRewardModal, setShowRewardModal] = useState(false)

  // Debounce search to prevent excessive API calls
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setDebouncedSearchQuery(query)
    }, 500),
    []
  )

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  // Use React Query for responsive data fetching
  const { data: rankingsData, isLoading: rankingsLoading, error: rankingsError } = useQuery({
    queryKey: ['rankings', userTypeFilter, sortBy, debouncedSearchQuery],
    queryFn: async () => {
      return await rankingsService.getRankings({
        userType: userTypeFilter as any,
        sortBy: sortBy as any,
        search: debouncedSearchQuery,
        limit: 50
      })
    },
    staleTime: 0, // Always refetch when filters change for responsive UI
    gcTime: 3 * 60 * 1000, // Keep in cache for 3 minutes
    refetchOnWindowFocus: false,
  })

  const { data: recentActivityData, isLoading: activityLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      return await rankingsService.getRecentActivity(5)
    },
    staleTime: 30000, // Cache for 30 seconds (activity changes moderately)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
  })

  const { data: analyticsResponse, isLoading: analyticsLoading } = useQuery({
    queryKey: ['rankings-analytics'],
    queryFn: async () => {
      return await rankingsService.getAnalytics()
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
  })

  // Memoize formatted users to avoid unnecessary recalculations
  const formattedUsers = useMemo(() => {
    if (!rankingsData?.rankings) return []
    return rankingsData.rankings.map(ranking => rankingsService.formatUserForDisplay(ranking))
  }, [rankingsData?.rankings])

  // Update local state when data changes
  useEffect(() => {
    if (formattedUsers) {
      setUsers(formattedUsers)
    }
  }, [formattedUsers])

  useEffect(() => {
    if (rankingsData?.stats) {
      setStats(rankingsData.stats)
    }
  }, [rankingsData?.stats])

  useEffect(() => {
    if (recentActivityData) {
      setRecentActivity(recentActivityData)
    }
  }, [recentActivityData])

  useEffect(() => {
    if (analyticsResponse) {
      setAnalyticsData(analyticsResponse)
    }
  }, [analyticsResponse])

  useEffect(() => {
    setLoading(rankingsLoading || activityLoading || analyticsLoading)
  }, [rankingsLoading, activityLoading, analyticsLoading])

  const filteredUsers = users

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800'
      case 'uncommon': return 'bg-green-100 text-green-800'
      case 'rare': return 'bg-blue-100 text-blue-800'
      case 'epic': return 'bg-purple-100 text-purple-800'
      case 'legendary': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPerformanceBadgeColor = (tier: string) => {
    switch (tier) {
      case 'excellent': return 'bg-green-100 text-green-800'
      case 'good': return 'bg-blue-100 text-blue-800'
      case 'standard': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      {loading ? (
        <SkeletonStats />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
            <p className="text-xs text-muted-foreground">{stats.students_count} students, {stats.teachers_count} teachers</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Points Awarded</CardTitle>
              <Award className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_points.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Across all users
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Active Achievements</CardTitle>
              <Medal className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">8 pending rewards</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Average Engagement</CardTitle>
              <Activity className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.average_engagement.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across all participants</p>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Main Rankings Interface */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Rankings Management
              </CardTitle>
              <CardDescription>Unified dashboard for managing student and teacher performance tracking</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Users className="h-3 w-3 mr-1" />
              Combined
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">
                <Trophy className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="leaderboards">
                <Target className="h-4 w-4 mr-2" />
                Leaderboards
              </TabsTrigger>
              <TabsTrigger value="points">
                <Award className="h-4 w-4 mr-2" />
                Points
              </TabsTrigger>
              <TabsTrigger value="achievements">
                <Medal className="h-4 w-4 mr-2" />
                Achievements
              </TabsTrigger>
              <TabsTrigger value="rewards">
                <Gift className="h-4 w-4 mr-2" />
                Rewards
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <ChartLine className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>Rapidly award points, achievements, and manage rankings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Student Actions
                      </h4>
                      <Button 
                        className="w-full justify-start" 
                        size="sm"
                        onClick={() => setShowAwardPointsModal(true)}
                      >
                        <Award className="h-4 w-4 mr-2" />
                        Award Points
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowAchievementModal(true)}
                      >
                        <Medal className="h-4 w-4 mr-2" />
                        Give Achievement
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowRewardModal(true)}
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        Approve Reward
                      </Button>
                    </div>
                    
                    <div className="grid gap-2 pt-2 border-t">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Teacher Actions
                      </h4>
                      <Button 
                        className="w-full justify-start" 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setShowAchievementModal(true)}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Recognition Award
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowAwardPointsModal(true)}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Performance Bonus
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Latest ranking updates and activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded bg-green-50">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={activity.user?.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {activity.user?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span><strong>{activity.user?.full_name || 'Unknown'}</strong> {activity.description || activity.action_type}</span>
                            </div>
                            <span className="text-muted-foreground text-xs">
                              {new Date(activity.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-muted-foreground py-4">
                          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No recent activity</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Leaderboards Tab */}
            <TabsContent value="leaderboards" className="mt-6">
              {/* Search and Filter Controls */}
              <div className="flex gap-4 items-center mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search users..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="teacher">Teachers</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total_points">Sort by Points</SelectItem>
                    <SelectItem value="current_level">Sort by Level</SelectItem>
                    <SelectItem value="name">Sort by Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Leaderboard
                  </CardTitle>
                  <CardDescription>Complete ranking with detailed performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <SkeletonTable rows={5} columns={6} />
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        {/* Rank Badge */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-600' :
                          index === 2 ? 'bg-orange-100 text-orange-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {index === 0 ? <Crown className="h-4 w-4" /> : `#${index + 1}`}
                        </div>

                        {/* User Avatar */}
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className={`
                            ${user.userType === 'teacher' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}
                          `}>
                            {user.initials}
                          </AvatarFallback>
                        </Avatar>

                        {/* User Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{user.name}</h3>
                            <Badge variant="outline" className={`text-xs ${
                              user.userType === 'teacher' ? 'border-blue-200 text-blue-600' : 'border-green-200 text-green-600'
                            }`}>
                              {user.userType === 'teacher' ? 'Teacher' : 'Student'}
                            </Badge>
                            <Badge className={getPerformanceBadgeColor(user.performanceTier)}>
                              {user.performanceTier}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              {user.points.toLocaleString()} Points
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Level {user.level}
                            </span>
                            {user.userType === 'teacher' && user.efficiency && (
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {user.efficiency}% efficiency
                              </span>
                            )}
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>Progress to next level</span>
                              <span>{user.progressToNext}%</span>
                            </div>
                            <Progress value={user.progressToNext} className="h-2" />
                          </div>
                        </div>
                      </div>

                      {/* Points and Quality Score */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {user.points.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.coins} coins
                        </div>
                        {user.userType === 'teacher' && user.qualityScore && (
                          <div className="text-sm font-medium mt-1">
                            Quality Score: {user.qualityScore}/100
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No users found</h3>
                      <p className="text-muted-foreground">
                        {searchQuery || userTypeFilter !== 'all'
                          ? 'Try adjusting your filters to see more results.'
                          : 'No users have been ranked yet.'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Medal className="h-5 w-5" />
                    Achievement Management
                  </CardTitle>
                  <CardDescription>Manage achievement system from the dedicated Achievement Management page</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <Medal className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Achievement Management</h3>
                  <p className="text-muted-foreground mb-4">
                    Use the dedicated Achievement Management section to create, edit, and manage achievements.
                  </p>
                  <Button onClick={() => router.push('/achievements')}>
                    <Medal className="h-4 w-4 mr-2" />
                    Go to Achievement Management
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-6">
              <div className="space-y-6">
                {/* Analytics Overview */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{analyticsData?.overview?.totalParticipants || 245}</div>
                        <div className="text-sm text-muted-foreground">Total Participants</div>
                        <div className="text-xs text-green-600">{analyticsData?.overview?.participantGrowth || '+12%'} from last month</div>
                      </div>
                      <Users className="h-8 w-8 text-green-500" />
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{analyticsData?.overview?.avgPointsPerUser || 62.9}</div>
                        <div className="text-sm text-muted-foreground">Avg Points Per User</div>
                        <div className="text-xs text-muted-foreground">Per user this month</div>
                      </div>
                      <Award className="h-8 w-8 text-blue-500" />
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{analyticsData?.overview?.totalAchievements || 158}</div>
                        <div className="text-sm text-muted-foreground">Total Achievements</div>
                        <div className="text-xs text-muted-foreground">Across all categories</div>
                      </div>
                      <Medal className="h-8 w-8 text-purple-500" />
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{analyticsData?.overview?.mostActiveDay || 'Wednesday'}</div>
                        <div className="text-sm text-muted-foreground">Most Active Day</div>
                        <div className="text-xs text-muted-foreground">Peak engagement day</div>
                      </div>
                      <Calendar className="h-8 w-8 text-orange-500" />
                    </div>
                  </Card>
                </div>

                {/* Analytics Charts */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Points by Category
                      </CardTitle>
                      <CardDescription>Distribution of points across different categories</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(analyticsData?.pointsByCategory || [
                          { category: 'homework', points: 4200 },
                          { category: 'participation', points: 2900 },
                          { category: 'behavior', points: 3000 },
                          { category: 'administrative', points: 1800 }
                        ]).map((item: any, index: number) => {
                          const allValues = analyticsData?.pointsByCategory || [
                            { category: 'homework', points: 4200 },
                            { category: 'participation', points: 2900 },
                            { category: 'behavior', points: 3000 },
                            { category: 'administrative', points: 1800 }
                          ]
                          const maxValue = Math.max(...allValues.map((v: any) => v.points))
                          const width = maxValue > 0 ? (item.points / maxValue) * 100 : 0
                          
                          return (
                            <div key={item.category} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="capitalize">{item.category}</span>
                                <span className="font-medium">{item.points.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${width}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Achievement Distribution
                      </CardTitle>
                      <CardDescription>Popular achievements and recognition patterns</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(analyticsData?.achievementDistribution || [
                          { label: 'Academic', percentage: 39 },
                          { label: 'Behavior', percentage: 28 },
                          { label: 'Attendance', percentage: 24 },
                          { label: 'Special', percentage: 5 },
                          { label: 'Other', percentage: 4 }
                        ]).map((item: any, index: number) => {
                          const colors = ['bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500']
                          const color = colors[index % colors.length]
                          return (
                            <div key={item.label} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${color}`} />
                                <span className="text-sm">{item.label}</span>
                              </div>
                              <span className="text-sm font-medium">{item.percentage}%</span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Other tabs with placeholder content */}
            <TabsContent value="points" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Points Management</CardTitle>
                  <CardDescription>Award and manage points for students and teachers</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setShowAwardPointsModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Award Points
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rewards" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rewards Management</CardTitle>
                  <CardDescription>Manage reward catalog and student redemptions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Rewards system coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal Dialogs */}
      {showAwardPointsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Award className="h-5 w-5" />
                Award Points
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAwardPointsModal(false)}
              >
                ×
              </Button>
            </div>
            <p className="text-muted-foreground mb-4">
              This feature is coming soon. You'll be able to award points to students and teachers directly from this interface.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAwardPointsModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowAwardPointsModal(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAchievementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Medal className="h-5 w-5" />
                Give Achievement
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAchievementModal(false)}
              >
                ×
              </Button>
            </div>
            <p className="text-muted-foreground mb-4">
              This feature is coming soon. You'll be able to award achievements and recognition directly from this interface.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAchievementModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowAchievementModal(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRewardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Approve Reward
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowRewardModal(false)}
              >
                ×
              </Button>
            </div>
            <p className="text-muted-foreground mb-4">
              This feature is coming soon. You'll be able to approve and manage reward redemptions directly from this interface.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowRewardModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowRewardModal(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}