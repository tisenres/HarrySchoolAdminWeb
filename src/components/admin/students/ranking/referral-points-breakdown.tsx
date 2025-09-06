'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  UserPlus,
  TrendingUp,
  Calendar,
  Award,
  ExternalLink,
  Star
} from 'lucide-react'
import type { StudentReferral, ReferralSummary } from '@/types/referral'
import type { PointsTransaction } from '@/types/ranking'
import { fadeVariants, staggerContainer, staggerItem } from '@/lib/animations'

interface ReferralPointsBreakdownProps {
  referralSummary: ReferralSummary | null
  referralTransactions: PointsTransaction[]
  onViewAllTransactions?: () => void
  loading?: boolean
}

export function ReferralPointsBreakdown({
  referralSummary,
  referralTransactions,
  onViewAllTransactions,
  loading = false
}: ReferralPointsBreakdownProps) {
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-5 bg-muted rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted rounded w-64"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-32 mb-1"></div>
                    <div className="h-3 bg-muted rounded w-48"></div>
                  </div>
                  <div className="w-16 h-6 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTransactionIcon = (transaction: PointsTransaction) => {
    if (transaction.points_amount > 0) {
      return <UserPlus className="h-4 w-4 text-green-600" />
    }
    return <TrendingUp className="h-4 w-4 text-blue-600" />
  }

  const getTransactionColor = (transaction: PointsTransaction) => {
    if (transaction.points_amount > 0) {
      return 'text-green-600'
    }
    return 'text-blue-600'
  }

  const totalPointsFromReferrals = referralTransactions.reduce(
    (sum, transaction) => sum + Math.max(0, transaction.points_amount), 
    0
  )

  const monthlyBreakdown = referralTransactions.reduce((acc, transaction) => {
    const month = new Date(transaction.created_at).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    })
    
    if (!acc[month]) {
      acc[month] = { points: 0, count: 0 }
    }
    
    acc[month].points += Math.max(0, transaction.points_amount)
    acc[month].count += 1
    
    return acc
  }, {} as Record<string, { points: number; count: number }>)

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <span>Referral Points Contribution</span>
            </div>
            {referralSummary && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                {referralSummary.points_earned} total points
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {referralSummary && totalPointsFromReferrals > 0 ? (
            <>
              {/* Summary Statistics */}
              <motion.div variants={staggerItem}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {totalPointsFromReferrals}
                    </div>
                    <p className="text-sm text-blue-700">Points from Referrals</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {referralSummary.successful_referrals}
                    </div>
                    <p className="text-sm text-green-700">Successful Referrals</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {referralSummary.successful_referrals > 0 
                        ? Math.round(totalPointsFromReferrals / referralSummary.successful_referrals)
                        : 0
                      }
                    </div>
                    <p className="text-sm text-purple-700">Avg Points/Referral</p>
                  </div>
                </div>
              </motion.div>

              {/* Monthly Breakdown */}
              {Object.keys(monthlyBreakdown).length > 1 && (
                <motion.div variants={staggerItem}>
                  <h4 className="font-medium mb-3 flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Monthly Breakdown</span>
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(monthlyBreakdown)
                      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                      .map(([month, data]) => (
                        <div key={month} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{month}</p>
                            <p className="text-sm text-muted-foreground">
                              {data.count} referral{data.count !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            +{data.points} points
                          </Badge>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}

              {/* Recent Transactions */}
              <motion.div variants={staggerItem}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Recent Referral Points</span>
                  </h4>
                  {referralTransactions.length > 5 && onViewAllTransactions && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onViewAllTransactions}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View All
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {referralTransactions.slice(0, 5).map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        {getTransactionIcon(transaction)}
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {transaction.reason}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                          <span>{formatDate(transaction.created_at)}</span>
                          {transaction.awarded_by_profile && (
                            <span>by {transaction.awarded_by_profile.full_name}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`font-bold ${getTransactionColor(transaction)}`}>
                          {transaction.points_amount > 0 ? '+' : ''}{transaction.points_amount}
                        </span>
                        {transaction.coins_earned > 0 && (
                          <div className="text-xs text-muted-foreground">
                            +{transaction.coins_earned} coins
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Achievement Impact */}
              {referralSummary.successful_referrals >= 3 && (
                <motion.div variants={staggerItem}>
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Award className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Achievement Unlocked!</span>
                    </div>
                    <p className="text-sm text-yellow-700 mb-2">
                      Your referral efforts have earned you special achievements and bonus points.
                    </p>
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        Referral Ambassador Badge
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            /* Empty State */
            <motion.div variants={staggerItem}>
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="font-medium text-muted-foreground mb-2">
                  No Referral Points Yet
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start referring students to see your points breakdown here.
                </p>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 max-w-sm mx-auto">
                  <p className="text-sm text-blue-700">
                    <strong>Tip:</strong> Each successful referral earns you 50+ points 
                    and unlocks special achievements!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}