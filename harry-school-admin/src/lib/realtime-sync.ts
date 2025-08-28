/**
 * Real-time Data Synchronization with Redis
 * Manages real-time updates and cache synchronization across the application
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { cacheService, CacheKeys, InvalidationPatterns } from './cache-service'
import { queryCache } from './query-cache'

// Real-time event types
export type RealtimeEventType = 
  | 'INSERT' 
  | 'UPDATE' 
  | 'DELETE'
  | 'BULK_UPDATE'
  | 'BULK_DELETE'
  | 'STATUS_CHANGE'

// Real-time event data
export interface RealtimeEvent {
  type: RealtimeEventType
  table: string
  schema: string
  old_record?: Record<string, any>
  record?: Record<string, any>
  organization_id: string
  user_id: string
  timestamp: number
  metadata?: Record<string, any>
}

// Subscription configuration
interface SubscriptionConfig {
  organizationId: string
  userId: string
  tables: string[]
  onEvent?: (event: RealtimeEvent) => void
  onError?: (error: Error) => void
}

// Cached notification
export interface CachedNotification {
  id: string
  user_id: string
  organization_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
  expires_at?: string
  metadata?: Record<string, any>
}

// Activity log entry
export interface ActivityLogEntry {
  id: string
  organization_id: string
  user_id: string
  action: string
  target_type: string
  target_id: string
  target_name?: string
  description: string
  ip_address?: string
  user_agent?: string
  created_at: string
  metadata?: Record<string, any>
}

/**
 * Real-time synchronization service
 */
class RealtimeSyncService {
  private subscriptions = new Map<string, any>()
  private eventHandlers = new Map<string, Array<(event: RealtimeEvent) => void>>()
  private isInitialized = false

  /**
   * Initialize real-time synchronization
   */
  async initialize(supabase: SupabaseClient): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('🚀 Initializing real-time synchronization...')
      
      // Set up global error handlers
      supabase.realtime.onClose(() => {
        console.log('🔴 Realtime connection closed')
      })

      supabase.realtime.onError((error) => {
        console.error('❌ Realtime error:', error)
      })

      supabase.realtime.onOpen(() => {
        console.log('✅ Realtime connection established')
      })

