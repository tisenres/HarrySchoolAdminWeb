'use client'

import React, { useState, useRef, useEffect, memo, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  fill?: boolean
  loading?: 'lazy' | 'eager'
  fallbackSrc?: string
  showSkeleton?: boolean
  onLoad?: () => void
  onError?: (error: any) => void
  style?: React.CSSProperties
}

interface IntersectionObserverImageProps extends OptimizedImageProps {
  rootMargin?: string
  threshold?: number
}

// Progressive image loading with intersection observer
const IntersectionObserverImage = memo<IntersectionObserverImageProps>(({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  loading = 'lazy',
  fallbackSrc,
  showSkeleton = true,
  onLoad,
  onError,
  style,
  rootMargin = '50px',
  threshold = 0.1,
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(priority)
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || shouldLoad || typeof window === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      {
        rootMargin,
        threshold,
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority, shouldLoad, rootMargin, threshold])

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback((error: any) => {
    setHasError(true)
    setIsLoaded(true)
    onError?.(error)
  }, [onError])

  // Generate blur data URL for skeleton
  const skeletonBlurDataURL = `data:image/svg+xml;base64,${Buffer.from(
    `<svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
    </svg>`
  ).toString('base64')}`

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        !isLoaded && showSkeleton && 'animate-pulse',
        className
      )}
      style={style}
    >
      {shouldLoad && (
        <>
          {!hasError ? (
            <Image
              src={src}
              alt={alt}
              {...(!fill && width ? { width } : {})}
              {...(!fill && height ? { height } : {})}
              fill={fill}
              priority={priority}
              quality={quality}
              placeholder={blurDataURL ? 'blur' : placeholder}
              {...(blurDataURL || showSkeleton ? { blurDataURL: blurDataURL || skeletonBlurDataURL } : {})}
              {...(sizes ? { sizes } : {})}
              loading={loading}
              onLoad={handleLoad}
              onError={handleError}
              className={cn(
                'transition-opacity duration-300',
                isLoaded ? 'opacity-100' : 'opacity-0',
                fill ? 'object-cover' : ''
              )}
            />
          ) : (
            fallbackSrc && (
              <Image
                src={fallbackSrc}
                alt={`${alt} (fallback)`}
                {...(!fill && width ? { width } : {})}
                {...(!fill && height ? { height } : {})}
                fill={fill}
                quality={quality}
                onLoad={handleLoad}
                className={cn(
                  'transition-opacity duration-300',
                  isLoaded ? 'opacity-100' : 'opacity-0',
                  fill ? 'object-cover' : ''
                )}
              />
            )
          )}
        </>
      )}

      {/* Loading skeleton */}
      {!isLoaded && showSkeleton && (
        <div 
          className={cn(
            'absolute inset-0 bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%]',
            'animate-[shimmer_2s_ease-in-out_infinite]'
          )}
        />
      )}

      {/* Error state */}
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center text-muted-foreground">
            <svg
              className="w-12 h-12 mx-auto mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Image not available</p>
          </div>
        </div>
      )}
    </div>
  )
})

IntersectionObserverImage.displayName = 'IntersectionObserverImage'

// Avatar image with fallback initials
export const OptimizedAvatar = memo<{
  src?: string
  alt: string
  name: string
  size?: number
  className?: string
  fallbackClassName?: string
}>(({ src, alt, name, size = 40, className, fallbackClassName }) => {
  const [hasError, setHasError] = useState(false)
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 text-white font-medium rounded-full',
          fallbackClassName,
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
    )
  }

  return (
    <IntersectionObserverImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      quality={90}
      priority={false}
      placeholder="blur"
      blurDataURL={`data:image/svg+xml;base64,${Buffer.from(
        `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#e5e7eb"/>
        </svg>`
      ).toString('base64')}`}
      onError={() => setHasError(true)}
      showSkeleton
    />
  )
})

OptimizedAvatar.displayName = 'OptimizedAvatar'

// Gallery image with lightbox support
export const GalleryImage = memo<OptimizedImageProps & {
  onClick?: () => void
  overlay?: React.ReactNode
}>(({ onClick, overlay, className, ...props }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div 
      className={cn(
        'relative group cursor-pointer overflow-hidden rounded-lg',
        'transition-transform duration-200 hover:scale-105',
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <IntersectionObserverImage
        {...props}
        className="object-cover"
        fill
      />
      
      {overlay && (
        <div className={cn(
          'absolute inset-0 bg-black/40 flex items-center justify-center',
          'transition-opacity duration-200',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}>
          {overlay}
        </div>
      )}
    </div>
  )
})

GalleryImage.displayName = 'GalleryImage'

// Logo component with automatic WebP/AVIF support
export const OptimizedLogo = memo<{
  src: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
}>(({ src, alt, width, height, className, priority = true }) => {
  return (
    <IntersectionObserverImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      {...(className ? { className } : {})}
      priority={priority}
      quality={95}
      placeholder="empty"
      loading="eager"
    />
  )
})

OptimizedLogo.displayName = 'OptimizedLogo'

// Responsive image with multiple breakpoints
export const ResponsiveImage = memo<OptimizedImageProps & {
  breakpoints?: {
    sm?: string
    md?: string
    lg?: string
    xl?: string
  }
}>(({ breakpoints, sizes, ...props }) => {
  const responsiveSizes = sizes || (breakpoints ? 
    `(max-width: 640px) ${breakpoints.sm || '100vw'}, ` +
    `(max-width: 768px) ${breakpoints.md || '100vw'}, ` +
    `(max-width: 1024px) ${breakpoints.lg || '100vw'}, ` +
    `${breakpoints.xl || '100vw'}`
    : '100vw'
  )

  return (
    <IntersectionObserverImage
      {...props}
      sizes={responsiveSizes}
    />
  )
})

ResponsiveImage.displayName = 'ResponsiveImage'

// Main optimized image component
export const OptimizedImage = memo<OptimizedImageProps>((props) => {
  return <IntersectionObserverImage {...props} />
})

OptimizedImage.displayName = 'OptimizedImage'

// Export all components
export {
  IntersectionObserverImage,
}