import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create service role client for server-side operations
// This bypasses RLS policies for administrative operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Simplified GET - fetch students with minimal overhead
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters for pagination and filtering
    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20
    const sortBy = searchParams.get('sort_by') || searchParams.get('sort_field') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || searchParams.get('sort_direction') || 'desc'
    const query = searchParams.get('query') || ''
    
    // Build query - use default org for now
    let studentsQuery = supabase
      .from('students')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
    
    // Apply search if provided
    if (query) {
      studentsQuery = studentsQuery.or(
        `full_name.ilike.%${query}%,email.ilike.%${query}%,primary_phone.ilike.%${query}%`
      )
    }
    
    // Apply sorting
    studentsQuery = studentsQuery.order(sortBy, { ascending: sortOrder === 'asc' })
    
    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    studentsQuery = studentsQuery.range(from, to)
    
    const { data: students, error: studentsError, count } = await studentsQuery
    
    if (studentsError) {
      console.error('Students query error:', studentsError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to fetch students',
        details: studentsError.message 
      }, { status: 500 })
    }
    
    // Return successful response
    return NextResponse.json({
      success: true,
      data: students || [],
      count: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    })
    
  } catch (error) {
    console.error('Unexpected error in GET /api/students:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Simplified POST - create student with minimal overhead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Prepare student data with defaults and field mapping
    const studentData = {
      ...body,
      // Map phone field to primary_phone for database compatibility
      primary_phone: body.phone || body.primary_phone,
      organization_id: body.organization_id || '90bb0700-eca6-4925-b618-c0796f2e2187', // Use real org ID
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Remove fields that shouldn't be inserted directly
    delete studentData.phone // phone is mapped to primary_phone
    delete studentData.full_name // full_name is auto-generated from first_name + last_name
    
    // Insert student
    const { data: newStudent, error: insertError } = await supabase
      .from('students')
      .insert(studentData)
      .select()
      .single()
    
    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to create student',
        details: insertError.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: newStudent
    }, { status: 201 })
    
  } catch (error) {
    console.error('Unexpected error in POST /api/students:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}