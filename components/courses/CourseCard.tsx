'use client'

import Link from 'next/link'
import { BookOpen, User, BarChart2 } from 'lucide-react'
import { CourseLevel } from '@/types/database.types'
import { Badge } from '@/components/ui/Badge'

interface CourseCardProps {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  category: string | null
  level: CourseLevel
  teacher_name?: string | null
  enrolled?: boolean
  progress?: number
}

export function CourseCard({
  id,
  title,
  description,
  thumbnail_url,
  category,
  level,
  teacher_name,
  enrolled,
  progress,
}: CourseCardProps) {
  const levelVariantMap: Record<CourseLevel, 'blue' | 'red' | 'amber'> = {
    beginner: 'blue',
    intermediate: 'amber',
    advanced: 'red',
  }

  return (
    <div className="lms-card overflow-hidden flex flex-col justify-between group h-full">
      <div>
        {/* Thumbnail Image or Gradient Placeholder */}
        <div className="relative h-44 w-full bg-[var(--bg-secondary)] overflow-hidden">
          {thumbnail_url ? (
            <img
              src={thumbnail_url}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--bg-secondary)] via-[var(--bg-primary)] to-[var(--red-action)]/20 flex items-center justify-center p-6 text-center">
              <BookOpen className="w-12 h-12 text-[var(--blue-icon)] opacity-70 group-hover:scale-110 transition-transform" />
            </div>
          )}

          <div className="absolute top-3 left-3 flex gap-2">
            {category && <Badge variant="blue">{category}</Badge>}
            <Badge variant={levelVariantMap[level]}>{level}</Badge>
          </div>

          {enrolled && (
            <div className="absolute top-3 right-3">
              <Badge variant="green">Enrolled</Badge>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-[var(--blue-glow)] transition-colors">
            {title}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-4">
            {description || 'No description provided.'}
          </p>

          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <User className="w-3.5 h-3.5 text-[var(--blue-icon)]" />
            <span>{teacher_name || 'Instructor'}</span>
          </div>

          {typeof progress === 'number' && (
            <div className="mt-4 pt-3 border-t border-[var(--blue-border)]/30">
              <div className="flex justify-between items-center text-[10px] text-[var(--text-secondary)] font-semibold mb-1">
                <span>Course Progress</span>
                <span className="text-[var(--blue-glow)]">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--blue-border)]/30">
                <div
                  className="h-full bg-gradient-to-r from-[var(--blue-glow)] to-[var(--red-action)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 pt-0">
        <Link
          href={`/courses/${id}`}
          className="btn-secondary w-full text-xs text-center justify-center"
        >
          View Course
        </Link>
      </div>
    </div>
  )
}
