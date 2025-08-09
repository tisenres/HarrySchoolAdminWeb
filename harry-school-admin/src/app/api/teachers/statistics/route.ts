import { NextRequest, NextResponse } from 'next/server'
import { TeacherService } from '@/lib/services/teacher-service'
import { withAuth } from '@/lib/middleware/api-auth'

export const GET = withAuth(async (_request: NextRequest) => {
  const teacherService = new TeacherService()
  const statistics = await teacherService.getStatistics()
  
  return NextResponse.json({
    success: true,
    data: statistics,
  })
}, 'admin')