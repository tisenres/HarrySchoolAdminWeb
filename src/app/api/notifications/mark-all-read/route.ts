import { NextRequest, NextResponse } from 'next/server'
import notificationService from '@/lib/services/notification-service'
import { withAuth } from '@/lib/middleware/auth'

export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const userId = searchParams.get('userId') || undefined

      await notificationService.markAllAsRead(userId)
      
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      })
    } catch (error: any) {
      console.error('Mark all notifications read error:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.message.includes('Unauthorized') ? 401 : 500 }
      )
    }
  })
}