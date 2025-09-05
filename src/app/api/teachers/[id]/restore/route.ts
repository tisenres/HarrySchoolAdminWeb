import { NextRequest, NextResponse } from 'next/server'
import { TeacherService } from '@/lib/services/teacher-service'
import { withAuth } from '@/lib/middleware/api-auth'

export const POST = withAuth(async (
  _request: NextRequest,
  _context,
  { params }: { params: { id: string } }
) => {
  const teacherService = new TeacherService()
  const teacher = await teacherService.restore(params.id)
  
  return NextResponse.json({
    success: true,
    data: teacher,
    message: 'Teacher restored successfully',
  })
}, 'admin')