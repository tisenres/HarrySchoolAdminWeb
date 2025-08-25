import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createServerClient as createServerSupabaseClient } from '@supabase/ssr'
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

interface ClientEntry {
  client: SupabaseClient<Database>
  lastUsed: number
  inUse: boolean
}

// Optimized Supabase connection pool
class SupabaseConnectionPool {
  private static instance: SupabaseConnectionPool
  private clients = new Map<string, ClientEntry>()
  private readonly maxConnections = 20
  private readonly connectionTTL = 5 * 60 * 1000 // 5 minutes
  private readonly cleanupInterval = 60 * 1000 // 1 minute
  private cleanupTimer?: NodeJS.Timeout

  private constructor() {
    // Start cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.cleanupInterval)
  }

  static getInstance(): SupabaseConnectionPool {
    if (!SupabaseConnectionPool.instance) {
      SupabaseConnectionPool.instance = new SupabaseConnectionPool()
    }
    return SupabaseConnectionPool.instance
  }

  async getServerClient(userId?: string): Promise<SupabaseClient<Database>> {
    const clientKey = this.generateClientKey('server', userId)
    
    // Try to reuse existing client
    const existing = this.clients.get(clientKey)
    if (existing && !this.isExpired(existing) && !existing.inUse) {
      existing.inUse = true
      existing.lastUsed = Date.now()
      return existing.client
    }

    // Create new client if under limit
    if (this.clients.size < this.maxConnections) {
      const client = await this.createServerClient()
      const entry: ClientEntry = {
        client,
        lastUsed: Date.now(),
        inUse: true
      }
      
      this.clients.set(clientKey, entry)
      return client
    }

    // Remove oldest unused client and create new one
    this.removeOldestClient()
    const client = await this.createServerClient()
    const entry: ClientEntry = {
      client,
      lastUsed: Date.now(),
      inUse: true
    }
    
    this.clients.set(clientKey, entry)
    return client
  }

  async getAdminClient(): Promise<SupabaseClient<Database>> {
    const clientKey = 'admin'
    
    // Admin client can be reused more aggressively
    const existing = this.clients.get(clientKey)
    if (existing && !this.isExpired(existing)) {
      existing.lastUsed = Date.now()
      return existing.client
    }

    const client = this.createAdminClient()
    const entry: ClientEntry = {
      client,
      lastUsed: Date.now(),
      inUse: false // Admin client is always shareable
    }
    
    this.clients.set(clientKey, entry)
    return client
  }

  releaseClient(client: SupabaseClient<Database>) {
    // Find and mark client as not in use
    for (const [key, entry] of this.clients.entries()) {
      if (entry.client === client) {
        entry.inUse = false
        entry.lastUsed = Date.now()
        break
      }
    }
  }

  private async createServerClient(): Promise<SupabaseClient<Database>> {
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
    const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    if (cookies) {
      const cookieStore = await cookies()
      
      return createServerSupabaseClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch (error) {
                // Ignore cookie setting errors in server components
              }
            },
          },
        }
      )
    } else {
      // Fallback to basic client without cookies
      const { createClient } = await import('@supabase/supabase-js')
      return createClient<Database>(supabaseUrl, supabaseAnonKey)
    }
  }

  private createAdminClient(): SupabaseClient<Database> {
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
    const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables for admin client')
    }
    
    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }

  private generateClientKey(type: string, userId?: string): string {
    return `${type}:${userId || 'anonymous'}:${Math.floor(Date.now() / 60000)}` // Group by minute
  }

  private isExpired(entry: ClientEntry): boolean {
    return Date.now() - entry.lastUsed > this.connectionTTL
  }

  private removeOldestClient() {
    let oldestKey = ''
    let oldestTime = Date.now()
    
    for (const [key, entry] of this.clients.entries()) {
      if (!entry.inUse && entry.lastUsed < oldestTime) {
        oldestTime = entry.lastUsed
        oldestKey = key
      }
    }
    
    if (oldestKey) {
      this.clients.delete(oldestKey)
    }
  }

  private cleanup() {
    const now = Date.now()
    const toDelete: string[] = []
    
    for (const [key, entry] of this.clients.entries()) {
      if (!entry.inUse && (now - entry.lastUsed > this.connectionTTL)) {
        toDelete.push(key)
      }
    }
    
    toDelete.forEach(key => this.clients.delete(key))
    
    if (toDelete.length > 0) {
      console.log(`[CONNECTION POOL] Cleaned up ${toDelete.length} expired connections`)
    }
  }

  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
    this.clients.clear()
  }

  // Get pool statistics for monitoring
  getStats() {
    const inUse = Array.from(this.clients.values()).filter(entry => entry.inUse).length
    return {
      total: this.clients.size,
      inUse,
      available: this.clients.size - inUse,
      maxConnections: this.maxConnections
    }
  }
}

// Export optimized client creation functions
export const createOptimizedServerClient = async (userId?: string) => {
  const pool = SupabaseConnectionPool.getInstance()
  return pool.getServerClient(userId)
}

export const createOptimizedAdminClient = async () => {
  const pool = SupabaseConnectionPool.getInstance()
  return pool.getAdminClient()
}

export const releaseSupabaseClient = (client: SupabaseClient<Database>) => {
  const pool = SupabaseConnectionPool.getInstance()
  pool.releaseClient(client)
}

// Get connection pool statistics
export const getConnectionPoolStats = () => {
  const pool = SupabaseConnectionPool.getInstance()
  return pool.getStats()
}

// Simple synchronous client for backward compatibility
export const createServerClient = (userId?: string) => {
  if (typeof window !== 'undefined') {
    // Browser environment - use regular client
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  
  // Server environment - use server client with cookies
  if (cookies) {
    const cookieStore = cookies()
    return createServerSupabaseClient<Database>(
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
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const createAdminClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Export the pool instance for advanced usage
export const connectionPool = SupabaseConnectionPool.getInstance()