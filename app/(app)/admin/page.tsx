'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Shield,
  Users,
  BookOpen,
  FileCheck,
  MessageSquare,
  Award,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    users: 0,
    students: 0,
    teachers: 0,
    admins: 0,
    courses: 0,
    submissions: 0,
    discussions: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadAdminStats() {
      setLoading(true)

      const [
        usersRes,
        coursesRes,
        subsRes,
        discRes,
        profilesRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('submissions').select('id', { count: 'exact', head: true }),
        supabase.from('discussions').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('role'),
      ])

      let students = 0
      let teachers = 0
      let admins = 0

      if (profilesRes.data) {
        profilesRes.data.forEach((p) => {
          if (p.role === 'student') students++
          else if (p.role === 'teacher') teachers++
          else if (p.role === 'admin') admins++
        })
      }

      setStats({
        users: usersRes.count || 0,
        students,
        teachers,
        admins,
        courses: coursesRes.count || 0,
        submissions: subsRes.count || 0,
        discussions: discRes.count || 0,
      })

      setLoading(false)
    }

    loadAdminStats()
  }, [supabase])

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-8 animate-fadeIn">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide flex items-center gap-2">
              <Shield className="w-8 h-8 text-amber-400" /> Platform <span className="glow-heading">Administration</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Global system statistics, user analytics, and role management controls.
            </p>
          </div>

          <Link href="/admin/users" className="btn-primary text-xs">
            <Users className="w-4 h-4" /> Manage User Roles
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* Global MetriCsGrid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="lms-card p-5 border-amber-500/30">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-400 font-medium">Total Registered Users</p>
                  <Users className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-3xl font-extrabold text-white mt-2">{stats.users}</p>
                <div className="mt-2 text-[10px] text-slate-400 flex gap-2">
                  <span>{stats.students} Students</span> • <span>{stats.teachers} Teachers</span> • <span>{stats.admins} Admins</span>
                </div>
              </div>

              <div className="lms-card p-5 border-blue-500/30">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-400 font-medium">Total Active Courses</p>
                  <BookOpen className="w-5 h-5 text-[var(--blue-glow)]" />
                </div>
                <p className="text-3xl font-extrabold text-white mt-2">{stats.courses}</p>
                <p className="mt-2 text-[10px] text-slate-400">Published across all categories</p>
              </div>

              <div className="lms-card p-5 border-[var(--red-action)]/30">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-[var(--text-secondary)] font-medium">Student Submissions</p>
                  <FileCheck className="w-5 h-5 text-[var(--red-action)]" />
                </div>
                <p className="text-3xl font-extrabold text-white mt-2">{stats.submissions}</p>
                <p className="mt-2 text-[10px] text-[var(--text-secondary)]">Total uploaded artifacts</p>
              </div>

              <div className="lms-card p-5 border-[var(--blue-border)]/30">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-[var(--text-secondary)] font-medium">Discussion Threads</p>
                  <MessageSquare className="w-5 h-5 text-[var(--blue-glow)]" />
                </div>
                <p className="text-3xl font-extrabold text-white mt-2">{stats.discussions}</p>
                <p className="mt-2 text-[10px] text-[var(--text-secondary)]">Forum interactions</p>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="lms-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-white tracking-wide">Admin Action Console</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/admin/users"
                  className="p-4 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--blue-border)]/40 hover:border-amber-500/50 flex items-center justify-between group transition"
                >
                  <div>
                    <h4 className="font-semibold text-sm text-white group-hover:text-amber-400">
                      User & Role Management &rarr;
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Promote users to Teachers or Admins, audit registered accounts.
                    </p>
                  </div>
                </Link>

                <Link
                  href="/courses"
                  className="p-4 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--blue-border)]/40 hover:border-[var(--blue-border)] flex items-center justify-between group transition"
                >
                  <div>
                    <h4 className="font-semibold text-sm text-white group-hover:text-[var(--blue-glow)]">
                      Course Moderation &rarr;
                    </h4>
                    <p className="text-xs text-slate-400">
                      Access all platform courses with full delete and edit authority.
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  )
}
