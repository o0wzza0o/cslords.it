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
import { CourseLevel } from '@/types/database.types'
import {
  createCourseAction,
  updateCourseAction,
  deleteCourseAction,
} from '../courseActions'
import {
  BookOpen,
  PlusCircle,
  Edit2,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User,
  Search,
  Check,
  X,
  Calendar,
} from 'lucide-react'
import { CourseContentManager } from '@/components/admin/CourseContentManager'

interface Semester {
  id: string
  name: string
  semester_number: number
  level?: {
    id: string
    name: string
    level_number: number
  }
}

interface Doctor {
  id: string
  full_name: string | null
  email: string
  role: string
}

interface CourseItem {
  id: string
  title: string
  code: string | null
  description: string | null
  image_url: string | null
  thumbnail_url: string | null
  doctor_id: string | null
  semester_id: string | null
  category: string | null
  level: CourseLevel
  is_active: boolean
  has_tutorial?: boolean
  has_lab?: boolean
  created_at: string
  semester?: Semester
  doctor?: Doctor
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [filteredCourses, setFilteredCourses] = useState<CourseItem[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [filterSem, setFilterSem] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null)
  const [titleInput, setTitleInput] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [descriptionInput, setDescriptionInput] = useState('')
  const [semesterIdInput, setSemesterIdInput] = useState('')
  const [doctorIdInput, setDoctorIdInput] = useState('')
  const [categoryInput, setCategoryInput] = useState('Computer Science')
  const [levelInput, setLevelInput] = useState<CourseLevel>('beginner')
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [isActiveInput, setIsActiveInput] = useState(true)
  const [hasTutorialInput, setHasTutorialInput] = useState(false)
  const [hasLabInput, setHasLabInput] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [managingContentCourseId, setManagingContentCourseId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    const [coursesRes, semRes, doctorsRes] = await Promise.all([
      supabase
        .from('courses')
        .select('*, semester:semesters(*, level:levels(*)), doctor:profiles!courses_doctor_id_fkey(id, full_name, email, role)')
        .order('created_at', { ascending: false }),
      supabase.from('semesters').select('*, level:levels(*)').order('created_at', { ascending: true }),
      supabase.from('profiles').select('id, full_name, email, role').in('role', ['teacher', 'admin']),
    ])

    const fetchedCourses: CourseItem[] = (coursesRes.data as any) || []
    const fetchedSemesters: Semester[] = (semRes.data as any) || []
    const fetchedDoctors: Doctor[] = doctorsRes.data || []

    setCourses(fetchedCourses)
    setFilteredCourses(fetchedCourses)
    setSemesters(fetchedSemesters)
    setDoctors(fetchedDoctors)

    if (fetchedSemesters.length > 0 && !semesterIdInput) {
      setSemesterIdInput(fetchedSemesters[0].id)
    }
    setLoading(false)
  }

