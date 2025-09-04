import { useRef, useEffect } from 'react'

/**
 * Hook to get the previous value of a variable
 * Useful for detecting changes between renders
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined)
  
  useEffect(() => {
    ref.current = value
  })
  
  return ref.current
}
