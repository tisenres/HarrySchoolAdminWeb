/**
 * Session Data Caching Layer
 * High-performance session management with Redis caching
 */

import { User, Session } from '@supabase/supabase-js'
import { cacheService, CacheKeys, CacheTTL } from './cache-service'

// Enhanced session data interface
export interface CachedSessionData {
  user: User
  session: Session
  profile: {
    id: string
    organization_id: string
    role: string
    full_name?: string
    email: string
    avatar_url?: string
    preferences?: Record<string, any>
    permissions?: string[]
    last_login?: string
    is_active: boolean
  }
  organization: {
    id: string
    name: string
    settings?: Record<string, any>
    subscription_tier?: string
    is_active: boolean
  }
  metadata: {
    cached_at: number
    expires_at: number
    version: number
  }
}

// Session activity tracking
interface SessionActivity {
  user_id: string
  session_id: string
  last_activity: number
  ip_address?: string
  user_agent?: string
  page_views: number
  actions_performed: number
}

/**
 * Session caching service with intelligent session management
 */
class SessionCacheService {
  private readonly SESSION_VERSION = 1

  /**
   * Cache complete session data
   */
  async cacheSession(
    sessionId: string,
    userId: string,
    sessionData: CachedSessionData
  ): Promise<boolean> {
    try {
      // Add metadata
      const enhancedData: CachedSessionData = {
        ...sessionData,
        metadata: {
          cached_at: Date.now(),
          expires_at: Date.now() + (CacheTTL.SESSION * 1000),
          version: this.SESSION_VERSION
        }
      }

      // Cache session by session ID and user ID
      const operations = [
        [CacheKeys.SESSION(sessionId), enhancedData],
        [CacheKeys.USER_SESSION(userId), enhancedData],
        [CacheKeys.AUTH_PROFILE(userId), enhancedData.profile]
      ] as Array<[string, any]>

      return await cacheService.multiSet(operations, CacheTTL.SESSION)
    } catch (error) {
      console.warn('Session cache error:', error)
      return false
    }
  }

  /**
   * Get cached session data by session ID
   */
  async getSession(sessionId: string): Promise<CachedSessionData | null> {
    try {
      const cached = await cacheService.get<CachedSessionData>(
        CacheKeys.SESSION(sessionId)
      )

      if (!cached) return null

      // Check if session is expired
      if (this.isSessionExpired(cached)) {
        await this.deleteSession(sessionId, cached.user.id)
        return null
      }

      // Check version compatibility
      if (cached.metadata.version !== this.SESSION_VERSION) {
        await this.deleteSession(sessionId, cached.user.id)
        return null
      }

      return cached
    } catch (error) {
      console.warn('Session get error:', error)
      return null
    }
  }

  /**
   * Get cached session data by user ID
   */
  async getUserSession(userId: string): Promise<CachedSessionData | null> {
    try {
      const cached = await cacheService.get<CachedSessionData>(
        CacheKeys.USER_SESSION(userId)
      )

      if (!cached) return null

      // Check if session is expired
      if (this.isSessionExpired(cached)) {
        await this.deleteUserSession(userId)
        return null
      }

      return cached
    } catch (error) {
      console.warn('User session get error:', error)
      return null
    }
  }

  /**
   * Get cached auth profile
   */
  async getAuthProfile(userId: string): Promise<CachedSessionData['profile'] | null> {
    try {
      const cached = await cacheService.get<CachedSessionData['profile']>(
        CacheKeys.AUTH_PROFILE(userId)
      )

      return cached
    } catch (error) {
      console.warn('Auth profile get error:', error)
      return null
    }
  }

  /**
   * Update session profile data
   */
  async updateProfile(
    userId: string,
    profileUpdates: Partial<CachedSessionData['profile']>
  ): Promise<boolean> {
    try {
      // Get current session
      const currentSession = await this.getUserSession(userId)
      if (!currentSession) return false

      // Update profile data
      const updatedSession: CachedSessionData = {
        ...currentSession,
        profile: {
          ...currentSession.profile,
          ...profileUpdates
        },
        metadata: {
          ...currentSession.metadata,
          cached_at: Date.now()
        }
      }

      // Update all related cache entries
      const operations = [
        [CacheKeys.USER_SESSION(userId), updatedSession],
        [CacheKeys.AUTH_PROFILE(userId), updatedSession.profile]
      ] as Array<[string, any]>

      // If we have session ID, update that too
      if (currentSession.session?.access_token) {
        operations.push([
          CacheKeys.SESSION(currentSession.session.access_token),
          updatedSession
        ])
      }

      return await cacheService.multiSet(operations, CacheTTL.SESSION)
    } catch (error) {
      console.warn('Profile update error:', error)
      return false
    }
  }

