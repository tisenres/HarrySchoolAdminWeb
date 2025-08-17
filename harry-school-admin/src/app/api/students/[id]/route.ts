import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/api-auth'
import { z } from 'zod'

// GET single student with authentication and organization filtering
export const GET = withAuth(async (
  _request: NextRequest,
  context,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { createServerClient } = await import('@/lib/supabase-server')
    const supabase = await createServerClient()
    
    // Await params in Next.js 15
    const { id } = await params
    
    // Get organization ID from authenticated user
    const organizationId = context.profile.organization_id
    
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Student not found' },
          { status: 404 }
        )
      }
      throw new Error(error.message)
    }
    
    return NextResponse.json({
      success: true,
      data: student
    })
  } catch (error) {
    console.error('❌ Server Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}, 'admin')

// UPDATE student with authentication and proper organization handling
export const PUT = withAuth(async (
  request: NextRequest,
  context,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const body = await request.json()
    const { createServerClient } = await import('@/lib/supabase-server')
    const supabase = await createServerClient()
    
    // Await params in Next.js 15
    const { id } = await params
    
    // Get organization ID from authenticated user
    const organizationId = context.profile.organization_id
    
    // Prepare update data (only include fields that are being updated)
    const updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: context.user.id
    }
    
    // Map form fields to database fields
    if (body.first_name) updateData.first_name = body.first_name
    if (body.last_name) updateData.last_name = body.last_name
    if (body.full_name) updateData.full_name = body.full_name
    if (body.date_of_birth) updateData.date_of_birth = body.date_of_birth
    if (body.gender) updateData.gender = body.gender
    if (body.phone) updateData.primary_phone = body.phone
    if (body.email !== undefined) updateData.email = body.email || null
    if (body.enrollment_date) updateData.enrollment_date = body.enrollment_date
    if (body.status) updateData.enrollment_status = body.status
    if (body.current_level) updateData.grade_level = body.current_level
    if (body.medical_notes !== undefined) updateData.medical_notes = body.medical_notes || null
    if (body.notes !== undefined) updateData.notes = body.notes || null
    if (body.payment_status) {
      updateData.payment_status = body.payment_status === 'paid' ? 'current' :
                                  body.payment_status === 'pending' ? 'current' :
                                  body.payment_status === 'overdue' ? 'overdue' : 'current'
    }
    if (body.tuition_fee !== undefined) updateData.tuition_fee = body.tuition_fee
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    
    // Update full name if first or last name changed
    if (body.first_name || body.last_name) {
      const firstName = body.first_name || ''
      const lastName = body.last_name || ''
      updateData.full_name = `${firstName} ${lastName}`.trim()
    }
    
    const { data: student, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Student not found' },
          { status: 404 }
        )
      }
      throw new Error(error.message)
    }
    
    console.log('✅ Student Updated in Supabase:', student)
    
    return NextResponse.json({
      success: true,
      data: student,
      message: 'Student updated successfully'
    })
  } catch (error) {
    console.error('❌ Server Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}, 'admin')

// DELETE student (soft delete) with authentication and proper organization handling
export const DELETE = withAuth(async (
  _request: NextRequest,
  context,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { createServerClient } = await import('@/lib/supabase-server')
    const supabase = await createServerClient()
    
    // Await params in Next.js 15
    const { id } = await params
    
    // Get organization ID from authenticated user
    const organizationId = context.profile.organization_id
    
    // Soft delete by setting deleted_at timestamp
    const { data: student, error } = await supabase
      .from('students')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        updated_by: context.user.id,
        deleted_by: context.user.id
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Student not found' },
          { status: 404 }
        )
      }
      throw new Error(error.message)
    }
    
    console.log('✅ Student Deleted (soft) in Supabase:', student)
    
    return NextResponse.json({
      success: true,
      data: student,
      message: 'Student deleted successfully'
    })
  } catch (error) {
    console.error('❌ Server Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}, 'admin')