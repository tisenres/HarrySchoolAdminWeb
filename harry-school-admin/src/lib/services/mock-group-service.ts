/**
 * Optimized Mock Group Service for Client-Side Development
 * 
 * This service provides a high-performance client-side implementation for group operations
 * using mock data with advanced optimizations including:
 * - Multi-level caching with TTL and cache invalidation
 * - Indexing simulation with Map/Set for O(1) lookups
 * - Relationship preloading to prevent N+1 queries
 * - Schedule conflict detection optimization
 * - Enrollment calculation caching
 * - Performance monitoring and benchmarking
 * 
 * Performance Targets:
 * - Search response: <50ms for 50+ groups
 * - Filter application: <100ms for complex filters
 * - Schedule conflict detection: <50ms
 * - Enrollment calculations: <25ms
 * 
 * Security Note: This service is safe for client-side usage as it doesn't
 * access any server-side resources or sensitive environment variables.
 */

import type { 
  Group, 
  GroupTableRow,
  GroupFilters, 
  GroupSortConfig, 
  GroupStatistics,
  GroupWithDetails,
  ScheduleSlot,
  Teacher
} from '@/types/group'
import type { CreateGroupRequest } from '@/lib/validations/group'
import { mockTeacherService } from './mock-teacher-service'

// Group-specific performance interfaces
interface GroupPerformanceMetrics {
  queryCount: number
  averageQueryTime: number
  cacheHitRate: number
  scheduleConflictChecks: number
  averageConflictCheckTime: number
  enrollmentCalculations: number
  averageEnrollmentTime: number
}

// Group search index
interface GroupSearchIndex {
  byName: Map<string, Set<string>>
  bySubject: Map<string, Set<string>>
  byLevel: Map<string, Set<string>>
  byStatus: Map<string, Set<string>>
  byGroupCode: Map<string, string>
  byClassroom: Map<string, Set<string>>
  byTeacher: Map<string, Set<string>>
  scheduleIndex: Map<string, Set<string>> // day-time combinations
}

// Enhanced group cache entry
interface GroupCacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  dependencies?: string[] // For cache invalidation
}

export class MockGroupService {
  private static instance: MockGroupService
  private groups: Group[]
  private nextId: number = 1
  
  // Performance optimizations
  private searchIndex: GroupSearchIndex
  private queryCache = new Map<string, GroupCacheEntry<any>>()
  private relationshipCache = new Map<string, any>()
  private scheduleConflictCache = new Map<string, boolean>()
  private enrollmentCache = new Map<string, number>()
  private metrics: GroupPerformanceMetrics = {
    queryCount: 0,
    averageQueryTime: 0,
    cacheHitRate: 0,
    scheduleConflictChecks: 0,
    averageConflictCheckTime: 0,
    enrollmentCalculations: 0,
    averageEnrollmentTime: 0
  }
  
  // Cache configuration
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly RELATIONSHIP_CACHE_TTL = 10 * 60 * 1000 // 10 minutes
  private readonly SCHEDULE_CACHE_TTL = 15 * 60 * 1000 // 15 minutes
  private readonly MAX_CACHE_SIZE = 100

  constructor() {
    // Initialize with comprehensive mock data
    this.groups = this.generateMockGroups()
    
    // Initialize optimized search index
    this.searchIndex = this.buildGroupSearchIndex()
    
    // Preload relationship data
    this.preloadRelationships()
    
    // Warm up caches
    this.warmupGroupCache()
  }

  static getInstance(): MockGroupService {
    if (!MockGroupService.instance) {
      MockGroupService.instance = new MockGroupService()
    }
    return MockGroupService.instance
  }

