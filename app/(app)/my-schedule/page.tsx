'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Calendar, Clock, BookOpen, User, Layers, Plus, X } from 'lucide-react'
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

interface ScheduleItem {
  id: string
  student_id: string
  course_id: string
  day_of_week: string
  time_slot: string
  course?: CourseItem
}

export default function MySchedulePage() {
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ day: string; time: string } | null>(null)

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

    let fetchedCourses: CourseItem[] = []
    if (enrollments) {
      fetchedCourses = enrollments
        .map((e: any) => e.course)
        .filter(Boolean)
      setCourses(fetchedCourses)
    }

    // Fetch student schedule
    const { data: scheduleData } = await supabase
      .from('student_schedule')
      .select('*')
      .eq('student_id', user.id)

    if (scheduleData) {
      // Map courses into schedule
      const mappedSchedule = scheduleData.map(s => {
        const c = fetchedCourses.find(fc => fc.id === s.course_id)
        return { ...s, course: c }
      })
      setSchedule(mappedSchedule)
    }

    setLoading(false)
  }

  // Days of the week for schedule grid
  const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
  const timeSlots = ['9:00 - 10:30', '10:30 - 12:00', '12:00 - 1:30', '1:30 - 3:00']

  const handleCellClick = (day: string, time: string, existingItem?: ScheduleItem) => {
    if (existingItem) {
      removeScheduleItem(existingItem.id)
    } else {
      setSelectedCell({ day, time })
      setIsModalOpen(true)
    }
  }

  const addScheduleItem = async (courseId: string) => {
    if (!selectedCell || !profile) return
    const newEntry = {
      student_id: profile.id,
      course_id: courseId,
      day_of_week: selectedCell.day,
      time_slot: selectedCell.time
    }

    const { data, error } = await supabase
      .from('student_schedule')
      .insert(newEntry)
      .select()
      .single()

    if (!error && data) {
      const c = courses.find(fc => fc.id === courseId)
      setSchedule([...schedule, { ...data, course: c }])
    }
    setIsModalOpen(false)
    setSelectedCell(null)
  }

  const removeScheduleItem = async (scheduleId: string) => {
    const { error } = await supabase
      .from('student_schedule')
      .delete()
      .eq('id', scheduleId)

    if (!error) {
      setSchedule(schedule.filter(s => s.id !== scheduleId))
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn relative">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--bg-secondary)] via-[var(--bg-primary)] to-[var(--red-action)]/20 p-6 border border-[var(--blue-border)]/40 shadow-[0_0_20px_rgba(46,111,217,0.15)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="blue">
                <Layers className="w-3 h-3 mr-1 inline" />
                {profile?.level?.name || academicYearLabel(profile?.academic_year)}
              </Badge>
              {profile?.semester && (
                <Badge variant="purple" className="border-purple-500/40 text-purple-300 bg-purple-500/10">
                  Semester {profile.semester}
                </Badge>
              )}
              <Badge variant="red">
                <Calendar className="w-3 h-3 mr-1 inline" />
                Semester Schedule
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
              My <span className="glow-heading">Academic Schedule</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Build your weekly timetable. Click on any empty slot to add a course.
            </p>
          </div>
        </div>

        {/* Background grid */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#1e90ff_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none" />
      </div>

      {/* Enrolled Courses Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((c) => (
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
          <Clock className="w-5 h-5 text-[var(--blue-glow)]" /> Semester Schedule
        </h2>

        <div className="overflow-x-auto pb-2">
          <table className="w-full border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="bg-[var(--bg-primary)]/80 text-[var(--blue-glow)] border-b border-slate-700">
                <th className="p-3 text-left w-32 border-r border-slate-800">Day/Time</th>
                {timeSlots.map((slot) => (
                  <th key={slot} className="p-3 text-center border-r border-slate-800 last:border-r-0 w-[20%]">
                    {slot}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {days.map((day) => (
                <tr key={day} className="hover:bg-slate-800/30 transition">
                  <td className="p-3 font-semibold text-slate-300 border-r border-slate-800 bg-[var(--bg-primary)]/40 align-middle">
                    {day}
                  </td>
                  {timeSlots.map((slot) => {
                    const assignedItem = schedule.find(s => s.day_of_week === day && s.time_slot === slot)

                    if (!assignedItem || !assignedItem.course) {
                      return (
                        <td key={slot} className="p-2 border-r border-slate-800 last:border-r-0 h-[80px]">
                          <button
                            onClick={() => handleCellClick(day, slot)}
                            className="w-full h-full min-h-[70px] flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-lg text-slate-500 hover:text-[var(--blue-glow)] hover:border-[var(--blue-glow)] hover:bg-[var(--blue-glow)]/10 transition-all group"
                          >
                            <Plus className="w-5 h-5 opacity-50 group-hover:opacity-100 mb-1" />
                            <span className="text-[10px] font-medium">Add Course</span>
                          </button>
                        </td>
                      )
                    }

                    return (
                      <td key={slot} className="p-2 border-r border-slate-800 last:border-r-0 h-[80px] align-top relative group">
                        <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--blue-border)]/40 space-y-1 shadow-[0_0_10px_rgba(46,111,217,0.1)] h-full cursor-pointer transition-all hover:border-red-500/50 hover:bg-red-500/10">
                          {assignedItem.course.code && (
                            <span className="text-[9px] font-extrabold text-[var(--blue-glow)] block uppercase">
                              {assignedItem.course.code}
                            </span>
                          )}
                          <p className="font-bold text-white text-[11px] truncate">
                            {assignedItem.course.title}
                          </p>
                          {assignedItem.course.doctor?.full_name && (
                            <p className="text-[9px] text-amber-300 truncate">
                              {assignedItem.course.doctor.full_name}
                            </p>
                          )}
                          
                          {/* Remove overlay */}
                          <div 
                            className="absolute inset-2 flex items-center justify-center bg-black/60 backdrop-blur-[1px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            onClick={() => handleCellClick(day, slot, assignedItem)}
                          >
                            <div className="flex flex-col items-center text-red-400">
                              <X className="w-6 h-6 mb-1" />
                              <span className="text-[10px] font-bold">Remove</span>
                            </div>
                          </div>
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

      {/* Course Selection Modal */}
      {isModalOpen && selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="lms-card max-w-md w-full p-6 shadow-[0_0_40px_rgba(46,111,217,0.2)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Select Course</h3>
                <p className="text-xs text-[var(--blue-glow)] font-mono mt-1">
                  {selectedCell.day} • {selectedCell.time}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {courses.length === 0 ? (
                <div className="text-center p-6 border border-dashed border-slate-700 rounded-xl text-slate-400 text-sm">
                  You are not enrolled in any courses yet.
                </div>
              ) : (
                courses.map(c => {
                  // Check if already assigned in this slot (prevent duplicates)
                  const isAssignedHere = schedule.some(s => s.day_of_week === selectedCell.day && s.time_slot === selectedCell.time && s.course_id === c.id)
                  
                  return (
                    <button
                      key={c.id}
                      disabled={isAssignedHere}
                      onClick={() => addScheduleItem(c.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        isAssignedHere 
                          ? 'border-slate-800 bg-slate-900/50 opacity-50 cursor-not-allowed' 
                          : 'border-[var(--blue-border)]/40 bg-[var(--bg-secondary)] hover:border-[var(--blue-glow)] hover:shadow-[0_0_15px_rgba(46,111,217,0.15)]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-[var(--bg-primary)] border border-slate-700 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-[var(--blue-glow)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-white text-sm truncate">{c.title}</h4>
                          {c.code && <Badge variant="blue" className="shrink-0">{c.code}</Badge>}
                        </div>
                        {c.doctor?.full_name && (
                          <p className="text-[10px] text-slate-400 truncate mt-1">
                            {c.doctor.full_name}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
