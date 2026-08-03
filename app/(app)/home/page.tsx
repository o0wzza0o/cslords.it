'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/types/database.types'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import {
  Sparkles,
  BookOpen,
  PlusCircle,
  FileText,
  TrendingUp,
  Megaphone,
  Pin,
  Calendar,
  ChevronRight,
} from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  date: string
  priority: 'Urgent' | 'Important' | 'Update' | 'Notice'
  pinned: boolean
}

export default function HomePage() {
  const [profile, setProfile] = useState<{ full_name: string | null; role: UserRole } | null>(null)
  const [stats, setStats] = useState({ courses: 0, enrollments: 0, assignments: 0 })
  const [loading, setLoading] = useState(true)
  const [isAnnouncementsModalOpen, setIsAnnouncementsModalOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const supabase = createClient()

  const sampleAnnouncements: Announcement[] = [
    {
      id: '1',
      title: 'Midterm Exam Schedule & Room Allocations Released',
      content: 'The official schedule for Midterm Examinations is now published. Please check your course pages and verify your assigned examination rooms and timings.',
      date: '2026-08-05',
      priority: 'Urgent',
      pinned: true,
    },
    {
      id: '2',
      title: 'New Computer Science & Web Architecture Courses Added',
      content: 'Check out the newly published courses in Next.js 14 App Architecture, Cloud Computing, and Advanced Database Management.',
      date: '2026-08-01',
      priority: 'Update',
      pinned: true,
    },
    {
      id: '3',
      title: 'System Maintenance & Platform Performance Upgrade',
      content: 'Scheduled database optimization will take place this Sunday at 02:00 AM UTC. Expect minimal service interruption for 15 minutes.',
      date: '2026-07-28',
      priority: 'Notice',
      pinned: false,
    },
    {
      id: '4',
      title: 'Annual CS Lords Coding Hackathon Registration Open',
      content: 'Registration for the 2026 CS Lords Innovation Hackathon is now open. Form teams of up to 4 members and submit your registration before August 20th.',
      date: '2026-07-25',
      priority: 'Important',
      pinned: false,
    },
  ]

  useEffect(() => {
    async function loadHomeData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

      if (profileData) setProfile(profileData)

      // Fetch user specific stats
      const [coursesCount, enrollmentsCount, assignmentsCount] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('enrollments').select('id', { count: 'exact', head: true }),
        supabase.from('assignments').select('id', { count: 'exact', head: true }),
      ])

      setStats({
        courses: coursesCount.count || 0,
        enrollments: enrollmentsCount.count || 0,
        assignments: assignmentsCount.count || 0,
      })

      setLoading(false)
    }

    loadHomeData()
  }, [supabase])

  const priorityBadgeVariant = (priority: Announcement['priority']) => {
    switch (priority) {
      case 'Urgent':
      case 'Important':
        return 'red'
      case 'Update':
      default:
        return 'blue'
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Welcome Banner - Height Reduced by ~40-50% */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--bg-secondary)] via-[var(--bg-primary)] to-[var(--red-action)]/20 p-4 sm:p-5 border border-[var(--blue-border)]/40 shadow-[0_0_20px_rgba(46,111,217,0.15)]">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--red-action)]/20 border border-[var(--blue-border)]/50 text-[11px] font-semibold text-[var(--red-glow)] mb-2">
            <Sparkles className="w-3 h-3" /> By Mix Host
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide mb-1.5">
            Welcome back,{' '}
            <span className="glow-heading">
              {profile?.full_name || 'Scholar'}
            </span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3.5">
            Cs Lords is built to help students learn, collaborate, improve their skills, and achieve their academic goals.
          </p>

          <div className="flex flex-wrap gap-2.5">
            <Link href="/courses" className="btn-primary text-xs py-1.5 px-3">
              <BookOpen className="w-3.5 h-3.5" /> Explore Courses
            </Link>

            {profile?.role === 'teacher' || profile?.role === 'admin' ? (
              <Link href="/courses?action=create" className="btn-secondary text-xs py-1.5 px-3">
                <PlusCircle className="w-3.5 h-3.5 text-[var(--blue-glow)]" /> Create New Course
              </Link>
            ) : (
              <Link href="/dashboard" className="btn-secondary text-xs py-1.5 px-3">
                <TrendingUp className="w-3.5 h-3.5 text-[var(--blue-glow)]" /> View My Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* Decorative Grid Lines */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#1e90ff_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none" />
      </div>

      {/* Quick Stats Grid - Positioned Immediately Below Welcome Banner with Hero Decorative Layer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--bg-secondary)] via-[var(--bg-primary)] to-[var(--red-action)]/20 p-4 border border-[var(--blue-border)]/40 shadow-[0_0_20px_rgba(46,111,217,0.15)] flex items-center justify-between">
          <div className="relative z-10">
            <p className="text-xs text-[var(--text-secondary)] font-medium">Total Courses Available</p>
            <p className="text-xl font-extrabold text-[var(--text-primary)] mt-0.5">{stats.courses}</p>
          </div>
          <div className="relative z-10 p-2.5 rounded-xl bg-[var(--blue-glow)]/10 border border-[var(--blue-glow)]/30 text-[var(--blue-glow)]">
            <BookOpen className="w-5 h-5" />
          </div>
          {/* Decorative Grid Lines */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#1e90ff_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none" />
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--bg-secondary)] via-[var(--bg-primary)] to-[var(--red-action)]/20 p-4 border border-[var(--blue-border)]/40 shadow-[0_0_20px_rgba(46,111,217,0.15)] flex items-center justify-between">
          <div className="relative z-10">
            <p className="text-xs text-[var(--text-secondary)] font-medium">Active Enrollments</p>
            <p className="text-xl font-extrabold text-[var(--text-primary)] mt-0.5">{stats.enrollments}</p>
          </div>
          <div className="relative z-10 p-2.5 rounded-xl bg-[var(--red-action)]/10 border border-[var(--red-action)]/30 text-[var(--red-action)]">
            <TrendingUp className="w-5 h-5" />
          </div>
          {/* Decorative Grid Lines */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#1e90ff_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none" />
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--bg-secondary)] via-[var(--bg-primary)] to-[var(--red-action)]/20 p-4 border border-[var(--blue-border)]/40 shadow-[0_0_20px_rgba(46,111,217,0.15)] flex items-center justify-between">
          <div className="relative z-10">
            <p className="text-xs text-[var(--text-secondary)] font-medium">Assignments Published</p>
            <p className="text-xl font-extrabold text-[var(--text-primary)] mt-0.5">{stats.assignments}</p>
          </div>
          <div className="relative z-10 p-2.5 rounded-xl bg-[var(--blue-border)]/10 border border-[var(--blue-border)]/30 text-[var(--blue-glow)]">
            <FileText className="w-5 h-5" />
          </div>
          {/* Decorative Grid Lines */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#1e90ff_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none" />
        </div>
      </div>

      {/* Site Announcements Feed Section - Fixed Header & Dedicated Vertical Scroll Feed */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--bg-secondary)] via-[var(--bg-primary)] to-[var(--red-action)]/20 p-4 sm:p-5 border border-[var(--blue-border)]/40 shadow-[0_0_20px_rgba(46,111,217,0.15)] space-y-3.5">
        <div className="relative z-10 space-y-3.5">
          {/* Fixed Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--blue-border)]/20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[var(--red-action)]/20 border border-[var(--blue-border)]/40 text-[var(--red-glow)]">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Site Announcements
                </h2>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Latest updates, important notices, and academic news
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAnnouncementsModalOpen(true)}
              className="text-xs font-semibold text-[var(--blue-glow)] hover:underline flex items-center gap-1 shrink-0"
            >
              View all announcements <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dedicated Vertical Scrollable Announcements Feed */}
          <div className="max-h-[360px] overflow-y-auto overflow-x-hidden pr-1.5 space-y-3">
            {sampleAnnouncements.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedAnnouncement(item)}
                className="p-3.5 rounded-lg bg-[var(--bg-primary)]/60 backdrop-blur-md border border-[var(--blue-border)]/40 hover:border-[var(--blue-border)] hover:shadow-[0_0_12px_rgba(30,144,255,0.2)] transition cursor-pointer flex flex-col justify-between space-y-2"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {item.pinned && (
                        <Pin className="w-3 h-3 text-amber-400 rotate-45 shrink-0" />
                      )}
                      <Badge variant={priorityBadgeVariant(item.priority)}>
                        {item.priority}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3 text-[var(--blue-icon)]" />
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1 hover:text-[var(--blue-glow)] transition">
                    {item.title}
                  </h3>

                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {item.content}
                  </p>
                </div>

                <div className="text-[10px] font-semibold text-[var(--blue-glow)] flex items-center gap-1 pt-1">
                  Read full announcement &rarr;
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative Grid Lines */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#1e90ff_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none" />
      </div>

      {/* View All Announcements Modal */}
      <Modal
        isOpen={isAnnouncementsModalOpen}
        onClose={() => setIsAnnouncementsModalOpen(false)}
        title="Site Announcements"
      >
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {sampleAnnouncements.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-lg bg-[var(--bg-primary)]/50 border border-slate-700/60 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {item.pinned && <Pin className="w-3 h-3 text-amber-400 rotate-45" />}
                  <Badge variant={priorityBadgeVariant(item.priority)}>
                    {item.priority}
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[var(--blue-icon)]" />
                  {new Date(item.date).toLocaleDateString()}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white">{item.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>
      </Modal>

      {/* Single Announcement Detail Modal */}
      <Modal
        isOpen={!!selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
        title={selectedAnnouncement?.title || 'Announcement Detail'}
      >
        {selectedAnnouncement && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={priorityBadgeVariant(selectedAnnouncement.priority)}>
                {selectedAnnouncement.priority}
              </Badge>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--blue-icon)]" />
                {new Date(selectedAnnouncement.date).toLocaleDateString()}
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {selectedAnnouncement.content}
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
