import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schema for updating rewards
const updateRewardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
  description: z.string().optional(),
  coin_cost: z.number().min(1, 'Coin cost must be at least 1').max(10000, 'Coin cost too high').optional(),
  reward_type: z.enum(['privilege', 'certificate', 'recognition', 'physical', 'special']).optional(),
  reward_category: z.enum(['general', 'academic', 'behavioral', 'attendance', 'special']).optional(),
  inventory_quantity: z.number().min(1).optional().nullable(),
  max_redemptions_per_student: z.number().min(1).optional().nullable(),
  requires_approval: z.boolean().optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  display_order: z.number().optional(),
  image_url: z.string().url().optional().nullable(),
  terms_conditions: z.string().optional().nullable(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional().nullable(),
})

// GET - Get specific reward by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    // Get user's organization
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .single()

    if (!userProfile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 403 })
    }

    // Fetch the reward
    const { data: reward, error } = await supabase
      .from('rewards_catalog')
      .select(`
        *,
        created_by_profile:profiles!rewards_catalog_created_by_fkey(full_name),
        updated_by_profile:profiles!rewards_catalog_updated_by_fkey(full_name)
      `)
      .eq('id', id)
      .eq('organization_id', userProfile.organization_id)
      .is('deleted_at', null)
      .single()

    if (error || !reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    // Get redemption statistics
    const { data: redemptionStats } = await supabase
      .from('reward_redemptions')
      .select('status')
      .eq('reward_id', id)
      .is('deleted_at', null)

    const stats = {
      total_redemptions: redemptionStats?.length || 0,
      pending_redemptions: redemptionStats?.filter(r => r.status === 'pending').length || 0,
      approved_redemptions: redemptionStats?.filter(r => r.status === 'approved').length || 0,
      delivered_redemptions: redemptionStats?.filter(r => r.status === 'delivered').length || 0,
    }

    return NextResponse.json({ 
      reward: { ...reward, stats }
    })

  } catch (error) {
    console.error('Error in reward GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update reward
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params
    const body = await request.json()

    // Validate request body
    const validatedData = updateRewardSchema.parse(body)

    // Get user's organization and check permissions
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id, organization_id, role')
      .single()

    if (!userProfile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 403 })
    }

    if (userProfile.role !== 'admin' && userProfile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if reward exists and belongs to user's organization
    const { data: existingReward, error: fetchError } = await supabase
      .from('rewards_catalog')
      .select('*')
      .eq('id', id)
      .eq('organization_id', userProfile.organization_id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingReward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    // Update the reward
    const updateData = {
      ...validatedData,
      updated_by: userProfile.id,
      updated_at: new Date().toISOString(),
    }

    // Handle date fields
    if (validatedData.valid_from) {
      updateData.valid_from = new Date(validatedData.valid_from).toISOString()
    }
    if (validatedData.valid_until) {
      updateData.valid_until = new Date(validatedData.valid_until).toISOString()
    }

    const { data: reward, error } = await supabase
      .from('rewards_catalog')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        created_by_profile:profiles!rewards_catalog_created_by_fkey(full_name),
        updated_by_profile:profiles!rewards_catalog_updated_by_fkey(full_name)
      `)
      .single()

    if (error) {
      console.error('Error updating reward:', error)
      return NextResponse.json({ error: 'Failed to update reward' }, { status: 500 })
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        organization_id: userProfile.organization_id,
        user_id: userProfile.id,
        action: 'UPDATE',
        resource_type: 'rewards_catalog',
        resource_id: id,
        description: `Updated reward: ${reward.name}`,
        metadata: { 
          changes: Object.keys(validatedData),
          reward_type: reward.reward_type,
          coin_cost: reward.coin_cost 
        }
      })

    return NextResponse.json({ reward })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error in reward PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Soft delete reward
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    // Get user's organization and check permissions
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id, organization_id, role')
      .single()

    if (!userProfile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 403 })
    }

    if (userProfile.role !== 'admin' && userProfile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if reward exists and belongs to user's organization
    const { data: existingReward, error: fetchError } = await supabase
      .from('rewards_catalog')
      .select('*')
      .eq('id', id)
      .eq('organization_id', userProfile.organization_id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingReward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    // Check if there are pending redemptions
    const { data: pendingRedemptions } = await supabase
      .from('reward_redemptions')
      .select('id')
      .eq('reward_id', id)
      .eq('status', 'pending')
      .is('deleted_at', null)

    if (pendingRedemptions && pendingRedemptions.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete reward with pending redemptions' 
      }, { status: 400 })
    }

    // Soft delete the reward
    const { error } = await supabase
      .from('rewards_catalog')
      .update({
        deleted_by: userProfile.id,
        deleted_at: new Date().toISOString(),
        is_active: false
      })
      .eq('id', id)

    if (error) {
      console.error('Error deleting reward:', error)
      return NextResponse.json({ error: 'Failed to delete reward' }, { status: 500 })
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        organization_id: userProfile.organization_id,
        user_id: userProfile.id,
        action: 'DELETE',
        resource_type: 'rewards_catalog',
        resource_id: id,
        description: `Deleted reward: ${existingReward.name}`,
        metadata: { 
          reward_type: existingReward.reward_type,
          coin_cost: existingReward.coin_cost 
        }
      })

    return NextResponse.json({ message: 'Reward deleted successfully' })

  } catch (error) {
    console.error('Error in reward DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}