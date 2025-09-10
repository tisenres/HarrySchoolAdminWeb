import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/api-auth'
import { credentialService } from '@/lib/services/credential-service'
import { z } from 'zod'

const updatePasswordSchema = z.object({
  newPassword: z.string().min(8).optional()
})

// GET credentials for specific student
export const GET = withAuth(async (
  _request: NextRequest,
  context,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    
    const credentials = await credentialService.getCredentials(id)
    
    if (!credentials) {
      return NextResponse.json({
        success: false,
        error: 'Student credentials not found',
        hasCredentials: false
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: credentials.id,
        username: credentials.username,
        password: credentials.password_visible,
        isActive: credentials.is_active,
        createdAt: credentials.created_at
      },
      hasCredentials: true
    })

  } catch (error) {
    console.error('❌ Get Credentials Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get credentials'
      },
      { status: 500 }
    )
  }
}, 'admin')

// POST create credentials for specific student
export const POST = withAuth(async (
  _request: NextRequest,
  context,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    
    const credentials = await credentialService.createCredentials(id)
    
    return NextResponse.json({
      success: true,
      data: {
        id: credentials.id,
        username: credentials.username,
        password: credentials.password_visible,
        isActive: credentials.is_active,
        createdAt: credentials.created_at
      },
      message: 'Student credentials created successfully'
    })

  } catch (error) {
    console.error('❌ Create Student Credentials Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create credentials'
      },
      { status: 500 }
    )
  }
}, 'admin')

// PUT update password for specific student
export const PUT = withAuth(async (
  request: NextRequest,
  context,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updatePasswordSchema.parse(body)
    
    const newPassword = await credentialService.updatePassword(id, validatedData.newPassword)
    
    return NextResponse.json({
      success: true,
      data: {
        password: newPassword
      },
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('❌ Update Password Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update password'
      },
      { status: 500 }
    )
  }
}, 'admin')

// DELETE deactivate credentials for specific student
export const DELETE = withAuth(async (
  _request: NextRequest,
  context,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    
    await credentialService.deactivateCredentials(id)
    
    return NextResponse.json({
      success: true,
      message: 'Student credentials deactivated successfully'
    })

  } catch (error) {
    console.error('❌ Deactivate Credentials Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deactivate credentials'
      },
      { status: 500 }
    )
  }
}, 'admin')