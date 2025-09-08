import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const awardPointsSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(50),
  points: z.number().int().min(-1000).max(1000),
  reason: z.string().min(1).max(500),
  category: z.string().min(1).max(100).default('manual'),
  transactionType: z.enum(['earned', 'deducted', 'bonus', 'penalty']).default('earned'),
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
      .select('id, organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if user has permission to award points
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = awardPointsSchema.parse(body)

    const { userIds, points, reason, category, transactionType, metadata } = validatedData

    // Verify all users belong to the same organization
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
      return NextResponse.json({ 
        error: 'Some users not found in your organization' 
      }, { status: 400 })
    }

    // Create transactions for each user
    const transactions = userIds.map(userId => ({
      organization_id: profile.organization_id,
      user_id: userId,
      transaction_type: transactionType,
      points_amount: points,
      reason,
      category,
      metadata: metadata || {},
      awarded_by: profile.id
    }))

    // Insert point transactions
    const { data: createdTransactions, error: transactionError } = await supabase
      .from('point_transactions')
      .insert(transactions)
      .select('*')

    if (transactionError) {
      return NextResponse.json({ 
        error: 'Failed to create point transactions',
        details: transactionError.message 
      }, { status: 500 })
    }

    // Update or create user rankings for each user
    const rankingUpdates = await Promise.all(
      userIds.map(async (userId) => {
        const targetUser = targetUsers.find(u => u.id === userId)
        if (!targetUser) return null

        // Get current ranking or create new one
        const { data: currentRanking } = await supabase
          .from('user_rankings')
          .select('*')
          .eq('organization_id', profile.organization_id)
          .eq('user_id', userId)
          .single()

        const newTotalPoints = (currentRanking?.total_points || 0) + points
        const newLevel = Math.floor(newTotalPoints / 100) + 1 // Simple level calculation

        // Convert points to coins (1 point = 1 coin for simplicity)
        const coinChange = transactionType === 'earned' || transactionType === 'bonus' ? points : 0
        const newTotalCoins = Math.max(0, (currentRanking?.total_coins || 0) + coinChange)

        const rankingData = {
          organization_id: profile.organization_id,
          user_id: userId,
          total_points: Math.max(0, newTotalPoints),
          total_coins: newTotalCoins,
          current_level: Math.max(1, newLevel),
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        if (currentRanking) {
          // Update existing ranking
          const { data: updatedRanking, error: updateError } = await supabase
            .from('user_rankings')
            .update(rankingData)
            .eq('id', currentRanking.id)
            .select('*')
            .single()

          if (updateError) {
            console.error('Failed to update ranking:', updateError)
            return null
          }
          return updatedRanking
        } else {
          // Create new ranking
          const { data: newRanking, error: createError } = await supabase
            .from('user_rankings')
            .insert(rankingData)
            .select('*')
            .single()

          if (createError) {
            console.error('Failed to create ranking:', createError)
            return null
          }
          return newRanking
        }
      })
    )

    // Filter out any failed updates
    const successfulRankingUpdates = rankingUpdates.filter(Boolean)

    // Recalculate ranks for all users in the organization
    await recalculateRanks(supabase, profile.organization_id)

    return NextResponse.json({
      success: true,
      data: {
        transactions: createdTransactions,
        updatedRankings: successfulRankingUpdates,
        usersAffected: targetUsers.map(user => ({
          id: user.id,
          name: user.full_name,
          role: user.role
        }))
      }
    })

  } catch (error) {
    console.error('Points award error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to recalculate ranks
async function recalculateRanks(supabase: any, organizationId: string) {
  try {
    // Get all users ordered by points (desc) for ranking calculation
    const { data: users, error } = await supabase
      .from('user_rankings')
      .select('id, total_points')
      .eq('organization_id', organizationId)
      .order('total_points', { ascending: false })

    if (error || !users) {
      console.error('Failed to fetch users for rank calculation:', error)
      return
    }

    // Update ranks
    const rankUpdates = users.map((user, index) => ({
      id: user.id,
      current_rank: index + 1
    }))

    // Update ranks in batches
    for (const update of rankUpdates) {
      await supabase
        .from('user_rankings')
        .update({ current_rank: update.current_rank })
        .eq('id', update.id)
    }
  } catch (error) {
    console.error('Error recalculating ranks:', error)
  }
}