/**
 * Student Leaderboard API
 * GET /api/student/leaderboard - Get leaderboard data
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'

type StudentRanking = Database['public']['Tables']['student_rankings']['Row']
type Student = Database['public']['Tables']['students']['Row']

interface LeaderboardResponse {
  success: boolean
  data?: {
    leaderboard: (StudentRanking & {
      student: Pick<Student, 'id' | 'first_name' | 'last_name' | 'full_name' | 'profile_image_url'>
      position: number
      is_current_student?: boolean
    })[]
    current_student?: {
      position: number
      total_points: number
      available_coins: number
      rank_change: number
    }
    stats?: {
      total_students: number
      current_student_rank: number
      points_to_next_rank: number
    }
  }
  error?: string
}

// GET /api/student/leaderboard
export async function GET(request: NextRequest): Promise<NextResponse<LeaderboardResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') || 'organization' // 'organization', 'group'
    const period = searchParams.get('period') || 'all_time' // 'weekly', 'monthly', 'all_time'
    const limit = parseInt(searchParams.get('limit') || '50')
    const groupId = searchParams.get('group_id')

    const supabase = createClient()

    // Get current student
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Get student profile
    const { data: profile } = await supabase
      .from('student_profiles')
      .select(`
        student_id,
        organization_id,
        students!inner (
          student_group_enrollments (
            group_id
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

    // Build base query
    let rankingsQuery = supabase
      .from('student_rankings')
      .select(`
        *,
        students!inner (
          id,
          first_name,
          last_name,
          full_name,
          profile_image_url,
          enrollment_status
        )
      `)
      .eq('organization_id', profile.organization_id)
      .eq('students.enrollment_status', 'active')
      .is('students.deleted_at', null)

    // Apply scope filtering
    if (scope === 'group' && groupId) {
      // Filter by specific group
      rankingsQuery = rankingsQuery
        .in('student_id', 
          supabase
            .from('student_group_enrollments')
            .select('student_id')
            .eq('group_id', groupId)
            .eq('status', 'enrolled')
        )
    } else if (scope === 'group') {
      // Filter by current student's groups
      const enrolledGroupIds = profile.students.student_group_enrollments.map(e => e.group_id)
      if (enrolledGroupIds.length > 0) {
        rankingsQuery = rankingsQuery
          .in('student_id',
            supabase
              .from('student_group_enrollments')
              .select('student_id')
              .in('group_id', enrolledGroupIds)
              .eq('status', 'enrolled')
          )
      }
    }

    // For now, we'll implement all_time ranking
    // TODO: Implement weekly/monthly rankings using points_transactions
    if (period === 'weekly' || period === 'monthly') {
      // This would require aggregating points_transactions by date
      // For now, fall back to all_time
    }

    // Get rankings ordered by total points
    const { data: rankings, error: rankingsError } = await rankingsQuery
      .order('total_points', { ascending: false })
      .order('last_activity_at', { ascending: false }) // Tiebreaker
      .limit(limit)

    if (rankingsError) {
      console.error('Leaderboard fetch error:', rankingsError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch leaderboard'
      }, { status: 500 })
    }

    // Add position and mark current student
    const leaderboard = rankings?.map((ranking, index) => ({
      ...ranking,
      student: {
        id: ranking.students.id,
        first_name: ranking.students.first_name,
        last_name: ranking.students.last_name,
        full_name: ranking.students.full_name,
        profile_image_url: ranking.students.profile_image_url
      },
      position: index + 1,
      is_current_student: ranking.student_id === profile.student_id,
      students: undefined // Remove nested object
    })) || []

    // Find current student's data
    const currentStudentEntry = leaderboard.find(entry => entry.is_current_student)
    
    // If current student not in top results, get their ranking separately
    let currentStudentData = null
    if (!currentStudentEntry) {
      const { data: currentRanking } = await supabase
        .from('student_rankings')
        .select('*')
        .eq('student_id', profile.student_id)
        .single()

      if (currentRanking) {
        // Calculate actual position by counting students with higher points
        const { count: higherRankedCount } = await supabase
          .from('student_rankings')
          .select('*', { count: 'exact' })
          .eq('organization_id', profile.organization_id)
          .gt('total_points', currentRanking.total_points)

        currentStudentData = {
          position: (higherRankedCount || 0) + 1,
          total_points: currentRanking.total_points,
          available_coins: currentRanking.available_coins,
          rank_change: 0 // TODO: Calculate from historical data
        }
      }
    } else {
      currentStudentData = {
        position: currentStudentEntry.position,
        total_points: currentStudentEntry.total_points,
        available_coins: currentStudentEntry.available_coins,
        rank_change: 0 // TODO: Calculate from historical data
      }
    }

    // Calculate stats
    const { count: totalStudentsCount } = await supabase
      .from('student_rankings')
      .select('*', { count: 'exact' })
      .eq('organization_id', profile.organization_id)

    let pointsToNextRank = 0
    if (currentStudentData && currentStudentData.position > 1) {
      const nextRankPosition = currentStudentData.position - 1
      const nextRankStudent = leaderboard.find(s => s.position === nextRankPosition)
      if (nextRankStudent) {
        pointsToNextRank = nextRankStudent.total_points - currentStudentData.total_points
      }
    }

    const stats = {
      total_students: totalStudentsCount || 0,
      current_student_rank: currentStudentData?.position || 0,
      points_to_next_rank: pointsToNextRank
    }

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        current_student: currentStudentData,
        stats
      }
    })

  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}