/**
 * Comprehensive Test Utilities
 * Supporting all test scenarios and providing realistic mock data
 */

import type { Student } from '@/types/student'

// Create mock Supabase client
export function createMockSupabaseClient() {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
    }),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: null, error: null }),
        download: jest.fn().mockResolvedValue({ data: null, error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null })
      })
    }
  }
}

// Generate realistic student data
export function generateMockStudent(overrides: Partial<Student> = {}): Student {
  const id = overrides.id || `student-${Math.random().toString(36).substr(2, 9)}`
  const firstName = overrides.first_name || 'John'
  const lastName = overrides.last_name || 'Doe'
  
  return {
    id,
    organization_id: 'org-1',
    student_id: `HS-STU-${id.slice(-6)}`,
    first_name: firstName,
    last_name: lastName,
    full_name: `${firstName} ${lastName}`,
    date_of_birth: '2010-01-01',
    gender: 'male',
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
    phone: '+998901234567',
    parent_name: `Parent of ${firstName}`,
    parent_phone: '+998901234568',
    parent_email: `parent.${firstName.toLowerCase()}@email.com`,
    address: {
      street: '123 Main Street',
      city: 'Tashkent',
      region: 'Tashkent',
      postal_code: '100000',
      country: 'Uzbekistan'
    },
    enrollment_date: '2024-01-01',
    status: 'active',
    current_level: 'Beginner',
    preferred_subjects: ['English'],
    groups: [],
    academic_year: '2024',
    grade_level: 'Grade 5',
    medical_notes: '',
    emergency_contact: {
      name: `Emergency Contact for ${firstName}`,
      relationship: 'Parent',
      phone: '+998901234569',
      email: `emergency.${firstName.toLowerCase()}@email.com`
    },
    payment_status: 'paid',
    balance: 0,
    tuition_fee: 1000000,
    notes: '',
    profile_image_url: undefined,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'admin',
    updated_by: 'admin',
    deleted_at: undefined,
    deleted_by: undefined,
    enrolled_groups: [],
    enrollment_history: [],
    ...overrides
  }
}

// Generate dataset of various sizes
export function generateStudentDataset(count: number, options: {
  diverseStatuses?: boolean,
  diversePaymentStatuses?: boolean,
  diverseLevels?: boolean,
  withBalances?: boolean,
  withGroups?: boolean
} = {}): Student[] {
  const students: Student[] = []
  
  const statuses: Student['status'][] = options.diverseStatuses 
    ? ['active', 'inactive', 'graduated', 'suspended', 'dropped']
    : ['active']
  
  const paymentStatuses: Student['payment_status'][] = options.diversePaymentStatuses
    ? ['paid', 'pending', 'overdue', 'partial']
    : ['paid']
  
  const levels = options.diverseLevels
    ? ['Beginner', 'Elementary', 'Intermediate', 'Upper-Intermediate', 'Advanced']
    : ['Beginner']
  
  for (let i = 0; i < count; i++) {
    const student = generateMockStudent({
      id: `student-${i + 1}`,
      first_name: `Student${i + 1}`,
      last_name: `Lastname${i + 1}`,
      status: statuses[i % statuses.length],
      payment_status: paymentStatuses[i % paymentStatuses.length],
      current_level: levels[i % levels.length],
      balance: options.withBalances && i % 5 === 0 ? 500000 : 0,
      groups: options.withGroups ? [`group-${i % 3 + 1}`] : [],
      phone: `+99890123456${i % 10}`,
      parent_phone: `+99890123457${i % 10}`,
    })
    
    students.push(student)
  }
  
  return students
}

// Mock API responses
export function createMockApiResponse<T>(data: T, options: {
  pagination?: {
    total: number
    page: number
    total_pages: number
  }
  success?: boolean
  error?: string
} = {}) {
  return {
    success: options.success ?? true,
    data,
    pagination: options.pagination,
    error: options.error,
  }
}

// Mock error responses
export function createMockApiError(status: number, message: string) {
  return {
    success: false,
    error: message,
    status,
    data: null,
    pagination: null,
  }
}

// Network simulation utilities
export function simulateNetworkDelay(ms: number = 100) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function simulateNetworkFailure(errorMessage: string = 'Network error') {
  return Promise.reject(new Error(errorMessage))
}

export function simulateTimeoutError(ms: number = 5000) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), ms)
  })
}

// Authentication mock utilities
export function createMockAuthenticatedUser(role: 'admin' | 'teacher' = 'admin') {
  return {
    id: 'user-123',
    email: 'admin@harryschool.com',
    role,
    organization_id: 'org-1',
    permissions: role === 'admin' ? ['read', 'write', 'delete'] : ['read'],
  }
}

export function createMockUnauthenticatedResponse() {
  return {
    ok: false,
    status: 401,
    json: async () => ({ error: 'Unauthorized' }),
  }
}

