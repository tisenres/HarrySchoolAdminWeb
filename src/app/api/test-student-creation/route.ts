import { createClient } from '@/lib/supabase/server'
import StudentService from '@/lib/services/student-service'
import TeacherService from '@/lib/services/teacher-service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get organization for testing
    const supabase = await createClient()
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1)

    if (orgError || !orgs || orgs.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No organizations found. Please create an organization first.',
        orgError: orgError?.message
      }, { status: 400 })
    }

    const testOrgId = orgs[0].id
    console.log('Using organization:', orgs[0].name, testOrgId)

    // Test student creation
    console.log('Creating test student...')
    const testStudent = {
      organization_id: testOrgId,
      first_name: 'Ali',
      last_name: 'Karimov',
      date_of_birth: '2008-03-15',
      enrollment_date: '2025-01-20',
      grade_level: 'Intermediate',
      email: 'ali.karimov@test.com',
      primary_phone: '+998901234567'
    }

    const studentResult = await StudentService.create(testStudent)
    console.log('Student created:', studentResult.id)

    // Test teacher creation
    console.log('Creating test teacher...')
    const testTeacher = {
      organization_id: testOrgId,
      first_name: 'Marina',
      last_name: 'Abdullayeva',
      email: 'marina.abdullayeva@test.com',
      phone: '+998909876543',
      specialization: 'English',
      hire_date: '2025-01-20',
      employment_status: 'full_time'
    }

    const teacherResult = await TeacherService.create(testTeacher)
    console.log('Teacher created:', teacherResult.id)

    return NextResponse.json({
      success: true,
      organization: orgs[0],
      student: {
        id: studentResult.id,
        name: `${studentResult.first_name} ${studentResult.last_name}`,
        credentials: studentResult.credentials || null
      },
      teacher: {
        id: teacherResult.id,
        name: `${teacherResult.first_name} ${teacherResult.last_name}`,
        credentials: teacherResult.credentials || null
      },
      message: 'Both student and teacher created successfully with auto-generated credentials!'
    })

  } catch (error: any) {
    console.error('Test creation failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test student/teacher creation endpoint',
    usage: 'POST to this endpoint to create test student and teacher with auto-generated credentials'
  })
}