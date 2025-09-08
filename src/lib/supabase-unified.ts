/**
 * UNIFIED Supabase Client Configuration
 * Решает все проблемы с аутентификацией раз и навсегда!
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Environment variables validation
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  throw new Error('❌ Missing Supabase environment variables!')
}

/**
 * 🔧 ADMIN CLIENT (SERVICE ROLE)
 * Используй для ALL API CRUD операций
 * Обходит RLS, имеет полные права
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/**
 * 🔒 SERVER CLIENT (WITH AUTH)
 * Используй для проверки авторизации
 * Работает с cookies и RLS
 */
export async function createServerClient() {
  // Динамически импортируем cookies только на сервере
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  return createSupabaseServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          try {
            const cookie = cookieStore.get(name)
            return cookie?.value
          } catch (error) {
            console.warn('Failed to get cookie:', name, error)
            return undefined
          }
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Ignore cookie errors in Server Components
            console.warn('Failed to set cookie:', name, error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Ignore cookie errors in Server Components
            console.warn('Failed to remove cookie:', name, error)
          }
        },
      },
    }
  )
}

/**
 * 🌐 CLIENT BROWSER
 * Используй только на клиенте
 */
export function createBrowserClient() {
  return createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
}

/**
 * 🚀 UNIFIED API CLIENT
 * ГЛАВНАЯ функция для всех API routes
 */
export async function createUnifiedClient(requireAuth = false) {
  if (requireAuth) {
    // Проверяем авторизацию через server client
    const authClient = await createServerClient()
    const { data: { user }, error } = await authClient.auth.getUser()
    
    if (error || !user) {
      throw new Error('Unauthorized')
    }
    
    // Возвращаем admin client для операций
    return createAdminClient()
  }
  
  // Для публичных операций используем admin client
  return createAdminClient()
}

/**
 * 👤 GET CURRENT USER (SERVER)
 */
export async function getCurrentUser() {
  try {
    const client = await createServerClient()
    const { data: { user }, error } = await client.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user
  } catch (error) {
    console.warn('Auth check failed:', error)
    return null
  }
}

/**
 * 👑 GET CURRENT PROFILE (SERVER)
 */
export async function getCurrentProfile() {
  try {
    const user = await getCurrentUser()
    if (!user) return null
    
    const client = createAdminClient()
    const { data, error } = await client
      .from('profiles')
      .select(`
        *,
        organizations (
          id,
          name,
          slug,
          settings
        )
      `)
      .eq('id', user.id)
      .is('deleted_at', null)
      .single()
    
    if (error) {
      console.warn('Profile fetch failed:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.warn('Profile check failed:', error)
    return null
  }
}

/**
 * 🏢 GET ORGANIZATION ID
 */
export async function getCurrentOrganizationId(): Promise<string | null> {
  try {
    const profile = await getCurrentProfile()
    return profile?.organization_id || null
  } catch (error) {
    console.warn('Organization ID check failed:', error)
    return null
  }
}

/**
 * ✅ MIDDLEWARE WRAPPER
 * Обёртка для API routes с проверкой авторизации
 */
export function withAuth<T extends any[]>(
  handler: (...args: T) => Promise<Response>
): (...args: T) => Promise<Response> {
  return async (...args: T): Promise<Response> => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return Response.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
      
      return await handler(...args)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return Response.json(
        { success: false, error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * 🎯 SIMPLIFIED API HELPER
 * Одна функция для всех нужд API
 */
export async function getApiClient() {
  // Всегда используем admin client для API operations
  // Проверка авторизации делается отдельно через middleware
  return createAdminClient()
}

// Export default unified interface
export default {
  createAdminClient,
  createServerClient,
  createBrowserClient,
  createUnifiedClient,
  getCurrentUser,
  getCurrentProfile,
  getCurrentOrganizationId,
  withAuth,
  getApiClient
}