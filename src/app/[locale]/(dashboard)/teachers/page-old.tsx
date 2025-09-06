'use client'

/**
 * OPTIMIZED Teachers Page for Harry School CRM
 * Uses React Query for data fetching and component memoization for performance
 */

import React, { useState, useCallback, lazy, Suspense, useMemo } from 'react'
import { Plus, Download, Upload, RefreshCw, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

// Optimized lazy loading with preloading
const TeachersTable = lazy(() => 
  import('@/components/admin/teachers/teachers-table').then(mod => ({ default: mod.TeachersTable }))
)
const TeachersFilters = lazy(() => 
  import('@/components/admin/teachers/teachers-filters').then(mod => ({ default: mod.TeachersFilters }))
)
const TeacherForm = lazy(() => 
  import('@/components/admin/teachers/teacher-form').then(mod => ({ default: mod.TeacherForm }))
)
const ImportModal = lazy(() => 
  import('@/components/admin/shared/import-modal').then(mod => ({ default: mod.ImportModal }))
)
const ExportModal = lazy(() => 
  import('@/components/admin/shared/export-modal').then(mod => ({ default: mod.ExportModal }))
)

import { SkeletonTable } from '@/components/ui/skeleton-table-new'
import { getAvailableFields } from '@/lib/constants/teachers-export-fields'
import type { Teacher, TeacherFilters, TeacherSortConfig } from '@/types/teacher'
import type { CreateTeacherRequest } from '@/lib/validations/teacher'

// Optimized React Query hooks
import { 
  useTeachers, 
  useTeachersStats, 
  useCreateTeacher, 
  useUpdateTeacher, 
  useDeleteTeacher, 
  useBulkDeleteTeachers,
  usePrefetchTeachers
} from '@/hooks/use-teachers'

// Memoized statistics component
const StatisticsCards = React.memo(({ statistics, availableSpecializations }: {
  statistics: any
  availableSpecializations: string[]
}) => {
  const t = useTranslations('teachers')
  
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t('totalTeachers')}</p>
            <p className="text-2xl font-bold">{statistics?.total || 0}</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t('activeTeachers')}</p>
            <p className="text-2xl font-bold">{statistics?.active || 0}</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t('fullTime')}</p>
            <p className="text-2xl font-bold">{statistics?.full_time || 0}</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t('specializations')}</p>
            <p className="text-2xl font-bold">{availableSpecializations.length}</p>
          </div>
        </div>
      </Card>
    </div>
  )
})

StatisticsCards.displayName = 'StatisticsCards'

