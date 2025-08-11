import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getCurrentProfile } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { generateAvatarPath, validateImageFile } from '@/lib/utils/image-upload'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  return requireAuth(request, async () => {
    try {
      const profile = await getCurrentProfile()

      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Profile not found' },
          { status: 404 }
        )
      }

      const formData = await request.formData()
      const file = formData.get('avatar') as File

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        )
      }

      // Validate file
      const validation = validateImageFile(file, {
        maxSizeBytes: MAX_FILE_SIZE,
        allowedTypes: ALLOWED_TYPES
      })

      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        )
      }

      const supabase = await createServerClient()

      // Generate upload path
      const avatarPath = generateAvatarPath(profile.id, file.name)

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(avatarPath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        return NextResponse.json(
          { success: false, error: 'Failed to upload image' },
          { status: 500 }
        )
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path)

      const avatarUrl = urlData.publicUrl

      // Update profile with new avatar URL
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
          updated_by: profile.id,
        })
        .eq('id', profile.id)
        .eq('organization_id', profile.organization_id)
        .select()
        .single()

      if (updateError) {
        console.error('Profile update error:', updateError)
        // Try to clean up uploaded file
        await supabase.storage.from('avatars').remove([uploadData.path])
        
        return NextResponse.json(
          { success: false, error: 'Failed to update profile' },
          { status: 500 }
        )
      }

      // Log the avatar update
      try {
        await supabase.from('activity_logs').insert({
          organization_id: profile.organization_id,
          user_id: profile.id,
          user_email: profile.email,
          user_name: profile.full_name,
          user_role: profile.role,
          action: 'UPDATE_AVATAR',
          resource_type: 'profiles',
          resource_id: profile.id,
          resource_name: profile.full_name,
          description: 'Updated profile avatar',
          success: true,
        })
      } catch (logError) {
        // Log the error but don't fail the request
        console.error('Failed to log avatar update:', logError)
      }

      return NextResponse.json({
        success: true,
        data: {
          avatar_url: avatarUrl,
          path: uploadData.path
        },
        message: 'Avatar updated successfully'
      })

    } catch (error) {
      console.error('Error uploading avatar:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(request: NextRequest) {
  return requireAuth(request, async () => {
    try {
      const profile = await getCurrentProfile()

      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Profile not found' },
          { status: 404 }
        )
      }

      if (!profile.avatar_url) {
        return NextResponse.json(
          { success: false, error: 'No avatar to delete' },
          { status: 400 }
        )
      }

      const supabase = await createServerClient()

      // Extract path from URL
      const url = new URL(profile.avatar_url)
      const pathSegments = url.pathname.split('/storage/v1/object/public/avatars/')
      if (pathSegments.length < 2) {
        return NextResponse.json(
          { success: false, error: 'Invalid avatar URL' },
          { status: 400 }
        )
      }
      
      const filePath = pathSegments[1]

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath])

      if (deleteError) {
        console.error('Storage delete error:', deleteError)
      }

      // Update profile to remove avatar URL
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
          updated_by: profile.id,
        })
        .eq('id', profile.id)
        .eq('organization_id', profile.organization_id)
        .select()
        .single()

      if (updateError) {
        console.error('Profile update error:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update profile' },
          { status: 500 }
        )
      }

      // Log the avatar removal
      try {
        await supabase.from('activity_logs').insert({
          organization_id: profile.organization_id,
          user_id: profile.id,
          user_email: profile.email,
          user_name: profile.full_name,
          user_role: profile.role,
          action: 'DELETE_AVATAR',
          resource_type: 'profiles',
          resource_id: profile.id,
          resource_name: profile.full_name,
          description: 'Removed profile avatar',
          success: true,
        })
      } catch (logError) {
        console.error('Failed to log avatar removal:', logError)
      }

      return NextResponse.json({
        success: true,
        message: 'Avatar removed successfully'
      })

    } catch (error) {
      console.error('Error removing avatar:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}