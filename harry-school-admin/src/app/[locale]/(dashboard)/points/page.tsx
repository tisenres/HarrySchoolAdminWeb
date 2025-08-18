import { Suspense } from 'react'
import { Metadata } from 'next'
import { PointsManagementInterface } from '@/components/admin/points'
import { studentService } from '@/lib/services/student-service'
import type { Student } from '@/types/student'

export const metadata: Metadata = {
  title: 'Points Management | Harry School Admin',
  description: 'Manage student points, rewards, and achievements',
}

// Mock function to simulate API call - replace with actual API call
async function getStudents(): Promise<Student[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  return studentService.getStudents()
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-muted rounded"></div>
      </div>
    </div>
  )
}

export default async function PointsManagementPage() {
  const students = await getStudents()

  const handleStudentsRefresh = async () => {
    'use server'
    // In real implementation, this would revalidate the data
    // For now, it's a placeholder for the interface
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Suspense fallback={<LoadingSkeleton />}>
        <PointsManagementInterface
          students={students}
          loading={false}
          onStudentsRefresh={async () => {
            // Client-side refresh handler
            // In real implementation, this would trigger a router refresh or SWR revalidation
            console.log('Refreshing students data...')
          }}
        />
      </Suspense>
    </div>
  )
}