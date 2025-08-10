import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/api-auth'
import { TeachersExportService } from '@/lib/services/teachers-export-service'
import { z } from 'zod'

const exportRequestSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  format: z.enum(['xlsx', 'csv']).default('xlsx'),
  fields: z.array(z.string()).optional(),
  filters: z.record(z.any()).optional(),
  useFilters: z.boolean().default(true),
  includeHeaders: z.boolean().default(true),
  filename: z.string().optional()
})

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json()
    
    // Validate request
    const validatedData = exportRequestSchema.parse(body)

    // Create export service
    const exportService = new TeachersExportService(validatedData.organizationId)
    
    // Generate export data
    const exportData = await exportService.exportTeachers({
      format: validatedData.format,
      fields: validatedData.fields,
      filters: validatedData.useFilters ? validatedData.filters : undefined,
      includeHeaders: validatedData.includeHeaders,
      filename: validatedData.filename
    })

    // Debug: Check if exportData is valid
    if (!exportData || !exportData.buffer) {
      console.error('Export data is invalid:', exportData)
      throw new Error('Export failed: Invalid export data generated')
    }

    // Return file data as response
    const contentType = validatedData.format === 'xlsx' 
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv'
    
    const filename = validatedData.filename || `teachers_export_${new Date().toISOString().split('T')[0]}`
    const extension = validatedData.format === 'xlsx' ? '.xlsx' : '.csv'

    return new NextResponse(exportData.buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}${extension}"`,
        'Content-Length': exportData.buffer.byteLength.toString()
      }
    })

  } catch (error) {
    console.error('Teachers export error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Export failed: ' + (error.message || 'Unknown error') },
      { status: 500 }
    )
  }
})