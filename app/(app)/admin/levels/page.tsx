'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Layers,
  PlusCircle,
  Edit2,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface Level {
  id: string
  name: string
  level_number: number
  created_at: string
  semesterCount?: number
}

export default function LevelsPage() {
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLevel, setEditingLevel] = useState<Level | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [numberInput, setNumberInput] = useState<number>(1)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadLevels()
  }, [])

  async function loadLevels() {
    setLoading(true)
    const { data: levelsData, error } = await supabase
      .from('levels')
      .select('*')
      .order('level_number', { ascending: true })

    if (levelsData) {
      // Fetch semesters count for each level
      const { data: sData } = await supabase.from('semesters').select('level_id')
      const countsMap = new Map<string, number>()
      if (sData) {
        sData.forEach((s) => {
          countsMap.set(s.level_id, (countsMap.get(s.level_id) || 0) + 1)
        })
      }

      const formatted = levelsData.map((l) => ({
        ...l,
        semesterCount: countsMap.get(l.id) || 0,
      }))
      setLevels(formatted)
    }
    setLoading(false)
  }

  const openCreateModal = () => {
    setEditingLevel(null)
    setNameInput('')
    setNumberInput(levels.length + 1)
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (lvl: Level) => {
    setEditingLevel(lvl)
    setNameInput(lvl.name)
    setNumberInput(lvl.level_number)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSaveLevel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameInput.trim()) {
      setFormError('Level name is required (e.g. First Year)')
      return
    }

    setSubmitting(true)
    setFormError(null)

    const payload = {
      name: nameInput.trim(),
      level_number: Number(numberInput),
    }

    let err: any = null

    if (editingLevel) {
      const { error } = await supabase.from('levels').update(payload).eq('id', editingLevel.id)
      err = error
    } else {
      const { error } = await supabase.from('levels').insert(payload)
      err = error
    }

    setSubmitting(false)

    if (err) {
      setFormError(err.message)
    } else {
      setIsModalOpen(false)
      showToast('success', editingLevel ? 'Level updated successfully!' : 'Level created successfully!')
      loadLevels()
    }
  }

  const handleDeleteLevel = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will cascade delete associated semesters.`)) return
    const { error } = await supabase.from('levels').delete().eq('id', id)
    if (error) {
      showToast('error', error.message)
    } else {
      showToast('success', `${name} deleted.`)
      loadLevels()
    }
  }

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg(null), 4000)
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-6 animate-fadeIn">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[var(--blue-glow)] transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admin Console
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide flex items-center gap-2">
              <Layers className="w-8 h-8 text-[var(--blue-glow)]" /> Academic <span className="glow-heading">Levels</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Configure university academic levels (e.g. First Year, Second Year, etc.).
            </p>
          </div>

          <Button onClick={openCreateModal} className="text-xs shrink-0">
            <PlusCircle className="w-4 h-4" /> Create Academic Level
          </Button>
        </div>

        {toastMsg && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 animate-fadeIn ${
              toastMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/10 border-red-500/40 text-red-400'
            }`}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            {toastMsg.text}
          </div>
        )}

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {levels.map((lvl) => (
              <div
                key={lvl.id}
                className="lms-card p-5 space-y-4 flex flex-col justify-between hover:border-[var(--blue-border)] transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="blue">Level {lvl.level_number}</Badge>
                    <span className="text-[10px] text-slate-400">
                      {lvl.semesterCount} Semesters
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-3">{lvl.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Student ID rule prefix matches map to this level.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => openEditModal(lvl)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                    title="Edit Level"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteLevel(lvl.id, lvl.name)}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20 transition"
                    title="Delete Level"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingLevel ? `Edit Level (${editingLevel.name})` : 'Create Academic Level'}
        >
          <form onSubmit={handleSaveLevel} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-medium">
                {formError}
              </div>
            )}

            <Input
              label="Level Name"
              required
              placeholder="e.g. First Year"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Level Number
              </label>
              <input
                type="number"
                min={1}
                max={10}
                required
                value={numberInput}
                onChange={(e) => setNumberInput(Number(e.target.value))}
                className="w-full bg-[var(--bg-primary)] border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[var(--blue-border)]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
              <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                {editingLevel ? 'Update Level' : 'Create Level'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </RoleGuard>
  )
}
