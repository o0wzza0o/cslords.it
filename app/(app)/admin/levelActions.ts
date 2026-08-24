'use server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'

interface LevelPayload {
  name: string
  level_number: number
}

export async function createLevelAction(payload: LevelPayload) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('levels').insert(payload)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function updateLevelAction(levelId: string, payload: Partial<LevelPayload>) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('levels').update(payload).eq('id', levelId)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function deleteLevelAction(levelId: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('levels').delete().eq('id', levelId)
  if (error) throw new Error(error.message)
  return { success: true }
}

interface AcademicRulePayload {
  prefix: string
  level_id: string | null
  academic_year: number
  semester: number
  is_enabled: boolean
  updated_at: string
}

export async function createAcademicRuleAction(payload: AcademicRulePayload) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('academic_rules').insert(payload)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function updateAcademicRuleAction(ruleId: string, payload: Partial<AcademicRulePayload>) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('academic_rules').update(payload).eq('id', ruleId)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function deleteAcademicRuleAction(ruleId: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('academic_rules').delete().eq('id', ruleId)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function reclassifyStudentsAction(updates: Array<{
  studentId: string
  studentDbId: string
  levelId: string | null
  academicYear: number | null
}>) {
  await requireAdmin()
  const supabase = await createClient()

  for (const update of updates) {
    await supabase
      .from('profiles')
      .update({
        student_id: update.studentId,
        level_id: update.levelId,
        academic_year: update.academicYear,
      })
      .eq('id', update.studentDbId)

    await (supabase.rpc as any)('admin_auto_enroll_student', { p_student_id: update.studentDbId })
  }

  return { success: true }
}
