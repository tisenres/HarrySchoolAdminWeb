import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/api-auth'
import { getCachedTeacherStats } from '@/lib/supabase-cached'

// Enable caching for statistics
export const revalidate = 300 // Cache for 5 minutes
export const dynamic = 'force-dynamic' // Fix build error - auth routes need dynamic

export const GET = withAuth(async (request: NextRequest, context) => {
  try {
    const organizationId = context.profile.organization_id
    
    // OPTIMIZATION: Use cached teacher stats for better performance
    const stats = await getCachedTeacherStats(organizationId)()
    
    // Add cache headers
    const response = NextResponse.json({
      success: true,
      data: stats
    })
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    
    return response
  } catch (error) {
    console.error('Error fetching teacher stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch teacher stats' 
      },
      { status: 500 }
    )
  }
}, 'admin')