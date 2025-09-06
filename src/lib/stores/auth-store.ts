/**
 * Optimized Auth Store using Zustand
 * Provides selective state subscriptions to prevent unnecessary re-renders
 */

import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'

interface Profile {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'superadmin' | 'teacher' | 'student'
  organization_id: string
  avatar_url?: string
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

interface AuthState {
  // Core auth data
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  error: Error | null
  
  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: Error | null) => void
  
  // Combined actions for atomic updates
  setAuthData: (data: {
    user?: User | null
    session?: Session | null
    profile?: Profile | null
  }) => void
  
  // Clear all auth data
  clearAuth: () => void
  
  // Computed getters
  isAuthenticated: () => boolean
  hasRole: (role: string) => boolean
  getOrganizationId: () => string | null
}

// Create the store with middleware for better debugging and subscriptions
export const useAuthStore = create<AuthState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      user: null,
      session: null,
      profile: null,
      loading: true,
      error: null,
      
      // Individual setters for granular updates
      setUser: (user) => set({ user }, false, 'setUser'),
      
      setSession: (session) => set({ session }, false, 'setSession'),
      
      setProfile: (profile) => set({ profile }, false, 'setProfile'),
      
      setLoading: (loading) => set({ loading }, false, 'setLoading'),
      
      setError: (error) => set({ error }, false, 'setError'),
      
      // Atomic update for multiple fields (prevents multiple re-renders)
      setAuthData: (data) => set(
        (state) => ({
          ...state,
          ...data,
          loading: false,
          error: null
        }),
        false,
        'setAuthData'
      ),
      
      // Clear all auth data
      clearAuth: () => set(
        {
          user: null,
          session: null,
          profile: null,
          loading: false,
          error: null
        },
        false,
        'clearAuth'
      ),
      
      // Computed getters (not reactive, call manually)
      isAuthenticated: () => {
        const state = get()
        return !!state.user && !!state.session
      },
      
      hasRole: (role: string) => {
        const state = get()
        return state.profile?.role === role
      },
      
      getOrganizationId: () => {
        const state = get()
        return state.profile?.organization_id || null
      }
    })),
    {
      name: 'auth-store', // DevTools instance name
    }
  )
)

/**
 * Selective hooks for optimal performance
 * Components only re-render when their specific data changes
 */

// Hook for components that only need the user object
export const useAuthUser = () => useAuthStore((state) => state.user)

// Hook for components that only need loading state
export const useAuthLoading = () => useAuthStore((state) => state.loading)

// Hook for components that only need the profile
export const useAuthProfile = () => useAuthStore((state) => state.profile)

// Hook for components that only need session
export const useAuthSession = () => useAuthStore((state) => state.session)

// Hook for components that need authentication status
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user && !!state.session)

// Hook for components that need organization ID
export const useOrganizationId = () => useAuthStore((state) => state.profile?.organization_id)

// Hook for components that need user role
export const useUserRole = () => useAuthStore((state) => state.profile?.role)

// Hook for error handling
export const useAuthError = () => useAuthStore((state) => state.error)

// Actions-only hook (doesn't cause re-renders)
export const useAuthActions = () => {
  return useAuthStore((state) => ({
    setUser: state.setUser,
    setSession: state.setSession,
    setProfile: state.setProfile,
    setLoading: state.setLoading,
    setError: state.setError,
    setAuthData: state.setAuthData,
    clearAuth: state.clearAuth,
  }))
}

// Utility to subscribe to auth changes without React
export const subscribeToAuth = (callback: (state: AuthState) => void) => {
  return useAuthStore.subscribe(callback)
}

// Get current state without subscribing (for non-React contexts)
export const getAuthState = () => useAuthStore.getState()