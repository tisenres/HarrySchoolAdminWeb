import { NextRequest, NextResponse } from 'next/server'
import organizationService from '@/lib/services/organization-service'
import { withAuth } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const organizations = await organizationService.getAll()
      
      return NextResponse.json({
        data: organizations,
        success: true
      })
    } catch (error: any) {
      console.error('Organizations GET error:', error)
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
      const organization = await organizationService.create(body)
      
      return NextResponse.json({
        data: organization,
        success: true
      }, { status: 201 })
    } catch (error: any) {
      console.error('Organizations POST error:', error)
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