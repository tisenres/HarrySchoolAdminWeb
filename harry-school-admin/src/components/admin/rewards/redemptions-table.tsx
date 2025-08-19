'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Truck,
  Search,
  Calendar
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { rewardsService, RedemptionWithDetails } from '@/lib/services/rewards-service'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

export default function RedemptionsTable() {
  const t = useTranslations('rewards')
  const { toast } = useToast()
  
  const [redemptions, setRedemptions] = useState<RedemptionWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  
  // Modal states
  const [processingRedemption, setProcessingRedemption] = useState<RedemptionWithDetails | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'deliver' | null>(null)

  const fetchRedemptions = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { redemptions: data, pagination } = await rewardsService.getRedemptions({
        page: currentPage,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        date_from: dateFilter ? new Date(dateFilter) : undefined,
        sort_by: 'redeemed_at',
        sort_order: 'desc'
      })
      
      setRedemptions(data || [])
      setTotalPages(pagination?.totalPages || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadingRedemptions'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRedemptions()
  }, [currentPage, statusFilter, dateFilter])

  const handleProcessRedemption = async (redemption: RedemptionWithDetails, action: 'approve' | 'reject' | 'deliver') => {
    try {
      let updateData: any = {}
      
      switch (action) {
        case 'approve':
          updateData = { status: 'approved' }
          break
        case 'reject':
          updateData = { status: 'rejected' }
          break
        case 'deliver':
          updateData = { 
            status: 'delivered',
            delivery_date: new Date().toISOString()
          }
          break
      }

      await rewardsService.updateRedemption(redemption.id, updateData)
      
      const actionMessages = {
        approve: t('messages.redemptionApproved'),
        reject: t('messages.redemptionRejected'),
        deliver: t('messages.redemptionDelivered')
      }
      
      toast({
        title: actionMessages[action],
        description: `Redemption for ${redemption.student?.full_name} has been processed.`,
      })
      
      fetchRedemptions()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('errors.processingRedemption'),
        description: err instanceof Error ? err.message : 'An error occurred',
      })
    } finally {
      setProcessingRedemption(null)
      setActionType(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; color: string }> = {
      pending: { variant: 'secondary', color: 'bg-yellow-100 text-yellow-800' },
      approved: { variant: 'default', color: 'bg-green-100 text-green-800' },
      delivered: { variant: 'default', color: 'bg-blue-100 text-blue-800' },
      cancelled: { variant: 'secondary', color: 'bg-gray-100 text-gray-800' },
      rejected: { variant: 'destructive', color: 'bg-red-100 text-red-800' },
    }
    
    const config = variants[status] || variants.pending
    
    return (
      <Badge className={config.color}>
        {t(`status.${status}`)}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading redemptions...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search redemptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t('filters.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.all')}</SelectItem>
            <SelectItem value="pending">{t('status.pending')}</SelectItem>
            <SelectItem value="approved">{t('status.approved')}</SelectItem>
            <SelectItem value="delivered">{t('status.delivered')}</SelectItem>
            <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
            <SelectItem value="rejected">{t('status.rejected')}</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-10 w-full md:w-[180px]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Reward</TableHead>
              <TableHead className="text-right">Coins</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Approval Date</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {redemptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {t('empty.noRedemptions')}
                </TableCell>
              </TableRow>
            ) : (
              redemptions.map((redemption) => (
                <TableRow key={redemption.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {redemption.student?.full_name || 'Unknown Student'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {redemption.reward?.name || 'Unknown Reward'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {redemption.reward?.reward_type && t(`types.${redemption.reward.reward_type}`)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {redemption.coins_spent}
                  </TableCell>
                  <TableCell>{getStatusBadge(redemption.status)}</TableCell>
                  <TableCell>{formatDate(redemption.redeemed_at)}</TableCell>
                  <TableCell>
                    {redemption.approved_at ? formatDate(redemption.approved_at) : '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {redemption.status === 'pending' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setProcessingRedemption(redemption)
                                setActionType('approve')
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              {t('redemption.approve')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setProcessingRedemption(redemption)
                                setActionType('reject')
                              }}
                            >
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              {t('redemption.reject')}
                            </DropdownMenuItem>
                          </>
                        )}
                        {redemption.status === 'approved' && (
                          <DropdownMenuItem
                            onClick={() => {
                              setProcessingRedemption(redemption)
                              setActionType('deliver')
                            }}
                          >
                            <Truck className="mr-2 h-4 w-4 text-blue-600" />
                            {t('redemption.markDelivered')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          {t('redemption.viewDetails')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Action Confirmation */}
      <AlertDialog open={!!processingRedemption} onOpenChange={() => {
        setProcessingRedemption(null)
        setActionType(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' && t('messages.confirmApprove')}
              {actionType === 'reject' && t('messages.confirmReject')}
              {actionType === 'deliver' && 'Mark as Delivered?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {processingRedemption && (
                <>
                  {actionType === 'approve' && `Approve redemption request from ${processingRedemption.student?.full_name} for "${processingRedemption.reward?.name}". This will deduct ${processingRedemption.coins_spent} coins from their balance.`}
                  {actionType === 'reject' && `Reject redemption request from ${processingRedemption.student?.full_name} for "${processingRedemption.reward?.name}". The coins will remain in their account.`}
                  {actionType === 'deliver' && `Mark the reward "${processingRedemption.reward?.name}" as delivered to ${processingRedemption.student?.full_name}.`}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => processingRedemption && actionType && handleProcessRedemption(processingRedemption, actionType)}
              className={
                actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                'bg-blue-600 hover:bg-blue-700'
              }
            >
              {actionType === 'approve' && 'Approve'}
              {actionType === 'reject' && 'Reject'}
              {actionType === 'deliver' && 'Mark Delivered'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}