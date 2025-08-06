import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { withSuperAdminAuth } from '@/lib/middleware/auth'

const inviteSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1),
  role: z.enum(['admin', 'superadmin']),
  organization_id: z.string().uuid(),
  redirect_to: z.string().url().optional()
})

export async function POST(request: NextRequest) {
  return withSuperAdminAuth(request, async (req) => {
    try {
      const body = await req.json()
      const { email, full_name, role, organization_id, redirect_to } = inviteSchema.parse(body)

      const supabase = createClient()

      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .eq('deleted_at', null)
        .single()

      if (existingProfile) {
        return NextResponse.json(
          { 
            error: 'User with this email already exists',
            success: false 
          },
          { status: 400 }
        )
      }

      // Invite user via Supabase Auth
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo: redirect_to || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
          data: {
            full_name,
            role,
            organization_id
          }
        }
      )

      if (inviteError) {
        return NextResponse.json(
          { 
            error: inviteError.message,
            success: false 
          },
          { status: 400 }
        )
      }

      // Create profile record
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: inviteData.user.id,
          email,
          full_name,
          role,
          organization_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Clean up the auth user if profile creation fails
        await supabase.auth.admin.deleteUser(inviteData.user.id)
        
        return NextResponse.json(
          { 
            error: 'Failed to create user profile',
            success: false 
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        data: {
          user: inviteData.user,
          profile
        },
        success: true,
        message: 'User invited successfully'
      }, { status: 201 })

    } catch (error: any) {
      console.error('Invite user error:', error)
      
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { 
            error: 'Invalid input data',
            details: error.errors,
            success: false 
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { 
          error: 'Internal server error',
          success: false 
        },
        { status: 500 }
      )
    }
  })
}