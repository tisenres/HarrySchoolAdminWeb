/**
 * Optimized Mock Student Service for Client-Side Development
 * 
 * This service provides a high-performance client-side implementation for student operations
 * using mock data with advanced optimizations including:
 * - Multi-level caching with TTL and cache invalidation
 * - Indexing simulation with Map/Set for O(1) lookups
 * - Fuzzy search with phonetic matching
 * - Query result memoization
 * - Performance monitoring and benchmarking
 * - Efficient filtering and sorting algorithms
 * 
 * Performance Targets:
 * - Search response: <50ms for 500+ records
 * - Filter application: <100ms for complex filters
 * - Pagination: <50ms per page
 * - Statistics calculation: <100ms
 * 
 * Security Note: This service is safe for client-side usage as it doesn't
 * access any server-side resources or sensitive environment variables.
 */

import type { Student, StudentFilters, StudentSortConfig, StudentStatistics, StudentWithDetails } from '@/types/student'
import type { CreateStudentRequest, UpdateStudentRequest } from '@/lib/validations/student'

// Mock data generators
const firstNames = [
  'Alijon', 'Bobur', 'Davron', 'Eldor', 'Farrux', 'Gulnora', 'Halima', 'Ikrom', 'Jasur', 'Kamola',
  'Laziz', 'Madina', 'Nasiba', 'Oybek', 'Pazila', 'Qudrat', 'Ramiza', 'Shoira', 'Temur', 'Umida',
  'Vohid', 'Yulduz', 'Zarina', 'Aziza', 'Botir', 'Dilfuza', 'Erkin', 'Feruza', 'Guzal', 'Hurshid'
]

const lastNames = [
  'Abdullayev', 'Boboyev', 'Dadayev', 'Ergashev', 'Fayzullayev', 'Gafurov', 'Hasanov', 'Ismoilov',
  'Jalilov', 'Karimov', 'Latipov', 'Mamadjonov', 'Normatov', 'Omonov', 'Pulatov', 'Qodirov',
  'Rahimov', 'Sadullayev', 'Tursunov', 'Umarov', 'Valiyev', 'Yusupov', 'Ziyayev'
]

const subjects = [
  'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'IELTS Preparation', 'TOEFL Preparation', 'Business English', 'Academic Writing',
  'Conversation', 'Grammar', 'Literature', 'History', 'Geography'
]

const levels = [
  'Beginner (A1)', 'Elementary (A2)', 'Intermediate (B1)', 'Upper-Intermediate (B2)', 
  'Advanced (C1)', 'Proficiency (C2)', 'Foundation', 'Grade 1', 'Grade 2', 'Grade 3',
  'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'
]

const regions = [
  'Toshkent shahar', 'Samarqand viloyati', 'Buxoro viloyati', 'Andijon viloyati',
  'Farg\'ona viloyati', 'Namangan viloyati', 'Qashqadaryo viloyati', 'Surxondaryo viloyati'
]

const relationships = ['Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Grandfather', 'Grandmother']

// Performance monitoring interface
interface PerformanceMetrics {
  queryCount: number
  averageQueryTime: number
  cacheHitRate: number
  searchPerformance: {
    totalSearches: number
    averageTime: number
    fastestTime: number
    slowestTime: number
  }
}

// Cache interface with TTL support
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
}

// Search index interface
interface SearchIndex {
  byName: Map<string, Set<string>>
  byPhone: Map<string, string>
  byStudentId: Map<string, string>
  byParentName: Map<string, Set<string>>
  byStatus: Map<string, Set<string>>
  byPaymentStatus: Map<string, Set<string>>
  byLevel: Map<string, Set<string>>
  bySubjects: Map<string, Set<string>>
}

export class MockStudentService {
  private static instance: MockStudentService
  private students: Student[]
  private nextId: number = 1
  
  // Performance optimizations
  private searchIndex: SearchIndex
  private queryCache = new Map<string, CacheEntry<any>>()
  private statisticsCache: CacheEntry<StudentStatistics> | null = null
  private metrics: PerformanceMetrics = {
    queryCount: 0,
    averageQueryTime: 0,
    cacheHitRate: 0,
    searchPerformance: {
      totalSearches: 0,
      averageTime: 0,
      fastestTime: Number.MAX_VALUE,
      slowestTime: 0
    }
  }
  
