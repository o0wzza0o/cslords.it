'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Check, CornerUpLeft, Send, X } from 'lucide-react'
import { formatFirstTwoNames } from './ChatMessageBubble'

export interface ReplyMessageInfo {
  id: string
  senderName: string
  content: string
  is_deleted?: boolean
}

interface ChatInputProps {
  onSend: (content: string, replyToMessageId?: string) => Promise<void>
  onTyping: () => void
  disabled?: boolean
  placeholder?: string
  /** When set, the input is in "edit message" mode */
  editingMessage?: { id: string; content: string } | null
  /** Called when the user saves an edit */
  onSaveEdit?: (messageId: string, newContent: string) => Promise<void>
  /** Called when the user cancels an edit */
  onCancelEdit?: () => void
  /** When set, the input is in "reply message" mode */
  replyToMessage?: ReplyMessageInfo | null
  /** Called when the user cancels a reply */
  onCancelReply?: () => void
}

const MAX_LENGTH = 2000

export function ChatInput({
  onSend,
  onTyping,
  disabled,
  placeholder,
  editingMessage,
  onSaveEdit,
  onCancelEdit,
  replyToMessage,
  onCancelReply,
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isEditMode = !!editingMessage
  const isReplyMode = !!replyToMessage

  // Focus textarea when entering edit or reply mode
  useEffect(() => {
    if (editingMessage) {
      setValue(editingMessage.content)
      setTimeout(() => {
        const el = textareaRef.current
        if (el) {
          el.focus()
          el.selectionStart = el.selectionEnd = el.value.length
        }
      }, 0)
    } else {
      setValue('')
    }
  }, [editingMessage?.id])

  useEffect(() => {
    if (replyToMessage) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 0)
    }
  }, [replyToMessage?.id])

  // Auto-resize textarea up to 120px
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [value])

  const handleSubmit = useCallback(async () => {
    const trimmed = value.trim()
    if (!trimmed || sending || disabled) return

    setSending(true)
    try {
      if (isEditMode && editingMessage && onSaveEdit) {
        if (trimmed !== editingMessage.content.trim()) {
          await onSaveEdit(editingMessage.id, trimmed)
        } else {
          onCancelEdit?.()
        }
      } else {
        await onSend(trimmed, replyToMessage?.id)
        setValue('')
        if (isReplyMode) {
          onCancelReply?.()
        }
      }
    } finally {
      setSending(false)
      if (!isEditMode) textareaRef.current?.focus()
    }
  }, [
    value,
    sending,
    disabled,
    isEditMode,
    editingMessage,
    onSaveEdit,
    onCancelEdit,
    isReplyMode,
    replyToMessage,
    onCancelReply,
    onSend,
  ])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      if (isEditMode) {
        e.preventDefault()
        onCancelEdit?.()
      } else if (isReplyMode) {
        e.preventDefault()
        onCancelReply?.()
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= MAX_LENGTH) {
      setValue(e.target.value)
      if (!isEditMode) onTyping()
    }
  }

  const remaining = MAX_LENGTH - value.length
  const isNearLimit = remaining < 200
  const isOverLimit = remaining < 0

  return (
    <div className="shrink-0 border-t border-[var(--blue-border)]/30 bg-[var(--bg-primary)]/80 backdrop-blur-md px-3 sm:px-4 pt-2.5 pb-3">
      {/* Edit mode banner */}
      {isEditMode && (
        <div className="flex items-center justify-between mb-2 px-1 animate-fadeIn">
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-3.5 rounded-full bg-[var(--blue-glow)]" />
            <span className="text-[11px] font-medium text-[var(--blue-glow)]">
              Editing message
            </span>
          </div>
          <button
            onClick={onCancelEdit}
            className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-[var(--bg-secondary)]"
          >
            <X className="w-3 h-3" />
            Cancel
          </button>
        </div>
      )}

      {/* Reply mode banner */}
      {!isEditMode && isReplyMode && replyToMessage && (
        <div className="flex items-center justify-between mb-2 px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)]/80 border-l-2 border-[var(--blue-glow)] text-xs animate-fadeIn">
          <div className="flex flex-col min-w-0 pr-2">
            <div className="flex items-center gap-1 font-semibold text-[var(--blue-glow)] text-[11px]">
              <CornerUpLeft className="w-3 h-3 shrink-0" />
              <span>Replying to {formatFirstTwoNames(replyToMessage.senderName)}</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] truncate">
              {replyToMessage.is_deleted ? 'Message deleted' : replyToMessage.content}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-[var(--text-secondary)] hover:text-white transition-colors shrink-0 rounded-lg hover:bg-[var(--bg-primary)]/60"
            title="Cancel reply (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div
        className={`flex items-end gap-2 rounded-xl bg-[var(--bg-secondary)]/70 border transition-all ${
          disabled
            ? 'border-[var(--blue-border)]/20 opacity-60'
            : isEditMode
            ? 'border-[var(--blue-border)] shadow-[0_0_12px_rgba(30,144,255,0.2)]'
            : 'border-[var(--blue-border)]/40 focus-within:border-[var(--blue-border)] focus-within:shadow-[0_0_12px_rgba(30,144,255,0.15)]'
        }`}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          placeholder={
            isEditMode
              ? 'Edit your message...'
              : isReplyMode
              ? `Reply to ${formatFirstTwoNames(replyToMessage?.senderName ?? null)}...`
              : (placeholder || 'Type a message...')
          }
          rows={1}
          className="flex-1 resize-none bg-transparent px-3 sm:px-4 py-3 text-sm text-white placeholder-[var(--text-secondary)] focus:outline-none leading-relaxed min-h-[44px] max-h-[120px]"
        />

        <div className="flex items-end gap-1.5 p-2 shrink-0">
          {/* Character counter */}
          {isNearLimit && (
            <span className={`text-[10px] font-mono ${isOverLimit ? 'text-red-400' : 'text-amber-400'}`}>
              {remaining}
            </span>
          )}

          {/* Cancel edit button (mobile) */}
          {isEditMode && (
            <button
              onClick={onCancelEdit}
              className="sm:hidden shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-primary)]/60"
              title="Cancel edit (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Send / Save button */}
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || sending || disabled || isOverLimit}
            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all p-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none ${
              isEditMode
                ? 'bg-[var(--blue-glow)] text-white hover:bg-[var(--blue-glow)]/80 shadow-[0_0_8px_rgba(30,144,255,0.4)]'
                : 'btn-primary'
            }`}
            title={isEditMode ? 'Save edit (Enter)' : 'Send message (Enter)'}
          >
            {isEditMode ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Keyboard hints — hidden on mobile */}
      <p className="hidden sm:block text-[10px] text-[var(--text-secondary)]/50 mt-1.5 px-1">
        {isEditMode ? (
          <>
            Press{' '}
            <kbd className="px-1 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--blue-border)]/20 text-[9px]">Enter</kbd>
            {' '}to save &nbsp;·&nbsp;{' '}
            <kbd className="px-1 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--blue-border)]/20 text-[9px]">Esc</kbd>
            {' '}to cancel
          </>
        ) : (
          <>
            Press{' '}
            <kbd className="px-1 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--blue-border)]/20 text-[9px]">Enter</kbd>
            {' '}to send &nbsp;·&nbsp;{' '}
            <kbd className="px-1 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--blue-border)]/20 text-[9px]">Shift+Enter</kbd>
            {' '}for new line
          </>
        )}
      </p>
    </div>
  )
}
