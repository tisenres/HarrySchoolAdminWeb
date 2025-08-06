import { NextRequest, NextResponse } from 'next/server'
import profileService from '@/lib/services/profile-service'
import { withAuth } from '@/lib/middleware/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req) => {
    try {
      const profile = await profileService.getById(params.id)
      
      if (!profile) {
        return NextResponse.json(
          { error: 'Profile not found', success: false },
          { status: 404 }
        )
      }

      return NextResponse.json({
        data: profile,
        success: true
      })
    } catch (error: any) {
      console.error('Profile GET error:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.message.includes('Unauthorized') ? 401 : 500 }
      )
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req) => {
    try {
      const body = await req.json()
      const profile = await profileService.update(params.id, body)
      
      return NextResponse.json({
        data: profile,
        success: true
      })
    } catch (error: any) {
      console.error('Profile PUT error:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { 
          status: error.message.includes('Unauthorized') ? 401 : 
                 error.message.includes('Insufficient') ? 403 : 
                 error.message.includes('Cannot update') ? 403 :
                 error.message.includes('validation') ? 400 : 500 
        }
      )
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req) => {
    try {
      await profileService.softDelete(params.id)
      
      return NextResponse.json({
        success: true,
        message: 'Profile deleted successfully'
      })
    } catch (error: any) {
      console.error('Profile DELETE error:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { 
          status: error.message.includes('Unauthorized') ? 401 : 
                 error.message.includes('Insufficient') ? 403 : 
                 error.message.includes('Cannot delete') ? 403 : 500 
        }
      )
    }
  })
}