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

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Ensure user can only access their own organization
    if (profile.organization_id !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createServerClient()
    
    // Check status of each settings section
    const statusChecks = await Promise.allSettled([
      // Organization settings
      supabase
        .from('organization_settings')
        .select('id, name, email, phone')
        .eq('organization_id', organizationId)
        .single(),
      
      // User count (for user management status)
      supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('deleted_at', null),
      
      // System settings
      supabase
        .from('system_settings')
        .select('id, password_min_length, require_2fa')
        .eq('organization_id', organizationId)
        .single(),
      
      // Backup history (for backup status)
      supabase
        .from('backup_history')
        .select('id, status', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1),
      
      // Notification settings
      supabase
        .from('user_notification_settings')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
    ])

    // Evaluate status for each section
    const organizationStatus = statusChecks[0].status === 'fulfilled' && 
                              statusChecks[0].value.data?.name && 
                              statusChecks[0].value.data?.email ? 'complete' : 'incomplete'

    const userCount = statusChecks[1].status === 'fulfilled' ? statusChecks[1].value.count : 0
    const usersStatus = userCount && userCount > 1 ? 'complete' : 'incomplete'

    const securityData = statusChecks[2].status === 'fulfilled' ? statusChecks[2].value.data : null
    const securityStatus = securityData && 
                          securityData.password_min_length >= 8 ? 'complete' : 'incomplete'

    const backupCount = statusChecks[3].status === 'fulfilled' ? statusChecks[3].value.count : 0
    const backupStatus = backupCount && backupCount > 0 ? 'complete' : 'warning'

    const notificationCount = statusChecks[4].status === 'fulfilled' ? statusChecks[4].value.count : 0
    const notificationStatus = notificationCount > 0 ? 'complete' : 'incomplete'

    const status = {
      organization: organizationStatus,
      users: usersStatus,
      security: securityStatus,
      backup: backupStatus,
      notifications: notificationStatus
    }

    // Log the status check
    await supabase.rpc('log_security_event', {
      event_type: 'settings_status_check',
      event_details: { status, user_id: user.id }
    })

    return NextResponse.json({ status })
  } catch (error) {
    console.error('Error fetching settings status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings status' },
      { status: 500 }
    )
  }
}