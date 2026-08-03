import React from 'react'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[var(--bg-secondary)]/80 rounded-md border border-slate-700/30 ${className}`}
    />
  )
}
