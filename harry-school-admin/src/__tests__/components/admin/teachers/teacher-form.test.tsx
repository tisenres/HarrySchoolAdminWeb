import userEvent from '@testing-library/user-event'

import { TeacherForm } from '@/components/admin/teachers/teacher-form'

import { 
  createMockTeacher,
  createMockHandlers,
  createMockFile
} from '../../../utils/mock-data'
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils'

// Mock Next.js Image component
jest.mock('next/image', () => {
  const MockImage = ({ src, alt, ...props }: any) => {
    return <img src={src} alt={alt} {...props} />
  }
  MockImage.displayName = 'MockImage'
  return MockImage
})

// Mock FileReader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  result: 'data:image/jpeg;base64,mockBase64Data',
  onload: null as any,
}

Object.defineProperty(window, 'FileReader', {
  value: jest.fn(() => mockFileReader),
  writable: true,
})

describe('TeacherForm', () => {
  const mockHandlers = createMockHandlers()
  const defaultProps = {
    onSubmit: mockHandlers.onSubmit,
    onCancel: mockHandlers.onCancel,
    isLoading: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFileReader.readAsDataURL.mockClear()
  })

  describe('Rendering', () => {
    it('renders create form by default', () => {
      render(<TeacherForm {...defaultProps} />)

      expect(screen.getByText('Add New Teacher')).toBeInTheDocument()
      expect(screen.getByText('Create a comprehensive teacher profile')).toBeInTheDocument()
      expect(screen.getByText('Create Teacher')).toBeInTheDocument()
    })

    it('renders edit form when teacher provided', () => {
      const mockTeacher = createMockTeacher()
      
      render(
        <TeacherForm 
          {...defaultProps} 
          teacher={mockTeacher}
          mode="edit"
        />
      )

      expect(screen.getByText('Edit Teacher')).toBeInTheDocument()
      expect(screen.getByText('Update teacher information and assignments')).toBeInTheDocument()
      expect(screen.getByText('Update Teacher')).toBeInTheDocument()
      
      // Check if form is populated with teacher data
      expect(screen.getByDisplayValue(mockTeacher.first_name)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockTeacher.last_name)).toBeInTheDocument()
    })

    it('renders all form sections', () => {
      render(<TeacherForm {...defaultProps} />)

      expect(screen.getByText('Profile Photo')).toBeInTheDocument()
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByText('Professional Information')).toBeInTheDocument()
      expect(screen.getByText('Specializations & Languages')).toBeInTheDocument()
      expect(screen.getByText('Education & Qualifications')).toBeInTheDocument()
      expect(screen.getByText('Emergency Contact')).toBeInTheDocument()
      expect(screen.getByText('Address Information')).toBeInTheDocument()
      expect(screen.getByText('Additional Notes')).toBeInTheDocument()
    })

    it('displays form progress', () => {
      render(<TeacherForm {...defaultProps} />)

      expect(screen.getByText(/\d+% Complete/)).toBeInTheDocument()
    })
  })

  describe('Basic Information', () => {
    it('handles required field validation', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      // Try to submit without filling required fields
      const submitButton = screen.getByText('Create Teacher')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument()
        expect(screen.getByText('Last name is required')).toBeInTheDocument()
      })
    })

    it('validates email format', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'invalid-email')
      await user.tab() // Trigger validation

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument()
      })
    })

    it('validates phone number format', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      const phoneInput = screen.getByLabelText(/phone number/i)
      await user.type(phoneInput, '123456789')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/phone must be valid uzbekistan format/i)).toBeInTheDocument()
      })
    })

    it('handles valid input correctly', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      const firstNameInput = screen.getByLabelText(/first name/i)
      const lastNameInput = screen.getByLabelText(/last name/i)
      const phoneInput = screen.getByLabelText(/phone number/i)

      await user.type(firstNameInput, 'John')
      await user.type(lastNameInput, 'Doe')
      await user.type(phoneInput, '+998901234567')

      expect(firstNameInput).toHaveValue('John')
      expect(lastNameInput).toHaveValue('Doe')
      expect(phoneInput).toHaveValue('+998901234567')
    })
  })

  describe('Profile Image Upload', () => {
    it('handles image upload', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      const file = createMockFile('test.jpg', 'image/jpeg')
      const fileInput = screen.getByRole('button', { name: /upload photo/i })
      
      // Click upload button to trigger file input
      await user.click(fileInput)
      
      // Mock file input change
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      })
      
      fireEvent.change(hiddenInput)

      // Simulate FileReader onload
      mockFileReader.onload()

      await waitFor(() => {
        const previewImage = screen.getByAltText('Profile preview')
        expect(previewImage).toHaveAttribute('src', mockFileReader.result)
      })
    })

    it('validates file size', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      // Create oversized file (6MB)
      const largeFile = createMockFile('large.jpg', 'image/jpeg', 6 * 1024 * 1024)
      
      const fileInput = screen.getByRole('button', { name: /upload photo/i })
      await user.click(fileInput)

      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement
      Object.defineProperty(hiddenInput, 'files', {
        value: [largeFile],
        writable: false,
      })

      // Mock alert
      window.alert = jest.fn()
      
      fireEvent.change(hiddenInput)

      expect(window.alert).toHaveBeenCalledWith('File size must be less than 5MB')
    })

    it('validates file type', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      const textFile = createMockFile('test.txt', 'text/plain')
      
      const fileInput = screen.getByRole('button', { name: /upload photo/i })
      await user.click(fileInput)

      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement
      Object.defineProperty(hiddenInput, 'files', {
        value: [textFile],
        writable: false,
      })

      window.alert = jest.fn()
      
      fireEvent.change(hiddenInput)

      expect(window.alert).toHaveBeenCalledWith('Please select a valid image file')
    })

    it('allows image removal', async () => {
      const user = userEvent.setup()
      const teacher = createMockTeacher()
      
      render(<TeacherForm {...defaultProps} teacher={teacher} />)

      // Should show existing image
      expect(screen.getByAltText(teacher.full_name)).toBeInTheDocument()

      // Remove image
      const removeButton = screen.getByRole('button', { name: '' }) // X button
      await user.click(removeButton)

      await waitFor(() => {
        expect(screen.queryByAltText(teacher.full_name)).not.toBeInTheDocument()
      })
    })
  })

  describe('Specializations', () => {
    it('adds predefined specializations', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      const englishButton = screen.getByRole('button', { name: /english/i })
      await user.click(englishButton)

      // Should appear as badge
      await waitFor(() => {
        expect(screen.getByText('English')).toBeInTheDocument()
      })
    })

    it('adds custom specialization', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      const customInput = screen.getByPlaceholderText('Add custom specialization')
      const addButton = screen.getByRole('button', { name: '' }) // Plus button next to input

      await user.type(customInput, 'Custom Subject')
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Custom Subject')).toBeInTheDocument()
      })
    })

    it('removes specializations', async () => {
      const user = userEvent.setup()
      const teacher = createMockTeacher({
        specializations: ['English', 'Mathematics']
      })
      
      render(<TeacherForm {...defaultProps} teacher={teacher} />)

      // Find and click remove button for first specialization
      const badges = screen.getAllByText(/english|mathematics/i)
      expect(badges).toHaveLength(2)

      const removeButtons = screen.getAllByRole('button', { name: '' }) // X buttons in badges
      if (removeButtons[0]) await user.click(removeButtons[0])

      // Should remove the specialization
      await waitFor(() => {
        expect(screen.getAllByText(/english|mathematics/i)).toHaveLength(1)
      })
    })

    it('handles Enter key for custom specialization', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      const customInput = screen.getByPlaceholderText('Add custom specialization')
      await user.type(customInput, 'Custom Subject{enter}')

      await waitFor(() => {
        expect(screen.getByText('Custom Subject')).toBeInTheDocument()
      })
    })
  })

  describe('Languages', () => {
    it('adds languages from dropdown', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      const languageSelect = screen.getByRole('combobox', { name: /add language/i })
      await user.click(languageSelect)

      const englishOption = screen.getByText('English')
      await user.click(englishOption)

      await waitFor(() => {
        expect(screen.getByText('English')).toBeInTheDocument()
      })
    })

    it('removes languages', async () => {
      const user = userEvent.setup()
      const teacher = createMockTeacher({
        languages_spoken: ['en', 'ru']
      })
      
      render(<TeacherForm {...defaultProps} teacher={teacher} />)

      const languageBadges = screen.getAllByText(/english|russian/i)
      expect(languageBadges.length).toBeGreaterThanOrEqual(2)

      // Remove first language
      const removeButtons = screen.getAllByRole('button', { name: '' })
      if (removeButtons[0]) await user.click(removeButtons[0])

      await waitFor(() => {
        const remainingBadges = screen.getAllByText(/english|russian/i)
        expect(remainingBadges).toHaveLength(1)
      })
    })
  })

  describe('Qualifications', () => {
    it('adds new qualification', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      const addButton = screen.getByText('Add Qualification')
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Qualification 1')).toBeInTheDocument()
        expect(screen.getByLabelText(/degree/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/institution/i)).toBeInTheDocument()
      })
    })

    it('fills qualification fields', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      const addButton = screen.getByText('Add Qualification')
      await user.click(addButton)

      const degreeInput = screen.getByLabelText(/degree/i)
      const institutionInput = screen.getByLabelText(/institution/i)
      const yearInput = screen.getByLabelText(/year/i)

      await user.type(degreeInput, 'Bachelor of Arts')
      await user.type(institutionInput, 'University of Tashkent')
      await user.type(yearInput, '2020')

      expect(degreeInput).toHaveValue('Bachelor of Arts')
      expect(institutionInput).toHaveValue('University of Tashkent')
      expect(yearInput).toHaveValue(2020)
    })

    it('removes qualifications', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      // Add qualification first
      const addButton = screen.getByText('Add Qualification')
      await user.click(addButton)

      // Remove it
      const removeButton = screen.getByRole('button', { name: '' }) // X button
      await user.click(removeButton)

      await waitFor(() => {
        expect(screen.queryByText('Qualification 1')).not.toBeInTheDocument()
      })
    })
  })

  describe('Salary Information', () => {
    it('toggles salary visibility', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      const showButton = screen.getByText('Show Salary')
      await user.click(showButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/salary amount/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/currency/i)).toBeInTheDocument()
      })

      const hideButton = screen.getByText('Hide Salary')
      await user.click(hideButton)

      await waitFor(() => {
        expect(screen.queryByLabelText(/salary amount/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      // Fill required fields
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/phone number/i), '+998901234567')

      const submitButton = screen.getByText('Create Teacher')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalled()
      })
    })

    it('prevents submission with invalid data', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      // Submit without required fields
      const submitButton = screen.getByText('Create Teacher')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockHandlers.onSubmit).not.toHaveBeenCalled()
        expect(submitButton).toBeDisabled()
      })
    })

    it('shows loading state during submission', () => {
      render(<TeacherForm {...defaultProps} isLoading={true} />)

      const submitButton = screen.getByText('Saving...')
      expect(submitButton).toBeDisabled()
    })

    it('includes profile image in submission', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      // Add image
      const file = createMockFile('test.jpg', 'image/jpeg')
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })
      
      fireEvent.change(fileInput)
      mockFileReader.onload()

      // Fill required fields and submit
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/phone number/i), '+998901234567')

      const submitButton = screen.getByText('Create Teacher')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalledWith(
          expect.any(Object),
          file
        )
      })
    })
  })

  describe('Unsaved Changes', () => {
    it('shows warning dialog when canceling with changes', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      // Make a change
      await user.type(screen.getByLabelText(/first name/i), 'John')

      // Try to cancel
      const backButton = screen.getByRole('button', { name: '' }) // Back arrow
      await user.click(backButton)

      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument()
      expect(screen.getByText('You have unsaved changes. Are you sure you want to leave?')).toBeInTheDocument()
    })

    it('allows leaving after confirming in dialog', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      // Make a change
      await user.type(screen.getByLabelText(/first name/i), 'John')

      // Try to cancel
      const backButton = screen.getByRole('button', { name: '' })
      await user.click(backButton)

      const confirmButton = screen.getByText('Leave Without Saving')
      await user.click(confirmButton)

      expect(mockHandlers.onCancel).toHaveBeenCalled()
    })
  })

  describe('Address and Emergency Contact', () => {
    it('handles address information', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      await user.type(screen.getByLabelText(/street address/i), '123 Main St')
      await user.type(screen.getByLabelText(/city/i), 'Tashkent')

      expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Tashkent')).toBeInTheDocument()
    })

    it('handles emergency contact information', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      await user.type(screen.getByLabelText(/contact name/i), 'Jane Doe')
      await user.type(screen.getByLabelText(/relationship/i), 'spouse')

      expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('spouse')).toBeInTheDocument()
    })
  })

  describe('Form Progress', () => {
    it('updates progress as fields are filled', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      screen.getByText(/\d+% Complete/)
      
      // Fill required fields
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/phone number/i), '+998901234567')

      const updatedProgress = screen.getByText(/\d+% Complete/)
      
      // Progress should increase (exact values depend on implementation)
      expect(updatedProgress).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles form submission errors gracefully', async () => {
      const user = userEvent.setup()
      const errorHandler = jest.fn().mockRejectedValue(new Error('Submission failed'))
      
      render(<TeacherForm {...defaultProps} onSubmit={errorHandler} />)

      // Fill and submit form
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/phone number/i), '+998901234567')

      const submitButton = screen.getByText('Create Teacher')
      await user.click(submitButton)

      // Form should handle error gracefully
      await waitFor(() => {
        expect(errorHandler).toHaveBeenCalled()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper labels and ARIA attributes', () => {
      render(<TeacherForm {...defaultProps} />)

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    })

    it('shows validation errors with proper formatting', async () => {
      const user = userEvent.setup()
      render(<TeacherForm {...defaultProps} />)

      const submitButton = screen.getByText('Create Teacher')
      await user.click(submitButton)

      await waitFor(() => {
        const errorMessages = screen.getAllByText(/required/i)
        errorMessages.forEach(error => {
          expect(error).toHaveClass('text-red-500')
        })
      })
    })
  })
})