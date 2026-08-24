import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

/**
 * Creates a Supabase client with the service_role key.
 * This client BYPASSES all Row Level Security (RLS) policies.
 *
 * SECURITY RULES:
 * - NEVER call this from client components or browser code.
 * - ONLY call this from 'use server' Server Actions or Route Handlers.
 * - ALWAYS verify the caller's admin role via requireAdmin() before using this client.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    // Do NOT fall back to the anon key — that would give false confidence
    // that admin operations are being performed when they are not.
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations cannot be performed. ' +
      'Add SUPABASE_SERVICE_ROLE_KEY to your environment variables.'
    )
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
