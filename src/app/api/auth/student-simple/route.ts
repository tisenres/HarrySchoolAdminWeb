/**
 * Simplified Student Authentication API
 * Direct database authentication without Supabase Auth
 * FOR MVP TESTING ONLY - Replace with proper auth in production
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface LoginRequest {
  email?: string
  username?: string
  student_id?: string
}

// POST /api/auth/student-simple - Simplified login
export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    
    if (!body.email && !body.username && !body.student_id) {
      return NextResponse.json({
        success: false,
        error: 'Email, username, or student_id required'
      }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Build query based on provided identifier
    let studentQuery = supabase
      .from('students')
      .select(`
        *,
        student_rankings (
          total_points,
          total_coins,
          current_level,
          current_rank,
          class_rank,
          current_streak,
          longest_streak,
          last_activity_date
        ),
        student_group_enrollments (
          id,
          status,
          enrollment_date,
          groups (
            id,
            name,
            level,
            subject,
            schedule
          )
        )
      `)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single()

    // Apply filter based on provided field
    if (body.email) {
      studentQuery = studentQuery.eq('email', body.email)
    } else if (body.username) {
      // For username, check student_profiles table first
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('student_id')
        .eq('username', body.username)
        .single()
      
      if (profile) {
        studentQuery = studentQuery.eq('id', profile.student_id)
      } else {
        return NextResponse.json({
          success: false,
          error: 'Student not found'
        }, { status: 404 })
      }
    } else if (body.student_id) {
      studentQuery = studentQuery.eq('student_id', body.student_id)
    }

    const { data: student, error: studentError } = await studentQuery

    if (studentError || !student) {
      return NextResponse.json({
        success: false,
        error: 'Student not found'
      }, { status: 404 })
    }

    // Check for student profile
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('student_id', student.id)
      .single()

    // Create a simple session token (FOR TESTING ONLY)
    const sessionToken = Buffer.from(JSON.stringify({
      student_id: student.id,
      email: student.email,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    })).toString('base64')

    // Calculate age for privacy check
    const birthDate = new Date(student.date_of_birth)
    const age = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365))
    const isMinor = age < 18

    // Privacy filter for minors
    const sanitizedStudent = {
      ...student,
      ...(isMinor && {
        primary_phone: null,
        secondary_phone: null,
        address: null,
        parent_guardian_info: student.parent_guardian_info, // Keep guardian info
        privacy_protected: true
      }),
      profile: profile || {
        username: body.username || null,
        is_minor: isMinor,
        vocabulary_daily_goal: 5,
        notification_preferences: { email: true, push: true }
      },
      ranking: student.student_rankings?.[0] || {
        total_points: 0,
        total_coins: 0,
        current_level: 1,
        current_rank: null,
        class_rank: null,
        current_streak: 0,
        longest_streak: 0
      },
      group_enrollments: student.student_group_enrollments || []
    }

    // Update last activity if profile exists
    if (profile) {
      await supabase
        .from('student_profiles')
        .update({
          last_login_at: new Date().toISOString(),
          login_count: (profile.login_count || 0) + 1
        })
        .eq('id', profile.id)
    }

    return NextResponse.json({
      success: true,
      data: {
        session: {
          token: sessionToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'simplified_auth'
        },
        student: sanitizedStudent
      }
    })

  } catch (error) {
    console.error('Simplified auth error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// GET /api/auth/student-simple - Get current student (using token)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'No token provided'
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // Decode simple token
    let tokenData
    try {
      tokenData = JSON.parse(Buffer.from(token, 'base64').toString())
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid token'
      }, { status: 401 })
    }

    // Check expiration
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Token expired'
      }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch student data
    const { data: student, error } = await supabase
      .from('students')
      .select(`
        *,
        student_rankings (
          total_points,
          total_coins,
          current_level,
          current_rank,
          class_rank
        ),
        student_group_enrollments (
          id,
          status,
          groups (
            id,
            name,
            level,
            subject
          )
        )
      `)
      .eq('id', tokenData.student_id)
      .single()

    if (error || !student) {
      return NextResponse.json({
        success: false,
        error: 'Student not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        student: {
          ...student,
          ranking: student.student_rankings?.[0],
          group_enrollments: student.student_group_enrollments
        }
      }
    })

  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}