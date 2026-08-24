'use server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'
import {
  AnnouncementCategory,
  AnnouncementPriority,
  AnnouncementStatus,
} from '@/types/database.types'

interface AnnouncementPayload {
  title: string
  content: string
  category: AnnouncementCategory
  priority: AnnouncementPriority
  status: AnnouncementStatus
  image_url: string | null
  external_url: string | null
  pinned: boolean
  published_date: string | null
}

export async function createAnnouncementAction(payload: AnnouncementPayload) {
  const { userId } = await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('announcements').insert({ ...payload, author_id: userId })
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function updateAnnouncementAction(
  announcementId: string,
  payload: Partial<AnnouncementPayload>
) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('announcements').update(payload).eq('id', announcementId)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function deleteAnnouncementAction(announcementId: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('announcements').delete().eq('id', announcementId)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function toggleAnnouncementPinAction(announcementId: string, pinned: boolean) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('announcements').update({ pinned }).eq('id', announcementId)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function toggleAnnouncementPublishAction(
  announcementId: string,
  newStatus: AnnouncementStatus,
  publishedDate: string | null
) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('announcements')
    .update({ status: newStatus, published_date: publishedDate })
    .eq('id', announcementId)
  if (error) throw new Error(error.message)
  return { success: true }
}
