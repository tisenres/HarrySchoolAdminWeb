'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Plus, Gift, ShoppingCart, BarChart3, Clock, Award, Users, TrendingUp } from 'lucide-react'
import RewardsCatalogTable from './rewards-catalog-table'
import RedemptionsTable from './redemptions-table'
import RewardsAnalytics from './rewards-analytics'
import RewardForm from './reward-form'
import { useRewardsAnalytics } from '@/hooks/use-rewards-analytics'

export default function RewardsManagementDashboard() {
  const t = useTranslations('rewards')
  const [activeTab, setActiveTab] = useState('catalog')
  const [showRewardForm, setShowRewardForm] = useState(false)
  const { analytics, isLoading } = useRewardsAnalytics()

  const stats = [
    {
      title: t('analytics.totalRewards'),
      value: analytics?.overview.total_rewards || 0,
      icon: Gift,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: t('analytics.pendingRedemptions'),
      value: analytics?.overview.pending_redemptions || 0,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: t('analytics.totalRedemptions'),
      value: analytics?.overview.total_redemptions || 0,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: t('analytics.activeStudents'),
      value: analytics?.overview.active_students || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setShowRewardForm(true)} className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          {t('addReward')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <IconComponent className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium leading-none">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            {t('catalog')}
          </TabsTrigger>
          <TabsTrigger value="redemptions" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            {t('redemptions')}
            {(analytics?.overview.pending_redemptions || 0) > 0 && (
              <Badge variant="secondary" className="ml-1">
                {analytics?.overview.pending_redemptions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('analytics.title')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                {t('catalog')}
              </CardTitle>
              <CardDescription>
                Manage rewards available for student redemption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RewardsCatalogTable onEditReward={() => setShowRewardForm(true)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redemptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                {t('redemptions')}
              </CardTitle>
              <CardDescription>
                Review and manage student redemption requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RedemptionsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <RewardsAnalytics />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common rewards management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col gap-2"
              onClick={() => setShowRewardForm(true)}
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm">Create New Reward</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col gap-2"
              onClick={() => setActiveTab('redemptions')}
            >
              <Clock className="h-6 w-6" />
              <span className="text-sm">Review Pending</span>
              {(analytics?.overview.pending_redemptions || 0) > 0 && (
                <Badge variant="secondary">
                  {analytics?.overview.pending_redemptions}
                </Badge>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col gap-2"
              onClick={() => setActiveTab('analytics')}
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">View Analytics</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col gap-2"
              disabled
            >
              <Award className="h-6 w-6" />
              <span className="text-sm">Export Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reward Form Modal */}
      {showRewardForm && (
        <RewardForm
          isOpen={showRewardForm}
          onClose={() => setShowRewardForm(false)}
          onSave={() => {
            setShowRewardForm(false)
            // Refresh data
          }}
        />
      )}
    </div>
  )
}