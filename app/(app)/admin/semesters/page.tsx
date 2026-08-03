'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EnrollmentMode } from '@/types/database.types'
import {
  Clock,
  PlusCircle,
  Edit2,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  BookOpen,
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
  created_at: string
  level?: Level
  courseCount?: number
}

export default function SemestersPage() {
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null)
  const [levelIdInput, setLevelIdInput] = useState('')
  const [nameInput, setNameInput] = useState('Semester 1')
  const [numberInput, setNumberInput] = useState<number>(1)
  const [modeInput, setModeInput] = useState<EnrollmentMode>('Automatic')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    const [levelsRes, semRes, coursesRes] = await Promise.all([
      supabase.from('levels').select('*').order('level_number', { ascending: true }),
      supabase.from('semesters').select('*, level:levels(*)').order('created_at', { ascending: true }),
      supabase.from('courses').select('semester_id'),
    ])

    const fetchedLevels: Level[] = levelsRes.data || []
    const fetchedSemesters: Semester[] = semRes.data || []
    const fetchedCourses = coursesRes.data || []

    const courseCounts = new Map<string, number>()
    fetchedCourses.forEach((c) => {
      if (c.semester_id) {
        courseCounts.set(c.semester_id, (courseCounts.get(c.semester_id) || 0) + 1)
      }
    })

    const formatted = fetchedSemesters.map((s) => ({
      ...s,
      courseCount: courseCounts.get(s.id) || 0,
    }))

    setLevels(fetchedLevels)
    setSemesters(formatted)
    if (fetchedLevels.length > 0 && !levelIdInput) {
      setLevelIdInput(fetchedLevels[0].id)
    }
    setLoading(false)
  }

  const openCreateModal = () => {
    setEditingSemester(null)
    setNameInput('Semester 1')
    setNumberInput(1)
    setModeInput('Automatic')
    if (levels.length > 0) setLevelIdInput(levels[0].id)
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (sem: Semester) => {
    setEditingSemester(sem)
    setNameInput(sem.name)
    setNumberInput(sem.semester_number)
    setModeInput(sem.enrollment_mode)
    setLevelIdInput(sem.level_id)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSaveSemester = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!levelIdInput) {
      setFormError('Please select a target Academic Level')
      return
    }

    setSubmitting(true)
    setFormError(null)

    const payload = {
      level_id: levelIdInput,
      name: nameInput.trim(),
      semester_number: Number(numberInput),
      enrollment_mode: modeInput,
    }

    let err: any = null

    if (editingSemester) {
      const { error } = await supabase.from('semesters').update(payload).eq('id', editingSemester.id)
      err = error
    } else {
      const { error } = await supabase.from('semesters').insert(payload)
      err = error
    }

    setSubmitting(false)

    if (err) {
      setFormError(err.message)
    } else {
      setIsModalOpen(false)
      showToast('success', editingSemester ? 'Semester updated!' : 'Semester created!')
      loadData()
    }
  }

  const handleToggleMode = async (sem: Semester) => {
    const nextMode: EnrollmentMode = sem.enrollment_mode === 'Automatic' ? 'Manual' : 'Automatic'
    const { error } = await supabase
      .from('semesters')
      .update({ enrollment_mode: nextMode })
      .eq('id', sem.id)

    if (error) {
      showToast('error', error.message)
    } else {
      showToast('success', `${sem.level?.name || ''} - ${sem.name} mode switched to ${nextMode}`)
      loadData()
    }
  }

  const handleDeleteSemester = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return
    const { error } = await supabase.from('semesters').delete().eq('id', id)
    if (error) {
      showToast('error', error.message)
    } else {
      showToast('success', `${name} deleted.`)
      loadData()
    }
  }

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg(null), 4000)
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-6 animate-fadeIn">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[var(--blue-glow)] transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admin Console
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide flex items-center gap-2">
              <Clock className="w-8 h-8 text-[var(--blue-glow)]" /> Semester & <span className="glow-heading">Enrollment Engine</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Configure semesters and set enrollment modes (<strong>Automatic</strong> vs <strong>Manual</strong>).
            </p>
          </div>

          <Button onClick={openCreateModal} className="text-xs shrink-0">
            <PlusCircle className="w-4 h-4" /> Create Semester
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

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="lms-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[var(--bg-primary)]/70 backdrop-blur-md text-[var(--blue-glow)] uppercase font-semibold border-b border-[var(--blue-border)]/40">
                  <tr>
                    <th className="p-4">Academic Level</th>
                    <th className="p-4">Semester</th>
                    <th className="p-4 text-center">Enrollment Mode</th>
                    <th className="p-4 text-center">Assigned Courses</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {semesters.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No semesters configured yet. Click "Create Semester" to add one.
                      </td>
                    </tr>
                  ) : (
                    semesters.map((sem) => (
                      <tr key={sem.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4 font-bold text-white">
                          <Badge variant="blue">{sem.level?.name || 'Level'}</Badge>
                        </td>
                        <td className="p-4 font-medium text-slate-200">
                          {sem.name} (Semester {sem.semester_number})
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleMode(sem)}
                            className="inline-flex items-center gap-1.5 focus:outline-none"
                            title="Click to toggle enrollment mode"
                          >
                            {sem.enrollment_mode === 'Automatic' ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 text-xs">
                                <ToggleRight className="w-4 h-4 text-emerald-400" /> Automatic
                              </span>
                            ) : (
                              <span className="text-amber-300 font-semibold flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 text-xs">
                                <ToggleLeft className="w-4 h-4 text-amber-400" /> Manual Selection
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
                            <BookOpen className="w-3.5 h-3.5 text-[var(--blue-glow)]" /> {sem.courseCount || 0} Courses
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(sem)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                              title="Edit Semester"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSemester(sem.id, sem.name)}
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20 transition"
                              title="Delete Semester"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingSemester ? `Edit Semester (${editingSemester.name})` : 'Create Semester'}
        >
          <form onSubmit={handleSaveSemester} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-medium">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Target Academic Level
              </label>
              <select
                value={levelIdInput}
                onChange={(e) => setLevelIdInput(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[var(--blue-border)]"
              >
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} (Level {l.level_number})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Semester Name"
              required
              placeholder="e.g. Semester 1"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Semester Number
                </label>
                <select
                  value={numberInput}
                  onChange={(e) => setNumberInput(Number(e.target.value))}
                  className="w-full bg-[var(--bg-primary)] border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[var(--blue-border)]"
                >
                  <option value={1}>1 - Semester 1</option>
                  <option value={2}>2 - Semester 2</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Enrollment Mode
                </label>
                <select
                  value={modeInput}
                  onChange={(e) => setModeInput(e.target.value as EnrollmentMode)}
                  className="w-full bg-[var(--bg-primary)] border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[var(--blue-border)]"
                >
                  <option value="Automatic">Automatic (Auto-enroll all students)</option>
                  <option value="Manual">Manual (Students choose courses)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
              <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                {editingSemester ? 'Update Semester' : 'Create Semester'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </RoleGuard>
  )
}
