import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import { useRouter } from 'next/navigation'
import StudentsClient from '@/app/[locale]/(dashboard)/students/students-client'

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock the framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock the lazy loaded components
jest.mock('@/components/admin/students/students-virtual-table', () => ({
  StudentsVirtualTable: ({ onSearch }: { onSearch: (query: string) => void }) => (
    <div data-testid="students-table">
      <input 
        data-testid="search-input"
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search students..."
      />
    </div>
  )
}))

jest.mock('@/components/admin/students/students-filters', () => ({
  StudentsFilters: () => <div data-testid="students-filters">Filters</div>
}))

// Mock fetch for API calls
global.fetch = jest.fn()

const mockMessages = {
  students: {
    title: 'Students',
    totalStudents: 'Total Students',
    activeStudents: 'Active Students',
    newEnrollments: 'New Enrollments',
    unpaidFees: 'Unpaid Fees',
  },
  common: {
    loading: 'Loading...',
    error: 'Error',
  }
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}

describe('Students Search Debouncing', () => {
  let mockRouter: jest.Mocked<any>

  beforeEach(() => {
    mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: {
          total: 0,
          total_pages: 1,
          current_page: 1,
          limit: 20
        }
      })
    })

    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('should debounce search input and not make API calls on every keystroke', async () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StudentsClient />
      </Wrapper>
    )

    const searchInput = screen.getByTestId('search-input')

    // Type multiple characters rapidly
    fireEvent.change(searchInput, { target: { value: 'J' } })
    fireEvent.change(searchInput, { target: { value: 'Jo' } })
    fireEvent.change(searchInput, { target: { value: 'Joh' } })
    fireEvent.change(searchInput, { target: { value: 'John' } })

    // Should not make API calls immediately
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('query=John')
    )

    // Fast forward less than debounce delay (500ms)
    jest.advanceTimersByTime(250)

    // Still should not have made the API call
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('query=John')
    )

    // Fast forward to complete the debounce delay
    jest.advanceTimersByTime(250)

    // Now it should make the API call with debounced value
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('query=John')
      )
    })

    // Should only make one API call, not multiple
    const apiCalls = (global.fetch as jest.Mock).mock.calls.filter(call =>
      call[0]?.includes('query=John')
    )
    expect(apiCalls).toHaveLength(1)
  })

  it('should reset debounce timer on rapid typing', async () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StudentsClient />
      </Wrapper>
    )

    const searchInput = screen.getByTestId('search-input')

    // Type first part
    fireEvent.change(searchInput, { target: { value: 'J' } })

    // Wait 250ms (less than debounce)
    jest.advanceTimersByTime(250)

    // Type more before debounce completes
    fireEvent.change(searchInput, { target: { value: 'Jane' } })

    // Wait another 250ms (total 500ms from first input, but timer reset)
    jest.advanceTimersByTime(250)

    // Should not have made API call for 'J'
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('query=J')
    )

    // Wait for full debounce from last input
    jest.advanceTimersByTime(250)

    // Should make API call for final value
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('query=Jane')
      )
    })
  })

  it('should handle empty search correctly', async () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StudentsClient />
      </Wrapper>
    )

    const searchInput = screen.getByTestId('search-input')

    // Type something first
    fireEvent.change(searchInput, { target: { value: 'John' } })
    jest.advanceTimersByTime(500)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('query=John')
      )
    })

    // Clear the search
    fireEvent.change(searchInput, { target: { value: '' } })
    jest.advanceTimersByTime(500)

    // Should make API call without query parameter for empty search
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.not.stringContaining('query=')
      )
    })
  })

  it('should use 500ms debounce delay as specified in requirements', async () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <StudentsClient />
      </Wrapper>
    )

    const searchInput = screen.getByTestId('search-input')

    fireEvent.change(searchInput, { target: { value: 'test' } })

    // At 499ms, should not make API call
    jest.advanceTimersByTime(499)
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('query=test')
    )

    // At 500ms, should make API call
    jest.advanceTimersByTime(1)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('query=test')
      )
    })
  })

  it('should clean up timers when component unmounts', () => {
    const Wrapper = createWrapper()
    
    const { unmount } = render(
      <Wrapper>
        <StudentsClient />
      </Wrapper>
    )

    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    // Unmount before debounce completes
    unmount()

    // Should clean up timers
    expect(jest.getTimerCount()).toBe(0)
  })
})