'use client'

import { useMemo, useCallback, memo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  UserCheck, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Settings2,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Archive,
  RotateCcw,
  GraduationCap,
  Users,
  CreditCard
} from 'lucide-react'
import { VirtualTable, VirtualTableColumn } from '@/components/ui/virtual-table'
import type { Student, StudentSortConfig } from '@/types/student'
import { ClientOnly } from '@/components/ui/client-only'

export interface StudentsVirtualTableProps {
  students: Student[]
  onEdit: (student: Student) => void
  onDelete: (studentId: string) => void
  onBulkDelete: (studentIds: string[]) => void
  onBulkStatusChange?: (studentIds: string[], status: string) => void
  onBulkArchive?: (studentIds: string[]) => void
  onBulkRestore?: (studentIds: string[]) => void
  onExport?: (studentIds?: string[]) => void
  selectedStudents: string[]
  onSelectionChange: (studentIds: string[]) => void
  sortConfig?: StudentSortConfig
  onSortChange?: (config: StudentSortConfig) => void
  currentPage?: number
  totalPages?: number
  pageSize?: number
  totalCount?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  loading?: boolean
  showArchived?: boolean
  height?: number
}

// Memoized components for performance
const StudentAvatar = memo<{ student: Student }>(({ student }) => (
  student.profile_image_url ? (
    <Image
      src={student.profile_image_url}
      alt={student.full_name}
      width={32}
      height={32}
      className="rounded-full object-cover"
      loading="lazy"
    />
  ) : (
    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
      {student.first_name[0]}{student.last_name[0]}
    </div>
  )
))

StudentAvatar.displayName = 'StudentAvatar'

const StatusBadge = memo<{ status: string }>(({ status }) => {
  if (!status) return null

  const variants = {
    active: 'default',
    inactive: 'secondary',
    graduated: 'default',
    suspended: 'destructive',
    dropped: 'outline',
  } as const

  const colors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    graduated: 'bg-blue-100 text-blue-800 border-blue-200',
    suspended: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    dropped: 'bg-red-100 text-red-800 border-red-200',
  } as const

  return (
    <Badge 
      variant={variants[status as keyof typeof variants] || 'secondary'}
      className={`capitalize ${colors[status as keyof typeof colors] || ''}`}
    >
      {status}
    </Badge>
  )
})

StatusBadge.displayName = 'StatusBadge'

const PaymentStatusBadge = memo<{ status: string }>(({ status }) => {
  if (!status) return null

  const colors = {
    paid: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    overdue: 'bg-red-100 text-red-800 border-red-200',
    partial: 'bg-orange-100 text-orange-800 border-orange-200',
  } as const

  const icons = {
    paid: '✓',
    pending: '⏳',
    overdue: '❌',
    partial: '⚠️',
  } as const

  return (
    <Badge 
      variant="outline"
      className={`capitalize ${colors[status as keyof typeof colors] || ''}`}
    >
      <span className="mr-1">{icons[status as keyof typeof icons]}</span>
      {status}
    </Badge>
  )
})

PaymentStatusBadge.displayName = 'PaymentStatusBadge'

