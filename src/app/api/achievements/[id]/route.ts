import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

const updateAchievementSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  icon_name: z.string().min(1).optional(),
  badge_color: z.string().min(1).optional(),
  points_reward: z.number().min(0).max(1000).optional(),
  coins_reward: z.number().min(0).max(500).optional(),
  achievement_type: z.enum(['homework', 'attendance', 'behavior', 'streak', 'milestone', 'special']).optional(),
  is_active: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get achievement
    const { data: achievement, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .single()

    if (error || !achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 })
    }

    return NextResponse.json({ achievement })
  } catch (error) {
    console.error('Error in achievement GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validatedData = updateAchievementSchema.parse(body)

    // Update achievement
    const { data: achievement, error } = await supabase
      .from('achievements')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .select()
      .single()

    if (error || !achievement) {
      return NextResponse.json({ error: 'Achievement not found or update failed' }, { status: 404 })
    }

    return NextResponse.json({ achievement })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in achievement PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get delete action type from query params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') // 'archive' or 'permanent'

    if (action === 'permanent') {
      // Permanent delete - only for archived achievements
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', params.id)
        .eq('organization_id', profile.organization_id)
        .not('deleted_at', 'is', null)

      if (error) {
        return NextResponse.json({ error: 'Failed to delete achievement' }, { status: 500 })
      }
    } else {
      // Soft delete (archive)
      const { data: achievement, error } = await supabase
        .from('achievements')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: session.user.id,
        })
        .eq('id', params.id)
        .eq('organization_id', profile.organization_id)
        .is('deleted_at', null)
        .select()
        .single()

      if (error || !achievement) {
        return NextResponse.json({ error: 'Achievement not found or already archived' }, { status: 404 })
      }
    }

    return NextResponse.json({ message: 'Achievement deleted successfully' })
  } catch (error) {
    console.error('Error in achievement DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}