import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const systemSettingsSchema = z.object({
  // Maintenance mode
  maintenance_mode: z.boolean().optional(),
  maintenance_message: z.string().max(500).optional(),
  maintenance_scheduled_at: z.string().datetime().optional(),
  maintenance_estimated_duration: z.number().min(5).max(1440).optional(),
  
  // Feature flags
  features_enabled: z.array(z.string()).optional(),
  beta_features_enabled: z.boolean().optional(),
  debug_mode: z.boolean().optional(),
  
  // System limits
  max_students_per_org: z.number().min(50).max(10000).optional(),
  max_teachers_per_org: z.number().min(5).max(500).optional(),
  max_groups_per_org: z.number().min(5).max(1000).optional(),
  storage_limit_gb: z.number().min(1).max(1000).optional(),
  
  // Performance settings
  enable_caching: z.boolean().optional(),
  cache_ttl_minutes: z.number().min(1).max(1440).optional(),
  rate_limit_per_minute: z.number().min(10).max(1000).optional(),
  
  // Monitoring
  error_tracking_enabled: z.boolean().optional(),
  performance_monitoring: z.boolean().optional(),
  audit_log_retention_days: z.number().min(30).max(2555).optional()
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only superadmin can view system settings
    if (profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only superadmin can view system settings' }, { status: 403 })
    }

    const supabase = await createServerClient()
    
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select(`
        maintenance_mode,
        maintenance_message,
        maintenance_scheduled_at,
        maintenance_estimated_duration,
        features_enabled,
        beta_features_enabled,
        debug_mode,
        max_students_per_org,
        max_teachers_per_org,
        max_groups_per_org,
        storage_limit_gb,
        enable_caching,
        cache_ttl_minutes,
        rate_limit_per_minute,
        error_tracking_enabled,
        performance_monitoring,
        audit_log_retention_days,
        created_at,
        updated_at
      `)
      .eq('organization_id', profile.organization_id)
      .single()

    if (error) {
      // If no settings exist, return defaults
      if (error.code === 'PGRST116') {
        const defaultSettings = {
          maintenance_mode: false,
          maintenance_message: 'System is under maintenance. Please try again later.',
          maintenance_scheduled_at: null,
          maintenance_estimated_duration: 60,
          features_enabled: ['teachers', 'students', 'groups', 'reports'],
          beta_features_enabled: false,
          debug_mode: false,
          max_students_per_org: 1000,
          max_teachers_per_org: 50,
          max_groups_per_org: 100,
          storage_limit_gb: 10,
          enable_caching: true,
          cache_ttl_minutes: 60,
          rate_limit_per_minute: 100,
          error_tracking_enabled: true,
          performance_monitoring: true,
          audit_log_retention_days: 365
        }
        return NextResponse.json(defaultSettings)
      }
      throw error
    }

    return NextResponse.json(settings)
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

    // Only superadmin can update system settings
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

    // Check if system settings exist
    const { data: existingSettings } = await supabase
      .from('system_settings')
      .select('id')
      .eq('organization_id', profile.organization_id)
      .single()

    let settings
    let operation

    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('system_settings')
        .update({
          ...updateData,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', profile.organization_id)
        .select(`
          maintenance_mode,
          maintenance_message,
          maintenance_scheduled_at,
          maintenance_estimated_duration,
          features_enabled,
          beta_features_enabled,
          debug_mode,
          max_students_per_org,
          max_teachers_per_org,
          max_groups_per_org,
          storage_limit_gb,
          enable_caching,
          cache_ttl_minutes,
          rate_limit_per_minute,
          error_tracking_enabled,
          performance_monitoring,
          audit_log_retention_days,
          updated_at
        `)
        .single()

      if (error) throw error
      settings = data
      operation = 'updated'
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('system_settings')
        .insert([{
          organization_id: profile.organization_id,
          created_by: user.id,
          updated_by: user.id,
          ...updateData
        }])
        .select(`
          maintenance_mode,
          maintenance_message,
          maintenance_scheduled_at,
          maintenance_estimated_duration,
          features_enabled,
          beta_features_enabled,
          debug_mode,
          max_students_per_org,
          max_teachers_per_org,
          max_groups_per_org,
          storage_limit_gb,
          enable_caching,
          cache_ttl_minutes,
          rate_limit_per_minute,
          error_tracking_enabled,
          performance_monitoring,
          audit_log_retention_days,
          created_at,
          updated_at
        `)
        .single()

      if (error) throw error
      settings = data
      operation = 'created'
    }

    // Log the system settings change
    await supabase.rpc('log_security_event', {
      event_type: `system_settings_${operation}`,
      event_details: {
        changed_fields: Object.keys(updateData),
        organization_id: profile.organization_id,
        changed_by: user.id,
        maintenance_mode_enabled: updateData.maintenance_mode
      },
      event_severity: updateData.maintenance_mode ? 'high' : 'info'
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating system settings:', error)
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    )
  }
}