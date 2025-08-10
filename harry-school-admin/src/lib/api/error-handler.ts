import { NextResponse } from 'next/server'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
  details?: any
}

export class ValidationError extends Error implements ApiError {
  statusCode = 400
  code = 'VALIDATION_ERROR'
  details: any

  constructor(message: string, details?: any) {
    super(message)
    this.name = 'ValidationError'
    this.details = details
  }
}

export class AuthenticationError extends Error implements ApiError {
  statusCode = 401
  code = 'AUTHENTICATION_ERROR'

  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error implements ApiError {
  statusCode = 403
  code = 'AUTHORIZATION_ERROR'

  constructor(message: string = 'Insufficient permissions') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends Error implements ApiError {
  statusCode = 404
  code = 'NOT_FOUND'

  constructor(message: string = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends Error implements ApiError {
  statusCode = 409
  code = 'CONFLICT_ERROR'

  constructor(message: string = 'Resource conflict') {
    super(message)
    this.name = 'ConflictError'
  }
}

export class DatabaseError extends Error implements ApiError {
  statusCode = 500
  code = 'DATABASE_ERROR'
  details: any

  constructor(message: string, details?: any) {
    super(message)
    this.name = 'DatabaseError'
    this.details = details
  }
}

export class ExternalServiceError extends Error implements ApiError {
  statusCode = 502
  code = 'EXTERNAL_SERVICE_ERROR'
  service: string

  constructor(message: string, service: string) {
    super(message)
    this.name = 'ExternalServiceError'
    this.service = service
  }
}

export class RateLimitError extends Error implements ApiError {
  statusCode = 429
  code = 'RATE_LIMIT_ERROR'
  retryAfter?: number

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

// Supabase error mapping
export function mapSupabaseError(error: any): ApiError {
  // Handle different Supabase error codes
  switch (error.code) {
    case 'PGRST116':
      return new NotFoundError('Resource not found')
    
    case 'PGRST301':
      return new ValidationError('Invalid request parameters', error.details)
    
    case '23505':
      return new ConflictError('Resource already exists')
    
    case '23503':
      return new ValidationError('Foreign key constraint violation', error.details)
    
    case '42501':
      return new AuthorizationError('Insufficient database permissions')
    
    case '28P01':
      return new AuthenticationError('Invalid database credentials')
    
    case '08006':
      return new DatabaseError('Database connection failed', error)
    
    case '57014':
      return new DatabaseError('Query timeout', error)
    
    default:
      if (error.message?.includes('JWT')) {
        return new AuthenticationError('Invalid or expired token')
      }
      
      if (error.message?.includes('RLS')) {
        return new AuthorizationError('Row level security policy violation')
      }
      
      return new DatabaseError(`Database error: ${error.message}`, error)
  }
}

// Generic error handler
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  // Handle known API errors
  if (error instanceof ApiError) {
    const response = {
      error: error.message,
      code: error.code,
      ...(error.details && { details: error.details }),
      ...(error instanceof RateLimitError && error.retryAfter && { retryAfter: error.retryAfter }),
      ...(error instanceof ExternalServiceError && { service: error.service })
    }

    return NextResponse.json(response, { 
      status: error.statusCode || 500,
      ...(error instanceof RateLimitError && error.retryAfter && {
        headers: { 'Retry-After': error.retryAfter.toString() }
      })
    })
  }

  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const mappedError = mapSupabaseError(error)
    return handleApiError(mappedError)
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: (error as any).issues
      },
      { status: 400 }
    )
  }

  // Handle generic JavaScript errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }

  // Fallback for unknown errors
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR'
    },
    { status: 500 }
  )
}

// Async error wrapper for API routes
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

// Validation helper
export function validateRequiredFields(data: any, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !data[field])
  
  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`,
      { missingFields }
    )
  }
}

// Permission check helper
export function requireRole(userRole: string, allowedRoles: string[]): void {
  if (!allowedRoles.includes(userRole)) {
    throw new AuthorizationError(
      `This action requires one of the following roles: ${allowedRoles.join(', ')}`
    )
  }
}

// Rate limiting helper (simple in-memory store - use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 60000
): void {
  const now = Date.now()
  const key = identifier
  const current = rateLimitStore.get(key)

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return
  }

  if (current.count >= maxRequests) {
    const retryAfter = Math.ceil((current.resetTime - now) / 1000)
    throw new RateLimitError('Rate limit exceeded', retryAfter)
  }

  current.count++
  rateLimitStore.set(key, current)
}

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute