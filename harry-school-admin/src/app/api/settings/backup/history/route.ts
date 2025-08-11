import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin and superadmin can view backup history
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const supabase = await createServerClient()
    
    let query = supabase
      .from('backup_history')
      .select(`
        id,
        backup_name,
        backup_type,
        status,
        file_size,
        file_path,
        tables_included,
        error_message,
        started_at as created_at,
        completed_at,
        profiles!backup_history_created_by_fkey (
          full_name,
          email
        )
      `)
      .eq('organization_id', profile.organization_id)
      .order('started_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (type) {
      query = query.eq('backup_type', type)
    }

    const { data: backups, error } = await query.range(offset, offset + limit - 1)

    if (error) throw error

    // Get total count for pagination
    let countQuery = supabase
      .from('backup_history')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)

    if (status) countQuery = countQuery.eq('status', status)
    if (type) countQuery = countQuery.eq('backup_type', type)

    const { count, error: countError } = await countQuery

    if (countError) throw countError

    // Format backup data
    const formattedBackups = backups?.map(backup => ({
      id: backup.id,
      name: backup.backup_name,
      type: backup.backup_type,
      status: backup.status,
      file_size: backup.file_size,
      file_size_mb: backup.file_size ? Math.round(backup.file_size / 1024 / 1024 * 100) / 100 : null,
      file_path: backup.file_path,
      tables_included: backup.tables_included,
      error_message: backup.error_message,
      created_by: backup.profiles ? {
        name: backup.profiles.full_name,
        email: backup.profiles.email
      } : null,
      created_at: backup.created_at,
      completed_at: backup.completed_at,
      duration: backup.completed_at ? calculateDuration(backup.created_at, backup.completed_at) : null
    })) || []

    return NextResponse.json({
      backups: formattedBackups,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      },
      summary: {
        total_backups: count || 0,
        completed: formattedBackups.filter(b => b.status === 'completed').length,
        failed: formattedBackups.filter(b => b.status === 'failed').length,
        in_progress: formattedBackups.filter(b => b.status === 'pending').length
      }
    })
  } catch (error) {
    console.error('Error fetching backup history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch backup history' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only superadmin can delete backup records
    if (profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only superadmin can delete backup records' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const backupId = searchParams.get('backupId')
    const deleteType = searchParams.get('type') // 'old' or 'failed'

    const supabase = await createServerClient()

    if (backupId) {
      // Delete specific backup record
      const { data: backup, error: fetchError } = await supabase
        .from('backup_history')
        .select('backup_name, status, file_path')
        .eq('id', backupId)
        .eq('organization_id', profile.organization_id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return NextResponse.json({ error: 'Backup not found' }, { status: 404 })
        }
        throw fetchError
      }

      // Delete the backup record
      const { error: deleteError } = await supabase
        .from('backup_history')
        .delete()
        .eq('id', backupId)
        .eq('organization_id', profile.organization_id)

      if (deleteError) throw deleteError

      // Log the deletion
      await supabase.rpc('log_security_event', {
        event_type: 'backup_record_deleted',
        event_details: {
          backup_id: backupId,
          backup_name: backup.backup_name,
          status: backup.status,
          deleted_by: user.id
        },
        event_severity: 'warning'
      })

      return NextResponse.json({ 
        message: 'Backup record deleted successfully' 
      })

    } else if (deleteType === 'old') {
      // Delete old backup records (older than retention period)
      const retentionDays = 30 // Could be made configurable
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      const { data: oldBackups, error: fetchError } = await supabase
        .from('backup_history')
        .select('id, backup_name')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'completed')
        .lt('started_at', cutoffDate.toISOString())

      if (fetchError) throw fetchError

      if (!oldBackups || oldBackups.length === 0) {
        return NextResponse.json({ 
          message: 'No old backup records found to delete',
          deleted_count: 0
        })
      }

      // Delete old backup records
      const { error: deleteError } = await supabase
        .from('backup_history')
        .delete()
        .eq('organization_id', profile.organization_id)
        .eq('status', 'completed')
        .lt('started_at', cutoffDate.toISOString())

      if (deleteError) throw deleteError

      // Log the cleanup
      await supabase.rpc('log_security_event', {
        event_type: 'old_backup_records_cleaned',
        event_details: {
          deleted_count: oldBackups.length,
          retention_days: retentionDays,
          deleted_by: user.id
        },
        event_severity: 'info'
      })

      return NextResponse.json({ 
        message: `${oldBackups.length} old backup records deleted successfully`,
        deleted_count: oldBackups.length
      })

    } else if (deleteType === 'failed') {
      // Delete failed backup records
      const { data: failedBackups, error: fetchError } = await supabase
        .from('backup_history')
        .select('id, backup_name')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'failed')

      if (fetchError) throw fetchError

      if (!failedBackups || failedBackups.length === 0) {
        return NextResponse.json({ 
          message: 'No failed backup records found to delete',
          deleted_count: 0
        })
      }

      // Delete failed backup records
      const { error: deleteError } = await supabase
        .from('backup_history')
        .delete()
        .eq('organization_id', profile.organization_id)
        .eq('status', 'failed')

      if (deleteError) throw deleteError

      // Log the cleanup
      await supabase.rpc('log_security_event', {
        event_type: 'failed_backup_records_cleaned',
        event_details: {
          deleted_count: failedBackups.length,
          deleted_by: user.id
        },
        event_severity: 'info'
      })

      return NextResponse.json({ 
        message: `${failedBackups.length} failed backup records deleted successfully`,
        deleted_count: failedBackups.length
      })

    } else {
      return NextResponse.json({ 
        error: 'Invalid request. Provide backupId or type (old/failed)' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Error deleting backup records:', error)
    return NextResponse.json(
      { error: 'Failed to delete backup records' },
      { status: 500 }
    )
  }
}

function calculateDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diffMs = end.getTime() - start.getTime()
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}