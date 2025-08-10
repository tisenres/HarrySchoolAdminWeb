import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const organizationSettingsSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255),
  description: z.string().max(1000).optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  timezone: z.string().max(100).optional(),
  currency: z.string().max(10).optional(),
  default_language: z.enum(['en', 'ru', 'uz']).optional(),
  logo_url: z.string().url('Invalid URL').optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional()
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerClient()
    
    const { data: settings, error } = await supabase
      .from('organization_settings')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .single()

    if (error) {
      // If no settings exist, create default ones
      if (error.code === 'PGRST116') {
        const { data: newSettings, error: createError } = await supabase
          .from('organization_settings')
          .insert([{
            organization_id: profile.organization_id,
            created_by: user.id
          }])
          .select()
          .single()

        if (createError) throw createError
        return NextResponse.json(newSettings)
      }
      throw error
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching organization settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization settings' },
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

    // Only admin and superadmin can update organization settings
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = organizationSettingsSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Update organization settings
    const { data: settings, error } = await supabase
      .from('organization_settings')
      .update({
        ...validationResult.data,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', profile.organization_id)
      .select()
      .single()

    if (error) {
      // If no settings exist, create them
      if (error.code === 'PGRST116') {
        const { data: newSettings, error: createError } = await supabase
          .from('organization_settings')
          .insert([{
            ...validationResult.data,
            organization_id: profile.organization_id,
            created_by: user.id,
            updated_by: user.id
          }])
          .select()
          .single()

        if (createError) throw createError

        // Log the creation
        await supabase.rpc('log_security_event', {
          event_type: 'organization_settings_created',
          event_details: { 
            organization_id: profile.organization_id,
            changed_fields: Object.keys(validationResult.data)
          }
        })

        return NextResponse.json(newSettings)
      }
      throw error
    }

    // Log the update
    await supabase.rpc('log_security_event', {
      event_type: 'organization_settings_updated',
      event_details: { 
        organization_id: profile.organization_id,
        changed_fields: Object.keys(validationResult.data)
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating organization settings:', error)
    return NextResponse.json(
      { error: 'Failed to update organization settings' },
      { status: 500 }
    )
  }
}