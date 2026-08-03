'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CourseGrid } from '@/components/courses/CourseGrid'
import { CourseFilters } from '@/components/courses/CourseFilters'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CourseLevel, UserRole } from '@/types/database.types'
import { PlusCircle, BookOpen } from 'lucide-react'

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [filteredCourses, setFilteredCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [level, setLevel] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [role, setRole] = useState<UserRole>('student')
  const [userId, setUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{
    role: UserRole
    department: string | null
    academic_year: number | null
    semester: number | null
  } | null>(null)

  // Create Course Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newLevel, setNewLevel] = useState<CourseLevel>('beginner')
  const [newDepartment, setNewDepartment] = useState('Computer Science')
  const [newAcademicYear, setNewAcademicYear] = useState<number>(1)
  const [newSemester, setNewSemester] = useState<number>(1)
  const [newThumbnailUrl, setNewThumbnailUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadCourses()
  }, [])

  async function loadCourses() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    let currentProfile: any = null

    if (user) {
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, department, academic_year, semester, level_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        setRole(profile.role)
        setUserProfile(profile)
        currentProfile = profile
      }
    }

    // Determine enrolled course IDs from student_courses first
    let enrolledCourseIds: string[] = []
    if (user) {
      const { data: scRows } = await supabase
        .from('student_courses')
        .select('course_id')
        .eq('student_id', user.id)

      enrolledCourseIds = (scRows || []).map((r: any) => r.course_id)
    }

    if (currentProfile?.role === 'student' || enrolledCourseIds.length > 0) {
      // === STUDENT PATH ===
      // Fetch ONLY courses the user is enrolled in via student_courses.
      // These courses are already filtered to the student's correct level & semester
      // because enrollment is seeded/saved only from courses belonging to the
      // student's level → semester → courses chain.

      if (enrolledCourseIds.length === 0) {
        // Enrolled in nothing yet — show empty state
        setCourses([])
        setFilteredCourses([])
        setCategories([])
        setLoading(false)
        return
      }

      const { data: coursesData } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          category,
          level,
          created_at,
          code,
          semester_id,
          is_active,
          teacher:profiles!courses_teacher_id_fkey(full_name),
          doctor:profiles!courses_doctor_id_fkey(full_name)
        `)
        .in('id', enrolledCourseIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      const enrolled = (coursesData || []).map((c: any) => ({
        ...c,
        enrolled: true,
        progress: 0,
      }))

      setCourses(enrolled)
      setFilteredCourses(enrolled)

      const cats = Array.from(
        new Set(enrolled.map((c: any) => c.category).filter(Boolean))
      ) as string[]
      setCategories(cats)
    } else {
      // === ADMIN / TEACHER PATH (no student enrollments) ===
      // Full catalog view — all courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          category,
          level,
          department,
          academic_year,
          semester,
          created_at,
          teacher:profiles!courses_teacher_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })

      const visibleCourses = (coursesData || []).map((c: any) => ({
        ...c,
        enrolled: false,
        progress: undefined,
      }))

      setCourses(visibleCourses)
      setFilteredCourses(visibleCourses)

      const cats = Array.from(
        new Set(visibleCourses.map((c: any) => c.category).filter(Boolean))
      ) as string[]
      setCategories(cats)
    }

    setLoading(false)
  }



  useEffect(() => {
    let result = courses

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.teacher?.full_name?.toLowerCase().includes(q)
      )
    }

    if (category) {
      result = result.filter((c) => c.category === category)
    }

    if (level) {
      result = result.filter((c) => c.level === level)
    }

    setFilteredCourses(result)
  }, [search, category, level, courses])

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newDescription.trim() || !userId) return

    setIsSubmitting(true)
    setModalError(null)

    const { data, error } = await supabase.from('courses').insert({
      title: newTitle,
      description: newDescription,
      category: newCategory,
      level: newLevel,
      department: newDepartment.trim() || null,
      academic_year: Number(newAcademicYear),
      semester: Number(newSemester),
      thumbnail_url: newThumbnailUrl || null,
      teacher_id: userId,
    }).select().single()

    setIsSubmitting(false)

    if (error) {
      setModalError(error.message)
    } else {
      setIsModalOpen(false)
      setNewTitle('')
      setNewDescription('')
      setNewCategory('')
      setNewThumbnailUrl('')
      loadCourses()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
            {role === 'student' ? (
              <>My <span className="glow-heading">Courses</span></>
            ) : (
              <>Course <span className="glow-heading">Catalog</span></>
            )}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {role === 'student'
              ? `Showing ${courses.length} course${courses.length !== 1 ? 's' : ''} you are currently enrolled in this semester.`
              : 'Browse and manage all platform courses.'}
          </p>
        </div>


        {(role === 'teacher' || role === 'admin') && (
          <Button
            onClick={() => setIsModalOpen(true)}
            className="self-start sm:self-auto text-xs"
          >
            <PlusCircle className="w-4 h-4" /> Create Course
          </Button>
        )}
      </div>

      <CourseFilters
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        level={level}
        setLevel={setLevel}
        categories={categories}
      />

      <CourseGrid courses={filteredCourses} loading={loading} />

      {/* Create Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Course"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {modalError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-xs">
              {modalError}
            </div>
          )}

          <Input
            label="Course Title"
            required
            placeholder="e.g. Next.js 14 Web Architecture"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              required
              placeholder="Provide a comprehensive summary of this course..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-slate-700/80 rounded-lg p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[var(--blue-border)] focus:ring-1 focus:ring-[var(--blue-border)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Category"
              placeholder="e.g. Web Development"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Difficulty Level
              </label>
              <select
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value as CourseLevel)}
                className="w-full bg-[var(--bg-primary)] border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[var(--blue-border)]"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Academic Classification Fields */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700/60">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Target Academic Year
              </label>
              <select
                value={newAcademicYear}
                onChange={(e) => setNewAcademicYear(Number(e.target.value))}
                className="w-full bg-[var(--bg-primary)] border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[var(--blue-border)]"
              >
                <option value={1}>Year 1 (First Year)</option>
                <option value={2}>Year 2 (Second Year)</option>
                <option value={3}>Year 3 (Third Year)</option>
                <option value={4}>Year 4 (Fourth Year)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Target Semester
              </label>
              <select
                value={newSemester}
                onChange={(e) => setNewSemester(Number(e.target.value))}
                className="w-full bg-[var(--bg-primary)] border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[var(--blue-border)]"
              >
                <option value={1}>Semester 1</option>
                <option value={2}>Semester 2</option>
              </select>
            </div>
          </div>

          <Input
            label="Target Department"
            placeholder="e.g. Computer Science"
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
          />

          <Input
            label="Thumbnail Image URL (Optional)"
            placeholder="https://images.unsplash.com/..."
            value={newThumbnailUrl}
            onChange={(e) => setNewThumbnailUrl(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Publish Course
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
