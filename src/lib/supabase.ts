// Re-export client-side utilities for backward compatibility
export { supabase, getSupabaseClient } from './supabase-client'
export type { SupabaseResponse, SupabasePaginatedResponse } from './supabase-client'

// Export createClient for components that need it
export { createClient } from './supabase/client'

// Note: Server-side utilities are available in supabase-server.ts and supabase/server.ts
// Import them directly from those files when needed in server components