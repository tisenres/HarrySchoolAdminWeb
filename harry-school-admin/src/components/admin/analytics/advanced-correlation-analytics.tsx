'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  ComposedChart
} from 'recharts'
import { 
  TrendingUp,
  TrendingDown,
  Users,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Crown,
  Star,
  BarChart3,
  Activity,
  Zap,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Signal,
  Eye,
  Calculator,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Info,
  AlertCircle
} from 'lucide-react'

// Advanced analytics types
interface CorrelationAnalysis {
  teacher_id: string
  teacher_name: string
  department: string
  correlation_coefficient: number
  statistical_significance: number
  confidence_interval: [number, number]
  sample_size: number
  r_squared: number
  p_value: number
  interpretation: 'very_strong' | 'strong' | 'moderate' | 'weak' | 'very_weak'
  trend_direction: 'positive' | 'negative' | 'neutral'
  reliability_score: number
}

interface TemporalCorrelation {
  period: string
  correlation_strength: number
  teacher_performance: number
  student_outcomes: number
  intervention_events: InterventionEvent[]
  trend_analysis: {
    slope: number
    acceleration: number
    seasonality: number
  }
}

interface InterventionEvent {
  date: string
  type: 'training' | 'mentorship' | 'resource_allocation' | 'policy_change'
  description: string
  impact_score: number
}

interface PeerInfluenceNetwork {
  student_id: string
  student_name: string
  influence_score: number
  network_centrality: number
  positive_connections: number
  influence_radius: number
  peer_improvement_correlation: number
  leadership_potential: number
  mentorship_effectiveness: number
}

interface OrganizationalHealth {
  overall_health_score: number
  collaboration_index: number
  innovation_index: number
  performance_consistency: number
  growth_sustainability: number
  cultural_alignment: number
  risk_factors: RiskFactor[]
  strengths: StrengthArea[]
}

interface RiskFactor {
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affected_count: number
  mitigation_suggestions: string[]
}

interface StrengthArea {
  category: string
  strength_level: number
  description: string
  leverage_opportunities: string[]
}

interface PredictiveInsight {
  type: 'correlation_decline' | 'performance_risk' | 'opportunity' | 'intervention_needed'
  title: string
  description: string
  confidence: number
  urgency: 'low' | 'medium' | 'high' | 'critical'
  impact_potential: number
  recommended_actions: RecommendedAction[]
  time_horizon: 'immediate' | 'short_term' | 'medium_term' | 'long_term'
}

interface RecommendedAction {
  action: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimated_impact: number
  resource_requirement: 'low' | 'medium' | 'high'
  timeline: string
}

