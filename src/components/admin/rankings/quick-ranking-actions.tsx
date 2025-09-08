'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Award, 
  Users, 
  UserPlus, 
  Medal, 
  Gift,
  Zap,
  Trophy,
  UserCheck
} from 'lucide-react'

// Import existing modals (to be extended for teacher support)
import { UnifiedQuickPointAward } from '@/components/admin/rankings/unified-quick-point-award'
import { ManualAwardInterface } from '@/components/admin/achievements/manual-award-interface'
import { RewardApprovalModal } from '@/components/admin/rewards/reward-approval-modal'

interface QuickRankingActionsProps {
  userTypeFilter: 'student' | 'teacher' | 'combined'
}

export function QuickRankingActions({ userTypeFilter }: QuickRankingActionsProps) {
  const t = useTranslations('rankings')
  const [showPointAward, setShowPointAward] = useState(false)
  const [showAchievementAward, setShowAchievementAward] = useState(false)
  const [showRewardApproval, setShowRewardApproval] = useState(false)
  const [selectedUserType, setSelectedUserType] = useState<'student' | 'teacher'>('student')

  // Mock recent activities (will be replaced with real API)
  const recentActivities = [
    {
      id: '1',
      type: 'points',
      userType: 'student',
      userName: 'Ali Karimov',
      action: 'Earned 15 points for homework completion',
      timestamp: '2 minutes ago',
      category: 'homework'
    },
    {
      id: '2', 
      type: 'achievement',
      userType: 'teacher',
      userName: 'Nargiza Karimova',
      action: 'Unlocked "Outstanding Teaching" achievement',
      timestamp: '5 minutes ago',
      category: 'teaching_quality'
    },
    {
      id: '3',
      type: 'points',
      userType: 'student',
      userName: 'Dilshod Rakhimov',
      action: 'Earned 10 points for participation',
      timestamp: '8 minutes ago',
      category: 'participation'
    },
    {
      id: '4',
      type: 'reward',
      userType: 'student',
      userName: 'Malika Nazarova',
      action: 'Redeemed "Extra Break Time" reward',
      timestamp: '12 minutes ago',
      category: 'privilege'
    }
  ]

  const filteredActivities = recentActivities.filter(activity => {
    if (userTypeFilter === 'combined') return true
    return activity.userType === userTypeFilter
  })

  const handleQuickPoints = (userType: 'student' | 'teacher') => {
    setSelectedUserType(userType)
    setShowPointAward(true)
  }

  const handleQuickAchievement = (userType: 'student' | 'teacher') => {
    setSelectedUserType(userType)
    setShowAchievementAward(true)
  }

  const handleRewardApproval = () => {
    setShowRewardApproval(true)
  }

  const handlePointsAwarded = async (data: any) => {
    console.log('Points awarded:', data)
    // Could refresh rankings data here
  }

  const handleAchievementAwarded = async (data: any) => {
    console.log('Achievement awarded:', data)
    // Could refresh rankings data here
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Quick Actions */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              {t('quickActions')}
            </CardTitle>
            <CardDescription>{t('quickActionsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Student Actions */}
            {(userTypeFilter === 'combined' || userTypeFilter === 'student') && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('studentActions')}
                </h4>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleQuickPoints('student')}
                    className="justify-start"
                  >
                    <Award className="h-4 w-4 mr-2 text-blue-500" />
                    {t('awardPoints')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleQuickAchievement('student')}
                    className="justify-start"
                  >
                    <Medal className="h-4 w-4 mr-2 text-purple-500" />
                    {t('giveAchievement')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRewardApproval}
                    className="justify-start"
                  >
                    <Gift className="h-4 w-4 mr-2 text-green-500" />
                    {t('approveReward')}
                  </Button>
                </div>
              </div>
            )}

            {/* Teacher Actions */}
            {(userTypeFilter === 'combined' || userTypeFilter === 'teacher') && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  {t('teacherActions')}
                </h4>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleQuickPoints('teacher')}
                    className="justify-start"
                  >
                    <Award className="h-4 w-4 mr-2 text-blue-500" />
                    {t('awardTeacherPoints')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleQuickAchievement('teacher')}
                    className="justify-start"
                  >
                    <Medal className="h-4 w-4 mr-2 text-purple-500" />
                    {t('giveTeacherAchievement')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start"
                  >
                    <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                    {t('evaluatePerformance')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('recentActivity')}</CardTitle>
          <CardDescription>{t('recentActivityDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredActivities.slice(0, 4).map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 text-sm">
              <div className="flex-shrink-0 mt-1">
                {activity.type === 'points' && <Award className="h-4 w-4 text-blue-500" />}
                {activity.type === 'achievement' && <Medal className="h-4 w-4 text-purple-500" />}
                {activity.type === 'reward' && <Gift className="h-4 w-4 text-green-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{activity.userName}</p>
                <p className="text-muted-foreground text-xs">{activity.action}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={activity.userType === 'teacher' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {activity.userType}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
          
          {filteredActivities.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              <p className="text-sm">{t('noRecentActivity')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showPointAward && (
        <UnifiedQuickPointAward
          open={showPointAward}
          onOpenChange={setShowPointAward}
          userIds={[]} // Will be populated by user selection in the modal
          userType={selectedUserType}
          onSubmit={handlePointsAwarded}
        />
      )}

      {showAchievementAward && (
        <ManualAwardInterface
          isOpen={showAchievementAward}
          onClose={() => setShowAchievementAward(false)}
          userType={selectedUserType}
          onAchievementAwarded={handleAchievementAwarded}
        />
      )}

      {showRewardApproval && (
        <RewardApprovalModal
          open={showRewardApproval}
          onOpenChange={setShowRewardApproval}
        />
      )}
    </div>
  )
}