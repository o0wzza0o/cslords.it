'use client'

import { Search, Filter } from 'lucide-react'
import { CourseLevel } from '@/types/database.types'

interface CourseFiltersProps {
  search: string
  setSearch: (val: string) => void
  category: string
  setCategory: (val: string) => void
  level: string
  setLevel: (val: string) => void
  categories: string[]
}

export function CourseFilters({
  search,
  setSearch,
  category,
  setCategory,
  level,
  setLevel,
  categories,
}: CourseFiltersProps) {
  return (
    <div className="lms-card p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
      {/* Search Input */}
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search courses by title or topic..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[var(--bg-primary)]/40 backdrop-blur-md border border-[var(--blue-border)]/40 rounded-lg pl-10 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:border-[var(--blue-border)] focus:ring-1 focus:ring-[var(--blue-border)] focus:shadow-[0_0_12px_var(--blue-glow)] transition-all"
        />
      </div>

      {/* Filter Dropdowns */}
      <div className="flex w-full md:w-auto gap-3 items-center">
        <Filter className="w-4 h-4 text-[var(--blue-icon)] shrink-0 hidden sm:block" />
        
        {/* Category Dropdown */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full sm:w-auto bg-[var(--bg-primary)]/40 backdrop-blur-md border border-[var(--blue-border)]/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--blue-border)]"
        >
          <option value="" className="bg-[var(--bg-secondary)] text-white">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat} className="bg-[var(--bg-secondary)] text-white">
              {cat}
            </option>
          ))}
        </select>

        {/* Level Dropdown */}
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="w-full sm:w-auto bg-[var(--bg-primary)]/40 backdrop-blur-md border border-[var(--blue-border)]/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--blue-border)]"
        >
          <option value="" className="bg-[var(--bg-secondary)] text-white">All Levels</option>
          <option value="beginner" className="bg-[var(--bg-secondary)] text-white">Beginner</option>
          <option value="intermediate" className="bg-[var(--bg-secondary)] text-white">Intermediate</option>
          <option value="advanced" className="bg-[var(--bg-secondary)] text-white">Advanced</option>
        </select>
      </div>
    </div>
  )
}
