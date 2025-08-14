'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users,
  Star,
  Award,
  Filter,
  Search,
  CheckSquare,
  Square,
  Minus,
  Settings,
  TrendingUp,
  Calendar,
  Clock,
  Target,
  Zap,
  Trophy,
  Gift
} from 'lucide-react'
import type { Student } from '@/types/student'
import type { PointsAwardRequest, AchievementAwardRequest } from '@/types/ranking'
import { BulkPointsOperations } from '@/components/admin/points/bulk-points-operations'
import { BulkAchievementOperations } from './bulk-achievement-operations'
import { BulkRewardOperations } from './bulk-reward-operations'
import { BulkOperationTemplates } from './bulk-operation-templates'
import { BulkOperationHistory } from './bulk-operation-history'
import { modalVariants, staggerVariants, slideInVariants } from '@/lib/animations'

interface BulkOperationsInterfaceProps {
  students: Student[]
  selectedStudents: string[]
  onSelectionChange: (studentIds: string[]) => void
  onBulkPointsAward: (data: PointsAwardRequest) => Promise<void>
  onBulkAchievementAward: (data: AchievementAwardRequest) => Promise<void>
  onBulkRewardOperation: (data: any) => Promise<void>
  loading?: boolean
}

interface FilterOptions {
  searchTerm: string
  groups: string[]
  levels: string[]
  status: string[]
  ranking: {
    min: number | null
    max: number | null
  }
  enrollmentDate: {
    from: Date | null
    to: Date | null
  }
}

interface OperationStats {
  totalSelected: number
  averageRanking: number
  topPerformers: number
  recentlyEnrolled: number
  byLevel: Record<string, number>
  byGroup: Record<string, number>
}

