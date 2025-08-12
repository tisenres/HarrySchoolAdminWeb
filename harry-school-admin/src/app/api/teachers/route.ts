import { NextRequest, NextResponse } from 'next/server'
import { TeacherService } from '@/lib/services/teacher-service'
import { teacherInsertSchema } from '@/lib/validations'
import { withAuth } from '@/lib/middleware/api-auth'
import { createServerClient } from '@/lib/supabase-server'
import { z } from 'zod'

export const GET = withAuth(async (request: NextRequest, context) => {
  const searchParams = request.nextUrl.searchParams
  
  // Parse search parameters
  const search: any = {
    query: searchParams.get('query') || undefined,
    employment_status: searchParams.get('employment_status') || undefined,
    specializations: searchParams.get('specializations')?.split(',') || undefined,
    hire_date_from: searchParams.get('hire_date_from') || undefined,
    hire_date_to: searchParams.get('hire_date_to') || undefined,
    is_active: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
  }
  
  // Parse pagination parameters
  const pagination = {
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 20,
    sort_by: searchParams.get('sort_by') || 'created_at',
    sort_order: (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc',
  }
  
  // Use the authenticated supabase client from withAuth middleware
  const supabase = await createServerClient()
  const teacherService = new TeacherService('teachers', () => Promise.resolve(supabase))
  const result = await teacherService.getAll(search, pagination)
  
  return NextResponse.json(result)
}, 'admin')

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  
  try {
    const validatedData = teacherInsertSchema.parse(body)
    const teacherService = new TeacherService('teachers', createServerClient)
    const teacher = await teacherService.create(validatedData)
    
    return NextResponse.json(teacher, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    throw error // Let withAuth wrapper handle the error
  }
}, 'admin')