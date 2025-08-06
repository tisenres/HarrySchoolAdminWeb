import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import profileService from '@/lib/services/profile-service'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    const supabase = createClient()

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      return NextResponse.json(
        { 
          error: authError.message,
          success: false 
        },
        { status: 401 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { 
          error: 'Authentication failed',
          success: false 
        },
        { status: 401 }
      )
    }

    // Get user profile to check role and organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .eq('deleted_at', null)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { 
          error: 'Profile not found or inactive',
          success: false 
        },
        { status: 401 }
      )
    }

    // Check if user has valid role for admin access
    if (!['superadmin', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions for admin access',
          success: false 
        },
        { status: 403 }
      )
    }

    // Update last login information
    await profileService.updateLastLogin(authData.user.id)

    // Return success with user data
    return NextResponse.json({
      data: {
        user: authData.user,
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
        session: authData.session
      },
      success: true
    })

  } catch (error: any) {
    console.error('Login error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: error.errors,
          success: false 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        success: false 
      },
      { status: 500 }
    )
  }
}