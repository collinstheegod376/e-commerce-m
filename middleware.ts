import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const PUBLIC_EXACT_PATHS = new Set([
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/auth/confirm',
  '/auth/confirmed',
  '/api/paystack/webhook',
  '/favicon.ico',
  '/favicon.png',
])

const PUBLIC_PREFIXES = [
  '/api/auth/',
  '/api/pages/',
  '/_next/',
  '/assets/',
  '/fonts/',
]

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true
  // Static file extensions served from public/
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|ico|glb|woff2?|css|js|map)$/i.test(pathname)) {
    return true
  }
  return false
}

function isAdminPath(pathname: string): boolean {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/api/admin' ||
    pathname.startsWith('/api/admin/')
  )
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Skip middleware overhead for static assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/fonts/') ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon.png'
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Allow webhook and public paths cleanly even if env vars are not set yet in local preview
  const isApi = pathname.startsWith('/api/')
  const publicRoute = isPublicPath(pathname)

  if (!supabaseUrl || !supabaseAnonKey) {
    if (publicRoute) return response
    if (isApi) {
      return NextResponse.json(
        { error: 'Supabase environment variables are not configured.', code: 'SERVER_MISCONFIGURED' },
        { status: 503 },
      )
    }
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // Refresh Supabase session cookie on every request
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (publicRoute) {
    return response
  }

  // HARD RULE: NO GUEST MODE — all non-public routes require authentication
  if (!user) {
    if (isApi) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.', code: 'UNAUTHORIZED' },
        { status: 401 },
      )
    }
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    const nextTarget = `${pathname}${search}`
    if (nextTarget && nextTarget !== '/') {
      loginUrl.searchParams.set('next', nextTarget)
    }
    return NextResponse.redirect(loginUrl)
  }

  // Admin gate: /admin/* and /api/admin/* require role === 'admin'
  if (isAdminPath(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const isAdmin = profile?.role === 'admin'
    if (!isAdmin) {
      if (isApi) {
        return NextResponse.json(
          { error: 'Admin access required.', code: 'FORBIDDEN' },
          { status: 403 },
        )
      }
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = '/'
      homeUrl.search = ''
      return NextResponse.redirect(homeUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except Next.js internals & static image/media files.
     */
    '/((?!_next/static|_next/image|favicon.ico|favicon.png).*)',
  ],
}
