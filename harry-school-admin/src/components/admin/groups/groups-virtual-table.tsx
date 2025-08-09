'use client'

import React, { useMemo, useCallback, memo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
import { VirtualTable, VirtualTableColumn } from '@/components/ui/virtual-table'
import type { GroupTableRow, GroupSortConfig } from '@/types/group'

interface GroupsVirtualTableProps {
  groups: GroupTableRow[]
  loading?: boolean
  onSelectionChange?: (selectedIds: string[]) => void
  onEdit?: (group: GroupTableRow) => void
  onDelete?: (group: GroupTableRow) => void
  selectedIds?: string[]
  sortConfig?: GroupSortConfig
  onSortChange?: (config: GroupSortConfig) => void
  height?: number
}

// Memoized components
const StatusBadge = memo<{ status: string }>(({ status }) => {
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
})

StatusBadge.displayName = 'StatusBadge'

const EnrollmentProgress = memo<{ current: number; max: number; percentage: number }>(
  ({ current, max, percentage }) => {

    return (
      <div className="space-y-1 min-w-[120px]">
        <div className="flex items-center justify-between text-xs">
          <span>{current}/{max}</span>
          <span>{percentage}%</span>
        </div>
        <Progress 
          value={percentage} 
          className="h-2"
        />
      </div>
    )
  }
)

EnrollmentProgress.displayName = 'EnrollmentProgress'

const TeacherInfo = memo<{ name?: string }>(({ name }) => (
  name ? (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        <AvatarFallback className="text-xs">
          {name.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm">{name}</span>
    </div>
  ) : (
    <span className="text-muted-foreground text-sm">Unassigned</span>
  )
))

TeacherInfo.displayName = 'TeacherInfo'

export const GroupsVirtualTable = memo<GroupsVirtualTableProps>(({
  groups,
  loading = false,
  onSelectionChange,
  onEdit,
  onDelete,
  selectedIds = [],
  sortConfig,
  onSortChange,
  height = 600,
}) => {
  const router = useRouter()
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(selectedIds)

  // Update internal state when external state changes
  React.useEffect(() => {
    setInternalSelectedIds(selectedIds)
  }, [selectedIds])

  const handleSort = useCallback((field: keyof GroupTableRow) => {
    if (!onSortChange) return

    const newConfig: GroupSortConfig = {
      field,
      direction: sortConfig?.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    }
    onSortChange(newConfig)
  }, [sortConfig, onSortChange])

  const getSortButton = useCallback((field: keyof GroupTableRow, label: string) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-semibold hover:bg-transparent"
    >
      {label}
      {sortConfig?.field === field ? (
        sortConfig.direction === 'asc' ? (
          <ArrowUp className="ml-2 h-3 w-3" />
        ) : (
          <ArrowDown className="ml-2 h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
      )}
    </Button>
  ), [sortConfig, handleSort])

  // Selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    const newSelection = checked ? groups.map(g => g.id) : []
    setInternalSelectedIds(newSelection)
    onSelectionChange?.(newSelection)
  }, [groups, onSelectionChange])

  const handleSelectGroup = useCallback((groupId: string, checked: boolean) => {
    const newSelection = checked 
      ? [...internalSelectedIds, groupId]
      : internalSelectedIds.filter(id => id !== groupId)
    
    setInternalSelectedIds(newSelection)
    onSelectionChange?.(newSelection)
  }, [internalSelectedIds, onSelectionChange])

  const handleRowClick = useCallback((group: GroupTableRow) => {
    router.push(`/dashboard/groups/${group.id}`)
  }, [router])

  const formatSchedule = useCallback((schedule: string) => {
    // Truncate long schedules
    if (schedule.length > 30) {
      return schedule.substring(0, 30) + '...'
    }
    return schedule
  }, [])

  // Virtual table columns
  const columns: VirtualTableColumn<GroupTableRow>[] = useMemo(() => [
    // Select column
    {
      key: 'select',
      header: (
        <Checkbox
          checked={internalSelectedIds.length === groups.length && groups.length > 0}
          onCheckedChange={handleSelectAll}
          indeterminate={internalSelectedIds.length > 0 && internalSelectedIds.length < groups.length}
        />
      ),
      width: 50,
      render: (group: GroupTableRow) => (
        <Checkbox
          checked={internalSelectedIds.includes(group.id)}
          onCheckedChange={(checked) => 
            handleSelectGroup(group.id, checked as boolean)
          }
        />
      ),
    },

    // Name column
    {
      key: 'name',
      header: getSortButton('name', 'Group Name'),
      width: 200,
      render: (group: GroupTableRow) => (
        <div>
          <div className="font-medium">{group.name}</div>
          {!group.is_active && (
            <div className="text-xs text-muted-foreground">Inactive</div>
          )}
        </div>
      ),
    },

    // Code column
    {
      key: 'code',
      header: getSortButton('group_code', 'Code'),
      width: 100,
      render: (group: GroupTableRow) => (
        <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
          {group.group_code}
        </code>
      ),
    },

    // Subject column
    {
      key: 'subject',
      header: getSortButton('subject', 'Subject'),
      width: 120,
      render: (group: GroupTableRow) => group.subject,
    },

    // Level column
    {
      key: 'level',
      header: getSortButton('level', 'Level'),
      width: 100,
      render: (group: GroupTableRow) => (
        <Badge variant="outline">{group.level}</Badge>
      ),
    },

    // Teacher column
    {
      key: 'teacher',
      header: 'Teacher',
      width: 160,
      render: (group: GroupTableRow) => 
        group.teacher_name ? <TeacherInfo name={group.teacher_name} /> : <TeacherInfo />,
    },

    // Enrollment column
    {
      key: 'enrollment',
      header: getSortButton('enrollment_percentage', 'Enrollment'),
      width: 140,
      render: (group: GroupTableRow) => (
        <EnrollmentProgress 
          current={group.current_enrollment}
          max={group.max_students}
          percentage={group.enrollment_percentage}
        />
      ),
    },

    // Schedule column
    {
      key: 'schedule',
      header: 'Schedule',
      width: 180,
      render: (group: GroupTableRow) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatSchedule(group.schedule_summary)}</span>
        </div>
      ),
    },

    // Status column
    {
      key: 'status',
      header: getSortButton('status', 'Status'),
      width: 100,
      render: (group: GroupTableRow) => (
        <StatusBadge status={group.status} />
      ),
    },

    // Start date column
    {
      key: 'start_date',
      header: getSortButton('start_date', 'Start Date'),
      width: 120,
      render: (group: GroupTableRow) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          {new Date(group.start_date).toLocaleDateString()}
        </div>
      ),
    },

    // Actions column
    {
      key: 'actions',
      header: '',
      width: 60,
      render: (group: GroupTableRow) => (
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
      ),
    },
  ], [
    groups,
    internalSelectedIds,
    sortConfig,
    getSortButton,
    handleSelectAll,
    handleSelectGroup,
    formatSchedule,
    router,
    onEdit,
    onDelete,
  ])

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <VirtualTable
        data={groups}
        columns={columns}
        height={height}
        itemHeight={60}
        loading={loading}
        getItemId={(group) => group.id}
        selectedItems={new Set(internalSelectedIds)}
        onRowClick={handleRowClick}
        emptyPlaceholder={
          <div className="text-center text-muted-foreground py-12">
            <div className="mb-4">
              <Users className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <h3 className="font-medium mb-2">No groups found</h3>
            <p className="text-sm">
              Try adjusting your search criteria or create your first group to get started
            </p>
          </div>
        }
        zebra
        stickyHeader
      />
    </motion.div>
  )
})

GroupsVirtualTable.displayName = 'GroupsVirtualTable'