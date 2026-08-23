'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { UserRole } from '@/types/database.types'
import { academicYearLabel } from '@/lib/utils/academic'
import {
  Home,
  BookOpen,
  LayoutDashboard,
  GraduationCap,
  User,
  LogOut,
  Shield,
  Users,
  Settings,
  Menu,
  X,
  ChevronDown,
  Calendar,
  Layers,
  Clock,
  BookCheck,
  MessageCircle,
} from 'lucide-react'

export function Navbar() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [profile, setProfile] = useState<{
    full_name: string | null
    role: UserRole
    avatar_url: string | null
    student_id?: string | null
    academic_year?: number | null
  } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser({ id: user.id, email: user.email! })
        const { data } = await supabase
          .from('profiles')
          .select('full_name, role, avatar_url, student_id, academic_year')
          .eq('id', user.id)
          .single()

        if (data) {
          setProfile(data)
        }
      }
    }
    getProfile()
  }, [supabase, pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const primaryNavItems = [
    { label: 'Home', href: '/home', icon: Home },
    { label: 'My Courses', href: '/courses', icon: BookOpen },
    { label: 'My Semester', href: '/my-semester', icon: GraduationCap },
    { label: 'My Schedule', href: '/my-schedule', icon: Calendar },
    { label: 'Chat', href: '/chat', icon: MessageCircle },
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ]

  const isLinkActive = (href: string) => {
    if (href === '/home') return pathname === '/home'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--blue-border)]/30 bg-[var(--bg-primary)]/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left Side: Hamburger (Mobile) + Logo + Primary Nav Links */}
        <div className="flex items-center gap-3">
          {user && (
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-[var(--bg-secondary)] transition"
              aria-label="Toggle Navigation"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <Link href={user ? '/home' : '/'} className="flex items-center gap-2.5 group shrink-0">
            <img
              src="/logo.png"
              alt="Cs Lords Logo"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-[0_0_10px_rgba(30,144,255,0.5)]"
            />
            <span className="text-xl font-extrabold tracking-wider text-white">
              CS <span className="glow-heading">LORDS</span>
            </span>
          </Link>

          {/* Desktop Primary Navigation Links directly next to Logo */}
          {user && (
            <nav className="hidden md:flex items-center gap-1.5 ml-4 lg:ml-8">
              {primaryNavItems.map((item) => {
                const Icon = item.icon
                const active = isLinkActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs transition-all duration-150 ${
                      active
                        ? 'bg-[var(--red-action)]/20 text-white font-bold text-[var(--red-glow)] border border-[var(--red-action)]/40 shadow-[0_0_12px_rgba(255,32,32,0.25)]'
                        : 'text-[var(--text-secondary)] font-medium hover:text-white hover:bg-[var(--bg-secondary)]/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-[var(--red-glow)]' : 'text-[var(--blue-icon)]'}`} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          )}
        </div>

        {/* Right Side: Admin Dropdown + Notification Bell + User Profile */}
        {user ? (
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Admin Console Dropdown Menu - Strictly visible ONLY to Administrators */}
            {profile?.role === 'admin' && (
              <div className="relative">
                <button
                  onClick={() => {
                    setAdminMenuOpen(!adminMenuOpen)
                    setMenuOpen(false)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                >
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">Admin</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-amber-400 transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {adminMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[var(--bg-secondary)] border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.25)] py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-1.5 border-b border-amber-500/20 mb-1">
                      <p className="text-[10px] uppercase font-extrabold tracking-wider text-amber-400">
                        Admin Console
                      </p>
                    </div>

                    <Link
                      href="/admin"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-amber-300 hover:bg-amber-500/10 transition"
                    >
                      <Shield className="w-4 h-4 text-amber-400 shrink-0" /> Platform Stats
                    </Link>

                    <Link
                      href="/admin/academic-structure"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-amber-300 hover:bg-amber-500/10 transition"
                    >
                      <Settings className="w-4 h-4 text-amber-400 shrink-0" /> Academic Structure
                    </Link>

                    <Link
                      href="/admin/semesters"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-amber-300 hover:bg-amber-500/10 transition"
                    >
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" /> Semesters
                    </Link>

                    <Link
                      href="/admin/courses"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-amber-300 hover:bg-amber-500/10 transition"
                    >
                      <BookOpen className="w-4 h-4 text-amber-400 shrink-0" /> Course Management
                    </Link>

                    <Link
                      href="/admin/enrollments"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-amber-300 hover:bg-amber-500/10 transition"
                    >
                      <BookCheck className="w-4 h-4 text-amber-400 shrink-0" /> Enrollments
                    </Link>

                    <Link
                      href="/admin/users"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-amber-300 hover:bg-amber-500/10 transition"
                    >
                      <Users className="w-4 h-4 text-amber-400 shrink-0" /> User Management
                    </Link>
                  </div>
                )}
              </div>
            )}

            <NotificationBell />

            {/* Profile Menu Trigger */}
            <div className="relative">
              <button
                onClick={() => {
                  setMenuOpen(!menuOpen)
                  setAdminMenuOpen(false)
                }}
                className="flex items-center gap-2 p-1.5 rounded-full border border-[var(--blue-border)]/50 hover:border-[var(--blue-border)] bg-[var(--bg-secondary)] hover:shadow-[0_0_12px_var(--blue-glow)] transition-all"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover border border-[var(--blue-border)]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--red-action)] to-[var(--blue-glow)] flex items-center justify-center font-bold text-white text-xs">
                    {profile?.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline text-xs font-semibold text-white px-1">
                  {profile?.full_name || user.email.split('@')[0]}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[var(--bg-secondary)] border border-[var(--blue-border)] shadow-[0_0_25px_rgba(46,111,217,0.25)] py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-slate-700/60">
                    <p className="text-xs font-semibold text-white truncate">
                      {profile?.full_name || 'User'}
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)] truncate">{user.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      {profile?.role === 'admin' && (
                        <span className="inline-block text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                          ADMIN
                        </span>
                      )}
                      <span className="inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[var(--red-action)]/20 text-[var(--red-glow)] border border-[var(--red-action)]/30">
                        {profile?.role || 'student'}
                      </span>
                      {profile?.role === 'student' && profile?.academic_year && (
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--blue-glow)]/15 text-[var(--blue-glow)] border border-[var(--blue-border)]/40">
                          {academicYearLabel(profile.academic_year)}
                        </span>
                      )}
                      {profile?.student_id && (
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--blue-glow)]/10 text-[var(--blue-glow)] border border-[var(--blue-border)]/30">
                          ID: {profile.student_id}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/60 transition"
                  >
                    <User className="w-4 h-4 text-[var(--blue-icon)]" /> Profile
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/60 transition"
                  >
                    <Settings className="w-4 h-4 text-[var(--blue-icon)]" /> Settings
                  </Link>

                  <div className="border-t border-slate-700/60 mt-1 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition text-left"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-xs">
              Log In
            </Link>
            <Link href="/register" className="btn-primary text-xs">
              Get Started
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Navigation Drawer Banner */}
      {user && mobileNavOpen && (
        <div className="md:hidden border-b border-[var(--blue-border)]/30 bg-[var(--bg-primary)]/95 backdrop-blur-xl px-4 py-3 space-y-1.5 animate-fadeIn">
          {primaryNavItems.map((item) => {
            const Icon = item.icon
            const active = isLinkActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[var(--red-action)]/20 text-white border-l-2 border-[var(--red-action)] text-[var(--red-glow)]'
                    : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-secondary)]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[var(--red-glow)]' : 'text-[var(--blue-icon)]'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
