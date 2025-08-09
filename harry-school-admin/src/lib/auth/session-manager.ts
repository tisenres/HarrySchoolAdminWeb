import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cache } from 'react'

export interface UserSession {
  id: string
  email: string
  role: 'superadmin' | 'admin' | 'viewer'
  organizationId: string
  lastActivity: Date
}

/**
 * Get the current user session (cached per request)
 */
export const getCurrentSession = cache(async (): Promise<UserSession | null> => {
  try {
    const supabase = createServerClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    // Get user profile with organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, organizations(*)')
      .eq('id', user.id)
      .single()
    
    if (!profile) {
      return null
    }
    
    return {
      id: user.id,
      email: user.email || '',
      role: profile.role || 'viewer',
      organizationId: profile.organization_id,
      lastActivity: new Date()
    }
  } catch (error) {
    console.error('Session fetch error:', error)
    return null
  }
})

/**
 * Require authentication for a page
 */
export async function requireAuth() {
  const session = await getCurrentSession()
  
  if (!session) {
    redirect('/login')
  }
  
  return session
}

/**
 * Require specific role for access
 */
export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth()
  
  if (!allowedRoles.includes(session.role)) {
    redirect('/unauthorized')
  }
  
  return session
}

/**
 * Check if user has permission for an action
 */
export async function hasPermission(action: string, resource: string): Promise<boolean> {
  const session = await getCurrentSession()
  
  if (!session) return false
  
  // Superadmin has all permissions
  if (session.role === 'superadmin') return true
  
  // Define permission matrix
  const permissions: Record<string, Record<string, string[]>> = {
    admin: {
      students: ['create', 'read', 'update', 'delete'],
      teachers: ['create', 'read', 'update', 'delete'],
      groups: ['create', 'read', 'update', 'delete'],
      finance: ['read', 'update'],
      reports: ['read']
    },
    viewer: {
      students: ['read'],
      teachers: ['read'],
      groups: ['read'],
      finance: [],
      reports: ['read']
    }
  }
  
  const rolePermissions = permissions[session.role]
  if (!rolePermissions) return false
  
  const resourcePermissions = rolePermissions[resource]
  if (!resourcePermissions) return false
  
  return resourcePermissions.includes(action)
}

/**
 * Logout user and clear session
 */
export async function logout() {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}