'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { academicYearLabel } from '@/lib/utils/academic'
import { EnrollmentMode } from '@/types/database.types'
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  CheckSquare,
  Square,
  Clock,
  Layers,
  User,
} from 'lucide-react'

interface Level {
  id: string
  name: string
  level_number: number
}

interface Semester {
  id: string
  level_id: string
  name: string
  semester_number: number
  enrollment_mode: EnrollmentMode
}

interface Doctor {
  full_name: string | null
}

interface CourseItem {
  id: string
  title: string
  code: string | null
  description: string | null
  image_url: string | null
  thumbnail_url: string | null
  doctor?: Doctor
  is_active: boolean
  semester_id: string | null
}

export default function MySemesterPage() {
  const [profile, setProfile] = useState<any>(null)
  const [level, setLevel] = useState<Level | null>(null)
  const [semester, setSemester] = useState<Semester | null>(null)
  const [availableCourses, setAvailableCourses] = useState<CourseItem[]>([])
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadSemesterData()
  }, [])

  async function loadSemesterData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Fetch Student Profile with Level
    const { data: profData } = await supabase
      .from('profiles')
      .select('*, level:levels(*)')
      .eq('id', user.id)
      .single()

    if (!profData) {
      setLoading(false)
      return
    }

    setProfile(profData)
    const studentLevel = profData.level

    let targetSem: Semester | null = null

    if (studentLevel) {
      setLevel(studentLevel)
      // Fetch Semester for this level
      const { data: semData } = await supabase
        .from('semesters')
        .select('*')
        .eq('level_id', studentLevel.id)
        .order('semester_number', { ascending: true })

      if (semData && semData.length > 0) {
        targetSem = semData[0]
        setSemester(targetSem)
      }
    }

    // 2. Fetch Available Courses for this Semester
    let coursesData: CourseItem[] = []
    if (targetSem) {
      const { data } = await supabase
        .from('courses')
        .select('*, doctor:profiles!courses_doctor_id_fkey(full_name)')
        .eq('semester_id', targetSem.id)
        .eq('is_active', true)
        .order('title', { ascending: true })

      coursesData = (data as any) || []
    } else {
      // Fallback if level/semester unassigned: fetch all active courses
      const { data } = await supabase
        .from('courses')
        .select('*, doctor:profiles!courses_doctor_id_fkey(full_name)')
        .eq('is_active', true)
        .order('title', { ascending: true })
      coursesData = (data as any) || []
    }

    setAvailableCourses(coursesData)

    // 3. Fetch Currently Enrolled Courses for Student
    const { data: enrollments } = await supabase
      .from('student_courses')
      .select('course_id')
      .eq('student_id', user.id)

    const enrolledIds = new Set<string>()
    if (enrollments) {
      enrollments.forEach((e) => enrolledIds.add(e.course_id))
    }

    // If Automatic mode and not enrolled yet, auto-enroll all available courses
    if (targetSem?.enrollment_mode === 'Automatic') {
      const allIds = new Set(coursesData.map((c) => c.id))
      setSelectedCourseIds(allIds)
    } else {
      setSelectedCourseIds(enrolledIds)
    }

    setLoading(false)
  }

  const toggleCourseSelection = (courseId: string) => {
    if (semester?.enrollment_mode === 'Automatic') return

    const next = new Set(selectedCourseIds)
    if (next.has(courseId)) {
      next.delete(courseId)
    } else {
      next.add(courseId)
    }
    setSelectedCourseIds(next)
  }

  const handleSaveCourseSelections = async () => {
    if (!profile) return
    setSaving(true)
    setToastMsg(null)

    try {
      // Delete previous student_courses records for this semester's available courses
      const currentAvailableIds = availableCourses.map((c) => c.id)
      if (currentAvailableIds.length > 0) {
        await supabase
          .from('student_courses')
          .delete()
          .eq('student_id', profile.id)
          .in('course_id', currentAvailableIds)
      }

      // Insert newly selected courses into student_courses
      const selectedList = Array.from(selectedCourseIds)
      if (selectedList.length > 0) {
        const payload = selectedList.map((cId) => ({
          student_id: profile.id,
          course_id: cId,
          progress: 0,
        }))

        const { error: insertErr } = await supabase
          .from('student_courses')
          .insert(payload)

        if (insertErr) {
          showToast('error', insertErr.message || 'Failed to save course selections.')
          return
        }
      }

      showToast('success', 'Your course selections have been saved successfully!')
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save courses.')
    } finally {
      setSaving(false)
    }
  }

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg(null), 4000)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const isAutomatic = semester?.enrollment_mode === 'Automatic'

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--bg-secondary)] via-[var(--bg-primary)] to-[var(--red-action)]/20 p-6 border border-[var(--blue-border)]/40 shadow-[0_0_20px_rgba(46,111,217,0.15)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="blue">
                <Layers className="w-3 h-3 mr-1 inline" />
                {level?.name || academicYearLabel(profile?.academic_year)}
              </Badge>
              {semester && (
                <Badge variant="red">
                  <Clock className="w-3 h-3 mr-1 inline" />
                  {semester.name}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
              My <span className="glow-heading">Semester & Course Selection</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {isAutomatic
                ? 'Your courses are automatically assigned by the administration for this semester.'
                : 'Select the courses you are officially enrolled in for this semester.'}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[var(--bg-primary)]/80 border border-[var(--blue-border)]/40 text-xs">
              <span className="text-slate-400 block text-[10px]">Enrollment Mode:</span>
              {isAutomatic ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" /> Automatic (Locked)
                </span>
              ) : (
                <span className="text-amber-300 font-bold flex items-center gap-1 mt-0.5">
                  <CheckSquare className="w-3.5 h-3.5 text-amber-400" /> Manual Selection
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Decorative pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#1e90ff_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none" />
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

      {/* Course Selection Container */}
      <div className="lms-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--blue-glow)]" /> Select Your Courses
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedCourseIds.size} of {availableCourses.length} courses selected
            </p>
          </div>

          {!isAutomatic && (
            <Button
              onClick={handleSaveCourseSelections}
              isLoading={saving}
              className="text-xs"
            >
              <Save className="w-4 h-4" /> Save Course Selections
            </Button>
          )}
        </div>

        {/* Courses List Checklist */}
        {availableCourses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No active courses available for this semester yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableCourses.map((c) => {
              const selected = selectedCourseIds.has(c.id)
              return (
                <div
                  key={c.id}
                  onClick={() => toggleCourseSelection(c.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    selected
                      ? 'bg-[var(--bg-secondary)]/90 border-[var(--blue-border)] shadow-[0_0_15px_rgba(46,111,217,0.2)]'
                      : 'bg-[var(--bg-primary)]/40 border-slate-800 hover:border-slate-700'
                  } ${isAutomatic ? 'cursor-default opacity-90' : ''}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {selected ? (
                      <CheckSquare className="w-5 h-5 text-[var(--blue-glow)]" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {c.code && <Badge variant="blue">{c.code}</Badge>}
                      <h3 className="text-sm font-bold text-white truncate">{c.title}</h3>
                    </div>
                    {c.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.description}</p>
                    )}
                    {c.doctor?.full_name && (
                      <p className="text-[11px] text-amber-300 flex items-center gap-1 mt-2 font-medium">
                        <User className="w-3 h-3 text-amber-400" /> {c.doctor.full_name}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
