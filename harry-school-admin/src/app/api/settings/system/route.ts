import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const systemSettingsSchema = z.object({
  maintenance_mode: z.boolean().optional(),
  maintenance_message: z.string().max(500).optional(),
  backup_schedule: z.object({
    enabled: z.boolean(),
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  }).optional(),
  feature_flags: z.object({
    advanced_reporting: z.boolean(),
    bulk_operations: z.boolean(),
    api_access: z.boolean()
  }).optional()
})

type SystemSettingsFormValues = z.infer<typeof systemSettingsSchema>

// Helper function to get settings from key-value structure
async function getSystemSettings(supabase: any, orgId: string) {
  const { data: settings, error } = await supabase
    .from('system_settings')
    .select('key, value, category')
    .eq('organization_id', orgId)
    .eq('category', 'system')

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  // Convert key-value pairs to structured object
  const settingsMap: Record<string, any> = {}
  
  if (settings && settings.length > 0) {
    settings.forEach((setting: any) => {
      settingsMap[setting.key] = setting.value
    })
  }

  // Return structured settings with defaults
  return {
    maintenance_mode: settingsMap.maintenance_mode || false,
    maintenance_message: settingsMap.maintenance_message || 'System is under maintenance. We\'ll be back shortly...',
    backup_schedule: settingsMap.backup_schedule || {
      enabled: true,
      frequency: 'daily',
      time: '02:00'
    },
    feature_flags: settingsMap.feature_flags || {
      advanced_reporting: true,
      bulk_operations: true,
      api_access: false
    }
  }
}

// Helper function to save settings in key-value structure
async function saveSystemSettings(supabase: any, orgId: string, userId: string, settings: SystemSettingsFormValues) {
  const updates = []
  const now = new Date().toISOString()

  // Prepare upsert operations for each setting
  if (settings.maintenance_mode !== undefined) {
    updates.push({
      organization_id: orgId,
      category: 'system',
      key: 'maintenance_mode',
      value: settings.maintenance_mode,
      data_type: 'boolean',
      description: 'Enable/disable maintenance mode',
      is_public: false,
      created_by: userId,
      updated_by: userId
    })
  }

  if (settings.maintenance_message !== undefined) {
    updates.push({
      organization_id: orgId,
      category: 'system',
      key: 'maintenance_message',
      value: settings.maintenance_message,
      data_type: 'string',
      description: 'Message shown during maintenance',
      is_public: false,
      created_by: userId,
      updated_by: userId
    })
  }

  if (settings.backup_schedule) {
    updates.push({
      organization_id: orgId,
      category: 'system',
      key: 'backup_schedule',
      value: settings.backup_schedule,
      data_type: 'object',
      description: 'Automated backup configuration',
      is_public: false,
      created_by: userId,
      updated_by: userId
    })
  }

  if (settings.feature_flags) {
    updates.push({
      organization_id: orgId,
      category: 'system',
      key: 'feature_flags',
      value: settings.feature_flags,
      data_type: 'object',
      description: 'Feature flags configuration',
      is_public: false,
      created_by: userId,
      updated_by: userId
    })
  }

  // Perform upserts
  for (const update of updates) {
    const { error } = await supabase
      .from('system_settings')
      .upsert(update, {
        onConflict: 'organization_id,category,key',
        ignoreDuplicates: false
      })

    if (error) {
      throw error
    }
  }

  return await getSystemSettings(supabase, orgId)
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin and superadmin can view system settings
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const supabase = await createServerClient()
    const settings = await getSystemSettings(supabase, profile.organization_id)

    return NextResponse.json({ 
      success: true,
      data: settings 
    })
  } catch (error) {
    console.error('Error fetching system settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
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

    // Only superadmin can update system settings (keep this restriction for updates)
    if (profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only superadmin can update system settings' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = systemSettingsSchema.safeParse(body)
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

    // Save settings
    const settings = await saveSystemSettings(supabase, profile.organization_id, user.id, updateData)

    // Log security event for maintenance mode changes
    if (updateData.maintenance_mode !== undefined) {
      try {
        await supabase.rpc('log_security_event', {
          event_type: 'maintenance_mode_changed',
          event_details: {
            maintenance_mode: updateData.maintenance_mode,
            organization_id: profile.organization_id,
            changed_by: user.id,
            timestamp: new Date().toISOString()
          },
          event_severity: updateData.maintenance_mode ? 'high' : 'info'
        })
      } catch (logError) {
        // Don't fail the update if logging fails
        console.warn('Failed to log security event:', logError)
      }
    }

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'System settings updated successfully'
    })
  } catch (error) {
    console.error('Error updating system settings:', error)
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    )
  }
}