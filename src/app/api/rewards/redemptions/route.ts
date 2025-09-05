import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schema for creating redemption requests
const createRedemptionSchema = z.object({
  reward_id: z.string().uuid('Invalid reward ID'),
  student_id: z.string().uuid('Invalid student ID'),
  request_notes: z.string().optional(),
  delivery_method: z.enum(['pickup', 'delivery', 'digital', 'certificate']).default('pickup'),
  delivery_address: z.string().optional(),
})

// GET - List redemptions with filters
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

    // Parse filters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const student_id = searchParams.get('student_id')
    const reward_id = searchParams.get('reward_id')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const sort_by = searchParams.get('sort_by') || 'redeemed_at'
    const sort_order = searchParams.get('sort_order') || 'desc'

    let query = supabase
      .from('reward_redemptions')
      .select(`
        *,
        reward:rewards_catalog(id, name, reward_type, coin_cost, image_url),
        student:students(id, full_name, first_name, last_name),
        approved_by_profile:profiles!reward_redemptions_approved_by_fkey(full_name),
        delivered_by_profile:profiles!reward_redemptions_delivered_by_fkey(full_name)
      `)
      .eq('organization_id', userProfile.organization_id)
      .is('deleted_at', null)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (student_id) {
      query = query.eq('student_id', student_id)
    }
    if (reward_id) {
      query = query.eq('reward_id', reward_id)
    }
    if (date_from) {
      query = query.gte('redeemed_at', new Date(date_from).toISOString())
    }
    if (date_to) {
      query = query.lte('redeemed_at', new Date(date_to).toISOString())
    }

    // Apply sorting
    if (sort_by === 'redeemed_at' || sort_by === 'approved_at' || sort_by === 'delivered_at') {
      query = query.order(sort_by, { ascending: sort_order === 'asc' })
    } else {
      query = query.order('redeemed_at', { ascending: false })
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: redemptions, error } = await query

    if (error) {
      console.error('Error fetching redemptions:', error)
      return NextResponse.json({ error: 'Failed to fetch redemptions' }, { status: 500 })
    }

    // Get total count for pagination
    const { count: total } = await supabase
      .from('reward_redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', userProfile.organization_id)
      .is('deleted_at', null)

    return NextResponse.json({
      redemptions,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in redemptions GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new redemption request
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    // Validate request body
    const validatedData = createRedemptionSchema.parse(body)

    // Get user's organization and check permissions
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id, organization_id, role')
      .single()

    if (!userProfile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 403 })
    }

    // Verify student belongs to organization
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('id', validatedData.student_id)
      .eq('organization_id', userProfile.organization_id)
      .is('deleted_at', null)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Verify reward exists and is active
    const { data: reward, error: rewardError } = await supabase
      .from('rewards_catalog')
      .select('*')
      .eq('id', validatedData.reward_id)
      .eq('organization_id', userProfile.organization_id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single()

    if (rewardError || !reward) {
      return NextResponse.json({ error: 'Reward not found or inactive' }, { status: 404 })
    }

    // Check if student can redeem this reward
    const { data: canRedeem, error: eligibilityError } = await supabase.rpc(
      'can_redeem_reward',
      {
        p_student_id: validatedData.student_id,
        p_reward_id: validatedData.reward_id
      }
    )

    if (eligibilityError || !canRedeem) {
      return NextResponse.json({ 
        error: 'Student is not eligible to redeem this reward. Check coin balance, inventory, or redemption limits.' 
      }, { status: 400 })
    }

    // Create the redemption request
    const { data: redemption, error } = await supabase
      .from('reward_redemptions')
      .insert({
        organization_id: userProfile.organization_id,
        student_id: validatedData.student_id,
        reward_id: validatedData.reward_id,
        coins_spent: reward.coin_cost,
        status: reward.requires_approval ? 'pending' : 'approved',
        request_notes: validatedData.request_notes,
        delivery_method: validatedData.delivery_method,
        delivery_address: validatedData.delivery_address,
        approved_by: reward.requires_approval ? null : userProfile.id,
        approved_at: reward.requires_approval ? null : new Date().toISOString(),
      })
      .select(`
        *,
        reward:rewards_catalog(id, name, reward_type, coin_cost, image_url),
        student:students(id, full_name, first_name, last_name)
      `)
      .single()

    if (error) {
      console.error('Error creating redemption:', error)
      return NextResponse.json({ error: 'Failed to create redemption request' }, { status: 500 })
    }

    // If auto-approved, process the redemption immediately
    if (!reward.requires_approval) {
      const { error: processError } = await supabase.rpc('process_reward_redemption', {
        p_redemption_id: redemption.id,
        p_approved_by: userProfile.id,
        p_admin_notes: 'Auto-approved reward redemption'
      })

      if (processError) {
        console.error('Error auto-processing redemption:', processError)
        // Don't fail the request, but log the error
      }
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        organization_id: userProfile.organization_id,
        user_id: userProfile.id,
        action: 'CREATE',
        resource_type: 'reward_redemptions',
        resource_id: redemption.id,
        description: `${student.full_name} requested to redeem: ${reward.name}`,
        metadata: { 
          reward_type: reward.reward_type,
          coins_spent: reward.coin_cost,
          status: redemption.status
        }
      })

    // Create notification for admins if approval required
    if (reward.requires_approval) {
      await supabase
        .from('notifications')
        .insert({
          organization_id: userProfile.organization_id,
          type: 'reward_redemption_request',
          title: 'New Reward Redemption Request',
          message: `${student.full_name} has requested to redeem "${reward.name}" for ${reward.coin_cost} coins.`,
          priority: 'medium',
          role_target: ['admin', 'superadmin'],
          related_student_id: validatedData.student_id,
          action_url: `/dashboard/rewards/redemptions/${redemption.id}`,
          metadata: {
            redemption_id: redemption.id,
            reward_id: reward.id,
            student_id: validatedData.student_id,
            coins_spent: reward.coin_cost
          }
        })
    }

    return NextResponse.json({ redemption }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error in redemptions POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}