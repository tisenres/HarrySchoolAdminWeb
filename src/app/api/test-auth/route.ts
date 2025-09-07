import { createClient } from '@/lib/supabase/server'
import StudentService from '@/lib/services/student-service'
import TeacherService from '@/lib/services/teacher-service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { type, organizationId } = await request.json()

    if (type === 'student') {
      const testStudent = {
        organization_id: organizationId,
        first_name: 'Test',
        last_name: 'Student',
        date_of_birth: '2005-01-15',
        enrollment_date: '2025-01-20',
        grade_level: '10',
        email: 'test.student@example.com'
      }

      console.log('Creating test student...', testStudent)
      const result = await StudentService.create(testStudent)
      
      return NextResponse.json({
        success: true,
        type: 'student',
        entity: {
          id: result.id,
          name: `${result.first_name} ${result.last_name}`,
          credentials: result.credentials || null
        }
      })

    } else if (type === 'teacher') {
      const testTeacher = {
        organization_id: organizationId,
        first_name: 'Test',
        last_name: 'Teacher',
        email: 'test.teacher@example.com',
        phone: '+998901234567',
        specialization: 'English',
        hire_date: '2025-01-20'
      }

      console.log('Creating test teacher...', testTeacher)
      const result = await TeacherService.create(testTeacher)
      
      return NextResponse.json({
        success: true,
        type: 'teacher',
        entity: {
          id: result.id,
          name: `${result.first_name} ${result.last_name}`,
          credentials: result.credentials || null
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid type. Use "student" or "teacher"'
    }, { status: 400 })

  } catch (error: any) {
    console.error('Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Get organization info for testing
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(5)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Auth test endpoint ready',
      organizations: orgs || [],
      usage: 'POST { "type": "student" | "teacher", "organizationId": "uuid" }'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}