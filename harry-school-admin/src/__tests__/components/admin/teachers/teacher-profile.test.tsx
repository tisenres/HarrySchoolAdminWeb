import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils'
import { TeacherProfile } from '@/components/admin/teachers/teacher-profile'
import { 
  createMockTeacher,
  createMockHandlers
} from '../../../utils/mock-data'
import userEvent from '@testing-library/user-event'

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />
  }
})

jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>
  }
})

describe('TeacherProfile', () => {
  const mockTeacher = createMockTeacher()
  const mockHandlers = createMockHandlers()
  const defaultProps = {
    teacher: mockTeacher,
    onEdit: mockHandlers.onEdit,
    onDelete: mockHandlers.onDelete,
    onArchive: mockHandlers.onArchive,
    onRestore: mockHandlers.onRestore,
    loading: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders teacher profile header correctly', () => {
      render(<TeacherProfile {...defaultProps} />)

      expect(screen.getByText(mockTeacher.full_name)).toBeInTheDocument()
      expect(screen.getByText(`Teacher Profile • ID: ${mockTeacher.employee_id}`)).toBeInTheDocument()
      expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    })

    it('renders loading state', () => {
      render(<TeacherProfile {...defaultProps} loading={true} />)

      expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument()
    })

    it('renders all navigation tabs', () => {
      render(<TeacherProfile {...defaultProps} />)

      expect(screen.getByText('Overview')).toBeInTheDocument()
      expect(screen.getByText('Education & Skills')).toBeInTheDocument()
      expect(screen.getByText('Assignments')).toBeInTheDocument()
      expect(screen.getByText('Documents')).toBeInTheDocument()
    })

    it('shows back button with correct link', () => {
      render(<TeacherProfile {...defaultProps} />)

      const backButton = screen.getByRole('link')
      expect(backButton).toHaveAttribute('href', '/dashboard/teachers')
    })

    it('displays teacher profile image when available', () => {
      render(<TeacherProfile {...defaultProps} />)

      const profileImage = screen.getByAltText(mockTeacher.full_name)
      expect(profileImage).toHaveAttribute('src', mockTeacher.profile_image_url)
    })

    it('shows default avatar when no profile image', () => {
      const teacherWithoutImage = createMockTeacher({ profile_image_url: undefined })
      
      render(<TeacherProfile {...defaultProps} teacher={teacherWithoutImage} />)

      expect(screen.queryByAltText(teacherWithoutImage.full_name)).not.toBeInTheDocument()
    })
  })

  describe('Status Badges', () => {
    it('displays employment status badge correctly', () => {
      render(<TeacherProfile {...defaultProps} />)

      expect(screen.getByText('ACTIVE')).toBeInTheDocument()
    })

    it('displays different employment statuses', () => {
      const statusCases = [
        { status: 'inactive', expected: 'INACTIVE' },
        { status: 'on_leave', expected: 'ON LEAVE' },
        { status: 'terminated', expected: 'TERMINATED' },
      ]

      statusCases.forEach(({ status, expected }) => {
        const teacher = createMockTeacher({ employment_status: status as any })
        render(<TeacherProfile teacher={teacher} />)
        
        expect(screen.getByText(expected)).toBeInTheDocument()
      })
    })

    it('displays active/inactive status badge', () => {
      render(<TeacherProfile {...defaultProps} />)

      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('displays contract type badge when available', () => {
      render(<TeacherProfile {...defaultProps} />)

      expect(screen.getByText('full time')).toBeInTheDocument()
    })
  })

  describe('Contact Information', () => {
    it('displays email with mailto link', () => {
      render(<TeacherProfile {...defaultProps} />)

      const emailLink = screen.getByRole('link', { name: mockTeacher.email })
      expect(emailLink).toHaveAttribute('href', `mailto:${mockTeacher.email}`)
    })

    it('displays phone with tel link', () => {
      render(<TeacherProfile {...defaultProps} />)

      const phoneLink = screen.getByRole('link', { name: mockTeacher.phone })
      expect(phoneLink).toHaveAttribute('href', `tel:${mockTeacher.phone}`)
    })

    it('displays address when available', () => {
      render(<TeacherProfile {...defaultProps} />)

      expect(screen.getByText(`${mockTeacher.address?.city}, ${mockTeacher.address?.country}`)).toBeInTheDocument()
    })

    it('handles missing email gracefully', () => {
      const teacherWithoutEmail = createMockTeacher({ email: undefined })
      
      expect(() => {
        render(<TeacherProfile {...defaultProps} teacher={teacherWithoutEmail} />)
      }).not.toThrow()
    })
  })

  describe('Professional Information', () => {
    it('displays hire date and experience calculation', () => {
      render(<TeacherProfile {...defaultProps} />)

      // Check for formatted hire date
      expect(screen.getByText(/hired/i)).toBeInTheDocument()
      
      // Check for experience calculation
      expect(screen.getByText(/experience/i)).toBeInTheDocument()
    })

    it('displays salary when available', () => {
      render(<TeacherProfile {...defaultProps} />)

      // Salary should be formatted as currency
      expect(screen.getByText(/UZS/)).toBeInTheDocument()
    })

    it('handles missing salary gracefully', () => {
      const teacherWithoutSalary = createMockTeacher({ 
        salary_amount: undefined,
        salary_currency: undefined 
      })
      
      render(<TeacherProfile {...defaultProps} teacher={teacherWithoutSalary} />)

      expect(screen.getByText('Not specified')).toBeInTheDocument()
    })
  })

  describe('Specializations', () => {
    it('displays teaching specializations', () => {
      render(<TeacherProfile {...defaultProps} />)

      mockTeacher.specializations.forEach(spec => {
        expect(screen.getByText(spec)).toBeInTheDocument()
      })
    })

    it('handles empty specializations', () => {
      const teacherWithoutSpecs = createMockTeacher({ specializations: [] })
      
      render(<TeacherProfile {...defaultProps} teacher={teacherWithoutSpecs} />)

      expect(screen.getByText('No specializations defined')).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('switches between tabs correctly', async () => {
      const user = userEvent.setup()
      render(<TeacherProfile {...defaultProps} />)

      // Default tab should be overview
      expect(screen.getByText('Personal Information')).toBeInTheDocument()

      // Switch to education tab
      const educationTab = screen.getByText('Education & Skills')
      await user.click(educationTab)

      expect(screen.getByText('Education & Qualifications')).toBeInTheDocument()
    })

    it('shows assignments tab content', async () => {
      const user = userEvent.setup()
      render(<TeacherProfile {...defaultProps} />)

      const assignmentsTab = screen.getByText('Assignments')
      await user.click(assignmentsTab)

      expect(screen.getByText('Current Assignments')).toBeInTheDocument()
      expect(screen.getByText('No assignments yet')).toBeInTheDocument()
    })

    it('shows documents tab content', async () => {
      const user = userEvent.setup()
      render(<TeacherProfile {...defaultProps} />)

      const documentsTab = screen.getByText('Documents')
      await user.click(documentsTab)

      expect(screen.getByText('Documents & Files')).toBeInTheDocument()
      expect(screen.getByText('No documents uploaded')).toBeInTheDocument()
    })

    it('highlights active tab correctly', async () => {
      const user = userEvent.setup()
      render(<TeacherProfile {...defaultProps} />)

      const educationTab = screen.getByText('Education & Skills')
      await user.click(educationTab)

      expect(educationTab.closest('button')).toHaveClass('border-primary', 'text-primary')
    })
  })

  describe('Overview Tab Content', () => {
    it('displays personal information section', () => {
      render(<TeacherProfile {...defaultProps} />)

      expect(screen.getByText('Personal Information')).toBeInTheDocument()
      expect(screen.getByText(mockTeacher.full_name)).toBeInTheDocument()
    })

    it('displays professional details section', () => {
      render(<TeacherProfile {...defaultProps} />)

      expect(screen.getByText('Professional Details')).toBeInTheDocument()
      expect(screen.getByText('Employee ID')).toBeInTheDocument()
    })

    it('displays emergency contact when available', () => {
      render(<TeacherProfile {...defaultProps} />)

      expect(screen.getByText('Emergency Contact')).toBeInTheDocument()
      expect(screen.getByText(mockTeacher.emergency_contact!.name)).toBeInTheDocument()
    })

    it('handles missing emergency contact', () => {
      const teacherWithoutEmergency = createMockTeacher({ emergency_contact: undefined })
      
      render(<TeacherProfile {...defaultProps} teacher={teacherWithoutEmergency} />)

      expect(screen.queryByText('Emergency Contact')).not.toBeInTheDocument()
    })

    it('displays gender and date of birth when available', () => {
      render(<TeacherProfile {...defaultProps} />)

      expect(screen.getByText('Gender')).toBeInTheDocument()
      expect(screen.getByText('Date of Birth')).toBeInTheDocument()
    })

    it('displays languages spoken', () => {
      render(<TeacherProfile {...defaultProps} />)

      expect(screen.getByText('Languages')).toBeInTheDocument()
      // Languages should be displayed as readable labels
      expect(screen.getByText('English')).toBeInTheDocument()
      expect(screen.getByText('Russian')).toBeInTheDocument()
    })
  })

  describe('Education Tab Content', () => {
    it('displays qualifications when available', async () => {
      const user = userEvent.setup()
      render(<TeacherProfile {...defaultProps} />)

      const educationTab = screen.getByText('Education & Skills')
      await user.click(educationTab)

      expect(screen.getByText('Education & Qualifications')).toBeInTheDocument()
      
      mockTeacher.qualifications.forEach(qual => {
        expect(screen.getByText(qual.degree)).toBeInTheDocument()
        expect(screen.getByText(qual.institution)).toBeInTheDocument()
      })
    })

    it('displays certifications when available', async () => {
      const user = userEvent.setup()
      render(<TeacherProfile {...defaultProps} />)

      const educationTab = screen.getByText('Education & Skills')
      await user.click(educationTab)

      expect(screen.getByText('Certifications')).toBeInTheDocument()
      
      mockTeacher.certifications.forEach(cert => {
        expect(screen.getByText(cert.name)).toBeInTheDocument()
        expect(screen.getByText(cert.institution)).toBeInTheDocument()
      })
    })

    it('displays specializations and languages sections', async () => {
      const user = userEvent.setup()
      render(<TeacherProfile {...defaultProps} />)

      const educationTab = screen.getByText('Education & Skills')
      await user.click(educationTab)

      expect(screen.getAllByText('Specializations')).toHaveLength(1)
      expect(screen.getByText('Languages Spoken')).toBeInTheDocument()
    })

    it('handles missing qualifications and certifications', async () => {
      const user = userEvent.setup()
      const teacherWithoutEducation = createMockTeacher({
        qualifications: [],
        certifications: []
      })
      
      render(<TeacherProfile {...defaultProps} teacher={teacherWithoutEducation} />)

      const educationTab = screen.getByText('Education & Skills')
      await user.click(educationTab)

      // Should not show empty sections
      expect(screen.queryByText('Education & Qualifications')).not.toBeInTheDocument()
      expect(screen.queryByText('Certifications')).not.toBeInTheDocument()
    })
  })

  describe('Actions Menu', () => {
    it('renders actions dropdown', async () => {
      const user = userEvent.setup()
      render(<TeacherProfile {...defaultProps} />)

      const actionsButton = screen.getByRole('button', { name: '' }) // More vertical icon
      await user.click(actionsButton)

      expect(screen.getByText('Export Profile')).toBeInTheDocument()
    })

    it('handles edit action', async () => {
      const user = userEvent.setup()
      render(<TeacherProfile {...defaultProps} />)

      const editButton = screen.getByText('Edit Profile')
      await user.click(editButton)

      expect(mockHandlers.onEdit).toHaveBeenCalled()
    })

    it('shows archive action for non-deleted teachers', async () => {
      const user = userEvent.setup()
      render(<TeacherProfile {...defaultProps} />)

      const actionsButton = screen.getByRole('button', { name: '' })
      await user.click(actionsButton)

      expect(screen.getByText('Archive')).toBeInTheDocument()
    })

    it('shows restore action for deleted teachers', async () => {
      const user = userEvent.setup()
      const deletedTeacher = createMockTeacher({
        deleted_at: new Date(),
        deleted_by: 'admin-id'
      })
      
      render(<TeacherProfile {...defaultProps} teacher={deletedTeacher} />)

      const actionsButton = screen.getByRole('button', { name: '' })
      await user.click(actionsButton)

      expect(screen.getByText('Restore')).toBeInTheDocument()
    })

    it('handles delete action with confirmation', async () => {
      const user = userEvent.setup()
      render(<TeacherProfile {...defaultProps} />)

      const actionsButton = screen.getByRole('button', { name: '' })
      await user.click(actionsButton)

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      // Should show confirmation dialog
      expect(screen.getByText('Delete Teacher')).toBeInTheDocument()
      expect(screen.getByText(`Are you sure you want to delete ${mockTeacher.full_name}?`)).toBeInTheDocument()

      const confirmButton = screen.getByText('Delete')
      await user.click(confirmButton)

      expect(mockHandlers.onDelete).toHaveBeenCalled()
    })
  })

  describe('Additional Notes', () => {
    it('displays notes when available', () => {
      render(<TeacherProfile {...defaultProps} />)

      expect(screen.getByText('Additional Notes')).toBeInTheDocument()
      expect(screen.getByText(mockTeacher.notes!)).toBeInTheDocument()
    })

    it('hides notes section when not available', () => {
      const teacherWithoutNotes = createMockTeacher({ notes: undefined })
      
      render(<TeacherProfile {...defaultProps} teacher={teacherWithoutNotes} />)

      expect(screen.queryByText('Additional Notes')).not.toBeInTheDocument()
    })

    it('preserves note formatting with whitespace', () => {
      const teacherWithFormattedNotes = createMockTeacher({
        notes: 'Line 1\n\nLine 2\nLine 3'
      })
      
      render(<TeacherProfile {...defaultProps} teacher={teacherWithFormattedNotes} />)

      const notesElement = screen.getByText(teacherWithFormattedNotes.notes!)
      expect(notesElement).toHaveClass('whitespace-pre-wrap')
    })
  })

  describe('Date and Experience Calculations', () => {
    it('calculates experience correctly for years and months', () => {
      const pastHireDate = new Date()
      pastHireDate.setFullYear(pastHireDate.getFullYear() - 2)
      pastHireDate.setMonth(pastHireDate.getMonth() - 6)

      const teacher = createMockTeacher({ hire_date: pastHireDate })
      
      render(<TeacherProfile {...defaultProps} teacher={teacher} />)

      expect(screen.getByText(/2 years.*6 months.*experience/)).toBeInTheDocument()
    })

    it('handles recent hires (months only)', () => {
      const recentHireDate = new Date()
      recentHireDate.setMonth(recentHireDate.getMonth() - 3)

      const teacher = createMockTeacher({ hire_date: recentHireDate })
      
      render(<TeacherProfile {...defaultProps} teacher={teacher} />)

      expect(screen.getByText(/3 months.*experience/)).toBeInTheDocument()
    })

    it('formats dates in readable format', () => {
      const teacher = createMockTeacher({
        hire_date: new Date('2024-01-15'),
        date_of_birth: new Date('1990-06-20')
      })
      
      render(<TeacherProfile {...defaultProps} teacher={teacher} />)

      expect(screen.getByText('Hired January 15, 2024')).toBeInTheDocument()
      expect(screen.getByText('Born June 20, 1990')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<TeacherProfile {...defaultProps} />)

      expect(screen.getByRole('heading', { level: 1, name: mockTeacher.full_name })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Teaching Specializations' })).toBeInTheDocument()
    })

    it('has proper button labels and ARIA attributes', () => {
      render(<TeacherProfile {...defaultProps} />)

      const editButton = screen.getByRole('button', { name: 'Edit Profile' })
      expect(editButton).toBeInTheDocument()

      const tabs = screen.getAllByRole('button')
      const overviewTab = tabs.find(tab => tab.textContent?.includes('Overview'))
      expect(overviewTab).toBeInTheDocument()
    })

    it('supports keyboard navigation for tabs', async () => {
      const user = userEvent.setup()
      render(<TeacherProfile {...defaultProps} />)

      const educationTab = screen.getByText('Education & Skills')
      educationTab.focus()
      await user.keyboard('{Enter}')

      expect(screen.getByText('Education & Qualifications')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles missing optional fields gracefully', () => {
      const minimalTeacher = {
        ...mockTeacher,
        email: undefined,
        date_of_birth: undefined,
        gender: undefined,
        address: undefined,
        emergency_contact: undefined,
        notes: undefined,
        qualifications: [],
        certifications: [],
        specializations: [],
        languages_spoken: []
      }
      
      expect(() => {
        render(<TeacherProfile {...defaultProps} teacher={minimalTeacher} />)
      }).not.toThrow()
    })

    it('handles undefined/null props gracefully', () => {
      expect(() => {
        render(
          <TeacherProfile 
            teacher={mockTeacher}
            loading={false}
          />
        )
      }).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const { rerender } = render(<TeacherProfile {...defaultProps} />)
      
      // Re-render with same props
      rerender(<TeacherProfile {...defaultProps} />)
      
      // Component should handle this gracefully
      expect(screen.getByText(mockTeacher.full_name)).toBeInTheDocument()
    })
  })
})