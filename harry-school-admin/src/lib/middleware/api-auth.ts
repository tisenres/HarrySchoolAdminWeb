import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { UserRole } from '@/types/database'

export interface AuthContext {
  user: any
  profile: any
}

/**
 * Middleware to require authentication for API routes
 */
export async function requireAuth(): Promise<{ user: any; profile: any } | NextResponse> {
  try {
    const supabase = await createServerClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Get the user's profile with organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 401 }
      )
    }
    
    // Get organization separately if profile exists
    if (profile.organization_id) {
      const { data: organization } = await supabase
        .from('organizations')
        .select('id, name, slug, settings')
        .eq('id', profile.organization_id)
        .single()
      
      if (organization) {
        profile.organizations = organization
      }
    }
    
    return { user, profile }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

/**
 * Middleware to require specific roles for API routes
 */
export async function requireRole(requiredRoles: UserRole[]): Promise<{ user: any; profile: any } | NextResponse> {
  const authResult = await requireAuth()
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  const { profile } = authResult
  
  if (!requiredRoles.includes(profile.role)) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }
  
  return authResult
}

/**
 * Middleware for admin-only API routes
 */
export async function requireAdmin(): Promise<{ user: any; profile: any } | NextResponse> {
  return requireRole(['admin', 'superadmin'])
}

/**
 * Middleware for superadmin-only API routes
 */
export async function requireSuperadmin(): Promise<{ user: any; profile: any } | NextResponse> {
  return requireRole(['superadmin'])
}

/**
 * Wrapper function to handle authentication in API routes
 */
export function withAuth(
  handler: (request: NextRequest, context: AuthContext, ...args: any[]) => Promise<NextResponse>,
  authLevel: 'auth' | 'admin' | 'superadmin' = 'auth'
) {
  return async function(request: NextRequest, ...args: any[]): Promise<NextResponse> {
    let authResult: { user: any; profile: any } | NextResponse
    
    switch (authLevel) {
      case 'superadmin':
        authResult = await requireSuperadmin()
        break
      case 'admin':
        authResult = await requireAdmin()
        break
      default:
        authResult = await requireAuth()
        break
    }
    
    if (authResult instanceof NextResponse) {
      return authResult
    }
    
    try {
      return await handler(request, authResult, ...args)
    } catch (error) {
      console.error('API route error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}