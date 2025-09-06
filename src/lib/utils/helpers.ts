/**
 * Lightweight utility functions to replace lodash
 * Reduces bundle size by using native JavaScript implementations
 */

/**
 * Debounce function - prevents rapid function calls
 * Replaces lodash.debounce
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

/**
 * Deep equality check - compares objects and arrays recursively
 * Replaces lodash.isEqual
 */
export function isEqual(a: any, b: any): boolean {
  if (a === b) return true
  
  if (a == null || b == null) return false
  
  if (typeof a !== typeof b) return false
  
  if (typeof a !== 'object') return a === b
  
  if (Array.isArray(a) !== Array.isArray(b)) return false
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false
    }
    return true
  }
  
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  
  if (keysA.length !== keysB.length) return false
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false
    if (!isEqual(a[key], b[key])) return false
  }
  
  return true
}

/**
 * Group array items by a key or function
 * Replaces lodash.groupBy
 */
export function groupBy<T, K extends string | number>(
  array: T[],
  keyOrFn: K | ((item: T) => K)
): Record<K, T[]> {
  const result = {} as Record<K, T[]>
  
  for (const item of array) {
    const key = typeof keyOrFn === 'function' 
      ? keyOrFn(item)
      : (item as any)[keyOrFn]
    
    if (!result[key]) {
      result[key] = []
    }
    result[key].push(item)
  }
  
  return result
}

/**
 * Pick specific properties from an object
 * Replaces lodash.pick
 */
export function pick<T, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  
  return result
}

/**
 * Omit specific properties from an object
 * Replaces lodash.omit
 */
export function omit<T, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  
  for (const key of keys) {
    delete result[key]
  }
  
  return result as Omit<T, K>
}

/**
 * Get nested property value safely
 * Replaces lodash.get
 */
export function get<T>(
  obj: any,
  path: string,
  defaultValue?: T
): T | undefined {
  const keys = path.split('.')
  let result = obj
  
  for (const key of keys) {
    result = result?.[key]
    if (result === undefined) {
      return defaultValue
    }
  }
  
  return result
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * Replaces lodash.isEmpty
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true
  
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length === 0
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0
  }
  
  return false
}

/**
 * Create a new array with unique values
 * Replaces lodash.uniq
 */
export function uniq<T>(array: T[]): T[] {
  return [...new Set(array)]
}

/**
 * Create a new array with unique values based on a key or function
 * Replaces lodash.uniqBy
 */
export function uniqBy<T, K>(
  array: T[],
  keyOrFn: K | ((item: T) => K)
): T[] {
  const seen = new Set<K>()
  const result: T[] = []
  
  for (const item of array) {
    const key = typeof keyOrFn === 'function' 
      ? keyOrFn(item)
      : (item as any)[keyOrFn]
    
    if (!seen.has(key)) {
      seen.add(key)
      result.push(item)
    }
  }
  
  return result
}

/**
 * Flatten array one level deep
 * Replaces lodash.flatten
 */
export function flatten<T>(array: (T | T[])[]): T[] {
  return array.flat() as T[]
}

/**
 * Chunk array into smaller arrays of specified size
 * Replaces lodash.chunk
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) return []
  
  const result: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  
  return result
}

/**
 * Throttle function - limits function calls to once per delay period
 * Complements debounce for different use cases
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall
    
    if (timeSinceLastCall >= delay) {
      lastCall = now
      func.apply(this, args)
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        timeoutId = null
        func.apply(this, args)
      }, delay - timeSinceLastCall)
    }
  }
}

/**
 * Type-safe key checking
 */
export function hasKey<T extends object>(
  obj: T,
  key: string | number | symbol
): key is keyof T {
  return key in obj
}