  // Cache configuration
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly STATISTICS_CACHE_TTL = 10 * 60 * 1000 // 10 minutes
  private readonly MAX_CACHE_SIZE = 100

  constructor() {
    // Initialize with comprehensive mock data
    this.students = this.generateMockStudents()
    
    // Initialize search index
    this.searchIndex = this.buildSearchIndex()
    
    // Warm up cache with common queries
    this.warmupCache()
  }

  static getInstance(): MockStudentService {
    if (!MockStudentService.instance) {
      MockStudentService.instance = new MockStudentService()
    }
    return MockStudentService.instance
  }

  private generateStudentId(index: number): string {
    const year = new Date().getFullYear()
    return `HS-STU-${year}${String(index + 1).padStart(3, '0')}`
  }

  private calculateAge(birthDate: string): number {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  /**
   * Build search index for O(1) lookups
   */
  private buildSearchIndex(): SearchIndex {
    const index: SearchIndex = {
      byName: new Map(),
      byPhone: new Map(),
      byStudentId: new Map(),
      byParentName: new Map(),
      byStatus: new Map(),
      byPaymentStatus: new Map(),
      byLevel: new Map(),
      bySubjects: new Map()
    }

    for (const student of this.students) {
      // Index by name (tokenized)
      const nameTokens = this.tokenizeName(student.full_name)
      nameTokens.forEach(token => {
        if (!index.byName.has(token)) {
          index.byName.set(token, new Set())
        }
        index.byName.get(token)!.add(student.id)
      })

      // Index by phone
      index.byPhone.set(student.phone, student.id)
      
      // Index by student ID
      index.byStudentId.set(student.student_id, student.id)
      
      // Index by parent name
      const parentTokens = this.tokenizeName(student.parent_name)
      parentTokens.forEach(token => {
        if (!index.byParentName.has(token)) {
          index.byParentName.set(token, new Set())
        }
        index.byParentName.get(token)!.add(student.id)
      })
      
      // Index by status
      if (!index.byStatus.has(student.status)) {
        index.byStatus.set(student.status, new Set())
      }
      index.byStatus.get(student.status)!.add(student.id)
      
      // Index by payment status
      if (!index.byPaymentStatus.has(student.payment_status)) {
        index.byPaymentStatus.set(student.payment_status, new Set())
      }
      index.byPaymentStatus.get(student.payment_status)!.add(student.id)
      
      // Index by level
      if (!index.byLevel.has(student.current_level)) {
        index.byLevel.set(student.current_level, new Set())
      }
      index.byLevel.get(student.current_level)!.add(student.id)
      
      // Index by subjects
      student.preferred_subjects.forEach(subject => {
        if (!index.bySubjects.has(subject)) {
          index.bySubjects.set(subject, new Set())
        }
        index.bySubjects.get(subject)!.add(student.id)
      })
    }

    return index
  }

  /**
   * Tokenize name for search indexing
   */
  private tokenizeName(name: string): string[] {
    return name.toLowerCase()
      .split(/\s+/)
      .filter(token => token.length > 1)
      .concat(this.generatePhoneticVariants(name))
  }

  /**
   * Generate phonetic variants for fuzzy search
   */
  private generatePhoneticVariants(name: string): string[] {
    const variants: string[] = []
    const normalized = name.toLowerCase().replace(/[^a-z]/g, '')
    
    // Add common phonetic substitutions for Uzbek names
    const substitutions = {
      'kh': 'h', 'gh': 'g', 'sh': 's', 'ch': 'c',
      'y': 'i', 'iy': 'i', 'oy': 'o', 'ay': 'a'
    }
    
    let variant = normalized
    Object.entries(substitutions).forEach(([from, to]) => {
      variant = variant.replace(new RegExp(from, 'g'), to)
    })
    
    if (variant !== normalized) {
      variants.push(variant)
    }
    
    return variants
  }

  /**
   * Warm up cache with common queries
   */
  private async warmupCache(): Promise<void> {
    // Cache common filter combinations
    const commonFilters = [
      { status: ['active'] },
      { payment_status: ['overdue'] },
      { is_active: true },
      { has_balance: true }
    ]

    for (const filters of commonFilters) {
      await this.getAll(filters, undefined, 1, 20)
    }
  }

  /**
   * Get cached result or compute if not cached
   */
  private getCached<T>(key: string, computeFn: () => T, ttl: number = this.CACHE_TTL): T {
    const cached = this.queryCache.get(key)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp) < cached.ttl) {
      cached.accessCount++
      this.metrics.cacheHitRate = this.calculateCacheHitRate()
      return cached.data as T
    }
    