  /**
   * Build optimized search index for groups
   */
  private buildGroupSearchIndex(): GroupSearchIndex {
    const index: GroupSearchIndex = {
      byName: new Map(),
      bySubject: new Map(),
      byLevel: new Map(),
      byStatus: new Map(),
      byGroupCode: new Map(),
      byClassroom: new Map(),
      byTeacher: new Map(),
      scheduleIndex: new Map()
    }

    for (const group of this.groups) {
      // Index by name tokens
      const nameTokens = this.tokenizeGroupName(group.name)
      nameTokens.forEach(token => {
        if (!index.byName.has(token)) {
          index.byName.set(token, new Set())
        }
        index.byName.get(token)!.add(group.id)
      })

      // Index by subject
      if (!index.bySubject.has(group.subject)) {
        index.bySubject.set(group.subject, new Set())
      }
      index.bySubject.get(group.subject)!.add(group.id)

      // Index by level
      if (!index.byLevel.has(group.level)) {
        index.byLevel.set(group.level, new Set())
      }
      index.byLevel.get(group.level)!.add(group.id)

      // Index by status
      if (!index.byStatus.has(group.status)) {
        index.byStatus.set(group.status, new Set())
      }
      index.byStatus.get(group.status)!.add(group.id)

      // Index by group code
      index.byGroupCode.set(group.group_code, group.id)

      // Index by classroom
      if (group.classroom) {
        if (!index.byClassroom.has(group.classroom)) {
          index.byClassroom.set(group.classroom, new Set())
        }
        index.byClassroom.get(group.classroom)!.add(group.id)
      }

      // Index by schedule for conflict detection
      group.schedule.forEach(slot => {
        const scheduleKey = `${slot.day}-${slot.start_time}-${slot.end_time}`
        if (!index.scheduleIndex.has(scheduleKey)) {
          index.scheduleIndex.set(scheduleKey, new Set())
        }
        index.scheduleIndex.get(scheduleKey)!.add(group.id)
      })
    }

    return index
  }

  /**
   * Tokenize group name for search
   */
  private tokenizeGroupName(name: string): string[] {
    return name.toLowerCase()
      .split(/\s+/)
      .filter(token => token.length > 1)
      .concat([name.toLowerCase().replace(/\s+/g, '')])
  }

  /**
   * Preload relationship data to prevent N+1 queries
   */
  private async preloadRelationships(): Promise<void> {
    try {
      // Preload all teachers for assignment simulation
      const teachersResponse = await mockTeacherService.getAll({}, undefined, 1, 1000)
      const teachers = teachersResponse.data
      
      // Cache teacher assignments
      this.groups.forEach((group, index) => {
        const assignedTeacher = Math.random() > 0.2 
          ? teachers[index % teachers.length] 
          : undefined
        
        if (assignedTeacher) {
          const cacheKey = `teacher-assignment-${group.id}`
          this.relationshipCache.set(cacheKey, assignedTeacher)
          
          // Update teacher index
          if (!this.searchIndex.byTeacher.has(assignedTeacher.id)) {
            this.searchIndex.byTeacher.set(assignedTeacher.id, new Set())
          }
          this.searchIndex.byTeacher.get(assignedTeacher.id)!.add(group.id)
        }
      })
    } catch (error) {
      console.warn('Failed to preload relationships:', error)
    }
  }

  /**
   * Warm up cache with common queries
   */
  private async warmupGroupCache(): Promise<void> {
    const commonFilters = [
      { status: ['active'] },
      { subject: ['English'] },
      { has_capacity: true },
      { is_active: true }
    ]

    for (const filters of commonFilters) {
      try {
        await this.getAll(filters, undefined, 1, 20)
      } catch (error) {
        console.warn('Cache warmup failed for filter:', filters, error)
      }
    }
  }

  /**
   * Fast schedule conflict detection
   */
  private checkScheduleConflict(schedule: ScheduleSlot[], excludeGroupId?: string): boolean {
    const startTime = performance.now()
    
    try {
      for (const slot of schedule) {
        const scheduleKey = `${slot.day}-${slot.start_time}-${slot.end_time}`
        const conflictingGroups = this.searchIndex.scheduleIndex.get(scheduleKey)
        
        if (conflictingGroups && conflictingGroups.size > 0) {
          const hasConflict = [...conflictingGroups].some(groupId => 
            groupId !== excludeGroupId && 
            this.groups.find(g => g.id === groupId && g.is_active)
          )
          
          if (hasConflict) {
            return true
          }
        }
      }
      
      return false
    } finally {
      const endTime = performance.now()
      this.metrics.scheduleConflictChecks++
      this.metrics.averageConflictCheckTime = 
        (this.metrics.averageConflictCheckTime * (this.metrics.scheduleConflictChecks - 1) + 
         (endTime - startTime)) / this.metrics.scheduleConflictChecks
    }
  }

