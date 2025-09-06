'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  Trophy,
  Medal,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Users,
  UserCheck,
  Crown,
  Star
} from 'lucide-react'

// Import types
import { UserWithRanking, StudentWithRanking, TeacherWithRanking } from '@/types/ranking'

interface UnifiedLeaderboardProps {
  userTypeFilter: 'student' | 'teacher' | 'combined'
  detailed?: boolean
  limit?: number
}

export function UnifiedLeaderboard({ 
  userTypeFilter, 
  detailed = false, 
  limit = detailed ? 50 : 10 
}: UnifiedLeaderboardProps) {
  const t = useTranslations('rankings')
  const [sortBy, setSortBy] = useState<'points' | 'level' | 'efficiency' | 'quality'>('points')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Mock data (will be replaced with real API calls)
  const [leaderboardData, setLeaderboardData] = useState<UserWithRanking[]>([
    {
      id: '1',
      user_id: 'student-1',
      user_type: 'student',
      full_name: 'Ali Karimov',
      ranking: {
        id: '1',
        user_id: 'student-1',
        organization_id: 'org-1',
        user_type: 'student',
        total_points: 2850,
        available_coins: 145,
        spent_coins: 55,
        current_level: 12,
        current_rank: 1,
        created_at: '2025-01-01',
        updated_at: '2025-01-13'
      },
      recent_achievements: [],
      recent_transactions: []
    },
    {
      id: '2',
      user_id: 'teacher-1',
      user_type: 'teacher',
      full_name: 'Nargiza Karimova',
      ranking: {
        id: '2',
        user_id: 'teacher-1',
        organization_id: 'org-1',
        user_type: 'teacher',
        total_points: 3200,
        available_coins: 160,
        spent_coins: 40,
        current_level: 15,
        current_rank: 1,
        efficiency_percentage: 94.5,
        quality_score: 88.2,
        performance_tier: 'excellent',
        created_at: '2025-01-01',
        updated_at: '2025-01-13'
      },
      recent_achievements: [],
      recent_transactions: []
    },
    {
      id: '3',
      user_id: 'student-2',
      user_type: 'student',
      full_name: 'Malika Nazarova',
      ranking: {
        id: '3',
        user_id: 'student-2',
        organization_id: 'org-1',
        user_type: 'student',
        total_points: 2640,
        available_coins: 132,
        spent_coins: 68,
        current_level: 11,
        current_rank: 2,
        created_at: '2025-01-01',
        updated_at: '2025-01-13'
      },
      recent_achievements: [],
      recent_transactions: []
    },
    {
      id: '4',
      user_id: 'teacher-2',
      user_type: 'teacher',
      full_name: 'Jasur Rakhimov',
      ranking: {
        id: '4',
        user_id: 'teacher-2',
        organization_id: 'org-1',
        user_type: 'teacher',
        total_points: 2980,
        available_coins: 149,
        spent_coins: 51,
        current_level: 14,
        current_rank: 2,
        efficiency_percentage: 89.1,
        quality_score: 91.7,
        performance_tier: 'excellent',
        created_at: '2025-01-01',
        updated_at: '2025-01-13'
      },
      recent_achievements: [],
      recent_transactions: []
    },
    {
      id: '5',
      user_id: 'student-3',
      user_type: 'student',
      full_name: 'Dilshod Abdullaev',
      ranking: {
        id: '5',
        user_id: 'student-3',
        organization_id: 'org-1',
        user_type: 'student',
        total_points: 2420,
        available_coins: 121,
        spent_coins: 79,
        current_level: 10,
        current_rank: 3,
        created_at: '2025-01-01',
        updated_at: '2025-01-13'
      },
      recent_achievements: [],
      recent_transactions: []
    }
  ])

  const filteredData = leaderboardData
    .filter(user => {
      if (userTypeFilter === 'combined') return true
      return user.user_type === userTypeFilter
    })
    .filter(user => 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'points') return (b.ranking?.total_points || 0) - (a.ranking?.total_points || 0)
      if (sortBy === 'level') return (b.ranking?.current_level || 0) - (a.ranking?.current_level || 0)
      if (sortBy === 'efficiency' && a.user_type === 'teacher' && b.user_type === 'teacher') {
        return (b.ranking?.efficiency_percentage || 0) - (a.ranking?.efficiency_percentage || 0)
      }
      if (sortBy === 'quality' && a.user_type === 'teacher' && b.user_type === 'teacher') {
        return (b.ranking?.quality_score || 0) - (a.ranking?.quality_score || 0)
      }
      return 0
    })
    .slice(0, limit)

  const getRankIcon = (rank: number, userType: 'student' | 'teacher') => {
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />
    if (rank === 3) return <Award className="h-4 w-4 text-amber-600" />
    return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>
  }

  const getPerformanceTierColor = (tier?: string) => {
    switch (tier) {
      case 'outstanding': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200'
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {t('leaderboard')}
              {userTypeFilter !== 'combined' && (
                <Badge variant="outline">
                  {userTypeFilter === 'student' ? t('studentsOnly') : t('teachersOnly')}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {detailed ? t('detailedLeaderboardDescription') : t('leaderboardDescription')}
            </CardDescription>
          </div>
          
          {detailed && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchUsers')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">{t('sortByPoints')}</SelectItem>
                  <SelectItem value="level">{t('sortByLevel')}</SelectItem>
                  {(userTypeFilter === 'teacher' || userTypeFilter === 'combined') && (
                    <>
                      <SelectItem value="efficiency">{t('sortByEfficiency')}</SelectItem>
                      <SelectItem value="quality">{t('sortByQuality')}</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {filteredData.map((user, index) => {
          const displayRank = index + 1
          const isTeacher = user.user_type === 'teacher'
          const ranking = user.ranking
          
          return (
            <div 
              key={user.id}
              className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-10 h-10">
                {getRankIcon(displayRank, user.user_type)}
              </div>

              {/* Avatar */}
              <Avatar className="h-12 w-12">
                <AvatarImage src={`/api/avatars/${user.user_id}`} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{user.full_name}</h3>
                  <Badge 
                    variant={isTeacher ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {isTeacher ? (
                      <UserCheck className="h-3 w-3 mr-1" />
                    ) : (
                      <Users className="h-3 w-3 mr-1" />
                    )}
                    {t(user.user_type)}
                  </Badge>
                  {isTeacher && ranking?.performance_tier && (
                    <Badge className={`text-xs ${getPerformanceTierColor(ranking.performance_tier)}`}>
                      {t(`performanceTier.${ranking.performance_tier}`)}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    {ranking?.total_points?.toLocaleString() || 0} {t('points')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {t('level')} {ranking?.current_level || 1}
                  </span>
                  {isTeacher && ranking?.efficiency_percentage && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {ranking.efficiency_percentage.toFixed(1)}% {t('efficiency')}
                    </span>
                  )}
                </div>

                {/* Progress bar for next level */}
                {detailed && ranking && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{t('progressToNextLevel')}</span>
                      <span>{((ranking.total_points % 250) / 250 * 100).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={(ranking.total_points % 250) / 250 * 100}
                      className="h-2"
                    />
                  </div>
                )}
              </div>

              {/* Teacher-specific metrics */}
              {isTeacher && detailed && ranking && (
                <div className="text-right space-y-1">
                  <div className="text-sm font-medium">
                    {ranking.quality_score?.toFixed(1) || 0}/100
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('qualityScore')}
                  </div>
                </div>
              )}

              {/* Points display */}
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  {ranking?.total_points?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  {ranking?.available_coins || 0} {t('coins')}
                </div>
              </div>
            </div>
          )
        })}

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">{t('noUsersFound')}</p>
            <p className="text-sm">{t('noUsersFoundDescription')}</p>
          </div>
        )}

        {!detailed && filteredData.length > 0 && (
          <div className="text-center pt-4 border-t">
            <Button variant="outline" size="sm">
              {t('viewFullLeaderboard')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}