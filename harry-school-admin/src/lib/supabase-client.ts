import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.error('Missing Supabase environment variables:', {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey
    })
  }
  throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
}

// Client-side Supabase instance with error handling
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

try {
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
} catch (error) {
  console.error('Failed to create Supabase client:', error)
  supabaseClient = null
}

export const supabase = supabaseClient

// Safe client getter with fallback
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized. Check environment variables.')
  }
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