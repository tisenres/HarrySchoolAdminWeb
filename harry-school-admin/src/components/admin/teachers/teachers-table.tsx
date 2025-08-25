'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
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
  GraduationCap
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Teacher, TeacherSortConfig } from '@/types/teacher'
import { 
  fadeVariants, 
  tableRowVariants,
  educationalLoadingVariants,
  getAnimationConfig
} from '@/lib/animations'

export interface TeachersTableProps {
  teachers: Teacher[]
  onEdit: (teacher: Teacher) => void
  onDelete: (teacherId: string) => void
  onBulkDelete: (teacherIds: string[]) => void
  onBulkStatusChange?: (teacherIds: string[], status: string) => void
  onBulkArchive?: (teacherIds: string[]) => void
  onBulkRestore?: (teacherIds: string[]) => void
  onExport?: (teacherIds?: string[]) => void
  selectedTeachers: string[]
  onSelectionChange: (teacherIds: string[]) => void
  sortConfig?: TeacherSortConfig
  onSortChange?: (config: TeacherSortConfig) => void
  currentPage?: number
  totalPages?: number
  pageSize?: number
  totalCount?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  loading?: boolean
  showArchived?: boolean
}

interface ColumnConfig {
  key: keyof Teacher | 'actions' | 'select' | 'groups_count' | 'students_count'
  label: string
  sortable: boolean
  visible: boolean
  width?: string
}

const getDefaultColumns = (t: any): ColumnConfig[] => {
  // Defensive translation with fallbacks
  const getText = (key: string, fallback: string) => {
    try {
      const translated = t(`columns.${key}`)
      return translated.includes('columns.') ? fallback : translated
    } catch {
      return fallback
    }
  }

  return [
    { key: 'select', label: '', sortable: false, visible: true, width: 'w-12' },
    { key: 'full_name', label: getText('name', 'Name'), sortable: true, visible: true },
    { key: 'email', label: getText('contact', 'Contact Information'), sortable: false, visible: true },
    { key: 'employment_status', label: getText('employment', 'Employment Type'), sortable: true, visible: true },
    { key: 'specializations', label: getText('specializations', 'Specializations'), sortable: false, visible: true },
    { key: 'groups_count', label: getText('groups', 'Groups'), sortable: false, visible: true },
    { key: 'students_count', label: getText('students', 'Students'), sortable: false, visible: true },
    { key: 'is_active', label: getText('status', 'Status'), sortable: true, visible: true },
    { key: 'actions', label: '', sortable: false, visible: true, width: 'w-12' },
  ]
}

