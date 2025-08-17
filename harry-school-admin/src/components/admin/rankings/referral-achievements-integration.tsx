'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  UserPlus, 
  Share2, 
  Target, 
  Trophy, 
  Medal,
  Award,
  Star,
  CheckCircle,
  TrendingUp,
  Crown
} from 'lucide-react'

interface ReferralAchievement {
  id: string
  name: string
  description: string
  icon: string
  badge_color: string
  points_reward: number
  coins_reward: number
  referral_requirement: number
  achievement_type: 'referral'
  earned?: boolean
  earned_at?: string
  progress?: number
}

// Mock referral achievements that would integrate with the existing achievement system
const referralAchievements: ReferralAchievement[] = [
  {
    id: 'ref_1',
    name: 'First Referral',
    description: 'Successfully refer your first student to Harry School',
    icon: '🎯',
    badge_color: '#10B981',
    points_reward: 100,
    coins_reward: 50,
    referral_requirement: 1,
    achievement_type: 'referral',
    earned: true,
    earned_at: '2025-01-10',
    progress: 100
  },
  {
    id: 'ref_2',
    name: 'Referral Champion',
    description: 'Successfully refer 5 students to Harry School',
    icon: '🏆',
    badge_color: '#F59E0B',
    points_reward: 500,
    coins_reward: 250,
    referral_requirement: 5,
    achievement_type: 'referral',
    earned: true,
    earned_at: '2025-01-15',
    progress: 100
  },
  {
    id: 'ref_3',
    name: 'Referral Master',
    description: 'Successfully refer 10 students to Harry School',
    icon: '👑',
    badge_color: '#8B5CF6',
    points_reward: 1000,
    coins_reward: 500,
    referral_requirement: 10,
    achievement_type: 'referral',
    earned: false,
    progress: 60
  },
  {
    id: 'ref_4',
    name: 'High Conversion',
    description: 'Achieve 70% or higher referral conversion rate',
    icon: '📊',
    badge_color: '#06B6D4',
    points_reward: 300,
    coins_reward: 150,
    referral_requirement: 1, // Special achievement based on conversion rate
    achievement_type: 'referral',
    earned: false,
    progress: 89 // 62.5% current conversion rate out of 70% needed
  },
  {
    id: 'ref_5',
    name: 'Referral Streak',
    description: 'Refer at least one student for 3 consecutive months',
    icon: '🔥',
    badge_color: '#DC2626',
    points_reward: 400,
    coins_reward: 200,
    referral_requirement: 3,
    achievement_type: 'referral',
    earned: false,
    progress: 67 // 2 out of 3 months
  },
  {
    id: 'ref_6',
    name: 'Ambassador',
    description: 'Successfully refer 25 students to Harry School',
    icon: '🌟',
    badge_color: '#7C3AED',
    points_reward: 2500,
    coins_reward: 1000,
    referral_requirement: 25,
    achievement_type: 'referral',
    earned: false,
    progress: 24 // 6 out of 25 students
  }
]

interface ReferralAchievementsIntegrationProps {
  studentId?: string
  showProgress?: boolean
  maxDisplay?: number
}

export function ReferralAchievementsIntegration({
  studentId,
  showProgress = true,
  maxDisplay = 6
}: ReferralAchievementsIntegrationProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'earned' | 'available'>('all')

  const filteredAchievements = referralAchievements.filter(achievement => {
    if (selectedCategory === 'earned') return achievement.earned
    if (selectedCategory === 'available') return !achievement.earned
    return true
  }).slice(0, maxDisplay)

  const getAchievementIcon = (iconString: string, earned: boolean) => {
    if (earned) {
      return (
        <div className="flex items-center justify-center">
          <Trophy className="h-6 w-6 text-yellow-500" />
        </div>
      )
    }
    
    return (
      <div className="flex items-center justify-center text-2xl">
        {iconString}
      </div>
    )
  }

  const getRarityBadge = (points: number) => {
    if (points >= 1000) return { label: 'Legendary', color: 'bg-purple-100 text-purple-800' }
    if (points >= 500) return { label: 'Epic', color: 'bg-yellow-100 text-yellow-800' }
    if (points >= 200) return { label: 'Rare', color: 'bg-blue-100 text-blue-800' }
    return { label: 'Common', color: 'bg-gray-100 text-gray-800' }
  }

  const earnedCount = referralAchievements.filter(a => a.earned).length
  const totalCount = referralAchievements.length
  const totalPointsFromReferrals = referralAchievements.filter(a => a.earned).reduce((sum, a) => sum + a.points_reward, 0)

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Referral Achievements</CardTitle>
              <UserPlus className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnedCount}/{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              {((earnedCount / totalCount) * 100).toFixed(0)}% complete
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
              <Share2 className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPointsFromReferrals.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From referral achievements</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Next Milestone</CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10</div>
            <p className="text-xs text-muted-foreground">
              Referrals for "Referral Master"
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">62.5%</div>
            <p className="text-xs text-muted-foreground">Current success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Categories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5 text-purple-500" />
                Referral Achievements
              </CardTitle>
              <CardDescription>Special achievements for successful student referrals</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === 'all' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                onClick={() => setSelectedCategory('earned')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === 'earned' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Earned ({earnedCount})
              </button>
              <button
                onClick={() => setSelectedCategory('available')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === 'available' 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Available ({totalCount - earnedCount})
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAchievements.map((achievement) => {
              const rarity = getRarityBadge(achievement.points_reward)
              
              return (
                <div
                  key={achievement.id}
                  className={`relative p-4 border rounded-lg transition-all ${
                    achievement.earned 
                      ? 'bg-gradient-to-br from-green-50 to-blue-50 border-green-200' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Achievement Badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        achievement.earned ? 'bg-green-100' : 'bg-gray-100'
                      }`}
                    >
                      {getAchievementIcon(achievement.icon, achievement.earned)}
                    </div>
                    
                    <div className="flex flex-col items-end space-y-1">
                      {achievement.earned && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      <Badge className={rarity.color}>
                        {rarity.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Achievement Info */}
                  <div className="space-y-2">
                    <h3 className={`font-semibold ${achievement.earned ? 'text-green-800' : 'text-gray-800'}`}>
                      {achievement.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {achievement.description}
                    </p>
                    
                    {/* Progress Bar */}
                    {showProgress && !achievement.earned && achievement.progress !== undefined && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Progress</span>
                          <span>{achievement.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${achievement.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Rewards */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Award className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs font-medium text-yellow-600">
                            +{achievement.points_reward} pts
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-blue-500" />
                          <span className="text-xs font-medium text-blue-600">
                            +{achievement.coins_reward} coins
                          </span>
                        </div>
                      </div>
                      
                      {achievement.earned && achievement.earned_at && (
                        <span className="text-xs text-green-600 font-medium">
                          {new Date(achievement.earned_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}