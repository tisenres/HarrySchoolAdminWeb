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

    // Only admin and superadmin can view sessions
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const supabase = await createServerClient()
    
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select(`
        id,
        user_id,
        ip_address,
        user_agent,
        location,
        is_active,
        last_activity,
        expires_at,
        created_at,
        profiles!inner (
          full_name,
          email
        )
      `)
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .order('last_activity', { ascending: false })

    if (error) throw error

    // Format the response
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      user: {
        id: session.user_id,
        name: session.profiles.full_name,
        email: session.profiles.email
      },
      ip_address: session.ip_address,
      user_agent: session.user_agent,
      location: session.location,
      last_activity: session.last_activity,
      duration: calculateDuration(session.created_at, session.last_activity),
      expires_at: session.expires_at,
      created_at: session.created_at
    }))

    return NextResponse.json({ sessions: formattedSessions })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin and superadmin can terminate sessions
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const userId = searchParams.get('userId')

    const supabase = await createServerClient()

    let query = supabase
      .from('user_sessions')
      .update({ 
        is_active: false,
        expires_at: new Date().toISOString()
      })
      .eq('organization_id', profile.organization_id)

    if (sessionId) {
      // Terminate specific session
      query = query.eq('id', sessionId)
    } else if (userId) {
      // Terminate all sessions for a user
      query = query.eq('user_id', userId)
    } else {
      return NextResponse.json({ error: 'Session ID or User ID is required' }, { status: 400 })
    }

    const { error } = await query

    if (error) throw error

    // Log the session termination
    await supabase.rpc('log_security_event', {
      event_type: 'session_terminated',
      target_user_id: userId || undefined,
      event_details: {
        terminated_by: user.id,
        session_id: sessionId,
        termination_type: sessionId ? 'single' : 'all_user_sessions'
      },
      event_severity: 'warning'
    })

    return NextResponse.json({ 
      message: sessionId ? 'Session terminated successfully' : 'All user sessions terminated successfully'
    })
  } catch (error) {
    console.error('Error terminating sessions:', error)
    return NextResponse.json(
      { error: 'Failed to terminate sessions' },
      { status: 500 }
    )
  }
}

function calculateDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diffMs = end.getTime() - start.getTime()
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}