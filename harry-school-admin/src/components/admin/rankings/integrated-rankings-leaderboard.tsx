'use client'

import { useState, useCallback, useEffect } from 'react'
import { LeaderboardTable } from '@/components/admin/leaderboard/leaderboard-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Trophy, 
  Share2, 
  TrendingUp,
  Award,
  UserPlus,
  Target,
  Percent
} from 'lucide-react'

// Enhanced interface with referral data
interface LeaderboardStudent {
  student_id: string
  student_name: string
  profile_image_url?: string
  total_points: number
  current_level: number
  current_rank: number
  weekly_points: number
  monthly_points: number
  total_achievements: number
  recent_achievements: Array<{
    id: string
    name: string
    icon_name: string
    badge_color: string
    earned_at: string
  }>
  rank_change?: number
  last_activity_date?: string
  period_points: number
  // Referral metrics
  total_referrals?: number
  successful_referrals?: number
  referral_conversion_rate?: number
  referral_points_earned?: number
  recent_referrals?: Array<{
    id: string
    referred_student_name: string
    status: 'pending' | 'contacted' | 'enrolled' | 'declined'
    points_awarded: number
    created_at: string
  }>
}

interface LeaderboardFilters {
  group_id?: string
  time_period: 'week' | 'month' | 'all'
  achievement_type?: string
  category?: string
  search?: string
  view_type?: 'performance' | 'referrals' | 'combined'
  referral_status?: 'all' | 'active' | 'top_performers'
}

// Mock data with referral metrics
const mockStudentsWithReferrals: LeaderboardStudent[] = [
  {
    student_id: '1',
    student_name: 'Ali Karimov',
    total_points: 2850,
    current_level: 12,
    current_rank: 1,
    weekly_points: 120,
    monthly_points: 450,
    total_achievements: 8,
    recent_achievements: [
      { id: '1', name: 'Perfect Week', icon_name: '🏆', badge_color: '#10B981', earned_at: '2025-01-15' },
      { id: '2', name: 'Top Performer', icon_name: '⭐', badge_color: '#F59E0B', earned_at: '2025-01-10' }
    ],
    rank_change: 2,
    last_activity_date: '2025-01-16',
    period_points: 450,
    total_referrals: 8,
    successful_referrals: 5,
    referral_conversion_rate: 62.5,
    referral_points_earned: 750,
    recent_referrals: [
      { id: 'r1', referred_student_name: 'John Smith', status: 'enrolled', points_awarded: 150, created_at: '2025-01-10' },
      { id: 'r2', referred_student_name: 'Maria Garcia', status: 'contacted', points_awarded: 0, created_at: '2025-01-12' },
      { id: 'r3', referred_student_name: 'Ahmed Hassan', status: 'pending', points_awarded: 0, created_at: '2025-01-14' }
    ]
  },
  {
    student_id: '2',
    student_name: 'Malika Nazarova',
    total_points: 2640,
    current_level: 11,
    current_rank: 2,
    weekly_points: 95,
    monthly_points: 380,
    total_achievements: 6,
    recent_achievements: [
      { id: '3', name: 'Homework Master', icon_name: '📚', badge_color: '#6366F1', earned_at: '2025-01-14' }
    ],
    rank_change: -1,
    last_activity_date: '2025-01-15',
    period_points: 380,
    total_referrals: 6,
    successful_referrals: 4,
    referral_conversion_rate: 66.7,
    referral_points_earned: 600,
    recent_referrals: [
      { id: 'r4', referred_student_name: 'Sarah Wilson', status: 'enrolled', points_awarded: 150, created_at: '2025-01-08' },
      { id: 'r5', referred_student_name: 'David Chen', status: 'enrolled', points_awarded: 150, created_at: '2025-01-05' }
    ]
  },
  {
    student_id: '3',
    student_name: 'Jasur Rakhimov',
    total_points: 2420,
    current_level: 10,
    current_rank: 3,
    weekly_points: 110,
    monthly_points: 420,
    total_achievements: 7,
    recent_achievements: [
      { id: '4', name: 'Attendance Star', icon_name: '⏰', badge_color: '#059669', earned_at: '2025-01-13' }
    ],
    last_activity_date: '2025-01-16',
    period_points: 420,
    total_referrals: 12,
    successful_referrals: 6,
    referral_conversion_rate: 50.0,
    referral_points_earned: 900,
    recent_referrals: [
      { id: 'r6', referred_student_name: 'Lisa Brown', status: 'enrolled', points_awarded: 150, created_at: '2025-01-09' },
      { id: 'r7', referred_student_name: 'Tom Anderson', status: 'declined', points_awarded: 0, created_at: '2025-01-11' },
      { id: 'r8', referred_student_name: 'Emily Davis', status: 'contacted', points_awarded: 0, created_at: '2025-01-13' }
    ]
  },
  {
    student_id: '4',
    student_name: 'Nozima Yusupova',
    total_points: 2180,
    current_level: 9,
    current_rank: 4,
    weekly_points: 85,
    monthly_points: 320,
    total_achievements: 5,
    recent_achievements: [
      { id: '5', name: 'Quick Learner', icon_name: '🚀', badge_color: '#DC2626', earned_at: '2025-01-12' }
    ],
    rank_change: 1,
    last_activity_date: '2025-01-14',
    period_points: 320,
    total_referrals: 3,
    successful_referrals: 2,
    referral_conversion_rate: 66.7,
    referral_points_earned: 300,
    recent_referrals: [
      { id: 'r9', referred_student_name: 'Alex Johnson', status: 'enrolled', points_awarded: 150, created_at: '2025-01-06' }
    ]
  }
]

