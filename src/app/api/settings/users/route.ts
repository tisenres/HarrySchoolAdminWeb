import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'superadmin']),
  full_name: z.string().min(1, 'Full name is required').max(255)
})

const updateUserSchema = z.object({
  role: z.enum(['admin', 'superadmin']).optional(),
  full_name: z.string().min(1).max(255).optional(),
  is_active: z.boolean().optional()
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin and superadmin can view users
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createServerClient()

    let query = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        is_active,
        last_login_at,
        created_at,
        updated_at
      `)
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Apply search filter if provided
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users, error } = await query
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)

    if (countError) throw countError

    return NextResponse.json({
      users,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin and superadmin can invite users
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = inviteUserSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const { email, role, full_name } = validationResult.data

    // Only superadmin can create other superadmins
    if (role === 'superadmin' && profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only superadmin can create superadmin users' }, { status: 403 })
    }

    const supabase = await createServerClient()

    // Check if user with this email already exists in the organization
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    // For now, we'll create a profile entry. In a real implementation, you'd send an invitation
    // and the user would complete signup. This is simplified for the demo.
    
    // Generate a temporary user ID (in real implementation, this would come from auth.users)
    const tempUserId = crypto.randomUUID()

    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: tempUserId,
        email,
        full_name,
        role,
        organization_id: profile.organization_id,
        is_active: false, // Will be activated when user completes signup
        created_by: user.id,
        updated_by: user.id
      }])
      .select(`
        id,
        full_name,
        email,
        role,
        is_active,
        created_at,
        updated_at
      `)
      .single()

    if (profileError) throw profileError

    // Create default notification settings for the new user
    await supabase
      .from('user_notification_settings')
      .insert([{
        user_id: tempUserId,
        organization_id: profile.organization_id
      }])

    // Log the invitation
    await supabase.rpc('log_security_event', {
      event_type: 'user_invited',
      event_details: {
        invited_user_email: email,
        invited_user_role: role,
        invited_by: user.id
      }
    })

    return NextResponse.json({
      user: newProfile,
      message: 'User invitation sent successfully'
    })
  } catch (error) {
    console.error('Error inviting user:', error)
    return NextResponse.json(
      { error: 'Failed to invite user' },
      { status: 500 }
    )
  }
}