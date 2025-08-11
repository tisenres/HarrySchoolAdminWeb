import type { Database } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

export abstract class BaseService {
  protected tableName: keyof Database['public']['Tables']
  protected supabaseClient: SupabaseClient<Database> | null = null
  private supabaseClientProvider: () => Promise<SupabaseClient<Database>> | null = null

  constructor(
    tableName: keyof Database['public']['Tables'], 
    supabaseClientProvider?: () => Promise<SupabaseClient<Database>>
  ) {
    this.tableName = tableName
    this.supabaseClientProvider = supabaseClientProvider || null
  }

  /**
   * Get Supabase client with proper authentication context
   */
  protected async getSupabase(): Promise<SupabaseClient<Database>> {
    if (!this.supabaseClient) {
      if (this.supabaseClientProvider) {
        this.supabaseClient = await this.supabaseClientProvider()
      } else {
        // For client-side usage only - don't import server modules
        const { getSupabaseClient } = await import('@/lib/supabase-client')
        this.supabaseClient = getSupabaseClient()
      }
    }
    return this.supabaseClient
  }

  /**
   * Get the current authenticated user
   */
  protected async getCurrentUser() {
    const supabase = await this.getSupabase()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      throw new Error('User not authenticated')
    }
    
    return user
  }

  /**
   * Get the current user's organization ID
   */
  protected async getCurrentOrganization() {
    const user = await this.getCurrentUser()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .is('deleted_at', null)
      .single()
    
    if (error || !data) {
      throw new Error('User profile not found or user not associated with an organization')
    }
    
    return data.organization_id
  }

  /**
   * Get the current user's role
   */
  protected async getCurrentUserRole() {
    const user = await this.getCurrentUser()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .is('deleted_at', null)
      .single()
    
    if (error || !data) {
      throw new Error('User profile not found')
    }
    
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
   * Soft delete a record
   */
  protected async softDelete(id: string) {
    const user = await this.getCurrentUser()
    const supabase = await this.getSupabase()
    
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
  }

  /**
   * Restore a soft-deleted record
   */
  protected async restore(id: string) {
    await this.checkPermission(['admin', 'superadmin'])
    const supabase = await this.getSupabase()
    
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
  }

  /**
   * Log activity for audit trail
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

      await supabase.from('activity_logs').insert({
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
      })
    } catch (error) {
      // Log activity logging error but don't fail the main operation
      console.error('Failed to log activity:', error)
    }
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
}