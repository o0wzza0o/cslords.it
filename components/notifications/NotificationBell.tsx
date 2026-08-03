'use client'

import { useEffect, useState, useRef } from 'react'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { NotificationType } from '@/types/database.types'

interface NotificationItem {
  id: string
  message: string
  type: NotificationType | null
  read: boolean
  created_at: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    let channel: any = null

    async function loadNotifications() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) {
        setNotifications(data as NotificationItem[])
      }

      // Supabase Realtime subscription
      channel = supabase
        .channel(`notifications_${user.id}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new as NotificationItem, ...prev])
          }
        )
        .subscribe()
    }

    loadNotifications()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = async () => {
    if (!userId) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markSingleAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--blue-border)] transition-all duration-200 focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-[var(--blue-icon)]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--red-action)] text-[10px] font-bold text-white shadow-[0_0_8px_var(--red-glow)] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[var(--bg-secondary)] border border-[var(--blue-border)] shadow-[0_0_25px_rgba(46,111,217,0.25)] z-50 overflow-hidden animate-fadeIn">
          <div className="flex items-center justify-between p-4 border-b border-slate-700/60 bg-[var(--bg-primary)]/70">
            <h4 className="font-semibold text-white text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-[var(--blue-glow)]" /> Notifications
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[var(--blue-glow)] hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markSingleAsRead(n.id)}
                  className={`p-3.5 text-xs transition cursor-pointer flex items-start gap-3 ${
                    n.read
                      ? 'opacity-70 bg-transparent hover:bg-[var(--bg-primary)]/40'
                      : 'bg-[var(--bg-primary)]/80 hover:bg-[var(--bg-primary)] border-l-2 border-[var(--red-action)]'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-white font-medium leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-[var(--red-action)] mt-1 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
