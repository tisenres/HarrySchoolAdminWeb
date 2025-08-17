'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Trophy,
  Medal,
  Award,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Settings2,
  Download,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Star,
  Zap,
  Target,
  Clock,
  Crown,
  UserPlus,
  Percent,
  Share2,
  CheckCircle,
  MessageSquare
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { tableRowVariants, fadeVariants } from '@/lib/animations'
import { ClientOnly } from '@/components/ui/client-only'

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
  rank_change?: number // Position change from previous period
  last_activity_date?: string
  period_points: number // Points for selected time period
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

interface LeaderboardTableProps {
  students: LeaderboardStudent[]
  loading?: boolean
  totalCount: number
  currentPage: number
  pageSize: number
  totalPages: number
  filters: LeaderboardFilters
  onFiltersChange: (filters: LeaderboardFilters) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onRefresh: () => void
  onExport: () => void
  groups?: Array<{ id: string; name: string }>
  achievementTypes?: string[]
  categories?: string[]
}

interface ColumnConfig {
  key: keyof LeaderboardStudent | 'rank_badge' | 'achievements_preview' | 'referral_stats' | 'referral_conversion' | 'recent_referrals_preview'
  label: string
  sortable: boolean
  visible: boolean
  width?: string
  viewType?: 'performance' | 'referrals' | 'combined' | 'all' // Controls which view shows this column
}

const getDefaultColumns = (t: any): ColumnConfig[] => [
  { key: 'current_rank', label: t('columns.rank'), sortable: false, visible: true, width: 'w-16', viewType: 'all' },
  { key: 'rank_badge', label: '', sortable: false, visible: true, width: 'w-12', viewType: 'all' },
  { key: 'student_name', label: t('columns.student'), sortable: true, visible: true, viewType: 'all' },
  { key: 'period_points', label: t('columns.points'), sortable: true, visible: true, viewType: 'performance' },
  { key: 'current_level', label: t('columns.level'), sortable: true, visible: true, viewType: 'performance' },
  { key: 'total_achievements', label: t('columns.achievements'), sortable: true, visible: true, viewType: 'performance' },
  { key: 'achievements_preview', label: t('columns.recent'), sortable: false, visible: true, viewType: 'performance' },
  { key: 'total_referrals', label: t('columns.referrals'), sortable: true, visible: true, viewType: 'referrals' },
  { key: 'successful_referrals', label: t('columns.successful'), sortable: true, visible: true, viewType: 'referrals' },
  { key: 'referral_conversion', label: t('columns.conversion'), sortable: true, visible: true, viewType: 'referrals' },
  { key: 'referral_points_earned', label: t('columns.referralPoints'), sortable: true, visible: true, viewType: 'referrals' },
  { key: 'recent_referrals_preview', label: t('columns.recentReferrals'), sortable: false, visible: true, viewType: 'referrals' },
  { key: 'last_activity_date', label: t('columns.lastActive'), sortable: true, visible: true, viewType: 'all' },
]

