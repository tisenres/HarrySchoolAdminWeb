import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/api-auth'
import { GroupsTemplateService } from '@/lib/services/groups-template-service'

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const templateService = new GroupsTemplateService()
    const templateData = templateService.generateTemplate()

    return new NextResponse(templateData.buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="groups_import_template.xlsx"',
        'Content-Length': templateData.buffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Template generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate template: ' + (error.message || 'Unknown error') },
      { status: 500 }
    )
  }
})