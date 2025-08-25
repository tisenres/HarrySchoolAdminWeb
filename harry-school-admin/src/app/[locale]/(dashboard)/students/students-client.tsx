'use client'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { SkeletonTable } from '@/components/ui/skeleton-table-new'
import { fadeVariants, getAnimationConfig } from '@/lib/animations'
import { StatsCardsSkeleton } from '@/components/ui/suspense-fallbacks'

// Optimized lazy loading with preloading
const StudentsTable = lazy(() => 
  import('@/components/admin/students/students-table').then(mod => ({ default: mod.StudentsTable }))
)
const StudentsFilters = lazy(() => 
  import('@/components/admin/students/students-filters').then(mod => ({ default: mod.StudentsFilters }))
)
const StudentForm = lazy(() => 
  import('@/components/admin/students/student-form').then(mod => ({ default: mod.StudentForm }))
)

export default function StudentsClient() {
  const t = useTranslations('students')
  const tCommon = useTranslations('common')
  
  const [students, setStudents] = useState<Student[]>([])
  const [statistics, setStatistics] = useState<StudentStatistics | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [filters, setFilters] = useState<StudentFilters>({})
  const [sortConfig, setSortConfig] = useState<StudentSortConfig>({
    field: 'full_name',
    direction: 'asc'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showArchived] = useState(false)
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | undefined>()
  const [formLoading, setFormLoading] = useState(false)

  // Load students data
  const loadStudents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sort_by: sortConfig.field,
        sort_order: sortConfig.direction,
        ...(filters.search && { query: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.grade_level && { grade_level: filters.grade_level })
      } as any)

      const response = await fetch(`/api/students?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch students')
      }
      
      const studentsData = {
        data: result.data || [],
        count: result.pagination?.total || 0,
        total_pages: result.pagination?.total_pages || 1
      }
      setStudents(studentsData.data)
      setTotalCount(studentsData.count)
      setTotalPages(studentsData.total_pages)
      setError(null)
    } catch (error) {
      console.error('Error loading students:', error)
      setError(error instanceof Error ? error.message : 'Failed to load students')
      setStudents([])
      setTotalCount(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [filters, sortConfig, currentPage, pageSize])

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      // Fetch students to calculate statistics
      const response = await fetch('/api/students?limit=100')
      const result = await response.json()
      
      if (result.success && result.data) {
        const allStudents = result.data
        setStatistics({
          total_students: result.pagination?.total || 0,
          active_students: allStudents.filter((s: any) => s.status === 'active').length,
          inactive_students: allStudents.filter((s: any) => s.status === 'inactive').length,
          graduated_students: allStudents.filter((s: any) => s.status === 'graduated').length,
          suspended_students: allStudents.filter((s: any) => s.status === 'suspended').length,
          total_enrollment: 0,
          pending_payments: allStudents.filter((s: any) => s.payment_status === 'pending').length,
          overdue_payments: allStudents.filter((s: any) => s.payment_status === 'overdue').length,
          total_balance: allStudents.reduce((sum: number, s: any) => sum + (s.balance || 0), 0),
          by_status: {},
          by_level: {},
          by_payment_status: {},
          enrollment_trend: []
        })
      }
    } catch (error) {
      console.error('Error loading statistics:', error)
    }
  }, [])

  // Initial load and data refresh
  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  useEffect(() => {
    loadStatistics()
  }, [])

  // Handle form submission
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
      await loadStudents()
      await loadStatistics()
      setIsFormOpen(false)
      setEditingStudent(undefined)
    } catch (error) {
      console.error('Error saving student:', error)
    } finally {
      setFormLoading(false)
    }
  }

  // Memoized pagination object to prevent unnecessary re-renders
  const pagination = useMemo(() => ({ page: currentPage, limit: pageSize }), [currentPage, pageSize])

  // Optimized event handlers with useCallback
  const handleEditStudent = useCallback((student: Student) => {
    setEditingStudent(student)
    setIsFormOpen(true)
  }, [])

  const handleDeleteStudent = useCallback(async (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    if (!student) return
    
    const confirmed = window.confirm(`Are you sure you want to delete ${student.first_name} ${student.last_name}? This action cannot be undone.`)
    if (!confirmed) return
    
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete student')
      }
      await loadStudents()
      await loadStatistics()
      setSelectedStudents(prev => prev.filter(id => id !== studentId))
    } catch (error) {
      console.error('Error deleting student:', error)
    }
  }, [students, loadStudents, loadStatistics])

  const handleBulkDelete = useCallback(async (studentIds: string[]) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${studentIds.length} student(s)? This action cannot be undone.`)
    if (!confirmed) return
    
    try {
      // Delete multiple students
      await Promise.all(
        studentIds.map(id => 
          fetch(`/api/students/${id}`, { method: 'DELETE' })
        )
      )
      await loadStudents()
      await loadStatistics()
      setSelectedStudents([])
    } catch (error) {
      console.error('Error bulk deleting students:', error)
    }
  }, [loadStudents, loadStatistics])

  const handleBulkStatusChange = useCallback(async (studentIds: string[], status: string) => {
    try {
      // Simulate bulk status change
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
      await loadStudents()
      await loadStatistics()
      setSelectedStudents([])
    } catch (error) {
      console.error('Error changing student status:', error)
    }
  }, [students, loadStudents, loadStatistics])

  const handleFiltersChange = useCallback((newFilters: StudentFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters({})
    setCurrentPage(1)
  }, [])

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
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('subtitle')}
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('addStudent')}
        </Button>
      </div>

      {/* Statistics Cards with Suspense */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        {!loading && statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalStudents')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_students}</div>
              <p className="text-xs text-muted-foreground">
                <span className={getStatusColor('active', statistics.active_students)}>
                  {statistics.active_students} {tCommon('active')}
                </span>
                {statistics.inactive_students > 0 && (
                  <span className="ml-2 text-muted-foreground">
                    {statistics.inactive_students} {tCommon('inactive')}
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('activeEnrollments')}</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_enrollment}</div>
              <p className="text-xs text-muted-foreground">
                {t('acrossAllGroups')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('paymentStatus')}</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics.total_students - statistics.pending_payments - statistics.overdue_payments}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-yellow-600">{statistics.pending_payments} {tCommon('pending')}</span>
                {statistics.overdue_payments > 0 && (
                  <span className="ml-2 text-red-600">{statistics.overdue_payments} {tCommon('overdue')}</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('outstandingBalance')}</CardTitle>
              <DollarSign className={`h-4 w-4 ${statistics.total_balance > 0 ? 'text-red-500' : 'text-green-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${statistics.total_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(statistics.total_balance)}
              </div>
              <p className="text-xs text-muted-foreground">
                {statistics.total_balance > 0 ? t('requiresAttention') : t('allPaymentsUpToDate')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      </Suspense>

      {/* Status Overview */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>{t('statusOverview')}</span>
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
                    {tCommon(status)}
                  </Badge>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Suspense fallback={<Card className="p-4">Loading filters...</Card>}>
        <StudentsFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          loading={loading}
        />
      </Suspense>

      {/* Students Table */}
      {loading ? (
        <SkeletonTable rows={pageSize} />
      ) : (
        <Card>
          <Suspense fallback={<SkeletonTable rows={pageSize} />}>
            <StudentsTable
              students={students}
              onEdit={handleEditStudent}
              onDelete={handleDeleteStudent}
              onBulkDelete={handleBulkDelete}
              onBulkStatusChange={handleBulkStatusChange}
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
          </Suspense>
        </Card>
      )}

      {/* Student Form Dialog */}
      {isFormOpen && (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading form...</div>}>
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
        </Suspense>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t('loading') || 'Loading students...'}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4">
              <Activity className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive mb-2">{error}</p>
              <Button onClick={loadStudents} variant="outline">
                {t('retry') || 'Try Again'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && students.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-2">{t('noStudents') || 'No students found'}</p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('addFirstStudent') || 'Add your first student'}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}