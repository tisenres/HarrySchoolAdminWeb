'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Users,
  Star,
  Zap,
  Target,
  RefreshCw,
  Download,
  AlertTriangle
} from 'lucide-react'
import { LeaderboardTable } from './leaderboard-table'
import { fadeVariants, slideInVariants } from '@/lib/animations'
import { useToast } from '@/hooks/use-toast'
import { useLeaderboardRealtime, useOptimizedLeaderboard } from '@/hooks/use-leaderboard-realtime'

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
}

interface LeaderboardFilters {
  group_id?: string
  time_period: 'week' | 'month' | 'all'
  achievement_type?: string
  category?: string
  search?: string
}

interface LeaderboardData {
  students: LeaderboardStudent[]
  total_count: number
  pagination: {
    current_page: number
    page_size: number
    total_pages: number
    total_count: number
  }
  performance: {
    query_time_ms: number
    cached: boolean
  }
}

interface LeaderboardInterfaceProps {
  initialData?: LeaderboardData
  organizationId: string
  groups?: Array<{ id: string; name: string }>
  achievementTypes?: string[]
  categories?: string[]
}

export function LeaderboardInterface({
  initialData,
  organizationId,
  groups = [],
  achievementTypes = [],
  categories = []
}: LeaderboardInterfaceProps) {
  const t = useTranslations('leaderboard')
  const { toast } = useToast()
  
  // State management
  const [data, setData] = useState<LeaderboardData | null>(initialData || null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<LeaderboardFilters>({
    time_period: 'all'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Real-time and optimization hooks
  const { fetchWithCache } = useOptimizedLeaderboard(organizationId)

  // Fetch leaderboard data with performance monitoring and caching
  const fetchLeaderboardData = useCallback(async (
    newFilters?: LeaderboardFilters,
    page?: number,
    size?: number
  ) => {
    setLoading(true)
    
    try {
      const finalFilters = newFilters || filters
      const finalPage = page || currentPage
      const finalSize = size || pageSize

      // Use optimized fetch with caching
      const result = await fetchWithCache({
        group_id: finalFilters.group_id,
        time_period: finalFilters.time_period,
        achievement_type: finalFilters.achievement_type,
        category: finalFilters.category,
        search: finalFilters.search,
        limit: finalSize,
        offset: (finalPage - 1) * finalSize
      })

      setData(result)

      // Show performance feedback
      if (result.performance.query_time_ms > 2000) {
        toast({
          title: "Performance Warning",
          description: `Query took ${result.performance.query_time_ms}ms. Consider refining your filters.`,
          variant: "destructive"
        })
      } else if (result.performance.cached && result.performance.query_time_ms < 500) {
        toast({
          title: "Fast Query",
          description: "Results loaded from cache",
          duration: 2000
        })
      }

    } catch (error) {
      console.error('Leaderboard fetch error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load leaderboard",
        variant: "destructive"
      })
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [filters, currentPage, pageSize, fetchWithCache, toast])

  // Real-time updates
  const { isConnected } = useLeaderboardRealtime({
    organizationId,
    onRankingChange: (notification) => {
      console.log('Ranking change detected:', notification)
    },
    onDataRefresh: () => {
      fetchLeaderboardData(filters, currentPage, pageSize)
    },
    enabled: true
  })

  // Initial data fetch if no initial data provided
  useEffect(() => {
    if (!initialData) {
      fetchLeaderboardData()
    }
  }, [])

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: LeaderboardFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
    fetchLeaderboardData(newFilters, 1, pageSize)
  }, [pageSize, fetchLeaderboardData])

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    fetchLeaderboardData(filters, page, pageSize)
  }, [filters, pageSize, fetchLeaderboardData])

  // Handle page size changes
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when page size changes
    fetchLeaderboardData(filters, 1, size)
  }, [filters, fetchLeaderboardData])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchLeaderboardData(filters, currentPage, pageSize)
  }, [filters, currentPage, pageSize, fetchLeaderboardData])

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'csv',
          filters
        })
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leaderboard-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: "Leaderboard data has been downloaded",
      })

    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export leaderboard data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [filters, toast])

  // Calculate stats for the overview cards
  const stats = data ? {
    totalStudents: data.total_count,
    avgPoints: Math.round(
      data.students.reduce((sum, s) => sum + s.period_points, 0) / Math.max(data.students.length, 1)
    ),
    topPerformers: data.students.filter(s => s.current_rank <= 10).length,
    activeToday: data.students.filter(s => 
      s.last_activity_date && 
      new Date(s.last_activity_date).toDateString() === new Date().toDateString()
    ).length,
    timePeriod: filters.time_period
  } : null

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Leaderboard</h1>
          <p className="text-muted-foreground">
            Track student performance and achievements across all programs
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {data?.performance && (
            <Badge 
              variant={data.performance.cached ? "default" : "secondary"}
              className="text-xs"
            >
              {data.performance.query_time_ms}ms
              {data.performance.cached && " (cached)"}
            </Badge>
          )}
          <Badge 
            variant={isConnected ? "default" : "secondary"}
            className="text-xs"
          >
            {isConnected ? "🟢 Live" : "🔴 Offline"}
          </Badge>
        </div>
      </div>

      {/* Overview Stats */}
      {stats && (
        <motion.div
          variants={slideInVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="pt-6 pb-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 pb-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.avgPoints}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg Points ({stats.timePeriod})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 pb-4">
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.topPerformers}
                  </div>
                  <p className="text-xs text-muted-foreground">Top 10 Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 pb-4">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.activeToday}
                  </div>
                  <p className="text-xs text-muted-foreground">Active Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Top 3 Podium Display */}
      {data?.students && data.students.length >= 3 && (
        <motion.div
          variants={slideInVariants}
          className="bg-gradient-to-r from-yellow-50 via-white to-yellow-50 rounded-lg border p-6"
        >
          <h2 className="text-xl font-semibold mb-4 text-center">🏆 Top Performers</h2>
          <div className="flex items-end justify-center space-x-8">
            {/* Second Place */}
            <div className="text-center">
              <div className="relative">
                {data.students[1]?.profile_image_url ? (
                  <img
                    src={data.students[1].profile_image_url}
                    alt={data.students[1].student_name}
                    className="w-16 h-16 rounded-full mx-auto mb-2 border-4 border-gray-300"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-lg mx-auto mb-2 border-4 border-gray-300">
                    {data.students[1]?.student_name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                <Medal className="w-8 h-8 text-gray-400 absolute -top-1 -right-1" />
              </div>
              <h3 className="font-semibold text-lg">{data.students[1]?.student_name}</h3>
              <p className="text-gray-600">{data.students[1]?.period_points.toLocaleString()} pts</p>
              <div className="bg-gray-100 rounded-full h-20 w-24 mx-auto mt-2 flex items-end justify-center">
                <div className="text-2xl font-bold text-gray-600 mb-2">#2</div>
              </div>
            </div>

            {/* First Place */}
            <div className="text-center">
              <div className="relative">
                {data.students[0]?.profile_image_url ? (
                  <img
                    src={data.students[0].profile_image_url}
                    alt={data.students[0].student_name}
                    className="w-20 h-20 rounded-full mx-auto mb-2 border-4 border-yellow-400"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-2 border-4 border-yellow-400">
                    {data.students[0]?.student_name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                <Trophy className="w-10 h-10 text-yellow-500 absolute -top-2 -right-2" />
              </div>
              <h3 className="font-bold text-xl">{data.students[0]?.student_name}</h3>
              <p className="text-yellow-600 font-semibold">{data.students[0]?.period_points.toLocaleString()} pts</p>
              <div className="bg-yellow-100 rounded-full h-24 w-28 mx-auto mt-2 flex items-end justify-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2">#1</div>
              </div>
            </div>

            {/* Third Place */}
            <div className="text-center">
              <div className="relative">
                {data.students[2]?.profile_image_url ? (
                  <img
                    src={data.students[2].profile_image_url}
                    alt={data.students[2].student_name}
                    className="w-14 h-14 rounded-full mx-auto mb-2 border-4 border-amber-600"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white font-bold mx-auto mb-2 border-4 border-amber-600">
                    {data.students[2]?.student_name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                <Award className="w-6 h-6 text-amber-600 absolute -top-1 -right-1" />
              </div>
              <h3 className="font-semibold">{data.students[2]?.student_name}</h3>
              <p className="text-amber-600">{data.students[2]?.period_points.toLocaleString()} pts</p>
              <div className="bg-amber-100 rounded-full h-16 w-20 mx-auto mt-2 flex items-end justify-center">
                <div className="text-xl font-bold text-amber-600 mb-2">#3</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Leaderboard Table */}
      {data ? (
        <LeaderboardTable
          students={data.students}
          loading={loading}
          totalCount={data.total_count}
          currentPage={data.pagination.current_page}
          pageSize={data.pagination.page_size}
          totalPages={data.pagination.total_pages}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onRefresh={handleRefresh}
          onExport={handleExport}
          groups={groups}
          achievementTypes={achievementTypes}
          categories={categories}
        />
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">No Leaderboard Data</h3>
                <p className="text-muted-foreground">
                  Unable to load leaderboard data. Please try again.
                </p>
              </div>
              <Button onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}