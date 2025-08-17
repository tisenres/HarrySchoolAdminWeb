'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterPlot,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { ReferralAnalyticsIntegration } from './referral-analytics-integration'
import { 
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  BookOpen,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Heart,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Crown,
  Star,
  UserPlus,
  DollarSign
} from 'lucide-react'

// Types for analytics data
interface CorrelationData {
  teacher_id: string
  teacher_name: string
  teacher_performance: number
  student_success_rate: number
  correlation_strength: number
  department: string
  student_count: number
  average_student_improvement: number
}

interface PeerInfluenceData {
  student_id: string
  student_name: string
  influence_score: number
  peers_impacted: number
  positive_outcomes: number
  collaboration_rating: number
  mentorship_activities: number
}

interface OrganizationalMetrics {
  total_correlation_strength: number
  teacher_student_alignment: number
  peer_influence_index: number
  organizational_health: number
  performance_trend: number
  roi_performance: number
}

interface PredictiveInsight {
  type: 'opportunity' | 'risk' | 'trend'
  title: string
  description: string
  confidence: number
  potential_impact: number
  recommended_action: string
}

export function UnifiedAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [correlationData, setCorrelationData] = useState<CorrelationData[]>([])
  const [peerInfluenceData, setPeerInfluenceData] = useState<PeerInfluenceData[]>([])
  const [organizationalMetrics, setOrganizationalMetrics] = useState<OrganizationalMetrics | null>(null)
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data - Replace with actual API calls
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock correlation data
      const mockCorrelationData: CorrelationData[] = [
        {
          teacher_id: 't1',
          teacher_name: 'Sarah Johnson',
          teacher_performance: 95,
          student_success_rate: 88,
          correlation_strength: 0.84,
          department: 'Mathematics',
          student_count: 24,
          average_student_improvement: 15.2
        },
        {
          teacher_id: 't2',
          teacher_name: 'Michael Chen',
          teacher_performance: 87,
          student_success_rate: 82,
          correlation_strength: 0.91,
          department: 'Science',
          student_count: 28,
          average_student_improvement: 12.8
        },
        {
          teacher_id: 't3',
          teacher_name: 'Emma Rodriguez',
          teacher_performance: 92,
          student_success_rate: 85,
          correlation_strength: 0.78,
          department: 'English',
          student_count: 22,
          average_student_improvement: 18.5
        },
        {
          teacher_id: 't4',
          teacher_name: 'David Wilson',
          teacher_performance: 78,
          student_success_rate: 71,
          correlation_strength: 0.65,
          department: 'History',
          student_count: 26,
          average_student_improvement: 8.3
        }
      ]

      // Mock peer influence data
      const mockPeerInfluenceData: PeerInfluenceData[] = [
        {
          student_id: 's1',
          student_name: 'Alex Thompson',
          influence_score: 95,
          peers_impacted: 12,
          positive_outcomes: 8,
          collaboration_rating: 4.8,
          mentorship_activities: 15
        },
        {
          student_id: 's2',
          student_name: 'Maya Patel',
          influence_score: 88,
          peers_impacted: 9,
          positive_outcomes: 7,
          collaboration_rating: 4.6,
          mentorship_activities: 12
        },
        {
          student_id: 's3',
          student_name: 'Jordan Lee',
          influence_score: 82,
          peers_impacted: 8,
          positive_outcomes: 6,
          collaboration_rating: 4.3,
          mentorship_activities: 10
        }
      ]

      // Mock organizational metrics
      const mockOrganizationalMetrics: OrganizationalMetrics = {
        total_correlation_strength: 0.795,
        teacher_student_alignment: 86.2,
        peer_influence_index: 78.5,
        organizational_health: 84.7,
        performance_trend: 12.8,
        roi_performance: 145.2
      }

      // Mock predictive insights
      const mockPredictiveInsights: PredictiveInsight[] = [
        {
          type: 'opportunity',
          title: 'Strengthen History Department Correlation',
          description: 'David Wilson shows potential for 15% student success improvement with targeted support',
          confidence: 78,
          potential_impact: 8.5,
          recommended_action: 'Provide mentorship and teaching methodology training'
        },
        {
          type: 'trend',
          title: 'Peer Leadership Growth Pattern',
          description: 'Student peer influence shows 23% increase, indicating strong collaborative culture',
          confidence: 91,
          potential_impact: 12.3,
          recommended_action: 'Expand peer mentorship program to more classes'
        },
        {
          type: 'risk',
          title: 'Seasonal Performance Dip Predicted',
          description: 'Historical data suggests 8% performance decrease in next quarter',
          confidence: 67,
          potential_impact: -6.2,
          recommended_action: 'Implement preventive engagement initiatives'
        }
      ]

      setCorrelationData(mockCorrelationData)
      setPeerInfluenceData(mockPeerInfluenceData)
      setOrganizationalMetrics(mockOrganizationalMetrics)
      setPredictiveInsights(mockPredictiveInsights)
      setLoading(false)
    }

    fetchAnalyticsData()
  }, [timeRange, selectedDepartment])

  // Generate chart data for temporal correlation tracking
  const temporalCorrelationData = [
    { month: 'Jan', correlation: 0.72, teacher_performance: 82, student_success: 78 },
    { month: 'Feb', correlation: 0.75, teacher_performance: 84, student_success: 80 },
    { month: 'Mar', correlation: 0.78, teacher_performance: 86, student_success: 82 },
    { month: 'Apr', correlation: 0.80, teacher_performance: 88, student_success: 84 },
    { month: 'May', correlation: 0.82, teacher_performance: 90, student_success: 86 },
    { month: 'Jun', correlation: 0.79, teacher_performance: 89, student_success: 85 }
  ]

  // Department performance comparison data
  const departmentComparisonData = [
    { department: 'Math', correlation: 0.84, students: 48, improvement: 15.2 },
    { department: 'Science', correlation: 0.91, students: 52, improvement: 12.8 },
    { department: 'English', correlation: 0.78, students: 44, improvement: 18.5 },
    { department: 'History', correlation: 0.65, students: 38, improvement: 8.3 },
    { department: 'Art', correlation: 0.73, students: 35, improvement: 11.7 }
  ]

  const getCorrelationColor = (strength: number) => {
    if (strength >= 0.8) return 'text-green-600'
    if (strength >= 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCorrelationBadge = (strength: number) => {
    if (strength >= 0.8) return { label: 'Strong', color: 'bg-green-100 text-green-800' }
    if (strength >= 0.7) return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Weak', color: 'bg-red-100 text-red-800' }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Lightbulb className="h-4 w-4 text-yellow-600" />
      case 'trend': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Brain className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
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
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Unified Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Teacher-student correlations and organizational performance insights
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-32">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Organizational Overview Metrics */}
      {organizationalMetrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Correlation Strength</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(organizationalMetrics.total_correlation_strength * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +5.2% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Teacher-Student Alignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {organizationalMetrics.teacher_student_alignment.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +3.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Peer Influence Index</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {organizationalMetrics.peer_influence_index.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +8.7% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Organizational Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {organizationalMetrics.organizational_health.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +2.4% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Performance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                +{organizationalMetrics.performance_trend.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Monthly growth rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Performance ROI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {organizationalMetrics.roi_performance.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Investment return
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="correlations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="correlations">Teacher-Student Correlations</TabsTrigger>
          <TabsTrigger value="peer-influence">Peer Influence</TabsTrigger>
          <TabsTrigger value="referral-analytics">Referral Analytics</TabsTrigger>
          <TabsTrigger value="organizational">Organizational Insights</TabsTrigger>
          <TabsTrigger value="predictive">Predictive Analytics</TabsTrigger>
        </TabsList>

        {/* Teacher-Student Correlations Tab */}
        <TabsContent value="correlations" className="space-y-6">
          {/* Correlation Strength Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Teacher Performance vs Student Success Correlation
              </CardTitle>
              <CardDescription>
                Statistical relationship between teacher performance and student achievement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterPlot data={correlationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="teacher_performance" 
                      name="Teacher Performance"
                      domain={[70, 100]}
                    />
                    <YAxis 
                      dataKey="student_success_rate" 
                      name="Student Success Rate"
                      domain={[60, 100]}
                    />
                    <Tooltip 
                      formatter={(value, name) => [value, name]}
                      labelFormatter={(_, payload) => 
                        payload?.[0]?.payload ? 
                        `${payload[0].payload.teacher_name} (${payload[0].payload.department})` : 
                        ''
                      }
                    />
                    <scatter dataKey="student_success_rate" fill="#3B82F6" />
                  </ScatterPlot>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Individual Teacher Impact Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Individual Teacher Impact Analysis
              </CardTitle>
              <CardDescription>
                Student achievement rates and correlation strength by teacher
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {correlationData.map((teacher) => {
                  const correlationBadge = getCorrelationBadge(teacher.correlation_strength)
                  return (
                    <div key={teacher.teacher_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {teacher.teacher_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold">{teacher.teacher_name}</h4>
                          <p className="text-sm text-muted-foreground">{teacher.department}</p>
                          <p className="text-xs text-muted-foreground">
                            {teacher.student_count} students • Avg improvement: +{teacher.average_student_improvement}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold">{teacher.teacher_performance}%</div>
                          <div className="text-xs text-muted-foreground">Performance</div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        <div className="text-center">
                          <div className="text-lg font-bold">{teacher.student_success_rate}%</div>
                          <div className="text-xs text-muted-foreground">Student Success</div>
                        </div>
                        <div className="text-center">
                          <Badge className={correlationBadge.color}>
                            {correlationBadge.label}
                          </Badge>
                          <div className={`text-sm font-semibold ${getCorrelationColor(teacher.correlation_strength)}`}>
                            {(teacher.correlation_strength * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Department Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Department Correlation Comparison
              </CardTitle>
              <CardDescription>
                How different teaching areas correlate with student performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="correlation" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Temporal Correlation Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Temporal Correlation Tracking
              </CardTitle>
              <CardDescription>
                How teacher-student correlations change over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={temporalCorrelationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="correlation" 
                      stroke="#8884d8" 
                      strokeWidth={3}
                      name="Correlation Strength"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="teacher_performance" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Teacher Performance"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="student_success" 
                      stroke="#ffc658" 
                      strokeWidth={2}
                      name="Student Success"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referral Analytics Tab */}
        <TabsContent value="referral-analytics" className="space-y-6">
          <ReferralAnalyticsIntegration
            organizationId="default-org" // This should come from context
            timeRange={timeRange}
            selectedDepartment={selectedDepartment}
          />
        </TabsContent>

        {/* Peer Influence Tab */}
        <TabsContent value="peer-influence" className="space-y-6">
          {/* Peer Leadership Identification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Peer Leadership Identification
              </CardTitle>
              <CardDescription>
                Students with positive influence on classmates' performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {peerInfluenceData.map((student, index) => (
                  <div key={student.student_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-bold">
                          {student.student_name.charAt(0)}
                        </div>
                        {index === 0 && (
                          <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold">{student.student_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {student.mentorship_activities} mentorship activities
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{student.influence_score}</div>
                        <div className="text-xs text-muted-foreground">Influence Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{student.peers_impacted}</div>
                        <div className="text-xs text-muted-foreground">Peers Impacted</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{student.positive_outcomes}</div>
                        <div className="text-xs text-muted-foreground">Positive Outcomes</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-lg font-bold">{student.collaboration_rating}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Collaboration</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Collaborative Learning Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Collaborative Learning Analysis
              </CardTitle>
              <CardDescription>
                Group performance vs individual performance comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">23%</div>
                  <div className="text-sm text-muted-foreground">Group Performance Boost</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average improvement in group settings
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">87%</div>
                  <div className="text-sm text-muted-foreground">Collaboration Success Rate</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Successful collaborative projects
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">4.2</div>
                  <div className="text-sm text-muted-foreground">Peer Support Rating</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average peer help effectiveness
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organizational Insights Tab */}
        <TabsContent value="organizational" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* High-Impact Performer Identification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  High-Impact Performers
                </CardTitle>
                <CardDescription>
                  Teachers and students with greatest positive influence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Sarah Johnson</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">+15.2% Impact</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Alex Thompson</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">+12 Peers Impacted</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Michael Chen</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">+12.8% Impact</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Trend Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
                <CardDescription>
                  Organizational improvement patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Teacher Performance Growth</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-semibold">+8.3%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Student Success Rate</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-semibold">+12.1%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Peer Collaboration Index</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-semibold">+23.7%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cross-Impact Effectiveness</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-semibold">+15.4%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Predictive Analytics Tab */}
        <TabsContent value="predictive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Predictive Insights & Recommendations
              </CardTitle>
              <CardDescription>
                AI-powered predictions and suggested interventions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictiveInsights.map((insight, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getInsightIcon(insight.type)}
                        <h4 className="font-semibold">{insight.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={insight.type === 'risk' ? 'destructive' : insight.type === 'opportunity' ? 'default' : 'secondary'}>
                          {insight.confidence}% confidence
                        </Badge>
                        <Badge variant="outline">
                          {insight.potential_impact > 0 ? '+' : ''}{insight.potential_impact}% impact
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Lightbulb className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">Recommended Action:</span>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                    <p className="text-sm mt-1 pl-6">{insight.recommended_action}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}