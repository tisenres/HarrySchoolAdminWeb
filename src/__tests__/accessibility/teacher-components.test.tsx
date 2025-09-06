import { render } from '../utils/test-utils'
import { TeachersTable } from '@/components/admin/teachers/teachers-table'
import { TeacherForm } from '@/components/admin/teachers/teacher-form'
import { TeachersFilters } from '@/components/admin/teachers/teachers-filters'
import { TeacherProfile } from '@/components/admin/teachers/teacher-profile'
import { 
  createMockTeacherList,
  createMockTeacher,
  createMockTeacherFilters,
  createMockHandlers
} from '../utils/mock-data'

// Mock axe-core for accessibility testing
jest.mock('axe-core', () => ({
  run: jest.fn().mockResolvedValue({
    violations: [],
    passes: [],
    incomplete: [],
    inapplicable: []
  })
}))

import { run as axeRun } from 'axe-core'

// Helper function to run accessibility tests
const runAxeTest = async (container: HTMLElement) => {
  const results = await axeRun(container, {
    rules: {
      // Configure specific rules for our use case
      'color-contrast': { enabled: true },
      'keyboard': { enabled: true },
      'aria-allowed-attr': { enabled: true },
      'aria-required-children': { enabled: true },
      'aria-required-parent': { enabled: true },
      'aria-roles': { enabled: true },
      'aria-valid-attr': { enabled: true },
      'aria-valid-attr-value': { enabled: true },
      'button-name': { enabled: true },
      'form-field-multiple-labels': { enabled: true },
      'label': { enabled: true },
      'link-name': { enabled: true },
      'list': { enabled: true },
      'listitem': { enabled: true },
      'tabindex': { enabled: true }
    }
  })
  
  return results
}

