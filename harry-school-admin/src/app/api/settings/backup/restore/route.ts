import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth'
import { backupService } from '@/lib/services/backup-service'
import { z } from 'zod'

const restoreSchema = z.object({
  overwriteExisting: z.boolean().optional().default(false),
  selectiveTables: z.array(z.string()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only superadmin can restore backups
    if (profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only superadmin can restore backups' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const optionsJson = formData.get('options') as string

    if (!file) {
      return NextResponse.json({ error: 'No backup file provided' }, { status: 400 })
    }

    let options = {}
    if (optionsJson) {
      try {
        options = restoreSchema.parse(JSON.parse(optionsJson))
      } catch {
        return NextResponse.json({ error: 'Invalid options format' }, { status: 400 })
      }
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Restore backup
    const result = await backupService.restoreBackup(arrayBuffer, options)

    if (!result.success) {
      return NextResponse.json({ error: 'Restore failed - no tables were restored' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully restored ${result.restoredTables.length} tables`,
      restoredTables: result.restoredTables,
      recordCounts: result.recordCounts
    })

  } catch (error) {
    console.error('Backup restore error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to restore backup' },
      { status: 500 }
    )
  }
}