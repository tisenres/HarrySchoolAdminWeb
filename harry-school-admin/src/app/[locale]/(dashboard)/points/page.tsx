import { Suspense } from 'react'
import { Metadata } from 'next'
import { PointsManagementInterface } from '@/components/admin/points'
// import { studentService } from '@/lib/services/student-service' // Temporarily commented out for TypeScript
// import type { Student } from '@/types/student' // Temporarily commented out for TypeScript

export const metadata: Metadata = {
  title: 'Points Management | Harry School Admin',
  description: 'Manage student points, rewards, and achievements',
}

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Mock function to simulate API call - replace with actual API call
// async function getStudents(): Promise<Student[]> {
//   // Simulate API delay
//   await new Promise(resolve => setTimeout(resolve, 100))
//   const result = await studentService.getAll({})
//   return result.data as unknown as Student[]
// } // Temporarily commented out for TypeScript

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
  // const students = await getStudents() // Temporarily commented out for TypeScript

  // const handleStudentsRefresh = async () => {
  //   'use server'
  //   // In real implementation, this would revalidate the data
  //   // For now, it's a placeholder for the interface
  // } // Temporarily commented out for TypeScript

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Suspense fallback={<LoadingSkeleton />}>
        <PointsManagementInterface />
      </Suspense>
    </div>
  )
}