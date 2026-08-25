import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user || null
  } catch (e) {
    user = null
  }

  const url = request.nextUrl.clone()
  const isAuthRoute =
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/register') ||
    url.pathname.startsWith('/confirm') ||
    url.pathname.startsWith('/auth/callback') ||
    url.pathname.startsWith('/suspended')

  // Protect app routes (home, courses, dashboard, grades, assignments, discussions, profile, settings, admin)
  if (!user && !isAuthRoute && url.pathname !== '/') {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute && !url.pathname.startsWith('/auth/callback')) {
    url.pathname = '/home'
    return NextResponse.redirect(url)
  }

  // ─── Admin Route Server-Side Authorization ────────────────────────────────
  // Protect all /admin/** routes. This is the REAL security layer.
  // RoleGuard in the client is only UX — it cannot be relied upon for security.
  if (user && url.pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      // Non-admin user attempting to access an admin route
      url.pathname = '/home'
      return NextResponse.redirect(url)
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
