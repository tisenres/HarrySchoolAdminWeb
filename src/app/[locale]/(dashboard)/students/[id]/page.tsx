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
  const [availableGroups, setAvailableGroups] = useState([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  
  // Payment states
  const [paymentHistory, setPaymentHistory] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  useEffect(() => {
    if (studentId) {
      loadStudent()
      loadAvailableGroups()
      loadPaymentHistory()
    }
  }, [studentId])

  const loadStudent = async () => {
    if (!studentId) return

    setLoading(true)
    setError(null)
    try {
      // Use the API endpoint instead of direct service call for client-side access
      const response = await fetch(`/api/students/${studentId}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Student not found')
        } else {
          setError('Failed to load student data')
        }
        return
      }
      
      const result = await response.json()
      if (result.success && result.data) {
        // Ensure required arrays exist
        const studentData = {
          ...result.data,
          groups: result.data.groups || [],
          preferred_subjects: result.data.preferred_subjects || [],
          emergency_contacts: result.data.emergency_contacts || []
        }
        setStudent(studentData)
      } else {
        setError(result.error || 'Student not found')
      }
    } catch (err) {
      console.error('Error loading student:', err)
      setError('Failed to load student data')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableGroups = async () => {
    setGroupsLoading(true)
    try {
      const response = await fetch('/api/groups?limit=100&is_active=true')
      if (response.ok) {
        const result = await response.json()
        setAvailableGroups(result.data || [])
      }
    } catch (error) {
      console.error('Error loading groups:', error)
    } finally {
      setGroupsLoading(false)
    }
  }

  const loadPaymentHistory = async () => {
    if (!studentId) return
    
    setPaymentsLoading(true)
    try {
      const response = await fetch(`/api/students/${studentId}/payments`)
      if (response.ok) {
        const result = await response.json()
        setPaymentHistory(result.data || [])
      }
    } catch (error) {
      console.error('Error loading payment history:', error)
    } finally {
      setPaymentsLoading(false)
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

  const handleEnroll = async (groupId: string, notes?: string) => {
    if (!student) return

    try {
      const response = await fetch(`/api/students/${student.id}/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupId, notes }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to enroll student')
      }

      // Refresh student data and available groups after successful enrollment
      await loadStudent()
      await loadAvailableGroups()
    } catch (err) {
      console.error('Error enrolling student:', err)
      alert(`Failed to enroll student: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleWithdraw = async (groupId: string, reason?: string) => {
    if (!student) return

    try {
      const response = await fetch(`/api/students/${student.id}/enrollments`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupId, reason }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to withdraw student')
      }

      // Refresh student data and available groups after successful withdrawal
      await loadStudent()
      await loadAvailableGroups()
    } catch (err) {
      console.error('Error withdrawing student:', err)
      alert(`Failed to withdraw student: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
    if (!student || !student.groups) return []
    return availableGroups.filter(group => student.groups.includes(group.id))
  }

  const getAvailableGroups = () => {
    if (!student || !student.groups) return availableGroups
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
        loading={paymentsLoading}
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
        loading={groupsLoading}
        open={isEnrollmentOpen}
        onOpenChange={setIsEnrollmentOpen}
      />
    </motion.div>
  )
}