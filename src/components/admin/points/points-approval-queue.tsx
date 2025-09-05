'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  MessageSquare,
  Plus,
  Minus,
  Zap,
  Loader2,
  AlertCircle,
  Eye,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tableRowVariants, slideInVariants, staggerVariants } from '@/lib/animations'

interface PendingApproval {
  id: string
  student_id: string
  student_name: string
  points_amount: number
  reason: string
  category: string
  requested_by: string
  requested_by_name: string
  requested_at: string
  requires_approval: boolean
  priority: 'low' | 'medium' | 'high'
}

interface PointsApprovalQueueProps {
  pendingApprovals: PendingApproval[]
  onApproval: (approvalId: string, action: 'approve' | 'reject', notes?: string) => Promise<void>
  loading?: boolean
}

interface ApprovalActionModalProps {
  approval: PendingApproval | null
  action: 'approve' | 'reject' | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (notes?: string) => void
  loading: boolean
}

function ApprovalActionModal({
  approval,
  action,
  open,
  onOpenChange,
  onConfirm,
  loading
}: ApprovalActionModalProps) {
  const [notes, setNotes] = useState('')

  const handleConfirm = () => {
    onConfirm(notes.trim() || undefined)
    setNotes('')
  }

  if (!approval || !action) return null

  const isApprove = action === 'approve'
  const pointsDisplay = approval.points_amount > 0 ? `+${approval.points_amount}` : `${approval.points_amount}`
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isApprove ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span>{isApprove ? 'Approve' : 'Reject'} Points Request</span>
          </DialogTitle>
          <DialogDescription>
            {isApprove ? 'Approve' : 'Reject'} the points request for {approval.student_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Request Summary */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Student:</span>
                <span className="text-sm">{approval.student_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Points:</span>
                <Badge className={approval.points_amount > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {pointsDisplay}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Category:</span>
                <Badge variant="outline">{approval.category}</Badge>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium">Reason:</span>
                <div className="text-sm text-right max-w-48">{approval.reason}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Requested by:</span>
                <span className="text-sm">{approval.requested_by_name}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {isApprove ? 'Approval Notes (Optional)' : 'Rejection Reason *'}
            </Label>
            <Textarea
              placeholder={isApprove 
                ? 'Add any notes about this approval...' 
                : 'Explain why this request is being rejected...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {!isApprove && !notes.trim() && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please provide a reason for rejecting this request to help the requester understand.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || (!isApprove && !notes.trim())}
            className={isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : isApprove ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            {isApprove ? 'Approve Request' : 'Reject Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PointsApprovalQueue({
  pendingApprovals,
  onApproval,
  loading = false
}: PointsApprovalQueueProps) {
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'requested_at',
    direction: 'desc'
  })
  const [filterPriority, setFilterPriority] = useState<string>('all')

  const handleApprovalAction = (approval: PendingApproval, action: 'approve' | 'reject') => {
    setSelectedApproval(approval)
    setActionType(action)
    setActionModalOpen(true)
  }

  const handleConfirmAction = async (notes?: string) => {
    if (!selectedApproval || !actionType) return

    try {
      await onApproval(selectedApproval.id, actionType, notes)
      setActionModalOpen(false)
      setSelectedApproval(null)
      setActionType(null)
    } catch (error) {
      console.error('Error processing approval:', error)
    }
  }

  const getPriorityBadge = (priority: string, pointsAmount: number) => {
    if (Math.abs(pointsAmount) > 50) return { label: 'High', color: 'bg-red-100 text-red-800' }
    if (Math.abs(pointsAmount) > 20) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Low', color: 'bg-green-100 text-green-800' }
  }

  const getTransactionIcon = (pointsAmount: number) => {
    if (pointsAmount > 0) return <Plus className="h-4 w-4 text-green-600" />
    return <Minus className="h-4 w-4 text-red-600" />
  }

  const sortedApprovals = [...pendingApprovals].sort((a, b) => {
    let aValue = a[sortConfig.field as keyof PendingApproval]
    let bValue = b[sortConfig.field as keyof PendingApproval]

    // Handle date sorting
    if (sortConfig.field === 'requested_at') {
      aValue = new Date(aValue as string).getTime()
      bValue = new Date(bValue as string).getTime()
    }

    // Handle numeric sorting
    if (sortConfig.field === 'points_amount') {
      aValue = Math.abs(aValue as number)
      bValue = Math.abs(bValue as number)
    }

    if (sortConfig.direction === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const filteredApprovals = filterPriority === 'all' 
    ? sortedApprovals
    : sortedApprovals.filter(approval => {
        const priority = getPriorityBadge(approval.priority, approval.points_amount).label.toLowerCase()
        return priority === filterPriority
      })

  if (pendingApprovals.length === 0) {
    return (
      <motion.div
        variants={slideInVariants}
        initial="hidden"
        animate="visible"
        className="text-center py-12"
      >
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Pending Approvals</h3>
        <p className="text-muted-foreground">
          All points transactions have been processed. New approval requests will appear here.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={slideInVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pending Approvals</h3>
          <p className="text-sm text-muted-foreground">
            {pendingApprovals.length} request{pendingApprovals.length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-sm font-medium text-red-600">
              {pendingApprovals.filter(a => Math.abs(a.points_amount) > 50).length}
            </div>
            <div className="text-xs text-muted-foreground">High Priority</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-yellow-600">
              {pendingApprovals.filter(a => Math.abs(a.points_amount) > 20 && Math.abs(a.points_amount) <= 50).length}
            </div>
            <div className="text-xs text-muted-foreground">Medium Priority</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-green-600">
              {pendingApprovals.filter(a => Math.abs(a.points_amount) <= 20).length}
            </div>
            <div className="text-xs text-muted-foreground">Low Priority</div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={filterPriority === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPriority('all')}
          >
            All ({pendingApprovals.length})
          </Button>
          <Button
            variant={filterPriority === 'high' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPriority('high')}
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            High Priority
          </Button>
          <Button
            variant={filterPriority === 'medium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPriority('medium')}
          >
            Medium Priority
          </Button>
          <Button
            variant={filterPriority === 'low' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPriority('low')}
          >
            Low Priority
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortConfig(prev => ({
              field: 'requested_at',
              direction: prev.field === 'requested_at' && prev.direction === 'desc' ? 'asc' : 'desc'
            }))}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Date {sortConfig.field === 'requested_at' && (
              sortConfig.direction === 'desc' ? <SortDesc className="h-3 w-3 ml-1" /> : <SortAsc className="h-3 w-3 ml-1" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortConfig(prev => ({
              field: 'points_amount',
              direction: prev.field === 'points_amount' && prev.direction === 'desc' ? 'asc' : 'desc'
            }))}
          >
            Points {sortConfig.field === 'points_amount' && (
              sortConfig.direction === 'desc' ? <SortDesc className="h-3 w-3 ml-1" /> : <SortAsc className="h-3 w-3 ml-1" />
            )}
          </Button>
        </div>
      </div>

      {/* Approvals Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filteredApprovals.map((approval, index) => {
                const priority = getPriorityBadge(approval.priority, approval.points_amount)
                const pointsDisplay = approval.points_amount > 0 ? `+${approval.points_amount}` : `${approval.points_amount}`
                
                return (
                  <motion.tr
                    key={approval.id}
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{ delay: index * 0.05 }}
                    className="border-b hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {approval.student_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{approval.student_name}</div>
                          <div className="text-xs text-muted-foreground capitalize">{approval.category}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTransactionIcon(approval.points_amount)}
                        <Badge className={approval.points_amount > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {pointsDisplay}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-xs">
                      <div className="text-sm truncate" title={approval.reason}>
                        {approval.reason}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {approval.requested_by_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm">{approval.requested_by_name}</div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(approval.requested_at), { addSuffix: true })}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge className={priority.color}>
                        {priority.label}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprovalAction(approval, 'approve')}
                          disabled={loading}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprovalAction(approval, 'reject')}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </TableBody>
        </Table>
      </Card>

      {/* No results for filter */}
      {filteredApprovals.length === 0 && filterPriority !== 'all' && (
        <div className="text-center py-8">
          <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">
            No {filterPriority} priority approvals found.
          </p>
        </div>
      )}

      {/* Approval Action Modal */}
      <ApprovalActionModal
        approval={selectedApproval}
        action={actionType}
        open={actionModalOpen}
        onOpenChange={setActionModalOpen}
        onConfirm={handleConfirmAction}
        loading={loading}
      />
    </motion.div>
  )
}