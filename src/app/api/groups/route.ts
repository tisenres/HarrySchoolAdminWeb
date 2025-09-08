import { NextRequest, NextResponse } from 'next/server'
import { getApiClient, getCurrentOrganizationId } from '@/lib/supabase-unified'
import { createGroupSchema, updateGroupSchema } from '@/lib/validations/group'
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
    
    console.log('🔍 GET /api/groups - Starting request')
    
    // Get unified client and organization
    const supabase = await getApiClient()
    const organizationId = await getCurrentOrganizationId()
    
    console.log('🏢 Organization ID:', organizationId)
    
    // Build query with organization filter
    let query = supabase
      .from('groups')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
    
    // Add organization filter if available
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }
    
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
    const validatedData = createGroupSchema.parse(body)
    
    console.log('🔍 POST /api/groups - Starting request')
    
    // Get unified client and organization
    const supabase = await getApiClient()
    const organizationId = await getCurrentOrganizationId()
    
    if (!organizationId) {
      console.error('❌ No organization ID found')
      return NextResponse.json(
        { error: 'Organization not found. Please contact administrator.' },
        { status: 400 }
      )
    }
    
    console.log('🏢 Organization ID:', organizationId)
    
    // Generate group code if not provided
    const groupCode = validatedData.group_code || await generateGroupCode(validatedData.subject, validatedData.level)
    
    // Create group with proper data transformation
    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        organization_id: organizationId,
        name: validatedData.name,
        group_code: groupCode,
        subject: validatedData.subject,
        level: validatedData.level,
        group_type: validatedData.group_type,
        description: validatedData.description,
        max_students: validatedData.max_students,
        schedule: validatedData.schedule, // This is now an array of schedule slots
        classroom: validatedData.classroom,
        online_meeting_url: validatedData.online_meeting_url,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date,
        duration_weeks: validatedData.duration_weeks,
        price_per_student: validatedData.price_per_student,
        currency: validatedData.currency,
        payment_frequency: validatedData.payment_frequency,
        notes: validatedData.notes,
        status: 'active',
        is_active: true,
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