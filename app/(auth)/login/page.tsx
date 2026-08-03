'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Mail, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      router.push('/home')
      router.refresh()
    } catch (err: any) {
      setError('An unexpected error occurred.')
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address to reset password.')
      return
    }
    setIsResetting(true)
    setError(null)
    setResetMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`,
    })

    setIsResetting(false)
    if (error) {
      setError(error.message)
    } else {
      setResetMessage('Password reset link sent to your email.')
    }
  }

  return (
    <div className="lms-card p-8 shadow-[0_0_30px_rgba(46,111,217,0.2)]">
      <div className="text-center mb-8">
        <img
          src="/logo.png"
          alt="Cs Lords Logo"
          className="w-16 h-16 mx-auto object-contain drop-shadow-[0_0_15px_rgba(30,144,255,0.6)] mb-3"
        />
        <h1 className="text-2xl font-extrabold text-white tracking-wide">
          Welcome to <span className="glow-heading">Cs Lords</span>
        </h1>
        
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-medium text-center">
          {error}
        </div>
      )}

      {resetMessage && (
        <div className="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-medium text-center">
          {resetMessage}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <Input
          label="Email Address"
          type="email"
          required
          placeholder="student@acu.edu.eg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div>
          <Input
            label="Password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex justify-end mt-1.5">
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={isResetting}
              className="text-[11px] text-[var(--blue-glow)] hover:underline focus:outline-none"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full">
          Sign In <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      <div className="mt-6 text-center border-t border-slate-700/60 pt-6">
        <p className="text-xs text-[var(--text-secondary)]">
          Don't have an account?{' '}
          <Link href="/register" className="text-[var(--blue-glow)] font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
