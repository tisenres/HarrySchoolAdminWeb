import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET - Get rewards analytics and insights
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    
    // Get user's organization
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .single()
    
    if (!userProfile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 403 })
    }

    // Parse date filters
    const date_from = searchParams.get('date_from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const date_to = searchParams.get('date_to') || new Date().toISOString()

    // Get overall statistics
    const [
      { data: totalRewards },
      { data: totalRedemptions },
      { data: pendingRedemptions },
      { data: totalCoinsSpent },
      { data: activeStudents },
    ] = await Promise.all([
      // Total active rewards
      supabase
        .from('rewards_catalog')
        .select('id', { count: 'exact' })
        .eq('organization_id', userProfile.organization_id)
        .eq('is_active', true)
        .is('deleted_at', null),

      // Total redemptions in period
      supabase
        .from('reward_redemptions')
        .select('id', { count: 'exact' })
        .eq('organization_id', userProfile.organization_id)
        .gte('redeemed_at', date_from)
        .lte('redeemed_at', date_to)
        .is('deleted_at', null),

      // Pending redemptions
      supabase
        .from('reward_redemptions')
        .select('id', { count: 'exact' })
        .eq('organization_id', userProfile.organization_id)
        .eq('status', 'pending')
        .is('deleted_at', null),

      // Total coins spent in period
      supabase
        .from('reward_redemptions')
        .select('coins_spent')
        .eq('organization_id', userProfile.organization_id)
        .in('status', ['approved', 'delivered'])
        .gte('redeemed_at', date_from)
        .lte('redeemed_at', date_to)
        .is('deleted_at', null),

      // Students who redeemed rewards in period
      supabase
        .from('reward_redemptions')
        .select('student_id')
        .eq('organization_id', userProfile.organization_id)
        .gte('redeemed_at', date_from)
        .lte('redeemed_at', date_to)
        .is('deleted_at', null)
    ])

    // Calculate metrics
    const totalCoinsSpentAmount = totalCoinsSpent?.reduce((sum, r) => sum + (r.coins_spent || 0), 0) || 0
    const uniqueActiveStudents = new Set(activeStudents?.map(r => r.student_id) || []).size

    // Get most popular rewards
    const { data: popularRewards } = await supabase
      .from('reward_redemptions')
      .select(`
        reward_id,
        coins_spent,
        reward:rewards_catalog(name, reward_type, coin_cost)
      `)
      .eq('organization_id', userProfile.organization_id)
      .in('status', ['approved', 'delivered'])
      .gte('redeemed_at', date_from)
      .lte('redeemed_at', date_to)
      .is('deleted_at', null)

    // Aggregate popular rewards
    const rewardPopularity = popularRewards?.reduce((acc, redemption) => {
      const rewardId = redemption.reward_id
      if (!acc[rewardId]) {
        acc[rewardId] = {
          reward_id: rewardId,
          reward_name: redemption.reward?.name || 'Unknown',
          reward_type: redemption.reward?.reward_type || 'unknown',
          coin_cost: redemption.reward?.coin_cost || 0,
          redemption_count: 0,
          total_coins_spent: 0
        }
      }
      acc[rewardId].redemption_count += 1
      acc[rewardId].total_coins_spent += redemption.coins_spent
      return acc
    }, {} as Record<string, any>) || {}

    const topRewards = Object.values(rewardPopularity)
      .sort((a: any, b: any) => b.redemption_count - a.redemption_count)
      .slice(0, 10)

    // Get redemptions by status
    const { data: redemptionsByStatus } = await supabase
      .from('reward_redemptions')
      .select('status')
      .eq('organization_id', userProfile.organization_id)
      .gte('redeemed_at', date_from)
      .lte('redeemed_at', date_to)
      .is('deleted_at', null)

    const statusCounts = redemptionsByStatus?.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get redemptions by reward type
    const { data: redemptionsByType } = await supabase
      .from('reward_redemptions')
      .select(`
        reward:rewards_catalog(reward_type)
      `)
      .eq('organization_id', userProfile.organization_id)
      .in('status', ['approved', 'delivered'])
      .gte('redeemed_at', date_from)
      .lte('redeemed_at', date_to)
      .is('deleted_at', null)

    const typeCounts = redemptionsByType?.reduce((acc, r) => {
      const type = r.reward?.reward_type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get daily redemption trends (last 30 days)
    const { data: dailyTrends } = await supabase
      .from('reward_redemptions')
      .select('redeemed_at, coins_spent')
      .eq('organization_id', userProfile.organization_id)
      .in('status', ['approved', 'delivered'])
      .gte('redeemed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .is('deleted_at', null)

    // Group by date
    const dailyData = dailyTrends?.reduce((acc, r) => {
      const date = new Date(r.redeemed_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, redemptions: 0, coins_spent: 0 }
      }
      acc[date].redemptions += 1
      acc[date].coins_spent += r.coins_spent || 0
      return acc
    }, {} as Record<string, any>) || {}

    const trendsArray = Object.values(dailyData).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Get student engagement metrics
    const { data: studentEngagement } = await supabase
      .from('reward_redemptions')
      .select(`
        student_id,
        coins_spent,
        student:students(full_name)
      `)
      .eq('organization_id', userProfile.organization_id)
      .in('status', ['approved', 'delivered'])
      .gte('redeemed_at', date_from)
      .lte('redeemed_at', date_to)
      .is('deleted_at', null)

    // Aggregate student activity
    const studentActivity = studentEngagement?.reduce((acc, r) => {
      const studentId = r.student_id
      if (!acc[studentId]) {
        acc[studentId] = {
          student_id: studentId,
          student_name: r.student?.full_name || 'Unknown',
          redemption_count: 0,
          total_coins_spent: 0
        }
      }
      acc[studentId].redemption_count += 1
      acc[studentId].total_coins_spent += r.coins_spent || 0
      return acc
    }, {} as Record<string, any>) || {}

    const topStudents = Object.values(studentActivity)
      .sort((a: any, b: any) => b.redemption_count - a.redemption_count)
      .slice(0, 10)

    // Calculate average redemption time (from request to approval)
    const { data: approvalTimes } = await supabase
      .from('reward_redemptions')
      .select('redeemed_at, approved_at')
      .eq('organization_id', userProfile.organization_id)
      .in('status', ['approved', 'delivered'])
      .gte('redeemed_at', date_from)
      .lte('redeemed_at', date_to)
      .not('approved_at', 'is', null)
      .is('deleted_at', null)

    const avgApprovalTimeHours = approvalTimes?.length ? 
      approvalTimes.reduce((sum, r) => {
        const requestTime = new Date(r.redeemed_at).getTime()
        const approvalTime = new Date(r.approved_at).getTime()
        return sum + (approvalTime - requestTime) / (1000 * 60 * 60) // Convert to hours
      }, 0) / approvalTimes.length : 0

    const analytics = {
      overview: {
        total_rewards: totalRewards?.length || 0,
        total_redemptions: totalRedemptions?.length || 0,
        pending_redemptions: pendingRedemptions?.length || 0,
        total_coins_spent: totalCoinsSpentAmount,
        active_students: uniqueActiveStudents,
        avg_approval_time_hours: Math.round(avgApprovalTimeHours * 100) / 100,
      },
      popular_rewards: topRewards,
      redemptions_by_status: statusCounts,
      redemptions_by_type: typeCounts,
      daily_trends: trendsArray,
      top_students: topStudents,
      period: {
        from: date_from,
        to: date_to
      }
    }

    return NextResponse.json({ analytics })

  } catch (error) {
    console.error('Error in rewards analytics GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}