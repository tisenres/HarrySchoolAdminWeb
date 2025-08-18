'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
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
  CreditCard,
  UserPlus
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Student, StudentSortConfig } from '@/types/student'
import { 
  tableRowVariants,
  educationalLoadingVariants
} from '@/lib/animations'
import { ClientOnly } from '@/components/ui/client-only'
import { SkeletonTable } from '@/components/ui/skeleton-table'
import { ReferralCountBadge } from './referral-status-indicator'

export interface StudentsTableProps {
  students: Student[]
  onEdit: (student: Student) => void
  onDelete: (studentId: string) => void
  onBulkDelete: (studentIds: string[]) => void
  onBulkStatusChange?: (studentIds: string[], status: string) => void
  onBulkArchive?: (studentIds: string[]) => void
  onBulkRestore?: (studentIds: string[]) => void
  onBulkReferralAction?: (studentIds: string[], action: 'view' | 'export') => void
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
  bulkDeleteLoading?: boolean
  bulkStatusLoading?: boolean
  bulkReferralLoading?: boolean
}

interface ColumnConfig {
  key: keyof Student | 'actions' | 'select' | 'age' | 'enrolled_groups' | 'referrals'
  label: string
  sortable: boolean
  visible: boolean
  width?: string
}

const getDefaultColumns = (t: any): ColumnConfig[] => [
  { key: 'select', label: '', sortable: false, visible: true, width: 'w-12' },
  { key: 'student_id', label: t('studentsTable.columns.studentId'), sortable: true, visible: true },
  { key: 'full_name', label: t('studentsTable.columns.name'), sortable: true, visible: true },
  { key: 'age', label: t('studentsTable.columns.age'), sortable: true, visible: true },
  { key: 'phone', label: t('studentsTable.columns.contact'), sortable: false, visible: true },
  { key: 'parent_name', label: t('studentsTable.columns.parentGuardian'), sortable: true, visible: true },
  { key: 'status', label: t('studentsTable.columns.status'), sortable: true, visible: true },
  { key: 'payment_status', label: t('studentsTable.columns.payment'), sortable: true, visible: true },
  { key: 'current_level', label: t('studentsTable.columns.level'), sortable: true, visible: true },
  { key: 'enrolled_groups', label: t('studentsTable.columns.groups'), sortable: false, visible: true },
  { key: 'referrals', label: 'Referrals', sortable: false, visible: true },
  { key: 'ranking', label: t('studentsTable.columns.ranking'), sortable: true, visible: true },
  { key: 'balance', label: t('studentsTable.columns.balance'), sortable: true, visible: true },
  { key: 'enrollment_date', label: t('studentsTable.columns.enrolled'), sortable: true, visible: true },
  { key: 'actions', label: '', sortable: false, visible: true, width: 'w-12' },
]

