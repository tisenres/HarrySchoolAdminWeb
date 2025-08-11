'use client'

import { useState, useEffect } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from '@/components/ui/use-toast'
import { ClientOnly } from '@/components/ui/client-only'
import {
  Archive,
  RotateCcw,
  Trash2,
  Search,
  Loader2,
  Users,
  GraduationCap,
  BookOpen,
  UserCheck
} from 'lucide-react'

interface ArchivedRecord {
  id: string
  entity_type: 'teachers' | 'students' | 'groups' | 'profiles'
  record_data: any
  deleted_at: string
  deleted_by: string
  deleted_by_name?: string
}

export function ArchiveManagement() {
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [records, setRecords] = useState<ArchivedRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [isRestoring, setIsRestoring] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])
  const [isBulkRestoring, setIsBulkRestoring] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const recordsPerPage = 20

  const entityTypes = [
    { value: 'all', label: 'All Records', icon: Archive },
    { value: 'teachers', label: 'Teachers', icon: Users },
    { value: 'students', label: 'Students', icon: GraduationCap },
    { value: 'groups', label: 'Groups', icon: BookOpen },
    { value: 'profiles', label: 'Users', icon: UserCheck }
  ]

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (organizationId) {
      fetchArchivedRecords()
    }
  }, [organizationId, entityFilter, currentPage])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setOrganizationId(data.profile.organization_id)
      } else {
        throw new Error('Failed to fetch profile')
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
      toast({
        title: 'Error',
        description: 'Failed to load user profile',
        variant: 'destructive',
      })
    }
  }

  const fetchArchivedRecords = async () => {
    if (!organizationId) return
    
    setIsLoading(true)
    try {
      const table = entityFilter === 'all' ? 'all' : entityFilter
      const offset = (currentPage - 1) * recordsPerPage
      
      const response = await fetch(
        `/api/settings/archive?table=${table}&limit=${recordsPerPage}&offset=${offset}`
      )
      
      if (response.ok) {
        const data = await response.json()
        const archiveRecords: ArchivedRecord[] = data.archives.map((record: any) => ({
          id: record.id,
          entity_type: record.table,
          record_data: record,
          deleted_at: record.deleted_at,
          deleted_by: record.deleted_by,
          deleted_by_name: record.profiles?.full_name || 'Unknown'
        }))
        
        setRecords(archiveRecords)
        setTotalRecords(data.pagination.total)
      } else {
        throw new Error('Failed to fetch archived records')
      }
    } catch (error) {
      console.error('Error fetching archived records:', error)
      toast({
        title: 'Error',
        description: 'Failed to load archived records',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async (record: ArchivedRecord) => {
    setIsRestoring(record.id)
    try {
      const response = await fetch('/api/settings/archive/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: record.entity_type,
          recordId: record.id,
          reason: `Restored ${record.entity_type.slice(0, -1)} via archive management`
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to restore record')
      }

      toast({
        title: 'Success',
        description: `${record.entity_type.slice(0, -1)} restored successfully`,
      })

      fetchArchivedRecords()
    } catch (error) {
      console.error('Error restoring record:', error)
      toast({
        title: 'Error',
        description: 'Failed to restore record',
        variant: 'destructive',
      })
    } finally {
      setIsRestoring(null)
    }
  }

  const handlePermanentDelete = async (record: ArchivedRecord) => {
    setIsDeleting(record.id)
    try {
      const response = await fetch('/api/settings/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'permanent_delete',
          table: record.entity_type,
          id: record.id,
          confirmation: 'PERMANENTLY_DELETE',
          reason: `Permanently deleted ${record.entity_type.slice(0, -1)} from archive management`
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete record')
      }

      toast({
        title: 'Success',
        description: `${record.entity_type.slice(0, -1)} permanently deleted`,
      })

      fetchArchivedRecords()
    } catch (error) {
      console.error('Error deleting record:', error)
      toast({
        title: 'Error',
        description: 'Failed to permanently delete record',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const getEntityBadge = (entityType: string) => {
    const config = {
      teachers: { color: 'default' as const, icon: Users },
      students: { color: 'secondary' as const, icon: GraduationCap },
      groups: { color: 'outline' as const, icon: BookOpen },
      profiles: { color: 'destructive' as const, icon: UserCheck }
    }
    
    const { color, icon: Icon } = config[entityType as keyof typeof config] || { color: 'default' as const, icon: Archive }
    
    return (
      <Badge variant={color} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {entityType.charAt(0).toUpperCase() + entityType.slice(1, -1)}
      </Badge>
    )
  }

  const getRecordName = (record: ArchivedRecord) => {
    const data = record.record_data
    switch (record.entity_type) {
      case 'teachers':
        return data.full_name || `${data.first_name} ${data.last_name}`
      case 'students':
        return data.full_name || `${data.first_name} ${data.last_name}`
      case 'groups':
        return data.name
      case 'profiles':
        return data.full_name
      default:
        return 'Unknown'
    }
  }

  const getRecordDetails = (record: ArchivedRecord) => {
    const data = record.record_data
    switch (record.entity_type) {
      case 'teachers':
        return data.email || data.phone
      case 'students':
        return data.student_id || data.email || data.phone
      case 'groups':
        return `Capacity: ${data.max_capacity || data.max_students || 0} students`
      case 'profiles':
        return `Role: ${data.role}`
      default:
        return ''
    }
  }

  const handleSelectAll = () => {
    if (selectedRecords.length === filteredRecords.length) {
      setSelectedRecords([])
    } else {
      setSelectedRecords(filteredRecords.map(record => record.id))
    }
  }

  const handleSelectRecord = (recordId: string) => {
    if (selectedRecords.includes(recordId)) {
      setSelectedRecords(selectedRecords.filter(id => id !== recordId))
    } else {
      setSelectedRecords([...selectedRecords, recordId])
    }
  }

  const handleBulkRestore = async () => {
    if (selectedRecords.length === 0) return
    
    setIsBulkRestoring(true)
    const recordsToRestore = filteredRecords.filter(record => selectedRecords.includes(record.id))
    let successCount = 0
    let failureCount = 0

    for (const record of recordsToRestore) {
      try {
        const response = await fetch('/api/settings/archive/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity: record.entity_type,
            recordId: record.id,
            reason: `Bulk restored ${record.entity_type.slice(0, -1)} via archive management`
          }),
        })

        if (response.ok) {
          successCount++
        } else {
          failureCount++
        }
      } catch (error) {
        failureCount++
      }
    }

    if (successCount > 0) {
      toast({
        title: 'Bulk Restore Complete',
        description: `Successfully restored ${successCount} record${successCount > 1 ? 's' : ''}.${failureCount > 0 ? ` ${failureCount} failed.` : ''}`,
      })
      fetchArchivedRecords()
      setSelectedRecords([])
    } else {
      toast({
        title: 'Error',
        description: 'Failed to restore any records',
        variant: 'destructive',
      })
    }

    setIsBulkRestoring(false)
  }

  const handleBulkDelete = async () => {
    if (selectedRecords.length === 0) return
    
    setIsBulkDeleting(true)
    const recordsToDelete = filteredRecords.filter(record => selectedRecords.includes(record.id))
    let successCount = 0
    let failureCount = 0

    for (const record of recordsToDelete) {
      try {
        const response = await fetch('/api/settings/archive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'permanent_delete',
            table: record.entity_type,
            id: record.id,
            confirmation: 'PERMANENTLY_DELETE',
            reason: `Bulk permanently deleted ${record.entity_type.slice(0, -1)} from archive management`
          }),
        })

        if (response.ok) {
          successCount++
        } else {
          failureCount++
        }
      } catch (error) {
        failureCount++
      }
    }

    if (successCount > 0) {
      toast({
        title: 'Bulk Delete Complete',
        description: `Successfully deleted ${successCount} record${successCount > 1 ? 's' : ''}.${failureCount > 0 ? ` ${failureCount} failed.` : ''}`,
      })
      fetchArchivedRecords()
      setSelectedRecords([])
    } else {
      toast({
        title: 'Error',
        description: 'Failed to delete any records',
        variant: 'destructive',
      })
    }

    setIsBulkDeleting(false)
  }

  const filteredRecords = records.filter((record) => {
    const name = getRecordName(record).toLowerCase()
    const details = getRecordDetails(record).toLowerCase()
    return name.includes(searchTerm.toLowerCase()) || details.includes(searchTerm.toLowerCase())
  })

  if (isLoading || !organizationId) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Archive Management</h2>
        <p className="text-muted-foreground">
          Manage soft-deleted records. Restore or permanently delete archived items.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search archived records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {entityTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <type.icon className="h-4 w-4" />
                  {type.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedRecords.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-900">
              {selectedRecords.length} record{selectedRecords.length > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkRestore}
              disabled={isBulkRestoring}
            >
              {isBulkRestoring ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Restore Selected
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Permanently Delete Multiple Records</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. {selectedRecords.length} record{selectedRecords.length > 1 ? 's' : ''} will be permanently deleted from the database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Deleted By</TableHead>
              <TableHead>Deleted At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Archive className="h-8 w-8 text-muted-foreground" />
                    No archived records found
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record) => (
                <TableRow key={`${record.entity_type}-${record.id}`}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRecords.includes(record.id)}
                      onCheckedChange={() => handleSelectRecord(record.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {getEntityBadge(record.entity_type)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {getRecordName(record)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getRecordDetails(record)}
                  </TableCell>
                  <TableCell>
                    {record.deleted_by_name}
                  </TableCell>
                  <TableCell>
                    <ClientOnly fallback="Loading...">
                      {new Date(record.deleted_at).toLocaleDateString()} {new Date(record.deleted_at).toLocaleTimeString()}
                    </ClientOnly>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(record)}
                        disabled={isRestoring === record.id}
                      >
                        {isRestoring === record.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                        Restore
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isDeleting === record.id}
                          >
                            {isDeleting === record.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Permanently Delete Record</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The record "{getRecordName(record)}" will be permanently deleted from the database.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handlePermanentDelete(record)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalRecords > recordsPerPage && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * recordsPerPage + 1, totalRecords)} to{' '}
            {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords} records
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage * recordsPerPage >= totalRecords}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}