'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Calendar,
  PlusCircle,
  Edit2,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  GripVertical
} from 'lucide-react'

interface CourseWeek {
  id: string
  course_id: string
  title: string
  start_date: string | null
  end_date: string | null
  order_index: number
  is_active: boolean
}

export default function AdminCourseWeeksPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const router = useRouter()
  const supabase = createClient()

  const [course, setCourse] = useState<any>(null)
  const [weeks, setWeeks] = useState<CourseWeek[]>([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWeek, setEditingWeek] = useState<CourseWeek | null>(null)
  const [titleInput, setTitleInput] = useState('')
  const [startDateInput, setStartDateInput] = useState('')
  const [endDateInput, setEndDateInput] = useState('')
  const [isActiveInput, setIsActiveInput] = useState(true)
  
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [courseId])

  async function loadData() {
    setLoading(true)

    // Load Course info
    const { data: courseData } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single()

    if (courseData) setCourse(courseData)

    // Load Weeks
    const { data: weeksData } = await supabase
      .from('course_weeks')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })

    if (weeksData) setWeeks(weeksData as CourseWeek[])
    
    setLoading(false)
  }

  const openCreateModal = () => {
    setEditingWeek(null)
    setTitleInput(`Week ${weeks.length + 1}`)
    setStartDateInput('')
    setEndDateInput('')
    setIsActiveInput(true)
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (w: CourseWeek) => {
    setEditingWeek(w)
    setTitleInput(w.title)
    setStartDateInput(w.start_date || '')
    setEndDateInput(w.end_date || '')
    setIsActiveInput(w.is_active)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSaveWeek = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titleInput.trim()) {
      setFormError('Week Title is required')
      return
    }

    setSubmitting(true)
    setFormError(null)

    const payload = {
      course_id: courseId,
      title: titleInput.trim(),
      start_date: startDateInput || null,
      end_date: endDateInput || null,
      is_active: isActiveInput,
      order_index: editingWeek ? editingWeek.order_index : weeks.length,
    }

    let err: any = null

    if (editingWeek) {
      const { error } = await supabase.from('course_weeks').update(payload).eq('id', editingWeek.id)
      err = error
    } else {
      const { error } = await supabase.from('course_weeks').insert(payload)
      err = error
    }

    setSubmitting(false)

    if (err) {
      setFormError(err.message)
    } else {
      setIsModalOpen(false)
      showToast('success', editingWeek ? 'Week updated successfully!' : 'Week created successfully!')
      loadData()
    }
  }

  const handleDeleteWeek = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will also unassign any associated lessons and assignments.`)) return
    
    const { error } = await supabase.from('course_weeks').delete().eq('id', id)
    if (error) {
      showToast('error', error.message)
    } else {
      showToast('success', `Week "${title}" deleted.`)
      loadData()
    }
  }

  const moveWeek = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === weeks.length - 1) return

    const newWeeks = [...weeks]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    // Swap order_index
    const temp = newWeeks[index].order_index
    newWeeks[index].order_index = newWeeks[targetIndex].order_index
    newWeeks[targetIndex].order_index = temp

    // Optimistic update
    newWeeks.sort((a, b) => a.order_index - b.order_index)
    setWeeks(newWeeks)

    // DB updates
    await Promise.all([
      supabase.from('course_weeks').update({ order_index: newWeeks[index].order_index }).eq('id', newWeeks[index].id),
      supabase.from('course_weeks').update({ order_index: newWeeks[targetIndex].order_index }).eq('id', newWeeks[targetIndex].id)
    ])
  }

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg(null), 4000)
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-6 animate-fadeIn">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[var(--blue-glow)] transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide flex items-center gap-2">
              <Calendar className="w-8 h-8 text-[var(--blue-glow)]" /> Manage <span className="glow-heading">Weeks</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Organize content for: <span className="font-bold text-white">{course?.title || 'Loading...'}</span>
            </p>
          </div>

          <Button onClick={openCreateModal} className="text-xs shrink-0">
            <PlusCircle className="w-4 h-4" /> Add Week
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

        {/* Weeks List */}
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="space-y-3">
            {weeks.length === 0 ? (
              <div className="lms-card p-12 text-center text-slate-400 text-xs">
                No weeks have been created for this course yet.
              </div>
            ) : (
              weeks.map((w, idx) => (
                <div key={w.id} className="lms-card p-4 flex items-center justify-between group hover:border-[var(--blue-border)] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-1 opacity-40 group-hover:opacity-100 transition">
                      <button onClick={() => moveWeek(idx, 'up')} disabled={idx === 0} className="hover:text-white disabled:opacity-30">
                        <ArrowLeft className="w-3 h-3 rotate-90" />
                      </button>
                      <button onClick={() => moveWeek(idx, 'down')} disabled={idx === weeks.length - 1} className="hover:text-white disabled:opacity-30">
                        <ArrowLeft className="w-3 h-3 -rotate-90" />
                      </button>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        {w.title}
                        {!w.is_active && <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30">Inactive</span>}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[var(--blue-icon)]" />
                        {w.start_date ? new Date(w.start_date).toLocaleDateString() : 'No start date'} - {w.end_date ? new Date(w.end_date).toLocaleDateString() : 'No end date'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(w)}
                      className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                      title="Edit Week"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteWeek(w.id, w.title)}
                      className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20 transition"
                      title="Delete Week"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingWeek ? `Edit Week (${editingWeek.title})` : 'Create New Week'}
        >
          <form onSubmit={handleSaveWeek} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-medium">
                {formError}
              </div>
            )}

            <Input
              label="Week Title"
              required
              placeholder="e.g. Week 1: Introduction"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={startDateInput}
                onChange={(e) => setStartDateInput(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={endDateInput}
                onChange={(e) => setEndDateInput(e.target.value)}
              />
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[var(--bg-primary)]/40 border border-[var(--blue-border)]/40 cursor-pointer">
              <input
                type="checkbox"
                checked={isActiveInput}
                onChange={(e) => setIsActiveInput(e.target.checked)}
                className="w-4 h-4 accent-[var(--red-action)]"
              />
              <span className="text-xs font-semibold text-white">Week is Visible</span>
            </label>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
              <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                {editingWeek ? 'Update Week' : 'Create Week'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </RoleGuard>
  )
}