const QUICK_FILTERS = [
  { id: 'top-10', label: 'Top 10 Performers', icon: Trophy, filter: (students: Student[]) => 
    students.filter(s => s.ranking && s.ranking.current_rank && s.ranking.current_rank <= 10) },
  { id: 'new-students', label: 'New Students (30 days)', icon: Calendar, filter: (students: Student[]) => 
    students.filter(s => new Date(s.enrollment_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) },
  { id: 'active-status', label: 'Active Students', icon: Users, filter: (students: Student[]) => 
    students.filter(s => s.status === 'active') },
  { id: 'high-points', label: 'High Point Earners', icon: Star, filter: (students: Student[]) => 
    students.filter(s => s.ranking && s.ranking.total_points > 200) },
]

export function BulkOperationsInterface({
  students,
  selectedStudents,
  onSelectionChange,
  onBulkPointsAward,
  onBulkAchievementAward,
  onBulkRewardOperation,
  loading = false
}: BulkOperationsInterfaceProps) {
  const t = useTranslations('ranking')
  const [activeTab, setActiveTab] = useState('selection')
  const [showPointsModal, setShowPointsModal] = useState(false)
  const [showAchievementModal, setShowAchievementModal] = useState(false)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    groups: [],
    levels: [],
    status: [],
    ranking: { min: null, max: null },
    enrollmentDate: { from: null, to: null }
  })

  // Filtered students based on search and filter criteria
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        const matchesSearch = 
          student.full_name.toLowerCase().includes(searchLower) ||
          student.phone?.toLowerCase().includes(searchLower) ||
          student.student_id.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(student.status)) {
        return false
      }

      // Level filter
      if (filters.levels.length > 0 && !filters.levels.includes(student.current_level)) {
        return false
      }

      // Ranking filter
      if (filters.ranking.min !== null && (!student.ranking || student.ranking.total_points < filters.ranking.min)) {
        return false
      }
      if (filters.ranking.max !== null && (!student.ranking || student.ranking.total_points > filters.ranking.max)) {
        return false
      }

      // Date filter
      if (filters.enrollmentDate.from && new Date(student.enrollment_date) < filters.enrollmentDate.from) {
        return false
      }
      if (filters.enrollmentDate.to && new Date(student.enrollment_date) > filters.enrollmentDate.to) {
        return false
      }

      return true
    })
  }, [students, filters])

  // Get selected student details
  const selectedStudentData = useMemo(() => {
    return students.filter(s => selectedStudents.includes(s.id))
  }, [students, selectedStudents])

  const selectedStudentNames = useMemo(() => {
    return selectedStudentData.map(s => s.full_name)
  }, [selectedStudentData])

  // Calculate operation statistics
  const operationStats = useMemo((): OperationStats => {
    const selected = selectedStudentData
    const totalSelected = selected.length
    
    const rankings = selected.map(s => s.ranking?.total_points || 0)
    const averageRanking = rankings.length > 0 ? rankings.reduce((a, b) => a + b, 0) / rankings.length : 0
    
    const topPerformers = selected.filter(s => s.ranking?.current_rank && s.ranking.current_rank <= 20).length
    const recentlyEnrolled = selected.filter(s => 
      new Date(s.enrollment_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length

    const byLevel: Record<string, number> = {}
    const byGroup: Record<string, number> = {}

    selected.forEach(student => {
      byLevel[student.current_level] = (byLevel[student.current_level] || 0) + 1
      student.groups?.forEach(group => {
        byGroup[group.name] = (byGroup[group.name] || 0) + 1
      })
    })

    return {
      totalSelected,
      averageRanking,
      topPerformers,
      recentlyEnrolled,
      byLevel,
      byGroup
    }
  }, [selectedStudentData])

  // Unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const levels = [...new Set(students.map(s => s.current_level))].filter(Boolean)
    const statuses = [...new Set(students.map(s => s.status))].filter(Boolean)
    const groups = [...new Set(students.flatMap(s => s.groups?.map(g => g.name) || []))].filter(Boolean)
    
    return { levels, statuses, groups }
  }, [students])

  const handleSelectAll = useCallback(() => {
    if (selectedStudents.length === filteredStudents.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(filteredStudents.map(s => s.id))
    }
  }, [filteredStudents, selectedStudents, onSelectionChange])

  const handleSelectStudent = useCallback((studentId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedStudents, studentId])
    } else {
      onSelectionChange(selectedStudents.filter(id => id !== studentId))
    }
  }, [selectedStudents, onSelectionChange])

  const handleQuickFilter = useCallback((filter: typeof QUICK_FILTERS[0]) => {
    const filteredIds = filter.filter(students).map(s => s.id)
    onSelectionChange(filteredIds)
  }, [students, onSelectionChange])

  const handleClearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      groups: [],
      levels: [],
      status: [],
      ranking: { min: null, max: null },
      enrollmentDate: { from: null, to: null }
    })
    onSelectionChange([])
  }, [onSelectionChange])

  const allSelected = filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length
  const someSelected = selectedStudents.length > 0 && selectedStudents.length < filteredStudents.length

  return (
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bulk Operations</h2>
          <p className="text-muted-foreground">
            Manage points, achievements, and rewards for multiple students efficiently
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedStudents.length > 0 && (
            <Badge variant="secondary" className="text-sm">
              {selectedStudents.length} selected
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
          >
            <Settings className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="selection" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Selection</span>
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Operations</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Templates</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>History</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="selection" className="space-y-6">
          {/* Quick Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Selection</CardTitle>
              <CardDescription>
                Apply common filters to quickly select groups of students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <motion.div 
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
                variants={staggerVariants}
                initial="hidden"
                animate="visible"
              >
                {QUICK_FILTERS.map((filter) => {
                  const IconComponent = filter.icon
                  return (
                    <motion.div key={filter.id} variants={slideInVariants}>
                      <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center space-y-2 text-center w-full"
                        onClick={() => handleQuickFilter(filter)}
                      >
                        <IconComponent className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs">{filter.label}</span>
                      </Button>
                    </motion.div>
                  )
                })}
              </motion.div>
            </CardContent>
          </Card>

          {/* Advanced Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Advanced Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or student ID..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10"
                />
              </div>

              {/* Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select 
                    value={filters.status.join(',')} 
                    onValueChange={(value) => setFilters(prev => ({ 
                      ...prev, 
                      status: value ? value.split(',') : [] 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.statuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Level</label>
                  <Select 
                    value={filters.levels.join(',')} 
                    onValueChange={(value) => setFilters(prev => ({ 
                      ...prev, 
                      levels: value ? value.split(',') : [] 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by level" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.levels.map(level => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Point Range</label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.ranking.min || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        ranking: { ...prev.ranking, min: e.target.value ? parseInt(e.target.value) : null }
                      }))}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.ranking.max || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        ranking: { ...prev.ranking, max: e.target.value ? parseInt(e.target.value) : null }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Selection Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">Student Selection</CardTitle>
                  <CardDescription>
                    {filteredStudents.length} students • {selectedStudents.length} selected
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="flex items-center space-x-2"
                >
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : someSelected ? (
                    <Minus className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {filteredStudents.map((student, index) => (
                    <motion.div
                      key={student.id}
                      variants={slideInVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ delay: index * 0.02 }}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                        selectedStudents.includes(student.id) ? 'bg-muted/30 border-primary' : ''
                      }`}
                      onClick={() => handleSelectStudent(student.id, !selectedStudents.includes(student.id))}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => {}}
                        className="rounded"
                      />
                      {student.profile_image_url ? (
                        <img
                          src={student.profile_image_url}
                          alt={student.full_name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                          {student.first_name[0]}{student.last_name[0]}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{student.full_name}</div>
                        <div className="text-xs text-muted-foreground flex items-center space-x-2">
                          <span>{student.student_id}</span>
                          <span>•</span>
                          <span>{student.current_level}</span>
                          {student.ranking && (
                            <>
                              <span>•</span>
                              <span>{student.ranking.total_points} pts</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {student.status}
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          {/* Operation Statistics */}
          {selectedStudents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Selection Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{operationStats.totalSelected}</div>
                    <div className="text-xs text-muted-foreground">Students Selected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{Math.round(operationStats.averageRanking)}</div>
                    <div className="text-xs text-muted-foreground">Avg Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{operationStats.topPerformers}</div>
                    <div className="text-xs text-muted-foreground">Top Performers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{operationStats.recentlyEnrolled}</div>
                    <div className="text-xs text-muted-foreground">New Students</div>
                  </div>
                </div>

                {selectedStudents.length <= 10 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Selected Students:</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedStudentNames.map((name, index) => (
                        <Badge key={index} variant="secondary">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Operation Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <Button
                  className="w-full h-auto p-6 flex flex-col items-center space-y-3"
                  variant="outline"
                  disabled={selectedStudents.length === 0 || loading}
                  onClick={() => setShowPointsModal(true)}
                >
                  <Star className="h-8 w-8 text-yellow-500" />
                  <div className="text-center">
                    <div className="font-medium">Award Points</div>
                    <div className="text-xs text-muted-foreground">Bulk point operations</div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <Button
                  className="w-full h-auto p-6 flex flex-col items-center space-y-3"
                  variant="outline"
                  disabled={selectedStudents.length === 0 || loading}
                  onClick={() => setShowAchievementModal(true)}
                >
                  <Trophy className="h-8 w-8 text-purple-500" />
                  <div className="text-center">
                    <div className="font-medium">Grant Achievements</div>
                    <div className="text-xs text-muted-foreground">Mass achievement awards</div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <Button
                  className="w-full h-auto p-6 flex flex-col items-center space-y-3"
                  variant="outline"
                  disabled={selectedStudents.length === 0 || loading}
                  onClick={() => setShowRewardModal(true)}
                >
                  <Gift className="h-8 w-8 text-green-500" />
                  <div className="text-center">
                    <div className="font-medium">Reward Operations</div>
                    <div className="text-xs text-muted-foreground">Bulk reward management</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <BulkOperationTemplates 
            selectedStudents={selectedStudents}
            onTemplateApply={(template) => {
              // Handle template application
              console.log('Applying template:', template)
            }}
          />
        </TabsContent>

        <TabsContent value="history">
          <BulkOperationHistory />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Operation Analytics</CardTitle>
              <CardDescription>
                Performance metrics and insights for bulk operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analytics dashboard coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Operation Modals */}
      <BulkPointsOperations
        open={showPointsModal}
        onOpenChange={setShowPointsModal}
        selectedStudents={selectedStudents}
        selectedStudentNames={selectedStudentNames}
        onSubmit={onBulkPointsAward}
        loading={loading}
      />

      <BulkAchievementOperations
        open={showAchievementModal}
        onOpenChange={setShowAchievementModal}
        selectedStudents={selectedStudents}
        selectedStudentNames={selectedStudentNames}
        onSubmit={onBulkAchievementAward}
        loading={loading}
      />

      <BulkRewardOperations
        open={showRewardModal}
        onOpenChange={setShowRewardModal}
        selectedStudents={selectedStudents}
        selectedStudentNames={selectedStudentNames}
        onSubmit={onBulkRewardOperation}
        loading={loading}
      />
    </motion.div>
  )
}