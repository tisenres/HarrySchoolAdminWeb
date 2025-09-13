/**
 * PHASE 5: CRUD Operations Full Lifecycle Testing
 * 
 * Comprehensive testing of all Create, Read, Update, Delete operations
 * Testing every possible CRUD scenario including complex workflows
 */

import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StudentsClient from '@/app/[locale]/(dashboard)/students/students-client'
import { generateMockStudent, generateStudentDataset, createMockApiResponse, createMockApiError } from '@/lib/test-utils'

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

describe('Phase 5: CRUD Operations Full Lifecycle Testing', () => {
  let user: ReturnType<typeof userEvent.setup>
  let mockMutate: jest.Mock
  let mockRefetch: jest.Mock
  
  beforeEach(() => {
    jest.clearAllMocks()
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    jest.useFakeTimers()
    
    mockMutate = jest.fn()
    mockRefetch = jest.fn()
    
    // Default successful data state
    mockUseQuery.mockReturnValue({
      data: createMockApiResponse(generateStudentDataset(5)),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })
    
    // Default mutation mock
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

  describe('5.1 Create Operations (POST)', () => {
    test('should handle successful student creation', async () => {
      const newStudentData = generateMockStudent({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        primary_phone: '+998901234567'
      })

      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onSuccess }) => {
          onSuccess(createMockApiResponse(newStudentData))
        }),
        isLoading: false,
        error: null,
        isSuccess: true,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      // Click Add Student button
      const addButton = screen.getByRole('button', { name: /add student/i })
      await user.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      // Fill required fields
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com')
      await user.type(screen.getByLabelText(/phone/i), '+998901234567')
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled()
        expect(mockRefetch).toHaveBeenCalled()
      })
    })

    test('should handle validation errors during creation', async () => {
      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onError }) => {
          onError(createMockApiError(422, 'Validation failed'))
        }),
        isLoading: false,
        error: { message: 'Validation failed' },
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
      
      // Submit without required fields
      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument()
      })
    })

    test('should handle duplicate student creation', async () => {
      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onError }) => {
          onError(createMockApiError(409, 'Student with this email already exists'))
        }),
        isLoading: false,
        error: { message: 'Student with this email already exists' },
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
      
      // Fill with existing student data
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com')
      
      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/already exists/i)).toBeInTheDocument()
      })
    })

    test('should handle server errors during creation', async () => {
      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onError }) => {
          onError(createMockApiError(500, 'Internal server error'))
        }),
        isLoading: false,
        error: { message: 'Internal server error' },
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
        expect(screen.getByText(/server error/i)).toBeInTheDocument()
      })
    })

    test('should handle creation with all optional fields', async () => {
      const completeStudentData = generateMockStudent({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        primary_phone: '+998901234567',
        date_of_birth: '2010-01-15',
        gender: 'male',
        parent_name: 'Jane Doe',
        parent_phone: '+998901234568',
        parent_email: 'jane.doe@example.com',
        address: {
          street: '123 Main St',
          city: 'Tashkent',
          region: 'Tashkent',
          postal_code: '100000',
          country: 'Uzbekistan'
        },
        current_level: 'Intermediate',
        grade_level: 'Grade 8',
        medical_notes: 'No allergies',
        emergency_contact: {
          name: 'Emergency Contact',
          phone: '+998901234569',
          email: 'emergency@example.com',
          relationship: 'Uncle'
        }
      })

      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onSuccess }) => {
          onSuccess(createMockApiResponse(completeStudentData))
        }),
        isLoading: false,
        error: null,
        isSuccess: true,
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
      
      // Fill all fields
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com')
      await user.type(screen.getByLabelText(/phone/i), '+998901234567')
      await user.type(screen.getByLabelText(/date of birth/i), '2010-01-15')
      await user.selectOptions(screen.getByLabelText(/gender/i), 'male')
      await user.type(screen.getByLabelText(/parent name/i), 'Jane Doe')
      await user.type(screen.getByLabelText(/parent phone/i), '+998901234568')
      await user.type(screen.getByLabelText(/medical notes/i), 'No allergies')
      
      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            primary_phone: '+998901234567'
          }),
          expect.any(Object)
        )
      })
    })

    test('should handle network failures during creation', async () => {
      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onError }) => {
          onError(new Error('Network error'))
        }),
        isLoading: false,
        error: { message: 'Network error' },
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
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })

  describe('5.2 Read Operations (GET)', () => {
    test('should handle successful data retrieval', async () => {
      const studentsData = generateStudentDataset(10, { diverseStatuses: true })
      
      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(studentsData, {
          pagination: { total: 10, page: 1, total_pages: 1 }
        }),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
        expect(screen.getAllByRole('row')).toHaveLength(11) // 10 students + header
      })
    })

    test('should handle empty data retrieval', async () => {
      mockUseQuery.mockReturnValue({
        data: createMockApiResponse([], {
          pagination: { total: 0, page: 1, total_pages: 0 }
        }),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/no students found/i)).toBeInTheDocument()
      })
    })

    test('should handle data retrieval with pagination', async () => {
      const studentsData = generateStudentDataset(20)
      
      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(studentsData, {
          pagination: { total: 100, page: 1, total_pages: 5 }
        }),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/page 1 of 5/i)).toBeInTheDocument()
        expect(screen.getByText(/100 total/i)).toBeInTheDocument()
      })
    })

    test('should handle data retrieval errors', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to fetch students'),
        refetch: mockRefetch,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/error loading students/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    test('should handle data refresh', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      await user.click(refreshButton)
      
      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled()
      })
    })

    test('should handle slow data loading', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument()
      })
      
      // Should show loading skeleton or spinner
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
    })
  })

  describe('5.3 Update Operations (PUT/PATCH)', () => {
    test('should handle successful student update', async () => {
      const originalStudent = generateMockStudent({
        id: 'student-1',
        first_name: 'John',
        last_name: 'Doe'
      })
      
      const updatedStudent = {
        ...originalStudent,
        first_name: 'Jane',
        email: 'jane.doe@example.com'
      }

      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onSuccess }) => {
          onSuccess(createMockApiResponse(updatedStudent))
        }),
        isLoading: false,
        error: null,
        isSuccess: true,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      // Click edit button for first student
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      // Update fields
      const firstNameInput = screen.getByLabelText(/first name/i)
      await user.clear(firstNameInput)
      await user.type(firstNameInput, 'Jane')
      
      const emailInput = screen.getByLabelText(/email/i)
      await user.clear(emailInput)
      await user.type(emailInput, 'jane.doe@example.com')
      
      // Submit update
      const updateButton = screen.getByRole('button', { name: /update/i })
      await user.click(updateButton)
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'student-1',
            first_name: 'Jane',
            email: 'jane.doe@example.com'
          }),
          expect.any(Object)
        )
      })
    })

    test('should handle partial field updates', async () => {
      const originalStudent = generateMockStudent({ id: 'student-1' })

      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onSuccess }) => {
          onSuccess(createMockApiResponse({
            ...originalStudent,
            current_level: 'Advanced'
          }))
        }),
        isLoading: false,
        error: null,
        isSuccess: true,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      // Only update level
      await user.selectOptions(screen.getByLabelText(/level/i), 'Advanced')
      
      const updateButton = screen.getByRole('button', { name: /update/i })
      await user.click(updateButton)
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled()
      })
    })

    test('should handle update validation errors', async () => {
      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onError }) => {
          onError(createMockApiError(422, 'Invalid email format'))
        }),
        isLoading: false,
        error: { message: 'Invalid email format' },
        isSuccess: false,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      // Enter invalid email
      const emailInput = screen.getByLabelText(/email/i)
      await user.clear(emailInput)
      await user.type(emailInput, 'invalid-email')
      
      const updateButton = screen.getByRole('button', { name: /update/i })
      await user.click(updateButton)
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
      })
    })

    test('should handle concurrent update conflicts', async () => {
      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onError }) => {
          onError(createMockApiError(409, 'Student was modified by another user'))
        }),
        isLoading: false,
        error: { message: 'Student was modified by another user' },
        isSuccess: false,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      await user.type(screen.getByLabelText(/first name/i), 'Updated Name')
      
      const updateButton = screen.getByRole('button', { name: /update/i })
      await user.click(updateButton)
      
      await waitFor(() => {
        expect(screen.getByText(/modified by another user/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /refresh and retry/i })).toBeInTheDocument()
      })
    })

    test('should handle bulk updates', async () => {
      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onSuccess }) => {
          onSuccess(createMockApiResponse({ updated: data.length }))
        }),
        isLoading: false,
        error: null,
        isSuccess: true,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      // Select multiple students
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i })
      await user.click(selectAllCheckbox)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /bulk actions/i })).toBeInTheDocument()
      })
      
      // Open bulk actions menu
      await user.click(screen.getByRole('button', { name: /bulk actions/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /update status/i })).toBeInTheDocument()
      })
      
      // Select bulk update action
      await user.click(screen.getByRole('menuitem', { name: /update status/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      // Select new status
      await user.selectOptions(screen.getByLabelText(/status/i), 'inactive')
      
      const updateButton = screen.getByRole('button', { name: /update selected/i })
      await user.click(updateButton)
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled()
      })
    })
  })

  describe('5.4 Delete Operations (DELETE)', () => {
    test('should handle successful single student deletion', async () => {
      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onSuccess }) => {
          onSuccess(createMockApiResponse({ deleted: true }))
        }),
        isLoading: false,
        error: null,
        isSuccess: true,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      // Click delete button for first student
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      })
      
      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled()
        expect(mockRefetch).toHaveBeenCalled()
      })
    })

    test('should handle deletion cancellation', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      // Cancel deletion
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(mockMutate).not.toHaveBeenCalled()
      })
    })

    test('should handle bulk deletion', async () => {
      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onSuccess }) => {
          onSuccess(createMockApiResponse({ deleted: data.length }))
        }),
        isLoading: false,
        error: null,
        isSuccess: true,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      // Select multiple students
      const checkboxes = screen.getAllByRole('checkbox').filter(cb => 
        cb.getAttribute('aria-label')?.includes('Select student')
      )
      
      await user.click(checkboxes[0])
      await user.click(checkboxes[1])
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /bulk actions/i })).toBeInTheDocument()
      })
      
      // Open bulk actions and select delete
      await user.click(screen.getByRole('button', { name: /bulk actions/i }))
      await user.click(screen.getByRole('menuitem', { name: /delete selected/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/delete 2 students/i)).toBeInTheDocument()
      })
      
      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.any(String),
            expect.any(String)
          ]),
          expect.any(Object)
        )
      })
    })

    test('should handle deletion errors', async () => {
      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onError }) => {
          onError(createMockApiError(403, 'Cannot delete student with active enrollments'))
        }),
        isLoading: false,
        error: { message: 'Cannot delete student with active enrollments' },
        isSuccess: false,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(screen.getByText(/active enrollments/i)).toBeInTheDocument()
      })
    })

    test('should handle soft delete vs hard delete', async () => {
      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onSuccess }) => {
          onSuccess(createMockApiResponse({ deleted: true, soft_delete: true }))
        }),
        isLoading: false,
        error: null,
        isSuccess: true,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/soft delete/i)).toBeInTheDocument()
        expect(screen.getByText(/hard delete/i)).toBeInTheDocument()
      })
      
      // Choose soft delete
      const softDeleteRadio = screen.getByRole('radio', { name: /soft delete/i })
      await user.click(softDeleteRadio)
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({ deleteType: 'soft' }),
          expect.any(Object)
        )
      })
    })
  })

  describe('5.5 Complex CRUD Workflows', () => {
    test('should handle create → read → update → delete workflow', async () => {
      let currentData = generateStudentDataset(1)
      
      // Step 1: Create
      mockUseMutation.mockReturnValueOnce({
        mutate: mockMutate.mockImplementation((data, { onSuccess }) => {
          const newStudent = generateMockStudent(data)
          currentData.push(newStudent)
          onSuccess(createMockApiResponse(newStudent))
        }),
        isLoading: false,
        error: null,
        isSuccess: true,
      })
      
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      // Create new student
      const addButton = screen.getByRole('button', { name: /add student/i })
      await user.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      await user.type(screen.getByLabelText(/first name/i), 'Test')
      await user.type(screen.getByLabelText(/last name/i), 'Student')
      
      const createButton = screen.getByRole('button', { name: /create/i })
      await user.click(createButton)
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled()
      })
      
      // Step 2: Read (verify creation)
      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(currentData),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })
      
      // Step 3: Update
      mockUseMutation.mockReturnValueOnce({
        mutate: mockMutate.mockImplementation((data, { onSuccess }) => {
          const updated = { ...currentData[0], ...data }
          currentData[0] = updated
          onSuccess(createMockApiResponse(updated))
        }),
        isLoading: false,
        error: null,
        isSuccess: true,
      })
      
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      const firstNameInput = screen.getByLabelText(/first name/i)
      await user.clear(firstNameInput)
      await user.type(firstNameInput, 'Updated')
      
      const updateButton = screen.getByRole('button', { name: /update/i })
      await user.click(updateButton)
      
      // Step 4: Delete
      mockUseMutation.mockReturnValueOnce({
        mutate: mockMutate.mockImplementation((data, { onSuccess }) => {
          currentData = currentData.filter(s => s.id !== data)
          onSuccess(createMockApiResponse({ deleted: true }))
        }),
        isLoading: false,
        error: null,
        isSuccess: true,
      })
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledTimes(3) // create, update, delete
      })
    })

    test('should handle concurrent CRUD operations', async () => {
      let operationCount = 0
      
      mockUseMutation.mockReturnValue({
        mutate: jest.fn().mockImplementation((data, { onSuccess }) => {
          operationCount++
          setTimeout(() => {
            onSuccess(createMockApiResponse({ operation: operationCount }))
          }, Math.random() * 100)
        }),
        isLoading: false,
        error: null,
        isSuccess: true,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      // Trigger multiple concurrent operations
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      
      // Start multiple operations simultaneously
      await Promise.all([
        user.click(editButtons[0]),
        user.click(deleteButtons[1]),
        user.click(screen.getByRole('button', { name: /add student/i }))
      ])
      
      await waitFor(() => {
        // Should handle all operations without conflicts
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })

    test('should handle CRUD operations with relationships', async () => {
      const studentWithGroups = generateMockStudent({
        id: 'student-1',
        groups: ['group-1', 'group-2'],
        enrolled_groups: [
          { id: 'group-1', name: 'Math Group' },
          { id: 'group-2', name: 'English Group' }
        ]
      })

      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onSuccess, onError }) => {
          if (data.groups && data.groups.length > 0) {
            onError(createMockApiError(400, 'Cannot delete student with active group enrollments'))
          } else {
            onSuccess(createMockApiResponse({ deleted: true }))
          }
        }),
        isLoading: false,
        error: null,
        isSuccess: false,
      })

      mockUseQuery.mockReturnValue({
        data: createMockApiResponse([studentWithGroups]),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      // Try to delete student with group enrollments
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(screen.getByText(/active group enrollments/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /remove from groups first/i })).toBeInTheDocument()
      })
    })
  })

  describe('5.6 Data Consistency and Integrity', () => {
    test('should maintain data consistency during concurrent edits', async () => {
      const originalStudent = generateMockStudent({ id: 'student-1', first_name: 'John' })
      
      let editCount = 0
      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onSuccess, onError }) => {
          editCount++
          if (editCount > 1) {
            onError(createMockApiError(409, 'Conflict: Student was modified'))
          } else {
            onSuccess(createMockApiResponse({ ...originalStudent, ...data }))
          }
        }),
        isLoading: false,
        error: null,
        isSuccess: true,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      // Open two edit dialogs
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])
      
      await waitFor(() => {
        expect(screen.getAllByRole('dialog')).toHaveLength(1)
      })
      
      // Make changes in first dialog
      await user.type(screen.getByLabelText(/first name/i), ' Updated')
      
      // Try to submit - should succeed first time
      const updateButton = screen.getByRole('button', { name: /update/i })
      await user.click(updateButton)
      
      // Try another update - should fail with conflict
      await user.click(editButtons[0])
      await user.type(screen.getByLabelText(/first name/i), ' Again')
      await user.click(screen.getByRole('button', { name: /update/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/conflict/i)).toBeInTheDocument()
      })
    })

    test('should handle referential integrity constraints', async () => {
      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onError }) => {
          onError(createMockApiError(400, 'Foreign key constraint violation'))
        }),
        isLoading: false,
        error: { message: 'Foreign key constraint violation' },
        isSuccess: false,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(screen.getByText(/constraint violation/i)).toBeInTheDocument()
      })
    })

    test('should validate data integrity before operations', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const addButton = screen.getByRole('button', { name: /add student/i })
      await user.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      // Try to submit with invalid data
      await user.type(screen.getByLabelText(/email/i), 'invalid-email')
      await user.type(screen.getByLabelText(/phone/i), 'invalid-phone')
      
      const createButton = screen.getByRole('button', { name: /create/i })
      await user.click(createButton)
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
        expect(screen.getByText(/invalid phone/i)).toBeInTheDocument()
      })
      
      // Form should not submit with validation errors
      expect(mockMutate).not.toHaveBeenCalled()
    })
  })
})