import { NextRequest, NextResponse } from 'next/server'
import { StudentService } from '@/lib/services/student-service'
import { withAuth } from '@/lib/middleware/api-auth'
import { z } from 'zod'

const statusUpdateSchema = z.object({
  status: z.string(),
  reason: z.string().optional(),
})

export const PATCH = withAuth(async (
  request: NextRequest,
  _context,
  { params }: { params: { id: string } }
) => {
  const body = await request.json()
  
  try {
    const { status, reason } = statusUpdateSchema.parse(body)
    const studentService = new StudentService()
    const student = await studentService.updateStatus(params.id, status, reason)
    
    return NextResponse.json(student)
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