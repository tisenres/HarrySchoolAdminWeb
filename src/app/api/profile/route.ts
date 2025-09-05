import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getCurrentProfile } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const profileUpdateSchema = z.object({
  full_name: z.string().min(2).max(100),
  phone: z.string().optional(),
  timezone: z.string().optional(),
  language_preference: z.string().optional(),
})

export async function GET() {
  return requireAuth(
    new NextRequest('http://localhost:3000/api/profile'),
    async () => {
      try {
        const profile = await getCurrentProfile()

        if (!profile) {
          return NextResponse.json(
            { success: false, error: 'Profile not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({
          success: true,
          data: profile
        })
      } catch (error) {
        console.error('Error fetching profile:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch profile' },
          { status: 500 }
        )
      }
    }
  )
}

export async function PATCH(request: NextRequest) {
  return requireAuth(request, async () => {
    try {
      const profile = await getCurrentProfile()

      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Profile not found' },
          { status: 404 }
        )
      }

      const body = await request.json()
      const validatedData = profileUpdateSchema.parse(body)

      const supabase = await createServerClient()

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
          updated_by: profile.id,
        })
        .eq('id', profile.id)
        .eq('organization_id', profile.organization_id)
        .select(`
          *,
          organizations (
            id,
            name,
            slug,
            settings
          )
        `)
        .single()

      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to update profile' },
          { status: 500 }
        )
      }

      // Log the profile update
      try {
        await supabase.from('activity_logs').insert({
          organization_id: profile.organization_id,
          user_id: profile.id,
          user_email: profile.email,
          user_name: profile.full_name,
          user_role: profile.role,
          action: 'UPDATE_PROFILE',
          resource_type: 'profiles',
          resource_id: profile.id,
          resource_name: validatedData.full_name,
          description: 'Updated profile information',
          success: true,
          changed_fields: Object.keys(validatedData),
          new_values: validatedData,
        })
      } catch (logError) {
        // Log the error but don't fail the request
        console.error('Failed to log profile update:', logError)
      }

      return NextResponse.json({
        success: true,
        data,
        message: 'Profile updated successfully'
      })

    } catch (error) {
      console.error('Error updating profile:', error)
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid input data',
            details: error.errors
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      )
    }
  })
}