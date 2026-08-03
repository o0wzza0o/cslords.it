'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react'

type Status = 'loading' | 'success' | 'error'

function ConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type') as 'signup' | 'email' | 'recovery' | 'invite' | null
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setErrorMsg(decodeURIComponent(errorParam))
      setStatus('error')
      return
    }

    if (!tokenHash || !type) {
      setErrorMsg('Invalid or missing confirmation link. Please request a new one.')
      setStatus('error')
      return
    }

    const supabase = createClient()
    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type })
      .then(({ error }) => {
        if (error) {
          setErrorMsg(error.message)
          setStatus('error')
        } else {
          setStatus('success')
          setTimeout(() => router.push('/home'), 1800)
        }
      })
  }, [searchParams, router])

  return (
    <div className="lms-card p-10 shadow-[0_0_40px_rgba(46,111,217,0.2)] flex flex-col items-center text-center gap-6">
      <img src="/logo.png" alt="Cs Lords Logo" className="w-14 h-14 object-contain drop-shadow-[0_0_15px_rgba(30,144,255,0.6)]" />

      {status === 'loading' && (
        <>
          <div className="relative flex items-center justify-center w-16 h-16">
            <span className="absolute inset-0 rounded-full border-2 border-[var(--blue-border)]/30" />
            <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--blue-glow)] animate-spin" />
            <span className="w-6 h-6 rounded-full bg-[var(--blue-glow)]/20 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-wide">Confirming your email...</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5">Please wait while we verify your account.</p>
          </div>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-wide">Email Confirmed!</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5">Your account is verified. Redirecting you now...</p>
          </div>
          <div className="w-full h-1 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full" style={{ animation: 'confirmProgress 1.8s linear forwards' }} />
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-wide">Confirmation Failed</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-xs mx-auto">
              {errorMsg || 'The link may have expired or already been used.'}
            </p>
          </div>
          <Button variant="secondary" onClick={() => router.push('/login')} className="w-full">
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Button>
        </>
      )}

      <style>{`@keyframes confirmProgress { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  )
}

function LoadingCard() {
  return (
    <div className="lms-card p-10 shadow-[0_0_40px_rgba(46,111,217,0.2)] flex flex-col items-center text-center gap-6">
      <img src="/logo.png" alt="Cs Lords Logo" className="w-14 h-14 object-contain drop-shadow-[0_0_15px_rgba(30,144,255,0.6)]" />
      <div className="relative flex items-center justify-center w-16 h-16">
        <span className="absolute inset-0 rounded-full border-2 border-[var(--blue-border)]/30" />
        <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--blue-glow)] animate-spin" />
        <span className="w-6 h-6 rounded-full bg-[var(--blue-glow)]/20 animate-pulse" />
      </div>
      <div>
        <h1 className="text-xl font-extrabold text-white tracking-wide">Confirming your email...</h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5">Please wait while we verify your account.</p>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <ConfirmContent />
    </Suspense>
  )
}
