import { NextRequest, NextResponse } from 'next/server'
import { StudentService } from '@/lib/services/student-service'
import { withAuth } from '@/lib/middleware/api-auth'
import { z } from 'zod'

const enrollmentSchema = z.object({
  groupId: z.string().uuid(),
  notes: z.string().optional(),
})

const unenrollmentSchema = z.object({
  groupId: z.string().uuid(),
  reason: z.string().optional(),
})

export const GET = withAuth(async (
  _request: NextRequest,
  _context,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: studentId } = await params
  const studentService = new StudentService()
  const enrollments = await studentService.getEnrollmentHistory(studentId)
  return NextResponse.json(enrollments)
}, 'admin')

export const POST = withAuth(async (
  request: NextRequest,
  context,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: studentId } = await params
  const body = await request.json()
  
  try {
    const { groupId, notes } = enrollmentSchema.parse(body)
    const studentService = new StudentService()
    
    console.log('🔍 Enrollment context:', { 
      hasContext: !!context,
      hasUser: !!context?.user,
      hasProfile: !!context?.profile,
      userId: context?.user?.id,
      profileRole: context?.profile?.role
    })
    
    await studentService.enrollInGroup(studentId, groupId, notes, context)
    
    return NextResponse.json({ success: true, message: 'Student enrolled successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    throw error // Let withAuth wrapper handle the error
  }
}, 'admin')

export const DELETE = withAuth(async (
  request: NextRequest,
  context,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: studentId } = await params
  const body = await request.json()
  
  try {
    const { groupId, reason } = unenrollmentSchema.parse(body)
    const studentService = new StudentService()
    
    await studentService.unenrollFromGroup(studentId, groupId, reason, context)
    
    return NextResponse.json({ success: true, message: 'Student unenrolled successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    throw error // Let withAuth wrapper handle the error
  }
}, 'admin')