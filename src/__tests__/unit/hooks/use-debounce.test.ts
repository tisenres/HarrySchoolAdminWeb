import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/hooks/use-debounce'

describe('useDebounce Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500))
    expect(result.current).toBe('test')
  })

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    )

    expect(result.current).toBe('initial')

    // Update the value
    rerender({ value: 'updated', delay: 500 })
    
    // Value should not change immediately
    expect(result.current).toBe('initial')

    // Fast-forward time by 250ms (less than delay)
    act(() => {
      jest.advanceTimersByTime(250)
    })
    
    // Value should still be the initial one
    expect(result.current).toBe('initial')

    // Fast-forward time by another 250ms (total 500ms)
    act(() => {
      jest.advanceTimersByTime(250)
    })
    
    // Now the value should be updated
    expect(result.current).toBe('updated')
  })

  it('should reset timer on rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    )

    // Update value multiple times rapidly
    rerender({ value: 'first', delay: 500 })
    
    act(() => {
      jest.advanceTimersByTime(250)
    })
    
    rerender({ value: 'second', delay: 500 })
    
    act(() => {
      jest.advanceTimersByTime(250)
    })
    
    rerender({ value: 'final', delay: 500 })
    
    // Value should still be initial since timer keeps resetting
    expect(result.current).toBe('initial')
    
    // Fast-forward full delay from last change
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    // Should now show the final value
    expect(result.current).toBe('final')
  })

  it('should work with different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'test', delay: 1000 }
      }
    )

    rerender({ value: 'updated', delay: 1000 })
    
    // After 500ms, should still be old value
    act(() => {
      jest.advanceTimersByTime(500)
    })
    expect(result.current).toBe('test')
    
    // After full 1000ms, should be updated
    act(() => {
      jest.advanceTimersByTime(500)
    })
    expect(result.current).toBe('updated')
  })

  it('should handle empty and undefined values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: '', delay: 500 }
      }
    )

    expect(result.current).toBe('')

    rerender({ value: undefined, delay: 500 })
    
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    expect(result.current).toBe(undefined)
  })

  it('should cleanup timer on unmount', () => {
    const { unmount, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    )

    rerender({ value: 'updated', delay: 500 })
    
    // Unmount before timer completes
    unmount()
    
    // Timer should be cleaned up - no memory leaks
    // This test ensures the cleanup function is called
    expect(jest.getTimerCount()).toBe(0)
  })
})