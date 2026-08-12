import React from 'react'

interface BadgeProps {
  variant?: 'blue' | 'red' | 'green' | 'amber' | 'purple'
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'blue', children, className = '' }: BadgeProps) {
  const variantStyles = {
    blue: 'bg-[var(--blue-glow)]/15 text-[var(--blue-glow)] border-[var(--blue-glow)]/40',
    red: 'bg-[var(--red-action)]/15 text-[var(--red-glow)] border-[var(--red-action)]/40',
    green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