  /**
   * Calculate enrollment with caching
   */
  private calculateEnrollmentStats(groupId: string): { percentage: number; canEnroll: boolean; isFull: boolean } {
    const cacheKey = `enrollment-${groupId}`
    const cached = this.enrollmentCache.get(cacheKey)
    
    if (cached !== undefined) {
      const group = this.groups.find(g => g.id === groupId)
      if (group) {
        return {
          percentage: Math.round((group.current_enrollment / group.max_students) * 100),
          canEnroll: group.current_enrollment < group.max_students && group.status === 'active',
          isFull: group.current_enrollment >= group.max_students
        }
      }
    }

    const startTime = performance.now()
    const group = this.groups.find(g => g.id === groupId)
    
    if (!group) {
      return { percentage: 0, canEnroll: false, isFull: false }
    }

    const stats = {
      percentage: Math.round((group.current_enrollment / group.max_students) * 100),
      canEnroll: group.current_enrollment < group.max_students && group.status === 'active',
      isFull: group.current_enrollment >= group.max_students
    }

    // Cache the result
    this.enrollmentCache.set(cacheKey, group.current_enrollment)
    
    const endTime = performance.now()
    this.metrics.enrollmentCalculations++
    this.metrics.averageEnrollmentTime = 
      (this.metrics.averageEnrollmentTime * (this.metrics.enrollmentCalculations - 1) + 
       (endTime - startTime)) / this.metrics.enrollmentCalculations

    return stats
  }

  /**
   * Enhanced group data with cached relationships
   */
  private async enhanceGroupsOptimized(groups: Group[]): Promise<GroupWithDetails[]> {
    return groups.map(group => {
      // Get cached teacher assignment
      const teacherCacheKey = `teacher-assignment-${group.id}`
      const assignedTeacher = this.relationshipCache.get(teacherCacheKey)
      
      // Get cached enrollment stats
      const enrollmentStats = this.calculateEnrollmentStats(group.id)
      
      // Generate schedule summary (cached)
      const scheduleCacheKey = `schedule-${group.id}`
      let scheduleSummary = this.relationshipCache.get(scheduleCacheKey)
      
      if (!scheduleSummary) {
        scheduleSummary = group.schedule
          .map(slot => `${slot.day.charAt(0).toUpperCase() + slot.day.slice(1)} ${slot.start_time}-${slot.end_time}`)
          .join(', ')
        
        this.relationshipCache.set(scheduleCacheKey, scheduleSummary)
      }

      return {
        ...group,
        teacher_name: assignedTeacher?.full_name,
        teacher_count: assignedTeacher ? 1 : 0,
        enrollment_percentage: enrollmentStats.percentage,
        schedule_summary: scheduleSummary,
        can_enroll: enrollmentStats.canEnroll,
        is_full: enrollmentStats.isFull
      } as GroupWithDetails
    })
  }

