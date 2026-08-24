'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  runAutoEnrollmentAction,
  deleteEnrollmentAction,
} from '../enrollmentActions'
import {
  BookCheck,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  BookOpen,
} from 'lucide-react'

interface StudentEnrollment {
  id: string
  student_id: string
  course_id: string
  created_at: string
  student?: {
    full_name: string | null
    email: string
    student_id: string | null
    academic_year: number | null
  }
  course?: {
    title: string
    code: string | null
  }
}

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([])
  const [filteredEnrollments, setFilteredEnrollments] = useState<StudentEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [isAutoEnrolling, setIsAutoEnrolling] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    const { data } = await supabase
      .from('student_courses')
      .select('*, student:profiles!student_courses_student_id_fkey(full_name, email, student_id, academic_year), course:courses!student_courses_course_id_fkey(title, code)')
      .order('created_at', { ascending: false })

    const formatted: StudentEnrollment[] = (data as any) || []
    setEnrollments(formatted)
    setFilteredEnrollments(formatted)
    setLoading(false)
  }

  // Filter effect
  useEffect(() => {
    let result = enrollments

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) =>
          (e.student?.full_name && e.student.full_name.toLowerCase().includes(q)) ||
          (e.student?.email && e.student.email.toLowerCase().includes(q)) ||
          (e.student?.student_id && e.student.student_id.toLowerCase().includes(q)) ||
          (e.course?.title && e.course.title.toLowerCase().includes(q)) ||
          (e.course?.code && e.course.code.toLowerCase().includes(q))
      )
    }

    setFilteredEnrollments(result)
  }, [search, enrollments])

  const handleRunAutoEnrollment = async () => {
    if (!confirm('Run automatic enrollment for all students in Automatic-mode semesters?')) return
    setIsAutoEnrolling(true)

    try {
      const result = await runAutoEnrollmentAction()
      showToast('success', `Batch auto-enrollment complete! ${result.totalProcessed} course assignments processed.`)
      loadData()
    } catch (err: any) {
      showToast('error', err.message || 'Auto-enrollment failed')
    } finally {
      setIsAutoEnrolling(false)
    }
  }

  const handleDeleteEnrollment = async (id: string, studentName: string, courseTitle: string) => {
    if (!confirm(`Remove ${studentName}'s enrollment in ${courseTitle}?`)) return
    try {
      await deleteEnrollmentAction(id)
      showToast('success', 'Enrollment record removed.')
      loadData()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to remove enrollment.')
    }
  }

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg(null), 4000)
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-6 animate-fadeIn">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[var(--blue-glow)] transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admin Console
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide flex items-center gap-2">
              <BookCheck className="w-8 h-8 text-[var(--blue-glow)]" /> Student <span className="glow-heading">Enrollments</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              View all student course enrollments and execute batch automatic enrollment tasks.
            </p>
          </div>

          <Button
            onClick={handleRunAutoEnrollment}
            isLoading={isAutoEnrolling}
            className="text-xs shrink-0"
          >
            <RefreshCw className="w-4 h-4" /> Run Batch Auto-Enrollment
          </Button>
        </div>

        {toastMsg && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 animate-fadeIn ${
              toastMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/10 border-red-500/40 text-red-400'
            }`}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            {toastMsg.text}
          </div>
        )}

        {/* Filter bar */}
        <div className="lms-card p-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, ID, or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--bg-primary)]/40 backdrop-blur-md border border-[var(--blue-border)]/40 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-[var(--text-secondary)]/60 focus:outline-none focus:border-[var(--blue-border)]"
            />
          </div>
        </div>

        {/* Enrollments table */}
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="lms-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[var(--bg-primary)]/70 backdrop-blur-md text-[var(--blue-glow)] uppercase font-semibold border-b border-[var(--blue-border)]/40">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Student ID</th>
                    <th className="p-4">Enrolled Course</th>
                    <th className="p-4">Date Enrolled</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredEnrollments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No enrollment records found.
                      </td>
                    </tr>
                  ) : (
                    filteredEnrollments.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4">
                          <p className="font-bold text-white text-sm">
                            {e.student?.full_name || 'Student'}
                          </p>
                          <p className="text-[10px] text-slate-400">{e.student?.email}</p>
                        </td>
                        <td className="p-4 font-mono font-bold text-white">
                          {e.student?.student_id ? (
                            <Badge variant="blue">ID: {e.student.student_id}</Badge>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-[var(--blue-glow)] shrink-0" />
                            <div>
                              <p className="font-bold text-white">{e.course?.title || 'Course'}</p>
                              {e.course?.code && (
                                <p className="text-[10px] text-slate-400">{e.course.code}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-400">
                          {new Date(e.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() =>
                              handleDeleteEnrollment(
                                e.id,
                                e.student?.full_name || 'Student',
                                e.course?.title || 'Course'
                              )
                            }
                            className="text-xs text-red-400 hover:text-red-300 font-semibold hover:underline"
                          >
                            Unenroll
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
