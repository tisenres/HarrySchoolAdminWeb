import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'
import { cache } from 'react'

// Cache the cookie store retrieval to avoid multiple async calls
const getCachedCookieStore = cache(async () => {
  return await cookies()
})

export async function createServerClient() {
  // PERFORMANCE FIX: Use cached cookie store to avoid repeated async calls
  const cookieStore = await getCachedCookieStore()

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Create a cached version of the server client for better performance
export const createCachedServerClient = cache(createServerClient)

// Alias for compatibility with existing code
export const createClient = createServerClient