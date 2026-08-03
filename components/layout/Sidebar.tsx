'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  BookOpen,
  LayoutDashboard,
} from 'lucide-react'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { label: 'Home', href: '/home', icon: Home },
    { label: 'Courses', href: '/courses', icon: BookOpen },
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ]

  const isLinkActive = (href: string) => {
    if (href === '/home') return pathname === '/home'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-30 w-52 bg-[var(--bg-primary)]/75 backdrop-blur-xl border-r border-[var(--blue-border)]/20 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-[0_0_25px_rgba(46,111,217,0.15)]' : '-translate-x-full'
        } flex flex-col justify-between py-4 px-2.5 overflow-y-auto`}
      >
        <div className="space-y-5">
          {/* Main Navigation */}
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-secondary)]/70 uppercase tracking-widest px-2.5 mb-2">
              Menu
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isLinkActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-150 ${
                      active
                        ? 'bg-[var(--red-action)]/20 text-white font-semibold border-l-2 border-[var(--red-action)] shadow-[inset_0_0_10px_rgba(185,28,28,0.2)]'
                        : 'text-[var(--text-secondary)] font-medium hover:text-white hover:bg-[var(--bg-secondary)]/60'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active ? 'text-[var(--red-glow)]' : 'text-[var(--blue-icon)]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </aside>
    </>
  )
}
