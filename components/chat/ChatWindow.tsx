'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ChatMessageBubble,
  type ChatMessageData,
  type QuotedMessageData,
} from './ChatMessageBubble'
import { ChatInput, type ReplyMessageInfo } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import type { ChatRoom } from './ChatSidebar'
import { ArrowLeft, Globe, GraduationCap, Loader2, MessageCircle } from 'lucide-react'

interface CurrentUser {
  id: string
  role: string
  full_name: string | null
}

interface ChatWindowProps {
  room: ChatRoom | null
  currentUser: CurrentUser | null
  onBack?: () => void
}

interface TypingPayload {
  userId: string
  userName: string
}

interface EditingState {
  id: string
  content: string
}

const TYPING_TIMEOUT_MS = 3000

const supabase = createClient()

const MESSAGE_SELECT = `
  id,
  room_id,
  user_id,
  content,
  is_deleted,
  edited_at,
  reply_to_message_id,
  created_at,
  profile:profiles!chat_messages_user_id_fkey(
    full_name,
    avatar_url,
    role,
    academic_year
  )
`

export function ChatWindow({ room, currentUser, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [loading, setLoading] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({})
  const [editingMessage, setEditingMessage] = useState<EditingState | null>(null)
  const [replyToMessage, setReplyToMessage] = useState<ChatMessageData | null>(null)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const [extraReplyMap, setExtraReplyMap] = useState<Record<string, ChatMessageData>>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  useEffect(() => {
    if (!room) return

    const roomId = room.id

    setMessages([])
    setLoading(true)
    setTypingUsers({})
    setEditingMessage(null)
    setReplyToMessage(null)

    let mounted = true

    async function loadMessages() {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(MESSAGE_SELECT)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (!mounted) return

      if (error) {
        console.error('Error loading messages:', error)
      } else {
        const shaped = (data || []).map((m: any) => ({
          ...m,
          profile: Array.isArray(m.profile) ? m.profile[0] : m.profile,
        })) as ChatMessageData[]
        setMessages(shaped)
        setTimeout(() => scrollToBottom('instant'), 50)
      }
      setLoading(false)
    }

    loadMessages()

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel(`chat_room_${roomId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('chat_messages')
            .select(MESSAGE_SELECT)
            .eq('id', payload.new.id)
            .single()

          if (data && mounted) {
            const shaped = {
              ...(data as any),
              profile: Array.isArray((data as any).profile)
                ? (data as any).profile[0]
                : (data as any).profile,
            } as ChatMessageData
            setMessages((prev) => [...prev, shaped])
            setTimeout(() => scrollToBottom(), 50)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (!mounted) return
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.id
                ? {
                    ...m,
                    content: payload.new.content ?? m.content,
                    is_deleted: payload.new.is_deleted ?? m.is_deleted,
                    edited_at: payload.new.edited_at ?? m.edited_at,
                    reply_to_message_id: payload.new.reply_to_message_id ?? m.reply_to_message_id,
                  }
                : m
            )
          )
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, userName } = payload.payload as TypingPayload
        if (!mounted || userId === currentUser?.id) return

        setTypingUsers((prev) => ({ ...prev, [userId]: userName }))

        if (typingTimers.current[userId]) {
          clearTimeout(typingTimers.current[userId])
        }
        typingTimers.current[userId] = setTimeout(() => {
          setTypingUsers((prev) => {
            const next = { ...prev }
            delete next[userId]
            return next
          })
        }, TYPING_TIMEOUT_MS)
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      mounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      Object.values(typingTimers.current).forEach(clearTimeout)
      typingTimers.current = {}
    }
  }, [room?.id, scrollToBottom])

  // Fetch any missing reply target messages that aren't in loaded messages
  useEffect(() => {
    if (!room || messages.length === 0) return

    const missingIds = Array.from(
      new Set(
        messages
          .map((m) => m.reply_to_message_id)
          .filter(
            (id): id is string =>
              !!id &&
              !messages.some((m) => m.id === id) &&
              !extraReplyMap[id]
          )
      )
    )

    if (missingIds.length === 0) return

    let mounted = true
    async function fetchMissing() {
      const { data } = await supabase
        .from('chat_messages')
        .select(MESSAGE_SELECT)
        .in('id', missingIds)

      if (data && mounted) {
        const newItems: Record<string, ChatMessageData> = {}
        data.forEach((m: any) => {
          newItems[m.id] = {
            ...m,
            profile: Array.isArray(m.profile) ? m.profile[0] : m.profile,
          }
        })
        setExtraReplyMap((prev) => ({ ...prev, ...newItems }))
      }
    }

    fetchMissing()
  }, [messages, room?.id, extraReplyMap])

  // Send message with optional reply_to_message_id
  const handleSend = useCallback(
    async (content: string, replyToMessageId?: string) => {
      if (!room || !currentUser) return
      const { error } = await supabase.from('chat_messages').insert({
        room_id: room.id,
        user_id: currentUser.id,
        content,
        reply_to_message_id: replyToMessageId || null,
      })
      if (error) console.error('Error sending message:', error)
    },
    [room, currentUser]
  )

  // Soft delete message
  const handleDelete = useCallback(async (messageId: string) => {
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_deleted: true })
      .eq('id', messageId)
    if (error) console.error('Error deleting message:', error)
  }, [])

  // Enter edit mode
  const handleEdit = useCallback((messageId: string, currentContent: string) => {
    setReplyToMessage(null)
    setEditingMessage({ id: messageId, content: currentContent })
  }, [])

  const handleSaveEdit = useCallback(
    async (messageId: string, newContent: string) => {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          content: newContent,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('user_id', currentUser?.id ?? '')

      if (error) {
        console.error('Error editing message:', error)
      } else {
        setEditingMessage(null)
      }
    },
    [currentUser]
  )

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null)
  }, [])

  // Enter reply mode
  const handleReply = useCallback((msg: ChatMessageData) => {
    setEditingMessage(null)
    setReplyToMessage(msg)
  }, [])

  const handleCancelReply = useCallback(() => {
    setReplyToMessage(null)
  }, [])

  // Scroll to original target message when user clicks quote preview
  const handleScrollToMessage = useCallback((targetId: string) => {
    const element = document.getElementById(`chat-msg-${targetId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedMessageId(targetId)
      setTimeout(() => {
        setHighlightedMessageId((curr) => (curr === targetId ? null : curr))
      }, 2000)
    }
  }, [])

  const handleTyping = useCallback(() => {
    if (!channelRef.current || !currentUser) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: currentUser.id,
        userName: currentUser.full_name || 'Someone',
      } satisfies TypingPayload,
    })
  }, [currentUser])

  // Helper to resolve quoted target message data
  const getReplyTarget = (replyId: string | null): QuotedMessageData | null => {
    if (!replyId) return null
    const target = messages.find((m) => m.id === replyId) || extraReplyMap[replyId]
    if (!target) return null
    return {
      id: target.id,
      senderName: target.profile?.full_name ?? 'Unknown User',
      content: target.content,
      is_deleted: target.is_deleted,
    }
  }

  const typingNames = Object.values(typingUsers)

  const replyInfoForInput: ReplyMessageInfo | null = replyToMessage
    ? {
        id: replyToMessage.id,
        senderName: replyToMessage.profile?.full_name ?? 'Unknown User',
        content: replyToMessage.content,
        is_deleted: replyToMessage.is_deleted,
      }
    : null

  if (!room) {
    return (
      <div className="flex-1 hidden md:flex items-center justify-center bg-[var(--bg-primary)]/40">
        <div className="text-center space-y-3 px-6">
          <div className="w-14 h-14 rounded-2xl bg-[var(--blue-glow)]/10 border border-[var(--blue-border)]/30 flex items-center justify-center mx-auto">
            <MessageCircle className="w-7 h-7 text-[var(--blue-glow)]/60" />
          </div>
          <p className="text-sm font-semibold text-white">Select a chat room</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Choose a room from the left panel to start chatting
          </p>
        </div>
      </div>
    )
  }

  const RoomIcon = room.type === 'global' ? Globe : GraduationCap

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      {/* Room Header */}
      <div className="shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-[var(--blue-border)]/30 bg-[var(--bg-secondary)]/50 backdrop-blur-md">
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden shrink-0 p-2 -ml-1 rounded-xl text-[var(--blue-icon)] hover:bg-[var(--bg-primary)]/60 hover:text-white transition-all"
            aria-label="Back to rooms"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        <div
          className={`shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border ${
            room.type === 'global'
              ? 'bg-[var(--blue-glow)]/10 border-[var(--blue-border)]/40 text-[var(--blue-glow)]'
              : 'bg-[var(--red-action)]/10 border-[var(--red-action)]/30 text-[var(--red-glow)]'
          }`}
        >
          <RoomIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white truncate">{room.name}</h3>
          {room.description && (
            <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] truncate leading-tight">
              {room.description}
            </p>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80]" />
          <span className="text-[10px] sm:text-[11px] text-green-400 font-medium">Live</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-3 sm:py-4 space-y-3 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[var(--blue-glow)] animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--blue-glow)]/10 border border-[var(--blue-border)]/30 flex items-center justify-center mb-3">
              <MessageCircle className="w-6 h-6 text-[var(--blue-glow)]/50" />
            </div>
            <p className="text-sm font-semibold text-white">No messages yet</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Be the first to say something!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.user_id === currentUser?.id}
              isAdmin={currentUser?.role === 'admin'}
              replyTargetMessage={getReplyTarget(msg.reply_to_message_id)}
              isHighlighted={highlightedMessageId === msg.id}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onReply={handleReply}
              onScrollToMessage={handleScrollToMessage}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <TypingIndicator typingUsers={typingNames} />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onTyping={handleTyping}
        disabled={!currentUser}
        placeholder={`Message ${room.name}...`}
        editingMessage={editingMessage}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        replyToMessage={replyInfoForInput}
        onCancelReply={handleCancelReply}
      />
    </div>
  )
}