export function StudentsTable({
  students,
  onEdit,
  onDelete,
  onBulkDelete,
  onBulkStatusChange,
  onBulkArchive,
  onBulkRestore,
  onBulkReferralAction,
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
  bulkDeleteLoading = false,
  bulkStatusLoading = false,
  bulkReferralLoading = false,
}: StudentsTableProps) {
  const t = useTranslations('students')
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(() => getDefaultColumns(t))
  const [tableDensity, setTableDensity] = useState<'comfortable' | 'compact' | 'spacious'>('comfortable')

  // Calculate age helper
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

  // Memoized sorted data
  const sortedStudents = useMemo(() => {
    if (!sortConfig || !onSortChange) return students

    const sorted = [...students].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortConfig.field) {
        case 'age':
          aValue = calculateAge(a.date_of_birth)
          bValue = calculateAge(b.date_of_birth)
          break
        case 'enrolled_groups':
          aValue = (a.groups?.length || 0)
          bValue = (b.groups?.length || 0)
          break
        default:
          aValue = a[sortConfig.field as keyof Student]
          bValue = b[sortConfig.field as keyof Student]
      }

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [students, sortConfig, onSortChange, calculateAge])

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

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      onSelectionChange(sortedStudents.map(s => s.id))
    } else {
      onSelectionChange([])
    }
  }, [sortedStudents, onSelectionChange])

  const handleSelectStudent = useCallback((studentId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedStudents, studentId])
    } else {
      onSelectionChange(selectedStudents.filter(id => id !== studentId))
    }
  }, [selectedStudents, onSelectionChange])

  const toggleColumnVisibility = useCallback((columnKey: string) => {
    setColumnConfig(prev => 
      prev.map(col => 
        col.key === columnKey 
          ? { ...col, visible: !col.visible }
          : col
      )
    )
  }, [])

  const getStatusBadge = useCallback((status: string) => {
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
  }, [])

  const getPaymentStatusBadge = useCallback((status: string) => {
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

  const visibleColumns = columnConfig.filter(col => col.visible)
  const allSelected = sortedStudents.length > 0 && selectedStudents.length === sortedStudents.length
  const someSelected = selectedStudents.length > 0 && selectedStudents.length < sortedStudents.length

  const densityClasses = {
    compact: 'py-2',
    comfortable: 'py-3',
    spacious: 'py-4',
  }

  if (loading) {
    return (
      <motion.div 
        className="space-y-4"
        variants={educationalLoadingVariants}
        initial="initial"
        animate="loading"
      >
        <SkeletonTable rows={8} columns={visibleColumns.length} />
      </motion.div>
    )
  }

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
                    <LoadingButton 
                      variant="outline" 
                      size="sm"
                      loading={bulkStatusLoading}
                      loadingText="Updating..."
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Change Status
                    </LoadingButton>
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

              {onBulkReferralAction && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <LoadingButton 
                      variant="outline" 
                      size="sm"
                      loading={bulkReferralLoading}
                      loadingText="Processing..."
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Referrals
                    </LoadingButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onBulkReferralAction(selectedStudents, 'view')}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Referral Status
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onBulkReferralAction(selectedStudents, 'export')}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Referral Data
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <LoadingButton
                variant="outline"
                size="sm"
                onClick={() => onBulkDelete(selectedStudents)}
                loading={bulkDeleteLoading}
                loadingText="Deleting..."
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </LoadingButton>
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
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Table Density</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTableDensity('compact')}>
                Compact
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTableDensity('comfortable')}>
                Comfortable
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTableDensity('spacious')}>
                Spacious
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Columns</DropdownMenuLabel>
              
              {columnConfig.filter(col => col.key !== 'select' && col.key !== 'actions').map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.key}
                  checked={column.visible}
                  onCheckedChange={() => toggleColumnVisibility(column.key)}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="border-b">
              {visibleColumns.map((column) => (
                <TableHead 
                  key={column.key} 
                  className={`${column.width || ''} ${
                    column.key === 'select' || column.key === 'actions' ? 'w-12' : ''
                  }`}
                >
                  {column.key === 'select' ? (
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  ) : column.sortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort(column.key as any)}
                    >
                      {column.label}
                      {sortConfig?.field === column.key ? (
                        sortConfig.direction === 'asc' ? (
                          <ArrowUp className="ml-2 h-3 w-3" />
                        ) : (
                          <ArrowDown className="ml-2 h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                      )}
                    </Button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="wait">
              {sortedStudents.map((student, index) => (
                <motion.tr
                  key={student.id}
                  className={`border-b hover:bg-muted/50 ${
                    selectedStudents.includes(student.id) ? 'bg-muted/30' : ''
                  }`}
                  variants={tableRowVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ 
                    type: "spring",
                    stiffness: 500,
                    damping: 50,
                    delay: index * 0.02 
                  }}
                >
                  {visibleColumns.map((column) => (
                    <TableCell 
                      key={column.key} 
                      className={`${densityClasses[tableDensity]} ${column.width || ''}`}
                    >
                      {column.key === 'select' && (
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={(checked) => 
                            handleSelectStudent(student.id, checked as boolean)
                          }
                        />
                      )}

                      {column.key === 'student_id' && (
                        <Link
                          href={`/dashboard/students/${student.id}`}
                          className="font-mono text-sm hover:underline text-primary"
                        >
                          {student.student_id}
                        </Link>
                      )}

                      {column.key === 'full_name' && (
                        <div className="flex items-center space-x-3">
                          {student.profile_image_url ? (
                            <img
                              src={student.profile_image_url}
                              alt={student.full_name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                              {student.first_name[0]}{student.last_name[0]}
                            </div>
                          )}
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
                      )}

                      {column.key === 'age' && (
                        <span className="text-sm">
                          {calculateAge(student.date_of_birth)} years
                        </span>
                      )}

                      {column.key === 'phone' && (
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
                      )}

                      {column.key === 'parent_name' && (
                        <div>
                          <div className="font-medium text-sm">
                            {student.parent_name}
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{student.parent_phone}</span>
                          </div>
                        </div>
                      )}

                      {column.key === 'status' && getStatusBadge(student.status)}

                      {column.key === 'payment_status' && getPaymentStatusBadge(student.payment_status)}

                      {column.key === 'current_level' && (
                        <span className="text-sm">{student.current_level}</span>
                      )}

                      {column.key === 'enrolled_groups' && (
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{student.groups?.length || 0}</span>
                        </div>
                      )}

                      {column.key === 'referrals' && (
                        <ReferralCountBadge 
                          studentId={student.id}
                          onClick={() => {
                            // TODO: Open referral management modal/dialog
                            console.log('View referrals for student:', student.id)
                          }}
                        />
                      )}

                      {column.key === 'ranking' && (
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <span className="text-sm font-medium text-yellow-600">
                              {Math.floor(Math.random() * 500) + 100}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            #{Math.floor(Math.random() * 50) + 1}
                          </span>
                        </div>
                      )}

                      {column.key === 'balance' && (
                        <div className={`text-sm ${student.balance > 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                          {formatBalance(student.balance)}
                        </div>
                      )}

                      {column.key === 'enrollment_date' && (
                        <span className="text-sm text-muted-foreground">
                          <ClientOnly fallback="Loading...">
                            {formatDate(student.enrollment_date)}
                          </ClientOnly>
                        </span>
                      )}

                      {column.key === 'actions' && (
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
                            <DropdownMenuItem 
                              onClick={() => {
                                // TODO: Open referral management for this student
                                console.log('Manage referrals for student:', student.id)
                              }}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              View Referrals
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
                      )}
                    </TableCell>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>

            {sortedStudents.length === 0 && (
              <TableRow>
                <TableCell 
                  colSpan={visibleColumns.length} 
                  className="h-32 text-center text-muted-foreground"
                >
                  {showArchived ? 'No archived students found.' : 'No students found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
}