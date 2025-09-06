import { createAdminClient } from '@/lib/supabase-server'
import type { Database } from '@/types/database'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type TableName = keyof Database['public']['Tables']
type ChangeHandler<T = any> = (payload: RealtimePostgresChangesPayload<T>) => void

export class RealtimeService {
  private supabase = createAdminClient()
  private channels: Map<string, RealtimeChannel> = new Map()
  private subscriptions: Map<string, Set<ChangeHandler>> = new Map()

  /**
   * Subscribe to real-time changes for a specific table
   */
  subscribeToTable<T extends TableName>(
    table: T,
    organizationId: string,
    handlers: {
      onInsert?: ChangeHandler<Database['public']['Tables'][T]['Row']>
      onUpdate?: ChangeHandler<Database['public']['Tables'][T]['Row']>
      onDelete?: ChangeHandler<Database['public']['Tables'][T]['Row']>
    }
  ): () => void {
    const channelName = `${table}-${organizationId}`
    
    // Get or create channel
    let channel = this.channels.get(channelName)
    
    if (!channel) {
      channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `organization_id=eq.${organizationId}`,
          },
          (payload) => this.handleChange(channelName, payload)
        )
        .subscribe()
      
      this.channels.set(channelName, channel)
    }
    
    // Store handlers
    const handlerKey = `${channelName}-${Date.now()}`
    this.subscriptions.set(handlerKey, new Set([
      handlers.onInsert,
      handlers.onUpdate,
      handlers.onDelete,
    ].filter(Boolean) as ChangeHandler[]))
    
    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(handlerKey)
      
      // If no more subscriptions for this channel, unsubscribe
      const hasMoreSubscriptions = Array.from(this.subscriptions.keys())
        .some(key => key.startsWith(channelName))
      
      if (!hasMoreSubscriptions) {
        channel?.unsubscribe()
        this.channels.delete(channelName)
      }
    }
  }

  /**
   * Subscribe to specific record changes
   */
  subscribeToRecord<T extends TableName>(
    table: T,
    recordId: string,
    handlers: {
      onUpdate?: ChangeHandler<Database['public']['Tables'][T]['Row']>
      onDelete?: ChangeHandler<Database['public']['Tables'][T]['Row']>
    }
  ): () => void {
    const channelName = `${table}-record-${recordId}`
    
    // Get or create channel
    let channel = this.channels.get(channelName)
    
    if (!channel) {
      channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `id=eq.${recordId}`,
          },
          (payload) => this.handleChange(channelName, payload)
        )
        .subscribe()
      
      this.channels.set(channelName, channel)
    }
    
    // Store handlers
    const handlerKey = `${channelName}-${Date.now()}`
    this.subscriptions.set(handlerKey, new Set([
      handlers.onUpdate,
      handlers.onDelete,
    ].filter(Boolean) as ChangeHandler[]))
    
    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(handlerKey)
      
      // If no more subscriptions for this channel, unsubscribe
      const hasMoreSubscriptions = Array.from(this.subscriptions.keys())
        .some(key => key.startsWith(channelName))
      
      if (!hasMoreSubscriptions) {
        channel?.unsubscribe()
        this.channels.delete(channelName)
      }
    }
  }

  /**
   * Subscribe to enrollment changes for a group
   */
  subscribeToGroupEnrollments(
    groupId: string,
    handlers: {
      onStudentAdded?: (enrollment: any) => void
      onStudentRemoved?: (enrollment: any) => void
      onEnrollmentUpdated?: (enrollment: any) => void
    }
  ): () => void {
    const channelName = `group-enrollments-${groupId}`
    
    let channel = this.channels.get(channelName)
    
    if (!channel) {
      channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'student_group_enrollments',
            filter: `group_id=eq.${groupId}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT' && handlers.onStudentAdded) {
              handlers.onStudentAdded(payload.new)
            } else if (payload.eventType === 'DELETE' && handlers.onStudentRemoved) {
              handlers.onStudentRemoved(payload.old)
            } else if (payload.eventType === 'UPDATE' && handlers.onEnrollmentUpdated) {
              handlers.onEnrollmentUpdated(payload.new)
            }
          }
        )
        .subscribe()
      
      this.channels.set(channelName, channel)
    }
    
    // Return unsubscribe function
    return () => {
      channel?.unsubscribe()
      this.channels.delete(channelName)
    }
  }

  /**
   * Subscribe to teacher assignments for a group
   */
  subscribeToGroupTeachers(
    groupId: string,
    handlers: {
      onTeacherAssigned?: (assignment: any) => void
      onTeacherRemoved?: (assignment: any) => void
      onAssignmentUpdated?: (assignment: any) => void
    }
  ): () => void {
    const channelName = `group-teachers-${groupId}`
    
    let channel = this.channels.get(channelName)
    
    if (!channel) {
      channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'teacher_group_assignments',
            filter: `group_id=eq.${groupId}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT' && handlers.onTeacherAssigned) {
              handlers.onTeacherAssigned(payload.new)
            } else if (payload.eventType === 'DELETE' && handlers.onTeacherRemoved) {
              handlers.onTeacherRemoved(payload.old)
            } else if (payload.eventType === 'UPDATE' && handlers.onAssignmentUpdated) {
              handlers.onAssignmentUpdated(payload.new)
            }
          }
        )
        .subscribe()
      
      this.channels.set(channelName, channel)
    }
    
    // Return unsubscribe function
    return () => {
      channel?.unsubscribe()
      this.channels.delete(channelName)
    }
  }

  /**
   * Subscribe to notifications for the current organization
   */
  subscribeToNotifications(
    organizationId: string,
    userId: string,
    onNotification: (notification: any) => void
  ): () => void {
    const channelName = `notifications-${organizationId}-${userId}`
    
    let channel = this.channels.get(channelName)
    
    if (!channel) {
      channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `organization_id=eq.${organizationId}`,
          },
          (payload) => {
            const notification = payload.new
            // Check if notification is for this user or broadcast
            if (
              notification.user_id === userId ||
              notification.user_id === null || // Broadcast to all
              notification.role === 'all' // Role-based broadcast
            ) {
              onNotification(notification)
            }
          }
        )
        .subscribe()
      
      this.channels.set(channelName, channel)
    }
    
    // Return unsubscribe function
    return () => {
      channel?.unsubscribe()
      this.channels.delete(channelName)
    }
  }

  /**
   * Subscribe to activity logs for monitoring
   */
  subscribeToActivityLogs(
    organizationId: string,
    onActivity: (activity: any) => void
  ): () => void {
    const channelName = `activity-logs-${organizationId}`
    
    let channel = this.channels.get(channelName)
    
    if (!channel) {
      channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_logs',
            filter: `organization_id=eq.${organizationId}`,
          },
          (payload) => onActivity(payload.new)
        )
        .subscribe()
      
      this.channels.set(channelName, channel)
    }
    
    // Return unsubscribe function
    return () => {
      channel?.unsubscribe()
      this.channels.delete(channelName)
    }
  }

  /**
   * Handle change events
   */
  private handleChange(channelName: string, payload: RealtimePostgresChangesPayload<any>) {
    // Find all subscriptions for this channel
    const relevantSubscriptions = Array.from(this.subscriptions.entries())
      .filter(([key]) => key.startsWith(channelName))
    
    // Call all handlers
    relevantSubscriptions.forEach(([_, handlers]) => {
      handlers.forEach(handler => {
        try {
          handler(payload)
        } catch (error) {
          console.error('Error in realtime handler:', error)
        }
      })
    })
  }

  /**
   * Broadcast a custom event
   */
  async broadcastEvent(
    channel: string,
    event: string,
    payload: any
  ): Promise<void> {
    const channelInstance = this.supabase.channel(channel)
    
    await channelInstance.send({
      type: 'broadcast',
      event,
      payload,
    })
  }

  /**
   * Subscribe to custom broadcast events
   */
  subscribeToBroadcast(
    channel: string,
    event: string,
    handler: (payload: any) => void
  ): () => void {
    const channelName = `broadcast-${channel}`
    
    let channelInstance = this.channels.get(channelName)
    
    if (!channelInstance) {
      channelInstance = this.supabase
        .channel(channel)
        .on('broadcast', { event }, (payload) => handler(payload))
        .subscribe()
      
      this.channels.set(channelName, channelInstance)
    }
    
    // Return unsubscribe function
    return () => {
      channelInstance?.unsubscribe()
      this.channels.delete(channelName)
    }
  }

  /**
   * Clean up all subscriptions
   */
  cleanup() {
    // Unsubscribe from all channels
    this.channels.forEach(channel => {
      channel.unsubscribe()
    })
    
    // Clear all data
    this.channels.clear()
    this.subscriptions.clear()
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService()