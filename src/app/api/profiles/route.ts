import { NextRequest, NextResponse } from 'next/server'
import profileService from '@/lib/services/profile-service'
import { withAuth } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const organizationId = searchParams.get('organizationId')
      const search = searchParams.get('search')
      
      if (search) {
        const profiles = await profileService.searchProfiles(search, organizationId || undefined)
        return NextResponse.json({
          data: profiles,
          success: true
        })
      }
      
      const profiles = await profileService.getByOrganization(organizationId || undefined)
      
      return NextResponse.json({
        data: profiles,
        success: true
      })
    } catch (error: any) {
      console.error('Profiles GET error:', error)
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
      const profile = await profileService.create(body)
      
      return NextResponse.json({
        data: profile,
        success: true
      }, { status: 201 })
    } catch (error: any) {
      console.error('Profiles POST error:', error)
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