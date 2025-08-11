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

    const organizationId = profile.organization_id

    const supabase = await createServerClient()
    
    // For demo purposes, provide realistic status based on available data
    const statusChecks = await Promise.allSettled([
      // Check if organization has basic info
      supabase
        .from('organizations')
        .select('id, name, email, phone')
        .eq('id', organizationId)
        .single(),
      
      // User count (for user management status)
      supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .is('deleted_at', null),
      
      // Check if profile has basic settings
      supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('id', user.id)
        .single(),
      
      // Check for any activity (students/teachers as proxy for backup data)
      supabase
        .from('students')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
        .limit(1),
      
      // Check notification preferences (use profile data as proxy)
      supabase
        .from('profiles')
        .select('id, email')
        .eq('id', user.id)
        .single()
    ])

    // Evaluate status for each section
    const organizationData = statusChecks[0].status === 'fulfilled' ? statusChecks[0].value.data : null
    const organizationStatus = organizationData && organizationData.name && organizationData.email ? 'complete' : 'incomplete'

    const userCount = statusChecks[1].status === 'fulfilled' ? statusChecks[1].value.count || 0 : 0
    const usersStatus = userCount > 1 ? 'complete' : 'incomplete'

    const profileData = statusChecks[2].status === 'fulfilled' ? statusChecks[2].value.data : null
    const securityStatus = profileData && profileData.role && profileData.full_name ? 'complete' : 'incomplete'

    const studentCount = statusChecks[3].status === 'fulfilled' ? statusChecks[3].value.count || 0 : 0
    const backupStatus = studentCount > 0 ? 'complete' : 'incomplete'

    const notificationData = statusChecks[4].status === 'fulfilled' ? statusChecks[4].value.data : null
    const notificationStatus = notificationData && notificationData.email ? 'complete' : 'incomplete'

    const status = {
      organization: organizationStatus,
      users: usersStatus,
      security: securityStatus,
      backup: backupStatus,
      notifications: notificationStatus
    }

    // Skip logging for now to avoid RPC errors

    return NextResponse.json({ status })
  } catch (error) {
    console.error('Error fetching settings status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings status' },
      { status: 500 }
    )
  }
}