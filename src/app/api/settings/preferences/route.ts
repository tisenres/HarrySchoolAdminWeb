import { NextRequest, NextResponse } from 'next/server'
import settingsService from '@/lib/services/settings-service'
import { withAuth } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const userId = searchParams.get('userId')

      const preferences = await settingsService.getUserPreferences(userId || undefined)
      
      return NextResponse.json({
        data: preferences,
        success: true
      })
    } catch (error: any) {
      console.error('User preferences GET error:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { 
          status: error.message.includes('Unauthorized') ? 401 : 
                 error.message.includes('Cannot access') ? 403 : 500 
        }
      )
    }
  })
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const body = await req.json()
      const { searchParams } = new URL(req.url)
      const userId = searchParams.get('userId')

      const preferences = await settingsService.updateUserPreferences(
        body,
        userId || undefined
      )
      
      return NextResponse.json({
        data: preferences,
        success: true
      })
    } catch (error: any) {
      console.error('User preferences PUT error:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { 
          status: error.message.includes('Unauthorized') ? 401 : 
                 error.message.includes('Cannot update') ? 403 : 500 
        }
      )
    }
  })
}