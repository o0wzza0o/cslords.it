'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import {
  createWeekAction,
  updateWeekAction,
  deleteWeekAction,
  reorderWeeksAction,
  createLessonAction,
  updateLessonAction,
  deleteLessonAction,
  createAssignmentAction,
  updateAssignmentAction,
  deleteAssignmentAction,
} from '@/app/(app)/admin/contentActions'
import {
  Calendar,
  PlusCircle,
  Edit2,
  Trash2,
  ArrowLeft,
  BookOpen,
  FileCheck,
  Check,
  X,
  Clock,
  Video,
  GraduationCap,
  Laptop
} from 'lucide-react'

interface CourseContentManagerProps {
  courseId: string
}

export function CourseContentManager({ courseId }: CourseContentManagerProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

  const [course, setCourse] = useState<any>(null)
  const [weeks, setWeeks] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])

  // UI State
  const [expandedWeekId, setExpandedWeekId] = useState<string | null>(null)

  // Week Modal
  const [isWeekModalOpen, setIsWeekModalOpen] = useState(false)
  const [editingWeek, setEditingWeek] = useState<any>(null)
  const [weekTitle, setWeekTitle] = useState('')
  const [weekStart, setWeekStart] = useState('')
  const [weekEnd, setWeekEnd] = useState('')
  const [weekActive, setWeekActive] = useState(true)

  // Lesson Modal
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<any>(null)
  const [lessonWeekId, setLessonWeekId] = useState('')
  const [lessonComponentType, setLessonComponentType] = useState<'lecture' | 'tutorial' | 'lab'>('lecture')
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonDesc, setLessonDesc] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [lessonVideo, setLessonVideo] = useState('')

  // Assignment Modal
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<any>(null)
  const [assignmentWeekId, setAssignmentWeekId] = useState('')
  const [assignmentComponentType, setAssignmentComponentType] = useState<'lecture' | 'tutorial' | 'lab'>('lecture')
  const [assignmentTitle, setAssignmentTitle] = useState('')
  const [assignmentDesc, setAssignmentDesc] = useState('')
  const [assignmentDue, setAssignmentDue] = useState('')
  const [assignmentScore, setAssignmentScore] = useState(100)

  const [submitting, setSubmitting] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (courseId) loadData()
  }, [courseId])

  async function loadData() {
    setLoading(true)
    
    // Course info with tutorial/lab settings
    const { data: cData } = await supabase
      .from('courses')
      .select('id, title, has_tutorial, has_lab')
      .eq('id', courseId)
      .single()
    if (cData) setCourse(cData)

    // Weeks
    const { data: wData } = await supabase
      .from('course_weeks')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })
    if (wData) {
      setWeeks(wData)
      if (wData.length > 0 && !expandedWeekId) setExpandedWeekId(wData[0].id)
    }

    // Lessons
    const { data: lData } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })
    if (lData) setLessons(lData)

    // Assignments
    const { data: aData } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', courseId)
      .order('due_date', { ascending: true })
    if (aData) setAssignments(aData)

    setLoading(false)
  }

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg(null), 3000)
  }

  // ---- WEEK ACTIONS ----
  const openWeekModal = (week?: any) => {
    setEditingWeek(week || null)
    setWeekTitle(week ? week.title : `Week ${weeks.length + 1}`)
    setWeekStart(week?.start_date || '')
    setWeekEnd(week?.end_date || '')
    setWeekActive(week ? week.is_active : true)
    setIsWeekModalOpen(true)
  }

  const saveWeek = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const payload = {
      course_id: courseId,
      title: weekTitle,
      start_date: weekStart || null,
      end_date: weekEnd || null,
      is_active: weekActive,
      order_index: editingWeek ? editingWeek.order_index : weeks.length,
    }

    try {
      if (editingWeek) {
        await updateWeekAction(editingWeek.id, payload)
      } else {
        await createWeekAction(payload)
      }
      showToast('success', editingWeek ? 'Week updated' : 'Week created')
      setIsWeekModalOpen(false)
      loadData()
    } catch (err: any) {
      showToast('error', err.message || 'Operation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteWeek = async (id: string) => {
    if (!confirm('Delete this week? This will unassign its lessons and assignments.')) return
    try {
      await deleteWeekAction(id)
      showToast('success', 'Week deleted')
      loadData()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete week')
    }
  }

  const moveWeek = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === weeks.length - 1) return

    const newWeeks = [...weeks]
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    const temp = newWeeks[index].order_index
    newWeeks[index].order_index = newWeeks[targetIdx].order_index
    newWeeks[targetIdx].order_index = temp

    newWeeks.sort((a, b) => a.order_index - b.order_index)
    setWeeks(newWeeks)

    try {
      await reorderWeeksAction(
        newWeeks[index].id, newWeeks[index].order_index,
        newWeeks[targetIdx].id, newWeeks[targetIdx].order_index,
      )
    } catch {
      loadData()
    }
  }

  // ---- LESSON ACTIONS ----
  const openLessonModal = (lesson?: any, defaultWeekId?: string, defaultType: 'lecture' | 'tutorial' | 'lab' = 'lecture') => {
    setEditingLesson(lesson || null)
    setLessonWeekId(lesson?.week_id || defaultWeekId || (weeks.length > 0 ? weeks[0].id : ''))
    setLessonComponentType((lesson?.component_type as any) || defaultType || 'lecture')
    setLessonTitle(lesson?.title || '')
    setLessonDesc(lesson?.description || '')
    setLessonContent(lesson?.content || '')
    setLessonVideo(lesson?.video_url || '')
    setIsLessonModalOpen(true)
  }

  const saveLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    if (lessonComponentType === 'tutorial' && !course?.has_tutorial) {
      showToast('error', 'Tutorial is disabled for this course.')
      setSubmitting(false)
      return
    }
    if (lessonComponentType === 'lab' && !course?.has_lab) {
      showToast('error', 'Lab is disabled for this course.')
      setSubmitting(false)
      return
    }

    const payload = {
      course_id: courseId,
      week_id: lessonWeekId || null,
      component_type: lessonComponentType,
      title: lessonTitle,
      description: lessonDesc,
      content: lessonContent,
      video_url: lessonVideo,
      order_index: editingLesson ? editingLesson.order_index : lessons.length,
    }

    try {
      if (editingLesson) {
        await updateLessonAction(editingLesson.id, payload)
      } else {
        await createLessonAction(payload)
      }
      showToast('success', editingLesson ? 'Lesson updated' : 'Lesson created')
      setIsLessonModalOpen(false)
      loadData()
    } catch (err: any) {
      showToast('error', err.message || 'Operation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteLesson = async (id: string) => {
    if (!confirm('Delete this lesson?')) return
    try {
      await deleteLessonAction(id)
      showToast('success', 'Lesson deleted')
      loadData()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete lesson')
    }
  }

  // ---- ASSIGNMENT ACTIONS ----
  const openAssignmentModal = (assignment?: any, defaultWeekId?: string, defaultType: 'lecture' | 'tutorial' | 'lab' = 'lecture') => {
    setEditingAssignment(assignment || null)
    setAssignmentWeekId(assignment?.week_id || defaultWeekId || (weeks.length > 0 ? weeks[0].id : ''))
    setAssignmentComponentType((assignment?.component_type as any) || defaultType || 'lecture')
    setAssignmentTitle(assignment?.title || '')
    setAssignmentDesc(assignment?.description || '')
    setAssignmentDue(assignment?.due_date ? new Date(assignment?.due_date).toISOString().split('T')[0] : '')
    setAssignmentScore(assignment?.max_score || 100)
    setIsAssignmentModalOpen(true)
  }

  const saveAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    if (assignmentComponentType === 'tutorial' && !course?.has_tutorial) {
      showToast('error', 'Tutorial is disabled for this course.')
      setSubmitting(false)
      return
    }
    if (assignmentComponentType === 'lab' && !course?.has_lab) {
      showToast('error', 'Lab is disabled for this course.')
      setSubmitting(false)
      return
    }

    const payload = {
      course_id: courseId,
      week_id: assignmentWeekId || null,
      component_type: assignmentComponentType,
      title: assignmentTitle,
      description: assignmentDesc,
      due_date: assignmentDue ? new Date(assignmentDue).toISOString() : null,
      max_score: assignmentScore,
    }

    try {
      if (editingAssignment) {
        await updateAssignmentAction(editingAssignment.id, payload)
      } else {
        await createAssignmentAction(payload)
      }
      showToast('success', editingAssignment ? 'Assignment updated' : 'Assignment created')
      setIsAssignmentModalOpen(false)
      loadData()
    } catch (err: any) {
      showToast('error', err.message || 'Operation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteAssignment = async (id: string) => {
    if (!confirm('Delete this assignment?')) return
    try {
      await deleteAssignmentAction(id)
      showToast('success', 'Assignment deleted')
      loadData()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete assignment')
    }
  }

  if (loading) return <Skeleton className="h-96 w-full rounded-xl" />

  return (
    <div className="flex flex-col h-full space-y-4">
      {toastMsg && (
        <div className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
          toastMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-red-500/10 border-red-500/40 text-red-400'
        }`}>
          {toastMsg.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toastMsg.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700/80 pb-4 gap-2">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--blue-glow)]" /> Content Manager
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Editing curriculum for <span className="font-semibold text-white">{course?.title}</span>
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="blue">Lectures Enabled</Badge>
            {course?.has_tutorial ? (
              <Badge variant="blue">Tutorial Enabled (🎓)</Badge>
            ) : (
              <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                Tutorial Disabled
              </span>
            )}
            {course?.has_lab ? (
              <Badge variant="blue">Lab Enabled (💻)</Badge>
            ) : (
              <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                Lab Disabled
              </span>
            )}
          </div>
        </div>
        <Button onClick={() => openWeekModal()} className="text-xs shrink-0">
          <PlusCircle className="w-4 h-4" /> Add Week
        </Button>
      </div>

      {weeks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-700 rounded-xl bg-[var(--bg-primary)]/40">
          <Calendar className="w-12 h-12 text-slate-500 mb-3" />
          <p className="text-slate-300 font-semibold">No Weeks Created</p>
          <p className="text-xs text-slate-500 mt-1 mb-4 max-w-md">Create your first week to start organizing lessons and assignments chronologically.</p>
          <Button variant="secondary" onClick={() => openWeekModal()}>Create First Week</Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {weeks.map((week, idx) => {
            const weekLessons = lessons.filter(l => l.week_id === week.id)
            const weekAssignments = assignments.filter(a => a.week_id === week.id)

            // Categorize by component type
            const lectureLessons = weekLessons.filter(l => !l.component_type || l.component_type === 'lecture')
            const tutorialLessons = weekLessons.filter(l => l.component_type === 'tutorial')
            const labLessons = weekLessons.filter(l => l.component_type === 'lab')

            const lectureAssignments = weekAssignments.filter(a => !a.component_type || a.component_type === 'lecture')
            const tutorialAssignments = weekAssignments.filter(a => a.component_type === 'tutorial')
            const labAssignments = weekAssignments.filter(a => a.component_type === 'lab')

            const isExpanded = expandedWeekId === week.id

            return (
              <div key={week.id} className={`lms-card rounded-xl border transition-all ${isExpanded ? 'border-[var(--blue-border)] shadow-[0_0_15px_rgba(46,111,217,0.1)]' : 'border-slate-800'}`}>
                {/* Week Header */}
                <div 
                  className="p-4 cursor-pointer flex items-center justify-between bg-slate-800/20 hover:bg-slate-800/40 transition"
                  onClick={() => setExpandedWeekId(isExpanded ? null : week.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-1 opacity-30 hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => moveWeek(idx, 'up')} disabled={idx === 0} className="hover:text-white disabled:opacity-30"><ArrowLeft className="w-3 h-3 rotate-90" /></button>
                      <button onClick={() => moveWeek(idx, 'down')} disabled={idx === weeks.length - 1} className="hover:text-white disabled:opacity-30"><ArrowLeft className="w-3 h-3 -rotate-90" /></button>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        {week.title}
                        {!week.is_active && <span className="text-[9px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30">HIDDEN</span>}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[var(--blue-icon)]" />
                        {week.start_date ? new Date(week.start_date).toLocaleDateString() : 'N/A'} - {week.end_date ? new Date(week.end_date).toLocaleDateString() : 'N/A'}
                        <span className="mx-2 text-slate-600">•</span>
                        <span>{weekLessons.length} Lessons</span>
                        <span className="mx-2 text-slate-600">•</span>
                        <span>{weekAssignments.length} Assignments</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openWeekModal(week)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteWeek(week.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-800 bg-[var(--bg-primary)]/20 space-y-6">
                    {/* 1. LECTURES / MAIN LESSONS SECTION */}
                    <div className="space-y-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-[var(--blue-glow)]" /> Lectures / Main Content
                        </h4>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openLessonModal(null, week.id, 'lecture')} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded flex items-center gap-1 transition">
                            <PlusCircle className="w-3 h-3 text-[var(--blue-glow)]" /> Add Lesson
                          </button>
                          <button onClick={() => openAssignmentModal(null, week.id, 'lecture')} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded flex items-center gap-1 transition">
                            <PlusCircle className="w-3 h-3 text-[#9180ff]" /> Add Assignment
                          </button>
                        </div>
                      </div>

                      {/* Lectures Lessons */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Lessons ({lectureLessons.length})</p>
                        {lectureLessons.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic pl-1">No lecture lessons.</p>
                        ) : (
                          lectureLessons.map(lesson => (
                            <div key={lesson.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-800/40 hover:border-slate-600 transition">
                              <div>
                                <p className="text-sm font-semibold text-white">{lesson.title}</p>
                                <p className="text-[10px] text-slate-400 line-clamp-1">{lesson.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => openLessonModal(lesson)} className="p-1 text-slate-400 hover:text-white transition"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => deleteLesson(lesson.id)} className="p-1 text-slate-400 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Lectures Assignments */}
                      <div className="space-y-2 pt-2 border-t border-slate-800/60">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Assignments ({lectureAssignments.length})</p>
                        {lectureAssignments.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic pl-1">No lecture assignments.</p>
                        ) : (
                          lectureAssignments.map(assignment => (
                            <div key={assignment.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-800/40 hover:border-slate-600 transition">
                              <div>
                                <p className="text-sm font-semibold text-white">{assignment.title}</p>
                                <p className="text-[10px] text-[var(--cyan-glow)] flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => openAssignmentModal(assignment)} className="p-1 text-slate-400 hover:text-white transition"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => deleteAssignment(assignment.id)} className="p-1 text-slate-400 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 2. TUTORIAL SECTION (Only if enabled) */}
                    {course?.has_tutorial && (
                      <div className="space-y-4 bg-amber-500/5 p-4 rounded-xl border border-amber-500/30">
                        <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                            <GraduationCap className="w-4 h-4 text-amber-400" /> Tutorial Component
                          </h4>
                          <div className="flex items-center gap-2">
                            <button onClick={() => openLessonModal(null, week.id, 'tutorial')} className="text-[10px] bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-200 px-2 py-1 rounded flex items-center gap-1 transition">
                              <PlusCircle className="w-3 h-3" /> Add Tutorial Lesson
                            </button>
                            <button onClick={() => openAssignmentModal(null, week.id, 'tutorial')} className="text-[10px] bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-200 px-2 py-1 rounded flex items-center gap-1 transition">
                              <PlusCircle className="w-3 h-3" /> Add Tutorial Assignment
                            </button>
                          </div>
                        </div>

                        {/* Tutorial Lessons */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold text-amber-400/80 uppercase tracking-wider">Tutorial Lessons ({tutorialLessons.length})</p>
                          {tutorialLessons.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic pl-1">No tutorial lessons.</p>
                          ) : (
                            tutorialLessons.map(lesson => (
                              <div key={lesson.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-amber-500/40 transition">
                                <div>
                                  <p className="text-sm font-semibold text-white">{lesson.title}</p>
                                  <p className="text-[10px] text-slate-400 line-clamp-1">{lesson.description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => openLessonModal(lesson)} className="p-1 text-slate-400 hover:text-white transition"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => deleteLesson(lesson.id)} className="p-1 text-slate-400 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Tutorial Assignments */}
                        <div className="space-y-2 pt-2 border-t border-amber-500/20">
                          <p className="text-[10px] font-semibold text-amber-400/80 uppercase tracking-wider">Tutorial Assignments ({tutorialAssignments.length})</p>
                          {tutorialAssignments.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic pl-1">No tutorial assignments.</p>
                          ) : (
                            tutorialAssignments.map(assignment => (
                              <div key={assignment.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-amber-500/40 transition">
                                <div>
                                  <p className="text-sm font-semibold text-white">{assignment.title}</p>
                                  <p className="text-[10px] text-amber-300 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => openAssignmentModal(assignment)} className="p-1 text-slate-400 hover:text-white transition"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => deleteAssignment(assignment.id)} className="p-1 text-slate-400 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* 3. LAB SECTION (Only if enabled) */}
                    {course?.has_lab && (
                      <div className="space-y-4 bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/30">
                        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                            <Laptop className="w-4 h-4 text-cyan-400" /> Lab Component
                          </h4>
                          <div className="flex items-center gap-2">
                            <button onClick={() => openLessonModal(null, week.id, 'lab')} className="text-[10px] bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500/30 text-cyan-200 px-2 py-1 rounded flex items-center gap-1 transition">
                              <PlusCircle className="w-3 h-3" /> Add Lab Lesson
                            </button>
                            <button onClick={() => openAssignmentModal(null, week.id, 'lab')} className="text-[10px] bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500/30 text-cyan-200 px-2 py-1 rounded flex items-center gap-1 transition">
                              <PlusCircle className="w-3 h-3" /> Add Lab Assignment
                            </button>
                          </div>
                        </div>

                        {/* Lab Lessons */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold text-cyan-400/80 uppercase tracking-wider">Lab Lessons ({labLessons.length})</p>
                          {labLessons.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic pl-1">No lab lessons.</p>
                          ) : (
                            labLessons.map(lesson => (
                              <div key={lesson.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 transition">
                                <div>
                                  <p className="text-sm font-semibold text-white">{lesson.title}</p>
                                  <p className="text-[10px] text-slate-400 line-clamp-1">{lesson.description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => openLessonModal(lesson)} className="p-1 text-slate-400 hover:text-white transition"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => deleteLesson(lesson.id)} className="p-1 text-slate-400 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Lab Assignments */}
                        <div className="space-y-2 pt-2 border-t border-cyan-500/20">
                          <p className="text-[10px] font-semibold text-cyan-400/80 uppercase tracking-wider">Lab Assignments ({labAssignments.length})</p>
                          {labAssignments.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic pl-1">No lab assignments.</p>
                          ) : (
                            labAssignments.map(assignment => (
                              <div key={assignment.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 transition">
                                <div>
                                  <p className="text-sm font-semibold text-white">{assignment.title}</p>
                                  <p className="text-[10px] text-cyan-300 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => openAssignmentModal(assignment)} className="p-1 text-slate-400 hover:text-white transition"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => deleteAssignment(assignment.id)} className="p-1 text-slate-400 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Week Modal */}
      <Modal isOpen={isWeekModalOpen} onClose={() => setIsWeekModalOpen(false)} title={editingWeek ? 'Edit Week' : 'Add Week'}>
        <form onSubmit={saveWeek} className="space-y-4">
          <Input label="Week Title" required value={weekTitle} onChange={e => setWeekTitle(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} />
            <Input label="End Date" type="date" value={weekEnd} onChange={e => setWeekEnd(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-xs text-white"><input type="checkbox" checked={weekActive} onChange={e => setWeekActive(e.target.checked)} className="accent-[var(--red-action)]" /> Visible to Students</label>
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" type="button" onClick={() => setIsWeekModalOpen(false)}>Cancel</Button><Button type="submit" isLoading={submitting}>Save</Button></div>
        </form>
      </Modal>

      {/* Lesson Modal */}
      <Modal isOpen={isLessonModalOpen} onClose={() => setIsLessonModalOpen(false)} title={editingLesson ? 'Edit Lesson' : 'Add Lesson'}>
        <form onSubmit={saveLesson} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Target Week</label>
            <select value={lessonWeekId} onChange={e => setLessonWeekId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white">
              <option value="">-- No Week --</option>
              {weeks.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
            </select>
          </div>

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

          <Input label="Lesson Title" required value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} />
          <Input label="Short Description" value={lessonDesc} onChange={e => setLessonDesc(e.target.value)} />
          <div><label className="block text-xs font-semibold text-slate-400 mb-1">Content (Markdown)</label><textarea rows={4} value={lessonContent} onChange={e => setLessonContent(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white" /></div>
          <Input label="Video URL" value={lessonVideo} onChange={e => setLessonVideo(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" type="button" onClick={() => setIsLessonModalOpen(false)}>Cancel</Button><Button type="submit" isLoading={submitting}>Save</Button></div>
        </form>
      </Modal>

      {/* Assignment Modal */}
      <Modal isOpen={isAssignmentModalOpen} onClose={() => setIsAssignmentModalOpen(false)} title={editingAssignment ? 'Edit Assignment' : 'Add Assignment'}>
        <form onSubmit={saveAssignment} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Target Week</label>
            <select value={assignmentWeekId} onChange={e => setAssignmentWeekId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white">
              <option value="">-- No Week --</option>
              {weeks.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
            </select>
          </div>

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

          <Input label="Assignment Title" required value={assignmentTitle} onChange={e => setAssignmentTitle(e.target.value)} />
          <div><label className="block text-xs font-semibold text-slate-400 mb-1">Instructions</label><textarea rows={3} value={assignmentDesc} onChange={e => setAssignmentDesc(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white" /></div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Due Date" type="date" value={assignmentDue} onChange={e => setAssignmentDue(e.target.value)} />
            <Input label="Max Score" type="number" value={assignmentScore} onChange={e => setAssignmentScore(Number(e.target.value))} />
          </div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" type="button" onClick={() => setIsAssignmentModalOpen(false)}>Cancel</Button><Button type="submit" isLoading={submitting}>Save</Button></div>
        </form>
      </Modal>
    </div>
  )
}
