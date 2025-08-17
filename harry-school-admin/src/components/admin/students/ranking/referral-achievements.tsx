'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Award,
  UserPlus,
  Trophy,
  Star,
  Target,
  Calendar
} from 'lucide-react'
import type { ReferralAchievement, ReferralProgress } from '@/types/referral'
import { fadeVariants, staggerContainer, staggerItem } from '@/lib/animations'

interface ReferralAchievementsProps {
  achievements: ReferralAchievement[]
  progress: ReferralProgress | null
  loading?: boolean
}

export function ReferralAchievements({
  achievements,
  progress,
  loading = false
}: ReferralAchievementsProps) {
  
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse flex items-center space-x-3">
                <div className="w-12 h-12 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-48"></div>
                </div>
                <div className="w-16 h-6 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const earnedAchievements = achievements.filter(a => a.earned)
  const availableAchievements = achievements.filter(a => !a.earned)

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Progress to Next Achievement */}
      {progress?.next_milestone && (
        <motion.div variants={staggerItem}>
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-700">
                <Target className="h-5 w-5" />
                <span>Next Referral Achievement</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-purple-800">
                    {progress.next_milestone.achievement_name}
                  </h3>
                  <p className="text-sm text-purple-600">
                    {progress.next_milestone.reward_points} points reward
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-700">
                    {progress.current_total}
                  </div>
                  <div className="text-sm text-purple-600">
                    / {progress.next_milestone.target} referrals
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Progress 
                  value={progress.next_milestone.progress_percentage} 
                  className="h-3"
                />
                <p className="text-xs text-purple-600 text-center">
                  {progress.next_milestone.target - progress.current_total} more referrals to unlock
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Earned Achievements */}
      {earnedAchievements.length > 0 && (
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <span>Earned Referral Achievements</span>
                <Badge variant="secondary" className="ml-2">
                  {earnedAchievements.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {earnedAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                  >
                    {/* Achievement Icon */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold relative"
                        style={{ backgroundColor: achievement.badge_color }}
                      >
                        <span>{achievement.icon}</span>
                        {/* Earned indicator */}
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Star className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {achievement.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {achievement.description}
                        </p>
                      </div>
                    </div>

                    {/* Achievement Details */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          +{achievement.points_reward} points
                        </Badge>
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          +{achievement.coins_reward} coins
                        </Badge>
                      </div>
                      {achievement.earned_at && (
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(achievement.earned_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Available Achievements */}
      {availableAchievements.length > 0 && (
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-blue-600" />
                <span>Available Referral Achievements</span>
                <Badge variant="outline" className="ml-2">
                  {availableAchievements.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative overflow-hidden"
                  >
                    {/* Lock overlay for high requirements */}
                    {achievement.referral_requirement > (progress?.current_total || 0) * 2 && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-2">
                            <UserPlus className="h-4 w-4 text-white" />
                          </div>
                          <p className="text-xs text-gray-500">Coming Soon</p>
                        </div>
                      </div>
                    )}

                    {/* Achievement Icon */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold opacity-60"
                        style={{ backgroundColor: achievement.badge_color }}
                      >
                        <span>{achievement.icon}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-700">
                          {achievement.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {achievement.description}
                        </p>
                      </div>
                    </div>

                    {/* Achievement Requirements */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Required Referrals:</span>
                        <span className="font-medium">
                          {achievement.referral_requirement}
                        </span>
                      </div>
                      
                      {/* Progress bar if close to achievement */}
                      {achievement.referral_requirement <= (progress?.current_total || 0) * 2 && (
                        <div className="space-y-1">
                          <Progress 
                            value={Math.min(100, ((progress?.current_total || 0) / achievement.referral_requirement) * 100)}
                            className="h-2"
                          />
                          <p className="text-xs text-gray-500">
                            {Math.max(0, achievement.referral_requirement - (progress?.current_total || 0))} more needed
                          </p>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 pt-2">
                        <Badge variant="outline" className="text-xs">
                          +{achievement.points_reward} points
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          +{achievement.coins_reward} coins
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {achievements.length === 0 && (
        <motion.div variants={staggerItem}>
          <Card>
            <CardContent className="text-center py-12">
              <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Referral Achievements</h3>
              <p className="text-muted-foreground">
                Referral achievements will appear here once you start referring students.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}