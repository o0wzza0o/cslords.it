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
  User,
  PlusCircle,
  MessageSquare,
  FileCheck,
  CheckCircle,
  Trash2,
  Edit,
  ArrowLeft,
  Calendar,
} from 'lucide-react'

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const router = useRouter()
  const supabase = createClient()

  const [course, setCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [enrolled, setEnrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  const [userRole, setUserRole] = useState<UserRole>('student')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)

  // Add Lesson Modal State
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonDescription, setLessonDescription] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [lessonVideoUrl, setLessonVideoUrl] = useState('')
  const [submittingLesson, setSubmittingLesson] = useState(false)

  // Add Assignment Modal State
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
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

    // Fetch Course details
    const { data: courseData } = await supabase
      .from('courses')
      .select(`
        *,
        teacher:profiles(full_name, bio, avatar_url)
      `)
      .eq('id', courseId)
      .single()

    if (courseData) {
      setCourse(courseData)
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

  const handleEnroll = async () => {
    if (!userId) {
      router.push('/login')
      return
    }
    setEnrolling(true)
    const { error } = await supabase.from('enrollments').insert({
      course_id: courseId,
      student_id: userId,
      progress: 0,
    })

    setEnrolling(false)
    if (!error) {
      setEnrolled(true)
      setProgress(0)
    }
  }

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingLesson(true)

    const { error } = await supabase.from('lessons').insert({
      course_id: courseId,
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
    setSubmittingAssignment(true)

    const { error } = await supabase.from('assignments').insert({
      course_id: courseId,
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

        {/* Enrollment & Action Box */}
        <div className="w-full md:w-80 shrink-0 bg-[var(--bg-primary)]/40 backdrop-blur-md p-6 rounded-xl border border-slate-700/80 space-y-4">
          {enrolled ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle className="w-5 h-5" /> Enrolled in Course
              </div>
              <ProgressBar progress={progress} />
            </div>
          ) : (
            <Button
              onClick={handleEnroll}
              isLoading={enrolling}
              className="w-full text-sm"
            >
              Enroll Now for Free
            </Button>
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

      {/* Course Content Tabs / Syllabus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lessons Syllabus */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--blue-glow)]" /> Course Syllabus ({lessons.length} Lessons)
          </h2>

          {lessons.length === 0 ? (
            <div className="lms-card p-8 text-center text-xs text-slate-400">
              No lessons have been published for this course yet.
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, idx) => (
                <LessonListItem
                  key={lesson.id}
                  id={lesson.id}
                  courseId={courseId}
                  title={lesson.title}
                  description={lesson.description}
                  orderIndex={idx}
                  videoUrl={lesson.video_url}
                  completed={progress >= Math.round(((idx + 1) / lessons.length) * 100)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Assignments Sidebar */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#9180ff]" /> Assignments ({assignments.length})
          </h2>

          {assignments.length === 0 ? (
            <div className="lms-card p-6 text-center text-xs text-slate-400">
              No assignments assigned for this course.
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => (
                <Link
                  key={a.id}
                  href={`/assignments/${a.id}`}
                  className="block lms-card p-4 hover:border-[var(--cyan-border)] transition"
                >
                  <h4 className="font-semibold text-sm text-white mb-1">{a.title}</h4>
                  {a.due_date && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[var(--blue-icon)]" /> Due:{' '}
                      {new Date(a.due_date).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-[10px] text-[var(--cyan-glow)] mt-2 font-medium">
                    Max Score: {a.max_score} pts &rarr;
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal to Add Lesson */}
      <Modal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        title="Add New Lesson"
      >
        <form onSubmit={handleCreateLesson} className="space-y-4">
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
        <form onSubmit={handleCreateAssignment} className="space-y-4">
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
