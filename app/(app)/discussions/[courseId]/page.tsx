'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { UserRole } from '@/types/database.types'
import {
  MessageSquare,
  PlusCircle,
  MessageCircle,
  User,
  Trash2,
  ArrowLeft,
  Send,
} from 'lucide-react'

export default function CourseDiscussionsPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const supabase = createClient()

  const [courseTitle, setCourseTitle] = useState('')
  const [discussions, setDiscussions] = useState<any[]>([])
  const [activeDiscussion, setActiveDiscussion] = useState<string | null>(null)
  const [repliesMap, setRepliesMap] = useState<Record<string, any[]>>({})
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({})
  
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<UserRole>('student')
  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // New Discussion Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [submittingThread, setSubmittingThread] = useState(false)

  useEffect(() => {
    loadDiscussions()
  }, [courseId])

  async function loadDiscussions() {
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
    }

    // Load course info
    const { data: course } = await supabase
      .from('courses')
      .select('title, teacher_id')
      .eq('id', courseId)
      .single()

    if (course) {
      setCourseTitle(course.title)
      setTeacherId(course.teacher_id)
    }

    // Load discussions
    const { data: discList } = await supabase
      .from('discussions')
      .select(`
        *,
        author:profiles(full_name, avatar_url)
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })

    if (discList) {
      setDiscussions(discList)
      // Load replies for each thread
      discList.forEach((d) => fetchReplies(d.id))
    }

    setLoading(false)
  }

  async function fetchReplies(discussionId: string) {
    const { data: replies } = await supabase
      .from('discussion_replies')
      .select(`
        *,
        author:profiles(full_name, avatar_url)
      `)
      .eq('discussion_id', discussionId)
      .order('created_at', { ascending: true })

    if (replies) {
      setRepliesMap((prev) => ({ ...prev, [discussionId]: replies }))
    }
  }

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSubmittingThread(true)

    const { error } = await supabase.from('discussions').insert({
      course_id: courseId,
      user_id: userId,
      title: newTitle,
      content: newContent,
    })

    setSubmittingThread(false)
    if (!error) {
      setIsModalOpen(false)
      setNewTitle('')
      setNewContent('')
      loadDiscussions()
    }
  }

  const handleSendReply = async (discussionId: string) => {
    const content = replyInputMap[discussionId]
    if (!content || !content.trim() || !userId) return

    const { error } = await supabase.from('discussion_replies').insert({
      discussion_id: discussionId,
      user_id: userId,
      content: content.trim(),
    })

    if (!error) {
      setReplyInputMap((prev) => ({ ...prev, [discussionId]: '' }))
      fetchReplies(discussionId)
    }
  }

  const handleDeleteDiscussion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discussion thread?')) return
    await supabase.from('discussions').delete().eq('id', id)
    loadDiscussions()
  }

  const isModerator = userRole === 'admin' || (userRole === 'teacher' && teacherId === userId)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <Link
        href={`/courses/${courseId}`}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[var(--blue-glow)] transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Course
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
            Discussion Forum — <span className="glow-heading">{courseTitle}</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Ask questions, share insights, and collaborate with your peers and instructor.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="text-xs shrink-0">
          <PlusCircle className="w-4 h-4" /> Start Discussion
        </Button>
      </div>

      {discussions.length === 0 ? (
        <div className="lms-card p-12 text-center">
          <MessageSquare className="w-12 h-12 text-[var(--blue-icon)] opacity-50 mx-auto mb-3" />
          <p className="text-sm text-[var(--text-secondary)]">No discussion threads started yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {discussions.map((d) => {
            const replies = repliesMap[d.id] || []
            const canDelete = isModerator || d.user_id === userId

            return (
              <div key={d.id} className="lms-card p-6 space-y-4">
                <div className="flex items-start justify-between gap-4 border-b border-slate-700/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--red-action)]/30 border border-[var(--blue-border)]/40 flex items-center justify-center font-bold text-xs text-white">
                      {d.author?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{d.title}</h3>
                      <p className="text-[10px] text-slate-400">
                        Posted by {d.author?.full_name || 'User'} on{' '}
                        {new Date(d.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDeleteDiscussion(d.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 transition"
                      title="Delete Thread"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {d.content}
                </p>

                {/* Nested Replies */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <h4 className="text-xs font-semibold text-[var(--cyan-glow)] flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" /> Replies ({replies.length})
                  </h4>

                  {replies.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-lg bg-[var(--bg-primary)] border border-slate-700/40 text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="font-bold text-white">
                          {r.author?.full_name || 'User'}
                        </span>
                        <span>{new Date(r.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-300">{r.content}</p>
                    </div>
                  ))}

                  {/* Reply Input Box */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Write a reply..."
                      value={replyInputMap[d.id] || ''}
                      onChange={(e) =>
                        setReplyInputMap((prev) => ({ ...prev, [d.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendReply(d.id)
                      }}
                      className="flex-1 bg-[var(--bg-primary)]/40 backdrop-blur-md border border-[var(--blue-border)]/40 rounded-lg px-3 py-2 text-xs text-white placeholder-[var(--text-secondary)]/60 focus:outline-none focus:border-[var(--blue-border)]"
                    />
                    <Button
                      onClick={() => handleSendReply(d.id)}
                      variant="secondary"
                      size="sm"
                    >
                      <Send className="w-3.5 h-3.5 text-[var(--blue-glow)]" /> Reply
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Start Thread Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Start Discussion Thread"
      >
        <form onSubmit={handleCreateThread} className="space-y-4">
          <Input
            label="Thread Title"
            required
            placeholder="e.g. Question regarding Assignment 2"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Content / Question Details
            </label>
            <textarea
              rows={4}
              required
              placeholder="Describe your question or discussion point in detail..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full bg-[var(--bg-primary)]/40 backdrop-blur-md border border-[var(--blue-border)]/40 rounded-lg p-3 text-xs text-white placeholder-[var(--text-secondary)]/60 focus:outline-none focus:border-[var(--blue-border)]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submittingThread}>
              Post Thread
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
