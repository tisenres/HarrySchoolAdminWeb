import { NextRequest, NextResponse } from 'next/server'

// GET single student profile for public access (no admin authentication required)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use unified client for public access
    const { getApiClient } = await import('@/lib/supabase-unified')
    const supabase = await getApiClient()
    
    // Await params in Next.js 15
    const { id } = await params
    
    console.log('🔍 Public API: Looking for student with ID:', id)
    
    // Get student profile with limited public information
    const { data: student, error } = await supabase
      .from('students')
      .select(`
        id,
        first_name,
        last_name,
        full_name,
        enrollment_status,
        current_level,
        enrollment_date,
        organization_id
      `)
      .eq('id', id)
      .single()
    
    console.log('📊 Public API Query result:', { student, error })
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Student not found' },
          { status: 404 }
        )
      }
      throw new Error(error.message)
    }
    
    // Return only public-safe information
    const publicStudentData = {
      id: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      fullName: student.full_name,
      enrollmentStatus: student.enrollment_status,
      currentLevel: student.current_level,
      enrollmentDate: student.enrollment_date
    }
    
    return NextResponse.json({
      success: true,
      data: publicStudentData
    })
  } catch (error) {
    console.error('❌ Public Student API Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Unable to load student profile'
      },
      { status: 500 }
    )
  }
}