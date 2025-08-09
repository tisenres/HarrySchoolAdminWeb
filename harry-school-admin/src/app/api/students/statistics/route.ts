import { NextRequest, NextResponse } from 'next/server'
import { StudentService } from '@/lib/services/student-service'
import { withAuth } from '@/lib/middleware/api-auth'

/**
 * GET /api/students/statistics - Get student statistics
 */
export const GET = withAuth(async (_request: NextRequest) => {
  const studentService = new StudentService()
  const statistics = await studentService.getStatistics()
  
  return NextResponse.json({
    success: true,
    data: statistics
  })
}, 'admin')