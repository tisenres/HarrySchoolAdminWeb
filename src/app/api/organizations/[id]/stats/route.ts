import { NextRequest, NextResponse } from 'next/server'
import organizationService from '@/lib/services/organization-service'
import { withAuth } from '@/lib/middleware/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req) => {
    try {
      const stats = await organizationService.getUsageStats(params.id)
      
      return NextResponse.json({
        data: stats,
        success: true
      })
    } catch (error: any) {
      console.error('Organization stats GET error:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.message.includes('Unauthorized') ? 401 : 500 }
      )
    }
  })
}