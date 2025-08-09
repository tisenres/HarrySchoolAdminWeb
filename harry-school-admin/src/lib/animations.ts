/**
 * Shared animation configurations and utilities for Harry School CRM
 * Professional, accessible, and performance-optimized animations
 */

import type { Variants, MotionProps } from 'framer-motion'

// Base animation durations (all under 300ms for responsiveness)
export const DURATIONS = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
} as const

// Smooth easing curves optimized for UI interactions
export const EASINGS = {
  smooth: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  spring: { type: 'spring', stiffness: 300, damping: 20 },
  gentle: { type: 'spring', stiffness: 200, damping: 25 },
} as const

// Check if user prefers reduced motion
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Responsive animation configuration
export const getAnimationConfig = (animation: MotionProps): MotionProps => {
  if (prefersReducedMotion()) {
    // Reduce or disable animations for accessibility
    const reducedAnimation: MotionProps = {
      transition: { duration: 0.01 }, // Almost instant
    }
    
    // Only add animate prop if it exists
    if (animation.animate !== undefined) {
      reducedAnimation.animate = animation.animate
    }
    
    return reducedAnimation
  }
  return animation
}

// Common animation variants
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: DURATIONS.normal, ease: EASINGS.smooth }
  },
  exit: { 
    opacity: 0,
    transition: { duration: DURATIONS.fast, ease: EASINGS.smooth }
  }
}

export const slideUpVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: DURATIONS.normal,
      ease: EASINGS.smooth
    }
  },
  exit: { 
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: { 
      duration: DURATIONS.fast,
      ease: EASINGS.smooth
    }
  }
}

export const slideDownVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: -20,
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: DURATIONS.normal,
      ease: EASINGS.smooth
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { 
      duration: DURATIONS.fast,
      ease: EASINGS.smooth
    }
  }
}

export const scaleVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: EASINGS.gentle
  },
  exit: { 
    opacity: 0,
    scale: 0.9,
    transition: { 
      duration: DURATIONS.fast,
      ease: EASINGS.smooth
    }
  }
}

// Stagger animation for lists
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    }
  }
}

export const staggerItem: Variants = {
  hidden: { 
    opacity: 0, 
    y: 10 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: DURATIONS.normal,
      ease: EASINGS.smooth
    }
  }
}

// Success celebration animation
export const successVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0,
    rotate: -180 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
      duration: DURATIONS.slow
    }
  }
}

// Error shake animation
export const shakeVariants: Variants = {
  shake: {
    x: [-8, 8, -6, 6, -4, 4, 0],
    transition: { 
      duration: 0.4,
      ease: 'easeInOut'
    }
  }
}

// Loading pulse animation
export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

// Hover animations for interactive elements
export const hoverScale = {
  whileHover: { 
    scale: 1.02,
    transition: { duration: DURATIONS.fast, ease: EASINGS.smooth }
  },
  whileTap: { 
    scale: 0.98,
    transition: { duration: 0.05, ease: EASINGS.smooth }
  }
}

export const hoverLift = {
  whileHover: { 
    y: -2,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    transition: { duration: DURATIONS.fast, ease: EASINGS.smooth }
  },
  whileTap: { 
    y: 0,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    transition: { duration: 0.05, ease: EASINGS.smooth }
  }
}

// Professional button animations
export const buttonVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transition: { duration: DURATIONS.fast, ease: EASINGS.smooth }
  },
  tap: {
    scale: 0.98,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: { duration: 0.05, ease: EASINGS.smooth }
  },
  loading: {
    scale: 1,
    opacity: 0.7,
    transition: { duration: DURATIONS.fast, ease: EASINGS.smooth }
  }
}

// Tab switching animation
export const tabVariants: Variants = {
  inactive: {
    opacity: 0.6,
    scale: 0.98
  },
  active: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATIONS.normal, ease: EASINGS.smooth }
  }
}

// Educational-themed loading animation
export const educationalLoadingVariants: Variants = {
  loading: {
    rotate: 360,
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear'
    }
  }
}

// Badge animation for status changes
export const badgeVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: -5 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.9,
    y: -5,
    transition: { 
      duration: DURATIONS.fast,
      ease: EASINGS.smooth
    }
  }
}

// Filter animation for search results
export const filterResultsVariants: Variants = {
  hidden: { 
    opacity: 0,
    height: 0,
    marginTop: 0
  },
  visible: { 
    opacity: 1,
    height: 'auto',
    marginTop: 16,
    transition: { 
      duration: DURATIONS.normal,
      ease: EASINGS.smooth,
      height: { duration: DURATIONS.slow }
    }
  },
  exit: { 
    opacity: 0,
    height: 0,
    marginTop: 0,
    transition: { 
      duration: DURATIONS.normal,
      ease: EASINGS.smooth
    }
  }
}

// Progress animation
export const progressVariants: Variants = {
  empty: { width: '0%' },
  filled: (progress: number) => ({
    width: `${progress}%`,
    transition: { 
      duration: 0.8,
      ease: EASINGS.smooth
    }
  })
}

// Row animation for table rows
export const tableRowVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: -10 
  },
  visible: (index: number) => ({ 
    opacity: 1, 
    x: 0,
    transition: { 
      delay: index * 0.02,
      duration: DURATIONS.normal,
      ease: EASINGS.smooth
    }
  }),
  hover: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    transition: { duration: DURATIONS.fast, ease: EASINGS.smooth }
  }
}

// Modal/Dialog animations
export const modalVariants: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { 
      duration: DURATIONS.normal,
      ease: EASINGS.smooth
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { 
      duration: DURATIONS.fast,
      ease: EASINGS.smooth
    }
  }
}

// Backdrop animation
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: DURATIONS.normal, ease: EASINGS.smooth }
  },
  exit: { 
    opacity: 0,
    transition: { duration: DURATIONS.fast, ease: EASINGS.smooth }
  }
}