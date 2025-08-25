import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/services/notification-service'
import { getSupabaseServer } from '@/lib/supabase/server'
import { withMiddleware, withCaching, withErrorBoundary, withPerformanceMonitoring, sanitizeInput } from '@/lib/middleware/performance'

// Enable caching for GET requests
export const revalidate = 30 // Cache for 30 seconds (notifications change frequently)

const notificationService = new NotificationService()

export const GET = withMiddleware(
  withCaching,
  withErrorBoundary,
  withPerformanceMonitoring
)(async function(request: NextRequest) {
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
    
    const response = NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.count,
        hasMore: result.hasMore
      }
    })
    
    response.headers.set('X-Total-Count', String(result.count))
    response.headers.set('X-Has-More', String(result.hasMore))
    
    return response
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
})

export const POST = withMiddleware(
  withErrorBoundary,
  withPerformanceMonitoring
)(async function(request: NextRequest) {
  try {
    const rawBody = await request.json()
    const body = sanitizeInput(rawBody)
    const notification = await notificationService.createNotification(body)
    
    const response = NextResponse.json({
      success: true,
      data: notification
    }, { status: 201 })
    
    response.headers.set('Location', `/api/notifications/${notification.id}`)
    
    return response
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
})