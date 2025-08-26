import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authCache } from '@/lib/cache/auth-cache'
import type { UserRole } from '@/types/database'

export interface AuthContext {
  user: any
  profile: any
}

/**
 * Middleware to require authentication for API routes with caching
 */
export async function requireAuth(): Promise<{ user: any; profile: any } | NextResponse> {
  let supabase: any
  let user: any
  
  try {
    supabase = await createServerClient()
    
    // Get the current user (lightweight call)
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    user = currentUser
    
    // Try to get from cache first
    const sessionHash = user.aud + user.iat // Use audience + issued_at as session identifier
    const cached = authCache.get(user.id, sessionHash)
    
    if (cached) {
      console.log(`🎯 [AUTH-CACHE] Hit for user ${user.id}`)
      return { user: cached.user, profile: cached.profile }
    }
    
    console.log(`🔍 [AUTH-CACHE] Miss for user ${user.id} - fetching from database`)
    
    // Cache miss - fetch from database
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
    let organization = null
    if (profile.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug, settings')
        .eq('id', profile.organization_id)
        .single()
      
      if (org) {
        organization = org
        profile.organizations = org
      }
    }
    
    // Store in cache for next request
    authCache.set(user.id, { user, profile, organization }, sessionHash)
    
    return { user, profile }
  } catch (error) {
    console.error('Auth middleware error:', error)
    
    // Invalidate cache on error to prevent stale data
    if (user?.id) {
      authCache.invalidate(user.id)
    }
    
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
    console.log(`🚫 [AUTH] Access denied for user ${profile.id} with role ${profile.role}. Required: ${requiredRoles.join(', ')}`)
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