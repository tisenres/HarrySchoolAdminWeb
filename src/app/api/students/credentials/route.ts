import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/api-auth'
import { credentialService } from '@/lib/services/credential-service'
import { z } from 'zod'

const bulkCreateSchema = z.object({
  studentIds: z.array(z.string().uuid())
})

const singleCreateSchema = z.object({
  studentId: z.string().uuid()
})

// GET credentials for organization (list students without credentials)
export const GET = withAuth(async (
  request: NextRequest,
  context
) => {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = context.profile.organization_id

    // Check if requesting students without credentials
    const withoutCredentials = searchParams.get('without_credentials')

    if (withoutCredentials === 'true') {
      const students = await credentialService.getStudentsWithoutCredentials(organizationId)
      
      return NextResponse.json({
        success: true,
        data: students,
        count: students.length
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid request. Use ?without_credentials=true to get students without credentials'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ Credentials API Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}, 'admin')

// POST create credentials (single or bulk)
export const POST = withAuth(async (
  request: NextRequest,
  context
) => {
  try {
    const body = await request.json()
    
    // Check if it's bulk operation
    if (body.studentIds && Array.isArray(body.studentIds)) {
      const validatedData = bulkCreateSchema.parse(body)
      
      const credentials = await credentialService.bulkCreateCredentials(validatedData.studentIds)
      
      return NextResponse.json({
        success: true,
        data: credentials,
        message: `Created credentials for ${credentials.length} students`,
        created_count: credentials.length,
        requested_count: validatedData.studentIds.length
      })
    } else if (body.studentId) {
      const validatedData = singleCreateSchema.parse(body)
      
      const credentials = await credentialService.createCredentials(validatedData.studentId)
      
      return NextResponse.json({
        success: true,
        data: credentials,
        message: 'Student credentials created successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid request. Provide either studentId or studentIds array'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Create Credentials Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create credentials'
      },
      { status: 500 }
    )
  }
}, 'admin')