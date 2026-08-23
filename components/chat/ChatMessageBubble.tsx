'use client'

import { CornerUpLeft, Pencil, Trash2 } from 'lucide-react'

export interface ChatMessageData {
  id: string
  room_id: string
  user_id: string
  content: string
  is_deleted: boolean
  edited_at: string | null
  reply_to_message_id: string | null
  created_at: string
  profile?: {
    full_name: string | null
    avatar_url: string | null
    role: string
    academic_year: number | null
  }
}

export interface QuotedMessageData {
  id: string
  senderName: string
  content: string
  is_deleted: boolean
}

interface ChatMessageBubbleProps {
  message: ChatMessageData
  isOwn: boolean
  isAdmin: boolean
  replyTargetMessage?: QuotedMessageData | null
  isHighlighted?: boolean
  onDelete: (messageId: string) => void
  onEdit: (messageId: string, currentContent: string) => void
  onReply: (message: ChatMessageData) => void
  onScrollToMessage?: (messageId: string) => void
}

const YEAR_LABELS: Record<number, string> = {
  1: 'First Year',
  2: 'Second Year',
  3: 'Third Year',
  4: 'Fourth Year',
}

/** Returns at most the first two words of a name, preserving single-word names. */
export function formatFirstTwoNames(fullName: string | null): string {
  if (!fullName) return 'Unknown User'
  const words = fullName.trim().split(/\s+/)
  return words.slice(0, 2).join(' ')
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)

  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return date.toLocaleDateString()
}

export function ChatMessageBubble({
  message,
  isOwn,
  isAdmin,
  replyTargetMessage,
  isHighlighted,
  onDelete,
  onEdit,
  onReply,
  onScrollToMessage,
}: ChatMessageBubbleProps) {
  const profile = message.profile
  const displayName = formatFirstTwoNames(profile?.full_name ?? null)
  const avatarLetter = displayName.charAt(0).toUpperCase()
  const yearLabel = profile?.academic_year ? YEAR_LABELS[profile.academic_year] : null
  const canDelete = isOwn || isAdmin
  const isEdited = !!message.edited_at

  if (message.is_deleted) {
    return (
      <div
        id={`chat-msg-${message.id}`}
        className={`flex items-end gap-2 animate-fadeIn ${
          isOwn ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        <div className="w-6 h-6 shrink-0 rounded-full bg-[var(--bg-secondary)] border border-[var(--blue-border)]/20" />
        <div
          className={`px-3 py-2 rounded-2xl text-[11px] italic text-[var(--text-secondary)] border border-dashed border-[var(--blue-border)]/20 bg-[var(--bg-primary)]/30 max-w-[75%] ${
            isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'
          }`}
        >
          Message deleted
        </div>
      </div>
    )
  }

  return (
    <div
      id={`chat-msg-${message.id}`}
      className={`flex items-end gap-2 group animate-fadeIn transition-all duration-300 ${
        isOwn ? 'flex-row-reverse' : 'flex-row'
      } ${
        isHighlighted
          ? 'ring-2 ring-[var(--blue-glow)] shadow-[0_0_20px_rgba(30,144,255,0.4)] p-1 rounded-2xl bg-[var(--blue-glow)]/10 scale-[1.01]'
          : ''
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 self-end">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-[var(--blue-border)]/40"
          />
        ) : (
          <div
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white border ${
              isOwn
                ? 'bg-gradient-to-tr from-[var(--red-action)] to-[var(--blue-glow)] border-[var(--red-action)]/50'
                : 'bg-gradient-to-tr from-[var(--blue-glow)]/70 to-[var(--bg-secondary)] border-[var(--blue-border)]/40'
            }`}
          >
            {avatarLetter}
          </div>
        )}
      </div>

      {/* Bubble container */}
      <div
        className={`max-w-[80%] sm:max-w-[72%] flex flex-col gap-0.5 min-w-0 ${
          isOwn ? 'items-end' : 'items-start'
        }`}
      >
        {/* Sender name + badges (others only) */}
        {!isOwn && (
          <div className="flex items-center gap-1 sm:gap-1.5 px-1 flex-wrap">
            <span className="text-[11px] font-semibold text-white leading-tight truncate max-w-[120px] sm:max-w-none">
              {displayName}
            </span>
            {profile?.role === 'admin' && (
              <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 leading-none shrink-0">
                ADMIN
              </span>
            )}
            {yearLabel && profile?.role !== 'admin' && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[var(--blue-glow)]/10 text-[var(--blue-glow)] border border-[var(--blue-border)]/30 leading-none shrink-0">
                {yearLabel}
              </span>
            )}
          </div>
        )}

        <div className="flex items-end gap-1.5 sm:gap-2 min-w-0 w-full">
          {/* Action buttons — own messages side (left of own bubble) */}
          {isOwn && (
            <div className="flex items-center gap-0.5 opacity-70 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
              {/* Reply */}
              <button
                onClick={() => onReply(message)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--blue-glow)] hover:bg-[var(--blue-glow)]/10 transition-all"
                title="Reply to message"
              >
                <CornerUpLeft className="w-3 h-3" />
              </button>
              {/* Edit */}
              <button
                onClick={() => onEdit(message.id, message.content)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--blue-glow)] hover:bg-[var(--blue-glow)]/10 transition-all"
                title="Edit message"
              >
                <Pencil className="w-3 h-3" />
              </button>
              {/* Delete */}
              {canDelete && (
                <button
                  onClick={() => onDelete(message.id)}
                  className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Delete message"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`relative px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-2xl text-xs leading-relaxed break-words overflow-hidden min-w-0 ${
              isOwn
                ? 'bg-[var(--red-action)]/80 text-white rounded-br-sm shadow-[0_0_12px_rgba(185,28,28,0.3)]'
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--blue-border)]/30 rounded-bl-sm'
            }`}
          >
            {/* Quoted Message Preview inside bubble */}
            {replyTargetMessage && (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  if (replyTargetMessage.id && onScrollToMessage) {
                    onScrollToMessage(replyTargetMessage.id)
                  }
                }}
                className="mb-2 p-2 rounded-xl text-[11px] bg-black/35 border-l-2 border-[var(--blue-glow)] cursor-pointer hover:bg-black/55 transition-all select-none group/quote"
              >
                <div className="flex items-center gap-1 font-semibold text-[var(--blue-glow)] text-[10px] mb-0.5">
                  <CornerUpLeft className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[140px] sm:max-w-[190px]">
                    {formatFirstTwoNames(replyTargetMessage.senderName)}
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] truncate text-[10px] italic">
                  {replyTargetMessage.is_deleted
                    ? 'Message deleted'
                    : replyTargetMessage.content}
                </p>
              </div>
            )}

            {message.content}
          </div>

          {/* Action buttons — other users' messages side (right of bubble) */}
          {!isOwn && (
            <div className="flex items-center gap-0.5 opacity-70 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
              {/* Reply */}
              <button
                onClick={() => onReply(message)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--blue-glow)] hover:bg-[var(--blue-glow)]/10 transition-all"
                title="Reply to message"
              >
                <CornerUpLeft className="w-3 h-3" />
              </button>
              {/* Delete (admin) */}
              {canDelete && (
                <button
                  onClick={() => onDelete(message.id)}
                  className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Delete message"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Timestamp + edited indicator */}
        <div className={`flex items-center gap-1.5 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-[var(--text-secondary)] leading-none">
            {formatTime(message.created_at)}
          </span>
          {isEdited && (
            <span className="text-[9px] text-[var(--text-secondary)]/60 italic leading-none">
              (edited)
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
