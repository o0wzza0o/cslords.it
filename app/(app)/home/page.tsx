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

import { Database } from '@/types/database.types'

type Announcement = Database['public']['Tables']['announcements']['Row']

export default function HomePage() {
  const [profile, setProfile] = useState<{ full_name: string | null; role: UserRole } | null>(null)
  const [stats, setStats] = useState({ courses: 0, enrollments: 0, assignments: 0 })
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [isAnnouncementsModalOpen, setIsAnnouncementsModalOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const supabase = createClient()



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
      const [coursesCount, enrollmentsCount, assignmentsCount, announcementsRes] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('enrollments').select('id', { count: 'exact', head: true }),
        supabase.from('assignments').select('id', { count: 'exact', head: true }),
        supabase.from('announcements')
          .select('*')
          .eq('status', 'Published')
          .order('pinned', { ascending: false })
          .order('published_date', { ascending: false })
          .order('created_at', { ascending: false })
      ])

      if (announcementsRes.data) {
        setAnnouncements(announcementsRes.data as Announcement[])
      }

      setStats({
        courses: coursesCount.count || 0,
        enrollments: enrollmentsCount.count || 0,
        assignments: assignmentsCount.count || 0,
      })

      setLoading(false)
    }

    loadHomeData()
  }, [supabase])

  const priorityBadgeVariant = (category: Announcement['category']) => {
    switch (category) {
      case 'Urgent':
      case 'Exam':
        return 'red'
      case 'Event':
        return 'green'
      case 'Update':
      case 'Notice':
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
          <div className="relative z-10 p-2.5 rounded-xl bg-[var(--blue-glow)]/10 border border-[var(--blue-glow)]/30 text-[var(--blue-glow)]">
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
            {announcements.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No active announcements</div>
            ) : (
              announcements.map((item) => (
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
                        <Badge variant={priorityBadgeVariant(item.category)}>
                          {item.category}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3 text-[var(--blue-icon)]" />
                        {item.published_date ? new Date(item.published_date).toLocaleDateString() : new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {item.image_url && (
                      <div className="rounded-lg overflow-hidden my-2 border border-[var(--blue-border)]/20 relative w-full shrink-0">
                        <img src={item.image_url} alt="Announcement Media" className="w-full h-auto block" />
                      </div>
                    )}

                    {item.title && (
                      <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1 hover:text-[var(--blue-glow)] transition">
                        {item.title}
                      </h3>
                    )}

                    {item.content && (
                      <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                    )}
                  </div>

                  <div className="text-[10px] font-semibold text-[var(--blue-glow)] flex items-center justify-between gap-1 pt-1">
                    <span>Read full announcement &rarr;</span>
                    {item.priority === 'High' && <span className="text-red-400 font-bold">High Priority</span>}
                  </div>
                </div>
              ))
            )}
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
          {announcements.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-lg bg-[var(--bg-primary)]/50 border border-slate-700/60 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {item.pinned && <Pin className="w-3 h-3 text-amber-400 rotate-45" />}
                  <Badge variant={priorityBadgeVariant(item.category)}>
                    {item.category}
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[var(--blue-icon)]" />
                  {item.published_date ? new Date(item.published_date).toLocaleDateString() : new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              {item.image_url && (
                <div className="rounded-lg overflow-hidden my-2 border border-slate-700/60 relative w-full">
                  <img src={item.image_url} alt="Announcement Media" className="w-full h-auto block" />
                </div>
              )}

              {item.title && (
                <h4 className="text-sm font-bold text-white">{item.title}</h4>
              )}
              {item.content && (
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{item.content}</p>
              )}
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
              <Badge variant={priorityBadgeVariant(selectedAnnouncement.category)}>
                {selectedAnnouncement.category}
              </Badge>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--blue-icon)]" />
                {selectedAnnouncement.published_date ? new Date(selectedAnnouncement.published_date).toLocaleDateString() : new Date(selectedAnnouncement.created_at).toLocaleDateString()}
              </span>
            </div>

            {selectedAnnouncement.content && (
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedAnnouncement.content}
              </p>
            )}

            {selectedAnnouncement.image_url && (
              <div className="mt-4 rounded-lg overflow-hidden border border-[var(--blue-border)]/30">
                <img src={selectedAnnouncement.image_url} alt="Announcement Media" className="w-full h-auto block" />
              </div>
            )}

            {selectedAnnouncement.external_url && (
              <a
                href={selectedAnnouncement.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--blue-glow)] hover:text-white bg-[var(--blue-glow)]/10 hover:bg-[var(--blue-glow)]/20 px-3 py-1.5 rounded-lg transition-colors border border-[var(--blue-glow)]/30"
              >
                View External Link &rarr;
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
