import { createClient } from '@/lib/supabase/server'

/**
 * Server-side admin authorization guard.
 * Throws an error if the caller is not authenticated or does not have the admin role.
 * Must ONLY be called from Server Actions ('use server') or Route Handlers.
 *
 * Usage:
 *   const { userId } = await requireAdmin()
 */
export async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized: Not authenticated')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Unauthorized: Profile not found')
  }

  if (profile.role !== 'admin') {
    throw new Error(`Forbidden: Access denied. Required role: admin, your role: ${profile.role}`)
  }

  return { userId: user.id }
}
