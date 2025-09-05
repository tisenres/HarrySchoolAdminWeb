'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  UserPlus, 
  Trophy, 
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Filter,
  Loader2
} from 'lucide-react'
import type { ReferralAnalytics } from '@/types/referral'
import { referralAdminService } from '@/lib/services/referral-admin-service'
import { fadeVariants } from '@/lib/animations'

interface ReferralAnalyticsPanelProps {
  organizationId: string
  className?: string
  onExportData?: () => void
}

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ComponentType<{ className?: string }>
  color?: string
  format?: 'number' | 'percentage' | 'currency'
}

function MetricCard({ title, value, change, icon: Icon, color = 'text-blue-600', format = 'number' }: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (format === 'percentage') {
      return `${val}%`
    }
    if (format === 'currency') {
      return `$${val}`
    }
    return val.toString()
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{formatValue(value)}</p>
            {change !== undefined && (
              <div className={`flex items-center space-x-1 text-xs ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(change)}% vs last month</span>
              </div>
            )}
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  )
}

export function ReferralAnalyticsPanel({ 
  organizationId, 
  className = '',
  onExportData 
}: ReferralAnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<ReferralAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [viewType, setViewType] = useState<'overview' | 'trends' | 'referrers'>('overview')

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true)
      try {
        const dateRange = getDateRange(timeRange)
        const data = await referralAdminService.getReferralAnalytics(organizationId, dateRange)
        setAnalytics(data)
      } catch (error) {
        console.error('Error loading referral analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    if (organizationId) {
      loadAnalytics()
    }
  }, [organizationId, timeRange])

  const getDateRange = (range: string) => {
    const end = new Date()
    const start = new Date()
    
    switch (range) {
      case '7d':
        start.setDate(end.getDate() - 7)
        break
      case '30d':
        start.setDate(end.getDate() - 30)
        break
      case '90d':
        start.setDate(end.getDate() - 90)
        break
      case '1y':
        start.setFullYear(end.getFullYear() - 1)
        break
    }
    
    return {
      start: start.toISOString(),
      end: end.toISOString()
    }
  }

  const getTopPerformers = () => {
    if (!analytics) return []
    return analytics.top_referrers
      .sort((a, b) => b.conversion_rate - a.conversion_rate)
      .slice(0, 5)
  }

  const getConversionTrend = () => {
    if (!analytics) return 0
    const recent = analytics.monthly_breakdown.slice(-2)
    if (recent.length < 2) return 0
    
    const current = recent[1]?.conversions || 0
    const previous = recent[0]?.conversions || 0
    
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="p-6 text-center">
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Referral Data</h3>
            <p className="text-muted-foreground">
              Start collecting referrals to see analytics here.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <motion.div 
      className={`space-y-6 ${className}`}
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Referral Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Track referral performance and conversion rates
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={viewType} onValueChange={(value: any) => setViewType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="trends">Trends</SelectItem>
              <SelectItem value="referrers">Top Referrers</SelectItem>
            </SelectContent>
          </Select>

          {onExportData && (
            <Button variant="outline" size="sm" onClick={onExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Overview Metrics */}
      {viewType === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Referrals"
              value={analytics.total_referrals}
              icon={UserPlus}
              color="text-blue-600"
            />
            <MetricCard
              title="Successful Conversions"
              value={analytics.successful_conversions}
              change={getConversionTrend()}
              icon={Target}
              color="text-green-600"
            />
            <MetricCard
              title="Conversion Rate"
              value={analytics.conversion_rate.toFixed(1)}
              icon={TrendingUp}
              color="text-purple-600"
              format="percentage"
            />
            <MetricCard
              title="Points Awarded"
              value={analytics.total_points_earned}
              icon={Trophy}
              color="text-yellow-600"
            />
          </div>

          {/* Quick Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Monthly Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.monthly_breakdown.slice(-6).map((month) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-medium">
                          {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="text-muted-foreground">
                          {month.referrals} referrals
                        </div>
                        <div className="text-green-600 font-medium">
                          {month.conversions} converted
                        </div>
                        <div className="text-yellow-600">
                          {month.points} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Referrers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Top Performers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getTopPerformers().map((referrer, index) => (
                    <div key={referrer.referrer_id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{referrer.referrer_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {referrer.referrer_type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {referrer.conversion_rate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {referrer.successful_referrals}/{referrer.total_referrals}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Trends View */}
      {viewType === 'trends' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Referral Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Trend Chart Placeholder */}
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Chart visualization would go here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Integration with charting library needed
                  </p>
                </div>
              </div>

              {/* Trend Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(analytics.conversion_rate)}%
                  </div>
                  <p className="text-sm text-blue-800">Average Conversion</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analytics.monthly_breakdown.reduce((sum, m) => sum + m.referrals, 0)}
                  </div>
                  <p className="text-sm text-green-800">Total Period Referrals</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {analytics.monthly_breakdown.reduce((sum, m) => sum + m.points, 0)}
                  </div>
                  <p className="text-sm text-yellow-800">Points Awarded</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Referrers View */}
      {viewType === 'referrers' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>All Referrers Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.top_referrers.map((referrer, index) => (
                <div key={referrer.referrer_id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                        {referrer.referrer_name[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h4 className="font-medium">{referrer.referrer_name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {referrer.referrer_type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={referrer.conversion_rate >= 70 ? 'default' : 'secondary'}
                        className={referrer.conversion_rate >= 70 ? 'bg-green-100 text-green-800' : ''}
                      >
                        {referrer.conversion_rate.toFixed(1)}% success
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-blue-600">{referrer.total_referrals}</div>
                      <p className="text-muted-foreground">Total Referrals</p>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-green-600">{referrer.successful_referrals}</div>
                      <p className="text-muted-foreground">Successful</p>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-yellow-600">{referrer.points_earned}</div>
                      <p className="text-muted-foreground">Points Earned</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}