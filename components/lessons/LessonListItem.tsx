import Link from 'next/link'
import { PlayCircle, FileText, CheckCircle2, Lock } from 'lucide-react'

interface LessonListItemProps {
  id: string
  courseId: string
  title: string
  description: string | null
  orderIndex: number
  videoUrl: string | null
  completed?: boolean
  locked?: boolean
}

export function LessonListItem({
  id,
  courseId,
  title,
  description,
  orderIndex,
  videoUrl,
  completed,
  locked = false,
}: LessonListItemProps) {
  const content = (
    <div
      className={`p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-4 ${
        completed
          ? 'bg-[var(--bg-primary)]/40 border-emerald-500/40 hover:border-emerald-400'
          : 'bg-[var(--bg-secondary)] border-[var(--blue-border)]/40 hover:border-[var(--blue-border)] hover:shadow-[0_0_12px_var(--blue-glow)]'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--bg-primary)] border border-[var(--blue-border)]/50 text-xs font-bold text-[var(--blue-glow)] shrink-0">
          {orderIndex + 1}
        </div>

        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-white truncate flex items-center gap-2">
            {title}
            {videoUrl && <PlayCircle className="w-3.5 h-3.5 text-[var(--blue-icon)] inline shrink-0" />}
          </h4>
          {description && (
            <p className="text-xs text-[var(--text-secondary)] truncate">{description}</p>
          )}
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        {completed ? (
          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Done
          </span>
        ) : locked ? (
          <Lock className="w-4 h-4 text-slate-500" />
        ) : (
          <span className="text-xs text-[var(--blue-glow)] font-semibold hover:underline">
            Start &rarr;
          </span>
        )}
      </div>
    </div>
  )

  if (locked) {
    return content
  }

  return <Link href={`/courses/${courseId}/lessons/${id}`}>{content}</Link>
}
