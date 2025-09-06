import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/api-auth'
import { createServerClient } from '@/lib/supabase-server'

// Enable caching for statistics
export const revalidate = 300 // Cache for 5 minutes
export const dynamic = 'force-dynamic' // Fix build error - auth routes need dynamic

/**
 * GET /api/groups/statistics - Get group statistics (OPTIMIZED)
 */
export const GET = withAuth(async (_request: NextRequest, context) => {
  try {
    const supabase = await createServerClient()
    const organizationId = context.profile.organization_id
    
    // OPTIMIZED: Parallel field-specific queries instead of full table scans
    const [
      totalCount, 
      activeCount, 
      completedCount,
      draftCount,
      archivedCount,
      subjectDistribution,
      levelDistribution
    ] = await Promise.all([
      supabase
        .from('groups')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .is('deleted_at', null),
      supabase
        .from('groups')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .is('deleted_at', null),
      supabase
        .from('groups')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'completed')
        .is('deleted_at', null),
      supabase
        .from('groups')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'draft')
        .is('deleted_at', null),
      supabase
        .from('groups')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'archived')
        .is('deleted_at', null),
      // Get subject distribution
      supabase
        .from('groups')
        .select('subject')
        .eq('organization_id', organizationId)
        .not('subject', 'is', null)
        .is('deleted_at', null),
      // Get level distribution
      supabase
        .from('groups')
        .select('level')
        .eq('organization_id', organizationId)
        .not('level', 'is', null)
        .is('deleted_at', null)
    ])
    
    // Process subject distribution efficiently
    const subjectCounts = subjectDistribution.data?.reduce((acc, group) => {
      const subject = group.subject || 'Unknown'
      acc[subject] = (acc[subject] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    // Process level distribution efficiently
    const levelCounts = levelDistribution.data?.reduce((acc, group) => {
      const level = group.level || 'Unknown'
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    const statistics = {
      total: totalCount.count || 0,
      active: activeCount.count || 0,
      completed: completedCount.count || 0,
      draft: draftCount.count || 0,
      archived: archivedCount.count || 0,
      by_subject: subjectCounts,
      by_level: levelCounts,
      subjects: Object.keys(subjectCounts),
      levels: Object.keys(levelCounts)
    }
    
    // Add cache headers
    const response = NextResponse.json({
      success: true,
      data: statistics
    })
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    
    return response
  } catch (error) {
    console.error('Error fetching group statistics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch group statistics' 
      },
      { status: 500 }
    )
  }
}, 'admin')