export function LeaderboardTable({
  students,
  loading = false,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  filters,
  onFiltersChange,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onExport,
  groups = [],
  achievementTypes = [],
  categories = []
}: LeaderboardTableProps) {
  const t = useTranslations('leaderboard')
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(() => getDefaultColumns(t))
  const [tableDensity, setTableDensity] = useState<'comfortable' | 'compact' | 'spacious'>('comfortable')
  const [searchTerm, setSearchTerm] = useState(filters.search || '')

  // Debounced search handling
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFiltersChange({ ...filters, search: searchTerm || undefined })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, filters, onFiltersChange])

  const toggleColumnVisibility = useCallback((columnKey: string) => {
    setColumnConfig(prev => 
      prev.map(col => 
        col.key === columnKey 
          ? { ...col, visible: !col.visible }
          : col
      )
    )
  }, [])

  // Referral-specific rendering functions
  const getReferralStats = useCallback((student: LeaderboardStudent) => {
    const totalReferrals = student.total_referrals || 0
    const successfulReferrals = student.successful_referrals || 0
    
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1">
          <UserPlus className="h-4 w-4 text-blue-500" />
          <span className="font-medium">{totalReferrals}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {successfulReferrals} successful
        </div>
      </div>
    )
  }, [])

  const getReferralConversion = useCallback((student: LeaderboardStudent) => {
    const conversionRate = student.referral_conversion_rate || 0
    const colorClass = conversionRate >= 50 ? 'text-green-600' : conversionRate >= 25 ? 'text-yellow-600' : 'text-gray-600'
    
    return (
      <div className="flex items-center space-x-2">
        <Percent className={`h-4 w-4 ${colorClass}`} />
        <span className={`font-medium ${colorClass}`}>
          {conversionRate.toFixed(1)}%
        </span>
      </div>
    )
  }, [])

  const getReferralPointsDisplay = useCallback((points: number) => {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Share2 className="h-4 w-4 text-green-500" />
          <span className="font-bold text-green-600">
            {points.toLocaleString()}
          </span>
        </div>
      </div>
    )
  }, [])

  const getRecentReferralsPreview = useCallback((referrals: LeaderboardStudent['recent_referrals']) => {
    if (!referrals?.length) return null

    const recentReferrals = referrals.slice(0, 3)
    
    return (
      <div className="flex items-center space-x-1">
        {recentReferrals.map((referral, index) => {
          const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800',
            contacted: 'bg-blue-100 text-blue-800', 
            enrolled: 'bg-green-100 text-green-800',
            declined: 'bg-red-100 text-red-800'
          }
          
          return (
            <div
              key={referral.id}
              className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[referral.status]}`}
              title={`${referral.referred_student_name} - ${referral.status}`}
            >
              {referral.status === 'enrolled' ? <CheckCircle className="h-3 w-3" /> : 
               referral.status === 'contacted' ? <MessageSquare className="h-3 w-3" /> :
               <Clock className="h-3 w-3" />}
            </div>
          )
        })}
        {referrals.length > 3 && (
          <span className="text-xs text-muted-foreground">
            +{referrals.length - 3}
          </span>
        )}
      </div>
    )
  }, [])

  const getRankBadge = useCallback((rank: number, rankChange?: number) => {
    // Top 3 special styling
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center">
          <Crown className="h-6 w-6 text-yellow-500" />
        </div>
      )
    }
    if (rank === 2) {
      return (
        <div className="flex items-center justify-center">
          <Medal className="h-5 w-5 text-gray-400" />
        </div>
      )
    }
    if (rank === 3) {
      return (
        <div className="flex items-center justify-center">
          <Award className="h-5 w-5 text-amber-600" />
        </div>
      )
    }

    // Rank change indicator for others
    if (rankChange) {
      return (
        <div className="flex items-center justify-center">
          {rankChange > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </div>
      )
    }

    return null
  }, [])

  const getLevelBadge = useCallback((level: number) => {
    const colors = [
      'bg-gray-100 text-gray-800', // Level 1
      'bg-green-100 text-green-800', // Level 2
      'bg-blue-100 text-blue-800', // Level 3
      'bg-purple-100 text-purple-800', // Level 4
      'bg-yellow-100 text-yellow-800', // Level 5+
    ]
    
    const colorIndex = Math.min(level - 1, colors.length - 1)
    
    return (
      <Badge className={`${colors[colorIndex]} font-medium`}>
        Level {level}
      </Badge>
    )
  }, [])

  const getPointsDisplay = useCallback((points: number, rank: number) => {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="font-bold text-lg">
            {points.toLocaleString()}
          </span>
        </div>
        {rank <= 10 && (
          <div className="flex items-center">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
          </div>
        )}
      </div>
    )
  }, [])

  const getAchievementsPreview = useCallback((achievements: LeaderboardStudent['recent_achievements']) => {
    if (!achievements.length) return null

    const recentAchievements = achievements.slice(0, 3)
    
    return (
      <div className="flex items-center space-x-1">
        {recentAchievements.map((achievement, index) => (
          <div
            key={achievement.id}
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: achievement.badge_color || '#6B7280' }}
            title={`${achievement.name} - ${new Date(achievement.earned_at).toLocaleDateString()}`}
          >
            {achievement.icon_name ? (
              <span className="text-xs">{achievement.icon_name}</span>
            ) : (
              <Trophy className="h-3 w-3" />
            )}
          </div>
        ))}
        {achievements.length > 3 && (
          <span className="text-xs text-muted-foreground">
            +{achievements.length - 3}
          </span>
        )}
      </div>
    )
  }, [])

  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }, [])

  // Filter columns based on view type
  const getFilteredColumns = useCallback(() => {
    const viewType = filters.view_type || 'performance'
    return columnConfig.filter(col => 
      col.visible && (col.viewType === 'all' || col.viewType === viewType || 
      (viewType === 'combined' && (col.viewType === 'performance' || col.viewType === 'referrals')))
    )
  }, [columnConfig, filters.view_type])

  const visibleColumns = getFilteredColumns()
  
  const densityClasses = {
    compact: 'py-2',
    comfortable: 'py-3',
    spacious: 'py-4',
  }

  if (loading) {
    return (
      <motion.div 
        className="space-y-4"
        variants={fadeVariants}
        initial="hidden"
        animate="loading"
      >
        <div className="bg-white rounded-lg border">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="h-16 border-b border-gray-100 animate-pulse">
              <div className="flex items-center space-x-4 p-4">
                <div className="h-8 w-8 bg-gray-200 rounded-full" />
                <div className="h-4 w-4 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="flex-1" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="space-y-6"
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Filters and Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {filters.view_type === 'referrals' ? 'Referral Leaders' : 
               filters.view_type === 'combined' ? 'Combined Rankings' : 
               'Student Leaderboard'}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Filters Row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex items-center space-x-2 min-w-80">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Time Period Filter */}
            <Select 
              value={filters.time_period} 
              onValueChange={(value: 'week' | 'month' | 'all') => 
                onFiltersChange({ ...filters, time_period: value })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            {/* View Type Filter */}
            <Select 
              value={filters.view_type || 'performance'} 
              onValueChange={(value: 'performance' | 'referrals' | 'combined') => 
                onFiltersChange({ ...filters, view_type: value })
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="referrals">Referral Leaders</SelectItem>
                <SelectItem value="combined">Combined View</SelectItem>
              </SelectContent>
            </Select>

            {/* Group Filter */}
            {groups.length > 0 && (
              <Select 
                value={filters.group_id || 'all'} 
                onValueChange={(value) => 
                  onFiltersChange({ ...filters, group_id: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Achievement Type Filter */}
            {achievementTypes.length > 0 && (
              <Select 
                value={filters.achievement_type || 'all'} 
                onValueChange={(value) => 
                  onFiltersChange({ ...filters, achievement_type: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {achievementTypes.map(type => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Stats Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>Showing {students.length} of {totalCount} students</span>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span className="capitalize">{filters.time_period} rankings</span>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="h-4 w-4 mr-2" />
                  View Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Table Density</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTableDensity('compact')}>
                  Compact
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTableDensity('comfortable')}>
                  Comfortable
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTableDensity('spacious')}>
                  Spacious
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Columns</DropdownMenuLabel>
                
                {columnConfig.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.key}
                    checked={column.visible}
                    onCheckedChange={() => toggleColumnVisibility(column.key)}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="border-b">
              {visibleColumns.map((column) => (
                <TableHead 
                  key={column.key} 
                  className={`${column.width || ''} font-semibold`}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="wait">
              {students.map((student, index) => (
                <motion.tr
                  key={student.student_id}
                  className={`border-b hover:bg-muted/30 transition-colors ${
                    student.current_rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''
                  }`}
                  variants={tableRowVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ 
                    type: "spring",
                    stiffness: 500,
                    damping: 50,
                    delay: index * 0.02 
                  }}
                >
                  {visibleColumns.map((column) => (
                    <TableCell 
                      key={column.key} 
                      className={`${densityClasses[tableDensity]} ${column.width || ''}`}
                    >
                      {column.key === 'current_rank' && (
                        <div className="flex items-center space-x-2">
                          <span className={`text-2xl font-bold ${
                            student.current_rank <= 3 ? 'text-yellow-600' : 'text-muted-foreground'
                          }`}>
                            #{student.current_rank}
                          </span>
                          {student.rank_change && (
                            <div className="flex items-center text-xs">
                              {student.rank_change > 0 ? (
                                <div className="flex items-center text-green-600">
                                  <ArrowUp className="h-3 w-3" />
                                  <span>+{student.rank_change}</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-red-600">
                                  <ArrowDown className="h-3 w-3" />
                                  <span>{student.rank_change}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {column.key === 'rank_badge' && (
                        getRankBadge(student.current_rank, student.rank_change)
                      )}

                      {column.key === 'student_name' && (
                        <div className="flex items-center space-x-3">
                          {student.profile_image_url ? (
                            <img
                              src={student.profile_image_url}
                              alt={student.student_name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                              {student.student_name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-foreground">
                              {student.student_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {student.current_rank <= 10 ? 'Top Performer' : 'Active Student'}
                            </div>
                          </div>
                        </div>
                      )}

                      {column.key === 'period_points' && (
                        getPointsDisplay(student.period_points, student.current_rank)
                      )}

                      {column.key === 'current_level' && (
                        getLevelBadge(student.current_level)
                      )}

                      {column.key === 'total_achievements' && (
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">{student.total_achievements}</span>
                        </div>
                      )}

                      {column.key === 'achievements_preview' && (
                        getAchievementsPreview(student.recent_achievements)
                      )}

                      {column.key === 'total_referrals' && (
                        getReferralStats(student)
                      )}

                      {column.key === 'successful_referrals' && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{student.successful_referrals || 0}</span>
                        </div>
                      )}

                      {column.key === 'referral_conversion' && (
                        getReferralConversion(student)
                      )}

                      {column.key === 'referral_points_earned' && (
                        getReferralPointsDisplay(student.referral_points_earned || 0)
                      )}

                      {column.key === 'recent_referrals_preview' && (
                        getRecentReferralsPreview(student.recent_referrals)
                      )}

                      {column.key === 'last_activity_date' && (
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <ClientOnly fallback="Loading...">
                            {formatDate(student.last_activity_date)}
                          </ClientOnly>
                        </div>
                      )}
                    </TableCell>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>

            {students.length === 0 && (
              <TableRow>
                <TableCell 
                  colSpan={visibleColumns.length} 
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Trophy className="h-8 w-8 text-muted-foreground/50" />
                    <span>No students found matching your criteria.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} students
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => onPageSizeChange(parseInt(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-1">
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value)
                    if (page >= 1 && page <= totalPages) {
                      onPageChange(page)
                    }
                  }}
                  className="w-16 text-center"
                />
                <span className="text-sm text-muted-foreground">
                  of {totalPages}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}