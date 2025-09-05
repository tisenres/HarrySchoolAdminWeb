import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/api-auth'
import { ImportResult } from '@/lib/services/import-export-service'
import { GroupsImportService } from '@/lib/services/groups-import-service'
import { z } from 'zod'

const importRequestSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID')
})

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const organizationId = formData.get('organizationId') as string

    // Validate request
    const { organizationId: validatedOrgId } = importRequestSchema.parse({
      organizationId
    })

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSizeBytes = 10 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Convert File to buffer for processing
    const buffer = Buffer.from(await file.arrayBuffer())
    const tempFile = new File([buffer], file.name, { type: file.type })

    // Process the import
    const importService = new GroupsImportService(validatedOrgId, user.id)
    const result: ImportResult = await importService.importFromFile(tempFile)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Groups import error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Import failed: ' + (error.message || 'Unknown error') },
      { status: 500 }
    )
  }
})