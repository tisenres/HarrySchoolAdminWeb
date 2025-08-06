import { NextRequest, NextResponse } from 'next/server'
import organizationService from '@/lib/services/organization-service'
import { withAuth } from '@/lib/middleware/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req) => {
    try {
      const organization = await organizationService.getById(params.id)
      
      if (!organization) {
        return NextResponse.json(
          { error: 'Organization not found', success: false },
          { status: 404 }
        )
      }

      return NextResponse.json({
        data: organization,
        success: true
      })
    } catch (error: any) {
      console.error('Organization GET error:', error)
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
      const organization = await organizationService.update(params.id, body)
      
      return NextResponse.json({
        data: organization,
        success: true
      })
    } catch (error: any) {
      console.error('Organization PUT error:', error)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req) => {
    try {
      await organizationService.softDelete(params.id)
      
      return NextResponse.json({
        success: true,
        message: 'Organization deleted successfully'
      })
    } catch (error: any) {
      console.error('Organization DELETE error:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { 
          status: error.message.includes('Unauthorized') ? 401 : 
                 error.message.includes('Insufficient') ? 403 : 500 
        }
      )
    }
  })
}