import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin and superadmin can view security events
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const eventType = searchParams.get('eventType')
    const severity = searchParams.get('severity')
    const userId = searchParams.get('userId')

    const supabase = await createServerClient()
    
    let query = supabase
      .from('security_events')
      .select(`
        id,
        event_type,
        ip_address,
        user_agent,
        details,
        severity,
        created_at,
        user_id,
        profiles (
          full_name,
          email
        )
      `)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (eventType) {
      query = query.eq('event_type', eventType)
    }
    if (severity) {
      query = query.eq('severity', severity)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: events, error } = await query
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Get total count for pagination
    let countQuery = supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)

    if (eventType) countQuery = countQuery.eq('event_type', eventType)
    if (severity) countQuery = countQuery.eq('severity', severity)
    if (userId) countQuery = countQuery.eq('user_id', userId)

    const { count, error: countError } = await countQuery

    if (countError) throw countError

    // Format the response
    const formattedEvents = events.map(event => ({
      id: event.id,
      event_type: event.event_type,
      user: event.profiles ? {
        id: event.user_id,
        name: event.profiles.full_name,
        email: event.profiles.email
      } : null,
      ip_address: event.ip_address,
      user_agent: event.user_agent,
      details: event.details,
      severity: event.severity,
      created_at: event.created_at
    }))

    return NextResponse.json({
      events: formattedEvents,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    console.error('Error fetching security events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch security events' },
      { status: 500 }
    )
  }
}