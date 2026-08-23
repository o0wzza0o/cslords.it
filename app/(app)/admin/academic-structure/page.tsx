'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { AcademicLevelsTab } from '@/components/admin/AcademicLevelsTab'
import { AcademicRulesTab } from '@/components/admin/AcademicRulesTab'
import {
  ArrowLeft,
  GraduationCap,
  Layers,
  Settings
} from 'lucide-react'

export default function AcademicStructurePage() {
  const [activeTab, setActiveTab] = useState<'levels' | 'rules'>('levels')

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-6 animate-fadeIn">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[var(--blue-glow)] transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admin Console
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide flex items-center gap-2">
              <Settings className="w-8 h-8 text-[var(--blue-glow)]" /> Academic <span className="glow-heading">Structure</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Manage university academic levels and their corresponding student ID rules.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/60 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('levels')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === 'levels'
                ? 'text-[var(--blue-glow)] border-b-2 border-[var(--blue-glow)] bg-[var(--bg-primary)]/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-4 h-4" /> Academic Levels
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === 'rules'
                ? 'text-[var(--blue-glow)] border-b-2 border-[var(--blue-glow)] bg-[var(--bg-primary)]/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> ID Mapping Rules
          </button>
        </div>

        {/* Tab Content */}
        <div className="pt-2">
          {activeTab === 'levels' && <AcademicLevelsTab />}
          {activeTab === 'rules' && <AcademicRulesTab />}
        </div>
      </div>
    </RoleGuard>
  )
}
