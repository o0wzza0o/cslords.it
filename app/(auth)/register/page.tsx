'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setIsLoading(true)

    if (!email.toLowerCase().trim().endsWith('@acu.edu.eg')) {
      setError('Registration is restricted to official ACU university emails ending with @acu.edu.eg (e.g., student@acu.edu.eg).')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'student',
          },
        },
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      if (data.session) {
        router.push('/home')
        router.refresh()
      } else {
        setIsLoading(false)
        setSuccessMsg('Account created successfully! If email confirmation is enabled in your Supabase project settings, please verify your email before logging in.')
      }
    } catch (err: any) {
      setError('An unexpected error occurred.')
      setIsLoading(false)
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
          Join <span className="glow-heading">Cs Lords</span>
        </h1>

      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-medium text-center">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-medium text-center">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-5">
        <Input
          label="Full Name"
          type="text"
          required
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <Input
          label="Email Address (@acu.edu.eg)"
          type="email"
          required
          placeholder="student@acu.edu.eg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          required
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />


        <Button type="submit" isLoading={isLoading} className="w-full">
          Create Account <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      <div className="mt-6 text-center border-t border-slate-700/60 pt-6">
        <p className="text-xs text-[var(--text-secondary)]">
          Already registered?{' '}
          <Link href="/login" className="text-[var(--blue-glow)] font-semibold hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
