/**
 * Cached Teacher Service
 * Enhanced OptimizedTeacherService with Redis caching layer
 */

import { OptimizedTeacherService } from './optimized-teacher-service'
import { queryCache } from '../query-cache'
import { CacheUtils } from '../cache-service'
import { teacherSearchSchema, paginationSchema } from '@/lib/validations'
import type { Teacher } from '@/types/database'
import type { z } from 'zod'

/**
 * Teacher service with Redis caching integration
 */
export class CachedTeacherService extends OptimizedTeacherService {
  
  /**
   * CACHED: Get all teachers with Redis caching
   */
  async getAll(
    search?: z.infer<typeof teacherSearchSchema>,
    pagination?: z.infer<typeof paginationSchema>
  ): Promise<{ 
    data: any[]; 
    count: number; 
    total_pages: number;
    limit: number;
  }> {
    const organizationId = await this.getCurrentOrganization()
    const { page, limit, sort_by, sort_order } = pagination 
      ? paginationSchema.parse(pagination) 
      : { page: 1, limit: 20, sort_by: 'created_at', sort_order: 'desc' as const }
    
    // Use query cache for list data
    return await queryCache.cacheListQuery(
      'teachers',
      organizationId,
      { ...search, sort_by, sort_order },
      { page, limit },
      async () => {
        // Call parent method for actual data fetching
        return await super.getAll(search, pagination)
      },
      {
        ttl: 10 * 60, // 10 minutes for teacher lists
        tags: ['teachers_list', `org_${organizationId}`]
      }
    )
  }

  /**
   * CACHED: Get teacher by ID with Redis caching
   */
  async getById(id: string): Promise<Teacher & { 
    groups?: any[],
    assignments?: any[]
  }> {
    const organizationId = await this.getCurrentOrganization()
    
    return await queryCache.cacheEntityQuery(
      'teacher',
      organizationId,
      id,
      async () => {
        // Call parent method for actual data fetching
        return await super.getById(id)
      },
      {
        ttl: 15 * 60, // 15 minutes for teacher details
        tags: [`teacher_detail`, `org_${organizationId}`, `teacher_${id}`]
      }
    )
  }

  /**
   * CACHED: Get teacher statistics with Redis caching
   */
  async getStatistics(): Promise<{
    total: number
    active: number
    inactive: number
    by_employment_status: Record<string, number>
    by_specialization: Record<string, number>
    total_assignments: number
    average_groups_per_teacher: number
  }> {
    const organizationId = await this.getCurrentOrganization()
    
    return await queryCache.cacheStatsQuery(
      'teacher',
      organizationId,
      async () => {
        // Call parent method for actual data fetching
        return await super.getStatistics()
      },
      {
        ttl: 5 * 60, // 5 minutes for teacher statistics
        tags: ['teacher_stats', `org_${organizationId}`, 'dashboard_stats']
      }
    )
  }

  /**
   * CACHED: Get available teachers with Redis caching
   */
  async getAvailableTeachers(): Promise<any[]> {
    const organizationId = await this.getCurrentOrganization()
    
    return await queryCache.executeQuery(
      `teachers_available:${organizationId}`,
      organizationId,
      'teachers',
      async () => {
        // Call parent method for actual data fetching
        return await super.getAvailableTeachers()
      },
      {
        ttl: 5 * 60, // 5 minutes for available teachers
        tags: ['teachers_available', `org_${organizationId}`]
      }
    )
  }

  /**
   * Create teacher with cache invalidation
   */
  async create(teacherData: any): Promise<Teacher> {
    const organizationId = await this.getCurrentOrganization()
    
    // Create teacher using parent method
    const result = await super.create(teacherData)
    
    // Invalidate relevant caches
    await queryCache.invalidateOnDataChange('teachers', organizationId, 'create', result.id)
    
    console.log(`🔄 Cache invalidated after teacher creation: ${result.id}`)
    
    return result
  }

  /**
   * Update teacher with cache invalidation
   */
  async update(id: string, teacherData: any): Promise<Teacher> {
    const organizationId = await this.getCurrentOrganization()
    
    // Update teacher using parent method
    const result = await super.update(id, teacherData)
    
    // Invalidate relevant caches
    await queryCache.invalidateOnDataChange('teachers', organizationId, 'update', id)
    
    console.log(`🔄 Cache invalidated after teacher update: ${id}`)
    
    return result
  }

