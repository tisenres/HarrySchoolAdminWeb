'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LoadingButton } from '@/components/ui/loading-button'
import { SkeletonTable } from '@/components/ui/skeleton-table'
import {
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  Users,
  Calendar,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye
} from 'lucide-react'
import { groupService } from '@/lib/services/group-service'
import type { GroupTableRow, GroupFilters, GroupSortConfig } from '@/types/group'
import { cn } from '@/lib/utils'
import { ClientOnly } from '@/components/ui/client-only'

interface GroupsTableProps {
  filters?: GroupFilters
  onSelectionChange?: (selectedIds: string[]) => void
  onEdit?: (group: GroupTableRow) => void
  onDelete?: (group: GroupTableRow) => void
  loading?: boolean
}

export function GroupsTable({
  filters,
  onSelectionChange,
  onEdit,
  onDelete,
  loading: externalLoading = false
}: GroupsTableProps) {
  const router = useRouter()
  const t = useTranslations('groupsTable')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
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

  // Use React Query for responsive data fetching
  const { data: groupsData, isLoading: groupsLoading, error: groupsError } = useQuery({
    queryKey: ['groups', filters, sortConfig, pagination.current_page, pagination.page_size],
    queryFn: async () => {
      return await groupService.getAll(
        filters,
        sortConfig,
        pagination.current_page,
        pagination.page_size
      )
    },
    staleTime: 0, // Always refetch when query key changes for responsive UI
    gcTime: 3 * 60 * 1000, // Keep in cache for 3 minutes
    refetchOnWindowFocus: false,
  })

  const groups = groupsData?.data || []
  const loading = groupsLoading || externalLoading

  // Update pagination when data changes
  useEffect(() => {
    if (groupsData) {
      setPagination({
        current_page: groupsData.current_page,
        total_pages: groupsData.total_pages,
        page_size: groupsData.page_size,
        count: groupsData.count
      })
    }
  }, [groupsData])

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(groups.map(g => g.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectGroup = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, groupId])
    } else {
      setSelectedIds(prev => prev.filter(id => id !== groupId))
    }
  }

  useEffect(() => {
    onSelectionChange?.(selectedIds)
  }, [selectedIds, onSelectionChange])

  // Handle sorting
  const handleSort = (field: keyof GroupTableRow) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getSortIcon = (field: keyof GroupTableRow) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />
  }

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800 hover:bg-green-100',
      upcoming: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      completed: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      inactive: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      cancelled: 'bg-red-100 text-red-800 hover:bg-red-100'
    }
    
    return (
      <Badge variant="secondary" className={variants[status as keyof typeof variants]}>
        {status}
      </Badge>
    )
  }


  const formatSchedule = (schedule: string) => {
    // Truncate long schedules
    if (schedule.length > 30) {
      return schedule.substring(0, 30) + '...'
    }
    return schedule
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonTable rows={5} columns={10} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === groups.length && groups.length > 0}
                  onCheckedChange={handleSelectAll}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < groups.length}
                />
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('name')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
{t('columns.groupName')}
                  {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('group_code')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
{t('columns.code')}
                  {getSortIcon('group_code')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('subject')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
{t('columns.subject')}
                  {getSortIcon('subject')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('level')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
{t('columns.level')}
                  {getSortIcon('level')}
                </Button>
              </TableHead>
              <TableHead>{t('columns.teacher')}</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('enrollment_percentage')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
{t('columns.enrollment')}
                  {getSortIcon('enrollment_percentage')}
                </Button>
              </TableHead>
              <TableHead>{t('columns.schedule')}</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('status')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
{t('columns.status')}
                  {getSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('start_date')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
{t('columns.startDate')}
                  {getSortIcon('start_date')}
                </Button>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-12">
                  <div className="text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium mb-2">No groups found</h3>
                    <p className="text-sm">
                      {filters ? 'Try adjusting your search criteria' : 'Create your first group to get started'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow 
                  key={group.id} 
                  className={cn(
                    'hover:bg-muted/50 cursor-pointer transition-colors',
                    selectedIds.includes(group.id) && 'bg-muted/50'
                  )}
                  onClick={() => router.push(`/dashboard/groups/${group.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(group.id)}
                      onCheckedChange={(checked) => 
                        handleSelectGroup(group.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{group.name}</div>
                      {!group.is_active && (
                        <div className="text-xs text-muted-foreground">Inactive</div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                      {group.group_code}
                    </code>
                  </TableCell>
                  
                  <TableCell>{group.subject}</TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">{group.level}</Badge>
                  </TableCell>
                  
                  <TableCell>
                    {group.teacher_name ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {group.teacher_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{group.teacher_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unassigned</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1 min-w-[120px]">
                      <div className="flex items-center justify-between text-xs">
                        <span>{group.current_enrollment}/{group.max_students}</span>
                        <span>{group.enrollment_percentage}%</span>
                      </div>
                      <Progress 
                        value={group.enrollment_percentage} 
                        className="h-2"
                      />
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatSchedule(group.schedule_summary)}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(group.status)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <ClientOnly fallback={<span>Loading...</span>}>
                        {group.start_date ? new Date(group.start_date).toLocaleDateString() : 'Not set'}
                      </ClientOnly>
                    </div>
                  </TableCell>
                  
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/groups/${group.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit?.(group)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Group
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Manage Enrollment
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="h-4 w-4 mr-2" />
                          Assign Teacher
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete?.(group)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {groups.length} of {pagination.count} groups
          </div>
          <div className="flex items-center gap-2">
            <LoadingButton
              variant="outline"
              size="sm"
              disabled={pagination.current_page === 1}
              onClick={() => setPagination(prev => ({ 
                ...prev, 
                current_page: prev.current_page - 1 
              }))}
              loading={false}
            >
              Previous
            </LoadingButton>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                const page = i + 1
                return (
                  <LoadingButton
                    key={page}
                    variant={page === pagination.current_page ? 'default' : 'outline'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setPagination(prev => ({ ...prev, current_page: page }))}
                    loading={false}
                  >
                    {page}
                  </LoadingButton>
                )
              })}
            </div>
            <LoadingButton
              variant="outline"
              size="sm"
              disabled={pagination.current_page === pagination.total_pages}
              onClick={() => setPagination(prev => ({ 
                ...prev, 
                current_page: prev.current_page + 1 
              }))}
              loading={false}
            >
              Next
            </LoadingButton>
          </div>
        </div>
      )}
    </div>
  )
}