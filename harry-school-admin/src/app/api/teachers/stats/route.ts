import { NextRequest, NextResponse } from 'next/server'
import { teacherService } from '@/lib/services/teacher-service'

export async function GET(request: NextRequest) {
  try {
    const stats = await teacherService.getStats()
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching teacher stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch teacher stats' 
      },
      { status: 500 }
    )
  }
}