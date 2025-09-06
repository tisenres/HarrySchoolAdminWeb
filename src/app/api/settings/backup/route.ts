import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { backupService } from '@/lib/services/backup-service'
import { z } from 'zod'

const backupSettingsSchema = z.object({
  automated_backups: z.boolean().optional(),
  backup_frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  backup_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  backup_retention_days: z.number().min(7).max(365).optional(),
  include_attachments: z.boolean().optional()
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin and superadmin can view backup settings
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const supabase = await createServerClient()
    
    // Get backup settings
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select(`
        automated_backups,
        backup_frequency,
        backup_time,
        backup_retention_days,
        include_attachments
      `)
      .eq('organization_id', profile.organization_id)
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError
    }

    // Get backup statistics
    const { data: totalBackups, error: totalError } = await supabase
      .from('backup_history')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)

    const { data: completedBackups, error: completedError } = await supabase
      .from('backup_history')
      .select('id, file_size', { count: 'exact' })
      .eq('organization_id', profile.organization_id)
      .eq('status', 'completed')

    const { data: lastBackup, error: lastError } = await supabase
      .from('backup_history')
      .select('completed_at, status, file_size')
      .eq('organization_id', profile.organization_id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    // Calculate total size of completed backups
    const totalSize = completedBackups?.reduce((acc, backup) => acc + (backup.file_size || 0), 0) || 0

    return NextResponse.json({
      settings: settings || {
        automated_backups: true,
        backup_frequency: 'daily',
        backup_time: '02:00',
        backup_retention_days: 30,
        include_attachments: true
      },
      statistics: {
        total_backups: totalBackups?.length || 0,
        completed_backups: completedBackups?.length || 0,
        total_size_bytes: totalSize,
        last_backup: lastBackup || null,
        next_backup: calculateNextBackup(settings?.backup_frequency || 'daily', settings?.backup_time || '02:00')
      }
    })
  } catch (error) {
    console.error('Error fetching backup settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch backup settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only superadmin can update backup settings
    if (profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only superadmin can update backup settings' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = backupSettingsSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data
    const supabase = await createServerClient()

    // Update system settings with backup configuration
    const { data: settings, error } = await supabase
      .from('system_settings')
      .update({
        ...updateData,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', profile.organization_id)
      .select(`
        automated_backups,
        backup_frequency,
        backup_time,
        backup_retention_days,
        include_attachments,
        updated_at
      `)
      .single()

    if (error) throw error

    // Log the backup settings change
    await supabase.rpc('log_security_event', {
      event_type: 'backup_settings_updated',
      event_details: {
        changed_fields: Object.keys(updateData),
        organization_id: profile.organization_id,
        changed_by: user.id
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating backup settings:', error)
    return NextResponse.json(
      { error: 'Failed to update backup settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only superadmin can create manual backups
    if (profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only superadmin can create backups' }, { status: 403 })
    }

    const supabase = await createServerClient()

    // Generate backup name
    const backupName = `manual_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}`

    // Create backup record
    const { data: backup, error } = await supabase
      .from('backup_history')
      .insert([{
        organization_id: profile.organization_id,
        backup_name: backupName,
        backup_type: 'manual',
        status: 'pending',
        created_by: user.id,
        tables_included: ['organizations', 'profiles', 'teachers', 'students', 'groups', 'organization_settings', 'system_settings']
      }])
      .select()
      .single()

    if (error) throw error

    // Start a realistic backup simulation (for demo purposes)
    // In production, this would trigger actual backup process
    startBackupSimulation(supabase, backup.id, backupName, profile.organization_id)

    // Log the manual backup creation
    await supabase.rpc('log_security_event', {
      event_type: 'manual_backup_created',
      event_details: {
        backup_id: backup.id,
        backup_name: backupName,
        created_by: user.id
      }
    })

    return NextResponse.json({
      backup,
      message: 'Manual backup started successfully'
    })
  } catch (error) {
    console.error('Error creating manual backup:', error)
    return NextResponse.json(
      { error: 'Failed to create manual backup' },
      { status: 500 }
    )
  }
}

async function startBackupSimulation(supabase: any, backupId: string, backupName: string, organizationId: string) {
  // Update status to in_progress immediately
  await supabase
    .from('backup_history')
    .update({ status: 'in_progress' })
    .eq('id', backupId)

  // Simulate backup process with realistic timing (10-15 seconds)
  const duration = Math.floor(Math.random() * 5000) + 10000 // 10-15 seconds
  
  setTimeout(async () => {
    // Simulate occasional failures for demo realism (10% chance)
    const shouldFail = Math.random() < 0.1
    
    if (shouldFail) {
      await supabase
        .from('backup_history')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: 'Demo failure: Connection timeout during backup process'
        })
        .eq('id', backupId)
    } else {
      // Simulate realistic file sizes (5-50 MB)
      const fileSize = Math.floor(Math.random() * 45000000) + 5000000
      
      await supabase
        .from('backup_history')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          file_size: fileSize,
          file_path: `/backups/${organizationId}/${backupName}.sql`,
          checksum: generateDemoChecksum()
        })
        .eq('id', backupId)
    }
  }, duration)
}

function generateDemoChecksum(): string {
  const chars = 'abcdef0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function calculateNextBackup(frequency: string, time: string): string | null {
  const now = new Date()
  const [hours, minutes] = time.split(':').map(Number)
  
  let nextBackup = new Date()
  nextBackup.setHours(hours, minutes, 0, 0)
  
  // If the time has already passed today, move to next occurrence
  if (nextBackup <= now) {
    switch (frequency) {
      case 'daily':
        nextBackup.setDate(nextBackup.getDate() + 1)
        break
      case 'weekly':
        nextBackup.setDate(nextBackup.getDate() + 7)
        break
      case 'monthly':
        nextBackup.setMonth(nextBackup.getMonth() + 1)
        break
    }
  }
  
  return nextBackup.toISOString()
}