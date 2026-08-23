'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LessonListItem } from '@/components/lessons/LessonListItem'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Skeleton } from '@/components/ui/Skeleton'
import { UserRole } from '@/types/database.types'
import {
  BookOpen,
  PlusCircle,
  MessageSquare,
  FileCheck,
  CheckCircle,
  ArrowLeft,
  Calendar,
  Layers,
  GraduationCap,
  Laptop
} from 'lucide-react'

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const router = useRouter()
  const supabase = createClient()

  const [course, setCourse] = useState<any>(null)
  const [courseWeeks, setCourseWeeks] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [enrolled, setEnrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  const [userRole, setUserRole] = useState<UserRole>('student')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Add Lesson Modal State
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
  const [lessonWeekId, setLessonWeekId] = useState('')
  const [lessonComponentType, setLessonComponentType] = useState<'lecture' | 'tutorial' | 'lab'>('lecture')
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonDescription, setLessonDescription] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [lessonVideoUrl, setLessonVideoUrl] = useState('')
  const [submittingLesson, setSubmittingLesson] = useState(false)

  // Add Assignment Modal State
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [assignmentWeekId, setAssignmentWeekId] = useState('')
  const [assignmentComponentType, setAssignmentComponentType] = useState<'lecture' | 'tutorial' | 'lab'>('lecture')
  const [assignmentTitle, setAssignmentTitle] = useState('')
  const [assignmentDescription, setAssignmentDescription] = useState('')
  const [assignmentDueDate, setAssignmentDueDate] = useState('')
  const [assignmentMaxScore, setAssignmentMaxScore] = useState(100)
  const [submittingAssignment, setSubmittingAssignment] = useState(false)

  useEffect(() => {
    loadCourseDetails()
  }, [courseId])

  async function loadCourseDetails() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile) setUserRole(profile.role)

      // Check enrollment
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id, progress')
        .eq('course_id', courseId)
        .eq('student_id', user.id)
        .single()

      if (enrollment) {
        setEnrolled(true)
        setProgress(enrollment.progress)
      }
    }

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select(`
        *,
        teacher:profiles!courses_teacher_id_fkey(full_name, bio, avatar_url)
      `)
      .eq('id', courseId)
      .single()

    if (courseError) {
      console.error('Error fetching course:', courseError)
    }

    if (courseData) {
      setCourse(courseData)
    }

    // Fetch Weeks
    const { data: weeksData } = await supabase
      .from('course_weeks')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (weeksData) {
      setCourseWeeks(weeksData)
      if (weeksData.length > 0) {
        setLessonWeekId(weeksData[0].id)
        setAssignmentWeekId(weeksData[0].id)
      }
    }

    // Fetch Lessons
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })

    if (lessonsData) setLessons(lessonsData)

    // Fetch Assignments
    const { data: assignmentsData } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', courseId)
      .order('due_date', { ascending: true })

    if (assignmentsData) setAssignments(assignmentsData)

    setLoading(false)
  }

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault()

    if (lessonComponentType === 'tutorial' && !course?.has_tutorial) return
    if (lessonComponentType === 'lab' && !course?.has_lab) return

    setSubmittingLesson(true)

    const { error } = await supabase.from('lessons').insert({
      course_id: courseId,
      week_id: lessonWeekId || null,
      component_type: lessonComponentType,
      title: lessonTitle,
      description: lessonDescription,
      content: lessonContent,
      video_url: lessonVideoUrl || null,
      order_index: lessons.length,
    })

    setSubmittingLesson(false)
    if (!error) {
      setIsLessonModalOpen(false)
      setLessonTitle('')
      setLessonDescription('')
      setLessonContent('')
      setLessonVideoUrl('')
      loadCourseDetails()
    }
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (assignmentComponentType === 'tutorial' && !course?.has_tutorial) return
    if (assignmentComponentType === 'lab' && !course?.has_lab) return

    setSubmittingAssignment(true)

    const { error } = await supabase.from('assignments').insert({
      course_id: courseId,
      week_id: assignmentWeekId || null,
      component_type: assignmentComponentType,
      title: assignmentTitle,
      description: assignmentDescription,
      due_date: assignmentDueDate ? new Date(assignmentDueDate).toISOString() : null,
      max_score: assignmentMaxScore,
    })

    setSubmittingAssignment(false)
    if (!error) {
      setIsAssignmentModalOpen(false)
      setAssignmentTitle('')
      setAssignmentDescription('')
      setAssignmentDueDate('')
      loadCourseDetails()
    }
  }

  const isTeacherOrAdmin =
    userRole === 'admin' || (userRole === 'teacher' && course?.teacher_id === userId)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="lms-card p-12 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Course Not Found</h2>
        <p className="text-xs text-[var(--text-secondary)] mb-4">
          The requested course could not be located.
        </p>
        <Link href="/courses" className="btn-secondary text-xs">
          Back to Courses
        </Link>
      </div>
    )
  }

  // Group content by week
  const groupedLessons: Record<string, any[]> = {}
  const unassignedLessons: any[] = []
  lessons.forEach((l) => {
    if (l.week_id) {
      if (!groupedLessons[l.week_id]) groupedLessons[l.week_id] = []
      groupedLessons[l.week_id].push(l)
    } else {
      unassignedLessons.push(l)
    }
  })

  const groupedAssignments: Record<string, any[]> = {}
  const unassignedAssignments: any[] = []
  assignments.forEach((a) => {
    if (a.week_id) {
      if (!groupedAssignments[a.week_id]) groupedAssignments[a.week_id] = []
      groupedAssignments[a.week_id].push(a)
    } else {
      unassignedAssignments.push(a)
    }
  })

  return (
    <div className="space-y-8 animate-fadeIn">
      <Link
        href="/courses"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[var(--blue-glow)] transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </Link>

      {/* Course Banner Card */}
      <div className="lms-card overflow-hidden p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-start justify-between">
        <div className="space-y-4 max-w-3xl">
          <div className="flex flex-wrap gap-2">
            {course.category && <Badge variant="blue">{course.category}</Badge>}
            <Badge variant="red">{course.level}</Badge>
            {course.has_tutorial && (
              <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" /> Tutorial Available
              </span>
            )}
            {course.has_lab && (
              <span className="text-xs font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1">
                <Laptop className="w-3.5 h-3.5" /> Lab Available
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-wide">
            {course.title}
          </h1>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {course.description}
          </p>

          <div className="flex items-center gap-4 pt-2 border-t border-[var(--blue-border)]/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--red-action)]/30 flex items-center justify-center font-bold text-xs text-[var(--blue-glow)] border border-[var(--blue-border)]/40">
                {course.teacher?.full_name?.charAt(0) || 'T'}
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  {course.teacher?.full_name || 'Instructor'}
                </p>
                <p className="text-[10px] text-slate-400">Course Lead</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enrollment Status & Instructor Actions */}
        <div className="w-full md:w-80 shrink-0 bg-[var(--bg-primary)]/40 backdrop-blur-md p-6 rounded-xl border border-slate-700/80 space-y-4">
          {enrolled ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle className="w-5 h-5" /> Enrolled in Course
              </div>
              <ProgressBar progress={progress} />
            </div>
          ) : (
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 text-center">
              <p className="text-xs font-semibold text-slate-300">Not Enrolled</p>
              <p className="text-[11px] text-slate-400 leading-normal">
                Course enrollment is managed automatically via your{' '}
                <Link href="/my-semester" className="text-[var(--blue-glow)] font-bold hover:underline">
                  My Semester
                </Link>{' '}
                page.
              </p>
            </div>
          )}

          <div className="border-t border-slate-800 pt-3 space-y-2">
            <Link
              href={`/discussions/${courseId}`}
              className="btn-secondary w-full text-xs text-center justify-center"
            >
              <MessageSquare className="w-4 h-4 text-[var(--blue-icon)]" /> Join Discussions
            </Link>

            {isTeacherOrAdmin && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <p className="text-[10px] uppercase font-bold text-amber-400">Instructor Tools</p>
                <Button
                  variant="secondary"
                  onClick={() => setIsLessonModalOpen(true)}
                  className="w-full text-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[var(--blue-glow)]" /> Add Lesson
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsAssignmentModalOpen(true)}
                  className="w-full text-xs"
                >
                  <FileCheck className="w-3.5 h-3.5 text-[var(--red-action)]" /> Add Assignment
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Weekly Curriculum */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--blue-border)]/40 pb-3">
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--blue-glow)]" /> Course Curriculum
          </h2>
          <Badge variant="blue" className="text-xs font-mono">
            {courseWeeks.length} Weeks
          </Badge>
        </div>

        {courseWeeks.length === 0 && unassignedLessons.length === 0 && unassignedAssignments.length === 0 ? (
          <div className="lms-card p-12 text-center text-xs text-slate-400">
            No course weeks or content have been published for this course yet.
          </div>
        ) : (
          <div className="space-y-8">
            {/* Render Weeks */}
            {courseWeeks.map((week) => {
              const weekLessons = groupedLessons[week.id] || []
              const weekAssignments = groupedAssignments[week.id] || []

              // Component type filters
              const lectureLessons = weekLessons.filter(l => !l.component_type || l.component_type === 'lecture')
              const tutorialLessons = weekLessons.filter(l => l.component_type === 'tutorial')
              const labLessons = weekLessons.filter(l => l.component_type === 'lab')

              const lectureAssignments = weekAssignments.filter(a => !a.component_type || a.component_type === 'lecture')
              const tutorialAssignments = weekAssignments.filter(a => a.component_type === 'tutorial')
              const labAssignments = weekAssignments.filter(a => a.component_type === 'lab')

              return (
                <div
                  key={week.id}
                  className="lms-card p-6 space-y-6 border border-slate-800/90 hover:border-[var(--blue-border)]/60 transition-all rounded-xl shadow-lg"
                >
                  {/* Week Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-bold text-[var(--cyan-glow)] flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[var(--blue-glow)]" />
                      {week.title}
                    </h3>
                    {(week.start_date || week.end_date) && (
                      <div className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/60 font-mono shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-[var(--blue-icon)]" />
                        <span>
                          {week.start_date ? new Date(week.start_date).toLocaleDateString() : 'N/A'} — {' '}
                          {week.end_date ? new Date(week.end_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 1. LECTURES / MAIN CONTENT SECTION */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[var(--blue-glow)]" /> 📖 Lectures & Main Lessons ({lectureLessons.length})
                    </h4>
                    {lectureLessons.length === 0 ? (
                      <p className="text-xs text-slate-500 italic pl-2">No lecture lessons assigned to this week.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {lectureLessons.map((lesson, idx) => (
                          <LessonListItem
                            key={lesson.id}
                            id={lesson.id}
                            courseId={courseId}
                            title={lesson.title}
                            description={lesson.description}
                            orderIndex={idx}
                            videoUrl={lesson.video_url}
                            completed={progress >= Math.round(((lessons.indexOf(lesson) + 1) / lessons.length) * 100)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Lecture Assignments */}
                    {lectureAssignments.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <FileCheck className="w-3.5 h-3.5 text-[#9180ff]" /> Lecture Assignments ({lectureAssignments.length})
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {lectureAssignments.map((a) => (
                            <Link
                              key={a.id}
                              href={`/assignments/${a.id}`}
                              className="block lms-card p-4 hover:border-[var(--cyan-border)] transition bg-[var(--bg-primary)]/40 border border-slate-800/80 rounded-xl"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="font-semibold text-xs sm:text-sm text-white hover:text-[var(--cyan-glow)] transition">
                                  {a.title}
                                </h5>
                                <Badge variant="blue" className="text-[10px] shrink-0 font-mono">
                                  {a.max_score} pts
                                </Badge>
                              </div>
                              {a.description && (
                                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                                  {a.description}
                                </p>
                              )}
                              {a.due_date && (
                                <p className="text-[11px] text-[var(--cyan-glow)] mt-3 font-medium flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-[var(--blue-icon)]" />
                                  Due: {new Date(a.due_date).toLocaleDateString()}
                                </p>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. TUTORIAL COMPONENT (Rendered ONLY if has_tutorial is enabled for the course) */}
                  {course.has_tutorial && (
                    <div className="space-y-4 border-t border-amber-500/30 pt-5 bg-amber-500/5 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-amber-400" /> 🎓 Tutorial Component
                      </h4>

                      {/* Tutorial Lessons */}
                      {tutorialLessons.length === 0 ? (
                        <p className="text-xs text-slate-500 italic pl-2">No tutorial lessons assigned to this week.</p>
                      ) : (
                        <div className="space-y-2.5">
                          {tutorialLessons.map((lesson, idx) => (
                            <LessonListItem
                              key={lesson.id}
                              id={lesson.id}
                              courseId={courseId}
                              title={lesson.title}
                              description={lesson.description}
                              orderIndex={idx}
                              videoUrl={lesson.video_url}
                              completed={progress >= Math.round(((lessons.indexOf(lesson) + 1) / lessons.length) * 100)}
                            />
                          ))}
                        </div>
                      )}

                      {/* Tutorial Assignments */}
                      {tutorialAssignments.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <p className="text-[11px] font-semibold text-amber-400/90 uppercase tracking-wider flex items-center gap-1">
                            <FileCheck className="w-3.5 h-3.5 text-amber-400" /> Tutorial Assignments ({tutorialAssignments.length})
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {tutorialAssignments.map((a) => (
                              <Link
                                key={a.id}
                                href={`/assignments/${a.id}`}
                                className="block lms-card p-4 hover:border-amber-500/50 transition bg-[var(--bg-primary)]/40 border border-amber-500/20 rounded-xl"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <h5 className="font-semibold text-xs sm:text-sm text-white hover:text-amber-300 transition">
                                    {a.title}
                                  </h5>
                                  <Badge variant="blue" className="text-[10px] shrink-0 font-mono">
                                    {a.max_score} pts
                                  </Badge>
                                </div>
                                {a.description && (
                                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                                    {a.description}
                                  </p>
                                )}
                                {a.due_date && (
                                  <p className="text-[11px] text-amber-300 mt-3 font-medium flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                    Due: {new Date(a.due_date).toLocaleDateString()}
                                  </p>
                                )}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. LAB COMPONENT (Rendered ONLY if has_lab is enabled for the course) */}
                  {course.has_lab && (
                    <div className="space-y-4 border-t border-cyan-500/30 pt-5 bg-cyan-500/5 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Laptop className="w-4 h-4 text-cyan-400" /> 💻 Lab Component
                      </h4>

                      {/* Lab Lessons */}
                      {labLessons.length === 0 ? (
                        <p className="text-xs text-slate-500 italic pl-2">No lab lessons assigned to this week.</p>
                      ) : (
                        <div className="space-y-2.5">
                          {labLessons.map((lesson, idx) => (
                            <LessonListItem
                              key={lesson.id}
                              id={lesson.id}
                              courseId={courseId}
                              title={lesson.title}
                              description={lesson.description}
                              orderIndex={idx}
                              videoUrl={lesson.video_url}
                              completed={progress >= Math.round(((lessons.indexOf(lesson) + 1) / lessons.length) * 100)}
                            />
                          ))}
                        </div>
                      )}

                      {/* Lab Assignments */}
                      {labAssignments.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <p className="text-[11px] font-semibold text-cyan-400/90 uppercase tracking-wider flex items-center gap-1">
                            <FileCheck className="w-3.5 h-3.5 text-cyan-400" /> Lab Assignments ({labAssignments.length})
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {labAssignments.map((a) => (
                              <Link
                                key={a.id}
                                href={`/assignments/${a.id}`}
                                className="block lms-card p-4 hover:border-cyan-500/50 transition bg-[var(--bg-primary)]/40 border border-cyan-500/20 rounded-xl"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <h5 className="font-semibold text-xs sm:text-sm text-white hover:text-cyan-300 transition">
                                    {a.title}
                                  </h5>
                                  <Badge variant="blue" className="text-[10px] shrink-0 font-mono">
                                    {a.max_score} pts
                                  </Badge>
                                </div>
                                {a.description && (
                                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                                    {a.description}
                                  </p>
                                )}
                                {a.due_date && (
                                  <p className="text-[11px] text-cyan-300 mt-3 font-medium flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                                    Due: {new Date(a.due_date).toLocaleDateString()}
                                  </p>
                                )}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Fallback Unassigned Content Section */}
            {(unassignedLessons.length > 0 || unassignedAssignments.length > 0) && (
              <div className="lms-card p-6 space-y-6 border border-amber-500/30 bg-amber-500/5 rounded-xl">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                  <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                    <Layers className="w-5 h-5" /> General / Unassigned Content
                  </h3>
                  <Badge variant="red" className="text-xs">
                    {unassignedLessons.length} Lessons • {unassignedAssignments.length} Assignments
                  </Badge>
                </div>

                {unassignedLessons.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[var(--blue-glow)]" /> Lessons
                    </h4>
                    <div className="space-y-2.5">
                      {unassignedLessons.map((lesson, idx) => (
                        <LessonListItem
                          key={lesson.id}
                          id={lesson.id}
                          courseId={courseId}
                          title={lesson.title}
                          description={lesson.description}
                          orderIndex={idx}
                          videoUrl={lesson.video_url}
                          completed={progress >= Math.round(((lessons.indexOf(lesson) + 1) / lessons.length) * 100)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {unassignedAssignments.length > 0 && (
                  <div className="space-y-3 border-t border-amber-500/20 pt-4">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-[#9180ff]" /> Assignments
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {unassignedAssignments.map((a) => (
                        <Link
                          key={a.id}
                          href={`/assignments/${a.id}`}
                          className="block lms-card p-4 hover:border-[var(--cyan-border)] transition bg-[var(--bg-primary)]/40 border border-slate-800/80 rounded-xl"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-semibold text-xs sm:text-sm text-white">
                              {a.title}
                            </h5>
                            <Badge variant="blue" className="text-[10px] shrink-0 font-mono">
                              {a.max_score} pts
                            </Badge>
                          </div>
                          {a.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                              {a.description}
                            </p>
                          )}
                          {a.due_date && (
                            <p className="text-[11px] text-[var(--cyan-glow)] mt-3 font-medium flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[var(--blue-icon)]" />
                              Due: {new Date(a.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal to Add Lesson */}
      <Modal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        title="Add New Lesson"
      >
        <form onSubmit={handleCreateLesson} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
          {courseWeeks.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Assign to Week
              </label>
              <select
                value={lessonWeekId}
                onChange={(e) => setLessonWeekId(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[var(--blue-border)]"
              >
                <option value="">-- No specific week --</option>
                {courseWeeks.map((w) => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Component Type</label>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-slate-700 bg-slate-900 text-xs font-medium text-white cursor-pointer hover:border-[var(--blue-glow)]">
                <input
                  type="radio"
                  name="lessonType"
                  value="lecture"
                  checked={lessonComponentType === 'lecture'}
                  onChange={() => setLessonComponentType('lecture')}
                  className="accent-[var(--blue-glow)]"
                />
                Lecture 📖
              </label>
              <label className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium ${
                course?.has_tutorial
                  ? 'border-slate-700 bg-slate-900 text-white cursor-pointer hover:border-amber-500/50'
                  : 'border-slate-800 bg-slate-950 text-slate-600 cursor-not-allowed opacity-50'
              }`}>
                <input
                  type="radio"
                  name="lessonType"
                  value="tutorial"
                  disabled={!course?.has_tutorial}
                  checked={lessonComponentType === 'tutorial'}
                  onChange={() => setLessonComponentType('tutorial')}
                  className="accent-amber-400"
                />
                Tutorial 🎓
              </label>
              <label className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium ${
                course?.has_lab
                  ? 'border-slate-700 bg-slate-900 text-white cursor-pointer hover:border-cyan-500/50'
                  : 'border-slate-800 bg-slate-950 text-slate-600 cursor-not-allowed opacity-50'
              }`}>
                <input
                  type="radio"
                  name="lessonType"
                  value="lab"
                  disabled={!course?.has_lab}
                  checked={lessonComponentType === 'lab'}
                  onChange={() => setLessonComponentType('lab')}
                  className="accent-cyan-400"
                />
                Lab 💻
              </label>
            </div>
          </div>

          <Input
            label="Lesson Title"
            required
            placeholder="e.g. Introduction to App Router"
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
          />
          <Input
            label="Brief Description"
            placeholder="Short overview..."
            value={lessonDescription}
            onChange={(e) => setLessonDescription(e.target.value)}
          />
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Lesson Content (Markdown Supported)
            </label>
            <textarea
              rows={4}
              placeholder="Detailed lesson notes and code examples..."
              value={lessonContent}
              onChange={(e) => setLessonContent(e.target.value)}
              className="w-full bg-[var(--bg-primary)]/40 backdrop-blur-md border border-[var(--blue-border)]/40 rounded-lg p-3 text-xs text-white placeholder-[var(--text-secondary)]/60 focus:outline-none focus:border-[var(--blue-border)]"
            />
          </div>
          <Input
            label="Video Stream URL (Optional)"
            placeholder="https://www.youtube.com/embed/..."
            value={lessonVideoUrl}
            onChange={(e) => setLessonVideoUrl(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
            <Button variant="secondary" type="button" onClick={() => setIsLessonModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submittingLesson}>
              Save Lesson
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal to Add Assignment */}
      <Modal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        title="Create Course Assignment"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
          {courseWeeks.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Assign to Week
              </label>
              <select
                value={assignmentWeekId}
                onChange={(e) => setAssignmentWeekId(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[var(--blue-border)]"
              >
                <option value="">-- No specific week --</option>
                {courseWeeks.map((w) => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Component Type</label>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-slate-700 bg-slate-900 text-xs font-medium text-white cursor-pointer hover:border-[var(--blue-glow)]">
                <input
                  type="radio"
                  name="assignmentType"
                  value="lecture"
                  checked={assignmentComponentType === 'lecture'}
                  onChange={() => setAssignmentComponentType('lecture')}
                  className="accent-[var(--blue-glow)]"
                />
                Lecture 📖
              </label>
              <label className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium ${
                course?.has_tutorial
                  ? 'border-slate-700 bg-slate-900 text-white cursor-pointer hover:border-amber-500/50'
                  : 'border-slate-800 bg-slate-950 text-slate-600 cursor-not-allowed opacity-50'
              }`}>
                <input
                  type="radio"
                  name="assignmentType"
                  value="tutorial"
                  disabled={!course?.has_tutorial}
                  checked={assignmentComponentType === 'tutorial'}
                  onChange={() => setAssignmentComponentType('tutorial')}
                  className="accent-amber-400"
                />
                Tutorial 🎓
              </label>
              <label className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium ${
                course?.has_lab
                  ? 'border-slate-700 bg-slate-900 text-white cursor-pointer hover:border-cyan-500/50'
                  : 'border-slate-800 bg-slate-950 text-slate-600 cursor-not-allowed opacity-50'
              }`}>
                <input
                  type="radio"
                  name="assignmentType"
                  value="lab"
                  disabled={!course?.has_lab}
                  checked={assignmentComponentType === 'lab'}
                  onChange={() => setAssignmentComponentType('lab')}
                  className="accent-cyan-400"
                />
                Lab 💻
              </label>
            </div>
          </div>

          <Input
            label="Assignment Title"
            required
            placeholder="e.g. Build an API Endpoint"
            value={assignmentTitle}
            onChange={(e) => setAssignmentTitle(e.target.value)}
          />
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Instructions / Guidelines
            </label>
            <textarea
              rows={3}
              placeholder="Task instructions and requirements..."
              value={assignmentDescription}
              onChange={(e) => setAssignmentDescription(e.target.value)}
              className="w-full bg-[var(--bg-primary)]/40 backdrop-blur-md border border-[var(--blue-border)]/40 rounded-lg p-3 text-xs text-white placeholder-[var(--text-secondary)]/60 focus:outline-none focus:border-[var(--blue-border)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Due Date"
              type="date"
              value={assignmentDueDate}
              onChange={(e) => setAssignmentDueDate(e.target.value)}
            />
            <Input
              label="Max Score"
              type="number"
              value={assignmentMaxScore}
              onChange={(e) => setAssignmentMaxScore(Number(e.target.value))}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
            <Button variant="secondary" type="button" onClick={() => setIsAssignmentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submittingAssignment}>
              Publish Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
