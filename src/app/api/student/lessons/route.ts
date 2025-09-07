/**
 * Student Lessons API
 * GET /api/student/lessons - Get student's lessons
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'

type Lesson = Database['public']['Tables']['lessons']['Row']
type Group = Database['public']['Tables']['groups']['Row']
type Teacher = Database['public']['Tables']['teachers']['Row']

interface LessonResponse {
  success: boolean
  data?: {
    lessons: (Lesson & {
      group: Group & { teacher: Teacher }
      progress?: any
    })[]
    stats?: {
      total_lessons: number
      completed: number
      in_progress: number
      upcoming: number
    }
  }
  error?: string
}

// GET /api/student/lessons
export async function GET(request: NextRequest): Promise<NextResponse<LessonResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'upcoming', 'completed', 'all'
    const limit = parseInt(searchParams.get('limit') || '20')

    const supabase = createClient()

    // Get current student
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Get student profile and enrollments
    const { data: profile } = await supabase
      .from('student_profiles')
      .select(`
        student_id,
        organization_id,
        students!inner (
          student_group_enrollments (
            group_id,
            status
          )
        )
      `)
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({
        success: false,
        error: 'Student profile not found'
      }, { status: 404 })
    }

    // Get enrolled group IDs
    const enrolledGroupIds = profile.students.student_group_enrollments
      .filter(e => e.status === 'enrolled')
      .map(e => e.group_id)

    if (enrolledGroupIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          lessons: [],
          stats: {
            total_lessons: 0,
            completed: 0,
            in_progress: 0,
            upcoming: 0
          }
        }
      })
    }

    // Build lessons query
    let lessonsQuery = supabase
      .from('lessons')
      .select(`
        *,
        groups!inner (
          id,
          name,
          level,
          description,
          teachers (
            id,
            first_name,
            last_name,
            full_name
          )
        )
      `)
      .eq('organization_id', profile.organization_id)
      .in('group_id', enrolledGroupIds)
      .eq('is_published', true)
      .is('deleted_at', null)

    // Apply status filter
    if (status === 'upcoming') {
      lessonsQuery = lessonsQuery
        .eq('lesson_type', 'regular')
        .order('order_index', { ascending: true })
    } else if (status === 'completed') {
      // For now, we'll consider all published lessons as potentially completed
      // Later, we can add lesson progress tracking
      lessonsQuery = lessonsQuery
        .order('order_index', { ascending: true })
    }

    lessonsQuery = lessonsQuery
      .order('order_index', { ascending: true })
      .limit(limit)

    const { data: lessons, error: lessonsError } = await lessonsQuery

    if (lessonsError) {
      console.error('Lessons fetch error:', lessonsError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch lessons'
      }, { status: 500 })
    }

    // Transform the data structure
    const transformedLessons = lessons?.map(lesson => ({
      ...lesson,
      group: {
        ...lesson.groups,
        teacher: lesson.groups.teachers
      },
      groups: undefined, // Remove the nested structure
      progress: {
        status: 'not_started', // TODO: Implement lesson progress tracking
        completed_at: null,
        time_spent_minutes: 0,
        completion_percentage: 0
      }
    })) || []

    // Calculate basic statistics
    const stats = {
      total_lessons: transformedLessons.length,
      completed: 0, // TODO: Count from progress data
      in_progress: 0, // TODO: Count from progress data  
      upcoming: transformedLessons.length // TODO: Filter by actual status
    }

    return NextResponse.json({
      success: true,
      data: {
        lessons: transformedLessons,
        stats
      }
    })

  } catch (error) {
    console.error('Lessons API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}