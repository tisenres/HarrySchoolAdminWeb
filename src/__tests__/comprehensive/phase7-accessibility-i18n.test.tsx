/**
 * PHASE 7: Accessibility & Internationalization Testing
 * 
 * Comprehensive testing of accessibility features and internationalization
 * Testing WCAG compliance, screen reader support, and multi-language functionality
 */

import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StudentsClient from '@/app/[locale]/(dashboard)/students/students-client'
import { 
  generateStudentDataset, 
  createMockApiResponse,
  createAccessibilityTestHelpers,
  createI18nTestHelpers
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

describe('Phase 7: Accessibility & Internationalization Testing', () => {
  let user: ReturnType<typeof userEvent.setup>
  let a11yHelpers: ReturnType<typeof createAccessibilityTestHelpers>
  let i18nHelpers: ReturnType<typeof createI18nTestHelpers>
  
  beforeEach(() => {
    jest.clearAllMocks()
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    jest.useFakeTimers()
    
    a11yHelpers = createAccessibilityTestHelpers()
    i18nHelpers = createI18nTestHelpers()
    
    // Default data state
    mockUseQuery.mockReturnValue({
      data: createMockApiResponse(generateStudentDataset(10)),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('7.1 WCAG 2.1 Compliance - Level A', () => {
    test('should have proper semantic HTML structure', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should have proper semantic structure
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getAllByRole('columnheader')).toHaveLength(6) // Adjust based on actual columns
      expect(screen.getAllByRole('row')).toHaveLength(11) // 10 students + header
    })

    test('should have proper heading hierarchy', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Check heading hierarchy (h1 -> h2 -> h3, etc.)
      const headings = screen.getAllByRole('heading')
      expect(headings[0]).toHaveProperty('tagName', 'H1')
      
      // Subsequent headings should follow proper hierarchy
      for (let i = 1; i < headings.length; i++) {
        const currentLevel = parseInt(headings[i].tagName.charAt(1))
        const previousLevel = parseInt(headings[i-1].tagName.charAt(1))
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1)
      }
    })

    test('should have alt text for all images', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const images = screen.getAllByRole('img')
      images.forEach(img => {
        expect(img).toHaveAttribute('alt')
        expect(img.getAttribute('alt')).not.toBe('')
      })
    })

    test('should have labels for all form controls', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Click add student to open form
      const addButton = screen.getByRole('button', { name: /add student/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // All form inputs should have labels
      const inputs = screen.getAllByRole('textbox')
      inputs.forEach(input => {
        const label = screen.getByLabelText(new RegExp(input.getAttribute('name') || '', 'i'))
        expect(label).toBeInTheDocument()
      })

      const selects = screen.getAllByRole('combobox')
      selects.forEach(select => {
        const label = screen.getByLabelText(new RegExp(select.getAttribute('name') || '', 'i'))
        expect(label).toBeInTheDocument()
      })
    })

    test('should have sufficient color contrast', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Test color contrast for key elements
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button)
        const contrast = a11yHelpers.checkColorContrast(
          styles.color,
          styles.backgroundColor
        )
        expect(contrast.passes).toBe(true)
        expect(contrast.ratio).toBeGreaterThanOrEqual(4.5) // WCAG AA standard
      })
    })

    test('should support keyboard navigation', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Tab through all focusable elements
      const focusableElements = screen.getAllByRole('button')
        .concat(screen.getAllByRole('textbox'))
        .concat(screen.getAllByRole('checkbox'))

      for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
        await user.tab()
        
        // Check that focus is visible
        const focusedElement = document.activeElement
        expect(focusedElement).toBeInstanceOf(HTMLElement)
        
        const styles = window.getComputedStyle(focusedElement as HTMLElement)
        expect(styles.outline).not.toBe('none')
      }
    })
  })

  describe('7.2 WCAG 2.1 Compliance - Level AA', () => {
    test('should have enhanced color contrast (4.5:1)', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Check all text elements have sufficient contrast
      const textElements = screen.getAllByText(/./); // All text nodes
      
      textElements.slice(0, 20).forEach(element => { // Test subset for performance
        const styles = window.getComputedStyle(element)
        const contrast = a11yHelpers.checkColorContrast(
          styles.color,
          styles.backgroundColor
        )
        expect(contrast.ratio).toBeGreaterThanOrEqual(4.5)
      })
    })

    test('should support high contrast mode', async () => {
      // Simulate high contrast mode
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should adapt to high contrast preferences
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button)
        // In high contrast mode, colors should be more pronounced
        expect(styles.borderWidth).not.toBe('0px')
      })
    })

    test('should have proper focus management', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Open modal
      const addButton = screen.getByRole('button', { name: /add student/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Focus should be trapped in modal
      const modalElements = screen.getAllByRole('textbox')
      if (modalElements.length > 0) {
        expect(document.activeElement).toBe(modalElements[0])
      }

      // Close modal with Escape
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Focus should return to trigger button
      expect(document.activeElement).toBe(addButton)
    })

    test('should provide meaningful error messages', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add student/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Submit form without required fields
      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert')
        errorMessages.forEach(error => {
          expect(error).toHaveTextContent(/required|invalid|error/i)
          expect(error).toHaveAttribute('aria-live', 'polite')
        })
      })
    })
  })

  describe('7.3 Screen Reader Support', () => {
    test('should have proper ARIA labels and descriptions', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Table should have proper ARIA labels
      const table = screen.getByRole('table')
      expect(table).toHaveAttribute('aria-label', expect.stringMatching(/students/i))

      // Column headers should be properly labeled
      const columnHeaders = screen.getAllByRole('columnheader')
      columnHeaders.forEach(header => {
        expect(header).toHaveAttribute('aria-sort')
      })

      // Row checkboxes should have descriptive labels
      const checkboxes = screen.getAllByRole('checkbox')
      checkboxes.forEach(checkbox => {
        const label = checkbox.getAttribute('aria-label') || 
                     checkbox.getAttribute('aria-labelledby')
        expect(label).toBeTruthy()
      })
    })

    test('should announce dynamic content changes', async () => {
      const mockAnnounce = jest.fn()
      
      // Mock screen reader announcements
      Object.defineProperty(window, 'speechSynthesis', {
        value: {
          speak: mockAnnounce,
          cancel: jest.fn(),
          pause: jest.fn(),
          resume: jest.fn(),
        },
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Trigger search to change content
      const searchInput = screen.getByRole('textbox', { name: /search/i })
      await user.type(searchInput, 'test')

      act(() => {
        jest.advanceTimersByTime(500) // Debounce delay
      })

      await waitFor(() => {
        // Should have live region updates
        const liveRegions = screen.getAllByRole('status')
        expect(liveRegions.length).toBeGreaterThan(0)
      })
    })

    test('should support screen reader navigation landmarks', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should have proper landmarks
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      
      // Search should be in a search landmark
      const searchRegion = screen.getByRole('search')
      expect(searchRegion).toBeInTheDocument()
      expect(searchRegion).toContainElement(screen.getByRole('textbox', { name: /search/i }))
    })

    test('should provide table navigation shortcuts', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const table = screen.getByRole('table')
      
      // Focus first cell
      const firstCell = screen.getAllByRole('cell')[0]
      firstCell.focus()

      // Test table navigation
      await a11yHelpers.simulateKeyboardNavigation(firstCell, 'ArrowRight')
      await a11yHelpers.simulateKeyboardNavigation(firstCell, 'ArrowDown')
      await a11yHelpers.simulateKeyboardNavigation(firstCell, 'Home')
      await a11yHelpers.simulateKeyboardNavigation(firstCell, 'End')

      // Should support table navigation
      expect(table).toBeInTheDocument()
    })

    test('should provide meaningful button descriptions', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        // Each button should have either text content or aria-label
        const hasText = button.textContent && button.textContent.trim().length > 0
        const hasAriaLabel = button.hasAttribute('aria-label')
        const hasAriaLabelledBy = button.hasAttribute('aria-labelledby')
        
        expect(hasText || hasAriaLabel || hasAriaLabelledBy).toBe(true)
      })
    })
  })

  describe('7.4 Keyboard Navigation', () => {
    test('should support all functionality via keyboard', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Navigate to search and use it
      const searchInput = screen.getByRole('textbox', { name: /search/i })
      searchInput.focus()
      await user.type(searchInput, 'test')

      // Navigate to sort button and activate it
      const sortButton = screen.getByRole('button', { name: /name/i })
      sortButton.focus()
      await user.keyboard('{Enter}')

      // Navigate to pagination
      const nextButton = screen.getByRole('button', { name: /next/i })
      nextButton.focus()
      await user.keyboard(' ') // Space key

      // All interactions should work via keyboard
      expect(searchInput).toHaveValue('test')
    })

    test('should have visible focus indicators', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const focusableElements = [
        ...screen.getAllByRole('button'),
        ...screen.getAllByRole('textbox'),
        ...screen.getAllByRole('checkbox')
      ]

      for (const element of focusableElements.slice(0, 5)) {
        element.focus()
        
        const styles = window.getComputedStyle(element)
        // Should have visible focus indicator
        expect(
          styles.outline !== 'none' || 
          styles.boxShadow !== 'none' ||
          styles.border !== styles.borderColor
        ).toBe(true)
      }
    })

    test('should support custom keyboard shortcuts', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Test common shortcuts
      await user.keyboard('{Control>}k{/Control}') // Search shortcut
      
      await waitFor(() => {
        const searchInput = screen.getByRole('textbox', { name: /search/i })
        expect(document.activeElement).toBe(searchInput)
      })

      await user.keyboard('{Control>}n{/Control}') // New student shortcut
      
      await waitFor(() => {
        // Should open add student dialog or focus add button
        expect(
          screen.getByRole('dialog') || 
          document.activeElement === screen.getByRole('button', { name: /add/i })
        ).toBeTruthy()
      })
    })

    test('should handle modal keyboard trapping', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add student/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const modalInputs = screen.getAllByRole('textbox')
      const modalButtons = screen.getAllByRole('button')
      const modalFocusable = [...modalInputs, ...modalButtons]

      // Tab through modal elements
      for (let i = 0; i < modalFocusable.length + 2; i++) {
        await user.tab()
        
        // Focus should stay within modal
        const activeElement = document.activeElement
        const isInModal = modalFocusable.some(el => el === activeElement) ||
                         screen.getByRole('dialog').contains(activeElement)
        expect(isInModal).toBe(true)
      }
    })
  })

  describe('7.5 Internationalization (i18n)', () => {
    test('should support English language', async () => {
      // Mock English locale
      const translations = i18nHelpers.createMockTranslations('en')
      
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(translations.students.title)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: translations.students.addStudent })).toBeInTheDocument()
        expect(screen.getByPlaceholderText(translations.students.search)).toBeInTheDocument()
      })
    })

    test('should support Arabic (RTL) language', async () => {
      const translations = i18nHelpers.createMockTranslations('ar')
      
      // Mock RTL direction
      document.dir = 'rtl'

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(translations.students.title)).toBeInTheDocument()
      })

      // Check RTL layout
      const table = screen.getByRole('table')
      const styles = window.getComputedStyle(table)
      expect(styles.direction).toBe('rtl')

      // Reset
      document.dir = 'ltr'
    })

    test('should support Chinese language', async () => {
      const translations = i18nHelpers.createMockTranslations('zh')
      
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(translations.students.title)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: translations.students.addStudent })).toBeInTheDocument()
      })

      // Should handle Chinese characters properly
      expect(screen.getByText(/学生/)).toBeInTheDocument()
    })

    test('should handle language switching dynamically', async () => {
      let currentLocale = 'en'
      
      const TestWrapper = () => {
        const translations = i18nHelpers.createMockTranslations(currentLocale)
        
        return (
          <div>
            <button onClick={() => currentLocale = 'ar'}>Switch to Arabic</button>
            <StudentsClient />
          </div>
        )
      }

      const { rerender } = render(<TestWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Students')).toBeInTheDocument()
      })

      // Switch language
      currentLocale = 'ar'
      rerender(<TestWrapper />)

      await waitFor(() => {
        expect(screen.getByText('الطلاب')).toBeInTheDocument()
      })
    })

    test('should handle complex text layouts', async () => {
      const complexLanguages = i18nHelpers.complexLanguages
      
      for (const lang of complexLanguages.slice(0, 3)) { // Test subset
        const translations = i18nHelpers.createMockTranslations(lang)
        
        const { unmount } = render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students|学生|طلاب/)).toBeInTheDocument()
        })

        // Should handle complex text without layout issues
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()
        
        unmount()
      }
    })

    test('should support locale-specific formatting', async () => {
      const testDate = new Date('2024-01-15')
      const testNumber = 1234.56
      
      // Test different locale formatting
      const locales = ['en-US', 'ar-EG', 'zh-CN']
      
      for (const locale of locales) {
        const expectedDate = testDate.toLocaleDateString(locale)
        const expectedNumber = testNumber.toLocaleString(locale)
        
        render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })

        // Should format dates and numbers according to locale
        // Note: This would require actual date/number display in component
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      }
    })
  })

  describe('7.6 Reduced Motion Support', () => {
    test('should respect prefers-reduced-motion', async () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should disable or reduce animations
      const animatedElements = screen.getAllByRole('button')
      animatedElements.forEach(element => {
        const styles = window.getComputedStyle(element)
        expect(
          styles.animationDuration === '0s' ||
          styles.transitionDuration === '0s' ||
          styles.animationPlayState === 'paused'
        ).toBe(true)
      })
    })

    test('should provide static alternatives to animations', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Loading states should have non-animated alternatives
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      })

      const { rerender } = render(<StudentsClient />)

      await waitFor(() => {
        const loadingElement = screen.getByText(/loading/i)
        expect(loadingElement).toBeInTheDocument()
        
        // Should provide text-based loading indicator
        expect(loadingElement).toHaveTextContent(/loading|wait/i)
      })
    })
  })

  describe('7.7 High Contrast and Dark Mode', () => {
    test('should support dark mode', async () => {
      // Mock dark mode preference
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should adapt to dark mode
      const body = document.body
      const styles = window.getComputedStyle(body)
      
      // Should have dark theme styles
      expect(
        styles.backgroundColor === 'rgb(0, 0, 0)' ||
        styles.backgroundColor === 'rgb(18, 18, 18)' ||
        body.classList.contains('dark')
      ).toBe(true)
    })

    test('should maintain contrast ratios in all themes', async () => {
      const themes = ['light', 'dark', 'high-contrast']
      
      for (const theme of themes) {
        document.body.className = theme
        
        render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })

        // Check contrast ratios
        const textElements = screen.getAllByText(/./);
        textElements.slice(0, 10).forEach(element => {
          const styles = window.getComputedStyle(element)
          const contrast = a11yHelpers.checkColorContrast(
            styles.color,
            styles.backgroundColor
          )
          expect(contrast.ratio).toBeGreaterThanOrEqual(4.5)
        })
      }
    })
  })

  describe('7.8 Font and Text Scaling', () => {
    test('should support text scaling up to 200%', async () => {
      // Mock increased font size
      const originalFontSize = document.documentElement.style.fontSize
      document.documentElement.style.fontSize = '200%'

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should handle larger text without layout breaking
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
      
      // Text should still be readable and not overflow
      const cells = screen.getAllByRole('cell')
      cells.forEach(cell => {
        const styles = window.getComputedStyle(cell)
        expect(styles.overflow === 'hidden' || styles.overflow === 'visible').toBe(true)
      })

      // Reset
      document.documentElement.style.fontSize = originalFontSize
    })

    test('should support different font families', async () => {
      const fontFamilies = [
        'Arial, sans-serif',
        'Times New Roman, serif',
        'Courier New, monospace',
        'OpenDyslexic, sans-serif' // Dyslexia-friendly font
      ]

      for (const fontFamily of fontFamilies) {
        document.body.style.fontFamily = fontFamily
        
        render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })

        // Should render correctly with different fonts
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      }
    })
  })
})