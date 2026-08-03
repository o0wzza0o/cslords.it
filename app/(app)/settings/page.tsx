'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Lock, Bell, Moon, CheckCircle2 } from 'lucide-react'

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updating, setUpdating] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifyDiscussions, setNotifyDiscussions] = useState(true)
  
  const supabase = createClient()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)

    if (newPassword.length < 6) {
      setMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }

    setUpdating(true)
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    setUpdating(false)

    if (error) {
      setMsg({ type: 'error', text: error.message })
    } else {
      setMsg({ type: 'success', text: 'Password changed successfully!' })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
          Account <span className="glow-heading">Settings</span>
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Manage security preferences, notifications, and system settings.
        </p>
      </div>

      {/* Security / Password Section */}
      <div className="lms-card p-6 sm:p-8 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700/60 pb-3">
          <Lock className="w-5 h-5 text-[var(--blue-icon)]" /> Password & Security
        </h2>

        {msg && (
          <div
            className={`p-3 rounded-lg border text-xs font-medium ${
              msg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-red-500/10 border-red-500/40 text-red-400'
            }`}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            required
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <Input
            label="Confirm New Password"
            type="password"
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <div className="pt-2 flex justify-end">
            <Button type="submit" isLoading={updating} className="text-xs">
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* Notifications Preferences */}
      <div className="lms-card p-6 sm:p-8 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700/60 pb-3">
          <Bell className="w-5 h-5 text-[var(--blue-glow)]" /> Notification Preferences
        </h2>

        <div className="space-y-4 text-xs">
          <label className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-primary)]/40 border border-[var(--blue-border)]/40 cursor-pointer">
            <div>
              <p className="font-semibold text-white">Course Updates & Announcements</p>
              <p className="text-[var(--text-secondary)]">Receive real-time alerts when new lessons or assignments are published.</p>
            </div>
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
              className="w-4 h-4 accent-[var(--red-action)]"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-primary)]/40 border border-[var(--blue-border)]/40 cursor-pointer">
            <div>
              <p className="font-semibold text-white">Discussion Replies</p>
              <p className="text-[var(--text-secondary)]">Get notified when someone responds to your forum posts.</p>
            </div>
            <input
              type="checkbox"
              checked={notifyDiscussions}
              onChange={(e) => setNotifyDiscussions(e.target.checked)}
              className="w-4 h-4 accent-[var(--red-action)]"
            />
          </label>
        </div>
      </div>
    </div>
  )
}
