import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import crypto from 'crypto'

// Use service role key for admin operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

type StudentCredential = {
  id: string
  student_id: string
  organization_id: string
  username: string
  password_visible: string
  is_active: boolean
  created_at: string
}

export class CredentialService {
  /**
   * Generate a secure, memorable username based on student name and organization
   */
  private generateUsername(firstName: string, lastName: string, organizationSlug: string): string {
    // Create base username from name parts
    const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 6)
    const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 6)
    const cleanOrg = organizationSlug.toLowerCase().replace(/[^a-z]/g, '').substring(0, 4)
    
    // Generate deterministic but unique suffix
    const combined = `${firstName}${lastName}${organizationSlug}${Date.now()}`
    const hash = crypto.createHash('sha256').update(combined).digest('hex')
    const suffix = hash.substring(0, 4)
    
    return `${cleanFirst}${cleanLast}${cleanOrg}${suffix}`
  }

  /**
   * Generate a secure, memorable password
   */
  private generatePassword(): string {
    const adjectives = ['Quick', 'Bright', 'Smart', 'Happy', 'Strong', 'Clever', 'Swift', 'Bold']
    const nouns = ['Tiger', 'Eagle', 'Lion', 'Wolf', 'Bear', 'Fox', 'Hawk', 'Star']
    const numbers = Math.floor(Math.random() * 90) + 10 // 10-99
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    
    return `${adjective}${noun}${numbers}!`
  }

  /**
   * Create credentials for a student
   */
  async createCredentials(studentId: string): Promise<StudentCredential> {
    try {
      // Get student details
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .select('first_name, last_name, organization_id, organizations(slug)')
        .eq('id', studentId)
        .is('deleted_at', null)
        .single()

      if (studentError || !student) {
        throw new Error(`Student not found: ${studentError?.message}`)
      }

      const organizationSlug = (student.organizations as any)?.slug || 'harry'

      // Check if credentials already exist
      const { data: existing } = await supabaseAdmin
        .from('student_credentials')
        .select('*')
        .eq('student_id', studentId)
        .is('deleted_at', null)
        .single()

      if (existing) {
        return existing as StudentCredential
      }

      // Generate unique username
      let username = this.generateUsername(student.first_name, student.last_name, organizationSlug)
      let attempts = 0
      
      while (attempts < 10) {
        const { data: usernameExists } = await supabaseAdmin
          .from('student_credentials')
          .select('id')
          .eq('username', username)
          .is('deleted_at', null)
          .single()

        if (!usernameExists) break
        
        // Add random suffix if username exists
        const suffix = Math.floor(Math.random() * 999) + 1
        username = `${username}${suffix}`
        attempts++
      }

      if (attempts >= 10) {
        throw new Error('Unable to generate unique username')
      }

      // Generate password
      const password = this.generatePassword()

      // Create credentials
      const { data: credentials, error: credError } = await supabaseAdmin
        .from('student_credentials')
        .insert({
          student_id: studentId,
          organization_id: student.organization_id,
          username,
          password_visible: password,
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (credError) {
        throw new Error(`Failed to create credentials: ${credError.message}`)
      }

      return credentials as StudentCredential
    } catch (error) {
      console.error('Error creating student credentials:', error)
      throw error
    }
  }

  /**
   * Get credentials for a student
   */
  async getCredentials(studentId: string): Promise<StudentCredential | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('student_credentials')
        .select('*')
        .eq('student_id', studentId)
        .is('deleted_at', null)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data as StudentCredential | null
    } catch (error) {
      console.error('Error getting student credentials:', error)
      return null
    }
  }

  /**
   * Update password for a student
   */
  async updatePassword(studentId: string, newPassword?: string): Promise<string> {
    try {
      const password = newPassword || this.generatePassword()

      const { data, error } = await supabaseAdmin
        .from('student_credentials')
        .update({
          password_visible: password,
          updated_at: new Date().toISOString()
        })
        .eq('student_id', studentId)
        .is('deleted_at', null)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update password: ${error.message}`)
      }

      return password
    } catch (error) {
      console.error('Error updating password:', error)
      throw error
    }
  }

  /**
   * Bulk create credentials for multiple students
   */
  async bulkCreateCredentials(studentIds: string[]): Promise<StudentCredential[]> {
    const results: StudentCredential[] = []
    const errors: string[] = []

    for (const studentId of studentIds) {
      try {
        const credentials = await this.createCredentials(studentId)
        results.push(credentials)
      } catch (error) {
        console.error(`Failed to create credentials for student ${studentId}:`, error)
        errors.push(`Student ${studentId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (errors.length > 0) {
      console.warn('Some credential creations failed:', errors)
    }

    return results
  }

  /**
   * Get all students without credentials in an organization
   */
  async getStudentsWithoutCredentials(organizationId: string): Promise<{
    id: string
    first_name: string
    last_name: string
    full_name: string
  }[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('students')
        .select('id, first_name, last_name, full_name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .is('deleted_at', null)

      if (error) {
        throw error
      }

      // Filter out students that already have credentials
      const studentsWithoutCredentials = []
      
      for (const student of data || []) {
        const credentials = await this.getCredentials(student.id)
        if (!credentials) {
          studentsWithoutCredentials.push(student)
        }
      }

      return studentsWithoutCredentials
    } catch (error) {
      console.error('Error getting students without credentials:', error)
      throw error
    }
  }

  /**
   * Deactivate credentials (soft delete)
   */
  async deactivateCredentials(studentId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('student_credentials')
        .update({
          is_active: false,
          deleted_at: new Date().toISOString()
        })
        .eq('student_id', studentId)

      if (error) {
        throw new Error(`Failed to deactivate credentials: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deactivating credentials:', error)
      throw error
    }
  }
}

// Export singleton instance
export const credentialService = new CredentialService()