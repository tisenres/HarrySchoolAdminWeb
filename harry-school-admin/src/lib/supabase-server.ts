import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Centralized server client creation with proper error handling
export async function createClient() {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Browser environment - use regular client
  if (typeof window !== 'undefined') {
    return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(30000),
          }).catch(error => {
            console.error('Server client fetch error:', error)
            throw error
          })
        },
      },
    })
  }
  
  // Server environment - try to use server client with cookies
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    
    return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // Cookie setting might fail in some contexts, log but continue
            console.warn('Failed to set cookie:', name, error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete(name)
          } catch (error) {
            console.warn('Failed to remove cookie:', name, error)
          }
        }
      }
    })
  } catch (error) {
    console.warn('Failed to create server client with cookies, using fallback:', error)
    
    // Fallback to regular client for environments where cookies aren't available
    return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(30000),
          }).catch(error => {
            console.error('Fallback client fetch error:', error)
            throw error
          })
        },
      },
    })
  }
}

// Admin client creation with validation
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase admin environment variables')
  }
  
  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          signal: AbortSignal.timeout(30000),
        }).catch(error => {
          console.error('Admin client fetch error:', error)
          throw error
        })
      },
    },
  })
}

// Alias for backward compatibility
export const createServerClient = createClient

// Export optimized versions from connection pool as additional options (if available)
let connectionPoolExports = {}
try {
  connectionPoolExports = require('./supabase/connection-pool')
} catch (error) {
  console.warn('Connection pool not available, using standard clients')
}

export const {
  createOptimizedServerClient = createClient,
  createOptimizedAdminClient = createAdminClient,
  releaseSupabaseClient = () => {},
  getConnectionPoolStats = () => ({ active: 0, idle: 0, total: 0 }),
  connectionPool = null
} = connectionPoolExports