export default function TeachersPageOptimized() {
  const t = useTranslations('teachers')
  const tCommon = useTranslations('common')
  
  // State management
  const [filters, setFilters] = useState<TeacherFilters>({})
  const [sortConfig, setSortConfig] = useState<TeacherSortConfig>({
    field: 'full_name',
    direction: 'asc'
  })
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // Form states
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)
  
  // Import/Export states
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  // Memoized pagination object to prevent unnecessary re-renders
  const pagination = useMemo(() => ({ page: currentPage, limit: pageSize }), [currentPage, pageSize])

  // React Query hooks for data fetching
  const { data: teachersData, isLoading, isRefetching, error } = useTeachers(filters, sortConfig, pagination)
  const { data: statistics } = useTeachersStats()
  
  // Mutation hooks for CRUD operations
  const createTeacherMutation = useCreateTeacher()
  const updateTeacherMutation = useUpdateTeacher()
  const deleteTeacherMutation = useDeleteTeacher()
  const bulkDeleteMutation = useBulkDeleteTeachers()
  
  // Prefetching hook for performance
  const { prefetchTeachers } = usePrefetchTeachers()

  // Memoized available specializations
  const availableSpecializations = useMemo(() => [
    'English',
    'Mathematics', 
    'Computer Science',
    'IELTS Preparation',
    'TOEFL Preparation',
    'Business English',
    'Physics',
    'Chemistry',
    'Biology',
    'Academic Writing',
    'Conversation',
    'Grammar'
  ], [])

  // Memoized teachers data
  const { teachers, totalCount, totalPages } = useMemo(() => ({
    teachers: teachersData?.data || [],
    totalCount: teachersData?.count || 0,
    totalPages: teachersData?.total_pages || 1
  }), [teachersData])

  // Optimized event handlers with useCallback
  const handleFiltersChange = useCallback((newFilters: TeacherFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
    // Prefetch first page with new filters
    prefetchTeachers(newFilters, sortConfig, 1)
  }, [sortConfig, prefetchTeachers])

  const handleSortChange = useCallback((newSort: TeacherSortConfig) => {
    setSortConfig(newSort)
    // Prefetch first page with new sort
    prefetchTeachers(filters, newSort, 1)
  }, [filters, prefetchTeachers])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    // Prefetch next page
    if (page < totalPages) {
      prefetchTeachers(filters, sortConfig, page + 1)
    }
  }, [filters, sortConfig, totalPages, prefetchTeachers])

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }, [])

  const handleEdit = useCallback((teacher: Teacher) => {
    setEditingTeacher(teacher)
    setShowEditForm(true)
  }, [])

  const handleDelete = useCallback((teacherId: string) => {
    setTeacherToDelete(teacherId)
    setDeleteConfirmOpen(true)
  }, [])

  const handleBulkDelete = useCallback((teacherIds: string[]) => {
    if (teacherIds.length === 0) return
    setBulkDeleteConfirmOpen(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!teacherToDelete) return

    try {
      await deleteTeacherMutation.mutateAsync(teacherToDelete)
      setDeleteConfirmOpen(false)
      setTeacherToDelete(null)
      // Clear selection if deleted teacher was selected
      setSelectedTeachers(prev => prev.filter(id => id !== teacherToDelete))
    } catch (err) {
      console.error('Failed to delete teacher:', err)
    }
  }, [teacherToDelete, deleteTeacherMutation])

  const confirmBulkDelete = useCallback(async () => {
    try {
      await bulkDeleteMutation.mutateAsync(selectedTeachers)
      setBulkDeleteConfirmOpen(false)
      setSelectedTeachers([])
    } catch (err) {
      console.error('Failed to bulk delete teachers:', err)
    }
  }, [selectedTeachers, bulkDeleteMutation])

  const handleFormSubmit = useCallback(async (data: CreateTeacherRequest) => {
    try {
      if (editingTeacher) {
        await updateTeacherMutation.mutateAsync({ id: editingTeacher.id, data })
      } else {
        await createTeacherMutation.mutateAsync(data)
      }
      
      setShowEditForm(false)
      setEditingTeacher(null)
    } catch (err) {
      console.error('Failed to save teacher:', err)
      throw new Error('Failed to save teacher. Please try again.')
    }
  }, [editingTeacher, updateTeacherMutation, createTeacherMutation])

  const handleFormCancel = useCallback(() => {
    setShowEditForm(false)
    setEditingTeacher(null)
  }, [])

  // Show form if editing/creating
  if (showEditForm) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading form...</div>}>
        <TeacherForm
          {...(editingTeacher && { teacher: editingTeacher })}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          mode={editingTeacher ? 'edit' : 'create'}
        />
      </Suspense>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            {tCommon('refresh')}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowExportModal(true)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {tCommon('export')}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowImportModal(true)}
            disabled={createTeacherMutation.isPending}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {createTeacherMutation.isPending ? 'Importing...' : tCommon('import')}
          </Button>
          <Button onClick={() => setShowEditForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('addTeacher')}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/5">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p className="font-medium">{error.message}</p>
          </div>
        </Card>
      )}

      {/* Stats Cards - Memoized */}
      <StatisticsCards statistics={statistics} availableSpecializations={availableSpecializations} />

      {/* Filters */}
      <Suspense fallback={<Card className="p-4">Loading filters...</Card>}>
        <TeachersFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          availableSpecializations={availableSpecializations}
          loading={isLoading}
          totalCount={totalCount}
        />
      </Suspense>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={pageSize} />
      ) : (
        <Card>
          <Suspense fallback={<SkeletonTable rows={pageSize} />}>
            <TeachersTable
              teachers={teachers}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              onBulkStatusChange={(ids, status) => console.log('Bulk status change:', ids, status)}
              onExport={() => setShowExportModal(true)}
              selectedTeachers={selectedTeachers}
              onSelectionChange={setSelectedTeachers}
              sortConfig={sortConfig}
              onSortChange={handleSortChange}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              loading={isLoading}
            />
          </Suspense>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this teacher? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTeacherMutation.isPending}
            >
              {deleteTeacherMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Teachers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTeachers.length} teachers? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? 'Deleting...' : `Delete ${selectedTeachers.length} Teachers`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Modal */}
      {showImportModal && (
        <Suspense fallback={null}>
          <ImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            title="Import Teachers"
            description="Upload an Excel or CSV file to import teacher data into the system."
            dataType="teachers"
            onImport={async (file) => {
              // Handle import - this would need to be implemented
              console.log('Import file:', file)
              throw new Error('Import functionality needs to be implemented')
            }}
            onDownloadTemplate={async () => {
              // Handle template download
              console.log('Download template')
            }}
          />
        </Suspense>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <Suspense fallback={null}>
          <ExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            title="Export Teachers"
            description="Export teacher data to Excel or CSV format with customizable field selection."
            dataType="teachers"
            totalRecords={totalCount}
            filteredRecords={teachers.length}
            availableFields={getAvailableFields()}
            onExport={async (options) => {
              // Handle export - this would need to be implemented
              console.log('Export options:', options)
            }}
            isExporting={false}
          />
        </Suspense>
      )}
    </div>
  )
}