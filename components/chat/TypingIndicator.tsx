'use client'

interface TypingIndicatorProps {
  typingUsers: string[] // display names of users currently typing
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null

  let label = ''
  if (typingUsers.length === 1) {
    label = `${typingUsers[0]} is typing`
  } else if (typingUsers.length === 2) {
    label = `${typingUsers[0]} and ${typingUsers[1]} are typing`
  } else {
    label = `${typingUsers.length} people are typing`
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 animate-fadeIn">
      {/* Animated dots */}
      <div className="flex items-center gap-0.5 bg-[var(--bg-secondary)] px-2.5 py-1.5 rounded-full border border-[var(--blue-border)]/20">
        <span
          className="w-1.5 h-1.5 rounded-full bg-[var(--blue-icon)] animate-bounce"
          style={{ animationDelay: '0ms', animationDuration: '700ms' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-[var(--blue-icon)] animate-bounce"
          style={{ animationDelay: '150ms', animationDuration: '700ms' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-[var(--blue-icon)] animate-bounce"
          style={{ animationDelay: '300ms', animationDuration: '700ms' }}
        />
      </div>
      <span className="text-[11px] text-[var(--text-secondary)] italic">{label}...</span>
    </div>
  )
}
