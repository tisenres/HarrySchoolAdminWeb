import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const awardAchievementSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, 'At least one user must be selected'),
  achievementId: z.string().uuid().min(1, 'Achievement ID is required'),
  userType: z.enum(['student', 'teacher', 'both']).default('student'),
  notes: z.string().optional(),
  metadata: z.object({}).passthrough().optional()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile and check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, organization_id, role, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if user has permission to award achievements
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { userIds, achievementId, userType, notes, metadata } = awardAchievementSchema.parse(body)

    // Verify achievement exists and is active
    const { data: achievement, error: achievementError } = await supabase
      .from('achievements')
      .select('*')
      .eq('id', achievementId)
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

    // Check if achievement target_role matches requested userType
    if (achievement.target_role !== 'both' && achievement.target_role !== userType) {
      return NextResponse.json(
        { error: `This achievement is only available for ${achievement.target_role}s` },
        { status: 400 }
      )
    }

    // Verify all users exist and belong to organization with correct role
    const { data: targetUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, role, organization_id')
      .in('id', userIds)
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)

    if (usersError) {
      return NextResponse.json({ error: 'Error fetching users' }, { status: 500 })
    }

    if (targetUsers.length !== userIds.length) {
      return NextResponse.json(
        { error: 'One or more users not found in your organization' },
        { status: 404 }
      )
    }

    // Filter users based on their role matching the requested userType
    const validUsers = targetUsers.filter(user => {
      if (userType === 'both') return ['student', 'teacher'].includes(user.role)
      return user.role === userType
    })

    if (validUsers.length === 0) {
      return NextResponse.json(
        { error: `No users found with role: ${userType}` },
        { status: 400 }
      )
    }

    // Check for existing user achievements to avoid duplicates
    const { data: existingAchievements, error: existingError } = await supabase
      .from('user_achievements')
      .select('user_id')
      .eq('achievement_id', achievementId)
      .in('user_id', validUsers.map(u => u.id))
      .is('deleted_at', null)

    if (existingError) {
      console.error('Error checking existing achievements:', existingError)
      return NextResponse.json(
        { error: 'Failed to check existing achievements' },
        { status: 500 }
      )
    }

    // Filter out users who already have this achievement
    const existingUserIds = existingAchievements?.map(a => a.user_id) || []
    const usersToAward = validUsers.filter(user => !existingUserIds.includes(user.id))

    if (usersToAward.length === 0) {
      return NextResponse.json(
        { error: 'All selected users already have this achievement' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // Create user achievements
    const userAchievements = usersToAward.map(user => ({
      user_id: user.id,
      achievement_id: achievementId,
      organization_id: profile.organization_id,
      earned_date: now,
      awarded_by: user.id,
      notes: notes || null,
      user_type: user.role,
      points_at_earning: achievement.points_reward || 0,
      coins_at_earning: achievement.coins_reward || 0
    }))

    const { data: createdAchievements, error: createError } = await supabase
      .from('user_achievements')
      .insert(userAchievements)
      .select()

    if (createError) {
      console.error('Error creating user achievements:', createError)
      return NextResponse.json(
        { error: 'Failed to award achievements' },
        { status: 500 }
      )
    }

    // Create point transactions for users
    const pointsUpdates = usersToAward.map(user => ({
      user_id: user.id,
      transaction_type: 'earned' as const,
      points_amount: achievement.points_reward || 0,
      reason: `Achievement: ${achievement.name}`,
      category: 'achievement',
      awarded_by: profile.id,
      organization_id: profile.organization_id,
      metadata: { achievement_id: achievementId, achievement_name: achievement.name }
    }))

    // Insert points transactions
    if (achievement.points_reward && achievement.points_reward > 0 && pointsUpdates.length > 0) {
      const { error: pointsError } = await supabase
        .from('point_transactions')
        .insert(pointsUpdates)

      if (pointsError) {
        console.error('Error creating points transactions:', pointsError)
        // Don't fail the achievement award, but log the error
      }

      // Update user rankings for each user
      for (const user of usersToAward) {
        // Get current ranking or create new one
        const { data: currentRanking } = await supabase
          .from('user_rankings')
          .select('*')
          .eq('organization_id', profile.organization_id)
          .eq('user_id', user.id)
          .single()

        const pointsChange = achievement.points_reward || 0
        const coinsChange = achievement.coins_reward || 0
        const newTotalPoints = (currentRanking?.total_points || 0) + pointsChange
        const newTotalCoins = Math.max(0, (currentRanking?.total_coins || 0) + coinsChange)
        const newLevel = Math.floor(newTotalPoints / 100) + 1

        const rankingData = {
          organization_id: profile.organization_id,
          user_id: user.id,
          total_points: Math.max(0, newTotalPoints),
          total_coins: newTotalCoins,
          current_level: Math.max(1, newLevel),
          user_type: user.role,
          last_activity_at: now,
          updated_at: now
        }

        if (currentRanking) {
          // Update existing ranking
          const { error: updateError } = await supabase
            .from('user_rankings')
            .update(rankingData)
            .eq('id', currentRanking.id)

          if (updateError) {
            console.error('Failed to update user ranking:', updateError)
          }
        } else {
          // Create new ranking
          const { error: createError } = await supabase
            .from('user_rankings')
            .insert(rankingData)

          if (createError) {
            console.error('Failed to create user ranking:', createError)
          }
        }
      }
    }

    // Create notifications for users
    const notifications = usersToAward.map(user => ({
      user_id: user.id,
      organization_id: profile.organization_id,
      title: 'Achievement Earned!',
      message: `Congratulations! You earned the "${achievement.name}" achievement.`,
      type: 'achievement',
      data: {
        achievement_id: achievementId,
        achievement_name: achievement.name,
        points_reward: achievement.points_reward || 0,
        coins_reward: achievement.coins_reward || 0,
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
      awarded_count: usersToAward.length,
      skipped_count: existingUserIds.length,
      achievements: createdAchievements,
      users_affected: usersToAward.map(user => ({
        id: user.id,
        name: user.full_name,
        role: user.role
      }))
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