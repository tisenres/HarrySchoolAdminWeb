import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { groupUpdateSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    
    const { data: group, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        )
      }
      throw new Error(`Failed to fetch group: ${error.message}`)
    }
    
    return NextResponse.json(group)
  } catch (error) {
    console.error('Group GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch group' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = groupUpdateSchema.parse(body)
    
    const supabase = await createServerClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Update group
    const { data: group, error } = await supabase
      .from('groups')
      .update({
        ...validatedData,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        )
      }
      throw new Error(`Failed to update group: ${error.message}`)
    }
    
    return NextResponse.json(group)
  } catch (error) {
    console.error('Group PATCH error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update group' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check for active enrollments
    const { count: activeEnrollments } = await supabase
      .from('student_group_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', id)
      .eq('status', 'active')
      .is('deleted_at', null)
    
    if (activeEnrollments && activeEnrollments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete group with active student enrollments' },
        { status: 400 }
      )
    }
    
    // Soft delete group
    const { data: group, error } = await supabase
      .from('groups')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        is_active: false
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        )
      }
      throw new Error(`Failed to delete group: ${error.message}`)
    }
    
    return NextResponse.json({ success: true, data: group })
  } catch (error) {
    console.error('Group DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete group' },
      { status: 500 }
    )
  }
}