  /**
   * Extend session TTL
   */
  async extendSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId)
      if (!session) return false

      // Update metadata
      session.metadata.expires_at = Date.now() + (CacheTTL.SESSION * 1000)
      session.metadata.cached_at = Date.now()

      return await this.cacheSession(sessionId, userId, session)
    } catch (error) {
      console.warn('Session extend error:', error)
      return false
    }
  }

  /**
   * Delete session from cache
   */
  async deleteSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const keys = [
        CacheKeys.SESSION(sessionId),
        CacheKeys.USER_SESSION(userId),
        CacheKeys.AUTH_PROFILE(userId)
      ]

      let deleted = 0
      for (const key of keys) {
        if (await cacheService.delete(key)) {
          deleted++
        }
      }

      return deleted > 0
    } catch (error) {
      console.warn('Session delete error:', error)
      return false
    }
  }

  /**
   * Delete user session
   */
  async deleteUserSession(userId: string): Promise<boolean> {
    try {
      const keys = [
        CacheKeys.USER_SESSION(userId),
        CacheKeys.AUTH_PROFILE(userId)
      ]

      let deleted = 0
      for (const key of keys) {
        if (await cacheService.delete(key)) {
          deleted++
        }
      }

      return deleted > 0
    } catch (error) {
      console.warn('User session delete error:', error)
      return false
    }
  }

  /**
   * Track session activity
   */
  async trackActivity(
    userId: string,
    sessionId: string,
    activity: Partial<SessionActivity>
  ): Promise<boolean> {
    try {
      const activityKey = `activity:${userId}:${sessionId}`
      
      const currentActivity = await cacheService.get<SessionActivity>(activityKey) || {
        user_id: userId,
        session_id: sessionId,
        last_activity: Date.now(),
        page_views: 0,
        actions_performed: 0
      }

      const updatedActivity: SessionActivity = {
        ...currentActivity,
        ...activity,
        last_activity: Date.now()
      }

      return await cacheService.set(activityKey, updatedActivity, CacheTTL.SESSION)
    } catch (error) {
      console.warn('Activity tracking error:', error)
      return false
    }
  }

  /**
   * Get session activity
   */
  async getActivity(userId: string, sessionId: string): Promise<SessionActivity | null> {
    try {
      const activityKey = `activity:${userId}:${sessionId}`
      return await cacheService.get<SessionActivity>(activityKey)
    } catch (error) {
      console.warn('Get activity error:', error)
      return null
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getActiveSessions(userId: string): Promise<CachedSessionData[]> {
    try {
      // This would require a more complex implementation with session tracking
      // For now, return the current session if it exists
      const session = await this.getUserSession(userId)
      return session ? [session] : []
    } catch (error) {
      console.warn('Get active sessions error:', error)
      return []
    }
  }

  /**
   * Invalidate all sessions for a user (logout all devices)
   */
  async invalidateAllUserSessions(userId: string): Promise<boolean> {
    try {
      // Delete user session and auth profile
      await this.deleteUserSession(userId)
      
      // Clear activity tracking
      await cacheService.delete(`activity:${userId}:*`)
      
      return true
    } catch (error) {
      console.warn('Invalidate all sessions error:', error)
      return false
    }
  }

  /**
   * Clean expired sessions
   */
  async cleanExpiredSessions(): Promise<number> {
    try {
      // This would require scanning all session keys
      // In a production environment, you might use Redis SCAN
      console.log('Session cleanup would run here')
      return 0
    } catch (error) {
      console.warn('Session cleanup error:', error)
      return 0
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    activeSessions: number
    totalUsers: number
    averageSessionTime: number
  }> {
    try {
      // This would require more complex tracking
      return {
        activeSessions: 0,
        totalUsers: 0,
        averageSessionTime: 0
      }
    } catch (error) {
      console.warn('Session stats error:', error)
      return {
        activeSessions: 0,
        totalUsers: 0,
        averageSessionTime: 0
      }
    }
  }

  /**
   * Check if session is expired
   */
  private isSessionExpired(sessionData: CachedSessionData): boolean {
    if (!sessionData.metadata?.expires_at) return true
    return Date.now() > sessionData.metadata.expires_at
  }

  /**
   * Validate session data structure
   */
  private isValidSessionData(data: any): data is CachedSessionData {
    return (
      data &&
      data.user &&
      data.session &&
      data.profile &&
      data.organization &&
      data.metadata
    )
  }

  /**
   * Session cache health check
   */
  async healthCheck(): Promise<{
    cacheConnected: boolean
    activeSessions: number
    errors: string[]
  }> {
    const errors: string[] = []
    let activeSessions = 0

    try {
      // Test cache connectivity
      const cacheHealth = await cacheService.healthCheck()
      
      if (!cacheHealth.connected) {
        errors.push('Cache not connected')
      }

      // Test basic operations
      const testKey = 'session_health_test'
      const testData = { test: true, timestamp: Date.now() }
      
      const setResult = await cacheService.set(testKey, testData, 10)
      if (!setResult) {
        errors.push('Cache SET operation failed')
      }

      const getData = await cacheService.get(testKey)
      if (!getData) {
        errors.push('Cache GET operation failed')
      }

      await cacheService.delete(testKey)

      return {
        cacheConnected: cacheHealth.connected,
        activeSessions,
        errors
      }
    } catch (error) {
      errors.push(`Health check failed: ${error}`)
      return {
        cacheConnected: false,
        activeSessions: 0,
        errors
      }
    }
  }
}

// Export singleton instance
export const sessionCache = new SessionCacheService()

// Export types
export type { CachedSessionData, SessionActivity }
export { SessionCacheService }