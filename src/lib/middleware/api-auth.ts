import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { authCache } from '@/lib/cache/auth-cache'
import type { UserRole } from '@/types/database'
import crypto from 'crypto'

export interface AuthContext {
  user: {
    id: string
    email: string
    aud: string
    iat: number
    exp: number
  }
  profile: {
    id: string
    email: string
    full_name: string
    role: UserRole
    organization_id: string
    is_active: boolean
  }
}

/**
 * Generate cryptographically secure session identifier
 */
function generateSecureSessionHash(user: any): string {
  const data = `${user.id}:${user.email}:${user.aud}:${user.iat}:${process.env.SESSION_SECRET || 'fallback-secret'}`
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32)
}

/**
 * Middleware to require authentication for API routes with caching
 */
export async function requireAuth(request?: NextRequest): Promise<{ user: any; profile: any } | NextResponse> {
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
    
    // Try to get from cache first - use secure session hash
    const sessionHash = generateSecureSessionHash(user)
    const cached = authCache.get(user.id, sessionHash)
    
    if (cached) {
      // Cache hit - return cached data
      return { user: cached.user, profile: cached.profile }
    }
    
    // Cache miss - fetch from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      // Don't log sensitive database errors in production
      const isDev = process.env.NODE_ENV === 'development'
      if (isDev) {
        console.error('Profile fetch error:', profileError)
      }
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
    // Only log errors in development
    const isDev = process.env.NODE_ENV === 'development'
    if (isDev) {
      console.error('Auth middleware error:', error)
    }
    
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
export async function requireRole(requiredRoles: UserRole[], request?: NextRequest): Promise<{ user: any; profile: any } | NextResponse> {
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  const { profile } = authResult
  
  if (!requiredRoles.includes(profile.role)) {
    // Only log access denials in development
    const isDev = process.env.NODE_ENV === 'development'
    if (isDev) {
      console.log(`🚫 [AUTH] Access denied for user ${profile.id} with role ${profile.role}. Required: ${requiredRoles.join(', ')}`)
    }
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
export async function requireAdmin(request?: NextRequest): Promise<{ user: any; profile: any } | NextResponse> {
  return requireRole(['admin', 'superadmin'], request)
}

/**
 * Middleware for superadmin-only API routes
 */
export async function requireSuperadmin(request?: NextRequest): Promise<{ user: any; profile: any } | NextResponse> {
  return requireRole(['superadmin'], request)
}

/**
 * Multi-role authentication with student data access control
 */
export async function withMultiRoleAuth(
  handler: (request: NextRequest, context: AuthContext, ...args: any[]) => Promise<NextResponse>,
  options: {
    allowedRoles: UserRole[]
    resourceCheck?: (context: AuthContext, resourceId: string) => Promise<boolean>
  }
) {
  return async function(request: NextRequest, ...args: any[]): Promise<NextResponse> {
    const authResult = await requireAuth(request)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }
    
    const { user, profile } = authResult
    
    // Check if user has required role
    if (!options.allowedRoles.includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    // Additional resource-level check (e.g., student accessing their own data)
    if (options.resourceCheck) {
      const { pathname } = new URL(request.url)
      const resourceId = pathname.split('/').pop() || ''
      
      const hasAccess = await options.resourceCheck({ user, profile }, resourceId)
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied to this resource' },
          { status: 403 }
        )
      }
    }
    
    try {
      return await handler(request, { user, profile }, ...args)
    } catch (error) {
      const isDev = process.env.NODE_ENV === 'development'
      if (isDev) {
        console.error('API route error:', error)
      }
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
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
        authResult = await requireSuperadmin(request)
        break
      case 'admin':
        authResult = await requireAdmin(request)
        break
      default:
        authResult = await requireAuth(request)
        break
    }
    
    if (authResult instanceof NextResponse) {
      return authResult
    }
    
    try {
      return await handler(request, authResult, ...args)
    } catch (error) {
      // Only log errors in development
      const isDev = process.env.NODE_ENV === 'development'
      if (isDev) {
        console.error('API route error:', error)
      }
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}