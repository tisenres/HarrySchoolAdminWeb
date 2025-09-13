/**
 * Test Environment Configuration
 * Handles critical environment setup for testing infrastructure
 */

// Mock createClient to avoid ES module issues in tests
const createClient = jest.fn()

// Test environment variables with fallbacks
export const TEST_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test',
}

// Environment validation - Critical for preventing runtime errors
export function validateTestEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Get current environment values (updated during tests)
  const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const currentKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const currentServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  // Check for critical environment variables that cause TypeError
  if (!currentUrl || currentUrl === 'https://test.supabase.co') {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not set - will cause Supabase TypeError')
  }
  
  if (!currentKey || currentKey === 'test-anon-key') {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set - will cause Supabase TypeError')
  }
  
  if (!currentServiceKey || currentServiceKey === 'test-service-key') {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is not set - Admin operations will fail')
  }
  
  // URL format validation
  if (currentUrl) {
    try {
      new URL(currentUrl)
    } catch {
      errors.push('NEXT_PUBLIC_SUPABASE_URL is not a valid URL format')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Mock Supabase client for tests that prevents TypeError
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

// Real Supabase client for integration tests (mocked in test environment)
export function createTestSupabaseClient() {
  const envCheck = validateTestEnvironment()
  if (!envCheck.valid) {
    console.warn(`Test environment validation failed: ${envCheck.errors.join(', ')}`)
    return createMockSupabaseClient()
  }
  
  // Return mock client in test environment to avoid ES module issues
  return createMockSupabaseClient()
}

// Database cleanup utilities
export async function cleanupTestData(client: ReturnType<typeof createClient>, tables: string[]) {
  for (const table of tables) {
    try {
      await client.from(table).delete().neq('id', '')
    } catch (error) {
      console.warn(`Failed to cleanup table ${table}:`, error)
    }
  }
}

// Test user creation for authentication tests
export async function createTestUser(client: ReturnType<typeof createClient>) {
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'test-password-123'
  
  const { data, error } = await client.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      emailRedirectTo: undefined // Skip email confirmation in tests
    }
  })
  
  return { data, error, testEmail, testPassword }
}

// Mock next-intl to avoid ES module issues
jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
  useLocale: () => 'en',
  useFormatter: () => ({
    dateTime: (date: Date) => date.toLocaleDateString(),
    number: (num: number) => num.toString()
  })
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: () => '/en/students',
  useSearchParams: () => new URLSearchParams()
}))

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    tr: 'tr',
    td: 'td',
    th: 'th',
    button: 'button',
    span: 'span',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3'
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn()
  })
}))

export default {
  TEST_ENV,
  validateTestEnvironment,
  createMockSupabaseClient,
  createTestSupabaseClient,
  cleanupTestData,
  createTestUser
}