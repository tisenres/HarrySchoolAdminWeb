import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Sign out the user
    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json(
        { 
          error: error.message,
          success: false 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

  } catch (error: any) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        success: false 
      },
      { status: 500 }
    )
  }
}