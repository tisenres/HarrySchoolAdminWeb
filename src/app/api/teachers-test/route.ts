import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Simplified test route to verify database connectivity
export async function GET(request: NextRequest) {
  try {
    console.log('Teachers test API: Starting...')
    
    // Create server client with proper cookie handling
    const supabase = await createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('Auth error:', authError)
      return NextResponse.json({ 
        error: 'Authentication error', 
        details: authError.message 
      }, { status: 401 })
    }
    
    if (!user) {
      console.log('No user found')
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 })
    }
    
    console.log('User authenticated:', user.email)
    
    // Get user's profile to find organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      console.log('Profile error:', profileError)
      return NextResponse.json({ 
        error: 'Profile not found',
        details: profileError?.message 
      }, { status: 404 })
    }
    
    console.log('Profile found:', profile)
    
    // Get teachers for this organization
    const { data: teachers, error: teachersError } = await supabase
      .from('teachers')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)
      .limit(10)
    
    if (teachersError) {
      console.log('Teachers query error:', teachersError)
      return NextResponse.json({ 
        error: 'Failed to fetch teachers',
        details: teachersError.message 
      }, { status: 500 })
    }
    
    console.log(`Found ${teachers?.length || 0} teachers`)
    
    return NextResponse.json({
      success: true,
      data: teachers || [],
      count: teachers?.length || 0,
      user: user.email,
      organization_id: profile.organization_id
    })
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Simplified POST to create a teacher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Creating teacher with data:', body)
    
    // Create server client
    const supabase = await createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 })
    }
    
    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'Profile not found' 
      }, { status: 404 })
    }
    
    // Create teacher with minimal required fields
    const teacherData = {
      organization_id: profile.organization_id,
      first_name: body.first_name || 'Test',
      last_name: body.last_name || 'Teacher',
      email: body.email || `test${Date.now()}@example.com`,
      phone: body.phone || '+998901234567',
      hire_date: body.hire_date || new Date().toISOString(),
      employment_status: body.employment_status || 'active',
      is_active: true,
      created_by: user.id,
      updated_by: user.id
    }
    
    console.log('Inserting teacher:', teacherData)
    
    const { data: newTeacher, error: insertError } = await supabase
      .from('teachers')
      .insert(teacherData)
      .select()
      .single()
    
    if (insertError) {
      console.log('Insert error:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create teacher',
        details: insertError.message 
      }, { status: 500 })
    }
    
    console.log('Teacher created successfully:', newTeacher)
    
    return NextResponse.json({
      success: true,
      data: newTeacher
    }, { status: 201 })
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}