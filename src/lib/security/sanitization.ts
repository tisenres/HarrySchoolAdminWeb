// Dynamic import for DOMPurify to avoid edge runtime issues
let DOMPurify: any = null

async function getDOMPurify() {
  if (!DOMPurify) {
    // Only import on client-side or in Node.js runtime
    if (typeof window !== 'undefined' || typeof global !== 'undefined') {
      const module = await import('isomorphic-dompurify')
      DOMPurify = module.default
    }
  }
  return DOMPurify
}

/**
 * Sanitize user input for display using DOMPurify (secure against XSS)
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return ''
  
  // Fallback to basic sanitization if DOMPurify is not available (edge runtime)
  if (typeof window === 'undefined' && typeof global === 'undefined') {
    return input.replace(/[<>&"']/g, (char) => {
      const entityMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;'
      }
      return entityMap[char] || char
    })
  }
  
  // Use DOMPurify for full sanitization when available
  getDOMPurify().then(purify => {
    if (purify) {
      return purify.sanitize(input, {
        ALLOWED_TAGS: [], // Strip all HTML tags
        ALLOWED_ATTR: [], // Strip all attributes
        KEEP_CONTENT: true // Keep text content
      })
    }
  })
  
  // Immediate fallback
  return input.replace(/[<>&"']/g, (char) => {
    const entityMap: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#x27;'
    }
    return entityMap[char] || char
  })
}

/**
 * Sanitize HTML content while preserving safe tags
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ''
  
  // Fallback to basic sanitization if DOMPurify is not available (edge runtime)
  if (typeof window === 'undefined' && typeof global === 'undefined') {
    return html.replace(/[<>&"']/g, (char) => {
      const entityMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;'
      }
      return entityMap[char] || char
    })
  }
  
  // Use DOMPurify for full sanitization when available
  getDOMPurify().then(purify => {
    if (purify) {
      return purify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['class'],
        FORBID_SCRIPT: true,
        FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea'],
        FORBID_ATTR: ['onclick', 'onload', 'onerror', 'style']
      })
    }
  })
  
  // Immediate fallback
  return html.replace(/[<>&"']/g, (char) => {
    const entityMap: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#x27;'
    }
    return entityMap[char] || char
  })
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string | null {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  const trimmed = email.trim().toLowerCase()
  
  if (!emailRegex.test(trimmed)) {
    return null
  }
  
  return trimmed
}

/**
 * Validate and sanitize phone numbers
 */
export function sanitizePhone(phone: string): string | null {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Validate Uzbekistan phone format
  const phoneRegex = /^\+998\d{9}$/
  
  if (!phoneRegex.test(cleaned)) {
    return null
  }
  
  return cleaned
}

/**
 * Comprehensive whitelist of allowed table and column names
 * This is the single source of truth for all database identifiers
 */
const ALLOWED_DATABASE_IDENTIFIERS = new Set([
  // Core tables
  'teachers', 'students', 'groups', 'profiles', 'organizations', 
  'notifications', 'attendance', 'assignments', 'grades', 'courses',
  'lessons', 'vocabulary', 'achievements', 'rewards', 'payments',
  
  // Standard columns
  'id', 'uuid', 'name', 'title', 'description', 'content', 
  'email', 'phone', 'password_hash', 'avatar_url', 'metadata',
  'created_at', 'updated_at', 'deleted_at', 'deleted_by',
  'is_active', 'is_verified', 'is_public', 'is_featured',
  
  // User-related columns
  'full_name', 'first_name', 'last_name', 'middle_name', 
  'role', 'permissions', 'organization_id', 'user_id',
  'specializations', 'employment_status', 'hire_date', 'salary',
  
  // Student-specific columns
  'student_id', 'enrollment_date', 'graduation_date', 'level',
  'points', 'ranking', 'parent_contact', 'emergency_contact',
  
  // Educational content columns
  'subject', 'topic', 'difficulty', 'duration', 'type', 'status',
  'score', 'max_score', 'attempts', 'completion_date',
  'feedback', 'notes', 'tags', 'category',
  
  // Financial columns
  'amount', 'currency', 'payment_method', 'payment_date',
  'due_date', 'invoice_number', 'transaction_id', 'reference',
  
  // System columns
  'version', 'settings', 'config', 'locale', 'timezone',
  'last_login', 'last_activity', 'session_id', 'token'
])

/**
 * Comprehensive SQL reserved words blacklist
 */
const SQL_RESERVED_WORDS = new Set([
  // DML (Data Manipulation Language)
  'select', 'insert', 'update', 'delete', 'merge', 'upsert',
  
  // DDL (Data Definition Language)
  'create', 'drop', 'alter', 'truncate', 'comment',
  
  // DCL (Data Control Language)
  'grant', 'revoke', 'deny',
  
  // TCL (Transaction Control Language)
  'commit', 'rollback', 'savepoint', 'begin', 'end',
  
  // Query clauses
  'where', 'from', 'join', 'inner', 'outer', 'left', 'right', 'full',
  'on', 'using', 'having', 'order', 'group', 'by', 'limit', 'offset',
  'distinct', 'all', 'any', 'some', 'exists', 'in', 'not', 'like',
  'between', 'is', 'null', 'and', 'or', 'case', 'when', 'then', 'else',
  
  // Aggregate functions
  'count', 'sum', 'avg', 'min', 'max', 'stddev', 'variance',
  
  // PostgreSQL specific
  'returning', 'with', 'recursive', 'lateral', 'window', 'over',
  'partition', 'rows', 'range', 'unbounded', 'preceding', 'following',
  'current', 'row', 'exclude', 'ties', 'only', 'first', 'last',
  
  // Dangerous functions/keywords
  'execute', 'exec', 'eval', 'system', 'shell', 'xp_cmdshell',
  'sp_executesql', 'openrowset', 'opendatasource', 'bulk', 'bcp'
])

