import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const approveRewardSchema = z.object({
  rewardIds: z.array(z.string().uuid()).min(1, 'At least one reward must be selected'),
  action: z.enum(['approve', 'reject']),
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

    // Check if user has permission to approve rewards
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { rewardIds, action, notes, metadata } = approveRewardSchema.parse(body)

    // Get reward requests to validate
    const { data: rewardRequests, error: rewardsError } = await supabase
      .from('reward_requests')
      .select(`
        *,
        user:profiles!user_id(id, full_name, role),
        reward:rewards(id, name, cost, type, description)
      `)
      .in('id', rewardIds)
      .eq('organization_id', profile.organization_id)
      .eq('status', 'pending')

    if (rewardsError) {
      console.error('Error fetching reward requests:', rewardsError)
      return NextResponse.json({ error: 'Failed to fetch reward requests' }, { status: 500 })
    }

    if (rewardRequests.length !== rewardIds.length) {
      return NextResponse.json(
        { error: 'Some reward requests not found or not pending' },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()
    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    // Update reward requests status
    const { data: updatedRequests, error: updateError } = await supabase
      .from('reward_requests')
      .update({
        status: newStatus,
        approved_by: profile.id,
        approved_at: now,
        admin_notes: notes || null,
        updated_at: now
      })
      .in('id', rewardIds)
      .select('*')

    if (updateError) {
      console.error('Error updating reward requests:', updateError)
      return NextResponse.json({ error: 'Failed to update reward requests' }, { status: 500 })
    }

    // If approved, deduct coins from users and create transactions
    if (action === 'approve') {
      const deductionResults = await Promise.all(
        rewardRequests.map(async (request) => {
          const user = request.user
          const reward = request.reward

          if (!user || !reward) {
            console.error('Missing user or reward data for request:', request.id)
            return null
          }

          // Get current user ranking
          const { data: currentRanking } = await supabase
            .from('user_rankings')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .eq('user_id', user.id)
            .single()

          if (!currentRanking || currentRanking.total_coins < reward.cost) {
            console.error('User does not have enough coins for reward:', request.id)
            return null
          }

          // Create transaction record
          const { error: transactionError } = await supabase
            .from('point_transactions')
            .insert({
              user_id: user.id,
              organization_id: profile.organization_id,
              transaction_type: 'deducted',
              points_amount: -reward.cost, // Deduct coins as negative points
              reason: `Reward redeemed: ${reward.name}`,
              category: 'reward',
              awarded_by: profile.id,
              metadata: {
                reward_id: reward.id,
                reward_request_id: request.id,
                reward_name: reward.name
              }
            })

          if (transactionError) {
            console.error('Error creating transaction:', transactionError)
            return null
          }

          // Update user ranking (deduct coins)
          const { error: rankingError } = await supabase
            .from('user_rankings')
            .update({
              total_coins: currentRanking.total_coins - reward.cost,
              last_activity_at: now,
              updated_at: now
            })
            .eq('id', currentRanking.id)

          if (rankingError) {
            console.error('Error updating user ranking:', rankingError)
            return null
          }

          return {
            user_id: user.id,
            user_name: user.full_name,
            reward_name: reward.name,
            coins_deducted: reward.cost
          }
        })
      )

      // Filter out failed deductions
      const successfulDeductions = deductionResults.filter(Boolean)

      // Create notifications for approved rewards
      const notifications = rewardRequests.map(request => ({
        user_id: request.user_id,
        organization_id: profile.organization_id,
        title: action === 'approve' ? 'Reward Approved!' : 'Reward Request Rejected',
        message: action === 'approve' 
          ? `Your reward request for "${request.reward?.name}" has been approved!`
          : `Your reward request for "${request.reward?.name}" has been rejected.${notes ? ` Reason: ${notes}` : ''}`,
        type: 'reward',
        data: {
          reward_request_id: request.id,
          reward_id: request.reward_id,
          reward_name: request.reward?.name,
          action,
          admin_notes: notes
        },
        created_at: now,
      }))

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notificationError) {
        console.error('Error creating notifications:', notificationError)
        // Don't fail the approval, but log the error
      }

      return NextResponse.json({
        message: `Rewards ${action}d successfully`,
        processed_count: updatedRequests.length,
        successful_deductions: successfulDeductions.length,
        failed_deductions: rewardRequests.length - successfulDeductions.length,
        reward_requests: updatedRequests,
        deduction_details: successfulDeductions
      }, { status: 200 })
    }

    // For rejections, just return the updated requests
    return NextResponse.json({
      message: `Rewards ${action}d successfully`,
      processed_count: updatedRequests.length,
      reward_requests: updatedRequests
    }, { status: 200 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in reward approval:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch pending reward requests
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check permissions
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const status = searchParams.get('status') || 'pending'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch reward requests
    const { data: rewardRequests, error: fetchError } = await supabase
      .from('reward_requests')
      .select(`
        *,
        user:profiles!user_id(id, full_name, role, avatar_url),
        reward:rewards(id, name, cost, type, description, image_url),
        approver:profiles!approved_by(id, full_name)
      `)
      .eq('organization_id', profile.organization_id)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (fetchError) {
      console.error('Error fetching reward requests:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch reward requests' }, { status: 500 })
    }

    return NextResponse.json({
      reward_requests: rewardRequests || [],
      total_count: rewardRequests?.length || 0
    })

  } catch (error) {
    console.error('Error in GET reward requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}