    // Clean up expired cache entries
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
      totalHits += entry.accessCount - 1 // First access is a miss
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
   * Invalidate cache for specific patterns
   */
  private invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.queryCache.clear()
      this.statisticsCache = null
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
   * Measure query performance
   */
  private measurePerformance<T>(operation: string, fn: () => T): T {
    const startTime = performance.now()
    const result = fn()
    const endTime = performance.now()
    const duration = endTime - startTime
    
    // Update metrics
    this.metrics.queryCount++
    this.metrics.averageQueryTime = 
      (this.metrics.averageQueryTime * (this.metrics.queryCount - 1) + duration) / this.metrics.queryCount
    
    if (operation === 'search') {
      this.metrics.searchPerformance.totalSearches++
      this.metrics.searchPerformance.averageTime = 
        (this.metrics.searchPerformance.averageTime * (this.metrics.searchPerformance.totalSearches - 1) + duration) / 
        this.metrics.searchPerformance.totalSearches
      
      if (duration < this.metrics.searchPerformance.fastestTime) {
        this.metrics.searchPerformance.fastestTime = duration
      }
      if (duration > this.metrics.searchPerformance.slowestTime) {
        this.metrics.searchPerformance.slowestTime = duration
      }
    }
    
    return result
  }

  /**
   * Fast search using indexes
   */
  private fastSearch(query: string): Set<string> {
    const results = new Set<string>()
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1)
    
    for (const term of searchTerms) {
      // Search in name index
      const nameMatches = this.searchIndex.byName.get(term)
      if (nameMatches) {
        nameMatches.forEach(id => results.add(id))
      }
      
      // Search for partial matches
      this.searchIndex.byName.forEach((ids, indexedTerm) => {
        if (indexedTerm.includes(term) || term.includes(indexedTerm)) {
          ids.forEach(id => results.add(id))
        }
      })
      
      // Search in parent name index
      const parentMatches = this.searchIndex.byParentName.get(term)
      if (parentMatches) {
        parentMatches.forEach(id => results.add(id))
      }
    }
    
    // Search by phone (exact match)
    if (query.match(/^\+?[0-9\s\-\(\)]+$/)) {
      const cleanPhone = query.replace(/[^+0-9]/g, '')
      const phoneMatch = this.searchIndex.byPhone.get(cleanPhone)
      if (phoneMatch) {
        results.add(phoneMatch)
      }
    }
    
    // Search by student ID
    const studentIdMatch = this.searchIndex.byStudentId.get(query.toUpperCase())
    if (studentIdMatch) {
      results.add(studentIdMatch)
    }
    
