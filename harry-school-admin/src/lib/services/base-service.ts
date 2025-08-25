import type { Database } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'
import { authCache } from '@/lib/utils/auth-cache'
import { withTimeout, CircuitBreaker } from '@/lib/middleware/performance'
// Import optimized functions conditionally
let createOptimizedServerClient: any = null
let releaseSupabaseClient: any = null

try {
  const supabaseServer = require('@/lib/supabase-server')
  createOptimizedServerClient = supabaseServer.createOptimizedServerClient
  releaseSupabaseClient = supabaseServer.releaseSupabaseClient
} catch (error) {
  console.warn('Optimized Supabase clients not available, using fallback')
}

export abstract class BaseService {
  protected tableName: keyof Database['public']['Tables']
  protected supabaseClient: SupabaseClient<Database> | null = null
  private supabaseClientProvider: () => Promise<SupabaseClient<Database>> | null = null
  private circuitBreaker: CircuitBreaker
  private timeoutMs = 30000 // 30 seconds default timeout

  constructor(
    tableName: keyof Database['public']['Tables'], 
    supabaseClientProvider?: () => Promise<SupabaseClient<Database>>,
    timeoutMs: number = 30000
  ) {
    this.tableName = tableName
    this.supabaseClientProvider = supabaseClientProvider || null
    this.timeoutMs = timeoutMs
    this.circuitBreaker = new CircuitBreaker(5, 60000) // 5 failures, 1 minute reset
  }

  /**
   * Get Supabase client with proper authentication context and connection pooling
   */
  protected async getSupabase(): Promise<SupabaseClient<Database>> {
    if (!this.supabaseClient) {
      if (this.supabaseClientProvider) {
        this.supabaseClient = await this.supabaseClientProvider()
      } else {
        if (createOptimizedServerClient) {
          try {
            // Use optimized server client with connection pooling
            this.supabaseClient = await createOptimizedServerClient()
          } catch (error) {
            console.warn('Failed to create optimized client, falling back to standard client')
            // Fallback to client-side for browser environments
            const { getSupabaseClient } = await import('@/lib/supabase-client')
            this.supabaseClient = getSupabaseClient()
          }
        } else {
          // Use standard client if optimized version not available
          const { getSupabaseClient } = await import('@/lib/supabase-client')
          this.supabaseClient = getSupabaseClient()
        }
      }
    }
    return this.supabaseClient
  }

  /**
   * Release Supabase client back to the pool
   */
  protected releaseSupabase() {
    if (this.supabaseClient && releaseSupabaseClient) {
      try {
        releaseSupabaseClient(this.supabaseClient)
      } catch (error) {
        console.warn('Failed to release Supabase client:', error)
      }
      this.supabaseClient = null
    }
  }

  /**
   * Get the current authenticated user with enhanced caching
   */
  protected async getCurrentUser() {
    const supabase = await this.getSupabase()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      throw new Error('User not authenticated')
    }
    
    // Check if we have cached user data first
    const cachedUser = authCache.getUser(user.id)
    if (cachedUser && cachedUser.id === user.id) {
      return cachedUser
    }
    
    // Cache the fresh user data
    authCache.setUser(user.id, user)
    
