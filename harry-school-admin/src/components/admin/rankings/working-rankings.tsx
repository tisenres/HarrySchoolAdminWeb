'use client'

import { useState } from 'react'
import { IntegratedRankingsLeaderboard } from './integrated-rankings-leaderboard'
import { ReferralAchievementsIntegration } from './referral-achievements-integration'
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

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Nargiza Karimova',
    userType: 'teacher',
    points: 3200,
    level: 15,
    efficiency: 94.5,
    coins: 160,
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
    coins: 149,
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
    performanceTier: 'good',
    initials: 'MN'
  }
]

export function WorkingRankings() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredUsers = mockUsers.filter(user => 
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
              <Card>
                <CardHeader>
                  <CardTitle>Analytics Dashboard</CardTitle>
                  <CardDescription>Performance metrics and insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <Card className="p-4">
                      <div className="text-2xl font-bold">245</div>
                      <div className="text-sm text-muted-foreground">Total Participants</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-2xl font-bold">62.9</div>
                      <div className="text-sm text-muted-foreground">Avg Points Per User</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-2xl font-bold">158</div>
                      <div className="text-sm text-muted-foreground">Total Achievements</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-2xl font-bold">Wednesday</div>
                      <div className="text-sm text-muted-foreground">Most Active Day</div>
                    </Card>
                  </div>
                  <p className="text-muted-foreground">Detailed analytics charts coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}