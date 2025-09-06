'use client'

import { useState, useEffect, useCallback } from 'react'
import { IntegratedRankingsLeaderboard } from './integrated-rankings-leaderboard'
import { ReferralAchievementsIntegration } from './referral-achievements-integration'
import { RankingsAnalyticsDashboard } from './rankings-analytics-dashboard'
import { AwardAchievementModal } from './award-achievement-modal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  TrendingUp,
  Star,
  Crown,
  Zap,
  Clock,
  Activity
} from 'lucide-react'

interface User {
  id: string
  name: string
  userType: 'teacher' | 'student'
  points: number
  level: number
  efficiency?: number
  coins: number
  performanceTier: 'excellent' | 'good' | 'standard'
  initials: string
}

// API response interface for rankings
interface RankingUser {
  user_id: string
  total_points: number
  total_coins: number
  current_level: number
  current_rank: number
  user_type: 'student' | 'teacher'
  user: {
    id: string
    full_name: string
    avatar_url?: string
    email: string
  }
}

// Transform API data to local User interface
const transformRankingUser = (apiUser: RankingUser): User => ({
  id: apiUser.user_id,
  name: apiUser.user.full_name,
  userType: apiUser.user_type,
  points: apiUser.total_points || 0,
  level: apiUser.current_level || 1,
  coins: apiUser.total_coins || 0,
  performanceTier: apiUser.total_points > 2500 ? 'excellent' : apiUser.total_points > 1500 ? 'good' : 'standard',
  initials: apiUser.user.full_name
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
})

interface RankingsStats {
  totalUsers: number
  studentsCount: number
  teachersCount: number
  totalPoints: number
  activeAchievements: number
  averageEngagement: number
}

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

