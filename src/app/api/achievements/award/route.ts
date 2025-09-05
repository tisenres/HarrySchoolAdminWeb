import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

const awardAchievementSchema = z.object({
  student_ids: z.array(z.string()).min(1, 'At least one student must be selected'),
  achievement_id: z.string().min(1, 'Achievement ID is required'),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { student_ids, achievement_id, notes } = awardAchievementSchema.parse(body)

    // Verify achievement exists and is active
    const { data: achievement, error: achievementError } = await supabase
      .from('achievements')
      .select('*')
      .eq('id', achievement_id)
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single()

    if (achievementError || !achievement) {
      return NextResponse.json(
        { error: 'Achievement not found or not active' },
        { status: 404 }
      )
    }

    // Verify all students exist and belong to organization
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, full_name')
      .in('id', student_ids)
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)

    if (studentsError || !students || students.length !== student_ids.length) {
      return NextResponse.json(
        { error: 'One or more students not found' },
        { status: 404 }
      )
    }

    // Check for existing student achievements to avoid duplicates
    const { data: existingAchievements, error: existingError } = await supabase
      .from('student_achievements')
      .select('student_id')
      .eq('achievement_id', achievement_id)
      .in('student_id', student_ids)
      .is('deleted_at', null)

    if (existingError) {
      console.error('Error checking existing achievements:', existingError)
      return NextResponse.json(
        { error: 'Failed to check existing achievements' },
        { status: 500 }
      )
    }

    // Filter out students who already have this achievement
    const existingStudentIds = existingAchievements?.map(a => a.student_id) || []
    const newStudentIds = student_ids.filter(id => !existingStudentIds.includes(id))

    if (newStudentIds.length === 0) {
      return NextResponse.json(
        { error: 'All selected students already have this achievement' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // Create student achievements
    const studentAchievements = newStudentIds.map(student_id => ({
      student_id,
      achievement_id,
      organization_id: profile.organization_id,
      earned_at: now,
      awarded_by: session.user.id,
      notes: notes || null,
    }))

    const { data: createdAchievements, error: createError } = await supabase
      .from('student_achievements')
      .insert(studentAchievements)
      .select()

    if (createError) {
      console.error('Error creating student achievements:', createError)
      return NextResponse.json(
        { error: 'Failed to award achievements' },
        { status: 500 }
      )
    }

    // Update student rankings with points and coins
    const pointsUpdates = newStudentIds.map(student_id => ({
      student_id,
      transaction_type: 'earned' as const,
      points_amount: achievement.points_reward,
      coins_earned: achievement.coins_reward,
      reason: `Achievement: ${achievement.name}`,
      category: 'achievement',
      awarded_by: session.user.id,
      organization_id: profile.organization_id,
      created_at: now,
    }))

    // Insert points transactions
    if (achievement.points_reward > 0 || achievement.coins_reward > 0) {
      const { error: pointsError } = await supabase
        .from('points_transactions')
        .insert(pointsUpdates)

      if (pointsError) {
        console.error('Error creating points transactions:', pointsError)
        // Don't fail the achievement award, but log the error
      }

      // Update student rankings
      for (const student_id of newStudentIds) {
        const { error: rankingError } = await supabase.rpc('update_student_ranking', {
          p_student_id: student_id,
          p_points_change: achievement.points_reward,
          p_coins_change: achievement.coins_reward,
        })

        if (rankingError) {
          console.error('Error updating student ranking:', rankingError)
          // Don't fail the achievement award, but log the error
        }
      }
    }

    // Create notifications for students
    const notifications = newStudentIds.map(student_id => ({
      user_id: student_id,
      organization_id: profile.organization_id,
      title: 'Achievement Earned!',
      message: `Congratulations! You earned the "${achievement.name}" achievement.`,
      type: 'achievement',
      data: {
        achievement_id,
        achievement_name: achievement.name,
        points_reward: achievement.points_reward,
        coins_reward: achievement.coins_reward,
      },
      created_at: now,
    }))

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (notificationError) {
      console.error('Error creating notifications:', notificationError)
      // Don't fail the achievement award, but log the error
    }

    return NextResponse.json({
      message: 'Achievements awarded successfully',
      awarded_count: newStudentIds.length,
      skipped_count: existingStudentIds.length,
      achievements: createdAchievements,
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in achievement award:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}