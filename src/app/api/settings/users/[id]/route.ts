import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateUserSchema = z.object({
  role: z.enum(['admin', 'superadmin']).optional(),
  full_name: z.string().min(1).max(255).optional(),
  is_active: z.boolean().optional()
})

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

    // Only admin and superadmin can view user details
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const supabase = await createServerClient()

    const { data: targetUser, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        is_active,
        last_login_at,
        created_at,
        updated_at,
        created_by,
        updated_by
      `)
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(targetUser)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin and superadmin can update users
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Users cannot update themselves through this endpoint
    if (params.id === user.id) {
      return NextResponse.json({ error: 'Cannot update your own account through this endpoint' }, { status: 400 })
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = updateUserSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Only superadmin can set role to superadmin or update superadmin users
    if (updateData.role === 'superadmin' && profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only superadmin can set superadmin role' }, { status: 403 })
    }

    const supabase = await createServerClient()

    // Check if target user exists and get their current role
    const { data: targetUser, error: fetchError } = await supabase
      .from('profiles')
      .select('id, role, email, full_name')
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      throw fetchError
    }

    // Only superadmin can update other superadmin users
    if (targetUser.role === 'superadmin' && profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only superadmin can update superadmin users' }, { status: 403 })
    }

    // Update user
    const { data: updatedUser, error } = await supabase
      .from('profiles')
      .update({
        ...updateData,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
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
      .single()

    if (error) throw error

    // Log the update
    await supabase.rpc('log_security_event', {
      event_type: 'user_updated',
      target_user_id: params.id,
      event_details: {
        updated_fields: Object.keys(updateData),
        previous_values: {
          role: targetUser.role,
          full_name: targetUser.full_name
        },
        new_values: updateData,
        updated_by: user.id
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only superadmin can delete users
    if (profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only superadmin can delete users' }, { status: 403 })
    }

    // Users cannot delete themselves
    if (params.id === user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Check if target user exists
    const { data: targetUser, error: fetchError } = await supabase
      .from('profiles')
      .select('id, role, email, full_name')
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      throw fetchError
    }

    // Soft delete the user
    const { error } = await supabase
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        is_active: false
      })
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)

    if (error) throw error

    // Log the deletion
    await supabase.rpc('log_security_event', {
      event_type: 'user_deleted',
      target_user_id: params.id,
      event_details: {
        deleted_user_email: targetUser.email,
        deleted_user_role: targetUser.role,
        deleted_by: user.id
      },
      event_severity: 'warning'
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}