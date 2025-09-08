import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase-unified'

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get user using unified auth system
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    // Get user profile
    const profile = await getCurrentProfile()
    
    if (!profile) {
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
    // Get user using unified auth system
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    // Get user profile
    const profile = await getCurrentProfile()
    
    if (!profile) {
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