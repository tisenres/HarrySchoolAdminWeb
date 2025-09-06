import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/api-auth'
import { createServerClient } from '@/lib/supabase-server'

// Enable caching for statistics
export const revalidate = 300 // Cache for 5 minutes
export const dynamic = 'force-dynamic' // Fix build error - auth routes need dynamic

/**
 * GET /api/students/statistics - Get student statistics (OPTIMIZED)
 */
export const GET = withAuth(async (_request: NextRequest, context) => {
  try {
    const supabase = await createServerClient()
    const organizationId = context.profile.organization_id
    
    // OPTIMIZED: Parallel field-specific queries instead of full table scans
    const [
      totalCount, 
      activeCount, 
      enrolledCount, 
      graduatedCount,
      inactiveCount,
      paymentStatusCounts
    ] = await Promise.all([
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .is('deleted_at', null),
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('enrollment_status', 'active')
        .is('deleted_at', null),
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('enrollment_status', 'enrolled')
        .is('deleted_at', null),
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('enrollment_status', 'graduated')
        .is('deleted_at', null),
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('enrollment_status', 'inactive')
        .is('deleted_at', null),
      // Get payment status distribution
      supabase
        .from('students')
        .select('payment_status')
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
    ])
    
    // Process payment status counts efficiently
    const paymentCounts = paymentStatusCounts.data?.reduce((acc, student) => {
      const status = student.payment_status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    const statistics = {
      total: totalCount.count || 0,
      active: activeCount.count || 0,
      enrolled: enrolledCount.count || 0,
      graduated: graduatedCount.count || 0,
      inactive: inactiveCount.count || 0,
      payment_status: {
        current: paymentCounts.current || 0,
        overdue: paymentCounts.overdue || 0,
        paid: paymentCounts.paid || 0,
        pending: paymentCounts.pending || 0,
        ...paymentCounts
      }
    }
    
    // Add cache headers
    const response = NextResponse.json({
      success: true,
      data: statistics
    })
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    
    return response
  } catch (error) {
    console.error('Error fetching student statistics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch student statistics' 
      },
      { status: 500 }
    )
  }
}, 'admin')