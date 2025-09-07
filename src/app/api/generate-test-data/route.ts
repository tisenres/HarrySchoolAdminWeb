import { NextResponse } from 'next/server'

// Generate realistic test data for Harry School
export async function POST() {
  const testStudents = [
    { firstName: 'Ali', lastName: 'Karimov', gradeLevel: '10th Grade', age: 16 },
    { firstName: 'Malika', lastName: 'Tashkentova', gradeLevel: '11th Grade', age: 17 },
    { firstName: 'Javohir', lastName: 'Samarkandiy', gradeLevel: '9th Grade', age: 15 },
    { firstName: 'Zarina', lastName: 'Ferghanova', gradeLevel: '12th Grade', age: 18 },
    { firstName: 'Bobur', lastName: 'Andijoniy', gradeLevel: '10th Grade', age: 16 },
    { firstName: 'Nilufar', lastName: 'Buxoriy', gradeLevel: '11th Grade', age: 17 }
  ]

  const testTeachers = [
    { firstName: 'Marina', lastName: 'Abdullayeva', specialization: 'English Literature' },
    { firstName: 'Sardor', lastName: 'Uzbekistan', specialization: 'Mathematics' },
    { firstName: 'Elena', lastName: 'Tashkent', specialization: 'Physics' },
    { firstName: 'Farrux', lastName: 'Namangan', specialization: 'Computer Science' },
    { firstName: 'Gulnora', lastName: 'Qarshi', specialization: 'Chemistry' }
  ]

  // Generate credentials for all students
  const studentsWithCredentials = testStudents.map(student => {
    const cleanFirstName = student.firstName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 3).padEnd(3, 'x')
    const digits = Math.floor(100 + Math.random() * 900).toString()
    const username = cleanFirstName + digits
    
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const password = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    
    return {
      ...student,
      id: `student_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      credentials: { username, password },
      email: `${username}@harryschool.internal`,
      dateOfBirth: `${2025 - student.age}-03-15`,
      enrollmentStatus: 'active',
      createdAt: new Date().toISOString()
    }
  })

  // Generate credentials for all teachers  
  const teachersWithCredentials = testTeachers.map(teacher => {
    const cleanFirstName = teacher.firstName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 3).padEnd(3, 'x')
    const digits = Math.floor(100 + Math.random() * 900).toString()
    const username = cleanFirstName + digits
    
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const password = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    
    return {
      ...teacher,
      id: `teacher_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      credentials: { username, password },
      email: `${username}@harryschool.internal`,
      phone: `+998${Math.floor(900000000 + Math.random() * 99999999)}`,
      employmentStatus: 'active',
      createdAt: new Date().toISOString()
    }
  })

  return NextResponse.json({
    success: true,
    title: '🎓 Harry School Test Data - Complete Authentication Demo',
    description: 'Complete test dataset with auto-generated credentials for mobile app development',
    organization: {
      id: 'harry-school-001',
      name: 'Harry School Tashkent',
      slug: 'harry-school-tashkent',
      maxStudents: 500
    },
    testData: {
      students: studentsWithCredentials,
      teachers: teachersWithCredentials,
      totalUsers: studentsWithCredentials.length + teachersWithCredentials.length
    },
    mobileAppTestInstructions: {
      step1: 'Use any of the generated username/password combinations',
      step2: 'Test login with Supabase client using provided URL/anon key',
      step3: 'Verify RLS policies restrict access to user\'s own data',
      step4: 'Test CRUD operations on lessons, homework, vocabulary',
      sampleCredentials: {
        student: {
          username: studentsWithCredentials[0].credentials.username,
          password: studentsWithCredentials[0].credentials.password
        },
        teacher: {
          username: teachersWithCredentials[0].credentials.username, 
          password: teachersWithCredentials[0].credentials.password
        }
      }
    },
    databaseOperations: {
      whenConnectionRestored: [
        '1. All users will be created in Supabase Auth',
        '2. Bridge records created in student_profiles/teacher_profiles',
        '3. Business records created in students/teachers tables',
        '4. RLS policies will automatically secure all data access',
        '5. Mobile app can authenticate immediately'
      ]
    },
    credentialExamples: {
      format: 'Username: first3letters + 3digits, Password: 6 alphanumeric',
      students: studentsWithCredentials.map(s => ({
        name: `${s.firstName} ${s.lastName}`,
        username: s.credentials.username,
        password: s.credentials.password,
        grade: s.gradeLevel
      })),
      teachers: teachersWithCredentials.map(t => ({
        name: `${t.firstName} ${t.lastName}`,
        username: t.credentials.username,
        password: t.credentials.password,
        subject: t.specialization
      }))
    }
  })
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'POST to this endpoint to generate complete test dataset with credentials',
    usage: 'curl -X POST http://localhost:3002/api/generate-test-data'
  })
}