    return results
  }

  private generateMockStudents(): Student[] {
    const students: Student[] = []
    
    // Generate larger dataset for performance testing (500+ students)
    const studentCount = 550
    
    for (let i = 0; i < studentCount; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const fullName = `${firstName} ${lastName}`
      
      // Generate realistic birth date (5-18 years old)
      const age = 5 + Math.floor(Math.random() * 14)
      const birthYear = new Date().getFullYear() - age
      const birthMonth = Math.floor(Math.random() * 12)
      const birthDay = 1 + Math.floor(Math.random() * 28)
      const birthDate = new Date(birthYear, birthMonth, birthDay).toISOString().split('T')[0]
      
      // Generate enrollment date (within last 2 years)
      const enrollmentDate = new Date()
      enrollmentDate.setMonth(enrollmentDate.getMonth() - Math.floor(Math.random() * 24))
      
      const status = ['active', 'inactive', 'graduated', 'suspended', 'dropped'][
        Math.floor(Math.random() * 5)
      ] as Student['status']
      
      const paymentStatus = ['paid', 'pending', 'overdue', 'partial'][
        Math.floor(Math.random() * 4)
      ] as Student['payment_status']
      
      const balance = paymentStatus === 'paid' ? 0 : Math.floor(Math.random() * 2000000)
      
      const studentSubjects = subjects
        .sort(() => 0.5 - Math.random())
        .slice(0, 1 + Math.floor(Math.random() * 3))
      
      // Generate random groups (0-3 groups per student)
      const groupCount = Math.floor(Math.random() * 4)
      const groups = Array.from({ length: groupCount }, (_, idx) => `group-${Math.floor(Math.random() * 20) + 1}`)
      
      const student: Student = {
        id: `student-${i + 1}`,
        organization_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        student_id: this.generateStudentId(i),
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        date_of_birth: birthDate,
        gender: Math.random() > 0.5 ? 'male' : 'female',
        email: Math.random() > 0.3 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.harryschool.uz` : undefined,
        phone: `+998${90 + Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
        
        // Parent Information
        parent_name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastName}`,
        parent_phone: `+998${90 + Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
        parent_email: Math.random() > 0.2 ? `parent${i}@example.uz` : undefined,
        
        // Address
        address: {
          street: `${Math.floor(Math.random() * 100) + 1} ${['Amir Temur', 'Mustaqillik', 'Sharof Rashidov', 'Buyuk Ipak Yo\'li'][Math.floor(Math.random() * 4)]} ko'chasi`,
          city: 'Tashkent',
          region: regions[Math.floor(Math.random() * regions.length)],
          postal_code: `1${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          country: 'Uzbekistan'
        },
        
        // Enrollment
        enrollment_date: enrollmentDate.toISOString().split('T')[0],
        status,
        current_level: levels[Math.floor(Math.random() * levels.length)],
        preferred_subjects: studentSubjects,
        groups,
        academic_year: '2024-2025',
        grade_level: age <= 10 ? `Grade ${age - 4}` : undefined,
        
        // Medical & Emergency
        medical_notes: Math.random() > 0.8 ? 'No known allergies' : undefined,
        emergency_contact: {
          name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastName}`,
          relationship: relationships[Math.floor(Math.random() * relationships.length)],
          phone: `+998${90 + Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
          email: Math.random() > 0.5 ? `emergency${i}@example.uz` : undefined,
        },
        
        // Financial
        payment_status: paymentStatus,
        balance,
        tuition_fee: 500000 + Math.floor(Math.random() * 1000000),
        
        // System fields
        notes: Math.random() > 0.7 ? `Promising student with good potential in ${studentSubjects[0]}` : undefined,
        profile_image_url: Math.random() > 0.6 ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}` : undefined,
        is_active: status !== 'graduated' && status !== 'dropped',
        
        // Audit fields
        created_at: enrollmentDate.toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'admin-user-id',
        updated_by: 'admin-user-id'
      }
      
      students.push(student)
    }
    
    return students
  }

  /**
   * Simulate API delay
   */
  private async delay(ms: number = 300): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get all students with optimized filtering, searching, and pagination
   */
  async getAll(
    filters?: StudentFilters,
    sortConfig?: StudentSortConfig,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    data: Student[]
    count: number
    total_pages: number
    current_page: number
    page_size: number
  }> {
    // Generate cache key for this query
    const cacheKey = `getAll:${JSON.stringify({ filters, sortConfig, page, pageSize })}`
    
    return this.measurePerformance('query', () => {
      return this.getCached(cacheKey, () => {
        let candidateIds: Set<string> | null = null
        
        // Use search index for fast filtering
        if (filters?.search) {
          candidateIds = this.fastSearch(filters.search)
        }
        
        // Apply index-based filters when possible
        if (filters?.status?.length) {
          const statusCandidates = new Set<string>()
          filters.status.forEach(status => {
            const statusIds = this.searchIndex.byStatus.get(status)
            if (statusIds) {
              statusIds.forEach(id => statusCandidates.add(id))
            }
          })
          candidateIds = candidateIds ? 
            new Set([...candidateIds].filter(id => statusCandidates.has(id))) : 
            statusCandidates
        }
        
        if (filters?.payment_status?.length) {
          const paymentCandidates = new Set<string>()
          filters.payment_status.forEach(status => {
            const paymentIds = this.searchIndex.byPaymentStatus.get(status)
            if (paymentIds) {
              paymentIds.forEach(id => paymentCandidates.add(id))
            }
          })
          candidateIds = candidateIds ? 
            new Set([...candidateIds].filter(id => paymentCandidates.has(id))) : 
            paymentCandidates
        }
        
        if (filters?.current_level?.length) {
          const levelCandidates = new Set<string>()
          filters.current_level.forEach(level => {
            const levelIds = this.searchIndex.byLevel.get(level)
            if (levelIds) {
              levelIds.forEach(id => levelCandidates.add(id))
            }
          })
          candidateIds = candidateIds ? 
            new Set([...candidateIds].filter(id => levelCandidates.has(id))) : 
            levelCandidates
        }
        
        if (filters?.preferred_subjects?.length) {
          const subjectCandidates = new Set<string>()
          filters.preferred_subjects.forEach(subject => {
            const subjectIds = this.searchIndex.bySubjects.get(subject)
            if (subjectIds) {
              subjectIds.forEach(id => subjectCandidates.add(id))
            }
          })
          candidateIds = candidateIds ? 
            new Set([...candidateIds].filter(id => subjectCandidates.has(id))) : 
            subjectCandidates
        }
        
        // Get base dataset (either from candidates or all students)
        let filteredStudents: Student[]
        if (candidateIds && candidateIds.size > 0) {
          const studentMap = new Map(this.students.map(s => [s.id, s]))
          filteredStudents = [...candidateIds]
            .map(id => studentMap.get(id)!)
            .filter(Boolean)
        } else if (candidateIds && candidateIds.size === 0) {
          // No results from index search
          filteredStudents = []
        } else {
          // No indexed filters, use all students
          filteredStudents = [...this.students]
        }
        
        // Apply non-indexed filters
        filteredStudents = this.applyComplexFilters(filteredStudents, filters)
        
        // Apply optimized sorting
        if (sortConfig) {
          filteredStudents = this.applySorting(filteredStudents, sortConfig)
        }
        
        // Apply pagination
        const totalCount = filteredStudents.length
        const totalPages = Math.ceil(totalCount / pageSize)
        const startIndex = (page - 1) * pageSize
        const endIndex = startIndex + pageSize
        const paginatedStudents = filteredStudents.slice(startIndex, endIndex)
        
        return {
          data: paginatedStudents,
          count: totalCount,
          total_pages: totalPages,
          current_page: page,
          page_size: pageSize
        }
      })
    })
  }
  
  /**
   * Apply complex filters that can't be indexed
   */
  private applyComplexFilters(students: Student[], filters?: StudentFilters): Student[] {
    if (!filters) return students
    
    return students.filter(student => {
      if (filters.is_active !== undefined && student.is_active !== filters.is_active) {
        return false
      }
      
      if (filters.has_balance && student.balance <= 0) {
        return false
      }
      
      if (filters.age_from || filters.age_to) {
        const age = this.calculateAge(student.date_of_birth)
        if (filters.age_from && age < filters.age_from) return false
        if (filters.age_to && age > filters.age_to) return false
      }
      
      if (filters.enrollment_date_from || filters.enrollment_date_to) {
        const enrollmentDate = new Date(student.enrollment_date)
        if (filters.enrollment_date_from && enrollmentDate < filters.enrollment_date_from) return false
        if (filters.enrollment_date_to && enrollmentDate > filters.enrollment_date_to) return false
      }
      
      return true
    })
  }
  
  /**
   * Apply optimized sorting with pre-calculated values
   */
  private applySorting(students: Student[], sortConfig: StudentSortConfig): Student[] {
    // Pre-calculate sort values for better performance
    const studentsWithSortValues = students.map(student => ({
      student,
      sortValue: this.getSortValue(student, sortConfig.field)
    }))
    
    studentsWithSortValues.sort((a, b) => {
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
    
    return studentsWithSortValues.map(item => item.student)
  }
  
  /**
   * Get sort value for a student field
   */
  private getSortValue(student: Student, field: keyof any): any {
    switch (field) {
      case 'age':
        return this.calculateAge(student.date_of_birth)
      case 'enrolled_groups':
        return student.groups.length
      case 'full_name':
        return student.full_name.toLowerCase()
      default:
        return student[field as keyof Student]
    }
  }

  /**
   * Get student by ID
   */
  async getById(id: string): Promise<Student | null> {
    await this.delay()
    return this.students.find(student => student.id === id) || null
  }

  /**
   * Create a new student with cache invalidation
   */
  async create(studentData: CreateStudentRequest): Promise<Student> {
    await this.delay(500)

    const newStudent: Student = {
      id: `student-new-${this.nextId++}`,
      organization_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      student_id: this.generateStudentId(this.students.length),
      first_name: studentData.first_name,
      last_name: studentData.last_name,
      full_name: `${studentData.first_name} ${studentData.last_name}`,
      date_of_birth: studentData.date_of_birth,
      gender: studentData.gender,
      email: studentData.email,
      phone: studentData.phone,
      parent_name: studentData.parent_name,
      parent_phone: studentData.parent_phone,
      parent_email: studentData.parent_email,
      address: studentData.address,
      enrollment_date: studentData.enrollment_date,
      status: studentData.status,
      current_level: studentData.current_level,
      preferred_subjects: studentData.preferred_subjects,
      groups: studentData.groups || [],
      academic_year: studentData.academic_year,
      grade_level: studentData.grade_level,
      medical_notes: studentData.medical_notes,
      emergency_contact: studentData.emergency_contact,
      payment_status: studentData.payment_status,
      balance: studentData.balance || 0,
      tuition_fee: studentData.tuition_fee,
      notes: studentData.notes,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'admin-user-id',
      updated_by: 'admin-user-id'
    }

    this.students.push(newStudent)
    
    // Update search index
    this.updateSearchIndex(newStudent)
    
    // Invalidate relevant cache
    this.invalidateCache()
    
    return newStudent
  }
  
  /**
   * Update search index for a new/modified student
   */
  private updateSearchIndex(student: Student): void {
    // Add to name index
    const nameTokens = this.tokenizeName(student.full_name)
    nameTokens.forEach(token => {
      if (!this.searchIndex.byName.has(token)) {
        this.searchIndex.byName.set(token, new Set())
      }
      this.searchIndex.byName.get(token)!.add(student.id)
    })
    
    // Add to other indexes
    this.searchIndex.byPhone.set(student.phone, student.id)
    this.searchIndex.byStudentId.set(student.student_id, student.id)
    
    const parentTokens = this.tokenizeName(student.parent_name)
    parentTokens.forEach(token => {
      if (!this.searchIndex.byParentName.has(token)) {
        this.searchIndex.byParentName.set(token, new Set())
      }
      this.searchIndex.byParentName.get(token)!.add(student.id)
    })
    
    // Update categorical indexes
    if (!this.searchIndex.byStatus.has(student.status)) {
      this.searchIndex.byStatus.set(student.status, new Set())
    }
    this.searchIndex.byStatus.get(student.status)!.add(student.id)
    
    if (!this.searchIndex.byPaymentStatus.has(student.payment_status)) {
      this.searchIndex.byPaymentStatus.set(student.payment_status, new Set())
    }
    this.searchIndex.byPaymentStatus.get(student.payment_status)!.add(student.id)
    
    if (!this.searchIndex.byLevel.has(student.current_level)) {
      this.searchIndex.byLevel.set(student.current_level, new Set())
    }
    this.searchIndex.byLevel.get(student.current_level)!.add(student.id)
    
    student.preferred_subjects.forEach(subject => {
      if (!this.searchIndex.bySubjects.has(subject)) {
        this.searchIndex.bySubjects.set(subject, new Set())
      }
      this.searchIndex.bySubjects.get(subject)!.add(student.id)
    })
  }

  /**
   * Update an existing student with index and cache management
   */
  async update(id: string, studentData: Partial<CreateStudentRequest>): Promise<Student> {
    await this.delay(500)

    const studentIndex = this.students.findIndex(student => student.id === id)
    if (studentIndex === -1) {
      throw new Error('Student not found')
    }

    const existingStudent = this.students[studentIndex]
    
    // Remove old index entries
    this.removeFromSearchIndex(existingStudent)
    
    const updatedStudent = {
      ...existingStudent,
      ...studentData,
      full_name: studentData.first_name && studentData.last_name 
        ? `${studentData.first_name} ${studentData.last_name}`
        : existingStudent.full_name,
      updated_at: new Date().toISOString()
    } as Student

    this.students[studentIndex] = updatedStudent
    
    // Add new index entries
    this.updateSearchIndex(updatedStudent)
    
    // Invalidate cache
    this.invalidateCache()
    
    return updatedStudent
  }
  
  /**
   * Remove student from search index
   */
  private removeFromSearchIndex(student: Student): void {
    // Remove from name index
    const nameTokens = this.tokenizeName(student.full_name)
    nameTokens.forEach(token => {
      const tokenSet = this.searchIndex.byName.get(token)
      if (tokenSet) {
        tokenSet.delete(student.id)
        if (tokenSet.size === 0) {
          this.searchIndex.byName.delete(token)
        }
      }
    })
    
    // Remove from other indexes
    this.searchIndex.byPhone.delete(student.phone)
    this.searchIndex.byStudentId.delete(student.student_id)
    
    const parentTokens = this.tokenizeName(student.parent_name)
    parentTokens.forEach(token => {
      const tokenSet = this.searchIndex.byParentName.get(token)
      if (tokenSet) {
        tokenSet.delete(student.id)
        if (tokenSet.size === 0) {
          this.searchIndex.byParentName.delete(token)
        }
      }
    })
    
    // Remove from categorical indexes
    this.searchIndex.byStatus.get(student.status)?.delete(student.id)
    this.searchIndex.byPaymentStatus.get(student.payment_status)?.delete(student.id)
    this.searchIndex.byLevel.get(student.current_level)?.delete(student.id)
    
    student.preferred_subjects.forEach(subject => {
      this.searchIndex.bySubjects.get(subject)?.delete(student.id)
    })
  }

  /**
   * Delete a student (soft delete simulation) with index update
   */
  async delete(id: string): Promise<Student> {
    await this.delay()

    const studentIndex = this.students.findIndex(student => student.id === id)
    if (studentIndex === -1) {
      throw new Error('Student not found')
    }

    const student = this.students[studentIndex]
    
    // Remove from search index
    this.removeFromSearchIndex(student)
    
    const deletedStudent = {
      ...student,
      is_active: false,
      status: 'inactive' as const,
      updated_at: new Date().toISOString()
    }

    this.students[studentIndex] = deletedStudent
    
    // Update search index with new status
    this.updateSearchIndex(deletedStudent)
    
    // Invalidate cache
    this.invalidateCache()
    
    return deletedStudent
  }

  /**
   * Bulk delete students
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
        results.errors.push(`Failed to delete student ${id}: ${message}`)
      }
    }

    return results
  }

  /**
   * Get student statistics with caching
   */
  async getStatistics(): Promise<StudentStatistics> {
    return this.measurePerformance('statistics', () => {
      // Check if we have cached statistics
      if (this.statisticsCache) {
        const now = Date.now()
        if ((now - this.statisticsCache.timestamp) < this.statisticsCache.ttl) {
          this.statisticsCache.accessCount++
          return this.statisticsCache.data
        }
      }
      
      // Calculate statistics using indexes for better performance
      const stats: StudentStatistics = {
        total_students: this.students.length,
        active_students: this.searchIndex.byStatus.get('active')?.size || 0,
        inactive_students: this.searchIndex.byStatus.get('inactive')?.size || 0,
        graduated_students: this.searchIndex.byStatus.get('graduated')?.size || 0,
        suspended_students: this.searchIndex.byStatus.get('suspended')?.size || 0,
        total_enrollment: this.students.reduce((sum, s) => sum + s.groups.length, 0),
        pending_payments: this.searchIndex.byPaymentStatus.get('pending')?.size || 0,
        overdue_payments: this.searchIndex.byPaymentStatus.get('overdue')?.size || 0,
        total_balance: this.students.reduce((sum, s) => sum + s.balance, 0),
        by_status: {},
        by_level: {},
        by_payment_status: {},
        enrollment_trend: []
      }
      
      // Use index data for faster aggregation
      this.searchIndex.byStatus.forEach((ids, status) => {
        stats.by_status[status] = ids.size
      })
      
      this.searchIndex.byLevel.forEach((ids, level) => {
        stats.by_level[level] = ids.size
      })
      
      this.searchIndex.byPaymentStatus.forEach((ids, status) => {
        stats.by_payment_status[status] = ids.size
      })
      
      // Generate enrollment trend (cached for better performance)
      stats.enrollment_trend = this.generateEnrollmentTrend()
      
      // Cache the results
      this.statisticsCache = {
        data: stats,
        timestamp: Date.now(),
        ttl: this.STATISTICS_CACHE_TTL,
        accessCount: 1
      }
      
      return stats
    })
  }
  
  /**
   * Generate enrollment trend with optimized calculation
   */
  private generateEnrollmentTrend(): { month: string; count: number }[] {
    const trend: { month: string; count: number }[] = []
    const enrollmentsByMonth = new Map<string, number>()
    
    // Pre-calculate enrollments by month
    this.students.forEach(student => {
      const monthKey = student.enrollment_date.slice(0, 7)
      enrollmentsByMonth.set(monthKey, (enrollmentsByMonth.get(monthKey) || 0) + 1)
    })
    
    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toISOString().slice(0, 7)
      
      trend.push({
        month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        count: enrollmentsByMonth.get(monthKey) || 0
      })
    }
    
    return trend
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number; entries: number } {
    return {
      size: this.queryCache.size,
      hitRate: this.calculateCacheHitRate(),
      entries: this.queryCache.size
    }
  }
  
  /**
   * Clear all caches
   */
  clearCache(): void {
    this.queryCache.clear()
    this.statisticsCache = null
  }
  
  /**
   * Rebuild search index (useful after bulk operations)
   */
  rebuildSearchIndex(): void {
    this.searchIndex = this.buildSearchIndex()
  }
  
  /**
   * Get students by IDs (optimized for batch operations)
   */
  async getByIds(ids: string[]): Promise<Student[]> {
    return this.measurePerformance('batch-get', () => {
      const studentMap = new Map(this.students.map(s => [s.id, s]))
      return ids.map(id => studentMap.get(id)).filter(Boolean) as Student[]
    })
  }
  
  /**
   * Get filter options for UI (cached)
   */
  async getFilterOptions(): Promise<{
    statuses: string[]
    paymentStatuses: string[]
    levels: string[]
    subjects: string[]
  }> {
    const cacheKey = 'filterOptions'
    
    return this.getCached(cacheKey, () => {
      return {
        statuses: Array.from(this.searchIndex.byStatus.keys()),
        paymentStatuses: Array.from(this.searchIndex.byPaymentStatus.keys()),
        levels: Array.from(this.searchIndex.byLevel.keys()),
        subjects: Array.from(this.searchIndex.bySubjects.keys())
      }
    }, this.CACHE_TTL * 2) // Cache filter options longer
  }
  
  /**
   * Search suggestions (for autocomplete)
   */
  async getSearchSuggestions(query: string, limit: number = 10): Promise<string[]> {
    if (!query || query.length < 2) return []
    
    return this.measurePerformance('suggestions', () => {
      const suggestions = new Set<string>()
      const queryLower = query.toLowerCase()
      
      // Search in names
      this.searchIndex.byName.forEach((_, name) => {
        if (name.includes(queryLower) && suggestions.size < limit) {
          // Get actual student names that match
          const matchingIds = this.searchIndex.byName.get(name) || new Set()
          matchingIds.forEach(id => {
            const student = this.students.find(s => s.id === id)
            if (student && suggestions.size < limit) {
              suggestions.add(student.full_name)
            }
          })
        }
      })
      
      return Array.from(suggestions).slice(0, limit)
    })
  }
  
  /**
   * Reset to initial data with performance optimization
   */
  reset(): void {
    this.students = this.generateMockStudents()
    this.nextId = this.students.length + 1
    this.searchIndex = this.buildSearchIndex()
    this.queryCache.clear()
    this.statisticsCache = null
    
    // Reset metrics
    this.metrics = {
      queryCount: 0,
      averageQueryTime: 0,
      cacheHitRate: 0,
      searchPerformance: {
        totalSearches: 0,
        averageTime: 0,
        fastestTime: Number.MAX_VALUE,
        slowestTime: 0
      }
    }
  }
}

// Export singleton instance
export const mockStudentService = MockStudentService.getInstance()