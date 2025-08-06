import { NextRequest, NextResponse } from 'next/server'
import settingsService from '@/lib/services/settings-service'
import { withAuth } from '@/lib/middleware/auth'

export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const body = await req.json()
      const { entity, recordId } = body

      if (!entity || !['teachers', 'students', 'groups', 'profiles'].includes(entity)) {
        return NextResponse.json(
          { error: 'Valid entity parameter required (teachers, students, groups, profiles)', success: false },
          { status: 400 }
        )
      }

      if (!recordId) {
        return NextResponse.json(
          { error: 'Record ID required', success: false },
          { status: 400 }
        )
      }

      const restoredRecord = await settingsService.restoreArchivedRecord(entity, recordId)
      
      return NextResponse.json({
        data: restoredRecord,
        success: true,
        message: `${entity.slice(0, -1)} restored successfully`
      })
    } catch (error: any) {
      console.error('Restore archived record error:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.message.includes('Unauthorized') ? 401 : 500 }
      )
    }
  })
}