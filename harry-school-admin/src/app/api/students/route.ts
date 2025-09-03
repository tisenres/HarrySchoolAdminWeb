import { NextRequest, NextResponse } from 'next/server'
import { OptimizedStudentService } from '@/lib/services/optimized-student-service'
import { createStudentSchema } from '@/lib/validations/student'
import { withAuth } from '@/lib/middleware/api-auth'
import { withMiddleware, withCaching, withErrorBoundary, withPerformanceMonitoring, sanitizeInput } from '@/lib/middleware/performance'
import { z } from 'zod'

// Enable caching for GET requests
export const revalidate = 60 // Cache for 60 seconds

export const GET = withMiddleware(
  withCaching,
  withErrorBoundary,
  withPerformanceMonitoring
)(withAuth(async (request: NextRequest, context) => {
  const searchParams = request.nextUrl.searchParams
  
  // Parse search parameters
  const search: any = {
    query: searchParams.get('query') || undefined,
    enrollment_status: searchParams.get('status') || searchParams.get('enrollment_status') || undefined,
    payment_status: searchParams.get('payment_status') || undefined,
    grade: searchParams.get('grade_level') || searchParams.get('grade') || undefined,
    is_active: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
    has_debt: searchParams.get('has_debt') ? searchParams.get('has_debt') === 'true' : undefined,
    age_from: searchParams.get('age_from') ? parseInt(searchParams.get('age_from')!) : undefined,
    age_to: searchParams.get('age_to') ? parseInt(searchParams.get('age_to')!) : undefined,
    enrollment_date_from: searchParams.get('enrollment_date_from') || undefined,
    enrollment_date_to: searchParams.get('enrollment_date_to') || undefined,
    include_counts: searchParams.get('include_counts') === 'true',
  }
  
  // Parse pagination parameters (standardized across all APIs)
  const pagination = {
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 20,
    sort_by: searchParams.get('sort_field') || 'created_at', // Accept standardized sort_field
    sort_order: (searchParams.get('sort_direction') || 'desc') as 'asc' | 'desc', // Accept standardized sort_direction
  }
  
  const studentService = new OptimizedStudentService()
  // Pass authenticated context to avoid redundant auth calls
  studentService.setAuthContext(context)
  const result = await studentService.getAll(search, pagination)
  
  const response = NextResponse.json({
    success: true,
    data: result.data,
    count: result.count,
    total_pages: result.total_pages,
    pagination: {
      page: pagination.page,
      limit: result.limit,
      total: result.count,
      total_pages: result.total_pages
    }
  })
  
  response.headers.set('X-Total-Count', String(result.count || 0))
  response.headers.set('X-Page-Count', String(result.total_pages || 0))
  
  return response
}, 'admin'))

export const POST = withMiddleware(
  withErrorBoundary,
  withPerformanceMonitoring
)(withAuth(async (request: NextRequest, context) => {
  console.log('POST /api/students request received')
  const rawBody = await request.json()
  console.log('Request body:', JSON.stringify(rawBody, null, 2))
  const body = sanitizeInput(rawBody)
  
  try {
    // Validate using the form student schema that matches what frontend sends
    console.log('Validating with createStudentSchema...')
    const formData = createStudentSchema.parse(body)
    console.log('Form data validated successfully:', formData)
    
    // Transform form data to match the database student insert schema
    const transformedData = {
      // Basic information
      first_name: formData.first_name,
      last_name: formData.last_name,
      date_of_birth: formData.date_of_birth,
      gender: formData.gender,
      
      // Contact information (map form fields to database fields)
      primary_phone: formData.phone,
      email: formData.email || null,
      
      // Address - convert form address object to database format
      address: formData.address ? {
        street: formData.address.street || '',
        city: formData.address.city || '',
        region: formData.address.region || '',
        postal_code: formData.address.postal_code || '',
        country: formData.address.country || 'Uzbekistan'
      } : {},
      
      // Parent information
      parent_guardian_info: formData.parent_name || formData.parent_phone ? [{
        name: formData.parent_name || '',
        relationship: 'Parent',
        phone: formData.parent_phone || '',
        email: formData.parent_email || ''
      }] : [],
      
      // Emergency contact
      emergency_contacts: formData.emergency_contact?.name ? [{
        name: formData.emergency_contact.name,
        relationship: formData.emergency_contact.relationship || 'Emergency Contact',
        phone: formData.emergency_contact.phone || '',
        email: formData.emergency_contact.email || ''
      }] : [],
      
      // Academic information
      enrollment_date: formData.enrollment_date,
      enrollment_status: formData.status === 'active' ? 'active' : 
                        formData.status === 'inactive' ? 'inactive' :
                        formData.status === 'graduated' ? 'graduated' : 'active',
      grade_level: formData.grade_level,
      
      // Additional fields with defaults
      student_id: '', // Will be generated by service
      nationality: 'Uzbekistani',
      payment_plan: 'monthly',
      tuition_fee: formData.tuition_fee,
      payment_status: formData.payment_status === 'paid' ? 'current' :
                     formData.payment_status === 'pending' ? 'current' :
                     formData.payment_status === 'overdue' ? 'overdue' : 'current',
      
      // System fields
      profile_image_url: null,
      medical_notes: formData.medical_notes,
      notes: formData.notes,
      is_active: formData.status === 'active',
      
      // Organization will be set by service
    }
    
    console.log('Transformed data for database:', transformedData)
    
    const studentService = new OptimizedStudentService()
    // Pass authenticated context to avoid redundant auth calls
    studentService.setAuthContext(context)
    const student = await studentService.create(transformedData)
    
    const response = NextResponse.json(
      { 
        success: true,
        data: student,
        message: 'Student created successfully'
      },
      { status: 201 }
    )
    
    response.headers.set('Location', `/api/students/${student.id}`)
    
    return response
  } catch (error) {
    console.error('Error in POST /api/students:', error)
    if (error instanceof z.ZodError) {
      console.error('Validation error details:', error.issues)
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation error',
          details: error.issues
        },
        { status: 400 }
      )
    }
    
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}, 'admin'))

