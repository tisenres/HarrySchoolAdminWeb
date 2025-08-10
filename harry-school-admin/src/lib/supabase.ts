// Re-export client-side utilities for backward compatibility
export { supabase, getSupabaseClient } from './supabase-client'
export type { SupabaseResponse, SupabasePaginatedResponse } from './supabase-client'

// Re-export server-side utilities
export { createServerClient, createAdminClient } from './supabase-server'