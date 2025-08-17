'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  BarChart3,
  TrendingUp,
  Clock,
  User,
  Award,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Filter,
  Download,
  Search,
  Calendar,
  Eye,
  FileText,
  Shield,
  Zap,
  Target,
  Users,
  DollarSign,
  PieChart,
  LineChart,
  MousePointer
} from 'lucide-react'

interface PointTransaction {
  id: string
  user_id: string
  user_type: 'teacher' | 'student'
  user_name: string
  points_amount: number
  category: string
  reason: string
  awarded_by: string
  awarded_at: Date
  cross_impact_score?: number
  approval_status: 'auto_approved' | 'pending' | 'approved' | 'rejected'
  transaction_type: 'award' | 'deduction' | 'transfer' | 'bulk_award'
  metadata: {
    source: string
    efficiency_impact?: number
    student_benefit?: number
    correlation_boost?: number
  }
}

interface AuditEntry {
  id: string
  event_type: 'point_award' | 'bulk_operation' | 'approval_decision' | 'system_adjustment'
  user_id: string
  admin_user: string
  description: string
  before_state: any
  after_state: any
  timestamp: Date
  ip_address: string
  user_agent: string
  risk_level: 'low' | 'medium' | 'high'
  compliance_tags: string[]
}

interface AnalyticsMetrics {
  total_points_awarded: number
  total_transactions: number
  avg_points_per_award: number
  approval_rate: number
  cross_impact_efficiency: number
  top_categories: Array<{ category: string; points: number; count: number }>
  trend_data: Array<{ date: string; points: number; transactions: number }>
  user_distribution: { teachers: number; students: number }
  risk_indicators: Array<{ type: string; count: number; severity: string }>
}

