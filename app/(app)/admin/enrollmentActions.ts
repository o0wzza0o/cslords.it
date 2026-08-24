'use server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'

export async function runAutoEnrollmentAction() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: students } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'student')

  let totalCount = 0

  if (students) {
    for (const st of students) {
      const { data: res } = await (supabase.rpc as any)('admin_auto_enroll_student', { p_student_id: st.id })
      totalCount += Number(res || 0)
    }
  }

  return { success: true, totalProcessed: totalCount }
}

export async function deleteEnrollmentAction(enrollmentId: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('student_courses').delete().eq('id', enrollmentId)
  if (error) throw new Error(error.message)
  return { success: true }
}
