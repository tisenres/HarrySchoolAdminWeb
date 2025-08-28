'use client'

/**
 * Optimized Auth Provider with Zustand store
 * Fixes over-subscription issues and improves performance
 */

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useAuthStore, useAuthActions, getAuthState } from '@/lib/stores/auth-store'
import { sessionCache } from '@/lib/session-cache'
import type { Database } from '@/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { CachedSessionData } from '@/lib/session-cache'

// Create Supabase client once, not on every render
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseClient
}

export function OptimizedAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const initRef = useRef(false)
  
  // Get actions without subscribing to prevent infinite loops
  const getActions = useCallback(() => useAuthStore.getState(), [])
  
  // Memoized profile fetcher with Redis caching
  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = getSupabaseClient()
    
    try {
      // Try to get from cache first
      const cachedProfile = await sessionCache.getAuthProfile(userId)
      if (cachedProfile) {
        console.log('📦 Profile loaded from cache:', userId)
        return cachedProfile
      }

      // Fetch from database
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Profile fetch error:', error)
        return null
      }
      
      console.log('🔄 Profile fetched from database:', userId)
      return data
    } catch (error) {
      console.error('Profile fetch exception:', error)
      return null
    }
  }, [])
  
  // Initialize auth state
  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (initRef.current) return
    initRef.current = true
    
    const supabase = getSupabaseClient()
    let mounted = true
    
    const initializeAuth = async () => {
      try {
        // Check for cached session first
        let cachedSession: CachedSessionData | null = null
        const currentState = getAuthState()
        
        if (currentState.user?.id) {
          cachedSession = await sessionCache.getUserSession(currentState.user.id)
        }

        if (cachedSession && !sessionCache.isSessionExpired?.(cachedSession)) {
          console.log('📦 Session loaded from cache')
          const actions = getActions()
          actions.setAuthData({
            user: cachedSession.user,
            session: cachedSession.session,
            profile: cachedSession.profile
          })
          return
        }

        // Fallback to Supabase session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          const actions = getActions()
          actions.setError(error)
          actions.setLoading(false)
          return
        }
        
        if (session?.user) {
          // Fetch profile data
          const profile = await fetchProfile(session.user.id)
          
          if (!mounted) return

          // Cache the complete session data
          if (profile) {
            const sessionData: CachedSessionData = {
              user: session.user,
              session: session,
              profile: profile,
              organization: {
                id: profile.organization_id,
                name: 'Harry School', // Would fetch from org table
                is_active: true
              },
              metadata: {
                cached_at: Date.now(),
                expires_at: Date.now() + (30 * 60 * 1000), // 30 minutes
                version: 1
              }
            }

            await sessionCache.cacheSession(
              session.access_token,
              session.user.id,
              sessionData
            )
          }
          
          // Update all auth data atomically (single re-render)
          const actions = getActions()
          actions.setAuthData({
            user: session.user,
            session: session,
            profile: profile
          })
        } else {
          const actions = getActions()
          actions.setLoading(false)
        }
      } catch (error) {
        if (!mounted) return
        const actions = getActions()
        actions.setError(error as Error)
        actions.setLoading(false)
      }
    }
    
    initializeAuth()
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('Auth event:', event)
        
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              const profile = await fetchProfile(session.user.id)
              const actions = getActions()
              actions.setAuthData({
                user: session.user,
                session: session,
                profile: profile
              })
            }
            break
            
          case 'SIGNED_OUT':
            const actions1 = getActions()
            actions1.clearAuth()
            router.push('/login')
            break
            
          case 'TOKEN_REFRESHED':
            if (session) {
              const actions2 = getActions()
              actions2.setSession(session)
            }
            break
            
          case 'USER_UPDATED':
            if (session?.user) {
              const profile = await fetchProfile(session.user.id)
              const actions3 = getActions()
              actions3.setAuthData({
                user: session.user,
                session: session,
                profile: profile
              })
            }
            break
        }
      }
    )
    
    subscriptionRef.current = subscription as unknown as RealtimeChannel
    
    // Cleanup
    return () => {
      mounted = false
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }, [getActions, fetchProfile, router])
  
  return <>{children}</>
}

/**
 * Auth API functions that work with the Zustand store
 */
export const authApi = {
  signIn: async (email: string, password: string) => {
    const supabase = getSupabaseClient()
    const authActions = useAuthStore.getState()
    
    authActions.setLoading(true)
    authActions.setError(null)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        authActions.setError(error)
        authActions.setLoading(false)
        return { error }
      }
      
      if (data?.user) {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        // Update store atomically
        authActions.setAuthData({
          user: data.user,
          session: data.session,
          profile: profileData
        })
      }
      
      return { error: null }
    } catch (error) {
      authActions.setError(error as Error)
      authActions.setLoading(false)
      return { error: error as Error }
    }
  },
  
  signOut: async () => {
    const supabase = getSupabaseClient()
    const authActions = useAuthStore.getState()
    
    try {
      await supabase.auth.signOut()
      authActions.clearAuth()
      return { error: null }
    } catch (error) {
      console.error('Error signing out:', error)
      return { error: error as Error }
    }
  },
  
  refreshSession: async () => {
    const supabase = getSupabaseClient()
    const authActions = useAuthStore.getState()
    
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) throw error
      
      if (session) {
        authActions.setSession(session)
        authActions.setUser(session.user)
        
        // Refresh profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profileData) {
          authActions.setProfile(profileData)
        }
      }
      
      return { error: null }
    } catch (error) {
      console.error('Error refreshing session:', error)
      return { error: error as Error }
    }
  },
  
  updateProfile: async (updates: Partial<any>) => {
    const supabase = getSupabaseClient()
    const authActions = useAuthStore.getState()
    const currentUser = getAuthState().user
    
    if (!currentUser) {
      return { error: new Error('No authenticated user') }
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id)
        .select()
        .single()
      
      if (error) throw error
      
      if (data) {
        authActions.setProfile(data)
      }
      
      return { error: null, data }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { error: error as Error }
    }
  }
}