export function AdvancedCorrelationAnalytics() {
  const [timeFrame, setTimeFrame] = useState<'month' | 'quarter' | 'semester' | 'year'>('quarter')
  const [analysisType, setAnalysisType] = useState<'correlation' | 'temporal' | 'predictive' | 'organizational'>('correlation')
  const [correlationData, setCorrelationData] = useState<CorrelationAnalysis[]>([])
  const [temporalData, setTemporalData] = useState<TemporalCorrelation[]>([])
  const [peerNetworks, setPeerNetworks] = useState<PeerInfluenceNetwork[]>([])
  const [organizationalHealth, setOrganizationalHealth] = useState<OrganizationalHealth | null>(null)
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([])
  const [loading, setLoading] = useState(true)

  // Initialize with sophisticated mock data
  useEffect(() => {
    const fetchAdvancedAnalytics = async () => {
      setLoading(true)
      
      // Simulate complex analytics processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock correlation analysis with statistical rigor
      const mockCorrelationData: CorrelationAnalysis[] = [
        {
          teacher_id: 't1',
          teacher_name: 'Sarah Johnson',
          department: 'Mathematics',
          correlation_coefficient: 0.847,
          statistical_significance: 0.001,
          confidence_interval: [0.792, 0.892],
          sample_size: 142,
          r_squared: 0.717,
          p_value: 0.0008,
          interpretation: 'very_strong',
          trend_direction: 'positive',
          reliability_score: 95.2
        },
        {
          teacher_id: 't2',
          teacher_name: 'Michael Chen',
          department: 'Science',
          correlation_coefficient: 0.723,
          statistical_significance: 0.003,
          confidence_interval: [0.651, 0.785],
          sample_size: 128,
          r_squared: 0.523,
          p_value: 0.0025,
          interpretation: 'strong',
          trend_direction: 'positive',
          reliability_score: 89.7
        },
        {
          teacher_id: 't3',
          teacher_name: 'Emma Rodriguez',
          department: 'English',
          correlation_coefficient: 0.612,
          statistical_significance: 0.015,
          confidence_interval: [0.521, 0.691],
          sample_size: 96,
          r_squared: 0.374,
          p_value: 0.0142,
          interpretation: 'moderate',
          trend_direction: 'positive',
          reliability_score: 82.4
        },
        {
          teacher_id: 't4',
          teacher_name: 'David Wilson',
          department: 'History',
          correlation_coefficient: 0.431,
          statistical_significance: 0.087,
          confidence_interval: [0.312, 0.541],
          sample_size: 87,
          r_squared: 0.186,
          p_value: 0.0823,
          interpretation: 'weak',
          trend_direction: 'positive',
          reliability_score: 68.1
        }
      ]

      // Mock temporal correlation tracking
      const mockTemporalData: TemporalCorrelation[] = [
        {
          period: 'Sep 2023',
          correlation_strength: 0.72,
          teacher_performance: 82,
          student_outcomes: 78,
          intervention_events: [],
          trend_analysis: { slope: 0.02, acceleration: 0.001, seasonality: 0.05 }
        },
        {
          period: 'Oct 2023',
          correlation_strength: 0.75,
          teacher_performance: 84,
          student_outcomes: 80,
          intervention_events: [
            {
              date: '2023-10-15',
              type: 'training',
              description: 'Project-based learning workshop',
              impact_score: 0.15
            }
          ],
          trend_analysis: { slope: 0.03, acceleration: 0.002, seasonality: 0.03 }
        },
        {
          period: 'Nov 2023',
          correlation_strength: 0.78,
          teacher_performance: 86,
          student_outcomes: 82,
          intervention_events: [],
          trend_analysis: { slope: 0.025, acceleration: -0.001, seasonality: 0.02 }
        },
        {
          period: 'Dec 2023',
          correlation_strength: 0.81,
          teacher_performance: 88,
          student_outcomes: 85,
          intervention_events: [
            {
              date: '2023-12-08',
              type: 'mentorship',
              description: 'Peer mentoring program launch',
              impact_score: 0.22
            }
          ],
          trend_analysis: { slope: 0.03, acceleration: 0.005, seasonality: -0.01 }
        },
        {
          period: 'Jan 2024',
          correlation_strength: 0.84,
          teacher_performance: 90,
          student_outcomes: 87,
          intervention_events: [],
          trend_analysis: { slope: 0.032, acceleration: 0.003, seasonality: 0.04 }
        },
        {
          period: 'Feb 2024',
          correlation_strength: 0.82,
          teacher_performance: 89,
          student_outcomes: 86,
          intervention_events: [],
          trend_analysis: { slope: 0.018, acceleration: -0.008, seasonality: 0.02 }
        }
      ]

      // Mock peer influence networks
      const mockPeerNetworks: PeerInfluenceNetwork[] = [
        {
          student_id: 's1',
          student_name: 'Alex Thompson',
          influence_score: 94.2,
          network_centrality: 0.847,
          positive_connections: 18,
          influence_radius: 2.3,
          peer_improvement_correlation: 0.73,
          leadership_potential: 87.5,
          mentorship_effectiveness: 91.2
        },
        {
          student_id: 's2',
          student_name: 'Maya Patel',
          influence_score: 87.8,
          network_centrality: 0.721,
          positive_connections: 14,
          influence_radius: 1.9,
          peer_improvement_correlation: 0.68,
          leadership_potential: 82.1,
          mentorship_effectiveness: 85.7
        },
        {
          student_id: 's3',
          student_name: 'Jordan Lee',
          influence_score: 81.4,
          network_centrality: 0.653,
          positive_connections: 12,
          influence_radius: 1.7,
          peer_improvement_correlation: 0.61,
          leadership_potential: 78.9,
          mentorship_effectiveness: 80.3
        }
      ]

      // Mock organizational health analysis
      const mockOrganizationalHealth: OrganizationalHealth = {
        overall_health_score: 84.3,
        collaboration_index: 87.2,
        innovation_index: 79.6,
        performance_consistency: 91.4,
        growth_sustainability: 82.8,
        cultural_alignment: 88.9,
        risk_factors: [
          {
            category: 'Teacher Burnout Risk',
            severity: 'medium',
            description: 'Elevated stress indicators in 3 departments',
            affected_count: 8,
            mitigation_suggestions: [
              'Implement wellness programs',
              'Redistribute workload',
              'Provide additional support staff'
            ]
          },
          {
            category: 'Performance Variance',
            severity: 'low',
            description: 'Inconsistent outcomes in History department',
            affected_count: 2,
            mitigation_suggestions: [
              'Targeted professional development',
              'Peer mentoring program',
              'Regular check-ins and support'
            ]
          }
        ],
        strengths: [
          {
            category: 'Strong Teacher-Student Correlations',
            strength_level: 91.2,
            description: 'Exceptional alignment between teacher effort and student success',
            leverage_opportunities: [
              'Share best practices organization-wide',
              'Expand successful teaching methodologies',
              'Create teacher excellence showcase'
            ]
          },
          {
            category: 'Peer Leadership Development',
            strength_level: 86.7,
            description: 'Outstanding student peer influence and mentorship',
            leverage_opportunities: [
              'Formalize peer mentoring programs',
              'Expand student leadership roles',
              'Create peer learning initiatives'
            ]
          }
        ]
      }

      // Mock predictive insights
      const mockPredictiveInsights: PredictiveInsight[] = [
        {
          type: 'opportunity',
          title: 'Mathematics Department Excellence Expansion',
          description: 'Strong correlations in Math department suggest methodologies could be successfully applied to other departments',
          confidence: 87.3,
          urgency: 'medium',
          impact_potential: 24.7,
          recommended_actions: [
            {
              action: 'Cross-department teaching methodology sharing sessions',
              priority: 'high',
              estimated_impact: 15.2,
              resource_requirement: 'medium',
              timeline: '6-8 weeks'
            },
            {
              action: 'Math teacher mentoring program for other departments',
              priority: 'medium',
              estimated_impact: 12.8,
              resource_requirement: 'low',
              timeline: '3-4 months'
            }
          ],
          time_horizon: 'short_term'
        },
        {
          type: 'intervention_needed',
          title: 'History Department Correlation Decline',
          description: 'Declining teacher-student correlation patterns suggest need for targeted support',
          confidence: 78.9,
          urgency: 'high',
          impact_potential: -18.3,
          recommended_actions: [
            {
              action: 'Immediate performance coaching and support',
              priority: 'critical',
              estimated_impact: 22.1,
              resource_requirement: 'medium',
              timeline: '2-3 weeks'
            },
            {
              action: 'Professional development focused on engagement strategies',
              priority: 'high',
              estimated_impact: 16.7,
              resource_requirement: 'high',
              timeline: '1-2 months'
            }
          ],
          time_horizon: 'immediate'
        },
        {
          type: 'performance_risk',
          title: 'Peer Influence Network Fragmentation',
          description: 'Key peer influencers showing signs of reduced engagement, could impact school culture',
          confidence: 72.4,
          urgency: 'medium',
          impact_potential: -14.6,
          recommended_actions: [
            {
              action: 'Re-engage high-influence students with leadership opportunities',
              priority: 'high',
              estimated_impact: 18.9,
              resource_requirement: 'low',
              timeline: '2-4 weeks'
            }
          ],
          time_horizon: 'short_term'
        }
      ]

      setCorrelationData(mockCorrelationData)
      setTemporalData(mockTemporalData)
      setPeerNetworks(mockPeerNetworks)
      setOrganizationalHealth(mockOrganizationalHealth)
      setPredictiveInsights(mockPredictiveInsights)
      setLoading(false)
    }

    fetchAdvancedAnalytics()
  }, [timeFrame, analysisType])

  const getCorrelationColor = (interpretation: string) => {
    switch (interpretation) {
      case 'very_strong': return 'text-green-600'
      case 'strong': return 'text-blue-600'
      case 'moderate': return 'text-yellow-600'
      case 'weak': return 'text-orange-600'
      case 'very_weak': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getCorrelationBadge = (interpretation: string) => {
    switch (interpretation) {
      case 'very_strong': return { label: 'Very Strong', color: 'bg-green-100 text-green-800' }
      case 'strong': return { label: 'Strong', color: 'bg-blue-100 text-blue-800' }
      case 'moderate': return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800' }
      case 'weak': return { label: 'Weak', color: 'bg-orange-100 text-orange-800' }
      case 'very_weak': return { label: 'Very Weak', color: 'bg-red-100 text-red-800' }
      default: return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const getInsightUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Lightbulb className="h-4 w-4 text-yellow-600" />
      case 'performance_risk': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'intervention_needed': return <AlertCircle className="h-4 w-4 text-orange-600" />
      case 'correlation_decline': return <TrendingDown className="h-4 w-4 text-red-600" />
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
                <Brain className="h-5 w-5" />
                Advanced Correlation Analytics
              </CardTitle>
              <CardDescription>
                Sophisticated statistical analysis of teacher-student correlations and organizational patterns
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={timeFrame} onValueChange={(value: any) => setTimeFrame(value)}>
                <SelectTrigger className="w-32">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="semester">This Semester</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="statistical" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="statistical">Statistical Analysis</TabsTrigger>
          <TabsTrigger value="temporal">Temporal Tracking</TabsTrigger>
          <TabsTrigger value="peer-influence">Peer Influence</TabsTrigger>
          <TabsTrigger value="organizational">Organizational Health</TabsTrigger>
          <TabsTrigger value="predictive">Predictive Insights</TabsTrigger>
        </TabsList>

        {/* Statistical Correlation Analysis */}
        <TabsContent value="statistical" className="space-y-6">
          {/* Statistical Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Correlation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {(correlationData.reduce((sum, d) => sum + d.correlation_coefficient, 0) / correlationData.length).toFixed(3)}
                </div>
                <p className="text-xs text-muted-foreground">
                  <Signal className="inline h-3 w-3 mr-1" />
                  Strong correlation strength
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Reliability Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {(correlationData.reduce((sum, d) => sum + d.reliability_score, 0) / correlationData.length).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  <CheckCircle2 className="inline h-3 w-3 mr-1" />
                  High statistical confidence
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sample Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {correlationData.reduce((sum, d) => sum + d.sample_size, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total data points analyzed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Significant Correlations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {correlationData.filter(d => d.statistical_significance < 0.05).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Out of {correlationData.length} teachers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Correlation Strength Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Statistical Correlation Analysis
              </CardTitle>
              <CardDescription>
                Teacher-student correlation coefficients with statistical significance and confidence intervals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={correlationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="teacher_name" angle={-45} textAnchor="end" height={100} />
                    <YAxis yAxisId="correlation" domain={[0, 1]} />
                    <YAxis yAxisId="reliability" orientation="right" domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value, name, props) => [
                        typeof value === 'number' ? value.toFixed(3) : value,
                        name === 'correlation_coefficient' ? 'Correlation' :
                        name === 'reliability_score' ? 'Reliability %' : name
                      ]}
                      labelFormatter={(label) => `Teacher: ${label}`}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="correlation"
                      dataKey="correlation_coefficient" 
                      fill="#3B82F6" 
                      name="Correlation Coefficient"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line 
                      yAxisId="reliability"
                      type="monotone" 
                      dataKey="reliability_score" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      name="Reliability Score"
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    />
                    <ReferenceLine yAxisId="correlation" y={0.7} stroke="#EF4444" strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Correlation Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Detailed Statistical Analysis
              </CardTitle>
              <CardDescription>
                Individual teacher correlation analysis with confidence intervals and statistical significance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {correlationData.map((analysis) => {
                  const correlationBadge = getCorrelationBadge(analysis.interpretation)
                  return (
                    <div key={analysis.teacher_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {analysis.teacher_name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-semibold">{analysis.teacher_name}</h4>
                            <p className="text-sm text-muted-foreground">{analysis.department}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={correlationBadge.color}>
                            {correlationBadge.label}
                          </Badge>
                          <Badge variant="outline">
                            {(analysis.reliability_score).toFixed(1)}% reliable
                          </Badge>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-4 mb-3">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">
                            {analysis.correlation_coefficient.toFixed(3)}
                          </div>
                          <div className="text-xs text-muted-foreground">Correlation</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-lg font-bold text-green-600">
                            {(analysis.r_squared * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">R² (Explained Variance)</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-lg font-bold text-purple-600">
                            {analysis.p_value.toFixed(4)}
                          </div>
                          <div className="text-xs text-muted-foreground">P-Value</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-lg font-bold text-orange-600">
                            {analysis.sample_size}
                          </div>
                          <div className="text-xs text-muted-foreground">Sample Size</div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm font-medium mb-2">
                          Statistical Interpretation
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <strong>Confidence Interval:</strong> [{analysis.confidence_interval[0].toFixed(3)}, {analysis.confidence_interval[1].toFixed(3)}] at 95% confidence level
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <strong>Significance:</strong> {analysis.statistical_significance < 0.001 ? 'Highly significant (p < 0.001)' :
                          analysis.statistical_significance < 0.01 ? 'Very significant (p < 0.01)' :
                          analysis.statistical_significance < 0.05 ? 'Significant (p < 0.05)' :
                          'Not statistically significant (p ≥ 0.05)'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Temporal Correlation Tracking */}
        <TabsContent value="temporal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Temporal Correlation Evolution
              </CardTitle>
              <CardDescription>
                How teacher-student correlations change over time with intervention tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={temporalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="correlation" domain={[0.6, 1]} />
                    <YAxis yAxisId="performance" orientation="right" domain={[70, 100]} />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="correlation"
                      type="monotone"
                      dataKey="correlation_strength"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                      name="Correlation Strength"
                    />
                    <Line
                      yAxisId="performance"
                      type="monotone"
                      dataKey="teacher_performance"
                      stroke="#82ca9d"
                      strokeWidth={3}
                      name="Teacher Performance"
                      dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
                    />
                    <Line
                      yAxisId="performance"
                      type="monotone"
                      dataKey="student_outcomes"
                      stroke="#ffc658"
                      strokeWidth={3}
                      name="Student Outcomes"
                      dot={{ fill: '#ffc658', strokeWidth: 2, r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Intervention Impact Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Intervention Impact Analysis
              </CardTitle>
              <CardDescription>
                Correlation between interventions and performance improvements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {temporalData.filter(data => data.intervention_events.length > 0).map((period) => (
                  <div key={period.period} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{period.period}</h4>
                      <Badge className="bg-blue-100 text-blue-800">
                        {period.intervention_events.length} intervention{period.intervention_events.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    {period.intervention_events.map((intervention, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {intervention.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm font-medium">{intervention.description}</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            +{(intervention.impact_score * 100).toFixed(1)}% impact
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Date: {new Date(intervention.date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Peer Influence Analytics */}
        <TabsContent value="peer-influence" className="space-y-6">
          {/* Peer Influence Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Top Influencer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {peerNetworks[0]?.influence_score.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  <Crown className="inline h-3 w-3 mr-1" />
                  {peerNetworks[0]?.student_name}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Network Density</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {(peerNetworks.reduce((sum, p) => sum + p.network_centrality, 0) / peerNetworks.length).toFixed(3)}
                </div>
                <p className="text-xs text-muted-foreground">
                  <Users className="inline h-3 w-3 mr-1" />
                  Average centrality
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Positive Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {peerNetworks.reduce((sum, p) => sum + p.positive_connections, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total peer relationships
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Peer Influence Network Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Peer Influence Network Analysis
              </CardTitle>
              <CardDescription>
                Student peer influence scores and network effects on academic performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={peerNetworks}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="network_centrality" 
                      name="Network Centrality"
                      type="number"
                      domain={[0, 1]}
                    />
                    <YAxis 
                      dataKey="influence_score" 
                      name="Influence Score"
                      domain={[70, 100]}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        typeof value === 'number' ? value.toFixed(2) : value,
                        name === 'network_centrality' ? 'Network Centrality' : 'Influence Score'
                      ]}
                      labelFormatter={(_, payload) => 
                        payload?.[0]?.payload ? 
                        `${payload[0].payload.student_name}` : 
                        ''
                      }
                    />
                    <Scatter 
                      dataKey="influence_score" 
                      fill="#8884d8"
                      r={6}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Peer Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Peer Leadership Analysis
              </CardTitle>
              <CardDescription>
                Individual student influence metrics and leadership potential
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {peerNetworks.map((student, index) => (
                  <div key={student.student_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                            {student.student_name.charAt(0)}
                          </div>
                          {index === 0 && (
                            <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold">{student.student_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Rank #{index + 1} peer influencer
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-600">
                          {student.influence_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Influence Score</div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-4 mb-3">
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="text-sm font-bold text-purple-600">
                          {(student.network_centrality * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Centrality</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="text-sm font-bold text-blue-600">
                          {student.positive_connections}
                        </div>
                        <div className="text-xs text-muted-foreground">Connections</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="text-sm font-bold text-green-600">
                          {student.leadership_potential.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Leadership</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <div className="text-sm font-bold text-orange-600">
                          {student.mentorship_effectiveness.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Mentorship</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm">
                        <strong>Peer Improvement Correlation:</strong> {(student.peer_improvement_correlation * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Students connected to {student.student_name} show {student.peer_improvement_correlation > 0.7 ? 'strong' : student.peer_improvement_correlation > 0.5 ? 'moderate' : 'weak'} academic improvement correlation
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organizational Health */}
        <TabsContent value="organizational" className="space-y-6">
          {organizationalHealth && (
            <>
              {/* Health Score Overview */}
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {organizationalHealth.overall_health_score.toFixed(1)}%
                    </div>
                    <Progress value={organizationalHealth.overall_health_score} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Collaboration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {organizationalHealth.collaboration_index.toFixed(1)}%
                    </div>
                    <Progress value={organizationalHealth.collaboration_index} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Innovation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {organizationalHealth.innovation_index.toFixed(1)}%
                    </div>
                    <Progress value={organizationalHealth.innovation_index} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {organizationalHealth.performance_consistency.toFixed(1)}%
                    </div>
                    <Progress value={organizationalHealth.performance_consistency} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-teal-600">
                      {organizationalHealth.growth_sustainability.toFixed(1)}%
                    </div>
                    <Progress value={organizationalHealth.growth_sustainability} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Culture</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-pink-600">
                      {organizationalHealth.cultural_alignment.toFixed(1)}%
                    </div>
                    <Progress value={organizationalHealth.cultural_alignment} className="mt-2" />
                  </CardContent>
                </Card>
              </div>

              {/* Risk Factors and Strengths */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      Risk Factors
                    </CardTitle>
                    <CardDescription>
                      Areas requiring attention and mitigation strategies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {organizationalHealth.risk_factors.map((risk, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{risk.category}</h5>
                            <Badge className={
                              risk.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              risk.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                              risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {risk.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                          <div className="text-sm mb-2">
                            <strong>Affected:</strong> {risk.affected_count} people
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">Mitigation Strategies:</div>
                            {risk.mitigation_suggestions.map((suggestion, i) => (
                              <div key={i} className="text-sm text-muted-foreground">
                                • {suggestion}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-600" />
                      Organizational Strengths
                    </CardTitle>
                    <CardDescription>
                      Key advantages and leverage opportunities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {organizationalHealth.strengths.map((strength, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{strength.category}</h5>
                            <Badge className="bg-green-100 text-green-800">
                              {strength.strength_level.toFixed(1)}%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{strength.description}</p>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">Leverage Opportunities:</div>
                            {strength.leverage_opportunities.map((opportunity, i) => (
                              <div key={i} className="text-sm text-muted-foreground">
                                • {opportunity}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Predictive Insights */}
        <TabsContent value="predictive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Predictive Insights & Recommendations
              </CardTitle>
              <CardDescription>
                AI-powered analysis and intervention recommendations based on correlation patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictiveInsights.map((insight, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getInsightIcon(insight.type)}
                        <h4 className="font-semibold">{insight.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getInsightUrgencyColor(insight.urgency)}>
                          {insight.urgency} urgency
                        </Badge>
                        <Badge variant="outline">
                          {insight.confidence.toFixed(1)}% confidence
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>

                    <div className="grid gap-3 md:grid-cols-3 mb-4">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="text-sm font-bold text-blue-600">
                          {insight.confidence.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Confidence</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="text-sm font-bold text-green-600">
                          {insight.impact_potential > 0 ? '+' : ''}{insight.impact_potential.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Impact Potential</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <div className="text-sm font-bold text-orange-600 capitalize">
                          {insight.time_horizon.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-muted-foreground">Time Horizon</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Recommended Actions:</div>
                      {insight.recommended_actions.map((action, actionIndex) => (
                        <div key={actionIndex} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{action.action}</span>
                            <div className="flex items-center gap-2">
                              <Badge className={
                                action.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                action.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                action.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }>
                                {action.priority}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid gap-2 md:grid-cols-3 text-xs text-muted-foreground">
                            <div>Impact: +{action.estimated_impact.toFixed(1)}%</div>
                            <div>Resources: {action.resource_requirement}</div>
                            <div>Timeline: {action.timeline}</div>
                          </div>
                        </div>
                      ))}
                    </div>
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