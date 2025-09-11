'use client'

import { useMemo, useCallback, memo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import type { Student, StudentSortConfig } from '@/types/student'
import { ClientOnly } from '@/components/ui/client-only'

export interface StudentsVirtualTableProps {
  students: Student[]
  onEdit: (student: Student) => void
  onDelete: (studentId: string) => void
  onBulkDelete: (studentIds: string[]) => void
  selectedStudents: string[]
  onSelectionChange: (studentIds: string[]) => void
  sortConfig?: StudentSortConfig
  onSortChange?: (config: StudentSortConfig) => void
  loading?: boolean
}

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

  const colors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    graduated: 'bg-blue-100 text-blue-800 border-blue-200',
    suspended: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    dropped: 'bg-red-100 text-red-800 border-red-200',
  } as const

  return (
    <Badge 
      variant="outline"
      className={`capitalize ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
    >
      {status}
    </Badge>
  )
})

StatusBadge.displayName = 'StatusBadge'

const PaymentStatusBadge = memo<{ status: string }>(({ status }) => {
  if (!status) return null

  const colors = {
    current: 'bg-green-100 text-green-800 border-green-200',
    overdue: 'bg-red-100 text-red-800 border-red-200',
  } as const

  const icons = {
    current: '✓',
    overdue: '❌',
  } as const

  return (
    <Badge 
      variant="outline"
      className={`capitalize ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
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
  selectedStudents,
  onSelectionChange,
  sortConfig,
  onSortChange,
  loading = false,
}) => {
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

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

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

  const handleSort = useCallback((field: keyof Student | 'age') => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="space-y-3">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center border-b border-border/40 animate-pulse">
              {Array.from({ length: 5 }, (_, j) => (
                <div key={j} className="flex-1 px-3 py-2">
                  <div className="h-4 bg-muted/60 rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!students || students.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-muted-foreground">
          <div className="mb-4">
            <Users className="h-12 w-12 mx-auto opacity-50" />
          </div>
          <h3 className="font-medium mb-2">No students found</h3>
          <p className="text-sm">
            No students match your current filters.
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="border rounded-lg bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b bg-muted/30 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 text-left">
                  <Checkbox
                    checked={students.length > 0 && selectedStudents.length === students.length}
                    indeterminate={selectedStudents.length > 0 && selectedStudents.length < students.length}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="px-3 py-3 text-left">
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
                </th>
                <th className="px-3 py-3 text-left">
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
                </th>
                <th className="px-3 py-3 text-left">Age</th>
                <th className="px-3 py-3 text-left">Contact</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-left">Payment</th>
                <th className="px-3 py-3 text-left">Enrolled</th>
                <th className="px-3 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => {
                const isSelected = selectedStudents.includes(student.id)
                const isEven = index % 2 === 0
                return (
                  <tr
                    key={student.id}
                    className={`border-b border-border/40 transition-colors duration-150 ${
                      isSelected ? 'bg-muted/30' : ''
                    } ${isEven ? 'bg-muted/10' : ''} hover:bg-muted/50`}
                  >
                    <td className="px-3 py-2">
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => 
                          handleSelectStudent(student.id, checked as boolean)
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/students/${student.id}`}
                        className="font-mono text-sm hover:underline text-primary"
                      >
                        {student.student_id}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center space-x-3">
                        <StudentAvatar student={student} />
                        <div>
                          <Link
                            href={`/students/${student.id}`}
                            className="font-medium hover:underline text-foreground"
                          >
                            {student.full_name}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            Level {student.current_level}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {calculateAge(student.date_of_birth)} years
                    </td>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{student.primary_phone}</span>
                        </div>
                        {student.email && (
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-32">{student.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={student.enrollment_status} />
                    </td>
                    <td className="px-3 py-2">
                      <PaymentStatusBadge status={student.payment_status} />
                    </td>
                    <td className="px-3 py-2 text-sm text-muted-foreground">
                      <ClientOnly fallback="Loading...">
                        {formatDate(student.enrollment_date)}
                      </ClientOnly>
                    </td>
                    <td className="px-3 py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/students/${student.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(student)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Student
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              alert(`Manage enrollment for ${student.full_name} - Feature coming soon!`)
                            }}
                          >
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
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
})

StudentsVirtualTable.displayName = 'StudentsVirtualTable'