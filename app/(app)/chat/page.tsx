'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatSidebar, type ChatRoom } from '@/components/chat/ChatSidebar'
import { ChatWindow } from '@/components/chat/ChatWindow'

interface CurrentUser {
  id: string
  role: string
  full_name: string | null
  level_id: string | null
  academic_year: number | null
}

export default function ChatPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileView, setMobileView] = useState<'rooms' | 'chat'>('rooms')
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, level_id, academic_year')
        .eq('id', user.id)
        .single()

      if (profile) {
        setCurrentUser({
          id: user.id,
          role: profile.role,
          full_name: profile.full_name,
          level_id: profile.level_id,
          academic_year: profile.academic_year,
        })
      }

      const { data: roomsData } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (roomsData) {
        setRooms(roomsData as ChatRoom[])
        const globalRoom = roomsData.find((r) => r.type === 'global')
        if (globalRoom) {
          setActiveRoom(globalRoom as ChatRoom)
        }
      }

      setLoading(false)
    }

    init()
  }, [supabase])

  const handleSelectRoom = (room: ChatRoom) => {
    setActiveRoom(room)
    setMobileView('chat')
  }

  const handleBackToRooms = () => {
    setMobileView('rooms')
  }

  /*
   * LAYOUT STRATEGY — position: fixed
   * ─────────────────────────────────
   * The parent app layout has: Navbar (h-16 = 64px) + main (with padding) + Footer.
   * All of these live inside a min-h-screen flex-col root that allows the document
   * to grow and produce a page-level scrollbar.
   *
   * Using `position: fixed; top: 64px; inset-x: 0; bottom: 0` completely escapes
   * the document flow. The chat container is pinned directly to the viewport,
   * from just below the navbar to the very bottom edge — regardless of footer,
   * padding, or document height. Only the messages area scrolls internally.
   *
   * The loading state uses the same fixed-position strategy for consistency.
   */

  if (loading) {
    return (
      <div className="fixed inset-x-0 bottom-0 flex items-center justify-center bg-[var(--bg-primary)]/80 z-10"
           style={{ top: '64px' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--blue-glow)]/10 border border-[var(--blue-border)]/30 flex items-center justify-center animate-pulse">
            <span className="text-xl">💬</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-10 flex overflow-hidden bg-[var(--bg-primary)]/60"
      style={{ top: '64px' }}
    >
      {/* Subtle border on top edge only — replaces the card border on desktop */}
      <div className="absolute inset-x-0 top-0 h-px bg-[var(--blue-border)]/30 pointer-events-none z-20" />

      {/*
       * SIDEBAR
       * Desktop (md+): fixed-width left column, always visible
       * Mobile: full-width "rooms screen", replaced by chat when mobileView === 'chat'
       */}
      <div
        className={`
          flex-col
          w-full md:w-72 lg:w-80
          shrink-0
          border-r border-[var(--blue-border)]/30
          ${mobileView === 'rooms' ? 'flex' : 'hidden md:flex'}
        `}
      >
        <ChatSidebar
          rooms={rooms}
          activeRoomId={activeRoom?.id ?? null}
          onSelectRoom={handleSelectRoom}
          userLevelId={currentUser?.level_id ?? null}
          userRole={currentUser?.role ?? null}
        />
      </div>

      {/*
       * CHAT WINDOW
       * Desktop: fills remaining width (flex-1)
       * Mobile: shown only when mobileView === 'chat'
       */}
      <div
        className={`
          flex-col flex-1 min-w-0
          ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'}
        `}
      >
        <ChatWindow
          room={activeRoom}
          currentUser={
            currentUser
              ? {
                  id: currentUser.id,
                  role: currentUser.role,
                  full_name: currentUser.full_name,
                }
              : null
          }
          onBack={handleBackToRooms}
        />
      </div>
    </div>
  )
}
