'use server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'

// ─── Week Actions ──────────────────────────────────────────────────────────

interface WeekPayload {
  course_id: string
  title: string
  start_date: string | null
  end_date: string | null
  is_active: boolean
  order_index: number
}

export async function createWeekAction(payload: WeekPayload) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('course_weeks').insert(payload)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function updateWeekAction(weekId: string, payload: Partial<WeekPayload>) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('course_weeks').update(payload).eq('id', weekId)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function deleteWeekAction(weekId: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('course_weeks').delete().eq('id', weekId)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function reorderWeeksAction(
  weekAId: string, weekAOrderIndex: number,
  weekBId: string, weekBOrderIndex: number,
) {
  await requireAdmin()
  const supabase = await createClient()
  const [res1, res2] = await Promise.all([
    supabase.from('course_weeks').update({ order_index: weekAOrderIndex }).eq('id', weekAId),
    supabase.from('course_weeks').update({ order_index: weekBOrderIndex }).eq('id', weekBId),
  ])
  if (res1.error) throw new Error(res1.error.message)
  if (res2.error) throw new Error(res2.error.message)
  return { success: true }
}

// ─── Lesson Actions ────────────────────────────────────────────────────────

interface LessonPayload {
  course_id: string
  week_id: string | null
  component_type: 'lecture' | 'tutorial' | 'lab'
  title: string
  description: string
  content: string
  video_url: string
  order_index: number
}

export async function createLessonAction(payload: LessonPayload) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('lessons').insert(payload)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function updateLessonAction(lessonId: string, payload: Partial<LessonPayload>) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('lessons').update(payload).eq('id', lessonId)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function deleteLessonAction(lessonId: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('lessons').delete().eq('id', lessonId)
  if (error) throw new Error(error.message)
  return { success: true }
}

// ─── Assignment Actions ────────────────────────────────────────────────────

interface AssignmentPayload {
  course_id: string
  week_id: string | null
  component_type: 'lecture' | 'tutorial' | 'lab'
  title: string
  description: string
  due_date: string | null
  max_score: number
}

export async function createAssignmentAction(payload: AssignmentPayload) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('assignments').insert(payload)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function updateAssignmentAction(assignmentId: string, payload: Partial<AssignmentPayload>) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('assignments').update(payload).eq('id', assignmentId)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function deleteAssignmentAction(assignmentId: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('assignments').delete().eq('id', assignmentId)
  if (error) throw new Error(error.message)
  return { success: true }
}
