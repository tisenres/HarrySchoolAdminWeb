'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  Award,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  CreditCard,
  Target,
  Activity
} from 'lucide-react'

// Import types
import { CompensationAdjustment, TeacherWithRanking } from '@/types/ranking'

interface CompensationManagementProps {
  teachers: TeacherWithRanking[]
}

export function CompensationManagement({ teachers }: CompensationManagementProps) {
  const t = useTranslations('rankings')
  
  // Mock compensation adjustments data
  const [compensationAdjustments, setCompensationAdjustments] = useState<CompensationAdjustment[]>([
    {
      id: '1',
      teacher_id: 'teacher-1',
      organization_id: 'org-1',
      adjustment_type: 'bonus',
      amount: 1500,
      performance_score: 92.5,
      approved_by: 'admin-1',
      payment_status: 'approved',
      evaluation_period_start: '2025-01-01',
      evaluation_period_end: '2025-01-31',
      notes: 'Exceptional teaching performance with outstanding student engagement',
      created_at: '2025-02-01T10:00:00Z',
      updated_at: '2025-02-01T10:00:00Z',
      approved_by_profile: {
        full_name: 'Admin User',
        avatar_url: ''
      }
    },
    {
      id: '2',
      teacher_id: 'teacher-2',
      organization_id: 'org-1',
      adjustment_type: 'performance_award',
      amount: 800,
      performance_score: 88.3,
      payment_status: 'pending',
      evaluation_period_start: '2025-01-01',
      evaluation_period_end: '2025-01-31',
      notes: 'Excellent innovation in teaching methods and student mentoring',
      created_at: '2025-02-01T14:30:00Z',
      updated_at: '2025-02-01T14:30:00Z'
    },
    {
      id: '3',
      teacher_id: 'teacher-3',
      organization_id: 'org-1',
      adjustment_type: 'salary_increase',
      amount: 200,
      performance_score: 95.1,
      approved_by: 'admin-1',
      payment_status: 'paid',
      evaluation_period_start: '2024-10-01',
      evaluation_period_end: '2024-12-31',
      notes: 'Outstanding performance over multiple evaluation periods. Permanent salary adjustment.',
      created_at: '2025-01-15T09:00:00Z',
      updated_at: '2025-01-15T09:00:00Z',
      approved_by_profile: {
        full_name: 'Admin User',
        avatar_url: ''
      }
    }
  ])

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'paid' | 'cancelled'>('all')
  const [filterType, setFilterType] = useState<'all' | 'bonus' | 'salary_increase' | 'performance_award'>('all')
  const [selectedAdjustment, setSelectedAdjustment] = useState<CompensationAdjustment | null>(null)
  const [showNewAdjustmentDialog, setShowNewAdjustmentDialog] = useState(false)

  // New adjustment form state
  const [newAdjustment, setNewAdjustment] = useState({
    teacher_id: '',
    adjustment_type: 'bonus' as CompensationAdjustment['adjustment_type'],
    amount: '',
    performance_score: '',
    notes: ''
  })

  // Get teacher by ID
  const getTeacherById = (teacherId: string) => {
    return teachers.find(t => t.teacher_id === teacherId)
  }

  // Filter adjustments
  const filteredAdjustments = compensationAdjustments.filter(adjustment => {
    if (filterStatus !== 'all' && adjustment.payment_status !== filterStatus) return false
    if (filterType !== 'all' && adjustment.adjustment_type !== filterType) return false
    return true
  })

  // Calculate summary statistics
  const summaryStats = {
    totalPaid: compensationAdjustments
      .filter(a => a.payment_status === 'paid')
      .reduce((sum, a) => sum + a.amount, 0),
    totalPending: compensationAdjustments
      .filter(a => a.payment_status === 'pending')
      .reduce((sum, a) => sum + a.amount, 0),
    totalApproved: compensationAdjustments
      .filter(a => a.payment_status === 'approved')
      .reduce((sum, a) => sum + a.amount, 0),
    averageAdjustment: compensationAdjustments.length > 0 
      ? compensationAdjustments.reduce((sum, a) => sum + a.amount, 0) / compensationAdjustments.length
      : 0
  }

  const handleApprove = async (adjustmentId: string) => {
    setCompensationAdjustments(prev => 
      prev.map(adj => 
        adj.id === adjustmentId 
          ? { ...adj, payment_status: 'approved', approved_by: 'current-user-id' }
          : adj
      )
    )
  }

  const handleReject = async (adjustmentId: string) => {
    setCompensationAdjustments(prev => 
      prev.map(adj => 
        adj.id === adjustmentId 
          ? { ...adj, payment_status: 'cancelled' }
          : adj
      )
    )
  }

  const handleMarkPaid = async (adjustmentId: string) => {
    setCompensationAdjustments(prev => 
      prev.map(adj => 
        adj.id === adjustmentId 
          ? { ...adj, payment_status: 'paid' }
          : adj
      )
    )
  }

  const getStatusColor = (status: CompensationAdjustment['payment_status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'paid': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: CompensationAdjustment['payment_status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />
      case 'approved': return <CheckCircle className="h-3 w-3" />
      case 'paid': return <CreditCard className="h-3 w-3" />
      case 'cancelled': return <XCircle className="h-3 w-3" />
      default: return <AlertCircle className="h-3 w-3" />
    }
  }

  const getTypeColor = (type: CompensationAdjustment['adjustment_type']) => {
    switch (type) {
      case 'bonus': return 'bg-purple-100 text-purple-800'
      case 'salary_increase': return 'bg-green-100 text-green-800'
      case 'performance_award': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCreateAdjustment = async () => {
    if (!newAdjustment.teacher_id || !newAdjustment.amount) return

    const adjustment: CompensationAdjustment = {
      id: Date.now().toString(),
      teacher_id: newAdjustment.teacher_id,
      organization_id: 'org-1',
      adjustment_type: newAdjustment.adjustment_type,
      amount: parseFloat(newAdjustment.amount),
      performance_score: parseFloat(newAdjustment.performance_score) || undefined,
      payment_status: 'pending',
      notes: newAdjustment.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setCompensationAdjustments(prev => [adjustment, ...prev])
    
    // Reset form
    setNewAdjustment({
      teacher_id: '',
      adjustment_type: 'bonus',
      amount: '',
      performance_score: '',
      notes: ''
    })
    setShowNewAdjustmentDialog(false)
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summaryStats.totalPaid.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${summaryStats.totalPending.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${summaryStats.totalApproved.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Adjustment</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summaryStats.averageAdjustment.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per adjustment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Interface */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Compensation Management</CardTitle>
              <CardDescription>
                Manage teacher salary adjustments, bonuses, and performance awards
              </CardDescription>
            </div>
            <Dialog open={showNewAdjustmentDialog} onOpenChange={setShowNewAdjustmentDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Adjustment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Compensation Adjustment</DialogTitle>
                  <DialogDescription>
                    Create a new salary adjustment, bonus, or performance award for a teacher
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Teacher</Label>
                    <Select value={newAdjustment.teacher_id} onValueChange={(value) => 
                      setNewAdjustment(prev => ({ ...prev, teacher_id: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map(teacher => (
                          <SelectItem key={teacher.teacher_id} value={teacher.teacher_id}>
                            {teacher.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Adjustment Type</Label>
                    <Select value={newAdjustment.adjustment_type} onValueChange={(value: any) => 
                      setNewAdjustment(prev => ({ ...prev, adjustment_type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bonus">Performance Bonus</SelectItem>
                        <SelectItem value="salary_increase">Salary Increase</SelectItem>
                        <SelectItem value="performance_award">Performance Award</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount ($)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newAdjustment.amount}
                        onChange={(e) => setNewAdjustment(prev => ({ ...prev, amount: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Performance Score (Optional)</Label>
                      <Input
                        type="number"
                        placeholder="0-100"
                        value={newAdjustment.performance_score}
                        onChange={(e) => setNewAdjustment(prev => ({ ...prev, performance_score: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Justification</Label>
                    <Textarea
                      placeholder="Explain the reason for this compensation adjustment..."
                      value={newAdjustment.notes}
                      onChange={(e) => setNewAdjustment(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNewAdjustmentDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAdjustment}>
                    Create Adjustment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bonus">Bonus</SelectItem>
                <SelectItem value="salary_increase">Salary Increase</SelectItem>
                <SelectItem value="performance_award">Performance Award</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1" />
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Adjustments Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Performance Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdjustments.map((adjustment) => {
                  const teacher = getTeacherById(adjustment.teacher_id)
                  
                  return (
                    <TableRow key={adjustment.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {teacher?.full_name.split(' ').map(n => n[0]).join('') || 'T'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{teacher?.full_name || 'Unknown Teacher'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(adjustment.adjustment_type)}>
                          {adjustment.adjustment_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono font-semibold">
                          ${adjustment.amount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {adjustment.performance_score ? (
                          <div className="flex items-center space-x-1">
                            <Award className="h-3 w-3 text-muted-foreground" />
                            <span>{adjustment.performance_score.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(adjustment.payment_status)}>
                          {getStatusIcon(adjustment.payment_status)}
                          <span className="ml-1 capitalize">
                            {adjustment.payment_status.replace('_', ' ')}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(adjustment.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedAdjustment(adjustment)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          
                          {adjustment.payment_status === 'pending' && (
                            <>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-green-600">
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Approve Adjustment?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Approve ${adjustment.amount.toLocaleString()} {adjustment.adjustment_type} 
                                      for {teacher?.full_name}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleApprove(adjustment.id)}>
                                      Approve
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-600">
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reject Adjustment?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Reject ${adjustment.amount.toLocaleString()} {adjustment.adjustment_type} 
                                      for {teacher?.full_name}? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleReject(adjustment.id)}>
                                      Reject
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                          
                          {adjustment.payment_status === 'approved' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-600"
                              onClick={() => handleMarkPaid(adjustment.id)}
                            >
                              <CreditCard className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredAdjustments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No compensation adjustments found</p>
              <p className="text-sm">Try adjusting your filters or create a new adjustment</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjustment Detail Dialog */}
      {selectedAdjustment && (
        <Dialog open={!!selectedAdjustment} onOpenChange={() => setSelectedAdjustment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Compensation Adjustment Details</DialogTitle>
              <DialogDescription>
                View details for adjustment #{selectedAdjustment.id}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Teacher Info */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {getTeacherById(selectedAdjustment.teacher_id)?.full_name.split(' ').map(n => n[0]).join('') || 'T'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">
                    {getTeacherById(selectedAdjustment.teacher_id)?.full_name || 'Unknown Teacher'}
                  </h3>
                  <p className="text-sm text-muted-foreground">Teacher ID: {selectedAdjustment.teacher_id}</p>
                </div>
              </div>

              <Separator />

              {/* Adjustment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Badge className={`${getTypeColor(selectedAdjustment.adjustment_type)} mt-1`}>
                    {selectedAdjustment.adjustment_type.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <div className="text-2xl font-bold mt-1">${selectedAdjustment.amount.toLocaleString()}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Performance Score</Label>
                  <div className="mt-1">
                    {selectedAdjustment.performance_score ? (
                      <span className="text-lg font-semibold">
                        {selectedAdjustment.performance_score.toFixed(1)}/100
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not provided</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={`${getStatusColor(selectedAdjustment.payment_status)} mt-1`}>
                    {getStatusIcon(selectedAdjustment.payment_status)}
                    <span className="ml-1 capitalize">
                      {selectedAdjustment.payment_status.replace('_', ' ')}
                    </span>
                  </Badge>
                </div>
              </div>

              {/* Period */}
              {selectedAdjustment.evaluation_period_start && selectedAdjustment.evaluation_period_end && (
                <div>
                  <Label className="text-sm font-medium">Evaluation Period</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedAdjustment.evaluation_period_start} to {selectedAdjustment.evaluation_period_end}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedAdjustment.notes && (
                <div>
                  <Label className="text-sm font-medium">Justification</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <p className="text-sm">{selectedAdjustment.notes}</p>
                  </div>
                </div>
              )}

              {/* Approval Info */}
              {selectedAdjustment.approved_by_profile && (
                <div>
                  <Label className="text-sm font-medium">Approved By</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedAdjustment.approved_by_profile.full_name}</span>
                    <span className="text-muted-foreground">
                      on {new Date(selectedAdjustment.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setSelectedAdjustment(null)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}