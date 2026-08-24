'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { academicYearLabel } from '@/lib/utils/academic'
import {
  createAcademicRuleAction,
  updateAcademicRuleAction,
  deleteAcademicRuleAction,
  reclassifyStudentsAction,
} from '@/app/(app)/admin/levelActions'
import {
  GraduationCap,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  Users,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Layers,
} from 'lucide-react'

interface Level {
  id: string
  name: string
  level_number: number
}

interface AcademicRule {
  id: string
  prefix: string
  level_id: string | null
  academic_year: number | null
  department: string | null
  semester: number | null
  is_enabled: boolean
  created_at: string
  matchingCount?: number
  level?: Level
}

interface ProfileUser {
  id: string
  email: string
  full_name: string | null
  student_id: string | null
  academic_year: number | null
  department: string | null
}

export function AcademicRulesTab() {
  const [rules, setRules] = useState<AcademicRule[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [profiles, setProfiles] = useState<ProfileUser[]>([])
  const [filteredRules, setFilteredRules] = useState<AcademicRule[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AcademicRule | null>(null)
  const [prefixInput, setPrefixInput] = useState('')
  const [levelIdInput, setLevelIdInput] = useState('')
  const [semesterInput, setSemesterInput] = useState<number>(1)
  const [isEnabledInput, setIsEnabledInput] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // View Matching Students Modal
  const [selectedRuleForStudents, setSelectedRuleForStudents] = useState<AcademicRule | null>(null)

  // Reclassify state
  const [isReclassifying, setIsReclassifying] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setFormError(null)

    const [rulesRes, levelsRes, profilesRes] = await Promise.all([
      supabase.from('academic_rules').select('*, level:levels(*)').order('prefix', { ascending: true }),
      supabase.from('levels').select('*').order('level_number', { ascending: true }),
      supabase.from('profiles').select('id, email, full_name, student_id, academic_year, department'),
    ])

    const fetchedRules: AcademicRule[] = (rulesRes.data as any) || []
    const fetchedLevels: Level[] = levelsRes.data || []
    const fetchedProfiles: ProfileUser[] = profilesRes.data || []

    const formatted = fetchedRules.map((rule) => {
      const count = fetchedProfiles.filter(
        (p) => p.student_id && p.student_id.startsWith(rule.prefix)
      ).length
      return { ...rule, matchingCount: count }
    })

    setRules(formatted)
    setFilteredRules(formatted)
    setLevels(fetchedLevels)
    setProfiles(fetchedProfiles)

    if (fetchedLevels.length > 0 && !levelIdInput) {
      setLevelIdInput(fetchedLevels[0].id)
    }
    setLoading(false)
  }

  // Filter effect
  useEffect(() => {
    let result = rules

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) => r.prefix.toLowerCase().includes(q))
    }

    if (filterYear) {
      result = result.filter(
        (r) => (r.level?.level_number || r.academic_year) === Number(filterYear)
      )
    }

    if (filterStatus) {
      const enabled = filterStatus === 'active'
      result = result.filter((r) => r.is_enabled === enabled)
    }

    setFilteredRules(result)
  }, [search, filterYear, filterStatus, rules])

  const openCreateModal = () => {
    setEditingRule(null)
    setPrefixInput('')
    setSemesterInput(1)
    setIsEnabledInput(true)
    if (levels.length > 0) setLevelIdInput(levels[0].id)
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (rule: AcademicRule) => {
    setEditingRule(rule)
    setPrefixInput(rule.prefix)
    setLevelIdInput(rule.level_id || (levels.length > 0 ? levels[0].id : ''))
    setSemesterInput(rule.semester || 1)
    setIsEnabledInput(rule.is_enabled)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prefixInput.trim()) {
      setFormError('Prefix is required (e.g., 42510)')
      return
    }

    setSubmitting(true)
    setFormError(null)

    const selectedLevel = levels.find((l) => l.id === levelIdInput)
    const academicYearNum = selectedLevel ? selectedLevel.level_number : 1

    const payload = {
      prefix: prefixInput.trim(),
      level_id: levelIdInput || null,
      academic_year: academicYearNum,
      semester: Number(semesterInput),
      is_enabled: isEnabledInput,
      updated_at: new Date().toISOString(),
    }

    try {
      if (editingRule) {
        await updateAcademicRuleAction(editingRule.id, payload)
      } else {
        await createAcademicRuleAction(payload)
      }
      setIsModalOpen(false)
      showToast('success', editingRule ? 'Rule updated successfully!' : 'Rule created successfully!')
      loadData()
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRule = async (id: string, prefix: string) => {
    if (!confirm(`Are you sure you want to delete rule for prefix ${prefix}?`)) return
    try {
      await deleteAcademicRuleAction(id)
      showToast('success', `Rule for prefix ${prefix} deleted.`)
      loadData()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete rule.')
    }
  }

  const handleToggleRuleStatus = async (rule: AcademicRule) => {
    const nextStatus = !rule.is_enabled
    try {
      await updateAcademicRuleAction(rule.id, { is_enabled: nextStatus, updated_at: new Date().toISOString() })
      showToast('success', `Rule prefix ${rule.prefix} ${nextStatus ? 'enabled' : 'disabled'}.`)
      loadData()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to toggle rule.')
    }
  }

  const handleReclassifyAll = async () => {
    if (!confirm('Re-classify all registered student profiles against current enabled academic rules?')) return
    setIsReclassifying(true)

    try {
      const activeRules = rules.filter((r) => r.is_enabled)

      // Build the classification updates client-side (read-only)
      // The actual profile updates and RPC calls happen server-side
      const updates: Array<{
        studentId: string
        studentDbId: string
        levelId: string | null
        academicYear: number | null
      }> = []

      for (const p of profiles) {
        if (!p.email || !p.email.includes('@acu.edu.eg')) continue
        let extractedId = p.student_id
        if (!extractedId) {
          const localPart = p.email.split('@')[0]
          extractedId = localPart.split('.')[0]
        }
        if (!extractedId) continue

        const matched = activeRules
          .filter((r) => extractedId!.startsWith(r.prefix))
          .sort((a, b) => b.prefix.length - a.prefix.length)[0]

        if (matched) {
          updates.push({
            studentId: extractedId,
            studentDbId: p.id,
            levelId: matched.level_id,
            academicYear: matched.level?.level_number || matched.academic_year,
          })
        }
      }

      await reclassifyStudentsAction(updates)
      showToast('success', 'All student profiles re-classified successfully!')
      loadData()
    } catch (err: any) {
      showToast('error', err.message || 'Re-classification failed.')
    } finally {
      setIsReclassifying(false)
    }
  }

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg(null), 4000)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[var(--blue-glow)]" /> ID Mapping <span className="glow-heading">Rules</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Map student ID prefixes to Academic Levels automatically.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            variant="secondary"
            onClick={handleReclassifyAll}
            isLoading={isReclassifying}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-classify All Students
          </Button>
          <Button onClick={openCreateModal} className="text-xs">
            <PlusCircle className="w-4 h-4" /> Add Academic Rule
          </Button>
        </div>
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

      {/* Filters Bar */}
      <div className="lms-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by prefix (e.g. 42510)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-primary)]/40 backdrop-blur-md border border-[var(--blue-border)]/40 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-[var(--text-secondary)]/60 focus:outline-none focus:border-[var(--blue-border)]"
          />
        </div>

        <div className="flex w-full md:w-auto gap-3 items-center">
          <Filter className="w-4 h-4 text-[var(--blue-icon)] shrink-0 hidden sm:block" />

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="bg-[var(--bg-primary)]/40 backdrop-blur-md border border-[var(--blue-border)]/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--blue-border)]"
          >
            <option value="" className="bg-[var(--bg-secondary)]">All Levels</option>
            {levels.map((l) => (
              <option key={l.id} value={l.level_number} className="bg-[var(--bg-secondary)]">
                {l.name} (Level {l.level_number})
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[var(--bg-primary)]/40 backdrop-blur-md border border-[var(--blue-border)]/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--blue-border)]"
          >
            <option value="" className="bg-[var(--bg-secondary)]">All Statuses</option>
            <option value="active" className="bg-[var(--bg-secondary)]">Active Only</option>
            <option value="disabled" className="bg-[var(--bg-secondary)]">Disabled Only</option>
          </select>
        </div>
      </div>

      {/* Rules Table */}
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="lms-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[var(--bg-primary)]/70 backdrop-blur-md text-[var(--blue-glow)] uppercase font-semibold border-b border-[var(--blue-border)]/40">
                <tr>
                  <th className="p-4">Prefix</th>
                  <th className="p-4">Assigned Academic Level</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Matching Students</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No academic rules configured yet. Click "Add Academic Rule" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-mono font-bold text-white text-sm">
                        {rule.prefix}
                      </td>
                      <td className="p-4">
                        <Badge variant="blue">
                          <Layers className="w-3 h-3 mr-1 inline" />
                          {rule.level?.name || academicYearLabel(rule.academic_year)}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleRuleStatus(rule)}
                          className="inline-flex items-center gap-1 text-xs font-semibold focus:outline-none"
                        >
                          {rule.is_enabled ? (
                            <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              <ToggleRight className="w-4 h-4 text-emerald-400" /> Active
                            </span>
                          ) : (
                            <span className="text-slate-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                              <ToggleLeft className="w-4 h-4 text-slate-500" /> Disabled
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setSelectedRuleForStudents(rule)}
                          className="text-xs font-semibold text-[var(--blue-glow)] hover:underline inline-flex items-center gap-1"
                        >
                          <Users className="w-3.5 h-3.5" /> {rule.matchingCount || 0} Students
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(rule)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                            title="Edit Rule"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id, rule.prefix)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20 transition"
                            title="Delete Rule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Rule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRule ? `Edit Academic Rule (${editingRule.prefix})` : 'Create Academic Rule'}
      >
        <form onSubmit={handleSaveRule} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-medium">
              {formError}
            </div>
          )}

          <Input
            label="Student ID Prefix (e.g. 42510)"
            required
            placeholder="e.g. 42510"
            value={prefixInput}
            onChange={(e) => setPrefixInput(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Assign Academic Level
            </label>
            <select
              value={levelIdInput}
              onChange={(e) => setLevelIdInput(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[var(--blue-border)]"
            >
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} (Level {l.level_number})
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[var(--bg-primary)]/40 border border-[var(--blue-border)]/40 cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabledInput}
              onChange={(e) => setIsEnabledInput(e.target.checked)}
              className="w-4 h-4 accent-[var(--red-action)]"
            />
            <span className="text-xs font-semibold text-white">Enable Rule Immediately</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              {editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Matching Students Modal */}
      <Modal
        isOpen={!!selectedRuleForStudents}
        onClose={() => setSelectedRuleForStudents(null)}
        title={`Matching Students for Prefix ${selectedRuleForStudents?.prefix}`}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {(() => {
            const matchedList = profiles.filter(
              (p) => p.student_id && p.student_id.startsWith(selectedRuleForStudents?.prefix || '')
            )

            if (matchedList.length === 0) {
              return (
                <div className="p-6 text-center text-xs text-slate-400">
                  No registered students match prefix <strong>{selectedRuleForStudents?.prefix}</strong>.
                </div>
              )
            }

            return (
              <div className="divide-y divide-slate-800/80">
                {matchedList.map((st) => (
                  <div key={st.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-white">{st.full_name || 'Student'}</p>
                      <p className="text-[10px] text-slate-400">{st.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="blue">ID: {st.student_id}</Badge>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {academicYearLabel(st.academic_year)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      </Modal>
    </div>
  )
}
