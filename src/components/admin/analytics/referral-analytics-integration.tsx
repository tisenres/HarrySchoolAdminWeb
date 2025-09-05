'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Scatter
} from 'recharts'
import { 
  TrendingUp,
  TrendingDown,
  Users,
  UserPlus,
  Target,
  DollarSign,
  Award,
  Zap,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Crown,
  Star,
  Calendar,
  Download,
  Filter
} from 'lucide-react'
import type { ReferralAnalytics } from '@/types/referral'
import { referralAdminService } from '@/lib/services/referral-admin-service'

// Enhanced types for referral correlation analytics
interface ReferralCorrelationData {
  month: string
  referral_volume: number
  conversion_rate: number
  academic_performance_avg: number
  student_retention: number
  roi_percentage: number
}

interface ReferralStudentPerformance {
  student_id: string
  student_name: string
  referral_source: 'direct' | 'referral'
  enrollment_date: string
  academic_score: number
  attendance_rate: number
  satisfaction_rating: number
  current_status: 'active' | 'completed' | 'paused'
  referred_by?: string
}

interface ReferralROIMetrics {
  total_referrals: number
  successful_conversions: number
  conversion_rate: number
  revenue_from_referrals: number
  referral_program_cost: number
  roi_percentage: number
  average_customer_lifetime_value: number
  referral_vs_organic_performance: {
    referral_retention_rate: number
    organic_retention_rate: number
    referral_satisfaction: number
    organic_satisfaction: number
  }
}

interface ReferralEngagementCorrelation {
  referrer_id: string
  referrer_name: string
  referrer_type: 'student' | 'teacher'
  referrer_performance: number
  total_referrals: number
  successful_referrals: number
  referral_quality_score: number
  engagement_correlation: number
}

interface ReferralAnalyticsIntegrationProps {
  organizationId: string
  className?: string
  timeRange: 'week' | 'month' | 'quarter' | 'year'
  selectedDepartment: string
}

