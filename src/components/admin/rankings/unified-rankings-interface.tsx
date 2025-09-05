'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Trophy, 
  Users, 
  UserCheck, 
  Award, 
  Target, 
  TrendingUp,
  Medal,
  Gift,
  ChartLine
} from 'lucide-react'

// Import existing components (to be extended)
import { PointsManagementInterface } from '@/components/admin/points/points-management-interface'
import { AchievementManagement } from '@/components/admin/achievements/achievement-management'
import RewardsManagementDashboard from '@/components/admin/rewards/rewards-management-dashboard'

// New unified components (to be created)
import { UnifiedLeaderboard } from './unified-leaderboard'
import { RankingsAnalyticsDashboard } from './rankings-analytics-dashboard'
import { QuickRankingActions } from './quick-ranking-actions'

interface UnifiedRankingsInterfaceProps {
  defaultTab?: string
  defaultUserType?: 'student' | 'teacher' | 'combined'
}

export function UnifiedRankingsInterface({
  defaultTab = 'overview',
  defaultUserType = 'combined'
}: UnifiedRankingsInterfaceProps) {
  const t = useTranslations('rankings')
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [userTypeFilter, setUserTypeFilter] = useState<'student' | 'teacher' | 'combined'>(defaultUserType)
  const [isLoading, setIsLoading] = useState(false)

  // Quick stats data (mock for now - will be replaced with real API calls)
  const [quickStats, setQuickStats] = useState({
    totalUsers: 245,
    totalStudents: 220,
    totalTeachers: 25,
    totalPointsAwarded: 15420,
    activeAchievements: 24,
    pendingRewards: 8,
    averageEngagement: 87.5
  })

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Update URL params without page reload
    const url = new URL(window.location.href)
    url.searchParams.set('tab', value)
    window.history.replaceState({}, '', url.toString())
  }

  const handleUserTypeChange = (value: 'student' | 'teacher' | 'combined') => {
    setUserTypeFilter(value)
    // Update URL params without page reload
    const url = new URL(window.location.href)
    url.searchParams.set('userType', value)
    window.history.replaceState({}, '', url.toString())
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Bar */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {userTypeFilter === 'student' ? t('totalStudents') : 
               userTypeFilter === 'teacher' ? t('totalTeachers') : 
               t('totalUsers')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userTypeFilter === 'student' ? quickStats.totalStudents : 
               userTypeFilter === 'teacher' ? quickStats.totalTeachers : 
               quickStats.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              {userTypeFilter === 'combined' && (
                <span>{quickStats.totalStudents} students, {quickStats.totalTeachers} teachers</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalPointsAwarded')}</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.totalPointsAwarded.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('activeAchievements')}</CardTitle>
            <Medal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.activeAchievements}</div>
            <p className="text-xs text-muted-foreground">
              {quickStats.pendingRewards} pending rewards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('averageEngagement')}</CardTitle>
            <ChartLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.averageEngagement}%</div>
            <p className="text-xs text-muted-foreground">
              Across all participants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Interface */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{t('rankingsManagement')}</CardTitle>
              <CardDescription>
                {t('managementDescription')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={userTypeFilter} onValueChange={handleUserTypeChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combined">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t('combined')}
                    </div>
                  </SelectItem>
                  <SelectItem value="student">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t('studentsOnly')}
                    </div>
                  </SelectItem>
                  <SelectItem value="teacher">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      {t('teachersOnly')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="border-b px-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  {t('overview')}
                </TabsTrigger>
                <TabsTrigger value="leaderboards" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {t('leaderboards')}
                </TabsTrigger>
                <TabsTrigger value="points" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  {t('points')}
                </TabsTrigger>
                <TabsTrigger value="achievements" className="flex items-center gap-2">
                  <Medal className="h-4 w-4" />
                  {t('achievements')}
                </TabsTrigger>
                <TabsTrigger value="rewards" className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  {t('rewards')}
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <ChartLine className="h-4 w-4" />
                  {t('analytics')}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="overview" className="space-y-6 m-0">
                <QuickRankingActions userTypeFilter={userTypeFilter} />
                <UnifiedLeaderboard userTypeFilter={userTypeFilter} />
              </TabsContent>

              <TabsContent value="leaderboards" className="m-0">
                <UnifiedLeaderboard 
                  userTypeFilter={userTypeFilter}
                  detailed={true}
                />
              </TabsContent>

              <TabsContent value="points" className="m-0">
                <PointsManagementInterface />
              </TabsContent>

              <TabsContent value="achievements" className="m-0">
                <AchievementManagement />
              </TabsContent>

              <TabsContent value="rewards" className="m-0">
                <RewardsManagementDashboard />
              </TabsContent>

              <TabsContent value="analytics" className="m-0">
                <RankingsAnalyticsDashboard userTypeFilter={userTypeFilter} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}