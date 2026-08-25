'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { User, Mail, Shield, Save, CheckCircle2, GraduationCap, IdCard } from 'lucide-react'
import { academicYearLabel } from '@/lib/utils/academic'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
        setFullName(data.full_name || '')
        setBio(data.bio || '')
        setAvatarUrl(data.avatar_url || '')
      }

      setLoading(false)
    }

    loadProfile()
  }, [supabase])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setSuccessMsg(null)

    // IMPORTANT: Note that `role` and classification fields are excluded from the update payload to enforce security
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        bio: bio,
        avatar_url: avatarUrl || null,
      })
      .eq('id', profile.id)

    setSaving(false)
    if (!error) {
      setSuccessMsg('Profile updated successfully!')
      setTimeout(() => setSuccessMsg(null), 3000)
    }
  }

  if (loading) {
    return (
      <div suppressHydrationWarning className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div suppressHydrationWarning className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
          Account <span className="glow-heading">Profile</span>
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Manage your personal details, biography, and public profile avatar.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--bg-secondary)] via-[var(--bg-primary)] to-[var(--red-action)]/20 p-6 sm:p-8 border border-[var(--blue-border)]/40 shadow-[0_0_20px_rgba(46,111,217,0.15)] space-y-6">
        <div className="relative z-10 space-y-6">
          {/* Header Avatar Display */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-700/60">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile Avatar"
                  className="w-16 h-16 rounded-full object-cover border-2 border-[var(--blue-border)] shadow-[0_0_15px_var(--blue-glow)]"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[var(--red-action)] to-[var(--blue-glow)] flex items-center justify-center font-extrabold text-white text-xl border-2 border-[var(--blue-border)] shadow-[0_0_15px_var(--blue-glow)]">
                  {fullName?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                </div>
              )}

              <div>
                <h2 className="text-lg font-bold text-white">{fullName || 'User'}</h2>
                <p className="text-xs text-slate-400">{profile?.email}</p>
                <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                  <Badge variant="red">{profile?.role}</Badge>
                  {profile?.student_id && (
                    <Badge variant="blue">ID: {profile.student_id}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Classification Info Badge */}
            {profile?.student_id && (
              <div className="p-3 rounded-xl bg-[var(--bg-primary)]/80 border border-[var(--blue-border)]/40 text-xs space-y-1 sm:text-right shrink-0">
                <div className="flex items-center sm:justify-end gap-1.5 font-bold text-[var(--blue-glow)]">
                  <GraduationCap className="w-4 h-4" /> Academic Classification
                </div>
                <p className="text-white font-semibold">
                  {academicYearLabel(profile.academic_year)}
                </p>
                <p className="text-[11px] text-slate-400">
                  {profile.department || 'Computer Science'} (Semester {profile.semester || 1})
                </p>
              </div>
            )}
          </div>

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {successMsg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Email Address (Read-only)
              </label>
              <input
                disabled
                value={profile?.email || ''}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Biography / Intro
              </label>
              <textarea
                rows={3}
                placeholder="Tell others about your learning goals or background..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-[var(--bg-primary)]/40 backdrop-blur-md border border-[var(--blue-border)]/40 rounded-lg p-3 text-xs text-white placeholder-[var(--text-secondary)]/60 focus:outline-none focus:border-[var(--blue-border)]"
              />
            </div>

            <Input
              label="Avatar Image URL"
              placeholder="https://images.unsplash.com/photo-..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />

            <div className="pt-4 border-t border-slate-700/60 flex justify-end">
              <Button type="submit" isLoading={saving} className="text-xs">
                <Save className="w-4 h-4" /> Save Profile Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Decorative Grid Lines */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#1e90ff_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none" />
      </div>
    </div>
  )
}
