'use client'


// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ArrowLeft,
  Edit,
  Users,
  Loader2
} from 'lucide-react'
import type { Student } from '@/types/student'
import type { CreateStudentRequest } from '@/lib/validations/student'
import { StudentProfile } from '@/components/admin/students/student-profile'
import { StudentForm } from '@/components/admin/students/student-form'
import { EnrollmentManager } from '@/components/admin/students/enrollment-manager'
import { PaymentTracker } from '@/components/admin/students/payment-tracker'
import { StudentCredentials } from '@/components/admin/students/student-credentials'
import { studentService } from '@/lib/services/student-service'
import { fadeVariants, getAnimationConfig } from '@/lib/animations'

// Mock groups data for enrollment manager
const generateMockGroups = () => {
  const subjects = ['English', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science']
  const levels = ['Beginner (A1)', 'Elementary (A2)', 'Intermediate (B1)', 'Advanced (C1)']
  
  return Array.from({ length: 20 }, (_, i) => ({
    id: `group-${i + 1}`,
    name: `${subjects[i % subjects.length]} ${levels[i % levels.length]}`,
    group_code: `${subjects[i % subjects.length]!.substring(0, 3).toUpperCase()}-${levels[i % levels.length]![0]}${i + 1}`,
    subject: subjects[i % subjects.length]!,
    level: levels[i % levels.length]!,
    teacher_name: `Teacher ${i + 1}`,
    max_students: 15 + (i % 10),
    current_enrollment: Math.floor(Math.random() * 20),
    status: 'active',
    start_date: new Date(2024, i % 12, 1).toISOString(),
    schedule_summary: 'Mon, Wed, Fri 10:00-12:00'
  }))
}

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params?.['id'] as string

  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  
  // Enrollment states
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false)
  const [availableGroups] = useState(generateMockGroups())
  
  // Payment states
  const [paymentHistory] = useState([
    {
      id: '1',
      amount: 500000,
      date: new Date(2024, 11, 15).toISOString(),
      method: 'cash' as const,
      status: 'completed' as const,
      description: 'Monthly tuition payment'
    },
    {
      id: '2',
      amount: 500000,
      date: new Date(2024, 10, 15).toISOString(),
      method: 'bank_transfer' as const,
      status: 'completed' as const,
      description: 'Monthly tuition payment'
    }
  ])

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
      const studentData = await studentService.getById(studentId)
      if (studentData) {
        setStudent(studentData as any)
      } else {
        setError('Student not found')
      }
    } catch (err) {
      console.error('Error loading student:', err)
      setError('Failed to load student data')
    } finally {
      setLoading(false)
    }
  }

  const handleEditSubmit = async (data: CreateStudentRequest) => {
    if (!student) return

    setFormLoading(true)
    try {
      const updatedStudent = await studentService.update(student.id, data as any)
      setStudent(updatedStudent as any)
      setIsFormOpen(false)
    } catch (err) {
      console.error('Error updating student:', err)
    } finally {
      setFormLoading(false)
    }
  }

  const handleEnroll = async (groupId: string) => {
    if (!student) return

    try {
      // Simulate enrollment
      const updatedGroups = [...student.groups, groupId]
      const updatedStudent = await studentService.update(student.id, {
        groups: updatedGroups
      } as any)
      setStudent(updatedStudent as any)
    } catch (err) {
      console.error('Error enrolling student:', err)
    }
  }

  const handleWithdraw = async (groupId: string) => {
    if (!student) return

    try {
      // Simulate withdrawal
      const updatedGroups = student.groups.filter(id => id !== groupId)
      const updatedStudent = await studentService.update(student.id, {
        groups: updatedGroups
      } as any)
      setStudent(updatedStudent as any)
    } catch (err) {
      console.error('Error withdrawing student:', err)
    }
  }

  const handlePaymentUpdate = async (data: {
    student_id: string
    payment_status: Student['payment_status']
    balance: number
    payment_amount?: number
    payment_notes?: string
  }) => {
    if (!student) return

    try {
      const updatedStudent = await studentService.update(student.id, {
        payment_status: data.payment_status,
        balance: data.balance
      } as any)
      setStudent(updatedStudent as any)
    } catch (err) {
      console.error('Error updating payment:', err)
    }
  }

  const getEnrolledGroups = () => {
    if (!student) return []
    return availableGroups.filter(group => student.groups.includes(group.id))
  }

  const getAvailableGroups = () => {
    if (!student) return availableGroups
    return availableGroups.filter(group => !student.groups.includes(group.id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        variants={fadeVariants}
        initial="hidden"
        animate="visible"
        transition={getAnimationConfig(fadeVariants)}
        className="space-y-6"
      >
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Student Not Found</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push('/dashboard/students')}>
            Go to Students List
          </Button>
        </Card>
      </motion.div>
    )
  }

  if (!student) {
    return null
  }

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      transition={getAnimationConfig(fadeVariants)}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Student Profile</h1>
            <p className="text-muted-foreground">
              Manage {student.full_name}'s information and enrollment
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsEnrollmentOpen(true)}
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Enrollment
          </Button>
          <Button
            onClick={() => setIsFormOpen(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Student Profile */}
      <StudentProfile
        student={student}
        onEdit={() => setIsFormOpen(true)}
        loading={loading}
      />

      {/* Student Credentials */}
      <StudentCredentials
        studentId={student.id}
        studentName={student.full_name}
      />

      {/* Payment Tracker */}
      <PaymentTracker
        student={student}
        paymentHistory={paymentHistory}
        onUpdatePayment={handlePaymentUpdate}
        loading={false}
      />

      {/* Student Form Dialog */}
      <StudentForm
        student={student}
        onSubmit={handleEditSubmit}
        onCancel={() => setIsFormOpen(false)}
        loading={formLoading}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />

      {/* Enrollment Manager Dialog */}
      <EnrollmentManager
        student={student}
        availableGroups={getAvailableGroups()}
        enrolledGroups={getEnrolledGroups()}
        onEnroll={handleEnroll}
        onWithdraw={handleWithdraw}
        loading={false}
        open={isEnrollmentOpen}
        onOpenChange={setIsEnrollmentOpen}
      />
    </motion.div>
  )
}