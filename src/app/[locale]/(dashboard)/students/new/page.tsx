'use client'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { StudentForm } from '@/components/admin/students/student-form'
import type { CreateStudentRequest } from '@/lib/validations/student'

export default function NewStudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleFormSubmit = async (data: CreateStudentRequest) => {
    setLoading(true)
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create student')
      }
      
      // Redirect to students page on success
      router.push('/students')
    } catch (error) {
      console.error('Error creating student:', error)
      // Handle error - you might want to show a toast notification here
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/students')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/students">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Add New Student</h1>
            <p className="text-muted-foreground mt-1">
              Create a new student record in the system
            </p>
          </div>
        </div>
      </div>

      {/* Use the proper StudentForm component */}
      <StudentForm
        onSubmit={handleFormSubmit}
        onCancel={handleCancel}
        loading={loading}
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            router.push('/students')
          }
        }}
      />
    </div>
  )
}