import { NextRequest, NextResponse } from 'next/server'
import profileService from '@/lib/services/profile-service'
import { withAuth } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const profile = await profileService.getCurrentProfile()
      
      if (!profile) {
        return NextResponse.json(
          { error: 'Profile not found', success: false },
          { status: 404 }
        )
      }

      return NextResponse.json({
        data: profile,
        success: true
      })
    } catch (error: any) {
      console.error('Current profile GET error:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.message.includes('Unauthorized') ? 401 : 500 }
      )
    }
  })
}