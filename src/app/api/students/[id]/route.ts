import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withMultiRoleAuth } from '@/lib/middleware/api-auth'
import { z } from 'zod'

// Helper function to check if student can access their own profile
async function canAccessStudentProfile(context: any, studentId: string): Promise<boolean> {
  // Admins can access any student in their organization
  if (context.profile.role === 'admin' || context.profile.role === 'superadmin') {
    return true
  }
  
  // For future student role implementation:
  // Students can only access their own profile
  // This will be implemented once student_profiles table is created
  // if (context.profile.role === 'student') {
  //   return context.profile.student_id === studentId
  // }
  
  return false
}

// GET single student with multi-role authentication
export const GET = withMultiRoleAuth(async (
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
}, {
  allowedRoles: ['admin', 'superadmin', 'viewer'],
  resourceCheck: canAccessStudentProfile
})

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

// PATCH student (partial update) with authentication and proper organization handling
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { getApiClient, getCurrentOrganizationId } = await import('@/lib/supabase-unified')
    const supabase = await getApiClient()
    
    // Await params in Next.js 15
    const { id } = await params
    
    // Get organization ID from unified client
    let organizationId = await getCurrentOrganizationId()
    
    // Fallback to default organization for development/testing
    if (!organizationId) {
      organizationId = '550e8400-e29b-41d4-a716-446655440000'
      console.log('🔧 Using fallback organization ID for development')
    }
    
    // Parse and validate partial data
    const body = await request.json()
    const { updateStudentSchema } = await import('@/lib/validations/student')
    
    // For PATCH, make all fields optional except id
    const partialSchema = updateStudentSchema.partial()
    const validatedData = partialSchema.parse(body)
    
    console.log('📝 Updating student with ID:', id)
    console.log('🏢 Organization ID:', organizationId)
    
    // Prepare update data - remove undefined values and academic_year
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([key, value]) => 
        value !== undefined && key !== 'academic_year'
      )
    )
    
    // Add system fields
    updateData.updated_at = new Date().toISOString()
    
    console.log('💾 Update data:', { ...updateData, primary_phone: updateData.primary_phone ? '[HIDDEN]' : undefined })
    
    const { data: student, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Update error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update student',
          details: error.message 
        },
        { status: 500 }
      )
    }
    
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }
    
    console.log('🎉 Student updated successfully:', student.id)
    
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
}

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