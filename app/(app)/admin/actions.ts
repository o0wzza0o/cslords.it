'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { UserRole } from '@/types/database.types'

export async function updateUserRoleAction(targetUserId: string, newRole: UserRole) {
  const supabase = await createClient()

  // Verify caller is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'admin') {
    throw new Error('Forbidden: Only administrators can update user roles.')
  }

  // Update target user profile using service role admin client
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId)

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}
