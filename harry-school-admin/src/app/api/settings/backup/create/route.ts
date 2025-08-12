import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { backupService } from '@/lib/services/backup-service'
import { z } from 'zod'

const createBackupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  options: z.object({
    includeProfiles: z.boolean().optional(),
    includeTeachers: z.boolean().optional(),
    includeStudents: z.boolean().optional(),
    includeGroups: z.boolean().optional(),
    includeOrganizationSettings: z.boolean().optional(),
    includeSystemSettings: z.boolean().optional(),
    includeNotifications: z.boolean().optional(),
    compression: z.boolean().optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin and superadmin can create backups
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, options } = createBackupSchema.parse(body)

    const supabase = await createServerClient()

    // Create backup record with pending status
    const backupId = crypto.randomUUID()
    const { error: insertError } = await supabase
      .from('backup_history')
      .insert({
        id: backupId,
        organization_id: profile.organization_id,
        name: name || `Manual Backup ${new Date().toLocaleDateString()}`,
        description,
        status: 'pending',
        type: 'manual',
        created_by: profile.id,
        started_at: new Date().toISOString()
      })

    if (insertError) {
      throw new Error(`Failed to create backup record: ${insertError.message}`)
    }

    // Start backup process asynchronously
    createBackupAsync(backupId, profile.organization_id, profile.id, options || {}, name, description)

    return NextResponse.json({
      success: true,
      backupId,
      message: 'Backup started successfully'
    })

  } catch (error) {
    console.error('Backup creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create backup' },
      { status: 500 }
    )
  }
}

// Async function to handle the actual backup creation
async function createBackupAsync(
  backupId: string,
  organizationId: string,
  userId: string,
  options: any,
  name?: string,
  description?: string
) {
  const supabase = await createServerClient()

  try {
    // Update status to in_progress
    await supabase
      .from('backup_history')
      .update({ status: 'in_progress' })
      .eq('id', backupId)

    // Create the actual backup
    const backup = await backupService.createBackup(options, name, description)

    // In a real implementation, you would save the backup data to storage
    // For now, we'll simulate it and just store metadata
    
    // Update backup record with completion details
    await supabase
      .from('backup_history')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        size: backup.metadata.size,
        checksum: backup.metadata.checksum,
        file_path: `/backups/${organizationId}/${backupId}.zip`, // Simulated path
        metadata: backup.metadata
      })
      .eq('id', backupId)

    console.log(`Backup ${backupId} completed successfully`)

  } catch (error) {
    console.error(`Backup ${backupId} failed:`, error)

    // Update backup record with failure
    await supabase
      .from('backup_history')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', backupId)
  }
}