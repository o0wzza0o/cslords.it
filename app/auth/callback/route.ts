import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase Auth Callback Route Handler
 *
 * Handles two Supabase confirmation flows:
 *
 * 1. token_hash  — email link confirmation (OTP-based, e.g. signup, magic link)
 *    URL shape: /auth/callback?token_hash=...&type=signup&next=/home
 *
 * 2. code        — PKCE OAuth / magic-link exchange
 *    URL shape: /auth/callback?code=...&next=/home
 *
 * After a successful session is created the user is redirected to `next`
 * (defaults to /home).  On failure they go to /login with an error param.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'signup' | 'email' | 'recovery' | 'invite' | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  // Build a mutable response so we can forward the session cookies
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // --- Flow 1: token_hash (email confirmation, magic link) ---
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })

    if (!error) {
      // Session created — redirect to intended destination
      return NextResponse.redirect(`${origin}${next}`)
    }

    const errorMsg = error?.message || 'Verification link expired or invalid'
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorMsg)}`
    )
  }

  // --- Flow 2: PKCE code exchange ---
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    const errorMsg = error?.message || 'Failed to exchange authorization code'
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorMsg)}`
    )
  }

  // No recognised params — back to login
  return NextResponse.redirect(`${origin}/login`)
}
