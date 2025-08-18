'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingButton } from '@/components/ui/loading-button'
import { SkeletonTable, SkeletonStats, SkeletonCard } from '@/components/ui/skeleton-table'
import { 
  Plus, 
  Users, 
  GraduationCap, 
  CreditCard,
  DollarSign,
  Activity,
  Loader2
} from 'lucide-react'
import type { Student, StudentFilters, StudentSortConfig, StudentStatistics } from '@/types/student'
import type { CreateStudentRequest } from '@/lib/validations/student'
import { StudentsTable } from '@/components/admin/students/students-table'
import { StudentsFilters } from '@/components/admin/students/students-filters'
import { StudentForm } from '@/components/admin/students/student-form'
// import { mockStudentService } from '@/lib/services/mock-student-service'
import { fadeVariants, getAnimationConfig } from '@/lib/animations'

export default function StudentsPage() {
  const queryClient = useQueryClient()
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [filters, setFilters] = useState<StudentFilters>({})
  const [debouncedFilters, setDebouncedFilters] = useState<StudentFilters>({})
  const [sortConfig, setSortConfig] = useState<StudentSortConfig>({
    field: 'full_name',
    direction: 'asc'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [showArchived] = useState(false)
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | undefined>()
  const [formLoading, setFormLoading] = useState(false)
  
  // Action loading states
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
  const [bulkStatusLoading, setBulkStatusLoading] = useState(false)
  const [bulkReferralLoading, setBulkReferralLoading] = useState(false)

  // Debounce filters to prevent excessive API calls
  const debouncedFilterUpdate = useCallback(
    debounce((newFilters: StudentFilters) => {
      setDebouncedFilters(newFilters)
      setCurrentPage(1) // Reset to first page when filters change
    }, 500),
    []
  )

  useEffect(() => {
    debouncedFilterUpdate(filters)
  }, [filters, debouncedFilterUpdate])

  // Combined React Query for students data with responsive caching
  const { data: studentsData, isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ['students', debouncedFilters, sortConfig, currentPage, pageSize, showArchived],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sort_by: sortConfig.field,
        sort_order: sortConfig.direction,
        ...(debouncedFilters.search && { query: debouncedFilters.search }),
        ...(debouncedFilters.status && { status: debouncedFilters.status }),
        ...(debouncedFilters.grade_level && { grade_level: debouncedFilters.grade_level }),
        ...(showArchived && { archived: 'true' })
      } as any)

      const response = await fetch(`/api/students?${params}`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch students')
      }
      
      return {
        students: result.data || [],
        count: result.pagination?.total || 0,
        total_pages: result.pagination?.total_pages || 1
      }
    },
    staleTime: 0, // Always refetch when query key changes (responsive pagination)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes for back/forward navigation
    refetchOnWindowFocus: false,
  })

  // React Query for statistics with longer caching (statistics don't change with pagination)
  const { data: statistics, isLoading: statisticsLoading } = useQuery({
    queryKey: ['student-statistics'],
    queryFn: async () => {
      const response = await fetch('/api/students/statistics')
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch statistics')
      }
      
      return result.data
    },
    staleTime: 30000, // Cache for 30 seconds (statistics don't change often)
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
  })

  // Memoized derived data
  const students = useMemo(() => studentsData?.students || [], [studentsData])
  const totalCount = useMemo(() => studentsData?.count || 0, [studentsData])
  const totalPages = useMemo(() => studentsData?.total_pages || 1, [studentsData])
  const loading = studentsLoading || statisticsLoading

  // Handle form submission with cache invalidation
  const handleFormSubmit = async (data: CreateStudentRequest) => {
    setFormLoading(true)
    try {
      if (editingStudent) {
        const response = await fetch(`/api/students/${editingStudent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || 'Failed to update student')
        }
      } else {
        const response = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || 'Failed to create student')
        }
      }
      
      // Invalidate and refetch relevant queries
      await queryClient.invalidateQueries({ queryKey: ['students'] })
      await queryClient.invalidateQueries({ queryKey: ['student-statistics'] })
      
      setIsFormOpen(false)
      setEditingStudent(undefined)
    } catch (error) {
      console.error('Error saving student:', error)
    } finally {
      setFormLoading(false)
    }
  }

  // Handle student actions
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student)
    setIsFormOpen(true)
  }

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete student')
      }
      
      // Invalidate and refetch relevant queries
      await queryClient.invalidateQueries({ queryKey: ['students'] })
      await queryClient.invalidateQueries({ queryKey: ['student-statistics'] })
      
      setSelectedStudents(prev => prev.filter(id => id !== studentId))
    } catch (error) {
      console.error('Error deleting student:', error)
    }
  }

  const handleBulkDelete = async (studentIds: string[]) => {
    setBulkDeleteLoading(true)
    try {
      // Delete multiple students
      await Promise.all(
        studentIds.map(id => 
          fetch(`/api/students/${id}`, { method: 'DELETE' })
        )
      )
      
      // Invalidate and refetch relevant queries
      await queryClient.invalidateQueries({ queryKey: ['students'] })
      await queryClient.invalidateQueries({ queryKey: ['student-statistics'] })
      
      setSelectedStudents([])
    } catch (error) {
      console.error('Error bulk deleting students:', error)
    } finally {
      setBulkDeleteLoading(false)
    }
  }

  const handleBulkStatusChange = async (studentIds: string[], status: string) => {
    setBulkStatusLoading(true)
    try {
      // Bulk status change with optimized API calls
      for (const studentId of studentIds) {
        const student = students.find(s => s.id === studentId)
        if (student) {
          const response = await fetch(`/api/students/${studentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status as Student['status'] })
          })
          const result = await response.json()
          if (!result.success) {
            throw new Error(result.error || 'Failed to update student status')
          }
        }
      }
      
      // Invalidate and refetch relevant queries
      await queryClient.invalidateQueries({ queryKey: ['students'] })
      await queryClient.invalidateQueries({ queryKey: ['student-statistics'] })
      
      setSelectedStudents([])
    } catch (error) {
      console.error('Error changing student status:', error)
    } finally {
      setBulkStatusLoading(false)
    }
  }

  const handleBulkReferralAction = async (studentIds: string[], action: 'view' | 'export') => {
    setBulkReferralLoading(true)
    try {
      if (action === 'view') {
        // TODO: Open bulk referral status modal
        console.log('View referral status for students:', studentIds)
      } else if (action === 'export') {
        // TODO: Export referral data for selected students
        console.log('Export referral data for students:', studentIds)
      }
    } catch (error) {
      console.error('Error handling bulk referral action:', error)
    } finally {
      setBulkReferralLoading(false)
    }
  }

  const handleFiltersChange = (newFilters: StudentFilters) => {
    setFilters(newFilters)
    // Debounced filter update will handle page reset
  }

  const handleClearFilters = () => {
    setFilters({})
    setCurrentPage(1)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string, count: number) => {
    if (count === 0) return 'text-muted-foreground'
    const colors = {
      active: 'text-green-600',
      inactive: 'text-gray-600',
      graduated: 'text-blue-600',
      suspended: 'text-yellow-600',
      dropped: 'text-red-600',
    } as const
    return colors[status as keyof typeof colors] || 'text-muted-foreground'
  }

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      transition={getAnimationConfig(fadeVariants)}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground mt-2">
            Manage student profiles, enrollment, and status tracking
          </p>
        </div>
        <LoadingButton 
          onClick={() => setIsFormOpen(true)}
          loading={false}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </LoadingButton>
      </div>

      {/* Statistics Cards */}
      {statisticsLoading ? (
        <SkeletonStats />
      ) : statistics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_students}</div>
              <p className="text-xs text-muted-foreground">
                <span className={getStatusColor('active', statistics.active_students)}>
                  {statistics.active_students} active
                </span>
                {statistics.inactive_students > 0 && (
                  <span className="ml-2 text-muted-foreground">
                    {statistics.inactive_students} inactive
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_enrollment}</div>
              <p className="text-xs text-muted-foreground">
                Across all groups
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics.total_students - statistics.pending_payments - statistics.overdue_payments}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-yellow-600">{statistics.pending_payments} pending</span>
                {statistics.overdue_payments > 0 && (
                  <span className="ml-2 text-red-600">{statistics.overdue_payments} overdue</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              <DollarSign className={`h-4 w-4 ${statistics.total_balance > 0 ? 'text-red-500' : 'text-green-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${statistics.total_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(statistics.total_balance)}
              </div>
              <p className="text-xs text-muted-foreground">
                {statistics.total_balance > 0 ? 'Requires attention' : 'All payments up to date'}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Status Overview */}
      {statisticsLoading ? (
        <SkeletonCard />
      ) : statistics ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Student Status Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Object.entries(statistics.by_status).map(([status, count]) => (
                <div key={status} className="flex items-center space-x-2">
                  <Badge 
                    variant="outline" 
                    className={`capitalize ${getStatusColor(status, count)}`}
                  >
                    {status}
                  </Badge>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Filters */}
      <StudentsFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        loading={loading}
      />

      {/* Students Table */}
      <StudentsTable
        students={students}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
        onBulkDelete={handleBulkDelete}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkReferralAction={handleBulkReferralAction}
        selectedStudents={selectedStudents}
        onSelectionChange={setSelectedStudents}
        sortConfig={sortConfig}
        onSortChange={setSortConfig}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        loading={loading}
        showArchived={showArchived}
      />

      {/* Student Form Dialog */}
      {isFormOpen && (
        <StudentForm
          student={editingStudent}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingStudent(undefined)
          }}
          loading={formLoading}
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open)
            if (!open) {
              setEditingStudent(undefined)
            }
          }}
        />
      )}

      {/* Loading State */}
      {loading && students.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </motion.div>
  )
}