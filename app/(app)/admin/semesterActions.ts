'use server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'
import { EnrollmentMode } from '@/types/database.types'

interface SemesterPayload {
  level_id: string
  name: string
  semester_number: number
  enrollment_mode: EnrollmentMode
}

export async function createSemesterAction(payload: SemesterPayload) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('semesters').insert(payload)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function updateSemesterAction(semesterId: string, payload: Partial<SemesterPayload>) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('semesters').update(payload).eq('id', semesterId)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function toggleSemesterModeAction(semesterId: string, newMode: EnrollmentMode) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('semesters')
    .update({ enrollment_mode: newMode })
    .eq('id', semesterId)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function deleteSemesterAction(semesterId: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('semesters').delete().eq('id', semesterId)
  if (error) throw new Error(error.message)
  return { success: true }
}
