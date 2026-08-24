'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { UserRole } from '@/types/database.types'

/**
 * Updates the role of a target user.
 * SECURITY: Server-side only. Requires admin role on the calling user.
 * The caller is identified by their session cookie — not any client-supplied value.
 */
export async function updateUserRoleAction(targetUserId: string, newRole: UserRole) {
  // 1. Verify caller is admin (throws if not)
  const { userId: callerUserId } = await requireAdmin()

  // 2. Prevent self-promotion or self-demotion via this action
  //    (Admins changing their own role could be used to lock everyone out)
  if (callerUserId === targetUserId) {
    throw new Error('Forbidden: Administrators cannot change their own role through this interface.')
  }

  // 3. Validate the new role is a known safe value
  const allowedRoles: UserRole[] = ['student', 'teacher', 'admin']
  if (!allowedRoles.includes(newRole)) {
    throw new Error(`Forbidden: Invalid role value "${newRole}".`)
  }

  // 4. Perform the update using the admin client (bypasses RLS intentionally)
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