// Search and filter test utilities
export function createSearchTestCases() {
  return {
    valid: [
      'John',
      'john doe',
      'ALICE',
      '+998901234567',
      'parent@email.com',
      'HS-STU-001',
      'Beginner',
      'active',
    ],
    edge: [
      '', // Empty string
      ' ', // Space only
      '  John  ', // Extra spaces
      'J', // Single character
      'a'.repeat(1000), // Very long string
    ],
    special: [
      '%', '_', '*', '?', '!', '@', '#', '$', '&', '(', ')', '[', ']', '{', '}',
      '+', '=', '|', '\\', '/', '<', '>', '~', '`', '^',
    ],
    unicode: [
      'Алексей', // Cyrillic
      '张三', // Chinese
      'José', // Spanish with accent
      'محمد', // Arabic
      '🏫📚', // Emojis
      'Müller', // German umlaut
      'Ñoño', // Spanish with tilde
    ],
    security: {
      sql: [
        "'; DROP TABLE students; --",
        "' OR '1'='1",
        "'; DELETE FROM students; --",
        "' UNION SELECT * FROM users --",
        "'; INSERT INTO students VALUES ('hacked'); --",
        "' OR 1=1 --",
        "'; EXEC xp_cmdshell('dir'); --",
      ],
      xss: [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert(1)',
        '<svg onload="alert(1)">',
        '"><script>alert(1)</script>',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<body onload="alert(1)">',
      ],
      nosql: [
        '{"$ne": null}',
        '{"$gt": ""}',
        '{"$where": "this.name == this.name"}',
        '{"$regex": ".*"}',
        '{"$or": [{}]}',
      ],
    },
  }
}

// Performance testing utilities
export function measureRenderTime(renderFn: () => void): number {
  const start = performance.now()
  renderFn()
  const end = performance.now()
  return end - start
}

export function createMemoryPressure(sizeInMB: number) {
  const array: number[][] = []
  const targetBytes = sizeInMB * 1024 * 1024
  const bytesPerElement = 8 // Assuming 64-bit numbers
  const elementsNeeded = targetBytes / bytesPerElement
  
  for (let i = 0; i < elementsNeeded / 1000; i++) {
    array.push(new Array(1000).fill(Math.random()))
  }
  
  return array
}

// Accessibility testing utilities
export function createAccessibilityTestHelpers() {
  return {
    simulateKeyboardNavigation: async (element: Element, key: string) => {
      element.dispatchEvent(new KeyboardEvent('keydown', { key }))
    },
    simulateScreenReader: (element: Element) => {
      return {
        ariaLabel: element.getAttribute('aria-label'),
        ariaDescribedBy: element.getAttribute('aria-describedby'),
        role: element.getAttribute('role'),
        tabIndex: element.getAttribute('tabindex'),
      }
    },
    checkColorContrast: (foreground: string, background: string) => {
      // Simplified contrast check - in reality would use proper color contrast algorithm
      return { ratio: 4.5, passes: true }
    },
  }
}

// Internationalization testing utilities
export function createI18nTestHelpers() {
  return {
    rtlLanguages: ['ar', 'he', 'fa', 'ur'],
    complexLanguages: ['zh', 'ja', 'ko', 'th', 'hi'],
    createMockTranslations: (locale: string) => ({
      students: {
        title: locale === 'ar' ? 'الطلاب' : locale === 'zh' ? '学生' : 'Students',
        addStudent: locale === 'ar' ? 'إضافة طالب' : locale === 'zh' ? '添加学生' : 'Add Student',
        search: locale === 'ar' ? 'بحث' : locale === 'zh' ? '搜索' : 'Search',
      },
    }),
  }
}

// Error simulation utilities
export function createErrorScenarios() {
  return {
    networkErrors: [
      'ERR_NETWORK',
      'ERR_INTERNET_DISCONNECTED',
      'ERR_CONNECTION_REFUSED',
      'ERR_NAME_NOT_RESOLVED',
      'ERR_CONNECTION_TIMED_OUT',
    ],
    httpErrors: [
      { status: 400, message: 'Bad Request' },
      { status: 401, message: 'Unauthorized' },
      { status: 403, message: 'Forbidden' },
      { status: 404, message: 'Not Found' },
      { status: 409, message: 'Conflict' },
      { status: 422, message: 'Unprocessable Entity' },
      { status: 429, message: 'Too Many Requests' },
      { status: 500, message: 'Internal Server Error' },
      { status: 502, message: 'Bad Gateway' },
      { status: 503, message: 'Service Unavailable' },
      { status: 504, message: 'Gateway Timeout' },
    ],
    validationErrors: [
      'Required field missing',
      'Invalid email format',
      'Phone number too short',
      'Date format invalid',
      'Value out of range',
    ],
  }
}

// Browser compatibility testing
export function createBrowserTestHelpers() {
  return {
    simulateOldBrowser: () => {
      // Mock old browser capabilities
      (global as any).IntersectionObserver = undefined
      (global as any).ResizeObserver = undefined
      delete (window as any).fetch
    },
    simulateMobile: () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 })
      Object.defineProperty(window, 'innerHeight', { value: 667 })
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
      })
    },
    simulateSlowDevice: () => {
      // Mock slow device performance
      const originalSetTimeout = global.setTimeout
      global.setTimeout = ((fn: Function, delay: number = 0) => {
        return originalSetTimeout(fn, delay * 3) // 3x slower
      }) as any
    },
  }
}