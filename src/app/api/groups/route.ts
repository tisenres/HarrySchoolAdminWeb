import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { groupInsertSchema, groupUpdateSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Parse search parameters
    const search = searchParams.get('query') || undefined
    const status = searchParams.get('status') || undefined
    const subject = searchParams.get('subject') || undefined
    const level = searchParams.get('level') || undefined
    const group_type = searchParams.get('group_type') || undefined
    const is_active = searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined
    const start_date_from = searchParams.get('start_date_from') || undefined
    const start_date_to = searchParams.get('start_date_to') || undefined
    
    // Parse pagination parameters 
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20
    const sort_field = searchParams.get('sort_field') || 'created_at'
    const sort_direction = (searchParams.get('sort_direction') || 'desc') as 'asc' | 'desc'
    
    const supabase = await createServerClient()
    
    // Build query
    let query = supabase
      .from('groups')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
    
    // Apply search filters
    if (search) {
      query = query.or(`
        name.ilike.%${search}%,
        subject.ilike.%${search}%,
        group_code.ilike.%${search}%,
        description.ilike.%${search}%
      `)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (subject) {
      query = query.eq('subject', subject)
    }
    
    if (level) {
      query = query.eq('level', level)
    }
    
    if (group_type) {
      query = query.eq('group_type', group_type)
    }
    
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active)
    }
    
    if (start_date_from) {
      query = query.gte('start_date', start_date_from)
    }
    
    if (start_date_to) {
      query = query.lte('start_date', start_date_to)
    }
    
    // Apply sorting
    query = query.order(sort_field, { ascending: sort_direction === 'asc' })
    
    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)
    
    const { data: groups, error, count } = await query
    
    if (error) {
      console.error('Failed to fetch groups:', error)
      throw new Error(`Failed to fetch groups: ${error.message}`)
    }
    
    // Return response with pagination info
    return NextResponse.json({
      data: groups || [],
      count: count || 0,
      total_pages: Math.ceil((count || 0) / limit),
      current_page: page,
      page_size: limit
    })
  } catch (error) {
    console.error('Groups GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch groups' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = groupInsertSchema.parse(body)
    
    const supabase = await createServerClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get organization (simplified)
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single()
    
    const organizationId = adminUser?.organization_id || 'default-org'
    
    // Generate group code if not provided
    const groupCode = validatedData.group_code || await generateGroupCode(validatedData.subject, validatedData.level)
    
    // Create group
    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        ...validatedData,
        group_code: groupCode,
        organization_id: organizationId,
        created_by: user.id,
        updated_by: user.id,
        current_enrollment: 0,
        waiting_list_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('Failed to create group:', error)
      throw new Error(`Failed to create group: ${error.message}`)
    }
    
    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('Groups POST error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create group' },
      { status: 500 }
    )
  }
}

// Helper function to generate unique group code
async function generateGroupCode(subject: string, level?: string | null): Promise<string> {
  const subjectCode = subject.substring(0, 3).toUpperCase()
  const levelCode = level ? level.substring(0, 2).toUpperCase() : 'GN'
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4)
  
  return `${subjectCode}-${levelCode}-${timestamp}`
}