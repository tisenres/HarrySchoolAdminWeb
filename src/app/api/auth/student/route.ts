/**
 * Student Authentication API
 * POST /api/auth/student - Login with username/password
 * GET /api/auth/student - Get current student profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'

type StudentProfile = Database['public']['Tables']['student_profiles']['Row']
type Student = Database['public']['Tables']['students']['Row']
type StudentRanking = Database['public']['Tables']['student_rankings']['Row']

interface LoginRequest {
  username: string
  password: string
}

interface StudentAuthResponse {
  success: boolean
  data?: {
    session: any
    student: Student & {
      profile: StudentProfile
      ranking: StudentRanking
      group_enrollments: any[]
    }
  }
  error?: string
}

// POST /api/auth/student - Student login
export async function POST(request: NextRequest): Promise<NextResponse<StudentAuthResponse>> {
  try {
    const { username, password }: LoginRequest = await request.json()

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: 'Username and password are required'
      }, { status: 400 })
    }

    const supabase = createClient()

    // First, find the student profile by username
    const { data: profile, error: profileError } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({
        success: false,
        error: 'Invalid username or password'
      }, { status: 401 })
    }

    // Get the email from the auth user
    const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
    
    if (!authUser.user) {
      return NextResponse.json({
        success: false,
        error: 'User account not found'
      }, { status: 401 })
    }

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: authUser.user.email!,
      password: password
    })

    if (authError || !authData.session) {
      return NextResponse.json({
        success: false,
        error: 'Invalid username or password'
      }, { status: 401 })
    }

    // Update login tracking
    await supabase
      .from('student_profiles')
      .update({
        last_login_at: new Date().toISOString(),
        login_count: profile.login_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    // Fetch complete student data
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        student_rankings (
          total_points,
          available_coins,
          spent_coins,
          current_rank,
          last_activity_at
        ),
        student_group_enrollments (
          id,
          status,
          enrollment_date,
          groups (
            id,
            name,
            level,
            description,
            teachers (
              first_name,
              last_name,
              full_name
            )
          )
        )
      `)
      .eq('id', profile.student_id)
      .is('deleted_at', null)
      .single()

    if (studentError || !studentData) {
      return NextResponse.json({
        success: false,
        error: 'Student data not found'
      }, { status: 404 })
    }

    // Privacy filter for minor students
    const isMinor = profile.is_minor || (studentData.date_of_birth && 
      new Date().getFullYear() - new Date(studentData.date_of_birth).getFullYear() < 18)

    const sanitizedStudent = {
      ...studentData,
      // Remove sensitive data for minors
      ...(isMinor && {
        phone_number: null,
        address: null,
        guardian_email: profile.guardian_email, // Keep guardian email
        privacy_protected: true
      }),
      profile: {
        ...profile,
        password_visible: undefined // Never send password to client
      },
      ranking: studentData.student_rankings[0] || {
        total_points: 0,
        available_coins: 0,
        spent_coins: 0,
        current_rank: null,
        last_activity_at: null
      },
      group_enrollments: studentData.student_group_enrollments
    }

    return NextResponse.json({
      success: true,
      data: {
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at,
          user: authData.user
        },
        student: sanitizedStudent
      }
    })

  } catch (error) {
    console.error('Student login error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// GET /api/auth/student - Get current student profile
export async function GET(request: NextRequest): Promise<NextResponse<StudentAuthResponse>> {
  try {
    const supabase = createClient()

    // Get current user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Get student profile
    const { data: profile, error: profileError } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', user.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({
        success: false,
        error: 'Student profile not found'
      }, { status: 404 })
    }

    // Fetch complete student data
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        student_rankings (
          total_points,
          available_coins,
          spent_coins,
          current_rank,
          last_activity_at
        ),
        student_group_enrollments (
          id,
          status,
          enrollment_date,
          groups (
            id,
            name,
            level,
            description,
            schedule_description,
            teachers (
              first_name,
              last_name,
              full_name
            )
          )
        )
      `)
      .eq('id', profile.student_id)
      .is('deleted_at', null)
      .single()

    if (studentError || !studentData) {
      return NextResponse.json({
        success: false,
        error: 'Student data not found'
      }, { status: 404 })
    }

    // Privacy filter for minor students
    const isMinor = profile.is_minor || (studentData.date_of_birth && 
      new Date().getFullYear() - new Date(studentData.date_of_birth).getFullYear() < 18)

    const sanitizedStudent = {
      ...studentData,
      ...(isMinor && {
        phone_number: null,
        address: null,
        guardian_email: profile.guardian_email,
        privacy_protected: true
      }),
      profile: {
        ...profile,
        password_visible: undefined
      },
      ranking: studentData.student_rankings[0] || {
        total_points: 0,
        available_coins: 0,
        spent_coins: 0,
        current_rank: null,
        last_activity_at: null
      },
      group_enrollments: studentData.student_group_enrollments
    }

    return NextResponse.json({
      success: true,
      data: {
        session: null, // Session info not needed for profile fetch
        student: sanitizedStudent
      }
    })

  } catch (error) {
    console.error('Get student profile error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}