export function ReferralAnalyticsIntegration({
  organizationId,
  className = '',
  timeRange,
  selectedDepartment
}: ReferralAnalyticsIntegrationProps) {
  const [referralAnalytics, setReferralAnalytics] = useState<ReferralAnalytics | null>(null)
  const [referralCorrelation, setReferralCorrelation] = useState<ReferralCorrelationData[]>([])
  const [studentPerformance, setStudentPerformance] = useState<ReferralStudentPerformance[]>([])
  const [roiMetrics, setRoiMetrics] = useState<ReferralROIMetrics | null>(null)
  const [engagementCorrelation, setEngagementCorrelation] = useState<ReferralEngagementCorrelation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReferralData = async () => {
      setLoading(true)
      
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const dateRange = getDateRange(timeRange)
        const analytics = await referralAdminService.getReferralAnalytics(organizationId, dateRange)
        
        // Mock correlation data - integrate with existing academic performance data
        const mockCorrelationData: ReferralCorrelationData[] = [
          { month: 'Jan', referral_volume: 12, conversion_rate: 75, academic_performance_avg: 82, student_retention: 94, roi_percentage: 145 },
          { month: 'Feb', referral_volume: 18, conversion_rate: 83, academic_performance_avg: 85, student_retention: 96, roi_percentage: 162 },
          { month: 'Mar', referral_volume: 15, conversion_rate: 80, academic_performance_avg: 84, student_retention: 95, roi_percentage: 158 },
          { month: 'Apr', referral_volume: 22, conversion_rate: 86, academic_performance_avg: 87, student_retention: 97, roi_percentage: 171 },
          { month: 'May', referral_volume: 25, conversion_rate: 88, academic_performance_avg: 89, student_retention: 98, roi_percentage: 182 },
          { month: 'Jun', referral_volume: 20, conversion_rate: 85, academic_performance_avg: 86, student_retention: 96, roi_percentage: 167 }
        ]

        // Mock student performance comparison
        const mockStudentPerformance: ReferralStudentPerformance[] = [
          {
            student_id: 's1',
            student_name: 'Alex Chen',
            referral_source: 'referral',
            enrollment_date: '2024-01-15',
            academic_score: 92,
            attendance_rate: 98,
            satisfaction_rating: 4.8,
            current_status: 'active',
            referred_by: 'Maya Patel'
          },
          {
            student_id: 's2', 
            student_name: 'Jordan Smith',
            referral_source: 'direct',
            enrollment_date: '2024-01-20',
            academic_score: 78,
            attendance_rate: 85,
            satisfaction_rating: 4.2,
            current_status: 'active'
          },
          {
            student_id: 's3',
            student_name: 'Sam Rodriguez',
            referral_source: 'referral',
            enrollment_date: '2024-02-10',
            academic_score: 89,
            attendance_rate: 96,
            satisfaction_rating: 4.7,
            current_status: 'active',
            referred_by: 'Alex Thompson'
          }
        ]

        // Mock ROI metrics
        const mockROIMetrics: ReferralROIMetrics = {
          total_referrals: analytics?.total_referrals || 0,
          successful_conversions: analytics?.successful_conversions || 0,
          conversion_rate: analytics?.conversion_rate || 0,
          revenue_from_referrals: 45600,
          referral_program_cost: 8200,
          roi_percentage: 456,
          average_customer_lifetime_value: 2850,
          referral_vs_organic_performance: {
            referral_retention_rate: 94,
            organic_retention_rate: 82,
            referral_satisfaction: 4.6,
            organic_satisfaction: 4.1
          }
        }

        // Mock engagement correlation
        const mockEngagementCorrelation: ReferralEngagementCorrelation[] = [
          {
            referrer_id: 'u1',
            referrer_name: 'Maya Patel',
            referrer_type: 'student',
            referrer_performance: 95,
            total_referrals: 8,
            successful_referrals: 7,
            referral_quality_score: 92,
            engagement_correlation: 0.89
          },
          {
            referrer_id: 'u2',
            referrer_name: 'Alex Thompson',
            referrer_type: 'student', 
            referrer_performance: 88,
            total_referrals: 6,
            successful_referrals: 5,
            referral_quality_score: 85,
            engagement_correlation: 0.76
          }
        ]

        setReferralAnalytics(analytics)
        setReferralCorrelation(mockCorrelationData)
        setStudentPerformance(mockStudentPerformance)
        setRoiMetrics(mockROIMetrics)
        setEngagementCorrelation(mockEngagementCorrelation)
      } catch (error) {
        console.error('Error loading referral analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    if (organizationId) {
      fetchReferralData()
    }
  }, [organizationId, timeRange, selectedDepartment])

  const getDateRange = (range: string) => {
    const end = new Date()
    const start = new Date()
    
    switch (range) {
      case 'week':
        start.setDate(end.getDate() - 7)
        break
      case 'month':
        start.setDate(end.getDate() - 30)
        break
      case 'quarter':
        start.setDate(end.getDate() - 90)
        break
      case 'year':
        start.setFullYear(end.getFullYear() - 1)
        break
    }
    
    return {
      start: start.toISOString(),
      end: end.toISOString()
    }
  }

  const getReferralvsOrganicData = () => {
    const referralStudents = studentPerformance.filter(s => s.referral_source === 'referral')
    const organicStudents = studentPerformance.filter(s => s.referral_source === 'direct')
    
    return [
      {
        source: 'Referral Students',
        academic_score: referralStudents.reduce((sum, s) => sum + s.academic_score, 0) / referralStudents.length || 0,
        attendance_rate: referralStudents.reduce((sum, s) => sum + s.attendance_rate, 0) / referralStudents.length || 0,
        satisfaction: referralStudents.reduce((sum, s) => sum + s.satisfaction_rating, 0) / referralStudents.length || 0,
        count: referralStudents.length
      },
      {
        source: 'Direct Enrollment',
        academic_score: organicStudents.reduce((sum, s) => sum + s.academic_score, 0) / organicStudents.length || 0,
        attendance_rate: organicStudents.reduce((sum, s) => sum + s.attendance_rate, 0) / organicStudents.length || 0,
        satisfaction: organicStudents.reduce((sum, s) => sum + s.satisfaction_rating, 0) / organicStudents.length || 0,
        count: organicStudents.length
      }
    ]
  }

  const getCorrelationStrengthColor = (correlation: number) => {
    if (correlation >= 0.8) return 'text-green-600'
    if (correlation >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse">
                <div className="h-64 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Referral Performance Metrics Integration */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Referral Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {referralAnalytics?.conversion_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12.3% vs organic enrollment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Referral Program ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {roiMetrics?.roi_percentage.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue vs investment ratio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Referred Student Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {getReferralvsOrganicData()[0]?.academic_score.toFixed(0) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +{((getReferralvsOrganicData()[0]?.academic_score || 0) - (getReferralvsOrganicData()[1]?.academic_score || 0)).toFixed(0)} vs direct enrollment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Referral Retention Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {roiMetrics?.referral_vs_organic_performance.referral_retention_rate.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +{(roiMetrics?.referral_vs_organic_performance.referral_retention_rate || 0) - (roiMetrics?.referral_vs_organic_performance.organic_retention_rate || 0)}% vs organic
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Correlation with Academic Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Referral Impact on Academic Performance & Retention
          </CardTitle>
          <CardDescription>
            Correlation between referral volume, student performance, and organizational growth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={referralCorrelation}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="referral_volume" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Referral Volume"
                />
                <Line 
                  type="monotone" 
                  dataKey="conversion_rate" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Conversion Rate (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="academic_performance_avg" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  name="Academic Performance (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="student_retention" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  name="Student Retention (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Referral vs Direct Student Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Referred vs Direct Student Performance
            </CardTitle>
            <CardDescription>
              Comparative analysis of student success by enrollment source
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getReferralvsOrganicData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="academic_score" fill="#3B82F6" name="Academic Score" />
                  <Bar dataKey="attendance_rate" fill="#10B981" name="Attendance Rate" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {getReferralvsOrganicData()[0]?.count || 0}
                </div>
                <p className="text-blue-800">Referred Students</p>
                <p className="text-xs text-blue-600 mt-1">
                  Avg Satisfaction: {getReferralvsOrganicData()[0]?.satisfaction.toFixed(1) || 0}/5
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-600">
                  {getReferralvsOrganicData()[1]?.count || 0}
                </div>
                <p className="text-gray-800">Direct Enrollment</p>
                <p className="text-xs text-gray-600 mt-1">
                  Avg Satisfaction: {getReferralvsOrganicData()[1]?.satisfaction.toFixed(1) || 0}/5
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral ROI Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Referral Program ROI Analysis
            </CardTitle>
            <CardDescription>
              Financial impact and program effectiveness metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roiMetrics && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ${roiMetrics.revenue_from_referrals.toLocaleString()}
                    </div>
                    <p className="text-sm text-green-800">Revenue from Referrals</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      ${roiMetrics.referral_program_cost.toLocaleString()}
                    </div>
                    <p className="text-sm text-red-800">Program Investment</p>
                  </div>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {roiMetrics.roi_percentage}%
                  </div>
                  <p className="text-purple-800 font-medium">Return on Investment</p>
                  <p className="text-xs text-purple-600 mt-1">
                    ${((roiMetrics.revenue_from_referrals - roiMetrics.referral_program_cost) / roiMetrics.referral_program_cost * 100).toFixed(0)}% net profit margin
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Avg Customer Lifetime Value</span>
                    <span className="font-medium">${roiMetrics.average_customer_lifetime_value.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Successful Conversions</span>
                    <span className="font-medium">{roiMetrics.successful_conversions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Conversion Rate</span>
                    <span className="font-medium">{roiMetrics.conversion_rate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Referrer Performance & Engagement Correlation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Referrer Performance & Engagement Correlation
          </CardTitle>
          <CardDescription>
            Analysis of referrer quality and their own performance correlation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {engagementCorrelation.map((referrer, index) => (
              <div key={referrer.referrer_id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold">
                      {referrer.referrer_name.charAt(0)}
                    </div>
                    {index === 0 && (
                      <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold">{referrer.referrer_name}</h4>
                    <p className="text-sm text-muted-foreground capitalize">
                      {referrer.referrer_type} • Performance: {referrer.referrer_performance}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{referrer.total_referrals}</div>
                    <div className="text-xs text-muted-foreground">Total Referrals</div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{referrer.successful_referrals}</div>
                    <div className="text-xs text-muted-foreground">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{referrer.referral_quality_score}</div>
                    <div className="text-xs text-muted-foreground">Quality Score</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getCorrelationStrengthColor(referrer.engagement_correlation)}`}>
                      {(referrer.engagement_correlation * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Correlation</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}