/**
 * File Upload Size Limits and Restrictions
 * 
 * PRODUCTION CRITICAL: These limits must be enforced both client-side and server-side
 * for security and performance reasons.
 */

// Image file limits
export const IMAGE_SIZE_LIMITS = {
  PROFILE_IMAGE: 5 * 1024 * 1024, // 5MB for profile images
  DOCUMENT_IMAGE: 10 * 1024 * 1024, // 10MB for scanned documents
  GENERAL_IMAGE: 5 * 1024 * 1024, // 5MB default for general images
} as const

// Document file limits  
export const DOCUMENT_SIZE_LIMITS = {
  EXCEL_CSV: 10 * 1024 * 1024, // 10MB for Excel/CSV files
  PDF: 25 * 1024 * 1024, // 25MB for PDF documents
  GENERAL_DOCUMENT: 10 * 1024 * 1024, // 10MB default for documents
} as const

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['.jpg', '.jpeg', '.png', '.webp'],
  DOCUMENTS: ['.pdf', '.doc', '.docx'],
  SPREADSHEETS: ['.xlsx', '.xls', '.csv'],
  ALL_FILES: ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx', '.xlsx', '.xls', '.csv'],
} as const

// MIME types for validation
export const ALLOWED_MIME_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  SPREADSHEETS: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
} as const

// Helper functions
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function validateFileSize(file: File, maxSizeBytes: number): { valid: true } | { valid: false; error: string } {
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxSizeBytes)})`
    }
  }
  return { valid: true }
}

export function validateFileType(file: File, allowedTypes: string[]): { valid: true } | { valid: false; error: string } {
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedTypes.includes(fileExtension)) {
    return {
      valid: false,
      error: `File type "${fileExtension}" is not supported. Allowed types: ${allowedTypes.join(', ')}`
    }
  }
  return { valid: true }
}

/**
 * SECURITY NOTE:
 * These limits are enforced on the client side for user experience,
 * but MUST also be enforced on the server side in API routes for security.
 * 
 * Server-side validation should be implemented in:
 * - /api/upload/* routes
 * - Supabase storage policies
 * - CDN/proxy configurations
 */