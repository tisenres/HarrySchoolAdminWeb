/**
 * Optimized Icon Component
 * Uses dynamic imports to reduce bundle size
 */

import React, { Suspense } from 'react'
import { LucideProps } from 'lucide-react'
import { DynamicIcon, IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName
  fallback?: React.ComponentType<LucideProps>
}

export function Icon({ 
  name, 
  className, 
  size = 16,
  fallback,
  ...props 
}: IconProps) {
  return (
    <Suspense 
      fallback={
        fallback ? (
          React.createElement(fallback, { className, size, ...props })
        ) : (
          <div 
            className={cn("animate-pulse bg-muted rounded", className)} 
            style={{ width: size, height: size }} 
          />
        )
      }
    >
      <DynamicIcon 
        name={name} 
        className={className}
        size={size}
        fallback={fallback}
        {...props}
      />
    </Suspense>
  )
}

// Convenience wrapper for common use cases
export function LoadingIcon({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <div 
      className={cn("animate-pulse bg-muted rounded", className)} 
      style={{ width: size, height: size }} 
    />
  )
}

export default Icon