'use client'

import { useFeatureFlag, type SystemSettings } from '@/lib/services/system-settings-service.client'
import { type ReactNode } from 'react'

interface FeatureGateProps {
  feature: keyof SystemSettings['feature_flags']
  children: ReactNode
  fallback?: ReactNode
  disabled?: boolean
}

/**
 * FeatureGate component that conditionally renders children based on feature flags
 */
export function FeatureGate({ 
  feature, 
  children, 
  fallback = null,
  disabled = false 
}: FeatureGateProps) {
  const isEnabled = useFeatureFlag(feature)

  // If feature is disabled via prop, don't render
  if (disabled) {
    return fallback as JSX.Element
  }

  // If feature flag is enabled, render children
  if (isEnabled) {
    return children as JSX.Element
  }

  // Otherwise render fallback
  return fallback as JSX.Element
}

/**
 * Higher-order component for feature gating
 */
export function withFeatureFlag<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: keyof SystemSettings['feature_flags'],
  fallback?: ReactNode
) {
  return function FeatureGatedComponent(props: P) {
    return (
      <FeatureGate feature={feature} fallback={fallback}>
        <WrappedComponent {...props} />
      </FeatureGate>
    )
  }
}

/**
 * Hook that returns whether a feature is enabled and provides loading state
 */
export function useFeatureGate(feature: keyof SystemSettings['feature_flags']) {
  const isEnabled = useFeatureFlag(feature)
  
  return {
    isEnabled,
    Component: ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
      <FeatureGate feature={feature} fallback={fallback}>
        {children}
      </FeatureGate>
    )
  }
}