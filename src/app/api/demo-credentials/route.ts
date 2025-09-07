import { NextResponse } from 'next/server'

// Simulate the credential generation logic
function generateStudentCredentials(firstName: string, lastName: string, dateOfBirth: string, existingUsernames: string[] = []) {
  // Clean and get first 3 letters of first name
  const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 3).padEnd(3, 'x')
  
  // Generate username: first 3 letters + 3 random digits
  let username: string
  let attempts = 0
  do {
    const digits = Math.floor(100 + Math.random() * 900).toString() // 3 digits (100-999)
    username = cleanFirstName + digits
    attempts++
  } while (existingUsernames.includes(username) && attempts < 10)

  // Generate password: 6 random alphanumeric characters
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const password = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

  // Create email for Supabase auth
  const email = `${username}@harryschool.internal`

  return {
    username,
    password, 
    email,
    metadata: {
      firstName,
      lastName,
      dateOfBirth,
      generatedAt: new Date().toISOString()
    }
  }
}

function generateTeacherCredentials(firstName: string, lastName: string, existingUsernames: string[] = []) {
  // Clean and get first 3 letters of first name  
  const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 3).padEnd(3, 'x')
  
  // Generate username: first 3 letters + 3 random digits
  let username: string
  let attempts = 0
  do {
    const digits = Math.floor(100 + Math.random() * 900).toString() // 3 digits (100-999)
    username = cleanFirstName + digits
    attempts++
  } while (existingUsernames.includes(username) && attempts < 10)

  // Generate password: 6 random alphanumeric characters
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const password = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

  // Create email for Supabase auth
  const email = `${username}@harryschool.internal`

  return {
    username,
    password,
    email,
    metadata: {
      firstName,
      lastName,
      generatedAt: new Date().toISOString()
    }
  }
}

export async function GET() {
  // Demo different names to show the credential generation
  const testCases = [
    // Students
    { type: 'student', firstName: 'Ali', lastName: 'Karimov', dateOfBirth: '2008-03-15' },
    { type: 'student', firstName: 'Malika', lastName: 'Tashkentova', dateOfBirth: '2007-08-22' },
    { type: 'student', firstName: 'Javohir', lastName: 'Samarkandiy', dateOfBirth: '2006-12-10' },
    { type: 'student', firstName: 'Zarina', lastName: 'Ferghanova', dateOfBirth: '2008-05-18' },
    
    // Teachers  
    { type: 'teacher', firstName: 'Marina', lastName: 'Abdullayeva' },
    { type: 'teacher', firstName: 'Sardor', lastName: 'Uzbekistan' },
    { type: 'teacher', firstName: 'Elena', lastName: 'Tashkent' },
    { type: 'teacher', firstName: 'Farrux', lastName: 'Andijaniy' }
  ]

  const results = testCases.map(testCase => {
    if (testCase.type === 'student') {
      return {
        ...testCase,
        credentials: generateStudentCredentials(testCase.firstName, testCase.lastName, testCase.dateOfBirth!)
      }
    } else {
      return {
        ...testCase,
        credentials: generateTeacherCredentials(testCase.firstName, testCase.lastName)
      }
    }
  })

  return NextResponse.json({
    success: true,
    title: '🔐 Harry School - Auto-Generated Credentials Demo',
    description: 'This demonstrates how usernames and passwords are automatically generated when students and teachers are created in the admin panel.',
    credentialRules: {
      username: 'First 3 letters of first name + 3 random digits (e.g., "ali123", "mar456")',
      password: '6 random alphanumeric characters (e.g., "a7x9m2", "k3p8s1")',
      email: 'Generated for Supabase auth: "{username}@harryschool.internal"'
    },
    samples: results,
    adminVisibility: 'These credentials are displayed to admin users when students/teachers are created and can be retrieved later for support.',
    securityNote: 'RLS policies ensure students can only access their own data and enrolled group content.',
    usage: {
      forStudentApp: 'Use these credentials in the mobile app login screen',
      forAdmin: 'Admin panel shows these credentials when creating users',
      forSupport: 'Admin can retrieve credentials using StudentService.getCredentials(studentId)'
    }
  })
}