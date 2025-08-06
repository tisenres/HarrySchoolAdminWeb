import { NextRequest, NextResponse } from 'next/server'
import notificationService from '@/lib/services/notification-service'
import { withAuth } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const userId = searchParams.get('userId') || undefined

      const count = await notificationService.getUnreadCount(userId)
      
      return NextResponse.json({
        data: { count },
        success: true
      })
    } catch (error: any) {
      console.error('Unread count GET error:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.message.includes('Unauthorized') ? 401 : 500 }
      )
    }
  })
}