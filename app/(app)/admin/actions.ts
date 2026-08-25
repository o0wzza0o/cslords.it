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
  try {
    // 1. Verify caller is admin (throws if not authenticated or not admin)
    const { userId: callerUserId } = await requireAdmin()

    // 2. Prevent self-promotion or self-demotion via this action
    if (callerUserId === targetUserId) {
      return {
        success: false,
        error: 'Forbidden: Administrators cannot change their own role through this interface.',
      }
    }

    // 3. Validate the new role is a known safe value
    const allowedRoles: UserRole[] = ['student', 'teacher', 'admin']
    if (!allowedRoles.includes(newRole)) {
      return {
        success: false,
        error: `Forbidden: Invalid role value "${newRole}".`,
      }
    }

    // 4. Perform the update using the admin client (bypasses RLS intentionally)
    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUserId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Unauthorized: Admin access required.',
    }
  }
}