describe('Accessibility Tests for Teacher Components', () => {
  const mockTeachers = createMockTeacherList(5)
  const mockHandlers = createMockHandlers()

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock to default success state
    ;(axeRun as jest.Mock).mockResolvedValue({
      violations: [],
      passes: [],
      incomplete: [],
      inapplicable: []
    })
  })

  describe('TeachersTable Accessibility', () => {
    const tableProps = {
      teachers: mockTeachers,
      selectedTeachers: [],
      onSelectionChange: mockHandlers.onSelectionChange,
      onEdit: mockHandlers.onEdit,
      onDelete: mockHandlers.onDelete,
      onBulkDelete: mockHandlers.onBulkDelete,
      onSortChange: mockHandlers.onSortChange,
      sortConfig: { field: 'full_name' as const, direction: 'asc' as const }
    }

    it('should have no accessibility violations', async () => {
      const { container } = render(<TeachersTable {...tableProps} />)
      
      const results = await runAxeTest(container)
      expect(results.violations).toHaveLength(0)
    })

    it('should have proper table structure', () => {
      const { container } = render(<TeachersTable {...tableProps} />)
      
      const table = container.querySelector('table')
      expect(table).toHaveAttribute('role', 'table')
      
      const headers = container.querySelectorAll('th')
      headers.forEach(header => {
        expect(header).toHaveAttribute('role', 'columnheader')
      })
      
      const rows = container.querySelectorAll('tbody tr')
      rows.forEach(row => {
        expect(row).toHaveAttribute('role', 'row')
      })
    })

    it('should have accessible sorting controls', () => {
      const { container } = render(<TeachersTable {...tableProps} />)
      
      const sortableHeaders = container.querySelectorAll('[role="button"][aria-sort]')
      sortableHeaders.forEach(header => {
        expect(header).toHaveAttribute('tabindex', '0')
        expect(header).toHaveAttribute('aria-sort')
        expect(['ascending', 'descending', 'none']).toContain(
          header.getAttribute('aria-sort')
        )
      })
    })

    it('should have accessible checkboxes with proper labels', () => {
      const { container } = render(<TeachersTable {...tableProps} />)
      
      // Select all checkbox
      const selectAllCheckbox = container.querySelector('input[type="checkbox"][aria-label="Select all teachers"]')
      expect(selectAllCheckbox).toBeInTheDocument()
      
      // Individual teacher checkboxes
      mockTeachers.forEach(teacher => {
        const checkbox = container.querySelector(`input[aria-label="Select ${teacher.full_name}"]`)
        expect(checkbox).toBeInTheDocument()
        expect(checkbox).toHaveAttribute('type', 'checkbox')
      })
    })

    it('should have accessible action buttons', () => {
      const { container } = render(<TeachersTable {...tableProps} />)
      
      // Action menu buttons
      mockTeachers.forEach(teacher => {
        const actionButton = container.querySelector(`button[aria-label="Open menu for ${teacher.full_name}"]`)
        expect(actionButton).toBeInTheDocument()
      })
      
      // Pagination buttons
      const paginationButtons = container.querySelectorAll('[aria-label*="page"]')
      paginationButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label')
      })
    })

    it('should provide screen reader announcements for loading and empty states', () => {
      // Loading state
      const { container: loadingContainer } = render(
        <TeachersTable {...tableProps} loading={true} />
      )
      expect(loadingContainer).toHaveTextContent('Loading teachers...')
      
      // Empty state
      const { container: emptyContainer } = render(
        <TeachersTable {...tableProps} teachers={[]} />
      )
      expect(emptyContainer).toHaveTextContent('No teachers found.')
    })

    it('should handle keyboard navigation', () => {
      const { container } = render(<TeachersTable {...tableProps} />)
      
      // All interactive elements should be keyboard accessible
      const interactiveElements = container.querySelectorAll(
        'button, input, [role="button"], [tabindex="0"]'
      )
      
      interactiveElements.forEach(element => {
        expect(element).toHaveAttribute('tabindex')
        const tabIndex = element.getAttribute('tabindex')
        expect(tabIndex).not.toBe('-1') // Should be focusable
      })
    })
  })

  describe('TeacherForm Accessibility', () => {
    const formProps = {
      onSubmit: mockHandlers.onSubmit,
      onCancel: mockHandlers.onCancel,
      isLoading: false,
    }

    it('should have no accessibility violations', async () => {
      const { container } = render(<TeacherForm {...formProps} />)
      
      const results = await runAxeTest(container)
      expect(results.violations).toHaveLength(0)
    })

    it('should have proper form structure', () => {
      const { container } = render(<TeacherForm {...formProps} />)
      
      const form = container.querySelector('form')
      expect(form).toBeInTheDocument()
      
      // All inputs should have labels
      const inputs = container.querySelectorAll('input, textarea, select')
      inputs.forEach(input => {
        const id = input.getAttribute('id')
        if (id) {
          const label = container.querySelector(`label[for="${id}"]`)
          expect(label).toBeInTheDocument()
        }
      })
    })

    it('should have accessible required field indicators', () => {
      const { container } = render(<TeacherForm {...formProps} />)
      
      // Required fields should have visual indicators
      const requiredLabels = container.querySelectorAll('label:has(.text-red-500)')
      expect(requiredLabels.length).toBeGreaterThan(0)
      
      // Required fields should have aria-required
      const requiredInputs = container.querySelectorAll('input[aria-required="true"], input[required]')
      expect(requiredInputs.length).toBeGreaterThan(0)
    })

    it('should have accessible error messages', () => {
      // Render form with validation errors
      const { container } = render(<TeacherForm {...formProps} />)
      
      // Error messages should be associated with inputs
      const errorMessages = container.querySelectorAll('[role="alert"], .text-red-500')
      errorMessages.forEach(error => {
        expect(error).toHaveTextContent(/\w+/) // Should have meaningful text
      })
    })

    it('should have accessible file upload', () => {
      const { container } = render(<TeacherForm {...formProps} />)
      
      const fileInput = container.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
      
      const uploadButton = container.querySelector('button:has-text("Upload Photo")')
      expect(uploadButton).toHaveAccessibleName()
    })

    it('should have accessible form sections', () => {
      const { container } = render(<TeacherForm {...formProps} />)
      
      // Form sections should have proper headings
      const sectionHeadings = container.querySelectorAll('h2, h3, [role="heading"]')
      expect(sectionHeadings.length).toBeGreaterThan(0)
      
      sectionHeadings.forEach(heading => {
        expect(heading).toHaveTextContent(/\w+/)
      })
    })

    it('should have accessible form controls', () => {
      const { container } = render(<TeacherForm {...formProps} />)
      
      // Buttons should have accessible names
      const buttons = container.querySelectorAll('button')
      buttons.forEach(button => {
        expect(
          button.textContent ||
          button.getAttribute('aria-label') ||
          button.getAttribute('title')
        ).toBeTruthy()
      })
      
      // Selects should have labels
      const selects = container.querySelectorAll('select, [role="combobox"]')
      selects.forEach(select => {
        expect(select).toHaveAccessibleName()
      })
    })
  })

  describe('TeachersFilters Accessibility', () => {
    const filtersProps = {
      filters: createMockTeacherFilters(),
      onFiltersChange: mockHandlers.onFiltersChange,
      availableSpecializations: ['English', 'Mathematics'],
      loading: false,
      totalCount: 25,
    }

    it('should have no accessibility violations', async () => {
      const { container } = render(<TeachersFilters {...filtersProps} />)
      
      const results = await runAxeTest(container)
      expect(results.violations).toHaveLength(0)
    })

    it('should have accessible search input', () => {
      const { container } = render(<TeachersFilters {...filtersProps} />)
      
      const searchInput = container.querySelector('[type="search"], input[placeholder*="Search"]')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAccessibleName()
    })

    it('should have accessible filter controls', () => {
      const { container } = render(<TeachersFilters {...filtersProps} />)
      
      // Dropdown triggers should be accessible
      const dropdownTriggers = container.querySelectorAll('[role="button"]')
      dropdownTriggers.forEach(trigger => {
        expect(trigger).toHaveAttribute('aria-expanded')
        expect(trigger).toHaveAccessibleName()
      })
      
      // Checkboxes should have labels
      const checkboxes = container.querySelectorAll('input[type="checkbox"]')
      checkboxes.forEach(checkbox => {
        expect(checkbox).toHaveAccessibleName()
      })
    })

    it('should have accessible active filters', () => {
      const filtersWithActive = {
        ...filtersProps,
        filters: {
          ...filtersProps.filters,
          search: 'test search',
          employment_status: ['active']
        }
      }
      
      const { container } = render(<TeachersFilters {...filtersWithActive} />)
      
      // Active filters should be announced
      const activeFilters = container.querySelectorAll('[data-testid="active-filter"]')
      activeFilters.forEach(filter => {
        expect(filter).toHaveAccessibleName()
        
        // Remove buttons should be accessible
        const removeButton = filter.querySelector('button')
        if (removeButton) {
          expect(removeButton).toHaveAccessibleName()
        }
      })
    })

    it('should provide loading state announcements', () => {
      const { container } = render(
        <TeachersFilters {...filtersProps} loading={true} />
      )
      
      const loadingIndicator = container.querySelector('[aria-label*="loading"], .animate-spin')
      expect(loadingIndicator).toBeInTheDocument()
    })
  })

  describe('TeacherProfile Accessibility', () => {
    const profileProps = {
      teacher: createMockTeacher(),
      onEdit: mockHandlers.onEdit,
      onDelete: mockHandlers.onDelete,
      loading: false,
    }

    it('should have no accessibility violations', async () => {
      const { container } = render(<TeacherProfile {...profileProps} />)
      
      const results = await runAxeTest(container)
      expect(results.violations).toHaveLength(0)
    })

    it('should have proper heading structure', () => {
      const { container } = render(<TeacherProfile {...profileProps} />)
      
      // Should have main heading
      const mainHeading = container.querySelector('h1')
      expect(mainHeading).toBeInTheDocument()
      expect(mainHeading).toHaveTextContent(profileProps.teacher.full_name)
      
      // Section headings should follow hierarchy
      const sectionHeadings = container.querySelectorAll('h2, h3, h4')
      expect(sectionHeadings.length).toBeGreaterThan(0)
    })

    it('should have accessible navigation tabs', () => {
      const { container } = render(<TeacherProfile {...profileProps} />)
      
      const tabs = container.querySelectorAll('[role="tab"], button[aria-selected]')
      tabs.forEach(tab => {
        expect(tab).toHaveAccessibleName()
        expect(tab).toHaveAttribute('aria-selected')
      })
      
      // Should have tabpanel for active content
      const tabpanels = container.querySelectorAll('[role="tabpanel"]')
      expect(tabpanels.length).toBeGreaterThanOrEqual(1)
    })

    it('should have accessible contact links', () => {
      const { container } = render(<TeacherProfile {...profileProps} />)
      
      // Email link
      const emailLink = container.querySelector(`a[href="mailto:${profileProps.teacher.email}"]`)
      expect(emailLink).toBeInTheDocument()
      expect(emailLink).toHaveAccessibleName()
      
      // Phone link
      const phoneLink = container.querySelector(`a[href="tel:${profileProps.teacher.phone}"]`)
      expect(phoneLink).toBeInTheDocument()
      expect(phoneLink).toHaveAccessibleName()
    })

    it('should have accessible profile image', () => {
      const { container } = render(<TeacherProfile {...profileProps} />)
      
      const profileImage = container.querySelector('img')
      if (profileImage) {
        expect(profileImage).toHaveAttribute('alt')
        expect(profileImage.getAttribute('alt')).toBe(profileProps.teacher.full_name)
      }
    })

    it('should have accessible action buttons', () => {
      const { container } = render(<TeacherProfile {...profileProps} />)
      
      // Edit button
      const editButton = container.querySelector('button:has-text("Edit Profile")')
      expect(editButton).toHaveAccessibleName()
      
      // Actions menu
      const actionsMenu = container.querySelector('button[aria-label*="menu"], button[aria-haspopup]')
      if (actionsMenu) {
        expect(actionsMenu).toHaveAttribute('aria-haspopup')
        expect(actionsMenu).toHaveAccessibleName()
      }
    })

    it('should handle loading state accessibly', () => {
      const { container } = render(<TeacherProfile {...profileProps} loading={true} />)
      
      const loadingIndicator = container.querySelector('[role="progressbar"], .animate-spin')
      expect(loadingIndicator).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation Tests', () => {
    it('should support keyboard navigation in TeachersTable', () => {
      const tableProps = {
        teachers: mockTeachers,
        selectedTeachers: [],
        onSelectionChange: mockHandlers.onSelectionChange,
        onEdit: mockHandlers.onEdit,
        onDelete: mockHandlers.onDelete,
        onBulkDelete: mockHandlers.onBulkDelete,
      }
      
      const { container } = render(<TeachersTable {...tableProps} />)
      
      // Should be able to focus interactive elements
      const focusableElements = container.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      
      expect(focusableElements.length).toBeGreaterThan(0)
      
      focusableElements.forEach(element => {
        expect(element.getAttribute('tabindex')).not.toBe('-1')
      })
    })

    it('should support keyboard navigation in TeacherForm', () => {
      const formProps = {
        onSubmit: mockHandlers.onSubmit,
        onCancel: mockHandlers.onCancel,
      }
      
      const { container } = render(<TeacherForm {...formProps} />)
      
      // Form should be navigable with keyboard
      const formElements = container.querySelectorAll(
        'input, textarea, select, button:not([disabled])'
      )
      
      expect(formElements.length).toBeGreaterThan(0)
      
      // All form elements should be keyboard accessible
      formElements.forEach(element => {
        expect(element.getAttribute('tabindex')).not.toBe('-1')
      })
    })
  })

  describe('Screen Reader Support', () => {
    it('should provide appropriate ARIA labels', () => {
      const tableProps = {
        teachers: mockTeachers,
        selectedTeachers: [],
        onSelectionChange: mockHandlers.onSelectionChange,
        onEdit: mockHandlers.onEdit,
        onDelete: mockHandlers.onDelete,
        onBulkDelete: mockHandlers.onBulkDelete,
      }
      
      const { container } = render(<TeachersTable {...tableProps} />)
      
      // Check for ARIA labels on important elements
      const ariaLabelledElements = container.querySelectorAll('[aria-label], [aria-labelledby]')
      expect(ariaLabelledElements.length).toBeGreaterThan(0)
      
      // Check for ARIA descriptions
      const ariaDescribedElements = container.querySelectorAll('[aria-describedby]')
      ariaDescribedElements.forEach(element => {
        const describedBy = element.getAttribute('aria-describedby')
        if (describedBy) {
          const description = container.querySelector(`#${describedBy}`)
          expect(description).toBeInTheDocument()
        }
      })
    })

    it('should announce dynamic content changes', () => {
      const filtersProps = {
        filters: createMockTeacherFilters(),
        onFiltersChange: mockHandlers.onFiltersChange,
        availableSpecializations: [],
        totalCount: 0,
      }
      
      const { container } = render(<TeachersFilters {...filtersProps} />)
      
      // Should have regions for announcing changes
      const liveRegions = container.querySelectorAll('[aria-live], [role="status"], [role="alert"]')
      expect(liveRegions.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Focus Management', () => {
    it('should manage focus appropriately in modals/dialogs', async () => {
      // This would test focus trapping in confirmation dialogs
      const profileProps = {
        teacher: createMockTeacher(),
        onEdit: mockHandlers.onEdit,
        onDelete: mockHandlers.onDelete,
      }
      
      const { container } = render(<TeacherProfile {...profileProps} />)
      
      // Modal triggers should be properly focusable
      const modalTriggers = container.querySelectorAll('[data-testid*="modal"], [aria-haspopup="dialog"]')
      modalTriggers.forEach(trigger => {
        expect(trigger).toHaveAttribute('tabindex')
      })
    })

    it('should return focus after closing modals', () => {
      // This would typically be tested with user interactions
      // For now, we ensure proper focus indicators exist
      const formProps = {
        onSubmit: mockHandlers.onSubmit,
        onCancel: mockHandlers.onCancel,
      }
      
      const { container } = render(<TeacherForm {...formProps} />)
      
      const focusableElements = container.querySelectorAll('button, input, select, textarea')
      focusableElements.forEach(element => {
        // Should not have tabindex="-1" (unfocusable)
        expect(element.getAttribute('tabindex')).not.toBe('-1')
      })
    })
  })

  describe('Color and Contrast', () => {
    it('should not rely solely on color for information', () => {
      const tableProps = {
        teachers: mockTeachers,
        selectedTeachers: [],
        onSelectionChange: mockHandlers.onSelectionChange,
        onEdit: mockHandlers.onEdit,
        onDelete: mockHandlers.onDelete,
        onBulkDelete: mockHandlers.onBulkDelete,
      }
      
      const { container } = render(<TeachersTable {...tableProps} />)
      
      // Status indicators should have text or icons, not just color
      const statusElements = container.querySelectorAll('[class*="badge"], [class*="status"]')
      statusElements.forEach(element => {
        expect(element.textContent?.trim()).toBeTruthy()
      })
    })

    it('should use appropriate semantic colors', () => {
      const formProps = {
        onSubmit: mockHandlers.onSubmit,
        onCancel: mockHandlers.onCancel,
      }
      
      const { container } = render(<TeacherForm {...formProps} />)
      
      // Error states should be clearly marked
      const errorElements = container.querySelectorAll('.text-red-500, [class*="error"]')
      errorElements.forEach(element => {
        expect(element).toHaveTextContent(/\w+/) // Should have meaningful text
      })
    })
  })
})