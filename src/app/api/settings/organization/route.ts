import { NextRequest, NextResponse } from 'next/server'
import settingsService from '@/lib/services/settings-service'
import { withAuth } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const organizationId = searchParams.get('organizationId')

      const settings = await settingsService.getOrganizationSettings(organizationId || undefined)
      
      return NextResponse.json({
        data: settings,
        success: true
      })
    } catch (error: any) {
      console.error('Organization settings GET error:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { 
          status: error.message.includes('Unauthorized') ? 401 : 
                 error.message.includes('required') ? 400 : 500 
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
      const organizationId = searchParams.get('organizationId')

      const settings = await settingsService.updateOrganizationSettings(
        body,
        organizationId || undefined
      )
      
      return NextResponse.json({
        data: settings,
        success: true
      })
    } catch (error: any) {
      console.error('Organization settings PUT error:', error)
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