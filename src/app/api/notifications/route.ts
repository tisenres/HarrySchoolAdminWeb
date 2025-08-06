import { NextRequest, NextResponse } from 'next/server'
import notificationService from '@/lib/services/notification-service'
import { withAuth } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const unreadOnly = searchParams.get('unreadOnly') === 'true'
      const type = searchParams.get('type') || undefined
      const priority = searchParams.get('priority') || undefined
      const userId = searchParams.get('userId') || undefined

      const { data, count } = await notificationService.getByUser(userId, {
        page,
        limit,
        unreadOnly,
        type,
        priority
      })
      
      return NextResponse.json({
        data,
        count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        success: true
      })
    } catch (error: any) {
      console.error('Notifications GET error:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.message.includes('Unauthorized') ? 401 : 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const body = await req.json()
      const notification = await notificationService.create(body)
      
      return NextResponse.json({
        data: notification,
        success: true
      }, { status: 201 })
    } catch (error: any) {
      console.error('Notifications POST error:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { 
          status: error.message.includes('Unauthorized') ? 401 : 
                 error.message.includes('Insufficient') ? 403 : 
                 error.message.includes('validation') ? 400 : 500 
        }
      )
    }
  })
}