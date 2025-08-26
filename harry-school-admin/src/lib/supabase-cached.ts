import { unstable_cache as cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase-server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * PERFORMANCE OPTIMIZATION: Cached Supabase client with Next.js caching
 * Reduces database queries by caching results with proper invalidation
 */

export interface CacheConfig {
  revalidate?: number
  tags?: string[]
}

/**
 * Create a cached Supabase query wrapper
 */
export function createCachedSupabaseQuery<T>(
  queryFn: (supabase: SupabaseClient<Database>) => Promise<T>,
  cacheKey: string,
  config: CacheConfig = {}
) {
  const { revalidate = 300, tags = [] } = config // Default 5 minutes cache
  
  return cache(
    async () => {
      const supabase = await createServerClient()
      return queryFn(supabase)
    },
    [cacheKey],
    {
      revalidate,
      tags: [...tags, 'supabase']
    }
  )
}

/**
 * Cached organization query
 */
export const getCachedOrganization = (organizationId: string) =>
  createCachedSupabaseQuery(
    async (supabase) => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, settings')
        .eq('id', organizationId)
        .single()
      
      if (error) throw error
      return data
    },
    `organization:${organizationId}`,
    { revalidate: 600, tags: ['organizations'] } // 10 minutes cache
  )

/**
 * Cached user profile query
 */
export const getCachedProfile = (userId: string) =>
  createCachedSupabaseQuery(
    async (supabase) => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organizations!inner (
            id,
            name,
            slug,
            settings
          )
        `)
        .eq('id', userId)
        .is('deleted_at', null)
        .single()
      
      if (error) throw error
      return data
    },
    `profile:${userId}`,
    { revalidate: 300, tags: ['profiles'] } // 5 minutes cache
  )

/**
 * Cached teacher statistics
 */
export const getCachedTeacherStats = (organizationId: string) =>
  createCachedSupabaseQuery(
    async (supabase) => {
      const [
        totalCount, 
        activeCount, 
        fullTimeCount, 
        partTimeCount,
        specializations
      ] = await Promise.all([
        supabase
          .from('teachers')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .is('deleted_at', null),
        supabase
          .from('teachers')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('is_active', true)
          .is('deleted_at', null),
        supabase
          .from('teachers')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('employment_status', 'full_time')
          .eq('is_active', true)
          .is('deleted_at', null),
        supabase
          .from('teachers')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('employment_status', 'part_time')
          .eq('is_active', true)
          .is('deleted_at', null),
        supabase
          .from('teachers')
          .select('specializations')
          .eq('organization_id', organizationId)
          .not('specializations', 'is', null)
          .is('deleted_at', null)
      ])
      
      // Process specializations efficiently
      const uniqueSpecializations = new Set<string>()
      specializations.data?.forEach(teacher => {
        if (Array.isArray(teacher.specializations)) {
          teacher.specializations.forEach(spec => {
            if (spec && typeof spec === 'string') {
              uniqueSpecializations.add(spec)
            }
          })
        }
      })
      
      return {
        total: totalCount.count || 0,
        active: activeCount.count || 0,
        full_time: fullTimeCount.count || 0,
        part_time: partTimeCount.count || 0,
        specializations: Array.from(uniqueSpecializations)
      }
    },
    `teacher-stats:${organizationId}`,
    { revalidate: 300, tags: ['teachers', 'statistics'] }
  )

/**
 * Cached student statistics
 */
export const getCachedStudentStats = (organizationId: string) =>
  createCachedSupabaseQuery(
    async (supabase) => {
      const [
        totalCount,
        activeCount,
        enrolledCount,
        graduatedCount
      ] = await Promise.all([
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .is('deleted_at', null),
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('enrollment_status', 'active')
          .is('deleted_at', null),
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('enrollment_status', 'enrolled')
          .is('deleted_at', null),
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('enrollment_status', 'graduated')
          .is('deleted_at', null)
      ])
      
      return {
        total: totalCount.count || 0,
        active: activeCount.count || 0,
        enrolled: enrolledCount.count || 0,
        graduated: graduatedCount.count || 0
      }
    },
    `student-stats:${organizationId}`,
    { revalidate: 300, tags: ['students', 'statistics'] }
  )

/**
 * Cache invalidation utilities
 */
export async function invalidateCache(tags: string[]) {
  const { revalidateTag } = await import('next/cache')
  tags.forEach(tag => revalidateTag(tag))
}

/**
 * Invalidate all Supabase caches
 */
export const invalidateAllSupabaseCache = () => invalidateCache(['supabase'])

/**
 * Invalidate specific entity caches
 */
export const invalidateTeacherCache = () => invalidateCache(['teachers'])
export const invalidateStudentCache = () => invalidateCache(['students'])
export const invalidateOrganizationCache = () => invalidateCache(['organizations'])
export const invalidateProfileCache = () => invalidateCache(['profiles'])