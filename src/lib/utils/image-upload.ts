import { getSupabaseClient } from '@/lib/supabase-client'

export type ImageUploadResult = {
  success: true
  url: string
  path: string
} | {
  success: false
  error: string
}

export interface ImageUploadOptions {
  bucket: string
  maxSizeBytes?: number
  allowedTypes?: string[]
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024 // 5MB
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validateImageFile(
  file: File,
  options: Partial<ImageUploadOptions> = {}
): { valid: true } | { valid: false; error: string } {
  const maxSize = options.maxSizeBytes || DEFAULT_MAX_SIZE
  const allowedTypes = options.allowedTypes || DEFAULT_ALLOWED_TYPES

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`
    }
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type must be one of: ${allowedTypes.join(', ')}`
    }
  }

  return { valid: true }
}

export async function uploadImage(
  file: File,
  path: string,
  options: ImageUploadOptions
): Promise<ImageUploadResult> {
  try {
    // Validate file
    const validation = validateImageFile(file, options)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      }
    }

    const supabase = getSupabaseClient()

    // Upload file
    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      return {
        success: false,
        error: `Upload failed: ${error.message}`
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(data.path)

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    }
  }
}

export function generateAvatarPath(userId: string, fileName: string): string {
  const timestamp = Date.now()
  const extension = fileName.split('.').pop()
  return `${userId}/avatar-${timestamp}.${extension}`
}