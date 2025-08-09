import { NextRequest, NextResponse } from 'next/server'
import { GroupService } from '@/lib/services/group-service'
import { withAuth } from '@/lib/middleware/api-auth'

/**
 * GET /api/groups/statistics - Get group statistics
 */
export const GET = withAuth(async (_request: NextRequest) => {
  const groupService = new GroupService()
  const statistics = await groupService.getStatistics()
  
  return NextResponse.json({
    success: true,
    data: statistics
  })
}, 'admin')