  private generateMockGroups(): Group[] {
    const subjects = [
      'English', 'Mathematics', 'Computer Science', 'IELTS Preparation',
      'TOEFL Preparation', 'Business English', 'Physics', 'Chemistry',
      'Biology', 'Academic Writing', 'Conversation', 'Grammar',
      'Programming', 'Data Science', 'Web Development'
    ]

    const levels = [
      'Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 
      'Upper-Intermediate', 'Advanced', 'Proficiency'
    ]

    const statuses = ['active', 'inactive', 'upcoming', 'completed'] as const
    const groupTypes = ['regular', 'intensive', 'online', 'hybrid'] as const
    
    const classrooms = [
      'Room 101', 'Room 102', 'Room 201', 'Room 202', 'Lab 1', 'Lab 2',
      'Conference Room A', 'Conference Room B', 'Online', 'Auditorium'
    ]

    const generateSchedule = (): ScheduleSlot[] => {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
      const times = [
        { start: '09:00', end: '10:30' },
        { start: '11:00', end: '12:30' },
        { start: '14:00', end: '15:30' },
        { start: '16:00', end: '17:30' },
        { start: '18:00', end: '19:30' }
      ]

      const numSlots = Math.random() > 0.7 ? 3 : 2 // 70% chance for 2 slots, 30% for 3
      const selectedDays = days.slice(0, numSlots)
      const selectedTime = times[Math.floor(Math.random() * times.length)]
      const classroom = classrooms[Math.floor(Math.random() * classrooms.length)]

      return selectedDays.map(day => ({
        day,
        start_time: selectedTime.start,
        end_time: selectedTime.end,
        room: classroom === 'Online' ? undefined : classroom
      }))
    }

    const generateGroupCode = (subject: string, level: string, year: number): string => {
      const subjectCode = subject.substring(0, 3).toUpperCase()
      const levelCode = level.substring(0, 3).toUpperCase()
      return `${subjectCode}-${levelCode}-${year}`
    }

    // Generate larger dataset for performance testing (50+ groups)
    const groupCount = 55
    
    return Array.from({ length: groupCount }, (_, index) => {
      const subject = subjects[index % subjects.length]
      const level = levels[index % levels.length]
      const status = statuses[index % statuses.length]
      const groupType = groupTypes[index % groupTypes.length]
      const year = 2024
      const groupCode = generateGroupCode(subject, level, year)
      
      const maxStudents = 15 + (index % 20) // 15-34 students capacity
      const currentEnrollment = Math.min(
        maxStudents,
        Math.floor(maxStudents * (0.4 + Math.random() * 0.6)) // 40-100% filled
      )
      
      const schedule = generateSchedule()
      const startDate = new Date(2024, (index % 12), (index % 28) + 1)
      const endDate = new Date(startDate)
      endDate.setMonth(startDate.getMonth() + 3) // 3-month courses
      
      const price = [500000, 600000, 750000, 850000, 1000000][Math.floor(Math.random() * 5)] // UZS

      return {
        id: `group-${index + 1}`,
        organization_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: `${subject} ${level} Group ${String.fromCharCode(65 + (index % 26))}`,
        group_code: groupCode,
        subject,
        level,
        group_type: groupType,
        description: `${subject} course for ${level.toLowerCase()} level students. Comprehensive curriculum covering all essential topics.`,
        max_students: maxStudents,
        current_enrollment: currentEnrollment,
        waiting_list_count: Math.random() > 0.8 ? Math.floor(Math.random() * 5) : 0,
        schedule,
        classroom: schedule[0]?.room,
        online_meeting_url: groupType === 'online' || groupType === 'hybrid' 
          ? `https://zoom.us/j/${Math.floor(Math.random() * 1000000000)}` 
          : undefined,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        duration_weeks: 12,
        price_per_student: price,
        currency: 'UZS',
        payment_frequency: 'monthly',
        curriculum: {
          topics: [`${subject} fundamentals`, `${subject} practice`, `${subject} assessment`],
          books: [`${subject} Textbook Level ${level}`, `${subject} Workbook`]
        },
        required_materials: {
          books: [`${subject} Student Book`, `${subject} Workbook`],
          supplies: ['Notebook', 'Pen', 'Dictionary']
        },
        status,
        is_active: status === 'active',
        notes: index % 5 === 0 ? `Special notes for ${subject} ${level} group` : undefined,
        created_at: new Date(2024, 0, index + 1).toISOString(),
        updated_at: new Date().toISOString()
      } as Group
    })
  }

  /**
   * Simulate API delay
   */
  private async delay(ms: number = 300): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Performance measurement wrapper
   */
  private measurePerformance<T>(operation: string, fn: () => T): T {
    const startTime = performance.now()
    const result = fn()
    const endTime = performance.now()
    const duration = endTime - startTime
    
    this.metrics.queryCount++
    this.metrics.averageQueryTime = 
      (this.metrics.averageQueryTime * (this.metrics.queryCount - 1) + duration) / this.metrics.queryCount
    
    return result
  }
  
