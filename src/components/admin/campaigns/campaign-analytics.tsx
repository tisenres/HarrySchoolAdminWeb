'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Target,
  Calendar,
  Clock,
  Award,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  Download,
  Share,
  RefreshCw
} from 'lucide-react'
import { motion } from 'framer-motion'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts'
import type { CampaignAnalytics, ReferralCampaign } from '@/types/referral-campaign'
import { fadeVariants, staggerContainer, staggerItem } from '@/lib/animations'

interface CampaignAnalyticsProps {
  campaigns: ReferralCampaign[]
  selectedCampaignId?: string
}

export function CampaignAnalytics({
  campaigns,
  selectedCampaignId
}: CampaignAnalyticsProps) {
  const [currentCampaignId, setCurrentCampaignId] = useState(selectedCampaignId || campaigns[0]?.id || '')
  const [selectedTab, setSelectedTab] = useState('performance')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [isLoading, setIsLoading] = useState(false)

  const currentCampaign = campaigns.find(c => c.id === currentCampaignId)

  // Mock analytics data extending existing analytics patterns
  const [analyticsData, setAnalyticsData] = useState<CampaignAnalytics>({
    campaign_id: 'camp1',
    campaign_title: 'Back to School 2024 Referral Drive',
    performance_metrics: {
      participation_rate: 78.5,
      completion_rate: 23.1,
      average_referrals_per_participant: 2.8,
      conversion_effectiveness: 73.9,
      engagement_score: 85.2,
      tier_distribution: {
        bronze: 40,
        silver: 35,
        gold: 20,
        platinum: 5
      }
    },
    daily_progress: [
      { date: new Date('2024-08-01'), new_participants: 8, daily_referrals: 3, daily_conversions: 2, achievement_unlocks: 5, tier_progressions: 1 },
      { date: new Date('2024-08-02'), new_participants: 12, daily_referrals: 7, daily_conversions: 4, achievement_unlocks: 8, tier_progressions: 2 },
      { date: new Date('2024-08-03'), new_participants: 6, daily_referrals: 5, daily_conversions: 4, achievement_unlocks: 6, tier_progressions: 1 },
      { date: new Date('2024-08-04'), new_participants: 9, daily_referrals: 8, daily_conversions: 5, achievement_unlocks: 10, tier_progressions: 3 },
      { date: new Date('2024-08-05'), new_participants: 15, daily_referrals: 12, daily_conversions: 9, achievement_unlocks: 15, tier_progressions: 4 },
      { date: new Date('2024-08-06'), new_participants: 7, daily_referrals: 6, daily_conversions: 4, achievement_unlocks: 7, tier_progressions: 2 },
      { date: new Date('2024-08-07'), new_participants: 11, daily_referrals: 9, daily_conversions: 7, achievement_unlocks: 12, tier_progressions: 2 },
      { date: new Date('2024-08-08'), new_participants: 5, daily_referrals: 4, daily_conversions: 3, achievement_unlocks: 5, tier_progressions: 1 },
      { date: new Date('2024-08-09'), new_participants: 8, daily_referrals: 6, daily_conversions: 5, achievement_unlocks: 8, tier_progressions: 2 },
      { date: new Date('2024-08-10'), new_participants: 10, daily_referrals: 8, daily_conversions: 6, achievement_unlocks: 11, tier_progressions: 3 },
      { date: new Date('2024-08-11'), new_participants: 4, daily_referrals: 3, daily_conversions: 2, achievement_unlocks: 4, tier_progressions: 1 },
      { date: new Date('2024-08-12'), new_participants: 6, daily_referrals: 5, daily_conversions: 4, achievement_unlocks: 6, tier_progressions: 2 },
      { date: new Date('2024-08-13'), new_participants: 9, daily_referrals: 7, daily_conversions: 5, achievement_unlocks: 9, tier_progressions: 2 },
      { date: new Date('2024-08-14'), new_participants: 7, daily_referrals: 6, daily_conversions: 5, achievement_unlocks: 8, tier_progressions: 2 },
      { date: new Date('2024-08-15'), new_participants: 3, daily_referrals: 2, daily_conversions: 1, achievement_unlocks: 3, tier_progressions: 0 },
      { date: new Date('2024-08-16'), new_participants: 8, daily_referrals: 6, daily_conversions: 4, achievement_unlocks: 8, tier_progressions: 1 },
      { date: new Date('2024-08-17'), new_participants: 12, daily_referrals: 10, daily_conversions: 8, achievement_unlocks: 14, tier_progressions: 3 }
    ],
    participant_insights: {
      most_active_time_of_day: '2:00 PM - 4:00 PM',
      peak_referral_days: ['Monday', 'Wednesday', 'Friday'],
      drop_off_points: ['Weekend inactivity', 'Week 3 plateau'],
      successful_participant_patterns: ['Early engagement', 'Team participation', 'Consistent activity']
    },
    campaign_impact: {
      total_new_enrollments: 29,
      enrollment_revenue_impact: 58000,
      participant_engagement_increase: 35.7,
      long_term_retention_improvement: 18.3
    },
    cross_system_integration: {
      goal_completion_correlation: 92.4,
      achievement_unlock_rate_increase: 45.8,
      overall_ranking_improvement: 28.6,
      points_system_engagement_boost: 67.2
    }
  })

  const chartColors = {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4'
  }

  const pieChartColors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B']

  // Prepare chart data
  const dailyProgressChartData = analyticsData.daily_progress.map(day => ({
    date: day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    participants: day.new_participants,
    referrals: day.daily_referrals,
    conversions: day.daily_conversions,
    achievements: day.achievement_unlocks,
    tierProgressions: day.tier_progressions
  }))

  const tierDistributionData = Object.entries(analyticsData.performance_metrics.tier_distribution).map(([tier, percentage]) => ({
    name: tier.charAt(0).toUpperCase() + tier.slice(1),
    value: percentage,
    color: {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2'
    }[tier] || '#8B5CF6'
  }))

  const getMetricTrend = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100
    return {
      value: Math.abs(change).toFixed(1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      color: change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
    }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <ArrowUp className="h-3 w-3" />
      case 'down': return <ArrowDown className="h-3 w-3" />
      default: return <Minus className="h-3 w-3" />
    }
  }

  if (!currentCampaign) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Campaign Selected</h3>
          <p className="text-muted-foreground">
            Select a campaign to view its analytics and performance metrics.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Campaign Analytics & Goal Integration Metrics
              </CardTitle>
              <CardDescription>
                Comprehensive performance analysis using existing analytics infrastructure
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              {campaigns.length > 1 && (
                <Select value={currentCampaignId} onValueChange={setCurrentCampaignId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button variant="outline" size="sm" onClick={() => setIsLoading(true)}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{analyticsData.performance_metrics.participation_rate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Participation Rate</div>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              {getTrendIcon('up')}
              <span className="text-xs">5.2%</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{analyticsData.performance_metrics.completion_rate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              {getTrendIcon('up')}
              <span className="text-xs">2.8%</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{analyticsData.performance_metrics.average_referrals_per_participant.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Avg Referrals</div>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              {getTrendIcon('up')}
              <span className="text-xs">0.4</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{analyticsData.performance_metrics.conversion_effectiveness.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Conversion Rate</div>
            </div>
            <div className="flex items-center gap-1 text-red-600">
              {getTrendIcon('down')}
              <span className="text-xs">1.2%</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{analyticsData.performance_metrics.engagement_score.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Engagement Score</div>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              {getTrendIcon('up')}
              <span className="text-xs">3.7</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{analyticsData.campaign_impact.total_new_enrollments}</div>
              <div className="text-sm text-muted-foreground">New Enrollments</div>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              {getTrendIcon('up')}
              <span className="text-xs">4</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Card>
        <CardHeader>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <div className="flex items-center justify-between">
              <TabsList className="grid w-fit grid-cols-4">
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="integration">Goal Integration</TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <TabsContent value="performance" className="space-y-6 mt-6">
              {/* Tier Distribution */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <PieChart className="h-4 w-4" />
                      Tier Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={tierDistributionData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}%`}
                          >
                            {tierDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 mt-4">
                      {tierDistributionData.map((tier) => (
                        <div key={tier.name} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: tier.color }}
                          ></div>
                          <span className="text-sm">{tier.name}: {tier.value}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Engagement Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Participation Rate</span>
                        <span className="text-sm text-muted-foreground">
                          {analyticsData.performance_metrics.participation_rate.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={analyticsData.performance_metrics.participation_rate} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Completion Rate</span>
                        <span className="text-sm text-muted-foreground">
                          {analyticsData.performance_metrics.completion_rate.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={analyticsData.performance_metrics.completion_rate} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Conversion Effectiveness</span>
                        <span className="text-sm text-muted-foreground">
                          {analyticsData.performance_metrics.conversion_effectiveness.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={analyticsData.performance_metrics.conversion_effectiveness} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Engagement Score</span>
                        <span className="text-sm text-muted-foreground">
                          {analyticsData.performance_metrics.engagement_score.toFixed(1)}/100
                        </span>
                      </div>
                      <Progress value={analyticsData.performance_metrics.engagement_score} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Campaign Impact */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Campaign Impact & ROI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {analyticsData.campaign_impact.total_new_enrollments}
                      </div>
                      <div className="text-sm text-muted-foreground">New Enrollments</div>
                      <div className="text-xs text-green-600 mt-1">
                        +4 from last period
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        ${analyticsData.campaign_impact.enrollment_revenue_impact.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Revenue Impact</div>
                      <div className="text-xs text-green-600 mt-1">
                        +12.5% ROI
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {analyticsData.campaign_impact.participant_engagement_increase.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Engagement Increase</div>
                      <div className="text-xs text-green-600 mt-1">
                        Above target
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {analyticsData.campaign_impact.long_term_retention_improvement.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Retention Improvement</div>
                      <div className="text-xs text-green-600 mt-1">
                        Sustained growth
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6 mt-6">
              {/* Daily Activity Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Daily Activity Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyProgressChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="participants" 
                          stroke={chartColors.primary} 
                          strokeWidth={2}
                          name="New Participants"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="referrals" 
                          stroke={chartColors.success} 
                          strokeWidth={2}
                          name="Daily Referrals"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="conversions" 
                          stroke={chartColors.warning} 
                          strokeWidth={2}
                          name="Conversions"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Achievement & Progression Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Achievement & Tier Progression Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyProgressChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="achievements" 
                          stackId="1"
                          stroke={chartColors.secondary} 
                          fill={chartColors.secondary}
                          name="Achievement Unlocks"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="tierProgressions" 
                          stackId="2"
                          stroke={chartColors.danger} 
                          fill={chartColors.danger}
                          name="Tier Progressions"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6 mt-6">
              {/* Participant Behavior Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Participant Behavior Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h5 className="font-medium mb-3">Activity Patterns</h5>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Most Active Time</span>
                          </div>
                          <Badge variant="outline">
                            {analyticsData.participant_insights.most_active_time_of_day}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Peak Days</span>
                          </div>
                          <div className="flex gap-1">
                            {analyticsData.participant_insights.peak_referral_days.map((day) => (
                              <Badge key={day} variant="secondary" className="text-xs">
                                {day.slice(0, 3)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-3">Success Patterns</h5>
                      <div className="space-y-2">
                        {analyticsData.participant_insights.successful_participant_patterns.map((pattern, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm">{pattern}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Drop-off Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Drop-off Points & Improvement Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.participant_insights.drop_off_points.map((point, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg border-orange-200 bg-orange-50">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <span className="font-medium">{point}</span>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Analyze
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h6 className="font-medium text-blue-800 mb-2">Recommended Actions</h6>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Implement weekend engagement activities to reduce inactivity</li>
                      <li>• Add mid-campaign milestone rewards to combat Week 3 plateau</li>
                      <li>• Introduce peer support features for sustained motivation</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integration" className="space-y-6 mt-6">
              {/* Goal System Integration Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Goal System Integration Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Goal Completion Correlation</span>
                          <span className="text-sm text-muted-foreground">
                            {analyticsData.cross_system_integration.goal_completion_correlation.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={analyticsData.cross_system_integration.goal_completion_correlation} />
                        <p className="text-xs text-muted-foreground mt-1">
                          Campaign participation strongly correlates with existing goal completion
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Achievement Unlock Rate Increase</span>
                          <span className="text-sm text-muted-foreground">
                            +{analyticsData.cross_system_integration.achievement_unlock_rate_increase.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={analyticsData.cross_system_integration.achievement_unlock_rate_increase} />
                        <p className="text-xs text-muted-foreground mt-1">
                          Campaign participation boosts overall achievement engagement
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Overall Ranking Improvement</span>
                          <span className="text-sm text-muted-foreground">
                            +{analyticsData.cross_system_integration.overall_ranking_improvement.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={analyticsData.cross_system_integration.overall_ranking_improvement} />
                        <p className="text-xs text-muted-foreground mt-1">
                          Participants show improved performance in main ranking system
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Points System Engagement Boost</span>
                          <span className="text-sm text-muted-foreground">
                            +{analyticsData.cross_system_integration.points_system_engagement_boost.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={analyticsData.cross_system_integration.points_system_engagement_boost} />
                        <p className="text-xs text-muted-foreground mt-1">
                          Campaign drives increased engagement with core points system
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Synergy Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    System Synergy Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 border rounded-lg bg-green-50 border-green-200">
                      <div className="text-lg font-bold text-green-600 mb-2">Excellent</div>
                      <div className="text-sm text-green-700">Goal Template Integration</div>
                      <div className="text-xs text-green-600 mt-1">
                        Campaign creation seamlessly uses existing goal frameworks
                      </div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg bg-blue-50 border-blue-200">
                      <div className="text-lg font-bold text-blue-600 mb-2">Strong</div>
                      <div className="text-sm text-blue-700">Achievement System Harmony</div>
                      <div className="text-xs text-blue-600 mt-1">
                        Campaign achievements complement existing achievement structure
                      </div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg bg-purple-50 border-purple-200">
                      <div className="text-lg font-bold text-purple-600 mb-2">Optimal</div>
                      <div className="text-sm text-purple-700">Points Transaction Flow</div>
                      <div className="text-xs text-purple-600 mt-1">
                        Campaign rewards integrate perfectly with existing points system
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                    <h6 className="font-medium text-gray-800 mb-2">Integration Success Highlights</h6>
                    <div className="grid gap-2 md:grid-cols-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Zero conflicts with existing goal framework</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span>Seamless leaderboard integration</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <span>Enhanced points transaction tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span>Unified analytics and reporting</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </motion.div>
  )
}

// Missing Pie import for chart
import { Pie } from 'recharts'