'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CourseGrid } from '@/components/courses/CourseGrid'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { UserRole } from '@/types/database.types'
import {
  LayoutDashboard,
  BookOpen,
  FileCheck,
  Award,
  Users,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'

export default function DashboardPage() {
  const [profile, setProfile] = useState<{ role: UserRole; full_name: string | null } | null>(null)
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
  const [taughtCourses, setTaughtCourses] = useState<any[]>([])
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([])
  const [recentGrades, setRecentGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboardData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

      if (userProfile) setProfile(userProfile)

      // Fetch Student Enrolled Courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          progress,
          course:courses(
            id,
            title,
            description,
            thumbnail_url,
            category,
            level,
            teacher:profiles(full_name)
          )
        `)
        .eq('student_id', user.id)

      if (enrollments) {
        const formatted = enrollments.map((e: any) => ({
          ...e.course,
          enrolled: true,
          progress: e.progress,
        }))
        setEnrolledCourses(formatted)
      }

      // Fetch Teacher Taught Courses
      if (userProfile?.role === 'teacher' || userProfile?.role === 'admin') {
        const { data: taught } = await supabase
          .from('courses')
          .select(`
            id,
            title,
            description,
            thumbnail_url,
            category,
            level
          `)
          .eq('teacher_id', user.id)

        if (taught) setTaughtCourses(taught)

        // Fetch pending submissions requiring grading for teacher's courses
        const { data: subs } = await supabase
          .from('submissions')
          .select(`
            id,
            submitted_at,
            assignment:assignments(title, max_score),
            student:profiles(full_name, email)
          `)
          .is('grade', null)
          .order('submitted_at', { ascending: false })
          .limit(5)

        if (subs) setPendingSubmissions(subs)
      }

      // Fetch Recent Grades for Student
      const { data: gradesData } = await supabase
        .from('submissions')
        .select(`
          id,
          grade,
          feedback,
          assignment:assignments(title, max_score, course:courses(title))
        `)
        .eq('student_id', user.id)
        .not('grade', 'is', null)
        .order('submitted_at', { ascending: false })
        .limit(5)

      if (gradesData) setRecentGrades(gradesData)

      setLoading(false)
    }

    loadDashboardData()
  }, [supabase])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
          Learning <span className="glow-heading">Dashboard</span>
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Overview of your active courses, assignments, and performance telemetry.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="lms-card p-5">
          <p className="text-xs text-slate-400 font-medium">Courses Enrolled</p>
          <p className="text-2xl font-extrabold text-white mt-1">{enrolledCourses.length}</p>
        </div>

        <div className="lms-card p-5">
          <p className="text-xs text-slate-400 font-medium">Completed Grades</p>
          <p className="text-2xl font-extrabold text-white mt-1">{recentGrades.length}</p>
        </div>

        {profile?.role === 'teacher' && (
          <div className="lms-card p-5">
            <p className="text-xs text-slate-400 font-medium">Courses Taught</p>
            <p className="text-2xl font-extrabold text-[var(--blue-glow)] mt-1">
              {taughtCourses.length}
            </p>
          </div>
        )}
      </div>

      {/* Student View: Enrolled Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--blue-glow)]" /> Enrolled Courses
          </h2>
          <Link
            href="/courses"
            className="text-xs font-semibold text-[var(--blue-glow)] hover:underline flex items-center gap-1"
          >
            Explore Catalog <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <CourseGrid courses={enrolledCourses} />
      </div>

      {/* Teacher View: Pending Submissions */}
      {(profile?.role === 'teacher' || profile?.role === 'admin') && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-amber-400" /> Pending Grading Queue ({pendingSubmissions.length})
          </h2>

          {pendingSubmissions.length === 0 ? (
            <div className="lms-card p-6 text-center text-xs text-slate-400">
              All student submissions are graded!
            </div>
          ) : (
            <div className="lms-card overflow-hidden">
              <div className="divide-y divide-slate-800/80">
                {pendingSubmissions.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {sub.assignment?.title}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Student: {sub.student?.full_name || sub.student?.email}
                      </p>
                    </div>
                    <Link
                      href={`/assignments/${sub.assignment?.id}`}
                      className="btn-secondary text-xs"
                    >
                      Grade Submission &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Grades Summary */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <Award className="w-5 h-5 text-[#9180ff]" /> Recent Graded Assignments
        </h2>

        {recentGrades.length === 0 ? (
          <div className="lms-card p-6 text-center text-xs text-slate-400">
            No graded submissions available yet.
          </div>
        ) : (
          <div className="lms-card p-4 divide-y divide-slate-800/60">
            {recentGrades.map((g: any) => (
              <div key={g.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-white">{g.assignment?.title}</p>
                  <p className="text-[10px] text-slate-400">{g.assignment?.course?.title}</p>
                </div>
                <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  {g.grade} / {g.assignment?.max_score} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
