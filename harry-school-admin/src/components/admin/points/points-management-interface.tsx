'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { 
  Plus,
  Users,
  Award,
  Search,
  Filter,
  Download,
  Settings,
  RefreshCw,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { StudentsTable } from '../students/students-table'
import { PointsManagementDashboard } from './points-management-dashboard'
import type { Student, StudentFilters, StudentSortConfig } from '@/types/student'
import { fadeVariants, slideInVariants } from '@/lib/animations'

interface PointsManagementInterfaceProps {
  students: Student[]
  loading?: boolean
  onStudentsRefresh?: () => Promise<void>
}

// Mock notification system integration
const usePointsNotifications = () => {
  const showNotification = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    // In real implementation, this would integrate with the existing notification system
    console.log(`${type}: ${title} - ${message}`)
  }

  return { showNotification }
}

export function PointsManagementInterface({
  students,
  loading = false,
  onStudentsRefresh
}: PointsManagementInterfaceProps) {
  const t = useTranslations('points')
  const { showNotification } = usePointsNotifications()
  
  // Table state
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [filters, setFilters] = useState<StudentFilters>({})
  const [sortConfig, setSortConfig] = useState<StudentSortConfig>({
    field: 'full_name',
    direction: 'asc'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // Interface state
  const [view, setView] = useState<'table' | 'dashboard'>('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')

  // Auto-clear selection when changing views or filters
  useEffect(() => {
    setSelectedStudents([])
  }, [view, filters, searchTerm, statusFilter, levelFilter])

  // Apply client-side filtering
  const filteredStudents = students.filter(student => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      if (!student.full_name.toLowerCase().includes(searchLower) &&
          !student.phone.includes(searchTerm) &&
          !student.student_id.toLowerCase().includes(searchLower)) {
        return false
      }
    }

    // Status filter
    if (statusFilter !== 'all' && student.status !== statusFilter) {
      return false
    }

    // Level filter
    if (levelFilter !== 'all' && student.current_level !== levelFilter) {
      return false
    }

    return true
  })

  // Get unique values for filter dropdowns
  const uniqueStatuses = [...new Set(students.map(s => s.status))].filter(Boolean)
  const uniqueLevels = [...new Set(students.map(s => s.current_level))].filter(Boolean)

  const handleStudentEdit = (student: Student) => {
    showNotification('info', 'Edit Student', `Editing ${student.full_name}`)
    // In real implementation, open student edit modal
  }

  const handleStudentDelete = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    showNotification('info', 'Delete Student', `Deleting ${student?.full_name || 'student'}`)
    // In real implementation, confirm and delete student
  }

  const handleBulkDelete = (studentIds: string[]) => {
    showNotification('info', 'Bulk Delete', `Deleting ${studentIds.length} students`)
    // In real implementation, confirm and delete students
  }

  const handleBulkStatusChange = (studentIds: string[], status: string) => {
    showNotification('success', 'Status Updated', `Updated status for ${studentIds.length} students to ${status}`)
    // In real implementation, update student statuses
  }

  const handleExport = (studentIds?: string[]) => {
    const count = studentIds?.length || filteredStudents.length
    showNotification('info', 'Export Started', `Exporting data for ${count} students`)
    // In real implementation, trigger export
  }

  const handleRefresh = async () => {
    if (onStudentsRefresh) {
      await onStudentsRefresh()
      showNotification('success', 'Refreshed', 'Student data has been refreshed')
    }
  }

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const totalPages = Math.ceil(filteredStudents.length / pageSize)

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Points Management</h1>
          <p className="text-muted-foreground">
            Manage student points, rewards, and achievements
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={view === 'dashboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('dashboard')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={view === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('table')}
            >
              <Users className="h-4 w-4 mr-2" />
              Students
              {selectedStudents.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedStudents.length}
                </Badge>
              )}
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <motion.div
        variants={slideInVariants}
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{students.length}</div>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {students.filter(s => s.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {Math.floor(Math.random() * 500) + 100}
                </div>
                <p className="text-xs text-muted-foreground">Avg Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.floor(Math.random() * 10) + 2}
                </div>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-2xl font-bold text-purple-600">+12%</div>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content based on view */}
      <AnimatePresence mode="wait">
        {view === 'dashboard' ? (
          <motion.div
            key="dashboard"
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <PointsManagementDashboard
              students={students}
              selectedStudents={selectedStudents}
              onSelectionChange={setSelectedStudents}
              onStudentsRefresh={onStudentsRefresh}
            />
          </motion.div>
        ) : (
          <motion.div
            key="table"
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            {/* Filters and Search */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Student Management</CardTitle>
                <CardDescription>
                  Select students to award points or manage in bulk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Search */}
                  <div className="flex items-center space-x-2 min-w-80">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students by name, phone, or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {uniqueStatuses.map(status => (
                        <SelectItem key={status} value={status} className="capitalize">
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Level Filter */}
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      {uniqueLevels.map(level => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Clear Filters */}
                  {(searchTerm || statusFilter !== 'all' || levelFilter !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('')
                        setStatusFilter('all')
                        setLevelFilter('all')
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* Filter Summary */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div>
                    Showing {filteredStudents.length} of {students.length} students
                    {selectedStudents.length > 0 && (
                      <span className="ml-2">
                        ({selectedStudents.length} selected)
                      </span>
                    )}
                  </div>
                  
                  {filteredStudents.length !== students.length && (
                    <div className="flex items-center space-x-1">
                      <Filter className="h-3 w-3" />
                      <span>Filtered results</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Students Table */}
            <StudentsTable
              students={paginatedStudents}
              onEdit={handleStudentEdit}
              onDelete={handleStudentDelete}
              onBulkDelete={handleBulkDelete}
              onBulkStatusChange={handleBulkStatusChange}
              onExport={handleExport}
              selectedStudents={selectedStudents}
              onSelectionChange={setSelectedStudents}
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalCount={filteredStudents.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              loading={loading}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}