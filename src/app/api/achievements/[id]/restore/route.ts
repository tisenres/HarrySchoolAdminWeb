import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(
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

    // Restore achievement (remove deleted_at and deleted_by)
    const { data: achievement, error } = await supabase
      .from('achievements')
      .update({
        deleted_at: null,
        deleted_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .not('deleted_at', 'is', null)
      .select()
      .single()

    if (error || !achievement) {
      return NextResponse.json(
        { error: 'Achievement not found or not archived' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      message: 'Achievement restored successfully',
      achievement 
    })
  } catch (error) {
    console.error('Error in achievement restore:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}