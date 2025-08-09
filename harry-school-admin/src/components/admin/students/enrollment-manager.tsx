'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  Plus, 
  Minus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import type { Student } from '@/types/student'
import { fadeVariants } from '@/lib/animations'
import { ClientOnly } from '@/components/ui/client-only'

interface Group {
  id: string
  name: string
  group_code: string
  subject: string
  level: string
  teacher_name?: string
  max_students: number
  current_enrollment: number
  status: string
  start_date: string
  schedule_summary?: string
}

interface EnrollmentManagerProps {
  student: Student
  availableGroups: Group[]
  enrolledGroups: Group[]
  onEnroll: (groupId: string) => Promise<void>
  onWithdraw: (groupId: string) => Promise<void>
  loading?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EnrollmentManager({
  student,
  availableGroups,
  enrolledGroups,
  onEnroll,
  onWithdraw,
  open,
  onOpenChange,
}: EnrollmentManagerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState<string>('')
  const [filterSubject, setFilterSubject] = useState<string>('')
  const [processingGroupId, setProcessingGroupId] = useState<string | null>(null)

  const filteredGroups = availableGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.group_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.subject.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLevel = !filterLevel || group.level === filterLevel
    const matchesSubject = !filterSubject || group.subject === filterSubject
    
    return matchesSearch && matchesLevel && matchesSubject
  })

  const handleEnroll = async (groupId: string) => {
    setProcessingGroupId(groupId)
    try {
      await onEnroll(groupId)
    } finally {
      setProcessingGroupId(null)
    }
  }

  const handleWithdraw = async (groupId: string) => {
    setProcessingGroupId(groupId)
    try {
      await onWithdraw(groupId)
    } finally {
      setProcessingGroupId(null)
    }
  }

  const getEnrollmentStatus = (group: Group) => {
    const enrollmentPercentage = (group.current_enrollment / group.max_students) * 100
    if (enrollmentPercentage >= 100) return { status: 'full', color: 'text-red-600', label: 'Full' }
    if (enrollmentPercentage >= 90) return { status: 'almost-full', color: 'text-yellow-600', label: 'Almost Full' }
    return { status: 'available', color: 'text-green-600', label: 'Available' }
  }

  const subjects = Array.from(new Set(availableGroups.map(g => g.subject)))
  const levels = Array.from(new Set(availableGroups.map(g => g.level)))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Manage Group Enrollment</span>
          </DialogTitle>
          <DialogDescription>
            Manage {student.full_name}'s group enrollments. Add or remove from available groups.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          transition={{ type: "spring", stiffness: 100 }}
          className="space-y-6"
        >
          {/* Current Enrollments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Current Enrollments ({enrolledGroups.length})</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enrolledGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrolledGroups.map((group) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 border rounded-lg bg-green-50 border-green-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div>
                            <h4 className="font-medium">{group.name}</h4>
                            <p className="text-sm text-muted-foreground">{group.group_code}</p>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <Badge variant="secondary">{group.subject}</Badge>
                            <Badge variant="outline">{group.level}</Badge>
                          </div>
                          {group.teacher_name && (
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{group.teacher_name}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <ClientOnly fallback="Loading...">
                              <span>{new Date(group.start_date).toLocaleDateString()}</span>
                            </ClientOnly>
                          </div>
                          {group.schedule_summary && (
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{group.schedule_summary}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWithdraw(group.id)}
                          disabled={processingGroupId === group.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {processingGroupId === group.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Minus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No current group enrollments</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Groups */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Plus className="h-4 w-4 text-blue-600" />
                  <span>Available Groups ({filteredGroups.length})</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search groups..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All levels</SelectItem>
                    {levels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Groups List */}
              <AnimatePresence>
                {filteredGroups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredGroups.map((group, index) => {
                      const enrollmentStatus = getEnrollmentStatus(group)
                      const isEnrolled = enrolledGroups.some(eg => eg.id === group.id)
                      const canEnroll = group.current_enrollment < group.max_students && !isEnrolled
                      
                      return (
                        <motion.div
                          key={group.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 border rounded-lg ${
                            isEnrolled ? 'bg-green-50 border-green-200' :
                            canEnroll ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div>
                                <h4 className="font-medium">{group.name}</h4>
                                <p className="text-sm text-muted-foreground">{group.group_code}</p>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm">
                                <Badge variant="secondary">{group.subject}</Badge>
                                <Badge variant="outline">{group.level}</Badge>
                                <Badge 
                                  variant="outline" 
                                  className={`${enrollmentStatus.color} border-current`}
                                >
                                  {enrollmentStatus.label}
                                </Badge>
                              </div>
                              
                              {group.teacher_name && (
                                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  <span>{group.teacher_name}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Users className="h-3 w-3" />
                                  <span>{group.current_enrollment}/{group.max_students}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <ClientOnly fallback="Loading...">
                              <span>{new Date(group.start_date).toLocaleDateString()}</span>
                            </ClientOnly>
                                </div>
                              </div>
                              
                              {group.schedule_summary && (
                                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{group.schedule_summary}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="ml-4">
                              {isEnrolled ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleWithdraw(group.id)}
                                  disabled={processingGroupId === group.id}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  {processingGroupId === group.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Withdraw
                                    </>
                                  )}
                                </Button>
                              ) : canEnroll ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEnroll(group.id)}
                                  disabled={processingGroupId === group.id}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  {processingGroupId === group.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4 mr-2" />
                                      Enroll
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <div className="text-center">
                                  <AlertTriangle className="h-4 w-4 text-yellow-600 mb-1" />
                                  <p className="text-xs text-yellow-600">
                                    {group.current_enrollment >= group.max_students ? 'Full' : 'Already enrolled'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No groups match your search criteria</p>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}