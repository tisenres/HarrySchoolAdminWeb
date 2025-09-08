'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  CheckCircle,
  XCircle,
  Gift,
  Loader2,
  AlertCircle,
  Clock,
  Coins
} from 'lucide-react'
import { modalVariants } from '@/lib/animations'

interface RewardRequest {
  id: string
  user: {
    id: string
    full_name: string
    role: string
    avatar_url?: string
  }
  reward: {
    id: string
    name: string
    cost: number
    type: string
    description?: string
    image_url?: string
  }
  coins_spent: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  notes?: string
}

interface RewardApprovalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RewardApprovalModal({ open, onOpenChange }: RewardApprovalModalProps) {
  const [pendingRequests, setPendingRequests] = useState<RewardRequest[]>([])
  const [selectedRequests, setSelectedRequests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [error, setError] = useState('')

  // Fetch pending reward requests
  useEffect(() => {
    if (open) {
      fetchPendingRequests()
    }
  }, [open])

  const fetchPendingRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/rewards/approve?status=pending&limit=20')
      if (!response.ok) {
        throw new Error('Failed to fetch pending requests')
      }
      const data = await response.json()
      setPendingRequests(data.reward_requests || [])
    } catch (err) {
      console.error('Error fetching pending requests:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch requests')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectRequest = (requestId: string) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    )
  }

  const handleSelectAll = () => {
    if (selectedRequests.length === pendingRequests.length) {
      setSelectedRequests([])
    } else {
      setSelectedRequests(pendingRequests.map(req => req.id))
    }
  }

  const handleApprovalAction = async (action: 'approve' | 'reject') => {
    if (selectedRequests.length === 0) {
      setError('Please select at least one request')
      return
    }

    setActionLoading(true)
    setError('')

    try {
      const response = await fetch('/api/rewards/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rewardIds: selectedRequests,
          action,
          notes: adminNotes.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${action} requests`)
      }

      const result = await response.json()
      console.log(`Rewards ${action}d:`, result)

      // Reset form and refresh data
      setSelectedRequests([])
      setAdminNotes('')
      fetchPendingRequests()

    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} requests`)
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500'
      case 'rejected': return 'bg-red-500'
      default: return 'bg-yellow-500'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex-1 flex flex-col"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-green-500" />
              <span>Reward Approval Center</span>
            </DialogTitle>
            <DialogDescription>
              Review and approve or reject pending reward requests from students and teachers.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading pending requests...</span>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Gift className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No pending requests</p>
                <p className="text-sm">All reward requests have been processed</p>
              </div>
            ) : (
              <>
                {/* Batch Actions Header */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedRequests.length === pendingRequests.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedRequests.length} of {pendingRequests.length} selected
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprovalAction('reject')}
                      disabled={selectedRequests.length === 0 || actionLoading}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject Selected
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprovalAction('approve')}
                      disabled={selectedRequests.length === 0 || actionLoading}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve Selected
                    </Button>
                  </div>
                </div>

                {/* Requests List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className={`p-4 border rounded-lg transition-all ${
                        selectedRequests.includes(request.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedRequests.includes(request.id)}
                            onChange={() => handleSelectRequest(request.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium">{request.user.full_name}</span>
                              <Badge variant="outline">
                                {request.user.role}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2 mb-2">
                              <Gift className="h-4 w-4 text-green-500" />
                              <span className="font-medium">{request.reward.name}</span>
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <Coins className="h-3 w-3" />
                                <span>{request.reward.cost} coins</span>
                              </div>
                            </div>
                            {request.reward.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {request.reward.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(request.created_at)}</span>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`${getStatusColor(request.status)} text-white`}
                              >
                                {request.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Admin Notes */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Admin Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add notes for the approval/rejection (will be visible to users)..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg"
              >
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={actionLoading}
            >
              Close
            </Button>
            <Button
              onClick={fetchPendingRequests}
              disabled={loading || actionLoading}
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  Refresh
                </>
              )}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}