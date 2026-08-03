import React from 'react'
import { CourseCard } from './CourseCard'
import { CourseLevel } from '@/types/database.types'
import { Skeleton } from '@/components/ui/Skeleton'

interface CourseItem {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  category: string | null
  level: CourseLevel
  teacher?: { full_name: string | null } | null
  enrolled?: boolean
  progress?: number
}

interface CourseGridProps {
  courses: CourseItem[]
  loading?: boolean
}

export function CourseGrid({ courses, loading = false }: CourseGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="lms-card p-5 space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="lms-card p-12 text-center">
        <p className="text-base text-[var(--text-secondary)]">No courses found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          id={course.id}
          title={course.title}
          description={course.description}
          thumbnail_url={course.thumbnail_url}
          category={course.category}
          level={course.level}
          teacher_name={course.teacher?.full_name}
          enrolled={course.enrolled}
          progress={course.progress}
        />
      ))}
    </div>
  )
}
