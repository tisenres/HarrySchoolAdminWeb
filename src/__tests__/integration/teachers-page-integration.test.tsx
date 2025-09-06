/**
 * Integration test for the Teachers page with mock service
 * 
 * This test verifies that the Teachers page can load and display data
 * without attempting to access server-side resources or service role keys.
 */

import { render, screen, waitFor } from '@testing-library/react'
import { teacherService } from '@/lib/services/teacher-service'
import TeachersPage from '@/app/dashboard/teachers/page'

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      pathname: '/dashboard/teachers'
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/dashboard/teachers'
  }
}))

// Mock the Lucide icons to avoid rendering issues
jest.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  MoreHorizontal: () => <div data-testid="more-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Eye: () => <div data-testid="eye-icon" />
}))

describe('Teachers Page Integration', () => {
  beforeEach(() => {
    // Reset mock service to ensure clean state
    teacherService.reset()
  })

  it('should render the Teachers page without server-side errors', async () => {
    render(<TeachersPage />)
    
    // Check that the page title is rendered
    expect(screen.getByRole('heading', { name: /teachers/i })).toBeInTheDocument()
    
    // Check that the description is rendered
    expect(screen.getByText(/manage teacher profiles/i)).toBeInTheDocument()
  })

  it('should display teachers data from mock service', async () => {
    render(<TeachersPage />)
    
    // Wait for loading to complete and teachers to be displayed
    await waitFor(() => {
      // Check that teachers are loaded (should show teacher names from mock data)
      const teacherElements = screen.getAllByText(/Teacher\d+/)
      expect(teacherElements.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('should show statistics from mock service', async () => {
    render(<TeachersPage />)
    
    // Wait for statistics to load
    await waitFor(() => {
      expect(screen.getByText('Total Teachers')).toBeInTheDocument()
      expect(screen.getByText('Active Teachers')).toBeInTheDocument()
      expect(screen.getByText('Full Time')).toBeInTheDocument()
    })
  })

  it('should have functional buttons', () => {
    render(<TeachersPage />)
    
    // Check that action buttons are present
    expect(screen.getByRole('button', { name: /add teacher/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
  })

  it('should not access SUPABASE_SERVICE_ROLE_KEY', () => {
    // This test ensures that the page can render without throwing the 
    // "SUPABASE_SERVICE_ROLE_KEY is not set" error
    
    // Mock console.error to catch any service role key access attempts
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<TeachersPage />)
    
    // Check that no service role key errors were logged
    const serviceKeyErrors = consoleSpy.mock.calls.filter(call => 
      call.some(arg => 
        typeof arg === 'string' && arg.includes('SUPABASE_SERVICE_ROLE_KEY')
      )
    )
    
    expect(serviceKeyErrors.length).toBe(0)
    
    consoleSpy.mockRestore()
  })

  it('should use mock service for data operations', async () => {
    // Spy on the mock service to ensure it's being used
    const getAllSpy = jest.spyOn(teacherService, 'getAll')
    const getStatisticsSpy = jest.spyOn(teacherService, 'getStatistics')
    
    render(<TeachersPage />)
    
    // Wait for the service methods to be called
    await waitFor(() => {
      expect(getAllSpy).toHaveBeenCalled()
      expect(getStatisticsSpy).toHaveBeenCalled()
    })
    
    getAllSpy.mockRestore()
    getStatisticsSpy.mockRestore()
  })
})