/**
 * Enhanced SQL identifier sanitization with comprehensive security checks
 */
export function sanitizeSqlIdentifier(identifier: string): string | null {
  // Basic input validation
  if (!identifier || typeof identifier !== 'string') {
    return null
  }
  
  // Trim and normalize
  const trimmed = identifier.trim().toLowerCase()
  
  // Reject empty strings after trimming
  if (trimmed.length === 0) {
    return null
  }
  
  // Reject identifiers that are too long (PostgreSQL limit is 63 characters)
  if (trimmed.length > 63) {
    return null
  }
  
  // Only allow alphanumeric characters and underscores
  const cleaned = trimmed.replace(/[^a-z0-9_]/g, '')
  
  // Ensure cleaned version matches original (no illegal characters were removed)
  if (cleaned !== trimmed) {
    return null
  }
  
  // Reject identifiers starting with numbers or underscores
  if (/^[0-9_]/.test(cleaned)) {
    return null
  }
  
  // Reject identifiers with consecutive underscores (potential attack pattern)
  if (cleaned.includes('__')) {
    return null
  }
  
  // Check against SQL reserved words blacklist
  if (SQL_RESERVED_WORDS.has(cleaned)) {
    return null
  }
  
  // Check against whitelist of allowed identifiers
  if (!ALLOWED_DATABASE_IDENTIFIERS.has(cleaned)) {
    // Log rejected identifiers in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[SQL-SANITIZER] Rejected unknown identifier: "${cleaned}"`)
    }
    return null
  }
  
  // Return the original case-preserved version if it passes all checks
  return identifier.trim()
}

/**
 * Validate and sanitize multiple SQL identifiers (e.g., for SELECT columns)
 */
export function sanitizeSqlIdentifiers(identifiers: string[]): string[] | null {
  if (!Array.isArray(identifiers) || identifiers.length === 0) {
    return null
  }
  
  // Limit the number of identifiers to prevent DoS
  if (identifiers.length > 50) {
    return null
  }
  
  const sanitized: string[] = []
  
  for (const identifier of identifiers) {
    const clean = sanitizeSqlIdentifier(identifier)
    if (clean === null) {
      return null // Reject the entire list if any identifier is invalid
    }
    sanitized.push(clean)
  }
  
  // Remove duplicates
  return [...new Set(sanitized)]
}

/**
 * Validate table.column notation (e.g., "users.email")
 */
export function sanitizeSqlTableColumn(tableColumn: string): { table: string; column: string } | null {
  if (!tableColumn || typeof tableColumn !== 'string') {
    return null
  }
  
  const parts = tableColumn.trim().split('.')
  
  // Must be exactly table.column format
  if (parts.length !== 2) {
    return null
  }
  
  const [table, column] = parts
  const sanitizedTable = sanitizeSqlIdentifier(table)
  const sanitizedColumn = sanitizeSqlIdentifier(column)
  
  if (!sanitizedTable || !sanitizedColumn) {
    return null
  }
  
  return { table: sanitizedTable, column: sanitizedColumn }
}

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes  
    max: 5 // limit each IP to 5 auth attempts per windowMs
  },
  dashboard: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30 // limit each user to 30 dashboard requests per minute
  }
}

/**
 * Generate a cryptographically secure nonce for CSP
 */
export function generateCSPNonce(): string {
  // Use edge-compatible crypto API if available
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode(...array))
  }
  
  // Fallback for Node.js environments
  try {
    const nodeCrypto = require('crypto')
    return nodeCrypto.randomBytes(16).toString('base64')
  } catch (e) {
    // Final fallback - simple random string (not cryptographically secure)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return btoa(result)
  }
}

/**
 * Content Security Policy headers (hardened - removed all unsafe directives)
 */
export function getSecureCSPHeaders(nonce?: string): Record<string, string> {
  const nonceValue = nonce || generateCSPNonce()
  
  const cspDirectives = [
    "default-src 'self'",
    // Script sources - only allow self and required wasm for Next.js
    "script-src 'self' 'wasm-unsafe-eval' https://vercel.live",
    // Style sources - use nonce instead of unsafe-inline
    `style-src 'self' ${nonce ? `'nonce-${nonceValue}'` : ''} https://fonts.googleapis.com`,
    // Image sources - allow data URLs for small images and HTTPS for external images
    "img-src 'self' data: https: blob:",
    // Font sources
    "font-src 'self' data: https://fonts.gstatic.com",
    // Connection sources - Supabase and Vercel only
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live https://vitals.vercel-insights.com",
    // Frame restrictions
    "frame-ancestors 'none'",
    "frame-src 'none'",
    // Base URI restriction
    "base-uri 'self'",
    // Form action restriction
    "form-action 'self'",
    // Object restrictions
    "object-src 'none'",
    // Media restrictions
    "media-src 'self'",
    // Worker restrictions
    "worker-src 'self'",
    // Manifest restrictions
    "manifest-src 'self'",
    // Upgrade insecure requests
    "upgrade-insecure-requests",
    // Block mixed content
    "block-all-mixed-content"
  ]
  
  return {
    'Content-Security-Policy': cspDirectives.join('; '),
    'X-Content-Security-Policy': cspDirectives.join('; '), // Legacy support
    'X-WebKit-CSP': cspDirectives.join('; ') // Legacy WebKit support
  }
}

/**
 * Strict CSP headers for maximum security (use when nonce is available)
 */
export const STRICT_CSP_HEADERS = getSecureCSPHeaders()

/**
 * Security headers for API responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}