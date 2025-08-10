import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const securitySettingsSchema = z.object({
  // Password policy
  password_min_length: z.number().min(6).max(32).optional(),
  password_require_uppercase: z.boolean().optional(),
  password_require_lowercase: z.boolean().optional(),
  password_require_numbers: z.boolean().optional(),
  password_require_symbols: z.boolean().optional(),
  password_expiry_days: z.number().min(0).max(365).optional(),
  password_history_count: z.number().min(0).max(10).optional(),
  
  // Session management
  session_timeout_minutes: z.number().min(15).max(1440).optional(),
  max_login_attempts: z.number().min(3).max(10).optional(),
  lockout_duration_minutes: z.number().min(5).max(1440).optional(),
  require_captcha_after_attempts: z.number().min(2).max(5).optional(),
  
  // Two-factor authentication
  require_2fa: z.boolean().optional(),
  allow_backup_codes: z.boolean().optional(),
  backup_codes_count: z.number().min(5).max(20).optional(),
  
  // IP restrictions
  ip_whitelist_enabled: z.boolean().optional(),
  allowed_ips: z.array(z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, "Invalid IP address")).optional()
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin and superadmin can view security settings
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const supabase = await createServerClient()
    
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select(`
        password_min_length,
        password_require_uppercase,
        password_require_lowercase,
        password_require_numbers,
        password_require_symbols,
        password_expiry_days,
        password_history_count,
        session_timeout_minutes,
        max_login_attempts,
        lockout_duration_minutes,
        require_captcha_after_attempts,
        require_2fa,
        allow_backup_codes,
        backup_codes_count,
        ip_whitelist_enabled,
        allowed_ips,
        created_at,
        updated_at
      `)
      .eq('organization_id', profile.organization_id)
      .single()

    if (error) {
      // If no settings exist, return defaults
      if (error.code === 'PGRST116') {
        const defaultSettings = {
          password_min_length: 8,
          password_require_uppercase: true,
          password_require_lowercase: true,
          password_require_numbers: true,
          password_require_symbols: false,
          password_expiry_days: 90,
          password_history_count: 3,
          session_timeout_minutes: 480,
          max_login_attempts: 5,
          lockout_duration_minutes: 30,
          require_captcha_after_attempts: 3,
          require_2fa: false,
          allow_backup_codes: true,
          backup_codes_count: 10,
          ip_whitelist_enabled: false,
          allowed_ips: []
        }
        return NextResponse.json(defaultSettings)
      }
      throw error
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching security settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch security settings' },
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

    // Only superadmin can update security settings
    if (profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only superadmin can update security settings' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = securitySettingsSchema.safeParse(body)
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
          password_min_length,
          password_require_uppercase,
          password_require_lowercase,
          password_require_numbers,
          password_require_symbols,
          password_expiry_days,
          password_history_count,
          session_timeout_minutes,
          max_login_attempts,
          lockout_duration_minutes,
          require_captcha_after_attempts,
          require_2fa,
          allow_backup_codes,
          backup_codes_count,
          ip_whitelist_enabled,
          allowed_ips,
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
          password_min_length,
          password_require_uppercase,
          password_require_lowercase,
          password_require_numbers,
          password_require_symbols,
          password_expiry_days,
          password_history_count,
          session_timeout_minutes,
          max_login_attempts,
          lockout_duration_minutes,
          require_captcha_after_attempts,
          require_2fa,
          allow_backup_codes,
          backup_codes_count,
          ip_whitelist_enabled,
          allowed_ips,
          created_at,
          updated_at
        `)
        .single()

      if (error) throw error
      settings = data
      operation = 'created'
    }

    // Log the security settings change
    await supabase.rpc('log_security_event', {
      event_type: `security_settings_${operation}`,
      event_details: {
        changed_fields: Object.keys(updateData),
        organization_id: profile.organization_id,
        changed_by: user.id
      },
      event_severity: 'warning'
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating security settings:', error)
    return NextResponse.json(
      { error: 'Failed to update security settings' },
      { status: 500 }
    )
  }
}