'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Gift, 
  ShoppingCart, 
  Clock, 
  Users,
  Calendar,
  Award
} from 'lucide-react'
import { useRewardsAnalytics } from '@/hooks/use-rewards-analytics'

export default function RewardsAnalytics() {
  const t = useTranslations('rewards')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
  )
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date())
  
  const { analytics, isLoading, error } = useRewardsAnalytics(dateFrom, dateTo)

  const handleDateChange = (from?: Date, to?: Date) => {
    setDateFrom(from)
    setDateTo(to)
  }

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            {t('analytics.noData')}
          </div>
        </CardContent>
      </Card>
    )
  }

  const { overview, popular_rewards, redemptions_by_status, redemptions_by_type, daily_trends, top_students } = analytics

  // Prepare chart data
  const statusChartData = Object.entries(redemptions_by_status).map(([status, count]) => ({
    name: t(`status.${status}`),
    value: count,
    status
  }))

  const typeChartData = Object.entries(redemptions_by_type).map(([type, count]) => ({
    name: t(`types.${type}`),
    value: count,
    type
  }))

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Period Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="space-y-2">
              <Label htmlFor="date-from">From</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleDateChange(new Date(e.target.value), dateTo)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">To</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleDateChange(dateFrom, new Date(e.target.value))}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateChange(
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  new Date()
                )}
              >
                Last 7 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateChange(
                  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  new Date()
                )}
              >
                Last 30 days
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-50">
                <Gift className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium leading-none">{t('analytics.totalRewards')}</p>
                <p className="text-2xl font-bold">{overview.total_rewards}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-50">
                <ShoppingCart className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium leading-none">{t('analytics.totalRedemptions')}</p>
                <p className="text-2xl font-bold">{overview.total_redemptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-orange-50">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium leading-none">{t('analytics.pendingRedemptions')}</p>
                <p className="text-2xl font-bold">{overview.pending_redemptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-50">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium leading-none">{t('analytics.activeStudents')}</p>
                <p className="text-2xl font-bold">{overview.active_students}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Redemptions by Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.redemptionsByStatus')}</CardTitle>
            <CardDescription>Distribution of redemption statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Redemptions by Type */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.redemptionsByType')}</CardTitle>
            <CardDescription>Popular reward types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trends */}
      {daily_trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.dailyTrends')}</CardTitle>
            <CardDescription>Redemption activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily_trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="redemptions" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Redemptions"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="coins_spent" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Coins Spent"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Popular Rewards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {t('analytics.popularRewards')}
            </CardTitle>
            <CardDescription>Most redeemed rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popular_rewards.slice(0, 5).map((reward, index) => (
                <div key={reward.reward_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{reward.reward_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t(`types.${reward.reward_type}`)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{reward.redemption_count} redemptions</p>
                    <p className="text-sm text-muted-foreground">
                      {reward.total_coins_spent} coins
                    </p>
                  </div>
                </div>
              ))}
              {popular_rewards.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No redemptions yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('analytics.topStudents')}
            </CardTitle>
            <CardDescription>Most active students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {top_students.slice(0, 5).map((student, index) => (
                <div key={student.student_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{student.student_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.redemption_count} redemptions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{student.total_coins_spent} coins</p>
                  </div>
                </div>
              ))}
              {top_students.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No active students yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Coins Spent</p>
                <p className="text-2xl font-bold">{overview.total_coins_spent}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('analytics.avgApprovalTime')}
                </p>
                <p className="text-2xl font-bold">
                  {overview.avg_approval_time_hours.toFixed(1)} {t('analytics.hours')}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approval Rate</p>
                <p className="text-2xl font-bold">
                  {overview.total_redemptions > 0 
                    ? ((overview.total_redemptions - overview.pending_redemptions) / overview.total_redemptions * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-50">
                <Award className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}