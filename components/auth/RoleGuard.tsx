'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/types/database.types'
import { ShieldAlert } from 'lucide-react'

interface RoleGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  fallbackUrl?: string
}

export function RoleGuard({ allowedRoles, children, fallbackUrl = '/home' }: RoleGuardProps) {
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile) {
        setRole(profile.role)
      }
      setLoading(false)
    }

    checkRole()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--blue-border)] shadow-[0_0_15px_var(--blue-glow)]"></div>
      </div>
    )
  }

  if (!role || !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-full bg-[var(--bg-secondary)] border border-red-500/50 mb-4 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
          <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-[var(--text-secondary)] max-w-md mb-6">
          You do not have permission to view this section. Allowed role(s): {allowedRoles.join(', ')}.
        </p>
        <button
          onClick={() => router.push(fallbackUrl)}
          className="btn-primary"
        >
          Return to Home
        </button>
      </div>
    )
  }

  return <>{children}</>
}
