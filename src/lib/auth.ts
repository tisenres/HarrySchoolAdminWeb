import { createServerClient } from './supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { UserRole } from '@/types/database'

/**
 * Create a Supabase client for server-side authentication
 */
export async function createAuthClient() {
  return await createServerClient()
}

/**
 * Get the current authenticated user on the server
 */
export async function getCurrentUser() {
  try {
    const supabase = await createAuthClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Get the current user's organization
 */
export async function getCurrentOrganization() {
  try {
    const profile = await getCurrentProfile()
    
    if (!profile || !profile.organizations) {
      return null
    }
    
    // Return the organization from the profile
    return Array.isArray(profile.organizations) ? profile.organizations[0] : profile.organizations
  } catch (error) {
    console.error('Error getting current organization:', error)
    return null
  }
}

/**
 * Get the current user's profile with organization and role
 */
export async function getCurrentProfile() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return null
    }
    
    const supabase = await createAuthClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        organizations (
          id,
          name,
          slug,
          settings
        )
      `)
      .eq('id', user.id)
      .is('deleted_at', null)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error getting current profile:', error)
    return null
  }
}

/**
 * Check if user has required role
 */
export async function hasRequiredRole(requiredRoles: UserRole[]): Promise<boolean> {
  try {
    const profile = await getCurrentProfile()
    
    if (!profile) {
      return false
    }
    
    return requiredRoles.includes(profile.role)
  } catch (error) {
    console.error('Error checking user role:', error)
    return false
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    )
  }
  
  return handler(request)
}

/**
 * Middleware to require specific roles
 */
export async function requireRole(
  requiredRoles: UserRole[],
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const hasRole = await hasRequiredRole(requiredRoles)
  
  if (!hasRole) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }
  
  return handler(request)
}

/**
 * Combined middleware for auth + role check
 */
export async function requireAuthAndRole(
  requiredRoles: UserRole[],
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireAuth(request, async (req) => {
    return requireRole(requiredRoles, req, handler)
  })
}

/**
 * Admin-only middleware
 */
export async function requireAdmin(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireAuthAndRole(['admin', 'superadmin'], request, handler)
}

/**
 * Superadmin-only middleware
 */
export async function requireSuperadmin(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireAuthAndRole(['superadmin'], request, handler)
}

/**
 * Initialize user profile after first login
 */
export async function initializeUserProfile(
  userId: string,
  email: string,
  fullName: string,
  organizationId?: string
) {
  try {
    const supabase = await createServerClient()
    
    // If no organization provided, this might be a superadmin
    // For now, we'll require organization assignment
    if (!organizationId) {
      throw new Error('Organization assignment required')
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        organization_id: organizationId,
        email,
        full_name: fullName,
        role: 'admin', // Default role, can be changed by superadmin
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Error initializing user profile:', error)
    throw error
  }
}

/**
 * Create invitation for new admin user
 */
export async function createAdminInvitation(
  email: string,
  fullName: string,
  organizationId: string,
  role: UserRole = 'admin'
): Promise<void> {
  try {
    // Check if current user has permission to invite
    const hasPermission = await hasRequiredRole(['admin', 'superadmin'])
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions to create invitations')
    }
    
    const supabase = await createServerClient()
    
    // Invite user via Supabase Auth
    const { data: _data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        organization_id: organizationId,
        role: role,
      }
    })
    
    if (error) {
      throw error
    }
    
    // Log the invitation
    const currentProfile = await getCurrentProfile()
    if (currentProfile) {
      await supabase.from('activity_logs').insert({
        organization_id: currentProfile.organization_id,
        user_id: currentProfile.id,
        user_email: currentProfile.email,
        user_name: currentProfile.full_name,
        user_role: currentProfile.role,
        action: 'INVITE_USER',
        resource_type: 'profiles',
        resource_name: fullName,
        description: `Invited new user: ${fullName} (${email}) with role: ${role}`,
        success: true,
      })
    }
    
  } catch (error) {
    console.error('Error creating admin invitation:', error)
    throw error
  }
}

/**
 * Revoke user access
 */
export async function revokeUserAccess(userId: string): Promise<void> {
  try {
    const hasPermission = await hasRequiredRole(['admin', 'superadmin'])
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions to revoke access')
    }
    
    const supabase = await createServerClient()
    
    // Soft delete the user profile
    const currentUser = await getCurrentUser()
    const { error } = await supabase
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: currentUser?.id || null,
      })
      .eq('id', userId)
    
    if (error) {
      throw error
    }
    
    // Optionally, you could also disable the auth user
    // This would require additional Supabase admin permissions
    
  } catch (error) {
    console.error('Error revoking user access:', error)
    throw error
  }
}

/**
 * Default export for compatibility with existing imports
 */
const auth = {
  getUser: getCurrentUser,
  getCurrentUser,
  getCurrentProfile,
  getCurrentOrganization,
  hasRequiredRole,
  requireAuth,
  requireRole,
  requireAuthAndRole,
  requireAdmin,
  requireSuperadmin
}

export default auth