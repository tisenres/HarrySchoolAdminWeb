import { NextRequest, NextResponse } from 'next/server'
import { getApiClient, getCurrentOrganizationId } from '@/lib/supabase-unified'

// Simplified GET - fetch teachers with minimal overhead
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/teachers - Starting request')
    
    // Get unified client and organization
    const supabase = await getApiClient()
    const organizationId = await getCurrentOrganizationId()
    
    console.log('🏢 Organization ID:', organizationId)
    
    // Parse query parameters for pagination and filtering
    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20
    const sortBy = searchParams.get('sort_by') || searchParams.get('sort_field') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || searchParams.get('sort_direction') || 'desc'
    const query = searchParams.get('query') || ''
    
    // Build query with organization filter
    let teachersQuery = supabase
      .from('teachers')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
    
    // Add organization filter if available
    if (organizationId) {
      teachersQuery = teachersQuery.eq('organization_id', organizationId)
    }
    
    // Apply search if provided
    if (query) {
      teachersQuery = teachersQuery.or(
        `full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`
      )
    }
    
    // Apply sorting
    teachersQuery = teachersQuery.order(sortBy, { ascending: sortOrder === 'asc' })
    
    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    teachersQuery = teachersQuery.range(from, to)
    
    const { data: teachers, error: teachersError, count } = await teachersQuery
    
    if (teachersError) {
      console.error('Teachers query error:', teachersError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to fetch teachers',
        details: teachersError.message 
      }, { status: 500 })
    }
    
    // Return successful response
    return NextResponse.json({
      success: true,
      data: teachers || [],
      count: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    })
    
  } catch (error) {
    console.error('Unexpected error in GET /api/teachers:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Simplified POST - create teacher with minimal overhead
export async function POST(request: NextRequest) {
  try {
    console.log('✅ POST /api/teachers - Starting request')
    
    const body = await request.json()
    console.log('📝 Received teacher data')
    
    // Get unified client and organization
    const supabase = await getApiClient()
    const organizationId = await getCurrentOrganizationId()
    
    if (!organizationId) {
      console.error('❌ No organization ID found')
      return NextResponse.json({
        success: false,
        error: 'Organization not found'
      }, { status: 400 })
    }
    
    // Prepare teacher data with defaults
    const teacherData = {
      ...body,
      organization_id: organizationId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Insert teacher
    const { data: newTeacher, error: insertError } = await supabase
      .from('teachers')
      .insert(teacherData)
      .select()
      .single()
    
    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to create teacher',
        details: insertError.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: newTeacher
    }, { status: 201 })
    
  } catch (error) {
    console.error('Unexpected error in POST /api/teachers:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}