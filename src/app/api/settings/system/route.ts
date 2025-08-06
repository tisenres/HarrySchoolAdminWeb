import { NextRequest, NextResponse } from 'next/server'
import settingsService from '@/lib/services/settings-service'
import { withSuperAdminAuth } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  return withSuperAdminAuth(request, async (req) => {
    try {
      const settings = await settingsService.getSystemSettings()
      
      return NextResponse.json({
        data: settings,
        success: true
      })
    } catch (error: any) {
      console.error('System settings GET error:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.message.includes('Unauthorized') ? 401 : 500 }
      )
    }
  })
}

export async function PUT(request: NextRequest) {
  return withSuperAdminAuth(request, async (req) => {
    try {
      const body = await req.json()
      const settings = await settingsService.updateSystemSettings(body)
      
      return NextResponse.json({
        data: settings,
        success: true
      })
    } catch (error: any) {
      console.error('System settings PUT error:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { 
          status: error.message.includes('Unauthorized') ? 401 : 
                 error.message.includes('validation') ? 400 : 500 
        }
      )
    }
  })
}