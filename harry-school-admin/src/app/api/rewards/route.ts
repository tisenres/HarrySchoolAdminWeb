import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schema for creating rewards
const createRewardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  coin_cost: z.number().min(1, 'Coin cost must be at least 1').max(10000, 'Coin cost too high'),
  reward_type: z.enum(['privilege', 'certificate', 'recognition', 'physical', 'special']),
  reward_category: z.enum(['general', 'academic', 'behavioral', 'attendance', 'special']).default('general'),
  inventory_quantity: z.number().min(1).optional(),
  max_redemptions_per_student: z.number().min(1).optional(),
  requires_approval: z.boolean().default(true),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  display_order: z.number().default(0),
  image_url: z.string().url().optional(),
  terms_conditions: z.string().optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
})

// GET - List rewards with filters
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
    const search = searchParams.get('search') || ''
    const reward_type = searchParams.get('reward_type')
    const reward_category = searchParams.get('reward_category')
    const is_active = searchParams.get('is_active')
    const is_featured = searchParams.get('is_featured')
    const sort_by = searchParams.get('sort_by') || 'created_at'
    const sort_order = searchParams.get('sort_order') || 'desc'

    let query = supabase
      .from('rewards_catalog')
      .select(`
        *,
        created_by_profile:profiles!rewards_catalog_created_by_fkey(full_name),
        updated_by_profile:profiles!rewards_catalog_updated_by_fkey(full_name)
      `)
      .eq('organization_id', userProfile.organization_id)
      .is('deleted_at', null)

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }
    if (reward_type) {
      query = query.eq('reward_type', reward_type)
    }
    if (reward_category) {
      query = query.eq('reward_category', reward_category)
    }
    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true')
    }
    if (is_featured !== null) {
      query = query.eq('is_featured', is_featured === 'true')
    }

    // Apply sorting
    if (sort_by === 'coin_cost' || sort_by === 'display_order' || sort_by === 'created_at') {
      query = query.order(sort_by, { ascending: sort_order === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: rewards, error, count } = await query

    if (error) {
      console.error('Error fetching rewards:', error)
      return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 })
    }

    // Get total count for pagination
    const { count: total } = await supabase
      .from('rewards_catalog')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', userProfile.organization_id)
      .is('deleted_at', null)

    return NextResponse.json({
      rewards,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in rewards GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new reward
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    // Validate request body
    const validatedData = createRewardSchema.parse(body)

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

    // Create the reward
    const { data: reward, error } = await supabase
      .from('rewards_catalog')
      .insert({
        ...validatedData,
        organization_id: userProfile.organization_id,
        created_by: userProfile.id,
        valid_from: validatedData.valid_from ? new Date(validatedData.valid_from).toISOString() : new Date().toISOString(),
        valid_until: validatedData.valid_until ? new Date(validatedData.valid_until).toISOString() : null,
      })
      .select(`
        *,
        created_by_profile:profiles!rewards_catalog_created_by_fkey(full_name)
      `)
      .single()

    if (error) {
      console.error('Error creating reward:', error)
      return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 })
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        organization_id: userProfile.organization_id,
        user_id: userProfile.id,
        action: 'CREATE',
        resource_type: 'rewards_catalog',
        resource_id: reward.id,
        description: `Created reward: ${reward.name}`,
        metadata: { reward_type: reward.reward_type, coin_cost: reward.coin_cost }
      })

    return NextResponse.json({ reward }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error in rewards POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}