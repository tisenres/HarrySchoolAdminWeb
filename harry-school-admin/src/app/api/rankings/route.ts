import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const userType = searchParams.get('userType') || 'all'
    const sortBy = searchParams.get('sortBy') || 'total_points'
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user session for organization filtering
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Build query
    let query = supabase
      .from('user_rankings')
      .select(`
        *,
        user:profiles!user_id(
          id,
          full_name,
          avatar_url,
          email
        )
      `)
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)

    // Apply user type filter
    if (userType !== 'all') {
      query = query.eq('user_type', userType)
    }

    // Apply search filter
    if (search) {
      const { data: searchResults } = await supabase
        .from('profiles')
        .select('id')
        .ilike('full_name', `%${search}%`)
        .eq('organization_id', profile.organization_id)

      if (searchResults && searchResults.length > 0) {
        const userIds = searchResults.map(p => p.id)
        query = query.in('user_id', userIds)
      } else {
        // No matching users found
        return NextResponse.json({
          rankings: [],
          stats: {
            total_users: 0,
            total_points: 0,
            active_achievements: 0,
            average_engagement: 0
          }
        })
      }
    }

    // Apply sorting
    const ascending = sortBy === 'name'
    query = query.order(sortBy, { ascending })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: rankings, error } = await query

    if (error) {
      console.error('Error fetching rankings:', error)
      return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 })
    }

    // Get stats
    const { data: statsData } = await supabase
      .from('user_rankings')
      .select('total_points, user_type')
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)

    const stats = {
      total_users: statsData?.length || 0,
      total_points: statsData?.reduce((sum, user) => sum + (user.total_points || 0), 0) || 0,
      students_count: statsData?.filter(user => user.user_type === 'student').length || 0,
      teachers_count: statsData?.filter(user => user.user_type === 'teacher').length || 0,
      average_engagement: statsData?.length > 0 ? 87.5 : 0 // TODO: Calculate from actual activity data
    }

    return NextResponse.json({
      rankings: rankings || [],
      stats
    })

  } catch (error) {
    console.error('Error in rankings API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}