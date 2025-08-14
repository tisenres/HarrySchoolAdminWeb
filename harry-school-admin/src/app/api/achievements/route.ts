import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

const createAchievementSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  icon_name: z.string().min(1),
  badge_color: z.string().min(1),
  points_reward: z.number().min(0).max(1000),
  coins_reward: z.number().min(0).max(500),
  achievement_type: z.enum(['homework', 'attendance', 'behavior', 'streak', 'milestone', 'special']),
  is_active: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
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

    // Parse query parameters
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('achievements')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('achievement_type', type)
    }

    if (status === 'active') {
      query = query.eq('is_active', true).is('deleted_at', null)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false).is('deleted_at', null)
    } else if (status === 'archived') {
      query = query.not('deleted_at', 'is', null)
    } else if (status !== 'all') {
      query = query.is('deleted_at', null)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: achievements, error } = await query

    if (error) {
      console.error('Error fetching achievements:', error)
      return NextResponse.json(
        { error: 'Failed to fetch achievements' },
        { status: 500 }
      )
    }

    return NextResponse.json({ achievements })
  } catch (error) {
    console.error('Error in achievements GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const validatedData = createAchievementSchema.parse(body)

    // Create achievement
    const { data: achievement, error } = await supabase
      .from('achievements')
      .insert({
        ...validatedData,
        organization_id: profile.organization_id,
        created_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating achievement:', error)
      return NextResponse.json(
        { error: 'Failed to create achievement' },
        { status: 500 }
      )
    }

    return NextResponse.json({ achievement }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in achievements POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}