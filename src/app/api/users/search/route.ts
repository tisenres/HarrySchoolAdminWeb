import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check permissions
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all' // 'student', 'teacher', or 'all'
    const limit = parseInt(searchParams.get('limit') || '20')

    if (query.length < 2) {
      return NextResponse.json({ users: [] })
    }

    // Build the query
    let queryBuilder = supabase
      .from('profiles')
      .select('id, full_name, role, email, avatar_url')
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)
      .ilike('full_name', `%${query}%`)
      .limit(limit)

    // Apply role filter if specified
    if (type === 'student') {
      queryBuilder = queryBuilder.eq('role', 'student')
    } else if (type === 'teacher') {
      queryBuilder = queryBuilder.eq('role', 'teacher')
    }

    const { data: users, error: searchError } = await queryBuilder

    if (searchError) {
      console.error('Error searching users:', searchError)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    return NextResponse.json({
      users: users || [],
      total_count: users?.length || 0
    })

  } catch (error) {
    console.error('Error in user search API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}