'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { FileCheck, Calendar, ArrowRight, BookOpen } from 'lucide-react'

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadAssignments() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch assignments from enrolled courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user.id)

      const courseIds = enrollments?.map((e) => e.course_id) || []

      // Also include courses taught if user is teacher
      const { data: taughtCourses } = await supabase
        .from('courses')
        .select('id')
        .eq('teacher_id', user.id)

      const taughtIds = taughtCourses?.map((c) => c.id) || []
      const allCourseIds = Array.from(new Set([...courseIds, ...taughtIds]))

      if (allCourseIds.length > 0) {
        const { data: assignmentsData } = await supabase
          .from('assignments')
          .select(`
            id,
            title,
            description,
            due_date,
            max_score,
            created_at,
            course:courses(title)
          `)
          .in('course_id', allCourseIds)
          .order('due_date', { ascending: true })

        if (assignmentsData) {
          // Check user submission status for each assignment
          const { data: userSubmissions } = await supabase
            .from('submissions')
            .select('assignment_id, grade')
            .eq('student_id', user.id)

          const subMap = new Map<string, number | null>()
          userSubmissions?.forEach((s) => subMap.set(s.assignment_id, s.grade))

          const formatted = assignmentsData.map((a: any) => ({
            ...a,
            submitted: subMap.has(a.id),
            grade: subMap.get(a.id),
          }))

          setAssignments(formatted)
        }
      }

      setLoading(false)
    }

    loadAssignments()
  }, [supabase])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
          Course <span className="glow-heading">Assignments</span>
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          View deadlines, guidelines, and submit your work for evaluation.
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="lms-card p-12 text-center">
          <FileCheck className="w-12 h-12 text-[var(--blue-icon)] opacity-50 mx-auto mb-3" />
          <p className="text-sm text-[var(--text-secondary)]">No assignments found for your enrolled courses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {assignments.map((a) => {
            const isOverdue = a.due_date && new Date(a.due_date) < new Date() && !a.submitted
            return (
              <div
                key={a.id}
                className="lms-card p-6 flex flex-col justify-between space-y-4 hover:border-[var(--blue-border)] transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[var(--blue-glow)] uppercase tracking-wider">
                      {a.course?.title}
                    </span>
                    {a.submitted ? (
                      <Badge variant="green">Submitted</Badge>
                    ) : isOverdue ? (
                      <Badge variant="red">Overdue</Badge>
                    ) : (
                      <Badge variant="amber">Pending</Badge>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white">{a.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {a.description || 'No detailed instructions provided.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[var(--blue-icon)]" />
                    <span>
                      {a.due_date ? `Due: ${new Date(a.due_date).toLocaleDateString()}` : 'No Due Date'}
                    </span>
                  </div>

                  <Link
                    href={`/assignments/${a.id}`}
                    className="btn-secondary text-xs"
                  >
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
