'use client'

import { Globe, GraduationCap, MessageCircle, Search } from 'lucide-react'
import { useState } from 'react'

export interface ChatRoom {
  id: string
  name: string
  type: 'global' | 'level'
  level_id: string | null
  description: string | null
  is_active: boolean
  created_at: string
  unread?: number
  lastMessage?: string
  lastMessageAt?: string
}

interface ChatSidebarProps {
  rooms: ChatRoom[]
  activeRoomId: string | null
  onSelectRoom: (room: ChatRoom) => void
  userLevelId: string | null
  userRole: string | null
}

export function ChatSidebar({
  rooms,
  activeRoomId,
  onSelectRoom,
  userLevelId,
  userRole,
}: ChatSidebarProps) {
  const [search, setSearch] = useState('')

  const isAdmin = userRole === 'admin'

  const accessibleRooms = rooms.filter((room) => {
    if (room.type === 'global') return true
    if (isAdmin) return true
    if (room.type === 'level' && room.level_id === userLevelId) return true
    return false
  })

  const filtered = accessibleRooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    if (a.type === 'global') return -1
    if (b.type === 'global') return 1
    return a.name.localeCompare(b.name)
  })

  const formatTime = (iso?: string) => {
    if (!iso) return ''
    const date = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-secondary)]/60">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-[var(--blue-border)]/30">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-[var(--blue-glow)]/10 border border-[var(--blue-border)]/30">
            <MessageCircle className="w-4 h-4 text-[var(--blue-glow)]" />
          </div>
          <h2 className="text-sm font-bold text-white tracking-wide">
            CS <span className="glow-heading">LORDS</span> Chat
          </h2>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-[var(--bg-primary)]/60 border border-[var(--blue-border)]/40 text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--blue-border)] focus:shadow-[0_0_8px_rgba(30,144,255,0.2)] transition"
          />
        </div>
      </div>

      {/* Room List — scrollable */}
      <div className="flex-1 overflow-y-auto overscroll-contain py-1.5">
        {sorted.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-[var(--text-secondary)]">
            No rooms found
          </div>
        ) : (
          sorted.map((room) => {
            const isActive = room.id === activeRoomId
            const Icon = room.type === 'global' ? Globe : GraduationCap

            return (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 group relative border-l-2 ${
                  isActive
                    ? 'bg-[var(--red-action)]/12 border-[var(--red-action)]'
                    : 'border-transparent hover:bg-[var(--bg-primary)]/50'
                }`}
              >
                {/* Icon */}
                <div
                  className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                    isActive
                      ? 'bg-[var(--red-action)]/20 border-[var(--red-action)]/50 text-[var(--red-glow)]'
                      : room.type === 'global'
                      ? 'bg-[var(--blue-glow)]/10 border-[var(--blue-border)]/40 text-[var(--blue-glow)] group-hover:border-[var(--blue-border)]'
                      : 'bg-[var(--bg-primary)]/60 border-[var(--blue-border)]/30 text-[var(--blue-icon)] group-hover:border-[var(--blue-border)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isActive ? 'text-white' : 'text-[var(--text-primary)] group-hover:text-white'
                      }`}
                    >
                      {room.name}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] shrink-0">
                      {formatTime(room.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5 leading-tight">
                    {room.lastMessage || room.description || 'No messages yet'}
                  </p>
                </div>

                {/* Unread Badge */}
                {room.unread && room.unread > 0 ? (
                  <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-[var(--red-action)] text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-[0_0_8px_var(--red-glow)]">
                    {room.unread > 99 ? '99+' : room.unread}
                  </span>
                ) : null}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
