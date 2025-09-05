import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Validate environment variables early
const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = 'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required'
  
  if (typeof window !== 'undefined') {
    console.error(errorMessage, {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey
    })
  }
  
  throw new Error(errorMessage)
}

// Create Supabase client with optimized configuration
const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      }).catch(error => {
        console.error('Supabase fetch error:', error)
        throw error
      })
    },
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Export the client directly - no more null checks needed
export const supabase = supabaseClient

// Simplified client getter that always returns a valid client
export const getSupabaseClient = () => {
  return supabaseClient
}

// Types for common response patterns
export type SupabaseResponse<T> = {
  data: T | null
  error: { message: string } | null
}

export type SupabasePaginatedResponse<T> = {
  data: T[]
  error: { message: string } | null
  count: number | null
}