export function PointsAnalyticsAuditTrail() {
  const [selectedTab, setSelectedTab] = useState('analytics')
  const [dateRange, setDateRange] = useState('30d')
  const [userTypeFilter, setUserTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<PointTransaction | null>(null)
  const [showAuditDetails, setShowAuditDetails] = useState(false)

  // Mock data
  const [transactions] = useState<PointTransaction[]>([
    {
      id: 'pt1',
      user_id: 't1',
      user_type: 'teacher',
      user_name: 'Sarah Johnson',
      points_amount: 150,
      category: 'teaching_excellence',
      reason: 'Outstanding student engagement metrics',
      awarded_by: 'admin1',
      awarded_at: new Date('2024-03-15T10:30:00'),
      cross_impact_score: 85,
      approval_status: 'approved',
      transaction_type: 'award',
      metadata: {
        source: 'manual_award',
        efficiency_impact: 12,
        student_benefit: 8,
        correlation_boost: 0.15
      }
    },
    {
      id: 'pt2',
      user_id: 's5',
      user_type: 'student',
      user_name: 'Alex Chen',
      points_amount: 75,
      category: 'academic_achievement',
      reason: 'Exceptional performance in mathematics',
      awarded_by: 'teacher2',
      awarded_at: new Date('2024-03-14T14:15:00'),
      cross_impact_score: 92,
      approval_status: 'auto_approved',
      transaction_type: 'award',
      metadata: {
        source: 'automated_assessment',
        correlation_boost: 0.08
      }
    },
    {
      id: 'pt3',
      user_id: 'bulk_001',
      user_type: 'teacher',
      user_name: 'Math Department',
      points_amount: 2500,
      category: 'department_recognition',
      reason: 'Quarter-end excellence recognition',
      awarded_by: 'admin1',
      awarded_at: new Date('2024-03-13T16:45:00'),
      approval_status: 'approved',
      transaction_type: 'bulk_award',
      metadata: {
        source: 'bulk_operation',
        efficiency_impact: 25,
        student_benefit: 40
      }
    }
  ])

  const [auditEntries] = useState<AuditEntry[]>([
    {
      id: 'audit1',
      event_type: 'point_award',
      user_id: 't1',
      admin_user: 'admin1',
      description: 'Awarded 150 points for teaching excellence',
      before_state: { total_points: 1100, level: 7 },
      after_state: { total_points: 1250, level: 8 },
      timestamp: new Date('2024-03-15T10:30:00'),
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 Chrome/91.0',
      risk_level: 'low',
      compliance_tags: ['standard_award', 'teacher_recognition']
    },
    {
      id: 'audit2',
      event_type: 'bulk_operation',
      user_id: 'bulk_001',
      admin_user: 'admin1',
      description: 'Bulk point award to Math Department (15 recipients)',
      before_state: { operation_status: 'pending' },
      after_state: { operation_status: 'completed', recipients: 15, total_points: 2500 },
      timestamp: new Date('2024-03-13T16:45:00'),
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 Chrome/91.0',
      risk_level: 'medium',
      compliance_tags: ['bulk_operation', 'department_award', 'requires_approval']
    },
    {
      id: 'audit3',
      event_type: 'approval_decision',
      user_id: 't3',
      admin_user: 'supervisor1',
      description: 'Approved compensation adjustment for teacher performance',
      before_state: { compensation_status: 'pending_approval' },
      after_state: { compensation_status: 'approved', amount: 500 },
      timestamp: new Date('2024-03-12T09:20:00'),
      ip_address: '192.168.1.105',
      user_agent: 'Mozilla/5.0 Chrome/91.0',
      risk_level: 'high',
      compliance_tags: ['compensation_approval', 'financial_impact', 'supervisor_approval']
    }
  ])

  const [analyticsMetrics] = useState<AnalyticsMetrics>({
    total_points_awarded: 45750,
    total_transactions: 347,
    avg_points_per_award: 132,
    approval_rate: 94.2,
    cross_impact_efficiency: 78.5,
    top_categories: [
      { category: 'teaching_excellence', points: 12500, count: 85 },
      { category: 'academic_achievement', points: 8750, count: 125 },
      { category: 'peer_mentorship', points: 6200, count: 62 },
      { category: 'administrative_excellence', points: 4500, count: 45 },
      { category: 'goal_completion', points: 3800, count: 76 }
    ],
    trend_data: [
      { date: '2024-03-01', points: 3200, transactions: 28 },
      { date: '2024-03-05', points: 4100, transactions: 32 },
      { date: '2024-03-10', points: 5200, transactions: 41 },
      { date: '2024-03-15', points: 6800, transactions: 52 }
    ],
    user_distribution: { teachers: 65, students: 235 },
    risk_indicators: [
      { type: 'High-value single awards', count: 3, severity: 'medium' },
      { type: 'Unusual bulk operations', count: 1, severity: 'low' },
      { type: 'After-hours modifications', count: 2, severity: 'medium' }
    ]
  })

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'auto_approved': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesUserType = userTypeFilter === 'all' || transaction.user_type === userTypeFilter
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter
    const matchesSearch = searchQuery === '' || 
      transaction.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.reason.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesUserType && matchesCategory && matchesSearch
  })

  const filteredAuditEntries = auditEntries.filter(entry => {
    const matchesSearch = searchQuery === '' || 
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.admin_user.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Point Awards Analytics & Audit Trail
              </CardTitle>
              <CardDescription>
                Comprehensive analytics and compliance tracking for all point transactions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Date Range
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="analytics">Analytics Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transaction History</TabsTrigger>
              <TabsTrigger value="audit">Audit Trail</TabsTrigger>
              <TabsTrigger value="compliance">Compliance Dashboard</TabsTrigger>
            </TabsList>

            {/* Analytics Overview */}
            <TabsContent value="analytics" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {analyticsMetrics.total_points_awarded.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Points Awarded</div>
                    </div>
                    <Award className="h-8 w-8 text-blue-500" />
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {analyticsMetrics.total_transactions}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Transactions</div>
                    </div>
                    <Activity className="h-8 w-8 text-green-500" />
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {analyticsMetrics.approval_rate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Approval Rate</div>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-purple-500" />
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {analyticsMetrics.cross_impact_efficiency}%
                      </div>
                      <div className="text-sm text-muted-foreground">Cross-Impact Efficiency</div>
                    </div>
                    <Zap className="h-8 w-8 text-orange-500" />
                  </div>
                </Card>
              </div>

              {/* Top Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Top Point Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsMetrics.top_categories.map((category, index) => (
                      <div key={category.category} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-yellow-100 text-yellow-600' :
                            index === 1 ? 'bg-gray-100 text-gray-600' :
                            index === 2 ? 'bg-orange-100 text-orange-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-medium capitalize">
                              {category.category.replace('_', ' ')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {category.count} transactions
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {category.points.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">points</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Points Award Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsMetrics.trend_data.map((point, index) => (
                      <div key={point.date} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>{new Date(point.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">{point.points.toLocaleString()} pts</div>
                            <div className="text-sm text-muted-foreground">{point.transactions} transactions</div>
                          </div>
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transaction History */}
            <TabsContent value="transactions" className="space-y-6">
              {/* Filters */}
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Label>Search Transactions</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by user name or reason..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>User Type</Label>
                  <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="teacher">Teachers</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="teaching_excellence">Teaching Excellence</SelectItem>
                      <SelectItem value="academic_achievement">Academic Achievement</SelectItem>
                      <SelectItem value="peer_mentorship">Peer Mentorship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Transactions List */}
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.user_type === 'teacher' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {transaction.user_type === 'teacher' ? <User className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="font-medium">{transaction.user_name}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {transaction.user_type} • {transaction.category.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={getTransactionStatusColor(transaction.approval_status)}>
                            {transaction.approval_status.replace('_', ' ')}
                          </Badge>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              +{transaction.points_amount}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.awarded_at.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-gray-700 mb-3">
                        {transaction.reason}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>By: {transaction.awarded_by}</span>
                          {transaction.cross_impact_score && (
                            <span>Cross-Impact: {transaction.cross_impact_score}%</span>
                          )}
                          <Badge variant="outline" className="capitalize">
                            {transaction.transaction_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Audit Trail */}
            <TabsContent value="audit" className="space-y-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Label>Search Audit Entries</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search audit entries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button variant="outline" onClick={() => setShowAuditDetails(true)}>
                  <Shield className="h-4 w-4 mr-2" />
                  Security Report
                </Button>
              </div>

              <div className="space-y-4">
                {filteredAuditEntries.map((entry) => (
                  <Card key={entry.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                            entry.event_type === 'point_award' ? 'bg-blue-100 text-blue-600' :
                            entry.event_type === 'bulk_operation' ? 'bg-purple-100 text-purple-600' :
                            entry.event_type === 'approval_decision' ? 'bg-green-100 text-green-600' :
                            'bg-orange-100 text-orange-600'
                          }`}>
                            {entry.event_type === 'point_award' ? <Award className="h-4 w-4" /> :
                             entry.event_type === 'bulk_operation' ? <Users className="h-4 w-4" /> :
                             entry.event_type === 'approval_decision' ? <CheckCircle2 className="h-4 w-4" /> :
                             <AlertTriangle className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{entry.description}</div>
                            <div className="text-sm text-muted-foreground">
                              By {entry.admin_user} • {entry.timestamp.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {entry.compliance_tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${getRiskLevelColor(entry.risk_level)}`}>
                            {entry.risk_level.toUpperCase()}
                          </span>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 text-sm">
                        <div className="p-2 bg-gray-50 rounded">
                          <div className="text-xs font-medium text-gray-600 mb-1">Before State</div>
                          <pre className="text-xs text-gray-800">
                            {JSON.stringify(entry.before_state, null, 2)}
                          </pre>
                        </div>
                        <div className="p-2 bg-green-50 rounded">
                          <div className="text-xs font-medium text-green-600 mb-1">After State</div>
                          <pre className="text-xs text-green-800">
                            {JSON.stringify(entry.after_state, null, 2)}
                          </pre>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <div className="text-xs text-muted-foreground">
                          IP: {entry.ip_address} • ID: {entry.id}
                        </div>
                        <Badge className="capitalize">
                          {entry.event_type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Compliance Dashboard */}
            <TabsContent value="compliance" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {analyticsMetrics.user_distribution.teachers + analyticsMetrics.user_distribution.students}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Users</div>
                    </div>
                    <Users className="h-8 w-8 text-green-500" />
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {analyticsMetrics.risk_indicators.reduce((sum, r) => sum + r.count, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Risk Indicators</div>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-blue-500" />
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">100%</div>
                      <div className="text-sm text-muted-foreground">Compliance Rate</div>
                    </div>
                    <Shield className="h-8 w-8 text-purple-500" />
                  </div>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsMetrics.risk_indicators.map((indicator, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            indicator.severity === 'high' ? 'bg-red-500' :
                            indicator.severity === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`} />
                          <span>{indicator.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{indicator.count} incidents</Badge>
                          <Badge className={
                            indicator.severity === 'high' ? 'bg-red-100 text-red-800' :
                            indicator.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {indicator.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      {selectedTransaction && (
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
              <DialogDescription>
                Complete information for transaction {selectedTransaction.id}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>User Information</Label>
                  <div className="p-3 border rounded bg-gray-50">
                    <div className="font-medium">{selectedTransaction.user_name}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {selectedTransaction.user_type} (ID: {selectedTransaction.user_id})
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Points Award</Label>
                  <div className="p-3 border rounded bg-green-50">
                    <div className="text-lg font-bold text-green-600">
                      +{selectedTransaction.points_amount} points
                    </div>
                    <div className="text-sm text-green-700 capitalize">
                      {selectedTransaction.category.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Reason</Label>
                <div className="p-3 border rounded">
                  {selectedTransaction.reason}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Award Details</Label>
                  <div className="space-y-2 text-sm">
                    <div>Awarded by: {selectedTransaction.awarded_by}</div>
                    <div>Date: {selectedTransaction.awarded_at.toLocaleString()}</div>
                    <div>Type: {selectedTransaction.transaction_type.replace('_', ' ')}</div>
                    <div>Status: {selectedTransaction.approval_status.replace('_', ' ')}</div>
                  </div>
                </div>
                <div>
                  <Label>Impact Metrics</Label>
                  <div className="space-y-2 text-sm">
                    {selectedTransaction.cross_impact_score && (
                      <div>Cross-Impact Score: {selectedTransaction.cross_impact_score}%</div>
                    )}
                    {selectedTransaction.metadata.efficiency_impact && (
                      <div>Efficiency Impact: +{selectedTransaction.metadata.efficiency_impact}%</div>
                    )}
                    {selectedTransaction.metadata.student_benefit && (
                      <div>Student Benefit: +{selectedTransaction.metadata.student_benefit}%</div>
                    )}
                    {selectedTransaction.metadata.correlation_boost && (
                      <div>Correlation Boost: +{selectedTransaction.metadata.correlation_boost}</div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label>Metadata</Label>
                <div className="p-3 border rounded bg-gray-50">
                  <pre className="text-xs">
                    {JSON.stringify(selectedTransaction.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}