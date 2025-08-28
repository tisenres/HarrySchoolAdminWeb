'use client'

import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SkeletonTable } from '@/components/ui/skeleton-table-new'

// PERFORMANCE OPTIMIZATION: Use virtual table for better rendering performance  
const GroupsVirtualTable = lazy(() => 
  import('@/components/admin/groups/groups-virtual-table').then(mod => ({ default: mod.GroupsVirtualTable }))
)
const GroupsFilters = lazy(() => 
  import('@/components/admin/groups/groups-filters').then(mod => ({ default: mod.GroupsFilters }))
)
const GroupForm = lazy(() => 
  import('@/components/admin/groups/group-form').then(mod => ({ default: mod.GroupForm }))
)
import {
  Plus,
  Users,
  Calendar,
  TrendingUp,
  Target,
  Trash2,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import type { GroupTableRow, GroupFilters, GroupStatistics, Group, GroupSortConfig } from '@/types/group'

export default function GroupsClient() {
  const t = useTranslations('groups')
  const tCommon = useTranslations('common')
  const tActions = useTranslations('actions')
  
  const [statistics, setStatistics] = useState<GroupStatistics | null>(null)
  const [filters, setFilters] = useState<GroupFilters>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | undefined>()
  const [deletingGroup, setDeletingGroup] = useState<GroupTableRow | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const [sortConfig, setSortConfig] = useState<GroupSortConfig>({
    field: 'name',
    direction: 'asc'
  })
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    page_size: 20,
    count: 0
  })

  // Use React Query for groups data
  const { data: groupsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['groups', filters, sortConfig, pagination.current_page, pagination.page_size],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.current_page.toString(),
        limit: pagination.page_size.toString(),
        sort_field: sortConfig.field,
        sort_direction: sortConfig.direction
      })

      // Add filter params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/groups?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      // The API returns data directly, not wrapped in a success object
      return result
    },
    staleTime: 0,
    gcTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  const groups: GroupTableRow[] = groupsResponse?.data || []

  // Update pagination when data changes
  useEffect(() => {
    if (groupsResponse) {
      setPagination(prev => ({
        ...prev,
        current_page: pagination.current_page,
        total_pages: groupsResponse.total_pages || 1,
        count: groupsResponse.count || 0
      }))
    }
  }, [groupsResponse])

  // Calculate statistics from groups data
  useEffect(() => {
    if (groups.length > 0) {
      const totalCapacity = groups.reduce((sum, g) => sum + (g.max_students || 0), 0)
      const totalEnrolled = groups.reduce((sum, g) => sum + (g.current_enrollment || 0), 0)
      
      setStatistics({
        total_groups: pagination.count,
        active_groups: groups.filter(g => g.status === 'active').length,
        upcoming_groups: groups.filter(g => g.status === 'upcoming').length,
        completed_groups: groups.filter(g => g.status === 'completed').length,
        total_capacity: totalCapacity,
        total_enrollment: totalEnrolled,
        enrollment_rate: totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0,
        by_subject: {},
        by_level: {},
        by_status: {}
      })
    }
  }, [groups, pagination.count])

  // Optimized event handlers with useCallback
  const handleCreateGroup = useCallback(async (_group: Group) => {
    try {
      setSubmitting(true)
      await refetch() // Refresh data
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Failed to create group:', error)
    } finally {
      setSubmitting(false)
    }
  }, [refetch])

  // Handle group editing
  const handleEditGroup = useCallback((group: GroupTableRow) => {
    // Convert table row to full group for editing
    // In real app, we'd fetch full group data
    setEditingGroup({
      id: group.id,
      organization_id: 'mock-org',
      name: group.name,
      group_code: group.group_code,
      subject: group.subject,
      level: group.level,
      max_students: group.max_students,
      current_enrollment: group.current_enrollment,
      schedule: [], // Would be loaded from API
      start_date: group.start_date,
      status: group.status as any,
      is_active: group.is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as Group)
    setShowEditDialog(true)
  }, [])

  const handleUpdateGroup = useCallback(async (_group: Group) => {
    try {
      setSubmitting(true)
      await refetch() // Refresh data
      setShowEditDialog(false)
      setEditingGroup(undefined)
    } catch (error) {
      console.error('Failed to update group:', error)
    } finally {
      setSubmitting(false)
    }
  }, [refetch])

  // Handle group deletion
  const handleDeleteGroup = useCallback((group: GroupTableRow) => {
    setDeletingGroup(group)
    setShowDeleteDialog(true)
  }, [])

  const confirmDeleteGroup = useCallback(async () => {
    if (!deletingGroup) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/groups/${deletingGroup.id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete group')
      }
      await refetch() // Refresh data
      setShowDeleteDialog(false)
      setDeletingGroup(undefined)
    } catch (error) {
      console.error('Failed to delete group:', error)
    } finally {
      setSubmitting(false)
    }
  }, [deletingGroup, refetch])

  // Handle bulk actions
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return

    try {
      setSubmitting(true)
      // Delete multiple groups
      await Promise.all(
        selectedIds.map(id => 
          fetch(`/api/groups/${id}`, { method: 'DELETE' })
        )
      )
      await refetch() // Refresh data
      setSelectedIds([])
    } catch (error) {
      console.error('Failed to bulk delete groups:', error)
    } finally {
      setSubmitting(false)
    }
  }, [selectedIds, refetch])

  const resetFilters = useCallback(() => {
    setFilters({})
  }, [])

  // Add sort handlers
  const handleSortChange = useCallback((newSortConfig: GroupSortConfig) => {
    setSortConfig(newSortConfig)
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded mt-2" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
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
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={submitting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {tActions('delete')} ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('addGroup')}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalGroups')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_groups}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.active_groups} {tCommon('active')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalCapacity')}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_capacity}</div>
              <p className="text-xs text-muted-foreground">
                {t('studentSeatsAvailable')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('enrollmentRate')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.enrollment_rate}%</div>
              <p className="text-xs text-muted-foreground">
                {statistics.total_enrollment} {t('studentsEnrolled')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('upcomingGroups')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.upcoming_groups}</div>
              <p className="text-xs text-muted-foreground">
                {t('startingSoon')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Suspense fallback={<Card className="p-4">Loading filters...</Card>}>
        <GroupsFilters
          filters={filters}
          onFiltersChange={setFilters}
          onReset={resetFilters}
        />
      </Suspense>

      {/* Groups Table */}
      <Suspense fallback={<SkeletonTable rows={8} />}>
        {error ? (
          <div className="p-8 text-center text-destructive">
            <p>Error loading groups: {error.message}</p>
            <button onClick={() => refetch()} className="mt-4 btn btn-primary">
              Retry
            </button>
          </div>
        ) : (
          <GroupsVirtualTable
            groups={groups}
            loading={isLoading}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            sortConfig={sortConfig}
            onSortChange={handleSortChange}
            onEdit={handleEditGroup}
            onDelete={handleDeleteGroup}
            height={600}
          />
        )}
      </Suspense>

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl">{t('createNewGroup')}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('createGroupDescription')}
            </DialogDescription>
          </DialogHeader>
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading form...</div>}>
            <GroupForm
              onSave={handleCreateGroup}
              onCancel={() => setShowCreateDialog(false)}
              isSubmitting={submitting}
              hideHeader={true}
            />
          </Suspense>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl">{t('editGroup')}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('editGroupDescription')}
            </DialogDescription>
          </DialogHeader>
          {editingGroup && (
            <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading form...</div>}>
              <GroupForm
                group={editingGroup}
                onSave={handleUpdateGroup}
                onCancel={() => {
                  setShowEditDialog(false)
                  setEditingGroup(undefined)
                }}
                isSubmitting={submitting}
                hideHeader={true}
              />
            </Suspense>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteGroup')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteGroupConfirmation', { groupName: deletingGroup?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>{tActions('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteGroup}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? t('deleting') : t('deleteGroup')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}