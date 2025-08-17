'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Users,
  UserPlus,
  TrendingUp,
  Award,
  Target,
  Plus
} from 'lucide-react'
import type { ReferralSummary, ReferralProgress } from '@/types/referral'
import { fadeVariants } from '@/lib/animations'

interface ReferralSummaryCardProps {
  referralSummary: ReferralSummary | null
  referralProgress: ReferralProgress | null
  onSubmitReferral?: () => void
  onViewDetails?: () => void
  loading?: boolean
}

export function ReferralSummaryCard({
  referralSummary,
  referralProgress,
  onSubmitReferral,
  onViewDetails,
  loading = false
}: ReferralSummaryCardProps) {
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-3"></div>
            <div className="h-8 bg-muted rounded w-16 mb-2"></div>
            <div className="h-3 bg-muted rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getConversionRateColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600'
    if (rate >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConversionRateBadgeColor = (rate: number) => {
    if (rate >= 70) return 'bg-green-100 text-green-800 border-green-200'
    if (rate >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
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
              <span>Referral Summary</span>
            </div>
            {onSubmitReferral && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSubmitReferral}
              >
                <Plus className="h-4 w-4 mr-1" />
                Refer
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {referralSummary ? (
            <>
              {/* Referral Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {referralSummary.total_referrals}
                  </div>
                  <p className="text-xs text-muted-foreground">Total Referrals</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {referralSummary.successful_referrals}
                  </div>
                  <p className="text-xs text-muted-foreground">Successful</p>
                </div>
              </div>

              {/* Conversion Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Conversion Rate</span>
                  <Badge className={`${getConversionRateBadgeColor(referralSummary.conversion_rate)} text-xs`}>
                    {referralSummary.conversion_rate.toFixed(1)}%
                  </Badge>
                </div>
                <Progress 
                  value={referralSummary.conversion_rate} 
                  className="h-2"
                />
              </div>

              {/* Points Earned */}
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Points Earned</span>
                </div>
                <span className="text-lg font-bold text-yellow-700">
                  {referralSummary.points_earned}
                </span>
              </div>

              {/* Next Milestone Progress */}
              {referralProgress?.next_milestone && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Next Achievement</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {referralProgress.current_total}/{referralProgress.next_milestone.target}
                    </span>
                  </div>
                  <Progress 
                    value={referralProgress.next_milestone.progress_percentage} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {referralProgress.next_milestone.achievement_name} 
                    (+{referralProgress.next_milestone.reward_points} points)
                  </p>
                </div>
              )}

              {/* Recent Activity */}
              {referralSummary.recent_referrals.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Recent Referrals</span>
                  </h4>
                  <div className="space-y-2">
                    {referralSummary.recent_referrals.slice(0, 3).map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <p className="text-sm font-medium">{referral.referred_student_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(referral.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge 
                          variant={referral.status === 'enrolled' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {referral.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View Details Button */}
              {onViewDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewDetails}
                  className="w-full"
                >
                  <Users className="h-4 w-4 mr-2" />
                  View All Referrals
                </Button>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-2">
                No referrals submitted yet
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Start referring friends to earn points and achievements!
              </p>
              {onSubmitReferral && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSubmitReferral}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Your First Referral
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}