  /**
   * Delete teacher with cache invalidation
   */
  async delete(id: string): Promise<Teacher> {
    const organizationId = await this.getCurrentOrganization()
    
    // Delete teacher using parent method
    const result = await super.delete(id)
    
    // Invalidate relevant caches
    await queryCache.invalidateOnDataChange('teachers', organizationId, 'delete', id)
    
    console.log(`🔄 Cache invalidated after teacher deletion: ${id}`)
    
    return result
  }

  /**
   * Bulk delete with optimized cache invalidation
   */
  async bulkDelete(ids: string[]): Promise<{ success: number; errors: string[] }> {
    const organizationId = await this.getCurrentOrganization()
    
    // Perform bulk delete using parent method
    const result = await super.bulkDelete(ids)
    
    // Invalidate caches for all successfully deleted teachers
    if (result.success > 0) {
      await queryCache.invalidateEntityQueries('teachers', organizationId)
      console.log(`🔄 Cache invalidated after bulk teacher deletion: ${result.success} items`)
    }
    
    return result
  }

  /**
   * Bulk restore with cache invalidation
   */
  async bulkRestore(ids: string[]): Promise<{ success: number; errors: string[] }> {
    const organizationId = await this.getCurrentOrganization()
    
    // Perform bulk restore using parent method
    const result = await super.bulkRestore(ids)
    
    // Invalidate caches for restored teachers
    if (result.success > 0) {
      await queryCache.invalidateEntityQueries('teachers', organizationId)
      console.log(`🔄 Cache invalidated after bulk teacher restoration: ${result.success} items`)
    }
    
    return result
  }

  /**
   * Cache warmup for frequently accessed teacher data
   */
  async warmupCache(organizationId?: string): Promise<void> {
    try {
      const orgId = organizationId || await this.getCurrentOrganization()
      console.log(`🔥 Warming up teacher cache for organization ${orgId}`)
      
      // Pre-load frequently accessed data
      const warmupQueries = [
        // Teacher statistics
        {
          key: CacheUtils.generateStatsKey('teacher', orgId),
          organizationId: orgId,
          tableName: 'teachers_stats',
          queryFunction: () => super.getStatistics(),
          ttl: 5 * 60
        },
        
        // Available teachers
        {
          key: `teachers_available:${orgId}`,
          organizationId: orgId,
          tableName: 'teachers',
          queryFunction: () => super.getAvailableTeachers(),
          ttl: 5 * 60
        },
        
        // First page of teachers (most common query)
        {
          key: CacheUtils.generateListKey('teachers', orgId, {}, 1),
          organizationId: orgId,
          tableName: 'teachers',
          queryFunction: () => super.getAll(undefined, { page: 1, limit: 20, sort_by: 'created_at', sort_order: 'desc' }),
          ttl: 10 * 60
        }
      ]

      const warmedUp = await queryCache.batchWarmup(warmupQueries)
      console.log(`✅ Teacher cache warmup completed: ${warmedUp}/${warmupQueries.length} queries cached`)
    } catch (error) {
      console.warn('Teacher cache warmup error:', error)
    }
  }

  /**
   * Get cache health specifically for teacher data
   */
  async getCacheHealth(): Promise<{
    connected: boolean
    teacherCacheSize: number
    hitRate: number
    errors: string[]
  }> {
    try {
      const baseHealth = await queryCache.healthCheck()
      
      return {
        connected: baseHealth.connected,
        teacherCacheSize: 0, // Would need implementation
        hitRate: baseHealth.hitRate,
        errors: baseHealth.errors
      }
    } catch (error) {
      return {
        connected: false,
        teacherCacheSize: 0,
        hitRate: 0,
        errors: [`Cache health check failed: ${error}`]
      }
    }
  }

  /**
   * Clear all teacher-related cache for organization
   */
  async clearCache(organizationId?: string): Promise<number> {
    try {
      const orgId = organizationId || await this.getCurrentOrganization()
      const deletedCount = await queryCache.invalidateEntityQueries('teachers', orgId)
      
      console.log(`🧹 Cleared teacher cache for organization ${orgId}: ${deletedCount} entries`)
      return deletedCount
    } catch (error) {
      console.warn('Teacher cache clear error:', error)
      return 0
    }
  }
}

// Export singleton instance
export const cachedTeacherService = new CachedTeacherService()