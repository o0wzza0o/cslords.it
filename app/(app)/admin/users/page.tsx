'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { updateUserRoleAction } from '../actions'
import { UserRole } from '@/types/database.types'
import { Users, Shield, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setUsers(data)
    setLoading(false)
  }

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    setUpdatingId(targetUserId)
    setStatusMsg(null)

    try {
      await updateUserRoleAction(targetUserId, newRole)
      setStatusMsg({ type: 'success', text: 'User role updated successfully!' })
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
      )
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update user role.' })
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-6 animate-fadeIn">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admin Console
        </Link>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide flex items-center gap-2">
            <Users className="w-8 h-8 text-amber-400" /> User & Role <span className="glow-heading">Management</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Promote registered users to Teachers or Administrators. Role changes update permissions instantly.
          </p>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-red-500/10 border-red-500/40 text-red-400'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {statusMsg.text}
          </div>
        )}

        {loading ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <div className="lms-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[var(--bg-primary)]/60 backdrop-blur-md text-amber-400 uppercase font-semibold border-b border-slate-700/60">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Current Role</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4 text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-semibold text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[var(--red-action)]/30 border border-[var(--blue-border)]/40 flex items-center justify-center font-bold text-xs text-white">
                            {u.full_name?.charAt(0) || u.email.charAt(0)}
                          </div>
                          <span>{u.full_name || 'User'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">{u.email}</td>
                      <td className="p-4">
                        <Badge
                          variant={
                            u.role === 'admin'
                              ? 'amber'
                              : u.role === 'teacher'
                              ? 'red'
                              : 'blue'
                          }
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <select
                          disabled={updatingId === u.id}
                          value={u.role}
                          onChange={(e) =>
                            handleRoleChange(u.id, e.target.value as UserRole)
                          }
                          className="bg-[var(--bg-primary)] border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
