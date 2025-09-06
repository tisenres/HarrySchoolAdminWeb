'use client'

import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
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

// Lazy load heavy components
const TeachersTable = lazy(() => import('@/components/admin/teachers/teachers-table').then(mod => ({ default: mod.TeachersTable })))
const TeachersFilters = lazy(() => import('@/components/admin/teachers/teachers-filters').then(mod => ({ default: mod.TeachersFilters })))
const TeacherForm = lazy(() => import('@/components/admin/teachers/teacher-form').then(mod => ({ default: mod.TeacherForm })))
const ImportModal = lazy(() => import('@/components/admin/shared/import-modal').then(mod => ({ default: mod.ImportModal })))
const ExportModal = lazy(() => import('@/components/admin/shared/export-modal').then(mod => ({ default: mod.ExportModal })))
import { SkeletonTable } from '@/components/ui/skeleton-table-new'
// Import/Export functionality now handled via API routes
import { ImportResult } from '@/lib/services/import-export-service'
import { getAvailableFields } from '@/lib/constants/teachers-export-fields'
import type { Teacher, TeacherFilters, TeacherSortConfig } from '@/types/teacher'
import type { CreateTeacherRequest } from '@/lib/validations/teacher'

export default function TeachersPage() {
  const t = useTranslations('teachers')
  const tCommon = useTranslations('common')
  
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([])
  const [filters, setFilters] = useState<TeacherFilters>({})
  const [sortConfig, setSortConfig] = useState<TeacherSortConfig>({
    field: 'full_name',
    direction: 'asc'
  })
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    full_time: 0,
    part_time: 0
  })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Dialog states
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)
  
  // Import/Export states
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const availableSpecializations = [
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
  ]

  // Prefetch next page for better UX
  useEffect(() => {
    if (currentPage < totalPages) {
      const nextPageParams = new URLSearchParams({
        page: (currentPage + 1).toString(),
        limit: pageSize.toString(),
        sort_by: sortConfig.field,
        sort_order: sortConfig.direction,
      })
      
      // Prefetch next page
      fetch(`/api/teachers?${nextPageParams}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {}) // Ignore errors for prefetch
    }
  }, [currentPage, totalPages, pageSize, sortConfig])

  // Load teachers data using mock service
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        setLoading(true)
        setError(null)

        // Use real API to get teachers with filtering and pagination
        const queryParams: Record<string, string> = {
          page: currentPage.toString(),
          limit: pageSize.toString(),
          sort_by: sortConfig.field,
          sort_order: sortConfig.direction,
        }
        
        if (filters.search) queryParams['query'] = filters.search
        if (filters.employment_status) queryParams['employment_status'] = Array.isArray(filters.employment_status) ? filters.employment_status.join(',') : filters.employment_status
        if (filters.specializations && filters.specializations.length > 0) queryParams['specializations'] = filters.specializations.join(',')
        if (filters.is_active !== undefined) queryParams['is_active'] = filters.is_active.toString()
        
        const params = new URLSearchParams(queryParams)

        const response = await fetch(`/api/teachers?${params}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch teachers')
        }

        setFilteredTeachers(result.data || [])
        setTotalCount(result.count || 0)
        setTotalPages(result.total_pages || 1)
        
        // Calculate statistics from the data
        const allTeachers = result.data || []
        setStatistics({
          total: result.count || 0,
          active: allTeachers.filter((t: Teacher) => t.is_active).length,
          inactive: allTeachers.filter((t: Teacher) => !t.is_active).length,
          full_time: allTeachers.filter((t: Teacher) => t.contract_type === 'full_time').length,
          part_time: allTeachers.filter((t: Teacher) => t.contract_type === 'part_time').length
        })

      } catch (err) {
        console.error('Failed to load teachers:', err)
        setError('Failed to load teachers. Please try again.')
        // Fallback to empty state
        setFilteredTeachers([])
        setTotalCount(0)
        setTotalPages(1)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    }

    loadTeachers()
  }, [filters, currentPage, pageSize, sortConfig])

  // Load teachers function for manual operations
  const manualLoadTeachers = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true)
      setError(null)

      // Use the same API call as the useEffect
      const queryParams: Record<string, string> = {
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sort_by: sortConfig.field,
        sort_order: sortConfig.direction,
      }
      
      if (filters.search) queryParams['query'] = filters.search
      if (filters.employment_status) queryParams['employment_status'] = Array.isArray(filters.employment_status) ? filters.employment_status.join(',') : filters.employment_status
      if (filters.specializations && filters.specializations.length > 0) queryParams['specializations'] = filters.specializations.join(',')
      if (filters.is_active !== undefined) queryParams['is_active'] = filters.is_active.toString()
      
      const params = new URLSearchParams(queryParams)
      const response = await fetch(`/api/teachers?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch teachers')
      }

      setFilteredTeachers(result.data || [])
      setTotalCount(result.count || 0)
      setTotalPages(result.total_pages || 1)
      
      // Calculate statistics from the data
      const allTeachers = result.data || []
      setStatistics({
        total: result.count || 0,
        active: allTeachers.filter((t: Teacher) => t.is_active).length,
        inactive: allTeachers.filter((t: Teacher) => !t.is_active).length,
        full_time: allTeachers.filter((t: Teacher) => t.contract_type === 'full_time').length,
        part_time: allTeachers.filter((t: Teacher) => t.contract_type === 'part_time').length
      })

    } catch (err) {
      console.error('Failed to load teachers:', err)
      setError('Failed to load teachers. Please try again.')
      setFilteredTeachers([])
      setTotalCount(0)
      setTotalPages(1)
    } finally {
      if (showLoading) setLoading(false)
      setRefreshing(false)
    }
  }, [filters, sortConfig, currentPage, pageSize])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await manualLoadTeachers(false)
  }, [manualLoadTeachers])

  // Filter change handler
  const handleFiltersChange = useCallback((newFilters: TeacherFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }, [])

  // Sort change handler
  const handleSortChange = useCallback((newSort: TeacherSortConfig) => {
    setSortConfig(newSort)
  }, [])

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when page size changes
  }, [])

  // CRUD handlers
  const handleEdit = useCallback((teacher: Teacher) => {
    setEditingTeacher(teacher)
    setShowEditForm(true)
  }, [])

  const handleDelete = useCallback(async (teacherId: string) => {
    setTeacherToDelete(teacherId)
    setDeleteConfirmOpen(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!teacherToDelete) return

    try {
      const response = await fetch(`/api/teachers/${teacherToDelete}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete teacher')
      }
      
      await manualLoadTeachers(false)
      setDeleteConfirmOpen(false)
      setTeacherToDelete(null)
      
      // Clear selection if deleted teacher was selected
      setSelectedTeachers(prev => prev.filter(id => id !== teacherToDelete))
    } catch (err) {
      console.error('Failed to delete teacher:', err)
      setError('Failed to delete teacher. Please try again.')
    }
  }, [teacherToDelete, manualLoadTeachers])

  const handleBulkDelete = useCallback(async (teacherIds: string[]) => {
    if (teacherIds.length === 0) return
    setBulkDeleteConfirmOpen(true)
  }, [])

  const confirmBulkDelete = useCallback(async () => {
    try {
      // Bulk delete via API
      const response = await fetch('/api/teachers/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedTeachers })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete teachers')
      }
      
      if (result.errors && result.errors.length > 0) {
        console.warn('Some teachers could not be deleted:', result.errors)
        setError(`Successfully deleted ${result.success} teachers. ${result.errors.length} errors occurred.`)
      }
      
      await manualLoadTeachers(false)
      setBulkDeleteConfirmOpen(false)
      setSelectedTeachers([])
    } catch (err) {
      console.error('Failed to bulk delete teachers:', err)
      setError('Failed to delete teachers. Please try again.')
    }
  }, [selectedTeachers, manualLoadTeachers])

  const handleBulkStatusChange = useCallback(async (teacherIds: string[], status: string) => {
    // Implementation would go here
    console.log('Bulk status change:', teacherIds, status)
  }, [])

  const handleExport = useCallback(async (teacherIds?: string[]) => {
    setShowExportModal(true)
  }, [])
  
  const handleImport = useCallback(() => {
    setShowImportModal(true)
  }, [])
  
  const handleImportFile = useCallback(async (file: File): Promise<ImportResult> => {
    try {
      setImporting(true)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('organizationId', '00000000-0000-0000-0000-000000000000') // Replace with actual org ID
      
      const response = await fetch('/api/import/teachers', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Import failed')
      }
      
      const result = await response.json()
      
      // Reload teachers data after successful import
      if (result.success || result.successRows > 0) {
        await manualLoadTeachers(false)
      }
      
      return result
    } catch (error) {
      throw error
    } finally {
      setImporting(false)
    }
  }, [manualLoadTeachers])
  
  const handleExportFile = useCallback(async (options: any) => {
    try {
      setExporting(true)
      
      const exportData = {
        organizationId: '00000000-0000-0000-0000-000000000000', // Replace with actual org ID
        format: options.format,
        fields: options.fields,
        filters: options.useFilters ? filters : undefined,
        useFilters: options.useFilters,
        includeHeaders: options.includeHeaders,
        filename: options.filename
      }
      
      const response = await fetch('/api/export/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportData),
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }
      
      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const filename = response.headers.get('Content-Disposition')
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || `teachers_export.${options.format}`
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setShowExportModal(false)
    } catch (error) {
      console.error('Export error:', error)
      throw error
    } finally {
      setExporting(false)
    }
  }, [filters])
  
  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await fetch('/api/import/teachers/template', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to download template')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'teachers_import_template.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Template download error:', error)
      setError('Failed to download template. Please try again.')
    }
  }, [])

  const handleFormSubmit = useCallback(async (data: CreateTeacherRequest) => {
    try {
      if (editingTeacher) {
        const response = await fetch(`/api/teachers/${editingTeacher.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || 'Failed to update teacher')
        }
      } else {
        const response = await fetch('/api/teachers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || 'Failed to create teacher')
        }
      }
      
      await manualLoadTeachers(false)
      setShowEditForm(false)
      setEditingTeacher(null)
    } catch (err) {
      console.error('Failed to save teacher:', err)
      throw new Error('Failed to save teacher. Please try again.')
    }
  }, [editingTeacher, manualLoadTeachers])

  const handleFormCancel = useCallback(() => {
    setShowEditForm(false)
    setEditingTeacher(null)
  }, [])

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
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {tCommon('refresh')}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExport()}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {tCommon('export')}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleImport}
            disabled={importing}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {importing ? 'Importing...' : tCommon('import')}
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
            <p className="font-medium">{error}</p>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('totalTeachers')}</p>
              <p className="text-2xl font-bold">{statistics.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('activeTeachers')}</p>
              <p className="text-2xl font-bold">{statistics.active}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('fullTime')}</p>
              <p className="text-2xl font-bold">{statistics.full_time}</p>
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

      {/* Filters */}
      <Suspense fallback={<Card className="p-4">Loading filters...</Card>}>
        <TeachersFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          availableSpecializations={availableSpecializations}
          loading={loading}
          totalCount={totalCount}
        />
      </Suspense>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={pageSize} />
      ) : (
        <Card>
          <Suspense fallback={<SkeletonTable rows={pageSize} />}>
            <TeachersTable
              teachers={filteredTeachers}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              onBulkStatusChange={handleBulkStatusChange}
              onExport={handleExport}
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
              loading={loading}
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
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
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
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete {selectedTeachers.length} Teachers
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
            onImport={handleImportFile}
            onDownloadTemplate={handleDownloadTemplate}
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
            filteredRecords={filteredTeachers.length}
            availableFields={getAvailableFields()}
            onExport={handleExportFile}
            isExporting={exporting}
          />
        </Suspense>
      )}
    </div>
  )
}