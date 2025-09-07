import { NextRequest, NextResponse } from 'next/server'

// Mock the actual student/teacher creation flow
function mockStudentService() {
  return {
    async create(studentData: any) {
      // Simulate the actual credential generation logic from StudentService
      const { first_name, last_name, date_of_birth, organization_id } = studentData
      
      // Generate credentials using the same logic as the real service
      const cleanFirstName = first_name.toLowerCase().replace(/[^a-z]/g, '').substring(0, 3).padEnd(3, 'x')
      const digits = Math.floor(100 + Math.random() * 900).toString()
      const username = cleanFirstName + digits
      
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      const password = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      const email = `${username}@harryschool.internal`

      // Simulate the student record that would be created
      const mockStudent = {
        id: `student_${Date.now()}`,
        organization_id,
        first_name,
        last_name,
        full_name: `${first_name} ${last_name}`,
        date_of_birth,
        enrollment_status: 'active',
        grade_level: studentData.grade_level || 'Not specified',
        created_at: new Date().toISOString(),
        credentials: {
          username,
          password
        }
      }

      // Simulate what would happen in the real database:
      // 1. Student record created in 'students' table
      // 2. Supabase auth user created with email/password
      // 3. Bridge record created in 'student_profiles' table
      // 4. Credentials returned for admin display

      return mockStudent
    }
  }
}

function mockTeacherService() {
  return {
    async create(teacherData: any) {
      const { first_name, last_name, organization_id } = teacherData
      
      // Generate credentials using the same logic as the real service
      const cleanFirstName = first_name.toLowerCase().replace(/[^a-z]/g, '').substring(0, 3).padEnd(3, 'x')
      const digits = Math.floor(100 + Math.random() * 900).toString()
      const username = cleanFirstName + digits
      
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      const password = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      const email = `${username}@harryschool.internal`

      const mockTeacher = {
        id: `teacher_${Date.now()}`,
        organization_id,
        first_name,
        last_name,
        full_name: `${first_name} ${last_name}`,
        email: teacherData.email,
        phone: teacherData.phone,
        specialization: teacherData.specialization,
        employment_status: 'active',
        created_at: new Date().toISOString(),
        credentials: {
          username,
          password
        }
      }

      return mockTeacher
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, ...userData } = await request.json()

    // Mock organization for testing
    const mockOrganization = {
      id: 'mock-org-001',
      name: 'Harry School Tashkent',
      slug: 'harry-school-tashkent'
    }

    let result
    if (type === 'student') {
      const studentService = mockStudentService()
      const testStudent = {
        organization_id: mockOrganization.id,
        first_name: userData.firstName || 'Ali',
        last_name: userData.lastName || 'Karimov',
        date_of_birth: userData.dateOfBirth || '2008-03-15',
        enrollment_date: '2025-01-20',
        grade_level: userData.gradeLevel || 'Intermediate',
        email: userData.email || 'ali.karimov@test.com',
        primary_phone: userData.phone || '+998901234567'
      }

      result = await studentService.create(testStudent)
    } else if (type === 'teacher') {
      const teacherService = mockTeacherService()
      const testTeacher = {
        organization_id: mockOrganization.id,
        first_name: userData.firstName || 'Marina',
        last_name: userData.lastName || 'Abdullayeva',
        email: userData.email || 'marina.abdullayeva@test.com',
        phone: userData.phone || '+998909876543',
        specialization: userData.specialization || 'English',
        hire_date: '2025-01-20',
        employment_status: 'full_time'
      }

      result = await teacherService.create(testTeacher)
    } else {
      throw new Error('Invalid type. Use "student" or "teacher"')
    }

    return NextResponse.json({
      success: true,
      message: `${type} created successfully with auto-generated credentials!`,
      organization: mockOrganization,
      [type]: {
        id: result.id,
        name: result.full_name,
        credentials: result.credentials,
        details: {
          created_at: result.created_at,
          grade_level: result.grade_level,
          specialization: result.specialization,
          status: result.enrollment_status || result.employment_status
        }
      },
      databaseOperations: [
        `✅ ${type.charAt(0).toUpperCase() + type.slice(1)} record created in '${type}s' table`,
        '✅ Supabase auth user created with generated email/password',
        `✅ Bridge record created in '${type}_profiles' table`,
        '✅ Credentials stored for admin retrieval',
        '✅ RLS policies applied for secure access'
      ],
      adminDisplay: {
        title: `🎉 ${type.charAt(0).toUpperCase() + type.slice(1)} Created Successfully!`,
        name: result.full_name,
        credentials: result.credentials,
        instruction: `Share these credentials with the ${type} for mobile app login.`
      }
    })

  } catch (error: any) {
    console.error('Mock creation failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    title: '🎭 Mock Student/Teacher Creation Demo',
    description: 'This demonstrates exactly how the authentication system works when database is connected',
    usage: {
      endpoint: 'POST /api/mock-student-creation',
      parameters: {
        type: '"student" or "teacher"',
        firstName: 'string (optional)',
        lastName: 'string (optional)',
        email: 'string (optional)',
        gradeLevel: 'string (optional for students)',
        specialization: 'string (optional for teachers)'
      }
    },
    examples: [
      {
        description: 'Create student with default data',
        curl: 'curl -X POST http://localhost:3002/api/mock-student-creation -H "Content-Type: application/json" -d \'{"type": "student"}\''
      },
      {
        description: 'Create custom student',
        curl: 'curl -X POST http://localhost:3002/api/mock-student-creation -H "Content-Type: application/json" -d \'{"type": "student", "firstName": "Zarina", "lastName": "Tashkentova", "gradeLevel": "Advanced"}\''
      },
      {
        description: 'Create teacher',
        curl: 'curl -X POST http://localhost:3002/api/mock-student-creation -H "Content-Type: application/json" -d \'{"type": "teacher", "firstName": "Sardor", "lastName": "Uzbek", "specialization": "Mathematics"}\''
      }
    ]
  })
}