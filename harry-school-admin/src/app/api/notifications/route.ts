import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/services/notification-service'
import { getSupabaseServer } from '@/lib/supabase/server'

const notificationService = new NotificationService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    const is_read = searchParams.get('is_read')
    const search = searchParams.get('search')

    const filters: any = {}
    if (type) filters.type = [type]
    if (is_read !== null) filters.is_read = is_read === 'true'
    if (search) filters.search = search

    const result = await notificationService.getNotifications(filters, page, limit)
    
    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.count,
        hasMore: result.hasMore
      }
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch notifications' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const notification = await notificationService.createNotification(body)
    
    return NextResponse.json({
      success: true,
      data: notification
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create notification' 
      },
      { status: 500 }
    )
  }
}