  /**
   * Get cached result or compute
   */
  private getCached<T>(key: string, computeFn: () => T, ttl: number = this.CACHE_TTL): T {
    const cached = this.queryCache.get(key)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp) < cached.ttl) {
      cached.accessCount++
      this.metrics.cacheHitRate = this.calculateCacheHitRate()
      return cached.data as T
    }
    
    if (this.queryCache.size > this.MAX_CACHE_SIZE) {
      this.cleanupCache()
    }
    
    const result = computeFn()
    this.queryCache.set(key, {
      data: result,
      timestamp: now,
      ttl,
      accessCount: 1
    })
    
    return result
  }
  
  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    let totalHits = 0
    let totalAccess = 0
    
    this.queryCache.forEach(entry => {
      totalAccess += entry.accessCount
      totalHits += entry.accessCount - 1
    })
    
    return totalAccess > 0 ? (totalHits / totalAccess) * 100 : 0
  }
  
  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now()
    const toDelete: string[] = []
    
    this.queryCache.forEach((entry, key) => {
      if ((now - entry.timestamp) > entry.ttl) {
        toDelete.push(key)
      }
    })
    
    toDelete.forEach(key => this.queryCache.delete(key))
  }
  
  /**
   * Invalidate cache
   */
  private invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.queryCache.clear()
      this.relationshipCache.clear()
      this.scheduleConflictCache.clear()
      this.enrollmentCache.clear()
      return
    }
    
    const toDelete: string[] = []
    this.queryCache.forEach((_, key) => {
      if (key.includes(pattern)) {
        toDelete.push(key)
      }
    })
    toDelete.forEach(key => this.queryCache.delete(key))
  }

  /**
   * Convert enhanced groups to table rows
   */
  private groupsToTableRows(groups: GroupWithDetails[]): GroupTableRow[] {
    return groups.map(group => ({
      id: group.id,
      name: group.name,
      group_code: group.group_code,
      subject: group.subject,
      level: group.level,
      teacher_name: group.teacher_name,
      teacher_id: group.teacher?.id,
      max_students: group.max_students,
      current_enrollment: group.current_enrollment,
      enrollment_percentage: group.enrollment_percentage,
      status: group.status,
      start_date: group.start_date,
      schedule_summary: group.schedule_summary,
      is_active: group.is_active
    }))
  }

  /**
   * Get all groups with optimized filtering, searching, and pagination
   */
  async getAll(
    filters?: any,
    sortConfig?: any,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    data: GroupTableRow[]
    count: number
    total_pages: number
    current_page: number
    page_size: number
  }> {
    // Generate cache key
    const cacheKey = `getAll:${JSON.stringify({ filters, sortConfig, page, pageSize })}`
    
    return this.measurePerformance('query', () => {
      return this.getCached(cacheKey, () => {
        let candidateIds: Set<string> | null = null
        
        // Use search index for fast filtering
        if (filters?.search) {
          candidateIds = this.fastGroupSearch(filters.search)
        }
        
        // Apply index-based filters
        if (filters?.subject?.length) {
          const subjectCandidates = new Set<string>()
          filters.subject.forEach((subject: string) => {
            const subjectIds = this.searchIndex.bySubject.get(subject)
            if (subjectIds) {
              subjectIds.forEach(id => subjectCandidates.add(id))
            }
          })
          candidateIds = candidateIds ? 
            new Set([...candidateIds].filter(id => subjectCandidates.has(id))) : 
            subjectCandidates
        }
        
        if (filters?.level?.length) {
          const levelCandidates = new Set<string>()
          filters.level.forEach((level: string) => {
            const levelIds = this.searchIndex.byLevel.get(level)
            if (levelIds) {
              levelIds.forEach(id => levelCandidates.add(id))
            }
          })
          candidateIds = candidateIds ? 
            new Set([...candidateIds].filter(id => levelCandidates.has(id))) : 
            levelCandidates
        }
        
        if (filters?.status?.length) {
          const statusCandidates = new Set<string>()
          filters.status.forEach((status: string) => {
            const statusIds = this.searchIndex.byStatus.get(status)
            if (statusIds) {
              statusIds.forEach(id => statusCandidates.add(id))
            }
          })
          candidateIds = candidateIds ? 
            new Set([...candidateIds].filter(id => statusCandidates.has(id))) : 
            statusCandidates
        }
        
        // Get base dataset
        let filteredGroups: Group[]
        if (candidateIds && candidateIds.size > 0) {
          const groupMap = new Map(this.groups.map(g => [g.id, g]))
          filteredGroups = [...candidateIds]
            .map(id => groupMap.get(id)!)
            .filter(Boolean)
        } else if (candidateIds && candidateIds.size === 0) {
          filteredGroups = []
        } else {
          filteredGroups = [...this.groups]
        }
        
        // Apply complex filters
        filteredGroups = this.applyGroupComplexFilters(filteredGroups, filters)
        
        // Enhance with optimized relationship data
        const enhancedGroups = this.enhanceGroupsOptimizedSync(filteredGroups)
        
        // Convert to table rows
        let tableRows = this.groupsToTableRows(enhancedGroups)
        
        // Apply optimized sorting
        if (sortConfig) {
          tableRows = this.applyGroupSorting(tableRows, sortConfig)
        }
        
        // Apply pagination
        const totalCount = tableRows.length
        const totalPages = Math.ceil(totalCount / pageSize)
        const startIndex = (page - 1) * pageSize
        const endIndex = startIndex + pageSize
        const paginatedRows = tableRows.slice(startIndex, endIndex)
        
        return {
          data: paginatedRows,
          count: totalCount,
          total_pages: totalPages,
          current_page: page,
          page_size: pageSize
        }
      })
    })
  }
  
  /**
   * Fast group search using indexes
   */
  private fastGroupSearch(query: string): Set<string> {
    const results = new Set<string>()
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1)
    
    for (const term of searchTerms) {
      // Search in name index
      this.searchIndex.byName.forEach((ids, indexedTerm) => {
        if (indexedTerm.includes(term) || term.includes(indexedTerm)) {
          ids.forEach(id => results.add(id))
        }
      })
      
      // Search by group code
      this.searchIndex.byGroupCode.forEach((id, code) => {
        if (code.toLowerCase().includes(term)) {
          results.add(id)
        }
      })
    }
    
    return results
  }
  
  /**
   * Apply complex filters that can't be indexed
   */
  private applyGroupComplexFilters(groups: Group[], filters?: any): Group[] {
    if (!filters) return groups
    
    return groups.filter(group => {
      if (filters.is_active !== undefined && group.is_active !== filters.is_active) {
        return false
      }
      
      if (filters.has_capacity !== undefined && filters.has_capacity) {
        if (group.current_enrollment >= group.max_students) {
          return false
        }
      }
      
      if (filters.start_date_from || filters.start_date_to) {
        const startDate = new Date(group.start_date)
        if (filters.start_date_from && startDate < filters.start_date_from) return false
        if (filters.start_date_to && startDate > filters.start_date_to) return false
      }
      
      return true
    })
  }
  
  /**
   * Synchronous optimized group enhancement
   */
  private enhanceGroupsOptimizedSync(groups: Group[]): GroupWithDetails[] {
    return groups.map(group => {
      const teacherCacheKey = `teacher-assignment-${group.id}`
      const assignedTeacher = this.relationshipCache.get(teacherCacheKey)
      
      const enrollmentStats = this.calculateEnrollmentStats(group.id)
      
      const scheduleCacheKey = `schedule-${group.id}`
      let scheduleSummary = this.relationshipCache.get(scheduleCacheKey)
      
      if (!scheduleSummary) {
        scheduleSummary = group.schedule
          .map(slot => `${slot.day.charAt(0).toUpperCase() + slot.day.slice(1)} ${slot.start_time}-${slot.end_time}`)
          .join(', ')
        this.relationshipCache.set(scheduleCacheKey, scheduleSummary)
      }

      return {
        ...group,
        teacher_name: assignedTeacher?.full_name,
        teacher_count: assignedTeacher ? 1 : 0,
        enrollment_percentage: enrollmentStats.percentage,
        schedule_summary: scheduleSummary,
        can_enroll: enrollmentStats.canEnroll,
        is_full: enrollmentStats.isFull
      } as GroupWithDetails
    })
  }
  
  /**
   * Apply optimized sorting
   */
  private applyGroupSorting(tableRows: GroupTableRow[], sortConfig: any): GroupTableRow[] {
    const rowsWithSortValues = tableRows.map(row => ({
      row,
      sortValue: this.getGroupSortValue(row, sortConfig.field)
    }))
    
    rowsWithSortValues.sort((a, b) => {
      if (a.sortValue === undefined && b.sortValue === undefined) return 0
      if (a.sortValue === undefined) return 1
      if (b.sortValue === undefined) return -1
      
      let comparison = 0
      if (typeof a.sortValue === 'string' && typeof b.sortValue === 'string') {
        comparison = a.sortValue.localeCompare(b.sortValue)
      } else {
        comparison = a.sortValue < b.sortValue ? -1 : a.sortValue > b.sortValue ? 1 : 0
      }
      
      return sortConfig.direction === 'desc' ? -comparison : comparison
    })
    
    return rowsWithSortValues.map(item => item.row)
  }
  
  /**
   * Get sort value for group field
   */
  private getGroupSortValue(row: GroupTableRow, field: string): any {
    switch (field) {
      case 'name':
        return row.name.toLowerCase()
      case 'subject':
        return row.subject.toLowerCase()
      case 'teacher_name':
        return (row.teacher_name || '').toLowerCase()
      default:
        return row[field as keyof GroupTableRow]
    }
  }

  /**
   * Get group by ID with full details
   */
  async getById(id: string): Promise<GroupWithDetails | null> {
    await this.delay()
    const group = this.groups.find(g => g.id === id)
    
    if (!group) return null
    
    const enhanced = await this.enhanceGroups([group])
    return enhanced[0]
  }

  /**
   * Create a new group
   */
  async create(groupData: CreateGroupRequest): Promise<Group> {
    await this.delay(500)

    const newGroup: Group = {
      id: `group-new-${this.nextId++}`,
      organization_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: groupData.name,
      group_code: groupData.group_code,
      subject: groupData.subject,
      level: groupData.level,
      group_type: groupData.group_type,
      description: groupData.description,
      max_students: groupData.max_students,
      current_enrollment: 0,
      waiting_list_count: 0,
      schedule: groupData.schedule,
      classroom: groupData.classroom,
      online_meeting_url: groupData.online_meeting_url,
      start_date: groupData.start_date,
      end_date: groupData.end_date,
      duration_weeks: groupData.duration_weeks,
      price_per_student: groupData.price_per_student,
      currency: groupData.currency || 'UZS',
      payment_frequency: groupData.payment_frequency,
      curriculum: groupData.curriculum,
      required_materials: groupData.required_materials,
      status: 'upcoming',
      is_active: true,
      notes: groupData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.groups.push(newGroup)
    return newGroup
  }

  /**
   * Update an existing group
   */
  async update(id: string, groupData: any): Promise<Group> {
    await this.delay(500)

    const groupIndex = this.groups.findIndex(g => g.id === id)
    if (groupIndex === -1) {
      throw new Error('Group not found')
    }

    const existingGroup = this.groups[groupIndex]
    const updatedGroup = {
      ...existingGroup,
      ...groupData,
      updated_at: new Date().toISOString()
    } as Group

    this.groups[groupIndex] = updatedGroup
    return updatedGroup
  }

  /**
   * Delete a group (soft delete simulation)
   */
  async delete(id: string): Promise<Group> {
    await this.delay()

    const groupIndex = this.groups.findIndex(g => g.id === id)
    if (groupIndex === -1) {
      throw new Error('Group not found')
    }

    const group = this.groups[groupIndex]
    const deletedGroup = {
      ...group,
      is_active: false,
      status: 'cancelled',
      updated_at: new Date().toISOString()
    } as Group

    this.groups[groupIndex] = deletedGroup
    return deletedGroup
  }

  /**
   * Bulk delete groups
   */
  async bulkDelete(ids: string[]): Promise<{ success: number; errors: string[] }> {
    await this.delay(700)

    const results = { success: 0, errors: [] as string[] }

    for (const id of ids) {
      try {
        await this.delete(id)
        results.success++
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        results.errors.push(`Failed to delete group ${id}: ${message}`)
      }
    }

    return results
  }

  /**
   * Get group statistics with caching
   */
  async getStatistics(): Promise<GroupStatistics> {
    return this.measurePerformance('statistics', () => {
      const cacheKey = 'group-statistics'
      
      return this.getCached(cacheKey, () => {
        const stats: GroupStatistics = {
          total_groups: this.groups.length,
          active_groups: this.searchIndex.byStatus.get('active')?.size || 0,
          upcoming_groups: this.searchIndex.byStatus.get('upcoming')?.size || 0,
          completed_groups: this.searchIndex.byStatus.get('completed')?.size || 0,
          total_capacity: this.groups.reduce((sum, g) => sum + g.max_students, 0),
          total_enrollment: this.groups.reduce((sum, g) => sum + g.current_enrollment, 0),
          enrollment_rate: 0,
          by_subject: {},
          by_level: {},
          by_status: {}
        }
        
        stats.enrollment_rate = stats.total_capacity > 0 
          ? Math.round((stats.total_enrollment / stats.total_capacity) * 100)
          : 0
        
        // Use index data for faster aggregation
        this.searchIndex.bySubject.forEach((ids, subject) => {
          stats.by_subject[subject] = ids.size
        })
        
        this.searchIndex.byLevel.forEach((ids, level) => {
          stats.by_level[level] = ids.size
        })
        
        this.searchIndex.byStatus.forEach((ids, status) => {
          stats.by_status[status] = ids.size
        })
        
        return stats
      }, this.RELATIONSHIP_CACHE_TTL)
    })
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): GroupPerformanceMetrics {
    return { ...this.metrics }
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { queryCache: number; relationshipCache: number; scheduleCache: number; enrollmentCache: number; hitRate: number } {
    return {
      queryCache: this.queryCache.size,
      relationshipCache: this.relationshipCache.size,
      scheduleCache: this.scheduleConflictCache.size,
      enrollmentCache: this.enrollmentCache.size,
      hitRate: this.calculateCacheHitRate()
    }
  }
  
  /**
   * Clear all caches
   */
  clearCache(): void {
    this.queryCache.clear()
    this.relationshipCache.clear()
    this.scheduleConflictCache.clear()
    this.enrollmentCache.clear()
  }
  
  /**
   * Check for schedule conflicts (optimized)
   */
  async checkScheduleConflicts(schedule: ScheduleSlot[], excludeGroupId?: string): Promise<boolean> {
    const cacheKey = `conflict-${JSON.stringify(schedule)}-${excludeGroupId || 'none'}`
    const cached = this.scheduleConflictCache.get(cacheKey)
    
    if (cached !== undefined) {
      return cached
    }
    
    const hasConflict = this.checkScheduleConflict(schedule, excludeGroupId)
    this.scheduleConflictCache.set(cacheKey, hasConflict)
    
    return hasConflict
  }
  
  /**
   * Get filter options (cached)
   */
  async getFilterOptions(): Promise<{
    subjects: string[]
    levels: string[]
    statuses: string[]
    classrooms: string[]
  }> {
    const cacheKey = 'group-filter-options'
    
    return this.getCached(cacheKey, () => {
      return {
        subjects: Array.from(this.searchIndex.bySubject.keys()),
        levels: Array.from(this.searchIndex.byLevel.keys()),
        statuses: Array.from(this.searchIndex.byStatus.keys()),
        classrooms: Array.from(this.searchIndex.byClassroom.keys())
      }
    }, this.RELATIONSHIP_CACHE_TTL)
  }
  
  /**
   * Reset with performance optimization
   */
  reset(): void {
    this.groups = this.generateMockGroups()
    this.nextId = this.groups.length + 1
    this.searchIndex = this.buildGroupSearchIndex()
    this.clearCache()
    
    // Reset metrics
    this.metrics = {
      queryCount: 0,
      averageQueryTime: 0,
      cacheHitRate: 0,
      scheduleConflictChecks: 0,
      averageConflictCheckTime: 0,
      enrollmentCalculations: 0,
      averageEnrollmentTime: 0
    }
    
    // Reinitialize optimizations
    this.preloadRelationships()
    this.warmupGroupCache()
  }
}

// Export singleton instance
export const mockGroupService = MockGroupService.getInstance()