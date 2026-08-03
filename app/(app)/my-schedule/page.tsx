'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Calendar, Clock, BookOpen, User, Layers } from 'lucide-react'
import { academicYearLabel } from '@/lib/utils/academic'

interface CourseItem {
  id: string
  title: string
  code: string | null
  description: string | null
  doctor?: {
    full_name: string | null
  }
}

export default function MySchedulePage() {
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadScheduleData()
  }, [])

  async function loadScheduleData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: prof } = await supabase
      .from('profiles')
      .select('*, level:levels(*)')
      .eq('id', user.id)
      .single()

    setProfile(prof)

    // Fetch enrolled courses for student
    const { data: enrollments } = await supabase
      .from('student_courses')
      .select('course:courses(*, doctor:profiles!courses_doctor_id_fkey(full_name))')
      .eq('student_id', user.id)

    if (enrollments) {
      const fetched: CourseItem[] = enrollments
        .map((e: any) => e.course)
        .filter(Boolean)
      setCourses(fetched)
    }

    setLoading(false)
  }

  // Days of the week for schedule grid
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
  const timeSlots = ['09:00 AM - 10:30 AM', '10:45 AM - 12:15 PM', '12:30 PM - 02:00 PM', '02:15 PM - 03:45 PM']

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--bg-secondary)] via-[var(--bg-primary)] to-[var(--red-action)]/20 p-6 border border-[var(--blue-border)]/40 shadow-[0_0_20px_rgba(46,111,217,0.15)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="blue">
                <Layers className="w-3 h-3 mr-1 inline" />
                {profile?.level?.name || academicYearLabel(profile?.academic_year)}
              </Badge>
              <Badge variant="red">
                <Calendar className="w-3 h-3 mr-1 inline" />
                Weekly Schedule
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
              My <span className="glow-heading">Academic Schedule</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Weekly timetable view for your enrolled courses ({courses.length} Active Courses).
            </p>
          </div>
        </div>

        {/* Background grid */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#1e90ff_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none" />
      </div>

      {/* Enrolled Courses Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((c, idx) => (
          <div key={c.id} className="lms-card p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--red-action)]/20 to-[var(--blue-glow)]/20 flex items-center justify-center border border-[var(--blue-border)]/40 shrink-0">
              <BookOpen className="w-5 h-5 text-[var(--blue-glow)]" />
            </div>
            <div>
              {c.code && <Badge variant="blue">{c.code}</Badge>}
              <h3 className="text-xs font-bold text-white mt-1">{c.title}</h3>
              {c.doctor?.full_name && (
                <p className="text-[10px] text-amber-300 flex items-center gap-1 mt-0.5">
                  <User className="w-3 h-3 text-amber-400" /> {c.doctor.full_name}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Schedule Grid */}
      <div className="lms-card overflow-hidden p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-[var(--blue-glow)]" /> Weekly Timetable
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--bg-primary)]/80 text-[var(--blue-glow)] border-b border-slate-700">
                <th className="p-3 text-left w-36 border-r border-slate-800">Time Slot</th>
                {days.map((day) => (
                  <th key={day} className="p-3 text-center border-r border-slate-800 last:border-r-0">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {timeSlots.map((slot, slotIdx) => (
                <tr key={slot} className="hover:bg-slate-800/30 transition">
                  <td className="p-3 font-semibold text-slate-300 border-r border-slate-800 bg-[var(--bg-primary)]/40">
                    {slot}
                  </td>
                  {days.map((day, dayIdx) => {
                    const assignedCourse = courses[(dayIdx + slotIdx) % courses.length]
                    if (!assignedCourse || courses.length === 0) {
                      return (
                        <td key={day} className="p-3 text-center border-r border-slate-800 last:border-r-0 text-slate-600">
                          —
                        </td>
                      )
                    }

                    return (
                      <td key={day} className="p-2 border-r border-slate-800 last:border-r-0">
                        <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--blue-border)]/40 space-y-1 shadow-[0_0_10px_rgba(46,111,217,0.1)]">
                          {assignedCourse.code && (
                            <span className="text-[9px] font-extrabold text-[var(--blue-glow)] block uppercase">
                              {assignedCourse.code}
                            </span>
                          )}
                          <p className="font-bold text-white text-[11px] truncate">
                            {assignedCourse.title}
                          </p>
                          {assignedCourse.doctor?.full_name && (
                            <p className="text-[9px] text-amber-300 truncate">
                              {assignedCourse.doctor.full_name}
                            </p>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
