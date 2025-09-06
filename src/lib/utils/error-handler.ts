/**
 * Centralized error handling utilities
 * Provides consistent error handling across the application
 */

import { logger } from './logger'
import type { ApiError } from '@/types/common'

/**
 * Custom error classes for different error types
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean
  public readonly details?: Record<string, unknown>

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    this.details = details

    Object.setPrototypeOf(this, AppError.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', true, details)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR', true)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR', true)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with id ${id} not found`
      : `${resource} not found`
    super(message, 404, 'NOT_FOUND', true)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT', true)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 500, 'DATABASE_ERROR', false, details)
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(`${service}: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR', false)
  }
}

/**
 * Error handler for API routes
 */
export function handleApiError(error: unknown): ApiError {
  // Handle known AppError instances
  if (error instanceof AppError) {
    // Log error details
    if (!error.isOperational) {
      logger.error('Non-operational error occurred', error)
    }

    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    }
  }

  // Handle Supabase errors
  if (isSupabaseError(error)) {
    return handleSupabaseError(error)
  }

  // Handle Zod validation errors
  if (isZodError(error)) {
    return handleZodError(error)
  }

  // Handle standard errors
  if (error instanceof Error) {
    logger.error('Unexpected error occurred', error)
    return {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred'
        : error.message,
      statusCode: 500,
    }
  }

  // Handle unknown errors
  logger.error('Unknown error occurred', error as Error)
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    statusCode: 500,
  }
}

/**
 * Check if error is from Supabase
 */
function isSupabaseError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string' &&
    (error as Record<string, unknown>).code.startsWith('PGRST')
  )
}

/**
 * Handle Supabase specific errors
 */
function handleSupabaseError(error: unknown): ApiError {
  const supabaseError = error as Record<string, unknown>
  const code = supabaseError.code as string
  const message = supabaseError.message as string || 'Database operation failed'

  // Map common Supabase error codes
  switch (code) {
    case 'PGRST301':
      return {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
        statusCode: 401,
      }
    case 'PGRST204':
      return {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        statusCode: 404,
      }
    case 'PGRST116':
      return {
        code: 'CONFLICT',
        message: 'Resource already exists',
        statusCode: 409,
      }
    default:
      return {
        code: 'DATABASE_ERROR',
        message: process.env.NODE_ENV === 'production' 
          ? 'Database operation failed'
          : message,
        statusCode: 500,
      }
  }
}

/**
 * Check if error is from Zod validation
 */
function isZodError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'issues' in error &&
    Array.isArray((error as Record<string, unknown>).issues)
  )
}

/**
 * Handle Zod validation errors
 */
function handleZodError(error: unknown): ApiError {
  const zodError = error as { issues: Array<{ path: string[]; message: string }> }
  const details: Record<string, string> = {}

  zodError.issues.forEach((issue) => {
    const field = issue.path.join('.')
    details[field] = issue.message
  })

  return {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    statusCode: 400,
    details,
  }
}

/**
 * Global error boundary handler for React components
 */
export function handleComponentError(error: Error, errorInfo: React.ErrorInfo): void {
  logger.error('Component error occurred', error, {
    componentStack: errorInfo.componentStack,
  })

  // Send to error tracking service in production
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
  }
}

/**
 * Async error wrapper for API routes
 */
export function asyncHandler<T>(
  fn: (req: Request) => Promise<T>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      const result = await fn(req)
      return Response.json({ success: true, data: result })
    } catch (error) {
      const apiError = handleApiError(error)
      return Response.json(
        { success: false, error: apiError },
        { status: apiError.statusCode || 500 }
      )
    }
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(error: ApiError): Response {
  return Response.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    },
    { status: error.statusCode || 500 }
  )
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): Response {
  return Response.json(
    {
      success: true,
      data,
      message,
    },
    { status: statusCode }
  )
}

/**
 * Retry failed operations with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on client errors
      if (error instanceof AppError && error.statusCode < 500) {
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      
      logger.warn(`Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Operation failed after retries')
}

/**
 * Error recovery strategies
 */
export const ErrorRecovery = {
  /**
   * Fallback to cached data
   */
  useCachedData: <T>(error: Error, cachedData?: T): T | null => {
    logger.warn('Using cached data due to error', error)
    return cachedData || null
  },

  /**
   * Fallback to default value
   */
  useDefaultValue: <T>(error: Error, defaultValue: T): T => {
    logger.warn('Using default value due to error', error)
    return defaultValue
  },

  /**
   * Queue operation for retry
   */
  queueForRetry: (operation: () => Promise<unknown>, error: Error): void => {
    logger.warn('Queueing operation for retry', error)
    // Implement queue logic here
  },
}

/**
 * Format error for user display
 */
export function formatErrorForUser(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error instanceof Error) {
    return process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again.'
      : error.message
  }

  return 'An unexpected error occurred. Please try again.'
}