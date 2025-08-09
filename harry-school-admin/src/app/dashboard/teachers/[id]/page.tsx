'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TeacherProfile } from '@/components/admin/teachers/teacher-profile'
import { TeacherForm } from '@/components/admin/teachers/teacher-form'
import type { Teacher } from '@/types/teacher'
import type { CreateTeacherRequest } from '@/lib/validations/teacher'

export default function TeacherDetailPage() {
  const params = useParams()
  const router = useRouter()
  const teacherId = params['id'] as string
  
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)

  // Mock teacher data for demo - will be replaced with real API
  const mockTeacher: Teacher = {
    id: teacherId,
    organization_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    first_name: 'John',
    last_name: 'Smith',
    full_name: 'John Smith',
    email: 'john.smith@harryschool.uz',
    phone: '+998901234567',
    date_of_birth: new Date('1985-05-15'),
    gender: 'male',
    employee_id: 'HS2024001',
    hire_date: new Date('2024-01-15'),
    employment_status: 'active',
    contract_type: 'full_time',
    salary_amount: 8000000,
    salary_currency: 'UZS',
    qualifications: [{
      id: '1',
      degree: 'Bachelor of Arts in English Literature',
      institution: 'Oxford University',
      year: 2018,
      field_of_study: 'English Literature',
      country: 'United Kingdom'
    }],
    specializations: ['English', 'IELTS Preparation', 'Academic Writing'],
    certifications: [{
      id: '1',
      name: 'CELTA (Certificate in Teaching English to Speakers of Other Languages)',
      institution: 'Cambridge Assessment English',
      issue_date: new Date('2019-07-15'),
      credential_id: 'CELTA123456'
    }],
    languages_spoken: ['en', 'ru', 'uz'],
    address: {
      street: 'Amir Temur ko\'chasi 42',
      city: 'Tashkent',
      region: 'Toshkent shahar', 
      postal_code: '100000',
      country: 'Uzbekistan'
    },
    emergency_contact: {
      name: 'Jane Smith',
      relationship: 'spouse',
      phone: '+998901234568',
      email: 'jane.smith@email.com'
    },
    documents: [],
    notes: 'Excellent teacher with strong student engagement skills. Specializes in IELTS preparation and has consistently high pass rates. Very punctual and professional in all interactions.',
    is_active: true,
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  }

  // Load teacher data
  const loadTeacher = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      console.log('Loading teacher:', teacherId)
      setTeacher(mockTeacher)
    } catch (err) {
      console.error('Failed to load teacher:', err)
      setError('Failed to load teacher profile. Please try again.')
      setTeacher(null)
    } finally {
      setLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    if (teacherId) {
      loadTeacher()
    }
  }, [teacherId, loadTeacher])

  const handleEdit = useCallback(() => {
    setShowEditForm(true)
  }, [])

  const handleDelete = useCallback(async () => {
    try {
      console.log('Deleting teacher:', teacherId)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Navigate back to teachers list
      router.push('/dashboard/teachers')
    } catch (err) {
      console.error('Failed to delete teacher:', err)
      setError('Failed to delete teacher. Please try again.')
    }
  }, [teacherId, router])

  const handleArchive = useCallback(async () => {
    try {
      console.log('Archiving teacher:', teacherId)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Reload teacher data to show updated status
      await loadTeacher()
    } catch (err) {
      console.error('Failed to archive teacher:', err)
      setError('Failed to archive teacher. Please try again.')
    }
  }, [teacherId, loadTeacher])

  const handleRestore = useCallback(async () => {
    try {
      console.log('Restoring teacher:', teacherId)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Reload teacher data
      await loadTeacher()
    } catch (err) {
      console.error('Failed to restore teacher:', err)
      setError('Failed to restore teacher. Please try again.')
    }
  }, [teacherId, loadTeacher])

  const handleFormSubmit = useCallback(async (data: CreateTeacherRequest) => {
    try {
      console.log('Updating teacher:', teacherId, data)
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Reload teacher data and close form
      await loadTeacher()
      setShowEditForm(false)
    } catch (err) {
      console.error('Failed to update teacher:', err)
      throw new Error('Failed to update teacher. Please try again.')
    }
  }, [teacherId, loadTeacher])

  const handleFormCancel = useCallback(() => {
    setShowEditForm(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !teacher) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error || 'Teacher not found'}</p>
          <button 
            onClick={() => router.push('/dashboard/teachers')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Back to Teachers
          </button>
        </div>
      </div>
    )
  }

  if (showEditForm) {
    return (
      <TeacherForm
        teacher={teacher}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        mode="edit"
      />
    )
  }

  return (
    <TeacherProfile
      teacher={teacher}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onArchive={handleArchive}
      onRestore={handleRestore}
      loading={loading}
    />
  )
}