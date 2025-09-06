import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user can only access their own organization
    if (profile.organization_id !== params.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createServerClient()
    
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', params.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Map profiles to user format
    const formattedUsers = users?.map(p => ({
      id: p.id,
      email: p.email || '',
      full_name: p.full_name || '',
      role: p.role || 'viewer',
      status: p.is_active ? 'active' : 'inactive',
      created_at: p.created_at,
      last_login: p.last_login,
    })) || []

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only superadmin can invite users
    if (profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const supabase = await createServerClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      email_confirm: true,
      user_metadata: {
        full_name: body.full_name,
      },
    })

    if (authError) throw authError

    // Create profile
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user?.id,
        email: body.email,
        full_name: body.full_name,
        organization_id: params.id,
        role: body.role || 'admin',
        is_active: true,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (profileError) throw profileError

    // Send invitation email
    await supabase.auth.admin.inviteUserByEmail(body.email)

    return NextResponse.json(newProfile, { status: 201 })
  } catch (error) {
    console.error('Error inviting user:', error)
    return NextResponse.json(
      { error: 'Failed to invite user' },
      { status: 500 }
    )
  }
}