    return user
  }

  /**
   * Get the current user's organization ID with enhanced caching
   */
  protected async getCurrentOrganization() {
    const user = await this.getCurrentUser()
    
    // Check organization cache first
    const cachedOrg = authCache.getOrganization(user.id)
    if (cachedOrg) {
      return cachedOrg
    }
    
    // If not cached, try to get from profile cache
    const cachedProfile = authCache.getProfile(user.id)
    if (cachedProfile?.organization_id) {
      authCache.setOrganization(user.id, cachedProfile.organization_id)
      return cachedProfile.organization_id
    }
    
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .is('deleted_at', null)
      .single()
    
    if (error || !data) {
      throw new Error('User profile not found or user not associated with an organization')
    }
    
    // Cache both organization and profile data
    authCache.setOrganization(user.id, data.organization_id)
    authCache.setProfile(user.id, data)
    
    return data.organization_id
  }

  /**
   * Get user context (user, organization, role) in one optimized call
   */
  protected async getUserContext() {
    const user = await this.getCurrentUser()
    
    // Check if we have all cached data
    const cachedOrg = authCache.getOrganization(user.id)
    const cachedProfile = authCache.getProfile(user.id)
    
    if (cachedOrg && cachedProfile?.role) {
      return {
        user,
        organizationId: cachedOrg,
        role: cachedProfile.role,
        profile: cachedProfile
      }
    }
    
    // Fetch missing data in single query
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .is('deleted_at', null)
      .single()
    
    if (error || !data) {
      throw new Error('User profile not found or user not associated with an organization')
    }
    
    // Cache everything
    authCache.setOrganization(user.id, data.organization_id)
    authCache.setProfile(user.id, data)
    
    return {
      user,
      organizationId: data.organization_id,
      role: data.role,
      profile: data
    }
  }

  /**
   * Get the current user's role with caching
   */
  protected async getCurrentUserRole() {
    const user = await this.getCurrentUser()
    
    // Check cache first
    const cachedProfile = authCache.getProfile(user.id)
    if (cachedProfile?.role) {
      return cachedProfile.role
    }
    
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .is('deleted_at', null)
      .single()
    
    if (error || !data) {
      throw new Error('User profile not found')
    }
    
    // Cache the full profile data for future use
    authCache.setProfile(user.id, data)
    authCache.setOrganization(user.id, data.organization_id)
    
    return data.role
  }

  /**
   * Check if the current user has permission to perform an action
   */
  protected async checkPermission(requiredRoles: Database['public']['Enums']['user_role'][]) {
    const role = await this.getCurrentUserRole()
    
    if (!requiredRoles.includes(role)) {
      throw new Error('Insufficient permissions')
    }
    
    return true
  }

  /**
   * Soft delete a record with timeout protection
   */
  protected async softDelete(id: string) {
    const user = await this.getCurrentUser()
    const supabase = await this.getSupabase()
    
    return await this.executeQuery(async () => {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        } as any)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to delete ${this.tableName}: ${error.message}`)
      }
      
      return data
    })
  }

  /**
   * Restore a soft-deleted record with timeout protection
   */
  protected async restore(id: string) {
    await this.checkPermission(['admin', 'superadmin'])
    const supabase = await this.getSupabase()
    
    return await this.executeQuery(async () => {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          deleted_at: null,
          deleted_by: null,
        } as any)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to restore ${this.tableName}: ${error.message}`)
      }
      
      return data
    })
  }

  /**
   * Log activity for audit trail with timeout protection
   */
  protected async logActivity(
    action: string,
    resourceId: string,
    resourceName: string,
    oldValues?: any,
    newValues?: any,
    description?: string
  ) {
    try {
      const user = await this.getCurrentUser()
      const organizationId = await this.getCurrentOrganization()
      const role = await this.getCurrentUserRole()
      const supabase = await this.getSupabase()

      // Use shorter timeout for logging to avoid blocking main operations
      await withTimeout(
        supabase.from('activity_logs').insert({
          organization_id: organizationId,
          user_id: user.id,
          user_email: user.email || null,
          user_name: user.user_metadata?.['full_name'] || user.email || null,
          user_role: role,
          action,
          resource_type: this.tableName,
          resource_id: resourceId,
          resource_name: resourceName,
          old_values: oldValues || null,
          new_values: newValues || null,
          description: description || null,
          success: true,
        }),
        5000, // 5 second timeout for logging
        'Activity logging timed out'
      )
    } catch (error) {
      // Log activity logging error but don't fail the main operation
      console.error('Failed to log activity:', error)
    }
  }

  /**
   * Execute database query with timeout protection and circuit breaker
   */
  protected async executeQuery<T>(queryFn: () => Promise<T>): Promise<T> {
    return await this.circuitBreaker.execute(async () => {
      return await withTimeout(
        queryFn(),
        this.timeoutMs,
        `Database query timed out after ${this.timeoutMs}ms`
      )
    })
  }

  /**
   * Execute multiple queries in parallel with timeout protection
   */
  protected async executeParallelQueries<T>(
    queryFns: (() => Promise<T>)[]
  ): Promise<T[]> {
    const promises = queryFns.map(queryFn => 
      this.executeQuery(queryFn).catch(error => {
        console.warn('Parallel query failed:', error.message)
        return null // Return null for failed queries
      })
    )
    
    const results = await Promise.allSettled(promises)
    
    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value
      }
      console.warn('Query failed:', result.reason)
      return null
    }).filter(result => result !== null) as T[]
  }

  /**
   * Apply common filters (organization, soft delete)
   */
  protected applyBaseFilters(query: any) {
    return query.is('deleted_at', null)
  }

  /**
   * Apply pagination to query
   */
  protected applyPagination(query: any, page: number = 1, limit: number = 20) {
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    return query.range(from, to)
  }

  /**
   * Apply sorting to query
   */
  protected applySorting(query: any, sortBy: string = 'created_at', sortOrder: 'asc' | 'desc' = 'desc') {
    return query.order(sortBy, { ascending: sortOrder === 'asc' })
  }

  /**
   * Optimized count query with timeout protection
   */
  protected async getCount(tableName?: string, filters?: any): Promise<number> {
    const table = tableName || this.tableName
    const supabase = await this.getSupabase()
    
    let query = supabase
      .from(table as string)
      .select('id', { count: 'exact', head: true })
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })
    }
    
    const result = await this.executeQuery(async () => {
      const { count, error } = await query
      if (error) throw error
      return count || 0
    })
    
    return result
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.releaseSupabase()
  }
}