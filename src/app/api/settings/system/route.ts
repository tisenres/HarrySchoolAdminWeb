import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }
    
    // Return mock settings for now (replace with real DB query when ready)
    const settings = {
      organization_name: 'Harry School',
      organization_logo: '/logo.svg',
      organization_email: 'info@harryschool.uz',
      organization_phone: '+998 90 123 45 67',
      organization_address: 'Tashkent, Uzbekistan',
      currency: 'UZS',
      timezone: 'Asia/Tashkent',
      language: 'en',
      theme: 'light',
      allow_student_registration: false,
      allow_teacher_registration: false,
      maintenance_mode: false,
      sms_notifications: true,
      email_notifications: true,
      push_notifications: false,
      max_file_upload_size: 10485760, // 10MB
      allowed_file_types: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'png'],
      session_timeout: 3600, // 1 hour
      password_min_length: 8,
      password_require_uppercase: true,
      password_require_lowercase: true,
      password_require_numbers: true,
      password_require_special: false,
      enable_2fa: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    return NextResponse.json({
      data: settings,
      success: true
    })
  } catch (error: any) {
    console.error('System settings GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings', success: false },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    // For now, just return the updated settings (replace with real DB update when ready)
    const settings = {
      ...body,
      updated_at: new Date().toISOString()
    }
    
    return NextResponse.json({
      data: settings,
      success: true
    })
  } catch (error: any) {
    console.error('System settings PUT error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update settings', success: false },
      { status: 500 }
    )
  }
}