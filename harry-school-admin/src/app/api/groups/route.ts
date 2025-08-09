import { NextRequest, NextResponse } from 'next/server'
import { GroupService } from '@/lib/services/group-service'
import { groupInsertSchema } from '@/lib/validations'
import { withAuth } from '@/lib/middleware/api-auth'
import { z } from 'zod'

export const GET = withAuth(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  
  // Parse search parameters
  const search: any = {
    query: searchParams.get('query') || undefined,
    status: searchParams.get('status') || undefined,
    subject: searchParams.get('subject') || undefined,
    level: searchParams.get('level') || undefined,
    group_type: searchParams.get('group_type') || undefined,
    is_active: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
    start_date_from: searchParams.get('start_date_from') || undefined,
    start_date_to: searchParams.get('start_date_to') || undefined,
  }
  
  // Parse pagination parameters
  const pagination = {
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 20,
    sort_by: searchParams.get('sort_by') || 'created_at',
    sort_order: (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc',
  }
  
  const groupService = new GroupService()
  const result = await groupService.getAll(search, pagination)
  
  return NextResponse.json(result)
}, 'admin')

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  
  try {
    const validatedData = groupInsertSchema.parse(body)
    const groupService = new GroupService()
    const group = await groupService.create(validatedData)
    
    return NextResponse.json(group, { status: 201 })
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