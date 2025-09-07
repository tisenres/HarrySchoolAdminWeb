/**
 * Authentication credentials generation utilities
 * Auto-generates simple 5-6 character usernames and passwords for students and teachers
 */

import { createServerClient } from '@/lib/supabase/server'

export interface AuthCredentials {
  email: string
  username: string
  password: string
}

export interface StudentCredentials extends AuthCredentials {
  full_name: string
  date_of_birth: string
}

export interface TeacherCredentials extends AuthCredentials {
  full_name: string
}

/**
 * Generate random digits string
 */
function generateRandomDigits(length: number): string {
  return Math.random()
    .toString()
    .slice(2, 2 + length)
    .padStart(length, '0')
}

/**
 * Generate random alphanumeric string
 */
function generateRandomAlphaNumeric(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Clean name for username generation (remove spaces, special chars, make lowercase)
 */
function cleanName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .slice(0, 3)
}

/**
 * Generate student credentials
 * Format: Username = first 3 letters of first name + 3 digits
 * Password: 6 random alphanumeric characters
 */
export function generateStudentCredentials(
  firstName: string, 
  lastName: string, 
  dateOfBirth: string,
  existingUsernames: string[] = []
): StudentCredentials {
  const cleanFirstName = cleanName(firstName)
  let username = `${cleanFirstName}${generateRandomDigits(3)}`
  
  // Ensure username is unique
  let attempts = 0
  while (existingUsernames.includes(username) && attempts < 10) {
    username = `${cleanFirstName}${generateRandomDigits(3)}`
    attempts++
  }
  
  const password = generateRandomAlphaNumeric(6)
  const email = `${username}@harryschool.student`
  
  return {
    email,
    username,
    password,
    full_name: `${firstName} ${lastName}`,
    date_of_birth: dateOfBirth
  }
}

/**
 * Generate teacher credentials  
 * Format: Username = first 3 letters of first name + 3 digits
 * Password: 6 random alphanumeric characters
 */
export function generateTeacherCredentials(
  firstName: string,
  lastName: string,
  existingUsernames: string[] = []
): TeacherCredentials {
  const cleanFirstName = cleanName(firstName)
  let username = `${cleanFirstName}${generateRandomDigits(3)}`
  
  // Ensure username is unique
  let attempts = 0
  while (existingUsernames.includes(username) && attempts < 10) {
    username = `${cleanFirstName}${generateRandomDigits(3)}`
    attempts++
  }
  
  const password = generateRandomAlphaNumeric(6)
  const email = `${username}@harryschool.teacher`
  
  return {
    email,
    username,
    password,
    full_name: `${firstName} ${lastName}`
  }
}

/**
 * Get existing usernames to avoid duplicates
 */
export async function getExistingUsernames(): Promise<string[]> {
  const supabase = await createServerClient()
  
  // Get student usernames
  const { data: studentUsernames } = await supabase
    .from('student_profiles')
    .select('username')
    .is('deleted_at', null)
  
  // Get teacher usernames
  const { data: teacherUsernames } = await supabase
    .from('teacher_profiles')
    .select('username')
    .is('deleted_at', null)
  
  const allUsernames = [
    ...(studentUsernames?.map(u => u.username) || []),
    ...(teacherUsernames?.map(u => u.username) || [])
  ]
  
  return allUsernames
}

/**
 * Create Supabase auth user and return auth ID
 */
export async function createSupabaseAuthUser(
  credentials: AuthCredentials,
  userType: 'student' | 'teacher'
): Promise<string> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase.auth.admin.createUser({
    email: credentials.email,
    password: credentials.password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      username: credentials.username,
      user_type: userType,
      full_name: userType === 'student' 
        ? (credentials as StudentCredentials).full_name 
        : (credentials as TeacherCredentials).full_name
    }
  })
  
  if (error) {
    throw new Error(`Failed to create auth user: ${error.message}`)
  }
  
  if (!data.user) {
    throw new Error('No user data returned from auth creation')
  }
  
  return data.user.id
}

/**
 * Generate and create complete student authentication
 */
export async function createStudentAuth(
  firstName: string,
  lastName: string,
  dateOfBirth: string,
  studentId: string,
  organizationId: string,
  createdBy: string
): Promise<{ authId: string; credentials: StudentCredentials }> {
  try {
    // Get existing usernames to avoid duplicates
    const existingUsernames = await getExistingUsernames()
    
    // Generate credentials
    const credentials = generateStudentCredentials(
      firstName, 
      lastName, 
      dateOfBirth, 
      existingUsernames
    )
    
    // Create auth user
    const authId = await createSupabaseAuthUser(credentials, 'student')
    
    // Create student profile
    const supabase = await createServerClient()
    const { error: profileError } = await supabase
      .from('student_profiles')
      .insert({
        id: authId,
        student_id: studentId,
        organization_id: organizationId,
        username: credentials.username,
        password_visible: credentials.password,
        is_minor: calculateIsMinor(dateOfBirth),
        created_by: createdBy,
        updated_by: createdBy
      })
    
    if (profileError) {
      throw new Error(`Failed to create student profile: ${profileError.message}`)
    }
    
    return { authId, credentials }
    
  } catch (error) {
    console.error('Error creating student auth:', error)
    throw error
  }
}

/**
 * Generate and create complete teacher authentication
 */
export async function createTeacherAuth(
  firstName: string,
  lastName: string,
  teacherId: string,
  organizationId: string,
  createdBy: string
): Promise<{ authId: string; credentials: TeacherCredentials }> {
  try {
    // Get existing usernames to avoid duplicates
    const existingUsernames = await getExistingUsernames()
    
    // Generate credentials
    const credentials = generateTeacherCredentials(
      firstName, 
      lastName, 
      existingUsernames
    )
    
    // Create auth user
    const authId = await createSupabaseAuthUser(credentials, 'teacher')
    
    // Create teacher profile
    const supabase = await createServerClient()
    const { error: profileError } = await supabase
      .from('teacher_profiles')
      .insert({
        id: authId,
        teacher_id: teacherId,
        organization_id: organizationId,
        username: credentials.username,
        password_visible: credentials.password,
        created_by: createdBy,
        updated_by: createdBy
      })
    
    if (profileError) {
      throw new Error(`Failed to create teacher profile: ${profileError.message}`)
    }
    
    return { authId, credentials }
    
  } catch (error) {
    console.error('Error creating teacher auth:', error)
    throw error
  }
}

/**
 * Calculate if person is minor based on date of birth
 */
function calculateIsMinor(dateOfBirth: string): boolean {
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  const age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 < 18
  }
  
  return age < 18
}

/**
 * Get student credentials for admin display
 */
export async function getStudentCredentials(studentId: string): Promise<{ username: string; password: string } | null> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('student_profiles')
    .select('username, password_visible')
    .eq('student_id', studentId)
    .is('deleted_at', null)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return {
    username: data.username,
    password: data.password_visible
  }
}

/**
 * Get teacher credentials for admin display
 */
export async function getTeacherCredentials(teacherId: string): Promise<{ username: string; password: string } | null> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('teacher_profiles')
    .select('username, password_visible')
    .eq('teacher_id', teacherId)
    .is('deleted_at', null)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return {
    username: data.username,
    password: data.password_visible
  }
}