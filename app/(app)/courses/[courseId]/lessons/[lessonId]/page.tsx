'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  ArrowLeft,
} from 'lucide-react'

export default function LessonViewPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const lessonId = params.lessonId as string
  const router = useRouter()
  const supabase = createClient()

  const [lesson, setLesson] = useState<any>(null)
  const [allLessons, setAllLessons] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updatingProgress, setUpdatingProgress] = useState(false)

  useEffect(() => {
    loadLessonData()
  }, [courseId, lessonId])

  async function loadLessonData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    // Load current lesson
    const { data: currentLesson } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single()

    if (currentLesson) setLesson(currentLesson)

    // Load all course lessons to build navigation order
    const { data: lessonsList } = await supabase
      .from('lessons')
      .select('id, title, order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })

    if (lessonsList) setAllLessons(lessonsList)

    // Check user progress for completion state
    if (user && lessonsList) {
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('progress')
        .eq('course_id', courseId)
        .eq('student_id', user.id)
        .single()

      if (enrollment) {
        const currentIndex = lessonsList.findIndex((l) => l.id === lessonId)
        const total = lessonsList.length
        const currentCalculated = Math.round(((currentIndex + 1) / total) * 100)
        if (enrollment.progress >= currentCalculated) {
          setCompleted(true)
        }
      }
    }

    setLoading(false)
  }

  const handleMarkCompleted = async () => {
    if (!userId || !allLessons.length) return
    setUpdatingProgress(true)

    const currentIndex = allLessons.findIndex((l) => l.id === lessonId)
    const total = allLessons.length
    const newProgress = Math.round(((currentIndex + 1) / total) * 100)

    const { data: currentEnrollment } = await supabase
      .from('enrollments')
      .select('progress')
      .eq('course_id', courseId)
      .eq('student_id', userId)
      .single()

    const updatedValue = Math.max(currentEnrollment?.progress || 0, newProgress)

    await supabase
      .from('enrollments')
      .update({ progress: updatedValue })
      .eq('course_id', courseId)
      .eq('student_id', userId)

    setCompleted(true)
    setUpdatingProgress(false)
  }

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="lms-card p-12 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Lesson Not Found</h2>
        <Link href={`/courses/${courseId}`} className="btn-secondary text-xs">
          Return to Course
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <Link
        href={`/courses/${courseId}`}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[var(--cyan-glow)] transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Syllabus
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Lesson Viewer */}
        <div className="lg:col-span-3 space-y-6">
          {/* Video Stream Container if video URL exists */}
          {lesson.video_url && (
            <div className="relative aspect-video w-full bg-[var(--bg-secondary)] rounded-2xl overflow-hidden border border-[var(--blue-border)]/40 shadow-[0_0_25px_rgba(46,111,217,0.2)]">
              <iframe
                src={lesson.video_url}
                title={lesson.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Lesson Header & Mark Complete */}
          <div className="lms-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[var(--blue-glow)] uppercase tracking-wider">
                Lesson {currentIndex + 1} of {allLessons.length}
              </span>
              <h1 className="text-2xl font-extrabold text-white mt-0.5">{lesson.title}</h1>
            </div>

            <Button
              onClick={handleMarkCompleted}
              variant={completed ? 'secondary' : 'primary'}
              isLoading={updatingProgress}
              className="shrink-0 text-xs"
            >
              <CheckCircle2 className={`w-4 h-4 ${completed ? 'text-emerald-400' : ''}`} />
              {completed ? 'Completed' : 'Mark as Completed'}
            </Button>
          </div>

          {/* Lesson Text / Markdown Content */}
          <div className="lms-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--blue-glow)] uppercase tracking-wider border-b border-slate-700/60 pb-2">
              Lesson Content
            </h3>
            <div className="text-sm text-slate-200 leading-relaxed space-y-4 whitespace-pre-wrap">
              {lesson.content || lesson.description || 'No written notes provided for this lesson.'}
            </div>
          </div>

          {/* Prev / Next Navigation Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700/60">
            {prevLesson ? (
              <Link
                href={`/courses/${courseId}/lessons/${prevLesson.id}`}
                className="btn-secondary text-xs"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Lesson
              </Link>
            ) : <div />}

            {nextLesson ? (
              <Link
                href={`/courses/${courseId}/lessons/${nextLesson.id}`}
                className="btn-primary text-xs"
              >
                Next Lesson <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link href={`/courses/${courseId}`} className="btn-secondary text-xs">
                Finish Course Syllabus
              </Link>
            )}
          </div>
        </div>

        {/* Sidebar Syllabus Switcher */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white tracking-wide">Course Lessons</h3>
          <div className="lms-card p-2 space-y-1">
            {allLessons.map((l, idx) => {
              const isCurrent = l.id === lessonId
              return (
                <Link
                  key={l.id}
                  href={`/courses/${courseId}/lessons/${l.id}`}
                  className={`flex items-center gap-3 p-3 rounded-lg text-xs font-medium transition ${
                    isCurrent
                      ? 'bg-[var(--red-action)] text-white shadow-[0_0_12px_rgba(255,32,32,0.4)] border border-[var(--blue-border)]/50'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="truncate">{l.title}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
