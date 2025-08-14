import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { auth } from '@/lib/auth'

interface LeaderboardFilters {
  group_id?: string
  time_period?: 'week' | 'month' | 'all'
  achievement_type?: string
  category?: string
  limit?: number
  offset?: number
  search?: string
}

interface LeaderboardStudent {
  student_id: string
  student_name: string
  profile_image_url?: string
  total_points: number
  current_level: number
  current_rank: number
  weekly_points: number
  monthly_points: number
  total_achievements: number
  recent_achievements: Array<{
    id: string
    name: string
    icon_name: string
    badge_color: string
    earned_at: string
  }>
  rank_change?: number // Position change from previous period
  last_activity_date?: string
}

// Optimized leaderboard query with proper indexing
async function getLeaderboardData(
  organizationId: string,
  filters: LeaderboardFilters
): Promise<{ students: LeaderboardStudent[], total_count: number }> {
  const supabase = createClient()
  
  // Base query with optimized joins and ranking calculation
  let query = supabase
    .rpc('get_optimized_leaderboard', {
      p_organization_id: organizationId,
      p_group_id: filters.group_id || null,
      p_time_period: filters.time_period || 'all',
      p_achievement_type: filters.achievement_type || null,
      p_category: filters.category || null,
      p_search: filters.search || null,
      p_limit: filters.limit || 50,
      p_offset: filters.offset || 0
    })

  const { data, error } = await query

  if (error) {
    console.error('Leaderboard query error:', error)
    throw new Error(`Failed to fetch leaderboard: ${error.message}`)
  }

  // Process results to include rank changes and format data
  const processedStudents = data?.students || []
  const totalCount = data?.total_count || 0

  return {
    students: processedStudents,
    total_count: totalCount
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get organization from user profile
    const supabase = createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const filters: LeaderboardFilters = {
      group_id: searchParams.get('group_id') || undefined,
      time_period: (searchParams.get('time_period') as 'week' | 'month' | 'all') || 'all',
      achievement_type: searchParams.get('achievement_type') || undefined,
      category: searchParams.get('category') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      search: searchParams.get('search') || undefined,
    }

    // Fetch leaderboard data with performance optimization
    const startTime = Date.now()
    const { students, total_count } = await getLeaderboardData(profile.organization_id, filters)
    const queryTime = Date.now() - startTime

    // Return data with performance metrics
    return NextResponse.json({
      success: true,
      data: {
        students,
        total_count,
        pagination: {
          current_page: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
          page_size: filters.limit || 50,
          total_pages: Math.ceil(total_count / (filters.limit || 50)),
          total_count
        },
        performance: {
          query_time_ms: queryTime,
          cached: queryTime < 100 // Simple cache detection
        }
      }
    })

  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

// Export endpoint for leaderboard data
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { format, filters } = await request.json()

    // Get organization from user profile
    const supabase = createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get full leaderboard data for export (no pagination)
    const exportFilters = { ...filters, limit: 10000, offset: 0 }
    const { students } = await getLeaderboardData(profile.organization_id, exportFilters)

    if (format === 'csv') {
      // Generate CSV format
      const csvHeaders = [
        'Rank',
        'Student Name', 
        'Total Points',
        'Current Level',
        'Weekly Points',
        'Monthly Points',
        'Total Achievements',
        'Last Activity'
      ].join(',')

      const csvRows = students.map((student, index) => [
        student.current_rank || index + 1,
        `"${student.student_name}"`,
        student.total_points,
        student.current_level,
        student.weekly_points,
        student.monthly_points,
        student.total_achievements,
        student.last_activity_date || ''
      ].join(','))

      const csvContent = [csvHeaders, ...csvRows].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="leaderboard-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 })

  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json(
      { error: 'Export failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}