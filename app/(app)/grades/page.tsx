'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GradeTable } from '@/components/grades/GradeTable'
import { Skeleton } from '@/components/ui/Skeleton'
import { Award, BookOpen } from 'lucide-react'

export default function GradesPage() {
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadGrades() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: submissions } = await supabase
        .from('submissions')
        .select(`
          id,
          grade,
          feedback,
          submitted_at,
          assignment:assignments(
            title,
            max_score,
            course:courses(title)
          )
        `)
        .eq('student_id', user.id)
        .order('submitted_at', { ascending: false })

      if (submissions) {
        const formatted = submissions.map((s: any) => ({
          id: s.id,
          courseTitle: s.assignment?.course?.title || 'Course',
          assignmentTitle: s.assignment?.title || 'Assignment',
          grade: s.grade,
          maxScore: s.assignment?.max_score || 100,
          submittedAt: s.submitted_at,
          feedback: s.feedback,
        }))
        setGrades(formatted)
      }

      setLoading(false)
    }

    loadGrades()
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
          Academic <span className="glow-heading">Gradebook</span>
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Review your scores, percentage evaluations, and teacher feedback.
        </p>
      </div>

      <GradeTable grades={grades} />
    </div>
  )
}
