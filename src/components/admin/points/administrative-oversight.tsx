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
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  FileText,
  Users,
  Award,
  TrendingUp,
  Search,
  Filter,
  Download,
  Bell,
  MessageSquare,
  Calendar,
  BarChart3,
  Target,
  Zap,
  DollarSign,
  Lock,
  Unlock,
  UserCheck,
  AlertCircle,
  Info
} from 'lucide-react'

interface ApprovalRequest {
  id: string
  type: 'point_award' | 'bulk_operation' | 'compensation_adjustment' | 'achievement_creation'
  title: string
  description: string
  requested_by: string
  requested_by_name: string
  created_at: Date
  
  // Point award specific
  recipient_ids?: string[]
  recipient_names?: string[]
  points_amount?: number
  category?: string
  reason?: string
  
  // Bulk operation specific
  operation_details?: {
    target_count: number
    total_points_impact: number
    budget_impact: number
  }
  
  // Compensation specific
  teacher_id?: string
  teacher_name?: string
  compensation_amount?: number
  performance_metrics?: {
    efficiency: number
    quality: number
    correlation: number
  }
  
  // Achievement specific
  achievement_data?: {
    name: string
    points_reward: number
    coins_reward: number
    achievement_type: string
  }
  
  status: 'pending' | 'approved' | 'rejected' | 'requires_superadmin'
  priority: 'low' | 'medium' | 'high' | 'critical'
  approval_threshold: number
  reviewed_by?: string
  reviewed_at?: Date
  review_notes?: string
  auto_approved?: boolean
}

interface ApprovalWorkflow {
  request_type: string
  threshold_amount: number
  requires_superadmin: boolean
  auto_approval_criteria?: {
    max_amount: number
    trusted_requesters: string[]
    time_restrictions?: string[]
  }
  notification_settings: {
    email_notifications: boolean
    in_app_notifications: boolean
    escalation_time_hours: number
  }
}

interface AuditLogEntry {
  id: string
  action_type: 'point_award' | 'approval_granted' | 'approval_rejected' | 'bulk_operation' | 'compensation_change'
  performed_by: string
  performed_by_name: string
  target_user?: string
  target_user_name?: string
  details: {
    amount?: number
    reason?: string
    original_request_id?: string
    impact_metrics?: {
      users_affected: number
      total_points: number
      budget_impact: number
    }
  }
  timestamp: Date
  ip_address?: string
  user_agent?: string
}

