import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Import cookies conditionally to avoid Next.js build issues
let cookies: any = null
try {
  if (typeof window === 'undefined') {
    cookies = require('next/headers').cookies
  }
} catch (error) {
  console.warn('next/headers not available, using fallback')
}

// Simple server client creation
export async function createClient() {
  if (typeof window !== 'undefined') {
    // Browser environment - use regular client
    return createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          fetch: (url, options = {}) => {
            return fetch(url, {
              ...options,
              signal: AbortSignal.timeout(30000), // 30 second timeout
            })
          },
        },
      }
    )
  }
  
  if (cookies) {
    const cookieStore = await cookies()
    
    return createSupabaseServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          }
        }
      }
    )
  }
  
  // Fallback to regular client
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(30000), // 30 second timeout
          })
        },
      },
    }
  )
}

// Admin client creation
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(30000), // 30 second timeout
          })
        },
      },
    }
  )
}

// Alias for backward compatibility
export const createServerClient = createClient

// Export optimized versions from connection pool as additional options
export {
  createOptimizedServerClient,
  createOptimizedAdminClient,
  releaseSupabaseClient,
  getConnectionPoolStats,
  connectionPool
} from './supabase/connection-pool'