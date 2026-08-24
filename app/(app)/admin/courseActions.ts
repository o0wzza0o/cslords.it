'use server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'
import { CourseLevel } from '@/types/database.types'

interface CoursePayload {
  title: string
  code: string | null
  description: string | null
  semester_id: string | null
  doctor_id: string | null
  teacher_id: string | null
  category: string | null
  level: CourseLevel
  image_url: string | null
  thumbnail_url: string | null
  is_active: boolean
  has_tutorial: boolean
  has_lab: boolean
}

export async function createCourseAction(payload: CoursePayload) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('courses').insert(payload)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function updateCourseAction(courseId: string, payload: Partial<CoursePayload>) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('courses').update(payload).eq('id', courseId)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function deleteCourseAction(courseId: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('courses').delete().eq('id', courseId)
  if (error) throw new Error(error.message)
  return { success: true }
}
