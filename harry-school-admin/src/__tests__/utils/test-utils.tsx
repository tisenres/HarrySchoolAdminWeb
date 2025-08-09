import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'

// Mock translations
const messages = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    loading: 'Loading...',
    search: 'Search...',
    clear: 'Clear',
    apply: 'Apply',
    active: 'Active',
    inactive: 'Inactive',
  },
  teachers: {
    title: 'Teachers',
    addNew: 'Add New Teacher',
    editTeacher: 'Edit Teacher',
    deleteTeacher: 'Delete Teacher',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    status: 'Status',
    specializations: 'Specializations',
  },
  errors: {
    required: 'This field is required',
    invalidEmail: 'Invalid email format',
    invalidPhone: 'Invalid phone number',
  },
  validation: {
    minLength: 'Must be at least {min} characters',
    maxLength: 'Must be less than {max} characters',
    invalid: 'Invalid format',
  }
}

interface AllTheProvidersProps {
  children: React.ReactNode
  locale?: string | undefined
}

const AllTheProviders = ({ children, locale = 'en' }: AllTheProvidersProps) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    locale?: string
  }
) => {
  const { locale, ...renderOptions } = options || {}
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders locale={locale}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Test utilities for common actions
export const waitForElementToBeRemoved = async (
  callback: () => HTMLElement | null,
  _options?: { timeout?: number }
) => {
  return new Promise((resolve) => {
    const checkElement = () => {
      if (!callback()) {
        resolve(true)
      } else {
        setTimeout(checkElement, 100)
      }
    }
    checkElement()
  })
}

export const waitForLoadingToFinish = () => {
  return waitForElementToBeRemoved(
    () => document.querySelector('[data-testid="loading"]')
  )
}

export const createMockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  })
  window.IntersectionObserver = mockIntersectionObserver
}

export const createMockResizeObserver = () => {
  const mockResizeObserver = jest.fn()
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  })
  window.ResizeObserver = mockResizeObserver
}

// Mock window methods commonly used in components
export const mockWindowMethods = () => {
  Object.defineProperty(window, 'scrollTo', {
    value: jest.fn(),
    writable: true
  })
  
  Object.defineProperty(window, 'alert', {
    value: jest.fn(),
    writable: true
  })
  
  Object.defineProperty(window, 'confirm', {
    value: jest.fn(() => true),
    writable: true
  })
}

// Export everything from testing-library/react with our custom render
export * from '@testing-library/react'
export { customRender as render }