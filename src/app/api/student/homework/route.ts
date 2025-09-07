/**
 * Student Homework API
 * GET /api/student/homework - Get student's homework assignments
 * POST /api/student/homework/[id]/submit - Submit homework (separate file)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'

type Hometask = Database['public']['Tables']['hometasks']['Row']
type Submission = Database['public']['Tables']['student_hometask_submissions']['Row']
type Group = Database['public']['Tables']['groups']['Row']

interface HomeworkResponse {
  success: boolean
  data?: {
    assignments: (Hometask & {
      group: Pick<Group, 'id' | 'name' | 'level'>
      submission?: Submission
      status_info: {
        is_submitted: boolean
        is_graded: boolean
        is_overdue: boolean
        days_until_due: number
      }
    })[]
    stats?: {
      total_assignments: number
      completed: number
      pending: number
      overdue: number
      graded: number
    }
  }
  error?: string
}

// GET /api/student/homework
export async function GET(request: NextRequest): Promise<NextResponse<HomeworkResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending', 'submitted', 'graded', 'overdue', 'all'
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
          assignments: [],
          stats: {
            total_assignments: 0,
            completed: 0,
            pending: 0,
            overdue: 0,
            graded: 0
          }
        }
      })
    }

    // Get homework assignments for enrolled groups
    let homeworkQuery = supabase
      .from('hometasks')
      .select(`
        *,
        groups!inner (
          id,
          name,
          level
        ),
        student_hometask_submissions (
          id,
          submission_text,
          submission_files,
          submitted_at,
          score,
          max_score,
          feedback,
          graded_by,
          graded_at,
          status,
          late_submission,
          attempt_number
        )
      `)
      .eq('organization_id', profile.organization_id)
      .in('group_id', enrolledGroupIds)
      .eq('is_published', true)
      .is('deleted_at', null)

    // Filter by student's submissions
    homeworkQuery = homeworkQuery
      .or(`student_hometask_submissions.student_id.is.null,student_hometask_submissions.student_id.eq.${profile.student_id}`)

    const { data: homework, error: homeworkError } = await homeworkQuery
      .order('due_date', { ascending: true })
      .limit(limit)

    if (homeworkError) {
      console.error('Homework fetch error:', homeworkError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch homework'
      }, { status: 500 })
    }

    const now = new Date()

    // Transform and filter assignments
    const transformedAssignments = homework?.map(assignment => {
      const submission = assignment.student_hometask_submissions?.[0]
      const dueDate = new Date(assignment.due_date)
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      const statusInfo = {
        is_submitted: !!submission && submission.status !== 'draft',
        is_graded: !!submission && submission.status === 'graded',
        is_overdue: daysUntilDue < 0 && (!submission || submission.status === 'draft'),
        days_until_due: daysUntilDue
      }

      return {
        ...assignment,
        group: {
          id: assignment.groups.id,
          name: assignment.groups.name,
          level: assignment.groups.level
        },
        submission,
        status_info: statusInfo,
        groups: undefined,
        student_hometask_submissions: undefined
      }
    }).filter(assignment => {
      // Apply status filtering
      if (!status || status === 'all') return true
      
      if (status === 'pending') {
        return !assignment.status_info.is_submitted && !assignment.status_info.is_overdue
      }
      if (status === 'submitted') {
        return assignment.status_info.is_submitted && !assignment.status_info.is_graded
      }
      if (status === 'graded') {
        return assignment.status_info.is_graded
      }
      if (status === 'overdue') {
        return assignment.status_info.is_overdue
      }
      
      return true
    }) || []

    // Calculate statistics
    const stats = {
      total_assignments: transformedAssignments.length,
      completed: transformedAssignments.filter(a => a.status_info.is_graded).length,
      pending: transformedAssignments.filter(a => !a.status_info.is_submitted && !a.status_info.is_overdue).length,
      overdue: transformedAssignments.filter(a => a.status_info.is_overdue).length,
      graded: transformedAssignments.filter(a => a.status_info.is_graded).length
    }

    return NextResponse.json({
      success: true,
      data: {
        assignments: transformedAssignments,
        stats
      }
    })

  } catch (error) {
    console.error('Homework API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}