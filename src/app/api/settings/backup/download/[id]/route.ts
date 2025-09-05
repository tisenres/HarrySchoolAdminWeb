import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { backupService } from '@/lib/services/backup-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin and superadmin can download backups
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const supabase = await createServerClient()

    // Get backup record
    const { data: backup, error } = await supabase
      .from('backup_history')
      .select('*')
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .eq('status', 'completed')
      .single()

    if (error || !backup) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 })
    }

    // For demo purposes, create a fresh backup
    // In production, you would retrieve the stored backup file
    const backupData = await backupService.createBackup({
      includeProfiles: true,
      includeTeachers: true,
      includeStudents: true,
      includeGroups: true,
      includeOrganizationSettings: true,
      compression: true
    }, backup.name, backup.description)

    // Return the backup file
    return new NextResponse(backupData.data, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${backup.name}.zip"`,
        'Content-Length': backupData.data.byteLength.toString()
      }
    })

  } catch (error) {
    console.error('Backup download error:', error)
    return NextResponse.json(
      { error: 'Failed to download backup' },
      { status: 500 }
    )
  }
}