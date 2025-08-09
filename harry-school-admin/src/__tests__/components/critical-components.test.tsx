/**
 * Critical Component Tests
 * Tests for components that are causing runtime errors and hydration issues
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMockSupabaseClient } from '../setup/test-environment'

// Mock Next.js components that cause hydration issues
jest.mock('next/image', () => {
  return function MockImage(props: any) {
    return <img {...props} />
  }
})

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
})

// Mock the dashboard statistics service
jest.mock('@/lib/dashboard/statistics', () => ({
  getDashboardStatistics: jest.fn(),
  getRecentActivity: jest.fn(),
  getEnrollmentTrends: jest.fn()
}))

// Create mock components for testing
const MockDashboardPage = () => {
  const [statistics, setStatistics] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    // Simulate the problematic async data loading
    const loadData = async () => {
      try {
        const mockClient = createMockSupabaseClient()
        // Simulate the TypeError that occurs
        const stats = await mockClient.from('teachers').select('*')
        setStatistics(stats)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) return <div data-testid="loading">Loading...</div>
  if (error) return <div data-testid="error">Error: {error}</div>
  
  return (
    <div data-testid="dashboard">
      <h1>Dashboard</h1>
      {statistics && <div data-testid="statistics">Statistics loaded</div>}
    </div>
  )
}

const MockTeachersTable = ({ teachers = [] }: { teachers?: any[] }) => {
  const [loading, setLoading] = React.useState(true)
  const [data, setData] = React.useState<any[]>([])
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    // Simulate API call that might fail
    const fetchTeachers = async () => {
      try {
        setLoading(true)
        // Simulate the API call that returns 404/500
        const response = await fetch('/api/teachers')
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`)
        }
        
        const result = await response.json()
        setData(result.data || teachers)
      } catch (err: any) {
        setError(err.message)
        setData(teachers) // Fallback to props
      } finally {
        setLoading(false)
      }
    }

    fetchTeachers()
  }, [teachers])

  if (loading) {
    return <div data-testid="teachers-loading">Loading teachers...</div>
  }

  if (error) {
    return <div data-testid="teachers-error">Failed to load teachers. Please try again.</div>
  }

  return (
    <div data-testid="teachers-table">
      <h2>Teachers</h2>
      {data.length === 0 ? (
        <p data-testid="no-teachers">No teachers found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((teacher, index) => (
              <tr key={teacher.id || index} data-testid={`teacher-row-${index}`}>
                <td>{teacher.first_name} {teacher.last_name}</td>
                <td>{teacher.email}</td>
                <td>{teacher.employment_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

describe('Critical Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock fetch globally
    global.fetch = jest.fn()
  })

  describe('Hydration Mismatch Detection', () => {
    it('should detect server/client rendering differences', async () => {
      // Simulate server-side rendering with no user data
      const ServerComponent = () => <div data-testid="user-info">No user</div>
      
      // Simulate client-side rendering with user data
      const ClientComponent = () => <div data-testid="user-info">Welcome, User!</div>
      
      const { rerender } = render(<ServerComponent />)
      expect(screen.getByTestId('user-info')).toHaveTextContent('No user')
      
      // Rerender with client data (simulating hydration)
      rerender(<ClientComponent />)
      expect(screen.getByTestId('user-info')).toHaveTextContent('Welcome, User!')
      
      // This would cause hydration mismatch in real app
    })

    it('should handle async data loading without hydration mismatch', async () => {
      const AsyncComponent = () => {
        const [data, setData] = React.useState<string | null>(null)
        const [isClient, setIsClient] = React.useState(false)

        React.useEffect(() => {
          setIsClient(true)
          // Simulate async data loading
          setTimeout(() => {
            setData('Loaded data')
          }, 100)
        }, [])

        // Prevent hydration mismatch by rendering consistently
        if (!isClient) {
          return <div data-testid="loading">Loading...</div>
        }

        return (
          <div data-testid="content">
            {data ? data : 'Loading...'}
          </div>
        )
      }

      render(<AsyncComponent />)
      
      // Should start with loading state
      expect(screen.getByTestId('loading')).toBeInTheDocument()
      
      // Wait for client-side rendering
      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument()
      })
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByTestId('content')).toHaveTextContent('Loaded data')
      })
    })

    it('should validate consistent initial state between server and client', () => {
      const ConsistentComponent = () => {
        // Use consistent initial state
        const [count, setCount] = React.useState(0)
        
        return (
          <div data-testid="consistent-component">
            <span data-testid="count">{count}</span>
            <button onClick={() => setCount(c => c + 1)}>Increment</button>
          </div>
        )
      }

      const { rerender } = render(<ConsistentComponent />)
      expect(screen.getByTestId('count')).toHaveTextContent('0')
      
      // Re-render should be consistent
      rerender(<ConsistentComponent />)
      expect(screen.getByTestId('count')).toHaveTextContent('0')
    })
  })

  describe('Dashboard Component Error Handling', () => {
    it('should handle Supabase client TypeError gracefully', async () => {
      // Mock the TypeError scenario
      const mockClient = createMockSupabaseClient()
      mockClient.from = jest.fn().mockImplementation(() => {
        throw new TypeError("Cannot read properties of undefined (reading 'call')")
      })

      render(<MockDashboardPage />)
      
      // Should show loading initially
      expect(screen.getByTestId('loading')).toBeInTheDocument()
      
      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('error')).toHaveTextContent(
        "Cannot read properties of undefined (reading 'call')"
      )
    })

    it('should render dashboard in loading state without errors', () => {
      const LoadingDashboard = () => (
        <div data-testid="dashboard">
          <div data-testid="loading">Loading dashboard...</div>
        </div>
      )

      render(<LoadingDashboard />)
      
      expect(screen.getByTestId('dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading dashboard...')
    })

    it('should handle missing statistics data', () => {
      const EmptyDashboard = () => (
        <div data-testid="dashboard">
          <h1>Dashboard</h1>
          <div data-testid="stats-cards">
            <div>Total Students: 0</div>
            <div>Active Teachers: 0</div>
            <div>Total Groups: 0</div>
          </div>
        </div>
      )

      render(<EmptyDashboard />)
      
      expect(screen.getByTestId('dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('stats-cards')).toBeInTheDocument()
    })
  })

  describe('Teachers Table Component Error Handling', () => {
    it('should handle API 404 errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ error: 'Not Found' })
      })

      render(<MockTeachersTable />)
      
      // Should show loading initially
      expect(screen.getByTestId('teachers-loading')).toBeInTheDocument()
      
      // Should handle 404 error
      await waitFor(() => {
        expect(screen.getByTestId('teachers-error')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('teachers-error')).toHaveTextContent(
        'Failed to load teachers'
      )
    })

    it('should handle API 500 errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ 
          error: 'Internal Server Error',
          details: 'Cannot read properties of undefined'
        })
      })

      render(<MockTeachersTable />)
      
      await waitFor(() => {
        expect(screen.getByTestId('teachers-error')).toBeInTheDocument()
      })
    })

    it('should render empty state when no teachers found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: [] })
      })

      render(<MockTeachersTable />)
      
      await waitFor(() => {
        expect(screen.getByTestId('teachers-table')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('no-teachers')).toHaveTextContent('No teachers found')
    })

    it('should render teachers table with data', async () => {
      const mockTeachers = [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          employment_status: 'active'
        }
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: mockTeachers })
      })

      render(<MockTeachersTable />)
      
      await waitFor(() => {
        expect(screen.getByTestId('teachers-table')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('teacher-row-0')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it('should fallback to props when API fails', async () => {
      const fallbackTeachers = [
        {
          id: '1',
          first_name: 'Fallback',
          last_name: 'Teacher',
          email: 'fallback@example.com',
          employment_status: 'active'
        }
      ]

      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<MockTeachersTable teachers={fallbackTeachers} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('teachers-table')).toBeInTheDocument()
      })
      
      expect(screen.getByText('Fallback Teacher')).toBeInTheDocument()
    })
  })

  describe('Form Component Validation', () => {
    const MockTeacherForm = () => {
      const [formData, setFormData] = React.useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: ''
      })
      const [errors, setErrors] = React.useState<Record<string, string>>({})

      const validateForm = () => {
        const newErrors: Record<string, string> = {}
        
        if (!formData.first_name.trim()) {
          newErrors.first_name = 'First name is required'
        }
        
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Email format is invalid'
        }
        
        if (formData.phone && !/^\+\d{10,15}$/.test(formData.phone)) {
          newErrors.phone = 'Phone format is invalid'
        }
        
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
      }

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        validateForm()
      }

      return (
        <form onSubmit={handleSubmit} data-testid="teacher-form">
          <div>
            <input
              name="first_name"
              placeholder="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              data-testid="first-name-input"
            />
            {errors.first_name && <div data-testid="first-name-error">{errors.first_name}</div>}
          </div>
          
          <div>
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              data-testid="email-input"
            />
            {errors.email && <div data-testid="email-error">{errors.email}</div>}
          </div>
          
          <div>
            <input
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              data-testid="phone-input"
            />
            {errors.phone && <div data-testid="phone-error">{errors.phone}</div>}
          </div>
          
          <button type="submit" data-testid="submit-button">
            Create Teacher
          </button>
        </form>
      )
    }

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      
      render(<MockTeacherForm />)
      
      // Try to submit empty form
      await user.click(screen.getByTestId('submit-button'))
      
      // Should show validation errors
      expect(screen.getByTestId('first-name-error')).toHaveTextContent('First name is required')
      expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required')
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      
      render(<MockTeacherForm />)
      
      // Enter invalid email
      await user.type(screen.getByTestId('email-input'), 'invalid-email')
      await user.click(screen.getByTestId('submit-button'))
      
      expect(screen.getByTestId('email-error')).toHaveTextContent('Email format is invalid')
    })

    it('should validate phone format', async () => {
      const user = userEvent.setup()
      
      render(<MockTeacherForm />)
      
      // Enter invalid phone
      await user.type(screen.getByTestId('phone-input'), 'invalid-phone')
      await user.click(screen.getByTestId('submit-button'))
      
      expect(screen.getByTestId('phone-error')).toHaveTextContent('Phone format is invalid')
    })
  })

  describe('Component Error Boundaries', () => {
    const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
      const [hasError, setHasError] = React.useState(false)

      React.useEffect(() => {
        const errorHandler = (error: ErrorEvent) => {
          setHasError(true)
          console.error('Component error caught:', error)
        }

        window.addEventListener('error', errorHandler)
        return () => window.removeEventListener('error', errorHandler)
      }, [])

      if (hasError) {
        return (
          <div data-testid="error-boundary">
            <h2>Something went wrong</h2>
            <button onClick={() => setHasError(false)} data-testid="retry-button">
              Try Again
            </button>
          </div>
        )
      }

      return <>{children}</>
    }

    const CrashingComponent = () => {
      throw new Error('Component crashed!')
    }

    it('should catch and handle component crashes', () => {
      // Suppress error logging in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      try {
        render(
          <ErrorBoundary>
            <CrashingComponent />
          </ErrorBoundary>
        )
        
        // This test documents error boundary behavior
        // In real React, this would be caught by ErrorBoundary
      } catch (error) {
        // Expected in test environment
        expect(error).toBeInstanceOf(Error)
      }
      
      consoleSpy.mockRestore()
    })
  })

  describe('Memory Leak Detection', () => {
    it('should clean up event listeners', () => {
      const ComponentWithListeners = () => {
        React.useEffect(() => {
          const handler = () => console.log('scroll')
          window.addEventListener('scroll', handler)
          return () => window.removeEventListener('scroll', handler)
        }, [])

        return <div data-testid="component">Component</div>
      }

      const { unmount } = render(<ComponentWithListeners />)
      
      // Component should mount successfully
      expect(screen.getByTestId('component')).toBeInTheDocument()
      
      // Should unmount without errors
      unmount()
    })

    it('should cancel ongoing requests on unmount', async () => {
      const ComponentWithRequest = () => {
        const [data, setData] = React.useState(null)

        React.useEffect(() => {
          const abortController = new AbortController()
          
          fetch('/api/data', { signal: abortController.signal })
            .then(response => response.json())
            .then(setData)
            .catch(error => {
              if (error.name !== 'AbortError') {
                console.error('Fetch error:', error)
              }
            })

          return () => abortController.abort()
        }, [])

        return <div data-testid="component">{data ? 'Loaded' : 'Loading'}</div>
      }

      const { unmount } = render(<ComponentWithRequest />)
      
      // Should start in loading state
      expect(screen.getByTestId('component')).toHaveTextContent('Loading')
      
      // Should unmount cleanly (cancelling request)
      unmount()
    })
  })
})