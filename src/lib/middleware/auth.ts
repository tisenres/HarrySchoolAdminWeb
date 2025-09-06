import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    
    // Get the user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    // Get the user's profile to check role and organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found', success: false },
        { status: 401 }
      )
    }

    // Check if user has valid role
    if (!['superadmin', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions', success: false },
        { status: 403 }
      )
    }

    // Add user context to request headers for downstream handlers
    const requestWithAuth = new NextRequest(request, {
      headers: {
        ...request.headers,
        'x-user-id': user.id,
        'x-user-role': profile.role,
        'x-user-org': profile.organization_id,
      }
    })

    return await handler(requestWithAuth)
  } catch (error: any) {
    console.error('Auth middleware error:', error)
    return NextResponse.json(
      { error: 'Authentication failed', success: false },
      { status: 500 }
    )
  }
}

export async function withSuperAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found', success: false },
        { status: 401 }
      )
    }

    // Only superadmins can access
    if (profile.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Superadmin access required', success: false },
        { status: 403 }
      )
    }

    const requestWithAuth = new NextRequest(request, {
      headers: {
        ...request.headers,
        'x-user-id': user.id,
        'x-user-role': profile.role,
        'x-user-org': profile.organization_id,
      }
    })

    return await handler(requestWithAuth)
  } catch (error: any) {
    console.error('SuperAdmin auth middleware error:', error)
    return NextResponse.json(
      { error: 'Authentication failed', success: false },
      { status: 500 }
    )
  }
}