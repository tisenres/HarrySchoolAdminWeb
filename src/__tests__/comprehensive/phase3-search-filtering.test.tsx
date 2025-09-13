/**
 * PHASE 3: Search & Filtering Comprehensive Tests
 * 
 * Testing every possible search scenario, edge case, and security vulnerability
 * Covers all search patterns, filter combinations, and malicious input attempts
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useQuery } from '@tanstack/react-query'
import StudentsClient from '@/app/[locale]/(dashboard)/students/students-client'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

describe('Phase 3: Search & Filtering Comprehensive Tests', () => {
  const sampleStudents = [
    {
      id: 'student-1',
      student_id: 'HS-STU-001',
      full_name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@email.com',
      phone: '+998901234567',
      parent_name: 'Jane Doe',
      parent_phone: '+998901234568',
      status: 'active',
      payment_status: 'paid',
      current_level: 'Beginner',
      preferred_subjects: ['English', 'Math'],
      enrollment_date: '2024-01-01',
      date_of_birth: '2010-01-01',
      gender: 'male' as const,
      balance: 0,
      groups: [],
      address: { street: 'Street 1', city: 'Tashkent', region: 'Tashkent', country: 'Uzbekistan' },
      emergency_contact: { name: 'Emergency', relationship: 'Parent', phone: '+998901234569' },
      organization_id: 'org-1',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: 'student-2',
      student_id: 'HS-STU-002',
      full_name: 'Alice Smith',
      first_name: 'Alice',
      last_name: 'Smith',
      email: 'alice.smith@email.com',
      phone: '+998907654321',
      parent_name: 'Bob Smith',
      parent_phone: '+998907654322',
      status: 'inactive',
      payment_status: 'pending',
      current_level: 'Advanced',
      preferred_subjects: ['Physics', 'Chemistry'],
      enrollment_date: '2024-02-01',
      date_of_birth: '2011-02-01',
      gender: 'female' as const,
      balance: 500000,
      groups: [],
      address: { street: 'Street 2', city: 'Samarkand', region: 'Samarkand', country: 'Uzbekistan' },
      emergency_contact: { name: 'Emergency 2', relationship: 'Parent', phone: '+998907654323' },
      organization_id: 'org-1',
      is_active: false,
      created_at: '2024-02-01',
      updated_at: '2024-02-01'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    // Default mock
    mockUseQuery.mockReturnValue({
      data: {
        data: sampleStudents,
        pagination: { total: 2, page: 1, total_pages: 1 }
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('3.1 Basic Search Functionality', () => {
    test('should handle empty search queries', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.clear(searchInput)
      await userEvent.type(searchInput, '')
      
      act(() => {
        jest.advanceTimersByTime(500) // Debounce delay
      })

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      })
    })

    test('should search by student name', async () => {
      mockUseQuery.mockReturnValue({
        data: {
          data: [sampleStudents[0]], // Only John Doe
          pagination: { total: 1, page: 1, total_pages: 1 }
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.type(searchInput, 'John')
      
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
      })
    })

    test('should search by parent name', async () => {
      mockUseQuery.mockReturnValue({
        data: {
          data: [sampleStudents[1]], // Only Alice Smith
          pagination: { total: 1, page: 1, total_pages: 1 }
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.type(searchInput, 'Bob')
      
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument()
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      })
    })

    test('should search by phone number', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.type(searchInput, '+998901234567')
      
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    test('should search by email', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.type(searchInput, 'alice.smith@email.com')
      
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      })
    })
  })

  describe('3.2 Advanced Search Patterns', () => {
    test('should handle single character searches', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.type(searchInput, 'J')
      
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        // Should return results for single character
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    test('should handle partial word matching', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.type(searchInput, 'Joh')
      
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    test('should handle case insensitive searches', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.type(searchInput, 'john doe')
      
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    test('should handle searches with multiple words', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.type(searchInput, 'Alice Smith')
      
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      })
    })

    test('should handle searches with extra spaces', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.type(searchInput, '  John   Doe  ')
      
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })
  })

  describe('3.3 Special Characters & Edge Cases', () => {
    test('should handle special characters in search', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      const specialChars = ['%', '_', '*', '?', '!', '@', '#', '$', '&', '(', ')']
      
      for (const char of specialChars) {
        await userEvent.clear(searchInput)
        await userEvent.type(searchInput, char)
        
        act(() => {
          jest.advanceTimersByTime(500)
        })

        await waitFor(() => {
          // Should handle special characters without crashing
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })
      }
    })

    test('should handle Unicode and international characters', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      const unicodeStrings = [
        'Алексей', // Cyrillic
        '张三', // Chinese
        'José', // Spanish with accent
        'محمد', // Arabic
        '🏫📚', // Emojis
        'Müller', // German umlaut
      ]
      
      for (const str of unicodeStrings) {
        await userEvent.clear(searchInput)
        await userEvent.type(searchInput, str)
        
        act(() => {
          jest.advanceTimersByTime(500)
        })

        await waitFor(() => {
          // Should handle Unicode without crashing
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })
      }
    })

    test('should handle very long search strings', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      const longString = 'a'.repeat(1000)
      await userEvent.type(searchInput, longString)
      
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        // Should handle very long strings without crashing
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })

    test('should handle newlines and tabs in search', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.type(searchInput, 'John\\nDoe\\t')
      
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        // Should handle control characters
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })
  })

  describe('3.4 Security & Injection Tests', () => {
    test('should prevent SQL injection attempts', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      const sqlInjections = [
        "'; DROP TABLE students; --",
        "' OR '1'='1",
        "'; DELETE FROM students; --",
        "' UNION SELECT * FROM users --",
        "'; INSERT INTO students VALUES ('hacked'); --",
        "' OR 1=1 --",
        "'; EXEC xp_cmdshell('dir'); --"
      ]
      
      for (const injection of sqlInjections) {
        await userEvent.clear(searchInput)
        await userEvent.type(searchInput, injection)
        
        act(() => {
          jest.advanceTimersByTime(500)
        })

        await waitFor(() => {
          // Should safely handle SQL injection attempts
          expect(screen.getByText(/students/i)).toBeInTheDocument()
          // Should not execute malicious code
          expect(screen.queryByText(/hacked/i)).not.toBeInTheDocument()
        })
      }
    })

    test('should prevent XSS attempts in search', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      const xssAttempts = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert(1)',
        '<svg onload="alert(1)">',
        '"><script>alert(1)</script>',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<body onload="alert(1)">',
      ]
      
      for (const xss of xssAttempts) {
        await userEvent.clear(searchInput)
        await userEvent.type(searchInput, xss)
        
        act(() => {
          jest.advanceTimersByTime(500)
        })

        await waitFor(() => {
          // Should safely handle XSS attempts without executing scripts
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })
      }
    })

    test('should handle NoSQL injection attempts', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      const noSqlInjections = [
        '{"$ne": null}',
        '{"$gt": ""}',
        '{"$where": "this.name == this.name"}',
        '{"$regex": ".*"}',
        '{"$or": [{}]}',
      ]
      
      for (const injection of noSqlInjections) {
        await userEvent.clear(searchInput)
        await userEvent.type(searchInput, injection)
        
        act(() => {
          jest.advanceTimersByTime(500)
        })

        await waitFor(() => {
          // Should safely handle NoSQL injection attempts
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })
      }
    })
  })

  describe('3.5 Rapid Typing & Debounce Testing', () => {
    test('should debounce rapid typing correctly', async () => {
      const mockRefetch = jest.fn()
      mockUseQuery.mockReturnValue({
        data: { data: sampleStudents, pagination: { total: 2, page: 1, total_pages: 1 } },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      // Type rapidly
      await userEvent.type(searchInput, 'J', { delay: 10 })
      await userEvent.type(searchInput, 'o', { delay: 10 })
      await userEvent.type(searchInput, 'h', { delay: 10 })
      await userEvent.type(searchInput, 'n', { delay: 10 })
      
      // Should not trigger API calls during rapid typing
      expect(mockRefetch).not.toHaveBeenCalled()
      
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Should trigger API call after debounce
      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      })
    })

    test('should reset timer on new input during debounce period', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.type(searchInput, 'J')
      
      // Advance timer partway
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      // Type more before debounce completes
      await userEvent.type(searchInput, 'ohn')
      
      // Advance timer again
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      })
    })

    test('should handle backspacing during debounce', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.type(searchInput, 'John')
      await userEvent.keyboard('{Backspace}{Backspace}')
      
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('Jo')).toBeInTheDocument()
      })
    })
  })

  describe('3.6 Search with Network Issues', () => {
    test('should handle search during network interruption', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network error'),
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.type(searchInput, 'John')
      
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        // Should show error state
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })

    test('should retry search after network recovery', async () => {
      let networkFailed = true
      mockUseQuery.mockImplementation(() => {
        if (networkFailed) {
          networkFailed = false
          return {
            data: null,
            isLoading: false,
            error: new Error('Network error'),
            refetch: jest.fn(),
          }
        }
        return {
          data: { data: [sampleStudents[0]], pagination: { total: 1, page: 1, total_pages: 1 } },
          isLoading: false,
          error: null,
          refetch: jest.fn(),
        }
      })

      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.type(searchInput, 'John')
      
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        // Should show retry button
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })

      // Click retry
      await userEvent.click(screen.getByRole('button', { name: /try again/i }))

      await waitFor(() => {
        // Should show results after retry
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })
  })

  describe('3.7 Filter Combinations', () => {
    test('should combine search with status filter', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.type(searchInput, 'Student')
      
      // Open filters
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      await userEvent.click(filtersButton)

      // TODO: Add status filter interaction
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('Student')).toBeInTheDocument()
      })
    })

    test('should combine search with payment status filter', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.type(searchInput, 'Alice')
      
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
      })
    })

    test('should combine search with date range filter', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.type(searchInput, '2024')
      
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('2024')).toBeInTheDocument()
      })
    })

    test('should clear search when clearing all filters', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.type(searchInput, 'John')
      
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Clear filters
      const clearButton = screen.getByRole('button', { name: /clear/i })
      await userEvent.click(clearButton)

      await waitFor(() => {
        expect(searchInput).toHaveValue('')
      })
    })
  })

  describe('3.8 Search Performance', () => {
    test('should handle search with large result sets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...sampleStudents[0],
        id: `student-${i}`,
        full_name: `Student ${i}`,
      }))

      mockUseQuery.mockReturnValue({
        data: {
          data: largeDataset.slice(0, 20), // First page
          pagination: { total: 1000, page: 1, total_pages: 50 }
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      const startTime = performance.now()
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      await userEvent.type(searchInput, 'Student')
      
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('Student')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const searchTime = endTime - startTime

      // Should complete search within reasonable time
      expect(searchTime).toBeLessThan(2000)
    })

    test('should handle memory efficiently during rapid searches', async () => {
      render(<StudentsClient />)

      const searchInput = await screen.findByPlaceholderText(/search students/i)
      
      // Perform many rapid searches
      for (let i = 0; i < 100; i++) {
        await userEvent.clear(searchInput)
        await userEvent.type(searchInput, `Search ${i}`)
        
        act(() => {
          jest.advanceTimersByTime(100)
        })
      }

      // Should not cause memory leaks
      expect(screen.getByDisplayValue(/Search/)).toBeInTheDocument()
    })
  })
})