      this.isInitialized = true
      console.log('✅ Real-time synchronization initialized')
    } catch (error) {
      console.error('❌ Failed to initialize real-time sync:', error)
      throw error
    }
  }

  /**
   * Subscribe to real-time events for specific tables
   */
  async subscribe(
    supabase: SupabaseClient,
    config: SubscriptionConfig
  ): Promise<string> {
    try {
      const subscriptionId = `${config.organizationId}_${config.userId}_${Date.now()}`
      
      // Create channel for organization
      const channel = supabase.channel(`org_${config.organizationId}`)

      // Subscribe to table changes
      for (const table of config.tables) {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `organization_id=eq.${config.organizationId}`
          },
          async (payload) => {
            try {
              const event: RealtimeEvent = {
                type: payload.eventType as RealtimeEventType,
                table: payload.table,
                schema: payload.schema,
                old_record: payload.old,
                record: payload.new,
                organization_id: config.organizationId,
                user_id: config.userId,
                timestamp: Date.now(),
                metadata: {}
              }

              // Handle cache invalidation
              await this.handleCacheInvalidation(event)
              
              // Broadcast to event handlers
              await this.broadcastEvent(event)
              
              // Call custom event handler
              if (config.onEvent) {
                config.onEvent(event)
              }

              console.log(`📡 Real-time event processed:`, {
                type: event.type,
                table: event.table,
                id: event.record?.id || event.old_record?.id
              })
            } catch (error) {
              console.error('Real-time event processing error:', error)
              if (config.onError) {
                config.onError(error as Error)
              }
            }
          }
        )
      }

      // Subscribe to the channel
      channel.subscribe()

      // Store subscription
      this.subscriptions.set(subscriptionId, channel)

      console.log(`✅ Real-time subscription created: ${subscriptionId}`)
      return subscriptionId
    } catch (error) {
      console.error('Real-time subscription error:', error)
      throw error
    }
  }

  /**
   * Unsubscribe from real-time events
   */
  async unsubscribe(subscriptionId: string): Promise<boolean> {
    try {
      const channel = this.subscriptions.get(subscriptionId)
      if (channel) {
        await channel.unsubscribe()
        this.subscriptions.delete(subscriptionId)
        console.log(`✅ Real-time subscription removed: ${subscriptionId}`)
        return true
      }
      return false
    } catch (error) {
      console.error('Real-time unsubscribe error:', error)
      return false
    }
  }

  /**
   * Register event handler for specific event types
   */
  onEvent(eventType: string, handler: (event: RealtimeEvent) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, [])
    }
    this.eventHandlers.get(eventType)!.push(handler)
  }

  /**
   * Remove event handler
   */
  offEvent(eventType: string, handler: (event: RealtimeEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * Broadcast event to registered handlers
   */
  private async broadcastEvent(event: RealtimeEvent): Promise<void> {
    try {
      // Broadcast to general event handlers
      const allHandlers = this.eventHandlers.get('*') || []
      const typeHandlers = this.eventHandlers.get(event.type) || []
      const tableHandlers = this.eventHandlers.get(`${event.table}:${event.type}`) || []

      const allEventHandlers = [...allHandlers, ...typeHandlers, ...tableHandlers]

      for (const handler of allEventHandlers) {
        try {
          handler(event)
        } catch (error) {
          console.error('Event handler error:', error)
        }
      }
    } catch (error) {
      console.error('Event broadcast error:', error)
    }
  }

  /**
   * Handle cache invalidation based on real-time events
   */
  private async handleCacheInvalidation(event: RealtimeEvent): Promise<void> {
    try {
      const { table, type, organization_id, record, old_record } = event

      // Determine entity ID
      const entityId = record?.id || old_record?.id

      switch (table) {
        case 'students':
          await queryCache.invalidateOnDataChange('students', organization_id, this.mapEventType(type), entityId)
          if (type === 'UPDATE' || type === 'DELETE') {
            await this.invalidateRelatedData('students', organization_id, entityId)
          }
          break

        case 'teachers':
          await queryCache.invalidateOnDataChange('teachers', organization_id, this.mapEventType(type), entityId)
          if (type === 'UPDATE' || type === 'DELETE') {
            await this.invalidateRelatedData('teachers', organization_id, entityId)
          }
          break

        case 'groups':
          await queryCache.invalidateOnDataChange('groups', organization_id, this.mapEventType(type), entityId)
          if (type === 'UPDATE' || type === 'DELETE') {
            await this.invalidateRelatedData('groups', organization_id, entityId)
          }
          break

        case 'student_group_enrollments':
        case 'teacher_group_assignments':
          // Invalidate related entity caches
          await this.invalidateRelationshipData(table, organization_id, record, old_record)
          break

        default:
          // Generic invalidation for unknown tables
          await queryCache.invalidateQueries([`${table}:${organization_id}:*`])
      }

      // Always invalidate dashboard stats on any change
      await queryCache.invalidateQueries([`dashboard_*:${organization_id}`])
      
      console.log(`🔄 Cache invalidated for ${table} ${type} event`)
    } catch (error) {
      console.error('Cache invalidation error:', error)
    }
  }

  /**
   * Invalidate related data caches
   */
  private async invalidateRelatedData(
    entity: string,
    organizationId: string,
    entityId: string
  ): Promise<void> {
    try {
      const patterns = []

      switch (entity) {
        case 'students':
          patterns.push(
            `student_enrollments:${organizationId}:${entityId}`,
            `groups:${organizationId}:*` // Groups may show student counts
          )
          break

        case 'teachers':
          patterns.push(
            `teacher_groups:${organizationId}:${entityId}`,
            `groups:${organizationId}:*` // Groups may show teacher assignments
          )
          break

        case 'groups':
          patterns.push(
            `students:${organizationId}:*`, // Students may show group info
            `teachers:${organizationId}:*`, // Teachers may show group assignments
            `groups_available:${organizationId}`
          )
          break
      }

      if (patterns.length > 0) {
        await queryCache.invalidateQueries(patterns)
      }
    } catch (error) {
      console.error('Related data invalidation error:', error)
    }
  }

  /**
   * Invalidate relationship data caches
   */
  private async invalidateRelationshipData(
    table: string,
    organizationId: string,
    record?: Record<string, any>,
    oldRecord?: Record<string, any>
  ): Promise<void> {
    try {
      const patterns = []

      if (table === 'student_group_enrollments') {
        const studentId = record?.student_id || oldRecord?.student_id
        const groupId = record?.group_id || oldRecord?.group_id
        
        if (studentId && groupId) {
          patterns.push(
            `student:${organizationId}:${studentId}`,
            `group:${organizationId}:${groupId}`,
            `students:${organizationId}:*`,
            `groups:${organizationId}:*`,
            `groups_available:${organizationId}`
          )
        }
      } else if (table === 'teacher_group_assignments') {
        const teacherId = record?.teacher_id || oldRecord?.teacher_id
        const groupId = record?.group_id || oldRecord?.group_id
        
        if (teacherId && groupId) {
          patterns.push(
            `teacher:${organizationId}:${teacherId}`,
            `group:${organizationId}:${groupId}`,
            `teachers:${organizationId}:*`,
            `groups:${organizationId}:*`
          )
        }
      }

      if (patterns.length > 0) {
        await queryCache.invalidateQueries(patterns)
      }
    } catch (error) {
      console.error('Relationship data invalidation error:', error)
    }
  }

  /**
   * Cache and sync notifications
   */
  async cacheNotification(notification: CachedNotification): Promise<boolean> {
    try {
      const key = `notification:${notification.user_id}:${notification.id}`
      const ttl = notification.expires_at 
        ? Math.floor((new Date(notification.expires_at).getTime() - Date.now()) / 1000)
        : 24 * 60 * 60 // 24 hours default

      return await cacheService.set(key, notification, ttl)
    } catch (error) {
      console.warn('Notification caching error:', error)
      return false
    }
  }

  /**
   * Get cached notifications for a user
   */
  async getCachedNotifications(userId: string): Promise<CachedNotification[]> {
    try {
      const notificationsKey = CacheKeys.NOTIFICATIONS(userId)
      const cached = await cacheService.get<CachedNotification[]>(notificationsKey)
      return cached || []
    } catch (error) {
      console.warn('Get cached notifications error:', error)
      return []
    }
  }

  /**
   * Cache activity log entry
   */
  async cacheActivityEntry(entry: ActivityLogEntry): Promise<boolean> {
    try {
      const key = `activity:${entry.organization_id}:${entry.id}`
      return await cacheService.set(key, entry, 60 * 60) // 1 hour TTL
    } catch (error) {
      console.warn('Activity caching error:', error)
      return false
    }
  }

  /**
   * Sync data across multiple instances (pub/sub pattern)
   */
  async publishChange(event: RealtimeEvent): Promise<boolean> {
    try {
      const pubKey = `sync:${event.organization_id}`
      return await cacheService.set(pubKey, event, 60) // 1 minute TTL
    } catch (error) {
      console.warn('Publish change error:', error)
      return false
    }
  }

  /**
   * Map Supabase event type to internal event type
   */
  private mapEventType(supabaseEventType: string): 'create' | 'update' | 'delete' {
    switch (supabaseEventType) {
      case 'INSERT':
        return 'create'
      case 'UPDATE':
        return 'update'
      case 'DELETE':
        return 'delete'
      default:
        return 'update'
    }
  }

  /**
   * Get subscription statistics
   */
  getSubscriptionStats(): {
    activeSubscriptions: number
    eventHandlers: number
    isInitialized: boolean
  } {
    return {
      activeSubscriptions: this.subscriptions.size,
      eventHandlers: this.eventHandlers.size,
      isInitialized: this.isInitialized
    }
  }

  /**
   * Health check for real-time sync
   */
  async healthCheck(): Promise<{
    initialized: boolean
    subscriptions: number
    cacheConnected: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    
    try {
      if (!this.isInitialized) {
        errors.push('Real-time sync not initialized')
      }

      const cacheHealth = await cacheService.healthCheck()
      if (!cacheHealth.connected) {
        errors.push('Cache not connected')
      }

      return {
        initialized: this.isInitialized,
        subscriptions: this.subscriptions.size,
        cacheConnected: cacheHealth.connected,
        errors
      }
    } catch (error) {
      errors.push(`Health check failed: ${error}`)
      return {
        initialized: false,
        subscriptions: 0,
        cacheConnected: false,
        errors
      }
    }
  }

  /**
   * Cleanup all subscriptions
   */
  async cleanup(): Promise<void> {
    try {
      for (const [subscriptionId] of this.subscriptions) {
        await this.unsubscribe(subscriptionId)
      }
      
      this.eventHandlers.clear()
      this.isInitialized = false
      
      console.log('✅ Real-time sync cleanup completed')
    } catch (error) {
      console.error('Real-time sync cleanup error:', error)
    }
  }
}

// Export singleton instance
export const realtimeSync = new RealtimeSyncService()

// Export types and interfaces
export type {
  RealtimeEvent,
  SubscriptionConfig,
  CachedNotification,
  ActivityLogEntry
}

export { RealtimeSyncService }