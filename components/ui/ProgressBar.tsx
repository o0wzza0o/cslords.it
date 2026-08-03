import React from 'react'

interface ProgressBarProps {
  progress: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ProgressBar({ progress, showLabel = true, size = 'md' }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))
  
  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-semibold mb-1">
          <span className="text-[var(--text-secondary)]">Progress</span>
          <span className="text-[var(--blue-glow)]">{clampedProgress}%</span>
        </div>
      )}
      <div className={`w-full bg-[var(--bg-primary)]/80 rounded-full overflow-hidden ${heightStyles[size]} border border-[var(--blue-border)]/40`}>
        <div
          className="h-full bg-gradient-to-r from-[var(--blue-glow)] to-[var(--red-action)] rounded-full transition-all duration-300 shadow-[0_0_10px_var(--red-glow)]"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}
