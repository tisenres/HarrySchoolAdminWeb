import { NextRequest, NextResponse } from 'next/server'
import { OptimizedTeacherService } from '@/lib/services/optimized-teacher-service'
import { createTeacherSchema } from '@/lib/validations/teacher'
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
    employment_status: searchParams.get('employment_status') || undefined,
    specializations: searchParams.get('specializations')?.split(',') || undefined,
    hire_date_from: searchParams.get('hire_date_from') || undefined,
    hire_date_to: searchParams.get('hire_date_to') || undefined,
    is_active: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
    include_counts: searchParams.get('include_counts') === 'true',
  }
  
  // Parse pagination parameters (standardized across all APIs)
  const pagination = {
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 20,
    sort_by: searchParams.get('sort_field') || 'created_at', // Accept standardized sort_field
    sort_order: (searchParams.get('sort_direction') || 'desc') as 'asc' | 'desc', // Accept standardized sort_direction
  }
  
  const teacherService = new OptimizedTeacherService()
  const result = await teacherService.getAll(search, pagination)
  
  const response = NextResponse.json(result)
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
    // Preprocess date fields from strings to Date objects
    const preprocessedBody = {
      ...body,
      hire_date: body.hire_date ? new Date(body.hire_date) : undefined,
      date_of_birth: body.date_of_birth ? new Date(body.date_of_birth) : undefined,
    }
    
    const validatedData = createTeacherSchema.parse(preprocessedBody)
    const teacherService = new OptimizedTeacherService()
    const teacher = await teacherService.create(validatedData)
    
    const response = NextResponse.json(teacher, { status: 201 })
    response.headers.set('Location', `/api/teachers/${teacher.id}`)
    
    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Teacher validation error:', error.issues)
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Teacher creation error:', error)
    throw error // Let withAuth wrapper handle the error
  }
}, 'admin'))