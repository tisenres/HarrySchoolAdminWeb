'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
import { GroupProfile } from '@/components/admin/groups/group-profile'
import { GroupForm } from '@/components/admin/groups/group-form'
import { ArrowLeft, Edit, Trash2, UserPlus, Users } from 'lucide-react'
import { mockGroupService } from '@/lib/services/mock-group-service'
import type { GroupWithDetails, Group } from '@/types/group'

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params['id'] as string

  const [group, setGroup] = useState<GroupWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Load group data
  useEffect(() => {
    if (groupId) {
      loadGroup()
    }
  }, [groupId])

  const loadGroup = async () => {
    try {
      setLoading(true)
      const groupData = await mockGroupService.getById(groupId)
      
      if (!groupData) {
        router.push('/dashboard/groups')
        return
      }
      
      setGroup(groupData)
    } catch (error) {
      console.error('Failed to load group:', error)
      router.push('/dashboard/groups')
    } finally {
      setLoading(false)
    }
  }

  // Handle group editing
  const handleEditGroup = () => {
    setShowEditDialog(true)
  }

  const handleUpdateGroup = async (_updatedGroup: Group) => {
    try {
      setSubmitting(true)
      await loadGroup() // Refresh data
      setShowEditDialog(false)
    } catch (error) {
      console.error('Failed to update group:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle group deletion
  const handleDeleteGroup = () => {
    setShowDeleteDialog(true)
  }

  const confirmDeleteGroup = async () => {
    if (!group) return

    try {
      setSubmitting(true)
      await mockGroupService.delete(group.id)
      router.push('/dashboard/groups')
    } catch (error) {
      console.error('Failed to delete group:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Placeholder handlers for future features
  const handleManageEnrollment = () => {
    // TODO: Implement student enrollment management
    console.log('Manage enrollment for group:', group?.id)
  }

  const handleAssignTeacher = () => {
    // TODO: Implement teacher assignment
    console.log('Assign teacher to group:', group?.id)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-muted animate-pulse rounded" />
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="space-y-6">
          <div className="h-48 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded" />
            ))}
          </div>
          <div className="h-96 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">Group not found</h2>
          <p className="text-muted-foreground mt-2">
            The group you're looking for doesn't exist or has been deleted.
          </p>
          <Button
            onClick={() => router.push('/dashboard/groups')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Groups
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/dashboard/groups')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Groups
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAssignTeacher}
          >
            <Users className="h-4 w-4 mr-2" />
            Assign Teacher
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManageEnrollment}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Manage Enrollment
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditGroup}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteGroup}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Group Profile */}
      <GroupProfile
        group={group}
        onEdit={handleEditGroup}
        onManageEnrollment={handleManageEnrollment}
        onAssignTeacher={handleAssignTeacher}
      />

      {/* Edit Group Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update group information and settings.
            </DialogDescription>
          </DialogHeader>
          <GroupForm
            group={group as Group}
            onSave={handleUpdateGroup}
            onCancel={() => setShowEditDialog(false)}
            isSubmitting={submitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{group.name}"?
              This action cannot be undone and will affect all enrolled students and assigned teachers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteGroup}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? 'Deleting...' : 'Delete Group'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}