export function AdministrativeOversight() {
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([])
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([])
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('pending')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Initialize with mock data
  useEffect(() => {
    const mockRequests: ApprovalRequest[] = [
      {
        id: 'ar1',
        type: 'point_award',
        title: 'High-Value Student Achievement Award',
        description: 'Award 75 points to top 5 students for exceptional project performance',
        requested_by: 'teacher1',
        requested_by_name: 'Sarah Johnson',
        created_at: new Date('2024-03-15T14:30:00Z'),
        recipient_ids: ['s1', 's2', 's3', 's4', 's5'],
        recipient_names: ['Emma Chen', 'Alex Rodriguez', 'Maya Patel', 'Jordan Lee', 'Sam Kim'],
        points_amount: 75,
        category: 'academic_achievement',
        reason: 'Outstanding performance in final project presentations',
        status: 'pending',
        priority: 'high',
        approval_threshold: 50
      },
      {
        id: 'ar2',
        type: 'compensation_adjustment',
        title: 'Performance Bonus Request',
        description: 'Quarterly performance bonus based on exceptional student success correlation',
        requested_by: 'admin1',
        requested_by_name: 'Michael Chen',
        created_at: new Date('2024-03-14T16:45:00Z'),
        teacher_id: 't1',
        teacher_name: 'Sarah Johnson',
        compensation_amount: 3500,
        performance_metrics: {
          efficiency: 95,
          quality: 88,
          correlation: 0.84
        },
        status: 'requires_superadmin',
        priority: 'medium',
        approval_threshold: 3000
      },
      {
        id: 'ar3',
        type: 'bulk_operation',
        title: 'Department-Wide Recognition',
        description: 'Award points to all Science department members for excellent collaboration',
        requested_by: 'admin2',
        requested_by_name: 'Emma Rodriguez',
        created_at: new Date('2024-03-13T10:15:00Z'),
        operation_details: {
          target_count: 28,
          total_points_impact: 840,
          budget_impact: 0
        },
        points_amount: 30,
        category: 'collaborative_contribution',
        reason: 'Outstanding interdisciplinary science fair collaboration',
        status: 'approved',
        priority: 'medium',
        approval_threshold: 500,
        reviewed_by: 'superadmin1',
        reviewed_at: new Date('2024-03-13T12:30:00Z'),
        review_notes: 'Approved - excellent initiative to recognize collaborative efforts'
      }
    ]

    const mockAuditLog: AuditLogEntry[] = [
      {
        id: 'al1',
        action_type: 'approval_granted',
        performed_by: 'superadmin1',
        performed_by_name: 'David Wilson',
        details: {
          original_request_id: 'ar3',
          impact_metrics: {
            users_affected: 28,
            total_points: 840,
            budget_impact: 0
          }
        },
        timestamp: new Date('2024-03-13T12:30:00Z'),
        ip_address: '192.168.1.100'
      },
      {
        id: 'al2',
        action_type: 'point_award',
        performed_by: 'admin1',
        performed_by_name: 'Michael Chen',
        target_user: 's1',
        target_user_name: 'Emma Chen',
        details: {
          amount: 25,
          reason: 'Excellent behavior and peer mentorship'
        },
        timestamp: new Date('2024-03-12T15:20:00Z'),
        ip_address: '192.168.1.101'
      },
      {
        id: 'al3',
        action_type: 'compensation_change',
        performed_by: 'superadmin1',
        performed_by_name: 'David Wilson',
        target_user: 't2',
        target_user_name: 'Michael Chen',
        details: {
          amount: 2500,
          reason: 'Quarterly performance bonus'
        },
        timestamp: new Date('2024-03-10T11:45:00Z'),
        ip_address: '192.168.1.100'
      }
    ]

    const mockWorkflows: ApprovalWorkflow[] = [
      {
        request_type: 'point_award',
        threshold_amount: 50,
        requires_superadmin: false,
        auto_approval_criteria: {
          max_amount: 25,
          trusted_requesters: ['admin1', 'admin2'],
          time_restrictions: ['09:00-17:00']
        },
        notification_settings: {
          email_notifications: true,
          in_app_notifications: true,
          escalation_time_hours: 24
        }
      },
      {
        request_type: 'compensation_adjustment',
        threshold_amount: 1000,
        requires_superadmin: true,
        notification_settings: {
          email_notifications: true,
          in_app_notifications: true,
          escalation_time_hours: 48
        }
      },
      {
        request_type: 'bulk_operation',
        threshold_amount: 500,
        requires_superadmin: false,
        auto_approval_criteria: {
          max_amount: 200,
          trusted_requesters: ['admin1', 'admin2']
        },
        notification_settings: {
          email_notifications: true,
          in_app_notifications: true,
          escalation_time_hours: 12
        }
      }
    ]

    setPendingRequests(mockRequests)
    setAuditLog(mockAuditLog)
    setWorkflows(mockWorkflows)
  }, [])

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'point_award': return <Award className="h-4 w-4" />
      case 'bulk_operation': return <Users className="h-4 w-4" />
      case 'compensation_adjustment': return <DollarSign className="h-4 w-4" />
      case 'achievement_creation': return <Target className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'requires_superadmin': return 'bg-orange-100 text-orange-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'point_award': return <Award className="h-4 w-4 text-green-600" />
      case 'approval_granted': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'approval_rejected': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'bulk_operation': return <Users className="h-4 w-4 text-blue-600" />
      case 'compensation_change': return <DollarSign className="h-4 w-4 text-purple-600" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const handleApproveRequest = async (requestId: string, notes: string) => {
    const request = pendingRequests.find(r => r.id === requestId)
    if (!request) return

    // Update request status
    setPendingRequests(prev => prev.map(r => 
      r.id === requestId 
        ? { 
            ...r, 
            status: 'approved',
            reviewed_by: 'current_admin',
            reviewed_at: new Date(),
            review_notes: notes
          }
        : r
    ))

    // Add audit log entry
    const auditEntry: AuditLogEntry = {
      id: `al${Date.now()}`,
      action_type: 'approval_granted',
      performed_by: 'current_admin',
      performed_by_name: 'Current Administrator',
      details: {
        original_request_id: requestId,
        reason: notes,
        impact_metrics: request.operation_details || {
          users_affected: request.recipient_ids?.length || 1,
          total_points: (request.points_amount || 0) * (request.recipient_ids?.length || 1),
          budget_impact: request.compensation_amount || 0
        }
      },
      timestamp: new Date(),
      ip_address: '192.168.1.102'
    }

    setAuditLog(prev => [auditEntry, ...prev])
    setShowApprovalDialog(false)
    setSelectedRequest(null)
    setApprovalNotes('')
  }

  const handleRejectRequest = async (requestId: string, notes: string) => {
    setPendingRequests(prev => prev.map(r => 
      r.id === requestId 
        ? { 
            ...r, 
            status: 'rejected',
            reviewed_by: 'current_admin',
            reviewed_at: new Date(),
            review_notes: notes
          }
        : r
    ))

    // Add audit log entry
    const auditEntry: AuditLogEntry = {
      id: `al${Date.now()}`,
      action_type: 'approval_rejected',
      performed_by: 'current_admin',
      performed_by_name: 'Current Administrator',
      details: {
        original_request_id: requestId,
        reason: notes
      },
      timestamp: new Date(),
      ip_address: '192.168.1.102'
    }

    setAuditLog(prev => [auditEntry, ...prev])
    setShowApprovalDialog(false)
    setSelectedRequest(null)
    setApprovalNotes('')
  }

  const filteredRequests = pendingRequests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus
    const matchesType = filterType === 'all' || request.type === filterType
    const matchesSearch = searchTerm === '' || 
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requested_by_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesType && matchesSearch
  })

  const getRequestDetails = (request: ApprovalRequest) => {
    switch (request.type) {
      case 'point_award':
        return (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Recipients:</span>
              <span className="font-medium">{request.recipient_names?.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span>Points per recipient:</span>
              <span className="font-medium">+{request.points_amount}</span>
            </div>
            <div className="flex justify-between">
              <span>Category:</span>
              <span className="font-medium capitalize">{request.category?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span>Total impact:</span>
              <span className="font-medium">+{(request.points_amount || 0) * (request.recipient_ids?.length || 1)} points</span>
            </div>
          </div>
        )
      
      case 'compensation_adjustment':
        return (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Teacher:</span>
              <span className="font-medium">{request.teacher_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-medium">${request.compensation_amount?.toLocaleString()}</span>
            </div>
            {request.performance_metrics && (
              <>
                <div className="flex justify-between">
                  <span>Efficiency:</span>
                  <span className="font-medium">{request.performance_metrics.efficiency}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Quality:</span>
                  <span className="font-medium">{request.performance_metrics.quality}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Correlation:</span>
                  <span className="font-medium">{(request.performance_metrics.correlation * 100).toFixed(1)}%</span>
                </div>
              </>
            )}
          </div>
        )
      
      case 'bulk_operation':
        return (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Target users:</span>
              <span className="font-medium">{request.operation_details?.target_count}</span>
            </div>
            <div className="flex justify-between">
              <span>Points per user:</span>
              <span className="font-medium">+{request.points_amount}</span>
            </div>
            <div className="flex justify-between">
              <span>Total impact:</span>
              <span className="font-medium">+{request.operation_details?.total_points_impact} points</span>
            </div>
            <div className="flex justify-between">
              <span>Budget impact:</span>
              <span className="font-medium">${request.operation_details?.budget_impact?.toLocaleString() || 0}</span>
            </div>
          </div>
        )
      
      default:
        return <div className="text-sm text-muted-foreground">No additional details available</div>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Administrative Oversight
              </CardTitle>
              <CardDescription>
                Approval workflows, audit trails, and administrative controls
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="approvals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="approvals">Approval Queue</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Approval Queue Tab */}
        <TabsContent value="approvals" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Pending Approvals
                </CardTitle>
                <Badge variant="secondary">
                  {pendingRequests.filter(r => r.status === 'pending' || r.status === 'requires_superadmin').length} pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="requires_superadmin">Needs Superadmin</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="point_award">Point Awards</SelectItem>
                      <SelectItem value="bulk_operation">Bulk Operations</SelectItem>
                      <SelectItem value="compensation_adjustment">Compensation</SelectItem>
                      <SelectItem value="achievement_creation">Achievements</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Requests List */}
              <div className="space-y-3">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                          {getRequestTypeIcon(request.type)}
                        </div>
                        <div>
                          <h4 className="font-semibold">{request.title}</h4>
                          <p className="text-sm text-muted-foreground">{request.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status === 'requires_superadmin' ? 'Needs Superadmin' : request.status}
                        </Badge>
                        {request.status === 'requires_superadmin' && (
                          <Lock className="h-4 w-4 text-orange-600" />
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 mb-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Request Details</Label>
                        {getRequestDetails(request)}
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Request Info</Label>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Requested by:</span>
                            <span className="font-medium">{request.requested_by_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Created:</span>
                            <span className="font-medium">{request.created_at.toLocaleDateString()}</span>
                          </div>
                          {request.approval_threshold && (
                            <div className="flex justify-between">
                              <span>Threshold:</span>
                              <span className="font-medium">${request.approval_threshold}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {request.reason && (
                      <div className="mb-3">
                        <Label className="text-xs text-muted-foreground">Reason</Label>
                        <p className="text-sm mt-1">{request.reason}</p>
                      </div>
                    )}

                    {request.review_notes && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <Label className="text-xs text-muted-foreground">Review Notes</Label>
                        <p className="text-sm mt-1">{request.review_notes}</p>
                        <div className="text-xs text-muted-foreground mt-1">
                          Reviewed by {request.reviewed_by} on {request.reviewed_at?.toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {request.auto_approved ? 'Auto-approved' : 'Manual review required'}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowApprovalDialog(true)
                          }}
                          disabled={request.status !== 'pending' && request.status !== 'requires_superadmin'}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                        {(request.status === 'pending' || request.status === 'requires_superadmin') && (
                          <>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request)
                                setShowApprovalDialog(true)
                              }}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request)
                                setShowApprovalDialog(true)
                              }}
                              disabled={request.status === 'requires_superadmin'}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              {request.status === 'requires_superadmin' ? 'Needs Superadmin' : 'Approve'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredRequests.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No pending approvals</h3>
                    <p className="text-muted-foreground">
                      All requests have been processed or no requests match your filters.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Administrative Audit Trail
              </CardTitle>
              <CardDescription>
                Complete log of all administrative actions and decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {getActionTypeIcon(entry.action_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium capitalize">{entry.action_type.replace('_', ' ')}</h4>
                        <span className="text-sm text-muted-foreground">
                          {entry.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Performed by {entry.performed_by_name}
                        {entry.target_user_name && ` • Target: ${entry.target_user_name}`}
                      </div>
                      {entry.details.amount && (
                        <div className="text-sm">
                          Amount: <span className="font-medium">{entry.action_type === 'compensation_change' ? '$' : '+'}{entry.details.amount}{entry.action_type !== 'compensation_change' ? ' points' : ''}</span>
                        </div>
                      )}
                      {entry.details.reason && (
                        <div className="text-sm">
                          Reason: <span className="font-medium">{entry.details.reason}</span>
                        </div>
                      )}
                      {entry.details.impact_metrics && (
                        <div className="text-sm mt-2 p-2 bg-gray-50 rounded">
                          <div className="font-medium mb-1">Impact Metrics:</div>
                          <div>Users affected: {entry.details.impact_metrics.users_affected}</div>
                          <div>Total points: {entry.details.impact_metrics.total_points}</div>
                          <div>Budget impact: ${entry.details.impact_metrics.budget_impact}</div>
                        </div>
                      )}
                      {entry.ip_address && (
                        <div className="text-xs text-muted-foreground mt-2">
                          IP: {entry.ip_address}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Approval Workflows
              </CardTitle>
              <CardDescription>
                Configure automatic approval rules and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.map((workflow, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold capitalize">{workflow.request_type.replace('_', ' ')}</h4>
                      <div className="flex items-center gap-2">
                        {workflow.requires_superadmin ? (
                          <Badge className="bg-orange-100 text-orange-800">
                            <Lock className="h-3 w-3 mr-1" />
                            Superadmin Required
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">
                            <Unlock className="h-3 w-3 mr-1" />
                            Admin Approval
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium">Approval Settings</Label>
                        <div className="space-y-2 mt-2 text-sm">
                          <div className="flex justify-between">
                            <span>Threshold Amount:</span>
                            <span className="font-medium">${workflow.threshold_amount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Escalation Time:</span>
                            <span className="font-medium">{workflow.notification_settings.escalation_time_hours}h</span>
                          </div>
                        </div>
                      </div>

                      {workflow.auto_approval_criteria && (
                        <div>
                          <Label className="text-sm font-medium">Auto-Approval Criteria</Label>
                          <div className="space-y-2 mt-2 text-sm">
                            <div className="flex justify-between">
                              <span>Max Auto Amount:</span>
                              <span className="font-medium">${workflow.auto_approval_criteria.max_amount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Trusted Requesters:</span>
                              <span className="font-medium">{workflow.auto_approval_criteria.trusted_requesters.length}</span>
                            </div>
                            {workflow.auto_approval_criteria.time_restrictions && (
                              <div className="flex justify-between">
                                <span>Time Restrictions:</span>
                                <span className="font-medium">{workflow.auto_approval_criteria.time_restrictions.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <Label className="text-sm font-medium">Notification Settings</Label>
                      <div className="flex gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${workflow.notification_settings.email_notifications ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-sm">Email</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${workflow.notification_settings.in_app_notifications ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-sm">In-App</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button variant="outline" size="sm">
                        Edit Workflow
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {pendingRequests.filter(r => r.status === 'pending').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Auto-Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {pendingRequests.filter(r => r.auto_approved).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  This week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">2.3h</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  15% faster
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {auditLog.reduce((sum, entry) => sum + (entry.details.impact_metrics?.total_points || entry.details.amount || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Points awarded
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Approval Review Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Review Request
            </DialogTitle>
            <DialogDescription>
              Review and approve or reject this administrative request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">{selectedRequest.title}</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedRequest.description}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm text-muted-foreground">Request Details</Label>
                    <div className="mt-2 p-3 border rounded-lg">
                      {getRequestDetails(selectedRequest)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Request Info</Label>
                    <div className="mt-2 p-3 border rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <Badge variant="outline">{selectedRequest.type.replace('_', ' ')}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Priority:</span>
                        <Badge className={getPriorityColor(selectedRequest.priority)}>
                          {selectedRequest.priority}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Requested by:</span>
                        <span className="font-medium">{selectedRequest.requested_by_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="font-medium">{selectedRequest.created_at.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedRequest.reason && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Reason</Label>
                    <p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">{selectedRequest.reason}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Review Notes</Label>
                  <Textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Add notes about your decision..."
                    className="min-h-20"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowApprovalDialog(false)
                setSelectedRequest(null)
                setApprovalNotes('')
              }}
            >
              Cancel
            </Button>
            {selectedRequest && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleRejectRequest(selectedRequest.id, approvalNotes)}
                  disabled={!approvalNotes.trim()}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => handleApproveRequest(selectedRequest.id, approvalNotes)}
                  disabled={!approvalNotes.trim() || selectedRequest.status === 'requires_superadmin'}
                >
                  {selectedRequest.status === 'requires_superadmin' ? 'Needs Superadmin' : 'Approve'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}