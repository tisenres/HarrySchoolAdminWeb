import { NextRequest, NextResponse } from 'next/server'
import notificationService from '@/lib/services/notification-service'
import { withAuth } from '@/lib/middleware/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req) => {
    try {
      await notificationService.markAsRead(params.id)
      
      return NextResponse.json({
        success: true,
        message: 'Notification marked as read'
      })
    } catch (error: any) {
      console.error('Notification mark read error:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.message.includes('Unauthorized') ? 401 : 500 }
      )
    }
  })
}