export function IntegratedRankingsLeaderboard() {
  const [filters, setFilters] = useState<LeaderboardFilters>({
    time_period: 'month',
    view_type: 'performance'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [loading, setLoading] = useState(false)

  // Filter and sort students based on view type and filters
  const getFilteredStudents = useCallback(() => {
    let filtered = [...mockStudentsWithReferrals]

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(student => 
        student.student_name.toLowerCase().includes(searchLower) ||
        student.student_id.includes(searchLower)
      )
    }

    // Sort based on view type
    if (filters.view_type === 'referrals') {
      filtered.sort((a, b) => {
        // Sort by total referrals first, then by conversion rate
        const aReferrals = a.total_referrals || 0
        const bReferrals = b.total_referrals || 0
        if (aReferrals !== bReferrals) {
          return bReferrals - aReferrals
        }
        return (b.referral_conversion_rate || 0) - (a.referral_conversion_rate || 0)
      })
    } else {
      // Default sort by points
      filtered.sort((a, b) => b.total_points - a.total_points)
    }

    // Update ranks based on current sort
    filtered.forEach((student, index) => {
      student.current_rank = index + 1
    })

    return filtered
  }, [filters])

  const filteredStudents = getFilteredStudents()
  const totalCount = filteredStudents.length
  const totalPages = Math.ceil(totalCount / pageSize)
  
  // Paginate results
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleFiltersChange = useCallback((newFilters: LeaderboardFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }, [])

  const handleRefresh = useCallback(() => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])

  const handleExport = useCallback(() => {
    // Export functionality would be implemented here
    console.log('Exporting leaderboard data...')
  }, [])

  // Summary stats based on view type
  const getSummaryStats = () => {
    if (filters.view_type === 'referrals') {
      const totalReferrals = filteredStudents.reduce((sum, s) => sum + (s.total_referrals || 0), 0)
      const totalSuccessful = filteredStudents.reduce((sum, s) => sum + (s.successful_referrals || 0), 0)
      const avgConversion = filteredStudents.reduce((sum, s) => sum + (s.referral_conversion_rate || 0), 0) / filteredStudents.length
      const totalReferralPoints = filteredStudents.reduce((sum, s) => sum + (s.referral_points_earned || 0), 0)

      return [
        { icon: UserPlus, label: 'Total Referrals', value: totalReferrals.toString(), color: 'text-blue-600' },
        { icon: Trophy, label: 'Successful', value: totalSuccessful.toString(), color: 'text-green-600' },
        { icon: Percent, label: 'Avg Conversion', value: `${avgConversion.toFixed(1)}%`, color: 'text-purple-600' },
        { icon: Share2, label: 'Referral Points', value: totalReferralPoints.toLocaleString(), color: 'text-orange-600' }
      ]
    } else {
      const totalPoints = filteredStudents.reduce((sum, s) => sum + s.total_points, 0)
      const avgPoints = totalPoints / filteredStudents.length
      const totalAchievements = filteredStudents.reduce((sum, s) => sum + s.total_achievements, 0)
      const activeToday = filteredStudents.filter(s => s.last_activity_date === '2025-01-16').length

      return [
        { icon: Users, label: 'Total Students', value: filteredStudents.length.toString(), color: 'text-blue-600' },
        { icon: Award, label: 'Total Points', value: totalPoints.toLocaleString(), color: 'text-green-600' },
        { icon: Target, label: 'Avg Points', value: Math.round(avgPoints).toLocaleString(), color: 'text-purple-600' },
        { icon: TrendingUp, label: 'Active Today', value: activeToday.toString(), color: 'text-orange-600' }
      ]
    }
  }

  const summaryStats = getSummaryStats()

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {summaryStats.map((stat, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {filters.view_type === 'referrals' && index === 0 && (
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  +15% from last month
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Leaderboard Table */}
      <LeaderboardTable
        students={paginatedStudents}
        loading={loading}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        onRefresh={handleRefresh}
        onExport={handleExport}
        groups={[]} // Would be populated from actual data
        achievementTypes={['homework', 'attendance', 'behavior', 'referral']}
        categories={['academic', 'social', 'referral']}
      />
    </div>
  )
}