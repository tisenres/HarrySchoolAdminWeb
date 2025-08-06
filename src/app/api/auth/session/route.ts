import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json(
        { 
          error: sessionError.message,
          success: false 
        },
        { status: 500 }
      )
    }

    if (!session || !session.user) {
      return NextResponse.json(
        { 
          data: null,
          success: true 
        }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .eq('deleted_at', null)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { 
          data: null,
          success: true 
        }
      )
    }

    // Check if user has valid role for admin access
    if (!['superadmin', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { 
          data: null,
          success: true 
        }
      )
    }

    return NextResponse.json({
      data: {
        user: session.user,
        profile: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          organization_id: profile.organization_id,
          language_preference: profile.language_preference,
          timezone: profile.timezone,
          notification_preferences: profile.notification_preferences,
          avatar_url: profile.avatar_url
        },
        session
      },
      success: true
    })

  } catch (error: any) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        success: false 
      },
      { status: 500 }
    )
  }
}