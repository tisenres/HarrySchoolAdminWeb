'use client'

import { useState, useEffect } from 'react'
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
import { GroupsTable } from '@/components/admin/groups/groups-table'
import { GroupsFilters } from '@/components/admin/groups/groups-filters'
import { GroupForm } from '@/components/admin/groups/group-form'
import {
  Plus,
  Users,
  Calendar,
  TrendingUp,
  Target,
  Trash2,
} from 'lucide-react'
// import { mockGroupService } from '@/lib/services/mock-group-service'
import type { GroupTableRow, GroupFilters, GroupStatistics, Group } from '@/types/group'

export default function GroupsPage() {
  const [statistics, setStatistics] = useState<GroupStatistics | null>(null)
  const [filters, setFilters] = useState<GroupFilters>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | undefined>()
  const [deletingGroup, setDeletingGroup] = useState<GroupTableRow | undefined>()
  const [submitting, setSubmitting] = useState(false)

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // Fetch groups to calculate statistics
      const response = await fetch('/api/groups?limit=100')
      const result = await response.json()
      
      if (result.success && result.data) {
        const allGroups = result.data
        const totalCapacity = allGroups.reduce((sum: number, g: any) => sum + (g.max_students || 0), 0)
        const totalEnrolled = allGroups.reduce((sum: number, g: any) => sum + (g.current_students || 0), 0)
        
        setStatistics({
          total_groups: result.pagination?.total || 0,
          active_groups: allGroups.filter((g: any) => g.status === 'active').length,
          upcoming_groups: allGroups.filter((g: any) => g.status === 'upcoming').length,
          completed_groups: allGroups.filter((g: any) => g.status === 'completed').length,
          total_capacity: totalCapacity,
          total_enrollment: totalEnrolled,
          enrollment_rate: totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0,
          by_subject: {},
          by_level: {},
          by_status: {}
        })
      }
    } catch (error) {
      console.error('Failed to load groups data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle group creation
  const handleCreateGroup = async (_group: Group) => {
    try {
      setSubmitting(true)
      await loadData() // Refresh data
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Failed to create group:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle group editing
  const handleEditGroup = (group: GroupTableRow) => {
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
  }

  const handleUpdateGroup = async (_group: Group) => {
    try {
      setSubmitting(true)
      await loadData() // Refresh data
      setShowEditDialog(false)
      setEditingGroup(undefined)
    } catch (error) {
      console.error('Failed to update group:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle group deletion
  const handleDeleteGroup = (group: GroupTableRow) => {
    setDeletingGroup(group)
    setShowDeleteDialog(true)
  }

  const confirmDeleteGroup = async () => {
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
      await loadData() // Refresh data
      setShowDeleteDialog(false)
      setDeletingGroup(undefined)
    } catch (error) {
      console.error('Failed to delete group:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle bulk actions
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return

    try {
      setSubmitting(true)
      // Delete multiple groups
      await Promise.all(
        selectedIds.map(id => 
          fetch(`/api/groups/${id}`, { method: 'DELETE' })
        )
      )
      await loadData() // Refresh data
      setSelectedIds([])
    } catch (error) {
      console.error('Failed to bulk delete groups:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const resetFilters = () => {
    setFilters({})
  }

  if (loading) {
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
          <h1 className="text-3xl font-bold">Groups</h1>
          <p className="text-muted-foreground mt-2">
            Manage learning groups, schedules, and enrollments
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
              Delete ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_groups}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.active_groups} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_capacity}</div>
              <p className="text-xs text-muted-foreground">
                student seats available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enrollment Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.enrollment_rate}%</div>
              <p className="text-xs text-muted-foreground">
                {statistics.total_enrollment} students enrolled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Groups</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.upcoming_groups}</div>
              <p className="text-xs text-muted-foreground">
                starting soon
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <GroupsFilters
        filters={filters}
        onFiltersChange={setFilters}
        onReset={resetFilters}
      />

      {/* Groups Table */}
      <GroupsTable
        filters={filters}
        onSelectionChange={setSelectedIds}
        onEdit={handleEditGroup}
        onDelete={handleDeleteGroup}
      />

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Add a new learning group with schedule and enrollment details.
            </DialogDescription>
          </DialogHeader>
          <GroupForm
            onSave={handleCreateGroup}
            onCancel={() => setShowCreateDialog(false)}
            isSubmitting={submitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update group information and settings.
            </DialogDescription>
          </DialogHeader>
          {editingGroup && (
            <GroupForm
              group={editingGroup}
              onSave={handleUpdateGroup}
              onCancel={() => {
                setShowEditDialog(false)
                setEditingGroup(undefined)
              }}
              isSubmitting={submitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingGroup?.name}"?
              This action cannot be undone and will affect all enrolled students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <LoadingButton
              onClick={confirmDeleteGroup}
              loading={submitting}
              loadingText="Deleting..."
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Group
            </LoadingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}