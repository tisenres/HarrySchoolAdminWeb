'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  UserPlus, 
  Trophy, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import type { ReferralSummary } from '@/types/referral'
import { referralAdminService } from '@/lib/services/referral-admin-service'

interface ReferralStatusIndicatorProps {
  studentId: string
  compact?: boolean
  showActions?: boolean
  onManageReferrals?: () => void
}

export function ReferralStatusIndicator({
  studentId,
  compact = false,
  showActions = false,
  onManageReferrals
}: ReferralStatusIndicatorProps) {
  const [referralSummary, setReferralSummary] = useState<ReferralSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadReferralSummary = async () => {
      try {
        const summary = await referralAdminService.getStudentReferralSummary(studentId)
        setReferralSummary(summary)
      } catch (error) {
        console.error('Error loading referral summary:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReferralSummary()
  }, [studentId])

  if (loading) {
    return (
      <div className="flex items-center space-x-1">
        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (!referralSummary || referralSummary.total_referrals === 0) {
    return compact ? (
      <Badge variant="secondary" className="text-xs">
        <UserPlus className="h-3 w-3 mr-1" />
        No referrals
      </Badge>
    ) : (
      <div className="flex items-center space-x-2 text-muted-foreground">
        <UserPlus className="h-4 w-4" />
        <span className="text-sm">No referrals</span>
      </div>
    )
  }

  const getStatusColor = () => {
    if (referralSummary.conversion_rate >= 70) return 'bg-green-100 text-green-800 border-green-200'
    if (referralSummary.conversion_rate >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (referralSummary.conversion_rate >= 25) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getStatusIcon = () => {
    if (referralSummary.conversion_rate >= 70) return CheckCircle
    if (referralSummary.conversion_rate >= 50) return TrendingUp
    if (referralSummary.conversion_rate >= 25) return AlertCircle
    return XCircle
  }

  const StatusIcon = getStatusIcon()

  if (compact) {
    return (
      <div className="flex items-center space-x-1" title={`${referralSummary.total_referrals} referrals, ${referralSummary.conversion_rate.toFixed(1)}% success rate`}>
        <Badge className={`text-xs ${getStatusColor()}`}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {referralSummary.total_referrals}
        </Badge>
        {referralSummary.pending_referrals > 0 && (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            {referralSummary.pending_referrals}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Main Status */}
      <div className="flex items-center space-x-2">
        <Badge className={`${getStatusColor()}`}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {referralSummary.total_referrals} referrals
        </Badge>
        <span className="text-xs text-muted-foreground">
          {referralSummary.conversion_rate.toFixed(1)}% success
        </span>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center space-x-3 text-xs">
        <div className="flex items-center space-x-1 text-green-600">
          <CheckCircle className="h-3 w-3" />
          <span>{referralSummary.successful_referrals} enrolled</span>
        </div>
        {referralSummary.pending_referrals > 0 && (
          <div className="flex items-center space-x-1 text-blue-600">
            <Clock className="h-3 w-3" />
            <span>{referralSummary.pending_referrals} pending</span>
          </div>
        )}
        <div className="flex items-center space-x-1 text-yellow-600">
          <Trophy className="h-3 w-3" />
          <span>{referralSummary.points_earned} pts</span>
        </div>
      </div>

      {/* Action Button */}
      {showActions && onManageReferrals && (
        <Button
          variant="outline"
          size="sm"
          onClick={onManageReferrals}
          className="text-xs h-7"
        >
          <UserPlus className="h-3 w-3 mr-1" />
          Manage
        </Button>
      )}
    </div>
  )
}

/**
 * Simple referral count indicator for table cells
 */
export function ReferralCountBadge({ 
  studentId, 
  onClick 
}: { 
  studentId: string
  onClick?: () => void 
}) {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCount = async () => {
      try {
        const summary = await referralAdminService.getStudentReferralSummary(studentId)
        setCount(summary?.total_referrals || 0)
      } catch (error) {
        console.error('Error loading referral count:', error)
        setCount(0)
      } finally {
        setLoading(false)
      }
    }

    loadCount()
  }, [studentId])

  if (loading) {
    return <div className="h-5 w-8 bg-muted animate-pulse rounded" />
  }

  if (count === 0) {
    return <span className="text-muted-foreground text-sm">-</span>
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-1 text-xs hover:bg-muted"
      onClick={onClick}
      title={`View ${count} referral${count !== 1 ? 's' : ''}`}
    >
      <UserPlus className="h-3 w-3 mr-1 text-blue-600" />
      <span className="font-medium">{count}</span>
    </Button>
  )
}