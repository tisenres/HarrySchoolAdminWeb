'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Trophy, Target, Award, Medal, Gift, ChartLine, Plus, Users } from 'lucide-react'

export function SimpleRankings() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">220 students, 25 teachers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Points Awarded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15,420</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">8 pending rewards</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.5%</div>
            <p className="text-xs text-muted-foreground">Across all users</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Rankings Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Unified Rankings System</CardTitle>
          <CardDescription>Manage rankings, points, achievements, and rewards</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
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

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                      Award Points
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Medal className="h-4 w-4 mr-2" />
                      Give Achievement
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Gift className="h-4 w-4 mr-2" />
                      Approve Reward
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Ali Karimov earned 15 points</span>
                        <span className="text-muted-foreground">2m ago</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Nargiza unlocked achievement</span>
                        <span className="text-muted-foreground">5m ago</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Dilshod redeemed reward</span>
                        <span className="text-muted-foreground">8m ago</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="leaderboards" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Leading students and teachers by points</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                        <div className="flex items-center gap-3">
                          <span className="font-bold">#{i}</span>
                          <div>
                            <p className="font-medium">User Name {i}</p>
                            <p className="text-sm text-muted-foreground">Level {10 - i}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{1000 - i * 50} pts</p>
                          <p className="text-sm text-muted-foreground">+{20 - i} today</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="points" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Points Management</CardTitle>
                  <CardDescription>Award and manage points</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Award Points
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Achievement Management</CardTitle>
                  <CardDescription>Create and manage achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Achievement
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rewards" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Rewards Catalog</CardTitle>
                  <CardDescription>Manage reward items</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Reward
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics Dashboard</CardTitle>
                  <CardDescription>Performance metrics and insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Analytics data will be displayed here</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}