'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  UserPlus, 
  Clock, 
  Phone, 
  CheckCircle, 
  XCircle,
  Eye,
  MessageSquare,
  AlertCircle,
  Loader2
} from 'lucide-react'
import type { StudentReferral, AdminReferralStats } from '@/lib/services/referral-admin-service'
import { referralAdminService } from '@/lib/services/referral-admin-service'
import { fadeVariants } from '@/lib/animations'

interface PendingReferralsWidgetProps {
  organizationId: string
  onViewAllReferrals?: () => void
  onContactReferral?: (referral: StudentReferral) => void
}

export function PendingReferralsWidget({ 
  organizationId, 
  onViewAllReferrals,
  onContactReferral 
}: PendingReferralsWidgetProps) {
  const [pendingReferrals, setPendingReferrals] = useState<StudentReferral[]>([])
  const [stats, setStats] = useState<AdminReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [contactingId, setContactingId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [referrals, adminStats] = await Promise.all([
          referralAdminService.getPendingReferrals(organizationId, 5),
          referralAdminService.getAdminStats(organizationId)
        ])
        
        setPendingReferrals(referrals)
        setStats(adminStats)
      } catch (error) {
        console.error('Error loading referral data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (organizationId) {
      loadData()
    }
  }, [organizationId])

  const handleContactReferral = async (referral: StudentReferral) => {
    setContactingId(referral.id)
    try {
      await referralAdminService.updateReferralStatus(
        referral.id,
        'contacted',
        {
          contact_notes: 'Initial contact made via admin dashboard',
          updated_by: 'admin' // This should come from auth context
        }
      )
      
      // Remove from pending list
      setPendingReferrals(prev => prev.filter(r => r.id !== referral.id))
      
      // Update stats
      if (stats) {
        setStats({
          ...stats,
          pending_referrals: stats.pending_referrals - 1,
          contacted_referrals: stats.contacted_referrals + 1,
          pending_contact_queue: stats.pending_contact_queue - 1
        })
      }

      if (onContactReferral) {
        onContactReferral(referral)
      }
    } catch (error) {
      console.error('Error updating referral:', error)
    } finally {
      setContactingId(null)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getUrgencyColor = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours > 72) return 'text-red-600 bg-red-50 border-red-200'
    if (diffInHours > 24) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-blue-600 bg-blue-50 border-blue-200'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-4 w-4" />
            <span>Pending Referrals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Pending Referrals</span>
              {stats && stats.pending_contact_queue > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  {stats.pending_contact_queue} urgent
                </Badge>
              )}
            </div>
            {onViewAllReferrals && (
              <Button variant="outline" size="sm" onClick={onViewAllReferrals}>
                <Eye className="h-4 w-4 mr-1" />
                View All
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{stats.pending_referrals}</div>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{stats.contacted_referrals}</div>
                <p className="text-xs text-muted-foreground">Contacted</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {stats.conversion_rate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          )}

          {/* Pending Referrals List */}
          <div className="space-y-3">
            {pendingReferrals.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No pending referrals to contact
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  All referrals have been processed
                </p>
              </div>
            ) : (
              pendingReferrals.map((referral) => (
                <motion.div
                  key={referral.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-sm">
                          {referral.referred_student_name}
                        </h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getUrgencyColor(referral.created_at)}`}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeAgo(referral.created_at)}
                        </Badge>
                      </div>
                      
                      {referral.referred_student_phone && (
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-2">
                          <Phone className="h-3 w-3" />
                          <span>{referral.referred_student_phone}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 text-xs">
                        <Badge variant="secondary" className="text-xs">
                          {referral.referrer_type}
                        </Badge>
                        <span className="text-muted-foreground">
                          Referred {formatTimeAgo(referral.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContactReferral(referral)}
                        disabled={contactingId === referral.id}
                        className="h-7 text-xs"
                      >
                        {contactingId === referral.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Contact
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {referral.contact_notes && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                      <p className="text-muted-foreground">{referral.contact_notes}</p>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>

          {/* Action Buttons */}
          {pendingReferrals.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {pendingReferrals.length} pending contact{pendingReferrals.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Bulk Contact
                </Button>
                {onViewAllReferrals && (
                  <Button variant="default" size="sm" onClick={onViewAllReferrals} className="text-xs">
                    Manage All
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Urgency Alert */}
          {stats && stats.pending_contact_queue > 5 && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700">
                  High volume of pending referrals requires attention
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}