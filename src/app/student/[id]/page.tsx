'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  User,
  Calendar,
  GraduationCap,
  Mail,
  Phone,
  Loader2,
  BookOpen,
  Clock
} from 'lucide-react'
import { studentService } from '@/lib/services/student-service'
import { fadeVariants, getAnimationConfig } from '@/lib/animations'

type PublicStudentData = {
  id: string
  firstName: string
  lastName: string
  fullName: string
  enrollmentStatus: string
  currentLevel?: string
  enrollmentDate: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-500/10 text-green-600 border-green-500/20'
    case 'inactive':
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    case 'graduated':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    case 'on_hold':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return 'Active Student'
    case 'inactive':
      return 'Inactive'
    case 'graduated':
      return 'Graduated'
    case 'transferred':
      return 'Transferred'
    case 'expelled':
      return 'Expelled'
    case 'on_hold':
      return 'On Hold'
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

export default function PublicStudentPage() {
  const params = useParams()
  const studentId = params?.['id'] as string

  const [student, setStudent] = useState<PublicStudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (studentId) {
      loadStudent()
    }
  }, [studentId])

  const loadStudent = async () => {
    if (!studentId) return

    setLoading(true)
    setError(null)
    try {
      const studentData = await studentService.getByIdPublic(studentId)
      if (studentData) {
        setStudent(studentData as PublicStudentData)
      } else {
        setError('Student not found')
      }
    } catch (err) {
      console.error('Error loading student:', err)
      setError('Failed to load student profile')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#1d7452] mx-auto mb-4" />
          <p className="text-slate-600">Loading student profile...</p>
        </div>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Student Not Found</h2>
            <p className="text-slate-600 mb-6">
              {error || 'The requested student profile could not be found.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          transition={getAnimationConfig(fadeVariants)}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 bg-[#1d7452] text-white rounded-full flex items-center justify-center text-2xl font-bold">
              {getInitials(student.fullName)}
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{student.fullName}</h1>
            <Badge variant="outline" className={`${getStatusColor(student.enrollmentStatus)} font-medium`}>
              {getStatusLabel(student.enrollmentStatus)}
            </Badge>
          </div>

          {/* Student Information */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-[#1d7452]" />
                  Student Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Full Name</p>
                    <p className="font-medium">{student.fullName}</p>
                  </div>
                </div>

                {student.currentLevel && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Current Level</p>
                      <p className="font-medium">{student.currentLevel}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Enrollment Date</p>
                    <p className="font-medium">{formatDate(student.enrollmentDate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#1d7452]" />
                  Academic Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Status</p>
                    <Badge variant="outline" className={`${getStatusColor(student.enrollmentStatus)} font-medium`}>
                      {getStatusLabel(student.enrollmentStatus)}
                    </Badge>
                  </div>
                </div>

                {student.currentLevel && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Academic Level</p>
                      <p className="font-medium">{student.currentLevel}</p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-600">
                    Student since {formatDate(student.enrollmentDate)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 p-8 bg-white/50 rounded-lg">
            <p className="text-slate-600 mb-2">
              Welcome to Harry School - Your Journey of Excellence
            </p>
            <p className="text-sm text-slate-500">
              For any questions or concerns, please contact the administration office.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}