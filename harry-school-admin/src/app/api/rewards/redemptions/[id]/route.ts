import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schema for updating redemption
const updateRedemptionSchema = z.object({
  status: z.enum(['pending', 'approved', 'delivered', 'cancelled', 'rejected']).optional(),
  admin_notes: z.string().optional(),
  delivery_date: z.string().optional(),
  delivery_address: z.string().optional(),
  tracking_number: z.string().optional(),
  certificate_number: z.string().optional(),
})

// GET - Get specific redemption by ID
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

    // Fetch the redemption
    const { data: redemption, error } = await supabase
      .from('reward_redemptions')
      .select(`
        *,
        reward:rewards_catalog(id, name, description, reward_type, coin_cost, image_url),
        student:students(id, full_name, first_name, last_name, primary_phone, email),
        approved_by_profile:profiles!reward_redemptions_approved_by_fkey(full_name),
        delivered_by_profile:profiles!reward_redemptions_delivered_by_fkey(full_name)
      `)
      .eq('id', id)
      .eq('organization_id', userProfile.organization_id)
      .is('deleted_at', null)
      .single()

    if (error || !redemption) {
      return NextResponse.json({ error: 'Redemption not found' }, { status: 404 })
    }

    return NextResponse.json({ redemption })

  } catch (error) {
    console.error('Error in redemption GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update redemption (approve, deliver, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params
    const body = await request.json()

    // Validate request body
    const validatedData = updateRedemptionSchema.parse(body)

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

    // Check if redemption exists and belongs to user's organization
    const { data: existingRedemption, error: fetchError } = await supabase
      .from('reward_redemptions')
      .select(`
        *,
        reward:rewards_catalog(name),
        student:students(full_name)
      `)
      .eq('id', id)
      .eq('organization_id', userProfile.organization_id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingRedemption) {
      return NextResponse.json({ error: 'Redemption not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    }

    // Handle status-specific logic
    if (validatedData.status) {
      switch (validatedData.status) {
        case 'approved':
          if (existingRedemption.status === 'pending') {
            updateData.approved_by = userProfile.id
            updateData.approved_at = new Date().toISOString()
            
            // Use the database function to process redemption (deduct coins, etc.)
            const { error: processError } = await supabase.rpc('process_reward_redemption', {
              p_redemption_id: id,
              p_approved_by: userProfile.id,
              p_admin_notes: validatedData.admin_notes || null
            })

            if (processError) {
              console.error('Error processing redemption:', processError)
              return NextResponse.json({ error: 'Failed to process redemption' }, { status: 500 })
            }

            // The function updates the redemption, so we don't need to update again
            // Just fetch the updated data
            const { data: updatedRedemption, error: fetchUpdatedError } = await supabase
              .from('reward_redemptions')
              .select(`
                *,
                reward:rewards_catalog(id, name, reward_type, coin_cost, image_url),
                student:students(id, full_name, first_name, last_name),
                approved_by_profile:profiles!reward_redemptions_approved_by_fkey(full_name)
              `)
              .eq('id', id)
              .single()

            if (fetchUpdatedError) {
              return NextResponse.json({ error: 'Failed to fetch updated redemption' }, { status: 500 })
            }

            // Create notification for student
            await supabase
              .from('notifications')
              .insert({
                organization_id: userProfile.organization_id,
                user_id: null, // System notification
                type: 'reward_redemption_approved',
                title: 'Reward Redemption Approved',
                message: `Your redemption request for "${existingRedemption.reward.name}" has been approved!`,
                priority: 'medium',
                related_student_id: existingRedemption.student_id,
                metadata: {
                  redemption_id: id,
                  reward_name: existingRedemption.reward.name
                }
              })

            // Log activity
            await supabase
              .from('activity_logs')
              .insert({
                organization_id: userProfile.organization_id,
                user_id: userProfile.id,
                action: 'APPROVE',
                resource_type: 'reward_redemptions',
                resource_id: id,
                description: `Approved reward redemption for ${existingRedemption.student.full_name}: ${existingRedemption.reward.name}`,
                metadata: { 
                  student_name: existingRedemption.student.full_name,
                  reward_name: existingRedemption.reward.name,
                  coins_spent: existingRedemption.coins_spent
                }
              })

            return NextResponse.json({ redemption: updatedRedemption })
          }
          break

        case 'delivered':
          if (existingRedemption.status === 'approved') {
            updateData.delivered_by = userProfile.id
            updateData.delivered_at = new Date().toISOString()
            if (validatedData.delivery_date) {
              updateData.delivery_date = new Date(validatedData.delivery_date).toISOString()
            }
          }
          break

        case 'cancelled':
        case 'rejected':
          // If cancelling/rejecting an approved redemption, refund coins
          if (existingRedemption.status === 'approved') {
            await supabase.rpc('update_student_ranking', {
              p_student_id: existingRedemption.student_id,
              p_points_change: 0,
              p_coins_change: existingRedemption.coins_spent // Refund coins
            })

            // Create refund transaction record
            await supabase
              .from('points_transactions')
              .insert({
                organization_id: userProfile.organization_id,
                student_id: existingRedemption.student_id,
                transaction_type: 'earned',
                points_amount: 0,
                coins_earned: existingRedemption.coins_spent,
                reason: `Refund for ${validatedData.status} redemption: ${existingRedemption.reward.name}`,
                category: 'refund',
                related_entity_type: 'reward_redemption',
                related_entity_id: id,
                awarded_by: userProfile.id
              })
          }
          break
      }
    }

    // Update the redemption
    const { data: redemption, error } = await supabase
      .from('reward_redemptions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        reward:rewards_catalog(id, name, reward_type, coin_cost, image_url),
        student:students(id, full_name, first_name, last_name),
        approved_by_profile:profiles!reward_redemptions_approved_by_fkey(full_name),
        delivered_by_profile:profiles!reward_redemptions_delivered_by_fkey(full_name)
      `)
      .single()

    if (error) {
      console.error('Error updating redemption:', error)
      return NextResponse.json({ error: 'Failed to update redemption' }, { status: 500 })
    }

    // Log activity for other status changes
    if (validatedData.status && validatedData.status !== 'approved') {
      await supabase
        .from('activity_logs')
        .insert({
          organization_id: userProfile.organization_id,
          user_id: userProfile.id,
          action: 'UPDATE',
          resource_type: 'reward_redemptions',
          resource_id: id,
          description: `Updated redemption status to ${validatedData.status} for ${existingRedemption.student.full_name}: ${existingRedemption.reward.name}`,
          metadata: { 
            old_status: existingRedemption.status,
            new_status: validatedData.status,
            student_name: existingRedemption.student.full_name,
            reward_name: existingRedemption.reward.name
          }
        })
    }

    return NextResponse.json({ redemption })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error in redemption PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Cancel redemption
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

    // Check if redemption exists and belongs to user's organization
    const { data: existingRedemption, error: fetchError } = await supabase
      .from('reward_redemptions')
      .select(`
        *,
        reward:rewards_catalog(name),
        student:students(full_name)
      `)
      .eq('id', id)
      .eq('organization_id', userProfile.organization_id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingRedemption) {
      return NextResponse.json({ error: 'Redemption not found' }, { status: 404 })
    }

    // Can only delete pending redemptions
    if (existingRedemption.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Can only delete pending redemptions' 
      }, { status: 400 })
    }

    // Soft delete the redemption
    const { error } = await supabase
      .from('reward_redemptions')
      .update({
        deleted_by: userProfile.id,
        deleted_at: new Date().toISOString(),
        status: 'cancelled'
      })
      .eq('id', id)

    if (error) {
      console.error('Error deleting redemption:', error)
      return NextResponse.json({ error: 'Failed to delete redemption' }, { status: 500 })
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        organization_id: userProfile.organization_id,
        user_id: userProfile.id,
        action: 'DELETE',
        resource_type: 'reward_redemptions',
        resource_id: id,
        description: `Cancelled redemption for ${existingRedemption.student.full_name}: ${existingRedemption.reward.name}`,
        metadata: { 
          student_name: existingRedemption.student.full_name,
          reward_name: existingRedemption.reward.name,
          coins_would_have_spent: existingRedemption.coins_spent
        }
      })

    return NextResponse.json({ message: 'Redemption cancelled successfully' })

  } catch (error) {
    console.error('Error in redemption DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}