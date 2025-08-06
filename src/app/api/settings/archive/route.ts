import { NextRequest, NextResponse } from 'next/server'
import settingsService from '@/lib/services/settings-service'
import { withAuth } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const entity = searchParams.get('entity') as 'teachers' | 'students' | 'groups' | 'profiles'
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const organizationId = searchParams.get('organizationId')

      if (!entity || !['teachers', 'students', 'groups', 'profiles'].includes(entity)) {
        return NextResponse.json(
          { error: 'Valid entity parameter required (teachers, students, groups, profiles)', success: false },
          { status: 400 }
        )
      }

      const { data, count } = await settingsService.getArchivedRecords(entity, {
        page,
        limit,
        organizationId: organizationId || undefined
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
      console.error('Archived records GET error:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.message.includes('Unauthorized') ? 401 : 500 }
      )
    }
  })
}