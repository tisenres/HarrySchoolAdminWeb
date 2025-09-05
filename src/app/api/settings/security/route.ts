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
    
    // Get security settings from key-value pairs
    const { data: settingsData, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('organization_id', profile.organization_id)
      .eq('category', 'security')

    // Define default security settings
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

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Merge database values with defaults
    let settings = { ...defaultSettings }

    if (settingsData && settingsData.length > 0) {
      settingsData.forEach(setting => {
        if (setting.key in defaultSettings) {
          settings[setting.key as keyof typeof defaultSettings] = setting.value
        }
      })
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

    // Update or create security settings as key-value pairs
    const settingsToSave = []
    const currentTime = new Date().toISOString()

    for (const [key, value] of Object.entries(updateData)) {
      settingsToSave.push({
        organization_id: profile.organization_id,
        category: 'security',
        key,
        value,
        description: getSecuritySettingDescription(key),
        data_type: typeof value,
        is_encrypted: false,
        is_public: false,
        created_by: user.id,
        updated_by: user.id,
        created_at: currentTime,
        updated_at: currentTime
      })
    }

    // Use upsert to handle both create and update
    const { error: upsertError } = await supabase
      .from('system_settings')
      .upsert(settingsToSave, {
        onConflict: 'organization_id,key',
        ignoreDuplicates: false
      })

    if (upsertError) throw upsertError

    // Get the updated settings to return
    const { data: updatedSettingsData } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('organization_id', profile.organization_id)
      .eq('category', 'security')

    // Convert back to flat object
    let settings = {}
    if (updatedSettingsData) {
      updatedSettingsData.forEach(setting => {
        settings[setting.key] = setting.value
      })
    }

    // Log the security settings change
    await supabase.rpc('log_security_event', {
      event_type: 'security_settings_updated',
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

function getSecuritySettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    password_min_length: 'Minimum password length requirement',
    password_require_uppercase: 'Require uppercase letters in passwords',
    password_require_lowercase: 'Require lowercase letters in passwords',
    password_require_numbers: 'Require numbers in passwords',
    password_require_symbols: 'Require special symbols in passwords',
    password_expiry_days: 'Password expiration period in days',
    password_history_count: 'Number of previous passwords to remember',
    session_timeout_minutes: 'Session timeout in minutes',
    max_login_attempts: 'Maximum allowed login attempts',
    lockout_duration_minutes: 'Account lockout duration in minutes',
    require_captcha_after_attempts: 'Require CAPTCHA after failed attempts',
    require_2fa: 'Require two-factor authentication',
    allow_backup_codes: 'Allow backup codes for 2FA',
    backup_codes_count: 'Number of backup codes to generate',
    ip_whitelist_enabled: 'Enable IP address whitelist',
    allowed_ips: 'List of allowed IP addresses'
  }
  return descriptions[key] || `Security setting: ${key}`
}