export function TeachersTable({
  teachers,
  onEdit,
  onDelete,
  onBulkDelete,
  onBulkStatusChange,
  onBulkArchive,
  onBulkRestore,
  onExport,
  selectedTeachers,
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
}: TeachersTableProps) {
  const t = useTranslations('components.teachersTable')
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(() => getDefaultColumns(t))
  const [tableDensity, setTableDensity] = useState<'comfortable' | 'compact' | 'spacious'>('comfortable')

  // Update column config when translations are ready
  useEffect(() => {
    const updatedColumns = getDefaultColumns(t)
    setColumnConfig(prev => prev.map((col, index) => ({
      ...col,
      label: updatedColumns[index]?.label || col.label
    })))
  }, [t])

  // Memoized sorted data
  const sortedTeachers = useMemo(() => {
    if (!sortConfig || !onSortChange) return teachers

    const sorted = [...teachers].sort((a, b) => {
      const aValue = a[sortConfig.field as keyof Teacher]
      const bValue = b[sortConfig.field as keyof Teacher]

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
  }, [teachers, sortConfig, onSortChange])

  const handleSort = useCallback((field: keyof Teacher) => {
    if (!onSortChange) return

    const newConfig: TeacherSortConfig = {
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
      onSelectionChange(sortedTeachers.map(t => t.id))
    } else {
      onSelectionChange([])
    }
  }, [sortedTeachers, onSelectionChange])

  const handleSelectTeacher = useCallback((teacherId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedTeachers, teacherId])
    } else {
      onSelectionChange(selectedTeachers.filter(id => id !== teacherId))
    }
  }, [selectedTeachers, onSelectionChange])

  const toggleColumnVisibility = useCallback((columnKey: string) => {
    setColumnConfig(prev => 
      prev.map(col => 
        col.key === columnKey 
          ? { ...col, visible: !col.visible }
          : col
      )
    )
  }, [])

  const getEmploymentStatusBadge = useCallback((status: string) => {
    if (!status) return null

    const variants = {
      active: 'default',
      inactive: 'secondary',
      on_leave: 'outline',
      terminated: 'destructive',
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }, [])

  const formatSpecializations = useCallback((specializations: string[]) => {
    if (specializations.length === 0) return 'None'
    if (specializations.length <= 2) return specializations.join(', ')
    return `${specializations[0]}, ${specializations[1]} +${specializations.length - 2} more`
  }, [])

  const getSortIcon = useCallback((field: string) => {
    if (!sortConfig || sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-2 opacity-50" />
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-2" />
      : <ArrowDown className="h-4 w-4 ml-2" />
  }, [sortConfig])

  const getDensityClass = useCallback(() => {
    switch (tableDensity) {
      case 'compact': return 'text-sm'
      case 'spacious': return 'text-base py-4'
      default: return ''
    }
  }, [tableDensity])

  const visibleColumns = columnConfig.filter(col => col.visible)

  // Pagination helpers
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="space-y-4">
      {/* Bulk Operations Panel */}
      <AnimatePresence>
        {selectedTeachers.length > 0 && (
          <motion.div 
            className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border border-dashed"
            {...getAnimationConfig({
              initial: "hidden",
              animate: "visible",
              exit: "exit",
              variants: fadeVariants
            })}
          >
          <span className="text-sm font-medium">
            {selectedTeachers.length} teacher{selectedTeachers.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {onBulkStatusChange && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Change Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onBulkStatusChange(selectedTeachers, 'active')}>
                    Set Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkStatusChange(selectedTeachers, 'inactive')}>
                    Set Inactive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkStatusChange(selectedTeachers, 'on_leave')}>
                    Set On Leave
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {onExport && (
              <Button variant="outline" size="sm" onClick={() => onExport(selectedTeachers)}>
                <Download className="h-4 w-4 mr-2" />
                Export Selected
              </Button>
            )}
            {onBulkArchive && !showArchived && (
              <Button variant="outline" size="sm" onClick={() => onBulkArchive(selectedTeachers)}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
            )}
            {onBulkRestore && showArchived && (
              <Button variant="outline" size="sm" onClick={() => onBulkRestore(selectedTeachers)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onBulkDelete(selectedTeachers)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {totalCount > 0 ? `${startIndex}-${endIndex} of ${totalCount}` : 'No teachers'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Page Size Selector */}
          {onPageSizeChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows:</span>
              <Select 
                value={pageSize.toString()} 
                onValueChange={(value) => onPageSizeChange(Number(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Table Density */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Table Density</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTableDensity('compact')}>
                {tableDensity === 'compact' && '✓ '}Compact
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTableDensity('comfortable')}>
                {tableDensity === 'comfortable' && '✓ '}Comfortable
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTableDensity('spacious')}>
                {tableDensity === 'spacious' && '✓ '}Spacious
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Columns</DropdownMenuLabel>
              {columnConfig
                .filter(col => col.key !== 'select' && col.key !== 'actions')
                .map(col => (
                  <DropdownMenuCheckboxItem
                    key={col.key}
                    checked={col.visible}
                    onCheckedChange={() => toggleColumnVisibility(col.key as string)}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export All */}
          {onExport && (
            <Button variant="outline" size="sm" onClick={() => onExport()}>
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((col) => {
                if (col.key === 'select') {
                  return (
                    <TableHead key={col.key} className={col.width || ''}>
                      <Checkbox
                        checked={selectedTeachers.length === sortedTeachers.length && sortedTeachers.length > 0}
                        indeterminate={selectedTeachers.length > 0 && selectedTeachers.length < sortedTeachers.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all teachers"
                      />
                    </TableHead>
                  )
                }
                if (col.key === 'actions') {
                  return (
                    <TableHead key={col.key} className={col.width || ''}>
                      <span className="sr-only">{t('actions')}</span>
                    </TableHead>
                  )
                }
                return (
                  <TableHead 
                    key={col.key} 
                    className={`${col.width || ''} ${col.sortable && onSortChange ? 'cursor-pointer hover:bg-muted/50 select-none' : ''}`}
                    onClick={col.sortable && onSortChange ? () => handleSort(col.key as keyof Teacher) : undefined}
                    role={col.sortable && onSortChange ? "button" : undefined}
                    tabIndex={col.sortable && onSortChange ? 0 : undefined}
                    onKeyDown={col.sortable && onSortChange ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSort(col.key as keyof Teacher)
                      }
                    } : undefined}
                    aria-sort={
                      sortConfig?.field === col.key 
                        ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                        : undefined
                    }
                  >
                    <div className="flex items-center">
                      {col.label}
                      {col.sortable && onSortChange && getSortIcon(col.key as string)}
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {loading ? (
                <motion.tr
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TableCell colSpan={visibleColumns.length} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <motion.div 
                        className="rounded-full h-4 w-4 border-2 border-primary border-t-transparent"
                        variants={educationalLoadingVariants}
                        animate="loading"
                      />
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        Loading teachers...
                      </motion.span>
                    </div>
                  </TableCell>
                </motion.tr>
            ) : sortedTeachers.length === 0 ? (
              <motion.tr
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-muted-foreground">
                  <motion.div 
                    className="flex flex-col items-center gap-2"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <motion.div
                      animate={{ 
                        y: [0, -4, 0],
                        rotate: [0, 2, 0, -2, 0]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <GraduationCap className="h-8 w-8 opacity-50" />
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      No teachers found.
                    </motion.p>
                    <motion.p 
                      className="text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      Create your first teacher to get started.
                    </motion.p>
                  </motion.div>
                </TableCell>
              </motion.tr>
            ) : (
              sortedTeachers.map((teacher, index) => (
                <motion.tr 
                  key={teacher.id} 
                  className={getDensityClass()}
                  custom={index}
                  variants={tableRowVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  layout
                  transition={{
                    layout: { duration: 0.2 }
                  }}
                >
                  {visibleColumns.map((col) => {
                    if (col.key === 'select') {
                      return (
                        <TableCell key={col.key}>
                          <Checkbox
                            checked={selectedTeachers.includes(teacher.id)}
                            onCheckedChange={(checked) => 
                              handleSelectTeacher(teacher.id, checked as boolean)
                            }
                            aria-label={`Select ${teacher.full_name}`}
                          />
                        </TableCell>
                      )
                    }

                    if (col.key === 'full_name') {
                      return (
                        <TableCell key={col.key}>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              {teacher.profile_image_url ? (
                                <img 
                                  src={teacher.profile_image_url} 
                                  alt={teacher.full_name}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <UserCheck className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link 
                                href={`/teachers/${teacher.id}`}
                                className="font-medium hover:underline block truncate"
                              >
                                {teacher.full_name}
                              </Link>
                              {teacher.employee_id && (
                                <p className="text-sm text-muted-foreground truncate">
                                  ID: {teacher.employee_id}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      )
                    }

                    if (col.key === 'email') {
                      return (
                        <TableCell key={col.key}>
                          <div className="space-y-1">
                            {teacher.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{teacher.email}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{teacher.phone}</span>
                            </div>
                          </div>
                        </TableCell>
                      )
                    }

                    if (col.key === 'employment_status') {
                      return (
                        <TableCell key={col.key}>
                          <div className="space-y-1">
                            {getEmploymentStatusBadge(teacher.employment_status)}
                            {teacher.contract_type && (
                              <p className="text-xs text-muted-foreground">
                                {teacher.contract_type.replace('_', ' ')}
                              </p>
                            )}
                          </div>
                        </TableCell>
                      )
                    }

                    if (col.key === 'specializations') {
                      return (
                        <TableCell key={col.key}>
                          <div className="text-sm">
                            {formatSpecializations(teacher.specializations)}
                          </div>
                        </TableCell>
                      )
                    }

                    if (col.key === 'groups_count') {
                      return (
                        <TableCell key={col.key}>
                          <div className="text-center">
                            <span className="font-medium">{(teacher as any).active_groups || 0}</span>
                          </div>
                        </TableCell>
                      )
                    }

                    if (col.key === 'students_count') {
                      return (
                        <TableCell key={col.key}>
                          <div className="text-center">
                            <span className="font-medium">{(teacher as any).total_students || 0}</span>
                          </div>
                        </TableCell>
                      )
                    }

                    if (col.key === 'is_active') {
                      return (
                        <TableCell key={col.key}>
                          <Badge variant={teacher.is_active ? 'default' : 'secondary'}>
                            {teacher.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      )
                    }

                    if (col.key === 'actions') {
                      return (
                        <TableCell key={col.key}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">{t('openMenu')} {teacher.full_name}</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/teachers/${teacher.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Profile
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEdit(teacher)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => onDelete(teacher.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )
                    }

                    // Default case for any other columns
                    return (
                      <TableCell key={col.key}>
                        <div className="text-center">
                          <span className="text-muted-foreground">-</span>
                        </div>
                      </TableCell>
                    )
                  })}
                </motion.tr>
              ))
            )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex} to {endIndex} of {totalCount} teachers
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              aria-label="Go to first page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = Number(e.target.value)
                  if (page >= 1 && page <= totalPages) {
                    onPageChange(page)
                  }
                }}
                className="w-20 text-center"
                aria-label="Current page"
              />
              <span className="text-sm text-muted-foreground">
                of {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Go to last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}