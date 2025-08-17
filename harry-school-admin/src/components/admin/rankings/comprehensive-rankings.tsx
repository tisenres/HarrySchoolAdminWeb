'use client'

import { useState } from 'react'
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
}

interface Achievement {
  id: string
  title: string
  description: string
  type: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  pointReward: number
  coinReward: number
  status: 'active' | 'inactive' | 'archived'
  createdAt: string
  icon: string
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Nargiza Karimova',
    userType: 'teacher',
    points: 3200,
    level: 15,
    efficiency: 94.5,
    qualityScore: 88.2,
    coins: 160,
    progressToNext: 80,
    performanceTier: 'excellent',
    initials: 'NK'
  },
  {
    id: '2',
    name: 'Jasur Rakhimov',
    userType: 'teacher',
    points: 2980,
    level: 14,
    efficiency: 89.1,
    qualityScore: 91.7,
    coins: 149,
    progressToNext: 92,
    performanceTier: 'excellent',
    initials: 'JR'
  },
  {
    id: '3',
    name: 'Ali Karimov',
    userType: 'student',
    points: 2850,
    level: 12,
    coins: 145,
    progressToNext: 40,
    performanceTier: 'excellent',
    initials: 'AK'
  },
  {
    id: '4',
    name: 'Malika Nazarova',
    userType: 'student',
    points: 2640,
    level: 11,
    coins: 132,
    progressToNext: 65,
    performanceTier: 'good',
    initials: 'MN'
  }
]

const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Perfect Attendance',
    description: 'Attended all classes for a full month without any absences',
    type: 'Attendance',
    rarity: 'common',
    pointReward: 100,
    coinReward: 50,
    status: 'active',
    createdAt: 'Jan 15, 2024',
    icon: '🎯'
  },
  {
    id: '2',
    title: 'Homework Champion',
    description: 'Completed all homework assignments for two consecutive weeks',
    type: 'Homework',
    rarity: 'common',
    pointReward: 75,
    coinReward: 25,
    status: 'active',
    createdAt: 'Jan 10, 2024',
    icon: '📚'
  },
  {
    id: '3',
    title: 'Class Helper',
    description: 'Consistently helped classmates and showed excellent behavior',
    type: 'Behavior',
    rarity: 'common',
    pointReward: 60,
    coinReward: 30,
    status: 'active',
    createdAt: 'Jan 5, 2024',
    icon: '⭐'
  },
  {
    id: '4',
    title: 'Level 5 Scholar',
    description: 'Reached Level 5 in the ranking system',
    type: 'Milestone',
    rarity: 'epic',
    pointReward: 200,
    coinReward: 100,
    status: 'active',
    createdAt: 'Feb 1, 2024',
    icon: '🎓'
  }
]

export function ComprehensiveRankings() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('points')

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = userTypeFilter === 'all' || user.userType === userTypeFilter
    return matchesSearch && matchesType
  }).sort((a, b) => {
    if (sortBy === 'points') return b.points - a.points
    if (sortBy === 'level') return b.level - a.level
    return 0
  })

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
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">220 students, 25 teachers</p>
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
            <div className="text-2xl font-bold">15,420</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from last month
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
            <div className="text-2xl font-bold">87.5%</div>
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
                      <Button className="w-full justify-start" size="sm">
                        <Award className="h-4 w-4 mr-2" />
                        Award Points
                      </Button>
                      <Button className="w-full justify-start" variant="outline" size="sm">
                        <Medal className="h-4 w-4 mr-2" />
                        Give Achievement
                      </Button>
                      <Button className="w-full justify-start" variant="outline" size="sm">
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
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">AK</AvatarFallback>
                          </Avatar>
                          <span><strong>Ali Karimov</strong> earned 15 points</span>
                        </div>
                        <span className="text-muted-foreground text-xs">2m ago</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-purple-50">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">NK</AvatarFallback>
                          </Avatar>
                          <span><strong>Nargiza</strong> unlocked achievement</span>
                        </div>
                        <span className="text-muted-foreground text-xs">5m ago</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-blue-50">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">DR</AvatarFallback>
                          </Avatar>
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
                    <SelectItem value="points">Sort by Points</SelectItem>
                    <SelectItem value="level">Sort by Level</SelectItem>
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
                  {filteredUsers.map((user, index) => (
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
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="mt-6">
              <div className="space-y-6">
                {/* Achievement Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">5</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">4</div>
                      <div className="text-sm text-muted-foreground">Active</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">1</div>
                      <div className="text-sm text-muted-foreground">Inactive</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">1</div>
                      <div className="text-sm text-muted-foreground">Archived</div>
                    </div>
                  </Card>
                </div>

                {/* Achievement Management */}
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
                  <CardContent className="space-y-4">
                    {mockAchievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                            {achievement.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{achievement.title}</h3>
                              <Badge className={getRarityColor(achievement.rarity)}>
                                {achievement.rarity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{achievement.type}</span>
                              <span>Created {achievement.createdAt}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-yellow-600">
                              <Star className="h-3 w-3 mr-1" />
                              +{achievement.pointReward}
                            </Badge>
                            <Badge variant="outline" className="text-green-600">
                              <Award className="h-3 w-3 mr-1" />
                              +{achievement.coinReward}
                            </Badge>
                          </div>
                          <Badge className={`${
                            achievement.status === 'active' ? 'bg-green-100 text-green-800' :
                            achievement.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {achievement.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-6">
              <div className="space-y-6">
                {/* Analytics Overview */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">245</div>
                        <div className="text-sm text-muted-foreground">Total Participants</div>
                        <div className="text-xs text-green-600">+12% from last month</div>
                      </div>
                      <Users className="h-8 w-8 text-green-500" />
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">62.9</div>
                        <div className="text-sm text-muted-foreground">Avg Points Per User</div>
                        <div className="text-xs text-muted-foreground">Per user this month</div>
                      </div>
                      <Award className="h-8 w-8 text-blue-500" />
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">158</div>
                        <div className="text-sm text-muted-foreground">Total Achievements</div>
                        <div className="text-xs text-muted-foreground">Across all categories</div>
                      </div>
                      <Medal className="h-8 w-8 text-purple-500" />
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">Wednesday</div>
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
                        {['homework', 'participation', 'behavior', 'administrative'].map((category, index) => {
                          const values = [4200, 2900, 3000, 1800]
                          const maxValue = Math.max(...values)
                          const width = (values[index] / maxValue) * 100
                          
                          return (
                            <div key={category} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="capitalize">{category}</span>
                                <span className="font-medium">{values[index].toLocaleString()}</span>
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
                        {[
                          { label: 'Academic', percentage: 39, color: 'bg-orange-500' },
                          { label: 'Behavior', percentage: 28, color: 'bg-blue-500' },
                          { label: 'Attendance', percentage: 24, color: 'bg-green-500' },
                          { label: 'Special', percentage: 5, color: 'bg-purple-500' },
                          { label: 'Other', percentage: 3, color: 'bg-red-500' }
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${item.color}`} />
                              <span className="text-sm">{item.label}</span>
                            </div>
                            <span className="text-sm font-medium">{item.percentage}%</span>
                          </div>
                        ))}
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}