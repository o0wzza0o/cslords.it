'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { UserRole } from '@/types/database.types'
import {
  FileCheck,
  Upload,
  Calendar,
  Award,
  CheckCircle2,
  ArrowLeft,
  User,
  MessageSquare,
} from 'lucide-react'

export default function AssignmentDetailPage() {
  const params = useParams()
  const assignmentId = params.assignmentId as string
  const router = useRouter()
  const supabase = createClient()

  const [assignment, setAssignment] = useState<any>(null)
  const [submission, setSubmission] = useState<any>(null)
  const [allSubmissions, setAllSubmissions] = useState<any[]>([])
  const [fileUrl, setFileUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [role, setRole] = useState<UserRole>('student')
  const [loading, setLoading] = useState(true)

  // Teacher Grading Modal
  const [selectedSub, setSelectedSub] = useState<any>(null)
  const [gradeInput, setGradeInput] = useState<number>(0)
  const [feedbackInput, setFeedbackInput] = useState('')
  const [grading, setGrading] = useState(false)

  useEffect(() => {
    loadAssignmentData()
  }, [assignmentId])

  async function loadAssignmentData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) setRole(profile.role)

    // Fetch Assignment Details
    const { data: assignmentData } = await supabase
      .from('assignments')
      .select(`
        *,
        course:courses(id, title, teacher_id)
      `)
      .eq('id', assignmentId)
      .single()

    if (assignmentData) {
      setAssignment(assignmentData)

      // If Student: check own submission
      const { data: userSub } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', user.id)
        .maybeSingle()

      if (userSub) {
        setSubmission(userSub)
        setFileUrl(userSub.file_url || '')
      }

      // If Teacher / Admin: load all submissions
      if (profile?.role === 'admin' || assignmentData.course?.teacher_id === user.id) {
        const { data: subs } = await supabase
          .from('submissions')
          .select(`
            *,
            student:profiles(full_name, email, avatar_url)
          `)
          .eq('assignment_id', assignmentId)
          .order('submitted_at', { ascending: false })

        if (subs) setAllSubmissions(subs)
      }
    }

    setLoading(false)
  }

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSubmitting(true)

    const { data, error } = await supabase
      .from('submissions')
      .upsert({
        assignment_id: assignmentId,
        student_id: userId,
        file_url: fileUrl,
        submitted_at: new Date().toISOString(),
      }, { onConflict: 'assignment_id,student_id' })
      .select()
      .single()

    setSubmitting(false)

    if (!error) {
      setSubmission(data)
      loadAssignmentData()
    }
  }

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSub) return
    setGrading(true)

    const { error } = await supabase
      .from('submissions')
      .update({
        grade: gradeInput,
        feedback: feedbackInput,
      })
      .eq('id', selectedSub.id)

    setGrading(false)
    if (!error) {
      setSelectedSub(null)
      loadAssignmentData()
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

  if (!assignment) {
    return (
      <div className="lms-card p-12 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Assignment Not Found</h2>
        <Link href="/assignments" className="btn-secondary text-xs">
          Back to Assignments
        </Link>
      </div>
    )
  }

  const isTeacherOrAdmin =
    role === 'admin' || (role === 'teacher' && assignment.course?.teacher_id === userId)

  return (
    <div className="space-y-8 animate-fadeIn">
      <Link
        href="/assignments"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[var(--blue-glow)] transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Assignments
      </Link>

      {/* Assignment Header */}
      <div className="lms-card p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="blue">{assignment.course?.title}</Badge>
          <span className="text-xs text-[var(--blue-glow)] font-bold">
            Max Score: {assignment.max_score} pts
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{assignment.title}</h1>

        <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
          {assignment.description || 'No specific instructions provided.'}
        </p>

        {assignment.due_date && (
          <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-[var(--blue-border)]/30">
            <Calendar className="w-4 h-4 text-[var(--blue-icon)]" />
            <span>Due Date: {new Date(assignment.due_date).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Student Submission Interface */}
      {!isTeacherOrAdmin && (
        <div className="lms-card p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-[var(--blue-glow)]" /> Your Submission
          </h2>

          {submission?.grade !== null && submission?.grade !== undefined ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase">Graded</span>
                <span className="text-lg font-extrabold text-emerald-300">
                  {submission.grade} / {assignment.max_score} pts
                </span>
              </div>
              {submission.feedback && (
                <p className="text-xs text-slate-300 italic">
                  Instructor Feedback: &quot;{submission.feedback}&quot;
                </p>
              )}
            </div>
          ) : submission ? (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[var(--blue-glow)] font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Submitted on{' '}
                {new Date(submission.submitted_at).toLocaleString()}
              </div>
              <Badge variant="amber">Awaiting Grade</Badge>
            </div>
          ) : null}

          <form onSubmit={handleSubmitAssignment} className="space-y-4">
            <Input
              label="Submission File URL / Cloud Resource Link"
              required
              placeholder="https://github.com/... or https://drive.google.com/..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
            />

            <Button type="submit" isLoading={submitting} className="text-xs">
              <Upload className="w-4 h-4" /> {submission ? 'Update Submission' : 'Submit Assignment'}
            </Button>
          </form>
        </div>
      )}

      {/* Teacher Submissions Grading Queue */}
      {isTeacherOrAdmin && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" /> Student Submissions ({allSubmissions.length})
          </h2>

          {allSubmissions.length === 0 ? (
            <div className="lms-card p-8 text-center text-xs text-slate-400">
              No students have submitted work for this assignment yet.
            </div>
          ) : (
            <div className="lms-card overflow-hidden">
              <div className="divide-y divide-slate-800/80">
                {allSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[var(--blue-icon)]" />
                        <span className="text-sm font-semibold text-white">
                          {sub.student?.full_name || sub.student?.email}
                        </span>
                        {sub.grade !== null ? (
                          <Badge variant="green">{sub.grade} / {assignment.max_score} pts</Badge>
                        ) : (
                          <Badge variant="amber">Needs Grade</Badge>
                        )}
                      </div>

                      {sub.file_url && (
                        <a
                          href={sub.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[var(--blue-glow)] hover:underline block"
                        >
                          View Submitted Artifact &rarr;
                        </a>
                      )}
                      <p className="text-[10px] text-slate-400">
                        Submitted: {new Date(sub.submitted_at).toLocaleString()}
                      </p>
                    </div>

                    <Button
                      onClick={() => {
                        setSelectedSub(sub)
                        setGradeInput(sub.grade || 0)
                        setFeedbackInput(sub.feedback || '')
                      }}
                      variant="secondary"
                      className="text-xs shrink-0"
                    >
                      {sub.grade !== null ? 'Edit Grade' : 'Grade Submission'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grade Modal for Teachers */}
      <Modal
        isOpen={!!selectedSub}
        onClose={() => setSelectedSub(null)}
        title={`Grade Submission — ${selectedSub?.student?.full_name || 'Student'}`}
      >
        <form onSubmit={handleGradeSubmission} className="space-y-4">
          <Input
            label={`Grade Score (Out of ${assignment.max_score})`}
            type="number"
            min={0}
            max={assignment.max_score}
            required
            value={gradeInput}
            onChange={(e) => setGradeInput(Number(e.target.value))}
          />

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Feedback Notes
            </label>
            <textarea
              rows={3}
              placeholder="Provide constructive feedback for the student..."
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              className="w-full bg-[var(--bg-primary)]/40 backdrop-blur-md border border-[var(--blue-border)]/40 rounded-lg p-3 text-xs text-white placeholder-[var(--text-secondary)]/60 focus:outline-none focus:border-[var(--blue-border)]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
            <Button variant="secondary" type="button" onClick={() => setSelectedSub(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={grading}>
              Submit Grade
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