  // Filter effect
  useEffect(() => {
    let result = courses

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.code && c.code.toLowerCase().includes(q)) ||
          (c.doctor?.full_name && c.doctor.full_name.toLowerCase().includes(q))
      )
    }

    if (filterSem) {
      result = result.filter((c) => c.semester_id === filterSem)
    }

    setFilteredCourses(result)
  }, [search, filterSem, courses])

  const openCreateModal = () => {
    setEditingCourse(null)
    setTitleInput('')
    setCodeInput('')
    setDescriptionInput('')
    setCategoryInput('Computer Science')
    setLevelInput('beginner')
    setImageUrlInput('')
    setIsActiveInput(true)
    setHasTutorialInput(false)
    setHasLabInput(false)
    if (semesters.length > 0) setSemesterIdInput(semesters[0].id)
    if (doctors.length > 0) setDoctorIdInput(doctors[0].id)
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (c: CourseItem) => {
    setEditingCourse(c)
    setTitleInput(c.title)
    setCodeInput(c.code || '')
    setDescriptionInput(c.description || '')
    setCategoryInput(c.category || 'Computer Science')
    setLevelInput(c.level || 'beginner')
    setImageUrlInput(c.image_url || c.thumbnail_url || '')
    setIsActiveInput(c.is_active)
    setHasTutorialInput(!!c.has_tutorial)
    setHasLabInput(!!c.has_lab)
    setSemesterIdInput(c.semester_id || '')
    setDoctorIdInput(c.doctor_id || '')
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titleInput.trim()) {
      setFormError('Course Title is required')
      return
    }

    setSubmitting(true)
    setFormError(null)

    const payload = {
      title: titleInput.trim(),
      code: codeInput.trim() || null,
      description: descriptionInput.trim() || null,
      semester_id: semesterIdInput || null,
      doctor_id: doctorIdInput || null,
      teacher_id: doctorIdInput || null,
      category: categoryInput.trim() || null,
      level: levelInput,
      image_url: imageUrlInput.trim() || null,
      thumbnail_url: imageUrlInput.trim() || null,
      is_active: isActiveInput,
      has_tutorial: hasTutorialInput,
      has_lab: hasLabInput,
    }

    try {
      if (editingCourse) {
        await updateCourseAction(editingCourse.id, payload)
      } else {
        await createCourseAction(payload)
      }
      setIsModalOpen(false)
      showToast('success', editingCourse ? 'Course updated successfully!' : 'Course published successfully!')
      loadData()
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCourse = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete course "${title}"?`)) return
    try {
      await deleteCourseAction(id)
      showToast('success', `Course "${title}" deleted.`)
      loadData()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete course.')
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
              <BookOpen className="w-8 h-8 text-[var(--blue-glow)]" /> Course <span className="glow-heading">Management</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Create and manage academic courses, assign course codes, semesters, and course doctors.
            </p>
          </div>

          <Button onClick={openCreateModal} className="text-xs shrink-0">
            <PlusCircle className="w-4 h-4" /> Create Course
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

        {/* Filters Bar */}
        <div className="lms-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, code, doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--bg-primary)]/40 backdrop-blur-md border border-[var(--blue-border)]/40 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-[var(--text-secondary)]/60 focus:outline-none focus:border-[var(--blue-border)]"
            />
          </div>

          <select
            value={filterSem}
            onChange={(e) => setFilterSem(e.target.value)}
            className="w-full md:w-auto bg-[var(--bg-primary)]/40 backdrop-blur-md border border-[var(--blue-border)]/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--blue-border)]"
          >
            <option value="" className="bg-[var(--bg-secondary)]">All Semesters</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id} className="bg-[var(--bg-secondary)]">
                {s.level?.name || 'Level'} - {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Courses Table */}
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="lms-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[var(--bg-primary)]/70 backdrop-blur-md text-[var(--blue-glow)] uppercase font-semibold border-b border-[var(--blue-border)]/40">
                  <tr>
                    <th className="p-4">Code</th>
                    <th className="p-4">Title & Category</th>
                    <th className="p-4">Level & Semester</th>
                    <th className="p-4">Assigned Doctor</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No courses found. Click "Create Course" to add one.
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4 font-mono font-bold text-white">
                          {c.code ? <Badge variant="blue">{c.code}</Badge> : '—'}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-white text-sm">{c.title}</p>
                          <p className="text-[10px] text-slate-400">{c.category || 'General CS'}</p>
                          <div className="flex gap-1.5 mt-1">
                            {c.has_tutorial && (
                              <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                                Tutorial (🎓)
                              </span>
                            )}
                            {c.has_lab && (
                              <span className="text-[9px] font-bold text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">
                                Lab (💻)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-slate-200">
                            {c.semester?.level?.name || 'Unassigned'}
                          </p>
                          <p className="text-[10px] text-slate-400">{c.semester?.name || 'No Semester'}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 font-medium text-slate-200">
                            <User className="w-3.5 h-3.5 text-amber-400" />
                            {c.doctor?.full_name || 'Dr. Unassigned'}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {c.is_active ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 text-[10px] font-bold">
                              <Check className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 text-[10px] font-bold">
                              <X className="w-3 h-3" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setManagingContentCourseId(c.id)}
                              className="p-1.5 rounded-lg text-[var(--blue-glow)] hover:text-white hover:bg-[var(--blue-glow)]/20 transition"
                              title="Manage Content"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(c)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                              title="Edit Course"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(c.id, c.title)}
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20 transition"
                              title="Delete Course"
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
          title={editingCourse ? `Edit Course (${editingCourse.title})` : 'Create New Course'}
        >
          <form onSubmit={handleSaveCourse} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {formError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-medium">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Input
                  label="Course Title"
                  required
                  placeholder="e.g. Data Structures & Algorithms"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                />
              </div>

              <Input
                label="Course Code"
                placeholder="e.g. CS201"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Detailed summary of course objectives..."
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-slate-700/80 rounded-lg p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[var(--blue-border)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Target Semester & Level
                </label>
                <select
                  value={semesterIdInput}
                  onChange={(e) => setSemesterIdInput(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[var(--blue-border)]"
                >
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.level?.name || 'Level'} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Assign Doctor / Teacher
                </label>
                <select
                  value={doctorIdInput}
                  onChange={(e) => setDoctorIdInput(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[var(--blue-border)]"
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name || d.email} ({d.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Category"
                placeholder="e.g. Computer Science"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Difficulty Level
                </label>
                <select
                  value={levelInput}
                  onChange={(e) => setLevelInput(e.target.value as CourseLevel)}
                  className="w-full bg-[var(--bg-primary)] border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[var(--blue-border)]"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <Input
              label="Image URL (Optional)"
              placeholder="https://images.unsplash.com/..."
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
            />

            <div className="p-3.5 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--blue-border)]/40 space-y-2">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Course Components</p>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasTutorialInput}
                    onChange={(e) => setHasTutorialInput(e.target.checked)}
                    className="w-4 h-4 accent-[var(--blue-glow)]"
                  />
                  <span className="text-xs text-slate-200">Has Tutorial (🎓)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasLabInput}
                    onChange={(e) => setHasLabInput(e.target.checked)}
                    className="w-4 h-4 accent-[var(--blue-glow)]"
                  />
                  <span className="text-xs text-slate-200">Has Lab (💻)</span>
                </label>
              </div>
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[var(--bg-primary)]/40 border border-[var(--blue-border)]/40 cursor-pointer">
              <input
                type="checkbox"
                checked={isActiveInput}
                onChange={(e) => setIsActiveInput(e.target.checked)}
                className="w-4 h-4 accent-[var(--red-action)]"
              />
              <span className="text-xs font-semibold text-white">Course Active & Visible</span>
            </label>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
              <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                {editingCourse ? 'Update Course' : 'Publish Course'}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={!!managingContentCourseId}
          onClose={() => setManagingContentCourseId(null)}
          title="Manage Course Content"
          maxWidth="max-w-4xl"
        >
          {managingContentCourseId && <CourseContentManager courseId={managingContentCourseId} />}
        </Modal>
      </div>
    </RoleGuard>
  )
}
