import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/api-auth'
import { TeachersTemplateService } from '@/lib/services/teachers-template-service'

export const GET = withAuth(async (request: NextRequest, { user, profile }) => {
  try {
    // Create template service
    const templateService = new TeachersTemplateService(profile.organization_id)
    
    // Generate template
    const templateData = await templateService.generateTemplate()

    // Return file data as response
    const filename = `teachers_import_template_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(templateData.buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': templateData.buffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Teachers template generation error:', error)

    return NextResponse.json(
      { error: 'Template generation failed: ' + (error.message || 'Unknown error') },
      { status: 500 }
    )
  }
})