export const StudentsVirtualTable = memo<StudentsVirtualTableProps>(({
  students,
  onEdit,
  onDelete,
  onBulkDelete,
  onBulkStatusChange,
  onBulkArchive,
  onBulkRestore,
  onExport,
  selectedStudents,
  onSelectionChange,
  sortConfig,
  onSortChange,
  currentPage = 1,
  totalPages = 1,
  pageSize = 20,
  totalCount = 0,
  onPageChange,
  onPageSizeChange,
  loading = false,
  showArchived = false,
  height = 600,
}) => {
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    select: true,
    student_id: true,
    full_name: true,
    age: true,
    contact: true,
    parent: true,
    status: true,
    payment_status: true,
    level: true,
    groups: true,
    balance: true,
    enrolled_date: true,
    actions: true,
  })

  // Helper functions
  const calculateAge = useCallback((birthDate: string): number => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }, [])

  const formatBalance = useCallback((balance: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(balance)
  }, [])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  // Selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      onSelectionChange(students.map(s => s.id))
    } else {
      onSelectionChange([])
    }
  }, [students, onSelectionChange])

  const handleSelectStudent = useCallback((studentId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedStudents, studentId])
    } else {
      onSelectionChange(selectedStudents.filter(id => id !== studentId))
    }
  }, [selectedStudents, onSelectionChange])

  // Sort handler
  const handleSort = useCallback((field: keyof Student | 'age' | 'enrolled_groups') => {
    if (!onSortChange) return

    const newConfig: StudentSortConfig = {
      field: field as any,
      direction: 
        sortConfig?.field === field && sortConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc'
    }
    onSortChange(newConfig)
  }, [sortConfig, onSortChange])

  // Virtual table columns
  const columns: VirtualTableColumn<Student>[] = useMemo(() => [
    // Select column
    {
      key: 'select',
      header: (
        <Checkbox
          checked={students.length > 0 && selectedStudents.length === students.length}
          indeterminate={selectedStudents.length > 0 && selectedStudents.length < students.length}
          onCheckedChange={handleSelectAll}
        />
      ),
      width: 50,
      render: (student: Student) => (
        <Checkbox
          checked={selectedStudents.includes(student.id)}
          onCheckedChange={(checked) => 
            handleSelectStudent(student.id, checked as boolean)
          }
        />
      ),
    },

    // Student ID column
    {
      key: 'student_id',
      header: (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 font-medium"
          onClick={() => handleSort('student_id')}
        >
          Student ID
          {sortConfig?.field === 'student_id' ? (
            sortConfig.direction === 'asc' ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : (
              <ArrowDown className="ml-2 h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
          )}
        </Button>
      ),
      width: 120,
      render: (student: Student) => (
        <Link
          href={`/dashboard/students/${student.id}`}
          className="font-mono text-sm hover:underline text-primary"
        >
          {student.student_id}
        </Link>
      ),
    },

    // Full name column
    {
      key: 'full_name',
      header: (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 font-medium"
          onClick={() => handleSort('full_name')}
        >
          Name
          {sortConfig?.field === 'full_name' ? (
            sortConfig.direction === 'asc' ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : (
              <ArrowDown className="ml-2 h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
          )}
        </Button>
      ),
      width: 200,
      render: (student: Student) => (
        <div className="flex items-center space-x-3">
          <StudentAvatar student={student} />
          <div>
            <Link
              href={`/dashboard/students/${student.id}`}
              className="font-medium hover:underline text-foreground"
            >
              {student.full_name}
            </Link>
            <div className="text-xs text-muted-foreground">
              {student.current_level}
            </div>
          </div>
        </div>
      ),
    },

    // Age column
    {
      key: 'age',
      header: (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 font-medium"
          onClick={() => handleSort('age')}
        >
          Age
          {sortConfig?.field === 'age' ? (
            sortConfig.direction === 'asc' ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : (
              <ArrowDown className="ml-2 h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
          )}
        </Button>
      ),
      width: 80,
      render: (student: Student) => (
        <span className="text-sm">
          {calculateAge(student.date_of_birth)} years
        </span>
      ),
    },

    // Contact column
    {
      key: 'contact',
      header: 'Contact',
      width: 180,
      render: (student: Student) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-1 text-sm">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span>{student.phone}</span>
          </div>
          {student.email && (
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-32">{student.email}</span>
            </div>
          )}
        </div>
      ),
    },

    // Parent column
    {
      key: 'parent',
      header: 'Parent/Guardian',
      width: 160,
      render: (student: Student) => (
        <div>
          <div className="font-medium text-sm">
            {student.parent_name}
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{student.parent_phone}</span>
          </div>
        </div>
      ),
    },

    // Status column
    {
      key: 'status',
      header: (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 font-medium"
          onClick={() => handleSort('status')}
        >
          Status
          {sortConfig?.field === 'status' ? (
            sortConfig.direction === 'asc' ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : (
              <ArrowDown className="ml-2 h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
          )}
        </Button>
      ),
      width: 100,
      render: (student: Student) => <StatusBadge status={student.status} />,
    },

    // Payment status column
    {
      key: 'payment_status',
      header: (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 font-medium"
          onClick={() => handleSort('payment_status')}
        >
          Payment
          {sortConfig?.field === 'payment_status' ? (
            sortConfig.direction === 'asc' ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : (
              <ArrowDown className="ml-2 h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
          )}
        </Button>
      ),
      width: 120,
      render: (student: Student) => <PaymentStatusBadge status={student.payment_status} />,
    },

    // Groups column
    {
      key: 'groups',
      header: 'Groups',
      width: 80,
      render: (student: Student) => (
        <div className="flex items-center space-x-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{student.groups?.length || 0}</span>
        </div>
      ),
    },

    // Balance column
    {
      key: 'balance',
      header: (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 font-medium"
          onClick={() => handleSort('balance')}
        >
          Balance
          {sortConfig?.field === 'balance' ? (
            sortConfig.direction === 'asc' ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : (
              <ArrowDown className="ml-2 h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
          )}
        </Button>
      ),
      width: 120,
      render: (student: Student) => (
        <div className={`text-sm ${student.balance > 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
          {formatBalance(student.balance)}
        </div>
      ),
    },

    // Enrollment date column
    {
      key: 'enrolled_date',
      header: (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 font-medium"
          onClick={() => handleSort('enrollment_date')}
        >
          Enrolled
          {sortConfig?.field === 'enrollment_date' ? (
            sortConfig.direction === 'asc' ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : (
              <ArrowDown className="ml-2 h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
          )}
        </Button>
      ),
      width: 120,
      render: (student: Student) => (
        <span className="text-sm text-muted-foreground">
          <ClientOnly fallback="Loading...">
            {formatDate(student.enrollment_date)}
          </ClientOnly>
        </span>
      ),
    },

    // Actions column
    {
      key: 'actions',
      header: '',
      width: 60,
      render: (student: Student) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/students/${student.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(student)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Student
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {student.balance > 0 && (
              <DropdownMenuItem>
                <CreditCard className="mr-2 h-4 w-4" />
                Process Payment
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Users className="mr-2 h-4 w-4" />
              Manage Enrollment
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(student.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Student
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ].filter(col => columnVisibility[col.key] !== false), [
    students,
    selectedStudents,
    sortConfig,
    handleSelectAll,
    handleSelectStudent,
    handleSort,
    calculateAge,
    formatBalance,
    formatDate,
    onEdit,
    onDelete,
    columnVisibility,
  ])

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {selectedStudents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <span className="text-sm text-muted-foreground">
                {selectedStudents.length} selected
              </span>
              
              {onBulkStatusChange && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <UserCheck className="h-4 w-4 mr-2" />
                      Change Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onBulkStatusChange(selectedStudents, 'active')}>
                      Active
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onBulkStatusChange(selectedStudents, 'inactive')}>
                      Inactive
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onBulkStatusChange(selectedStudents, 'suspended')}>
                      Suspended
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onBulkStatusChange(selectedStudents, 'graduated')}>
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Graduated
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {onBulkArchive && !showArchived && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkArchive(selectedStudents)}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              )}

              {onBulkRestore && showArchived && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkRestore(selectedStudents)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkDelete(selectedStudents)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </motion.div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport(selectedStudents.length > 0 ? selectedStudents : undefined)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
              {Object.entries(columnVisibility).map(([key, visible]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={visible}
                  onCheckedChange={(checked) => 
                    setColumnVisibility(prev => ({ ...prev, [key]: checked }))
                  }
                >
                  {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Virtual Table */}
      <VirtualTable
        data={students}
        columns={columns}
        height={height}
        itemHeight={64}
        loading={loading}
        getItemId={(student) => student.id}
        selectedItems={new Set(selectedStudents)}
        emptyPlaceholder={
          <div className="text-center text-muted-foreground py-12">
            <div className="mb-4">
              <Users className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <h3 className="font-medium mb-2">No students found</h3>
            <p className="text-sm">
              {showArchived ? 'No archived students found.' : 'No students match your current filters.'}
            </p>
          </div>
        }
        zebra
        stickyHeader
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} students
          </div>
          
          <div className="flex items-center space-x-2">
            {onPageSizeChange && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => onPageSizeChange(parseInt(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-1">
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value)
                    if (page >= 1 && page <= totalPages) {
                      onPageChange?.(page)
                    }
                  }}
                  className="w-16 text-center"
                />
                <span className="text-sm text-muted-foreground">
                  of {totalPages}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
})

StudentsVirtualTable.displayName = 'StudentsVirtualTable'