import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const notificationSettingsSchema = z.object({
  email_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  sms_enabled: z.boolean().optional(),
  quiet_hours_enabled: z.boolean().optional(),
  quiet_hours_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  quiet_hours_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  student_updates: z.boolean().optional(),
  teacher_updates: z.boolean().optional(),
  payment_reminders: z.boolean().optional(),
  system_alerts: z.boolean().optional(),
  immediate_alerts: z.boolean().optional(),
  daily_digest: z.boolean().optional(),
  weekly_summary: z.boolean().optional(),
  escalation_enabled: z.boolean().optional(),
  escalation_delay_minutes: z.number().min(5).max(180).optional(),
  max_escalation_levels: z.number().min(1).max(5).optional()
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || user.id

    // Users can only view their own settings unless they're admin
    if (userId !== user.id && !['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const supabase = await createServerClient()

    // Use the helper function to get notification settings with defaults
    const { data: settings, error } = await supabase
      .rpc('get_user_notification_settings', { target_user_id: userId })
      .single()

    if (error) throw error

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
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

    const body = await request.json()
    
    // Validate input
    const validationResult = notificationSettingsSchema.safeParse(body)
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

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('user_notification_settings')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', profile.organization_id)
      .single()

    let settings
    let operation

    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('user_notification_settings')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('organization_id', profile.organization_id)
        .select()
        .single()

      if (error) throw error
      settings = data
      operation = 'updated'
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('user_notification_settings')
        .insert([{
          user_id: user.id,
          organization_id: profile.organization_id,
          ...updateData
        }])
        .select()
        .single()

      if (error) throw error
      settings = data
      operation = 'created'
    }

    // Log the change
    await supabase.rpc('log_security_event', {
      event_type: `notification_settings_${operation}`,
      event_details: {
        changed_fields: Object.keys(updateData),
        user_id: user.id
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    )
  }
}