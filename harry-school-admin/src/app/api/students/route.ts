import { NextRequest, NextResponse } from 'next/server'
import { StudentService } from '@/lib/services/student-service'
import { studentInsertSchema } from '@/lib/validations'
import { createStudentSchema } from '@/lib/validations/student'
import { withAuth } from '@/lib/middleware/api-auth'
import { z } from 'zod'

// GET with authentication and organization filtering
export const GET = withAuth(async (request: NextRequest, context) => {
  try {
    const searchParams = request.nextUrl.searchParams
    const { createServerClient } = await import('@/lib/supabase')
    const supabase = await createServerClient()
    
    // Get organization ID from authenticated user
    const organizationId = context.profile.organization_id
    
    // Parse pagination parameters
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'
    const query = searchParams.get('query')
    const status = searchParams.get('status')
    const gradeLevel = searchParams.get('grade_level')
    
    // Calculate range for pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    // Build query with organization filtering
    let queryBuilder = supabase
      .from('students')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
    
    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`
        first_name.ilike.%${query}%,
        last_name.ilike.%${query}%,
        full_name.ilike.%${query}%,
        email.ilike.%${query}%,
        primary_phone.ilike.%${query}%,
        student_id.ilike.%${query}%
      `)
    }
    
    if (status) {
      queryBuilder = queryBuilder.eq('enrollment_status', status)
    }
    
    if (gradeLevel) {
      queryBuilder = queryBuilder.eq('grade_level', gradeLevel)
    }
    
    // Apply sorting and pagination
    queryBuilder = queryBuilder
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to)
    
    const { data, error, count } = await queryBuilder
    
    if (error) {
      console.error('❌ Supabase Error:', error)
      throw new Error(error.message)
    }
    
    const totalPages = Math.ceil((count || 0) / limit)
    
    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: totalPages
      }
    })
  } catch (error) {
    console.error('❌ Server Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          total_pages: 0
        }
      },
      { status: 500 }
    )
  }
}, 'admin')

// POST with authentication and proper organization handling
export const POST = withAuth(async (request: NextRequest, context) => {
  const body = await request.json()
  
  try {
    // First validate using the form schema
    const formData = createStudentSchema.parse(body)
    
    // Get organization ID from authenticated user
    const organizationId = context.profile.organization_id
    
    // Transform to database schema format
    const dbData = {
      organization_id: organizationId,
      first_name: formData.first_name,
      last_name: formData.last_name,
      date_of_birth: formData.date_of_birth,
      gender: formData.gender,
      email: formData.email || undefined,
      primary_phone: formData.phone,
      enrollment_date: formData.enrollment_date,
      enrollment_status: formData.status === 'active' ? 'active' as const : 'inactive' as const,
      grade_level: formData.current_level,
      address: formData.address,
      parent_guardian_info: formData.parent_name ? [{
        name: formData.parent_name,
        relationship: 'parent',
        phone: formData.parent_phone || '',
        email: formData.parent_email || undefined,
        is_primary_contact: true
      }] : [],
      emergency_contacts: formData.emergency_contact ? [{
        name: formData.emergency_contact.name || '',
        relationship: formData.emergency_contact.relationship || '',
        phone: formData.emergency_contact.phone || '',
        email: formData.emergency_contact.email || undefined,
        address: undefined
      }] : [],
      medical_notes: formData.medical_notes,
      payment_status: formData.payment_status === 'paid' ? 'current' as const : 
                     formData.payment_status === 'pending' ? 'current' as const :
                     formData.payment_status === 'overdue' ? 'overdue' as const : 'current' as const,
      tuition_fee: formData.tuition_fee,
      notes: formData.notes,
      is_active: formData.is_active,
      created_by: context.user.id,
      updated_by: context.user.id
    }
    
    // Use server-side Supabase client with user context
    const { createServerClient } = await import('@/lib/supabase')
    const supabase = await createServerClient()
    
    // Insert into Supabase
    const { data: student, error } = await supabase
      .from('students')
      .insert({
        ...dbData,
        full_name: `${formData.first_name} ${formData.last_name}`,
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Supabase Error:', error)
      throw new Error(error.message)
    }
    
    console.log('✅ Student Created in Supabase:', student)
    
    return NextResponse.json(
      { 
        success: true,
        data: student,
        message: 'Student created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Validation Error:', error.issues)
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation error',
          details: error.issues
        },
        { status: 400 }
      )
    }
    
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