export function WorkingRankings() {
  const [activeTab, setActiveTab] = useState('overview')
  const [userTypeFilter, setUserTypeFilter] = useState<'student' | 'teacher' | 'combined'>('combined')
  const [stats, setStats] = useState<RankingsStats>({
    totalUsers: 0,
    studentsCount: 0,
    teachersCount: 0,
    totalPoints: 0,
    activeAchievements: 0,
    averageEngagement: 0
  })
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showAchievementModal, setShowAchievementModal] = useState(false)

  useEffect(() => {
    const fetchRankingsStats = async () => {
      try {
        setLoading(true)
        
        // Fetch rankings data from API
        const response = await fetch('/api/rankings')
        const data = await response.json()
        
        if (data && data.stats) {
          setStats({
            totalUsers: data.stats.total_users || 0,
            studentsCount: data.stats.students_count || 0,
            teachersCount: data.stats.teachers_count || 0,
            totalPoints: data.stats.total_points || 0,
            activeAchievements: 0, // We'll calculate this from achievements API
            averageEngagement: data.stats.average_engagement || 0
          })
        }
      } catch (error) {
        console.error('Failed to fetch rankings stats:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchAnalyticsData = async () => {
      try {
        setAnalyticsLoading(true)
        
        // Fetch analytics data from API
        const response = await fetch('/api/rankings/analytics')
        const data = await response.json()
        
        if (data) {
          setAnalyticsData(data)
        }
      } catch (error) {
        console.error('Failed to fetch analytics data:', error)
      } finally {
        setAnalyticsLoading(false)
      }
    }

    const fetchUsers = async () => {
      try {
        setUsersLoading(true)
        const response = await fetch('/api/rankings?limit=100')
        const data = await response.json()
        
        if (data && data.rankings) {
          const transformedUsers = data.rankings.map(transformRankingUser)
          setUsers(transformedUsers)
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setUsersLoading(false)
      }
    }

    fetchRankingsStats()
    fetchAnalyticsData()
    fetchUsers()
  }, [])

  const refreshData = useCallback(async () => {
    setLoading(true)
    setUsersLoading(true)
    try {
      // Refresh all data
      const [statsResponse, usersResponse] = await Promise.all([
        fetch('/api/rankings'),
        fetch('/api/rankings?limit=100')
      ])
      
      const [statsData, usersData] = await Promise.all([
        statsResponse.json(),
        usersResponse.json()
      ])
      
      // Update stats
      if (statsData && statsData.stats) {
        setStats({
          totalUsers: statsData.stats.total_users || 0,
          studentsCount: statsData.stats.students_count || 0,
          teachersCount: statsData.stats.teachers_count || 0,
          totalPoints: statsData.stats.total_points || 0,
          activeAchievements: 0,
          averageEngagement: statsData.stats.average_engagement || 0
        })
      }
      
      // Update users
      if (usersData && usersData.rankings) {
        const transformedUsers = usersData.rankings.map(transformRankingUser)
        setUsers(transformedUsers)
      }
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setLoading(false)
      setUsersLoading(false)
    }
  }, [])

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => b.points - a.points)

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
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading...' : `${stats.studentsCount} students, ${stats.teachersCount} teachers`}
            </p>
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
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Total points awarded
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
            <div className="text-2xl font-bold">{loading ? '...' : stats.activeAchievements}</div>
            <p className="text-xs text-muted-foreground">Available achievements</p>
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
            <div className="text-2xl font-bold">{loading ? '...' : `${stats.averageEngagement}%`}</div>
            <p className="text-xs text-muted-foreground">Across all participants</p>
          </CardContent>
        </Card>
      </div>

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
                        onClick={() => console.log('Award Points clicked - Implementation needed')}
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
                        onClick={() => console.log('Approve Reward clicked - Implementation needed')}
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
                      <Button className="w-full justify-start" variant="secondary" size="sm">
                        <Star className="h-4 w-4 mr-2" />
                        Recognition Award
                      </Button>
                      <Button className="w-full justify-start" variant="outline" size="sm">
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
                      <div className="flex items-center justify-between p-2 rounded bg-green-50">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium">
                            AK
                          </div>
                          <span><strong>Ali Karimov</strong> earned 15 points</span>
                        </div>
                        <span className="text-muted-foreground text-xs">2m ago</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-purple-50">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-medium">
                            NK
                          </div>
                          <span><strong>Nargiza</strong> unlocked achievement</span>
                        </div>
                        <span className="text-muted-foreground text-xs">5m ago</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-blue-50">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">
                            DR
                          </div>
                          <span><strong>Dilshod</strong> redeemed reward</span>
                        </div>
                        <span className="text-muted-foreground text-xs">8m ago</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Leaderboards Tab */}
            <TabsContent value="leaderboards" className="mt-6">
              <IntegratedRankingsLeaderboard />
            </TabsContent>

            {/* Other tabs with basic content */}
            <TabsContent value="achievements" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Medal className="h-5 w-5" />
                        Achievement Management
                      </CardTitle>
                      <CardDescription>Create, edit, and manage achievement settings</CardDescription>
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Achievement
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">5</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">4</div>
                      <div className="text-sm text-muted-foreground">Active</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold text-gray-600">1</div>
                      <div className="text-sm text-muted-foreground">Inactive</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">1</div>
                      <div className="text-sm text-muted-foreground">Archived</div>
                    </Card>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { title: 'Perfect Attendance', description: 'Attended all classes for a full month', type: 'Attendance', rarity: 'common', points: 100, coins: 50 },
                      { title: 'Homework Champion', description: 'Completed all homework assignments', type: 'Homework', rarity: 'common', points: 75, coins: 25 },
                      { title: 'Level 5 Scholar', description: 'Reached Level 5 in the ranking system', type: 'Milestone', rarity: 'epic', points: 200, coins: 100 }
                    ].map((achievement, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                            🏆
                          </div>
                          <div>
                            <h3 className="font-medium">{achievement.title}</h3>
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{achievement.type}</Badge>
                              <Badge className={`${
                                achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {achievement.rarity}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-yellow-600">
                              +{achievement.points} pts
                            </Badge>
                            <Badge variant="outline" className="text-green-600">
                              +{achievement.coins} coins
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Referral Achievements Integration */}
                  <div className="mt-8">
                    <ReferralAchievementsIntegration showProgress={true} maxDisplay={6} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="points" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Points Management</CardTitle>
                  <CardDescription>Award and manage points for students and teachers</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button>
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

            <TabsContent value="analytics" className="mt-6">
              <RankingsAnalyticsDashboard userTypeFilter={userTypeFilter} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Achievement Award Modal */}
      <AwardAchievementModal
        open={showAchievementModal}
        onOpenChange={setShowAchievementModal}
        users={users}
        onSuccess={refreshData}
      />
    </div>
  )
}