import { NextRequest, NextResponse } from 'next/server'
import { OptimizedStudentService } from '@/lib/services/optimized-student-service'
import { studentInsertSchema } from '@/lib/validations'
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
)(withAuth(async (request: NextRequest) => {
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
)(withAuth(async (request: NextRequest) => {
  const rawBody = await request.json()
  const body = sanitizeInput(rawBody)
  
  try {
    // Validate using the standard student schema
    const validatedData = studentInsertSchema.parse(body)
    const studentService = new OptimizedStudentService()
    const student = await studentService.create(validatedData)
    
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation error',
          details: error.issues
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}, 'admin'))

