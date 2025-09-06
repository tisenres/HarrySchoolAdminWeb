import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/api-auth'
import { createServerClient } from '@/lib/supabase-server'

// Enable caching for statistics
export const revalidate = 300 // Cache for 5 minutes
export const dynamic = 'force-dynamic' // Fix build error - auth routes need dynamic

export const GET = withAuth(async (request: NextRequest, context) => {
  try {
    const supabase = await createServerClient()
    const organizationId = context.profile.organization_id
    
    // OPTIMIZED: Parallel field-specific queries instead of full table scans
    const [
      totalCount, 
      activeCount, 
      fullTimeCount, 
      partTimeCount,
      specializations
    ] = await Promise.all([
      supabase
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .is('deleted_at', null),
      supabase
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .is('deleted_at', null),
      supabase
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('employment_status', 'full_time')
        .eq('is_active', true)
        .is('deleted_at', null),
      supabase
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('employment_status', 'part_time')
        .eq('is_active', true)
        .is('deleted_at', null),
      supabase
        .from('teachers')
        .select('specializations')
        .eq('organization_id', organizationId)
        .not('specializations', 'is', null)
        .is('deleted_at', null)
    ])
    
    // Process specializations efficiently
    const uniqueSpecializations = new Set<string>()
    specializations.data?.forEach(teacher => {
      if (Array.isArray(teacher.specializations)) {
        teacher.specializations.forEach(spec => {
          if (spec && typeof spec === 'string') {
            uniqueSpecializations.add(spec)
          }
        })
      }
    })
    
    const stats = {
      total: totalCount.count || 0,
      active: activeCount.count || 0,
      full_time: fullTimeCount.count || 0,
      part_time: partTimeCount.count || 0,
      specializations: Array.from(uniqueSpecializations)
    }
    
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