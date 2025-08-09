'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Base skeleton component
const Skeleton = memo<{ 
  className?: string
  animate?: boolean 
}>(({ className, animate = true }) => (
  <div
    className={cn(
      'bg-muted rounded-md',
      animate && 'animate-pulse',
      className
    )}
  />
))

Skeleton.displayName = 'Skeleton'

// Enhanced skeleton with shimmer effect
const ShimmerSkeleton = memo<{ 
  className?: string
  shimmer?: boolean
}>(({ className, shimmer = true }) => (
  <div
    className={cn(
      'bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] rounded-md',
      shimmer && 'animate-[shimmer_2s_ease-in-out_infinite]',
      className
    )}
  />
))

ShimmerSkeleton.displayName = 'ShimmerSkeleton'

// Table skeleton loading
export const TableSkeleton = memo<{
  rows?: number
  columns?: number
  showHeader?: boolean
  className?: string
}>(({ rows = 5, columns = 6, showHeader = true, className }) => (
  <div className={cn('space-y-4', className)}>
    {showHeader && (
      <div className="flex space-x-4 p-4 border-b">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
    )}
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 p-4">
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className={cn(
                'h-4',
                colIndex === 0 ? 'w-12' : 'flex-1'
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  </div>
))

TableSkeleton.displayName = 'TableSkeleton'

// Card skeleton loading
export const CardSkeleton = memo<{
  showImage?: boolean
  showBadge?: boolean
  lines?: number
  className?: string
}>(({ showImage = false, showBadge = false, lines = 3, className }) => (
  <div className={cn('p-6 bg-white rounded-lg border space-y-4', className)}>
    <div className="flex items-center space-x-4">
      {showImage && <Skeleton className="h-12 w-12 rounded-full" />}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
      {showBadge && <Skeleton className="h-6 w-16 rounded-full" />}
    </div>
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-[60%]' : 'w-full'
          )} 
        />
      ))}
    </div>
  </div>
))

CardSkeleton.displayName = 'CardSkeleton'

// Profile skeleton loading
export const ProfileSkeleton = memo<{ className?: string }>(({ className }) => (
  <div className={cn('space-y-6', className)}>
    {/* Header section */}
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-start space-x-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[300px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <div className="flex space-x-4">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>

    {/* Content sections */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 4 }, (_, i) => (
        <CardSkeleton key={i} lines={4} />
      ))}
    </div>
  </div>
))

ProfileSkeleton.displayName = 'ProfileSkeleton'

// Stats skeleton loading
export const StatsSkeleton = memo<{
  count?: number
  className?: string
}>(({ count = 4, className }) => (
  <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="bg-white p-6 rounded-lg border space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-4 w-32" />
      </div>
    ))}
  </div>
))

StatsSkeleton.displayName = 'StatsSkeleton'

// Form skeleton loading
export const FormSkeleton = memo<{
  fields?: number
  hasSubmitButton?: boolean
  className?: string
}>(({ fields = 6, hasSubmitButton = true, className }) => (
  <div className={cn('bg-white rounded-lg border p-6 space-y-6', className)}>
    <div className="space-y-4">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
    {hasSubmitButton && (
      <div className="flex justify-end space-x-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    )}
  </div>
))

FormSkeleton.displayName = 'FormSkeleton'

// List skeleton loading with motion
export const ListSkeleton = memo<{
  items?: number
  showImage?: boolean
  className?: string
}>(({ items = 8, showImage = true, className }) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: items }, (_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1, duration: 0.3 }}
        className="bg-white p-4 rounded-lg border flex items-center space-x-4"
      >
        {showImage && <Skeleton className="h-12 w-12 rounded-full" />}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-[300px]" />
            <Skeleton className="h-3 w-[250px]" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </motion.div>
    ))}
  </div>
))

ListSkeleton.displayName = 'ListSkeleton'

// Dashboard skeleton loading
export const DashboardSkeleton = memo<{ className?: string }>(({ className }) => (
  <div className={cn('space-y-8', className)}>
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[300px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
      <div className="flex space-x-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>

    {/* Stats */}
    <StatsSkeleton />

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg border space-y-4">
        <Skeleton className="h-6 w-[200px]" />
        <Skeleton className="h-[300px] w-full" />
      </div>
      <div className="bg-white p-6 rounded-lg border space-y-4">
        <Skeleton className="h-6 w-[180px]" />
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Recent activity */}
    <div className="bg-white rounded-lg border">
      <div className="p-6 border-b">
        <Skeleton className="h-6 w-[200px]" />
      </div>
      <ListSkeleton items={5} />
    </div>
  </div>
))

DashboardSkeleton.displayName = 'DashboardSkeleton'

// Enhanced skeleton with custom animations
export const AnimatedSkeleton = memo<{
  className?: string
  variant?: 'pulse' | 'shimmer' | 'wave'
  duration?: number
}>(({ className, variant = 'shimmer', duration = 2 }) => {
  const animations = {
    pulse: 'animate-pulse',
    shimmer: 'animate-[shimmer_2s_ease-in-out_infinite]',
    wave: 'animate-[wave_1.6s_ease-in-out_infinite]'
  }

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-muted via-muted/60 to-muted rounded-md',
        variant === 'shimmer' && 'bg-[length:200%_100%]',
        animations[variant],
        className
      )}
      style={{
        animationDuration: `${duration}s`
      }}
    />
  )
})

AnimatedSkeleton.displayName = 'AnimatedSkeleton'

// Export the base Skeleton component and shimmer variant
export { Skeleton, ShimmerSkeleton }