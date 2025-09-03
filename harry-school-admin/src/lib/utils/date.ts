/**
 * Date utility functions with optimized imports
 * Reduces bundle size by importing only needed date-fns functions
 */

// Individual imports for better tree-shaking
export { default as format } from 'date-fns/format'
export { default as formatISO } from 'date-fns/formatISO'
export { default as parseISO } from 'date-fns/parseISO'
export { default as isAfter } from 'date-fns/isAfter'
export { default as isBefore } from 'date-fns/isBefore'
export { default as addDays } from 'date-fns/addDays'
export { default as subDays } from 'date-fns/subDays'
export { default as addMonths } from 'date-fns/addMonths'
export { default as subMonths } from 'date-fns/subMonths'
export { default as startOfDay } from 'date-fns/startOfDay'
export { default as endOfDay } from 'date-fns/endOfDay'
export { default as startOfMonth } from 'date-fns/startOfMonth'
export { default as endOfMonth } from 'date-fns/endOfMonth'
export { default as differenceInDays } from 'date-fns/differenceInDays'
export { default as isValid } from 'date-fns/isValid'
export { default as isToday } from 'date-fns/isToday'
export { default as isThisWeek } from 'date-fns/isThisWeek'
export { default as isThisMonth } from 'date-fns/isThisMonth'

// Locale support for internationalization
export { default as enUS } from 'date-fns/locale/en-US'
export { default as ru } from 'date-fns/locale/ru'

/**
 * Common date formatting patterns used throughout the app
 */
export const DATE_FORMATS = {
  // Display formats
  SHORT_DATE: 'MMM d, yyyy',        // "Jan 1, 2024"
  LONG_DATE: 'MMMM d, yyyy',        // "January 1, 2024" 
  TIME: 'h:mm a',                   // "2:30 PM"
  DATE_TIME: 'MMM d, yyyy h:mm a',  // "Jan 1, 2024 2:30 PM"
  
  // ISO formats for API
  ISO_DATE: 'yyyy-MM-dd',           // "2024-01-01"
  ISO_DATE_TIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", // Full ISO
  
  // Financial reports
  MONTH_YEAR: 'MMMM yyyy',          // "January 2024"
  QUARTER: 'QQQ yyyy',              // "Q1 2024"
} as const

/**
 * Utility functions for common date operations
 */

/**
 * Format date with automatic fallback for invalid dates
 */
export const formatDateSafe = (
  date: Date | string | null | undefined, 
  formatStr: string = DATE_FORMATS.SHORT_DATE
): string => {
  if (!date) return '-'
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return '-'
    
    return format(dateObj, formatStr)
  } catch {
    return '-'
  }
}

/**
 * Get relative time description
 */
export const getRelativeTime = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return 'Invalid date'
    
    if (isToday(dateObj)) return 'Today'
    if (isThisWeek(dateObj)) return 'This week'
    if (isThisMonth(dateObj)) return 'This month'
    
    return formatDateSafe(dateObj, DATE_FORMATS.SHORT_DATE)
  } catch {
    return 'Invalid date'
  }
}

/**
 * Create date range for reports
 */
export const createDateRange = (type: 'week' | 'month' | 'quarter' | 'year') => {
  const now = new Date()
  
  switch (type) {
    case 'week':
      return {
        start: subDays(startOfDay(now), 7),
        end: endOfDay(now)
      }
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      }
    case 'quarter':
      const quarterStart = startOfMonth(subMonths(now, 3))
      return {
        start: quarterStart,
        end: endOfMonth(now)
      }
    case 'year':
      const yearStart = new Date(now.getFullYear(), 0, 1)
      return {
        start: startOfDay(yearStart),
        end: endOfDay(now)
      }
    default:
      return {
        start: startOfDay(now),
        end: endOfDay(now)
      }
  }
}

/**
 * Check if date is in range
 */
export const isInDateRange = (
  date: Date | string,
  start: Date | string,
  end: Date | string
): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    const startObj = typeof start === 'string' ? parseISO(start) : start
    const endObj = typeof end === 'string' ? parseISO(end) : end
    
    return isAfter(dateObj, startObj) && isBefore(dateObj, endObj)
  } catch {
    return false
  }
}